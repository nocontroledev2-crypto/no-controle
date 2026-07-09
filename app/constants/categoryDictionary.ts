export type CategoryDictionaryResult = {
  categoria: string;
  subcategoria: string;
  termoEncontrado: string;
};

type CategoryRule = {
  categoria: string;
  subcategoria: string;
  termos: string[];
};

export const CATEGORY_DICTIONARY_RULES: CategoryRule[] = [
  {
    categoria: "Contas da Casa",
    subcategoria: "Energia Elétrica",
    termos: [
      "copel",
      "luz",
      "conta de luz",
      "energia",
      "energia eletrica",
      "energia elétrica",
      "conta de energia",
      "talão de luz",
      "fatura de luz",
    ],
  },
  {
    categoria: "Contas da Casa",
    subcategoria: "Água",
    termos: [
      "sanepar",
      "agua",
      "água",
      "conta de agua",
      "conta de água",
      "talão de agua",
      "talão de água",
      "fatura de agua",
      "fatura de água",
    ],
  },
  {
    categoria: "Contas da Casa",
    subcategoria: "Internet",
    termos: [
      "internet",
      "wifi",
      "wi-fi",
      "fibra",
      "banda larga",
      "claro internet",
      "vivo internet",
      "tim internet",
      "oi internet",
    ],
  },
  {
    categoria: "Contas da Casa",
    subcategoria: "Celular",
    termos: [
      "celular",
      "telefone celular",
      "vivo",
      "claro",
      "tim",
      "oi",
      "plano celular",
      "fatura celular",
    ],
  },
  {
    categoria: "Contas da Casa",
    subcategoria: "Gás",
    termos: [
      "gas",
      "gás",
      "botijao",
      "botijão",
      "ultragaz",
      "liquigas",
      "liquigás",
      "consigaz",
    ],
  },

  {
    categoria: "Transporte",
    subcategoria: "Gasolina",
    termos: [
      "gasolina",
      "posto",
      "abastecimento",
      "abastecer",
      "shell",
      "ipiranga",
      "petrobras",
      "br mania",
      "combustivel",
      "combustível",
    ],
  },
  {
    categoria: "Transporte",
    subcategoria: "Etanol",
    termos: [
      "etanol",
      "alcool",
      "álcool",
    ],
  },
  {
    categoria: "Transporte",
    subcategoria: "Diesel",
    termos: [
      "diesel",
    ],
  },
  {
    categoria: "Transporte",
    subcategoria: "Uber",
    termos: [
      "uber",
    ],
  },
  {
    categoria: "Transporte",
    subcategoria: "99",
    termos: [
      "99",
      "noventa e nove",
      "99 taxi",
      "99 táxi",
    ],
  },
  {
    categoria: "Transporte",
    subcategoria: "Táxi",
    termos: [
      "taxi",
      "táxi",
    ],
  },
  {
    categoria: "Transporte",
    subcategoria: "Pedágio",
    termos: [
      "pedagio",
      "pedágio",
      "praça de pedagio",
      "praça de pedágio",
    ],
  },
  {
    categoria: "Transporte",
    subcategoria: "Estacionamento",
    termos: [
      "estacionamento",
      "parking",
      "zona azul",
    ],
  },

  {
    categoria: "Alimentação",
    subcategoria: "Supermercado",
    termos: [
      "supermercado",
      "mercado",
      "condor",
      "muffato",
      "festval",
      "carrefour",
      "atacadao",
      "atacadão",
      "assaí",
      "assai",
    ],
  },
  {
    categoria: "Alimentação",
    subcategoria: "Padaria",
    termos: [
      "padaria",
      "pão",
      "pao",
      "panificadora",
    ],
  },
  {
    categoria: "Alimentação",
    subcategoria: "Restaurante",
    termos: [
      "restaurante",
      "almoço",
      "almoco",
      "jantar",
      "janta",
      "refeição",
      "refeicao",
      "comida",
      "marmita",
      "buffet",
    ],
  },
  {
    categoria: "Alimentação",
    subcategoria: "Delivery",
    termos: [
      "delivery",
      "ifood",
      "i food",
      "aiqfome",
      "rappi",
      "pizza",
      "hamburguer",
      "hambúrguer",
      "lanche",
      "x salada",
      "x-salada",
    ],
  },
  {
    categoria: "Alimentação",
    subcategoria: "Açougue",
    termos: [
      "açougue",
      "acougue",
      "carne",
      "frango",
      "peixe",
    ],
  },
  {
    categoria: "Alimentação",
    subcategoria: "Hortifruti",
    termos: [
      "hortifruti",
      "fruta",
      "verdura",
      "legume",
      "sacolao",
      "sacolão",
    ],
  },

  {
    categoria: "Saúde",
    subcategoria: "Farmácia",
    termos: [
      "farmacia",
      "farmácia",
      "droga raia",
      "drogaraia",
      "nissei",
      "panvel",
      "medicamento",
      "remedio",
      "remédio",
    ],
  },
  {
    categoria: "Saúde",
    subcategoria: "Médico",
    termos: [
      "medico",
      "médico",
      "consulta",
      "clinica",
      "clínica",
    ],
  },
  {
    categoria: "Saúde",
    subcategoria: "Dentista",
    termos: [
      "dentista",
      "odontologia",
      "odonto",
    ],
  },
  {
    categoria: "Saúde",
    subcategoria: "Exames",
    termos: [
      "exame",
      "exames",
      "laboratorio",
      "laboratório",
      "raio x",
      "ultrassom",
    ],
  },
  {
    categoria: "Saúde",
    subcategoria: "Academia",
    termos: [
      "academia",
      "treino",
      "gym",
      "musculação",
      "musculacao",
    ],
  },

  {
    categoria: "Moradia",
    subcategoria: "Aluguel",
    termos: [
      "aluguel",
    ],
  },
  {
    categoria: "Moradia",
    subcategoria: "Condomínio",
    termos: [
      "condominio",
      "condomínio",
    ],
  },
  {
    categoria: "Moradia",
    subcategoria: "IPTU",
    termos: [
      "iptu",
    ],
  },
  {
    categoria: "Moradia",
    subcategoria: "Reforma",
    termos: [
      "reforma",
      "material de construção",
      "material de construcao",
      "balaroti",
      "leroy",
      "casa do construtor",
    ],
  },

  {
    categoria: "Lazer",
    subcategoria: "Streaming",
    termos: [
      "netflix",
      "spotify",
      "prime video",
      "amazon prime",
      "disney",
      "globoplay",
      "youtube premium",
      "max",
      "hbo",
    ],
  },
  {
    categoria: "Lazer",
    subcategoria: "Cinema",
    termos: [
      "cinema",
      "ingresso cinema",
    ],
  },
  {
    categoria: "Lazer",
    subcategoria: "Viagem",
    termos: [
      "viagem",
      "hotel",
      "pousada",
      "passagem",
      "airbnb",
    ],
  },

  {
    categoria: "Educação",
    subcategoria: "Cursos",
    termos: [
      "curso",
      "cursos",
      "treinamento",
      "aula",
      "udemy",
      "alura",
    ],
  },
  {
    categoria: "Educação",
    subcategoria: "Livros",
    termos: [
      "livro",
      "livros",
      "kindle",
    ],
  },
  {
    categoria: "Educação",
    subcategoria: "Escola",
    termos: [
      "escola",
      "mensalidade escolar",
      "material escolar",
    ],
  },

  {
    categoria: "Compras",
    subcategoria: "Roupas",
    termos: [
      "roupa",
      "roupas",
      "camisa",
      "calça",
      "calca",
      "blusa",
    ],
  },
  {
    categoria: "Compras",
    subcategoria: "Calçados",
    termos: [
      "tenis",
      "tênis",
      "sapato",
      "calçado",
      "calcado",
    ],
  },
  {
    categoria: "Compras",
    subcategoria: "Eletrônicos",
    termos: [
      "eletronico",
      "eletrônico",
      "celular novo",
      "notebook",
      "computador",
      "fone",
      "carregador",
    ],
  },

  {
    categoria: "Serviços",
    subcategoria: "Mecânico",
    termos: [
      "mecanico",
      "mecânico",
      "oficina",
      "conserto carro",
      "revisão carro",
      "revisao carro",
    ],
  },
  {
    categoria: "Serviços",
    subcategoria: "Lava Car",
    termos: [
      "lava car",
      "lava rápido",
      "lava rapido",
      "lavagem carro",
    ],
  },
  {
    categoria: "Serviços",
    subcategoria: "Diarista",
    termos: [
      "diarista",
      "faxina",
      "limpeza",
    ],
  },

  {
    categoria: "Pets",
    subcategoria: "Ração",
    termos: [
      "ração",
      "racao",
      "ração cachorro",
      "racao cachorro",
      "ração gato",
      "racao gato",
    ],
  },
  {
    categoria: "Pets",
    subcategoria: "Veterinário",
    termos: [
      "veterinario",
      "veterinário",
      "vet",
    ],
  },
  {
    categoria: "Pets",
    subcategoria: "Banho e Tosa",
    termos: [
      "banho e tosa",
      "pet shop",
      "petshop",
    ],
  },

  {
    categoria: "Família",
    subcategoria: "Filhos",
    termos: [
      "filho",
      "filha",
      "filhos",
    ],
  },
  {
    categoria: "Família",
    subcategoria: "Creche",
    termos: [
      "creche",
    ],
  },
  {
    categoria: "Família",
    subcategoria: "Mesada",
    termos: [
      "mesada",
    ],
  },
  {
    categoria: "Família",
    subcategoria: "Pensão",
    termos: [
      "pensão",
      "pensao",
    ],
  },

  {
    categoria: "Financeiro",
    subcategoria: "Cartão de Crédito",
    termos: [
      "cartao",
      "cartão",
      "cartao de credito",
      "cartão de crédito",
      "fatura cartao",
      "fatura cartão",
    ],
  },
  {
    categoria: "Financeiro",
    subcategoria: "Empréstimo",
    termos: [
      "emprestimo",
      "empréstimo",
    ],
  },
  {
    categoria: "Financeiro",
    subcategoria: "Juros",
    termos: [
      "juros",
      "multa",
      "atraso",
    ],
  },
  {
    categoria: "Financeiro",
    subcategoria: "Tarifas Bancárias",
    termos: [
      "tarifa",
      "tarifa bancaria",
      "tarifa bancária",
      "banco",
      "cesta bancaria",
      "cesta bancária",
    ],
  },
];

