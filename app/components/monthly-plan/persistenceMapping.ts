import type {
  LoadedMonthlyPlan,
  MonthlyPlanGoalRecord,
  MonthlyPlanRecord,
} from "./persistenceTypes";
import { validateMonthlyPlanSaveInput } from "./persistenceValidation";

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
  value: unknown,
  label: string
): string {
  const timestamp = requireText(value, label);

  if (!Number.isFinite(Date.parse(timestamp))) {
    throw new Error(`${label} inválido.`);
  }

  return timestamp;
}

export function mapMonthlyPlanRecords(
  plan: MonthlyPlanRecord,
  goals: MonthlyPlanGoalRecord[]
): LoadedMonthlyPlan {
  const id = requireText(
    plan.id,
    "Identificador do planejamento"
  );

  requireText(
    plan.user_id,
    "Usuário do planejamento"
  );

  const createdAt = requireTimestamp(
    plan.created_at,
    "Data de criação do planejamento"
  );

  const updatedAt = requireTimestamp(
    plan.updated_at,
    "Data de atualização do planejamento"
  );

  if (!Array.isArray(goals)) {
    throw new Error(
      "Metas persistidas inválidas."
    );
  }

  const normalized = validateMonthlyPlanSaveInput({
    year: plan.year,
    month: plan.month,
    spendingLimit: plan.spending_limit,
    status: plan.status,
    goals: goals.map((goal) => {
      const goalPlanId = requireText(
        goal.plan_id,
        "Planejamento da meta"
      );

      if (goalPlanId !== id) {
        throw new Error(
          "Meta vinculada a outro planejamento."
        );
      }

      requireText(
        goal.id,
        "Identificador da meta"
      );

      requireTimestamp(
        goal.created_at,
        "Data de criação da meta"
      );

      requireTimestamp(
        goal.updated_at,
        "Data de atualização da meta"
      );

      return {
        category: goal.category,
        plannedAmount: goal.planned_amount,
      };
    }),
  });

  return {
    id,
    year: normalized.year,
    month: normalized.month,
    spendingLimit: normalized.spendingLimit,
    status: normalized.status,
    goals: normalized.goals,
    createdAt,
    updatedAt,
  };
}
