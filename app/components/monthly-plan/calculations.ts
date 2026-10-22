import { MASTER_CATEGORIES } from "../../constants/categories";
import type {
  MonthlyPlanCategory,
  MonthlyPlanPreviewData,
} from "./types";

export type ConsumptionStatus =
  | "green"
  | "yellow"
  | "orange"
  | "red";

export function roundPercentage(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value);
}

export function calculatePercentage(
  value: number,
  reference: number
): number | null {
  if (
    !Number.isFinite(value) ||
    !Number.isFinite(reference) ||
    reference <= 0
  ) {
    return null;
  }

  return roundPercentage((value / reference) * 100);
}

export function getConsumptionStatus(
  percentage: number
): ConsumptionStatus {
  if (percentage <= 60) {
    return "green";
  }

  if (percentage <= 75) {
    return "yellow";
  }

  if (percentage <= 90) {
    return "orange";
  }

  return "red";
}

export function calculateMonthlyPlanSummary(
  data: MonthlyPlanPreviewData
) {
  const totalPlanned = data.categories.reduce(
    (total, item) =>
      total +
      (item.plannedAmount && item.plannedAmount > 0
        ? item.plannedAmount
        : 0),
    0
  );

  const balanceToday =
    data.spendingLimit - data.realizedAmount;

  const freeAfterScheduled =
    balanceToday - data.scheduledAmount;

  const undistributed =
    data.spendingLimit - totalPlanned;

  return {
    totalPlanned,
    balanceToday,
    freeAfterScheduled,
    undistributed,
    realizedPercentage: calculatePercentage(
      data.realizedAmount,
      data.spendingLimit
    ),
    distributedPercentage: calculatePercentage(
      totalPlanned,
      data.spendingLimit
    ),
  };
}

export function sortCategoriesByImpact(
  categories: MonthlyPlanCategory[]
): MonthlyPlanCategory[] {
  return [...categories].sort((a, b) => {
    if (b.realizedAmount !== a.realizedAmount) {
      return b.realizedAmount - a.realizedAmount;
    }

    if (b.scheduledAmount !== a.scheduledAmount) {
      return b.scheduledAmount - a.scheduledAmount;
    }

    const plannedA = a.plannedAmount ?? 0;
    const plannedB = b.plannedAmount ?? 0;

    if (plannedB !== plannedA) {
      return plannedB - plannedA;
    }

    const officialIndexA = MASTER_CATEGORIES.indexOf(a.category);
    const officialIndexB = MASTER_CATEGORIES.indexOf(b.category);

    if (officialIndexA !== -1 || officialIndexB !== -1) {
      if (officialIndexA === -1) {
        return 1;
      }

      if (officialIndexB === -1) {
        return -1;
      }

      return officialIndexA - officialIndexB;
    }

    return a.category.localeCompare(b.category, "pt-BR");
  });
}
