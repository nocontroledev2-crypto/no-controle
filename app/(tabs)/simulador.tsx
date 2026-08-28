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
import {
  getCurrentUser,
  getProfile,
  upsertProfile,
} from "../services/authService";
import { Expense, getAllExpenses } from "../storage/expenseStorage";

const SIMULATOR_CONFIG_KEY = "@no-controle:simulator-config";

function getSimulatorConfigKey(userId: string) {
  return `${SIMULATOR_CONFIG_KEY}:${userId}`;
}

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

function formatarEntradaMonetaria(valorDigitado: string) {
  const somenteNumeros = valorDigitado.replace(/\D/g, "");
  const centavos = Number(somenteNumeros || "0");

  return formatMoney(centavos / 100);
}

function formatarValorCarregado(valorSalvo: string) {
  if (!valorSalvo) {
    return "";
  }

  const valorNumerico = parseValorMonetario(valorSalvo);

  return Number.isFinite(valorNumerico)
    ? formatMoney(valorNumerico)
    : "";
}

function valorMonetarioParaPersistencia(valorFormatado: string) {
  const valorNumerico = parseValorMonetario(valorFormatado);

  return Number.isFinite(valorNumerico)
    ? String(valorNumerico)
    : "";
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

        const normalizedData = (data || []).map((item: any) => {
          const safeValue = Number(item.valor);

          return {
            ...item,
            valor: Number.isFinite(safeValue) ? safeValue : 0,
          };
        });

        setExpenses(normalizedData);

        const user = await getCurrentUser();

        if (!user) {
          setRendaMensal("");
          setMetaEconomia("");
          return;
        }

        const userConfigKey = getSimulatorConfigKey(user.id);
        const savedConfig = await AsyncStorage.getItem(userConfigKey);

        let localConfig: SimulatorConfig = {
          rendaMensal: "",
          metaEconomia: "",
        };

        if (savedConfig) {
          try {
            const parsed: SimulatorConfig = JSON.parse(savedConfig);

            localConfig = {
              rendaMensal: parsed.rendaMensal || "",
              metaEconomia: parsed.metaEconomia || "",
            };
          } catch (error) {
            console.error(
              "Erro ao carregar configuracao local do Simulador:",
              error
            );
          }
        }

        const { data: profile, error: profileError } =
          await getProfile(user.id);

        if (profileError) {
          console.error(
            "Erro ao carregar configuracao do Simulador na nuvem:",
            profileError
          );

          setRendaMensal(
            formatarValorCarregado(localConfig.rendaMensal)
          );
          setMetaEconomia(
            formatarValorCarregado(localConfig.metaEconomia)
          );
          return;
        }

        const rendaNuvem =
          profile?.renda_mensal !== null &&
          profile?.renda_mensal !== undefined
            ? String(profile.renda_mensal)
            : "";

        const metaNuvem =
          profile?.meta_economia !== null &&
          profile?.meta_economia !== undefined
            ? String(profile.meta_economia)
            : "";

        const configFinal: SimulatorConfig = {
          rendaMensal: rendaNuvem || localConfig.rendaMensal,
          metaEconomia: metaNuvem || localConfig.metaEconomia,
        };

        setRendaMensal(
          formatarValorCarregado(configFinal.rendaMensal)
        );
        setMetaEconomia(
          formatarValorCarregado(configFinal.metaEconomia)
        );

        if (rendaNuvem || metaNuvem) {
          await AsyncStorage.setItem(
            userConfigKey,
            JSON.stringify(configFinal)
          );
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
const diasRestantes = Math.max(diasNoMes - diaAtual, 0);

const mediaDiariaAtual = diaAtual > 0 ? totalMesAtual / diaAtual : 0;

  const projecaoGastosMes =
    totalMesAtual > 0 ? mediaDiariaAtual * diasNoMes : 0;

  const rendaNumerica = parseValorMonetario(rendaMensal);
  const metaNumerica = parseValorMonetario(metaEconomia);

  const rendaValida = Number.isFinite(rendaNumerica) && rendaNumerica > 0;
  const metaValida = Number.isFinite(metaNumerica) && metaNumerica >= 0;

  const receitaConsiderada = rendaValida ? rendaNumerica : 0;
  const metaConsiderada = metaValida ? metaNumerica : 0;

  const saldoAtual = receitaConsiderada - totalMesAtual;
  const saldoAtualAposMeta = saldoAtual - metaConsiderada;
  const saldoProjetado = receitaConsiderada - projecaoGastosMes;
  const saldoProjetadoAposMeta =
    saldoProjetado - metaConsiderada;

  const saldoAtualCentavos = Math.round(saldoAtual * 100);
  const saldoAtualAposMetaCentavos =
    Math.round(saldoAtualAposMeta * 100);

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
          "Com a renda mensal, o Enxergaí consegue estimar como o mês pode terminar.",
        tipo: "neutro",
      };
    }

    if (saldoProjetadoAposMeta >= 0) {
      return {
        titulo: "A projeção mantém sua meta",
        detalhe: `Se o ritmo atual continuar, você pode fechar o mês mantendo sua meta de ${formatMoney(
          metaConsiderada
        )}.`,
        tipo: "positivo",
      };
    }

    if (saldoProjetado >= 0) {
      return {
        titulo: "A projeção pede atenção à meta",
        detalhe: `Se o ritmo atual continuar, o mês pode terminar no positivo, mas podem faltar ${formatMoney(
          Math.abs(saldoProjetadoAposMeta)
        )} para alcançar sua meta.`,
        tipo: "alerta",
      };
    }

    return {
      titulo: "Risco projetado de fechar negativo",
      detalhe: `Se o ritmo atual continuar, os gastos podem ultrapassar sua renda em ${formatMoney(
        Math.abs(saldoProjetado)
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
      rendaMensal:
        valorMonetarioParaPersistencia(rendaMensal),
      metaEconomia:
        valorMonetarioParaPersistencia(metaEconomia),
    };

    const user = await getCurrentUser();

    if (!user) {
      alert("Entre na sua conta para salvar e sincronizar a simulação.");
      return;
    }

    const { error } = await upsertProfile({
      id: user.id,
      email: user.email || "",
      renda_mensal: config.rendaMensal,
      meta_economia: config.metaEconomia,
    });

    if (error) {
      console.error(
        "Erro ao salvar configuracao do Simulador na nuvem:",
        error
      );

      alert(
        "Não foi possível salvar a simulação na nuvem. Verifique sua conexão e tente novamente."
      );
      return;
    }

    await AsyncStorage.setItem(
      getSimulatorConfigKey(user.id),
      JSON.stringify(config)
    );

    setMensagem("Simulação salva e sincronizada com sucesso.");

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

          <Text style={styles.moneyInputHint}>
            Digite apenas números. Os centavos são preenchidos automaticamente.
          </Text>

          <Text style={styles.label}>Renda mensal</Text>
          <TextInput
            style={styles.input}
            value={rendaMensal}
            onChangeText={(valor) =>
              setRendaMensal(formatarEntradaMonetaria(valor))
            }
            placeholder="R$ 0,00"
            keyboardType="number-pad"
          />

          <Text style={styles.label}>Meta de economia</Text>
          <TextInput
            style={styles.input}
            value={metaEconomia}
            onChangeText={(valor) =>
              setMetaEconomia(formatarEntradaMonetaria(valor))
            }
            placeholder="R$ 0,00"
            keyboardType="number-pad"
          />

          <TouchableOpacity style={styles.saveButton} onPress={salvarConfiguracao}>
            <Text style={styles.saveButtonText}>💾 Salvar simulação</Text>
          </TouchableOpacity>

          {mensagem ? <Text style={styles.successText}>{mensagem}</Text> : null}
        </View>

        <View style={[styles.row, isMobile && styles.rowMobile]}>
  <View style={[styles.card, styles.cardInRow]}>
    <Text style={styles.cardTitle}>💸 Gasto até hoje</Text>

    <Text style={styles.cardValue}>
      {formatMoney(totalMesAtual)}
    </Text>

    <Text style={styles.subText}>
      Total de despesas já registradas neste mês.
    </Text>
  </View>

  <View style={[styles.card, styles.cardInRow]}>
    <Text style={styles.cardTitle}>🔮 Gasto previsto no mês</Text>

    <Text style={[styles.cardValue, styles.forecastValue]}>
      {formatMoney(projecaoGastosMes)}
    </Text>

    <Text style={styles.subText}>
      Estimativa de despesas até o fim do mês, se mantiver o ritmo atual.
    </Text>

    <Text style={styles.formulaText}>
      Ritmo atual: {formatMoney(mediaDiariaAtual)} por dia
      {diasRestantes === 0
        ? ". Hoje é o último dia do mês."
        : ` • faltam ${diasRestantes} dias.`}
    </Text>
  </View>
</View>

        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>
            💰 Sua situação hoje
          </Text>

          <Text style={styles.resultDetail}>
            Valores calculados somente com os gastos já registrados neste mês.
          </Text>

          {rendaValida && (
            <>
              <View style={styles.resultLine}>
                <Text style={styles.resultLabel}>
                  Renda mensal informada
                </Text>
                <Text style={styles.resultValue}>
                  {formatMoney(receitaConsiderada)}
                </Text>
              </View>

              <View style={styles.resultLine}>
                <Text style={styles.resultLabel}>
                  Gasto registrado até hoje
                </Text>
                <Text style={styles.resultValue}>
                  {formatMoney(totalMesAtual)}
                </Text>
              </View>

              <View style={styles.resultLine}>
                <Text style={styles.resultLabel}>Saldo atual</Text>
                <Text
                  style={[
                    styles.resultValue,
                    saldoAtual >= 0
                      ? styles.positiveText
                      : styles.negativeText,
                  ]}
                >
                  {formatMoney(saldoAtual)}
                </Text>
              </View>

              <View style={styles.resultLine}>
                <Text style={styles.resultLabel}>
                  Saldo atual após a meta
                </Text>
                <Text
                  style={[
                    styles.resultValue,
                    saldoAtualAposMeta >= 0
                      ? styles.positiveText
                      : styles.negativeText,
                  ]}
                >
                  {formatMoney(saldoAtualAposMeta)}
                </Text>
              </View>

              {saldoAtualCentavos < 0 ? (
                <Text
                  style={[
                    styles.currentSituationMessage,
                    styles.currentSituationRisk,
                  ]}
                >
                  ⚠️ Atenção: seus gastos registrados já superam sua renda em{" "}
                  {formatMoney(Math.abs(saldoAtual))}.
                </Text>
              ) : saldoAtualCentavos === 0 ? (
                <Text
                  style={[
                    styles.currentSituationMessage,
                    styles.currentSituationNeutral,
                  ]}
                >
                  ℹ️ Seus gastos registrados chegaram ao valor da renda
                  informada. No momento, não há saldo disponível.
                </Text>
              ) : saldoAtualAposMetaCentavos < 0 ? (
                <Text
                  style={[
                    styles.currentSituationMessage,
                    styles.currentSituationAlert,
                  ]}
                >
                  ⚠️ Seu saldo atual é positivo, mas faltam{" "}
                  {formatMoney(Math.abs(saldoAtualAposMeta))} para preservar
                  sua meta.
                </Text>
              ) : saldoAtualAposMetaCentavos === 0 ? (
                <Text
                  style={[
                    styles.currentSituationMessage,
                    styles.currentSituationNeutral,
                  ]}
                >
                  ℹ️ Depois de separar sua meta, o saldo disponível fica em
                  R$ 0,00.
                </Text>
              ) : (
                <View style={styles.currentSituationPositiveBox}>
                  <Text
                    style={[
                      styles.currentSituationMessage,
                      styles.currentSituationPositive,
                    ]}
                  >
                    ✅ Depois dos gastos e da meta, ainda restam{" "}
                    {formatMoney(saldoAtualAposMeta)}.
                  </Text>

                  <Text style={styles.currentSituationEducation}>
                    Esse valor pode ajudar a fortalecer sua reserva de
                    emergência. Você já tem uma?
                  </Text>
                </View>
              )}
            </>
          )}
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
            🔮 Projeção até o fim do mês
          </Text>

          <Text style={styles.projectionNotice}>
            Esta é apenas uma estimativa baseada no ritmo dos gastos
            registrados até agora. Os valores podem mudar.
          </Text>

          <Text style={styles.resultProjectionTitle}>
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
                <Text style={styles.resultLabel}>
                  Gasto projetado no mês
                </Text>
                <Text style={styles.resultValue}>
                  {formatMoney(projecaoGastosMes)}
                </Text>
              </View>

              <View style={styles.resultLine}>
                <Text style={styles.resultLabel}>
                  Saldo projetado
                </Text>
                <Text
                  style={[
                    styles.resultValue,
                    saldoProjetado >= 0
                      ? styles.positiveText
                      : styles.negativeText,
                  ]}
                >
                  {formatMoney(saldoProjetado)}
                </Text>
              </View>

              <View style={styles.resultLine}>
                <Text style={styles.resultLabel}>
                  Saldo projetado após a meta
                </Text>
                <Text
                  style={[
                    styles.resultValue,
                    saldoProjetadoAposMeta >= 0
                      ? styles.positiveText
                      : styles.negativeText,
                  ]}
                >
                  {formatMoney(saldoProjetadoAposMeta)}
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

  rowMobile: {
  flexDirection: "column",
  gap: 0,
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

  moneyInputHint: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 12,
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

  currentSituationMessage: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginTop: 14,
    maxWidth: 520,
  },

  currentSituationRisk: {
    color: "#C62828",
  },

  currentSituationAlert: {
    color: "#B76E00",
  },

  currentSituationNeutral: {
    color: "#4B5563",
  },

  currentSituationPositiveBox: {
    marginTop: 2,
    maxWidth: 520,
  },

  currentSituationPositive: {
    color: "#0A8F55",
  },

  currentSituationEducation: {
    fontSize: 12,
    color: "#4B5563",
    lineHeight: 18,
    marginTop: 5,
  },

  projectionNotice: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 12,
  },

  resultProjectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
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

  forecastValue: {
  color: "#B7791F",
},

formulaText: {
  fontSize: 12,
  color: "#777",
  lineHeight: 16,
  marginTop: 4,
},
  
});