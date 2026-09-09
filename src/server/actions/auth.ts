'use server';

import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { siteUrl } from '@/lib/supabase/env';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from '@/lib/validation/schemas';
import { failure, friendlyAuthError, invalid, success, type FormState } from '@/server/form-state';

function values(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

/** Cria a conta. O perfil nasce por trigger no banco; o negócio é criado no onboarding. */
export async function signUpAction(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse(values(formData));
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${siteUrl()}/auth/confirmar?proximo=/onboarding`,
    },
  });

  if (error) return failure(friendlyAuthError(error));

  // Quando a confirmação de e-mail está desligada no projeto, a sessão já vem pronta.
  if (data.session) redirect('/onboarding');

  return success(
    'Conta criada. Enviamos um e-mail de confirmação — abra a mensagem para ativar o seu acesso.',
  );
}

export async function signInAction(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse(values(formData));
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) return failure(friendlyAuthError(error));

  const next = parsed.data.next;
  redirect(next && next.startsWith('/') ? next : '/painel');
}

export async function forgotPasswordAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse(values(formData));
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl()}/auth/confirmar?proximo=/nova-senha`,
  });

  if (error) return failure(friendlyAuthError(error));

  // Resposta idêntica exista ou não a conta: não revelamos quais e-mails estão cadastrados.
  return success(
    'Se existir uma conta com esse e-mail, enviamos um link para você criar uma nova senha.',
  );
}

export async function resetPasswordAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse(values(formData));
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return failure(
      'Esse link de recuperação não está mais válido. Peça um novo link para criar sua senha.',
    );
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return failure(friendlyAuthError(error));

  redirect('/painel');
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/entrar');
}
