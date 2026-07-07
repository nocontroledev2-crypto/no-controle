import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { getAllExpenses } from "../storage/expenseStorage";

function parseDateSafe(dateStr: string) {
  const [ano, mes, dia] = dateStr.split("-");
  return new Date(Number(ano), Number(mes) - 1, Number(dia));
}

function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay(); // domingo = 0
  const diff = day === 0 ? -6 : 1 - day; // segunda-feira como início
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

/* =============================== */

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

type Expense = {
  id: string;
  valor: number;
  categoria: string;
  data: string;
};

/* =============================== */

export default function Resumo() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("month");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [menuAberto, setMenuAberto] = useState(false);



  /* ✅ CALENDÁRIO */
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [selectingStart, setSelectingStart] = useState(true);
    const [startDateInput, setStartDateInput] = useState("");
    const [endDateInput, setEndDateInput] = useState("");
    

    const now = new Date();
    const { width } = useWindowDimensions();
    const isMobile = width < 480;

  
   useFocusEffect(
  useCallback(() => {
    async function load() {
      const data = await getAllExpenses();

const normalizedData = (data || []).map((item: any) => {
  const safeValue = Number(item.valor);

  return {
    ...item,
    valor: Number.isFinite(safeValue) ? safeValue : 0,
  };
});

setExpenses(normalizedData);
    }

    load();
  }, [])
);

  const mostrarComparacao =
    period !== "custom" && period !== "all";

  /* ✅ moeda */
  function formatMoney(valor: number | null | undefined) {
  const safeValue = Number(valor);

  return (Number.isFinite(safeValue) ? safeValue : 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

  /* ===========================
     FILTRO ATUAL
  ============================ */

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
        const d = parseDateSafe(e.data);
        d.setHours(0, 0, 0, 0);
        d.setHours(0, 0, 0, 0);

      

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

        return d >= start && d <= end;
       }

        if (period === "weekPrev") {
        const weekReference = new Date(now);
        weekReference.setDate(now.getDate() - 7);

        const start = getStartOfWeek(weekReference);
        const end = getEndOfWeek(weekReference);

        return d >= start && d <= end;
         }

      if (period === "month") {
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      }

      if (period === "monthPrev") {
        return (
          d.getMonth() === now.getMonth() - 1 &&
          d.getFullYear() === now.getFullYear()
        );
      }

      if (period === "year") {
        return d.getFullYear() === now.getFullYear();
      }

      if (period === "lastYear") {
        return d.getFullYear() === now.getFullYear() - 1;
      }
      if (period === "all") return true;
      if (period === "custom") {
      if (!startDate || !endDate) return false;  
       const dNormalized = new Date(d.getFullYear(), d.getMonth(), d.getDate());
       const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      // ⬇️ AQUI ESTÁ A CORREÇÃO PRINCIPAL
       const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);
       return dNormalized >= start && dNormalized <= end;
     }
      return false;
    });
    }, [expenses, period, startDate, endDate]);
  /* ===========================
     PERÍODO ANTERIOR
  ============================ */
  const previousFiltered = useMemo(() => {
    return expenses.filter((e) => {
      const d = parseDateSafe(e.data);
     if (period === "today") {
  const ontem = new Date(now);
  ontem.setDate(now.getDate() - 1);

  return (
    d.getDate() === ontem.getDate() &&
    d.getMonth() === ontem.getMonth() &&
    d.getFullYear() === ontem.getFullYear()
  );
}


      if (period === "week") {
  const weekReference = new Date(now);
  weekReference.setDate(now.getDate() - 7);

  const start = getStartOfWeek(weekReference);
  const end = getEndOfWeek(weekReference);

  return d >= start && d <= end;
}

      if (period === "month") {
        return (
          d.getMonth() === now.getMonth() - 1 &&
          d.getFullYear() === now.getFullYear()
        );
      }

      if (period === "year") {
        return d.getFullYear() === now.getFullYear() - 1;
      }

      return false;
    });
  }, [expenses, period]);

  /* ===========================
     CÁLCULOS
  ============================ */

  const total = filtered.reduce((s, e) => s + e.valor, 0);
  const previousTotal = previousFiltered.reduce(
    (s, e) => s + e.valor,
    0
  );

  const diffTotal = total - previousTotal;

  const dias = new Set(filtered.map((e) => e.data)).size;
  const media = dias > 0 ? total / dias : 0;
  const previousDias = new Set(  previousFiltered.map((e) => e.data)).size;
  const previousMedia =
  previousDias > 0 ? previousTotal / previousDias : 0;

  /* ✅ VARIAÇÃO */
  let percentual = 0;
  if (previousTotal > 0) {
    percentual = (diffTotal / previousTotal) * 100;
  }

  let textoVariacao = "";
  if (previousTotal > 0) {
    if (percentual > 0) {
      textoVariacao = `📈 Seu gasto aumentou ${percentual.toFixed(
        0
      )}%`;
    } else if (percentual < 0) {
      textoVariacao = `✅ Seu gasto diminuiu ${Math.abs(
        percentual
      ).toFixed(0)}%`;
    }
  }

  /* ===========================
     TOPS
  ============================ */

  const porCategoria: Record<string, number> = {};
  filtered.forEach((e) => {
    porCategoria[e.categoria] =
      (porCategoria[e.categoria] || 0) + e.valor;
  });

  const topCategorias = Object.entries(porCategoria)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const topGastos = [...filtered]
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 3);


    function getInsightHoje() {
  const quantidade = filtered.length;

  if (quantidade === 0) {
    return {
      principal: "Nenhum gasto registrado hoje ainda.",
      detalhe: "Quando registrar, seu painel vai mostrar os destaques do dia.",
    };
  }

  const categoriaPrincipal = topCategorias[0]?.[0];
  const valorCategoriaPrincipal = topCategorias[0]?.[1] || 0;
  const maiorGasto = topGastos[0];

  if (quantidade === 1) {
    return {
      principal: "Primeiro registro de hoje.",
      detalhe: categoriaPrincipal
        ? `Você começou o dia com ${categoriaPrincipal}: ${formatMoney(total)}.`
        : `Valor registrado: ${formatMoney(total)}.`,
    };
  }

  if (categoriaPrincipal && maiorGasto) {
    return {
      principal: `Hoje você registrou ${quantidade} gastos.`,
      detalhe: `Categoria em destaque: ${categoriaPrincipal} (${formatMoney(
        valorCategoriaPrincipal
      )}). Maior gasto: ${formatMoney(maiorGasto.valor)}.`,
    };
  }

  return {
    principal: `Hoje você registrou ${quantidade} gastos.`,
    detalhe: `Total do dia até agora: ${formatMoney(total)}.`,
  };
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
  setShowCalendar(false);
}

