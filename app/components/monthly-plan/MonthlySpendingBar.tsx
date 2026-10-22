import React from "react";
import { StyleSheet, View } from "react-native";

import {
  calculatePercentage,
  getConsumptionStatus,
} from "./calculations";
import {
  getConsumptionColor,
  MONTHLY_PLAN_COLORS,
} from "./visualTokens";

type MonthlySpendingBarProps = {
  realizedAmount: number;
  limitAmount: number;
  height?: number;
};

const MAX_VISUAL_PERCENTAGE = 140;
const EXCESS_VISUAL_RANGE = MAX_VISUAL_PERCENTAGE - 100;

export function MonthlySpendingBar({
  realizedAmount,
  limitAmount,
  height = 14,
}: MonthlySpendingBarProps) {
  const percentage =
    calculatePercentage(realizedAmount, limitAmount) ?? 0;

  const normalizedPercentage = Math.max(0, percentage);
  const hasExcess = normalizedPercentage > 100;

  const status = getConsumptionStatus(percentage);
  const consumptionColor = getConsumptionColor(status);

  const regularPercentage = Math.min(normalizedPercentage, 100);
  const excessPercentage = Math.min(
    Math.max(normalizedPercentage - 100, 0),
    EXCESS_VISUAL_RANGE
  );

  const regularSectionWidth = hasExcess
    ? (100 / MAX_VISUAL_PERCENTAGE) * 100
    : 100;

  const excessSectionWidth = hasExcess
    ? (EXCESS_VISUAL_RANGE / MAX_VISUAL_PERCENTAGE) * 100
    : 0;

  const excessFillWidth =
    (excessPercentage / EXCESS_VISUAL_RANGE) * 100;

  return (
    <View
      style={[styles.wrapper, { height }]}
      accessibilityRole="progressbar"
      accessibilityLabel="Consumo do limite mensal"
      accessibilityValue={{
        min: 0,
        max: MAX_VISUAL_PERCENTAGE,
        now: Math.min(normalizedPercentage, MAX_VISUAL_PERCENTAGE),
        text: `${percentage}% do limite`,
      }}
    >
      <View
        style={[
          styles.regularTrack,
          {
            width: `${regularSectionWidth}%`,
          },
        ]}
      >
        <View
          style={[
            styles.regularFill,
            {
              width: `${regularPercentage}%`,
              backgroundColor: consumptionColor,
            },
          ]}
        />

        {hasExcess ? <View style={styles.limitMarker} /> : null}
      </View>

      {hasExcess ? (
        <View
          style={[
            styles.excessTrack,
            {
              width: `${excessSectionWidth}%`,
            },
          ]}
        >
          <View
            style={[
              styles.excessFill,
              {
                width: `${excessFillWidth}%`,
              },
            ]}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    flexDirection: "row",
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: MONTHLY_PLAN_COLORS.track,
    borderWidth: 1,
    borderColor: MONTHLY_PLAN_COLORS.border,
  },
  regularTrack: {
    height: "100%",
    position: "relative",
  },
  regularFill: {
    height: "100%",
    borderRadius: 999,
  },
  limitMarker: {
    position: "absolute",
    top: -2,
    right: -1,
    bottom: -2,
    width: 2,
    backgroundColor: MONTHLY_PLAN_COLORS.text,
    opacity: 0.72,
    zIndex: 2,
  },
  excessTrack: {
    height: "100%",
    backgroundColor: MONTHLY_PLAN_COLORS.trackDark,
  },
  excessFill: {
    height: "100%",
    backgroundColor: MONTHLY_PLAN_COLORS.excessRed,
  },
});
