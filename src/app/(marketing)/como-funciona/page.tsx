import type { Metadata } from 'next';

import { ButtonLink } from '@/components/ui/button';
import { formatCurrency, formatMarkup, formatPercent } from '@/lib/format';
import { calculatePricing, marginAtPrice, markupAtPrice, priceForMargin } from '@/lib/pricing';

export const metadata: Metadata = {
  title: 'Como precificar doces: o guia do cálculo correto',
  description:
    'Entenda passo a passo como calcular o custo de uma receita, incluir mão de obra, gás e energia, e a diferença entre margem de lucro e markup na precificação de doces.',
  alternates: { canonical: '/como-funciona' },
};

// Exemplo usado no texto — calculado pelo mesmo motor do produto.
const exemplo = calculatePricing({
  yieldQuantity: 20,
  ingredients: [
    {
      ingredientId: 'chocolate',
      name: 'Chocolate',
      quantity: 200,
      unit: 'g',
      purchaseQuantity: 1,
      purchaseUnit: 'kg',
      purchasePrice: 29.9,
    },
    {
      ingredientId: 'leite-condensado',
      name: 'Leite condensado',
      quantity: 395,
      unit: 'g',
      purchaseQuantity: 395,
      purchaseUnit: 'g',
      purchasePrice: 6.99,
    },
  ],
  labor: { hourlyRate: 25, minutes: 48 },
  extras: [
    { label: 'Forminha e caixa', category: 'packaging', amount: 0.6, scope: 'unit' },
    { label: 'Gás', category: 'gas', amount: 2, scope: 'batch' },
  ],
  indirect: { method: 'none' },
  desiredMarginPercent: 60,
  variableFeesPercent: 0,
  minimumMarginPercent: 0,
});

function Secao({ id, titulo, children }: { id: string; titulo: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-sand-900 sm:text-3xl">
        {titulo}
      </h2>
      <div className="mt-4 space-y-4 leading-relaxed text-sand-600">{children}</div>
    </section>
  );
}

