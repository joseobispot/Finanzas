import type { SupabaseClient } from "@supabase/supabase-js";
import { computeAmortizationSchedule } from "@/lib/amortization";

export type UpcomingPayment = {
  id: string;
  label: string;
  emoji: string | null;
  amount: number;
  dueDate: string;
  kind: "recurring" | "loan";
};

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function nextOccurrence(
  dayOfMonth: number,
  startDate: Date,
  endDate: Date | null,
  today: Date,
): Date | null {
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let year = todayMidnight.getFullYear();
  let month = todayMidnight.getMonth();
  let candidate = new Date(year, month, Math.min(dayOfMonth, daysInMonth(year, month)));

  if (candidate < todayMidnight) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
    candidate = new Date(year, month, Math.min(dayOfMonth, daysInMonth(year, month)));
  }

  const candidateMonthStart = new Date(candidate.getFullYear(), candidate.getMonth(), 1);
  const startMonthStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  if (candidateMonthStart < startMonthStart) return null;

  if (endDate) {
    const endMonthStart = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    if (candidateMonthStart > endMonthStart) return null;
  }

  return candidate;
}

export async function getUpcomingPayments(
  supabase: SupabaseClient,
  householdId: string,
): Promise<UpcomingPayment[]> {
  const today = new Date();

  const [{ data: rules }, { data: loans }, { data: loanPayments }] = await Promise.all([
    supabase
      .from("recurring_rules")
      .select("id, type, amount, description, day_of_month, start_date, end_date, active, categories(name, emoji)")
      .eq("household_id", householdId)
      .eq("active", true)
      .eq("type", "expense"),
    supabase
      .from("loans")
      .select("id, name, principal, annual_interest_rate, term_months, start_date")
      .eq("household_id", householdId),
    supabase.from("loan_payments").select("loan_id, amount").eq("household_id", householdId),
  ]);

  const payments: UpcomingPayment[] = [];

  for (const rule of rules ?? []) {
    const due = nextOccurrence(
      rule.day_of_month,
      new Date(`${rule.start_date}T00:00:00`),
      rule.end_date ? new Date(`${rule.end_date}T00:00:00`) : null,
      today,
    );
    if (!due) continue;
    const cat = Array.isArray(rule.categories) ? rule.categories[0] : rule.categories;
    payments.push({
      id: `recurring-${rule.id}`,
      label: rule.description || cat?.name || "Pago recurrente",
      emoji: cat?.emoji ?? null,
      amount: Number(rule.amount),
      dueDate: due.toISOString().slice(0, 10),
      kind: "recurring",
    });
  }

  const paidByLoan = new Map<string, number>();
  for (const p of loanPayments ?? []) {
    paidByLoan.set(p.loan_id, (paidByLoan.get(p.loan_id) ?? 0) + Number(p.amount));
  }

  for (const loan of loans ?? []) {
    const schedule = computeAmortizationSchedule(
      Number(loan.principal),
      Number(loan.annual_interest_rate),
      loan.term_months,
      new Date(`${loan.start_date}T00:00:00`),
    );
    const paid = paidByLoan.get(loan.id) ?? 0;
    const next = schedule.find((row) => row.installment * row.payment > paid + 0.01);
    if (!next) continue;
    payments.push({
      id: `loan-${loan.id}`,
      label: loan.name,
      emoji: "🏦",
      amount: next.payment,
      dueDate: next.dueDate,
      kind: "loan",
    });
  }

  return payments.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
