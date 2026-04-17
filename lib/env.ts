/**
 * Centralised environment variable access with runtime validation.
 * Import from here instead of using process.env directly in app code.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** Public — safe to use in browser */
export const env = {
  supabaseUrl: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  appEnv: (process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development") as
    | "development"
    | "preview"
    | "production",
} as const;

/** Server-only — never import in client components */
export const serverEnv = {
  supabaseServiceRoleKey: () => requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseProjectId: () => requireEnv("SUPABASE_PROJECT_ID"),
  trayApiUrl: () => process.env.TRAY_API_URL ?? "",
  trayApiKey: () => process.env.TRAY_API_KEY ?? "",
  trayStoreId: () => process.env.TRAY_STORE_ID ?? "",
  storageBucket: () => process.env.SUPABASE_STORAGE_BUCKET ?? "importacoes",
} as const;
