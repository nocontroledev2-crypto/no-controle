import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { calculateSummary } from "../helpers/summaryCalculator";
import { getAllExpenses } from "../storage/expenseStorage";

type Summary = {
  total: number;
  mediaDiaria: number;
  registros: number;
  topCategorias: { categoria: string; valor: number }[];
};

export default function Resumo() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    async function loadSummary() {
      const expenses = await getAllExpenses();
      const result = calculateSummary(expenses);
      setSummary(result);
    }

    loadSummary();
  }, []);

  if (!summary) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Carregando resumo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resumo</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Total gasto</Text>
        <Text style={styles.value}>
          R$ {summary.total.toFixed(2).replace(".", ",")}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Média diária</Text>
        <Text style={styles.value}>
          R$ {summary.mediaDiaria.toFixed(2).replace(".", ",")}
        </Text>
        <Text style={styles.subText}>
          Baseada nos dias com lançamento
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Registros</Text>
        <Text style={styles.value}>{summary.registros}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Top categorias</Text>
        {summary.topCategorias.map((item) => (
          <Text key={item.categoria} style={styles.categoryText}>
            {item.categoria}: R$ {item.valor.toFixed(2).replace(".", ",")}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F2F2F2",
  },
  loading: {
    marginTop: 40,
    textAlign: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  label: {
    color: "#666",
  },
  value: {
    fontSize: 20,
    fontWeight: "bold",
  },
  subText: {
    fontSize: 12,
    color: "#888",
  },
  categoryText: {
    marginTop: 5,
    fontWeight: "600",
  },
});