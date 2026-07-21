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

import AuthRequiredCard from "../components/AuthRequiredCard";
import { supabase } from "../lib/supabase";
import { getCurrentUser } from "../services/authService";
import { Expense, getAllExpenses } from "../storage/expenseStorage";

const dbClient = supabase as any;

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
  const [usuarioLogado, setUsuarioLogado] = useState<boolean | null>(null);

  const [rendaMensal, setRendaMensal] = useState("");
  const [metaEconomia, setMetaEconomia] = useState("");
  const [rendaMensalSalva, setRendaMensalSalva] = useState("");
  const [metaEconomiaSalva, setMetaEconomiaSalva] = useState("");

  const [mensagem, setMensagem] = useState("");
  const [ocultarValores, setOcultarValores] = useState(false);
  const [salvando, setSalvando] = useState(false);

  function formatarValorVisivel(valor: number) {
  return ocultarValores
    ? "R$ ••••••"
    : formatMoney(valor);
}

  const now = new Date();

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const user = await getCurrentUser();

        if (!user) {
          setUsuarioLogado(false);
          setExpenses([]);
          setRendaMensal("");
          setMetaEconomia("");
          setRendaMensalSalva("");
          setMetaEconomiaSalva("");
          return;
        }

        setUsuarioLogado(true);

        const data = await getAllExpenses();

        const normalizedData = (data || []).map((item: any) => {
          const safeValue = Number(item.valor);

          return {
            ...item,
            valor: Number.isFinite(safeValue) ? safeValue : 0,
          };
        });

        setExpenses(normalizedData);

        const { data: profile, error } = await dbClient
          .from("profiles")
          .select("renda_mensal, meta_economia")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error(error);
          return;
        }

        const rendaSalva = profile?.renda_mensal || "";
        const metaSalva = profile?.meta_economia || "0";

        setRendaMensal(rendaSalva);
        setMetaEconomia(metaSalva);
        setRendaMensalSalva(rendaSalva);
        setMetaEconomiaSalva(metaSalva);
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

  const rendaNumerica = parseValorMonetario(rendaMensal);
  const metaNumerica = parseValorMonetario(metaEconomia);

  const rendaValida = Number.isFinite(rendaNumerica) && rendaNumerica > 0;

  const metaValida =
    metaEconomia.trim() === ""
      ? true
      : Number.isFinite(metaNumerica) && metaNumerica >= 0;

  const simulacaoAlterada =
    rendaMensal.trim() !== rendaMensalSalva.trim() ||
    metaEconomia.trim() !== metaEconomiaSalva.trim();

  const receitaConsiderada = rendaValida ? rendaNumerica : 0;

  const metaConsiderada =
  metaEconomia.trim() === ""
    ? 0
    : metaValida
    ? metaNumerica
    : 0;

const temMetaEconomia =
  metaEconomia.trim() !== "" &&
  metaValida &&
  Number.isFinite(metaNumerica) &&
  metaNumerica > 0;

