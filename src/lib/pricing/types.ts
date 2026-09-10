import type { Unit } from './units';

/** Onde o custo incide: uma vez por produção (lote) ou a cada unidade produzida. */
export type CostScope = 'batch' | 'unit';

export type ExtraCostCategory = 'packaging' | 'labor' | 'gas' | 'energy' | 'other';

export interface IngredientPurchase {
  /** Quantidade adquirida na embalagem comprada (ex.: 1 para "1 kg"). */
  purchaseQuantity: number;
  purchaseUnit: Unit;
  /** Valor pago pela embalagem inteira. */
  purchasePrice: number;
}

export interface RecipeIngredientInput extends IngredientPurchase {
  ingredientId: string;
  name: string;
  /** Quantidade utilizada na receita. */
  quantity: number;
  unit: Unit;
}

export interface ExtraCostInput {
  id?: string;
  label: string;
  category: ExtraCostCategory;
  amount: number;
  scope: CostScope;
}

export interface LaborInput {
  /** Quanto a confeiteira quer receber por hora de trabalho. */
  hourlyRate: number;
  /** Tempo de produção do lote, em minutos. */
  minutes: number;
}

export type IndirectCostConfig =
  | { method: 'none' }
  /** Acréscimo percentual sobre o custo direto — a opção mais simples. */
  | { method: 'percent'; percent: number }
  /** Rateio pelo volume de produção mensal. */
  | { method: 'monthly_units'; monthlyAmount: number; monthlyUnits: number }
  /** Rateio pelas horas de produção do mês. */
  | { method: 'monthly_hours'; monthlyAmount: number; monthlyHours: number };

export interface PricingInput {
  /** Quantas unidades a receita rende. */
  yieldQuantity: number;
  ingredients: RecipeIngredientInput[];
  labor?: LaborInput;
  extras: ExtraCostInput[];
  indirect: IndirectCostConfig;
  /** Margem de lucro desejada sobre o preço de venda, em %. */
  desiredMarginPercent: number;
  /** Taxas que incidem sobre o preço de venda (maquininha, impostos, comissão), em %. */
  variableFeesPercent: number;
  /** Margem mínima exigida pelo preço mínimo, em %. Zero = ponto de equilíbrio. */
  minimumMarginPercent: number;
}

export interface IngredientCostLine {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: Unit;
  /** Custo por grama, mililitro ou unidade. */
  costPerBaseUnit: number;
  /** Custo desse ingrediente no lote inteiro. */
  batchCost: number;
  unitCost: number;
  /** Participação no custo total dos ingredientes, em %. */
  sharePercent: number;
}

export interface CostBreakdown {
  ingredients: number;
  packaging: number;
  labor: number;
  gas: number;
  energy: number;
  other: number;
  indirect: number;
  total: number;
}

export interface PriceSimulation {
  salePrice: number;
  unitCost: number;
  /** Valor das taxas variáveis nesse preço. */
  feesAmount: number;
  profitPerUnit: number;
  profitPerBatch: number;
  /** Lucro ÷ preço de venda, em %. */
  marginPercent: number;
  /** Preço ÷ custo. Não confundir com margem. */
  markup: number;
  /** Falso quando o preço não cobre custo + taxas. */
  coversCosts: boolean;
  /**
   * CMV sobre o preço de venda, em %. É o indicador que a confeitaria usa para
   * comparar produtos entre si e com o mercado ("meu CMV está em 30%").
   */
  cmvPercent: number;
}

export interface PricingResult {
  yieldQuantity: number;
  ingredientLines: IngredientCostLine[];
  batch: CostBreakdown;
  unit: CostBreakdown;
  /**
   * CMV — Custo da Mercadoria Vendida.
   *
   * Neste sistema: ingredientes + embalagem, ou seja, o que sai pela porta junto
   * com o produto. Mão de obra, gás, energia e custos indiretos NÃO entram: são
   * custos de operar, não da mercadoria. A definição está dita na tela para não
   * haver dúvida sobre o que o número mede.
   */
  cmv: { unit: number; batch: number };
  /** Menor preço aceitável pela regra configurada (por padrão, o ponto de equilíbrio). */
  minimumPrice: number;
  /** Preço que entrega exatamente a margem desejada depois das taxas. */
  recommendedPrice: number;
  desiredMarginPercent: number;
  variableFeesPercent: number;
  /** Simulação no preço recomendado. */
  recommended: PriceSimulation;
}

export type PricingIssueField =
  | 'yieldQuantity'
  | 'ingredients'
  | 'labor'
  | 'extras'
  | 'indirect'
  | 'desiredMarginPercent'
  | 'variableFeesPercent'
  | 'minimumMarginPercent';

export interface PricingIssue {
  field: PricingIssueField;
  /** Mensagem pronta para a usuária, sem jargão técnico. */
  message: string;
}

export type PricingOutcome =
  | { ok: true; result: PricingResult }
  | { ok: false; issues: PricingIssue[] };
