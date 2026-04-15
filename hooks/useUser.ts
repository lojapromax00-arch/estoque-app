"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useSupabase } from "./useSupabase";

interface UseUserReturn {
  user: User | null;
  loading: boolean;
}

/**
 * Returns the currently authenticated user and a loading flag.
 * Subscribes to auth state changes automatically.
 */
export function useUser(): UseUserReturn {
  const supabase = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    // Subscribe to auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  return { user, loading };
}
