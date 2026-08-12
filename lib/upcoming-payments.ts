import type { SupabaseClient } from "@supabase/supabase-js";
import { computeAmortizationSchedule } from "@/lib/amortization";

export type UpcomingPayment = {
  id: string;
  label: string;
  emoji: string | null;
  amount: number;
  dueDate: string;
  kind: "recurring" | "loan" | "credit";
};

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function dateWithDay(year: number, month: number, day: number) {
  return new Date(year, month, Math.min(day, daysInMonth(year, month)));
}

/** Ocurrencia de `day` más reciente que sea <= referencia. */
function mostRecentOnOrBefore(day: number, reference: Date): Date {
  let year = reference.getFullYear();
  let month = reference.getMonth();
  let candidate = dateWithDay(year, month, day);
  if (candidate > reference) {
    month -= 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
    candidate = dateWithDay(year, month, day);
  }
  return candidate;
}

/** Ocurrencia de `day` más próxima que sea estrictamente posterior a `after`. */
function firstOccurrenceAfter(day: number, after: Date): Date {
  let year = after.getFullYear();
  let month = after.getMonth();
  let candidate = dateWithDay(year, month, day);
  if (candidate <= after) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
    candidate = dateWithDay(year, month, day);
  }
  return candidate;
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

  const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1).toISOString().slice(0, 10);

  const [{ data: rules }, { data: loans }, { data: loanPayments }, { data: creditCards }, { data: cardCharges }] =
    await Promise.all([
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
      supabase
        .from("payment_methods")
        .select("id, name, statement_day, payment_day")
        .eq("household_id", householdId)
        .eq("kind", "credit"),
      supabase
        .from("transactions")
        .select("payment_method_id, amount, occurred_on")
        .eq("household_id", householdId)
        .eq("type", "expense")
        .not("payment_method_id", "is", null)
        .gte("occurred_on", threeMonthsAgo),
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

  const chargesByCard = new Map<string, { amount: number; date: string }[]>();
  for (const c of cardCharges ?? []) {
    if (!c.payment_method_id) continue;
    const list = chargesByCard.get(c.payment_method_id) ?? [];
    list.push({ amount: Number(c.amount), date: c.occurred_on });
    chargesByCard.set(c.payment_method_id, list);
  }

  for (const card of creditCards ?? []) {
    if (!card.statement_day || !card.payment_day) continue;
    const lastCutoff = mostRecentOnOrBefore(card.statement_day, today);
    const prevCutoff = new Date(lastCutoff.getFullYear(), lastCutoff.getMonth() - 1, lastCutoff.getDate());
    const nextPaymentDate = firstOccurrenceAfter(card.payment_day, lastCutoff);

    const charges = chargesByCard.get(card.id) ?? [];
    const amount = charges
      .filter((c) => {
        const d = new Date(`${c.date}T00:00:00`);
        return d > prevCutoff && d <= lastCutoff;
      })
      .reduce((sum, c) => sum + c.amount, 0);

    if (amount <= 0) continue;
    payments.push({
      id: `credit-${card.id}`,
      label: card.name,
      emoji: "💳",
      amount,
      dueDate: nextPaymentDate.toISOString().slice(0, 10),
      kind: "credit",
    });
  }

  return payments.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
