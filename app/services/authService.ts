import { supabase } from "../lib/supabase";

const authClient = supabase.auth as any;
const dbClient = supabase as any;

export async function signUp(
  email: string,
  password: string,
  nome: string
) {
  return authClient.signUp({
    email,
    password,
    options: {
      data: {
        nome,
      },
    },
  });
}

export async function signIn(
  email: string,
  password: string
) {
  return authClient.signInWithPassword({
    email,
    password,
  });
}

export async function signOut() {
  return authClient.signOut();
}

export async function getCurrentUser() {
  const {
    data: { user },
  } = await authClient.getUser();

  return user;
}

export async function getCurrentSession() {
  const {
    data: { session },
  } = await authClient.getSession();

  return session;
}

export async function getProfile(userId: string) {
  return dbClient
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
}

export async function upsertProfile(params: {
  id: string;
  nome: string;
  email: string;
}) {
  return dbClient
    .from("profiles")
    .upsert({
      id: params.id,
      nome: params.nome,
      email: params.email,
      updated_at: new Date().toISOString(),
    });
}