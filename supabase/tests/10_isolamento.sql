\set ON_ERROR_STOP on
\pset pager off

-- Duas usuárias, cada uma com sua confeitaria.
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'duda@example.com', '{"full_name":"Duda"}'),
  ('22222222-2222-2222-2222-222222222222', 'bia@example.com',  '{"full_name":"Bia"}');

\echo '>>> o trigger criou os perfis automaticamente:'
select count(*) as perfis_criados from public.profiles;

-- ================= USUÁRIA A =================
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into public.businesses (owner_id, name) values (auth.uid(), 'Doces da Duda');
insert into public.cost_settings (business_id, labor_hourly_rate, default_margin_percent)
select id, 25, 60 from public.businesses;

insert into public.ingredients (business_id, name, purchase_unit, purchase_quantity, purchase_price)
select id, 'Chocolate', 'kg', 1, 29.90 from public.businesses;

\echo '>>> save_product grava produto + ficha + custos numa transacao:'
select public.save_product(
  jsonb_build_object('name','Brigadeiro','yield_quantity',20,'yield_label','unidades','labor_minutes',48,'margin_percent',60),
  jsonb_build_array(jsonb_build_object(
    'ingredient_id',(select id from public.ingredients limit 1),'quantity',200,'unit','g')),
  jsonb_build_array(jsonb_build_object('label','Caixa','category','packaging','amount',0.6,'scope','unit'))
) as produto_id \gset

select
  (select count(*) from public.products)             as produtos,
  (select count(*) from public.recipes)              as receitas,
  (select count(*) from public.recipe_ingredients)   as itens_da_ficha,
  (select count(*) from public.product_extra_costs)  as custos_extras;

\echo '>>> regravar substitui a ficha em vez de duplicar (mesma receita ativa):'
select public.save_product(
  jsonb_build_object('id', :'produto_id', 'name','Brigadeiro gourmet','yield_quantity',25,'yield_label','unidades','labor_minutes',50,'margin_percent',65),
  jsonb_build_array(jsonb_build_object(
    'ingredient_id',(select id from public.ingredients limit 1),'quantity',250,'unit','g')),
  '[]'::jsonb
);
select
  (select count(*) from public.products)            as produtos,
  (select count(*) from public.recipes)             as receitas,
  (select count(*) from public.recipe_ingredients)  as itens_da_ficha,
  (select count(*) from public.product_extra_costs) as custos_extras,
  (select name from public.products)                as nome,
  (select yield_quantity from public.products)      as rendimento;

insert into public.pricing_calculations
  (business_id, product_id, sale_price, unit_cost, total_cost, minimum_price, suggested_price,
   margin_percentage, desired_margin, markup, profit_per_unit, profit_total, yield_quantity,
   ingredient_cost, packaging_cost, labor_cost, input_snapshot, breakdown)
select b.id, :'produto_id', 6.14, 2.4535, 49.07, 2.46, 6.14, 60.0, 60.0, 2.5026, 3.6865, 73.73, 20,
       5.98, 12.00, 20.00, '{}', '{}'
from public.businesses b;


\echo '>>> ingredients.unit_cost e calculado pelo banco (1 kg por R$ 29,90):'
select purchase_quantity, purchase_unit, purchase_price, unit_cost
from public.ingredients;

\echo '>>> unit_cost nao aceita escrita (coluna gerada):'
do $$
begin
  begin
    update public.ingredients set unit_cost = 999;
    raise exception 'FALHA: unit_cost aceitou escrita direta';
  exception
    when generated_always then
      raise notice 'OK: o banco recusou escrever numa coluna gerada';
  end;
end;
$$;

\echo '>>> unit_cost acompanha a mudanca de preco automaticamente:'
update public.ingredients set purchase_price = 39.90;
select purchase_price, unit_cost from public.ingredients;
update public.ingredients set purchase_price = 29.90;

\echo '>>> conversao entre unidades da mesma dimensao:'
insert into public.ingredients (business_id, name, purchase_unit, purchase_quantity, purchase_price)
select id, 'Leite condensado', 'g', 395, 6.99 from public.businesses;
insert into public.ingredients (business_id, name, purchase_unit, purchase_quantity, purchase_price)
select id, 'Leite', 'l', 1, 5.00 from public.businesses;
insert into public.ingredients (business_id, name, purchase_unit, purchase_quantity, purchase_price)
select id, 'Ovos', 'dz', 1, 12.00 from public.businesses;
select name, purchase_quantity, purchase_unit, purchase_price, unit_cost
from public.ingredients order by name;

reset role;
reset request.jwt.claim.sub;

-- ================= USUÁRIA B =================
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

insert into public.businesses (owner_id, name) values (auth.uid(), 'Bia Confeitaria');

\echo '>>> ISOLAMENTO — a usuaria B nao ve nada da usuaria A:'
select
  (select count(*) from public.businesses)            as negocios_visiveis,
  (select count(*) from public.ingredients)           as ingredientes_visiveis,
  (select count(*) from public.products)              as produtos_visiveis,
  (select count(*) from public.recipes)               as receitas_visiveis,
  (select count(*) from public.recipe_ingredients)    as itens_visiveis,
  (select count(*) from public.pricing_calculations)  as precificacoes_visiveis,
  (select count(*) from public.profiles)              as perfis_visiveis;

\echo '>>> a usuaria B nao consegue apagar o produto da usuaria A:'
delete from public.products where id = :'produto_id';
select count(*) as produtos_ainda_no_banco_para_B from public.products;

\echo '>>> nem gravar dados no negocio da usuaria A (deve falhar):'
do $$
declare
  outro uuid;
begin
  set local role postgres;
  select id into outro from public.businesses where owner_id = '11111111-1111-1111-1111-111111111111';
  set local role authenticated;
  begin
    insert into public.ingredients (business_id, name, purchase_unit, purchase_quantity, purchase_price)
    values (outro, 'Invasao', 'kg', 1, 1);
    raise exception 'FALHA DE SEGURANCA: insercao no negocio de outra usuaria foi aceita';
  exception
    when insufficient_privilege then
      raise notice 'OK: RLS bloqueou a insercao no negocio de outra usuaria';
  end;
end;
$$;

reset role;
reset request.jwt.claim.sub;

-- ================= VISÃO ADMINISTRATIVA =================
\echo '>>> com privilegios de superusuario os dados das duas existem:'
select count(*) as total_de_negocios from public.businesses;
select count(*) as total_de_produtos from public.products;

\echo '>>> pricing_history e somente-escrita-e-leitura (nao ha politica de update):'
select count(*) as politicas_de_update_no_historico
from pg_policies
where tablename = 'pricing_history' and cmd = 'UPDATE';

\echo '>>> nenhuma tabela do schema public ficou sem RLS:'
select count(*) as tabelas_sem_rls
from pg_tables t
join pg_class c on c.relname = t.tablename and c.relnamespace = 'public'::regnamespace
where t.schemaname = 'public' and not c.relrowsecurity;
