import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Expense, getAllExpenses } from "../storage/expenseStorage";

const SIMULATOR_CONFIG_KEY = "@no-controle:simulator-config";

type SimulatorConfig = {
  rendaMensal: string;
  metaEconomia: string;
};

function parseDateSafe(dateStr: string) {
  const [ano, mes, dia] = dateStr.split("-");
  return new Date(Number(ano), Number(mes) - 1, Number(dia));
}

function parseValorMonetario(valorTexto: string) {
  if (!valorTexto) return NaN;

  let texto = valorTexto.trim().replace(/[R$\s]/g, "");

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

function formatMoney(valor: number | null | undefined) {
  const safeValue = Number(valor);

  return (Number.isFinite(safeValue) ? safeValue : 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function Simulador() {
  const { width } = useWindowDimensions();
  const isMobile = width < 480;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [rendaMensal, setRendaMensal] = useState("");
  const [metaEconomia, setMetaEconomia] = useState("");
  const [mensagem, setMensagem] = useState("");

  const now = new Date();

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const data = await getAllExpenses();
        const savedConfig = await AsyncStorage.getItem(SIMULATOR_CONFIG_KEY);

        const normalizedData = (data || []).map((item: any) => {
          const safeValue = Number(item.valor);

          return {
            ...item,
            valor: Number.isFinite(safeValue) ? safeValue : 0,
          };
        });

        setExpenses(normalizedData);

        if (savedConfig) {
          const parsed: SimulatorConfig = JSON.parse(savedConfig);
          setRendaMensal(parsed.rendaMensal || "");
          setMetaEconomia(parsed.metaEconomia || "");
        }
      }

      load();
    }, [])
  );

  const currentMonthExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const d = parseDateSafe(item.data);

      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    });
  }, [expenses]);

  const totalMesAtual = useMemo(() => {
    return currentMonthExpenses.reduce(
      (sum, item) => sum + Number(item.valor || 0),
      0
    );
  }, [currentMonthExpenses]);

  const diasNoMes = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();

  const diaAtual = Math.min(now.getDate(), diasNoMes);

  const mediaDiariaAtual = diaAtual > 0 ? totalMesAtual / diaAtual : 0;

  const projecaoGastosMes =
    totalMesAtual > 0 ? mediaDiariaAtual * diasNoMes : 0;

  const rendaNumerica = parseValorMonetario(rendaMensal);
  const metaNumerica = parseValorMonetario(metaEconomia);

  const rendaValida = Number.isFinite(rendaNumerica) && rendaNumerica > 0;
  const metaValida = Number.isFinite(metaNumerica) && metaNumerica >= 0;

  const receitaConsiderada = rendaValida ? rendaNumerica : 0;
  const metaConsiderada = metaValida ? metaNumerica : 0;

  const saldoPrevisto = receitaConsiderada - projecaoGastosMes;
  const sobraAposMeta = saldoPrevisto - metaConsiderada;

  const porCategoria = useMemo(() => {
    const map: Record<string, number> = {};

    currentMonthExpenses.forEach((item) => {
      map[item.categoria] =
        (map[item.categoria] || 0) + Number(item.valor || 0);
    });

    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [currentMonthExpenses]);

  const categoriaMaisPesada = porCategoria[0];

  const economiaSimuladaCategoria = categoriaMaisPesada
    ? categoriaMaisPesada[1] * 0.2
    : 0;

  function getStatusSimulador() {
    if (!rendaValida) {
      return {
        titulo: "Informe sua renda mensal",
        detalhe:
          "Com a renda mensal, o No Controle consegue simular seu fechamento do mês.",
        tipo: "neutro",
      };
    }

    if (sobraAposMeta >= 0) {
      return {
        titulo: "Você está no controle",
        detalhe: `No ritmo atual, você pode fechar o mês mantendo sua meta de ${formatMoney(
          metaConsiderada
        )}.`,
        tipo: "positivo",
      };
    }

    if (saldoPrevisto >= 0) {
      return {
        titulo: "Atenção à sua meta",
        detalhe: `Você deve fechar o mês no positivo, mas pode faltar ${formatMoney(
          Math.abs(sobraAposMeta)
        )} para alcançar sua meta.`,
        tipo: "alerta",
      };
    }

    return {
      titulo: "Risco de fechar negativo",
      detalhe: `No ritmo atual, seus gastos podem ultrapassar sua renda em ${formatMoney(
        Math.abs(saldoPrevisto)
      )}.`,
      tipo: "risco",
    };
  }

  const status = getStatusSimulador();

  async function salvarConfiguracao() {
    if (!rendaValida) {
      alert("Informe uma renda mensal válida.");
      return;
    }

    if (!metaValida) {
      alert("Informe uma meta de economia válida. Se não tiver meta, use 0.");
      return;
    }

    const config: SimulatorConfig = {
      rendaMensal: rendaMensal.trim(),
      metaEconomia: metaEconomia.trim(),
    };

    await AsyncStorage.setItem(SIMULATOR_CONFIG_KEY, JSON.stringify(config));

    setMensagem("Simulação salva com sucesso.");

    setTimeout(() => {
      setMensagem("");
    }, 2500);
  }

  return (
    <View style={[styles.container, isMobile && styles.containerMobile]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Simulador</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🧮 Planeje seu mês</Text>

          <Text style={styles.label}>Renda mensal</Text>
          <TextInput
            style={styles.input}
            value={rendaMensal}
            onChangeText={setRendaMensal}
            placeholder="Ex: 5000,00"
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Meta de economia</Text>
          <TextInput
            style={styles.input}
            value={metaEconomia}
            onChangeText={setMetaEconomia}
            placeholder="Ex: 500,00"
            keyboardType="decimal-pad"
          />

          <TouchableOpacity style={styles.saveButton} onPress={salvarConfiguracao}>
            <Text style={styles.saveButtonText}>💾 Salvar simulação</Text>
          </TouchableOpacity>

          {mensagem ? <Text style={styles.successText}>{mensagem}</Text> : null}
        </View>

        <View style={styles.row}>
          <View style={[styles.card, styles.cardInRow]}>
            <Text style={styles.cardTitle}>💸 Gasto atual</Text>
            <Text style={styles.cardValue}>{formatMoney(totalMesAtual)}</Text>
            <Text style={styles.subText}>
              Total registrado neste mês.
            </Text>
          </View>

          <View style={[styles.card, styles.cardInRow]}>
            <Text style={styles.cardTitle}>📈 Projeção</Text>
            <Text style={styles.cardValue}>
              {formatMoney(projecaoGastosMes)}
            </Text>
            <Text style={styles.subText}>
              Estimativa até o fim do mês.
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.resultCard,
            status.tipo === "positivo" && styles.resultPositive,
            status.tipo === "alerta" && styles.resultAlert,
            status.tipo === "risco" && styles.resultRisk,
          ]}
        >
          <Text style={styles.resultTitle}>
            {status.tipo === "positivo"
              ? "✅ "
              : status.tipo === "alerta"
              ? "⚠️ "
              : status.tipo === "risco"
              ? "🚨 "
              : "ℹ️ "}
            {status.titulo}
          </Text>

          <Text style={styles.resultDetail}>{status.detalhe}</Text>

          {rendaValida && (
            <>
              <View style={styles.resultLine}>
                <Text style={styles.resultLabel}>Renda considerada</Text>
                <Text style={styles.resultValue}>
                  {formatMoney(receitaConsiderada)}
                </Text>
              </View>

              <View style={styles.resultLine}>
                <Text style={styles.resultLabel}>Saldo previsto</Text>
                <Text
                  style={[
                    styles.resultValue,
                    saldoPrevisto >= 0
                      ? styles.positiveText
                      : styles.negativeText,
                  ]}
                >
                  {formatMoney(saldoPrevisto)}
                </Text>
              </View>

              <View style={styles.resultLine}>
                <Text style={styles.resultLabel}>Após meta</Text>
                <Text
                  style={[
                    styles.resultValue,
                    sobraAposMeta >= 0
                      ? styles.positiveText
                      : styles.negativeText,
                  ]}
                >
                  {formatMoney(sobraAposMeta)}
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎯 Sugestão inteligente</Text>

          {currentMonthExpenses.length === 0 ? (
            <Text style={styles.subText}>
              Registre algumas despesas para o simulador gerar sugestões com base
              no seu comportamento real.
            </Text>
          ) : categoriaMaisPesada ? (
            <>
              <Text style={styles.subText}>
                Sua categoria com maior impacto neste mês é{" "}
                <Text style={styles.boldText}>{categoriaMaisPesada[0]}</Text>,
                com {formatMoney(categoriaMaisPesada[1])}.
              </Text>

              <Text style={styles.subText}>
                Se reduzir 20% nessa categoria, você pode economizar cerca de{" "}
                <Text style={styles.boldText}>
                  {formatMoney(economiaSimuladaCategoria)}
                </Text>.
              </Text>
            </>
          ) : (
            <Text style={styles.subText}>
              Ainda não há categoria suficiente para gerar sugestão.
            </Text>
          )}
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>📌 Versão MVP</Text>
          <Text style={styles.noteText}>
            Esta simulação usa uma estimativa simples baseada no ritmo atual de
            gastos do mês. Futuramente, o No Controle poderá considerar renda
            recorrente, gastos fixos, metas por categoria e cenários avançados.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  containerMobile: {
    paddingHorizontal: 12,
    paddingTop: 14,
  },

  scrollContent: {
    paddingBottom: 90,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0A8F55",
    textAlign: "center",
    marginBottom: 14,
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#E8EAEE",
  },

  row: {
    flexDirection: "row",
    gap: 10,
  },

  cardInRow: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
  },

  label: {
    fontSize: 13,
    color: "#555",
    marginBottom: 4,
    fontWeight: "600",
  },

  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 14,
    color: "#333",
  },

  saveButton: {
    backgroundColor: "#0A8F55",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    marginTop: 2,
  },

  saveButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },

  successText: {
    textAlign: "center",
    color: "#0A8F55",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 10,
  },

  cardValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0A8F55",
    marginBottom: 4,
  },

  subText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    marginBottom: 6,
  },

  boldText: {
    fontWeight: "700",
    color: "#333",
  },

  resultCard: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#E8EAEE",
  },

  resultPositive: {
    borderColor: "#BFE7D2",
    backgroundColor: "#F3FBF7",
  },

  resultAlert: {
    borderColor: "#F3D58A",
    backgroundColor: "#FFF8E6",
  },

  resultRisk: {
    borderColor: "#F3C2C2",
    backgroundColor: "#FFF5F5",
  },

  resultTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#333",
    marginBottom: 8,
  },

  resultDetail: {
    fontSize: 13,
    color: "#555",
    lineHeight: 18,
    marginBottom: 12,
  },

   resultLine: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  marginTop: 6,
  width: "100%",
  maxWidth: 520,
  alignSelf: "flex-start",
},

resultLabel: {
  fontSize: 13,
  color: "#666",
  flex: 1,
},

resultValue: {
  fontSize: 13,
  fontWeight: "700",
  color: "#333",
  textAlign: "right",
  minWidth: 110,
},

  positiveText: {
    color: "#0A8F55",
  },

  negativeText: {
    color: "#C0392B",
  },

  noteCard: {
    backgroundColor: "#EEF7F3",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#CFE8DB",
  },

  noteTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0A8F55",
    marginBottom: 8,
  },

  noteText: {
    fontSize: 13,
    color: "#4D6659",
    lineHeight: 18,
  },
  /*teste8/
});