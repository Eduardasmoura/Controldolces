-- =============================================================================
-- Gravação atômica de produto + ficha técnica + custos adicionais.
--
-- Salvar uma receita toca três tabelas. Feito em chamadas separadas pela API,
-- uma falha no meio deixaria a ficha técnica pela metade — e uma ficha
-- incompleta gera um preço errado. Esta função resolve tudo numa transação.
--
-- SECURITY INVOKER: roda com os privilégios de quem chamou, então o RLS
-- continua valendo. A função não é um atalho para escapar do isolamento.
-- =============================================================================

create or replace function public.save_product(
  p_product jsonb,
  p_ingredients jsonb,
  p_extras jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_business uuid;
  v_product uuid;
  v_recipe uuid;
begin
  select id into v_business
  from public.businesses
  where owner_id = auth.uid()
  order by created_at
  limit 1;

  if v_business is null then
    raise exception 'SEM_NEGOCIO';
  end if;

  if jsonb_typeof(p_ingredients) <> 'array' or jsonb_array_length(p_ingredients) = 0 then
    raise exception 'RECEITA_SEM_INGREDIENTES';
  end if;

  v_product := nullif(p_product ->> 'id', '')::uuid;

  if v_product is null then
    insert into public.products (
      business_id, name, category, description, photo_url,
      yield_quantity, yield_label, labor_minutes, margin_percent, notes
    )
    values (
      v_business,
      p_product ->> 'name',
      nullif(p_product ->> 'category', ''),
      nullif(p_product ->> 'description', ''),
      nullif(p_product ->> 'photo_url', ''),
      (p_product ->> 'yield_quantity')::numeric,
      coalesce(nullif(p_product ->> 'yield_label', ''), 'unidades'),
      coalesce((p_product ->> 'labor_minutes')::integer, 0),
      nullif(p_product ->> 'margin_percent', '')::numeric,
      nullif(p_product ->> 'notes', '')
    )
    returning id into v_product;
  else
    update public.products
    set name = p_product ->> 'name',
        category = nullif(p_product ->> 'category', ''),
        description = nullif(p_product ->> 'description', ''),
        photo_url = nullif(p_product ->> 'photo_url', ''),
        yield_quantity = (p_product ->> 'yield_quantity')::numeric,
        yield_label = coalesce(nullif(p_product ->> 'yield_label', ''), 'unidades'),
        labor_minutes = coalesce((p_product ->> 'labor_minutes')::integer, 0),
        margin_percent = nullif(p_product ->> 'margin_percent', '')::numeric,
        notes = nullif(p_product ->> 'notes', '')
    where id = v_product
      and business_id = v_business;

    if not found then
      raise exception 'PRODUTO_NAO_ENCONTRADO';
    end if;
  end if;

  -- Ficha técnica ativa do produto; criada na primeira gravação.
  select id into v_recipe
  from public.recipes
  where product_id = v_product and is_active
  limit 1;

  if v_recipe is null then
    insert into public.recipes (product_id, business_id, version, is_active)
    values (v_product, v_business, 1, true)
    returning id into v_recipe;
  end if;

  -- A lista de ingredientes é substituída por inteiro: é o retrato atual da ficha.
  delete from public.recipe_ingredients where recipe_id = v_recipe;

  insert into public.recipe_ingredients (recipe_id, business_id, ingredient_id, quantity, unit, position)
  select
    v_recipe,
    v_business,
    (item ->> 'ingredient_id')::uuid,
    (item ->> 'quantity')::numeric,
    (item ->> 'unit')::measurement_unit,
    (ordinality - 1)::integer
  from jsonb_array_elements(p_ingredients) with ordinality as t(item, ordinality);

  delete from public.product_extra_costs where product_id = v_product;

  if jsonb_typeof(p_extras) = 'array' then
    insert into public.product_extra_costs (product_id, business_id, label, category, amount, scope, position)
    select
      v_product,
      v_business,
      item ->> 'label',
      (item ->> 'category')::extra_cost_category,
      (item ->> 'amount')::numeric,
      (item ->> 'scope')::cost_scope,
      (ordinality - 1)::integer
    from jsonb_array_elements(p_extras) with ordinality as t(item, ordinality);
  end if;

  return v_product;
end;
$$;

revoke all on function public.save_product(jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.save_product(jsonb, jsonb, jsonb) to authenticated;
