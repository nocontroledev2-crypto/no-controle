import type { MonthlyPlanPreviewData } from "./types";

export const MONTHLY_PLAN_PREVIEW_DATA: MonthlyPlanPreviewData = {
  year: 2026,
  month: 10,
  status: "active",
  spendingLimit: 5000,
  realizedAmount: 3000,
  scheduledAmount: 800,
  categories: [
    {
      category: "Contas da Casa",
      plannedAmount: 1000,
      realizedAmount: 950,
      scheduledAmount: 200,
    },
    {
      category: "Alimentação",
      plannedAmount: 1200,
      realizedAmount: 700,
      scheduledAmount: 150,
    },
    {
      category: "Moradia",
      plannedAmount: 1000,
      realizedAmount: 600,
      scheduledAmount: 300,
    },
    {
      category: "Transporte",
      plannedAmount: 800,
      realizedAmount: 400,
      scheduledAmount: 100,
    },
    {
      category: "Lazer",
      plannedAmount: null,
      realizedAmount: 250,
      scheduledAmount: 50,
    },
    {
      category: "Saúde",
      plannedAmount: 200,
      realizedAmount: 100,
      scheduledAmount: 0,
    },
  ],
};
