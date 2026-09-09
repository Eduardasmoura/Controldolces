'use client';

import Link from 'next/link';
import { useActionState, useMemo, useState } from 'react';

import { SubmitButton } from '@/components/forms/submit-button';
import { MarginPicker } from '@/components/pricing/margin-picker';
import { PricingResultView } from '@/components/pricing/result-view';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { SelectField, TextField } from '@/components/ui/field';
import { Alert } from '@/components/ui/feedback';
import { IconArrowRight, IconClose, IconPlus } from '@/components/ui/icons';
import { formatCurrency, formatUnitCost, parseNumberInput } from '@/lib/format';
import {
  baseUnitOf,
  calculatePricing,
  compatibleUnits,
  costPerBaseUnit,
  unitShort,
  type CostScope,
  type ExtraCostCategory,
  type Unit,
} from '@/lib/pricing';
import { saveProductAction } from '@/server/actions/products';
import { IDLE } from '@/server/form-state';

import type { CostContext, IngredientOption } from '../../produtos/product-form';

/**
 * Fluxo guiado de primeira precificação.
 *
 * Uma pergunta por tela, na ordem em que a confeiteira pensa: o que é o produto,
 * quanto rende, o que entra, o que mais custa, quanto quer ganhar. Reaproveita o
 * mesmo motor de cálculo e a mesma Server Action de gravação da receita completa.
 */

const PASSOS = ['Produto', 'Rendimento', 'Ingredientes', 'Custos', 'Margem', 'Resultado'] as const;

const SUGESTOES_CUSTO: { label: string; category: ExtraCostCategory; scope: CostScope }[] = [
  { label: 'Embalagem', category: 'packaging', scope: 'unit' },
  { label: 'Gás', category: 'gas', scope: 'batch' },
  { label: 'Energia', category: 'energy', scope: 'batch' },
];

type Linha = { key: string; ingredientId: string; quantity: string; unit: Unit };
type Extra = { key: string; label: string; category: ExtraCostCategory; amount: string; scope: CostScope };

function chave() {
  return Math.random().toString(36).slice(2, 10);
}

