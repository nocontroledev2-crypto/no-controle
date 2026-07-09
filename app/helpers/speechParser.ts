import { MASTER_CATEGORIES } from "../constants/categories";
import { findCategoryByText } from "../constants/categoryDictionary";
import { matchCategory } from "./categoryMatcher";

const numberWords: Record<string, number> = {
  zero: 0,
  um: 1,
  uma: 1,
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
    .replace(/[^\w\s]/g, " ")
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

  // Exemplo: "120,35" ou "120.35"
  const decimalMatch = raw.match(/\d+[,.]\d{1,2}/);

  if (decimalMatch) {
    return Number(decimalMatch[0].replace(",", "."));
  }

  const text = normalize(rawText);

  // Exemplo: "120 e 35", "120 com 35", "120 reais e 35 centavos"
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

  // Exemplo: "cento e vinte reais e trinta e cinco centavos"
  if (text.includes("centavo")) {
    const partesReais = text.split(/reais|real/);
    const textoReais = partesReais[0] ?? "";
    const textoCentavos = partesReais[1]?.replace(/centavos|centavo/g, "") ?? "";

    const reais = parseNumberWordsText(textoReais);
    const centavos = parseNumberWordsText(textoCentavos);

    if (reais > 0 || centavos > 0) {
      return Number((reais + centavos / 100).toFixed(2));
    }
  }

  // Exemplo com número simples: "120 copel"
  const digit = text.match(/\d+/);

  if (digit) {
    return Number(digit[0]);
  }

  // Heurística para frase sem "reais/centavos":
  // "cento e vinte e trinta e cinco" => 120,35
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

  let day: number | null = null;
  let month: number | null = null;
  let year: number = now.getFullYear();

  const fullMatch = text.match(/(\d{1,2})\s+de\s+([a-zç]+)/);

  if (fullMatch) {
    day = Number(fullMatch[1]);
    const mesTexto = fullMatch[2];

    if (months[mesTexto] !== undefined) {
      month = months[mesTexto];
    }
  }

  const yearMatch = text.match(/\b(20\d{2})\b/);

  if (yearMatch) {
    year = Number(yearMatch[1]);
  }

  if (day === null) {
    const numbers = text.match(/\b\d{1,2}\b/g);

    if (numbers) {
      for (const num of numbers) {
        const n = Number(num);

        if (n > 0 && n <= 31) {
          day = n;
          break;
        }
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
    data: parseDateFromSpeech(text),
    raw: textoFalado,
  };
}