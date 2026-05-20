import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getAllExpenses } from "../storage/expenseStorage";


function parseDateSafe(dateStr: string) {
  const [ano, mes, dia] = dateStr.split("-");
  return new Date(Number(ano), Number(mes) - 1, Number(dia));
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
  const [period, setPeriod] = useState<Period>("month");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [menuAberto, setMenuAberto] = useState(false);

  /* ✅ CALENDÁRIO */
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [selectingStart, setSelectingStart] = useState(true);

  const now = new Date();

  
   useFocusEffect(
  useCallback(() => {
    async function load() {
      const data = await getAllExpenses();
      setExpenses(data || []);
    }

    load();
  }, [])
);


  const mostrarComparacao =
    period !== "custom" && period !== "all";

  /* ✅ moeda */
  function formatMoney(valor: number) {
    return valor.toLocaleString("pt-BR", {
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

      


      if (period === "today") {
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}



      if (period === "week") {
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return d >= start && d <= end;
      }

      if (period === "weekPrev") {
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay() - 7);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
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
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay() - 7);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
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

  /* ============================ */

  return (
    <View style={styles.container}>
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
  setSelectingStart(true);

  setTimeout(() => {
    setShowCalendar(true);
  }, 100);
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

      {/* ✅ CARDS */}
      <View style={styles.row}>
        <Card title="💰 Total gasto" value={formatMoney(total)}>
          {mostrarComparacao && (
            <>
              <Text style={styles.subText}>
                {previousTotal === 0
                  ? "Sem dados do período anterior."
                  : diffTotal > 0
                  ? `Você gastou ${formatMoney(
                      diffTotal
                    )} a mais que o período anterior.`
                  : `Você gastou ${formatMoney(
                      Math.abs(diffTotal)
                    )} a menos que o período anterior.`}
              </Text>

              {textoVariacao && (
                <Text style={styles.subText}>
                  {textoVariacao}
                </Text>
              )}
            </>
          )}
        </Card>

        <Card title="📊 Média diária" value={formatMoney(media)} />
      </View>

      <View style={styles.row}>
        <Card title="🔥 Top 3 maiores gastos">
          {topGastos.map((e, i) => (
            <Text key={e.id}>
              {i + 1}. {formatMoney(e.valor)} — {e.categoria}
            </Text>
          ))}
        </Card>

        <Card title="🏷️ Top 3 categorias">
          {topCategorias.map(([cat, val]) => (
            <Text key={cat}>
              • {cat} — {formatMoney(val)}
            </Text>
          ))}
        </Card>
      </View>

      {/* ✅ CALENDÁRIO (FORMA CORRETA) */}
      
      {showCalendar && (
  <View style={{ marginTop: 10 }}>

    

    {period === "custom" && (
  <Text style={{ marginTop: 10, color: "#555" }}>
    {selectingStart
      ? "Selecione a data inicial"
      : "Selecione a data final"}
  </Text>
)}
    
    
    <input
  type="date"
  value=""   // 👈 força reset sempre
  onChange={(e) => {
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
    </View>
  );
}

/* =============================== */

function Card({ title, value, children }: any) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {value && <Text style={styles.cardValue}>{value}</Text>}
      {children}
    </View>
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
  container: { flex: 1, padding: 16, backgroundColor: "#F7F8FA" },

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

  row: { flexDirection: "row", gap: 10 },

  card: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    flex: 1,
    marginBottom: 12,
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
});