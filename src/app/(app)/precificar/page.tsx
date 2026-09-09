import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/app/page-header';
import { ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge, EmptyState } from '@/components/ui/feedback';
import { IconArrowRight, IconPlus, IconPrice } from '@/components/ui/icons';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format';
import { requireContext } from '@/server/context';
import { listProducts, listSavedPricings } from '@/server/queries';

export const metadata: Metadata = {
  title: 'Precificar',
  robots: { index: false, follow: false },
};

export default async function PricingIndexPage() {
  const { business } = await requireContext();
  const [products, pricings] = await Promise.all([
    listProducts(business.id),
    listSavedPricings(business.id),
  ]);

  const porProduto = new Map(pricings.map((item) => [item.product_id, item]));

  return (
    <>
      <PageHeader
        title="Precificar"
        description="Escolha um produto para ver o custo real e definir o preço."
        action={
          products.length > 0 ? (
            <ButtonLink href="/precificar/novo" variant="secondary">
              <IconPlus className="h-4 w-4" />
              Novo produto
            </ButtonLink>
          ) : null
        }
      />

      <Card>
        {products.length === 0 ? (
          <EmptyState
            icon={<IconPrice className="h-5 w-5" />}
            title="Nada para precificar ainda"
            description="Vamos pelo caminho guiado: em cinco passos você informa o produto, o rendimento, os ingredientes, os custos e a margem."
            action={
              <ButtonLink href="/precificar/novo" size="lg">
                Precificar meu primeiro produto
                <IconArrowRight className="h-4 w-4" />
              </ButtonLink>
            }
          />
        ) : (
          <ul className="divide-y divide-sand-100">
            {products.map((product) => {
              const preco = porProduto.get(product.id);
              return (
                <li key={product.id}>
                  <Link
                    href={`/precificar/${product.id}`}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:bg-sand-50 sm:px-6"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-sand-900">{product.name}</span>
                      <span className="mt-0.5 block text-xs text-sand-500">
                        Rende {formatNumber(product.yield_quantity)} {product.yield_label}
                      </span>
                    </span>

                    {preco ? (
                      <>
                        <span className="text-right">
                          <span className="block text-sm font-medium tabular-nums text-sand-800">
                            {formatCurrency(preco.sale_price)}
                          </span>
                          <span className="block text-xs text-sand-400">
                            margem {formatPercent(preco.margin_percent)}
                          </span>
                        </span>
                        <Badge tone={preco.margin_percent < 20 ? 'warning' : 'success'}>
                          Precificado
                        </Badge>
                      </>
                    ) : (
                      <Badge tone="info">Sem preço</Badge>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
