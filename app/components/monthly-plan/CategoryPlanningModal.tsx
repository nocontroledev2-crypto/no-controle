import { Ionicons } from "@expo/vector-icons";
import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  calculateMonthlyPlanSummary,
  sortCategoriesByImpact,
} from "./calculations";
import { CategoryGoalControl } from "./CategoryGoalControl";
import { getAdaptiveGoalScaleMax } from "./goalScale";
import type {
  MonthlyPlanCategory,
  MonthlyPlanPreviewData,
} from "./types";
import { MONTHLY_PLAN_COLORS } from "./visualTokens";

type CategoryPlanningModalProps = {
  visible: boolean;
  data: MonthlyPlanPreviewData;
  formatMoney: (value: number) => string;
  onClose: () => void;
  onSave?: (
    categories: MonthlyPlanCategory[]
  ) => void;
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

export function CategoryPlanningModal({
  visible,
  data,
  formatMoney,
  onClose,
  onSave,
}: CategoryPlanningModalProps) {
  const [draftCategories, setDraftCategories] =
    useState<MonthlyPlanCategory[]>(
      () => data.categories.map((item) => ({ ...item }))
    );

  const [draftMaximums, setDraftMaximums] =
    useState<Record<string, number>>(() =>
      Object.fromEntries(
        data.categories.map((item) => [
          item.category,
          getAdaptiveGoalScaleMax(
            item.plannedAmount,
            data.spendingLimit
          ),
        ])
      )
    );

  useEffect(() => {
    if (!visible) {
      return;
    }

    setDraftCategories(
      data.categories.map((item) => ({ ...item }))
    );

    setDraftMaximums(
      Object.fromEntries(
        data.categories.map((item) => [
          item.category,
          getAdaptiveGoalScaleMax(
            item.plannedAmount,
            data.spendingLimit
          ),
        ])
      )
    );
  }, [
    data.categories,
    data.spendingLimit,
    visible,
  ]);

  const draftData = useMemo(
    () => ({
      ...data,
      categories: draftCategories,
    }),
    [data, draftCategories]
  );

  const summary = useMemo(
    () => calculateMonthlyPlanSummary(draftData),
    [draftData]
  );

  const categories = useMemo(
    () => sortCategoriesByImpact(draftCategories),
    [draftCategories]
  );

  function updateCategoryGoal(
    category: string,
    value: number
  ) {
    setDraftCategories((current) =>
      current.map((item) =>
        item.category === category
          ? {
              ...item,
              plannedAmount: value,
            }
          : item
      )
    );
  }

  function saveDraft() {
    onSave?.(
      draftCategories.map((item) => ({ ...item }))
    );
  }

  const monthName =
    MONTH_NAMES[data.month - 1] ?? "Mês selecionado";

  const distributedPercentage =
    summary.distributedPercentage ?? 0;

  const isOverLimit = summary.undistributed < 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>
                Planejar por categoria
              </Text>

              <Text style={styles.subtitle}>
                {monthName} de {data.year}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.78}
              accessibilityRole="button"
              accessibilityLabel="Fechar planejamento por categoria"
            >
              <Ionicons
                name="close"
                size={18}
                color={MONTHLY_PLAN_COLORS.text}
              />

              <Text style={styles.closeText}>
                Fechar
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.summaryCard,
              isOverLimit && styles.summaryCardOverLimit,
            ]}
          >
            <View style={styles.summaryTopRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>
                  Limite do mês
                </Text>

                <Text style={styles.summaryValue}>
                  {formatMoney(data.spendingLimit)}
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>
                  Metas das categorias
                </Text>

                <Text
                  style={[
                    styles.summaryValue,
                    isOverLimit && styles.dangerText,
                  ]}
                >
                  {formatMoney(summary.totalPlanned)}
                </Text>
              </View>
            </View>

            <View style={styles.distributionRow}>
              <Text
                style={[
                  styles.distributionPercentage,
                  isOverLimit && styles.dangerText,
                ]}
              >
                {distributedPercentage}% distribuído
              </Text>

              <Text
                style={[
                  styles.distributionDescription,
                  isOverLimit && styles.dangerText,
                ]}
              >
                {isOverLimit
                  ? `${formatMoney(
                      Math.abs(summary.undistributed)
                    )} acima do limite`
                  : `${formatMoney(
                      summary.undistributed
                    )} ainda não distribuídos`}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>
            Metas das categorias
          </Text>

          <ScrollView
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContent}
            showsVerticalScrollIndicator={false}
          >
            {categories.map((item) => {
              const currentValue =
                item.plannedAmount ?? 0;

              const maximum =
                draftMaximums[item.category] ??
                getAdaptiveGoalScaleMax(
                  item.plannedAmount,
                  data.spendingLimit
                );

              return (
                <CategoryGoalControl
                  key={item.category}
                  category={item.category}
                  value={currentValue}
                  maximum={maximum}
                  formatMoney={formatMoney}
                  onChange={(value) =>
                    updateCategoryGoal(
                      item.category,
                      value
                    )
                  }
                />
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Ajuste as metas sem alterar seus lançamentos.
            </Text>

            <View style={styles.footerActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                activeOpacity={0.78}
                accessibilityRole="button"
              >
                <Text style={styles.cancelButtonText}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveDraft}
                activeOpacity={0.78}
                accessibilityRole="button"
              >
                <Text style={styles.saveButtonText}>
                  Salvar metas
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.42)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalBox: {
    width: "95%",
    maxWidth: 680,
    height: "92%",
    backgroundColor: MONTHLY_PLAN_COLORS.surface,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: MONTHLY_PLAN_COLORS.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: MONTHLY_PLAN_COLORS.brand,
    fontSize: 19,
    fontWeight: "900",
  },
  subtitle: {
    color: MONTHLY_PLAN_COLORS.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  closeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: MONTHLY_PLAN_COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: MONTHLY_PLAN_COLORS.border,
  },
  closeText: {
    color: MONTHLY_PLAN_COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },
  summaryCard: {
    borderRadius: 20,
    padding: 15,
    gap: 13,
    backgroundColor: MONTHLY_PLAN_COLORS.brandSoft,
    borderWidth: 1,
    borderColor: MONTHLY_PLAN_COLORS.border,
  },
  summaryCardOverLimit: {
    backgroundColor: "#FFF5F5",
    borderColor: "#F2CACA",
  },
  summaryTopRow: {
    flexDirection: "row",
    gap: 12,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    color: MONTHLY_PLAN_COLORS.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  summaryValue: {
    color: MONTHLY_PLAN_COLORS.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
  },
  distributionRow: {
    gap: 3,
  },
  distributionPercentage: {
    color: MONTHLY_PLAN_COLORS.brand,
    fontSize: 16,
    fontWeight: "900",
  },
  distributionDescription: {
    color: MONTHLY_PLAN_COLORS.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  dangerText: {
    color: MONTHLY_PLAN_COLORS.red,
  },
  sectionTitle: {
    color: MONTHLY_PLAN_COLORS.text,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 17,
    marginBottom: 9,
  },
  categoryScroll: {
    flex: 1,
  },
  categoryContent: {
    gap: 9,
    paddingBottom: 8,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: MONTHLY_PLAN_COLORS.border,
    padding: 12,
    backgroundColor: MONTHLY_PLAN_COLORS.surfaceSoft,
  },
  categoryIdentity: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: MONTHLY_PLAN_COLORS.brandSoft,
  },
  categoryText: {
    flex: 1,
  },
  categoryName: {
    color: MONTHLY_PLAN_COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },
  categoryHint: {
    color: MONTHLY_PLAN_COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  categoryValueBox: {
    minWidth: 92,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 7,
  },
  categoryValue: {
    color: MONTHLY_PLAN_COLORS.text,
    fontSize: 13,
    fontWeight: "900",
    textAlign: "right",
  },
  categoryValueEmpty: {
    color: MONTHLY_PLAN_COLORS.brand,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: MONTHLY_PLAN_COLORS.border,
    paddingTop: 12,
    marginTop: 10,
    gap: 10,
  },
  footerText: {
    color: MONTHLY_PLAN_COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  footerActions: {
    flexDirection: "row",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 13,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: MONTHLY_PLAN_COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: MONTHLY_PLAN_COLORS.border,
  },
  cancelButtonText: {
    color: MONTHLY_PLAN_COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },
  saveButton: {
    flex: 1.4,
    borderRadius: 13,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: MONTHLY_PLAN_COLORS.brand,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
});
