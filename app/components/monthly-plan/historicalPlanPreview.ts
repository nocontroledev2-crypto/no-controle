import {
  completeCategoriesForPlanning,
} from "./calculations";
import type {
  HistoricalExpenseReference,
} from "./historicalExpenseReference";
import type {
  MonthlyPlanPreviewData,
} from "./types";

type BuildHistoricalPlanPreviewParams = {
  year: number;
  month: number;
  reference: HistoricalExpenseReference;
};

export function buildHistoricalPlanPreview({
  year,
  month,
  reference,
}: BuildHistoricalPlanPreviewParams): MonthlyPlanPreviewData {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error(
      "Periodo mensal invalido."
    );
  }

  const referenceCategories =
    Object.entries(
      reference.averageByCategory
    ).map(([category, average]) => ({
      category,
      plannedAmount:
        Number.isFinite(average) &&
        average > 0
          ? Number(average.toFixed(2))
          : null,
      realizedAmount: 0,
      scheduledAmount: 0,
    }));

  return {
    year,
    month,
    status: "draft",
    spendingLimit: Number(
      reference.averageTotal.toFixed(2)
    ),
    realizedAmount: 0,
    scheduledAmount: 0,
    categories:
      completeCategoriesForPlanning(
        referenceCategories
      ),
  };
}
