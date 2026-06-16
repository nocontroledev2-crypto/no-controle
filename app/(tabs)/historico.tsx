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

  // ✅ NOVO fluxo do personalizado
  const [showCustomRangeBox, setShowCustomRangeBox] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");

  // ✅ expandir/recolher por dia
  const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>(
    {}
  );

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
      default:
        return "Desde o início";
    }
  }

  function toggleDateCollapse(date: string) {
    setCollapsedDates((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  }

  function isDateCollapsed(date: string) {
    return collapsedDates[date] ?? false;
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
  }, [expenses, period, startDate, endDate, now]);

  /* ===============================
     FILTRO POR CATEGORIA
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

    return orderedDates.map((date) => {
      const items = groups[date];
      const totalDia = items.reduce(
        (sum, item) => sum + Number(item.valor),
        0
      );
      const qtdLancamentos = items.length;

      return {
        date,
        items,
        totalDia,
        qtdLancamentos,
      };
    });
  }, [filteredExpenses]);

  /* ===============================
     CONTROLES GLOBAIS
  =============================== */

  function recolherTudo() {
    const novoEstado: Record<string, boolean> = {};
    groupedByDate.forEach((group) => {
      novoEstado[group.date] = true;
    });
    setCollapsedDates(novoEstado);
  }

  function expandirTudo() {
    const novoEstado: Record<string, boolean> = {};
    groupedByDate.forEach((group) => {
      novoEstado[group.date] = false;
    });
    setCollapsedDates(novoEstado);
  }

  /* ===============================
     PERSONALIZADO — NOVO FLUXO
  =============================== */

  function abrirPersonalizado() {
    setMenuPeriodoAberto(false);
    setStartDateInput("");
    setEndDateInput("");
    setShowCustomRangeBox(true);
  }

  function aplicarPeriodoPersonalizado() {
    if (!startDateInput || !endDateInput) {
      alert("Selecione a data inicial e a data final.");
      return;
    }

    const start = parseDateSafe(startDateInput);
    const end = parseDateSafe(endDateInput);

    if (start.getTime() > end.getTime()) {
      alert("A data inicial não pode ser maior que a data final.");
      return;
    }

    setStartDate(start);
    setEndDate(end);
    setPeriod("custom");
    setShowCustomRangeBox(false);
  }

  function cancelarPeriodoPersonalizado() {
    setShowCustomRangeBox(false);
    setStartDateInput("");
    setEndDateInput("");
  }

  /* ===============================
     RESUMO DO PERÍODO
  =============================== */

  const totalPeriodo = filteredExpenses.reduce(
    (sum, e) => sum + Number(e.valor),
    0
  );

  const mostrarResumoPorDia = period !== "today";

  const textoRegistrosResumo =
    filteredExpenses.length === 1
      ? "1 registro"
      : `${filteredExpenses.length} registros`;

  /* ===============================
     RENDER
  =============================== */

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Histórico</Text>

      {/* ✅ TOPO UNIFICADO */}
      <View style={styles.topControlsWrap}>
        {/* PERÍODO */}
        <View style={styles.topControlBlock}>
          <TouchableOpacity
            style={styles.topControlButton}
            onPress={() => {
              setMenuPeriodoAberto(!menuPeriodoAberto);
              setMenuCategoriaAberto(false);
            }}
          >
            <Text style={styles.topControlText}>
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
                      abrirPersonalizado();
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

        {/* CATEGORIA */}
        <View style={styles.topControlBlock}>
          <TouchableOpacity
            style={styles.topControlButton}
            onPress={() => {
              setMenuCategoriaAberto(!menuCategoriaAberto);
              setMenuPeriodoAberto(false);
            }}
          >
            <Text style={styles.topControlText}>
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

        {/* EXPANDIR TUDO */}
        <TouchableOpacity
          style={styles.topActionButton}
          onPress={expandirTudo}
        >
          <Text style={styles.topActionText}>▲ Expandir tudo</Text>
        </TouchableOpacity>

        {/* RECOLHER TUDO */}
        <TouchableOpacity
          style={styles.topActionButton}
          onPress={recolherTudo}
        >
          <Text style={styles.topActionText}>▼ Recolher tudo</Text>
        </TouchableOpacity>
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

      {/* ✅ NOVO BOX DO PERSONALIZADO */}
      {showCustomRangeBox && (
  <View style={styles.calendarBox}>
    <Text style={styles.calendarLabel}>
      Selecione o intervalo personalizado
    </Text>

    <View style={styles.customInputGroup}>
      <Text style={styles.calendarInfo}>Data inicial</Text>
      <input
        type="date"
        value={startDateInput}
        onChange={(e: any) => setStartDateInput(e.target.value)}
        style={
          {
            width: 220,
            maxWidth: "100%",
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid #D9DDE3",
            backgroundColor: "#FFF",
            color: "#333",
            fontSize: "14px",
            boxSizing: "border-box",
          } as any
        }
      />
    </View>

    <View style={styles.customInputGroup}>
      <Text style={styles.calendarInfo}>Data final</Text>
      <input
        type="date"
        value={endDateInput}
        onChange={(e: any) => setEndDateInput(e.target.value)}
        style={
          {
            width: 220,
            maxWidth: "100%",
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid #D9DDE3",
            backgroundColor: "#FFF",
            color: "#333",
            fontSize: "14px",
            boxSizing: "border-box",
          } as any
        }
      />
    </View>

    <View style={styles.customActionRow}>
      <TouchableOpacity
        style={styles.customActionButton}
        onPress={aplicarPeriodoPersonalizado}
      >
        <Text style={styles.customActionText}>Aplicar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.customActionButton}
        onPress={cancelarPeriodoPersonalizado}
      >
        <Text style={styles.customActionText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  </View>
)}

      {/* ✅ CARD RESUMO */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total no período</Text>

        <View style={styles.summaryInlineRow}>
          <Text style={styles.summaryValue}>
            {formatMoney(totalPeriodo)}
          </Text>

          <Text style={styles.summaryInlineMeta}>
            • {textoRegistrosResumo}
          </Text>
        </View>
      </View>

      {/* ✅ LISTA */}
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
          {groupedByDate.map((group) => {
            const collapsed = isDateCollapsed(group.date);

            return (
              <View key={group.date} style={styles.groupBox}>
                <TouchableOpacity
                  style={styles.groupHeader}
                  onPress={() => toggleDateCollapse(group.date)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.groupTitle}>
                    {formatDateBR(group.date)}
                  </Text>

                  <View style={styles.groupHeaderRight}>
                    {mostrarResumoPorDia && (
                      <Text style={styles.groupMeta}>
                        {formatMoney(group.totalDia)}
                        {group.qtdLancamentos > 1
                          ? ` • ${group.qtdLancamentos} registros`
                          : ""}
                      </Text>
                    )}

                    <Text style={styles.toggleIcon}>
                      {collapsed ? "▼" : "▲"}
                    </Text>
                  </View>
                </TouchableOpacity>

                {!collapsed &&
                  group.items.map((item) => (
                    <View key={item.id} style={styles.card}>
                      <Text style={styles.value}>
                        {formatMoney(Number(item.valor))}
                      </Text>

                      <Text style={styles.category}>{item.categoria}</Text>
                    </View>
                  ))}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

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

  topControlsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10,
  },

  topControlBlock: {
    flexGrow: 1,
    minWidth: 150,
  },

  topControlButton: {
    backgroundColor: "#FFF",
    borderWidth: 0.5,
    borderColor: "#eee",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
  },

  topControlText: {
    color: "#555",
    fontSize: 13,
    fontWeight: "600",
  },

  topActionButton: {
    backgroundColor: "#FFF",
    borderWidth: 0.5,
    borderColor: "#eee",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 140,
  },

  topActionText: {
    fontSize: 13,
    color: "#555",
    fontWeight: "600",
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
    alignItems: "flex-start",
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

  customActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  customActionButton: {
    backgroundColor: "#FFF",
    borderWidth: 0.5,
    borderColor: "#eee",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  customActionText: {
    fontSize: 13,
    color: "#555",
    fontWeight: "600",
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
    marginBottom: 6,
  },

  summaryInlineRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },

  summaryValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0A8F55",
  },

  summaryInlineMeta: {
    marginLeft: 8,
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

  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 8,
  },

  groupHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  groupTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#555",
  },

  groupMeta: {
    fontSize: 12,
    color: "#777",
    marginLeft: 10,
  },

  toggleIcon: {
    marginLeft: 8,
    fontSize: 12,
    color: "#666",
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

  customInputGroup: {
  width: "100%",
  marginBottom: 10,
},
});