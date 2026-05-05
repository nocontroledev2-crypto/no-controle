import { useFocusEffect } from "expo-router";
import React, { useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { Expense, getAllExpenses } from "../storage/expenseStorage";

export default function Historico() {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // 🔄 Atualiza sempre que a aba ganhar foco
  useFocusEffect(() => {
    async function loadExpenses() {
      const data = await getAllExpenses();
      // Ordena do mais recente para o mais antigo
      const ordered = data.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );
      setExpenses(ordered);
    }

    loadExpenses();
  });

  // 📭 ESTADO VAZIO
  if (expenses.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            Nenhuma despesa registrada ainda.
          </Text>
          <Text style={styles.subText}>
            Use o 🎤 ou registre manualmente para começar.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Histórico</Text>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.value}>
              R$ {item.valor.toFixed(2).replace(".", ",")}
            </Text>
            <Text style={styles.category}>{item.categoria}</Text>
            <Text style={styles.date}>{item.data}</Text>
          </View>
        )}
      />
    </View>
  );
}

/* 🎨 ESTILOS */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F2F2F2",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  value: {
    fontSize: 18,
    fontWeight: "bold",
  },
  category: {
    fontSize: 14,
    color: "#555",
    marginTop: 4,
  },
  date: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  emptyBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  subText: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
  },
});