function cancelarPeriodoPersonalizado() {
  setShowCalendar(false);
  setStartDateInput("");
  setEndDateInput("");
}

  /* ============================ */

  return (
  <View style={[styles.container, isMobile && styles.containerMobile]}>

      <Text style={styles.title}>NO CONTROLE</Text>

      {/* ✅ SELECTOR */}
      <TouchableOpacity
        style={styles.periodBox}
        onPress={() => setMenuAberto(!menuAberto)}
      >
        <Text style={styles.periodText}>
          📅 {labelPeriod(period)}
        </Text>

       {period === "custom" && startDate && (
  <Text style={{ textAlign: "center", color: "#666" }}>
    Início: {startDate.toLocaleDateString("pt-BR")}
  </Text>
)}

{period === "custom" && endDate && (
  <Text style={{ textAlign: "center", color: "#666" }}>
    Fim: {endDate.toLocaleDateString("pt-BR")}
  </Text>
)}









     
      </TouchableOpacity>

      {menuAberto && (
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
  setMenuAberto(false);

  setStartDate(null);
  setEndDate(null);
  setStartDateInput("");
  setEndDateInput("");

  setShowCalendar(true);
}
  
  
  else {
    setPeriod(value as Period);
    setMenuAberto(false);
  }
}}

            >
              <Text style={styles.menuItem}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ✅ CALENDÁRIO */}
      {showCalendar && (
        <View style={styles.calendarBox}>
          <Text style={styles.calendarTitle}>
            Selecione o intervalo personalizado
          </Text>

          <Text style={styles.calendarLabel}>Data inicial</Text>
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
                marginBottom: 10,
              } as any
            }
          />

          <Text style={styles.calendarLabel}>Data final</Text>
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

          <View style={styles.calendarActions}>
            <TouchableOpacity
              style={styles.calendarButton}
              onPress={aplicarPeriodoPersonalizado}
            >
              <Text style={styles.calendarButtonText}>Aplicar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.calendarButton}
              onPress={cancelarPeriodoPersonalizado}
            >
              <Text style={styles.calendarButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    

      {/* ✅ CARDS */}
      
      <ScrollView
       style={styles.contentScroll}
       contentContainerStyle={styles.contentScrollContainer}
       showsVerticalScrollIndicator={false}
       >

      <View style={styles.row}>
      
      
      <Card
  title="💰Total gasto"
  value={formatMoney(total)}
  style={styles.cardInRow}
  onPress={() =>
    router.push({
      pathname: "/evolucao-total",
      params: {
        period: period,
      },
    })
  }
/>


        {period === "today" ? (
  <Card title="🧭 Hoje em foco" style={styles.cardInRow}>
    <Text style={styles.insightMain}>
      {getInsightHoje().principal}
    </Text>

    <Text style={styles.insightDetail}>
      {getInsightHoje().detalhe}
    </Text>
  </Card>
) : (
  <Card
  title="📊 Média diária"
  value={formatMoney(media)}
  style={styles.cardInRow}
/>
)}
      </View>


       {mostrarComparacao && (
  <Card title="📈 Comparativo">
    <Text
      style={[
        styles.comparativoPrincipal,
        {
          color:
            diffTotal > 0
              ? "#D9534F"
              : diffTotal < 0
              ? "#0A8F55"
              : "#666",
        },
      ]}
    >
      {previousTotal === 0
        ? "Sem dados do período anterior."
        : diffTotal === 0
        ? "Mesmo valor do período anterior."
        : diffTotal > 0
        ? `⚠️ Você gastou ${formatMoney(diffTotal)} a mais`
        : `✅ Você gastou ${formatMoney(
            Math.abs(diffTotal)
          )} a menos`}
    </Text>

    {textoVariacao && (
      <Text style={styles.comparativoSecundario}>
        {textoVariacao}
      </Text>
    )}
  </Card>
)}


      <View style={[styles.row, isMobile && styles.rowMobileStack]}>
        
        <Card
  style={[styles.cardInRow, isMobile && styles.cardFullWidth]}
  title={`🔥 Top ${topGastos.length} ${ topGastos.length <= 1 ? "maior gasto" : "maiores gastos"
  }`}>  {topGastos.length === 0 ? (
    <Text style={styles.subText}>Nenhum gasto registrado</Text>
  ) : (
    topGastos.map((e, i) => (
      <Text key={e.id}>
        {i + 1}. {formatMoney(e.valor)} — {e.categoria}
      </Text>
    ))
  )}
</Card>

        <Card
  style={[styles.cardInRow, isMobile && styles.cardFullWidth]}
  title={`🏷️ Top ${topCategorias.length} ${topCategorias.length <= 1 ? "categoria" : "categorias"
  }`}

>
  {topCategorias.length === 0 ? (
    <Text style={styles.subText}>
      Nenhuma categoria registrada
    </Text>
  ) : (
    topCategorias.map(([cat, val]) => (
      <Text key={cat}>
        • {cat} — {formatMoney(val)}
      </Text>
    ))
  )}
</Card>
      </View>


     {period !== "weekPrev" &&
 period !== "monthPrev" &&
 period !== "lastYear" &&
 period !== "custom" && (

 
  <Card
  title="🔒 Projeções em aprendizado"
  style={isMobile ? styles.insightCardMobile : styles.insightCard}
>
  
  <Text style={styles.learningText}>
  As projeções inteligentes serão liberadas após:
</Text>

  <Text style={styles.learningItem}>
    ✅ 3 meses de histórico
  </Text>

  <Text style={styles.learningItem}>
    ✅ 12 registros lançados
  </Text>

  <Text style={styles.learningItem}>
    ✅ 3 categorias utilizadas
  </Text>


</Card>


)}

</ScrollView>
</View>
);
}

     

