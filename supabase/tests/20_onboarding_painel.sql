\set ON_ERROR_STOP on
\pset pager off

-- =============================================================================
-- Onboarding retomável e resumo do painel.
--
-- Verifica o que a interface promete: que fechar o navegador no meio do
-- onboarding não perde nada, que concluir não se repete, e que os números do
-- painel são contados no banco e isolados por conta.
-- =============================================================================

insert into auth.users (id, email, raw_user_meta_data) values
  ('33333333-3333-3333-3333-333333333333', 'ana@example.com',   '{"full_name":"Ana Paula"}'),
  ('44444444-4444-4444-4444-444444444444', 'carla@example.com', '{"full_name":"Carla"}');

set role authenticated;
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

\echo '>>> conta recem-criada comeca na etapa 0 e sem onboarding concluido:'
select onboarding_step, onboarding_completed_at is null as ainda_nao_concluiu
from public.profiles where id = auth.uid();

-- ---------------------------------------------------------------- etapa 1
update public.profiles set onboarding_step = 1 where id = auth.uid();

-- ---------------------------------------------------------------- etapa 2
update public.profiles set full_name = 'Ana Paula', onboarding_step = 2 where id = auth.uid();
insert into public.businesses (owner_id, name) values (auth.uid(), 'Doces da Ana');
insert into public.cost_settings (business_id) select id from public.businesses;
insert into public.subscriptions (business_id) select id from public.businesses;

\echo '>>> ABANDONO: a usuaria fecha o navegador aqui. O que o banco guardou:'
select p.onboarding_step, p.full_name, b.name as negocio,
       p.onboarding_completed_at is null as ainda_nao_concluiu
from public.profiles p join public.businesses b on b.owner_id = p.id
where p.id = auth.uid();

\echo '>>> RETOMADA: ao voltar, a etapa vem do banco (nao do navegador):'
do $$
declare
  etapa smallint;
begin
  select onboarding_step into etapa from public.profiles where id = auth.uid();
  if etapa <> 2 then
    raise exception 'FALHA: esperava retomar na etapa 2, veio %', etapa;
  end if;
  raise notice 'OK: retomaria na etapa 2 (tipo de negocio), com nome e negocio ja salvos';
end;
$$;

-- ---------------------------------------------------------------- etapa 3 e 4
update public.businesses set business_type = 'Brigadeiros' where owner_id = auth.uid();
update public.profiles set onboarding_step = 3 where id = auth.uid();
update public.businesses set main_goal = 'Parar de vender no prejuízo' where owner_id = auth.uid();
update public.profiles set onboarding_step = 4 where id = auth.uid();

-- ---------------------------------------------------------------- conclusao
update public.profiles
set onboarding_completed_at = now()
where id = auth.uid();

\echo '>>> tudo o que o onboarding coletou ficou persistido:'
select p.full_name, b.name as negocio, b.business_type as tipo, b.main_goal as objetivo,
       p.onboarding_completed_at is not null as concluido
from public.profiles p join public.businesses b on b.owner_id = p.id
where p.id = auth.uid();

\echo '>>> concluido nao se repete: o app so devolve para o onboarding se isto for nulo'
select count(*) as deveria_ser_zero
from public.profiles
where id = auth.uid() and onboarding_completed_at is null;

-- =============================================================================
-- Resumo do painel
-- =============================================================================
\echo '>>> painel de conta nova: tudo zero e medias NULAS (nao zero inventado):'
select ingredients_count, products_count, pricings_count,
       average_margin is null as margem_sem_dados,
       potential_profit
from public.dashboard_summary();

insert into public.ingredients (business_id, name, purchase_unit, purchase_quantity, purchase_price)
select id, 'Chocolate', 'kg', 1, 29.90 from public.businesses;
insert into public.ingredients (business_id, name, purchase_unit, purchase_quantity, purchase_price)
select id, 'Manteiga', 'g', 500, 25.00 from public.businesses;

select public.save_product(
  jsonb_build_object('name','Brownie','yield_quantity',16,'yield_label','unidades','labor_minutes',48),
  jsonb_build_array(jsonb_build_object(
    'ingredient_id',(select id from public.ingredients where name = 'Chocolate'),
    'quantity',400,'unit','g')),
  '[]'::jsonb
) as brownie_id \gset

\echo '>>> depois de cadastrar, as contagens sao reais:'
select ingredients_count, products_count, pricings_count from public.dashboard_summary();

insert into public.pricing_calculations
  (business_id, product_id, sale_price, unit_cost, total_cost, minimum_price, suggested_price,
   margin_percentage, desired_margin, markup, profit_per_unit, profit_total, yield_quantity,
   input_snapshot, breakdown)
select b.id, :'brownie_id', 12.00, 4.80, 76.80, 8.00, 12.00, 60.0, 60.0, 2.5, 7.20, 115.20, 16, '{}', '{}'
from public.businesses b;

\echo '>>> com precificacao salva, as medias aparecem:'
select pricings_count, average_margin, average_unit_cost, potential_profit,
       low_margin_count, below_minimum_count
from public.dashboard_summary();

\echo '>>> produto vendido abaixo do minimo entra na contagem de atencao:'
update public.pricing_calculations set sale_price = 6.00, margin_percentage = 20.0;
select low_margin_count, below_minimum_count from public.dashboard_summary();

reset role;
reset request.jwt.claim.sub;

-- =============================================================================
-- Isolamento do resumo
-- =============================================================================
set role authenticated;
set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
insert into public.businesses (owner_id, name) values (auth.uid(), 'Carla Bolos');

\echo '>>> o painel da segunda usuaria nao enxerga nada da primeira:'
select ingredients_count, products_count, pricings_count,
       average_margin is null as margem_sem_dados
from public.dashboard_summary();

do $$
declare
  r record;
begin
  select * into r from public.dashboard_summary();
  if r.ingredients_count <> 0 or r.products_count <> 0 or r.pricings_count <> 0 then
    raise exception 'FALHA DE ISOLAMENTO: o resumo vazou dados de outra conta';
  end if;
  raise notice 'OK: o resumo do painel respeita o isolamento por conta';
end;
$$;

reset role;
reset request.jwt.claim.sub;
