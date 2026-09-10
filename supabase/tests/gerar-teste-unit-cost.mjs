// Gera o SQL que confere a coluna gerada `ingredients.unit_cost` contra os casos
// compartilhados com o teste do motor. Chamado por run.sh.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const aqui = dirname(fileURLToPath(import.meta.url));
const { casos } = JSON.parse(readFileSync(join(aqui, 'unit-cost-cases.json'), 'utf8'));

const linhas = casos
  .map(
    (caso) =>
      `  ('${caso.nome.replace(/'/g, "''")}', '${caso.unidade}'::measurement_unit, ${caso.quantidade}, ${caso.preco}, ${caso.esperado})`,
  )
  .join(',\n');

process.stdout.write(`\\echo '>>> unit_cost do banco confere com os casos compartilhados:'
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

create temporary table casos_esperados (nome text, unidade measurement_unit, quantidade numeric, preco numeric, esperado numeric);
insert into casos_esperados values
${linhas};

insert into public.ingredients (business_id, name, purchase_unit, purchase_quantity, purchase_price)
select b.id, c.nome, c.unidade, c.quantidade, c.preco
from casos_esperados c cross join public.businesses b;

select
  c.nome,
  i.unit_cost as calculado_pelo_banco,
  c.esperado,
  case when abs(i.unit_cost - c.esperado) < 1e-9 then 'ok' else 'DIVERGENTE' end as veredito
from casos_esperados c
join public.ingredients i on i.name = c.nome
order by c.nome;

do $$
declare
  divergentes integer;
begin
  select count(*) into divergentes
  from casos_esperados c
  join public.ingredients i on i.name = c.nome
  where abs(i.unit_cost - c.esperado) >= 1e-9;

  if divergentes > 0 then
    raise exception 'FALHA: % caso(s) divergem entre o banco e os casos compartilhados', divergentes;
  end if;
  raise notice 'OK: banco e casos compartilhados concordam em todos os casos';
end;
$$;

reset role;
reset request.jwt.claim.sub;
`);
