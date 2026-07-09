import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@no-controle:expenses";

export type Expense = {
  id: string;
  valor: number;
  categoria: string;
  subcategoria?: string;
  termoEncontrado?: string;
  data: string;
  createdAt: string;
};

/**
 * Normaliza uma despesa garantindo que o valor seja sempre numérico e válido
 */
function normalizeExpense(expense: Expense): Expense {
  const safeValue = Number(expense.valor);

  if (!Number.isFinite(safeValue) || safeValue <= 0) {
    throw new Error("Valor inválido para despesa.");
  }

  return {
    ...expense,
    valor: Number(safeValue.toFixed(2)),
  };
}

/**
 * Busca todas as despesas salvas
 */
export async function getAllExpenses(): Promise<Expense[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    const expenses = json ? JSON.parse(json) : [];

    if (!Array.isArray(expenses)) {
      return [];
    }

    return expenses.map((expense: any) => {
      const safeValue = Number(expense.valor);

      return {
  ...expense,
  valor: Number.isFinite(safeValue) ? safeValue : 0,
  subcategoria: expense.subcategoria ?? "",
  termoEncontrado: expense.termoEncontrado ?? "",
};
    });
  } catch {
    return [];
  }
}

/**
 * Salva uma nova despesa
 */
export async function saveExpense(expense: Expense): Promise<void> {
  const normalizedExpense = normalizeExpense(expense);

  const expenses = await getAllExpenses();
  expenses.push(normalizedExpense);

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

/**
 * Atualiza uma despesa existente pelo ID
 */
export async function updateExpense(updatedExpense: Expense): Promise<void> {
  const normalizedExpense = normalizeExpense(updatedExpense);

  const expenses = await getAllExpenses();

  const updatedExpenses = expenses.map((expense) =>
    expense.id === normalizedExpense.id ? normalizedExpense : expense
  );

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedExpenses));
}

/**
 * Exclui uma despesa pelo ID
 */
export async function deleteExpense(id: string): Promise<void> {
  const expenses = await getAllExpenses();

  const updatedExpenses = expenses.filter((expense) => expense.id !== id);

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedExpenses));
}

/**
 * Limpa todas as despesas (apenas para debug/desenvolvimento)
 */
export async function clearExpenses(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}