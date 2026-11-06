import { supabase } from "../lib/supabase";
import {
  getCurrentUser,
} from "../services/authService";
import {
  mapMonthlyPlanRecords,
} from "../components/monthly-plan/persistenceMapping";
import type {
  MonthlyPlanGoalRecord,
  MonthlyPlanLoadResult,
  MonthlyPlanRecord,
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
