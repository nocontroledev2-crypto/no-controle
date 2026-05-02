import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View,
} from "react-native";
import { matchCategory } from "../helpers/categoryMatcher";

export default function Registrar() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const iniciouPorVoz = params.voice === "true";

  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [data, setData] = useState("");
  const [estadoVoz, setEstadoVoz] =
    useState<"idle" | "listening" | "processing">("idle");

  useEffect(() => {
  if (iniciouPorVoz) {
    setEstadoVoz("listening");

    setTimeout(() => {
      setEstadoVoz("processing");

      setTimeout(() => {
        const textoFalado = "45 reais gasolina";
        const categoriaDetectada = matchCategory(textoFalado);

        router.replace({
          pathname: "/(tabs)/confirmacao",
          params: {
            valor: "R$ 45,00",
            categoria: categoriaDetectada,
            data: "Hoje",
          },
        });

        // RESET IMPORTANTE
        setEstadoVoz("idle");
      }, 1800); // ⏳ processamento visível
    }, 1500); // 🎙️ tempo para “falar”
  }
}, [iniciouPorVoz]);

  function salvarManual() {
    if (!valor || !categoria) {
      alert("Preencha valor e categoria");
      return;
    }
    alert("Despesa registrada manualmente (mock)");
    setValor(""); setCategoria(""); setData("");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrar despesa</Text>

      {estadoVoz === "listening" && (
        <Text style={styles.stateText}>🎙️ Pode falar…</Text>
      )}
      {estadoVoz === "processing" && (
        <Text style={styles.stateText}>⏳ Entendendo sua despesa…</Text>
      )}

      {!iniciouPorVoz && (
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
            placeholder="Ex: Supermercado"
            value={categoria}
            onChangeText={setCategoria}
          />

          <Text style={styles.label}>Data (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="DD/MM/AAAA ou deixar vazio"
            value={data}
            onChangeText={setData}
          />

          <TouchableOpacity style={styles.button} onPress={salvarManual}>
            <Text style={styles.buttonText}>Salvar despesa</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F2F2F2" },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  stateText: { textAlign: "center", color: "#0A8F55", marginBottom: 12, fontWeight: "600" },
  label: { fontSize: 14, marginBottom: 5 },
  input: { backgroundColor: "#FFF", padding: 12, borderRadius: 8, marginBottom: 15 },
  button: {
    backgroundColor: "#0A8F55", padding: 16, borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
});