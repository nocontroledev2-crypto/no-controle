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
      "inglês",
      "mensalidade inglês",
      "mensalidade linguas",
      "mensalidade francês",
      "mensalidade espanhol",
      "inglês",
      "francês",
      "espanhol",
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

  {
    categoria: "Contas da Casa",
    subcategoria: "Energia Elétrica",
    termos: [
      "enel",
      "enel sp",
      "enel rj",
      "enel ce",
      "light",
      "cemig",
      "cpfl",
      "cpfl paulista",
      "cpfl piratininga",
      "cpfl santa cruz",
      "edp",
      "edp es",
      "edp sp",
      "celesc",
      "ceee",
      "ceee equatorial",
      "equatorial",
      "equatorial alagoas",
      "equatorial maranhao",
      "equatorial maranhão",
      "equatorial para",
      "equatorial pará",
      "equatorial piaui",
      "equatorial piauí",
      "equatorial goias",
      "equatorial goiás",
      "neoenergia",
      "neoenergia brasilia",
      "neoenergia brasília",
      "neoenergia coelba",
      "coelba",
      "neoenergia pernambuco",
      "celpe",
      "neoenergia cosern",
      "cosern",
      "energisa",
      "energisa mt",
      "energisa ms",
      "energisa pb",
      "energisa ro",
      "energisa to",
      "amazonas energia",
      "roraima energia",
      "elektro",
      "rge",
      "ceb",
      "forcel",
      "cocel",
      "castro dis",
      "eletropaulo",
      "conta enel",
      "conta light",
      "conta cemig",
      "conta cpfl",
      "conta celesc",
      "conta energisa",
      "conta equatorial",
      "conta neoenergia",
    ],
  },

  {
    categoria: "Contas da Casa",
    subcategoria: "Água",
    termos: [
      "sabesp",
      "cedae",
      "aguas do rio",
      "águas do rio",
      "copasa",
      "corsan",
      "embasa",
      "saneago",
      "compesa",
      "caesb",
      "cagece",
      "cagepa",
      "caern",
      "casal",
      "caema",
      "cosanpa",
      "caerd",
      "caesa",
      "casan",
      "cesan",
      "deso",
      "agespisa",
      "saneatins",
      "brk",
      "brk ambiental",
      "aguas de manaus",
      "águas de manaus",
      "aguas cuiaba",
      "águas cuiabá",
      "aguas guariroba",
      "águas guariroba",
      "aegea",
      "iguá",
      "igua",
      "rio mais",
      "rio+",
      "conta sabesp",
      "conta cedae",
      "conta copasa",
      "conta corsan",
      "conta embasa",
      "conta saneago",
      "conta compesa",
      "conta caesb",
      "conta cagece",
    ],
  },

  {
    categoria: "Contas da Casa",
    subcategoria: "Celular",
    termos: [
      "vivo",
      "claro",
      "tim",
      "oi",
      "algar",
      "sercomtel",
      "ligga",
      "brisanet",
      "unifique",
      "surf telecom",
      "correios celular",
      "porto seguro celular",
      "nextel",
      "fatura vivo",
      "fatura claro",
      "fatura tim",
      "fatura oi",
      "conta vivo",
      "conta claro",
      "conta tim",
      "conta oi",
      "plano vivo",
      "plano claro",
      "plano tim",
      "plano oi",
      "recarga vivo",
      "recarga claro",
      "recarga tim",
      "recarga oi",
      "pre pago vivo",
      "pré pago vivo",
      "pre pago claro",
      "pré pago claro",
      "pre pago tim",
      "pré pago tim",
      "pre pago oi",
      "pré pago oi",
    ],
  },

  {
    categoria: "Contas da Casa",
    subcategoria: "Internet",
    termos: [
      "vivo fibra",
      "claro fibra",
      "claro net",
      "net claro",
      "tim live",
      "oi fibra",
      "algar fibra",
      "ligga telecom",
      "copel telecom",
      "brisanet internet",
      "unifique internet",
      "desktop internet",
      "vero internet",
      "hughesnet",
      "sky internet",
      "internet vivo",
      "internet claro",
      "internet tim",
      "internet oi",
      "fatura internet",
      "conta internet",
      "plano internet",
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