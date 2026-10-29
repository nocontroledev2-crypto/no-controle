import type { MonthlyPlanStatus } from "./types";

export type MonthlyPlanRecord = {
  id: string;
  user_id: string;
  year: number;
  month: number;
  spending_limit: number;
  status: MonthlyPlanStatus;
  created_at: string;
  updated_at: string;
};

export type MonthlyPlanGoalRecord = {
  id: string;
  plan_id: string;
  category: string;
  planned_amount: number;
  created_at: string;
  updated_at: string;
};

export type MonthlyPlanGoalInput = {
  category: string;
  plannedAmount: number;
};

export type MonthlyPlanSaveInput = {
  year: number;
  month: number;
  spendingLimit: number;
  status: MonthlyPlanStatus;
  goals: MonthlyPlanGoalInput[];
};

export type LoadedMonthlyPlan = {
  id: string;
  year: number;
  month: number;
  spendingLimit: number;
  status: MonthlyPlanStatus;
  goals: MonthlyPlanGoalInput[];
  createdAt: string;
  updatedAt: string;
};

export type MonthlyPlanLoadResult =
  | {
      status: "found";
      plan: LoadedMonthlyPlan;
    }
  | {
      status: "not-found";
    }
  | {
      status: "error";
      message: string;
    };
