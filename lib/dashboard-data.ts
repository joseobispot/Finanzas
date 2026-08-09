import type { SupabaseClient } from "@supabase/supabase-js";

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function mondayOf(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function lastNWeekStarts(n: number, from = new Date()) {
  const start = mondayOf(from);
  const weeks: Date[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(start);
    d.setDate(d.getDate() - i * 7);
    weeks.push(d);
  }
  return weeks;
}

export type CategorySlice = {
  categoryId: string;
  name: string;
  emoji: string | null;
  total: number;
  share: number;
};

export type RecentTransaction = {
  id: string;
  type: "expense" | "income";
  amount: number;
  description: string | null;
  occurredOn: string;
  categoryName: string;
  categoryEmoji: string | null;
};

export type GoalPreview = {
  id: string;
  name: string;
  emoji: string | null;
  progress: number;
};

export type DashboardData = {
  balance: number;
  balanceSpark: number[];
  income: { current: number; previous: number; spark: number[] };
  expense: { current: number; previous: number; spark: number[] };
  savings: { current: number; previous: number };
  categories: CategorySlice[];
  recent: RecentTransaction[];
  goals: GoalPreview[];
  goalsAvgProgress: number;
};

export async function getDashboardData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  householdId: string,
): Promise<DashboardData> {
  const now = new Date();
  const currentMonthStart = toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1));
  const prevMonthStart = toIsoDate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const weekStarts = lastNWeekStarts(10, now);
  const earliestWeek = toIsoDate(weekStarts[0]);

  await supabase.rpc("ensure_recurring_generated", {
    p_household_id: householdId,
    p_target_month: currentMonthStart,
  });

  const [
    { data: monthlyTotals },
    { data: categoryTotals },
    { data: categories },
    { data: recentRows },
    { data: goalAccounts },
    { data: balanceRow },
    { data: weeklyTotals },
  ] = await Promise.all([
    supabase
      .from("monthly_totals")
      .select("type, month, total")
      .eq("household_id", householdId)
      .in("month", [currentMonthStart, prevMonthStart]),
    supabase
      .from("monthly_category_totals")
      .select("category_id, total")
      .eq("household_id", householdId)
      .eq("type", "expense")
      .eq("month", currentMonthStart),
    supabase
      .from("categories")
      .select("id, name, emoji, type")
      .eq("household_id", householdId),
    supabase
      .from("transactions")
      .select("id, type, amount, description, occurred_on, categories(name, emoji)")
      .eq("household_id", householdId)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("savings_accounts")
      .select("id, name, emoji, goal_amount, savings_balances(balance)")
      .eq("household_id", householdId)
      .not("goal_amount", "is", null)
      .order("goal_date", { ascending: true, nullsFirst: false })
      .limit(3),
    supabase.from("household_balance").select("balance").eq("household_id", householdId).maybeSingle(),
    supabase
      .from("weekly_totals")
      .select("type, week, total")
      .eq("household_id", householdId)
      .gte("week", earliestWeek),
  ]);

  const income = { current: 0, previous: 0 };
  const expense = { current: 0, previous: 0 };
  for (const row of monthlyTotals ?? []) {
    const bucket = row.type === "income" ? income : expense;
    if (row.month === currentMonthStart) bucket.current += Number(row.total);
    else bucket.previous += Number(row.total);
  }

  const categoryById = new Map((categories ?? []).map((c) => [c.id, c]));
  const totalExpense = (categoryTotals ?? []).reduce((s, r) => s + Number(r.total), 0);
  const categorySlices: CategorySlice[] = (categoryTotals ?? [])
    .map((r) => {
      const cat = categoryById.get(r.category_id);
      return {
        categoryId: r.category_id,
        name: cat?.name ?? "Otros",
        emoji: cat?.emoji ?? null,
        total: Number(r.total),
        share: totalExpense > 0 ? Number(r.total) / totalExpense : 0,
      };
    })
    .sort((a, b) => b.total - a.total);

  const recent: RecentTransaction[] = (recentRows ?? []).map((r) => {
    // Supabase embeds a single related row as an object (typed as array by default types).
    const cat = Array.isArray(r.categories) ? r.categories[0] : r.categories;
    return {
      id: r.id,
      type: r.type,
      amount: Number(r.amount),
      description: r.description,
      occurredOn: r.occurred_on,
      categoryName: cat?.name ?? "Otros",
      categoryEmoji: cat?.emoji ?? null,
    };
  });

  const goals: GoalPreview[] = (goalAccounts ?? []).map((g) => {
    const balanceEntry = Array.isArray(g.savings_balances) ? g.savings_balances[0] : g.savings_balances;
    const balance = Number(balanceEntry?.balance ?? 0);
    const progress = g.goal_amount ? Math.min(1, balance / Number(g.goal_amount)) : 0;
    return { id: g.id, name: g.name, emoji: g.emoji, progress };
  });
  const goalsAvgProgress = goals.length
    ? goals.reduce((s, g) => s + g.progress, 0) / goals.length
    : 0;

  const weeklyMap = new Map<string, { income: number; expense: number }>();
  for (const w of weekStarts) weeklyMap.set(toIsoDate(w), { income: 0, expense: 0 });
  for (const row of weeklyTotals ?? []) {
    const bucket = weeklyMap.get(row.week);
    if (!bucket) continue;
    if (row.type === "income") bucket.income += Number(row.total);
    else bucket.expense += Number(row.total);
  }
  const weeklySeries = weekStarts.map((w) => weeklyMap.get(toIsoDate(w))!);

  const currentBalance = Number(balanceRow?.balance ?? 0);
  let running = currentBalance;
  const balanceSparkReversed = [running];
  for (let i = weeklySeries.length - 1; i >= 0; i--) {
    running -= weeklySeries[i].income - weeklySeries[i].expense;
    balanceSparkReversed.push(running);
  }
  const balanceSpark = balanceSparkReversed.reverse();

  return {
    balance: currentBalance,
    balanceSpark,
    income: { ...income, spark: weeklySeries.map((w) => w.income) },
    expense: { ...expense, spark: weeklySeries.map((w) => w.expense) },
    savings: {
      current: income.current - expense.current,
      previous: income.previous - expense.previous,
    },
    categories: categorySlices,
    recent,
    goals,
    goalsAvgProgress,
  };
}

export function percentDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}
