import type { ZodError } from 'zod';

/**
 * Estado compartilhado por todos os formulários (useActionState).
 * Mensagens sempre em português e sem jargão — a usuária nunca vê um erro técnico.
 */
export type FormState = {
  status: 'idle' | 'error' | 'success';
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Identificador do último envio, usado para reagir a sucessos repetidos. */
  submissionId?: string;
};

export const IDLE: FormState = { status: 'idle' };

export function fieldErrorsFrom(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export function invalid(error: ZodError, message = 'Confira os campos destacados.'): FormState {
  return { status: 'error', message, fieldErrors: fieldErrorsFrom(error) };
}

export function failure(message: string, fieldErrors?: Record<string, string>): FormState {
  return { status: 'error', message, fieldErrors };
}

export function success(message?: string): FormState {
  return { status: 'success', message, submissionId: crypto.randomUUID() };
}

/**
 * Traduz erros do Supabase para linguagem comum.
 * Detalhes técnicos ficam no log do servidor, não na tela.
 */
export function friendlyAuthError(error: { message?: string; code?: string; status?: number }): string {
  const raw = (error.code ?? error.message ?? '').toLowerCase();

  if (raw.includes('invalid login') || raw.includes('invalid_credentials')) {
    return 'E-mail ou senha incorretos. Confira e tente de novo.';
  }
  if (raw.includes('email not confirmed')) {
    return 'Confirme o seu e-mail antes de entrar. Procure a mensagem que enviamos para você.';
  }
  if (raw.includes('user already registered') || raw.includes('already been registered')) {
    return 'Já existe uma conta com esse e-mail. Tente entrar ou recuperar a senha.';
  }
  if (raw.includes('rate limit') || raw.includes('too many') || error.status === 429) {
    return 'Muitas tentativas seguidas. Aguarde um minuto e tente novamente.';
  }
  if (raw.includes('weak password') || raw.includes('password should be')) {
    return 'Escolha uma senha mais forte, com pelo menos 8 caracteres.';
  }
  if (raw.includes('same password')) {
    return 'A nova senha precisa ser diferente da anterior.';
  }
  if (raw.includes('expired') || raw.includes('invalid token')) {
    return 'Esse link expirou. Peça um novo link de recuperação.';
  }
  return 'Não conseguimos concluir agora. Tente novamente em instantes.';
}

/** Erro genérico de banco, com o detalhe técnico apenas no log. */
export function databaseError(context: string, error: unknown): FormState {
  console.error(`[controldolces] ${context}`, error);
  return failure('Não conseguimos salvar agora. Tente novamente em alguns instantes.');
}
