import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/app/page-header';
import { requireContext } from '@/server/context';
import { getIngredient } from '@/server/queries';
import type { Unit } from '@/lib/pricing';

import { IngredientForm } from '../ingredient-form';

export const metadata: Metadata = {
  title: 'Editar ingrediente',
  robots: { index: false, follow: false },
};

export default async function EditIngredientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ business }, { id }] = await Promise.all([requireContext(), params]);
  const ingredient = await getIngredient(business.id, id);
  if (!ingredient) notFound();

  return (
    <>
      <PageHeader
        title="Editar ingrediente"
        description="Ao mudar o preço de compra, guardamos o valor anterior no histórico do insumo."
      />
      <IngredientForm
        initial={{
          id: ingredient.id,
          name: ingredient.name,
          category: ingredient.category ?? '',
          supplier: ingredient.supplier ?? '',
          purchaseUnit: ingredient.purchase_unit as Unit,
          purchaseQuantity: String(ingredient.purchase_quantity),
          purchasePrice: String(ingredient.purchase_price),
        }}
      />
    </>
  );
}
