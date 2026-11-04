import type {
  MonthlyPlanPeriod,
} from "./periodNavigation";

export type MonthlyPlanPeriodRelation =
  | "past"
  | "current"
  | "future";

function getPeriodIndex(
  period: MonthlyPlanPeriod
) {
  if (
    !Number.isInteger(period.year) ||
    !Number.isInteger(period.month) ||
    period.month < 1 ||
    period.month > 12
  ) {
    throw new Error("Periodo mensal invalido.");
  }

  return period.year * 12 + period.month - 1;
}

export function getMonthlyPlanPeriodRelation(
  selectedPeriod: MonthlyPlanPeriod,
  currentPeriod: MonthlyPlanPeriod
): MonthlyPlanPeriodRelation {
  const selectedIndex =
    getPeriodIndex(selectedPeriod);

  const currentIndex =
    getPeriodIndex(currentPeriod);

  if (selectedIndex < currentIndex) {
    return "past";
  }

  if (selectedIndex > currentIndex) {
    return "future";
  }

  return "current";
}
