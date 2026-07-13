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
import { MASTER_CATEGORIES } from "../constants/categories";
import { parseSpeech } from "../helpers/speechParser";
import { saveExpense } from "../storage/expenseStorage";

type RegistrarState = "idle" | "listening" | "processing" | "confirm";

export default function Registrar() {
  const router = useRouter();

  const [state, setState] = useState<RegistrarState>("idle");
  const [textoInteligente, setTextoInteligente] = useState("");
const [valor, setValor] = useState("");
const [categoria, setCategoria] = useState("");
const [subcategoria, setSubcategoria] = useState("");
const [termoEncontrado, setTermoEncontrado] = useState("");
const [data, setData] = useState(new Date());
  const [dataTexto, setDataTexto] = useState(formatarData(new Date()));

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

    const parsedDate = new Date(
      Number(ano),
      Number(mes) - 1,
      Number(dia)
    );

    if (isNaN(parsedDate.getTime())) {
      return new Date();
    }

    return parsedDate;
  }

  /* ✅ PARSE VALOR MONETÁRIO BR/PT-BR */
  function parseValorMonetario(valorTexto: string) {
    if (!valorTexto) return NaN;

    let texto = valorTexto
      .trim()
      .replace(/[R$\s]/g, "");

    if (!texto) return NaN;

    /*
      Regras:
      - "123,55"   -> 123.55
      - "1.234,56" -> 1234.56
      - "123.55"   -> 123.55
      - "1.234"    -> 1234
    */

    if (texto.includes(",")) {
      texto = texto.replace(/\./g, "").replace(",", ".");
    } else {
      const partes = texto.split(".");

      if (partes.length > 2) {
        const decimal = partes.pop();
        texto = partes.join("") + "." + decimal;
      } else if (
        partes.length === 2 &&
        partes[1].length === 3 &&
        partes[0].length <= 3
      ) {
        texto = partes.join("");
      }
    }

    return Number(texto);
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
         console.log(textoFalado);
       

      const parsed = parseSpeech(textoFalado);

      if (parsed.valor !== null) {
        const valorVoz = Number(parsed.valor);

        if (Number.isFinite(valorVoz)) {
          setValor(String(valorVoz).replace(".", ","));
        }
      }

      setCategoria(parsed.categoria);
      setSubcategoria(parsed.subcategoria ?? "");
      setTermoEncontrado(parsed.termoEncontrado ?? "");
      setData(parsed.data);
      setDataTexto(formatarData(parsed.data));

      setState("confirm");
    };

    recognition.onerror = () => setState("idle");

    recognition.start();
  }

  function cancelarEscuta() {
    recognitionRef.current?.stop();
    setState("idle");
  }
function entenderTextoDigitado() {
  const texto = textoInteligente.trim();

  if (!texto) {
    alert("Digite uma despesa para o No Controle entender.");
    return;
  }

  setState("processing");

  const parsed = parseSpeech(texto);

  if (parsed.valor !== null) {
    const valorTexto = String(parsed.valor).replace(".", ",");
    setValor(valorTexto);
  }

  setCategoria(parsed.categoria);
  setSubcategoria(parsed.subcategoria ?? "");
  setTermoEncontrado(parsed.termoEncontrado ?? "");
  setData(parsed.data);
  setDataTexto(formatarData(parsed.data));

  setState("confirm");
}
  async function salvarDespesa() {
    const valorNumerico = parseValorMonetario(valor);

    if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
      alert("Informe um valor válido para a despesa.");
      return;
    }

    if (!categoria) {
      alert("Selecione uma categoria.");
      return;
    }

    const dataFinal =
      data instanceof Date && !isNaN(data.getTime())
        ? data
        : new Date();

      await saveExpense({
      id: Date.now().toString(),
      valor: Number(valorNumerico.toFixed(2)),
      categoria,
      subcategoria,
      termoEncontrado,
      data: dataFinal.toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
      });

    const hoje = new Date();

    setTextoInteligente("");
setValor("");
setCategoria("");
setSubcategoria("");
setTermoEncontrado("");
setData(hoje);
setDataTexto(formatarData(hoje));
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
        <Text style={styles.label}>Digite sua despesa</Text>

<TextInput
  style={styles.smartInput}
  value={textoInteligente}
  onChangeText={setTextoInteligente}
  placeholder="Ex: Ontem gastei 250 reais no Carrefour"
  multiline
/>

<TouchableOpacity
  style={styles.smartButton}
  onPress={entenderTextoDigitado}
>
  <Text style={styles.confirmText}>
    ✨ Entender despesa
  </Text>
</TouchableOpacity>

<Text style={styles.smartHint}>
  Você pode escrever como fala: “Mês que vem vou pagar Netflix 250 reais”.
</Text>
          <Text style={styles.label}>Valor</Text>
          <TextInput
            ref={valorInputRef}
            style={styles.input}
            value={valor}
            keyboardType="decimal-pad"
            onChangeText={setValor}
            placeholder="Digite o valor"
          />

          <Text style={styles.label}>Categoria</Text>

          <select
  value={categoria}
  onChange={(e) => {
    setCategoria(e.target.value);
    setSubcategoria("");
    setTermoEncontrado("");
  }}
  style={styles.input}
>
  <option value="">Selecione a categoria</option>

  {MASTER_CATEGORIES.map((cat: string) => (
    <option key={cat} value={cat}>
      {cat}
    </option>
  ))}
</select>

     {subcategoria ? (
     <Text style={styles.detailText}>
      Detalhe identificado: {subcategoria}
      </Text>
      ) : null}

          <Text style={styles.label}>Data</Text>
          <TextInput
            style={styles.input}
            value={dataTexto}
            onChangeText={(text) => {
              setDataTexto(text);
              setData(parseData(text));
            }}
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

<TouchableOpacity
  style={styles.voiceButton}
  onPress={iniciarEscuta}
>
  <Text style={styles.confirmText}>
    🎤 Falar despesa
  </Text>
</TouchableOpacity>
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
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
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

  detailText: {
  fontSize: 13,
  color: "#0A8F55",
  marginBottom: 10,
  fontWeight: "600",
},

smartInput: {
  backgroundColor: "#F9FAFB",
  padding: 12,
  borderRadius: 10,
  marginBottom: 10,
  fontSize: 16,
  borderWidth: 1,
  borderColor: "#E5E7EB",
  minHeight: 70,
  textAlignVertical: "top",
},

smartButton: {
  backgroundColor: "#0A8F55",
  padding: 14,
  borderRadius: 10,
  marginBottom: 8,
},

smartHint: {
  fontSize: 12,
  color: "#666",
  marginBottom: 14,
},
});