import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { saveExpense } from "../storage/expenseStorage";

/**
 * Converte string monetária em number seguro
 */
function parseMoney(value: unknown): number {
  if (!value) return NaN;

  const sanitized = String(value)
    .replace(/[^\d.,-]/g, "")
    .replace(".", "")
    .replace(",", ".");

  return Number(sanitized);
}

export default function Confirmacao() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const valor = parseMoney(params.valor);
  const categoria = String(params.categoria ?? "");
  const data = String(params.data ?? "Hoje");

  const [showSuccess, setShowSuccess] = useState(false);

  async function confirmar() {
    if (isNaN(valor)) {
      alert("Valor inválido. Ajuste o valor.");
      return;
    }

    await saveExpense({
      id: Date.now().toString(),
      valor,
      categoria,
      data,
      createdAt: new Date().toISOString(),
    });

    // ✅ Feedback visual
    setShowSuccess(true);

    // ⏱️ Após 1.5s, volta para Home
    setTimeout(() => {
      setShowSuccess(false);
      router.replace("/(tabs)/home");
    }, 1500);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirmar despesa</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Valor</Text>
        <Text style={styles.value}>
          R$ {valor.toFixed(2).replace(".", ",")}
        </Text>

        <Text style={styles.label}>Categoria</Text>
        <Text style={styles.value}>{categoria}</Text>

        <Text style={styles.label}>Data</Text>
        <Text style={styles.value}>{data}</Text>
      </View>

      <TouchableOpacity style={styles.confirmBtn} onPress={confirmar}>
        <Text style={styles.btnText}>✅ Confirmar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.adjustBtn}
        onPress={() => router.back()}
      >
        <Text style={styles.adjustText}>✏️ Ajustar</Text>
      </TouchableOpacity>

      {/* ✅ FEEDBACK VISUAL */}
      {showSuccess && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>
            ✅ Despesa registrada com sucesso
          </Text>
        </View>
      )}
    </View>
  );
}

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
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 8,
    marginBottom: 30,
  },
  label: {
    color: "#666",
    marginTop: 10,
  },
  value: {
    fontSize: 18,
    fontWeight: "bold",
  },
  confirmBtn: {
    backgroundColor: "#0A8F55",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  btnText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  adjustBtn: {
    alignItems: "center",
  },
  adjustText: {
    color: "#0A8F55",
    fontWeight: "600",
  },

  /* ✅ Toast de sucesso */
  toast: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: "#0A8F55",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  toastText: {
    color: "#FFF",
    fontWeight: "bold",
  },
});