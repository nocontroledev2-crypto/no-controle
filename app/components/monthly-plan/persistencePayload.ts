import type {
  MonthlyPlanPersistencePayload,
  MonthlyPlanSaveInput,
} from "./persistenceTypes";
import {
  validateMonthlyPlanSaveInput,
} from "./persistenceValidation";

type BuildMonthlyPlanPersistencePayloadParams = {
  userId: string;
  planId: string;
  updatedAt: string;
  input: MonthlyPlanSaveInput;
};

function requireText(
  value: unknown,
  label: string
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(`${label} inválido.`);
  }

  return value.trim();
}

function requireTimestamp(
  value: unknown
): string {
  const timestamp = requireText(
    value,
    "Data de atualização"
  );

  if (!Number.isFinite(Date.parse(timestamp))) {
    throw new Error(
      "Data de atualização inválida."
    );
  }

  return timestamp;
}

export function buildMonthlyPlanPersistencePayload({
  userId,
  planId,
  updatedAt,
  input,
}: BuildMonthlyPlanPersistencePayloadParams): MonthlyPlanPersistencePayload {
  const safeUserId = requireText(
    userId,
    "Usuário do planejamento"
  );

  const safePlanId = requireText(
    planId,
    "Identificador do planejamento"
  );

  const safeUpdatedAt =
    requireTimestamp(updatedAt);

  const validated =
    validateMonthlyPlanSaveInput(input);

  return {
    plan: {
      user_id: safeUserId,
      year: validated.year,
      month: validated.month,
      spending_limit: validated.spendingLimit,
      status: validated.status,
      updated_at: safeUpdatedAt,
    },
    goals: validated.goals.map((goal) => ({
      plan_id: safePlanId,
      category: goal.category,
      planned_amount: goal.plannedAmount,
      updated_at: safeUpdatedAt,
    })),
  };
}
