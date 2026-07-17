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
import {
  getCurrentUser,
  getProfile,
  signIn,
  signOut,
  signUp,
  upsertProfile,
} from "../services/authService";
import { getAllExpenses } from "../storage/expenseStorage";

type AuthMode = "signup" | "login";

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

function traduzirErroAuth(message?: string) {
  const texto = (message || "").toLowerCase();

  if (texto.includes("email not confirmed")) {
    return "E-mail não confirmado. Por favor, verifique seu e-mail e confirme sua conta antes de entrar.";
  }

  if (
    texto.includes("invalid login credentials") ||
    (texto.includes("invalid") && texto.includes("credentials")) ||
    texto.includes("login credentials")
  ) {
    return "E-mail ou senha incorretos. Verifique os dados e tente novamente.";
  }

  if (
    texto.includes("user already registered") ||
    texto.includes("already registered") ||
    texto.includes("already been registered")
  ) {
    return "Este e-mail já possui uma conta. Toque em Entrar e acesse sua conta.";
  }

  if (texto.includes("password")) {
    return "A senha informada não atende aos requisitos. Use pelo menos 6 caracteres.";
  }

  return message || "Não foi possível concluir a operação. Tente novamente.";
}

export default function Conta() {
  const { width } = useWindowDimensions();
  const isMobile = width < 480;

  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [usuarioLogado, setUsuarioLogado] = useState<any | null>(null);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [categoriasUsadas, setCategoriasUsadas] = useState(0);
  const [totalGasto, setTotalGasto] = useState(0);
  const [ultimoLancamento, setUltimoLancamento] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const data = await getAllExpenses();
        const user = await getCurrentUser();

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

        const categorias = new Set(
          normalizedData.map((item) => item.categoria).filter(Boolean)
        );

        const total = normalizedData.reduce(
          (sum, item) => sum + Number(item.valor || 0),
          0
        );

        const ultimaDespesa = [...normalizedData].sort((a, b) => {
          return parseDateSafe(b.data).getTime() - parseDateSafe(a.data).getTime();
        })[0];
        
        setTotalRegistros(normalizedData.length);
        setCategoriasUsadas(categorias.size);
        setTotalGasto(total);
        setUltimoLancamento(ultimaDespesa?.data || null);

        if (user) {
          setUsuarioLogado(user);
          setEmail(user.email || "");

          const { data: profile } = await getProfile(user.id);

          if (profile?.nome) {
            setNome(profile.nome);
          } else if (user.user_metadata?.nome) {
            setNome(user.user_metadata.nome);
          }
        } else {
          setUsuarioLogado(null);
        }
      }

      load();
    }, [])
  );

  function limparMensagemDepois() {
    setTimeout(() => {
      setMensagem("");
    }, 3500);
  }

  async function criarConta() {
    if (!nome.trim()) {
      alert("Informe seu nome.");
      return;
    }

    if (!email.trim()) {
      alert("Informe seu e-mail.");
      return;
    }

    if (!senha.trim() || senha.length < 6) {
      alert("Informe uma senha com pelo menos 6 caracteres.");
      return;
    }

    setCarregando(true);

    const { data, error } = await signUp(email.trim(), senha.trim(), nome.trim());

    setCarregando(false);

    if (error) {
      alert("Erro ao criar conta.\n\n" + traduzirErroAuth(error.message));
      return;
    }

    const identities = data?.user?.identities;

if (
  data?.user &&
  Array.isArray(identities) &&
  identities.length === 0
) {
  alert(
    "Conta já existente.\n\n" +
      "Este e-mail já possui uma conta. Toque em Entrar e acesse sua conta."
  );

  setAuthMode("login");
  setSenha("");
  setMensagem("");
  return;
}

    if (data?.user && data?.session) {
      await upsertProfile({
        id: data.user.id,
        nome: nome.trim(),
        email: email.trim(),
      });

      setUsuarioLogado(data.user);
      setMensagem("Conta criada e conectada com sucesso.");
      limparMensagemDepois();
      return;
    }

    setMensagem(
      "Conta criada. Verifique seu e-mail para confirmar o cadastro antes de entrar."
    );
    limparMensagemDepois();
    setAuthMode("login");
  }

  async function entrarConta() {
    if (!email.trim()) {
      alert("Informe seu e-mail.");
      return;
    }

    if (!senha.trim()) {
      alert("Informe sua senha.");
      return;
    }

    setCarregando(true);

    const { data, error } = await signIn(email.trim(), senha.trim());

    setCarregando(false);

    if (error) {
      alert("Erro ao entrar.\n\n" + traduzirErroAuth(error.message));
      return;
    }

    if (data?.user) {
      const nomePerfil =
        nome.trim() ||
        data.user.user_metadata?.nome ||
        "Usuário No Controle";

      await upsertProfile({
        id: data.user.id,
        nome: nomePerfil,
        email: data.user.email || email.trim(),
      });

      setUsuarioLogado(data.user);
      setNome(nomePerfil);
      setEmail(data.user.email || email.trim());
      setSenha("");
      setMensagem("Login realizado com sucesso.");
      limparMensagemDepois();
    }
  }

  async function sairConta() {
    await signOut();

    setUsuarioLogado(null);
    setSenha("");
    setMensagem("Você saiu da sua conta.");
    limparMensagemDepois();
  }

  return (
    <View style={[styles.container, isMobile && styles.containerMobile]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Minha Conta</Text>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>👤 Sua jornada no No Controle</Text>

          <Text style={styles.heroText}>
            Este é o espaço para proteger sua jornada financeira, acompanhar seus dados
            e preparar sua sincronização em nuvem.
          </Text>

          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>
              {usuarioLogado ? "✅ Conta conectada" : "🔐 Entre ou crie sua conta"}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {usuarioLogado ? "✅ Conta ativa" : "🔐 Acesso obrigatório"}
          </Text>

          {usuarioLogado ? (
            <>
              <Text style={styles.infoText}>
                Seus dados serão preparados para sincronização na nuvem.
              </Text>

              <View style={styles.accountBox}>
                <Text style={styles.accountLabel}>Nome</Text>
                <Text style={styles.accountValue}>
                  {nome || "Usuário No Controle"}
                </Text>

                <Text style={styles.accountLabel}>E-mail</Text>
                <Text style={styles.accountValue}>{email}</Text>
              </View>

              <TouchableOpacity style={styles.logoutButton} onPress={sairConta}>
                <Text style={styles.logoutButtonText}>🚪 Sair da conta</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.authModeRow}>
                <TouchableOpacity
                  style={[
                    styles.authModeButton,
                    authMode === "signup" && styles.authModeButtonActive,
                  ]}
                  onPress={() => setAuthMode("signup")}
                >
                  <Text
                    style={[
                      styles.authModeText,
                      authMode === "signup" && styles.authModeTextActive,
                    ]}
                  >
                    Criar conta
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.authModeButton,
                    authMode === "login" && styles.authModeButtonActive,
                  ]}
                  onPress={() => setAuthMode("login")}
                >
                  <Text
                    style={[
                      styles.authModeText,
                      authMode === "login" && styles.authModeTextActive,
                    ]}
                  >
                    Entrar
                  </Text>
                </TouchableOpacity>
              </View>

              {authMode === "signup" ? (
                <>
                  <Text style={styles.label}>Nome</Text>
                  <TextInput
                    style={styles.input}
                    value={nome}
                    onChangeText={setNome}
                    placeholder="Digite seu nome"
                  />
                </>
              ) : null}

              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Digite seu e-mail"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Senha</Text>
              <TextInput
                style={styles.input}
                value={senha}
                onChangeText={setSenha}
                placeholder="Digite sua senha"
                secureTextEntry
              />

              <TouchableOpacity
                style={styles.saveButton}
                onPress={authMode === "signup" ? criarConta : entrarConta}
                disabled={carregando}
              >
                <Text style={styles.saveButtonText}>
                  {carregando
                    ? "Aguarde..."
                    : authMode === "signup"
                    ? "🚀 Criar minha conta"
                    : "🔑 Entrar na minha conta"}
                </Text>
              </TouchableOpacity>

              <Text style={styles.infoTextSmall}>
                Ao criar uma conta, seus dados ficarão prontos para serem protegidos
                e sincronizados na nuvem.
              </Text>
            </>
          )}

          {mensagem ? <Text style={styles.successText}>{mensagem}</Text> : null}
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
              A sincronização completa das despesas será ativada na próxima etapa.
              A partir dela, seus registros ficarão vinculados à sua conta.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>☁️ Nuvem e sincronização</Text>

          <Text style={styles.infoText}>
            A conta real é a base para salvar seus registros na nuvem e acessar
            seu histórico em outros dispositivos.
          </Text>

          <View style={styles.futureBox}>
            <Text style={styles.futureItem}>✅ Conta real com e-mail e senha</Text>
            <Text style={styles.futureItem}>✅ Base para backup dos registros</Text>
            <Text style={styles.futureItem}>✅ Histórico vinculado ao usuário</Text>
            <Text style={styles.futureItem}>✅ Preparação para a sincronização total</Text>
          </View>
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

  logoutButton: {
    backgroundColor: "#FFF5F5",
    borderWidth: 0.5,
    borderColor: "#F3C2C2",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },

  logoutButtonText: {
    color: "#C0392B",
    fontSize: 13,
    fontWeight: "800",
  },

  successText: {
    textAlign: "center",
    color: "#0A8F55",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 10,
  },

  authModeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },

  authModeButton: {
    flex: 1,
    backgroundColor: "#F1F3F5",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
  },

  authModeButtonActive: {
    backgroundColor: "#F0FAF5",
    borderColor: "#0A8F55",
  },

  authModeText: {
    color: "#666",
    fontSize: 13,
    fontWeight: "700",
  },

  authModeTextActive: {
    color: "#0A8F55",
  },

  accountBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
    marginTop: 4,
  },

  accountLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    marginBottom: 2,
  },

  accountValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "800",
    marginBottom: 10,
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

  infoTextSmall: {
    fontSize: 12,
    color: "#777",
    lineHeight: 17,
    marginTop: 10,
  },

  futureBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    marginBottom: 4,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
  },

  futureItem: {
    fontSize: 13,
    color: "#333",
    marginBottom: 6,
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