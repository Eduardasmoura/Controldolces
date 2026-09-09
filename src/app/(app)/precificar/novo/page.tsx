import type { Metadata } from 'next';

import { PageHeader } from '@/components/app/page-header';
import { requireContext } from '@/server/context';
import { listIngredients } from '@/server/queries';

import { toCostContext, toIngredientOptions } from '../../produtos/product-context';
import { GuidedWizard } from './guided-wizard';

export const metadata: Metadata = {
  title: 'Nova precificação',
  robots: { index: false, follow: false },
};

export default async function GuidedPricingPage() {
  const { business, settings } = await requireContext();
  const ingredients = await listIngredients(business.id);

  return (
    <>
      <PageHeader
        title="Vamos precificar seu produto"
        description="Cinco passos curtos. No fim você vê o custo real, o preço mínimo e o preço recomendado."
      />
      <GuidedWizard
        options={toIngredientOptions(ingredients)}
        context={toCostContext(settings)}
      />
    </>
  );
}
