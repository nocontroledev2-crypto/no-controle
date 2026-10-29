import { Ionicons } from "@expo/vector-icons";
import React, {
  useMemo,
  useState,
} from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  calculateMonthlyPlanSummary,
  filterRelevantCategories,
  getConsumptionStatus,
  sortCategoriesByImpact,
} from "./calculations";
import { MonthlyCategoryCard } from "./MonthlyCategoryCard";
import { MonthlySpendingBar } from "./MonthlySpendingBar";
import { MonthlySpendingLimitControl } from "./MonthlySpendingLimitControl";
import {
  getAdaptiveGoalScaleMax,
  getExpandedGoalScaleMax,
} from "./goalScale";
import type { MonthlyPlanPreviewData } from "./types";
import {
  getConsumptionColor,
  MONTHLY_PLAN_COLORS,
} from "./visualTokens";

type MonthlyPlanPreviewProps = {
  data: MonthlyPlanPreviewData;
  formatMoney: (value: number) => string;
  onPlanCategories?: () => void;
  onCategoryPress?: (category: string) => void;
  onSpendingLimitChange?: (value: number) => void;
};

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function MonthlyPlanPreview({
  data,
  formatMoney,
  onPlanCategories,
  onCategoryPress,
  onSpendingLimitChange,
}: MonthlyPlanPreviewProps) {
  const summary = useMemo(
    () => calculateMonthlyPlanSummary(data),
    [data]
  );

  const orderedCategories = useMemo(
    () =>
      sortCategoriesByImpact(
        filterRelevantCategories(
          data.categories
        )
      ),
    [data.categories]
  );

  const [spendingLimitMaximum, setSpendingLimitMaximum] =
    useState(() =>
      getAdaptiveGoalScaleMax(
        data.spendingLimit,
        data.spendingLimit
      )
    );

  const percentage = summary.realizedPercentage;
  const hasSpendingLimit =
    percentage !== null;

  const status =
    getConsumptionStatus(percentage ?? 0);

  const statusColor =
    getConsumptionColor(status);

  const monthName =
    MONTH_NAMES[data.month - 1] ?? "Mês selecionado";

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.periodRow}>
          <View style={styles.periodButton}>
            <Ionicons
              name="chevron-back"
              size={19}
              color={MONTHLY_PLAN_COLORS.brand}
            />
          </View>

          <View style={styles.periodTextContainer}>
            <Text style={styles.eyebrow}>
              Meu plano do mês
            </Text>

            <Text style={styles.periodText}>
              {monthName} de {data.year}
            </Text>
          </View>

          <View style={styles.periodButton}>
            <Ionicons
              name="chevron-forward"
              size={19}
              color={MONTHLY_PLAN_COLORS.brand}
            />
          </View>
        </View>

        <View style={styles.limitHeader}>
          <View style={styles.limitTextContainer}>
            <Text style={styles.label}>
              Quanto posso gastar neste mês?
            </Text>

            <Text style={styles.limitValue}>
              {formatMoney(data.spendingLimit)}
            </Text>
          </View>

        </View>

        {onSpendingLimitChange ? (
          <MonthlySpendingLimitControl
            value={data.spendingLimit}
            maximum={spendingLimitMaximum}
            formatMoney={formatMoney}
            onChange={onSpendingLimitChange}
            onRequestExpand={() =>
              setSpendingLimitMaximum((current) =>
                getExpandedGoalScaleMax(current)
              )
            }
          />
        ) : null}

        <View style={styles.realizedHeader}>
          <View>
            <Text style={styles.label}>
              Gasto até agora
            </Text>

            <Text style={styles.realizedValue}>
              {formatMoney(data.realizedAmount)}
            </Text>
          </View>

          {hasSpendingLimit ? (
            <Text
              style={[
                styles.realizedPercentage,
                { color: statusColor },
              ]}
            >
              {percentage}%
            </Text>
          ) : (
            <Text style={styles.undefinedLimitText}>
              Limite ainda não definido
            </Text>
          )}
        </View>

        <MonthlySpendingBar
          realizedAmount={data.realizedAmount}
          limitAmount={data.spendingLimit}
          height={18}
        />

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>
              Saldo do limite hoje
            </Text>

            <Text style={styles.metricValue}>
              {formatMoney(summary.balanceToday)}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>
              Já programado
            </Text>

            <Text style={styles.metricValue}>
              {formatMoney(data.scheduledAmount)}
            </Text>
          </View>

          <View style={[styles.metricCard, styles.metricCardWide]}>
            <Text style={styles.metricLabel}>
              Livre após os programados
            </Text>

            <Text style={styles.metricValue}>
              {formatMoney(summary.freeAfterScheduled)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.categoriesHeader}>
        <View style={styles.categoriesTitleContainer}>
          <Text style={styles.categoriesTitle}>
            Para onde está indo seu dinheiro?
          </Text>

          <Text style={styles.categoriesSubtitle}>
            Ordenado por maior gasto
          </Text>
        </View>

        <TouchableOpacity
          style={styles.planButton}
          onPress={onPlanCategories}
          activeOpacity={0.78}
          accessibilityRole="button"
          accessibilityLabel="Planejar metas por categoria"
        >
          <Ionicons
            name="options-outline"
            size={16}
            color={MONTHLY_PLAN_COLORS.brand}
          />

          <Text style={styles.planButtonText}>
            Planejar
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.categoryList}>
        {orderedCategories.map((item) => (
          <MonthlyCategoryCard
            key={item.category}
            item={item}
            formatMoney={formatMoney}
            onPress={
              onCategoryPress
                ? () => onCategoryPress(item.category)
                : undefined
            }
            onDefineGoal={onPlanCategories}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
  },
  hero: {
    backgroundColor: MONTHLY_PLAN_COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: MONTHLY_PLAN_COLORS.border,
    padding: 18,
    gap: 17,
  },
  periodRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  periodButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: MONTHLY_PLAN_COLORS.brandSoft,
  },
  periodTextContainer: {
    flex: 1,
    alignItems: "center",
  },
  eyebrow: {
    color: MONTHLY_PLAN_COLORS.brand,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  periodText: {
    color: MONTHLY_PLAN_COLORS.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 2,
  },
  limitHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  limitTextContainer: {
    flex: 1,
  },
  label: {
    color: MONTHLY_PLAN_COLORS.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  limitValue: {
    color: MONTHLY_PLAN_COLORS.brand,
    fontSize: 30,
    fontWeight: "900",
    marginTop: 4,
  },
  realizedHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  realizedValue: {
    color: MONTHLY_PLAN_COLORS.text,
    fontSize: 23,
    fontWeight: "900",
    marginTop: 4,
  },
  realizedPercentage: {
    fontSize: 20,
    fontWeight: "900",
  },
  undefinedLimitText: {
    flexShrink: 1,
    color: MONTHLY_PLAN_COLORS.textMuted,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    textAlign: "right",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricCard: {
    flexGrow: 1,
    flexBasis: 130,
    minWidth: 0,
    borderRadius: 16,
    padding: 13,
    backgroundColor: MONTHLY_PLAN_COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: MONTHLY_PLAN_COLORS.border,
  },
  metricCardWide: {
    flexBasis: 200,
  },
  metricLabel: {
    color: MONTHLY_PLAN_COLORS.textMuted,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
  },
  metricValue: {
    color: MONTHLY_PLAN_COLORS.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 5,
  },
  categoriesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  categoriesTitleContainer: {
    flex: 1,
  },
  categoriesTitle: {
    color: MONTHLY_PLAN_COLORS.text,
    fontSize: 17,
    fontWeight: "900",
  },
  categoriesSubtitle: {
    color: MONTHLY_PLAN_COLORS.textMuted,
    fontSize: 11,
    marginTop: 3,
  },
  planButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: MONTHLY_PLAN_COLORS.brandSoft,
  },
  planButtonText: {
    color: MONTHLY_PLAN_COLORS.brand,
    fontSize: 12,
    fontWeight: "800",
  },
  categoryList: {
    gap: 10,
  },
});
