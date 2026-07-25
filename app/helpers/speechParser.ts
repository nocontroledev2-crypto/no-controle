import { MASTER_CATEGORIES } from "../constants/categories";
import { findCategoryByText } from "../constants/categoryDictionary";
import { matchCategory } from "./categoryMatcher";

const numberWords: Record<string, number> = {
  zero: 0,
  um: 1,
  uma: 1,
  primeiro: 1,
  primeira: 1,
  dois: 2,
  duas: 2,
  tres: 3,
  três: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  sete: 7,
  oito: 8,
  nove: 9,
  dez: 10,
  onze: 11,
  doze: 12,
  treze: 13,
  quatorze: 14,
  catorze: 14,
  quinze: 15,
  dezesseis: 16,
  dezessete: 17,
  dezoito: 18,
  dezenove: 19,
  vinte: 20,
  trinta: 30,
  quarenta: 40,
  cinquenta: 50,
  sessenta: 60,
  setenta: 70,
  oitenta: 80,
  noventa: 90,
  cem: 100,
  cento: 100,
  duzentos: 200,
  trezentos: 300,
  quatrocentos: 400,
  quinhentos: 500,
  seiscentos: 600,
  setecentos: 700,
  oitocentos: 800,
  novecentos: 900,
  mil: 1000,
  milhar: 1000,
  milhao: 1000000,
  milhão: 1000000,
  milhoes: 1000000,
  milhões: 1000000,
};

