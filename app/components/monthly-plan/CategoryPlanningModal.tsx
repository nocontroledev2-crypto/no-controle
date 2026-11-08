import { Ionicons } from "@expo/vector-icons";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import {
  calculateMonthlyPlanSummary,
  completeCategoriesForPlanning,
} from "./calculations";
import { CategoryGoalControl } from "./CategoryGoalControl";
import {
  HistoricalPlanReference,
} from "./HistoricalPlanReference";
import {
  getAdaptiveGoalScaleMax,
  getExpandedGoalScaleMax,
} from "./goalScale";
import type {
  Expense,
} from "../../storage/expenseStorage";
import type {
  MonthlyPlanCategory,
  MonthlyPlanPreviewData,
} from "./types";
import { MONTHLY_PLAN_COLORS } from "./visualTokens";

export type CategoryPlanningSaveData = {
  spendingLimit: number;
  categories: MonthlyPlanCategory[];
};

type CategoryPlanningModalProps = {
  visible: boolean;
  data: MonthlyPlanPreviewData;
  expenses: Expense[];
  formatMoney: (value: number) => string;
  onClose: () => void;
  onSave?: (
    value: CategoryPlanningSaveData
  ) => Promise<void>;
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
  expenses,
  formatMoney,
  onClose,
  onSave,
}: CategoryPlanningModalProps) {
  const { width } = useWindowDimensions();
  const isWideModal = width >= 760;

  const [draftCategories, setDraftCategories] =
    useState<MonthlyPlanCategory[]>(() =>
      completeCategoriesForPlanning(
        data.categories
      )
    );

  const [
    draftSpendingLimit,
    setDraftSpendingLimit,
  ] = useState(data.spendingLimit);

  const [isSaving, setIsSaving] =
    useState(false);

  const savingRef =
    useRef(false);

  const [saveError, setSaveError] =
    useState("");

  const [draftMaximums, setDraftMaximums] =
    useState<Record<string, number>>(() =>
      Object.fromEntries(
        completeCategoriesForPlanning(
          data.categories
        ).map((item) => [
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

    savingRef.current = false;
    setIsSaving(false);
    setSaveError("");

    const planningCategories =
      completeCategoriesForPlanning(
        data.categories
      );

    setDraftCategories(
      planningCategories.map(
        (item) => ({ ...item })
      )
    );

    setDraftSpendingLimit(
      data.spendingLimit
    );

    setDraftMaximums(
      Object.fromEntries(
        planningCategories.map((item) => [
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
      spendingLimit: draftSpendingLimit,
      categories: draftCategories,
    }),
    [
      data,
      draftCategories,
      draftSpendingLimit,
    ]
  );

  const summary = useMemo(
    () => calculateMonthlyPlanSummary(draftData),
    [draftData]
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

  function expandCategoryScale(
    category: string
  ) {
    setDraftMaximums((current) => {
      const currentMaximum =
        current[category];

      if (!currentMaximum) {
        return current;
      }

      const expandedMaximum =
        getExpandedGoalScaleMax(
          currentMaximum
        );

      if (
        expandedMaximum <= currentMaximum
      ) {
        return current;
      }

      return {
        ...current,
        [category]: expandedMaximum,
      };
    });
  }

  function applyHistoricalPreview(
    preview: MonthlyPlanPreviewData
  ) {
    const previewCategories =
      completeCategoriesForPlanning(
        preview.categories
      ).map((item) => ({ ...item }));

    setDraftSpendingLimit(
      preview.spendingLimit
    );

    setDraftCategories(
      previewCategories
    );

    setDraftMaximums(
      Object.fromEntries(
        previewCategories.map((item) => [
          item.category,
          getAdaptiveGoalScaleMax(
            item.plannedAmount,
            preview.spendingLimit
          ),
        ])
      )
    );
  }

  async function saveDraft() {
    if (
      savingRef.current ||
      isSaving ||
      !onSave
    ) {
      return;
    }

    savingRef.current = true;
    setIsSaving(true);
    setSaveError("");

    try {
      await onSave({
        spendingLimit: draftSpendingLimit,
        categories: draftCategories.map(
          (item) => ({ ...item })
        ),
      });

      onClose();
    } catch (error) {
      console.error(
        "Erro ao salvar planejamento mensal:",
        error
      );

      setSaveError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar as metas. Tente novamente."
      );
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }

  function closeModal() {
    if (
      savingRef.current ||
      isSaving
    ) {
      return;
    }

    onClose();
  }

  const monthName =
    MONTH_NAMES[data.month - 1] ?? "Mês selecionado";

  const distributedPercentage =
    summary.distributedPercentage;

  const hasSpendingLimit =
    distributedPercentage !== null;

  const isOverLimit =
    hasSpendingLimit &&
    summary.undistributed < 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={closeModal}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalBox,
            isWideModal && styles.modalBoxWide,
          ]}
        >
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
              onPress={closeModal}
              disabled={isSaving}
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
                  {formatMoney(draftSpendingLimit)}
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
                {hasSpendingLimit
                  ? `${distributedPercentage}% distribuído`
                  : "Limite ainda não definido"}
              </Text>

              <Text
                style={[
                  styles.distributionDescription,
                  isOverLimit && styles.dangerText,
                ]}
              >
                {!hasSpendingLimit
                  ? `${formatMoney(
                      summary.totalPlanned
                    )} em metas aguardando um limite mensal`
                  : isOverLimit
                  ? `${formatMoney(
                      Math.abs(summary.undistributed)
                    )} acima do limite`
                  : `${formatMoney(
                      summary.undistributed
                    )} ainda não distribuídos`}
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator
          >
            {visible ? (
              <HistoricalPlanReference
                key={`${data.year}-${data.month}`}
                year={data.year}
                month={data.month}
                expenses={expenses}
                formatMoney={formatMoney}
                onApply={applyHistoricalPreview}
              />
            ) : null}

            <Text style={styles.sectionTitle}>
              Metas das categorias
            </Text>

            <View style={styles.categoryGrid}>
              {draftCategories.map((item) => {
                const currentValue =
                  item.plannedAmount ?? 0;

                const maximum =
                  draftMaximums[item.category] ??
                  getAdaptiveGoalScaleMax(
                    item.plannedAmount,
                    data.spendingLimit
                  );

                return (
                  <View
                    key={item.category}
                    style={[
                      styles.categoryItem,
                      isWideModal &&
                        styles.categoryItemWide,
                    ]}
                  >
                    <CategoryGoalControl
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
                      onRequestExpand={() =>
                        expandCategoryScale(
                          item.category
                        )
                      }
                    />
                  </View>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Ajuste as metas sem alterar seus lançamentos.
            </Text>

            {saveError ? (
              <Text
                style={styles.saveErrorText}
                accessibilityRole="alert"
              >
                {saveError}
              </Text>
            ) : null}

            <View style={styles.footerActions}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  isSaving && styles.buttonDisabled,
                ]}
                onPress={closeModal}
                disabled={isSaving}
                activeOpacity={0.78}
                accessibilityRole="button"
              >
                <Text style={styles.cancelButtonText}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isSaving && styles.buttonDisabled,
                ]}
                onPress={() => {
                  void saveDraft();
                }}
                disabled={isSaving}
                activeOpacity={0.78}
                accessibilityRole="button"
                accessibilityState={{
                  disabled: isSaving,
                  busy: isSaving,
                }}
              >
                <Text style={styles.saveButtonText}>
                  {isSaving
                    ? "Salvando..."
                    : "Salvar metas"}
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
    overflow: "hidden",
  },
  modalBoxWide: {
    maxWidth: 920,
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
    marginBottom: 9,
  },
  bodyScroll: {
    flex: 1,
    minHeight: 0,
  },
  bodyContent: {
    paddingTop: 14,
    paddingBottom: 8,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryItem: {
    width: "100%",
  },
  categoryItemWide: {
    width: "49%",
    flexGrow: 1,
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
  buttonDisabled: {
    opacity: 0.58,
  },
  saveErrorText: {
    color: MONTHLY_PLAN_COLORS.red,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
});