export function GuidedWizard({
  options,
  context,
}: {
  options: IngredientOption[];
  context: CostContext;
}) {
  const [state, action] = useActionState(saveProductAction, IDLE);
  const [passo, setPasso] = useState(0);

  const [name, setName] = useState('');
  const [yieldQuantity, setYieldQuantity] = useState('');
  const [yieldLabel, setYieldLabel] = useState('unidades');
  const [laborMinutes, setLaborMinutes] = useState('');
  const [items, setItems] = useState<Linha[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [margin, setMargin] = useState(String(context.defaultMarginPercent));

  const optionsById = useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);

  const outcome = useMemo(() => {
    const rendimento = parseNumberInput(yieldQuantity) ?? 0;
    const minutos = parseNumberInput(laborMinutes) ?? 0;

    return calculatePricing({
      yieldQuantity: rendimento,
      ingredients: items.flatMap((item) => {
        const option = optionsById.get(item.ingredientId);
        const quantidade = parseNumberInput(item.quantity);
        if (!option || !quantidade) return [];
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
      }),
      labor: minutos > 0 ? { hourlyRate: context.laborHourlyRate, minutes: minutos } : undefined,
      extras: extras.flatMap((extra) => {
        const valor = parseNumberInput(extra.amount);
        if (valor == null) return [];
        return [
          { label: extra.label || 'Custo', category: extra.category, amount: valor, scope: extra.scope },
        ];
      }),
      indirect: context.indirect,
      desiredMarginPercent: parseNumberInput(margin) ?? context.defaultMarginPercent,
      variableFeesPercent: context.variableFeesPercent,
      minimumMarginPercent: context.minimumMarginPercent,
    });
  }, [yieldQuantity, laborMinutes, items, extras, margin, optionsById, context]);

  const podeAvancar = (() => {
    switch (passo) {
      case 0:
        return name.trim().length >= 2;
      case 1:
        return (parseNumberInput(yieldQuantity) ?? 0) > 0;
      case 2:
        return items.some((item) => (parseNumberInput(item.quantity) ?? 0) > 0);
      default:
        return true;
    }
  })();

  if (options.length === 0) {
    return (
      <Card>
        <CardBody className="space-y-4 py-10 text-center">
          <h2 className="font-display text-xl text-sand-900">Comece pelos ingredientes</h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-sand-500">
            Para calcular o custo, o sistema precisa saber quanto você paga pelos insumos. Cadastre o
            primeiro — leva menos de um minuto.
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
    <div className="space-y-5">
      {/* Indicador de progresso */}
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        {PASSOS.map((titulo, indice) => (
          <li key={titulo} className="flex items-center gap-2">
            <span
              className={
                indice === passo
                  ? 'font-semibold text-rose-700'
                  : indice < passo
                    ? 'text-sand-600'
                    : 'text-sand-400'
              }
            >
              {indice + 1}. {titulo}
            </span>
            {indice < PASSOS.length - 1 ? (
              <span className="text-sand-300" aria-hidden="true">
                ›
              </span>
            ) : null}
          </li>
        ))}
      </ol>

      <form action={action} className="space-y-5">
        <input type="hidden" name="name" value={name} />
        <input type="hidden" name="yieldQuantity" value={yieldQuantity} />
        <input type="hidden" name="yieldLabel" value={yieldLabel} />
        <input type="hidden" name="laborMinutes" value={laborMinutes || '0'} />
        <input type="hidden" name="marginPercent" value={margin} />
        <input
          type="hidden"
          name="ingredients"
          value={JSON.stringify(
            items
              .filter((item) => parseNumberInput(item.quantity))
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
              .filter((extra) => extra.label.trim() && parseNumberInput(extra.amount) != null)
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
          <CardBody className="space-y-5">
            {passo === 0 ? (
              <>
                <h2 className="font-display text-xl text-sand-900">Qual produto vamos precificar?</h2>
                <TextField
                  label="Nome do produto"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex.: Bolo de chocolate"
                  autoFocus
                  required
                />
              </>
            ) : null}

            {passo === 1 ? (
              <>
                <h2 className="font-display text-xl text-sand-900">Quanto essa receita rende?</h2>
                <p className="text-sm leading-relaxed text-sand-500">
                  É a conta que divide o custo. Se a receita rende 20 brigadeiros, informe 20.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Rendimento"
                    inputMode="decimal"
                    value={yieldQuantity}
                    onChange={(event) => setYieldQuantity(event.target.value)}
                    placeholder="20"
                    required
                  />
                  <TextField
                    label="Unidade"
                    value={yieldLabel}
                    onChange={(event) => setYieldLabel(event.target.value)}
                    placeholder="unidades"
                  />
                </div>
              </>
            ) : null}

            {passo === 2 ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-xl text-sand-900">O que entra na receita?</h2>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const primeiro = options[0];
                      if (!primeiro) return;
                      setItems((atual) => [
                        ...atual,
                        {
                          key: chave(),
                          ingredientId: primeiro.id,
                          quantity: '',
                          unit: compatibleUnits(primeiro.purchaseUnit)[0] ?? primeiro.purchaseUnit,
                        },
                      ]);
                    }}
                  >
                    <IconPlus className="h-4 w-4" />
                    Adicionar
                  </Button>
                </div>

                {items.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-sand-300 px-4 py-6 text-center text-sm text-sand-500">
                    Toque em “Adicionar” e informe a quantidade de cada ingrediente.
                  </p>
                ) : null}

                {items.map((item) => {
                  const option = optionsById.get(item.ingredientId);
                  return (
                    <div key={item.key} className="rounded-2xl border border-sand-200 bg-sand-50/50 p-3">
                      <div className="grid gap-3 sm:grid-cols-[1.6fr_0.9fr_0.9fr_auto] sm:items-end">
                        <SelectField
                          label="Ingrediente"
                          value={item.ingredientId}
                          onChange={(event) => {
                            const novo = optionsById.get(event.target.value);
                            setItems((atual) =>
                              atual.map((row) =>
                                row.key === item.key
                                  ? {
                                      ...row,
                                      ingredientId: event.target.value,
                                      unit: novo
                                        ? (compatibleUnits(novo.purchaseUnit)[0] ?? novo.purchaseUnit)
                                        : row.unit,
                                    }
                                  : row,
                              ),
                            );
                          }}
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
                          {(option ? compatibleUnits(option.purchaseUnit) : [item.unit]).map((u) => (
                            <option key={u} value={u}>
                              {unitShort(u)}
                            </option>
                          ))}
                        </SelectField>

                        <button
                          type="button"
                          onClick={() => setItems((atual) => atual.filter((r) => r.key !== item.key))}
                          className="mb-0.5 inline-flex h-11 items-center justify-center rounded-xl px-3 text-sand-500 hover:bg-sand-200"
                        >
                          <IconClose className="h-4 w-4" />
                          <span className="sr-only">Remover</span>
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
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </>
            ) : null}

            {passo === 3 ? (
              <>
                <h2 className="font-display text-xl text-sand-900">O que mais custa?</h2>
                <p className="text-sm leading-relaxed text-sand-500">
                  Seu tempo e os custos que não são ingrediente. Pode deixar em branco e ajustar
                  depois.
                </p>

                <TextField
                  label="Tempo de produção (minutos)"
                  inputMode="numeric"
                  value={laborMinutes}
                  onChange={(event) => setLaborMinutes(event.target.value)}
                  placeholder="45"
                  hint={
                    context.laborHourlyRate > 0
                      ? `Sua hora está em ${formatCurrency(context.laborHourlyRate)}.`
                      : 'Defina o valor da sua hora em Configurações para isso entrar na conta.'
                  }
                />

                <div className="flex flex-wrap gap-2">
                  {SUGESTOES_CUSTO.map((sugestao) => (
                    <button
                      key={sugestao.label}
                      type="button"
                      onClick={() =>
                        setExtras((atual) => [
                          ...atual,
                          {
                            key: chave(),
                            label: sugestao.label,
                            category: sugestao.category,
                            amount: '',
                            scope: sugestao.scope,
                          },
                        ])
                      }
                      className="rounded-full border border-sand-200 bg-white px-3 py-1.5 text-xs text-sand-600 hover:border-rose-200 hover:text-rose-700"
                    >
                      + {sugestao.label}
                    </button>
                  ))}
                </div>

                {extras.map((extra) => (
                  <div
                    key={extra.key}
                    className="grid gap-3 rounded-2xl border border-sand-200 bg-sand-50/50 p-3 sm:grid-cols-[1.4fr_1fr_1.1fr_auto] sm:items-end"
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
                    />
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
                    />
                    <SelectField
                      label="Cobrança"
                      value={extra.scope}
                      onChange={(event) =>
                        setExtras((atual) =>
                          atual.map((row) =>
                            row.key === extra.key
                              ? { ...row, scope: event.target.value as CostScope }
                              : row,
                          ),
                        )
                      }
                    >
                      <option value="unit">Por unidade</option>
                      <option value="batch">Por receita</option>
                    </SelectField>
                    <button
                      type="button"
                      onClick={() => setExtras((atual) => atual.filter((r) => r.key !== extra.key))}
                      className="mb-0.5 inline-flex h-11 items-center justify-center rounded-xl px-3 text-sand-500 hover:bg-sand-200"
                    >
                      <IconClose className="h-4 w-4" />
                      <span className="sr-only">Remover</span>
                    </button>
                  </div>
                ))}
              </>
            ) : null}

            {passo === 4 ? (
              <>
                <h2 className="font-display text-xl text-sand-900">Quanto você quer ganhar?</h2>
                <p className="text-sm leading-relaxed text-sand-500">
                  A margem é a parte do preço que sobra para você depois de pagar todos os custos.
                </p>
                <MarginPicker value={margin} onChange={setMargin} />
              </>
            ) : null}

            {passo === 5 ? (
              outcome.ok ? (
                <PricingResultView
                  productName={name || 'Seu produto'}
                  yieldLabel={yieldLabel}
                  result={outcome.result}
                />
              ) : (
                <Alert tone="danger" title="Falta pouco">
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {outcome.issues.map((issue, index) => (
                      <li key={index}>{issue.message}</li>
                    ))}
                  </ul>
                </Alert>
              )
            ) : null}
          </CardBody>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {passo > 0 ? (
            <Button type="button" variant="secondary" onClick={() => setPasso((p) => p - 1)}>
              Voltar
            </Button>
          ) : (
            <Link
              href="/painel"
              className="inline-flex h-11 items-center rounded-xl px-4 text-sand-600 hover:bg-sand-100"
            >
              Cancelar
            </Link>
          )}

          {passo < PASSOS.length - 1 ? (
            <Button type="button" disabled={!podeAvancar} onClick={() => setPasso((p) => p + 1)}>
              Continuar
              <IconArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <SubmitButton size="lg" disabled={!outcome.ok} pendingLabel="Salvando...">
              Salvar precificação
            </SubmitButton>
          )}
        </div>

        {passo > 0 && passo < PASSOS.length - 1 && outcome.ok ? (
          <p className="text-center text-xs text-sand-500">
            Custo por unidade até agora:{' '}
            <strong className="font-semibold text-sand-700">
              {formatCurrency(outcome.result.unit.total)}
            </strong>
          </p>
        ) : null}
      </form>
    </div>
  );
}
