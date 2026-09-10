-- =============================================================================
-- Alinhamento do esquema com a especificação da FASE 1.
--
-- Migração aditiva e forward-only: pode ser aplicada num banco que já recebeu
-- 0001–0003 ou numa instalação nova (a ordem produz o mesmo resultado).
--
-- Fecha três lacunas:
--   1. ingredients.unit_cost — custo por unidade-base gravado na própria linha
--   2. cost_settings — gás, energia, id próprio e o nome de coluna da especificação
--   3. pricing_calculations / pricing_history — custo aberto por categoria em
--      colunas consultáveis, não só no JSONB
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Custo por unidade-base do ingrediente
--
-- Coluna GERADA, não escrita pela aplicação: é impossível ela divergir do preço
-- e da quantidade da mesma linha. Se fosse preenchida por código, uma escrita que
-- esquecesse de recalcular deixaria o custo do insumo mentindo para sempre.
--
-- Os fatores são constantes físicas (1 kg = 1000 g). Alterar a função depois NÃO
-- recalcula as linhas existentes — limitação de colunas geradas no Postgres — mas
-- 1 kg não vai deixar de ter 1000 g.
-- -----------------------------------------------------------------------------
create or replace function public.unit_base_factor(u measurement_unit)
returns numeric
language sql
immutable
strict
parallel safe
as $$
  select (case u
    when 'kg' then 1000
    when 'g'  then 1
    when 'mg' then 0.001
    when 'l'  then 1000
    when 'ml' then 1
    when 'un' then 1
    when 'dz' then 12
  end)::numeric;
$$;

comment on function public.unit_base_factor(measurement_unit) is
  'Quantos gramas, mililitros ou unidades equivalem a 1 desta unidade. Espelha src/lib/pricing/units.ts.';

-- `numeric` sem escala fixa: uma escala curta truncaria o custo de insumos
-- baratos usados em grande quantidade. O Postgres guarda o quociente com
-- precisão suficiente para o valor bater com o motor de cálculo.
alter table public.ingredients
  add column if not exists unit_cost numeric
  generated always as (
    purchase_price / (purchase_quantity * public.unit_base_factor(purchase_unit))
  ) stored;

comment on column public.ingredients.unit_cost is
  'Custo por grama, mililitro ou unidade. Calculado pelo banco; não aceita escrita.';

-- -----------------------------------------------------------------------------
-- 2. Configurações de custo
--
-- Gás e energia passam a ter uma estimativa no nível do negócio, usada como
-- padrão quando o produto não declara um valor próprio.
-- -----------------------------------------------------------------------------
alter table public.cost_settings
  add column if not exists id uuid not null default gen_random_uuid(),
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists gas_cost numeric(14, 4) not null default 0,
  add column if not exists electricity_cost numeric(14, 4) not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'cost_settings_gas_cost_check'
  ) then
    alter table public.cost_settings
      add constraint cost_settings_gas_cost_check check (gas_cost >= 0),
      add constraint cost_settings_electricity_cost_check check (electricity_cost >= 0);
  end if;
end;
$$;

comment on column public.cost_settings.gas_cost is
  'Estimativa de gás por produção. Padrão do negócio; o produto pode ter o próprio valor.';
comment on column public.cost_settings.electricity_cost is
  'Estimativa de energia por produção. Padrão do negócio; o produto pode ter o próprio valor.';

-- id passa a ser a chave primária; business_id continua único (1 configuração por negócio).
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'cost_settings_pkey' and conrelid = 'public.cost_settings'::regclass
  ) and not exists (
    select 1 from pg_constraint where conname = 'cost_settings_business_id_key'
  ) then
    alter table public.cost_settings drop constraint cost_settings_pkey;
    alter table public.cost_settings add primary key (id);
    alter table public.cost_settings add constraint cost_settings_business_id_key unique (business_id);
  end if;
end;
$$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cost_settings' and column_name = 'indirect_percent'
  ) then
    alter table public.cost_settings rename column indirect_percent to indirect_cost_percentage;
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- 3. Precificações com o custo aberto por categoria
--
-- O JSONB continua guardando o retrato completo da entrada, mas os valores que
-- alimentam relatórios viram colunas: dá para consultar, somar e indexar sem
-- abrir o JSON.
-- -----------------------------------------------------------------------------
do $$
declare
  alvo text;
begin
  foreach alvo in array array['pricing_calculations', 'pricing_history']
  loop
    -- Nomes da especificação da FASE 1.
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = alvo and column_name = 'recommended_price'
    ) then
      execute format('alter table public.%I rename column recommended_price to suggested_price', alvo);
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = alvo and column_name = 'margin_percent'
    ) then
      execute format('alter table public.%I rename column margin_percent to margin_percentage', alvo);
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = alvo and column_name = 'batch_cost'
    ) then
      execute format('alter table public.%I rename column batch_cost to total_cost', alvo);
    end if;

    -- Custo aberto por categoria, sempre referente ao LOTE inteiro.
    execute format($fmt$
      alter table public.%I
        add column if not exists ingredient_cost   numeric(14, 4) not null default 0,
        add column if not exists packaging_cost    numeric(14, 4) not null default 0,
        add column if not exists labor_cost        numeric(14, 4) not null default 0,
        add column if not exists gas_cost          numeric(14, 4) not null default 0,
        add column if not exists electricity_cost  numeric(14, 4) not null default 0,
        add column if not exists other_cost        numeric(14, 4) not null default 0,
        add column if not exists indirect_cost     numeric(14, 4) not null default 0,
        add column if not exists total_cost        numeric(14, 4) not null default 0,
        add column if not exists desired_margin    numeric(8, 3)  not null default 0,
        add column if not exists profit_total      numeric(14, 4) not null default 0
    $fmt$, alvo);
  end loop;
end;
$$;

comment on column public.pricing_calculations.total_cost is
  'Custo total do lote no momento em que a precificação foi salva.';
comment on column public.pricing_calculations.desired_margin is
  'Margem que a usuária pediu, em %. Diferente de margin_percentage, que é a margem realizada no preço praticado.';
comment on column public.pricing_history.input_snapshot is
  'Retrato da entrada do cálculo. É o que mantém uma precificação antiga explicável depois de os ingredientes mudarem de preço.';
