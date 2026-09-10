\set ON_ERROR_STOP on
\pset pager off

-- =============================================================================
-- Módulo de ingredientes: conversão, histórico de preços e isolamento.
-- =============================================================================

insert into auth.users (id, email) values
  ('55555555-5555-5555-5555-555555555555', 'ingred-a@example.com'),
  ('66666666-6666-6666-6666-666666666666', 'ingred-b@example.com');

-- ================= USUÁRIA A =================
set role authenticated;
set request.jwt.claim.sub = '55555555-5555-5555-5555-555555555555';
insert into public.businesses (owner_id, name) values (auth.uid(), 'Confeitaria A');

\echo '>>> conversao por dimensao, direto do banco:'
insert into public.ingredients (business_id, name, category, purchase_unit, purchase_quantity, purchase_price)
select b.id, c.nome, c.categoria, c.unidade, c.quantidade, c.preco
from public.businesses b,
(values
  ('Chocolate A',   'Chocolates', 'kg'::measurement_unit, 1,   30.00),
  ('Farinha',       'Farinhas',   'g'::measurement_unit,  500, 15.00),
  ('Leite',         'Laticínios', 'l'::measurement_unit,  1,   10.00),
  ('Essência',      'Outros',     'ml'::measurement_unit, 30,  12.00),
  ('Ovos',          NULL,         'un'::measurement_unit, 10,  20.00),
  ('Ovos da caixa', NULL,         'un'::measurement_unit, 30,  24.00),
  ('Manteiga',      'Laticínios', 'kg'::measurement_unit, 2,   40.00),
  ('Morango',       'Frutas',     'g'::measurement_unit,  300, 12.00),
  ('Brinde',        'Outros',     'kg'::measurement_unit, 1,   0.00)
) as c(nome, categoria, unidade, quantidade, preco);

select name, purchase_quantity || ' ' || purchase_unit as compra, purchase_price,
       unit_cost, public.base_unit_of(purchase_unit) as por
from public.ingredients order by name;

\echo '>>> os casos da FASE 4 conferem:'
do $$
declare
  faltou integer;
begin
  select count(*) into faltou from (values
    ('Chocolate A',   0.03),
    ('Farinha',       0.03),
    ('Leite',         0.01),
    ('Essência',      0.40),
    ('Ovos',          2.00),
    ('Ovos da caixa', 0.80),
    ('Manteiga',      0.02),
    ('Morango',       0.04),
    ('Brinde',        0.00)
  ) as esperado(nome, valor)
  join public.ingredients i on i.name = esperado.nome
  where abs(i.unit_cost - esperado.valor) >= 1e-9;

  if faltou > 0 then
    raise exception 'FALHA: % ingrediente(s) com custo unitario divergente', faltou;
  end if;
  raise notice 'OK: todos os custos unitarios conferem';
end;
$$;

\echo '>>> preco zero e aceito (ingrediente ganhado), mas negativo nao:'
do $$
begin
  begin
    insert into public.ingredients (business_id, name, purchase_unit, purchase_quantity, purchase_price)
    select id, 'Preco negativo', 'kg', 1, -5 from public.businesses;
    raise exception 'FALHA: o banco aceitou preco negativo';
  exception when check_violation then
    raise notice 'OK: preco negativo recusado pelo banco';
  end;

  -- Quantidade zero precisa cair na restrição CHECK, com a mensagem certa, e não
  -- numa divisão por zero vinda da coluna gerada.
  begin
    insert into public.ingredients (business_id, name, purchase_unit, purchase_quantity, purchase_price)
    select id, 'Quantidade zero', 'kg', 0, 10 from public.businesses;
    raise exception 'FALHA: o banco aceitou quantidade zero';
  exception
    when check_violation then
      raise notice 'OK: quantidade zero recusada pela restricao (nao por divisao por zero)';
    when division_by_zero then
      raise exception 'FALHA: quantidade zero estourou divisao por zero antes do CHECK';
  end;

  begin
    insert into public.ingredients (business_id, name, purchase_unit, purchase_quantity, purchase_price)
    select id, 'Quantidade negativa', 'kg', -1, 10 from public.businesses;
    raise exception 'FALHA: o banco aceitou quantidade negativa';
  exception when check_violation then
    raise notice 'OK: quantidade negativa recusada pelo banco';
  end;
end;
$$;

\echo '>>> historico de preco guarda a quantidade normalizada e o custo daquele dia:'
insert into public.ingredient_prices (ingredient_id, business_id, purchase_unit, purchase_quantity, purchase_price)
select i.id, i.business_id, 'kg', 1, 29.90 from public.ingredients i where i.name = 'Chocolate A';
insert into public.ingredient_prices (ingredient_id, business_id, purchase_unit, purchase_quantity, purchase_price)
select i.id, i.business_id, 'kg', 1, 34.90 from public.ingredients i where i.name = 'Chocolate A';

select purchase_price, normalized_quantity, normalized_unit, unit_cost
from public.ingredient_prices order by recorded_at;

\echo '>>> desativar preserva o ingrediente e o historico:'
update public.ingredients set archived_at = now() where name = 'Chocolate A';
select
  (select count(*) from public.ingredients where name = 'Chocolate A' and archived_at is not null) as continua_existindo,
  (select count(*) from public.ingredients where archived_at is null) as ativos,
  (select count(*) from public.ingredient_prices) as historico_intacto;

update public.ingredients set archived_at = null where name = 'Chocolate A';

\echo '>>> busca por nome encontra as tres variacoes:'
insert into public.ingredients (business_id, name, category, purchase_unit, purchase_quantity, purchase_price)
select b.id, n, 'Chocolates', 'kg', 1, 30 from public.businesses b,
  (values ('Chocolate ao leite'), ('Chocolate meio amargo'), ('Chocolate branco')) as t(n);
select count(*) as encontrados_por_choco from public.ingredients where name ilike '%choco%';

reset role;
reset request.jwt.claim.sub;

-- ================= USUÁRIA B: isolamento =================
set role authenticated;
set request.jwt.claim.sub = '66666666-6666-6666-6666-666666666666';
insert into public.businesses (owner_id, name) values (auth.uid(), 'Confeitaria B');

\echo '>>> a usuaria B nao consulta o Chocolate A:'
select count(*) as deveria_ser_zero from public.ingredients where name = 'Chocolate A';

\echo '>>> nem edita, nem exclui, nem le o historico dele:'
do $$
declare
  afetadas integer;
begin
  update public.ingredients set purchase_price = 1 where name = 'Chocolate A';
  get diagnostics afetadas = row_count;
  if afetadas <> 0 then
    raise exception 'FALHA DE SEGURANCA: B editou % linha(s) de A', afetadas;
  end if;

  delete from public.ingredients where name = 'Chocolate A';
  get diagnostics afetadas = row_count;
  if afetadas <> 0 then
    raise exception 'FALHA DE SEGURANCA: B excluiu % linha(s) de A', afetadas;
  end if;

  select count(*) into afetadas from public.ingredient_prices;
  if afetadas <> 0 then
    raise exception 'FALHA DE SEGURANCA: B leu % linha(s) do historico de A', afetadas;
  end if;

  raise notice 'OK: B nao le, nao edita e nao exclui os ingredientes de A';
end;
$$;

reset role;
reset request.jwt.claim.sub;

\echo '>>> com superusuario, os dados de A continuam la:'
select count(*) as chocolate_a_intacto from public.ingredients where name = 'Chocolate A';
