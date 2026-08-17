import { useRouter } from "expo-router";
import React from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";

const sections = [
  { title: `1. Aceitação dos Termos`, paragraphs: [
      `Estes Termos de Uso regulam o acesso e a utilização do site, do aplicativo e dos recursos relacionados ao Enxergaí. Ao criar uma conta, acessar ou utilizar o serviço, a pessoa usuária declara ter lido, compreendido e aceitado estes Termos e a Política de Privacidade.`,
      `Se a pessoa usuária não concordar com estes Termos, não deverá criar uma conta nem utilizar o Enxergaí. O aceite eletrônico produzirá efeitos a partir da confirmação apresentada no cadastro ou do uso do serviço, conforme aplicável.`
    ] },
  { title: `2. Público e restrição etária`, paragraphs: [
      `O Enxergaí é destinado exclusivamente a pessoas com 18 anos ou mais. Ao criar uma conta e utilizar o serviço, a pessoa usuária declara possuir pelo menos 18 anos e capacidade para praticar os atos necessários à utilização do Enxergaí.`,
      `O serviço não é direcionado a crianças ou adolescentes. Caso seja identificada uma conta pertencente a pessoa menor de 18 anos, o Enxergaí poderá suspender ou encerrar a conta e adotar as medidas necessárias à proteção da pessoa menor, observadas as obrigações legais aplicáveis.`
    ] },
  { title: `3. Descrição e finalidade do Enxergaí`, paragraphs: [
      `O Enxergaí é uma ferramenta digital de organização e educação financeira pessoal. O serviço permite registrar despesas, organizar informações por categorias e subcategorias, consultar o histórico, visualizar totais e gráficos, utilizar simuladores, obter insights informativos e gerar relatórios a partir dos dados fornecidos pela própria pessoa usuária.`,
      `O Enxergaí busca traduzir números e informações financeiras para uma linguagem simples e próxima do dia a dia, reduzindo o esforço necessário para compreender os próprios gastos e apoiar decisões mais conscientes.`
    ] },
  { title: `4. O que o Enxergaí não oferece`, paragraphs: [
      `O Enxergaí não é banco, instituição de pagamento, corretora, seguradora, consultoria ou instituição financeira. Na versão atual, o serviço não:
• abre ou mantém contas bancárias;
• recebe depósitos, guarda, transfere ou movimenta dinheiro;
• emite cartões, oferece crédito, empréstimos ou antecipações;
• realiza ou intermedeia investimentos, seguros ou compra e venda de ativos;
• acessa automaticamente contas bancárias ou importa movimentações;
• garante economia, lucro, redução de despesas ou resultado financeiro específico.`
    ] },
  { title: `5. Natureza informativa e responsabilidade pelas decisões`, paragraphs: [
      `Gráficos, comparações, simuladores, projeções, relatórios e insights têm caráter exclusivamente informativo e educativo. Eles não constituem consultoria financeira, contábil, jurídica, tributária ou de investimentos, nem recomendação individualizada de produtos ou operações financeiras.`,
      `As decisões tomadas com base nas informações apresentadas são de responsabilidade da pessoa usuária, que deverá avaliar sua realidade, conferir os dados inseridos e, quando necessário, buscar orientação profissional habilitada.`
    ] },
  { title: `6. Criação, acesso e segurança da conta`, paragraphs: [
      `Para utilizar funcionalidades vinculadas à nuvem, a pessoa usuária deverá criar uma conta com informações verdadeiras, atualizadas e suficientes, incluindo nome, endereço de e-mail e senha. A pessoa usuária é responsável por manter a confidencialidade da senha e dos meios de recuperação, não compartilhar credenciais, usar e-mail legítimo, manter seus dados atualizados, comunicar suspeitas de acesso indevido e encerrar a sessão em dispositivos compartilhados.`,
      `O Enxergaí poderá adotar verificações razoáveis de identidade e segurança antes de atender solicitações sensíveis, como recuperação, alteração ou exclusão da conta.`
    ] },
  { title: `7. Dados e conteúdo inseridos pela pessoa usuária`, paragraphs: [
      `A pessoa usuária é responsável pela exatidão, licitude e adequação dos dados, valores, datas, categorias, descrições, renda, metas e demais informações inseridas. Informações incorretas ou incompletas poderão gerar totais, simulações e insights igualmente incorretos ou incompletos.`,
      `A titularidade das informações inseridas permanece com a pessoa usuária. O Enxergaí utilizará tais informações apenas na medida necessária para oferecer, proteger, aprimorar e administrar o serviço, conforme estes Termos e a Política de Privacidade.`
    ] },
  { title: `8. Uso permitido`, paragraphs: [
      `O Enxergaí poderá ser utilizado para fins pessoais e lícitos de organização e educação financeira, respeitadas as funcionalidades disponibilizadas, estes Termos, a Política de Privacidade e a legislação aplicável.`
    ] },
  { title: `9. Condutas proibidas`, paragraphs: [
      `É proibido utilizar o Enxergaí para fraudar, causar prejuízo, praticar ato ilícito, acessar dados de terceiros, contornar mecanismos de segurança, introduzir código malicioso, realizar ataques ou testes não autorizados, usar automação abusiva, prejudicar a disponibilidade, realizar engenharia reversa em desacordo com a legislação, violar direitos ou utilizar o serviço de modo incompatível com sua finalidade.`
    ] },
  { title: `10. Suspensão e encerramento por uso indevido`, paragraphs: [
      `O Enxergaí poderá limitar, suspender ou encerrar o acesso quando houver indícios razoáveis de fraude, risco à segurança, tentativa de acesso a dados de terceiros, uso automatizado abusivo, violação destes Termos ou descumprimento da legislação.`,
      `Sempre que razoavelmente possível e compatível com a segurança, a pessoa usuária será informada sobre a medida e poderá solicitar esclarecimentos pelo canal oficial. Medidas urgentes poderão ser adotadas imediatamente para proteger usuários, dados, infraestrutura e direitos.`
    ] },
  { title: `11. Disponibilidade, manutenção e continuidade`, paragraphs: [
      `O Enxergaí buscará manter o serviço disponível e funcional, mas não garante operação ininterrupta ou livre de falhas. Poderão ocorrer interrupções por manutenção, atualização, correções, falhas de conexão, fornecedores de infraestrutura, eventos de segurança, caso fortuito, força maior ou fatores fora do controle razoável do Enxergaí.`,
      `Quando possível, manutenções relevantes ou indisponibilidades prolongadas serão comunicadas pelos canais disponíveis.`
    ] },
  { title: `12. Atualizações e mudanças nas funcionalidades`, paragraphs: [
      `O Enxergaí poderá adicionar, aperfeiçoar, substituir, reorganizar ou descontinuar funcionalidades para melhorar a experiência, segurança, desempenho, conformidade ou sustentabilidade do serviço.`,
      `Mudanças relevantes que afetem direitos, acesso, cobrança ou tratamento de dados serão comunicadas de forma adequada, preservados os direitos assegurados pela legislação aplicável.`
    ] },
  { title: `13. Gratuidade e futuros recursos pagos`, paragraphs: [
      `A primeira versão do Enxergaí é gratuita e não contém anúncios. Futuramente, poderão ser oferecidos recursos, planos ou assinaturas Premium.`,
      `Antes de qualquer contratação paga, serão apresentados de forma clara os preços, recursos incluídos, período de cobrança, renovação, cancelamento, reembolso e demais condições, observadas a legislação brasileira e as regras da plataforma de pagamento utilizada, inclusive a Google Play quando aplicável.`,
      `A instalação gratuita do aplicativo não garante que todos os recursos futuros sejam gratuitos.`
    ] },
  { title: `14. Propriedade intelectual`, paragraphs: [
      `O nome Enxergaí, sua identidade visual, ícones, textos institucionais, estrutura, interfaces, códigos, bancos de dados, elementos gráficos e demais componentes do serviço pertencem ao responsável pelo Enxergaí ou são utilizados legitimamente, estando protegidos pela legislação aplicável.`,
      `A aceitação destes Termos concede apenas uma licença pessoal, limitada, revogável, não exclusiva e intransferível para utilizar o serviço conforme sua finalidade. Não há cessão de propriedade intelectual à pessoa usuária.`
    ] },
  { title: `15. Privacidade e proteção de dados`, paragraphs: [
      `O tratamento de dados pessoais é regido pela Política de Privacidade do Enxergaí. A Política explica os dados tratados, finalidades, fornecedores, segurança, retenção, direitos e canais de contato.`,
      `Estes Termos e a Política de Privacidade são documentos complementares e devem ser lidos em conjunto.`
    ] },
  { title: `16. Exclusão da conta e dos dados`, paragraphs: [
      `A pessoa usuária poderá solicitar a exclusão da conta e dos dados associados pelo caminho disponível na área Minha Conta ou pela página pública de exclusão.`,
      `O pedido será atendido em até 15 dias corridos após a confirmação da solicitação e da identidade da pessoa titular, ressalvadas hipóteses legais de retenção temporária por obrigação legal ou regulatória, prevenção a fraudes, segurança ou exercício regular de direitos.`,
      `A exclusão é definitiva e poderá impedir a recuperação posterior dos registros. Lançamentos financeiros também podem ser excluídos individualmente pelo Histórico, sem encerramento da conta.`
    ] },
  { title: `17. Limitações e responsabilidades`, paragraphs: [
      `O Enxergaí responde por suas obrigações nos limites previstos na legislação aplicável. Nenhuma disposição destes Termos busca excluir ou limitar direitos obrigatórios da pessoa consumidora.`,
      `O Enxergaí não será responsável por resultados decorrentes de dados incorretos fornecidos pela pessoa usuária, decisões financeiras tomadas exclusivamente com base em informações educativas, uso indevido de credenciais, falhas de conexão ou serviços de terceiros fora de seu controle razoável, sem prejuízo das responsabilidades que não possam ser afastadas por lei.`
    ] },
  { title: `18. Comunicações`, paragraphs: [
      `O Enxergaí poderá enviar mensagens transacionais e de segurança relacionadas à conta, como recuperação de senha, alterações relevantes, manutenção, incidentes e respostas a solicitações. Mensagens promocionais, se adotadas futuramente, observarão a legislação e os mecanismos de escolha aplicáveis.`
    ] },
  { title: `19. Alterações destes Termos`, paragraphs: [
      `Estes Termos poderão ser atualizados para refletir mudanças legais, técnicas, operacionais ou comerciais. A versão vigente permanecerá disponível nesta página, com indicação da data de publicação ou da última atualização.`,
      `Mudanças relevantes serão comunicadas pelos canais disponíveis. A continuidade de uso após a entrada em vigor de uma nova versão poderá representar aceite dos Termos atualizados, quando permitido pela legislação, sem prejuízo de consentimentos específicos eventualmente necessários.`
    ] },
  { title: `20. Solução de conflitos e legislação aplicável`, paragraphs: [
      `Estes Termos serão interpretados de acordo com a legislação brasileira. Dúvidas ou conflitos serão tratados preferencialmente de maneira amigável pelos canais oficiais de atendimento do Enxergaí.`,
      `Caso não seja possível alcançar solução amigável, fica assegurado à pessoa usuária o direito de recorrer aos órgãos de proteção e defesa do consumidor e ao Poder Judiciário, observadas as regras legais de competência territorial aplicáveis, inclusive os direitos previstos na legislação de proteção ao consumidor.`,
      `Quando a legislação permitir e não houver prejuízo ao acesso da pessoa consumidora à Justiça, poderá ser competente o foro da Comarca de São José dos Pinhais, Estado do Paraná.`
    ] },
  { title: `21. Contato`, paragraphs: [
      `Para dúvidas, solicitações ou comunicações relacionadas a estes Termos:

Responsável: Marcelo Carlos de Melo Abreu
Produto: Enxergaí
E-mail: enxergai.adm@gmail.com
Localidade: São José dos Pinhais, Paraná, Brasil`
    ] },
  { title: `22. Vigência`, paragraphs: [
      `Estes Termos entram em vigor em 17 de agosto de 2026.`
    ] }
];

