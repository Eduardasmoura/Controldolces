import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader } from '@/components/app/page-header';
import { Checklist, type ChecklistItem } from '@/components/dashboard/checklist';
import { PrimaryAction } from '@/components/dashboard/primary-action';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Alert, Badge, EmptyState } from '@/components/ui/feedback';
import { IconIngredients, IconPrice, IconRecipe } from '@/components/ui/icons';
import { formatCurrency, formatDate, formatPercent } from '@/lib/format';
import { requireContext } from '@/server/context';
import { getDashboardSummary, listRecentPricings } from '@/server/queries';

export const metadata: Metadata = {
  title: 'Painel',
  robots: { index: false, follow: false },
};

const MARGEM_BAIXA = 25;

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-surface-border bg-surface px-4 py-3.5">
      <p className="text-xs font-medium text-content-subtle">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums text-content-strong">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-content-subtle">{hint}</p> : null}
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ bemvinda?: string }>;
}) {
  const [{ profile, business }, query] = await Promise.all([requireContext(), searchParams]);

  // Uma consulta para os números e uma para as últimas precificações — nada de
  // carregar listas inteiras só para contar.
  const [resumo, recentes] = await Promise.all([
    getDashboardSummary(),
    listRecentPricings(business.id),
  ]);

  const primeiroNome = (profile?.full_name || business.name).split(' ')[0] ?? '';
  const semNenhumDado = resumo.ingredientsCount === 0 && resumo.productsCount === 0;

  const checklist: ChecklistItem[] = [
    { label: 'Criar sua conta', done: true },
    { label: 'Configurar seu negócio', done: true },
    {
      label: 'Cadastrar seu primeiro ingrediente',
      done: resumo.ingredientsCount > 0,
      href: '/ingredientes/novo',
    },
    {
      label: 'Criar sua primeira receita',
      done: resumo.productsCount > 0,
      href: '/produtos/novo',
    },
    {
      label: 'Fazer sua primeira precificação',
      done: resumo.pricingsCount > 0,
      href: '/precificar',
    },
  ];

  return (
    <>
      <PageHeader
        title={primeiroNome ? `Olá, ${primeiroNome}` : 'Painel'}
        description={
          semNenhumDado
            ? 'Sua conta está pronta. Vamos descobrir quanto custa o seu primeiro produto?'
            : 'Um resumo do que você já cadastrou e das precificações salvas.'
        }
      />

      {query.bemvinda ? (
        <Alert tone="success" className="mb-5">
          Tudo pronto! Vamos começar sua primeira precificação.
        </Alert>
      ) : null}

      <div className="space-y-6">
        {/* Ação principal: o elemento que responde "e agora?". */}
        <PrimaryAction
          title={
            semNenhumDado
              ? 'Vamos começar sua primeira precificação?'
              : 'Precifique um novo produto'
          }
          description={
            semNenhumDado
              ? 'Cadastre os ingredientes da sua receita, informe os custos e descubra quanto cobrar.'
              : 'Descubra o custo, o preço recomendado e o lucro do seu produto.'
          }
          cta={semNenhumDado ? 'Precificar meu primeiro produto' : 'Nova precificação'}
          href="/precificar/novo"
        />

        {semNenhumDado ? (
          <p className="text-sm text-content-subtle">
            Prefere ir com calma?{' '}
            <Link
              href="/como-funciona"
              className="font-medium text-primary hover:text-primary-hover"
            >
              Conheça o sistema
            </Link>{' '}
            ou{' '}
            <Link
              href="/ingredientes/novo"
              className="font-medium text-primary hover:text-primary-hover"
            >
              comece cadastrando um ingrediente
            </Link>
            .
          </p>
        ) : null}

        <Checklist items={checklist} />

        {/* Os números só aparecem quando existem. Nada de zero decorativo. */}
        {!semNenhumDado ? (
          <section aria-labelledby="resumo">
            <h2 id="resumo" className="sr-only">
              Resumo da sua conta
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat
                label="Produtos"
                value={String(resumo.productsCount)}
                hint={resumo.productsCount === 1 ? 'receita cadastrada' : 'receitas cadastradas'}
              />
              <Stat
                label="Ingredientes"
                value={String(resumo.ingredientsCount)}
                hint={resumo.ingredientsCount === 1 ? 'insumo' : 'insumos'}
              />
              <Stat
                label="Precificações"
                value={String(resumo.pricingsCount)}
                hint={resumo.pricingsCount === 1 ? 'produto com preço' : 'produtos com preço'}
              />
              <Stat
                label="Margem média"
                value={resumo.averageMargin == null ? '—' : formatPercent(resumo.averageMargin)}
                hint={
                  resumo.averageMargin == null
                    ? 'salve uma precificação'
                    : 'das precificações salvas'
                }
              />
            </div>
          </section>
        ) : null}

        {/* Alerta real, a partir de dados reais. */}
        {resumo.belowMinimumCount > 0 || resumo.lowMarginCount > 0 ? (
          <Alert
            tone={resumo.belowMinimumCount > 0 ? 'danger' : 'warning'}
            title={
              resumo.belowMinimumCount > 0
                ? 'Há produtos sendo vendidos abaixo do preço mínimo'
                : 'Alguns produtos podem estar com margem abaixo do esperado'
            }
          >
            <p>
              {resumo.belowMinimumCount > 0
                ? `${resumo.belowMinimumCount} ${
                    resumo.belowMinimumCount === 1 ? 'produto está' : 'produtos estão'
                  } com preço abaixo do mínimo calculado.`
                : `${resumo.lowMarginCount} ${
                    resumo.lowMarginCount === 1 ? 'produto está' : 'produtos estão'
                  } com margem menor que ${MARGEM_BAIXA}%.`}{' '}
              <Link href="/relatorios" className="font-medium underline underline-offset-2">
                Ver quais são
              </Link>
            </p>
          </Alert>
        ) : null}

        <Card>
          <CardHeader
            title="Últimas precificações"
            description="Clique em uma linha para ver o resultado completo."
            action={
              recentes.length > 0 ? (
                <ButtonLink href="/historico" variant="secondary" size="sm">
                  Ver histórico
                </ButtonLink>
              ) : null
            }
          />

          {recentes.length === 0 ? (
            <EmptyState
              icon={<IconPrice className="h-5 w-5" />}
              title="Nenhuma precificação salva ainda"
              description={
                resumo.productsCount > 0
                  ? 'Você já tem receitas cadastradas. Calcule o preço de uma delas para acompanhar por aqui.'
                  : 'Assim que você salvar a primeira, ela aparece aqui com custo, preço e margem.'
              }
              action={
                <ButtonLink href={resumo.productsCount > 0 ? '/precificar' : '/precificar/novo'}>
                  {resumo.productsCount > 0 ? 'Precificar um produto' : 'Começar agora'}
                </ButtonLink>
              }
            />
          ) : (
            <>
              {/* Tabela no desktop; no celular a mesma informação vira lista. */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-sm">
                  <caption className="sr-only">Últimas precificações salvas</caption>
                  <thead>
                    <tr className="border-b border-surface-border text-left text-xs font-medium text-content-subtle">
                      <th scope="col" className="px-5 py-3 sm:px-6">Produto</th>
                      <th scope="col" className="px-3 py-3">Data</th>
                      <th scope="col" className="px-3 py-3 text-right">Custo</th>
                      <th scope="col" className="px-3 py-3 text-right">Preço sugerido</th>
                      <th scope="col" className="px-5 py-3 text-right sm:px-6">Margem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {recentes.map((item) => (
                      <tr key={item.id} className="transition-colors hover:bg-surface-muted">
                        <th scope="row" className="px-5 py-3.5 text-left font-medium sm:px-6">
                          <Link
                            href={`/precificar/${item.product_id}`}
                            className="text-content-strong hover:text-primary"
                          >
                            {item.product?.name ?? 'Produto removido'}
                          </Link>
                        </th>
                        <td className="px-3 py-3.5 text-content-subtle">
                          {formatDate(item.updated_at)}
                        </td>
                        <td className="px-3 py-3.5 text-right tabular-nums text-content-muted">
                          {formatCurrency(item.unit_cost)}
                        </td>
                        <td className="px-3 py-3.5 text-right font-medium tabular-nums text-content-strong">
                          {formatCurrency(item.sale_price)}
                        </td>
                        <td className="px-5 py-3.5 text-right sm:px-6">
                          <span className="tabular-nums text-content-muted">
                            {formatPercent(item.margin_percentage)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-surface-border sm:hidden">
                {recentes.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/precificar/${item.product_id}`}
                      className="block px-5 py-4 transition-colors hover:bg-surface-muted"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-content-strong">
                            {item.product?.name ?? 'Produto removido'}
                          </span>
                          <span className="mt-0.5 block text-xs text-content-subtle">
                            {formatDate(item.updated_at)}
                          </span>
                        </span>
                        {item.sale_price < item.minimum_price ? (
                          <Badge tone="danger">Abaixo do mínimo</Badge>
                        ) : item.margin_percentage < MARGEM_BAIXA ? (
                          <Badge tone="warning">Margem baixa</Badge>
                        ) : null}
                      </div>

                      <dl className="mt-2.5 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <dt className="text-content-subtle">Custo</dt>
                          <dd className="font-medium tabular-nums text-content">
                            {formatCurrency(item.unit_cost)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-content-subtle">Preço</dt>
                          <dd className="font-medium tabular-nums text-content">
                            {formatCurrency(item.sale_price)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-content-subtle">Margem</dt>
                          <dd className="font-medium tabular-nums text-content">
                            {formatPercent(item.margin_percentage)}
                          </dd>
                        </div>
                      </dl>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        {!semNenhumDado ? (
          <Card>
            <CardBody>
              <h2 className="text-sm font-bold text-content-strong">Atalhos</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <ButtonLink href="/ingredientes/novo" variant="secondary" className="justify-start">
                  <IconIngredients className="h-4 w-4" />
                  Novo ingrediente
                </ButtonLink>
                <ButtonLink href="/produtos/novo" variant="secondary" className="justify-start">
                  <IconRecipe className="h-4 w-4" />
                  Nova receita
                </ButtonLink>
                <ButtonLink href="/precificar" variant="secondary" className="justify-start">
                  <IconPrice className="h-4 w-4" />
                  Precificar
                </ButtonLink>
              </div>
            </CardBody>
          </Card>
        ) : null}
      </div>
    </>
  );
}
