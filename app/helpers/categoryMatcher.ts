type CategoryMap = {
  category: string;
  keywords: string[];
};

const CATEGORY_MAP: CategoryMap[] = [
  { category: "Transporte", keywords: ["gasolina","etanol","alcool","diesel","combustivel","posto","uber","99","taxi","ônibus","metro","corrida","abastecimento","transporte"] },
  { category: "Alimentação", keywords: ["mercado","mercadinho","supermercado","comida","alimentacao","almoço","jantar","lanche","padaria","restaurante","ifood","delivery","rancho","compras"] },
  { category: "Moradia", keywords: ["aluguel","condominio","luz","energia","agua","gás","gas","internet","telefone","casa","moradia"] },
  { category: "Educação", keywords: ["escola","colegio","faculdade","universidade","curso","cursos","ingles","idiomas","linguas","pós","pos","especializacao","treinamento"] },
  { category: "Cartão de crédito", keywords: ["cartao","cartão","fatura","credito","crédito","visa","master","elo"] },
  { category: "Impostos", keywords: ["imposto","impostos","ipva","iptu","ir","imposto de renda","inss","taxa","tributo"] },
  { category: "Saúde", keywords: ["farmacia","farmácia","remedio","remédio","medicamento","medico","médico","consulta","exame","plano","saude","saúde"] },
  { category: "Lazer", keywords: ["lazer","cinema","show","viagem","passeio","diversao","diversão","netflix","spotify","streaming","jogo"] },
  { category: "Serviços", keywords: ["servico","serviço","manutencao","manutenção","conserto","mecanico","mecânico","limpeza","diarista","tecnico","técnico"] },
  { category: "Investimentos", keywords: ["investimento","investimentos","cdb","cdi","lci","lca","poupanca","poupança","acoes","ações","bolsa","renda fixa","renda variavel","bitcoin","cripto","criptoativos"] },
  { category: "Compras", keywords: ["compra","compras","roupa","vestuario","vestuário","tenis","tênis","eletronico","eletrônico","presente","shopping"] },
];

export function matchCategory(text: string): string {
  const normalized = normalize(text);

  for (const item of CATEGORY_MAP) {
    if (item.keywords.some((k) => normalized.includes(normalize(k)))) {
      return item.category;
    }
  }
  return "Outros";
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
