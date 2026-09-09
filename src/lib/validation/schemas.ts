import { z } from 'zod';

import { ALL_UNITS } from '@/lib/pricing';

/**
 * Esquemas de validação usados nas Server Actions.
 *
 * Toda entrada é validada NO SERVIDOR. A validação do formulário no navegador
 * existe só para dar retorno rápido — nunca é a barreira de verdade.
 */

const MENSAGEM_OBRIGATORIO = 'Este campo é obrigatório.';

/** Número vindo de <input>: aceita "12,50", "12.50" e "R$ 1.250,00". */
function numeroBR() {
  return z
    .union([z.string(), z.number()])
    .transform((value) => {
      if (typeof value === 'number') return value;
      const limpo = value.trim().replace(/[R$\s]/g, '');
      if (limpo === '') return Number.NaN;
      const normalizado = limpo.includes(',')
        ? limpo.replace(/\./g, '').replace(',', '.')
        : limpo;
      return Number(normalizado);
    })
    .refine((value) => Number.isFinite(value), { message: 'Informe um número válido.' });
}

export function numeroObrigatorio(opcoes?: { min?: number; max?: number; mensagemMin?: string }) {
  return numeroBR().superRefine((value, ctx) => {
    if (opcoes?.min !== undefined && value < opcoes.min) {
      ctx.addIssue({
        code: 'custom',
        message: opcoes.mensagemMin ?? `O valor precisa ser no mínimo ${opcoes.min}.`,
      });
    }
    if (opcoes?.max !== undefined && value > opcoes.max) {
      ctx.addIssue({ code: 'custom', message: `O valor precisa ser no máximo ${opcoes.max}.` });
    }
  });
}

export const unitSchema = z.enum(ALL_UNITS as [string, ...string[]]);

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Informe o seu e-mail.')
  .pipe(z.email('Esse e-mail não parece válido. Confira se está tudo certo.'))
  .transform((value) => value.toLowerCase());

const senhaSchema = z
  .string()
  .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
  .max(72, 'A senha pode ter no máximo 72 caracteres.');

// ---------------------------------------------------------------------------
// Autenticação
// ---------------------------------------------------------------------------
export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, 'Informe o seu nome.').max(120),
  email: emailSchema,
  password: senhaSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe a sua senha.'),
  next: z.string().optional(),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    password: senhaSchema,
    passwordConfirmation: z.string().min(1, 'Repita a nova senha.'),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'As senhas não são iguais.',
  });

// ---------------------------------------------------------------------------
// Onboarding e negócio
// ---------------------------------------------------------------------------
export const onboardingSchema = z.object({
  fullName: z.string().trim().min(2, 'Informe o seu nome.').max(120),
  businessName: z.string().trim().min(2, 'Informe o nome da sua confeitaria.').max(120),
  businessType: z.string().trim().max(60).optional().or(z.literal('')),
  productVolume: z.string().trim().max(60).optional().or(z.literal('')),
  mainGoal: z.string().trim().max(120).optional().or(z.literal('')),
});

// ---------------------------------------------------------------------------
// Ingredientes
// ---------------------------------------------------------------------------
export const ingredientSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, 'Informe o nome do ingrediente.').max(120),
  category: z.string().trim().max(60).optional().or(z.literal('')),
  supplier: z.string().trim().max(120).optional().or(z.literal('')),
  purchaseUnit: unitSchema,
  purchaseQuantity: numeroObrigatorio({
    min: 0.0001,
    mensagemMin: 'A quantidade comprada precisa ser maior que zero.',
  }),
  purchasePrice: numeroObrigatorio({
    min: 0.0001,
    mensagemMin: 'O preço pago precisa ser maior que zero.',
  }),
});

// ---------------------------------------------------------------------------
// Produtos e ficha técnica
// ---------------------------------------------------------------------------
export const recipeIngredientSchema = z.object({
  ingredientId: z.string().uuid('Selecione um ingrediente válido.'),
  quantity: numeroObrigatorio({
    min: 0.0001,
    mensagemMin: 'A quantidade usada precisa ser maior que zero.',
  }),
  unit: unitSchema,
});

export const extraCostSchema = z.object({
  label: z.string().trim().min(1, 'Dê um nome para esse custo.').max(80),
  category: z.enum(['packaging', 'labor', 'gas', 'energy', 'other']),
  amount: numeroObrigatorio({ min: 0, mensagemMin: 'O valor não pode ser negativo.' }),
  scope: z.enum(['batch', 'unit']),
});

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, 'Informe o nome do produto.').max(120),
  category: z.string().trim().max(60).optional().or(z.literal('')),
  description: z.string().trim().max(400).optional().or(z.literal('')),
  photoUrl: z.string().trim().max(500).optional().or(z.literal('')),
  yieldQuantity: numeroObrigatorio({
    min: 0.0001,
    mensagemMin: 'O rendimento precisa ser maior que zero.',
  }),
  yieldLabel: z.string().trim().max(40).default('unidades'),
  laborMinutes: numeroObrigatorio({ min: 0, mensagemMin: 'O tempo não pode ser negativo.' }).default(0),
  marginPercent: numeroObrigatorio({ min: 0, max: 95 }).nullable().optional(),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
  ingredients: z.array(recipeIngredientSchema).min(1, 'Adicione pelo menos um ingrediente.'),
  extraCosts: z.array(extraCostSchema).default([]),
});

// ---------------------------------------------------------------------------
// Configurações de custo
// ---------------------------------------------------------------------------
export const costSettingsSchema = z
  .object({
    laborHourlyRate: numeroObrigatorio({ min: 0, mensagemMin: 'O valor da hora não pode ser negativo.' }),
    defaultMarginPercent: numeroObrigatorio({ min: 0, max: 95 }),
    minimumMarginPercent: numeroObrigatorio({ min: 0, max: 95 }),
    variableFeesPercent: numeroObrigatorio({ min: 0, max: 99 }),
    indirectMethod: z.enum(['none', 'percent', 'monthly_units', 'monthly_hours']),
    indirectPercent: numeroObrigatorio({ min: 0, max: 300 }).default(0),
    indirectMonthlyAmount: numeroObrigatorio({ min: 0 }).default(0),
    indirectMonthlyUnits: numeroObrigatorio({ min: 0 }).default(0),
    indirectMonthlyHours: numeroObrigatorio({ min: 0 }).default(0),
  })
  .refine((data) => data.minimumMarginPercent <= data.defaultMarginPercent, {
    path: ['minimumMarginPercent'],
    message: 'A margem mínima não pode ser maior que a margem padrão.',
  })
  .refine(
    (data) => data.indirectMethod !== 'monthly_units' || data.indirectMonthlyUnits > 0,
    {
      path: ['indirectMonthlyUnits'],
      message: 'Informe quantas unidades você produz por mês para ratear os custos indiretos.',
    },
  )
  .refine(
    (data) => data.indirectMethod !== 'monthly_hours' || data.indirectMonthlyHours > 0,
    {
      path: ['indirectMonthlyHours'],
      message: 'Informe quantas horas você produz por mês para ratear os custos indiretos.',
    },
  );

// ---------------------------------------------------------------------------
// Precificação
// ---------------------------------------------------------------------------
export const savePricingSchema = z.object({
  productId: z.string().uuid(),
  salePrice: numeroObrigatorio({ min: 0, mensagemMin: 'O preço de venda não pode ser negativo.' }),
  marginPercent: numeroObrigatorio({ min: 0, max: 95 }),
});

export const MENSAGENS = { obrigatorio: MENSAGEM_OBRIGATORIO };
