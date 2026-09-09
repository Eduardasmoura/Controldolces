import { redirect } from 'next/navigation';
import type { EmailOtpType } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Destino dos links enviados por e-mail (confirmação de cadastro e recuperação
 * de senha). Troca o token pela sessão e encaminha para o próximo passo.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');
  const rawNext = searchParams.get('proximo') ?? '/painel';
  const next = rawNext.startsWith('/') ? rawNext : '/painel';

  const supabase = await createSupabaseServerClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) redirect(next);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) redirect(next);
  }

  redirect('/entrar?erro=link-invalido');
}
