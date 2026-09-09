import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

import type { Database } from '@/lib/database.types';
import { supabaseEnv } from './env';

/**
 * Cliente Supabase para Server Components, Server Actions e Route Handlers.
 * A sessão vive em cookies httpOnly — o token nunca é lido por JavaScript do cliente.
 */
export async function createSupabaseServerClient() {
  const { url, anonKey } = supabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components não podem gravar cookies; a renovação do token
          // acontece no middleware, então ignorar aqui é seguro.
        }
      },
    },
  });
}
