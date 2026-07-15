import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions
} from "react-native";

import { MASTER_CATEGORIES } from "../constants/categories";
import {
  Expense,
  deleteExpense,
  getAllExpenses,
  updateExpense,
} from "../storage/expenseStorage";

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

type ViewMode = "lancamentos" | "categorias";

const CATEGORY_OPTIONS = ["Todas", ...MASTER_CATEGORIES];

export default function Historico() {
  
 const { width } = useWindowDimensions();
 const isMobile = width < 480;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [period, setPeriod] = useState<Period>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("lancamentos");

  const [menuPeriodoAberto, setMenuPeriodoAberto] = useState(false);
  const [menuCategoriaAberto, setMenuCategoriaAberto] = useState(false);

  const [categoriaSelecionada, setCategoriaSelecionada] = useState("Todas");

  const [showCustomRangeBox, setShowCustomRangeBox] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");

  const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>(
    {}
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValor, setEditValor] = useState("");
  const [editCategoria, setEditCategoria] = useState("");
  const [editData, setEditData] = useState("");
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<string | null>(
  null
);

  const [showReportModal, setShowReportModal] = useState(false);
  const now = new Date();

  /* ===============================
     HELPERS
  =============================== */

  function parseDateSafe(dateStr: string) {
    const [ano, mes, dia] = dateStr.split("-");
    return new Date(Number(ano), Number(mes) - 1, Number(dia));
  }

  function formatMoney(valor: number | null | undefined) {
    const safeValue = Number(valor);

    return (Number.isFinite(safeValue) ? safeValue : 0).toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    );
  }

  function formatDateBR(dateStr: string) {
    const d = parseDateSafe(dateStr);
    return d.toLocaleDateString("pt-BR");
  }

  function formatCustomDate(date: Date | null) {
    if (!date) return "--/--/----";
    return date.toLocaleDateString("pt-BR");
  }

  function parseValorMonetario(valorTexto: string) {
    if (!valorTexto) return NaN;

    let texto = valorTexto.trim().replace(/[R$\s]/g, "");

    if (!texto) return NaN;

    if (texto.includes(",")) {
      texto = texto.replace(/\./g, "").replace(",", ".");
    } else {
      const partes = texto.split(".");

      if (partes.length > 2) {
        const decimal = partes.pop();
        texto = partes.join("") + "." + decimal;
      } else if (
        partes.length === 2 &&
        partes[1].length === 3 &&
        partes[0].length <= 3
      ) {
        texto = partes.join("");
      }
    }

    return Number(texto);
  }

  function getStartOfWeek(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;

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

  async function loadExpenses() {
    const data = await getAllExpenses();

    const normalized = (data || []).map((item: any) => {
      const safeValue = Number(item.valor);

      return {
        ...item,
        valor: Number.isFinite(safeValue) ? safeValue : 0,
      };
    });

    const ordered = normalized.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setExpenses(ordered);
  }

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [])
  );

  /* ===============================
     EXCLUIR / EDITAR
  =============================== */

  async function excluirRegistro(item: Expense) {
    const mensagem = `Deseja excluir este lançamento?\n\n${formatMoney(
      item.valor
    )} — ${item.categoria}\nData: ${formatDateBR(item.data)}`;

    const confirmado =
      typeof window !== "undefined" ? window.confirm(mensagem) : true;

    if (!confirmado) return;

    await deleteExpense(item.id);
    await loadExpenses();
  }

  function iniciarEdicao(item: Expense) {
    setEditingId(item.id);
    setEditValor(String(item.valor).replace(".", ","));
    setEditCategoria(item.categoria);
    setEditData(item.data);
  }

  function cancelarEdicao() {
    setEditingId(null);
    setEditValor("");
    setEditCategoria("");
    setEditData("");
  }

  async function salvarEdicao(item: Expense) {
    const valorNumerico = parseValorMonetario(editValor);

    if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
      alert("Informe um valor válido para a despesa.");
      return;
    }

    if (!editCategoria) {
      alert("Selecione uma categoria.");
      return;
    }

    if (!editData) {
      alert("Informe uma data válida.");
      return;
    }

    await updateExpense({
  ...item,
  valor: Number(valorNumerico.toFixed(2)),
  categoria: editCategoria,
  subcategoria:
    editCategoria === item.categoria ? item.subcategoria ?? "" : "",
  termoEncontrado:
    editCategoria === item.categoria ? item.termoEncontrado ?? "" : "",
  data: editData,
});

    cancelarEdicao();
    await loadExpenses();
  }

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
        (sum, item) => sum + Number(item.valor || 0),
        0
      );

      return {
        date,
        items,
        totalDia,
        qtdLancamentos: items.length,
      };
    });
  }, [filteredExpenses]);

  /* ===============================
     AGRUPAR POR CATEGORIA
  =============================== */

  const totalPeriodoBase = periodFilteredExpenses.reduce(
    (sum, item) => sum + Number(item.valor || 0),
    0
  );

  const groupedByCategory = useMemo(() => {
    const groups: Record<
      string,
      {
        total: number;
        qtd: number;
      }
    > = {};

    filteredExpenses.forEach((item) => {
      if (!groups[item.categoria]) {
        groups[item.categoria] = {
          total: 0,
          qtd: 0,
        };
      }

      groups[item.categoria].total += Number(item.valor || 0);
      groups[item.categoria].qtd += 1;
    });

    return Object.entries(groups)
      .map(([categoria, info]) => {
        const percentual =
          totalPeriodoBase > 0 ? (info.total / totalPeriodoBase) * 100 : 0;

        return {
          categoria,
          total: info.total,
          qtd: info.qtd,
          percentual,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [filteredExpenses, totalPeriodoBase]);

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

  function abrirLancamentosDaCategoria(categoria: string) {
  setSelectedCategoryDetail(categoria);
  setMenuCategoriaAberto(false);
  setMenuPeriodoAberto(false);
}

function fecharDetalheCategoria() {
  setSelectedCategoryDetail(null);
}

useEffect(() => {
  if (!selectedCategoryDetail) return;
  if (typeof window === "undefined") return;

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      fecharDetalheCategoria();
    }
  }

  window.addEventListener("keydown", handleKeyDown);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}, [selectedCategoryDetail]);

  /* ===============================
     PERSONALIZADO
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
    (sum, e) => sum + Number(e.valor || 0),
    0
  );

  const mostrarResumoPorDia = period !== "today";

  const textoRegistrosResumo =
    filteredExpenses.length === 1
      ? "1 registro"
      : `${filteredExpenses.length} registros`;
     
     function gerarRelatorioTexto() {
  const despesasOrdenadas = [...filteredExpenses].sort(
    (a, b) =>
      parseDateSafe(a.data).getTime() -
      parseDateSafe(b.data).getTime()
  );

  const linhas = despesasOrdenadas.map((item) => {
    const detalhe = item.subcategoria
      ? ` / ${item.subcategoria}`
      : "";

    return `${formatDateBR(item.data)} • ${item.categoria}${detalhe} • ${formatMoney(
      item.valor
    )}`;
  });

  const categoriasDetalhadas: Record<
    string,
    {
      total: number;
      subcategorias: Record<string, number>;
    }
  > = {};

  despesasOrdenadas.forEach((item) => {
    const categoria = item.categoria || "Outros";
    const subcategoria = item.subcategoria || "Sem detalhe";

    if (!categoriasDetalhadas[categoria]) {
      categoriasDetalhadas[categoria] = {
        total: 0,
        subcategorias: {},
      };
    }

    categoriasDetalhadas[categoria].total += Number(
      item.valor || 0
    );

    categoriasDetalhadas[categoria].subcategorias[
      subcategoria
    ] =
      (categoriasDetalhadas[categoria].subcategorias[
        subcategoria
      ] || 0) +
      Number(item.valor || 0);
  });

  const categoriasOrdenadas = Object.entries(
    categoriasDetalhadas
  ).sort(
    (a, b) =>
      b[1].total - a[1].total
  );

  const resumoCategorias = categoriasOrdenadas
    .map(([categoria, info]) => {
      const percentualCategoria =
        totalPeriodo > 0
          ? (info.total / totalPeriodo) * 100
          : 0;

      const subcategoriasEntries = Object.entries(
  info.subcategorias
).sort((a, b) => b[1] - a[1]);

const temSomenteUmaSubcategoria =
  subcategoriasEntries.length === 1;

const unicaSubcategoria =
  temSomenteUmaSubcategoria
    ? subcategoriasEntries[0][0]
    : "";

      if (temSomenteUmaSubcategoria) {
  if (unicaSubcategoria === "Sem detalhe") {
    return `${categoria} • ${formatMoney(
      info.total
    )} • ${percentualCategoria.toFixed(
      0
    )}% do período`;
  }

  return `${categoria} • ${formatMoney(
    info.total
  )} • ${unicaSubcategoria} • ${percentualCategoria.toFixed(
    0
  )}% do período`;
}

const subcategoriasTexto = subcategoriasEntries
  .map(([subcategoria, total]) => {
    const percentualSubcategoria =
      info.total > 0
        ? (total / info.total) * 100
        : 0;

    return `• ${subcategoria} • ${formatMoney(
      total
    )} • ${percentualSubcategoria.toFixed(
      0
    )}% da categoria`;
  })
  .join("\n");

return `${categoria} • ${formatMoney(
  info.total
)} • ${percentualCategoria.toFixed(
  0
)}% do período

${subcategoriasTexto}`;
    })
    .join("\n\n--------------------------------\n\n");

  return `💰 Total gasto: ${formatMoney(totalPeriodo)}

🏷️ Categorias: ${categoriasOrdenadas.length}

📝 Registros: ${filteredExpenses.length}

--------------------------------

🏆 RESUMO POR CATEGORIA

${resumoCategorias}

--------------------------------

📋 DETALHAMENTO COMPLETO

${linhas.join("\n")}

--------------------------------

Gerado pelo No Controle`;
}


      async function compartilharRelatorio() {
  const relatorio = gerarRelatorioTexto();

  console.log(relatorio);

  try {
    if (
      typeof navigator !== "undefined" &&
      navigator.share
    ) {
      await navigator.share({
        title: "Relatório Financeiro - No Controle",
        text: relatorio,
      });

      return;
    }

    await navigator.clipboard.writeText(relatorio);

    alert(
      "Relatório copiado para a área de transferência."
    );
  } catch (error) {
    console.error(error);

    alert(
      "Erro ao gerar relatório.\n\n" +
      String(error)
    );
  }
}


      const selectedCategoryItems = useMemo(() => {
  if (!selectedCategoryDetail) return [];

  return filteredExpenses
    .filter((item) => item.categoria === selectedCategoryDetail)
    .sort((a, b) => parseDateSafe(b.data).getTime() - parseDateSafe(a.data).getTime());
}, [filteredExpenses, selectedCategoryDetail]);

const selectedCategoryTotal = selectedCategoryItems.reduce(
  (sum, item) => sum + Number(item.valor || 0),
  0
);

const selectedCategoryCountText =
  selectedCategoryItems.length === 1
    ? "1 registro"
    : `${selectedCategoryItems.length} registros`;

  /* ===============================
     RENDER
  =============================== */

 return (
  <ScrollView
    style={styles.container}
    contentContainerStyle={{
      paddingHorizontal: isMobile ? 12 : 16,
      paddingTop: isMobile ? 12 : 16,
      paddingBottom: 140,
    }}
    showsVerticalScrollIndicator={false}
  >


      <Text style={styles.title}>Histórico</Text>

      <View style={styles.viewModeRow}>
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === "lancamentos" && styles.viewModeButtonActive,
          ]}
          onPress={() => setViewMode("lancamentos")}
        >
          <Text
            style={[
              styles.viewModeText,
              viewMode === "lancamentos" && styles.viewModeTextActive,
            ]}
          >
            📋 Lançamentos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === "categorias" && styles.viewModeButtonActive,
          ]}
          onPress={() => setViewMode("categorias")}
        >
          <Text
            style={[
              styles.viewModeText,
              viewMode === "categorias" && styles.viewModeTextActive,
            ]}
          >
            🏷️ Categorias
          </Text>
        </TouchableOpacity>
      </View>

       <View
  style={[
    styles.topControlsWrap,
    isMobile && {
      gap: 8,
    },
  ]}
