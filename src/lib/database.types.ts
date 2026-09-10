/**
 * Tipagem das tabelas do Postgres.
 *
 * Mantida à mão e espelhando `supabase/migrations`. Ao alterar uma migração,
 * atualize este arquivo — é ele que dá segurança de tipo às consultas.
 */

export type MeasurementUnit = 'kg' | 'g' | 'mg' | 'l' | 'ml' | 'un' | 'dz';
export type CostScopeRow = 'batch' | 'unit';
export type ExtraCostCategoryRow = 'packaging' | 'labor' | 'gas' | 'energy' | 'other';
export type IndirectCostMethodRow = 'none' | 'percent' | 'monthly_units' | 'monthly_hours';
export type SubscriptionPlan = 'free' | 'pro';
export type SubscriptionStatus = 'active' | 'trialing' | 'canceled';

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

type Timestamps = { created_at: string; updated_at: string };

export type ProfileRow = Timestamps & {
  id: string;
  full_name: string;
  onboarding_completed_at: string | null;
};

export type BusinessRow = Timestamps & {
  id: string;
  owner_id: string;
  name: string;
  business_type: string | null;
  product_volume: string | null;
  main_goal: string | null;
};

export type IngredientRow = Timestamps & {
  id: string;
  business_id: string;
  name: string;
  category: string | null;
  supplier: string | null;
  purchase_unit: MeasurementUnit;
  purchase_quantity: number;
  purchase_price: number;
  /** Custo por grama, mililitro ou unidade. Coluna gerada: o banco calcula, a aplicação só lê. */
  unit_cost: number;
  archived_at: string | null;
};

export type IngredientPriceRow = {
  id: string;
  ingredient_id: string;
  business_id: string;
  purchase_unit: MeasurementUnit;
  purchase_quantity: number;
  purchase_price: number;
  recorded_at: string;
};

export type ProductRow = Timestamps & {
  id: string;
  business_id: string;
  name: string;
  category: string | null;
  description: string | null;
  photo_url: string | null;
  yield_quantity: number;
  yield_label: string;
  notes: string | null;
  labor_minutes: number;
  margin_percent: number | null;
  archived_at: string | null;
};

export type RecipeRow = Timestamps & {
  id: string;
  product_id: string;
  business_id: string;
  version: number;
  is_active: boolean;
  notes: string | null;
};

export type RecipeIngredientRow = {
  id: string;
  recipe_id: string;
  business_id: string;
  ingredient_id: string;
  quantity: number;
  unit: MeasurementUnit;
  position: number;
  created_at: string;
};

export type ProductExtraCostRow = {
  id: string;
  product_id: string;
  business_id: string;
  label: string;
  category: ExtraCostCategoryRow;
  amount: number;
  scope: CostScopeRow;
  position: number;
  created_at: string;
};

export type CostSettingsRow = {
  id: string;
  business_id: string;
  labor_hourly_rate: number;
  /** Estimativa de gás por produção, usada quando o produto não define a sua. */
  gas_cost: number;
  /** Estimativa de energia por produção, usada quando o produto não define a sua. */
  electricity_cost: number;
  default_margin_percent: number;
  minimum_margin_percent: number;
  variable_fees_percent: number;
  indirect_method: IndirectCostMethodRow;
  indirect_cost_percentage: number;
  indirect_monthly_amount: number;
  indirect_monthly_units: number;
  indirect_monthly_hours: number;
  created_at: string;
  updated_at: string;
};

export type PricingCalculationRow = Timestamps & {
  id: string;
  business_id: string;
  product_id: string;
  sale_price: number;
  unit_cost: number;
  minimum_price: number;
  suggested_price: number;
  margin_percentage: number;
  markup: number;
  profit_per_unit: number;
  yield_quantity: number;
  /** Custos do LOTE, abertos por categoria. */
  ingredient_cost: number;
  packaging_cost: number;
  labor_cost: number;
  gas_cost: number;
  electricity_cost: number;
  other_cost: number;
  indirect_cost: number;
  total_cost: number;
  /** Margem pedida pela usuária, em %. */
  desired_margin: number;
  profit_total: number;

  input_snapshot: Json;
  breakdown: Json;
};

export type PricingHistoryRow = {
  id: string;
  business_id: string;
  product_id: string | null;
  product_name: string;
  sale_price: number;
  unit_cost: number;
  minimum_price: number;
  suggested_price: number;
  margin_percentage: number;
  markup: number;
  profit_per_unit: number;
  yield_quantity: number;
  /** Custos do LOTE, abertos por categoria. */
  ingredient_cost: number;
  packaging_cost: number;
  labor_cost: number;
  gas_cost: number;
  electricity_cost: number;
  other_cost: number;
  indirect_cost: number;
  total_cost: number;
  /** Margem pedida pela usuária, em %. */
  desired_margin: number;
  profit_total: number;

  input_snapshot: Json;
  breakdown: Json;
  created_at: string;
};

export type SubscriptionRow = Timestamps & {
  business_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_end: string | null;
};

type TableDefinition<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDefinition<ProfileRow>;
      businesses: TableDefinition<BusinessRow>;
      ingredients: TableDefinition<IngredientRow>;
      ingredient_prices: TableDefinition<IngredientPriceRow>;
      products: TableDefinition<ProductRow>;
      recipes: TableDefinition<RecipeRow>;
      recipe_ingredients: TableDefinition<RecipeIngredientRow>;
      product_extra_costs: TableDefinition<ProductExtraCostRow>;
      cost_settings: TableDefinition<CostSettingsRow>;
      pricing_calculations: TableDefinition<PricingCalculationRow>;
      pricing_history: TableDefinition<PricingHistoryRow>;
      subscriptions: TableDefinition<SubscriptionRow>;
    };
    Views: Record<string, never>;
    Functions: {
      owned_business_ids: { Args: Record<string, never>; Returns: string[] };
      unit_base_factor: { Args: { u: MeasurementUnit }; Returns: number };
      save_product: {
        Args: { p_product: Json; p_ingredients: Json; p_extras: Json };
        Returns: string;
      };
    };
    Enums: {
      measurement_unit: MeasurementUnit;
      cost_scope: CostScopeRow;
      extra_cost_category: ExtraCostCategoryRow;
      indirect_cost_method: IndirectCostMethodRow;
      subscription_plan: SubscriptionPlan;
      subscription_status: SubscriptionStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
