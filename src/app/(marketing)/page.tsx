import type { Metadata } from 'next';
import Link from 'next/link';

import { HeroPreview } from '@/components/marketing/hero-preview';
import { ButtonLink } from '@/components/ui/button';
import { IconArrowRight, IconCheck } from '@/components/ui/icons';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

const DORES = [
  'Será que estou cobrando certo por esse bolo?',
  'Quanto eu realmente gasto para fazer uma fornada?',
  'Estou tendo lucro ou só devolvendo o dinheiro dos ingredientes?',
  'Como é que se calcula o gás e a energia de uma receita?',
  'Quanto eu deveria cobrar pelas minhas horas de trabalho?',
  'Meu preço está barato demais e eu nem sei?',
];

const ETAPAS = [
  {
    numero: '01',
    titulo: 'Cadastre seus ingredientes',
    texto:
      'Informe o que você paga e a quantidade da embalagem. O sistema descobre sozinho quanto custa cada grama, mililitro ou unidade.',
  },
  {
    numero: '02',
    titulo: 'Monte a ficha técnica',
    texto:
      'Diga quanto de cada ingrediente entra na receita e quantas unidades ela rende. O custo do lote aparece na hora.',
  },
  {
    numero: '03',
    titulo: 'Some os custos que ninguém conta',
    texto:
      'Embalagem, mão de obra, gás, energia, transporte, etiquetas. Tudo o que sai do seu bolso entra na conta.',
  },
  {
    numero: '04',
    titulo: 'Descubra o seu preço',
    texto:
      'Escolha a margem que você quer e veja o preço mínimo, o preço recomendado, o lucro por unidade e o markup.',
  },
];

const RECURSOS = [
  {
    titulo: 'Ingredientes com custo por medida',
    texto: 'Comprou 1 kg por R$ 29,90? A receita usa 150 g? O sistema resolve a regra de três.',
  },
  {
    titulo: 'Ficha técnica por produto',
    texto: 'Rendimento, ingredientes, quantidades e observações num lugar só.',
  },
  {
    titulo: 'Mão de obra por hora',
    texto: 'Defina quanto vale a sua hora e o tempo de produção. Seu trabalho vira custo, não caridade.',
  },
  {
    titulo: 'Gás, energia e embalagem',
    texto: 'Custos por lote ou por unidade, cada um no seu lugar certo.',
  },
  {
    titulo: 'Custos indiretos sem contabilidade',
    texto: 'Aluguel, internet, manutenção: rateio simples, opcional, e explicado em português.',
  },
  {
    titulo: 'Margem e markup separados',
    texto: 'Duas coisas diferentes, mostradas como coisas diferentes. Sem confusão que custa dinheiro.',
  },
  {
    titulo: 'Preço mínimo e preço recomendado',
    texto: 'Um diz onde você empata. O outro, onde você lucra o quanto decidiu lucrar.',
  },
  {
    titulo: 'Simulador em tempo real',
    texto: 'Mexa no preço e veja lucro, margem e markup mudando enquanto você digita.',
  },
  {
    titulo: 'Histórico e relatórios',
    texto: 'Todas as precificações salvas, com os produtos mais rentáveis e os de margem apertada.',
  },
];

const PERGUNTAS = [
  {
    pergunta: 'Preciso entender de finanças para usar?',
    resposta:
      'Não. Você informa o que compra, o que usa e quanto quer ganhar. As fórmulas ficam com o sistema, e cada resultado vem com uma explicação em linguagem comum.',
  },
  {
    pergunta: 'Qual a diferença entre margem e markup?',
    resposta:
      'Margem é quanto sobra de cada real vendido: lucro dividido pelo preço. Markup é quantas vezes o custo o preço representa: preço dividido pelo custo. Um doce que custa R$ 5,00 e é vendido por R$ 10,00 tem 50% de margem e markup de 2,00x. Tratar os dois como sinônimo é o erro que mais aperta a margem de quem vende doce.',
  },
  {
    pergunta: 'Dá para usar pelo celular?',
    resposta:
      'Sim. O ControlDolces foi desenhado primeiro para a tela do celular, porque é lá que a maioria das confeiteiras faz as contas, muitas vezes com a cozinha em plena produção.',
  },
  {
    pergunta: 'E os custos que eu não sei calcular, como gás e energia?',
    resposta:
      'Você lança uma estimativa por lote — e pode ajustar quando quiser. É melhor considerar um valor aproximado do que fingir que esse custo não existe.',
  },
  {
    pergunta: 'Meus dados ficam visíveis para outras pessoas?',
    resposta:
      'Não. Cada conta enxerga somente os próprios ingredientes, receitas e precificações. O isolamento é aplicado no próprio banco de dados, não apenas na tela.',
  },
];

