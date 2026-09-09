'use client';

import { useActionState, useState } from 'react';

import { SubmitButton } from '@/components/forms/submit-button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { SelectField, TextField } from '@/components/ui/field';
import { Alert } from '@/components/ui/feedback';
import type { IndirectCostMethodRow } from '@/lib/database.types';
import { saveCostSettingsAction } from '@/server/actions/settings';
import { IDLE } from '@/server/form-state';

export type CostSettingsValues = {
  laborHourlyRate: string;
  defaultMarginPercent: string;
  minimumMarginPercent: string;
  variableFeesPercent: string;
  indirectMethod: IndirectCostMethodRow;
  indirectPercent: string;
  indirectMonthlyAmount: string;
  indirectMonthlyUnits: string;
  indirectMonthlyHours: string;
};

const METODOS: { value: IndirectCostMethodRow; label: string; explicacao: string }[] = [
  {
    value: 'none',
    label: 'Não considerar',
    explicacao: 'Os custos indiretos ficam fora do cálculo. É o mais simples para começar.',
  },
  {
    value: 'percent',
    label: 'Um percentual sobre o custo',
    explicacao:
      'Acrescenta uma porcentagem em cima do custo direto. Prático quando você ainda não sabe somar seus custos fixos.',
  },
  {
    value: 'monthly_units',
    label: 'Dividir pelo que produzo no mês',
    explicacao:
      'Divide o total dos custos fixos pela quantidade de unidades que você produz por mês.',
  },
  {
    value: 'monthly_hours',
    label: 'Dividir pelas horas que trabalho no mês',
    explicacao:
      'Divide o total dos custos fixos pelas horas de produção do mês e aplica conforme o tempo de cada receita.',
  },
];

/**
 * Configurações de custo.
 *
 * Custos indiretos assustam quem nunca fez contabilidade, então o padrão é
 * "não considerar" e cada método vem com uma explicação em linguagem comum.
 */
export function CostSettingsForm({ initial }: { initial: CostSettingsValues }) {
  const [state, action] = useActionState(saveCostSettingsAction, IDLE);
  const [method, setMethod] = useState<IndirectCostMethodRow>(initial.indirectMethod);

  const metodoAtual = METODOS.find((item) => item.value === method) ?? METODOS[0]!;

  return (
    <Card>
      <CardHeader
        title="Custos e margem"
        description="Estes valores alimentam todos os cálculos de preço."
      />
      <CardBody>
        {state.status === 'success' ? (
          <Alert tone="success" className="mb-5">
            {state.message}
          </Alert>
        ) : null}
        {state.status === 'error' ? (
          <Alert tone="danger" className="mb-5">
            {state.message}
          </Alert>
        ) : null}

        <form action={action} className="space-y-6" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Valor da sua hora"
              name="laborHourlyRate"
              inputMode="decimal"
              prefix="R$"
              defaultValue={initial.laborHourlyRate}
              hint="Quanto você quer receber por hora de produção."
              error={state.fieldErrors?.laborHourlyRate}
            />

            <TextField
              label="Taxas sobre a venda"
              name="variableFeesPercent"
              inputMode="decimal"
              suffix="%"
              defaultValue={initial.variableFeesPercent}
              hint="Maquininha, comissão de aplicativo, imposto. Incidem sobre o preço."
              error={state.fieldErrors?.variableFeesPercent}
            />

            <TextField
              label="Margem padrão"
              name="defaultMarginPercent"
              inputMode="decimal"
              suffix="%"
              defaultValue={initial.defaultMarginPercent}
              hint="Usada quando o produto não tem margem própria."
              error={state.fieldErrors?.defaultMarginPercent}
            />

            <TextField
              label="Margem mínima"
              name="minimumMarginPercent"
              inputMode="decimal"
              suffix="%"
              defaultValue={initial.minimumMarginPercent}
              hint="A regra do preço mínimo. Zero significa cobrir exatamente os custos."
              error={state.fieldErrors?.minimumMarginPercent}
            />
          </div>

          <fieldset className="space-y-4 rounded-2xl border border-sand-200 bg-sand-50/60 p-4">
            <legend className="px-1 text-sm font-medium text-sand-700">Custos indiretos</legend>

            <p className="text-sm leading-relaxed text-sand-600">
              Aluguel, internet, manutenção, contador, marketing. Você não precisa cadastrar item por
              item — escolha como quer considerá-los, ou deixe de fora por enquanto.
            </p>

            <SelectField
              label="Quero considerar custos indiretos"
              name="indirectMethod"
              value={method}
              onChange={(event) => setMethod(event.target.value as IndirectCostMethodRow)}
              error={state.fieldErrors?.indirectMethod}
            >
              {METODOS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </SelectField>

            <p className="rounded-xl bg-white px-4 py-3 text-xs leading-relaxed text-sand-600">
              {metodoAtual.explicacao}
            </p>

            {method === 'percent' ? (
              <TextField
                label="Percentual sobre o custo direto"
                name="indirectPercent"
                inputMode="decimal"
                suffix="%"
                defaultValue={initial.indirectPercent}
                hint="Entre 5% e 15% costuma ser um ponto de partida razoável."
                error={state.fieldErrors?.indirectPercent}
              />
            ) : (
              <input type="hidden" name="indirectPercent" value={initial.indirectPercent} />
            )}

            {method === 'monthly_units' || method === 'monthly_hours' ? (
              <TextField
                label="Total dos custos fixos por mês"
                name="indirectMonthlyAmount"
                inputMode="decimal"
                prefix="R$"
                defaultValue={initial.indirectMonthlyAmount}
                hint="Soma de aluguel, internet, água, manutenção e afins."
                error={state.fieldErrors?.indirectMonthlyAmount}
              />
            ) : (
              <input type="hidden" name="indirectMonthlyAmount" value={initial.indirectMonthlyAmount} />
            )}

            {method === 'monthly_units' ? (
              <TextField
                label="Unidades que você produz por mês"
                name="indirectMonthlyUnits"
                inputMode="decimal"
                defaultValue={initial.indirectMonthlyUnits}
                hint="Uma estimativa já serve. Ex.: 400 doces."
                error={state.fieldErrors?.indirectMonthlyUnits}
              />
            ) : (
              <input type="hidden" name="indirectMonthlyUnits" value={initial.indirectMonthlyUnits} />
            )}

            {method === 'monthly_hours' ? (
              <TextField
                label="Horas de produção por mês"
                name="indirectMonthlyHours"
                inputMode="decimal"
                defaultValue={initial.indirectMonthlyHours}
                hint="Ex.: 80 horas."
                error={state.fieldErrors?.indirectMonthlyHours}
              />
            ) : (
              <input type="hidden" name="indirectMonthlyHours" value={initial.indirectMonthlyHours} />
            )}
          </fieldset>

          <div className="flex sm:justify-end">
            <SubmitButton className="w-full sm:w-auto" size="lg" pendingLabel="Salvando...">
              Salvar configurações
            </SubmitButton>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