>


         <View
           style={[
           styles.topControlBlock,
           isMobile && { width: "48%" },
           ]}
           >

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

           <View
           style={[
           styles.topControlBlock,
           isMobile && { width: "48%" },
           ]}
            >

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

        {viewMode === "lancamentos" && (
          <>

                 <TouchableOpacity
                  style={[
                  styles.topActionButton,
                  isMobile && { width: "48%" },
                  ]}
                  onPress={recolherTudo}
                  >
             

              <Text style={styles.topActionText}>▼ Recolher tudo</Text>
            </TouchableOpacity>


            
             <TouchableOpacity
              style={[
              styles.topActionButton,
              isMobile && { width: "48%" },
               ]}
               onPress={expandirTudo}
               >


              <Text style={styles.topActionText}>▲ Expandir tudo</Text>
            </TouchableOpacity>

            
          </>
        )}
      </View>

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

      

       <View style={styles.summaryCard}>
  <View style={styles.summaryHeader}>
    <Text style={styles.summaryLabel}>
      Total no período
    </Text>

    <View style={{ flexDirection: "row", gap: 8 }}>
      <TouchableOpacity
        onPress={() => setShowReportModal(true)}
        style={styles.reportChip}
      >
        <Text style={styles.reportChipText}>
          📊 Ver relatório
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={compartilharRelatorio}
        style={styles.shareChip}
      >
        <Text style={styles.shareChipText}>
          ↪ Compartilhar
        </Text>
      </TouchableOpacity>
    </View>
  </View>

  <View style={styles.summaryInlineRow}>
    <Text style={styles.summaryValue}>
      {formatMoney(totalPeriodo)}
    </Text>

    <Text style={styles.summaryInlineMeta}>
      • {textoRegistrosResumo}
    </Text>
  </View>
