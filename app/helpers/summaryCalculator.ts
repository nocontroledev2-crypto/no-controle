import { Expense } from "../storage/expenseStorage";

/**
 * Calcula métricas do resumo
 */
export function calculateSummary(expenses: Expense[]) {
  if (!expenses.length) {
    return {
      total: 0,
      mediaDiaria: 0,
      registros: 0,
      topCategorias: [],
    };
  }

  const total = expenses.reduce((sum, e) => sum + e.valor, 0);

  // Dias únicos com lançamento
  const diasComLancamento = new Set(
    expenses.map((e) => e.data)
  ).size;

  const mediaDiaria =
    diasComLancamento > 0 ? total / diasComLancamento : 0;

  // Agrupar por categoria
  const categoriaMap: Record<string, number> = {};
  for (const e of expenses) {
    categoriaMap[e.categoria] =
      (categoriaMap[e.categoria] || 0) + e.valor;
  }

  const topCategorias = Object.entries(categoriaMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([categoria, valor]) => ({
      categoria,
      valor,
    }));

  return {
    total,
    mediaDiaria,
    registros: expenses.length,
    topCategorias,
  };
}