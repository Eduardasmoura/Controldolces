-- =============================================================================
-- Módulo de ingredientes.
--
-- Acrescenta observações ao ingrediente e completa o histórico de preços com a
-- quantidade normalizada e o custo por unidade-base daquele momento.
--
-- Por que gravar o custo normalizado no histórico, se ele é derivável? Porque
-- o histórico existe justamente para responder "quanto custava naquele dia".
-- Recalcular depois exigiria que as regras de conversão nunca mudassem — e
-- guardar o número é mais barato do que essa promessa.
-- =============================================================================

alter table public.ingredients
  add column if not exists notes text;

comment on column public.ingredients.notes is
  'Observações da usuária: marca preferida, onde compra, rendimento real.';

comment on column public.ingredients.archived_at is
  'Preenchido quando o ingrediente é desativado. Inativo não aparece em novas receitas, mas continua preservado nas antigas e no histórico.';

-- -----------------------------------------------------------------------------
-- Unidade-base de cada unidade de compra, para o banco normalizar sozinho.
-- -----------------------------------------------------------------------------
create or replace function public.base_unit_of(u measurement_unit)
returns measurement_unit
language sql
immutable
strict
parallel safe
as $$
  select (case u
    when 'kg' then 'g'
    when 'g'  then 'g'
    when 'mg' then 'g'
    when 'l'  then 'ml'
    when 'ml' then 'ml'
    when 'un' then 'un'
    when 'dz' then 'un'
  end)::measurement_unit;
$$;

comment on function public.base_unit_of(measurement_unit) is
  'Unidade-base da dimensão: massa vira g, volume vira ml, contagem vira un. Espelha src/lib/pricing/units.ts.';

-- -----------------------------------------------------------------------------
-- Histórico de preços completo.
--
-- Uma linha por alteração de compra. Nunca é atualizada nem apagada junto com o
-- ingrediente vigente: é o registro de como o custo variou ao longo do tempo.
-- -----------------------------------------------------------------------------
alter table public.ingredient_prices
  add column if not exists normalized_quantity numeric
    generated always as (purchase_quantity * public.unit_base_factor(purchase_unit)) stored,
  add column if not exists normalized_unit measurement_unit
    generated always as (public.base_unit_of(purchase_unit)) stored,
  add column if not exists unit_cost numeric
    generated always as (
      purchase_price / (purchase_quantity * public.unit_base_factor(purchase_unit))
    ) stored,
  add column if not exists note text;

comment on column public.ingredient_prices.normalized_quantity is
  'Quantidade convertida para a unidade-base (g, ml ou un).';
comment on column public.ingredient_prices.unit_cost is
  'Custo por unidade-base no momento em que este preço valia.';

create index if not exists ingredient_prices_business_idx
  on public.ingredient_prices (business_id, recorded_at desc);

-- -----------------------------------------------------------------------------
-- Busca por nome.
--
-- A listagem filtra com ILIKE '%termo%'; o índice trigram é o que impede isso de
-- virar varredura completa quando a lista de insumos cresce.
-- -----------------------------------------------------------------------------
create extension if not exists pg_trgm;

create index if not exists ingredients_name_trgm_idx
  on public.ingredients using gin (name gin_trgm_ops);

create index if not exists ingredients_business_ativos_idx
  on public.ingredients (business_id, name)
  where archived_at is null;
