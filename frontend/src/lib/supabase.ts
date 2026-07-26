import { createClient } from "@supabase/supabase-js";

function requireEnvironmentVariable(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name]?.trim();
  if (!value) {
    throw new Error(`A variável ${name} não foi configurada no frontend.`);
  }
  return value;
}

const supabaseUrl = requireEnvironmentVariable("VITE_SUPABASE_URL");
const supabaseAnonKey = requireEnvironmentVariable("VITE_SUPABASE_ANON_KEY");

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});
