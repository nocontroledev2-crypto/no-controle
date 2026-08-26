// @ts-nocheck

import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import AuthRequiredCard from "../components/AuthRequiredCard";
import { MASTER_CATEGORIES } from "../constants/categories";
import { getSubcategoriesByMaster } from "../constants/subcategories";
import { parseSpeech } from "../helpers/speechParser";
import { getCurrentUser } from "../services/authService";
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
  const [usuarioLogado, setUsuarioLogado] = useState<boolean | null>(null);

useFocusEffect(
  useCallback(() => {
    async function checkAuth() {
      const user = await getCurrentUser();
      setUsuarioLogado(!!user);
    }

    checkAuth();
  }, [])
);

  const recognitionRef = useRef<any>(null);
  const nativeResultReceivedRef = useRef(false);
  const valorInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const micPulse = useRef(new Animated.Value(1)).current;

  useSpeechRecognitionEvent("start", () => {
    if (Platform.OS !== "web") {
      nativeResultReceivedRef.current = false;
      setState("listening");
    }
  });

  useSpeechRecognitionEvent("result", (event) => {
    if (Platform.OS === "web") return;

    const textoFalado = event.results[0]?.transcript?.trim();

    if (textoFalado) {
      nativeResultReceivedRef.current = true;
      processarTextoInteligente(textoFalado);
    }
  });

  useSpeechRecognitionEvent("end", () => {
    if (Platform.OS !== "web") {
      if (!nativeResultReceivedRef.current) {
        setState("idle");
      }

      nativeResultReceivedRef.current = false;
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    if (Platform.OS === "web") return;

    setState("idle");

    if (event.error !== "aborted") {
      alert(
        "Não foi possível reconhecer sua fala. Tente novamente em um ambiente mais silencioso."
      );
    }
  });

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

  function processarTextoInteligente(textoRecebido: string) {
    const texto = textoRecebido.trim();

    if (!texto) {
      setState("idle");
      return;
    }

    setTextoInteligente(texto);

    const parsed = parseSpeech(texto);

    if (parsed.valor !== null) {
      const valorInterpretado = Number(parsed.valor);

      if (Number.isFinite(valorInterpretado)) {
        setValor(formatarValorParaCampo(valorInterpretado));
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

  function formatarValorParaCampo(valorRecebido: number | string) {
    const numero = Number(valorRecebido);

    if (!Number.isFinite(numero)) {
      return "";
    }

    return numero.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
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

  async function iniciarEscuta() {
    Keyboard.dismiss();

    if (Platform.OS !== "web") {
      nativeResultReceivedRef.current = false;

      try {
        const permissao =
          await ExpoSpeechRecognitionModule.requestPermissionsAsync();

        if (!permissao.granted) {
          alert(
            "Para usar a Fala Inteligente, permita o acesso ao microfone nas configurações do aparelho."
          );
          setState("idle");
          return;
        }

        ExpoSpeechRecognitionModule.start({
          lang: "pt-BR",
          interimResults: false,
          continuous: false,
          maxAlternatives: 1,
        });
      } catch (error) {
        setState("idle");
        alert(
          "Não foi possível iniciar a Fala Inteligente. Tente novamente."
        );
      }

      return;
    }

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
      processarTextoInteligente(textoFalado);
    };

    recognition.onerror = () => setState("idle");
    recognition.start();
  }

  function cancelarEscuta() {
    if (Platform.OS === "web") {
      recognitionRef.current?.stop();
    } else {
      nativeResultReceivedRef.current = false;
      ExpoSpeechRecognitionModule.stop();
    }

    setState("idle");
  }

  function entenderTextoDigitado() {
    const texto = textoInteligente.trim();

    if (!texto) {
      alert("Digite uma despesa para o Enxergaí entender.");
      return;
    }

    setState("processing");
    processarTextoInteligente(texto);
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

   try {
  await saveExpense({
    id: Date.now().toString(),
    valor: Number(valorNumerico.toFixed(2)),
    categoria,
    subcategoria,
    termoEncontrado,
    data: dataFinal.toISOString().split("T")[0],
    createdAt: new Date().toISOString(),
  });
} catch (error) {
  alert(
    "Não foi possível salvar a despesa.\n\n" +
      String(error instanceof Error ? error.message : error)
  );
  return;
}

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
  valorInputRef.current?.blur();
  Keyboard.dismiss();

        scrollViewRef.current?.scrollTo({
        y: 0,
        animated: true,
      });
    }, 150);
  }

  function alterarDados() {
    setState("idle");
    setTimeout(() => valorInputRef.current?.focus(), 100);
  }

 
if (usuarioLogado === false) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Registrar despesa</Text>
      <AuthRequiredCard />
    </ScrollView>
  );
}

  return (
    <>
      <ScrollView
      ref={scrollViewRef}
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
  {state === "confirm" && textoInteligente ? (
  <Text style={styles.detailText}>
    Texto entendido: {textoInteligente}
  </Text>
) : null}

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

            <View
  style={[
    styles.categoryDropdownWrapper,
    menuCategoriaAberto && styles.categoryDropdownWrapperOpen,
  ]}
>
  <TouchableOpacity
  style={styles.categorySelectButton}
  onPress={() => {
    Keyboard.dismiss();
    valorInputRef.current?.blur();
    setMenuCategoriaAberto(!menuCategoriaAberto);
    setMenuSubcategoriaAberto(false);
  }}
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

</View>

            {categoria && subcategoriasDisponiveis.length > 0 ? (
              <>
                <Text style={styles.label}>Subcategoria</Text>

                <View
  style={[
    styles.categoryDropdownWrapper,
    menuSubcategoriaAberto && styles.categoryDropdownWrapperOpen,
  ]}
>
  <TouchableOpacity
  style={styles.categorySelectButton}
  onPress={() => {
    Keyboard.dismiss();
    valorInputRef.current?.blur();
    setMenuSubcategoriaAberto(!menuSubcategoriaAberto);
    setMenuCategoriaAberto(false);
  }}
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

    <Modal
      visible={menuCategoriaAberto || menuSubcategoriaAberto}
      transparent
      animationType="fade"
      onRequestClose={() => {
        setMenuCategoriaAberto(false);
        setMenuSubcategoriaAberto(false);
      }}
    >
      <View style={styles.selectorModalOverlay}>
        <View style={styles.selectorModalCard}>
          <Text style={styles.selectorModalTitle}>
            {menuCategoriaAberto
              ? "Selecione a categoria"
              : "Selecione a subcategoria"}
          </Text>

          <FlatList
            style={styles.selectorModalList}
            data={
              menuCategoriaAberto
                ? MASTER_CATEGORIES
                : subcategoriasDisponiveis
            }
            keyExtractor={(item) => item}
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const itemSelecionado = menuCategoriaAberto
                ? categoria === item
                : subcategoria === item;

              return (
                <TouchableOpacity
                  style={[
                    styles.categoryMenuItem,
                    itemSelecionado && styles.selectorModalItemActive,
                  ]}
                  onPress={() => {
                    if (menuCategoriaAberto) {
                      selecionarCategoriaManual(item);
                    } else {
                      selecionarSubcategoriaManual(item);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.categoryMenuItemText,
                      itemSelecionado &&
                        styles.categoryMenuItemTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          <TouchableOpacity
            style={styles.selectorModalCloseButton}
            onPress={() => {
              setMenuCategoriaAberto(false);
              setMenuSubcategoriaAberto(false);
            }}
          >
            <Text style={styles.selectorModalCloseText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </>
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
  overflow: "visible",
},

sectionCardOnTop: {
  zIndex: 3000,
  elevation: 12,
},

categoryDropdownWrapper: {
  position: "relative",
  zIndex: 1,
  marginBottom: 8,
},

categoryDropdownWrapperOpen: {
  zIndex: 9000,
  elevation: 20,
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
  zIndex: 10000,
  elevation: 30,
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


selectorModalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.45)",
  justifyContent: "center",
  paddingHorizontal: 20,
  paddingVertical: 40,
},

selectorModalCard: {
  width: "100%",
  maxHeight: "75%",
  backgroundColor: "#FFFFFF",
  borderRadius: 16,
  padding: 16,
  borderWidth: 1,
  borderColor: "#DDE3EA",
  elevation: 12,
  shadowColor: "#000000",
  shadowOffset: {
    width: 0,
    height: 5,
  },
  shadowOpacity: 0.2,
  shadowRadius: 12,
},

selectorModalTitle: {
  fontSize: 18,
  fontWeight: "800",
  color: "#333333",
  textAlign: "center",
  marginBottom: 12,
},

selectorModalList: {
  flexGrow: 0,
  maxHeight: 420,
},

selectorModalItemActive: {
  backgroundColor: "#F0FAF5",
  borderRadius: 8,
},

selectorModalCloseButton: {
  backgroundColor: "#0A8F55",
  borderRadius: 10,
  paddingVertical: 12,
  alignItems: "center",
  marginTop: 14,
},

selectorModalCloseText: {
  color: "#FFFFFF",
  fontSize: 14,
  fontWeight: "800",
},

});