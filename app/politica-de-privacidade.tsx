import { useRouter } from "expo-router";
import React from "react";
import {
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletSymbol}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

export default function PoliticaDePrivacidade() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 600;

  async function abrirEmail() {
    await Linking.openURL(
      "mailto:enxergai.adm@gmail.com?subject=Privacidade%20-%20Enxergaí"
    );
  }

  async function abrirSite() {
    await Linking.openURL("https://www.enxergai.com.br");
  }

  return (
    <View style={styles.page}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isMobile && styles.scrollContentMobile,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.backButtonText}>← Voltar ao Enxergaí</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>ENXERGAÍ</Text>
          <Text style={styles.heroTitle}>Política de Privacidade</Text>
          <Text style={styles.heroSubtitle}>
            Clareza, segurança e respeito aos seus dados.
          </Text>
        </View>

        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Responsável</Text>
            <Text style={styles.metaValue}>
              Marcelo Carlos de Melo Abreu
            </Text>
          </View>

          <View style={styles.metaDivider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Canal de privacidade</Text>
            <TouchableOpacity onPress={abrirEmail}>
              <Text style={styles.linkText}>
                enxergai.adm@gmail.com
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.metaDivider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Vigência</Text>
            <Text style={styles.metaValue}>
              15 de agosto de 2026
            </Text>
          </View>
        </View>
        
        <Section title="1. Apresentação e abrangência">
          <Paragraph>
            Esta Política de Privacidade explica como o Enxergaí coleta,
            utiliza, armazena, compartilha e protege dados pessoais no site,
            no aplicativo e em seus recursos relacionados. A Política
            aplica-se exclusivamente às pessoas usuárias com 18 anos ou mais
            que criem uma conta ou utilizem os serviços do Enxergaí.
          </Paragraph>

          <Paragraph>
            Ao utilizar o Enxergaí, a pessoa usuária declara ter lido esta
            Política. Quando o tratamento depender de consentimento, ele será
            solicitado de forma adequada e poderá ser revogado nos casos
            previstos em lei.
          </Paragraph>
        </Section>

        <Section title="2. Identificação do responsável pelo tratamento">
          <Paragraph>
            O responsável pelo tratamento de dados pessoais no âmbito do
            Enxergaí é Marcelo Carlos de Melo Abreu, por meio do produto
            digital Enxergaí.
          </Paragraph>

          <TouchableOpacity onPress={abrirSite}>
            <Text style={styles.linkParagraph}>
              https://www.enxergai.com.br
            </Text>
          </TouchableOpacity>

          <Paragraph>
            Solicitações relacionadas à privacidade e aos direitos dos
            titulares devem ser enviadas para: enxergai.adm@gmail.com.
          </Paragraph>
        </Section>

        <Section title="3. Dados pessoais e informações tratados">
          <Paragraph>
            O Enxergaí trata apenas os dados necessários para oferecer as
            funcionalidades contratadas ou solicitadas pela pessoa usuária,
            incluindo:
          </Paragraph>

          <Bullet>nome e endereço de e-mail;</Bullet>

          <Bullet>
            credenciais e identificadores de autenticação administrados pelo
            Supabase, sem acesso do Enxergaí à senha em texto aberto;
          </Bullet>

          <Bullet>
            despesas registradas, incluindo valores, datas, categorias,
            subcategorias e detalhes informados;
          </Bullet>

          <Bullet>
            dados de renda mensal e meta de economia informados
            voluntariamente no Simulador;
          </Bullet>

          <Bullet>
            histórico, totais, relatórios, preferências e informações
            produzidas a partir dos registros inseridos;
          </Bullet>

          <Bullet>
            dados técnicos básicos necessários ao funcionamento da conta, da
            sessão, da segurança e da sincronização, como identificadores
            técnicos, registros de acesso e informações do navegador ou
            dispositivo, quando disponibilizados pela infraestrutura
            utilizada.
          </Bullet>

          <Paragraph>
            Os dados financeiros registrados no Enxergaí são informações
            inseridas voluntariamente pela própria pessoa usuária. O Enxergaí
            não acessa contas bancárias nem importa movimentações bancárias
            automaticamente na versão atual.
          </Paragraph>
        </Section>

        <Section title="4. Dados que o Enxergaí não coleta">
          <Paragraph>
            Na versão atual, o Enxergaí não solicita nem coleta diretamente:
          </Paragraph>

          <Bullet>CPF, RG ou outros documentos de identidade;</Bullet>
          <Bullet>endereço residencial;</Bullet>
          <Bullet>dados bancários, números de contas ou cartões;</Bullet>
          <Bullet>localização por GPS;</Bullet>
          <Bullet>lista de contatos do dispositivo;</Bullet>
          <Bullet>fotos, vídeos ou arquivos pessoais;</Bullet>
          <Bullet>movimentações automáticas de contas bancárias;</Bullet>
          <Bullet>histórico de navegação fora do Enxergaí.</Bullet>
        </Section>

        <Section title="5. Uso do microfone e Fala Inteligente">
          <Paragraph>
            A funcionalidade Fala Inteligente utiliza o microfone somente
            quando a pessoa usuária toca no botão correspondente e autoriza a
            captura. O áudio é convertido em texto para auxiliar o
            preenchimento da despesa.
          </Paragraph>

          <Paragraph>
            O Enxergaí não mantém gravações de áudio em seu banco de dados. O
            processamento de voz pode depender de recursos do navegador, do
            sistema operacional ou do provedor tecnológico do dispositivo,
            sujeitos às respectivas políticas e configurações de
            privacidade.
          </Paragraph>
        </Section>

        <Section title="6. Finalidades do tratamento">
          <Paragraph>Os dados podem ser utilizados para:</Paragraph>

          <Bullet>criar, autenticar, proteger e recuperar a conta;</Bullet>
          <Bullet>
            salvar e sincronizar registros financeiros vinculados à pessoa
            usuária;
          </Bullet>
          <Bullet>
            exibir resumos, históricos, gráficos, relatórios, simuladores e
            insights;
          </Bullet>
          <Bullet>
            personalizar a experiência e melhorar clareza, usabilidade e
            desempenho;
          </Bullet>
          <Bullet>
            prevenir fraudes, abusos, acessos indevidos e incidentes de
            segurança;
          </Bullet>
          <Bullet>
            enviar mensagens transacionais, como recuperação de senha e
            avisos relacionados à conta;
          </Bullet>
          <Bullet>
            cumprir obrigações legais, regulatórias e determinações de
            autoridades competentes;
          </Bullet>
          <Bullet>
            defender direitos em processos administrativos, arbitrais ou
            judiciais.
          </Bullet>
        </Section>

        <Section title="7. Bases legais">
          <Paragraph>
            O tratamento poderá apoiar-se, conforme o caso, na execução de
            contrato ou de procedimentos preliminares solicitados pela pessoa
            usuária, no cumprimento de obrigação legal ou regulatória, no
            exercício regular de direitos, na proteção contra fraudes, no
            legítimo interesse com avaliação dos direitos e expectativas da
            pessoa titular e, quando aplicável, no consentimento.
          </Paragraph>
        </Section>

        <Section title="8. Compartilhamento e fornecedores essenciais">
          <Paragraph>
            O Enxergaí não vende, aluga ou comercializa dados pessoais.
            Informações podem ser tratadas por fornecedores essenciais,
            limitadas às finalidades operacionais descritas nesta Política:
          </Paragraph>

          <Bullet>
            Supabase: autenticação, banco de dados, sessão e sincronização;
          </Bullet>

          <Bullet>
            Vercel: hospedagem, distribuição e disponibilidade do serviço;
          </Bullet>

          <Bullet>
            Resend: envio de e-mails transacionais, incluindo recuperação de
            senha;
          </Bullet>

          <Bullet>
            Google Play e serviços Google relacionados: distribuição do
            aplicativo, verificação de desenvolvedor e informações técnicas
            necessárias ao ecossistema Android;
          </Bullet>

          <Bullet>
            autoridades públicas ou terceiros legitimados, quando houver
            obrigação legal, ordem válida ou necessidade de defesa de direitos.
          </Bullet>

          <Paragraph>
            Os fornecedores atuam segundo seus próprios termos e políticas,
            além das instruções e configurações aplicáveis ao serviço
            contratado pelo Enxergaí.
          </Paragraph>
        </Section>

        <Section title="9. Transferência e processamento internacional">
          <Paragraph>
            Alguns fornecedores de infraestrutura podem processar ou
            armazenar dados em servidores localizados fora do Brasil. Nessas
            situações, o Enxergaí busca utilizar prestadores reconhecidos e
            medidas contratuais, técnicas e organizacionais compatíveis com a
            finalidade do tratamento e com a legislação aplicável.
          </Paragraph>
        </Section>

        <Section title="10. Armazenamento, segurança e retenção">
          <Paragraph>
            O Enxergaí adota medidas razoáveis de segurança para reduzir
            riscos de acesso não autorizado, perda, alteração, divulgação ou
            destruição indevida, incluindo autenticação, segregação lógica
            dos dados por usuário e uso de infraestrutura especializada.
          </Paragraph>

          <Paragraph>
            Nenhum ambiente digital é totalmente livre de riscos. A pessoa
            usuária deve manter a senha em sigilo, utilizar e-mail seguro, não
            compartilhar links de recuperação e comunicar suspeitas de acesso
            indevido.
          </Paragraph>

          <Paragraph>
            Os dados serão mantidos enquanto a conta estiver ativa ou enquanto
            forem necessários às finalidades informadas. Após a exclusão, os
            dados pessoais e financeiros serão eliminados, exceto informações
            que precisem ser mantidas temporariamente por obrigação legal,
            prevenção a fraudes, segurança ou defesa de direitos.
          </Paragraph>
        </Section>

        <Section title="11. Direitos da pessoa titular">
          <Paragraph>
            Nos termos da legislação aplicável, a pessoa titular poderá
            solicitar, conforme cabível:
          </Paragraph>

          <Bullet>confirmação da existência de tratamento;</Bullet>
          <Bullet>acesso aos dados pessoais;</Bullet>
          <Bullet>
            correção de dados incompletos, inexatos ou desatualizados;
          </Bullet>
          <Bullet>
            anonimização, bloqueio ou eliminação de dados desnecessários,
            excessivos ou tratados em desconformidade;
          </Bullet>
          <Bullet>
            portabilidade, quando regulamentada e tecnicamente aplicável;
          </Bullet>
          <Bullet>informações sobre compartilhamento;</Bullet>
          <Bullet>
            eliminação dos dados tratados com consentimento, observadas as
            exceções legais;
          </Bullet>
          <Bullet>
            informações sobre a possibilidade de não consentir e suas
            consequências;
          </Bullet>
          <Bullet>revogação do consentimento;</Bullet>
          <Bullet>
            revisão de decisões tomadas unicamente com base em tratamento
            automatizado, quando aplicável.
          </Bullet>

          <Paragraph>
            Solicitações podem ser enviadas para enxergai.adm@gmail.com. O
            Enxergaí poderá solicitar informações estritamente necessárias
            para confirmar a identidade da pessoa solicitante e proteger a
            conta contra pedidos fraudulentos.
          </Paragraph>
        </Section>

        <Section title="12. Exclusão da conta e cópia dos dados">
          <Paragraph>
            A exclusão poderá ser solicitada por meio da funcionalidade
            “Excluir minha conta”, quando disponível no aplicativo, ou pelo
            e-mail enxergai.adm@gmail.com.
          </Paragraph>

          <Paragraph>
            O pedido será atendido em até 15 dias corridos após a confirmação
            da solicitação e da identidade da pessoa titular, ressalvadas as
            hipóteses legais de retenção.
          </Paragraph>

          <Paragraph>
            A pessoa usuária também poderá solicitar uma cópia dos dados
            vinculados à conta pelo mesmo canal. O Enxergaí já permite copiar,
            compartilhar ou imprimir determinados relatórios, sem prejuízo de
            pedidos adicionais de acesso.
          </Paragraph>
        </Section>

        <Section title="13. Público e restrição etária">
          <Paragraph>
            O Enxergaí é destinado exclusivamente a pessoas com 18 anos ou
            mais.
          </Paragraph>

          <Paragraph>
            O serviço não é direcionado a crianças ou adolescentes e não busca
            coletar conscientemente dados pessoais de pessoas menores de 18
            anos.
          </Paragraph>

          <Paragraph>
            Ao criar uma conta e utilizar o Enxergaí, a pessoa usuária declara
            possuir pelo menos 18 anos.
          </Paragraph>

          <Paragraph>
            Caso seja identificada uma conta pertencente a pessoa menor de 18
            anos, o Enxergaí poderá suspender ou excluir a conta e os
            respectivos dados, observadas as obrigações legais e as medidas
            necessárias à proteção da pessoa menor.
          </Paragraph>

          <Paragraph>
            Pais ou responsáveis legais poderão solicitar informações ou a
            exclusão de dados eventualmente associados a uma pessoa menor de
            18 anos pelo e-mail enxergai.adm@gmail.com. O Enxergaí poderá
            solicitar informações estritamente necessárias para confirmar a
            identidade e a responsabilidade legal da pessoa solicitante.
          </Paragraph>
        </Section>

        <Section title="14. Cookies, armazenamento local e tecnologias semelhantes">
          <Paragraph>
            O site e o aplicativo podem utilizar cookies, armazenamento local
            e tecnologias equivalentes estritamente necessárias para
            autenticação, manutenção da sessão, preferências, segurança e
            funcionamento. Caso sejam implementadas tecnologias opcionais de
            análise ou publicidade, esta Política e os mecanismos de escolha
            serão atualizados antes de sua utilização.
          </Paragraph>
        </Section>

        <Section title="15. Publicidade e monetização">
          <Paragraph>
            A versão atual do Enxergaí não exibe anúncios. A primeira versão
            será gratuita. Futuramente, o Enxergaí poderá oferecer planos
            Premium, assinaturas ou funcionalidades pagas, com comunicação
            clara e atualização dos documentos aplicáveis antes da cobrança.
          </Paragraph>
        </Section>

        <Section title="16. Insights e decisões financeiras">
          <Paragraph>
            O Enxergaí é uma ferramenta de organização e educação financeira.
            Gráficos, simuladores, relatórios, projeções e insights têm caráter
            informativo e educativo e não constituem consultoria financeira,
            contábil, jurídica, tributária ou de investimentos.
          </Paragraph>

          <Paragraph>
            As decisões tomadas com base nas informações exibidas são de
            responsabilidade da pessoa usuária. O Enxergaí não garante
            economia, lucro, redução de despesas ou qualquer resultado
            financeiro específico.
          </Paragraph>
        </Section>

        <Section title="17. Incidentes de segurança">
          <Paragraph>
            Se ocorrer incidente de segurança com risco ou dano relevante, o
            Enxergaí adotará medidas para avaliar, conter e remediar a
            ocorrência e realizará as comunicações cabíveis às pessoas
            afetadas e às autoridades competentes, conforme a legislação
            aplicável.
          </Paragraph>
        </Section>

        <Section title="18. Alterações desta Política">
          <Paragraph>
            Esta Política poderá ser atualizada para refletir mudanças legais,
            técnicas ou funcionais. A versão vigente permanecerá disponível
            nesta página, com indicação da data de publicação ou da última
            atualização. Alterações relevantes poderão ser comunicadas pelos
            canais disponíveis.
          </Paragraph>
        </Section>

        <Section title="19. Contato">
          <Paragraph>
            Para dúvidas, solicitações ou exercício de direitos relacionados
            à privacidade:
          </Paragraph>

          <View style={styles.contactBox}>
            <Text style={styles.contactLabel}>Responsável</Text>
            <Text style={styles.contactValue}>
              Marcelo Carlos de Melo Abreu
            </Text>

            <Text style={styles.contactLabel}>E-mail</Text>
            <TouchableOpacity onPress={abrirEmail}>
              <Text style={styles.linkText}>
                enxergai.adm@gmail.com
              </Text>
            </TouchableOpacity>

            <Text style={styles.contactLabel}>Localidade</Text>
            <Text style={styles.contactValue}>
              São José dos Pinhais, Paraná, Brasil
            </Text>
          </View>
        </Section>

        <Section title="20. Vigência">
          <Paragraph>
            Esta Política entra em vigor em 15 de agosto de 2026.
          </Paragraph>
        </Section>

        <View style={styles.footerCard}>
          <Text style={styles.footerBrand}>Enxergaí</Text>
          <Text style={styles.footerText}>
            Menos esforço para entender seu dinheiro. Mais clareza para
            decidir.
          </Text>

          <TouchableOpacity
            style={styles.footerButton}
            onPress={() => router.replace("/")}
          >
            <Text style={styles.footerButtonText}>
              Voltar ao Enxergaí
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },

  scrollContent: {
    width: "100%",
    maxWidth: 920,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 70,
  },

  scrollContentMobile: {
    paddingHorizontal: 12,
    paddingTop: 16,
  },

  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 10,
  },

  backButtonText: {
    color: "#0A8F55",
    fontSize: 13,
    fontWeight: "800",
  },

  hero: {
    backgroundColor: "#0A8F55",
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 22,
    marginBottom: 14,
    alignItems: "center",
  },

  heroLabel: {
    color: "#DFF8EC",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 6,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
  },

  heroSubtitle: {
    color: "#E9FFF3",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },

  metaCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8E5",
    marginBottom: 12,
  },

  metaRow: {
    gap: 4,
  },

  metaLabel: {
    color: "#0A8F55",
    fontSize: 12,
    fontWeight: "900",
  },

  metaValue: {
    color: "#333333",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },

  metaDivider: {
    height: 1,
    backgroundColor: "#ECF0EE",
    marginVertical: 12,
  },

   section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E6EAE8",
    marginBottom: 12,
  },

  sectionTitle: {
    color: "#0A8F55",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 12,
  },

  paragraph: {
    color: "#3F4743",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 10,
  },

  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 7,
    paddingRight: 4,
  },

  bulletSymbol: {
    color: "#0A8F55",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 21,
    marginRight: 9,
  },

  bulletText: {
    flex: 1,
    color: "#3F4743",
    fontSize: 14,
    lineHeight: 21,
  },

  linkText: {
    color: "#0A8F55",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
    textDecorationLine: "underline",
  },

  linkParagraph: {
    color: "#0A8F55",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "700",
    textDecorationLine: "underline",
    marginBottom: 10,
  },

  contactBox: {
    backgroundColor: "#F3FBF7",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CFE8DB",
    padding: 14,
  },

  contactLabel: {
    color: "#0A8F55",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 8,
    marginBottom: 2,
  },

  contactValue: {
    color: "#333333",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },

  footerCard: {
    backgroundColor: "#EEF7F3",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#CFE8DB",
    alignItems: "center",
    marginTop: 4,
  },

  footerBrand: {
    color: "#0A8F55",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 6,
  },

  footerText: {
    color: "#4D6659",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginBottom: 14,
  },

  footerButton: {
    backgroundColor: "#0A8F55",
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 18,
  },

  footerButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});