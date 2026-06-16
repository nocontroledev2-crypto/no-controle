import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Expense, getAllExpenses } from "../storage/expenseStorage";

type Period =
  | "today"
  | "week"
  | "weekPrev"
  | "month"
  | "monthPrev"
  | "year"
  | "lastYear"
  | "all"
  | "custom";

const CATEGORY_OPTIONS = [
  "Todas",
  "Alimentação",
  "Transporte",
  "Moradia",
  "Contas",
  "Assinaturas",
  "Saúde",
  "Serviços",
  "Cartão de crédito",
  "Outros",
];

export default function Historico() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [period, setPeriod] = useState<Period>("all");

  const [menuPeriodoAberto, setMenuPeriodoAberto] = useState(false);
  const [menuCategoriaAberto, setMenuCategoriaAberto] = useState(false);

  const [categoriaSelecionada, setCategoriaSelecionada] = useState("Todas");

  const [showCalendar, setShowCalendar] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectingStart, setSelectingStart] = useState(true);

  const now = new Date();

  /* ===============================
     HELPERS
  =============================== */

  function parseDateSafe(dateStr: string) {
    const [ano, mes, dia] = dateStr.split("-");
    return new Date(Number(ano), Number(mes) - 1, Number(dia));
  }

  function formatMoney(valor: number) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatDateBR(dateStr: string) {
    const d = parseDateSafe(dateStr);
    return d.toLocaleDateString("pt-BR");
  }

  function formatCustomDate(date: Date | null) {
    if (!date) return "--/--/----";
    return date.toLocaleDateString("pt-BR");
  }

  function getStartOfWeek(date: Date) {
    const d = new Date(date);
    const day = d.getDay(); // domingo = 0 ... sábado = 6
    const diff = day === 0 ? -6 : 1 - day; // semana começa na segunda
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function getEndOfWeek(date: Date) {
    const start = getStartOfWeek(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  function labelPeriod(p: Period) {
    switch (p) {
      case "today":
        return "Hoje";
      case "week":
        return "Esta semana";
      case "weekPrev":
        return "Semana passada";
      case "month":
        return "Este mês";
      case "monthPrev":
        return "Mês passado";
      case "year":
        return "Este ano";
      case "lastYear":
        return "Ano passado";
      case "all":
        return "Desde o início";
      case "custom":
        return "Personalizado";
    }
  }

  /* ===============================
     CARREGAR DADOS
  =============================== */

  useFocusEffect(
    useCallback(() => {
      async function loadExpenses() {
        const data = await getAllExpenses();

        const ordered = (data || []).sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        );

        setExpenses(ordered);
      }

      loadExpenses();
    }, [])
  );

  /* ===============================
     FILTRO POR PERÍODO
  =============================== */

  const periodFilteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const d = parseDateSafe(item.data);

      const dNormalized = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate()
      );

      if (period === "today") {
        return (
          d.getDate() === now.getDate() &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      }

      if (period === "week") {
        const start = getStartOfWeek(now);
        const end = getEndOfWeek(now);
        return dNormalized >= start && dNormalized <= end;
      }

      if (period === "weekPrev") {
        const ref = new Date(now);
        ref.setDate(ref.getDate() - 7);
        const start = getStartOfWeek(ref);
        const end = getEndOfWeek(ref);
        return dNormalized >= start && dNormalized <= end;
      }

      if (period === "month") {
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      }

      if (period === "monthPrev") {
        const prevMonthDate = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1
        );
        return (
          d.getMonth() === prevMonthDate.getMonth() &&
          d.getFullYear() === prevMonthDate.getFullYear()
        );
      }

      if (period === "year") {
        return d.getFullYear() === now.getFullYear();
      }

      if (period === "lastYear") {
        return d.getFullYear() === now.getFullYear() - 1;
      }

      if (period === "all") {
        return true;
      }

      if (period === "custom") {
        if (!startDate || !endDate) return false;

        const start = new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate(),
          0,
          0,
          0,
          0
        );

        const end = new Date(
          endDate.getFullYear(),
          endDate.getMonth(),
          endDate.getDate(),
          23,
          59,
          59,
          999
        );

        return dNormalized >= start && dNormalized <= end;
      }

      return false;
    });
  }, [expenses, period, startDate, endDate]);

  /* ===============================
     FILTRO POR CATEGORIA (FASE 1)
  =============================== */

  const filteredExpenses = useMemo(() => {
    if (categoriaSelecionada === "Todas") {
      return periodFilteredExpenses;
    }

    return periodFilteredExpenses.filter(
      (item) => item.categoria === categoriaSelecionada
    );
  }, [periodFilteredExpenses, categoriaSelecionada]);

  /* ===============================
     AGRUPAR POR DATA
  =============================== */

  const groupedByDate = useMemo(() => {
    const groups: Record<string, Expense[]> = {};

    filteredExpenses.forEach((item) => {
      if (!groups[item.data]) {
        groups[item.data] = [];
      }
      groups[item.data].push(item);
    });

    const orderedDates = Object.keys(groups).sort((a, b) => {
      return parseDateSafe(b).getTime() - parseDateSafe(a).getTime();
    });

    return orderedDates.map((date) => ({
      date,
      items: groups[date],
    }));
  }, [filteredExpenses]);

  /* ===============================
     RESUMO RÁPIDO DO PERÍODO FILTRADO
  =============================== */

  const totalPeriodo = filteredExpenses.reduce(
    (sum, e) => sum + Number(e.valor),
    0
  );

  /* ===============================
     RENDER
  =============================== */

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Histórico</Text>

      {/* ✅ CONTROLES */}
      <View style={styles.controlsRow}>
        {/* PERIODOS */}
        <View style={styles.controlBlock}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => {
              setMenuPeriodoAberto(!menuPeriodoAberto);
              setMenuCategoriaAberto(false);
            }}
          >
            <Text style={styles.controlText}>
              📅 {labelPeriod(period)}
            </Text>
          </TouchableOpacity>

          {menuPeriodoAberto && (
            <View style={styles.menu}>
              {[
                ["Hoje", "today"],
                ["Esta semana", "week"],
                ["Semana passada", "weekPrev"],
                ["Este mês", "month"],
                ["Mês passado", "monthPrev"],
                ["Este ano", "year"],
                ["Ano passado", "lastYear"],
                ["Desde o início", "all"],
                ["Personalizado", "custom"],
              ].map(([label, value]) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => {
                    if (value === "custom") {
                      setMenuPeriodoAberto(false);
                      setStartDate(null);
                      setEndDate(null);
                      setSelectingStart(true);

                      setTimeout(() => {
                        setShowCalendar(true);
                      }, 100);
                    } else {
                      setPeriod(value as Period);
                      setMenuPeriodoAberto(false);
                    }
                  }}
                >
                  <Text style={styles.menuItem}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* CATEGORIAS */}
        <View style={styles.controlBlock}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => {
              setMenuCategoriaAberto(!menuCategoriaAberto);
              setMenuPeriodoAberto(false);
            }}
          >
            <Text style={styles.controlText}>
              🏷️ {categoriaSelecionada}
            </Text>
          </TouchableOpacity>

          {menuCategoriaAberto && (
            <View style={styles.menu}>
              {CATEGORY_OPTIONS.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => {
                    setCategoriaSelecionada(cat);
                    setMenuCategoriaAberto(false);
                  }}
                >
                  <Text style={styles.menuItem}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* ✅ intervalo custom selecionado */}
      {period === "custom" && startDate && endDate && (
        <>
          <Text style={styles.customPeriodText}>
            Início: {formatCustomDate(startDate)}
          </Text>
          <Text style={styles.customPeriodText}>
            Fim: {formatCustomDate(endDate)}
          </Text>
        </>
      )}

      {/* ✅ seletor data custom (fallback web) */}
      {showCalendar && (
        <View style={styles.calendarBox}>
          <Text style={styles.calendarLabel}>
            {selectingStart
              ? "Selecione a data inicial"
              : "Selecione a data final"}
          </Text>

          {startDate && (
            <Text style={styles.calendarInfo}>
              Início: {formatCustomDate(startDate)}
            </Text>
          )}

          {endDate && (
            <Text style={styles.calendarInfo}>
              Fim: {formatCustomDate(endDate)}
            </Text>
          )}

          <input
            type="date"
            value=""
            onChange={(e: any) => {
              const selected = parseDateSafe(e.target.value);

              if (selectingStart) {
                setStartDate(selected);
                setSelectingStart(false);
              } else {
                setEndDate(selected);
                setShowCalendar(false);
                setPeriod("custom");
              }
            }}
          />
        </View>
      )}

      {/* ✅ resumo do filtro */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total no período</Text>
        <Text style={styles.summaryValue}>
          {formatMoney(totalPeriodo)}
        </Text>
        <Text style={styles.summarySubText}>
          {filteredExpenses.length}{" "}
          {filteredExpenses.length === 1 ? "registro" : "registros"}
        </Text>
      </View>

      {/* ✅ lista */}
      {groupedByDate.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            Nenhum registro encontrado neste filtro.
          </Text>
          <Text style={styles.subEmptyText}>
            Tente outro período ou outra categoria.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {groupedByDate.map((group) => (
            <View key={group.date} style={styles.groupBox}>
              <Text style={styles.groupTitle}>
                {formatDateBR(group.date)}
              </Text>

              {group.items.map((item) => (
                <View key={item.id} style={styles.card}>
                  <Text style={styles.value}>
                    {formatMoney(Number(item.valor))}
                  </Text>

                  <Text style={styles.category}>{item.categoria}</Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

/* ===============================
   ESTILOS
=============================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    padding: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    color: "#0A8F55",
    marginBottom: 10,
  },

  controlsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },

  controlBlock: {
    flex: 1,
  },

  controlButton: {
    alignItems: "center",
    paddingVertical: 6,
  },

  controlText: {
    color: "#555",
    fontSize: 13,
  },

  customPeriodText: {
    textAlign: "center",
    color: "#666",
    fontSize: 13,
    marginBottom: 2,
  },

  menu: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 10,
    marginTop: 6,
    borderWidth: 0.5,
    borderColor: "#eee",
    elevation: 4,
    zIndex: 10,
  },

  menuItem: {
    paddingVertical: 8,
    color: "#333",
    fontSize: 14,
  },

  calendarBox: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#eee",
  },

  calendarLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },

  calendarInfo: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },

  summaryCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: "#eee",
  },

  summaryLabel: {
    fontSize: 13,
    color: "#666",
  },

  summaryValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0A8F55",
    marginTop: 4,
  },

  summarySubText: {
    marginTop: 6,
    fontSize: 12,
    color: "#777",
  },

  emptyBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },

  emptyText: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },

  subEmptyText: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
  },

  groupBox: {
    marginBottom: 16,
  },

  groupTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#555",
    marginBottom: 8,
  },

  card: {
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: "#eee",
  },

  value: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0A8F55",
  },

  category: {
    fontSize: 14,
    color: "#555",
    marginTop: 4,
  },
});