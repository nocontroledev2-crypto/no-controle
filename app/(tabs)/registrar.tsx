import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MASTER_CATEGORIES } from "../constants/categories";
import { getSubcategoriesByMaster } from "../constants/subcategories";
import { parseSpeech } from "../helpers/speechParser";
import { saveExpense } from "../storage/expenseStorage";

type RegistrarState = "idle" | "listening" | "processing" | "confirm";

export default function Registrar() {
  const router = useRouter();

  const [state, setState] = useState<RegistrarState>("idle");
  const [textoInteligente, setTextoInteligente] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [menuCategoriaAberto, setMenuCategoriaAberto] = useState(false);
  const [subcategoria, setSubcategoria] = useState("");
  const [menuSubcategoriaAberto, setMenuSubcategoriaAberto] = useState(false);
  const [termoEncontrado, setTermoEncontrado] = useState("");
  const [data, setData] = useState(new Date());
  const [dataTexto, setDataTexto] = useState(formatarData(new Date()));

  const recognitionRef = useRef<any>(null);
  const valorInputRef = useRef<TextInput>(null);
  const micPulse = useRef(new Animated.Value(1)).current;

  function formatarData(date: Date) {
    return date.toLocaleDateString("pt-BR");
  }

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

  function normalizarTextoBase(texto: string) {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function normalizarCategoriaDetectada(categoriaTexto?: string) {
    const categoriaLimpa = (categoriaTexto ?? "").trim();

    const categoriaEncontrada = MASTER_CATEGORIES.find(
      (cat) =>
        normalizarTextoBase(cat) === normalizarTextoBase(categoriaLimpa)
    );

    return categoriaEncontrada ?? "";
  }

  function selecionarCategoriaManual(categoriaSelecionada: string) {
    setCategoria(categoriaSelecionada);
    setSubcategoria("");
    setTermoEncontrado("");
    setMenuCategoriaAberto(false);
    setMenuSubcategoriaAberto(false);
  }

  function selecionarSubcategoriaManual(subcategoriaSelecionada: string) {
    setSubcategoria(subcategoriaSelecionada);
    setTermoEncontrado("");
    setMenuSubcategoriaAberto(false);
  }

  const subcategoriasDisponiveis = getSubcategoriesByMaster(categoria);

  function parseValorMonetario(valorTexto: string) {
    if (!valorTexto) return NaN;

    let texto = valorTexto
      .trim()
      .replace(/[R$\s]/g, "");

    if (!texto) return NaN;

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

      const parsed = parseSpeech(textoFalado);

      if (parsed.valor !== null) {
        const valorVoz = Number(parsed.valor);

        if (Number.isFinite(valorVoz)) {
          setValor(String(valorVoz).replace(".", ","));
        }
      }

      const categoriaDetectada = normalizarCategoriaDetectada(parsed.categoria);

      setCategoria(categoriaDetectada);
      setSubcategoria(categoriaDetectada ? parsed.subcategoria ?? "" : "");
      setTermoEncontrado(categoriaDetectada ? parsed.termoEncontrado ?? "" : "");
      setMenuCategoriaAberto(false);
      setMenuSubcategoriaAberto(false);
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

    const categoriaDetectada = normalizarCategoriaDetectada(parsed.categoria);

    setCategoria(categoriaDetectada);
    setSubcategoria(categoriaDetectada ? parsed.subcategoria ?? "" : "");
    setTermoEncontrado(categoriaDetectada ? parsed.termoEncontrado ?? "" : "");
    setMenuCategoriaAberto(false);
    setMenuSubcategoriaAberto(false);
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Registrar despesa</Text>

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
          {state === "idle" && (
            <>
              <View style={styles.sectionCard}>
                <TouchableOpacity
                  style={styles.voiceButton}
                  onPress={iniciarEscuta}
                >
                  <Text style={styles.confirmText}>
                    🎤 Fala Inteligente
                  </Text>
                </TouchableOpacity>

                <Text style={styles.voiceFirstHint}>
                  Fale naturalmente. Ex: “Ontem gastei 322 reais no restaurante”.
                </Text>
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionLabel}>
                  ✍️ Digitação Inteligente
                </Text>

                <TextInput
                  style={styles.smartInput}
                  value={textoInteligente}
                  onChangeText={setTextoInteligente}
                  placeholder="Digite sua despesa"
                  placeholderTextColor="#9CA3AF"
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
                  Você pode escrever como fala. Ex: “Mês que vem vou pagar Netflix 250 reais”.
                </Text>
              </View>
            </>
          )}

          <View
  style={[
    styles.sectionCard,
    (menuCategoriaAberto || menuSubcategoriaAberto) &&
      styles.sectionCardOnTop,
  ]}
>
  <Text style={styles.sectionLabel}>
    {state === "confirm"
      ? "🧾 Revisar despesa"
      : "🧾 Preencher manualmente"}
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

            <View style={styles.categoryDropdownWrapper}>
  <TouchableOpacity
    style={styles.categorySelectButton}
    onPress={() => setMenuCategoriaAberto(!menuCategoriaAberto)}
    activeOpacity={0.85}
  >
    <Text
      style={[
        styles.categorySelectText,
        !categoria && styles.categoryPlaceholder,
      ]}
    >
      {categoria || "Selecione a categoria"}
    </Text>

    <Text style={styles.categorySelectArrow}>
      {menuCategoriaAberto ? "▲" : "▼"}
    </Text>
  </TouchableOpacity>

  {menuCategoriaAberto ? (
    <View style={styles.categoryMenuFloating}>
      <ScrollView
        style={styles.categoryMenuScroll}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled
      >
        {MASTER_CATEGORIES.map((cat: string) => (
          <TouchableOpacity
            key={cat}
            style={styles.categoryMenuItem}
            onPress={() => selecionarCategoriaManual(cat)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.categoryMenuItemText,
                categoria === cat &&
                  styles.categoryMenuItemTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.categoryMenuHint}>
        Role para ver mais categorias
      </Text>
    </View>
  ) : null}
</View>

            {categoria && subcategoriasDisponiveis.length > 0 ? (
              <>
                <Text style={styles.label}>Subcategoria</Text>

                <View style={styles.categoryDropdownWrapper}>
  <TouchableOpacity
    style={styles.categorySelectButton}
    onPress={() =>
      setMenuSubcategoriaAberto(!menuSubcategoriaAberto)
    }
    activeOpacity={0.85}
  >
    <Text
      style={[
        styles.categorySelectText,
        !subcategoria && styles.categoryPlaceholder,
      ]}
    >
      {subcategoria || "Selecione a subcategoria"}
    </Text>

    <Text style={styles.categorySelectArrow}>
      {menuSubcategoriaAberto ? "▲" : "▼"}
    </Text>
  </TouchableOpacity>

  {menuSubcategoriaAberto ? (
    <View style={styles.categoryMenuFloating}>
      <ScrollView
        style={styles.categoryMenuScroll}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled
      >
        {subcategoriasDisponiveis.map((sub: string) => (
          <TouchableOpacity
            key={sub}
            style={styles.categoryMenuItem}
            onPress={() => selecionarSubcategoriaManual(sub)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.categoryMenuItemText,
                subcategoria === sub &&
                  styles.categoryMenuItemTextActive,
              ]}
            >
              {sub}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.categoryMenuHint}>
        Role para ver mais opções
      </Text>
    </View>
  ) : null}
</View>
              </>
            ) : null}

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
              </>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F2",
  },

  contentContainer: {
    padding: 20,
    paddingBottom: 180,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    marginBottom: 4,
  },

  input: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  voiceContainer: {
    alignItems: "center",
    marginBottom: 24,
  },

  micIcon: {
    fontSize: 48,
    marginBottom: 8,
  },

  voiceText: {
    fontSize: 16,
    color: "#0A8F55",
    marginBottom: 8,
    textAlign: "center",
  },

  cancelText: {
    color: "#C0392B",
    fontWeight: "600",
  },

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
    marginBottom: 0,
  },

  categorySelectButton: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  categorySelectText: {
    fontSize: 16,
    color: "#111827",
    flex: 1,
  },

  categoryPlaceholder: {
    color: "#9CA3AF",
  },

  categorySelectArrow: {
    fontSize: 12,
    color: "#555",
    marginLeft: 8,
  },

  categoryMenu: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    marginBottom: 12,
    maxHeight: 220,
    overflow: "hidden",
  },

  categoryMenuScroll: {
    maxHeight: 220,
  },

  categoryMenuItem: {
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F0F0F0",
  },

  categoryMenuItemText: {
    fontSize: 15,
    color: "#333",
  },

  categoryMenuItemTextActive: {
    color: "#0A8F55",
    fontWeight: "700",
  },

  voiceFirstHint: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },

  sectionLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#333",
    marginBottom: 8,
  },

  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: "#DDE3EA",
  },

sectionCardOnTop: {
  zIndex: 3000,
  elevation: 12,
},

categoryDropdownWrapper: {
  position: "relative",
  zIndex: 2500,
  marginBottom: 8,
},

categoryMenuFloating: {
  position: "absolute",
  top: 54,
  left: 0,
  right: 0,
  backgroundColor: "#FFFFFF",
  borderWidth: 1,
  borderColor: "#DDE3EA",
  borderRadius: 12,
  maxHeight: 320,
  overflow: "hidden",
  zIndex: 5000,
  elevation: 16,
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 4,
  },
  shadowOpacity: 0.12,
  shadowRadius: 10,
},

categoryMenuScroll: {
  maxHeight: 280,
},

categoryMenuHint: {
  fontSize: 11,
  color: "#777",
  textAlign: "center",
  paddingVertical: 7,
  borderTopWidth: 0.5,
  borderTopColor: "#EEF0F3",
  backgroundColor: "#FAFAFA",
},


});