</View>
       

            {viewMode === "lancamentos" ? (
        groupedByDate.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Nenhum registro encontrado neste filtro.
            </Text>
            <Text style={styles.subEmptyText}>
              Tente outro período ou outra categoria.
            </Text>
          </View>
        ) : (
          <View>
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
                    group.items.map((item) => {
                      const isEditing = editingId === item.id;

                      return (
                        <View key={item.id} style={styles.card}>
                          {isEditing ? (
                            <>
                              <Text style={styles.editLabel}>Valor</Text>
                              <TextInput
                                style={styles.editInput}
                                value={editValor}
                                onChangeText={setEditValor}
                                keyboardType="decimal-pad"
                                placeholder="Ex: 123,45"
                              />

                              <Text style={styles.editLabel}>Categoria</Text>
                              <select
                                value={editCategoria}
                                onChange={(e: any) =>
                                  setEditCategoria(e.target.value)
                                }
                                style={styles.editInput as any}
                              >
                                <option value="">Selecione a categoria</option>
                                {CATEGORY_OPTIONS.filter(
                                  (cat) => cat !== "Todas"
                                ).map((cat) => (
                                  <option key={cat} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                              </select>

                              <Text style={styles.editLabel}>Data</Text>
                              <input
                                type="date"
                                value={editData}
                                onChange={(e: any) =>
                                  setEditData(e.target.value)
                                }
                                style={
                                  {
                                    width: "100%",
                                    padding: "10px 12px",
                                    borderRadius: 8,
                                    border: "1px solid #D9DDE3",
                                    backgroundColor: "#FFF",
                                    color: "#333",
                                    fontSize: "14px",
                                    boxSizing: "border-box",
                                    marginBottom: 10,
                                  } as any
                                }
                              />

                              <View style={styles.editActionsRow}>
                                <TouchableOpacity
                                  style={styles.saveEditButton}
                                  onPress={() => salvarEdicao(item)}
                                >
                                  <Text style={styles.saveEditButtonText}>
                                    💾 Salvar
                                  </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  style={styles.cancelEditButton}
                                  onPress={cancelarEdicao}
                                >
                                  <Text style={styles.cancelEditButtonText}>
                                    Cancelar
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            </>
                          ) : (
                            <View style={styles.cardHeaderRow}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.value}>
                                  {formatMoney(item.valor)}
                                </Text>

         <Text style={styles.category}>
         {item.categoria}
         </Text>

         {item.subcategoria ? (
         <Text style={styles.subcategory}>
         Detalhe: {item.subcategoria}
         </Text>
         ) : null}
                                
                              </View>

                              <View style={styles.cardActionsRow}>
                                <TouchableOpacity
                                  style={styles.editButton}
                                  onPress={() => iniciarEdicao(item)}
                                >
                                  <Text style={styles.editButtonText}>
                                    ✏️ Editar
                                  </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  style={styles.deleteButton}
                                  onPress={() => excluirRegistro(item)}
                                >
                                  <Text style={styles.deleteButtonText}>
                                    🗑️ Excluir
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          )}
                        </View>
                      );
                    })}
                </View>
              );
            })}
          </View>
        )
      ) : groupedByCategory.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            Nenhuma categoria encontrada neste filtro.
          </Text>
          <Text style={styles.subEmptyText}>
            Ajuste o período ou a categoria selecionada.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {groupedByCategory.map((group) => (
 <TouchableOpacity
  key={group.categoria}
  style={[styles.card, styles.categoryCardClickable]}
  activeOpacity={0.85}
  onPress={() => abrirLancamentosDaCategoria(group.categoria)}
>
  <View style={styles.categoryCardHeader}>
    <Text style={[styles.value, styles.categoryCardTitle]}>
      {group.categoria}
    </Text>

    <Text style={styles.categoryCardHint}>
      Ver registros ›
    </Text>
  </View>

  <Text style={styles.categorySummary}>
    {formatMoney(group.total)} •{" "}
    {group.qtd === 1 ? "1 registro" : `${group.qtd} registros`} •{" "}
    {group.percentual.toFixed(0)}% do período
  </Text>
</TouchableOpacity>
))}
        </ScrollView>
      )}
    <Modal
  visible={showReportModal}
  transparent
  animationType="fade"
  onRequestClose={() => setShowReportModal(false)}
