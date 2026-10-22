export type MonthlyPlanStatus = "draft" | "active";

export type MonthlyPlanCategory = {
  category: string;
  plannedAmount: number | null;
  realizedAmount: number;
  scheduledAmount: number;
};

export type MonthlyPlanPreviewData = {
  year: number;
  month: number;
  status: MonthlyPlanStatus;
  spendingLimit: number;
  realizedAmount: number;
  scheduledAmount: number;
  categories: MonthlyPlanCategory[];
};
