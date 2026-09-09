'use client';

import Link from 'next/link';
import { useActionState, useMemo, useState } from 'react';

import { SubmitButton } from '@/components/forms/submit-button';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { SelectField, TextAreaField, TextField } from '@/components/ui/field';
import { Alert } from '@/components/ui/feedback';
import { IconClose, IconPlus } from '@/components/ui/icons';
import { formatCurrency, formatUnitCost, parseNumberInput } from '@/lib/format';
import {
  baseUnitOf,
  calculatePricing,
  compatibleUnits,
  costPerBaseUnit,
  ingredientLineCost,
  unitShort,
  type ExtraCostCategory,
  type CostScope,
  type IndirectCostConfig,
  type Unit,
} from '@/lib/pricing';
import { saveProductAction } from '@/server/actions/products';
import { IDLE } from '@/server/form-state';

export type IngredientOption = {
  id: string;
  name: string;
  purchaseUnit: Unit;
  purchaseQuantity: number;
  purchasePrice: number;
};

export type ProductFormValues = {
  id?: string;
  name: string;
  category: string;
  yieldQuantity: string;
  yieldLabel: string;
  laborMinutes: string;
  notes: string;
  marginPercent: string;
  ingredients: { key: string; ingredientId: string; quantity: string; unit: Unit }[];
  extraCosts: { key: string; label: string; category: ExtraCostCategory; amount: string; scope: CostScope }[];
};

export type CostContext = {
  laborHourlyRate: number;
  defaultMarginPercent: number;
  minimumMarginPercent: number;
  variableFeesPercent: number;
  indirect: IndirectCostConfig;
};

const CATEGORIAS = ['Bolos', 'Tortas', 'Doces de festa', 'Brownies e cookies', 'Sobremesas', 'Outros'];

const CATEGORIAS_CUSTO: { value: ExtraCostCategory; label: string }[] = [
  { value: 'packaging', label: 'Embalagem' },
  { value: 'gas', label: 'Gás' },
  { value: 'energy', label: 'Energia' },
  { value: 'other', label: 'Outro custo' },
];

const SUGESTOES_CUSTO: { label: string; category: ExtraCostCategory; scope: CostScope }[] = [
  { label: 'Caixa', category: 'packaging', scope: 'unit' },
  { label: 'Forminha', category: 'packaging', scope: 'unit' },
  { label: 'Gás', category: 'gas', scope: 'batch' },
  { label: 'Energia', category: 'energy', scope: 'batch' },
  { label: 'Etiquetas', category: 'other', scope: 'unit' },
  { label: 'Transporte', category: 'other', scope: 'batch' },
];

function novaChave() {
  return Math.random().toString(36).slice(2, 10);
}

