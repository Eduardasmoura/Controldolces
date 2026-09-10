import type { Metadata } from 'next';

import { PageHeader } from '@/components/app/page-header';
import { IngredientFilters } from '@/components/ingredients/filters';
import { Pagination } from '@/components/ingredients/pagination';
import { IngredientRowActions } from '@/components/ingredients/row-actions';
import { ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, Badge, EmptyState } from '@/components/ui/feedback';
import { IconIngredients, IconPlus } from '@/components/ui/icons';
import { formatCurrency, formatDate, formatNumber, formatUnitCost } from '@/lib/format';
import { baseUnitOf, unitShort, type Unit } from '@/lib/pricing';
import { requireContext } from '@/server/context';
import { countIngredientUsage, listIngredientsPage } from '@/server/queries';

export const metadata: Metadata = {
  title: 'Ingredientes',
  robots: { index: false, follow: false },
};

const MENSAGENS_SUCESSO: Record<string, string> = {
  novo: 'Ingrediente adicionado com sucesso.',
  editado: 'Ingrediente atualizado.',
};

type Busca = {
  busca?: string;
  categoria?: string;
  inativos?: string;
  pagina?: string;
  salvo?: string;
};

export default async function IngredientsPage({
  searchParams,
}: {
  searchParams: Promise<Busca>;
}) {
  const [{ business }, params] = await Promise.all([requireContext(), searchParams]);

  const busca = params.busca ?? '';
  const categoria = params.categoria ?? '';
  const incluirInativos = params.inativos === '1';
  const pagina = Number(params.pagina) > 0 ? Number(params.pagina) : 1;

  const [lista, uso] = await Promise.all([
    listIngredientsPage(business.id, {
      search: busca,
      category: categoria,
      includeInactive: incluirInativos,
      page: pagina,
    }),
    countIngredientUsage(business.id),
  ]);

  const semNenhumIngrediente =
    lista.total === 0 && !busca && !categoria && !incluirInativos;

  function linkDaPagina(destino: number) {
    const query = new URLSearchParams();
    if (busca) query.set('busca', busca);
    if (categoria) query.set('categoria', categoria);
    if (incluirInativos) query.set('inativos', '1');
    if (destino > 1) query.set('pagina', String(destino));
    const texto = query.toString();
    return texto ? `/ingredientes?${texto}` : '/ingredientes';
  }

  return (
    <>
      <PageHeader
        title="Ingredientes"
        description="Cadastre os ingredientes que você usa para produzir seus produtos. O custo por grama, ml ou unidade é calculado automaticamente."
        action={
          !semNenhumIngrediente ? (
            <ButtonLink href="/ingredientes/novo">
              <IconPlus className="h-4 w-4" />
              Novo ingrediente
            </ButtonLink>
          ) : null
        }
      />

      {params.salvo && MENSAGENS_SUCESSO[params.salvo] ? (
        <Alert tone="success" className="mb-5">
          {MENSAGENS_SUCESSO[params.salvo]}
        </Alert>
      ) : null}

      {semNenhumIngrediente ? (
        <Card>
          <EmptyState
            icon={<IconIngredients className="h-5 w-5" />}
            title="Você ainda não cadastrou ingredientes."
            description="Cadastre os ingredientes que você usa nas suas receitas para começar a calcular seus custos."
            action={
              <ButtonLink href="/ingredientes/novo" size="lg">
                <IconPlus className="h-4 w-4" />
                Adicionar ingrediente
              </ButtonLink>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          <IngredientFilters
            search={busca}
            category={categoria}
            includeInactive={incluirInativos}
            total={lista.total}
          />

          <Card>
            {lista.rows.length === 0 ? (
              <EmptyState
                icon={<IconIngredients className="h-5 w-5" />}
                title="Nenhum ingrediente encontrado"
                description={
                  busca
                    ? `Nada corresponde a “${busca}”. Tente outro termo ou limpe os filtros.`
                    : 'Nenhum ingrediente nesta categoria. Tente outro filtro.'
                }
                action={
                  <ButtonLink href="/ingredientes" variant="secondary">
                    Limpar filtros
                  </ButtonLink>
                }
              />
            ) : (
              <>
                {/* Tabela a partir do tablet. No celular a mesma informação vira
                    lista — tabela de 7 colunas em 360 px é ilegível. */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-sm">
                    <caption className="sr-only">
                      Ingredientes cadastrados, com quantidade comprada, preço pago e custo por
                      unidade de medida
                    </caption>
                    <thead>
                      <tr className="border-b border-surface-border text-left text-xs font-medium text-content-subtle">
                        <th scope="col" className="px-5 py-3 sm:px-6">Ingrediente</th>
                        <th scope="col" className="px-3 py-3">Compra</th>
                        <th scope="col" className="px-3 py-3 text-right">Preço</th>
                        <th scope="col" className="px-3 py-3 text-right">Custo unitário</th>
                        <th scope="col" className="px-3 py-3">Atualizado</th>
                        <th scope="col" className="px-5 py-3 text-right sm:px-6">
                          <span className="sr-only">Ações</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {lista.rows.map((ingrediente) => {
                        const unidade = ingrediente.purchase_unit as Unit;
                        const ativo = ingrediente.archived_at === null;

                        return (
                          <tr key={ingrediente.id} className={ativo ? '' : 'opacity-60'}>
                            <th scope="row" className="px-5 py-3.5 text-left font-medium sm:px-6">
                              <span className="flex flex-wrap items-center gap-2">
                                <span className="text-content-strong">{ingrediente.name}</span>
                                {!ativo ? <Badge tone="info">Inativo</Badge> : null}
                                {ingrediente.purchase_price === 0 ? (
                                  <Badge tone="warning">Sem custo</Badge>
                                ) : null}
                              </span>
                              <span className="mt-0.5 block text-xs font-normal text-content-subtle">
                                {ingrediente.category ?? 'Sem categoria'}
                              </span>
                            </th>
                            <td className="px-3 py-3.5 tabular-nums text-content-muted">
                              {formatNumber(ingrediente.purchase_quantity)} {unitShort(unidade)}
                            </td>
                            <td className="px-3 py-3.5 text-right tabular-nums text-content-muted">
                              {formatCurrency(ingrediente.purchase_price)}
                            </td>
                            <td className="px-3 py-3.5 text-right">
                              <span className="block font-medium tabular-nums text-content-strong">
                                {formatUnitCost(ingrediente.unit_cost)}
                              </span>
                              <span className="block text-xs text-content-subtle">
                                por {unitShort(baseUnitOf(unidade))}
                              </span>
                            </td>
                            <td className="px-3 py-3.5 text-xs text-content-subtle">
                              {formatDate(ingrediente.updated_at)}
                            </td>
                            <td className="px-5 py-3.5 sm:px-6">
                              <IngredientRowActions
                                id={ingrediente.id}
                                name={ingrediente.name}
                                isActive={ativo}
                                usageCount={uso[ingrediente.id] ?? 0}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <ul className="divide-y divide-surface-border md:hidden">
                  {lista.rows.map((ingrediente) => {
                    const unidade = ingrediente.purchase_unit as Unit;
                    const ativo = ingrediente.archived_at === null;

                    return (
                      <li
                        key={ingrediente.id}
                        className={`px-5 py-4 ${ativo ? '' : 'opacity-60'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="flex flex-wrap items-center gap-2 font-medium text-content-strong">
                              <span className="truncate">{ingrediente.name}</span>
                              {!ativo ? <Badge tone="info">Inativo</Badge> : null}
                              {ingrediente.purchase_price === 0 ? (
                                <Badge tone="warning">Sem custo</Badge>
                              ) : null}
                            </p>
                            <p className="mt-0.5 text-xs text-content-subtle">
                              {ingrediente.category ?? 'Sem categoria'} ·{' '}
                              {formatNumber(ingrediente.purchase_quantity)} {unitShort(unidade)} por{' '}
                              {formatCurrency(ingrediente.purchase_price)}
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="font-medium tabular-nums text-content-strong">
                              {formatUnitCost(ingrediente.unit_cost)}
                            </p>
                            <p className="text-xs text-content-subtle">
                              por {unitShort(baseUnitOf(unidade))}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <p className="text-xs text-content-subtle">
                            Atualizado em {formatDate(ingrediente.updated_at)}
                          </p>
                          <IngredientRowActions
                            id={ingrediente.id}
                            name={ingrediente.name}
                            isActive={ativo}
                            usageCount={uso[ingrediente.id] ?? 0}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <Pagination
                  page={lista.page}
                  pageCount={lista.pageCount}
                  buildHref={linkDaPagina}
                />
              </>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
