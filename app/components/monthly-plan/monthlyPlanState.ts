import {
  MASTER_CATEGORIES,
} from "../../constants/categories";
import type {
  MonthlyPlanPreviewData,
} from "./types";

export function getMonthlyPlanPeriodKey(
  year: number,
  month: number
) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function createEmptyMonthlyPlanData(
  year: number,
  month: number
): MonthlyPlanPreviewData {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error("Periodo mensal invalido.");
  }

  return {
    year,
    month,
    status: "draft",
    spendingLimit: 0,
    realizedAmount: 0,
    scheduledAmount: 0,
    categories: MASTER_CATEGORIES.map(
      (category) => ({
        category,
        plannedAmount: null,
        realizedAmount: 0,
        scheduledAmount: 0,
      })
    ),
  };
}
