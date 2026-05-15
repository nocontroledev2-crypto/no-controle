export function matchCategory(text: string): string {
  const t = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  /* 🚗 TRANSPORTE */
  if (
    t.includes("gasolina") ||
    t.includes("etanol") ||
    t.includes("diesel") ||
    t.includes("combustivel") ||
    t.includes("posto") ||
    t.includes("uber") ||
    t.includes("99") ||
    t.includes("taxi") ||
    t.includes("gas") ||
    t.includes("combus")
  ) {
    return "Transporte";
  }

  /* 🛒 ALIMENTAÇÃO */
  if (
    t.includes("mercado") ||
    t.includes("supermercado") ||
    t.includes("padaria") ||
    t.includes("acougue") ||
    t.includes("restaurante") ||
    t.includes("almoco") ||
    t.includes("jantar") ||
    t.includes("lanche") ||
    t.includes("comida") ||
    t.includes("rango") ||
    t.includes("marmita") ||
    t.includes("ifood") ||
    t.includes("delivery") ||
    t.includes("cafe") ||
    t.includes("refeicao")
  ) {
    return "Alimentação";
  }

  /* 🏠 MORADIA */
  if (
    t.includes("aluguel") ||
    t.includes("condominio")
  ) {
    return "Moradia";
  }

  /* 💡 CONTAS */
  if (
    t.includes("energia") ||
    t.includes("luz") ||
    t.includes("agua") ||
    t.includes("internet") ||
    t.includes("telefone") ||
    t.includes("celular") ||
    t.includes("wifi") ||
    t.includes("gás") ||
    t.includes("gas de cozinha") ||
    t.includes("botijao")
  ) {
    return "Contas";
  }

  /* 📺 ASSINATURAS */
  if (
    t.includes("netflix") ||
    t.includes("spotify") ||
    t.includes("amazon") ||
    t.includes("prime") ||
    t.includes("google") ||
    t.includes("alexa") ||
    t.includes("chatgpt") ||
    t.includes("openai") ||
    t.includes("copilot") ||
    t.includes("streaming") ||
    t.includes("assinatura")
  ) {
    return "Assinaturas";
  }

  /* 💊 SAÚDE */
  if (
    t.includes("farmacia") ||
    t.includes("remedio") ||
    t.includes("consulta") ||
    t.includes("exame")
  ) {
    return "Saúde";
  }

  /* 🛠️ SERVIÇOS */
  if (
    t.includes("manutencao") ||
    t.includes("conserto") ||
    t.includes("reparo") ||
    t.includes("oficina")
  ) {
    return "Serviços";
  }

  /* 💳 CARTÃO */
  if (
    t.includes("cartao") ||
    t.includes("credito") ||
    t.includes("fatura")
  ) {
    return "Cartão de crédito";
  }

  return "Outros";
}