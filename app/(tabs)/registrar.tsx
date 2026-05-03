import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { matchCategory } from "../helpers/categoryMatcher";

type VoiceState = "preparing" | "listening" | "processing";

export default function Registrar() {
  const router = useRouter();
  const { voiceId } = useLocalSearchParams();

  const [voiceState, setVoiceState] = useState<VoiceState | null>(null);

  // 🔁 Sempre que o voiceId mudar, reinicia o fluxo
  useEffect(() => {
    if (!voiceId) return;

    setVoiceState("preparing");

    const t1 = setTimeout(() => {
      setVoiceState("listening");
    }, 1200);

    const t2 = setTimeout(() => {
      setVoiceState("processing");
    }, 2600);

    const t3 = setTimeout(() => {
      const textoFalado = "45 reais gasolina";
      const categoria = matchCategory(textoFalado);

      router.replace({
        pathname: "/(tabs)/confirmacao",
        params: {
          valor: "R$ 45,00",
          categoria,
          data: "Hoje",
        },
      });
    }, 4200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [voiceId, router]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrar despesa</Text>

      {voiceState === "preparing" && (
        <Text style={styles.stateText}>🎤 Preparando registro por voz…</Text>
      )}
      {voiceState === "listening" && (
        <Text style={styles.stateText}>🎙️ Pode falar…</Text>
      )}
      {voiceState === "processing" && (
        <Text style={styles.stateText}>⏳ Entendendo sua despesa…</Text>
      )}

      {!voiceId && (
        <>
          <Text style={styles.label}>Valor</Text>
          <TextInput style={styles.input} placeholder="Ex: 45,90" />

          <Text style={styles.label}>Categoria</Text>
          <TextInput style={styles.input} placeholder="Ex: Supermercado" />

          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Salvar despesa</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F2F2F2" },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 16 },
  stateText: { fontSize: 16, color: "#0A8F55", textAlign: "center", marginTop: 16 },
  label: { fontSize: 14, marginBottom: 5 },
  input: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#0A8F55",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
});