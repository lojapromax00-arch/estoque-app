"use client";

import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Returns a stable Supabase browser client instance.
 * Use this hook in Client Components.
 */
export function useSupabase() {
  return useMemo(() => createClient(), []);
}
