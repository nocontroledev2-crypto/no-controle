import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  calculatePercentage,
  getConsumptionStatus,
} from "./calculations";
import { getCategoryIconName } from "./categoryVisuals";
import { MonthlySpendingBar } from "./MonthlySpendingBar";
import type { MonthlyPlanCategory } from "./types";
import {
  getConsumptionColor,
  MONTHLY_PLAN_COLORS,
} from "./visualTokens";

type MonthlyCategoryCardProps = {
  item: MonthlyPlanCategory;
  formatMoney: (value: number) => string;
  onPress?: () => void;
};

export function MonthlyCategoryCard({
  item,
  formatMoney,
  onPress,
}: MonthlyCategoryCardProps) {
  const hasGoal =
    item.plannedAmount !== null && item.plannedAmount > 0;

  const percentage = hasGoal
    ? calculatePercentage(
        item.realizedAmount,
        item.plannedAmount ?? 0
      )
    : null;

  const status =
    percentage !== null
      ? getConsumptionStatus(percentage)
      : null;

  const statusColor =
    status !== null
      ? getConsumptionColor(status)
      : MONTHLY_PLAN_COLORS.textMuted;

  const content = (
    <>
      <View style={styles.header}>
        <View style={styles.identity}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={getCategoryIconName(item.category)}
              size={21}
              color={MONTHLY_PLAN_COLORS.brand}
            />
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.categoryName}>
              {item.category}
            </Text>

            {item.scheduledAmount > 0 ? (
              <Text style={styles.scheduledText}>
                {formatMoney(item.scheduledAmount)} programados
              </Text>
            ) : null}
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={19}
          color={MONTHLY_PLAN_COLORS.textMuted}
        />
      </View>

      {hasGoal ? (
        <>
          <View style={styles.valuesRow}>
            <Text style={styles.valuePrimary}>
              {formatMoney(item.realizedAmount)}
            </Text>

            <Text style={styles.valueReference}>
              de {formatMoney(item.plannedAmount ?? 0)}
            </Text>

            <Text
              style={[
                styles.percentage,
                { color: statusColor },
              ]}
            >
              {percentage}%
            </Text>
          </View>

          <MonthlySpendingBar
            realizedAmount={item.realizedAmount}
            limitAmount={item.plannedAmount ?? 0}
            height={12}
          />
        </>
      ) : (
        <View style={styles.noGoalContainer}>
          <Text style={styles.valuePrimary}>
            {formatMoney(item.realizedAmount)} gastos
          </Text>

          <Text style={styles.noGoalTitle}>
            Meta ainda não definida
          </Text>

          <Text style={styles.noGoalDescription}>
            {item.scheduledAmount > 0
              ? "Gastos e lançamentos não planejados"
              : "Gasto não planejado"}
          </Text>
        </View>
      )}
    </>
  );

  if (!onPress) {
    return <View style={styles.card}>{content}</View>;
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.78}
      accessibilityRole="button"
      accessibilityLabel={`Ver detalhes de ${item.category}`}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: MONTHLY_PLAN_COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: MONTHLY_PLAN_COLORS.border,
    padding: 15,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  identity: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: MONTHLY_PLAN_COLORS.brandSoft,
  },
  titleContainer: {
    flex: 1,
  },
  categoryName: {
    color: MONTHLY_PLAN_COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },
  scheduledText: {
    color: MONTHLY_PLAN_COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  valuesRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
  },
  valuePrimary: {
    color: MONTHLY_PLAN_COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  valueReference: {
    flex: 1,
    color: MONTHLY_PLAN_COLORS.textMuted,
    fontSize: 12,
  },
  percentage: {
    fontSize: 15,
    fontWeight: "900",
  },
  noGoalContainer: {
    gap: 4,
  },
  noGoalTitle: {
    color: MONTHLY_PLAN_COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  noGoalDescription: {
    color: MONTHLY_PLAN_COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
});
