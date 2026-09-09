'use client';

import Link from 'next/link';
import { useActionState, useCallback, useMemo, useState } from 'react';

import { SubmitButton } from '@/components/forms/submit-button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Alert } from '@/components/ui/feedback';
import { IconEdit } from '@/components/ui/icons';
import { formatCurrency, parseNumberInput } from '@/lib/format';
import { calculatePricing, type PricingInput } from '@/lib/pricing';
import { savePricingAction } from '@/server/actions/pricing';
import { IDLE } from '@/server/form-state';

import { MarginPicker } from './margin-picker';
import { PriceSimulator } from './price-simulator';
import { PricingResultView } from './result-view';

/**
 * Tela de precificação.
 *
 * Recebe a entrada de cálculo montada no servidor e recalcula localmente quando
 * a usuária mexe na margem — instantâneo, sem ida e volta ao servidor. Ao salvar,
 * o servidor recalcula tudo a partir do banco: a tela nunca é a fonte da verdade.
 */
export function PricingWorkbench({
  productId,
  productName,
  yieldLabel,
  input,
  savedSalePrice,
}: {
  productId: string;
  productName: string;
  yieldLabel: string;
  input: PricingInput;
  savedSalePrice: number | null;
}) {
  const [state, action] = useActionState(savePricingAction, IDLE);
  const [margin, setMargin] = useState(String(input.desiredMarginPercent));
  const [price, setPrice] = useState(savedSalePrice);

  const marginNumber = parseNumberInput(margin);

  const outcome = useMemo(
    () =>
      calculatePricing({
        ...input,
        desiredMarginPercent: marginNumber ?? input.desiredMarginPercent,
      }),
    [input, marginNumber],
  );

  const handlePriceChange = useCallback((value: number) => setPrice(value), []);

  if (!outcome.ok) {
    return (
      <Card>
        <CardBody className="space-y-4">
          <Alert tone="danger" title="Não conseguimos calcular este produto">
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {outcome.issues.map((issue, index) => (
                <li key={index}>{issue.message}</li>
              ))}
            </ul>
          </Alert>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/produtos/${productId}`}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-rose-600 px-4 text-white hover:bg-rose-700"
            >
              <IconEdit className="h-4 w-4" />
              Revisar a receita
            </Link>
            <Link
              href="/ingredientes"
              className="inline-flex h-11 items-center rounded-xl border border-sand-200 bg-white px-4 text-sand-700 hover:border-sand-300"
            >
              Ver ingredientes
            </Link>
          </div>
        </CardBody>
      </Card>
    );
  }

  const result = outcome.result;
  const precoAtual = price ?? result.recommendedPrice;

  return (
    <div className="space-y-5">
      <Card>
        <CardBody>
          <PricingResultView
            productName={productName}
            yieldLabel={yieldLabel}
            result={result}
            salePrice={precoAtual}
          />
        </CardBody>
      </Card>

      <form action={action} className="space-y-5">
        <input type="hidden" name="productId" value={productId} />

        <Card>
          <CardHeader
            title="Margem desejada"
            description="Define o preço recomendado. Já considera as taxas sobre a venda."
          />
          <CardBody>
            <MarginPicker value={margin} onChange={setMargin} error={state.fieldErrors?.marginPercent} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Simulador"
            description="Mexa no preço e veja o efeito no lucro, na margem e no markup."
          />
          <CardBody>
            <PriceSimulator
              unitCost={result.unit.total}
              yieldQuantity={result.yieldQuantity}
              variableFeesPercent={result.variableFeesPercent}
              minimumPrice={result.minimumPrice}
              recommendedPrice={result.recommendedPrice}
              onChange={handlePriceChange}
            />
          </CardBody>
        </Card>

        {state.status === 'error' ? <Alert tone="danger">{state.message}</Alert> : null}
        {state.status === 'success' ? (
          <Alert tone="success">
            {state.message} Você encontra este produto no histórico e no painel.
          </Alert>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row-reverse sm:items-center">
          <SubmitButton size="lg" pendingLabel="Salvando...">
            Salvar precificação
          </SubmitButton>
          <p className="text-xs leading-relaxed text-sand-500 sm:flex-1">
            Vamos guardar o preço de {formatCurrency(precoAtual)} e o retrato completo dos custos de
            hoje.
          </p>
        </div>
      </form>
    </div>
  );
}
