import { useFocusEffect } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { usePrivacy } from "../context/privacyContext";
import {
  CategoryPlanningModal,
  type CategoryPlanningSaveData,
} from "../components/monthly-plan/CategoryPlanningModal";
import {
  MonthlyPlanPreview,
  type SpendingLimitSaveStatus,
} from "../components/monthly-plan/MonthlyPlanPreview";
import { aggregateMonthlyPlanExpenses } from "../components/monthly-plan/expenseAggregation";
import {
  createEmptyMonthlyPlanData,
  getMonthlyPlanPeriodKey,
} from "../components/monthly-plan/monthlyPlanState";
import {
  shiftMonthlyPlanPeriod,
} from "../components/monthly-plan/periodNavigation";
import {
  getMonthlyPlanPeriodRelation,
} from "../components/monthly-plan/periodRelation";
import type {
  MonthlyPlanPreviewData,
} from "../components/monthly-plan/types";
import {
  getCurrentUser,
} from "../services/authService";
import { supabase } from "../lib/supabase";
import { Expense, getAllExpenses } from "../storage/expenseStorage";
import {
  loadMonthlyPlan,
  saveMonthlyPlan,
} from "../storage/monthlyPlanStorage";

function getUserMonthlyPlanPeriodKey(
  userId: string,
  year: number,
  month: number
) {
  return `${userId}:${getMonthlyPlanPeriodKey(
    year,
    month
  )}`;
}

