-- =============================================================================
-- Resumo do painel numa única consulta.
--
-- O painel precisa de contagens e médias, não das linhas. Carregar todos os
-- ingredientes só para chamar `.length` funciona com 10 registros e fica caro
-- com 500. Esta função devolve tudo de uma vez, contando no banco.
--
-- SECURITY INVOKER: roda com os privilégios de quem chamou, então o RLS
-- continua valendo e cada usuária só conta os próprios registros.
-- =============================================================================

create or replace function public.dashboard_summary()
returns table (
  ingredients_count integer,
  products_count integer,
  pricings_count integer,
  average_margin numeric,
  average_unit_cost numeric,
  potential_profit numeric,
  low_margin_count integer,
  below_minimum_count integer
)
language sql
stable
security invoker
set search_path = public
as $$
  with meu_negocio as (
    select id
    from public.businesses
    where owner_id = auth.uid()
    order by created_at
    limit 1
  )
  select
    (
      select count(*)
      from public.ingredients i, meu_negocio b
      where i.business_id = b.id and i.archived_at is null
    )::integer,
    (
      select count(*)
      from public.products p, meu_negocio b
      where p.business_id = b.id and p.archived_at is null
    )::integer,
    (
      select count(*)
      from public.pricing_calculations c, meu_negocio b
      where c.business_id = b.id
    )::integer,
    (
      select avg(c.margin_percentage)
      from public.pricing_calculations c, meu_negocio b
      where c.business_id = b.id
    ),
    (
      select avg(c.unit_cost)
      from public.pricing_calculations c, meu_negocio b
      where c.business_id = b.id
    ),
    -- Lucro de vender um lote de cada produto precificado. É uma referência de
    -- comparação, não uma projeção de vendas.
    (
      select coalesce(sum(c.profit_per_unit * c.yield_quantity), 0)
      from public.pricing_calculations c, meu_negocio b
      where c.business_id = b.id
    ),
    (
      select count(*)
      from public.pricing_calculations c, meu_negocio b
      where c.business_id = b.id and c.margin_percentage < 25
    )::integer,
    (
      select count(*)
      from public.pricing_calculations c, meu_negocio b
      where c.business_id = b.id and c.sale_price < c.minimum_price
    )::integer;
$$;

revoke all on function public.dashboard_summary() from public, anon;
grant execute on function public.dashboard_summary() to authenticated;
