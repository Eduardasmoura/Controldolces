import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/app/page-header';
import { Alert } from '@/components/ui/feedback';
import type { Unit } from '@/lib/pricing';
import { requireContext } from '@/server/context';
import { getProductDetail, listIngredients } from '@/server/queries';

import { toCostContext, toIngredientOptions } from '../product-context';
import { ProductForm } from '../product-form';

export const metadata: Metadata = {
  title: 'Editar receita',
  robots: { index: false, follow: false },
};

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ duplicado?: string }>;
}) {
  const [{ business, settings }, { id }, query] = await Promise.all([
    requireContext(),
    params,
    searchParams,
  ]);

  const [detail, ingredients] = await Promise.all([
    getProductDetail(business.id, id),
    listIngredients(business.id),
  ]);

  if (!detail) notFound();

  return (
    <>
      <PageHeader
        title="Editar receita"
        description="Alterar a ficha técnica muda o custo. Recalcule a precificação depois de salvar."
      />

      {query.duplicado ? (
        <Alert tone="success" className="mb-5">
          Receita duplicada. Ajuste o que precisar e salve para gerar a nova precificação.
        </Alert>
      ) : null}

      <ProductForm
        options={toIngredientOptions(ingredients)}
        context={toCostContext(settings)}
        initial={{
          id: detail.product.id,
          name: detail.product.name,
          category: detail.product.category ?? '',
          yieldQuantity: String(detail.product.yield_quantity),
          yieldLabel: detail.product.yield_label,
          laborMinutes: detail.product.labor_minutes ? String(detail.product.labor_minutes) : '',
          notes: detail.product.notes ?? '',
          marginPercent:
            detail.product.margin_percent == null ? '' : String(detail.product.margin_percent),
          ingredients: detail.items.map((item) => ({
            key: item.id,
            ingredientId: item.ingredient_id,
            quantity: String(item.quantity),
            unit: item.unit as Unit,
          })),
          extraCosts: detail.extras.map((extra) => ({
            key: extra.id,
            label: extra.label,
            category: extra.category,
            amount: String(extra.amount),
            scope: extra.scope,
          })),
        }}
      />
    </>
  );
}
