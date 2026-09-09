import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/app/page-header';
import { DeleteForm } from '@/components/forms/delete-form';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge, EmptyState } from '@/components/ui/feedback';
import { IconHistory, IconPrice } from '@/components/ui/icons';
import { formatCurrency, formatDateTime, formatMarkup, formatPercent } from '@/lib/format';
import { deleteHistoryEntryAction, deletePricingAction } from '@/server/actions/pricing';
import { duplicateProductAction } from '@/server/actions/products';
import { requireContext } from '@/server/context';
import { listPricingHistory, listSavedPricings } from '@/server/queries';

import { DuplicateButton } from './duplicate-button';

export const metadata: Metadata = {
  title: 'Histórico',
  robots: { index: false, follow: false },
};

export default async function HistoryPage() {
  const { business } = await requireContext();
  const [pricings, history] = await Promise.all([
    listSavedPricings(business.id),
    listPricingHistory(business.id),
  ]);

  return (
    <>
      <PageHeader
        title="Histórico"
        description="Os preços vigentes e o registro de cada precificação salva."
      />

      <div className="space-y-6">
        <Card>
          <CardHeader
            title="Preços vigentes"
            description="O preço atual de cada produto precificado."
            action={
              pricings.length > 0 ? (
                <ButtonLink href="/precificar" variant="secondary" size="sm">
                  Precificar
                </ButtonLink>
              ) : null
            }
          />

          {pricings.length === 0 ? (
            <EmptyState
              icon={<IconPrice className="h-5 w-5" />}
              title="Nenhum preço salvo ainda"
              description="Depois de calcular um produto, salve a precificação para acompanhar seus preços por aqui."
              action={<ButtonLink href="/precificar">Ir para precificação</ButtonLink>}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[42rem] text-sm">
                <caption className="sr-only">Preços vigentes por produto</caption>
                <thead>
                  <tr className="border-b border-sand-100 text-left text-xs font-medium text-sand-500">
                    <th scope="col" className="px-5 py-3 sm:px-6">
                      Produto
                    </th>
                    <th scope="col" className="px-3 py-3 text-right">
                      Custo
                    </th>
                    <th scope="col" className="px-3 py-3 text-right">
                      Preço
                    </th>
                    <th scope="col" className="px-3 py-3 text-right">
                      Margem
                    </th>
                    <th scope="col" className="px-3 py-3 text-right">
                      Markup
                    </th>
                    <th scope="col" className="px-3 py-3 text-right">
                      Atualizado
                    </th>
                    <th scope="col" className="px-5 py-3 text-right sm:px-6">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100">
                  {pricings.map((item) => (
                    <tr key={item.id}>
                      <th scope="row" className="px-5 py-3.5 text-left font-medium sm:px-6">
                        <Link
                          href={`/precificar/${item.product_id}`}
                          className="text-sand-900 hover:text-rose-700"
                        >
                          {item.product?.name ?? 'Produto removido'}
                        </Link>
                        {item.sale_price < item.minimum_price ? (
                          <span className="ml-2 align-middle">
                            <Badge tone="danger">Abaixo do mínimo</Badge>
                          </span>
                        ) : null}
                      </th>
                      <td className="px-3 py-3.5 text-right tabular-nums text-sand-600">
                        {formatCurrency(item.unit_cost)}
                      </td>
                      <td className="px-3 py-3.5 text-right font-medium tabular-nums text-sand-900">
                        {formatCurrency(item.sale_price)}
                      </td>
                      <td className="px-3 py-3.5 text-right tabular-nums text-sand-600">
                        {formatPercent(item.margin_percent)}
                      </td>
                      <td className="px-3 py-3.5 text-right tabular-nums text-sand-600">
                        {formatMarkup(item.markup)}
                      </td>
                      <td className="px-3 py-3.5 text-right text-xs text-sand-400">
                        {formatDateTime(item.updated_at)}
                      </td>
                      <td className="px-5 py-3.5 sm:px-6">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/precificar/${item.product_id}`}
                            className="inline-flex h-9 items-center rounded-xl px-3 text-xs text-sand-600 hover:bg-sand-100"
                          >
                            Recalcular
                          </Link>
                          {item.product ? (
                            <DuplicateButton
                              id={item.product_id}
                              action={duplicateProductAction}
                            />
                          ) : null}
                          <DeleteForm
                            id={item.product_id}
                            action={deletePricingAction}
                            confirmation="Remover este preço?"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Registro de precificações"
            description="Cada vez que você salva um preço, guardamos o retrato dos custos daquele momento."
          />

          {history.length === 0 ? (
            <EmptyState
              icon={<IconHistory className="h-5 w-5" />}
              title="Seu histórico começa na primeira precificação"
              description="Assim você consegue comparar como o custo dos seus produtos muda quando o preço dos ingredientes sobe."
            />
          ) : (
            <ul className="divide-y divide-sand-100">
              {history.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 sm:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sand-900">{entry.product_name}</p>
                    <p className="mt-0.5 text-xs text-sand-500">
                      {formatDateTime(entry.created_at)} · custo {formatCurrency(entry.unit_cost)} ·
                      preço {formatCurrency(entry.sale_price)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium tabular-nums text-sand-800">
                      {formatPercent(entry.margin_percent)}
                    </p>
                    <p className="text-xs text-sand-400">margem</p>
                  </div>
                  <DeleteForm
                    id={entry.id}
                    action={deleteHistoryEntryAction}
                    confirmation="Apagar este registro?"
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