export function normalizeCategoryText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function termMatchesText(normalizedText: string, normalizedTerm: string) {
  if (!normalizedTerm) {
    return false;
  }

  const paddedText = ` ${normalizedText} `;
  const paddedTerm = ` ${normalizedTerm} `;

  // Termos curtos como "gas", "oi", "99" precisam bater como palavra inteira.
  // Isso evita "gas" bater dentro de "gasolina" e "oi" bater dentro de "foi".
  if (normalizedTerm.length <= 3) {
    return paddedText.includes(paddedTerm);
  }

  return normalizedText.includes(normalizedTerm);
}

export function findCategoryByText(text: string): CategoryDictionaryResult | null {
  const normalizedText = normalizeCategoryText(text);

  if (!normalizedText) {
    return null;
  }

  const allTerms = CATEGORY_DICTIONARY_RULES.flatMap((rule) =>
    rule.termos.map((term) => ({
      categoria: rule.categoria,
      subcategoria: rule.subcategoria,
      termoOriginal: term,
      termoNormalizado: normalizeCategoryText(term),
    }))
  ).sort((a, b) => b.termoNormalizado.length - a.termoNormalizado.length);

  for (const item of allTerms) {
    if (termMatchesText(normalizedText, item.termoNormalizado)) {
      return {
        categoria: item.categoria,
        subcategoria: item.subcategoria,
        termoEncontrado: item.termoOriginal,
      };
    }
  }

  return null;
}