>
  <View style={styles.modalOverlay}>
    <View
      style={[
        styles.reportModal,
        isMobile && styles.reportModalMobile,
      ]}
    >
      {/* ✅ CABEÇALHO FIXO */}
      <View style={styles.modalHeader}>
  <View>
    <Text style={styles.modalTitle}>
      Relatório Financeiro
    </Text>

    <Text style={styles.modalSubtitle}>
      {labelPeriod(period)}
    </Text>
  </View>

  <View style={styles.reportButtonsRow}>
    <TouchableOpacity
      style={styles.reportActionButton}
      onPress={compartilharRelatorio}
    >
      <Text style={styles.reportActionText}>
        ↪ Compartilhar
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.reportActionButton}
      onPress={() => {
        if (typeof window !== "undefined") {
          window.print();
        }
      }}
    >
      <Text style={styles.reportActionText}>
        🖨️ Imprimir
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.modalCloseButton}
      onPress={() => setShowReportModal(false)}
    >
      <Text style={styles.modalCloseText}>
        Fechar
      </Text>
    </TouchableOpacity>
  </View>
</View>

      {/* ✅ CONTEÚDO ROLÁVEL */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={true}
      >
        {gerarRelatorioTexto()
          .split("\n")
          .map((linha, index) => (
            <Text
              key={index}
              style={styles.reportLine}
            >
              {linha}
            </Text>
          ))}
      </ScrollView>
    </View>
  </View>
</Modal>
     <Modal
  visible={!!selectedCategoryDetail}
  transparent
  animationType="fade"
  onRequestClose={fecharDetalheCategoria}
>
  <View style={styles.modalOverlay}>
    <View
      style={[
        styles.categoryDetailModal,
        isMobile && styles.categoryDetailModalMobile,
      ]}
    >
      <View style={styles.modalHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.modalTitle}>
            {selectedCategoryDetail}
          </Text>

          <Text style={styles.modalSubtitle}>
            {labelPeriod(period)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.modalCloseButton}
          onPress={fecharDetalheCategoria}
          activeOpacity={0.8}
        >
          <Text style={styles.modalCloseText}>Fechar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.modalSummaryCard}>
        <Text style={styles.modalSummaryLabel}>Total da categoria</Text>

        <Text style={styles.modalSummaryValue}>
          {formatMoney(selectedCategoryTotal)}
        </Text>

        <Text style={styles.modalSummaryMeta}>
          {selectedCategoryCountText}
        </Text>
      </View>

      <ScrollView
        style={styles.modalList}
        contentContainerStyle={styles.modalListContent}
        showsVerticalScrollIndicator={false}
      >
        {selectedCategoryItems.map((item) => (
          <View key={item.id} style={styles.modalItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalItemValue}>
                {formatMoney(item.valor)}
              </Text>

              <Text style={styles.modalItemDate}>
                {formatDateBR(item.data)}
              </Text>

             {item.subcategoria ? (
             <Text style={styles.modalItemSubcategory}>
             {item.subcategoria}
             </Text>
             ) : null}

            </View>

            <Text style={styles.modalItemCategory}>
              {item.categoria}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  </View>
</Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
     paddingBottom: 16,
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
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },

  topControlBlock: {
    width: 180,
  },

  topControlButton: {
    backgroundColor: "#FFF",
    borderWidth: 0.5,
    borderColor: "#eee",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
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
    minHeight: 40,
    width: 180,
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

  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  cardActionsRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
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

  subcategory: {
  fontSize: 12,
  color: "#0A8F55",
  marginTop: 3,
  fontWeight: "600",
},

  categorySummary: {
    fontSize: 14,
    color: "#555",
    marginTop: 6,
  },

  editButton: {
    backgroundColor: "#F0FAF5",
    borderWidth: 0.5,
    borderColor: "#BFE7D2",
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },

  editButtonText: {
    color: "#0A8F55",
    fontSize: 12,
    fontWeight: "700",
  },

  deleteButton: {
    backgroundColor: "#FFF5F5",
    borderWidth: 0.5,
    borderColor: "#F3C2C2",
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },

  deleteButtonText: {
    color: "#C0392B",
    fontSize: 12,
    fontWeight: "700",
  },

  editLabel: {
    fontSize: 13,
    color: "#555",
    fontWeight: "600",
    marginBottom: 4,
  },

  editInput: {
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  editActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },

  saveEditButton: {
    backgroundColor: "#0A8F55",
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },

  saveEditButtonText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },

  cancelEditButton: {
    backgroundColor: "#FFF",
    borderWidth: 0.5,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },

  cancelEditButtonText: {
    color: "#555",
    fontSize: 13,
    fontWeight: "600",
  },

  customInputGroup: {
    width: "100%",
    marginBottom: 10,
  },

  viewModeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },

  viewModeButton: {
    flex: 1,
    backgroundColor: "#FFF",
    borderWidth: 0.5,
    borderColor: "#eee",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
  },

  viewModeButtonActive: {
    borderColor: "#0A8F55",
    borderWidth: 1,
  },

  viewModeText: {
    fontSize: 13,
    color: "#555",
    fontWeight: "600",
  },

  viewModeTextActive: {
    color: "#0A8F55",
  },

categoryCardClickable: {
  borderColor: "#CFE8DB",
},

categoryCardHeader: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
},

