import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

import { isSupabaseConfigured, supabaseEnv } from './env';

const APP_PREFIXES = ['/painel', '/ingredientes', '/produtos', '/precificar', '/historico', '/relatorios', '/configuracoes', '/onboarding'];

function isProtected(pathname: string): boolean {
  return APP_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * Renova a sessão a cada navegação e barra o acesso às rotas privadas.
 * É a primeira camada; a segunda (e definitiva) é o RLS no banco.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) return response;

  const { url, anonKey } = supabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && isProtected(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/entrar';
    redirectUrl.searchParams.set('proximo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && (pathname === '/entrar' || pathname === '/criar-conta')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/painel';
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
