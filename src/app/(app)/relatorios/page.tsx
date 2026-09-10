import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/app/page-header';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Badge, EmptyState } from '@/components/ui/feedback';
import { IconReports } from '@/components/ui/icons';
import { formatCurrency, formatPercent } from '@/lib/format';
import { requireContext } from '@/server/context';
import { listSavedPricings, type SavedPricing } from '@/server/queries';

export const metadata: Metadata = {
  title: 'Relatórios',
  robots: { index: false, follow: false },
};

const MARGEM_BAIXA = 25;

function media(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function Indicador({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-sand-200 bg-white px-4 py-3.5">
      <p className="text-xs font-medium text-sand-500">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold tabular-nums text-sand-900">{value}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-sand-400">{hint}</p>
    </div>
  );
}

function ListaDeProdutos({
  items,
  vazio,
  destaque,
}: {
  items: SavedPricing[];
  vazio: string;
  destaque: (item: SavedPricing) => string;
}) {
  if (items.length === 0) {
    return <p className="px-5 py-6 text-sm text-sand-500 sm:px-6">{vazio}</p>;
  }

  return (
    <ul className="divide-y divide-sand-100">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-3.5 sm:px-6">
          <Link
            href={`/precificar/${item.product_id}`}
            className="min-w-0 flex-1 truncate text-sm font-medium text-sand-800 hover:text-rose-700"
          >
            {item.product?.name ?? 'Produto removido'}
          </Link>
          <span className="shrink-0 text-sm tabular-nums text-sand-600">{destaque(item)}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function ReportsPage() {
  const { business } = await requireContext();
  const pricings = await listSavedPricings(business.id);

  if (pricings.length === 0) {
    return (
      <>
        <PageHeader
          title="Relatórios"
          description="Onde está o seu lucro e onde a margem está apertada."
        />
        <Card>
          <EmptyState
            icon={<IconReports className="h-5 w-5" />}
            title="Ainda não há dados para relatar"
            description="Os relatórios nascem das precificações salvas. Salve o preço de pelo menos um produto para começar a comparar."
            action={<ButtonLink href="/precificar">Precificar um produto</ButtonLink>}
          />
        </Card>
      </>
    );
  }

  const custoMedio = media(pricings.map((item) => item.unit_cost));
  const precoMedio = media(pricings.map((item) => item.sale_price));
  const margemMedia = media(pricings.map((item) => item.margin_percentage));
  const lucroPotencial = pricings.reduce(
    (total, item) => total + item.profit_per_unit * item.yield_quantity,
    0,
  );

  const maisRentaveis = [...pricings]
    .sort((a, b) => b.profit_per_unit - a.profit_per_unit)
    .slice(0, 5);

  const margemApertada = [...pricings]
    .filter((item) => item.margin_percentage < MARGEM_BAIXA)
    .sort((a, b) => a.margin_percentage - b.margin_percentage);

  const abaixoDoMinimo = pricings.filter((item) => item.sale_price < item.minimum_price);

  return (
    <>
      <PageHeader
        title="Relatórios"
        description={`Baseado em ${pricings.length} ${
          pricings.length === 1 ? 'precificação salva' : 'precificações salvas'
        }.`}
      />

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Indicador
            label="Custo médio"
            value={formatCurrency(custoMedio)}
            hint="por unidade produzida"
          />
          <Indicador label="Preço médio" value={formatCurrency(precoMedio)} hint="por unidade vendida" />
          <Indicador
            label="Margem média"
            value={formatPercent(margemMedia)}
            hint="do seu portfólio"
          />
          <Indicador
            label="Lucro potencial"
            value={formatCurrency(lucroPotencial)}
            hint="vendendo um lote de cada produto"
          />
        </div>

        {abaixoDoMinimo.length > 0 ? (
          <Card className="border-danger-100">
            <CardHeader
              title="Preços abaixo do mínimo"
              description="Nesses produtos, cada venda está tirando dinheiro do caixa."
              action={<Badge tone="danger">{abaixoDoMinimo.length}</Badge>}
            />
            <ListaDeProdutos
              items={abaixoDoMinimo}
              vazio=""
              destaque={(item) =>
                `${formatCurrency(item.sale_price)} · mínimo ${formatCurrency(item.minimum_price)}`
              }
            />
          </Card>
        ) : null}

        <Card>
          <CardHeader
            title="Produtos mais rentáveis"
            description="Maior lucro por unidade vendida."
          />
          <ListaDeProdutos
            items={maisRentaveis}
            vazio="Salve mais precificações para comparar."
            destaque={(item) => `${formatCurrency(item.profit_per_unit)} por unidade`}
          />
        </Card>

        <Card>
          <CardHeader
            title="Produtos com margem baixa"
            description={`Abaixo de ${MARGEM_BAIXA}% de margem, sobra pouco para imprevistos.`}
          />
          <ListaDeProdutos
            items={margemApertada}
            vazio="Nenhum produto com margem apertada. Bom sinal."
            destaque={(item) => formatPercent(item.margin_percentage)}
          />
        </Card>

        <Card>
          <CardBody>
            <h2 className="text-sm font-semibold text-sand-800">Como ler estes números</h2>
            <p className="mt-2 text-sm leading-relaxed text-sand-600">
              O lucro potencial supõe que você venda uma receita inteira de cada produto pelo preço
              salvo. Não é uma projeção de vendas — é uma referência para comparar o peso de cada
              produto no seu resultado. Produtos com margem baixa não são necessariamente ruins:
              alguns servem para atrair cliente. O importante é saber quais são.
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
