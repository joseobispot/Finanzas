export type ScheduleRow = {
  installment: number;
  dueDate: string;
  payment: number;
  interest: number;
  principalPortion: number;
  remainingBalance: number;
};

/** Sistema francés de amortización (cuota fija). Se calcula on-the-fly, nunca se persiste. */
export function computeAmortizationSchedule(
  principal: number,
  annualRatePct: number,
  termMonths: number,
  startDate: Date,
): ScheduleRow[] {
  const i = annualRatePct / 100 / 12;
  const payment =
    i === 0 ? principal / termMonths : (principal * i) / (1 - Math.pow(1 + i, -termMonths));

  let balance = principal;
  const rows: ScheduleRow[] = [];

  for (let k = 1; k <= termMonths; k++) {
    const interest = balance * i;
    const principalPortion = payment - interest;
    balance = Math.max(0, balance - principalPortion);

    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + k);

    rows.push({
      installment: k,
      dueDate: dueDate.toISOString().slice(0, 10),
      payment,
      interest,
      principalPortion,
      remainingBalance: balance,
    });
  }

  return rows;
}

export function totalScheduledPayments(schedule: ScheduleRow[]): number {
  return schedule.reduce((sum, row) => sum + row.payment, 0);
}
