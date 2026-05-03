import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { saveExpense } from "../storage/expenseStorage";

/**
 * Converte qualquer valor monetário em number seguro
 * Aceita:
 *  - "45.9"
 *  - "45,90"
 *  - "R$ 45,90"
 *  - "R$45.90"
 */
function parseMoney(value: unknown): number {
  if (!value) return NaN;

  const sanitized = String(value)
    .replace(/[^\d.,-]/g, "") // remove R$, espaços etc
    .replace(".", "")         // remove separador de milhar
    .replace(",", ".");       // converte vírgula para ponto

  return Number(sanitized);
}

export default function Confirmacao() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const valor = parseMoney(params.valor);
  const categoria = String(params.categoria ?? "");
  const data = String(params.data ?? "Hoje");

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

    router.replace("/(tabs)/home");
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
});