export default function ComoFuncionaPage() {
  const custoUnitario = exemplo.ok ? exemplo.result.unit.total : 0;
  const precoRecomendado = exemplo.ok ? exemplo.result.recommendedPrice : 0;

  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <header>
        <p className="text-sm font-medium text-rose-600">Guia</p>
        <h1 className="mt-2 font-display text-4xl font-semibold leading-tight tracking-tight text-sand-900">
          Como precificar doces sem chutar
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-sand-600">
          Precificar é responder três perguntas em ordem: quanto custa produzir, quanto custa cada
          unidade e quanto você precisa cobrar para lucrar o que decidiu lucrar. O resto é conta.
        </p>
      </header>

      <div className="mt-12 space-y-12">
        <Secao id="custo-do-ingrediente" titulo="1. O custo real de cada ingrediente">
          <p>
            Você não compra 150 g de chocolate: compra a barra de 1 kg. Para saber quanto entra na
            receita, é preciso descobrir o custo da menor medida.
          </p>
          <p>
            Se 1 kg custa {formatCurrency(29.9)}, então 1.000 g custam {formatCurrency(29.9)} e cada
            grama custa R$ 0,0299. Usando 150 g na receita: 150 × 0,0299 ={' '}
            <strong className="text-sand-800">{formatCurrency(4.485)}</strong>.
          </p>
          <p>
            Detalhe importante: o arredondamento só acontece na hora de mostrar o valor. Se cada
            ingrediente fosse arredondado para centavos no meio do caminho, uma receita com muitos
            itens acumularia erro — e o erro sempre aparece no preço final.
          </p>
        </Secao>

        <Secao id="custo-da-receita" titulo="2. Do lote para a unidade">
          <p>
            Some o custo de todos os ingredientes e você tem o custo do lote. Divida pelo rendimento e
            tem o custo por unidade.
          </p>
          <p>
            O rendimento é onde muita gente escorrega: informar “20 brigadeiros” quando a receita rende
            25 faz o custo unitário parecer 25% maior do que é — e o preço sai desalinhado do mercado.
          </p>
        </Secao>

        <Secao id="outros-custos" titulo="3. Os custos que ninguém lembra">
          <p>Ingrediente é só uma parte. Também saem do seu bolso:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong className="text-sand-800">Embalagem</strong>: forminha, caixa, sacola, fita. Quase
              sempre um custo por unidade.
            </li>
            <li>
              <strong className="text-sand-800">Mão de obra</strong>: seu tempo. Defina um valor por
              hora e multiplique pelas horas da produção. Se você não se paga, o negócio está
              subsidiando o cliente.
            </li>
            <li>
              <strong className="text-sand-800">Gás e energia</strong>: uma estimativa por fornada já
              muda o resultado. Aproximado é melhor do que ignorado.
            </li>
            <li>
              <strong className="text-sand-800">Outros</strong>: transporte, etiquetas, decoração,
              perdas, descartáveis.
            </li>
            <li>
              <strong className="text-sand-800">Custos indiretos</strong>: aluguel, internet,
              manutenção. Não precisam ser cadastrados item por item — um rateio simples resolve.
            </li>
          </ul>
        </Secao>

        <Secao id="margem-e-markup" titulo="4. Margem não é markup">
          <p>
            Essa é a confusão mais cara da confeitaria. Os dois números falam de lucro, mas dividem por
            coisas diferentes:
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-sand-200 bg-white p-5">
              <h3 className="font-semibold text-sand-900">Margem</h3>
              <p className="mt-1 text-sm">lucro ÷ preço de venda</p>
              <p className="mt-2 text-sm">
                Quanto sobra de cada real que entra. Custo {formatCurrency(5)}, preço{' '}
                {formatCurrency(10)} → margem de {formatPercent(marginAtPrice(5, 10, 0), 0)}.
              </p>
            </div>
            <div className="rounded-2xl border border-sand-200 bg-white p-5">
              <h3 className="font-semibold text-sand-900">Markup</h3>
              <p className="mt-1 text-sm">preço ÷ custo</p>
              <p className="mt-2 text-sm">
                Quantas vezes o custo o preço representa. O mesmo doce tem markup de{' '}
                {formatMarkup(markupAtPrice(5, 10))}.
              </p>
            </div>
          </div>
          <p>
            Quem quer 60% de margem e multiplica o custo por 1,6 acaba com{' '}
            {formatPercent(marginAtPrice(10, 16, 0), 1)} de margem, não 60%. Para 60% de margem de
            verdade, o preço é custo ÷ (1 − 0,60) — ou seja,{' '}
            {formatCurrency(priceForMargin(10, 60, 0))} para um custo de {formatCurrency(10)}.
          </p>
        </Secao>

        <Secao id="preco-minimo" titulo="5. Preço mínimo e preço recomendado">
          <p>
            <strong className="text-sand-800">Preço mínimo</strong> é o ponto de equilíbrio: cobre
            todos os custos considerados, incluindo as taxas que incidem sobre a venda. Vendendo
            abaixo dele, você paga para trabalhar. Não é um preço bom — é o limite.
          </p>
          <p>
            <strong className="text-sand-800">Preço recomendado</strong> é o preço que entrega
            exatamente a margem que você escolheu, já descontadas as taxas de maquininha, comissão ou
            imposto. É esse que serve de referência para a tabela.
          </p>
          {exemplo.ok ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
              <p className="text-sm font-medium text-rose-800">
                No exemplo de 20 brigadeiros gourmet do sistema:
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm text-rose-900 sm:grid-cols-4">
                <div>
                  <dt className="text-rose-700">Custo/un.</dt>
                  <dd className="font-semibold tabular-nums">{formatCurrency(custoUnitario)}</dd>
                </div>
                <div>
                  <dt className="text-rose-700">Preço mínimo</dt>
                  <dd className="font-semibold tabular-nums">
                    {formatCurrency(exemplo.result.minimumPrice)}
                  </dd>
                </div>
                <div>
                  <dt className="text-rose-700">Recomendado</dt>
                  <dd className="font-semibold tabular-nums">{formatCurrency(precoRecomendado)}</dd>
                </div>
                <div>
                  <dt className="text-rose-700">Lucro/un.</dt>
                  <dd className="font-semibold tabular-nums">
                    {formatCurrency(exemplo.result.recommended.profitPerUnit)}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}
        </Secao>

        <Secao id="revisar" titulo="6. Preço não é para sempre">
          <p>
            Ingrediente sobe, embalagem muda, a receita ganha um detalhe novo. Refaça a precificação
            quando o preço de compra mudar de forma relevante — no ControlDolces basta atualizar o
            ingrediente e recalcular; todo o histórico fica guardado para comparação.
          </p>
        </Secao>
      </div>

      <div className="mt-14 rounded-3xl border border-sand-200 bg-white p-8 text-center shadow-card">
        <h2 className="font-display text-2xl font-semibold text-sand-900">
          Faça essa conta uma vez, do jeito certo
        </h2>
        <p className="mx-auto mt-2 max-w-md leading-relaxed text-sand-600">
          Cadastre seus ingredientes e deixe o sistema cuidar das fórmulas.
        </p>
        <div className="mt-6 flex justify-center">
          <ButtonLink href="/criar-conta" size="lg">
            Criar minha conta
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}