export default function LandingPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-gradient-to-b from-rose-50 to-transparent"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16">
          <div>
            <p className="inline-flex items-center rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-medium text-rose-700">
              Feito para confeitarias e docerias artesanais
            </p>

            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.1] tracking-tight text-sand-900 sm:text-5xl">
              Descubra quanto cobrar pelos seus doces sem depender do achismo.
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-sand-600">
              O ControlDolces calcula o custo real de cada receita — ingredientes, embalagem, mão de
              obra, gás e energia — e mostra o preço mínimo, o preço recomendado e o lucro que sobra
              em cada unidade.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/criar-conta" size="lg">
                Começar agora
                <IconArrowRight />
              </ButtonLink>
              <ButtonLink href="#como-funciona" variant="secondary" size="lg">
                Ver como funciona
              </ButtonLink>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-sand-500">
              {['Cálculo transparente', 'Funciona no celular', 'Seus dados só seus'].map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <IconCheck className="h-4 w-4 text-rose-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <HeroPreview />
        </div>
      </section>

      {/* PROBLEMA */}
      <section id="problema" className="scroll-mt-20 border-y border-sand-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-sand-900 sm:text-4xl">
              A conta que quase ninguém faz direito
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-sand-600">
              A maioria dos pequenos negócios de doce calcula o preço somando os ingredientes e
              acrescentando um valor que “parece justo”. O problema é o que fica de fora dessa conta.
            </p>
          </div>

          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {DORES.map((dor) => (
              <li
                key={dor}
                className="rounded-2xl border border-sand-200 bg-cream px-5 py-4 text-sand-700"
              >
                <span className="font-display text-lg leading-snug">“{dor}”</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-6">
            <p className="text-lg leading-relaxed text-amber-800">
              Quando a embalagem, o gás e as suas horas de trabalho não entram na conta, o lucro que
              aparece no papel simplesmente não existe no caixa. É por isso que dá para vender muito
              e, mesmo assim, não sobrar dinheiro no fim do mês.
            </p>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-sand-900 sm:text-4xl">
              Quatro passos até o seu preço
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-sand-600">
              Você cadastra uma vez e usa em todas as receitas. Da segunda precificação em diante, são
              poucos minutos.
            </p>
          </div>

          <ol className="mt-10 grid gap-4 md:grid-cols-2">
            {ETAPAS.map((etapa) => (
              <li key={etapa.numero} className="rounded-2xl border border-sand-200 bg-white p-6 shadow-card">
                <span className="font-display text-sm font-semibold text-rose-500">{etapa.numero}</span>
                <h3 className="mt-2 font-display text-xl font-semibold text-sand-900">{etapa.titulo}</h3>
                <p className="mt-2 leading-relaxed text-sand-600">{etapa.texto}</p>
              </li>
            ))}
          </ol>

          <div className="mt-8">
            <Link
              href="/como-funciona"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-700 hover:text-rose-800"
            >
              Ver o guia completo de precificação
              <IconArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* RECURSOS */}
      <section id="recursos" className="scroll-mt-20 border-y border-sand-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-sand-900 sm:text-4xl">
              Tudo o que entra no preço, em um lugar só
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-sand-600">
              Um sistema pequeno e direto, feito para responder uma pergunta com precisão: quanto
              cobrar.
            </p>
          </div>

          <div className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {RECURSOS.map((recurso) => (
              <div key={recurso.titulo} className="border-t border-sand-200 pt-5">
                <h3 className="font-semibold text-sand-900">{recurso.titulo}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-sand-600">{recurso.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PERGUNTAS */}
      <section id="perguntas" className="scroll-mt-20">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-sand-900 sm:text-4xl">
            Perguntas frequentes
          </h2>

          <div className="mt-8 divide-y divide-sand-200 border-y border-sand-200">
            {PERGUNTAS.map((item) => (
              <details key={item.pergunta} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-sand-900 marker:hidden">
                  {item.pergunta}
                  <span
                    className="shrink-0 text-sand-400 transition-transform group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 leading-relaxed text-sand-600">{item.resposta}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="border-t border-sand-200 bg-rose-600">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Pare de cobrar no achismo
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-rose-100">
            Crie sua conta e faça a primeira precificação hoje. Comece com um produto — normalmente é
            o suficiente para a ficha cair.
          </p>
          <div className="mt-8 flex justify-center">
            <ButtonLink
              href="/criar-conta"
              size="lg"
              className="bg-white text-rose-700 hover:bg-rose-50 active:bg-rose-100"
            >
              Criar minha conta
              <IconArrowRight />
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
