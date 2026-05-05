import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { matchCategory } from "../helpers/categoryMatcher";
import { saveExpense } from "../storage/expenseStorage";

type RegistrarState = "idle" | "listening" | "processing" | "confirm";

export default function Registrar() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [state, setState] = useState<RegistrarState>("idle");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");

  const recognitionRef = useRef<any>(null);

  /**
   * 🎙️ Inicializa Web Speech API
   */
  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Reconhecimento de voz não suportado neste navegador.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setState("listening");
    };

    recognition.onresult = (event: any) => {
      const textoFalado = event.results[0][0].transcript;
      console.log("🎙️ Texto reconhecido:", textoFalado);

      setState("processing");

      // Extrai número (valor)
      const valorEncontrado = textoFalado.match(/\d+([.,]\d+)?/);
      if (valorEncontrado) {
        setValor(valorEncontrado[0].replace(",", "."));
      }

      // Categoria por match semântico
      setCategoria(matchCategory(textoFalado));
      setState("confirm");
    };

    recognition.onerror = () => {
      alert("Erro ao reconhecer a fala.");
      setState("idle");
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  /**
   * 🎤 Disparo automático quando vem da Home
   */
  useEffect(() => {
    if (params.startVoice === "true") {
      startListening();
    }
  }, [params.startVoice]);

  /**
   * ✅ Confirma e salva
   */
  async function confirmarRegistro() {
    if (!valor || !categoria) {
      alert("Preencha valor e categoria");
      return;
    }

    await saveExpense({
      id: Date.now().toString(),
      valor: Number(valor),
      categoria,
      data: "Hoje",
      createdAt: new Date().toISOString(),
    });

    setValor("");
    setCategoria("");
    setState("idle");
    router.replace("/(tabs)/home");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrar despesa</Text>

      {state === "listening" && (
        <Text style={styles.voiceText}>🎙️ Pode falar…</Text>
      )}

      {state === "processing" && (
        <Text style={styles.voiceText}>
          ⏳ Entendendo sua despesa…
        </Text>
      )}

      {(state === "idle" || state === "confirm") && (
        <>
          <Text style={styles.label}>Valor</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 45,90"
            keyboardType="numeric"
            value={valor}
            onChangeText={setValor}
          />

          <Text style={styles.label}>Categoria</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Transporte"
            value={categoria}
            onChangeText={setCategoria}
          />

          {state === "confirm" ? (
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={confirmarRegistro}
            >
              <Text style={styles.confirmText}>
                ✅ Confirmar despesa
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.voiceButton}
              onPress={startListening}
            >
              <Text style={styles.voiceButtonText}>
                🎤 Falar despesa
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}
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
  voiceText: {
    textAlign: "center",
    color: "#0A8F55",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  voiceButton: {
    backgroundColor: "#0A8F55",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  voiceButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: "#0A8F55",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});