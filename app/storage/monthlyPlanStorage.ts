import { supabase } from "../lib/supabase";
import {
  getCurrentUser,
} from "../services/authService";
import {
  mapMonthlyPlanRecords,
} from "../components/monthly-plan/persistenceMapping";
import {
  validateMonthlyPlanSaveInput,
} from "../components/monthly-plan/persistenceValidation";
import type {
  LoadedMonthlyPlan,
  MonthlyPlanGoalRecord,
  MonthlyPlanLoadResult,
  MonthlyPlanRecord,
  MonthlyPlanSaveInput,
} from "../components/monthly-plan/persistenceTypes";

const dbClient = supabase as any;

function isMissingRecordError(
  error: any
): boolean {
  return (
    error?.code === "PGRST116" ||
    error?.details?.includes(
      "0 rows"
    ) === true
  );
}

function isValidPeriod(
  year: number,
  month: number
): boolean {
  return (
    Number.isInteger(year) &&
    year >= 2000 &&
    year <= 2100 &&
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12
  );
}

export async function loadMonthlyPlan(
  year: number,
  month: number
): Promise<MonthlyPlanLoadResult> {
  if (!isValidPeriod(year, month)) {
    return {
      status: "error",
      message:
        "Período mensal inválido.",
    };
  }

  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        status: "error",
        message:
          "Entre na sua conta para acessar seu planejamento.",
      };
    }

    const {
      data: planData,
      error: planError,
    } = await dbClient
      .from("monthly_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("year", year)
      .eq("month", month)
      .maybeSingle();

    if (planError) {
      if (
        isMissingRecordError(
          planError
        )
      ) {
        return {
          status: "not-found",
        };
      }

      console.error(planError);

      return {
        status: "error",
        message:
          "Não foi possível carregar o planejamento mensal.",
      };
    }

    if (!planData) {
      return {
        status: "not-found",
      };
    }

    const {
      data: goalsData,
      error: goalsError,
    } = await dbClient
      .from("monthly_plan_goals")
      .select("*")
      .eq("plan_id", planData.id)
      .order("category", {
        ascending: true,
      });

    if (goalsError) {
      console.error(goalsError);

      return {
        status: "error",
        message:
          "Não foi possível carregar as metas do planejamento.",
      };
    }

    const plan = mapMonthlyPlanRecords(
      planData as MonthlyPlanRecord,
      (
        Array.isArray(goalsData)
          ? goalsData
          : []
      ) as MonthlyPlanGoalRecord[]
    );

    return {
      status: "found",
      plan,
    };
  } catch (error) {
    console.error(error);

    return {
      status: "error",
      message:
        "Não foi possível carregar o planejamento mensal.",
    };
  }
}

export async function saveMonthlyPlan(
  input: MonthlyPlanSaveInput
): Promise<LoadedMonthlyPlan> {
  const validated =
    validateMonthlyPlanSaveInput(input);

  const user = await getCurrentUser();

  if (!user) {
    throw new Error(
      "Entre na sua conta para salvar seu planejamento."
    );
  }

  const updatedAt =
    new Date().toISOString();

  const {
    data: planData,
    error: planError,
  } = await dbClient
    .from("monthly_plans")
    .upsert(
      {
        user_id: user.id,
        year: validated.year,
        month: validated.month,
        spending_limit:
          validated.spendingLimit,
        status: validated.status,
        updated_at: updatedAt,
      },
      {
        onConflict:
          "user_id,year,month",
      }
    )
    .select("*")
    .single();

  if (planError || !planData) {
    console.error(planError);

    throw new Error(
      "Não foi possível salvar o planejamento mensal."
    );
  }

  const {
    data: existingGoalsData,
    error: existingGoalsError,
  } = await dbClient
    .from("monthly_plan_goals")
    .select("*")
    .eq("plan_id", planData.id);

  if (existingGoalsError) {
    console.error(existingGoalsError);

    throw new Error(
      "Não foi possível verificar as metas existentes."
    );
  }

  const existingGoals = (
    Array.isArray(existingGoalsData)
      ? existingGoalsData
      : []
  ) as MonthlyPlanGoalRecord[];

  if (validated.goals.length > 0) {
    const {
      error: goalsUpsertError,
    } = await dbClient
      .from("monthly_plan_goals")
      .upsert(
        validated.goals.map(
          (goal) => ({
            plan_id: planData.id,
            category: goal.category,
            planned_amount:
              goal.plannedAmount,
            updated_at: updatedAt,
          })
        ),
        {
          onConflict:
            "plan_id,category",
        }
      );

    if (goalsUpsertError) {
      console.error(goalsUpsertError);

      throw new Error(
        "Não foi possível salvar as metas do planejamento."
      );
    }
  }

  const desiredCategories = new Set(
    validated.goals.map(
      (goal) => goal.category
    )
  );

  const removedCategories =
    existingGoals
      .map((goal) => goal.category)
      .filter(
        (category) =>
          !desiredCategories.has(category)
      );

  if (removedCategories.length > 0) {
    const {
      error: goalsDeleteError,
    } = await dbClient
      .from("monthly_plan_goals")
      .delete()
      .eq("plan_id", planData.id)
      .in(
        "category",
        removedCategories
      );

    if (goalsDeleteError) {
      console.error(goalsDeleteError);

      throw new Error(
        "Não foi possível remover as metas desmarcadas."
      );
    }
  }

  const {
    data: savedGoalsData,
    error: savedGoalsError,
  } = await dbClient
    .from("monthly_plan_goals")
    .select("*")
    .eq("plan_id", planData.id)
    .order("category", {
      ascending: true,
    });

  if (savedGoalsError) {
    console.error(savedGoalsError);

    throw new Error(
      "O planejamento foi salvo, mas não pôde ser conferido."
    );
  }

  return mapMonthlyPlanRecords(
    planData as MonthlyPlanRecord,
    (
      Array.isArray(savedGoalsData)
        ? savedGoalsData
        : []
    ) as MonthlyPlanGoalRecord[]
  );
}
