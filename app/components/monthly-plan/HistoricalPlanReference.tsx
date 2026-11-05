import React, {
  useMemo,
  useState,
} from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import type {
  Expense,
} from "../../storage/expenseStorage";
import {
  calculateMonthlyPlanSummary,
} from "./calculations";
import {
  buildHistoricalExpenseReference,
} from "./historicalExpenseReference";
import {
  buildHistoricalPlanPreview,
} from "./historicalPlanPreview";
import type {
  MonthlyPlanPreviewData,
} from "./types";
import {
  MONTHLY_PLAN_COLORS,
} from "./visualTokens";

type HistoricalWindow =
  | 3
  | 6
  | 9
  | 12;

type HistoricalPlanReferenceProps = {
  year: number;
  month: number;
  expenses: Expense[];
  formatMoney: (value: number) => string;
  onApply: (
    preview: MonthlyPlanPreviewData
  ) => void;
};

const HISTORICAL_WINDOWS:
  HistoricalWindow[] = [
    3,
    6,
    9,
    12,
  ];

export function HistoricalPlanReference({
  year,
  month,
  expenses,
  formatMoney,
  onApply,
}: HistoricalPlanReferenceProps) {
  const [
    selectedWindow,
    setSelectedWindow,
  ] = useState<HistoricalWindow | null>(
    null
  );

  const preview = useMemo(() => {
    if (selectedWindow === null) {
      return null;
    }

    const reference =
      buildHistoricalExpenseReference({
        expenses,
        targetPeriod: {
          year,
          month,
        },
        months: selectedWindow,
      });

    return buildHistoricalPlanPreview({
      year,
      month,
      reference,
    });
  }, [
    expenses,
    month,
    selectedWindow,
    year,
  ]);

  const previewSummary = useMemo(
    () =>
      preview
        ? calculateMonthlyPlanSummary(
            preview
          )
        : null,
    [preview]
  );

  const hasHistoricalData =
    (preview?.spendingLimit ?? 0) > 0;

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Text style={styles.title}>
          Como deseja começar?
        </Text>

        <Text style={styles.subtitle}>
          Use seus gastos anteriores como
          referência ou ajuste tudo manualmente.
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={
          styles.optionsContent
        }
      >
        <TouchableOpacity
          style={[
            styles.optionButton,
            selectedWindow === null &&
              styles.optionButtonSelected,
          ]}
          onPress={() =>
            setSelectedWindow(null)
          }
          activeOpacity={0.78}
          accessibilityRole="button"
          accessibilityLabel="Criar planejamento do zero"
        >
          <Text
            style={[
              styles.optionText,
              selectedWindow === null &&
                styles.optionTextSelected,
            ]}
          >
            Criar do zero
          </Text>
        </TouchableOpacity>

        {HISTORICAL_WINDOWS.map(
          (months) => {
            const selected =
              selectedWindow === months;

            return (
              <TouchableOpacity
                key={months}
                style={[
                  styles.optionButton,
                  selected &&
                    styles.optionButtonSelected,
                ]}
                onPress={() =>
                  setSelectedWindow(months)
                }
                activeOpacity={0.78}
                accessibilityRole="button"
                accessibilityLabel={`Usar média dos últimos ${months} meses`}
              >
                <Text
                  style={[
                    styles.optionText,
                    selected &&
                      styles.optionTextSelected,
                  ]}
                >
                  Média de {months} meses
                </Text>
              </TouchableOpacity>
            );
          }
        )}
      </ScrollView>

      {selectedWindow !== null &&
      preview &&
      previewSummary ? (
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <View style={styles.previewText}>
              <Text style={styles.previewTitle}>
                Prévia da média de{" "}
                {selectedWindow} meses
              </Text>

              <Text
                style={styles.previewDescription}
              >
                Revise antes de aplicar. Nada
                será salvo automaticamente.
              </Text>
            </View>
          </View>

          {hasHistoricalData ? (
            <>
              <View style={styles.metricsRow}>
                <View style={styles.metric}>
                  <Text
                    style={styles.metricLabel}
                  >
                    Limite sugerido
                  </Text>

                  <Text
                    style={styles.metricValue}
                  >
                    {formatMoney(
                      preview.spendingLimit
                    )}
                  </Text>
                </View>

                <View style={styles.metric}>
                  <Text
                    style={styles.metricLabel}
                  >
                    Metas sugeridas
                  </Text>

                  <Text
                    style={styles.metricValue}
                  >
                    {formatMoney(
                      previewSummary.totalPlanned
                    )}
                  </Text>
                </View>
              </View>

              <Text style={styles.referenceHint}>
                A média considera todos os meses
                escolhidos, inclusive meses sem
                gasto em uma categoria.
              </Text>

              <TouchableOpacity
                style={styles.applyButton}
                onPress={() =>
                  onApply(preview)
                }
                activeOpacity={0.78}
                accessibilityRole="button"
                accessibilityLabel="Aplicar prévia histórica à edição"
              >
                <Text
                  style={styles.applyButtonText}
                >
                  Aplicar à edição
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                Ainda não há gastos suficientes
              </Text>

              <Text style={styles.emptyText}>
                Continue registrando seus gastos
                ou crie este planejamento
                manualmente.
              </Text>
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    marginBottom: 14,
  },
  heading: {
    gap: 3,
  },
  title: {
    color: MONTHLY_PLAN_COLORS.text,
    fontSize: 14,
    fontWeight: "900",
  },
  subtitle: {
    color: MONTHLY_PLAN_COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  optionsContent: {
    gap: 8,
    paddingRight: 4,
  },
  optionButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: MONTHLY_PLAN_COLORS.border,
    backgroundColor:
      MONTHLY_PLAN_COLORS.surfaceSoft,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  optionButtonSelected: {
    borderColor: MONTHLY_PLAN_COLORS.brand,
    backgroundColor:
      MONTHLY_PLAN_COLORS.brandSoft,
  },
  optionText: {
    color: MONTHLY_PLAN_COLORS.textMuted,
    fontSize: 11,
    fontWeight: "800",
  },
  optionTextSelected: {
    color: MONTHLY_PLAN_COLORS.brand,
  },
  previewCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: MONTHLY_PLAN_COLORS.border,
    backgroundColor:
      MONTHLY_PLAN_COLORS.surfaceSoft,
    padding: 13,
    gap: 12,
  },
  previewHeader: {
    flexDirection: "row",
    gap: 10,
  },
  previewText: {
    flex: 1,
  },
  previewTitle: {
    color: MONTHLY_PLAN_COLORS.brand,
    fontSize: 14,
    fontWeight: "900",
  },
  previewDescription: {
    color: MONTHLY_PLAN_COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
  },
  metric: {
    flex: 1,
    minWidth: 0,
  },
  metricLabel: {
    color: MONTHLY_PLAN_COLORS.textMuted,
    fontSize: 10,
    fontWeight: "700",
  },
  metricValue: {
    color: MONTHLY_PLAN_COLORS.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 3,
  },
  referenceHint: {
    color: MONTHLY_PLAN_COLORS.textMuted,
    fontSize: 10,
    lineHeight: 15,
  },
  applyButton: {
    borderRadius: 13,
    backgroundColor: MONTHLY_PLAN_COLORS.brand,
    paddingVertical: 11,
    alignItems: "center",
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  emptyState: {
    borderRadius: 14,
    backgroundColor:
      MONTHLY_PLAN_COLORS.surface,
    padding: 12,
    gap: 4,
  },
  emptyTitle: {
    color: MONTHLY_PLAN_COLORS.text,
    fontSize: 12,
    fontWeight: "900",
  },
  emptyText: {
    color: MONTHLY_PLAN_COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
});
