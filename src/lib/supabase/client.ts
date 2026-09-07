import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase klient pro použití v prohlížeči (Client Components).
 * Používá veřejný "anon" klíč - respektuje Row Level Security.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