categoryCardTitle: {
  flex: 1,
},

categoryCardHint: {
  fontSize: 12,
  color: "#0A8F55",
  fontWeight: "700",
},

modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.35)",
  justifyContent: "center",
  alignItems: "center",
  padding: 16,
},

categoryDetailModal: {
  width: "92%",
  maxWidth: 540,
  maxHeight: "82%",
  backgroundColor: "#F7F8FA",
  borderRadius: 18,
  padding: 14,
  borderWidth: 0.5,
  borderColor: "#DDE3EA",
},

categoryDetailModalMobile: {
  width: "96%",
  maxHeight: "86%",
},

modalHeader: {
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 10,
  marginBottom: 12,
},

modalTitle: {
  fontSize: 18,
  fontWeight: "800",
  color: "#0A8F55",
},

modalSubtitle: {
  fontSize: 12,
  color: "#777",
  marginTop: 2,
},

modalCloseButton: {
  backgroundColor: "#FFFFFF",
  borderWidth: 0.5,
  borderColor: "#DDE3EA",
  borderRadius: 999,
  paddingVertical: 5,
  paddingHorizontal: 9,
},

modalCloseText: {
  fontSize: 11,
  color: "#555",
  fontWeight: "700",
},

modalSummaryCard: {
  backgroundColor: "#FFFFFF",
  borderRadius: 14,
  padding: 12,
  marginBottom: 10,
  borderWidth: 0.5,
  borderColor: "#E8EAEE",
},

