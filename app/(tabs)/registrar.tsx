import { useRouter } from "expo-router";
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

type RegistrarState = "idle" | "listening" | "processing" | "confirm";

export default function Registrar() {
  const router = useRouter();

  const [state, setState] = useState<RegistrarState>("idle");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [data, setData] = useState(new Date());

  const recognitionRef = useRef<any>(null);
  const valorInputRef = useRef<TextInput>(null);
  const micPulse = useRef(new Animated.Value(1)).current;

  /* ✅ FORMATAR DATA */
  function formatarData(date: Date) {
    return date.toLocaleDateString("pt-BR");
  }

  /* ✅ PARSE DATA DO INPUT */
  function parseData(text: string) {
    const partes = text.split("/");

    if (partes.length !== 3) return new Date();

    const [dia, mes, ano] = partes;

    return new Date(
      Number(ano),
      Number(mes) - 1,
      Number(dia)
    );
  }

  /* 🎤 animação */
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
  }, [state]);

  /* 🎙️ iniciar voz */
  function iniciarEscuta() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Reconhecimento de voz não suportado.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognitionRef.current = recognition;

    recognition.onstart = () => setState("listening");

    recognition.onresult = (event: any) => {
      const textoFalado = event.results[0][0].transcript;

      setState("processing");

      const parsed = parseSpeech(textoFalado);

      if (parsed.valor !== null) setValor(String(parsed.valor));
      setCategoria(parsed.categoria);
      setData(parsed.data);

      setState("confirm");
    };

    recognition.onerror = () => setState("idle");

    recognition.start();
  }

  function cancelarEscuta() {
    recognitionRef.current?.stop();
    setState("idle");
  }

  async function salvarDespesa() {
    if (!valor || !categoria) {
      alert("Preencha valor e categoria");
      return;
    }

    await saveExpense({
      id: Date.now().toString(),
      valor: Number(valor),
      categoria,
      data: data.toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
    });

    setValor("");
    setCategoria("");
    setData(new Date());
    setState("idle");

    setTimeout(() => {
      valorInputRef.current?.focus();
    }, 100);
  }

  function alterarDados() {
    setState("idle");
    setTimeout(() => valorInputRef.current?.focus(), 100);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrar despesa</Text>

      {/* 🎤 ESCUTA */}
      {state === "listening" && (
        <View style={styles.voiceContainer}>
          <Animated.Text
            style={[styles.micIcon, { transform: [{ scale: micPulse }] }]}
          >
            🎤
          </Animated.Text>
          <Text style={styles.voiceText}>Ouvindo… fale agora</Text>
          <TouchableOpacity onPress={cancelarEscuta}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
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
            ref={valorInputRef}
            style={styles.input}
            value={valor}
            keyboardType="numeric"
            onChangeText={setValor}
          />

          <Text style={styles.label}>Categoria</Text>
          
          <Text style={styles.label}>Categoria</Text>

<select
  value={categoria}
  onChange={(e) => setCategoria(e.target.value)}
  style={styles.input}
>
  <option value="">Selecione</option>

  <option>Alimentação</option>
  <option>Transporte</option>
  <option>Moradia</option>
  <option>Contas</option>
  <option>Assinaturas</option>
  <option>Saúde</option>
  <option>Serviços</option>
  <option>Cartão de crédito</option>
  <option>Outros</option>
</select>
``

          <Text style={styles.label}>Data</Text>
          <TextInput
            style={styles.input}
            value={formatarData(data)}
            onChangeText={(text) => setData(parseData(text))}
            placeholder="dd/mm/aaaa"
          />

          {state === "confirm" ? (
            <>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={salvarDespesa}
              >
                <Text style={styles.confirmText}>
                  ✅ Confirmar despesa
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={alterarDados}>
                <Text style={styles.editText}>
                  ✏️ Alterar dados
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.voiceButton}
                onPress={iniciarEscuta}
              >
                <Text style={styles.confirmText}>
                  🎤 Falar despesa
                </Text>
              </TouchableOpacity>

              {valor && categoria && (
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={salvarDespesa}
                >
                  <Text style={styles.confirmText}>
                    💾 Salvar despesa
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </>
      )}
    </View>
  );
}

/* 🎨 estilos mantidos */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F2F2F2" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  label: { fontSize: 14, marginBottom: 4 },
  input: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  voiceContainer: { alignItems: "center", marginBottom: 24 },
  micIcon: { fontSize: 48, marginBottom: 8 },
  voiceText: { fontSize: 16, color: "#0A8F55", marginBottom: 8 },
  cancelText: { color: "#C0392B", fontWeight: "600" },
  confirmButton: {
    backgroundColor: "#0A8F55",
    padding: 16,
    borderRadius: 10,
    marginTop: 10,
  },
  voiceButton: {
    backgroundColor: "#0A8F55",
    padding: 16,
    borderRadius: 10,
    marginTop: 10,
  },
  confirmText: {
    color: "#FFF",
    fontWeight: "bold",
    textAlign: "center",
  },
  editText: {
    textAlign: "center",
    marginTop: 8,
    color: "#2980B9",
    fontWeight: "600",
  },
});