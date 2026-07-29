/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AKUBELA_API_BASE_URL?: string
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_DEMO_PUBLIC_ORIGIN?: string;
  readonly VITE_EKAZA_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
