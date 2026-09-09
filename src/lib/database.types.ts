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

export interface ProfileRow extends Timestamps {
  id: string;
  full_name: string;
  onboarding_completed_at: string | null;
}

export interface BusinessRow extends Timestamps {
  id: string;
  owner_id: string;
  name: string;
  business_type: string | null;
  product_volume: string | null;
  main_goal: string | null;
}

export interface IngredientRow extends Timestamps {
  id: string;
  business_id: string;
  name: string;
  category: string | null;
  supplier: string | null;
  purchase_unit: MeasurementUnit;
  purchase_quantity: number;
  purchase_price: number;
  archived_at: string | null;
}

export interface IngredientPriceRow {
  id: string;
  ingredient_id: string;
  business_id: string;
  purchase_unit: MeasurementUnit;
  purchase_quantity: number;
  purchase_price: number;
  recorded_at: string;
}

export interface ProductRow extends Timestamps {
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
}

export interface RecipeRow extends Timestamps {
  id: string;
  product_id: string;
  business_id: string;
  version: number;
  is_active: boolean;
  notes: string | null;
}

export interface RecipeIngredientRow {
  id: string;
  recipe_id: string;
  business_id: string;
  ingredient_id: string;
  quantity: number;
  unit: MeasurementUnit;
  position: number;
  created_at: string;
}

export interface ProductExtraCostRow {
  id: string;
  product_id: string;
  business_id: string;
  label: string;
  category: ExtraCostCategoryRow;
  amount: number;
  scope: CostScopeRow;
  position: number;
  created_at: string;
}

export interface CostSettingsRow {
  business_id: string;
  labor_hourly_rate: number;
  default_margin_percent: number;
  minimum_margin_percent: number;
  variable_fees_percent: number;
  indirect_method: IndirectCostMethodRow;
  indirect_percent: number;
  indirect_monthly_amount: number;
  indirect_monthly_units: number;
  indirect_monthly_hours: number;
  updated_at: string;
}

export interface PricingCalculationRow extends Timestamps {
  id: string;
  business_id: string;
  product_id: string;
  sale_price: number;
  unit_cost: number;
  batch_cost: number;
  minimum_price: number;
  recommended_price: number;
  margin_percent: number;
  markup: number;
  profit_per_unit: number;
  yield_quantity: number;
  input_snapshot: Json;
  breakdown: Json;
}

export interface PricingHistoryRow {
  id: string;
  business_id: string;
  product_id: string | null;
  product_name: string;
  sale_price: number;
  unit_cost: number;
  minimum_price: number;
  recommended_price: number;
  margin_percent: number;
  markup: number;
  profit_per_unit: number;
  yield_quantity: number;
  input_snapshot: Json;
  breakdown: Json;
  created_at: string;
}

export interface SubscriptionRow extends Timestamps {
  business_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_end: string | null;
}

type TableDefinition<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
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
}
