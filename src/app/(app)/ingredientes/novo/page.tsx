import type { Metadata } from 'next';

import { PageHeader } from '@/components/app/page-header';
import { requireContext } from '@/server/context';

import { IngredientForm } from '../ingredient-form';

export const metadata: Metadata = {
  title: 'Novo ingrediente',
  robots: { index: false, follow: false },
};

export default async function NewIngredientPage() {
  await requireContext();

  return (
    <>
      <PageHeader
        title="Novo ingrediente"
        description="Informe o tamanho da embalagem e o valor pago. O custo por medida é calculado automaticamente."
      />
      <IngredientForm
        initial={{
          name: '',
          category: '',
          supplier: '',
          notes: '',
          purchaseUnit: 'kg',
          purchaseQuantity: '',
          purchasePrice: '',
        }}
      />
    </>
  );
}
