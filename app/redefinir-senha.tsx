import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { supabase } from "./lib/supabase";
import { atualizarSenha } from "./services/authService";

function mascararEmail(email?: string | null) {
  if (!email || !email.includes("@")) {
    return "";
  }

  const [usuario, dominio] = email.split("@");

  if (usuario.length <= 2) {
    return `${usuario.charAt(0)}*****@${dominio}`;
  }

  return `${usuario.charAt(0)}*****${usuario.charAt(
    usuario.length - 1
  )}@${dominio}`;
}

export default function RedefinirSenha() {
  const router = useRouter();

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [carregandoLink, setCarregandoLink] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [linkValido, setLinkValido] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [emailMascarado, setEmailMascarado] = useState("");

  useEffect(() => {
    let componenteAtivo = true;

    async function verificarSessao() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!componenteAtivo) return;

      if (session) {
        setLinkValido(true);
      }

      setCarregandoLink(false);
    }

    verificarSessao();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!componenteAtivo) return;

      if (event === "PASSWORD_RECOVERY" || session) {
        setLinkValido(true);
        setCarregandoLink(false);
      }
    });

    return () => {
      componenteAtivo = false;
      subscription.unsubscribe();
    };
  }, []);

  async function salvarNovaSenha() {
  if (novaSenha.length < 6) {
    alert("A nova senha precisa ter pelo menos 6 caracteres.");
    return;
  }

  if (novaSenha !== confirmarSenha) {
    alert("As senhas informadas não são iguais.");
    return;
  }

  setSalvando(true);

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert(
        "Não foi possível identificar a conta deste link. Solicite uma nova recuperação de senha."
      );
      return;
    }

    const emailDaConta = mascararEmail(user.email);

    const { error } = await atualizarSenha(novaSenha);

    if (error) {
      const mensagemErro = (error.message || "").toLowerCase();

      const mensagemTraduzida =
        mensagemErro.includes("new password should be different") ||
        mensagemErro.includes("same_password")
          ? "A nova senha precisa ser diferente da senha atual."
          : "Tente solicitar um novo link de recuperação.";

      alert(
        "Não foi possível atualizar sua senha.\n\n" +
          mensagemTraduzida
      );

      return;
    }

    const { error: signOutError } = await supabase.auth.signOut({
      scope: "local",
    });

    if (signOutError) {
      console.error(
        "Erro ao encerrar a sessão de recuperação:",
        signOutError
      );
    }

    setEmailMascarado(emailDaConta);
    setMensagem("Senha atualizada com sucesso.");
    setNovaSenha("");
    setConfirmarSenha("");
  } catch (error) {
    console.error("Erro ao atualizar senha:", error);

    alert(
      "Não foi possível atualizar sua senha. Verifique sua conexão e tente novamente."
    );
  } finally {
    setSalvando(false);
  }
}

  if (carregandoLink) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0A8F55" />
        <Text style={styles.loadingText}>
          Validando seu link de recuperação...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>🔐 Criar nova senha</Text>

        <Text style={styles.subtitle}>
          Escolha uma nova senha para acessar sua conta Enxergaí.
        </Text>

        {!linkValido ? (
          <>
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                Este link de recuperação é inválido ou expirou. Solicite um novo
                link na tela de entrada.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.replace("/conta")}
            >
              <Text style={styles.secondaryButtonText}>
                Voltar para Minha Conta
              </Text>
            </TouchableOpacity>
          </>
        ) : mensagem ? (
          <>
         <View style={styles.successBox}>
  <Text style={styles.successText}>
    ✅ {mensagem}
  </Text>

  {emailMascarado ? (
    <Text style={styles.successAccountText}>
      Senha atualizada para a conta:{"\n"}
      <Text style={styles.successAccountEmail}>
        {emailMascarado}
      </Text>
    </Text>
  ) : null}
</View>

<TouchableOpacity
  style={styles.primaryButton}
  onPress={() =>
    router.replace({
      pathname: "/conta",
      params: {
        modo: "login",
      },
    } as any)
  }
>
  <Text style={styles.primaryButtonText}>
    Ir para Entrar
  </Text>
</TouchableOpacity>

          </>
        ) : (
          <>
            <Text style={styles.label}>Nova senha</Text>

            <TextInput
              style={styles.input}
              value={novaSenha}
              onChangeText={setNovaSenha}
              placeholder="Digite a nova senha"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              autoCapitalize="none"
            />

            <Text style={styles.label}>Confirmar nova senha</Text>

            <TextInput
              style={styles.input}
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              placeholder="Digite novamente a nova senha"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              autoCapitalize="none"
            />

            <Text style={styles.hint}>
              Use pelo menos 6 caracteres.
            </Text>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                salvando && styles.buttonDisabled,
              ]}
              onPress={salvarNovaSenha}
              disabled={salvando}
            >
              <Text style={styles.primaryButtonText}>
                {salvando
                  ? "Salvando nova senha..."
                  : "Salvar nova senha"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#555",
    textAlign: "center",
  },

  card: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
  },

  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0A8F55",
    textAlign: "center",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 13,
    color: "#666",
    lineHeight: 19,
    textAlign: "center",
    marginBottom: 20,
  },

  label: {
    fontSize: 13,
    color: "#555",
    fontWeight: "700",
    marginBottom: 5,
  },

  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 14,
    fontSize: 16,
    color: "#333",
  },

  hint: {
    fontSize: 12,
    color: "#777",
    marginBottom: 14,
  },

  primaryButton: {
    backgroundColor: "#0A8F55",
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 14,
    alignItems: "center",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  secondaryButton: {
    backgroundColor: "#F0FAF5",
    borderWidth: 1,
    borderColor: "#BFE7D2",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
  },

  secondaryButtonText: {
    color: "#0A8F55",
    fontSize: 13,
    fontWeight: "800",
  },

  successBox: {
    backgroundColor: "#F0FAF5",
    borderWidth: 0.5,
    borderColor: "#BFE7D2",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },

  successText: {
    color: "#0A8F55",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },

  warningBox: {
    backgroundColor: "#FFF8E6",
    borderWidth: 0.5,
    borderColor: "#F3D58A",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },

  warningText: {
    color: "#6B5200",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },

successAccountText: {
  color: "#555",
  fontSize: 13,
  lineHeight: 20,
  textAlign: "center",
  marginTop: 10,
},

successAccountEmail: {
  color: "#0A8F55",
  fontSize: 14,
  fontWeight: "800",
},

});