export default function TermosDeUso() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 600;
  const open = (url: string) => Linking.openURL(url);

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={[styles.scrollContent, isMobile && styles.scrollContentMobile]} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/")}>
          <Text style={styles.backButtonText}>← Voltar ao Enxergaí</Text>
        </TouchableOpacity>
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>ENXERGAÍ</Text>
          <Text style={styles.heroTitle}>Termos de Uso</Text>
          <Text style={styles.heroSubtitle}>Regras claras para uma experiência simples, segura e responsável.</Text>
        </View>
        <View style={styles.metaCard}>
          <Text style={styles.metaLabel}>Responsável</Text><Text style={styles.metaValue}>Marcelo Carlos de Melo Abreu</Text>
          <View style={styles.metaDivider} />
          <Text style={styles.metaLabel}>Produto e site</Text><TouchableOpacity onPress={() => open("https://www.enxergai.com.br")}><Text style={styles.linkText}>Enxergaí | https://www.enxergai.com.br</Text></TouchableOpacity>
          <View style={styles.metaDivider} />
          <Text style={styles.metaLabel}>Contato</Text><TouchableOpacity onPress={() => open("mailto:enxergai.adm@gmail.com?subject=Termos%20de%20Uso%20-%20Enxergaí")}><Text style={styles.linkText}>enxergai.adm@gmail.com</Text></TouchableOpacity>
          <View style={styles.metaDivider} />
          <Text style={styles.metaLabel}>Vigência</Text><Text style={styles.metaValue}>17 de agosto de 2026</Text>
        </View>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.paragraphs.map((paragraph, index) => (
              <Text key={`${section.title}-${index}`} style={styles.paragraph}>{paragraph}</Text>
            ))}
            {section.title.startsWith("15.") && <TouchableOpacity onPress={() => open("https://www.enxergai.com.br/politica-de-privacidade")}><Text style={styles.linkParagraph}>https://www.enxergai.com.br/politica-de-privacidade</Text></TouchableOpacity>}
            {section.title.startsWith("16.") && <TouchableOpacity onPress={() => open("https://www.enxergai.com.br/excluir-conta")}><Text style={styles.linkParagraph}>https://www.enxergai.com.br/excluir-conta</Text></TouchableOpacity>}
          </View>
        ))}
        <View style={styles.footerCard}>
          <Text style={styles.footerBrand}>Enxergaí</Text>
          <Text style={styles.footerText}>Menos esforço para entender seu dinheiro. Mais clareza para decidir.</Text>
          <TouchableOpacity style={styles.footerButton} onPress={() => router.replace("/")}><Text style={styles.footerButtonText}>Voltar ao Enxergaí</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7F8FA" },
  scrollContent: { width: "100%", maxWidth: 920, alignSelf: "center", paddingHorizontal: 20, paddingTop: 24, paddingBottom: 70 },
  scrollContentMobile: { paddingHorizontal: 12, paddingTop: 16 },
  backButton: { alignSelf: "flex-start", paddingVertical: 8, paddingHorizontal: 4, marginBottom: 10 },
  backButtonText: { color: "#0A8F55", fontSize: 13, fontWeight: "800" },
  hero: { backgroundColor: "#0A8F55", borderRadius: 20, paddingVertical: 30, paddingHorizontal: 22, marginBottom: 14, alignItems: "center" },
  heroLabel: { color: "#DFF8EC", fontSize: 12, fontWeight: "900", letterSpacing: 2, marginBottom: 6 },
  heroTitle: { color: "#FFFFFF", fontSize: 28, fontWeight: "900", textAlign: "center", marginBottom: 8 },
  heroSubtitle: { color: "#E9FFF3", fontSize: 14, lineHeight: 20, textAlign: "center" },
  metaCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#E2E8E5", marginBottom: 12 },
  metaLabel: { color: "#0A8F55", fontSize: 12, fontWeight: "900", marginBottom: 3 },
  metaValue: { color: "#333333", fontSize: 14, lineHeight: 20, fontWeight: "600" },
  metaDivider: { height: 1, backgroundColor: "#ECF0EE", marginVertical: 12 },
  section: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "#E6EAE8", marginBottom: 12 },
  sectionTitle: { color: "#0A8F55", fontSize: 17, fontWeight: "900", marginBottom: 12 },
  paragraph: { color: "#3F4743", fontSize: 14, lineHeight: 22, marginBottom: 10 },
  linkText: { color: "#0A8F55", fontSize: 14, lineHeight: 20, fontWeight: "800", textDecorationLine: "underline" },
  linkParagraph: { color: "#0A8F55", fontSize: 14, lineHeight: 22, fontWeight: "700", textDecorationLine: "underline", marginBottom: 10 },
  footerCard: { backgroundColor: "#EEF7F3", borderRadius: 18, padding: 20, borderWidth: 1, borderColor: "#CFE8DB", alignItems: "center", marginTop: 4 },
  footerBrand: { color: "#0A8F55", fontSize: 18, fontWeight: "900", marginBottom: 6 },
  footerText: { color: "#4D6659", fontSize: 13, lineHeight: 19, textAlign: "center", marginBottom: 14 },
  footerButton: { backgroundColor: "#0A8F55", borderRadius: 10, paddingVertical: 11, paddingHorizontal: 18 },
  footerButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" }
});
