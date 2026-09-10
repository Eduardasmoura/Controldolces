-- =============================================================================
-- Blindagem da divisão nas colunas de custo por unidade-base.
--
-- Sem NULLIF, uma quantidade zero faz a coluna gerada dividir por zero — e esse
-- erro dispara ANTES da restrição CHECK, então a usuária receberia
-- "division by zero" no lugar de "a quantidade precisa ser maior que zero".
--
-- Com NULLIF, o cálculo devolve NULL e o CHECK cumpre o papel dele: recusar a
-- linha com a mensagem certa. Em linhas válidas nada muda, porque quantidade
-- zero nunca é aceita.
--
-- Colunas geradas não aceitam ALTER da expressão: é preciso remover e recriar.
-- =============================================================================

alter table public.ingredients drop column if exists unit_cost;

alter table public.ingredients
  add column unit_cost numeric
  generated always as (
    purchase_price / nullif(purchase_quantity * public.unit_base_factor(purchase_unit), 0)
  ) stored;

comment on column public.ingredients.unit_cost is
  'Custo por grama, mililitro ou unidade. Calculado pelo banco; não aceita escrita.';

alter table public.ingredient_prices drop column if exists unit_cost;

alter table public.ingredient_prices
  add column unit_cost numeric
  generated always as (
    purchase_price / nullif(purchase_quantity * public.unit_base_factor(purchase_unit), 0)
  ) stored;

comment on column public.ingredient_prices.unit_cost is
  'Custo por unidade-base no momento em que este preço valia.';
