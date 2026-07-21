import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getAllExpenses } from "../storage/expenseStorage";

export default function Home() {
  const router = useRouter();

  const [totalHoje, setTotalHoje] = useState(0);
  const [totalMes, setTotalMes] = useState(0);
  const [registrosHoje, setRegistrosHoje] = useState(0);
  const [comparacaoTexto, setComparacaoTexto] = useState("");
  const [categoriaInsight, setCategoriaInsight] = useState("");
  const [ocultarValores, setOcultarValores] = useState(false);

  function formatarValorVisivel(valor: number) {
  return ocultarValores
    ? "R$ ••••••"
    : formatMoney(valor);
}

  /* ✅ DATA SEGURA */
  function parseDateSafe(dateStr: string) {
    const [ano, mes, dia] = dateStr.split("-");
    return new Date(Number(ano), Number(mes) - 1, Number(dia));
  }

  /* ✅ FORMATAR VALOR */
  function formatMoney(valor: number) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  useFocusEffect(
    useCallback(() => {
      async function carregarDados() {
        const data = await getAllExpenses();

        const hoje = new Date();
        const mesAtual = hoje.getMonth();
        const anoAtual = hoje.getFullYear();

        let totalDiaTemp = 0;
        let totalMesTemp = 0;
        let registrosTemp = 0;

        let totalOntem = 0;
        const ontem = new Date();
        ontem.setDate(ontem.getDate() - 1);

        const categoriasMap: Record<string, number> = {};

        data.forEach((item) => {
          const d = parseDateSafe(item.data);

          // ✅ TOTAL DO DIA
          if (
            d.getDate() === hoje.getDate() &&
            d.getMonth() === mesAtual &&
            d.getFullYear() === anoAtual
          ) {
            totalDiaTemp += Number(item.valor);
            registrosTemp++;
          }

          // ✅ TOTAL DO MÊS + MAPA DE CATEGORIA
          if (
            d.getMonth() === mesAtual &&
            d.getFullYear() === anoAtual
          ) {
            totalMesTemp += Number(item.valor);

            categoriasMap[item.categoria] =
              (categoriasMap[item.categoria] || 0) +
              Number(item.valor);
          }

          // ✅ ONTEM
          if (
            d.getDate() === ontem.getDate() &&
            d.getMonth() === ontem.getMonth() &&
            d.getFullYear() === ontem.getFullYear()
          ) {
            totalOntem += Number(item.valor);
          }
        });

        /* 🔥 COMPARAÇÃO COM ONTEM */
        let textoComparacao = "";

        if (totalOntem !== 0) {
          if (totalDiaTemp > totalOntem) {
            textoComparacao = `Você gastou ${formatMoney(
              totalDiaTemp - totalOntem
            )} a mais que ontem ⚠️`;
          } else if (totalDiaTemp < totalOntem) {
            textoComparacao = `Você gastou ${formatMoney(
              totalOntem - totalDiaTemp
            )} a menos que ontem ✅`;
          } else {
            textoComparacao = "Seus gastos estão iguais aos de ontem 📊";
          }
        }

        /* 🔥 CATEGORIA DOMINANTE */
        let maiorCategoria = "";
        let maiorValor = 0;

        Object.entries(categoriasMap).forEach(([cat, valor]) => {
          if (valor > maiorValor) {
            maiorValor = valor;
            maiorCategoria = cat;
          }
        });

        let textoCategoria = "";

        if (maiorCategoria && totalMesTemp > 0) {
          const percentual = (maiorValor / totalMesTemp) * 100;

          textoCategoria = `📊 ${maiorCategoria} concentra ${percentual.toFixed(
            0
          )}% dos seus gastos`;
        }

        // ✅ SET STATES
        setTotalHoje(totalDiaTemp);
        setTotalMes(totalMesTemp);
        setRegistrosHoje(registrosTemp);
        setComparacaoTexto(textoComparacao);
        setCategoriaInsight(textoCategoria);
      }

      carregarDados();
    }, [])
  );

  function iniciarRegistroPorVoz() {
    router.push("/(tabs)/registrar");
  }

    return (
  <ScrollView
    style={styles.container}
    contentContainerStyle={styles.content}
    showsVerticalScrollIndicator={false}
  >

      <View style={styles.headerRow}>
  <Text style={styles.title}>No Controle</Text>

  <TouchableOpacity
    onPress={() => setOcultarValores(!ocultarValores)}
  >
    <Text style={styles.eyeButton}>
      {ocultarValores ? "🙈" : "👁️"}
    </Text>
  </TouchableOpacity>
</View>

<Text style={styles.subtitle}>Hoje</Text>

      <View style={styles.insightBox}>
        <Text style={styles.insightText}>
          {registrosHoje === 0
            ? "Você ainda não registrou nenhum gasto hoje."
            : "Seus gastos estão registrados ✅"}
        </Text>
      </View>

      {/* 🔥 TOTAL DO DIA */}
      <View style={styles.metricCardHighlight}>
        <Text style={styles.metricLabel}>Total do dia</Text>

        <Text style={styles.metricValue}>
          {formatarValorVisivel(totalHoje)}
        </Text>

        {comparacaoTexto !== "" && (
          <Text style={styles.compareInline}>
            {comparacaoTexto}
          </Text>
        )}
      </View>

      {/* 🔥 TOTAL DO MÊS */}
      <View style={styles.metricCard}>
        <Text style={styles.metricLabel}>Total do mês</Text>

        <Text style={styles.metricValue}>
          {formatarValorVisivel(totalMes)}
        </Text>

        {categoriaInsight !== "" && (
          <Text style={styles.compareInline}>
            {categoriaInsight}
          </Text>
        )}
      </View>

      {/* ✅ REGISTROS */}
      <View style={styles.metricCard}>
        <Text style={styles.metricLabel}>Registros hoje</Text>

        <Text style={styles.metricValue}>
          {registrosHoje}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.voiceButton}
        onPress={iniciarRegistroPorVoz}
      >
        <Text style={styles.voiceButtonText}>
          🎤 Falar despesa
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ✅ ESTILO */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F7F8FA",
  },
  content: {
  paddingBottom: 140,
  paddingTop: 10,
},

  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#0A8F55",
  },

  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#888",
    marginBottom: 20,
  },

  insightBox: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: "#eee",
  },

  insightText: {
    fontSize: 15,
    color: "#333",
  },

  metricCardHighlight: {
    backgroundColor: "#FFF",
    padding: 18,
    borderRadius: 14,
    marginBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: "#0A8F55",
  },

  metricCard: {
    backgroundColor: "#FFF",
    padding: 18,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#eee",
  },

  metricLabel: {
    fontSize: 13,
    color: "#666",
  },

  metricValue: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 4,
    color: "#0A8F55",
  },

  compareInline: {
    marginTop: 6,
    fontSize: 13,
    color: "#555",
  },

  voiceButton: {
    backgroundColor: "#0A8F55",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },

  voiceButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
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

});