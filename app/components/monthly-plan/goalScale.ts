const NICE_SCALE_FACTORS = [
  1,
  1.5,
  2,
  2.5,
  3,
  4,
  5,
  7.5,
  10,
];

function getNiceCeiling(value: number): number {
  const safeValue = Math.max(value, 1);
  const magnitude = 10 ** Math.floor(Math.log10(safeValue));
  const normalized = safeValue / magnitude;

  const factor =
    NICE_SCALE_FACTORS.find(
      (item) => normalized <= item
    ) ?? 10;

  return factor * magnitude;
}

export function getAdaptiveGoalScaleMax(
  plannedAmount: number | null,
  spendingLimit: number
): number {
  const safePlanned = Math.max(plannedAmount ?? 0, 0);
  const safeLimit = Math.max(spendingLimit, 0);

  const usefulMinimum = Math.max(
    safeLimit * 0.25,
    500
  );

  const reference = Math.max(
    safePlanned,
    usefulMinimum
  );

  return getNiceCeiling(reference * 1.25);
}

export function getExpandedGoalScaleMax(
  currentMaximum: number
): number {
  const safeMaximum = Math.max(
    currentMaximum,
    500
  );

  return getNiceCeiling(
    safeMaximum * 1.01
  );
}

export function clampGoalAmount(
  value: number,
  maximum: number
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(
    Math.max(value, 0),
    Math.max(maximum, 0)
  );
}
