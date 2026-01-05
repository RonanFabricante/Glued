import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

type CookieOptions = Record<string, unknown>;

type CookieToSet = {
  name: string;
  value: string;
  options?: CookieOptions;
};

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // `cookieStore.set` exists at runtime, but some Next typings expose it differently.
              // Cast to the minimal shape we need to satisfy TS.
              (cookieStore as unknown as { set: (n: string, v: string, o?: CookieOptions) => void }).set(
                name,
                value,
                options
              );
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}
