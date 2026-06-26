import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@no-controle:expenses";

export type Expense = {
  id: string;
  valor: number;
  categoria: string;
  data: string;
  createdAt: string;
};

/**
 * Busca todas as despesas salvas
 */
export async function getAllExpenses(): Promise<Expense[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

/**
 * Salva uma nova despesa
 */
export async function saveExpense(expense: Expense): Promise<void> {
  const expenses = await getAllExpenses();
  expenses.push(expense);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

/**
 * Atualiza uma despesa existente pelo ID
 */
export async function updateExpense(updatedExpense: Expense): Promise<void> {
  const expenses = await getAllExpenses();

  const updatedExpenses = expenses.map((expense) =>
    expense.id === updatedExpense.id ? updatedExpense : expense
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