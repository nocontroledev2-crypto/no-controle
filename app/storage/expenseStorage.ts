import {
  normalizePaymentMethod,
  type PaymentMethod,
} from "../constants/paymentMethods";
import { supabase } from "../lib/supabase";
import { getCurrentUser } from "../services/authService";

export type Expense = {
  id: string;
  valor: number;
  categoria: string;
  subcategoria?: string;
  termoEncontrado?: string;
  paymentMethod?: PaymentMethod | null;
  clientRequestId?: string | null;
  data: string;
  createdAt: string;
};

const dbClient = supabase as any;

function normalizeExpense(expense: Expense): Expense {
  const safeValue = Number(expense.valor);

  if (!Number.isFinite(safeValue) || safeValue <= 0) {
    throw new Error("Valor inválido para despesa.");
  }

  return {
    ...expense,
    valor: Number(safeValue.toFixed(2)),
    subcategoria: expense.subcategoria ?? "",
    termoEncontrado: expense.termoEncontrado ?? "",
    paymentMethod: normalizePaymentMethod(
      expense.paymentMethod
    ),
  };
}

function mapFromSupabase(row: any): Expense {
  return {
    id: row.id,
    valor: Number(row.valor || 0),
    categoria: row.categoria || "",
    subcategoria: row.subcategoria || "",
    termoEncontrado: row.termo_encontrado || "",
    paymentMethod: normalizePaymentMethod(
      row.payment_method
    ),
    clientRequestId:
      row.client_request_id ?? null,
    data: row.data,
    createdAt: row.created_at,
  };
}

function isIdempotencyConflict(error: any) {
  if (error?.code !== "23505") {
    return false;
  }

  const errorText = [
    error?.message,
    error?.details,
    error?.hint,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    errorText.includes(
      "expenses_user_client_request_id_uidx"
    ) ||
    errorText.includes("client_request_id")
  );
}

async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Entre na sua conta para salvar e acessar seus registros.");
  }

  return user;
}

export async function getAllExpenses(): Promise<Expense[]> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return [];
    }

    const { data, error } = await dbClient
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return [];
    }

    if (!Array.isArray(data)) {
      return [];
    }

    return data.map(mapFromSupabase);
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function saveExpense(expense: Expense): Promise<void> {
  const user = await requireUser();
  const normalizedExpense = normalizeExpense(expense);

  const { error } = await dbClient
    .from("expenses")
    .insert({
      user_id: user.id,
      valor: normalizedExpense.valor,
      categoria: normalizedExpense.categoria,
      subcategoria: normalizedExpense.subcategoria ?? "",
      termo_encontrado: normalizedExpense.termoEncontrado ?? "",
      payment_method:
        normalizedExpense.paymentMethod ?? null,
      client_request_id:
        normalizedExpense.clientRequestId ?? null,
      data: normalizedExpense.data,
      created_at: normalizedExpense.createdAt,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    if (isIdempotencyConflict(error)) {
      return;
    }

    console.error(error);
    throw new Error(
      "Não foi possível salvar a despesa na nuvem."
    );
  }
}

export async function updateExpense(updatedExpense: Expense): Promise<void> {
  await requireUser();

  const normalizedExpense = normalizeExpense(updatedExpense);

  const { error } = await dbClient
    .from("expenses")
    .update({
      valor: normalizedExpense.valor,
      categoria: normalizedExpense.categoria,
      subcategoria: normalizedExpense.subcategoria ?? "",
      termo_encontrado: normalizedExpense.termoEncontrado ?? "",
      payment_method:
        normalizedExpense.paymentMethod ?? null,
      data: normalizedExpense.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", normalizedExpense.id);

  if (error) {
    console.error(error);
    throw new Error("Não foi possível atualizar a despesa.");
  }
}

export async function deleteExpense(id: string): Promise<void> {
  await requireUser();

  const { error } = await dbClient
    .from("expenses")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    throw new Error("Não foi possível excluir a despesa.");
  }
}

export async function clearExpenses(): Promise<void> {
  const user = await requireUser();

  const { error } = await dbClient
    .from("expenses")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    throw new Error("Não foi possível limpar as despesas.");
  }
}