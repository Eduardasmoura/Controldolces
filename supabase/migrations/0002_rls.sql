-- =============================================================================
-- ControlDolces — Row Level Security
--
-- Regra única do sistema: uma usuária só enxerga (e só escreve) linhas cujo
-- business_id pertence a um negócio do qual ela é dona. Isso vale mesmo que
-- alguém chame a API do Supabase diretamente, ignorando o frontend.
-- =============================================================================

alter table public.profiles              enable row level security;
alter table public.businesses            enable row level security;
alter table public.ingredients           enable row level security;
alter table public.ingredient_prices     enable row level security;
alter table public.products              enable row level security;
alter table public.recipes               enable row level security;
alter table public.recipe_ingredients    enable row level security;
alter table public.product_extra_costs   enable row level security;
alter table public.cost_settings         enable row level security;
alter table public.pricing_calculations  enable row level security;
alter table public.pricing_history       enable row level security;
alter table public.subscriptions         enable row level security;

-- Nenhuma tabela é exposta ao papel anônimo por padrão.
revoke all on all tables in schema public from anon;

-- -----------------------------------------------------------------------------
-- profiles — cada usuária cuida do próprio perfil
-- -----------------------------------------------------------------------------
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- -----------------------------------------------------------------------------
-- businesses — a dona é quem manda
-- -----------------------------------------------------------------------------
create policy "businesses_select_own" on public.businesses
  for select using (owner_id = auth.uid());
create policy "businesses_insert_own" on public.businesses
  for insert with check (owner_id = auth.uid());
create policy "businesses_update_own" on public.businesses
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "businesses_delete_own" on public.businesses
  for delete using (owner_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Demais tabelas: política idêntica baseada em business_id.
-- Gerada em laço para que nenhuma tabela fique esquecida sem proteção.
-- -----------------------------------------------------------------------------
do $$
declare
  target text;
begin
  foreach target in array array[
    'ingredients', 'ingredient_prices', 'products', 'recipes',
    'recipe_ingredients', 'product_extra_costs', 'cost_settings',
    'pricing_calculations', 'pricing_history', 'subscriptions'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select using (business_id in (select public.owned_business_ids()))',
      target || '_select_own', target
    );
    execute format(
      'create policy %I on public.%I for insert with check (business_id in (select public.owned_business_ids()))',
      target || '_insert_own', target
    );
    execute format(
      'create policy %I on public.%I for update using (business_id in (select public.owned_business_ids())) with check (business_id in (select public.owned_business_ids()))',
      target || '_update_own', target
    );
    execute format(
      'create policy %I on public.%I for delete using (business_id in (select public.owned_business_ids()))',
      target || '_delete_own', target
    );
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- pricing_history é um log: pode nascer e ser apagado, mas não reescrito.
-- -----------------------------------------------------------------------------
drop policy "pricing_history_update_own" on public.pricing_history;

-- -----------------------------------------------------------------------------
-- Storage: fotos dos produtos, isoladas por usuária.
-- O primeiro trecho do caminho é o id da usuária: `<user_id>/<arquivo>`.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true)
on conflict (id) do nothing;

create policy "product_photos_read" on storage.objects
  for select using (bucket_id = 'product-photos');

create policy "product_photos_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'product-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "product_photos_update_own" on storage.objects
  for update using (
    bucket_id = 'product-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "product_photos_delete_own" on storage.objects
  for delete using (
    bucket_id = 'product-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
