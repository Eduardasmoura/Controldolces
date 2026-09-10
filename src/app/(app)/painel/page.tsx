import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/app/page-header';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Badge, EmptyState } from '@/components/ui/feedback';
import { IconArrowRight, IconIngredients, IconPlus, IconPrice, IconRecipe } from '@/components/ui/icons';
import { formatCurrency, formatPercent, pluralize } from '@/lib/format';
import { requireContext } from '@/server/context';
import { listIngredients, listProducts, listSavedPricings } from '@/server/queries';

export const metadata: Metadata = {
  title: 'Painel',
  robots: { index: false, follow: false },
};

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-sand-200 bg-white px-4 py-3.5">
      <p className="text-xs font-medium text-sand-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-sand-900">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-sand-400">{hint}</p> : null}
    </div>
  );
}

function QuickAction({
  href,
  label,
  description,
  icon,
}: {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-2xl border border-sand-200 bg-white p-4 transition-colors hover:border-rose-200 hover:bg-rose-50/40"
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-sand-900">{label}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-sand-500">{description}</span>
      </span>
    </Link>
  );
}

export default async function DashboardPage() {
  const { profile, business } = await requireContext();
  const [ingredients, products, pricings] = await Promise.all([
    listIngredients(business.id),
    listProducts(business.id),
    listSavedPricings(business.id),
  ]);

  const primeiroNome = (profile?.full_name || business.name).split(' ')[0] ?? '';

  // Métricas calculadas a partir das precificações realmente salvas.
  const margens = pricings.map((item) => item.margin_percentage);
  const margemMedia = margens.length
    ? margens.reduce((total, value) => total + value, 0) / margens.length
    : null;
  const lucroPotencial = pricings.reduce(
    (total, item) => total + item.profit_per_unit * item.yield_quantity,
    0,
  );

  const semNada = ingredients.length === 0 && products.length === 0;

  return (
    <>
      <PageHeader
        title={primeiroNome ? `Olá, ${primeiroNome}` : 'Painel'}
        description={
          semNada
            ? 'Sua conta está pronta. Vamos calcular o preço do seu primeiro produto?'
            : 'Um resumo do que você já cadastrou e das precificações salvas.'
        }
      />

      {semNada ? (
        <Card className="overflow-hidden">
          <div className="bg-rose-50 px-6 py-8 sm:px-8 sm:py-10">
            <h2 className="font-display text-2xl font-semibold text-rose-900">
              Vamos criar sua primeira precificação?
            </h2>
            <p className="mt-2 max-w-xl leading-relaxed text-rose-800/80">
              São cinco passos guiados: nome do produto, rendimento, ingredientes, custos e margem.
              No fim você vê o custo real, o preço mínimo e o preço recomendado.
            </p>
            <div className="mt-6">
              <ButtonLink href="/precificar/novo" size="lg">
                Precificar meu primeiro produto
                <IconArrowRight />
              </ButtonLink>
            </div>
          </div>
          <CardBody>
            <p className="text-sm text-sand-500">
              Prefere ir com calma?{' '}
              <Link href="/ingredientes/novo" className="font-medium text-rose-700 hover:text-rose-800">
                Comece cadastrando um ingrediente
              </Link>
              .
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-6">
          <section aria-labelledby="resumo">
            <h2 id="resumo" className="sr-only">
              Resumo
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <Stat
                label="Produtos"
                value={String(products.length)}
                hint={pluralize(products.length, 'receita cadastrada', 'receitas cadastradas')}
              />
              <Stat
                label="Ingredientes"
                value={String(ingredients.length)}
                hint={pluralize(ingredients.length, 'insumo', 'insumos')}
              />
              <Stat
                label="Precificações"
                value={String(pricings.length)}
                hint={pluralize(pricings.length, 'produto com preço', 'produtos com preço')}
              />
              <Stat
                label="Margem média"
                value={margemMedia == null ? '—' : formatPercent(margemMedia)}
                hint={margemMedia == null ? 'Salve uma precificação' : 'das precificações salvas'}
              />
              <Stat
                label="Lucro potencial"
                value={pricings.length ? formatCurrency(lucroPotencial) : '—'}
                hint="se vender um lote de cada"
              />
            </div>
          </section>

          <section aria-labelledby="acoes">
            <h2 id="acoes" className="mb-3 text-sm font-semibold text-sand-700">
              Ações rápidas
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <QuickAction
                href="/ingredientes/novo"
                label="Novo ingrediente"
                description="Cadastre um insumo com preço e quantidade da embalagem."
                icon={<IconIngredients className="h-5 w-5" />}
              />
              <QuickAction
                href="/produtos/novo"
                label="Nova receita"
                description="Monte a ficha técnica com rendimento e ingredientes."
                icon={<IconRecipe className="h-5 w-5" />}
              />
              <QuickAction
                href="/precificar"
                label="Precificar produto"
                description="Calcule custo, preço mínimo e preço recomendado."
                icon={<IconPrice className="h-5 w-5" />}
              />
            </div>
          </section>

          <Card>
            <CardHeader
              title="Produtos recentes"
              description="Últimas precificações salvas."
              action={
                pricings.length > 0 ? (
                  <ButtonLink href="/historico" variant="secondary" size="sm">
                    Ver histórico
                  </ButtonLink>
                ) : null
              }
            />

            {pricings.length === 0 ? (
              <EmptyState
                icon={<IconPrice className="h-5 w-5" />}
                title="Nenhuma precificação salva ainda"
                description={
                  products.length > 0
                    ? 'Você já tem receitas cadastradas. Calcule o preço de uma delas para ver o resumo aqui.'
                    : 'Cadastre uma receita e calcule o preço para acompanhar seus produtos por aqui.'
                }
                action={
                  <ButtonLink href={products.length > 0 ? '/precificar' : '/produtos/novo'}>
                    <IconPlus className="h-4 w-4" />
                    {products.length > 0 ? 'Precificar um produto' : 'Cadastrar receita'}
                  </ButtonLink>
                }
              />
            ) : (
              <ul className="divide-y divide-sand-100">
                {pricings.slice(0, 6).map((item) => {
                  const abaixoDoMinimo = item.sale_price < item.minimum_price;
                  return (
                    <li key={item.id}>
                      <Link
                        href={`/precificar/${item.product_id}`}
                        className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:bg-sand-50 sm:px-6"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-sand-900">
                            {item.product?.name ?? 'Produto removido'}
                          </span>
                          <span className="mt-0.5 block text-xs text-sand-500">
                            Custo {formatCurrency(item.unit_cost)} · Preço{' '}
                            {formatCurrency(item.sale_price)}
                          </span>
                        </span>

                        <span className="text-right">
                          <span className="block text-sm font-medium tabular-nums text-sand-800">
                            {formatPercent(item.margin_percentage)}
                          </span>
                          <span className="block text-xs text-sand-400">margem</span>
                        </span>

                        {abaixoDoMinimo ? (
                          <Badge tone="danger">Abaixo do mínimo</Badge>
                        ) : item.margin_percentage < 20 ? (
                          <Badge tone="warning">Margem baixa</Badge>
                        ) : (
                          <Badge tone="success">Saudável</Badge>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