/* =============================== */

function Card({ title, value, children, onPress, style }: any) {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[
        styles.card,
        onPress && styles.cardClickable,
        style,
      ]}
      {...(onPress ? { onPress, activeOpacity: 0.8 } : {})}
    >
      <View style={styles.cardTitleRow}>
        <Text style={styles.cardTitle}>{title}</Text>

        {onPress && (
  <View style={styles.cardActionHint}>
    <Text style={styles.cardActionHintText}>Ver evolução ›</Text>
  </View>
)}
      </View>

      {value && <Text style={styles.cardValue}>{value}</Text>}

      {children}
    </Container>
  );
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

/* =============================== */

const styles = StyleSheet.create({
  container: {
  flex: 1,
  padding: 16,
  backgroundColor: "#F7F8FA",
},

containerMobile: {
  paddingHorizontal: 12,
  paddingTop: 14,
},

  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    color: "#0A8F55",
  },

  periodBox: { alignItems: "center", marginVertical: 10 },

  periodText: { color: "#555" },

  menu: {
    position: "absolute",
    top: 80,
    alignSelf: "center",
    width: 220,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    elevation: 6,
    zIndex: 10,
  },

  menuItem: { paddingVertical: 8 },

  row: {
  flexDirection: "row",
  gap: 10,
},

rowMobileStack: {
  flexDirection: "column",
  gap: 0,
},

  card: {
  backgroundColor: "#FFF",
  padding: 16,
  borderRadius: 12,
  marginBottom: 12,
},

cardInRow: {
  flex: 1,
},

cardFullWidth: {
  width: "100%",
},

insightCard: {
  width: "100%",
  minHeight: 0,
},

  cardTitle: { fontSize: 14, color: "#666" },

  cardValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 4,
  },

  subText: {
    marginTop: 6,
    fontSize: 12,
    color: "#888",
  },
  calendarBox: {
  backgroundColor: "#FFF",
  borderRadius: 12,
  padding: 12,
  marginTop: 12,
  borderWidth: 0.5,
  borderColor: "#eee",
  alignItems: "flex-start",
},

