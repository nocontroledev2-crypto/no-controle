import Head from "expo-router/head";
import { useRouter } from "expo-router";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

const problems = [
  "Meu dinheiro some.",
  "Não sei onde estou gastando.",
  "Planilha não funciona para mim.",
];

const recordMethods = [
  {
    icon: "🎤",
    title: "Fala Inteligente",
    text: "Fale a despesa do seu jeito. O Enxergaí interpreta e organiza para você revisar.",
  },
  {
    icon: "✍️",
    title: "Digitação Inteligente",
    text: "Escreva como você fala e deixe o Enxergaí identificar valor, categoria e data.",
  },
  {
    icon: "🧾",
    title: "Preenchimento manual",
    text: "Prefere escolher cada informação? O registro manual também está disponível.",
  },
];

const resources = [
  "Histórico de despesas",
  "Categorias e subcategorias",
  "Resumo dos gastos",
  "Gráficos e comparações",
  "Insights para entender seus hábitos",
  "Simulador",
  "Relatórios",
  "Dados salvos e sincronizados na sua conta",
];

const pillars = [
  "Traduzir matemática para o português do dia a dia.",
  "Enxergar, e não apenas ver.",
  "Gastar o mínimo de energia para obter o máximo de resultado.",
];

export default function PublicLandingPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 760;

  function entrar() {
    router.push({
      pathname: "/(tabs)/conta",
      params: { modo: "login" },
    });
  }

  function criarConta() {
    router.push("/(tabs)/conta");
  }

  return (
    <>
      <Head>
        <title>Enxergaí | Controle financeiro simples</title>

        <meta
          name="description"
          content="Registre despesas falando, digitando ou preenchendo manualmente. O Enxergaí organiza seus gastos em uma linguagem simples."
        />

        <meta
          name="robots"
          content="index, follow, max-image-preview:large"
        />

        <link
          rel="canonical"
          href="https://www.enxergai.com.br/"
        />
      </Head>

      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}
      >
        <View role="banner" style={styles.header}>
          <View style={styles.brandRow}>
            <Image
              accessible={false}
              aria-hidden={true}
              source={require("../../assets/images/icon.png")}
              style={styles.logo}
            />

            <Text style={styles.brand}>Enxergaí</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.loginLink}
              onPress={entrar}
            >
              <Text style={styles.loginLinkText}>Entrar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerButton}
              onPress={criarConta}
            >
              <Text style={styles.headerButtonText}>
                Criar conta
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View role="main">
          <View
            style={[
              styles.hero,
            isMobile && styles.heroMobile,
          ]}
        >
          <View style={styles.heroText}>
            <Text style={styles.eyebrow}>
              ORGANIZAÇÃO FINANCEIRA SIMPLES
            </Text>

            <Text
              accessibilityRole="header"
              aria-level={1}
              style={[
                styles.heroTitle,
                isMobile && styles.heroTitleMobile,
              ]}
            >
              Você fala e o Enxergaí organiza para você!
            </Text>

            <Text style={styles.heroDescription}>
              Registre despesas falando, digitando ou
              preenchendo manualmente. O Enxergaí organiza
              seus dados e mostra, em linguagem simples,
              para onde o seu dinheiro está indo.
            </Text>

            <View
              style={[
                styles.heroActions,
                isMobile && styles.heroActionsMobile,
              ]}
            >
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={criarConta}
              >
                <Text style={styles.primaryButtonText}>
                  Criar conta grátis
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={entrar}
              >
                <Text style={styles.secondaryButtonText}>
                  Já tenho uma conta
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.heroCard}>
            <Text
              accessible={false}
              aria-hidden={true}
              style={styles.heroCardIcon}
            >
              🎤
            </Text>
            <Text
              accessibilityRole="header"
              aria-level={2}
              style={styles.heroCardTitle}
            >
              Fale uma despesa
            </Text>
            <Text style={styles.heroCardExample}>
              “Ontem gastei 80 reais no mercado.”
            </Text>

            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>
                O Enxergaí organiza:
              </Text>
              <Text style={styles.resultText}>
                R$ 80,00 • Alimentação • Supermercado
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTag}>
            FEITO PARA A VIDA REAL
          </Text>

          <Text
            accessibilityRole="header"
            aria-level={2}
            style={styles.sectionTitle}
          >
            Se alguma dessas frases é familiar, o Enxergaí
            foi pensado para você.
          </Text>

          <View style={styles.grid}>
            {problems.map((problem) => (
              <View key={problem} style={styles.problemCard}>
                <Text style={styles.problemQuote}>
                  “{problem}”
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionSoft}>
          <Text style={styles.sectionTag}>
            REGISTRE DO SEU JEITO
          </Text>

          <Text
            accessibilityRole="header"
            aria-level={2}
            style={styles.sectionTitle}
          >
            Menos esforço para organizar. Mais clareza para
            decidir.
          </Text>

          <View style={styles.grid}>
            {recordMethods.map((method) => (
              <View key={method.title} style={styles.infoCard}>
                <Text
                  accessible={false}
                  aria-hidden={true}
                  style={styles.cardIcon}
                >
                  {method.icon}
                </Text>
                <Text
                  accessibilityRole="header"
                  aria-level={3}
                  style={styles.cardTitle}
                >
                  {method.title}
                </Text>
                <Text style={styles.cardText}>
                  {method.text}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTag}>
            TUDO EM UM SÓ LUGAR
          </Text>

          <Text
            accessibilityRole="header"
            aria-level={2}
            style={styles.sectionTitle}
          >
            Veja seus gastos de um jeito simples e útil.
          </Text>

          <View style={styles.resourceGrid}>
            {resources.map((resource) => (
              <View key={resource} style={styles.resourceItem}>
                <Text style={styles.resourceCheck}>✓</Text>
                <Text style={styles.resourceText}>
                  {resource}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionSoft}>
          <Text
            accessibilityRole="header"
            aria-level={2}
            style={styles.sectionTag}
          >
            OS PILARES DO ENXERGAÍ
          </Text>

          <View style={styles.pillars}>
            {pillars.map((pillar, index) => (
              <View key={pillar} style={styles.pillarCard}>
                <Text style={styles.pillarNumber}>
                  {index + 1}
                </Text>
                <Text style={styles.pillarText}>
                  {pillar}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.privacyCard}>
          <Text
            accessibilityRole="header"
            aria-level={2}
            style={styles.privacyTitle}
          >
            Seus registros são seus.
          </Text>

          <Text style={styles.privacyText}>
            O Enxergaí não acessa automaticamente sua conta
            bancária. As despesas são informadas por você e
            ficam associadas à sua conta.
          </Text>

          <TouchableOpacity
            onPress={() =>
              router.push("/politica-de-privacidade")
            }
          >
            <Text style={styles.privacyLink}>
              Conhecer a Política de Privacidade
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.finalCta}>
          <Text
            accessibilityRole="header"
            aria-level={2}
            style={styles.finalTitle}
          >
            Comece a enxergar para onde o seu dinheiro está
            indo.
          </Text>

          <Text style={styles.finalText}>
            Você fala. O Enxergaí organiza. Você decide com
            mais clareza.
          </Text>

          <TouchableOpacity
            style={styles.finalButton}
            onPress={criarConta}
          >
            <Text style={styles.finalButtonText}>
              Criar conta grátis
            </Text>
          </TouchableOpacity>
        </View>

        </View>

        <View role="contentinfo" style={styles.footer}>
          <Text style={styles.footerBrand}>Enxergaí</Text>

          <View
            style={[
              styles.footerLinks,
              isMobile && styles.footerLinksMobile,
            ]}
          >
            <TouchableOpacity
              onPress={() =>
                router.push("/politica-de-privacidade")
              }
            >
              <Text style={styles.footerLink}>
                Privacidade
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                router.push("/termos-de-uso")
              }
            >
              <Text style={styles.footerLink}>
                Termos de Uso
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                router.push("/excluir-conta")
              }
            >
              <Text style={styles.footerLink}>
                Excluir conta
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerContact}>
            Contato: enxergai.adm@gmail.com
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },
  pageContent: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 10,
    marginRight: 10,
  },
  brand: {
    color: "#0A8F55",
    fontSize: 24,
    fontWeight: "900",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loginLink: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  loginLinkText: {
    color: "#0A8F55",
    fontWeight: "800",
  },
  headerButton: {
    backgroundColor: "#0A8F55",
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  headerButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  hero: {
    backgroundColor: "#EEF7F3",
    borderRadius: 28,
    padding: 36,
    flexDirection: "row",
    gap: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CFE8DB",
  },
  heroMobile: {
    flexDirection: "column",
    padding: 22,
  },
  heroText: {
    flex: 1.2,
  },
  eyebrow: {
    color: "#0A8F55",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  heroTitle: {
    color: "#163D2B",
    fontSize: 44,
    lineHeight: 52,
    fontWeight: "900",
    marginBottom: 16,
  },
  heroTitleMobile: {
    fontSize: 32,
    lineHeight: 39,
  },
  heroDescription: {
    color: "#465A50",
    fontSize: 17,
    lineHeight: 26,
    maxWidth: 650,
  },
  heroActions: {
    flexDirection: "row",
    marginTop: 24,
    gap: 12,
  },
  heroActionsMobile: {
    flexDirection: "column",
  },
  primaryButton: {
    backgroundColor: "#0A8F55",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BFDACB",
  },
  secondaryButtonText: {
    color: "#0A8F55",
    fontSize: 15,
    fontWeight: "900",
  },
  heroCard: {
    flex: 0.8,
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#DDE8E2",
  },
  heroCardIcon: {
    fontSize: 38,
    marginBottom: 10,
  },
  heroCardTitle: {
    color: "#163D2B",
    fontSize: 21,
    fontWeight: "900",
    marginBottom: 8,
  },
  heroCardExample: {
    color: "#586A61",
    fontSize: 15,
    lineHeight: 22,
  },
  resultCard: {
    backgroundColor: "#F4FBF7",
    borderRadius: 12,
    padding: 14,
    marginTop: 18,
  },
  resultLabel: {
    color: "#0A8F55",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 5,
  },
  resultText: {
    color: "#33473D",
    fontSize: 14,
    fontWeight: "700",
  },
  section: {
    paddingVertical: 50,
  },
  sectionSoft: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  sectionTag: {
    color: "#0A8F55",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
    textAlign: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    color: "#243C31",
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "900",
    textAlign: "center",
    maxWidth: 760,
    alignSelf: "center",
    marginBottom: 28,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    justifyContent: "center",
  },
  problemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    width: 310,
    borderWidth: 1,
    borderColor: "#E2EAE6",
  },
  problemQuote: {
    color: "#41564B",
    fontSize: 17,
    lineHeight: 25,
    fontWeight: "800",
    textAlign: "center",
  },
  infoCard: {
    backgroundColor: "#F7F8FA",
    borderRadius: 17,
    padding: 22,
    width: 320,
    borderWidth: 1,
    borderColor: "#E2E8E5",
  },
  cardIcon: {
    fontSize: 34,
    marginBottom: 10,
  },
  cardTitle: {
    color: "#163D2B",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8,
  },
  cardText: {
    color: "#586A61",
    fontSize: 15,
    lineHeight: 23,
  },
  resourceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  resourceItem: {
    width: 260,
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2EAE6",
  },
  resourceCheck: {
    color: "#0A8F55",
    fontSize: 18,
    fontWeight: "900",
    marginRight: 10,
  },
  resourceText: {
    color: "#41564B",
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  pillars: {
    gap: 12,
    maxWidth: 850,
    width: "100%",
    alignSelf: "center",
  },
  pillarCard: {
    backgroundColor: "#F7F8FA",
    borderRadius: 14,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  pillarNumber: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#0A8F55",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 38,
    fontWeight: "900",
    marginRight: 14,
  },
  pillarText: {
    color: "#3F554A",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
    flex: 1,
  },
  privacyCard: {
    backgroundColor: "#163D2B",
    borderRadius: 22,
    padding: 28,
    alignItems: "center",
    marginTop: 44,
  },
  privacyTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 10,
    textAlign: "center",
  },
  privacyText: {
    color: "#DCF2E6",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 740,
  },
  privacyLink: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    textDecorationLine: "underline",
    marginTop: 16,
  },
  finalCta: {
    paddingVertical: 50,
    alignItems: "center",
  },
  finalTitle: {
    color: "#243C31",
    fontSize: 29,
    lineHeight: 37,
    fontWeight: "900",
    textAlign: "center",
    maxWidth: 720,
  },
  finalText: {
    color: "#607067",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginTop: 12,
  },
  finalButton: {
    backgroundColor: "#0A8F55",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 18,
  },
  finalButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#DEE5E1",
    paddingTop: 28,
    alignItems: "center",
    gap: 14,
  },
  footerBrand: {
    color: "#0A8F55",
    fontSize: 20,
    fontWeight: "900",
  },
  footerLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 18,
  },
  footerLinksMobile: {
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  },
  footerLink: {
    color: "#50645A",
    fontSize: 14,
    fontWeight: "700",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  footerContact: {
    color: "#718078",
    fontSize: 13,
  },
});
