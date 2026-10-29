import type { Expense } from "../../storage/expenseStorage";
import { completeCategoriesForPlanning } from "./calculations";
import type { MonthlyPlanCategory } from "./types";

type AggregateMonthlyPlanExpensesParams = {
  expenses: Expense[];
  year: number;
  month: number;
  today: Date;
  categories: MonthlyPlanCategory[];
};

type MonthlyPlanExpenseAggregation = {
  realizedAmount: number;
  scheduledAmount: number;
  categories: MonthlyPlanCategory[];
};

function parseExpenseDate(dateValue: string): Date | null {
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
    !Number.isInteger(day)
  ) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  parsed.setHours(0, 0, 0, 0);

  return parsed;
}

export function aggregateMonthlyPlanExpenses({
  expenses,
  year,
  month,
  today,
  categories,
}: AggregateMonthlyPlanExpensesParams): MonthlyPlanExpenseAggregation {
  const realizedByCategory: Record<string, number> = {};
  const scheduledByCategory: Record<string, number> = {};

  let realizedAmount = 0;
  let scheduledAmount = 0;

  const todayReference = new Date(today);
  todayReference.setHours(0, 0, 0, 0);

  expenses.forEach((expense) => {
    const expenseDate = parseExpenseDate(expense.data);
    const value = Number(expense.valor);

    if (
      !expenseDate ||
      !Number.isFinite(value) ||
      value <= 0 ||
      expenseDate.getFullYear() !== year ||
      expenseDate.getMonth() !== month - 1
    ) {
      return;
    }

    const category =
      expense.categoria?.trim() || "Outros";

    if (expenseDate > todayReference) {
      scheduledAmount += value;
      scheduledByCategory[category] =
        (scheduledByCategory[category] || 0) + value;
      return;
    }

    realizedAmount += value;
    realizedByCategory[category] =
      (realizedByCategory[category] || 0) + value;
  });

  const existingCategories =
    completeCategoriesForPlanning(categories);

  const categoryNames = new Set([
    ...existingCategories.map((item) => item.category),
    ...Object.keys(realizedByCategory),
    ...Object.keys(scheduledByCategory),
  ]);

  const categoriesWithExpenses =
    Array.from(categoryNames).map((category) => {
      const existing = existingCategories.find(
        (item) => item.category === category
      );

      return {
        category,
        plannedAmount: existing?.plannedAmount ?? null,
        realizedAmount: realizedByCategory[category] || 0,
        scheduledAmount: scheduledByCategory[category] || 0,
      };
    });

  return {
    realizedAmount: Number(realizedAmount.toFixed(2)),
    scheduledAmount: Number(scheduledAmount.toFixed(2)),
    categories: categoriesWithExpenses,
  };
}
