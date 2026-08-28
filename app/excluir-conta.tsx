import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
  getCurrentUser,
  getProfile,
} from "./services/authService";

const EMAIL_PRIVACIDADE = "enxergai.adm@gmail.com";

export default function ExcluirConta() {
  const router = useRouter();
  const [nomeConta, setNomeConta] = useState("");
  const [emailConta, setEmailConta] = useState("");
  const [carregandoConta, setCarregandoConta] = useState(true);

  useEffect(() => {
    let paginaAtiva = true;

    async function carregarConta() {
      try {
        const user = await getCurrentUser();

        if (!paginaAtiva) {
          return;
        }

        if (!user) {
          setNomeConta("");
          setEmailConta("");
          return;
        }

        const { data: profile } = await getProfile(user.id);

        if (!paginaAtiva) {
          return;
        }

        const nomeIdentificado =
          profile?.nome ||
          user.user_metadata?.nome ||
          "";

        setNomeConta(String(nomeIdentificado).trim());
        setEmailConta(String(user.email || "").trim());
      } catch (error) {
        console.error(
          "Erro ao carregar a conta para exclusão:",
          error
        );
      } finally {
        if (paginaAtiva) {
          setCarregandoConta(false);
        }
      }
    }

    carregarConta();

    return () => {
      paginaAtiva = false;
    };
  }, []);

  async function solicitarExclusao() {
    if (carregandoConta) {
      alert("Aguarde enquanto identificamos sua conta.");
      return;
    }

    if (!emailConta) {
      alert(
        "Entre na sua conta do Enxergaí antes de solicitar a exclusão."
      );
      return;
    }

    const nomeExibido =
      nomeConta || "Nome não informado";

    const assunto = encodeURIComponent(
      "Solicitação de exclusão de conta Enxergaí"
    );

    const corpo = encodeURIComponent(
      [
        "Olá, equipe Enxergaí.",
        "",
        "Solicito a exclusão da minha conta e dos dados pessoais e financeiros associados.",
        "",
        `Nome cadastrado no Enxergaí: ${nomeExibido}`,
        `E-mail cadastrado no Enxergaí: ${emailConta}`,
        "",
        "Confirmo que a conta identificada acima é a conta que desejo excluir.",
        "",
        "Atenciosamente,",
        nomeExibido,
      ].join("\n")
    );

    const url =
      `mailto:${EMAIL_PRIVACIDADE}?subject=${assunto}&body=${corpo}`;

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error(
        "Erro ao abrir o aplicativo de e-mail:",
        error
      );

      alert(
        `Não foi possível abrir o aplicativo de e-mail. Envie sua solicitação para ${EMAIL_PRIVACIDADE}.`
      );
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.replace("/")}
      >
        <Text style={styles.backButtonText}>← Voltar ao Enxergaí</Text>
      </TouchableOpacity>

      <View style={styles.heroCard}>
        <Text style={styles.brand}>ENXERGAÍ</Text>

        <Text style={styles.title}>
          Exclusão da conta e dos dados
        </Text>

        <Text style={styles.subtitle}>
          Transparência e controle sobre suas informações.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Como solicitar a exclusão
        </Text>

        <Text style={styles.paragraph}>
          Para solicitar a exclusão da sua conta Enxergaí e dos dados
          associados, envie uma mensagem usando o mesmo endereço de e-mail
          cadastrado na conta.
        </Text>

        <Text style={styles.paragraph}>
          Essa confirmação ajuda a proteger sua conta contra solicitações
          realizadas por terceiros.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={solicitarExclusao}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>
            Solicitar exclusão por e-mail
          </Text>
        </TouchableOpacity>

        <Text style={styles.contactText}>
          Canal de atendimento: {EMAIL_PRIVACIDADE}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Dados que serão excluídos
        </Text>

        <Text style={styles.paragraph}>
          Após a confirmação da solicitação e da identidade da pessoa
          titular, serão excluídos, conforme aplicável:
        </Text>

        <Text style={styles.listItem}>• perfil vinculado à conta;</Text>
        <Text style={styles.listItem}>• nome e e-mail cadastrados;</Text>
        <Text style={styles.listItem}>
          • despesas, valores, datas, categorias e subcategorias;
        </Text>
        <Text style={styles.listItem}>
          • dados de renda e meta informados no Simulador;
        </Text>
        <Text style={styles.listItem}>
          • histórico, preferências e demais dados associados ao usuário;
        </Text>
        <Text style={styles.listItem}>
          • credenciais e identificadores da conta, conforme o processo de
          exclusão da autenticação.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Prazo de atendimento</Text>

        <Text style={styles.paragraph}>
          O pedido será atendido em até 15 dias corridos após a confirmação da
          solicitação e da identidade da pessoa titular.
        </Text>

        <Text style={styles.paragraph}>
          A exclusão é definitiva e poderá impedir a recuperação posterior dos
          registros da conta.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Retenção excepcional de informações
        </Text>

        <Text style={styles.paragraph}>
          Determinadas informações poderão ser mantidas temporariamente quando
          isso for necessário para cumprimento de obrigação legal ou
          regulatória, prevenção a fraudes, segurança ou exercício regular de
          direitos.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Exclusão de registros sem apagar a conta
        </Text>

        <Text style={styles.paragraph}>
          A pessoa usuária pode excluir lançamentos financeiros
          individualmente na tela Histórico, sem precisar encerrar sua conta.
        </Text>

        <Text style={styles.paragraph}>
          Para solicitar a exclusão de outros dados mantendo a conta ativa,
          entre em contato pelo e-mail {EMAIL_PRIVACIDADE}.
        </Text>
      </View>

      <View style={styles.footerCard}>
        <Text style={styles.footerBrand}>Enxergaí</Text>

        <Text style={styles.footerText}>
          Menos esforço para entender seu dinheiro. Mais clareza para decidir.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.bottomBackButton}
        onPress={() => router.replace("/")}
      >
        <Text style={styles.bottomBackButtonText}>
          Voltar ao Enxergaí
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },

  content: {
    width: "100%",
    maxWidth: 820,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 80,
  },

  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    marginBottom: 10,
  },

  backButtonText: {
    color: "#0A8F55",
    fontSize: 13,
    fontWeight: "800",
  },

  heroCard: {
    backgroundColor: "#0A8F55",
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 14,
  },

  brand: {
    color: "#E9FFF3",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
  },

  subtitle: {
    color: "#E9FFF3",
    fontSize: 13,
    textAlign: "center",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#E1E5E8",
  },

  sectionTitle: {
    color: "#0A8F55",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 10,
  },

  paragraph: {
    color: "#3F4743",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 10,
  },

  listItem: {
    color: "#3F4743",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 5,
  },

  primaryButton: {
    backgroundColor: "#0A8F55",
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 10,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  contactText: {
    color: "#0A8F55",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },

  footerCard: {
    backgroundColor: "#EEF7F3",
    borderRadius: 14,
    padding: 18,
    borderWidth: 0.5,
    borderColor: "#CFE8DB",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 14,
  },

  footerBrand: {
    color: "#0A8F55",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 6,
  },

  footerText: {
    color: "#4D6659",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },

  bottomBackButton: {
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  bottomBackButtonText: {
    color: "#0A8F55",
    fontSize: 13,
    fontWeight: "800",
  },
});