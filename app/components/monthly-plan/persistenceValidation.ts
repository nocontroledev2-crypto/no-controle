import { MASTER_CATEGORIES } from "../../constants/categories";
import type {
  MonthlyPlanGoalInput,
  MonthlyPlanSaveInput,
} from "./persistenceTypes";
import type { MonthlyPlanStatus } from "./types";

const MIN_PLAN_YEAR = 2000;
const MAX_PLAN_YEAR = 2100;

function isValidStatus(
  status: unknown
): status is MonthlyPlanStatus {
  return status === "draft" || status === "active";
}

function normalizeGoal(
  value: MonthlyPlanGoalInput
): MonthlyPlanGoalInput | null {
  const category = value.category.trim();
  const plannedAmount = Number(value.plannedAmount);

  if (!MASTER_CATEGORIES.includes(category)) {
    throw new Error(
      `Categoria inválida: ${category || "não informada"}.`
    );
  }

  if (
    !Number.isFinite(plannedAmount) ||
    plannedAmount < 0
  ) {
    throw new Error(
      `Meta inválida para ${category}.`
    );
  }

  if (plannedAmount === 0) {
    return null;
  }

  return {
    category,
    plannedAmount: Number(plannedAmount.toFixed(2)),
  };
}

export function validateMonthlyPlanSaveInput(
  value: MonthlyPlanSaveInput
): MonthlyPlanSaveInput {
  const year = Number(value.year);
  const month = Number(value.month);
  const spendingLimit = Number(value.spendingLimit);

  if (
    !Number.isInteger(year) ||
    year < MIN_PLAN_YEAR ||
    year > MAX_PLAN_YEAR
  ) {
    throw new Error("Ano do planejamento inválido.");
  }

  if (
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error("Mês do planejamento inválido.");
  }

  if (
    !Number.isFinite(spendingLimit) ||
    spendingLimit < 0
  ) {
    throw new Error("Limite mensal inválido.");
  }

  if (!isValidStatus(value.status)) {
    throw new Error("Status do planejamento inválido.");
  }

  if (!Array.isArray(value.goals)) {
    throw new Error("Metas do planejamento inválidas.");
  }

  const goals: MonthlyPlanGoalInput[] = [];
  const usedCategories = new Set<string>();

  value.goals.forEach((goal) => {
    const normalized = normalizeGoal(goal);

    if (!normalized) {
      return;
    }

    if (usedCategories.has(normalized.category)) {
      throw new Error(
        `Meta duplicada para ${normalized.category}.`
      );
    }

    usedCategories.add(normalized.category);
    goals.push(normalized);
  });

  return {
    year,
    month,
    spendingLimit: Number(spendingLimit.toFixed(2)),
    status: value.status,
    goals,
  };
}
