import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function Home() {
  return (
    <View style={styles.container}>
      {/* TOPO */}
      <Text style={styles.title}>No Controle</Text>
      <Text style={styles.subtitle}>Hoje</Text>

      {/* INSIGHT */}
      <View style={styles.insightBox}>
        <Text style={styles.insightText}>
          Você ainda não registrou nenhum gasto hoje.
        </Text>
      </View>

      {/* MÉTRICAS */}
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

      {/* AÇÕES */}
      <TouchableOpacity style={styles.voiceButton}>
        <Text style={styles.voiceButtonText}>🎤 Falar despesa</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.manualButton}>
        <Text style={styles.manualButtonText}>➕ Registrar manualmente</Text>
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
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
  },
  insightBox: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  insightText: {
    fontSize: 16,
    color: "#333",
  },
  metrics: {
    marginBottom: 30,
  },
  metricCard: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
  },
  metricLabel: {
    fontSize: 14,
    color: "#666",
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  voiceButton: {
    backgroundColor: "#0A8F55",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  voiceButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  manualButton: {
    alignItems: "center",
    padding: 10,
  },
  manualButtonText: {
    fontSize: 16,
    color: "#0A8F55",
    fontWeight: "600",
  },
});
