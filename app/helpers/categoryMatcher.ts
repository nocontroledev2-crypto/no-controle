export function matchCategory(text: string): string {
  const t = text.toLowerCase();

  // 🚗 TRANSPORTE (alta prioridade)
  if (
    t.includes("gasolina") ||
    t.includes("etanol") ||
    t.includes("alcool") ||
    t.includes("diesel") ||
    t.includes("posto") ||
    t.includes("combustivel")
  ) {
    return "Transporte";
  }

  // 🛒 ALIMENTAÇÃO
  if (
    t.includes("mercado") ||
    t.includes("supermercado") ||
    t.includes("padaria") ||
    t.includes("comida") ||
    t.includes("almoco") ||
    t.includes("jantar")
  ) {
    return "Alimentação";
  }

  // 🛠️ SERVIÇOS / MANUTENÇÃO
  if (
    t.includes("manutencao") ||
    t.includes("conserto") ||
    t.includes("servico") ||
    t.includes("mecanico")
  ) {
    return "Serviços";
  }

  // 🏠 MORADIA
  if (
    t.includes("aluguel") ||
    t.includes("condominio") ||
    t.includes("energia") ||
    t.includes("luz") ||
    t.includes("agua")
  ) {
    return "Moradia";
  }

  // 💊 SAÚDE
  if (
    t.includes("farmacia") ||
    t.includes("remedio") ||
    t.includes("consulta")
  ) {
    return "Saúde";
  }

  // 💳 CARTÃO
  if (
    t.includes("cartao") ||
    t.includes("fatura") ||
    t.includes("credito")
  ) {
    return "Cartão de crédito";
  }

  // 🔚 FALLBACK
  return "Outros";
}