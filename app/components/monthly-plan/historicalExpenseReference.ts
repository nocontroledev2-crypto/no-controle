import type {
  Expense,
} from "../../storage/expenseStorage";
import {
  shiftMonthlyPlanPeriod,
  type MonthlyPlanPeriod,
} from "./periodNavigation";

export type HistoricalExpenseReference = {
  months: number;
  periods: MonthlyPlanPeriod[];
  averageTotal: number;
  averageByCategory: Record<string, number>;
};

type BuildHistoricalExpenseReferenceParams = {
  expenses: Expense[];
  targetPeriod: MonthlyPlanPeriod;
  months: number;
};

function getExpensePeriod(
  dateValue: string
): MonthlyPlanPeriod | null {
  const parts = dateValue.split("-");

  if (parts.length !== 3) {
    return null;
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  const parsed = new Date(
    year,
    month - 1,
    day
  );

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return {
    year,
    month,
  };
}

function getPeriodKey(
  period: MonthlyPlanPeriod
) {
  return `${period.year}-${String(
    period.month
  ).padStart(2, "0")}`;
}

export function buildHistoricalExpenseReference({
  expenses,
  targetPeriod,
  months,
}: BuildHistoricalExpenseReferenceParams): HistoricalExpenseReference {
  if (
    !Number.isInteger(months) ||
    ![3, 6, 9, 12].includes(months)
  ) {
    throw new Error(
      "Janela historica invalida."
    );
  }

  const periods = Array.from(
    { length: months },
    (_, index) =>
      shiftMonthlyPlanPeriod(
        targetPeriod,
        -(months - index)
      )
  );

  const periodKeys = new Set(
    periods.map(getPeriodKey)
  );

  const totalsByCategory:
    Record<string, number> = {};

  let total = 0;

  expenses.forEach((expense) => {
    const period =
      getExpensePeriod(expense.data);

    const value = Number(expense.valor);

    if (
      !period ||
      !periodKeys.has(getPeriodKey(period)) ||
      !Number.isFinite(value) ||
      value <= 0
    ) {
      return;
    }

    const category =
      expense.categoria?.trim() || "Outros";

    totalsByCategory[category] =
      (totalsByCategory[category] || 0) +
      value;

    total += value;
  });

  const averageByCategory =
    Object.fromEntries(
      Object.entries(totalsByCategory).map(
        ([category, categoryTotal]) => [
          category,
          Number(
            (categoryTotal / months).toFixed(2)
          ),
        ]
      )
    );

  return {
    months,
    periods,
    averageTotal: Number(
      (total / months).toFixed(2)
    ),
    averageByCategory,
  };
}
