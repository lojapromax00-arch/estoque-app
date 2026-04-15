import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.generated";

/**
 * Creates a Supabase admin client using the service role key.
 *
 * WARNING: This client bypasses Row Level Security (RLS).
 * NEVER import or use this in client components or expose it to the browser.
 * Use ONLY in trusted server-side contexts (Server Actions, API Route Handlers).
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
