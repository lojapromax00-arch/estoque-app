import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { ApiResponse } from "@/types";

/**
 * Server-side auth helpers.
 * Use these in Server Actions or Route Handlers.
 */

export async function getSession() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    logger.warn("Failed to get session", { error: error.message });
    return null;
  }

  return data.user;
}

export async function requireAuth() {
  const user = await getSession();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function signOut(): Promise<ApiResponse<null>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error("Sign out failed", { error: error.message });
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    logger.error("Sign out exception", { error: message });
    return { data: null, error: message };
  }
}
