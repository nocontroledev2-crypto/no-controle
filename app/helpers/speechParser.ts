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
  const wordsToIgnore = ["e", "real", "reais", "centavo", "centavos", "de"];

  const tokens = normalize(text)
    .split(" ")
    .filter((word) => word && !wordsToIgnore.includes(word));

  let total = 0;

  for (const token of tokens) {
    if (numberWords[token] !== undefined) {
      total += numberWords[token];
    }
  }

  return total;
}

function parseValue(rawText: string): number | null {
  const raw = rawText.toLowerCase();

  const decimalMatch = raw.match(/\d+[,.]\d{1,2}/);

  if (decimalMatch) {
    return Number(decimalMatch[0].replace(",", "."));
  }

  const text = normalize(rawText);

  const digitWithCents = text.match(
    /(\d+)\s*(?:reais?|real)?\s*(?:e|com)\s*(\d{1,2})\s*(?:centavos?|centavo)?/
  );

  if (digitWithCents) {
    const reais = Number(digitWithCents[1]);
    const centavos = Number(digitWithCents[2]);

    if (Number.isFinite(reais) && Number.isFinite(centavos)) {
      return Number((reais + centavos / 100).toFixed(2));
    }
  }

  if (text.includes("centavo")) {
    const partesReais = text.split(/reais|real/);
    const textoReais = partesReais[0] ?? "";
    const textoCentavos =
      partesReais[1]?.replace(/centavos|centavo/g, "") ?? "";

    const reais = parseNumberWordsText(textoReais);
    const centavos = parseNumberWordsText(textoCentavos);

    if (reais > 0 || centavos > 0) {
      return Number((reais + centavos / 100).toFixed(2));
    }
  }

  const digit = text.match(/\d+/);

  if (digit) {
    return Number(digit[0]);
  }

  const tokens = text
    .split(" ")
    .filter((word) => numberWords[word] !== undefined);

  if (tokens.length >= 4) {
    const reaisTokens = tokens.slice(0, tokens.length - 2).join(" ");
    const centavosTokens = tokens.slice(tokens.length - 2).join(" ");

    const reais = parseNumberWordsText(reaisTokens);
    const centavos = parseNumberWordsText(centavosTokens);

    if (reais > 0 && centavos > 0 && centavos < 100) {
      return Number((reais + centavos / 100).toFixed(2));
    }
  }

  const total = parseNumberWordsText(text);

  return total > 0 ? total : null;
}

function parseDateFromSpeech(text: string): Date {
  const now = new Date();
  const normalizedText = normalize(text);

  if (normalizedText.includes("hoje")) {
    return now;
  }

  if (normalizedText.includes("ontem")) {
    const ontem = new Date(now);
    ontem.setDate(now.getDate() - 1);
    return ontem;
  }
if (
  normalizedText.includes("anteontem") ||
  normalizedText.includes("antes de ontem")
) {
  const anteontem = new Date(now);
  anteontem.setDate(now.getDate() - 2);
  return anteontem;
}
  if (
    normalizedText.includes("amanha") ||
    normalizedText.includes("amanhã")
  ) {
    const amanha = new Date(now);
    amanha.setDate(now.getDate() + 1);
    return amanha;
  }
if (
  normalizedText.includes("depois de amanha") ||
  normalizedText.includes("depois de amanhã")
) {
  const depoisDeAmanha = new Date(now);
  depoisDeAmanha.setDate(now.getDate() + 2);
  return depoisDeAmanha;
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