import type { ConsumptionStatus } from "./calculations";

export const MONTHLY_PLAN_COLORS = {
  brand: "#0A8F55",
  brandSoft: "#E8F5EE",
  green: "#18A566",
  yellow: "#D6A415",
  orange: "#E47A1F",
  red: "#D64545",
  excessRed: "#A92525",
  track: "#E7ECE9",
  trackDark: "#D5DDD8",
  text: "#24312A",
  textMuted: "#68756E",
  surface: "#FFFFFF",
  surfaceSoft: "#F6F9F7",
  border: "#DDE6E1",
} as const;

export function getConsumptionColor(
  status: ConsumptionStatus
): string {
  return MONTHLY_PLAN_COLORS[status];
}
