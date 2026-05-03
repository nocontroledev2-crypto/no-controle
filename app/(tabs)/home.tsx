import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Home() {
  const router = useRouter();

  function iniciarRegistroPorVoz() {
    const voiceId = Date.now().toString(); // 🔑 gatilho único
    router.push(`/(tabs)/registrar?voiceId=${voiceId}`);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>No Controle</Text>
      <Text style={styles.subtitle}>Hoje</Text>

      <View style={styles.insightBox}>
        <Text style={styles.insightText}>
          Você ainda não registrou nenhum gasto hoje.
        </Text>
      </View>

      <View style={styles.metrics}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total do dia</Text>
          <Text style={styles.metricValue}>R$ 0,00</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Média diária</Text>
          <Text style={styles.metricValue}>R$ 0,00</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Registros</Text>
          <Text style={styles.metricValue}>0</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.voiceButton} onPress={iniciarRegistroPorVoz}>
        <Text style={styles.voiceButtonText}>🎤 Falar despesa</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F2F2F2" },
  title: { fontSize: 26, fontWeight: "bold", textAlign: "center" },
  subtitle: { fontSize: 16, textAlign: "center", color: "#666", marginBottom: 16 },
  insightBox: { backgroundColor: "#FFF", padding: 16, borderRadius: 8, marginBottom: 16 },
  insightText: { fontSize: 16, color: "#333" },
  metrics: { marginBottom: 24 },
  metricCard: { backgroundColor: "#FFF", padding: 14, borderRadius: 8, marginBottom: 10 },
  metricLabel: { fontSize: 14, color: "#666" },
  metricValue: { fontSize: 18, fontWeight: "bold" },
  voiceButton: {
    backgroundColor: "#0A8F55",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  voiceButtonText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
});