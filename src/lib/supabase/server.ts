import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Supabase klient pro použití na serveru (Server Components, Server Actions,
 * Route Handlers). Čte/zapisuje session z cookies. Používá veřejný "anon"
 * klíč a respektuje Row Level Security - pro přístup je potřeba být
 * přihlášen (viz middleware.ts).
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll bylo zavoláno ze Server Component - lze ignorovat,
            // pokud middleware obnovuje session.
          }
        },
      },
    }
  );
}

/**
 * Klient s "service_role" klíčem - obchází Row Level Security.
 * POUZE pro důvěryhodný serverový kód (např. export API), NIKDY
 * nepoužívat v kódu dostupném z prohlížeče.
 */
export function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
