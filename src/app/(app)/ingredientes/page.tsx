import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/app/page-header';
import { DeleteForm } from '@/components/forms/delete-form';
import { ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, EmptyState } from '@/components/ui/feedback';
import { IconEdit, IconIngredients, IconPlus } from '@/components/ui/icons';
import { formatCurrency, formatNumber, formatUnitCost } from '@/lib/format';
import { baseUnitOf, costPerBaseUnit, unitShort, type Unit } from '@/lib/pricing';
import { deleteIngredientAction } from '@/server/actions/ingredients';
import { requireContext } from '@/server/context';
import { countIngredientUsage, listIngredients } from '@/server/queries';

export const metadata: Metadata = {
  title: 'Ingredientes',
  robots: { index: false, follow: false },
};

export default async function IngredientsPage({
  searchParams,
}: {
  searchParams: Promise<{ salvo?: string }>;
}) {
  const [{ business }, params] = await Promise.all([requireContext(), searchParams]);
  const [ingredients, usage] = await Promise.all([
    listIngredients(business.id),
    countIngredientUsage(business.id),
  ]);

  return (
    <>
      <PageHeader
        title="Ingredientes"
        description="Cadastre como você compra: o sistema descobre quanto custa cada grama, mililitro ou unidade."
        action={
          ingredients.length > 0 ? (
            <ButtonLink href="/ingredientes/novo">
              <IconPlus className="h-4 w-4" />
              Novo ingrediente
            </ButtonLink>
          ) : null
        }
      />

      {params.salvo ? (
        <Alert tone="success" className="mb-5">
          Ingrediente salvo. Ele já está disponível para usar nas suas receitas.
        </Alert>
      ) : null}

      <Card>
        {ingredients.length === 0 ? (
          <EmptyState
            icon={<IconIngredients className="h-5 w-5" />}
            title="Você ainda não cadastrou nenhum ingrediente"
            description="Cadastre seu primeiro ingrediente para começar sua precificação. Basta o nome, quanto vem na embalagem e quanto você paga."
            action={
              <ButtonLink href="/ingredientes/novo" size="lg">
                <IconPlus className="h-4 w-4" />
                Adicionar ingrediente
              </ButtonLink>
            }
          />
        ) : (
          <ul className="divide-y divide-sand-100">
            {ingredients.map((ingredient) => {
              const unit = ingredient.purchase_unit as Unit;
              const custoPorMedida = costPerBaseUnit({
                purchaseQuantity: ingredient.purchase_quantity,
                purchaseUnit: unit,
                purchasePrice: ingredient.purchase_price,
              });
              const emUso = usage[ingredient.id] ?? 0;

              return (
                <li
                  key={ingredient.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 sm:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sand-900">{ingredient.name}</p>
                    <p className="mt-0.5 text-xs text-sand-500">
                      {formatNumber(ingredient.purchase_quantity)} {unitShort(unit)} ·{' '}
                      {formatCurrency(ingredient.purchase_price)}
                      {ingredient.category ? ` · ${ingredient.category}` : ''}
                      {emUso > 0 ? ` · em ${emUso} receita${emUso > 1 ? 's' : ''}` : ''}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium tabular-nums text-sand-800">
                      {formatUnitCost(custoPorMedida)}
                    </p>
                    <p className="text-xs text-sand-400">por {unitShort(baseUnitOf(unit))}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Link
                      href={`/ingredientes/${ingredient.id}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm text-sand-600 hover:bg-sand-100 hover:text-sand-800"
                    >
                      <IconEdit className="h-4 w-4" />
                      <span className="sr-only sm:not-sr-only">Editar</span>
                    </Link>
                    <DeleteForm
                      id={ingredient.id}
                      action={deleteIngredientAction}
                      confirmation="Excluir este ingrediente?"
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
