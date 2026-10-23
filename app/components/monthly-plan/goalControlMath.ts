import { clampGoalAmount } from "./goalScale";

export function getGoalStep(
  maximum: number
): number {
  if (maximum <= 1000) {
    return 10;
  }

  if (maximum <= 2500) {
    return 25;
  }

  if (maximum <= 5000) {
    return 50;
  }

  if (maximum <= 10000) {
    return 100;
  }

  if (maximum <= 25000) {
    return 250;
  }

  if (maximum <= 50000) {
    return 500;
  }

  return 1000;
}

export function snapGoalAmount(
  value: number,
  maximum: number
): number {
  const step = getGoalStep(maximum);

  const snapped =
    Math.round(value / step) * step;

  return clampGoalAmount(
    snapped,
    maximum
  );
}

export function getGoalProgress(
  value: number,
  maximum: number
): number {
  if (
    !Number.isFinite(value) ||
    !Number.isFinite(maximum) ||
    maximum <= 0
  ) {
    return 0;
  }

  return Math.min(
    Math.max(value / maximum, 0),
    1
  );
}

export function getGoalAmountFromPosition(
  position: number,
  width: number,
  maximum: number
): number {
  if (
    !Number.isFinite(position) ||
    !Number.isFinite(width) ||
    width <= 0
  ) {
    return 0;
  }

  const progress = Math.min(
    Math.max(position / width, 0),
    1
  );

  return snapGoalAmount(
    progress * maximum,
    maximum
  );
}