modalSummaryLabel: {
  fontSize: 12,
  color: "#666",
  marginBottom: 4,
},

modalSummaryValue: {
  fontSize: 22,
  fontWeight: "800",
  color: "#0A8F55",
},

modalSummaryMeta: {
  fontSize: 12,
  color: "#777",
  marginTop: 2,
},

modalList: {
  flexGrow: 0,
},

modalListContent: {
  paddingBottom: 8,
},

modalItem: {
  backgroundColor: "#FFFFFF",
  borderRadius: 12,
  padding: 12,
  marginBottom: 8,
  borderWidth: 0.5,
  borderColor: "#E8EAEE",
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
},

modalItemValue: {
  fontSize: 16,
  fontWeight: "800",
  color: "#0A8F55",
},

modalItemDate: {
  fontSize: 12,
  color: "#666",
  marginTop: 3,
},

modalItemSubcategory: {
  fontSize: 12,
  color: "#0A8F55",
  marginTop: 3,
  fontWeight: "600",
},

modalItemCategory: {
  fontSize: 11,
  color: "#777",
  fontWeight: "600",
  textAlign: "right",
},

summaryHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 6,
},

shareChip: {
  backgroundColor: "#F0FAF5",
  borderWidth: 0.5,
  borderColor: "#BFE7D2",
  borderRadius: 999,
  paddingVertical: 5,
  paddingHorizontal: 10,
},

