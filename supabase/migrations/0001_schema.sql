-- =============================================================================
-- ControlDolces — esquema inicial
--
-- Modelo multi-tenant: cada usuária tem um "negócio" (businesses) e TODOS os
-- dados operacionais penduram em business_id. O isolamento é garantido no banco
-- por Row Level Security, nunca apenas pelo frontend.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Tipos
-- -----------------------------------------------------------------------------
create type measurement_unit as enum ('kg', 'g', 'mg', 'l', 'ml', 'un', 'dz');
create type cost_scope as enum ('batch', 'unit');
create type extra_cost_category as enum ('packaging', 'labor', 'gas', 'energy', 'other');
create type indirect_cost_method as enum ('none', 'percent', 'monthly_units', 'monthly_hours');
create type subscription_plan as enum ('free', 'pro');
create type subscription_status as enum ('active', 'trialing', 'canceled');

-- -----------------------------------------------------------------------------
-- Perfil da usuária (1:1 com auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Negócio (tenant)
-- -----------------------------------------------------------------------------
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  business_type text,
  product_volume text,
  main_goal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index businesses_owner_id_idx on public.businesses (owner_id);

-- Função auxiliar usada nas políticas: os negócios da usuária autenticada.
-- SECURITY DEFINER + search_path fixo evita recursão de RLS e sequestro de schema.
create or replace function public.owned_business_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.businesses where owner_id = auth.uid();
$$;

-- -----------------------------------------------------------------------------
-- Ingredientes
-- -----------------------------------------------------------------------------
create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  category text,
  supplier text,
  purchase_unit measurement_unit not null,
  purchase_quantity numeric(14, 4) not null check (purchase_quantity > 0),
  purchase_price numeric(14, 4) not null check (purchase_price >= 0),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ingredients_business_id_idx on public.ingredients (business_id);
create unique index ingredients_unique_name_per_business
  on public.ingredients (business_id, lower(name))
  where archived_at is null;

-- Histórico de preços: toda alteração de preço de compra vira uma linha aqui,
-- para a usuária acompanhar a variação de custo dos insumos ao longo do tempo.
create table public.ingredient_prices (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.ingredients (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  purchase_unit measurement_unit not null,
  purchase_quantity numeric(14, 4) not null check (purchase_quantity > 0),
  purchase_price numeric(14, 4) not null check (purchase_price >= 0),
  recorded_at timestamptz not null default now()
);

create index ingredient_prices_ingredient_id_idx on public.ingredient_prices (ingredient_id, recorded_at desc);

-- -----------------------------------------------------------------------------
-- Produtos e fichas técnicas
-- -----------------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  category text,
  description text,
  photo_url text,
  yield_quantity numeric(14, 4) not null default 1 check (yield_quantity > 0),
  yield_label text not null default 'unidades',
  notes text,
  -- Tempo de produção do lote; combinado com o valor/hora vira custo de mão de obra.
  labor_minutes integer not null default 0 check (labor_minutes >= 0),
  -- Sobrescreve a margem padrão do negócio quando preenchido.
  margin_percent numeric(6, 3) check (margin_percent >= 0 and margin_percent <= 95),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_business_id_idx on public.products (business_id);

-- Uma receita é uma versão da ficha técnica de um produto.
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  version integer not null default 1,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, version)
);

create unique index recipes_one_active_per_product
  on public.recipes (product_id)
  where is_active;

create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id) on delete restrict,
  quantity numeric(14, 4) not null check (quantity > 0),
  unit measurement_unit not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (recipe_id, ingredient_id)
);

create index recipe_ingredients_recipe_id_idx on public.recipe_ingredients (recipe_id);

-- Custos além dos ingredientes: embalagem, gás, energia, transporte, etiquetas...
create table public.product_extra_costs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  label text not null,
  category extra_cost_category not null default 'other',
  amount numeric(14, 4) not null check (amount >= 0),
  scope cost_scope not null default 'batch',
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index product_extra_costs_product_id_idx on public.product_extra_costs (product_id);

-- -----------------------------------------------------------------------------
-- Configurações de custo do negócio
-- -----------------------------------------------------------------------------
create table public.cost_settings (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  labor_hourly_rate numeric(14, 4) not null default 0 check (labor_hourly_rate >= 0),
  default_margin_percent numeric(6, 3) not null default 50 check (default_margin_percent >= 0 and default_margin_percent <= 95),
  minimum_margin_percent numeric(6, 3) not null default 0 check (minimum_margin_percent >= 0 and minimum_margin_percent <= 95),
  variable_fees_percent numeric(6, 3) not null default 0 check (variable_fees_percent >= 0 and variable_fees_percent < 100),
  indirect_method indirect_cost_method not null default 'none',
  indirect_percent numeric(6, 3) not null default 0 check (indirect_percent >= 0),
  indirect_monthly_amount numeric(14, 4) not null default 0 check (indirect_monthly_amount >= 0),
  indirect_monthly_units numeric(14, 4) not null default 0 check (indirect_monthly_units >= 0),
  indirect_monthly_hours numeric(14, 4) not null default 0 check (indirect_monthly_hours >= 0),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Precificações
--
-- pricing_calculations guarda a precificação vigente de cada produto.
-- pricing_history é um log imutável: toda vez que uma precificação é salva,
-- fica registrado o retrato completo dos custos daquele momento.
-- -----------------------------------------------------------------------------
create table public.pricing_calculations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  sale_price numeric(14, 4) not null check (sale_price >= 0),
  unit_cost numeric(14, 4) not null check (unit_cost >= 0),
  batch_cost numeric(14, 4) not null check (batch_cost >= 0),
  minimum_price numeric(14, 4) not null check (minimum_price >= 0),
  recommended_price numeric(14, 4) not null check (recommended_price >= 0),
  margin_percent numeric(8, 3) not null,
  markup numeric(10, 4) not null,
  profit_per_unit numeric(14, 4) not null,
  yield_quantity numeric(14, 4) not null check (yield_quantity > 0),
  -- Retrato dos dados usados no cálculo (entrada do motor) e do resultado.
  input_snapshot jsonb not null,
  breakdown jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id)
);

create index pricing_calculations_business_id_idx on public.pricing_calculations (business_id, updated_at desc);

create table public.pricing_history (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  sale_price numeric(14, 4) not null,
  unit_cost numeric(14, 4) not null,
  minimum_price numeric(14, 4) not null,
  recommended_price numeric(14, 4) not null,
  margin_percent numeric(8, 3) not null,
  markup numeric(10, 4) not null,
  profit_per_unit numeric(14, 4) not null,
  yield_quantity numeric(14, 4) not null,
  input_snapshot jsonb not null,
  breakdown jsonb not null,
  created_at timestamptz not null default now()
);

create index pricing_history_business_id_idx on public.pricing_history (business_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Assinatura
-- -----------------------------------------------------------------------------
create table public.subscriptions (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  plan subscription_plan not null default 'free',
  status subscription_status not null default 'active',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- updated_at automático
-- -----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  target text;
begin
  foreach target in array array[
    'profiles', 'businesses', 'ingredients', 'products', 'recipes',
    'cost_settings', 'pricing_calculations', 'subscriptions'
  ]
  loop
    execute format(
      'create trigger %I_touch_updated_at before update on public.%I for each row execute function public.touch_updated_at()',
      target, target
    );
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- Criação automática do perfil quando uma conta nasce
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
