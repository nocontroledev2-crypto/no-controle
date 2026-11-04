export type MonthlyPlanPeriod = {
  year: number;
  month: number;
};

export function shiftMonthlyPlanPeriod(
  period: MonthlyPlanPeriod,
  offset: number
): MonthlyPlanPeriod {
  if (
    !Number.isInteger(period.year) ||
    !Number.isInteger(period.month) ||
    period.month < 1 ||
    period.month > 12
  ) {
    throw new Error("Periodo mensal invalido.");
  }

  if (!Number.isInteger(offset)) {
    throw new Error("Deslocamento mensal invalido.");
  }

  const shiftedDate = new Date(
    period.year,
    period.month - 1 + offset,
    1
  );

  return {
    year: shiftedDate.getFullYear(),
    month: shiftedDate.getMonth() + 1,
  };
}
