import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { getAllExpenses } from "../storage/expenseStorage";

/* ===============================
   TIPOS
   =============================== */

type Period = "today" | "week" | "month" | "year" | "lastYear";

type Expense = {
  id: string;
  valor: number;
  categoria: string;
  data: string; // yyyy-mm-dd
};

/* ===============================
   FUNÇÕES DE DATA
   =============================== */

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function isSameWeek(d: Date, now: Date) {
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start = startOfDay(start);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return d >= start && d <= end;
}

function isSameMonth(d: Date, now: Date) {
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

/* ===============================
   COMPONENTE
   =============================== */

export default function Resumo() {
  const [period, setPeriod] = useState<Period>("year");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const now = new Date();

  /* ✅ CARREGA DADOS */
  useEffect(() => {
    async function load() {
      const data = await getAllExpenses();
      setExpenses(data || []);
    }
    load();
  }, []);

  /* ✅ FILTRO POR PERÍODO */
  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const d = new Date(e.data);
      if (period === "today") return isSameDay(d, now);
      if (period === "week") return isSameWeek(d, now);
      if (period === "month") return isSameMonth(d, now);
      if (period === "year") return d.getFullYear() === now.getFullYear();
      if (period === "lastYear") return d.getFullYear() === now.getFullYear() - 1;
      return false;
    });
  }, [expenses, period]);

  /* ===============================
     MÉTRICAS PRINCIPAIS
     =============================== */

  const total = filtered.reduce((sum, e) => sum + e.valor, 0);

  const diasComLancamento = Array.from(
    new Set(filtered.map((e) => e.data))
  ).length;

  const mediaDiaria = diasComLancamento > 0 ? total / diasComLancamento : 0;

  /* ===============================
     TOP 3 MAIORES GASTOS
     =============================== */

  const top3Gastos = [...filtered]
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 3);

  /* ===============================
     TOP 3 CATEGORIAS (SOMADAS)
     =============================== */

  const porCategoria: Record<string, number> = {};
  filtered.forEach((e) => {
    porCategoria[e.categoria] = (porCategoria[e.categoria] || 0) + e.valor;
  });

  const top3Categorias = Object.entries(porCategoria)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  /* ===============================
     PERÍODO ANTERIOR (COMPARAÇÃO)
     =============================== */

  const previousFiltered = useMemo(() => {
    return expenses.filter((e) => {
      const d = new Date(e.data);
      if (period === "today") {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        return isSameDay(d, yesterday);
      }
      if (period === "week") {
        const lastWeek = new Date(now);
        lastWeek.setDate(now.getDate() - 7);
        return isSameWeek(d, lastWeek);
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
      if (period === "lastYear") {
        return d.getFullYear() === now.getFullYear() - 2;
      }
      return false;
    });
  }, [expenses, period]);

  const previousTotal = previousFiltered.reduce((s, e) => s + e.valor, 0);

  const previousDias = Array.from(
    new Set(previousFiltered.map((e) => e.data))
  ).length;

  const previousMedia =
    previousDias > 0 ? previousTotal / previousDias : 0;

  const diffTotal = total - previousTotal;

  const topCategoriaAnterior =
    previousFiltered.reduce<Record<string, number>>((acc, e) => {
      acc[e.categoria] = (acc[e.categoria] || 0) + e.valor;
      return acc;
    }, {});

  const categoriaMaisGastaAnterior = Object.entries(topCategoriaAnterior).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0];

  /* ===============================
     RENDER
     =============================== */

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NO CONTROLE</Text>
      <Text style={styles.periodo}>📅 {labelPeriod(period)}</Text>

      <View style={styles.row}>
        <Card title="💰 Total gasto" value={`R$ ${total.toFixed(2)}`}>
          <Text style={styles.subText}>
            {diffTotal === 0
              ? "Gasto igual ao período anterior."
              : diffTotal > 0
              ? `Você gastou R$ ${diffTotal.toFixed(2)} a mais que o período anterior.`
              : `Você gastou R$ ${Math.abs(diffTotal).toFixed(2)} a menos que o período anterior.`}
          </Text>
        </Card>

        <Card title="📊 Média diária" value={`R$ ${mediaDiaria.toFixed(2)}`}>
          <Text style={styles.subText}>
            No período anterior, sua média diária foi de R$ {previousMedia.toFixed(2)}.
          </Text>
        </Card>
      </View>

      <View style={styles.row}>
        <Card title="🔝 Top 3 maiores gastos">
          {top3Gastos.map((e, i) => (
            <Text key={e.id} style={styles.listItem}>
              {i + 1}. R$ {e.valor.toFixed(2)} — {e.categoria}
            </Text>
          ))}
        </Card>

        <Card title="🏷️ Top 3 categorias">
          {top3Categorias.map(([cat, val]) => (
            <Text key={cat} style={styles.listItem}>
              • {cat} — R$ {val.toFixed(2)}
            </Text>
          ))}
          <Text style={styles.subText}>
            A categoria que você mais gastou no período anterior foi{" "}
            {categoriaMaisGastaAnterior ?? "—"}.
          </Text>
        </Card>
      </View>
    </View>
  );
}

/* ===============================
   COMPONENTES AUXILIARES
   =============================== */

function Card({
  title,
  value,
  children,
}: {
  title: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {value && <Text style={styles.cardValue}>{value}</Text>}
      {children}
    </View>
  );
}

function labelPeriod(p: Period) {
  if (p === "today") return "Hoje";
  if (p === "week") return "Esta semana";
  if (p === "month") return "Este mês";
  if (p === "year") return "Este ano";
  return "Ano passado";
}

/* ===============================
   ESTILOS
   =============================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F2",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
    color: "#0A8F55",
  },
  periodo: {
    textAlign: "center",
    marginBottom: 16,
    color: "#555",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flex: 1,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 6,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  listItem: {
    fontSize: 14,
    marginTop: 4,
  },
  subText: {
    marginTop: 6,
    fontSize: 12,
    color: "#666",
  },
});