shareChipText: {
  color: "#0A8F55",
  fontSize: 12,
  fontWeight: "700",
},

reportChip: {
  backgroundColor: "#EEF7FF",
  borderWidth: 0.5,
  borderColor: "#BFD9F3",
  borderRadius: 999,
  paddingVertical: 5,
  paddingHorizontal: 10,
  marginRight: 8,
},

reportChipText: {
  color: "#2563EB",
  fontSize: 12,
  fontWeight: "700",
},

reportModal: {
  width: "95%",
  maxWidth: 760,
  height: "92%",
  backgroundColor: "#F7F8FA",
  borderRadius: 18,
  padding: 16,
  borderWidth: 0.5,
  borderColor: "#DDE3EA",
},

reportModalMobile: {
  width: "96%",
  height: "94%",
},

reportPreviewText: {
  fontSize: 13,
  color: "#333",
  lineHeight: 22,
  paddingBottom: 20,
},
reportActionButton: {
  backgroundColor: "#F0FAF5",
  borderWidth: 0.5,
  borderColor: "#BFE7D2",
  borderRadius: 999,
  paddingVertical: 5,
  paddingHorizontal: 9,
},

reportActionText: {
  color: "#0A8F55",
  fontSize: 11,
  fontWeight: "700",
},
reportLine: {
  fontSize: 13,
  color: "#333",
  lineHeight: 20,
  marginBottom: 2,
},
reportButtonsRow: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 6,
},


});