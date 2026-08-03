import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { requireSupabaseConfiguration, supabase } from "../lib/supabase";

export type AuthCredentials = {
  email: string;
  password: string;
};

export type RegisterCredentials = AuthCredentials & {
  nomeCompleto: string;
};

export type RegistrationResult = {
  user: User;
  session: Session | null;
  requiresEmailConfirmation: boolean;
};

export async function getSession(): Promise<Session | null> {
  requireSupabaseConfiguration();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getAuthenticatedUser(): Promise<User> {
  requireSupabaseConfiguration();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Usuario autenticado nao encontrado.");
  return data.user;
}

export function onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange(callback);
}

export async function signIn({ email, password }: AuthCredentials): Promise<Session> {
  requireSupabaseConfiguration();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.session) throw new Error("Sessão não criada após o login.");
  return data.session;
}

export async function signUp({ email, password, nomeCompleto }: RegisterCredentials): Promise<RegistrationResult> {
  requireSupabaseConfiguration();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nome_completo: nomeCompleto,
      },
    },
  });
  if (error) throw error;
  if (!data.user) throw new Error("Usuário não criado após o cadastro.");
  return {
    user: data.user,
    session: data.session,
    requiresEmailConfirmation: data.session === null,
  };
}

export async function signOut(): Promise<void> {
  requireSupabaseConfiguration();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string): Promise<void> {
  requireSupabaseConfiguration();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login`,
  });
  if (error) throw error;
}
