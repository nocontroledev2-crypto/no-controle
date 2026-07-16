import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
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

const USER_PROFILE_KEY = "@no-controle:user-profile";

type UserProfile = {
  nome: string;
  email: string;
};

function formatMoney(valor: number | null | undefined) {
  const safeValue = Number(valor);

  return (Number.isFinite(safeValue) ? safeValue : 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function parseDateSafe(dateStr: string) {
  const [ano, mes, dia] = dateStr.split("-");
  return new Date(Number(ano), Number(mes) - 1, Number(dia));
}

function formatDateBR(dateStr: string | null) {
  if (!dateStr) return "Nenhum lançamento ainda";

  const d = parseDateSafe(dateStr);

  if (isNaN(d.getTime())) {
    return "Data não identificada";
  }

  return d.toLocaleDateString("pt-BR");
}

export default function Conta() {
  const { width } = useWindowDimensions();
  const isMobile = width < 480;

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [perfilSalvo, setPerfilSalvo] = useState(false);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [categoriasUsadas, setCategoriasUsadas] = useState(0);
  const [totalGasto, setTotalGasto] = useState(0);
  const [ultimoLancamento, setUltimoLancamento] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const savedProfile = await AsyncStorage.getItem(USER_PROFILE_KEY);
        const data = await getAllExpenses();

        const normalizedData = (data || []).map((item: any) => {
          const safeValue = Number(item.valor);

          return {
            ...item,
            valor: Number.isFinite(safeValue) ? safeValue : 0,
            categoria: item.categoria || "",
            subcategoria: item.subcategoria || "",
            termoEncontrado: item.termoEncontrado || "",
          };
        });

        if (savedProfile) {
          const parsed: UserProfile = JSON.parse(savedProfile);
          setNome(parsed.nome || "");
          setEmail(parsed.email || "");
          setPerfilSalvo(true);
        } else {
          setPerfilSalvo(false);
        }

        const categorias = new Set(
          normalizedData
            .map((item) => item.categoria)
            .filter(Boolean)
        );

        const total = normalizedData.reduce(
          (sum, item) => sum + Number(item.valor || 0),
          0
        );

        const ultimaDespesa = [...normalizedData].sort((a, b) => {
          return (
            parseDateSafe(b.data).getTime() -
            parseDateSafe(a.data).getTime()
          );
        })[0];

        setExpenses(normalizedData);
        setTotalRegistros(normalizedData.length);
        setCategoriasUsadas(categorias.size);
        setTotalGasto(total);
        setUltimoLancamento(ultimaDespesa?.data || null);
      }

      load();
    }, [])
  );

  async function salvarPerfil() {
    if (!nome.trim()) {
      alert("Informe seu nome.");
      return;
    }

    if (!email.trim()) {
      alert("Informe seu e-mail.");
      return;
    }

    const profile: UserProfile = {
      nome: nome.trim(),
      email: email.trim(),
    };

    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));

    setPerfilSalvo(true);
    setMensagem("Perfil salvo com sucesso.");

    setTimeout(() => {
      setMensagem("");
    }, 2500);
  }

  async function exportarDados() {
    const payload = {
      app: "No Controle",
      geradoEm: new Date().toISOString(),
      perfil: {
        nome: nome.trim(),
        email: email.trim(),
      },
      resumo: {
        registros: totalRegistros,
        categoriasUsadas,
        totalGasto,
        ultimoLancamento,
      },
      despesas: expenses,
    };

    const texto = JSON.stringify(payload, null, 2);

    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {
        await navigator.clipboard.writeText(texto);

        setMensagem("Dados copiados para a área de transferência.");

        setTimeout(() => {
          setMensagem("");
        }, 2500);

        return;
      }

      alert("Não foi possível copiar automaticamente neste dispositivo.");
    } catch (error) {
      console.error(error);
      alert("Erro ao exportar dados.");
    }
  }

  return (
    <View
      style={[
        styles.container,
        isMobile && styles.containerMobile,
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Minha Conta</Text>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>👤 Sua jornada no No Controle</Text>

          <Text style={styles.heroText}>
            Este é o espaço para proteger sua jornada financeira, acompanhar seus dados
            e preparar sua futura sincronização em nuvem.
          </Text>

          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>
              {perfilSalvo ? "✅ Perfil salvo neste dispositivo" : "ℹ️ Perfil ainda não salvo"}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📝 Perfil do usuário</Text>

          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            value={nome}
            onChangeText={setNome}
            placeholder="Digite seu nome"
          />

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Digite seu e-mail"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity style={styles.saveButton} onPress={salvarPerfil}>
            <Text style={styles.saveButtonText}>
              {perfilSalvo ? "💾 Atualizar perfil" : "💾 Salvar perfil"}
            </Text>
          </TouchableOpacity>

          {mensagem ? (
            <Text style={styles.successText}>{mensagem}</Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📦 Dados neste dispositivo</Text>

          <View style={styles.metricsGrid}>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>{totalRegistros}</Text>
              <Text style={styles.metricLabel}>
                {totalRegistros === 1 ? "registro" : "registros"}
              </Text>
            </View>

            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>{categoriasUsadas}</Text>
              <Text style={styles.metricLabel}>
                {categoriasUsadas === 1 ? "categoria" : "categorias"}
              </Text>
            </View>
          </View>

          <View style={styles.infoLine}>
            <Text style={styles.infoLabel}>Total registrado</Text>
            <Text style={styles.infoValue}>{formatMoney(totalGasto)}</Text>
          </View>

          <View style={styles.infoLine}>
            <Text style={styles.infoLabel}>Último lançamento</Text>
            <Text style={styles.infoValue}>{formatDateBR(ultimoLancamento)}</Text>
          </View>

          <Text style={styles.infoText}>
            Nesta versão, os registros ficam salvos no armazenamento local deste
            navegador ou dispositivo.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔒 Backup e sincronização</Text>

          <Text style={styles.infoText}>
            Em breve, você poderá criar uma conta com login real para manter seus dados
            protegidos na nuvem e acessar seu histórico em outros dispositivos.
          </Text>

          <View style={styles.futureBox}>
            <Text style={styles.futureItem}>✅ Backup dos registros</Text>
            <Text style={styles.futureItem}>✅ Acesso em mais de um dispositivo</Text>
            <Text style={styles.futureItem}>✅ Histórico vinculado ao usuário</Text>
            <Text style={styles.futureItem}>✅ Base para educação financeira personalizada</Text>
          </View>

          <View style={styles.disabledActionsRow}>
            <View style={styles.disabledButton}>
              <Text style={styles.disabledButtonText}>Criar conta, em breve</Text>
            </View>

            <View style={styles.disabledButton}>
              <Text style={styles.disabledButtonText}>Entrar, em breve</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📤 Exportar meus dados</Text>

          <Text style={styles.infoText}>
            Quer guardar uma cópia dos seus registros atuais? Você pode copiar seus dados
            para salvar em local seguro.
          </Text>

          <TouchableOpacity style={styles.exportButton} onPress={exportarDados}>
            <Text style={styles.exportButtonText}>
              📋 Copiar dados atuais
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>⚠️ Importante</Text>

          <Text style={styles.warningText}>
            Se você abrir o No Controle em outro navegador, janela anônima ou outro
            dispositivo, os registros podem não aparecer porque ainda não existe
            sincronização em nuvem nesta etapa.
          </Text>
        </View>

        <View style={styles.brandCard}>
          <Text style={styles.brandTitle}>💚 O que o No Controle defende</Text>

          <Text style={styles.brandText}>
            Menos esforço para entender seu dinheiro. Mais clareza para tomar decisões.
          </Text>

          <Text style={styles.brandText}>
            O objetivo é fazer você enxergar seus dados financeiros de forma simples,
            rápida e útil.
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
  width: "100%",
  maxWidth: 820,
  alignSelf: "center",
},

  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0A8F55",
    textAlign: "center",
    marginBottom: 14,
  },

  heroCard: {
    backgroundColor: "#0A8F55",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
  },

  heroTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 8,
  },

  heroText: {
    fontSize: 13,
    color: "#E9FFF3",
    lineHeight: 19,
    marginBottom: 12,
  },

  statusPill: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
  },

  statusPillText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
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
    fontWeight: "800",
    color: "#333",
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

  metricsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },

  metricBox: {
    flex: 1,
    backgroundColor: "#F3FBF7",
    borderRadius: 12,
    padding: 12,
    borderWidth: 0.5,
    borderColor: "#CFE8DB",
  },

  metricValue: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0A8F55",
  },

  metricLabel: {
    fontSize: 12,
    color: "#4D6659",
    marginTop: 2,
    fontWeight: "600",
  },

  infoLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },

  infoLabel: {
    fontSize: 13,
    color: "#666",
    flex: 1,
  },

  infoValue: {
    fontSize: 13,
    color: "#333",
    fontWeight: "800",
    textAlign: "right",
  },

  infoText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    marginBottom: 8,
  },

  futureBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
  },

  futureItem: {
    fontSize: 13,
    color: "#333",
    marginBottom: 6,
  },

  disabledActionsRow: {
    flexDirection: "row",
    gap: 10,
  },

  disabledButton: {
    flex: 1,
    backgroundColor: "#E8EAEE",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },

  disabledButtonText: {
    color: "#777",
    fontSize: 12,
    fontWeight: "700",
  },

  exportButton: {
    backgroundColor: "#F0FAF5",
    borderWidth: 0.5,
    borderColor: "#BFE7D2",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },

  exportButtonText: {
    color: "#0A8F55",
    fontSize: 13,
    fontWeight: "800",
  },

  warningCard: {
    backgroundColor: "#FFF8E6",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#F3D58A",
  },

  warningTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#8A6400",
    marginBottom: 8,
  },

  warningText: {
    fontSize: 13,
    color: "#6B5200",
    lineHeight: 18,
  },

  brandCard: {
    backgroundColor: "#EEF7F3",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#CFE8DB",
  },

  brandTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0A8F55",
    marginBottom: 8,
  },

  brandText: {
    fontSize: 13,
    color: "#4D6659",
    lineHeight: 18,
    marginBottom: 6,
  },
});