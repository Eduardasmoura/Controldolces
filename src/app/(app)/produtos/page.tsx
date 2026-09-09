import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/app/page-header';
import { ProductPhoto } from '@/components/app/product-photo';
import { DeleteForm } from '@/components/forms/delete-form';
import { ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/feedback';
import { IconEdit, IconPlus, IconRecipe } from '@/components/ui/icons';
import { formatCurrency, formatNumber } from '@/lib/format';
import { deleteProductAction } from '@/server/actions/products';
import { requireContext } from '@/server/context';
import { listProducts, listSavedPricings } from '@/server/queries';

export const metadata: Metadata = {
  title: 'Receitas',
  robots: { index: false, follow: false },
};

export default async function ProductsPage() {
  const { business } = await requireContext();
  const [products, pricings] = await Promise.all([
    listProducts(business.id),
    listSavedPricings(business.id),
  ]);

  const precoPorProduto = new Map(pricings.map((item) => [item.product_id, item]));

  return (
    <>
      <PageHeader
        title="Receitas"
        description="A ficha técnica de cada produto: rendimento, ingredientes e custos."
        action={
          products.length > 0 ? (
            <ButtonLink href="/produtos/novo">
              <IconPlus className="h-4 w-4" />
              Nova receita
            </ButtonLink>
          ) : null
        }
      />

      <Card>
        {products.length === 0 ? (
          <EmptyState
            icon={<IconRecipe className="h-5 w-5" />}
            title="Você ainda não cadastrou nenhuma receita"
            description="Monte a ficha técnica do seu primeiro produto: nome, rendimento e a quantidade de cada ingrediente."
            action={
              <ButtonLink href="/produtos/novo" size="lg">
                <IconPlus className="h-4 w-4" />
                Criar primeira receita
              </ButtonLink>
            }
          />
        ) : (
          <ul className="divide-y divide-sand-100">
            {products.map((product) => {
              const preco = precoPorProduto.get(product.id);
              return (
                <li
                  key={product.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 sm:px-6"
                >
                  <ProductPhoto
                    url={product.photo_url}
                    name={product.name}
                    className="h-11 w-11"
                  />

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/precificar/${product.id}`}
                      className="block truncate font-medium text-sand-900 hover:text-rose-700"
                    >
                      {product.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-sand-500">
                      Rende {formatNumber(product.yield_quantity)} {product.yield_label}
                      {product.category ? ` · ${product.category}` : ''}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium tabular-nums text-sand-800">
                      {preco ? formatCurrency(preco.sale_price) : 'Sem preço'}
                    </p>
                    <p className="text-xs text-sand-400">
                      {preco ? `custo ${formatCurrency(preco.unit_cost)}` : 'precifique para ver'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Link
                      href={`/produtos/${product.id}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm text-sand-600 hover:bg-sand-100 hover:text-sand-800"
                    >
                      <IconEdit className="h-4 w-4" />
                      <span className="sr-only sm:not-sr-only">Editar</span>
                    </Link>
                    <DeleteForm
                      id={product.id}
                      action={deleteProductAction}
                      confirmation="Excluir esta receita?"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
