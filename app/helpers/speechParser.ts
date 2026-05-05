import { matchCategory } from "./categoryMatcher";

/**
 * Converte números por extenso (pt-BR) até 999
 */
const numberWords: Record<string, number> = {
  zero: 0,
  um: 1,
  uma: 1,
  dois: 2,
  duas: 2,
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
  dezassete: 17,
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

/**
 * Tenta extrair um valor numérico da frase
 */
function parseValueFromText(text: string): number | null {
  // 1️⃣ Primeiro tenta números digitados
  const digitMatch = text.match(/\d+([.,]\d+)?/);
  if (digitMatch) {
    return Number(digitMatch[0].replace(",", "."));
  }

  // 2️⃣ Depois tenta por extenso
  const tokens = text.split(" ");
  let total = 0;

  tokens.forEach((t) => {
    if (numberWords[t] !== undefined) {
      total += numberWords[t];
    }
  });

  return total > 0 ? total : null;
}

/**
 * Parser principal de fala
 */
export function parseSpeech(textoFalado: string) {
  const normalized = textoFalado
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/(reais|real|com|no|na|de|do|da|por)/g, "")
    .trim();

  const valor = parseValueFromText(normalized);
  const categoria = matchCategory(normalized);

  return {
    valor,
    categoria,
    raw: textoFalado,
  };
}