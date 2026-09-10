import { formatCurrency, formatMarkup, formatPercent } from '@/lib/format';
import type { PricingResult as PricingResultData } from '@/lib/pricing';

function Numero({
  rotulo,
  valor,
  nota,
  destaque = false,
}: {
  rotulo: string;
  valor: string;
  nota: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={
        destaque
          ? 'rounded-2xl bg-primary px-5 py-5'
          : 'rounded-2xl border border-surface-border bg-surface px-5 py-5'
      }
    >
      <dt className={destaque ? 'text-sm font-medium text-primary-soft' : 'text-sm font-medium text-content-subtle'}>
        {rotulo}
      </dt>
      <dd
        className={
          destaque
            ? 'mt-1 font-display text-3xl font-bold tabular-nums text-primary-contrast'
            : 'mt-1 font-display text-3xl font-bold tabular-nums text-content-strong'
        }
      >
        {valor}
      </dd>
      <p className={destaque ? 'mt-1.5 text-xs leading-relaxed text-primary-soft/90' : 'mt-1.5 text-xs leading-relaxed text-content-subtle'}>
        {nota}
      </p>
    </div>
  );
}

/**
 * O resultado da precificação, em tamanho grande.
 *
 * É o momento da página em que a promessa vira número. Cada valor vem com uma
 * nota curta dizendo o que significa — sem isso, "markup 2,50x" não ajuda ninguém
 * que nunca ouviu a palavra.
 */
export function PricingResult({
  result,
  productName,
}: {
  result: PricingResultData;
  productName: string;
}) {
  // Quanto sobra numa venda de R$ 100 — a mesma margem, dita em dinheiro, que é
  // como a conta costuma ser pensada na prática.
  const sobraEmCemReais = 100 * (result.recommended.marginPercent / 100);

  return (
    <div className="rounded-3xl border border-surface-border bg-surface-muted p-5 sm:p-8">
      <p className="text-sm font-semibold text-primary">{productName}</p>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Numero
          rotulo="Custo do produto"
          valor={formatCurrency(result.unit.total)}
          nota="Tudo o que sai do seu bolso para fazer uma unidade."
        />
        <Numero
          rotulo="Preço mínimo"
          valor={formatCurrency(result.minimumPrice)}
          nota="O limite que você definiu. Abaixo dele, não compensa vender."
        />
        <Numero
          rotulo="Preço sugerido"
          valor={formatCurrency(result.recommendedPrice)}
          nota={`Entrega a margem de ${formatPercent(result.desiredMarginPercent, 0)} que você escolheu.`}
          destaque
        />
        <Numero
          rotulo="Lucro por unidade"
          valor={formatCurrency(result.recommended.profitPerUnit)}
          nota={`${formatCurrency(result.recommended.profitPerBatch)} na receita inteira.`}
        />
      </dl>

      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-surface-border bg-surface px-5 py-4">
          <dt className="text-sm font-medium text-content-subtle">Margem de lucro</dt>
          <dd className="mt-0.5 font-display text-xl font-bold tabular-nums text-content-strong">
            {formatPercent(result.recommended.marginPercent, 0)}
          </dd>
          <p className="mt-1 text-xs leading-relaxed text-content-subtle">
            De cada R$ 100 vendidos, {formatCurrency(sobraEmCemReais)} sobram para você.
          </p>
        </div>
        <div className="rounded-2xl border border-surface-border bg-surface px-5 py-4">
          <dt className="text-sm font-medium text-content-subtle">Markup</dt>
          <dd className="mt-0.5 font-display text-xl font-bold tabular-nums text-content-strong">
            {formatMarkup(result.recommended.markup)}
          </dd>
          <p className="mt-1 text-xs leading-relaxed text-content-subtle">
            Quantas vezes o custo o preço representa. Não é a mesma coisa que a margem.
          </p>
        </div>
      </dl>
    </div>
  );
}
