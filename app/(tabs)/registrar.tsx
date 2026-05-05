import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { parseSpeech } from "../helpers/speechParser";
import { saveExpense } from "../storage/expenseStorage";

/**
 * Estados da tela Registrar
 */
type RegistrarState = "idle" | "listening" | "processing" | "confirm";

export default function Registrar() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [state, setState] = useState<RegistrarState>("idle");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");

  const recognitionRef = useRef<any>(null);

  /**
   * 🎤 Animação do microfone (pulsar)
   */
  const micPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state === "listening") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(micPulse, {
            toValue: 1.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(micPulse, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      micPulse.setValue(1);
    }
  }, [state, micPulse]);

  /**
   * 🎙️ Inicia o reconhecimento de voz REAL (Web Speech API)
   */
  function iniciarEscuta() {
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

      const parsed = parseSpeech(textoFalado);

      if (parsed.valor !== null) {
        setValor(String(parsed.valor));
      }

      setCategoria(parsed.categoria);
      setState("confirm");
    };

    recognition.onerror = () => {
      alert("Erro ao reconhecer a fala.");
      setState("idle");
    };

    recognition.start();
    recognitionRef.current = recognition;
  }

  /**
   * 🎤 Disparo automático de voz quando vem da Home
   */
  useEffect(() => {
    if (params.startVoice === "true") {
      iniciarEscuta();
    }
  }, [params.startVoice]);

  /**
   * ✅ Confirma e salva a despesa
   */
  async function confirmarRegistro() {
    if (!valor || !categoria) {
      alert("Preencha valor e categoria");
      return;
    }

    await saveExpense({
      id: Date.now().toString(),
      valor: Number(valor.replace(",", ".")),
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

      {/* 🎙️ ESCUTANDO */}
      {state === "listening" && (
        <View style={styles.voiceContainer}>
          <Animated.Text
            style={[
              styles.micIcon,
              { transform: [{ scale: micPulse }] },
            ]}
          >
            🎤
          </Animated.Text>
          <Text style={styles.voiceText}>Ouvindo… fale agora</Text>
        </View>
      )}

      {/* ⏳ PROCESSANDO */}
      {state === "processing" && (
        <View style={styles.voiceContainer}>
          <Text style={styles.processingIcon}>⏳</Text>
          <Text style={styles.voiceText}>
            Entendendo sua despesa…
          </Text>
        </View>
      )}

      {/* ✍️ FORMULÁRIO */}
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
              onPress={iniciarEscuta}
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
  voiceContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  micIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  processingIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  voiceText: {
    textAlign: "center",
    color: "#0A8F55",
    fontSize: 16,
    fontWeight: "600",
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