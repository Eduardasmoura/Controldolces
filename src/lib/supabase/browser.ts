'use client';

import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@/lib/database.types';
import { supabaseEnv } from './env';

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

/** Cliente do navegador — usado apenas para operações de sessão e upload de fotos. */
export function createSupabaseBrowserClient() {
  if (!client) {
    const { url, anonKey } = supabaseEnv();
    client = createBrowserClient<Database>(url, anonKey);
  }
  return client;
}
