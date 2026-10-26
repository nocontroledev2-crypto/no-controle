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
  onDefineGoal?: () => void;
};

export function MonthlyCategoryCard({
  item,
  formatMoney,
  onPress,
  onDefineGoal,
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

  const hasUnplannedActivity =
    item.realizedAmount > 0 ||
    item.scheduledAmount > 0;

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
            {item.realizedAmount > 0
              ? `${formatMoney(
                  item.realizedAmount
                )} gastos até agora`
              : "Nenhum gasto neste mês"}
          </Text>

          {item.realizedAmount > 0 ? (
            <View
              style={styles.unplannedActivityLine}
              accessibilityLabel={`${formatMoney(
                item.realizedAmount
              )} gastos até agora`}
            />
          ) : null}

          <View style={styles.noGoalStatus}>
            <View style={styles.noGoalMessage}>
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={MONTHLY_PLAN_COLORS.yellow}
              />

              <View style={styles.noGoalTextContainer}>
                <Text style={styles.noGoalInlineText}>
                  <Text style={styles.noGoalInlineTitle}>
                    {hasUnplannedActivity
                      ? "Gasto não planejado: "
                      : "Meta ainda não definida: "}
                  </Text>

                  {hasUnplannedActivity
                    ? "defina uma meta para acompanhar o consumo."
                    : "defina uma meta para acompanhar esta categoria."}
                </Text>
              </View>
            </View>

            {onDefineGoal ? (
              <TouchableOpacity
                style={styles.defineGoalButton}
                onPress={onDefineGoal}
                activeOpacity={0.78}
                accessibilityRole="button"
                accessibilityLabel={`Definir meta para ${item.category}`}
              >
                <Text style={styles.defineGoalButtonText}>
                  Definir meta
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
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
    gap: 8,
  },
  unplannedActivityLine: {
    width: 96,
    height: 8,
    borderRadius: 999,
    backgroundColor: MONTHLY_PLAN_COLORS.green,
  },
  noGoalStatus: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MONTHLY_PLAN_COLORS.yellow,
    backgroundColor: MONTHLY_PLAN_COLORS.surfaceSoft,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  noGoalMessage: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  noGoalTextContainer: {
    flex: 1,
  },
  noGoalInlineText: {
    color: MONTHLY_PLAN_COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  noGoalInlineTitle: {
    color: MONTHLY_PLAN_COLORS.text,
    fontWeight: "800",
  },
  defineGoalButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: MONTHLY_PLAN_COLORS.brandSoft,
  },
  defineGoalButtonText: {
    color: MONTHLY_PLAN_COLORS.brand,
    fontSize: 12,
    fontWeight: "800",
  },
});
