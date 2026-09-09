import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/app/page-header';
import { PricingWorkbench } from '@/components/pricing/pricing-workbench';
import { Alert } from '@/components/ui/feedback';
import { IconEdit } from '@/components/ui/icons';
import { requireContext } from '@/server/context';
import { buildPricingInput } from '@/server/pricing';
import { getProductDetail, listSavedPricings } from '@/server/queries';

export const metadata: Metadata = {
  title: 'Precificação',
  robots: { index: false, follow: false },
};

export default async function PricingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ salvo?: string }>;
}) {
  const [{ business, settings }, { id }, query] = await Promise.all([
    requireContext(),
    params,
    searchParams,
  ]);

  const detail = await getProductDetail(business.id, id);
  if (!detail) notFound();

  const pricings = await listSavedPricings(business.id);
  const salvo = pricings.find((item) => item.product_id === id) ?? null;

  return (
    <>
      <PageHeader
        title={detail.product.name}
        description="Custo real, preço mínimo, preço recomendado e simulador."
        action={
          <Link
            href={`/produtos/${detail.product.id}`}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-sand-200 bg-white px-4 text-sm text-sand-700 hover:border-sand-300"
          >
            <IconEdit className="h-4 w-4" />
            Editar receita
          </Link>
        }
      />

      {query.salvo ? (
        <Alert tone="success" className="mb-5">
          Receita salva. Confira o custo e defina o preço abaixo.
        </Alert>
      ) : null}

      <PricingWorkbench
        productId={detail.product.id}
        productName={detail.product.name}
        yieldLabel={detail.product.yield_label}
        input={buildPricingInput(detail, settings)}
        savedSalePrice={salvo?.sale_price ?? null}
      />
    </>
  );
}