const months: Record<string, number> = {
  janeiro: 0,
  fevereiro: 1,
  marco: 2,
  março: 2,
  abril: 3,
  maio: 4,
  junho: 5,
  julho: 6,
  agosto: 7,
  setembro: 8,
  outubro: 9,
  novembro: 10,
  dezembro: 11,
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s/,.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNumberWordsText(text: string): number {
  const wordsToIgnore = [
    "e",
    "real",
    "reais",
    "centavo",
    "centavos",
    "de",
    "do",
    "da",
    "dos",
    "das",
    "no",
    "na",
    "em",
    "por",
  ];

  const tokens = normalize(text)
    .split(" ")
    .filter((word) => word && !wordsToIgnore.includes(word));

  let total = 0;
  let current = 0;

  for (const token of tokens) {
    const isMilhao =
      token === "milhao" ||
      token === "milhão" ||
      token === "milhoes" ||
      token === "milhões";

    const isMil =
      token === "mil" ||
      token === "milhar";

    if (isMilhao) {
      total += (current || 1) * 1000000;
      current = 0;
      continue;
    }

    if (isMil) {
      total += (current || 1) * 1000;
      current = 0;
      continue;
    }

    if (numberWords[token] !== undefined) {
      current += numberWords[token];
    }
  }

  return total + current;
}


function removerReferenciasTemporais(text: string): string {
  return text
    .replace(
      /(?:ha|há|a|faz|fez|fas|fes|fáz|fês|fêz)\s+(\d+|[a-z\s]+?)\s+dias?/g,
      " "
    )
    .replace(
      /(\d+|[a-z\s]+?)\s+dias?\s+(?:atras|atrás|atraz|atráz|tras|trás)/g,
      " "
    )
    .replace(
      /(?:daqui|em)\s+(?:a\s+)?(\d+|[a-z\s]+?)\s+dias?/g,
      " "
    )
    .replace(
      /(?:ha|há|a|faz|fez|fas|fes|fáz|fês|fêz)\s+(\d+|[a-z\s]+?)\s+semanas?/g,
      " "
    )
    .replace(
      /(\d+|[a-z\s]+?)\s+semanas?\s+(?:atras|atrás|atraz|atráz|tras|trás)/g,
      " "
    )
    .replace(
      /(?:daqui|em)\s+(?:a\s+)?(\d+|[a-z\s]+?)\s+semanas?/g,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}

function parseValue(rawText: string): number | null {
  const raw = rawText.toLowerCase();

/*
  Valores digitados em formato brasileiro:
  - "1.254,78" -> 1254.78
  - "12.345,67" -> 12345.67
*/
const brDecimalWithThousandsMatch = raw.match(
  /\b\d{1,3}(?:\.\d{3})+,\d{1,2}\b/
);

if (brDecimalWithThousandsMatch) {
  return Number(
    brDecimalWithThousandsMatch[0]
      .replace(/\./g, "")
      .replace(",", ".")
  );
}

/*
  Valores digitados em formato brasileiro sem milhar:
  - "1254,78" -> 1254.78
*/
const brDecimalMatch = raw.match(/\b\d+,\d{1,2}\b/);

if (brDecimalMatch) {
  return Number(brDecimalMatch[0].replace(",", "."));
}

/*
  Valores digitados em formato internacional:
  - "1254.78" -> 1254.78
*/
const dotDecimalMatch = raw.match(/\b\d+\.\d{1,2}\b/);

if (dotDecimalMatch) {
  return Number(dotDecimalMatch[0]);
}

/*
  Valor inteiro com separador de milhar:
  - "1.254" -> 1254
*/
const brIntegerWithThousandsMatch = raw.match(
  /\b\d{1,3}(?:\.\d{3})+\b/
);

if (brIntegerWithThousandsMatch) {
  return Number(
    brIntegerWithThousandsMatch[0].replace(/\./g, "")
  );
}

const text = normalize(rawText);
const textSemTempo = removerReferenciasTemporais(text);

const digitWithCents = textSemTempo.match(
  /(\d+)\s*(?:reais?|real|brl)?\s*(?:e|com)\s*(\d{1,2})\s*(?:centavos?|centavo)?/
);

if (digitWithCents) {
  const reais = Number(digitWithCents[1]);
  const centavos = Number(digitWithCents[2]);

  if (Number.isFinite(reais) && Number.isFinite(centavos)) {
    return Number((reais + centavos / 100).toFixed(2));
  }
}

if (textSemTempo.includes("centavo")) {
  const partesReais = textSemTempo.split(/reais|real/);
  const textoReais = partesReais[0] ?? "";
  const textoCentavos =
    partesReais[1]?.replace(/centavos|centavo/g, "") ?? "";

  const reais = parseNumberWordsText(textoReais);
  const centavos = parseNumberWordsText(textoCentavos);

  if (reais > 0 || centavos > 0) {
    return Number((reais + centavos / 100).toFixed(2));
  }
}

const brlWithCents = textSemTempo.match(
  /(\d+)\s*brl\s*e\s*(\d{1,2})/
);

if (brlWithCents) {
  const reais = Number(brlWithCents[1]);
  const centavos = Number(brlWithCents[2]);

  return Number(
    (reais + centavos / 100).toFixed(2)
  );
}

const allDigits = [...textSemTempo.matchAll(/\d+/g)];

if (allDigits.length > 0) {
  return Number(
    allDigits[allDigits.length - 1][0]
  );
}

const verbosFinanceiros = [
  "gastei",
  "gasto",
  "paguei",
  "pago",
  "pagarei",
  "pagar",
  "custou",
  "custa",
  "deu",
  "saiu",
  "desembolsei",
  "valor",
];

for (const verbo of verbosFinanceiros) {
  const index = textSemTempo.indexOf(verbo);

  if (index >= 0) {
    const trechoDepoisDoVerbo = textSemTempo.slice(
      index + verbo.length
    );

    const valorPorExtenso = parseNumberWordsText(
      trechoDepoisDoVerbo
    );

    if (valorPorExtenso > 0) {
      return valorPorExtenso;
    }
  }
}

const valorDepoisDePor = textSemTempo.match(
  /\bpor\s+([a-z\s]+)/
);

if (valorDepoisDePor) {
  const valorPorExtenso = parseNumberWordsText(
    valorDepoisDePor[1]
  );

  if (valorPorExtenso > 0) {
    return valorPorExtenso;
  }
}

const total = parseNumberWordsText(textSemTempo);

return total > 0 ? total : null;
}

function parseDateFromSpeech(text: string): Date {
  const now = new Date();
  const normalizedText = normalize(text);

  if (normalizedText.includes("hoje")) {
    return now;
  }

  if (
    normalizedText.includes("anteontem") ||
    normalizedText.includes("antes de ontem") ||
    normalizedText.includes("antesontem")
  ) {
    const anteontem = new Date(now);
    anteontem.setDate(now.getDate() - 2);
    return anteontem;
  }

  if (normalizedText.includes("ontem")) {
    const ontem = new Date(now);
    ontem.setDate(now.getDate() - 1);
    return ontem;
  }

const haDiasNumeroMatch = normalizedText.match(
  /(?:ha|a|faz|fez|fas|fes)\s+(\d+)\s+dias?/
);

if (haDiasNumeroMatch) {
  const dias = Number(haDiasNumeroMatch[1]);

  if (!isNaN(dias)) {
    const data = new Date(now);

    data.setDate(now.getDate() - dias);

    return data;
  }
}

const haDiasTextoMatch = normalizedText.match(
  /(?:ha|a|faz|fez|fas|fes)\s+([a-z\s]+?)\s+dias?/
);

if (haDiasTextoMatch) {
  const dias = parseNumberWordsText(
    haDiasTextoMatch[1]
  );

  if (dias > 0) {
    const data = new Date(now);

    data.setDate(now.getDate() - dias);

    return data;
  }
}

const diasAtrasNumeroMatch = normalizedText.match(
  /(\d+)\s+dias?\s+(?:atras|atraz|tras)/
);

if (diasAtrasNumeroMatch) {
  const dias = Number(diasAtrasNumeroMatch[1]);

  if (!isNaN(dias)) {
    const data = new Date(now);

    data.setDate(now.getDate() - dias);

    return data;
  }
}

const diasAtrasTextoMatch = normalizedText.match(
  /([a-z\s]+?)\s+dias?\s+(?:atras|atraz|tras)/
);

if (diasAtrasTextoMatch) {
  const dias = parseNumberWordsText(
    diasAtrasTextoMatch[1]
  );

  if (dias > 0) {
    const data = new Date(now);

    data.setDate(now.getDate() - dias);

    return data;
  }
}

const haSemanasNumeroMatch = normalizedText.match(
  /(?:ha|a|faz|fez|fas|fes)\s+(\d+)\s+semanas?/
);

if (haSemanasNumeroMatch) {
  const semanas = Number(haSemanasNumeroMatch[1]);

  if (!isNaN(semanas)) {
    const data = new Date(now);

    data.setDate(now.getDate() - semanas * 7);

    return data;
  }
}

const haSemanasTextoMatch = normalizedText.match(
  /(?:ha|a|faz|fez|fas|fes)\s+([a-z\s]+?)\s+semanas?/
);

if (haSemanasTextoMatch) {
  const semanas = parseNumberWordsText(
    haSemanasTextoMatch[1]
  );

  if (semanas > 0) {
    const data = new Date(now);

    data.setDate(now.getDate() - semanas * 7);

    return data;
  }
}

const semanasAtrasNumeroMatch = normalizedText.match(
  /(\d+)\s+semanas?\s+(?:atras|atraz|tras)/
);

if (semanasAtrasNumeroMatch) {
  const semanas = Number(semanasAtrasNumeroMatch[1]);

  if (!isNaN(semanas)) {
    const data = new Date(now);

    data.setDate(now.getDate() - semanas * 7);

    return data;
  }
}

const semanasAtrasTextoMatch = normalizedText.match(
  /([a-z\s]+?)\s+semanas?\s+(?:atras|atraz|tras)/
);

if (semanasAtrasTextoMatch) {
  const semanas = parseNumberWordsText(
    semanasAtrasTextoMatch[1]
  );

  if (semanas > 0) {
    const data = new Date(now);

    data.setDate(now.getDate() - semanas * 7);

    return data;
  }
}

  if (
    normalizedText.includes("depois de amanha") ||
    normalizedText.includes("depois de amanhã")
  ) {
    const depoisDeAmanha = new Date(now);
    depoisDeAmanha.setDate(now.getDate() + 2);
    return depoisDeAmanha;
  }

  if (
    normalizedText.includes("amanha") ||
    normalizedText.includes("amanhã")
  ) {
    const amanha = new Date(now);
    amanha.setDate(now.getDate() + 1);
    return amanha;
  }

 const emDiasNumeroMatch = normalizedText.match(
  /em\s+(\d+)\s+dias?/
);

if (emDiasNumeroMatch) {
  const dias = Number(emDiasNumeroMatch[1]);

  if (!isNaN(dias)) {
    const data = new Date(now);

    data.setDate(now.getDate() + dias);

    return data;
  }
}

const emDiasTextoMatch = normalizedText.match(
  /em\s+([a-z\s]+?)\s+dias?/
);

if (emDiasTextoMatch) {
  const dias = parseNumberWordsText(
    emDiasTextoMatch[1]
  );

  if (dias > 0) {
    const data = new Date(now);

    data.setDate(now.getDate() + dias);

    return data;
  }
}

const emSemanasNumeroMatch = normalizedText.match(
  /em\s+(\d+)\s+semanas?/
);

if (emSemanasNumeroMatch) {
  const semanas = Number(emSemanasNumeroMatch[1]);

  if (!isNaN(semanas)) {
    const data = new Date(now);

    data.setDate(now.getDate() + semanas * 7);

    return data;
  }
}

const emSemanasTextoMatch = normalizedText.match(
  /em\s+([a-z\s]+?)\s+semanas?/
);

if (emSemanasTextoMatch) {
  const semanas = parseNumberWordsText(
    emSemanasTextoMatch[1]
  );

  if (semanas > 0) {
    const data = new Date(now);

    data.setDate(now.getDate() + semanas * 7);

    return data;
  }
}

const daquiDiasMatch = normalizedText.match(
  /daqui\s+(\d+)\s+dias?/
);

if (daquiDiasMatch) {
  const dias = Number(daquiDiasMatch[1]);

  if (!isNaN(dias)) {
    const data = new Date(now);
    data.setDate(now.getDate() + dias);

    return data;
  }
}

const daquiNumeroMatch = normalizedText.match(
  /daqui\s+(?:a\s+)?(\d+)\s+dias?/
);

if (daquiNumeroMatch) {
  const dias = Number(daquiNumeroMatch[1]);

  if (!isNaN(dias)) {
    const data = new Date(now);

    data.setDate(now.getDate() + dias);

    return data;
  }
}

const daquiTextoMatch = normalizedText.match(
  /daqui\s+(?:a\s+)?([a-z\s]+?)\s+dias?/
);

const daquiSemanasNumeroMatch = normalizedText.match(
  /daqui\s+(?:a\s+)?(\d+)\s+semanas?/
);

if (daquiSemanasNumeroMatch) {
  const semanas = Number(daquiSemanasNumeroMatch[1]);

  if (!isNaN(semanas)) {
    const data = new Date(now);

    data.setDate(now.getDate() + semanas * 7);

    return data;
  }
}

const daquiSemanasTextoMatch = normalizedText.match(
  /daqui\s+(?:a\s+)?([a-z\s]+?)\s+semanas?/
);

if (daquiSemanasTextoMatch) {
  const semanas = parseNumberWordsText(
    daquiSemanasTextoMatch[1]
  );

  if (semanas > 0) {
    const data = new Date(now);

    data.setDate(now.getDate() + semanas * 7);

    return data;
  }
}

if (daquiTextoMatch) {
  const dias = parseNumberWordsText(
    daquiTextoMatch[1]
  );

  if (dias > 0) {
    const data = new Date(now);

    data.setDate(now.getDate() + dias);

    return data;
  }
}

if (
  normalizedText.includes("semana retrasada")
) {
  const data = new Date(now);

  data.setDate(now.getDate() - 14);

  return data;
}
if (normalizedText.includes("semana passada")) {
  const data = new Date(now);
  data.setDate(now.getDate() - 7);
  return data;
}

if (
  normalizedText.includes("semana que vem")
) {
  const data = new Date(now);
  data.setDate(now.getDate() + 7);
  return data;
}
if (
  normalizedText.includes("mes passado") ||
  normalizedText.includes("mês passado")
) {
  const data = new Date(now);
  data.setMonth(now.getMonth() - 1);
  return data;
}

if (
  normalizedText.includes("mes que vem") ||
  normalizedText.includes("mês que vem")
) {
  const data = new Date(now);
  data.setMonth(now.getMonth() + 1);
  return data;
}
const proximosDiasSemana = [
  { termo: "proxima segunda", dia: 1 },
  { termo: "próxima segunda", dia: 1 },

  { termo: "proxima terca", dia: 2 },
  { termo: "próxima terça", dia: 2 },

  { termo: "proxima quarta", dia: 3 },
  { termo: "próxima quarta", dia: 3 },

  { termo: "proxima quinta", dia: 4 },
  { termo: "próxima quinta", dia: 4 },

  { termo: "proxima sexta", dia: 5 },
  { termo: "próxima sexta", dia: 5 },

  { termo: "proximo sabado", dia: 6 },
  { termo: "próximo sábado", dia: 6 },

  { termo: "proximo domingo", dia: 0 },
  { termo: "próximo domingo", dia: 0 },
];

for (const item of proximosDiasSemana) {
  if (normalizedText.includes(item.termo)) {
    const data = new Date(now);

    let diasAAdicionar =
      (item.dia - now.getDay() + 7) % 7;

    if (diasAAdicionar === 0) {
      diasAAdicionar = 7;
    }

    data.setDate(
      now.getDate() + diasAAdicionar
    );

    return data;
  }
}
 

const diasSemana = [
  {
    dia: 1,
    termos: ["segunda feira", "segunda-feira", "segunda"],
  },
  {
    dia: 2,
    termos: ["terca feira", "terça feira", "terça-feira", "terca-feira", "terca", "terça"],
  },
  {
    dia: 3,
    termos: ["quarta feira", "quarta-feira", "quarta"],
  },
  {
    dia: 4,
    termos: ["quinta feira", "quinta-feira", "quinta"],
  },
  {
    dia: 5,
    termos: ["sexta feira", "sexta-feira", "sexta"],
  },
  {
    dia: 6,
    termos: ["sabado", "sábado"],
  },
  {
    dia: 0,
    termos: ["domingo"],
  },
];

const palavrasDeFuturo = [
  "vou",
  "irei",
  "irei pagar",
  "vou pagar",
  "vou gastar",
  "vou comprar",
  "pagarei",
  "gastarei",
  "comprarei",
  "precisarei pagar",
  "vou precisar pagar",
];

function contemTermoDeDiaSemana(termo: string) {
  const termoNormalizado = normalize(termo);

  const regex = new RegExp(
    `(^|\\s)${termoNormalizado}(\\s|$)`
  );

  return regex.test(normalizedText);
}

function deveIgnorarDiaSemana(termo: string) {
  const termoNormalizado = normalize(termo);

  const falsosContextos = [
    `${termoNormalizado} parcela`,
    `${termoNormalizado} prestacao`,
    `${termoNormalizado} prestação`,
    `${termoNormalizado} via`,
    `${termoNormalizado} vez`,
  ];

  return falsosContextos.some((contexto) =>
    normalizedText.includes(contexto)
  );
}

const fraseIndicaFuturo = palavrasDeFuturo.some((palavra) =>
  normalizedText.includes(normalize(palavra))
);

for (const item of diasSemana) {
  const encontrouDiaSemana = item.termos.some((termo) => {
    return (
      contemTermoDeDiaSemana(termo) &&
      !deveIgnorarDiaSemana(termo)
    );
  });

  if (encontrouDiaSemana) {
    const data = new Date(now);

    if (fraseIndicaFuturo) {
      let diasAAdicionar =
        (item.dia - now.getDay() + 7) % 7;

      if (diasAAdicionar === 0) {
        diasAAdicionar = 7;
      }

      data.setDate(now.getDate() + diasAAdicionar);

      return data;
    }

    const diasASubtrair =
      (now.getDay() - item.dia + 7) % 7;

    data.setDate(now.getDate() - diasASubtrair);

    return data;
  }
}

  let day: number | null = null;
  let month: number | null = null;
  let year: number = now.getFullYear();

  const dateSlashMatch = normalizedText.match(
    /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/
  );

  if (dateSlashMatch) {
    day = Number(dateSlashMatch[1]);
    month = Number(dateSlashMatch[2]) - 1;

    if (dateSlashMatch[3]) {
      const parsedYear = Number(dateSlashMatch[3]);
      year = parsedYear < 100 ? 2000 + parsedYear : parsedYear;
    }

    return new Date(year, month, day);
  }

  const yearMatch = normalizedText.match(/\b(20\d{2})\b/);

  if (yearMatch) {
    year = Number(yearMatch[1]);
  }

  const monthNames = Object.keys(months);

  for (const monthName of monthNames) {
    const normalizedMonthName = normalize(monthName);

    if (normalizedText.includes(normalizedMonthName)) {
      month = months[monthName];
      break;
    }
  }

  if (month !== null) {
    const selectedMonthName =
      monthNames.find((monthName) => months[monthName] === month) ?? "";

    const normalizedMonthName = normalize(selectedMonthName);

    const numericDayWithMonth = normalizedText.match(
      new RegExp(`\\b(\\d{1,2})\\s+de\\s+${normalizedMonthName}\\b`)
    );

    if (numericDayWithMonth) {
      const parsedDay = Number(numericDayWithMonth[1]);

      if (parsedDay > 0 && parsedDay <= 31) {
        day = parsedDay;
      }
    }

    if (day === null) {
      const wordDayWithMonth = normalizedText.match(
        new RegExp(
          `\\bdia\\s+([a-z\\s]+?)\\s+de\\s+${normalizedMonthName}\\b`
        )
      );

      if (wordDayWithMonth) {
        const parsedDay = parseNumberWordsText(wordDayWithMonth[1]);

        if (parsedDay > 0 && parsedDay <= 31) {
          day = parsedDay;
        }
      }
    }

    if (day === null) {
      const beforeMonth = normalizedText.split(normalizedMonthName)[0];

      const wordsBeforeMonth = beforeMonth
        .replace(/\bdia\b/g, "")
        .replace(/\bde\b/g, "")
        .trim()
        .split(" ")
        .filter((word) => numberWords[word] !== undefined);

      const lastPossibleDayWords = wordsBeforeMonth.slice(-3).join(" ");
      const parsedDay = parseNumberWordsText(lastPossibleDayWords);

      if (parsedDay > 0 && parsedDay <= 31) {
        day = parsedDay;
      }
    }
  }

  if (day === null) {
    const numericDayMatch = normalizedText.match(/\bdia\s+(\d{1,2})\b/);

    if (numericDayMatch) {
      const parsedDay = Number(numericDayMatch[1]);

      if (parsedDay > 0 && parsedDay <= 31) {
        day = parsedDay;
      }
    }
  }

  if (day === null) {
    const wordDayMatch = normalizedText.match(
      /\bdia\s+([a-z\s]+?)(?:\s+de|\s*$)/
    );

    if (wordDayMatch) {
      const parsedDay = parseNumberWordsText(wordDayMatch[1]);

      if (parsedDay > 0 && parsedDay <= 31) {
        day = parsedDay;
      }
    }
  }

  return new Date(
    year,
    month !== null ? month : now.getMonth(),
    day !== null ? day : now.getDate()
  );
}

function matchMasterCategory(text: string): string {
  const foundMasterCategory = MASTER_CATEGORIES.find((category) =>
    text.includes(normalize(category))
  );

  if (foundMasterCategory) {
    return foundMasterCategory;
  }

  return matchCategory(text);
}

export function parseSpeech(textoFalado: string) {
  const text = normalize(textoFalado);

  const dictionaryMatch = findCategoryByText(textoFalado);

  return {
    valor: parseValue(textoFalado),
    categoria: dictionaryMatch
      ? dictionaryMatch.categoria
      : matchMasterCategory(text),
    subcategoria: dictionaryMatch ? dictionaryMatch.subcategoria : "",
    termoEncontrado: dictionaryMatch ? dictionaryMatch.termoEncontrado : "",
    data: parseDateFromSpeech(textoFalado),
    raw: textoFalado,
  };
}