export function ProductForm({
  initial,
  options,
  context,
}: {
  initial: ProductFormValues;
  options: IngredientOption[];
  context: CostContext;
}) {
  const [state, action] = useActionState(saveProductAction, IDLE);

  const [yieldQuantity, setYieldQuantity] = useState(initial.yieldQuantity);
  const [laborMinutes, setLaborMinutes] = useState(initial.laborMinutes);
  const [items, setItems] = useState(initial.ingredients);
  const [extras, setExtras] = useState(initial.extraCosts);

  const optionsById = useMemo(() => new Map(options.map((option) => [option.id, option])), [options]);

  /**
   * Prévia de custo em tempo real, calculada pelo MESMO motor que o servidor usa.
   * Não existe uma segunda fórmula do lado do cliente.
   */
  const preview = useMemo(() => {
    const rendimento = parseNumberInput(yieldQuantity);
    const minutos = parseNumberInput(laborMinutes) ?? 0;
    if (!rendimento || rendimento <= 0) return null;

    const ingredientes = items.flatMap((item) => {
      const option = optionsById.get(item.ingredientId);
      const quantidade = parseNumberInput(item.quantity);
      if (!option || !quantidade || quantidade <= 0) return [];
      return [
        {
          ingredientId: option.id,
          name: option.name,
          quantity: quantidade,
          unit: item.unit,
          purchaseQuantity: option.purchaseQuantity,
          purchaseUnit: option.purchaseUnit,
          purchasePrice: option.purchasePrice,
        },
      ];
    });

    if (ingredientes.length === 0) return null;

    const outcome = calculatePricing({
      yieldQuantity: rendimento,
      ingredients: ingredientes,
      labor: minutos > 0 ? { hourlyRate: context.laborHourlyRate, minutes: minutos } : undefined,
      extras: extras.flatMap((extra) => {
        const valor = parseNumberInput(extra.amount);
        if (valor == null || valor < 0) return [];
        return [{ label: extra.label || 'Custo', category: extra.category, amount: valor, scope: extra.scope }];
      }),
      indirect: context.indirect,
      desiredMarginPercent: parseNumberInput(initial.marginPercent) ?? context.defaultMarginPercent,
      variableFeesPercent: context.variableFeesPercent,
      minimumMarginPercent: context.minimumMarginPercent,
    });

    return outcome.ok ? outcome.result : null;
  }, [yieldQuantity, laborMinutes, items, extras, optionsById, context, initial.marginPercent]);

  function adicionarIngrediente() {
    const primeiro = options[0];
    if (!primeiro) return;
    setItems((atual) => [
      ...atual,
      {
        key: novaChave(),
        ingredientId: primeiro.id,
        quantity: '',
        unit: compatibleUnits(primeiro.purchaseUnit)[0] ?? primeiro.purchaseUnit,
      },
    ]);
  }

  function trocarIngrediente(key: string, ingredientId: string) {
    const option = optionsById.get(ingredientId);
    setItems((atual) =>
      atual.map((item) =>
        item.key === key
          ? {
              ...item,
              ingredientId,
              unit: option
                ? compatibleUnits(option.purchaseUnit).includes(item.unit)
                  ? item.unit
                  : (compatibleUnits(option.purchaseUnit)[0] ?? option.purchaseUnit)
                : item.unit,
            }
          : item,
      ),
    );
  }

  function adicionarCusto(sugestao?: (typeof SUGESTOES_CUSTO)[number]) {
    setExtras((atual) => [
      ...atual,
      {
        key: novaChave(),
        label: sugestao?.label ?? '',
        category: sugestao?.category ?? 'other',
        amount: '',
        scope: sugestao?.scope ?? 'batch',
      },
    ]);
  }

  if (options.length === 0) {
    return (
      <Card>
        <CardBody className="space-y-4 py-10 text-center">
          <h2 className="font-display text-xl text-sand-900">
            Antes da receita, os ingredientes
          </h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-sand-500">
            A ficha técnica é montada a partir dos ingredientes cadastrados. Cadastre pelo menos um
            para continuar.
          </p>
          <div className="flex justify-center">
            <Link
              href="/ingredientes/novo"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-rose-600 px-5 text-white hover:bg-rose-700"
            >
              <IconPlus className="h-4 w-4" />
              Cadastrar ingrediente
            </Link>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <input
        type="hidden"
        name="ingredients"
        value={JSON.stringify(
          items
            .filter((item) => item.ingredientId && parseNumberInput(item.quantity))
            .map((item) => ({
              ingredientId: item.ingredientId,
              quantity: item.quantity,
              unit: item.unit,
            })),
        )}
      />
      <input
        type="hidden"
        name="extraCosts"
        value={JSON.stringify(
          extras
            .filter((extra) => extra.label.trim() !== '' && parseNumberInput(extra.amount) != null)
            .map((extra) => ({
              label: extra.label,
              category: extra.category,
              amount: extra.amount,
              scope: extra.scope,
            })),
        )}
      />

      {state.status === 'error' ? <Alert tone="danger">{state.message}</Alert> : null}

      <Card>
        <CardHeader title="O produto" description="Como ele aparece na sua lista." />
        <CardBody className="space-y-4">
          <TextField
            label="Nome do produto"
            name="name"
            defaultValue={initial.name}
            placeholder="Ex.: Brigadeiro gourmet"
            required
            error={state.fieldErrors?.name}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Categoria"
              name="category"
              defaultValue={initial.category}
              error={state.fieldErrors?.category}
            >
              <option value="">Sem categoria</option>
              {CATEGORIAS.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </SelectField>

            <TextField
              label="Foto (link)"
              name="photoUrl"
              type="url"
              placeholder="Opcional"
              hint="Cole o endereço de uma imagem, se quiser."
              error={state.fieldErrors?.photoUrl}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_1.2fr]">
            <TextField
              label="Rendimento"
              name="yieldQuantity"
              inputMode="decimal"
              value={yieldQuantity}
              onChange={(event) => setYieldQuantity(event.target.value)}
              placeholder="20"
              required
              hint="Quantas unidades a receita rende."
              error={state.fieldErrors?.yieldQuantity}
            />
            <TextField
              label="Unidade do rendimento"
              name="yieldLabel"
              defaultValue={initial.yieldLabel}
              placeholder="unidades"
              hint="Ex.: unidades, fatias, potes."
              error={state.fieldErrors?.yieldLabel}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Ficha técnica"
          description="Quanto de cada ingrediente entra nessa receita."
          action={
            <Button type="button" variant="secondary" size="sm" onClick={adicionarIngrediente}>
              <IconPlus className="h-4 w-4" />
              Adicionar
            </Button>
          }
        />
        <CardBody className="space-y-3">
          {items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-sand-300 px-4 py-6 text-center text-sm text-sand-500">
              Nenhum ingrediente na receita ainda. Toque em “Adicionar” para começar.
            </p>
          ) : null}

          {items.map((item) => {
            const option = optionsById.get(item.ingredientId);
            const quantidade = parseNumberInput(item.quantity);
            // Custo desta linha: converte a medida da receita para a unidade-base
            // do ingrediente antes de multiplicar.
            const custoLinha =
              option && quantidade && quantidade > 0
                ? ingredientLineCost({
                    ingredientId: option.id,
                    name: option.name,
                    quantity: quantidade,
                    unit: item.unit,
                    purchaseQuantity: option.purchaseQuantity,
                    purchaseUnit: option.purchaseUnit,
                    purchasePrice: option.purchasePrice,
                  })
                : null;

            return (
              <div
                key={item.key}
                className="rounded-2xl border border-sand-200 bg-sand-50/50 p-3 sm:p-4"
              >
                <div className="grid gap-3 sm:grid-cols-[1.6fr_0.9fr_0.9fr_auto] sm:items-end">
                  <SelectField
                    label="Ingrediente"
                    value={item.ingredientId}
                    onChange={(event) => trocarIngrediente(item.key, event.target.value)}
                  >
                    {options.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </SelectField>

                  <TextField
                    label="Quantidade"
                    inputMode="decimal"
                    value={item.quantity}
                    onChange={(event) =>
                      setItems((atual) =>
                        atual.map((row) =>
                          row.key === item.key ? { ...row, quantity: event.target.value } : row,
                        ),
                      )
                    }
                    placeholder="200"
                  />

                  <SelectField
                    label="Medida"
                    value={item.unit}
                    onChange={(event) =>
                      setItems((atual) =>
                        atual.map((row) =>
                          row.key === item.key ? { ...row, unit: event.target.value as Unit } : row,
                        ),
                      )
                    }
                  >
                    {(option ? compatibleUnits(option.purchaseUnit) : [item.unit]).map((unidade) => (
                      <option key={unidade} value={unidade}>
                        {unitShort(unidade)}
                      </option>
                    ))}
                  </SelectField>

                  <button
                    type="button"
                    onClick={() => setItems((atual) => atual.filter((row) => row.key !== item.key))}
                    className="mb-0.5 inline-flex h-11 items-center justify-center rounded-xl px-3 text-sand-500 hover:bg-sand-200 hover:text-sand-800"
                  >
                    <IconClose className="h-4 w-4" />
                    <span className="sr-only">Remover ingrediente</span>
                  </button>
                </div>

                {option ? (
                  <p className="mt-2 text-xs text-sand-500">
                    {formatUnitCost(
                      costPerBaseUnit({
                        purchaseQuantity: option.purchaseQuantity,
                        purchaseUnit: option.purchaseUnit,
                        purchasePrice: option.purchasePrice,
                      }),
                    )}{' '}
                    por {unitShort(baseUnitOf(option.purchaseUnit))}
                    {custoLinha != null ? ` · esta linha custa ${formatCurrency(custoLinha)}` : ''}
                  </p>
                ) : null}
              </div>
            );
          })}

          {state.fieldErrors?.ingredients ? (
            <p role="alert" className="text-xs font-medium text-danger-600">
              {state.fieldErrors.ingredients}
            </p>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Mão de obra e outros custos"
          description="O que sai do seu bolso além dos ingredientes."
        />
        <CardBody className="space-y-5">
          <TextField
            label="Tempo de produção (minutos)"
            name="laborMinutes"
            inputMode="numeric"
            value={laborMinutes}
            onChange={(event) => setLaborMinutes(event.target.value)}
            placeholder="45"
            hint={
              context.laborHourlyRate > 0
                ? `Sua hora está configurada em ${formatCurrency(context.laborHourlyRate)}. Ajuste em Configurações.`
                : 'Defina o valor da sua hora em Configurações para a mão de obra entrar na conta.'
            }
            error={state.fieldErrors?.laborMinutes}
          />

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-sand-700">Custos adicionais</p>
              <Button type="button" variant="secondary" size="sm" onClick={() => adicionarCusto()}>
                <IconPlus className="h-4 w-4" />
                Adicionar custo
              </Button>
            </div>

            {extras.length === 0 ? (
              <div className="mt-3">
                <p className="text-xs text-sand-500">Comece pelos mais comuns:</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SUGESTOES_CUSTO.map((sugestao) => (
                    <button
                      key={sugestao.label}
                      type="button"
                      onClick={() => adicionarCusto(sugestao)}
                      className="rounded-full border border-sand-200 bg-white px-3 py-1.5 text-xs text-sand-600 hover:border-rose-200 hover:text-rose-700"
                    >
                      + {sugestao.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-3 space-y-3">
              {extras.map((extra) => (
                <div
                  key={extra.key}
                  className="grid gap-3 rounded-2xl border border-sand-200 bg-sand-50/50 p-3 sm:grid-cols-[1.4fr_1fr_1fr_1.1fr_auto] sm:items-end sm:p-4"
                >
                  <TextField
                    label="Descrição"
                    value={extra.label}
                    onChange={(event) =>
                      setExtras((atual) =>
                        atual.map((row) =>
                          row.key === extra.key ? { ...row, label: event.target.value } : row,
                        ),
                      )
                    }
                    placeholder="Ex.: Caixa"
                  />

                  <SelectField
                    label="Tipo"
                    value={extra.category}
                    onChange={(event) =>
                      setExtras((atual) =>
                        atual.map((row) =>
                          row.key === extra.key
                            ? { ...row, category: event.target.value as ExtraCostCategory }
                            : row,
                        ),
                      )
                    }
                  >
                    {CATEGORIAS_CUSTO.map((categoria) => (
                      <option key={categoria.value} value={categoria.value}>
                        {categoria.label}
                      </option>
                    ))}
                  </SelectField>

                  <TextField
                    label="Valor"
                    inputMode="decimal"
                    prefix="R$"
                    value={extra.amount}
                    onChange={(event) =>
                      setExtras((atual) =>
                        atual.map((row) =>
                          row.key === extra.key ? { ...row, amount: event.target.value } : row,
                        ),
                      )
                    }
                    placeholder="2,00"
                  />

                  <SelectField
                    label="Cobrança"
                    value={extra.scope}
                    onChange={(event) =>
                      setExtras((atual) =>
                        atual.map((row) =>
                          row.key === extra.key ? { ...row, scope: event.target.value as CostScope } : row,
                        ),
                      )
                    }
                  >
                    <option value="unit">Por unidade</option>
                    <option value="batch">Por receita</option>
                  </SelectField>

                  <button
                    type="button"
                    onClick={() => setExtras((atual) => atual.filter((row) => row.key !== extra.key))}
                    className="mb-0.5 inline-flex h-11 items-center justify-center rounded-xl px-3 text-sand-500 hover:bg-sand-200 hover:text-sand-800"
                  >
                    <IconClose className="h-4 w-4" />
                    <span className="sr-only">Remover custo</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <TextAreaField
            label="Observações"
            name="notes"
            defaultValue={initial.notes}
            placeholder="Modo de preparo, dicas, variações. Opcional."
            error={state.fieldErrors?.notes}
          />
        </CardBody>
      </Card>

      {/* Prévia: o custo aparece antes de salvar, então nada é uma surpresa. */}
      <div className="sticky bottom-20 z-10 rounded-2xl border border-sand-200 bg-white/95 p-4 shadow-lift backdrop-blur lg:bottom-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <div>
              <p className="text-xs text-sand-500">Custo da receita</p>
              <p className="text-base font-semibold tabular-nums text-sand-900">
                {preview ? formatCurrency(preview.batch.total) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-sand-500">Custo por unidade</p>
              <p className="text-base font-semibold tabular-nums text-sand-900">
                {preview ? formatCurrency(preview.unit.total) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-sand-500">Preço sugerido</p>
              <p className="text-base font-semibold tabular-nums text-rose-700">
                {preview ? formatCurrency(preview.recommendedPrice) : '—'}
              </p>
            </div>
          </div>

          <div className="flex w-full gap-2 sm:w-auto">
            <Link
              href={initial.id ? `/precificar/${initial.id}` : '/produtos'}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-xl px-4 text-sand-600 hover:bg-sand-100 sm:flex-none"
            >
              Cancelar
            </Link>
            <SubmitButton className="flex-1 sm:flex-none" pendingLabel="Salvando...">
              {initial.id ? 'Salvar receita' : 'Salvar e precificar'}
            </SubmitButton>
          </div>
        </div>

        {!preview ? (
          <p className="mt-3 text-xs leading-relaxed text-sand-500">
            Informe o rendimento e a quantidade de pelo menos um ingrediente para ver o custo.
          </p>
        ) : null}
      </div>
    </form>
  );
}
