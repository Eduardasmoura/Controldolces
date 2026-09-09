'use client';

import Link from 'next/link';
import { useActionState, useMemo, useState } from 'react';

import { SubmitButton } from '@/components/forms/submit-button';
import { Card, CardBody } from '@/components/ui/card';
import { SelectField, TextField } from '@/components/ui/field';
import { Alert } from '@/components/ui/feedback';
import { formatUnitCost, parseNumberInput } from '@/lib/format';
import { ALL_UNITS, costPerBaseUnit, unitLabel, unitShort, baseUnitOf, type Unit } from '@/lib/pricing';
import { saveIngredientAction } from '@/server/actions/ingredients';
import { IDLE } from '@/server/form-state';

const CATEGORIAS = [
  'Chocolates',
  'Laticínios',
  'Farinhas e secos',
  'Açúcares',
  'Frutas',
  'Recheios e coberturas',
  'Embalagens',
  'Outros',
];

export type IngredientFormValues = {
  id?: string;
  name: string;
  category: string;
  supplier: string;
  purchaseUnit: Unit;
  purchaseQuantity: string;
  purchasePrice: string;
};

export function IngredientForm({ initial }: { initial: IngredientFormValues }) {
  const [state, action] = useActionState(saveIngredientAction, IDLE);
  const [unit, setUnit] = useState<Unit>(initial.purchaseUnit);
  const [quantity, setQuantity] = useState(initial.purchaseQuantity);
  const [price, setPrice] = useState(initial.purchasePrice);

  // Prévia do custo por medida: a usuária vê na hora se digitou algo errado.
  const preview = useMemo(() => {
    const purchaseQuantity = parseNumberInput(quantity);
    const purchasePrice = parseNumberInput(price);
    if (!purchaseQuantity || purchaseQuantity <= 0 || purchasePrice == null || purchasePrice < 0) {
      return null;
    }
    return {
      value: costPerBaseUnit({ purchaseQuantity, purchaseUnit: unit, purchasePrice }),
      baseUnit: baseUnitOf(unit),
    };
  }, [quantity, price, unit]);

  return (
    <Card>
      <CardBody>
        {state.status === 'error' ? (
          <Alert tone="danger" className="mb-5">
            {state.message}
          </Alert>
        ) : null}

        <form action={action} className="space-y-5" noValidate>
          {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

          <TextField
            label="Nome do ingrediente"
            name="name"
            defaultValue={initial.name}
            placeholder="Ex.: Chocolate meio amargo"
            required
            error={state.fieldErrors?.name}
          />

          <SelectField
            label="Categoria"
            name="category"
            defaultValue={initial.category}
            hint="Ajuda a encontrar o ingrediente depois."
            error={state.fieldErrors?.category}
          >
            <option value="">Sem categoria</option>
            {CATEGORIAS.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </SelectField>

          <fieldset className="space-y-5 rounded-2xl border border-sand-200 bg-sand-50/60 p-4">
            <legend className="px-1 text-sm font-medium text-sand-700">Como você compra</legend>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Quantidade comprada"
                name="purchaseQuantity"
                inputMode="decimal"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                placeholder="1"
                required
                hint="O tamanho da embalagem que você compra."
                error={state.fieldErrors?.purchaseQuantity}
              />

              <SelectField
                label="Unidade de compra"
                name="purchaseUnit"
                value={unit}
                onChange={(event) => setUnit(event.target.value as Unit)}
                required
                error={state.fieldErrors?.purchaseUnit}
              >
                {ALL_UNITS.map((option) => (
                  <option key={option} value={option}>
                    {unitLabel(option)}
                  </option>
                ))}
              </SelectField>
            </div>

            <TextField
              label="Preço pago"
              name="purchasePrice"
              inputMode="decimal"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              prefix="R$"
              placeholder="29,90"
              required
              hint="O valor da embalagem inteira, não do que você usa na receita."
              error={state.fieldErrors?.purchasePrice}
            />

            {preview ? (
              <div className="rounded-xl border border-rose-200 bg-white px-4 py-3">
                <p className="text-xs font-medium text-sand-500">Custo calculado</p>
                <p className="mt-0.5 text-sm text-sand-800">
                  <strong className="font-semibold tabular-nums">
                    {formatUnitCost(preview.value)}
                  </strong>{' '}
                  por {unitShort(preview.baseUnit)}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-sand-500">
                  É esse valor que o sistema usa ao multiplicar pela quantidade da receita.
                </p>
              </div>
            ) : null}
          </fieldset>

          <TextField
            label="Fornecedor"
            name="supplier"
            defaultValue={initial.supplier}
            placeholder="Opcional"
            error={state.fieldErrors?.supplier}
          />

          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <SubmitButton size="lg" className="sm:min-w-40" pendingLabel="Salvando...">
              {initial.id ? 'Salvar alterações' : 'Cadastrar ingrediente'}
            </SubmitButton>
            <Link
              href="/ingredientes"
              className="inline-flex h-12 items-center justify-center rounded-xl px-6 text-sand-600 hover:bg-sand-100"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