const limiteSeguro = receitaConsiderada - metaConsiderada - totalMesAtual;

  const porCategoria = useMemo(() => {
    const map: Record<string, number> = {};

    currentMonthExpenses.forEach((item) => {
      map[item.categoria] =
        (map[item.categoria] || 0) + Number(item.valor || 0);
    });

    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [currentMonthExpenses]);

  const categoriaMaisPesada = porCategoria[0];

  const percentualCategoriaMaisPesada =
    categoriaMaisPesada && totalMesAtual > 0
      ? (categoriaMaisPesada[1] / totalMesAtual) * 100
      : 0;

  const economiaSimuladaCategoria = categoriaMaisPesada
    ? categoriaMaisPesada[1] * 0.2
    : 0;

  const mesesComHistorico = useMemo(() => {
    const meses = new Set<string>();

    expenses.forEach((item) => {
      const d = parseDateSafe(item.data);
      meses.add(`${d.getFullYear()}-${d.getMonth()}`);
    });

    return meses.size;
  }, [expenses]);

  const categoriasUtilizadas = useMemo(() => {
    const categorias = new Set<string>();

    expenses.forEach((item) => {
      if (item.categoria) {
        categorias.add(item.categoria);
      }
    });

    return categorias.size;
  }, [expenses]);

  const registrosTotais = expenses.length;

  const historicoSuficiente =
    mesesComHistorico >= 3 &&
    registrosTotais >= 12 &&
    categoriasUtilizadas >= 3;

  function getStatusSimulador() {
    if (!rendaValida) {
      return {
        titulo: "Informe sua renda mensal",
        detalhe:
          "Com a renda mensal, o No Controle consegue mostrar sua situação do mês com mais clareza.",
        tipo: "neutro",
      };
    }

    if (limiteSeguro >= 0) {
  return {
    titulo: "Você está no controle",
    detalhe: temMetaEconomia
      ? "Depois dos gastos já registrados até o momento e da sua meta, ainda existe uma margem segura para este mês."
      : "Depois dos gastos já registrados até o momento, ainda existe uma margem dentro da sua renda. Definir uma meta de economia pode deixar seu planejamento mais forte.",
    tipo: "positivo",
  };
}

    return {
  titulo: "Sua renda já não cobre os gastos registrados",
  detalhe: temMetaEconomia
    ? `Com os gastos já registrados até o momento e sua meta informada, faltam ${formatMoney(
        Math.abs(limiteSeguro)
      )} para voltar ao limite seguro deste mês.`
    : `Com os gastos já registrados até o momento, faltam ${formatMoney(
        Math.abs(limiteSeguro)
      )} para voltar ao limite seguro dentro da sua renda.`,
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
      alert("Informe uma meta de economia válida.");
      return;
    }

    const user = await getCurrentUser();

    if (!user) {
      alert("Entre na sua conta para salvar a simulação.");
      setUsuarioLogado(false);
      return;
    }

    const rendaFinal = rendaMensal.trim();
    const metaFinal = metaEconomia.trim() || "0";

    setSalvando(true);

    const { error } = await dbClient
      .from("profiles")
      .update({
        renda_mensal: rendaFinal,
        meta_economia: metaFinal,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    setSalvando(false);

    if (error) {
      console.error(error);
      alert("Não foi possível salvar a simulação na nuvem.");
      return;
    }

    setRendaMensalSalva(rendaFinal);
    setMetaEconomiaSalva(metaFinal);
    setMensagem("Simulação salva com sucesso.");

    setTimeout(() => {
      setMensagem("");
    }, 2500);
  }

  if (usuarioLogado === null) {
    return (
      <View style={[styles.container, isMobile && styles.containerMobile]}>
        <View style={styles.headerRow}>
  <Text style={styles.title}>Simulador</Text>

  <TouchableOpacity
    onPress={() => setOcultarValores(!ocultarValores)}
  >
    <Text style={styles.eyeButton}>
      {ocultarValores ? "🙈" : "👁️"}
    </Text>
  </TouchableOpacity>
</View>

        <View style={styles.card}>
          <Text style={styles.subText}>Carregando simulador...</Text>
        </View>
      </View>
    );
  }

  if (usuarioLogado === false) {
    return (
      <View style={[styles.container, isMobile && styles.containerMobile]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
  <Text style={styles.title}>Simulador</Text>

  <TouchableOpacity
    onPress={() => setOcultarValores(!ocultarValores)}
  >
    <Text style={styles.eyeButton}>
      {ocultarValores ? "🙈" : "👁️"}
    </Text>
  </TouchableOpacity>
</View>
          <AuthRequiredCard />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, isMobile && styles.containerMobile]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
  <Text style={styles.title}>Simulador</Text>

  <TouchableOpacity
    onPress={() => setOcultarValores(!ocultarValores)}
  >
    <Text style={styles.eyeButton}>
      {ocultarValores ? "🙈" : "👁️"}
    </Text>
  </TouchableOpacity>
</View>

        <View style={styles.card}>
  <Text style={styles.cardTitle}>
    🧠 Consultor Financeiro Pessoal
  </Text>

  {ocultarValores ? (
    <>
      <Text style={styles.hiddenFinanceTitle}>
        🔒 Dados financeiros ocultados
      </Text>

      <Text style={styles.hiddenFinanceText}>
        Toque no ícone 👁️ para visualizar novamente sua renda,
        meta de economia e opções de edição.
      </Text>
    </>
  ) : (
    <>
      <Text style={styles.label}>Renda mensal</Text>

      <TextInput
        style={styles.input}
        value={rendaMensal}
        onChangeText={setRendaMensal}
        placeholder="Ex: 5.000,00"
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

      <TouchableOpacity
        style={[
          styles.saveButton,
          (!simulacaoAlterada || salvando) &&
            styles.saveButtonDisabled,
        ]}
        onPress={
          simulacaoAlterada && !salvando
            ? salvarConfiguracao
            : undefined
        }
        disabled={!simulacaoAlterada || salvando}
      >
        <Text style={styles.saveButtonText}>
          {salvando
            ? "Salvando..."
            : simulacaoAlterada
            ? "💾 Salvar simulação"
            : "✅ Simulação salva"}
        </Text>
      </TouchableOpacity>

      {mensagem ? (
        <Text style={styles.successText}>
          {mensagem}
        </Text>
      ) : null}
    </>
  )}
</View>

        <View
          style={[
            styles.resultCard,
            status.tipo === "positivo" && styles.resultPositive,
            status.tipo === "risco" && styles.resultRisk,
          ]}
        >
          <Text style={styles.resultTitle}>
            {status.tipo === "positivo"
              ? "✅ "
              : status.tipo === "risco"
              ? "⚠️ "
              : "ℹ️ "}
            {status.titulo}
          </Text>

          <Text style={styles.resultDetail}>{status.detalhe}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Raio-X do mês</Text>

          <View style={styles.metricLine}>
            <Text style={styles.metricLabel}>Renda mensal</Text>
            <View style={styles.metricDots} />
            <Text style={styles.metricValue}>
              {rendaValida ? formatarValorVisivel(receitaConsiderada) : "Não informada"}
            </Text>
          </View>

          <View style={styles.metricLine}>
            <Text style={styles.metricLabel}>Gasto até hoje</Text>
            <View style={styles.metricDots} />
            <Text style={styles.metricValue}>{formatarValorVisivel(totalMesAtual)}</Text>
          </View>

          <View style={styles.metricLine}>
            <Text style={styles.metricLabel}>Meta de economia</Text>
            <View style={styles.metricDots} />
            <Text style={styles.metricValue}>{formatarValorVisivel(metaConsiderada)}</Text>
          </View>
        </View>

        {rendaValida ? (
          <View
            style={[
              styles.card,
              limiteSeguro >= 0 ? styles.safeCard : styles.riskCard,
            ]}
          >
            <Text style={styles.cardTitle}>
              {limiteSeguro >= 0
              ? temMetaEconomia
              ? "💚 Margem segura do mês"
              : "🧭 Margem estimada do mês"
              : "🚨 Limite seguro estourado"}
            </Text>

            <Text
              style={[
                styles.safeLimitValue,
                limiteSeguro >= 0 ? styles.positiveText : styles.negativeText,
              ]}
            >
              {formatarValorVisivel(limiteSeguro)}
            </Text>

            <Text style={styles.subText}>
  {limiteSeguro >= 0
    ? temMetaEconomia
      ? "Esse valor mostra a margem aproximada para manter seus gastos dentro da renda e ainda respeitar sua meta."
      : "Esse valor mostra quanto ainda resta dentro da sua renda. Defina uma meta de economia para transformar essa margem em planejamento e proteção."
    : "Você já ultrapassou o limite seguro considerando sua renda e meta informadas."}
</Text>

            {limiteSeguro >= 0 ? (
  <Text style={styles.reserveHint}>
    {temMetaEconomia
      ? "💡 Você já tem sua reserva de emergência? Se ainda não tem, esse pode ser um bom momento para começar a construir uma."
      : "💡 Comece com uma meta pequena. Separar uma parte da renda antes de gastar ajuda a criar reserva e evitar aperto no fim do mês."}
  </Text>
) : (
  <Text style={styles.debtWarningHint}>
    💡 Evite cobrir esse valor com cheque especial ou limite do
    cartão. Os juros podem crescer rápido. Se precisar, procure
    negociar antes que a dívida aumente.
  </Text>
)}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎯 Ponto de atenção do mês</Text>

          {currentMonthExpenses.length === 0 ? (
            <Text style={styles.subText}>
              Registre algumas despesas para o simulador apontar onde seu dinheiro está indo.
            </Text>
          ) : categoriaMaisPesada ? (
            <>
              <Text style={styles.subText}>
                Até agora, a categoria que mais pesou nos seus gastos foi:
              </Text>

              <Text style={styles.bigCategoryText}>{categoriaMaisPesada[0]}</Text>

              <Text style={styles.subText}>
                Total gasto:{" "}
                <Text style={styles.boldText}>
                  {formatMoney(categoriaMaisPesada[1])}
                </Text>
              </Text>

              <Text style={styles.subText}>
                Representa{" "}
                <Text style={styles.boldText}>
                  {percentualCategoriaMaisPesada.toFixed(0)}%
                </Text>{" "}
                dos gastos registrados neste mês.
              </Text>

              <Text style={styles.subText}>
                Para os próximos gastos, tente reduzir essa categoria em 20%.
              </Text>

              <Text style={styles.subText}>
                Isso poderia preservar cerca de{" "}
                <Text style={styles.boldText}>
                  {formatMoney(economiaSimuladaCategoria)}
                </Text>{" "}
                no seu orçamento.
              </Text>
            </>
          ) : (
            <Text style={styles.subText}>
              Ainda não há categoria suficiente para gerar sugestão.
            </Text>
          )}
        </View>

        {!historicoSuficiente ? (
          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>🔒 Ainda aprendendo seus hábitos</Text>

            <Text style={styles.noteText}>
              As projeções inteligentes serão liberadas quando houver histórico suficiente.
            </Text>

            <Text style={styles.noteText}>
              Necessário: 3 meses de histórico, 12 registros e 3 categorias utilizadas.
            </Text>

            <Text style={styles.noteText}>
              Hoje: {mesesComHistorico} mês(es), {registrosTotais} registro(s) e{" "}
              {categoriasUtilizadas} categoria(s).
            </Text>
          </View>
        ) : (
          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>✅ Histórico suficiente</Text>

            <Text style={styles.noteText}>
              O No Controle já possui base mínima para liberar projeções mais inteligentes nas próximas versões.
            </Text>
          </View>
        )}

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>📌 Versão MVP</Text>
          <Text style={styles.noteText}>
            Esta versão foca em clareza: mostrar sua situação, quanto ainda pode gastar
            e onde agir primeiro. Futuramente, o No Controle poderá simular cenários,
            metas por categoria e estratégias avançadas.
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
    fontSize: 16,
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

  saveButtonDisabled: {
    backgroundColor: "#A7CDBB",
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
  },

  safeCard: {
    borderColor: "#BFE7D2",
    backgroundColor: "#F3FBF7",
  },

  riskCard: {
    borderColor: "#F3C2C2",
    backgroundColor: "#FFF5F5",
  },

  safeLimitValue: {
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 8,
  },

  positiveText: {
    color: "#0A8F55",
  },

  negativeText: {
    color: "#C0392B",
  },

  bigCategoryText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0A8F55",
    marginBottom: 8,
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
    marginBottom: 4,
  },

  reserveHint: {
    fontSize: 12,
    color: "#4D6659",
    lineHeight: 17,
    marginTop: 6,
  },

  debtWarningHint: {
    fontSize: 12,
    color: "#8A4B00",
    lineHeight: 17,
    marginTop: 6,
  },

  metricLine: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    width: "100%",
    maxWidth: 330,
  },

  metricLabel: {
    fontSize: 13,
    color: "#666",
    width: 115,
  },

  metricDots: {
    flex: 1,
    maxWidth: 70,
    borderBottomWidth: 1,
    borderBottomColor: "#D9E2DD",
    borderStyle: "dotted",
    marginHorizontal: 8,
    marginTop: 6,
  },

  metricValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#333",
    minWidth: 105,
    textAlign: "right",
  },
 headerRow: {
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  gap: 10,
},

eyeButton: {
  fontSize: 20,
},
hiddenFinanceTitle: {
  fontSize: 15,
  fontWeight: "700",
  color: "#0A8F55",
  marginBottom: 8,
},

hiddenFinanceText: {
  fontSize: 13,
  color: "#666",
  lineHeight: 18,
},

});