import type { Metadata } from 'next';

import { PageHeader } from '@/components/app/page-header';
import { requireContext } from '@/server/context';
import { listIngredients } from '@/server/queries';

import { toCostContext, toIngredientOptions } from '../product-context';
import { ProductForm } from '../product-form';

export const metadata: Metadata = {
  title: 'Nova receita',
  robots: { index: false, follow: false },
};

export default async function NewProductPage() {
  const { business, settings } = await requireContext();
  const ingredients = await listIngredients(business.id);

  return (
    <>
      <PageHeader
        title="Nova receita"
        description="Monte a ficha técnica e veja o custo aparecer enquanto você preenche."
      />
      <ProductForm
        options={toIngredientOptions(ingredients)}
        context={toCostContext(settings)}
        initial={{
          name: '',
          category: '',
          yieldQuantity: '',
          yieldLabel: 'unidades',
          laborMinutes: '',
          notes: '',
          marginPercent: '',
          ingredients: [],
          extraCosts: [],
        }}
      />
    </>
  );
}
