/**
 * As etapas do onboarding.
 *
 * Vive fora do arquivo de Server Actions de propósito: um módulo `'use server'`
 * só pode exportar funções assíncronas, então uma constante ali quebra o build.
 */
export const ETAPAS = {
  BOAS_VINDAS: 0,
  SOBRE_VOCE: 1,
  TIPO_DE_NEGOCIO: 2,
  OBJETIVO: 3,
  TUDO_PRONTO: 4,
} as const;

export type Etapa = (typeof ETAPAS)[keyof typeof ETAPAS];