calendarLabel: {
  fontSize: 13,
  color: "#555",
  marginBottom: 6,
},

calendarTitle: {
  fontSize: 14,
  fontWeight: "600",
  color: "#333",
  marginBottom: 10,
},

calendarActions: {
  flexDirection: "row",
  gap: 10,
  marginTop: 14,
},

calendarButton: {
  backgroundColor: "#FFF",
  borderWidth: 0.5,
  borderColor: "#eee",
  borderRadius: 10,
  paddingVertical: 8,
  paddingHorizontal: 12,
},

calendarButtonText: {
  fontSize: 13,
  color: "#555",
  fontWeight: "600",
},

insightMain: {
  fontSize: 15,
  fontWeight: "700",
  color: "#333",
  marginTop: 6,
},

insightDetail: {
  fontSize: 12,
  color: "#777",
  marginTop: 6,
  lineHeight: 16,
},

contentScroll: {
  flex: 1,
},

contentScrollContainer: {
  paddingBottom: 80,
},

insightCardMobile: {
  width: "100%",
  padding: 14,
  marginBottom: 10,
},

insightValueMobile: {
  fontSize: 18,
  marginTop: 4,
},

cardClickable: {
  borderWidth: 1,
  borderColor: "#CFE8DB",
},

cardTitleRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},

cardActionHint: {
  backgroundColor: "#F0FAF5",
  borderWidth: 0.5,
  borderColor: "#BFE7D2",
  borderRadius: 999,
  paddingVertical: 4,
  paddingHorizontal: 8,
  marginLeft: 8,
},

cardActionHintText: {
  fontSize: 11,
  color: "#0A8F55",
  fontWeight: "700",
},


comparativoPrincipal: {
  fontSize: 15,
  fontWeight: "700",
  marginTop: 4,
},

comparativoSecundario: {
  fontSize: 13,
  color: "#666",
  marginTop: 8,
},

learningText: {
  fontSize: 13,
  color: "#555",
  lineHeight: 18,
  marginBottom: 8,
},

learningItem: {
  fontSize: 14,
  color: "#333",
  marginBottom: 6,
},


});