export default function Simulador() {
  const { width } = useWindowDimensions();
  const isMobile = width < 480;

  const {
    ocultarValores,
    alternarPrivacidade,
    formatarValorVisivel,
    formatarPercentualVisivel,
  } = usePrivacy();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showCategoryPlanningModal, setShowCategoryPlanningModal] =
    useState(false);

  const monthlyPlanSessionRef = useRef<
    Record<string, MonthlyPlanPreviewData>
  >({});

  const monthlyPlanLoadedPeriodsRef =
    useRef<Set<string>>(new Set());

  const monthlyPlanLoadRequestRef =
    useRef(0);

  const spendingLimitSaveRequestRef =
    useRef(0);

  const spendingLimitSavingRef =
    useRef(false);

  const spendingLimitSavedTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const [spendingLimitSaveStatus, setSpendingLimitSaveStatus] =
    useState<SpendingLimitSaveStatus>("idle");

  const activeUserIdRef =
    useRef<string | null>(null);

  const [activeUserId, setActiveUserId] =
    useState<string | null>(null);

  const [monthlyPlanData, setMonthlyPlanData] =
    useState<MonthlyPlanPreviewData>(() => {
      const currentDate = new Date();

      return createEmptyMonthlyPlanData(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1
      );
    });

  useEffect(() => {
    return () => {
      if (
        spendingLimitSavedTimerRef.current
      ) {
        clearTimeout(
          spendingLimitSavedTimerRef.current
        );
      }
    };
  }, []);

  useEffect(() => {
    let active = true;

    function applyAuthenticatedUser(
      nextUserId: string | null
    ) {
      if (
        !active ||
        activeUserIdRef.current === nextUserId
      ) {
        return;
      }

      activeUserIdRef.current =
        nextUserId;

      monthlyPlanLoadRequestRef.current += 1;
      spendingLimitSaveRequestRef.current += 1;
      monthlyPlanSessionRef.current = {};
      monthlyPlanLoadedPeriodsRef.current.clear();

      if (
        spendingLimitSavedTimerRef.current
      ) {
        clearTimeout(
          spendingLimitSavedTimerRef.current
        );
        spendingLimitSavedTimerRef.current =
          null;
      }

      setSpendingLimitSaveStatus("idle");
      setShowCategoryPlanningModal(false);
      setExpenses([]);

      const currentDate = new Date();
      const emptyCurrentPlan =
        createEmptyMonthlyPlanData(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1
        );

      setMonthlyPlanData(
        emptyCurrentPlan
      );

      setActiveUserId(
        nextUserId
      );
    }

    void getCurrentUser()
      .then((user) => {
        applyAuthenticatedUser(
          user?.id ?? null
        );
      })
      .catch((error) => {
        console.error(
          "Erro ao identificar usuario do planejamento:",
          error
        );

        applyAuthenticatedUser(null);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        applyAuthenticatedUser(
          session?.user?.id ?? null
        );
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!activeUserId) {
      return;
    }

    const loadingUserId =
      activeUserId;

    const year = monthlyPlanData.year;
    const month = monthlyPlanData.month;

    const periodKey =
      getUserMonthlyPlanPeriodKey(
        loadingUserId,
        year,
        month
      );

    if (
      monthlyPlanLoadedPeriodsRef.current.has(
        periodKey
      )
    ) {
      return;
    }

    const requestId =
      monthlyPlanLoadRequestRef.current + 1;

    monthlyPlanLoadRequestRef.current =
      requestId;

    let cancelled = false;

    async function loadPersistedPlan() {
      const result =
        await loadMonthlyPlan(
          year,
          month
        );

      if (
        cancelled ||
        requestId !==
          monthlyPlanLoadRequestRef.current ||
        activeUserIdRef.current !==
          loadingUserId
      ) {
        return;
      }

      if (result.status === "error") {
        console.error(
          "Erro ao carregar planejamento mensal:",
          result.message
        );
        return;
      }

      monthlyPlanLoadedPeriodsRef.current.add(
        periodKey
      );

      if (result.status === "not-found") {
        return;
      }

      const plannedAmounts = new Map(
        result.plan.goals.map(
          (goal) => [
            goal.category,
            goal.plannedAmount,
          ]
        )
      );

      const persistedData =
        createEmptyMonthlyPlanData(
          result.plan.year,
          result.plan.month
        );

      persistedData.status =
        result.plan.status;

      persistedData.spendingLimit =
        result.plan.spendingLimit;

      persistedData.categories =
        persistedData.categories.map(
          (category) => ({
            ...category,
            plannedAmount:
              plannedAmounts.get(
                category.category
              ) ?? null,
          })
        );

      monthlyPlanSessionRef.current[
        periodKey
      ] = persistedData;

      setMonthlyPlanData((current) => {
        const currentKey =
          getUserMonthlyPlanPeriodKey(
            loadingUserId,
            current.year,
            current.month
          );

        if (currentKey !== periodKey) {
          return current;
        }

        return persistedData;
      });
    }

    void loadPersistedPlan();

    return () => {
      cancelled = true;
    };
  }, [
    activeUserId,
    monthlyPlanData.year,
    monthlyPlanData.month,
  ]);

  const monthlyPlanPreviewData = useMemo(() => {
    const aggregation =
      aggregateMonthlyPlanExpenses({
        expenses,
        year: monthlyPlanData.year,
        month: monthlyPlanData.month,
        today: new Date(),
        categories: monthlyPlanData.categories,
      });

    return {
      ...monthlyPlanData,
      realizedAmount: aggregation.realizedAmount,
      scheduledAmount: aggregation.scheduledAmount,
      categories: aggregation.categories,
    };
  }, [expenses, monthlyPlanData]);

  const now = new Date();

  const monthlyPlanPeriodRelation =
    getMonthlyPlanPeriodRelation(
      {
        year: monthlyPlanData.year,
        month: monthlyPlanData.month,
      },
      {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      }
    );

  const isPastMonthlyPlan =
    monthlyPlanPeriodRelation === "past";

  function openCategoryPlanning() {
    if (isPastMonthlyPlan) {
      alert(
        "Planejamento bloqueado\n\nAs metas dos meses encerrados não podem ser alteradas.\n\nUse o mês atual ou os meses futuros para criar ou revisar seus planejamentos."
      );
      return;
    }

    setShowCategoryPlanningModal(true);
  }

  function navigateMonthlyPlanPeriod(
    offset: number
  ) {
    if (!activeUserId) {
      return;
    }

    spendingLimitSaveRequestRef.current += 1;

    if (
      spendingLimitSavedTimerRef.current
    ) {
      clearTimeout(
        spendingLimitSavedTimerRef.current
      );
      spendingLimitSavedTimerRef.current =
        null;
    }

    setSpendingLimitSaveStatus("idle");

    setMonthlyPlanData((current) => {
      const currentKey =
        getUserMonthlyPlanPeriodKey(
          activeUserId,
          current.year,
          current.month
        );

      monthlyPlanSessionRef.current[currentKey] =
        current;

      const nextPeriod =
        shiftMonthlyPlanPeriod(
          {
            year: current.year,
            month: current.month,
          },
          offset
        );

      const nextKey =
        getUserMonthlyPlanPeriodKey(
          activeUserId,
          nextPeriod.year,
          nextPeriod.month
        );

      const savedPlan =
        monthlyPlanSessionRef.current[nextKey];

      if (savedPlan) {
        return savedPlan;
      }

      const emptyPlan =
        createEmptyMonthlyPlanData(
          nextPeriod.year,
          nextPeriod.month
        );

      monthlyPlanSessionRef.current[nextKey] =
        emptyPlan;

      return emptyPlan;
    });
  }

  async function saveSpendingLimit(
    completedValue: number
  ) {
    if (
      !activeUserId ||
      isPastMonthlyPlan ||
      spendingLimitSavingRef.current
    ) {
      return;
    }

    const savingUserId =
      activeUserId;

    const sourcePlan = {
      ...monthlyPlanData,
      spendingLimit: completedValue,
      categories:
        monthlyPlanData.categories.map(
          (category) => ({
            ...category,
          })
        ),
    };

    const periodKey =
      getUserMonthlyPlanPeriodKey(
        savingUserId,
        sourcePlan.year,
        sourcePlan.month
      );

    const confirmedPlan =
      monthlyPlanSessionRef.current[
        periodKey
      ];

    const requestId =
      spendingLimitSaveRequestRef.current + 1;

    spendingLimitSaveRequestRef.current =
      requestId;

    spendingLimitSavingRef.current =
      true;

    if (
      spendingLimitSavedTimerRef.current
    ) {
      clearTimeout(
        spendingLimitSavedTimerRef.current
      );
      spendingLimitSavedTimerRef.current =
        null;
    }

    setSpendingLimitSaveStatus(
      "saving"
    );

    try {
      const savedPlan =
        await saveMonthlyPlan({
          year: sourcePlan.year,
          month: sourcePlan.month,
          spendingLimit:
            completedValue,
          status:
            sourcePlan.status,
          goals: sourcePlan.categories
            .filter(
              (item) =>
                item.plannedAmount !== null &&
                item.plannedAmount > 0
            )
            .map((item) => ({
              category:
                item.category,
              plannedAmount:
                item.plannedAmount as number,
            })),
        });

      if (
        requestId !==
          spendingLimitSaveRequestRef.current ||
        activeUserIdRef.current !==
          savingUserId
      ) {
        return;
      }

      const currentPeriodKey =
        getUserMonthlyPlanPeriodKey(
          savingUserId,
          monthlyPlanData.year,
          monthlyPlanData.month
        );

      if (
        currentPeriodKey !==
        periodKey
      ) {
        return;
      }

      const savedGoals = new Map(
        savedPlan.goals.map(
          (goal) => [
            goal.category,
            goal.plannedAmount,
          ]
        )
      );

      const persistedData =
        createEmptyMonthlyPlanData(
          savedPlan.year,
          savedPlan.month
        );

      persistedData.status =
        savedPlan.status;

      persistedData.spendingLimit =
        savedPlan.spendingLimit;

      persistedData.categories =
        persistedData.categories.map(
          (category) => ({
            ...category,
            plannedAmount:
              savedGoals.get(
                category.category
              ) ?? null,
          })
        );

      monthlyPlanSessionRef.current[
        periodKey
      ] = persistedData;

      monthlyPlanLoadedPeriodsRef.current.add(
        periodKey
      );

      setMonthlyPlanData(
        persistedData
      );

      setSpendingLimitSaveStatus(
        "saved"
      );

      spendingLimitSavedTimerRef.current =
        setTimeout(() => {
          setSpendingLimitSaveStatus(
            "idle"
          );

          spendingLimitSavedTimerRef.current =
            null;
        }, 2000);
    } catch (error) {
      console.error(
        "Erro ao salvar limite global:",
        error
      );

      if (
        requestId !==
          spendingLimitSaveRequestRef.current ||
        activeUserIdRef.current !==
          savingUserId
      ) {
        return;
      }

      if (confirmedPlan) {
        setMonthlyPlanData(
          confirmedPlan
        );
      } else {
        setMonthlyPlanData(
          (current) => ({
            ...current,
            spendingLimit: 0,
          })
        );
      }

      setSpendingLimitSaveStatus(
        "error"
      );
    } finally {
      spendingLimitSavingRef.current =
        false;
    }
  }

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        if (!activeUserId) {
          setExpenses([]);
          return;
        }

        const data = await getAllExpenses();

        if (
          !active ||
          activeUserIdRef.current !==
            activeUserId
        ) {
          return;
        }

        const normalizedData = (data || []).map((item: any) => {
          const safeValue = Number(item.valor);

          return {
            ...item,
            valor: Number.isFinite(safeValue)
              ? safeValue
              : 0,
          };
        });

        setExpenses(normalizedData);
      }

      void load();

      return () => {
        active = false;
      };
    }, [activeUserId])
  );



  return (
    <View style={[styles.container, isMobile && styles.containerMobile]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Simulador</Text>

          <TouchableOpacity
            style={styles.eyeButtonContainer}
            onPress={alternarPrivacidade}
            accessibilityRole="button"
            accessibilityLabel={
              ocultarValores
                ? "Mostrar dados financeiros"
                : "Ocultar dados financeiros"
            }
          >
            <Text style={styles.eyeButton}>
              {ocultarValores ? "🙈" : "👁️"}
            </Text>
          </TouchableOpacity>
        </View>

        <MonthlyPlanPreview
          key={`${monthlyPlanPreviewData.year}-${monthlyPlanPreviewData.month}`}
          data={monthlyPlanPreviewData}
          formatMoney={formatarValorVisivel}
          formatPercentage={formatarPercentualVisivel}
          onPlanCategories={
            openCategoryPlanning
          }
          onPreviousMonth={() =>
            navigateMonthlyPlanPeriod(-1)
          }
          onNextMonth={() =>
            navigateMonthlyPlanPeriod(1)
          }
          isSpendingLimitReadOnly={
            isPastMonthlyPlan ||
            spendingLimitSaveStatus ===
              "saving"
          }
          isHistoricalPeriod={
            isPastMonthlyPlan
          }
          spendingLimitSaveStatus={
            spendingLimitSaveStatus
          }
          onSpendingLimitChange={(value) => {
            setSpendingLimitSaveStatus(
              "idle"
            );

            setMonthlyPlanData((current) => ({
              ...current,
              spendingLimit: value,
            }));
          }}
          onSpendingLimitChangeComplete={
            saveSpendingLimit
          }
        />

        <CategoryPlanningModal
          visible={showCategoryPlanningModal}
          data={monthlyPlanPreviewData}
          expenses={expenses}
          formatMoney={formatarValorVisivel}
          formatPercentage={formatarPercentualVisivel}
          onClose={() =>
            setShowCategoryPlanningModal(false)
          }
          onSave={async (
            value: CategoryPlanningSaveData
          ) => {
            if (!activeUserId) {
              throw new Error(
                "Entre novamente na sua conta para salvar as metas."
              );
            }

            const savingUserId =
              activeUserId;

            const periodKey =
              getUserMonthlyPlanPeriodKey(
                savingUserId,
                monthlyPlanData.year,
                monthlyPlanData.month
              );

            const savedPlan =
              await saveMonthlyPlan({
                year: monthlyPlanData.year,
                month: monthlyPlanData.month,
                spendingLimit:
                  value.spendingLimit,
                status:
                  monthlyPlanData.status,
                goals: value.categories
                  .filter(
                    (item) =>
                      item.plannedAmount !== null &&
                      item.plannedAmount > 0
                  )
                  .map((item) => ({
                    category:
                      item.category,
                    plannedAmount:
                      item.plannedAmount as number,
                  })),
              });

            if (
              activeUserIdRef.current !==
              savingUserId
            ) {
              throw new Error(
                "A conta mudou durante o salvamento. Abra o planejamento novamente."
              );
            }

            const savedGoals = new Map(
              savedPlan.goals.map(
                (goal) => [
                  goal.category,
                  goal.plannedAmount,
                ]
              )
            );

            const persistedData =
              createEmptyMonthlyPlanData(
                savedPlan.year,
                savedPlan.month
              );

            persistedData.status =
              savedPlan.status;

            persistedData.spendingLimit =
              savedPlan.spendingLimit;

            persistedData.categories =
              persistedData.categories.map(
                (category) => ({
                  ...category,
                  plannedAmount:
                    savedGoals.get(
                      category.category
                    ) ?? null,
                })
              );

            monthlyPlanSessionRef.current[
              periodKey
            ] = persistedData;

            monthlyPlanLoadedPeriodsRef.current.add(
              periodKey
            );

            setMonthlyPlanData((current) => {
              const currentKey =
                getUserMonthlyPlanPeriodKey(
                  savingUserId,
                  current.year,
                  current.month
                );

              if (currentKey !== periodKey) {
                return current;
              }

              return persistedData;
            });
          }}
        />

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  containerMobile: {
    paddingHorizontal: 12,
    paddingTop: 14,
  },

  scrollContent: {
    paddingBottom: 90,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 14,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0A8F55",
    textAlign: "center",
  },

  eyeButtonContainer: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  eyeButton: {
    fontSize: 22,
    lineHeight: 28,
    textAlign: "center",
  },
});
