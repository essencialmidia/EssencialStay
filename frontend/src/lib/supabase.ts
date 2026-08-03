import { createClient } from "@supabase/supabase-js";

const configuredSupabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const configuredSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// A home pública deve renderizar mesmo em ambientes locais ainda não configurados.
// Operações reais continuam dependendo das variáveis públicas oficiais.
export const isSupabaseConfigured = Boolean(configuredSupabaseUrl && configuredSupabaseAnonKey);

export function requireSupabaseConfiguration(): void {
  if (!isSupabaseConfigured) {
    throw new Error("A autenticação não está configurada neste ambiente.");
  }
}

const supabaseUrl = configuredSupabaseUrl || "http://127.0.0.1:54321";
const supabaseAnonKey = configuredSupabaseAnonKey || "public-home-local-placeholder";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});
