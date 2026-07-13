export const SUBCATEGORIES_BY_MASTER: Record<string, string[]> = {
  "Moradia": [
    "Aluguel",
    "Condomínio",
    "Financiamento Imobiliário",
    "IPTU",
    "Reforma",
    "Manutenção Residencial",
    "Móveis",
    "Eletrodomésticos",
  ],

  "Contas da Casa": [
    "Energia Elétrica",
    "Água",
    "Internet",
    "Celular",
    "Telefone Fixo",
    "Gás",
    "TV por Assinatura",
  ],

  "Alimentação": [
    "Supermercado",
    "Mercado",
    "Padaria",
    "Açougue",
    "Hortifruti",
    "Restaurante",
    "Almoço",
    "Jantar",
    "Lanche",
    "Marmita",
    "Delivery",
    "Bebidas",
  ],

  "Transporte": [
    "Gasolina",
    "Etanol",
    "Diesel",
    "Uber",
    "99",
    "Táxi",
    "Ônibus",
    "Pedágio",
    "Estacionamento",
    "Manutenção Veículo",
    "Seguro Veículo",
    "IPVA",
    "Licenciamento",
  ],

  "Saúde": [
    "Farmácia",
    "Médico",
    "Dentista",
    "Exames",
    "Plano de Saúde",
    "Terapia",
    "Academia",
    "Óculos",
    "Medicamentos",
  ],

  "Educação": [
    "Escola",
    "Faculdade",
    "Cursos",
    "Livros",
    "Material Escolar",
    "Mensalidade",
    "Aulas Particulares",
  ],

  "Lazer": [
  "Cinema",
  "Viagem",
  "Passeios",
  "Eventos",
  "Jogos",
  "Balada",
  "Shows",
  "Bar",
  "Clube",
],

  "Compras": [
  "Compras Online",
  "Roupas",
  "Calçados",
  "Acessórios",
  "Presentes",
  "Eletrônicos",
  "Casa",
  "Beleza",
  "Perfumaria",
],


  "Serviços": [
    "Mecânico",
    "Lava Car",
    "Advogado",
    "Contador",
    "Diarista",
    "Jardinagem",
    "Manutenção",
    "Frete",
  ],

  "Pets": [
    "Ração",
    "Veterinário",
    "Banho e Tosa",
    "Medicamentos Pet",
    "Acessórios Pet",
  ],

  "Família": [
    "Filhos",
    "Creche",
    "Pensão",
    "Mesada",
    "Presentes Família",
    "Cuidados Familiares",
  ],

  "Financeiro": [
  "Banco",
  "Cartão de Crédito",
  "Empréstimo",
  "Financiamento",
  "Juros",
  "Tarifas Bancárias",
  "Investimentos",
  "Impostos",
  "Pix",
  "Saque",
],

  "Receitas": [
    "Salário",
    "Freelance",
    "Comissão",
    "Venda",
    "Reembolso",
    "Rendimento",
    "Outras Receitas",
  ],
  
"Assinaturas": [
  "Streaming",
  "Música",
  "TV por Assinatura",
  "Software",
  "Aplicativos",
  "Jogos",
  "Outras Assinaturas",
],

  "Outros": [
    "Outros",
  ],
};

export function getSubcategoriesByMaster(category: string) {
  return SUBCATEGORIES_BY_MASTER[category] ?? [];
}