import type { Metadata } from 'next';
import Link from 'next/link';

import {
  CostsScreen,
  IngredientsScreen,
  PricingScreen,
  RecipeScreen,
  brownieDemoResult,
} from '@/components/marketing/app-mockup';
import { AudienceCard, BenefitCard, FeatureCard, StepCard } from '@/components/marketing/cards';
import { CallToAction } from '@/components/marketing/cta';
import { Faq, type FaqItem } from '@/components/marketing/faq';
import { PricingResult } from '@/components/marketing/pricing-result';
import { Reveal } from '@/components/marketing/reveal';
import { Section, SectionTitle } from '@/components/marketing/section';
import { ButtonLink } from '@/components/ui/button';
import {
  IconArrowRight,
  IconCheck,
  IconHistory,
  IconIngredients,
  IconPrice,
  IconRecipe,
  IconReports,
  IconSettings,
} from '@/components/ui/icons';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

const DORES = [
  'Somo os ingredientes e paro por aí.',
  'Esqueço da caixa, da fita e da forminha.',
  'Nunca coloquei meu tempo de trabalho na conta.',
  'Não faço ideia de quanto o gás e a energia pesam.',
  'Olho o preço da concorrente e chuto por perto.',
  'Trabalho o mês inteiro e não sei se sobrou alguma coisa.',
];

const ETAPAS = [
  {
    numero: '01',
    titulo: 'Cadastre seus ingredientes',
    descricao:
      'Informe o tamanho da embalagem e quanto pagou. O sistema descobre quanto custa cada grama.',
  },
  {
    numero: '02',
    titulo: 'Monte sua receita',
    descricao:
      'Diga quanto de cada ingrediente entra e quantas unidades a receita rende.',
  },
  {
    numero: '03',
    titulo: 'Adicione seus custos',
    descricao:
      'Embalagem, mão de obra, gás e energia. Tudo o que sai do seu bolso entra na conta.',
  },
  {
    numero: '04',
    titulo: 'Descubra quanto cobrar',
    descricao:
      'Escolha sua margem e veja o custo, o preço mínimo e o preço sugerido de cada unidade.',
  },
];

const FUNCIONALIDADES = [
  {
    icone: <IconIngredients className="h-5 w-5" />,
    titulo: 'Ingredientes',
    descricao:
      'Cadastre seus ingredientes e saiba quanto cada grama, ml ou unidade realmente custa.',
  },
  {
    icone: <IconRecipe className="h-5 w-5" />,
    titulo: 'Ficha técnica',
    descricao: 'Monte suas receitas informando ingredientes, quantidades e rendimento.',
  },
  {
    icone: <IconSettings className="h-5 w-5" />,
    titulo: 'Custos',
    descricao: 'Considere embalagem, mão de obra, gás, energia e outros custos da produção.',
  },
  {
    icone: <IconPrice className="h-5 w-5" />,
    titulo: 'Precificação',
    descricao: 'Descubra custo, preço mínimo, preço recomendado, margem e lucro por unidade.',
  },
  {
    icone: <IconReports className="h-5 w-5" />,
    titulo: 'Simulação',
    descricao: 'Teste diferentes preços antes de decidir quanto cobrar pelo seu produto.',
  },
  {
    icone: <IconHistory className="h-5 w-5" />,
    titulo: 'Histórico',
    descricao: 'Tenha suas precificações organizadas para consultar quando quiser.',
  },
];

const BENEFICIOS = [
  {
    titulo: 'Mais segurança para cobrar',
    descricao:
      'Você deixa de depender do “acho que esse preço está bom” e passa a ter um número para defender.',
  },
  {
    titulo: 'Mais clareza sobre seu lucro',
    descricao: 'Entenda quanto realmente sobra depois que todos os custos são pagos.',
  },
  {
    titulo: 'Mais organização',
    descricao: 'Suas receitas, seus custos e seus preços em um lugar só, sempre à mão.',
  },
  {
    titulo: 'Decisões melhores',
    descricao: 'Simule preços antes de anunciar e veja o efeito de cada mudança no seu bolso.',
  },
];

const PUBLICO = [
  { titulo: 'Confeiteiras', descricao: 'Doces variados, muitas receitas, muitos custos diferentes.' },
  { titulo: 'Boleiras', descricao: 'Bolos por encomenda, cada um com um tamanho e um recheio.' },
  { titulo: 'Docerias', descricao: 'Vitrine com dezenas de itens e uma tabela de preços para manter.' },
  { titulo: 'Quem trabalha por encomenda', descricao: 'Orçamento na hora, com o custo já calculado.' },
  { titulo: 'Quem está começando', descricao: 'O primeiro preço, feito do jeito certo desde o início.' },
  { titulo: 'Pequenos negócios', descricao: 'Brownies, cookies, tortas, salgados: a conta é a mesma.' },
];

const PERGUNTAS: FaqItem[] = [
  {
    question: 'Preciso entender de matemática?',
    answer:
      'Não. Você informa o que compra, o que usa e quanto quer ganhar. O sistema faz os cálculos e mostra o resultado em português, sem fórmula na tela.',
  },
  {
    question: 'Posso cadastrar meus próprios ingredientes?',
    answer:
      'Sim. Você cadastra cada ingrediente com o tamanho da embalagem e o valor que pagou, e pode atualizar o preço sempre que ele mudar.',
  },
  {
    question: 'Posso considerar embalagem e mão de obra?',
    answer:
      'Sim. Além dos ingredientes, você lança embalagem, seu tempo de trabalho, gás, energia e outros custos como transporte ou etiquetas.',
  },
  {
    question: 'Posso alterar o preço depois?',
    answer:
      'Sim. O simulador permite testar preços diferentes e ver na hora o efeito no lucro, na margem e no markup, antes de decidir.',
  },
  {
    question: 'Posso usar pelo celular?',
    answer:
      'Sim. A interface foi desenhada primeiro para a tela do celular, porque é lá que a maioria das contas acaba sendo feita.',
  },
  {
    question: 'O sistema serve somente para bolos?',
    answer:
      'Não. Serve para qualquer produto com receita e rendimento: brownies, brigadeiros, cookies, tortas, panetones, salgados.',
  },
  {
    question: 'Qual a diferença entre margem e markup?',
    answer:
      'Margem é quanto sobra de cada real vendido: lucro dividido pelo preço. Markup é quantas vezes o custo o preço representa. Um doce que custa R$ 5,00 e é vendido por R$ 10,00 tem 50% de margem e markup de 2,00x. O sistema mostra os dois separados, porque tratá-los como sinônimo aperta a margem sem você perceber.',
  },
  {
    question: 'Meus dados ficam visíveis para outras pessoas?',
    answer:
      'Não. Cada conta enxerga somente os próprios ingredientes, receitas e precificações. O isolamento é aplicado no banco de dados, não apenas na tela.',
  },
];

export default function LandingPage() {
  const resultado = brownieDemoResult;

  return (
    <>
      {/* ---------------------------------------------------------------- HERO */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[26rem] bg-gradient-to-b from-primary-soft/70 to-transparent"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-6xl gap-y-10 px-5 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-x-16">
          <div>
            <p className="inline-flex items-center rounded-full border border-primary/20 bg-surface px-3 py-1 text-xs font-semibold text-primary-hover">
              Feito para quem vive de fazer doce
            </p>

            <h1 className="mt-5 text-balance font-display text-[2.5rem] font-extrabold leading-[1.08] tracking-display-tight text-content-strong sm:text-5xl lg:text-[3.5rem]">
              Pare de colocar preço no achismo
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-content-muted">
              Calcule o custo dos seus produtos, descubra seu lucro e saiba quanto cobrar pelos seus
              doces de forma simples.
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

          </div>

          {/* No celular a prova visual vem logo depois dos botões; a lista de
              garantias desce para baixo dela. */}
          <figure className="m-0">
            <PricingScreen />
            <figcaption className="mt-3 text-center text-xs text-content-subtle">
              Uma receita de brownie de verdade, calculada pelo motor do ControlDolces.
            </figcaption>
          </figure>

          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-content-muted lg:col-span-2">
            {['Cálculo transparente', 'Funciona no celular', 'Seus dados só seus'].map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <IconCheck className="h-4 w-4 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------------- A DOR */}
      <Section id="problema" tone="surface">
        <SectionTitle
          eyebrow="O problema"
          title="Você sabe quanto realmente custa cada doce?"
          description="A conta que a maioria faz para na metade do caminho. É por isso que dá para vender muito e não sobrar dinheiro no fim do mês."
        />

        <ul className="mt-10 grid gap-3 sm:grid-cols-2">
          {DORES.map((dor, indice) => (
            <Reveal key={dor} delay={indice * 60}>
              <li className="h-full rounded-2xl border border-surface-border bg-background px-5 py-4">
                <p className="font-display text-lg leading-snug text-content">“{dor}”</p>
              </li>
            </Reveal>
          ))}
        </ul>
      </Section>

      {/* ------------------------------------------------- VIRADA PARA A SOLUÇÃO */}
      <Section tone="soft">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-balance font-display text-2xl font-bold leading-snug tracking-display-tight text-content-strong sm:text-3xl">
            Seu preço deveria começar pelo seu custo, não pelo preço do concorrente.
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-content-muted">
            O ControlDolces reúne o que você gasta de verdade — ingredientes, embalagem, seu tempo,
            gás e energia — e transforma isso num preço que faz sentido para o seu negócio. A
            concorrente pode estar errando o preço dela; você não precisa errar junto.
          </p>
        </div>
      </Section>

      {/* ----------------------------------------------------- COMO FUNCIONA */}
      <Section id="como-funciona">
        <SectionTitle
          eyebrow="Como funciona"
          title="Quatro passos até o seu preço"
          description="Você cadastra uma vez e usa em todas as receitas. Da segunda precificação em diante, são poucos minutos."
        />

        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ETAPAS.map((etapa, indice) => (
            <Reveal key={etapa.numero} delay={indice * 70} className="h-full">
              <StepCard
                number={etapa.numero}
                title={etapa.titulo}
                description={etapa.descricao}
              />
            </Reveal>
          ))}
        </ol>
      </Section>

      {/* ------------------------------------------------------ DEMONSTRAÇÃO */}
      <Section tone="surface">
        <SectionTitle
          eyebrow="Demonstração"
          title="Do ingrediente ao preço de venda"
          description="As mesmas telas que você vai usar, com os números de uma receita real de brownie que rende 16 unidades."
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <Reveal>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-content-subtle">
                1. O que cada ingrediente custa
              </p>
              <IngredientsScreen />
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-content-subtle">
                2. Quanto entra na receita
              </p>
              <RecipeScreen />
            </div>
          </Reveal>

          <Reveal delay={160}>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-content-subtle">
                3. O que mais sai do seu bolso
              </p>
              <CostsScreen />
            </div>
          </Reveal>

          <Reveal delay={240}>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-content-subtle">4. Quanto cobrar</p>
              <PricingScreen compact />
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ------------------------------------------------ RESULTADO DA PRECIFICAÇÃO */}
      <Section>
        <SectionTitle
          eyebrow="O resultado"
          title="Seus custos viram números que você entende"
          description="No fim da conta, o que aparece não é uma planilha: são cinco informações que respondem quanto cobrar e quanto você ganha com isso."
        />

        <Reveal className="mt-10">
          <PricingResult result={resultado} productName="Brownie · rende 16 unidades" />
        </Reveal>

        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-content-subtle">
          O preço mínimo acompanha a margem de segurança que você configurar. Neste exemplo ela está
          em 40%: abaixo de {' '}
          <span className="font-medium text-content-muted">R$ 8,00</span> a venda deixa de compensar.
        </p>
      </Section>

      {/* ----------------------------------------------------- FUNCIONALIDADES */}
      <Section id="funcionalidades" tone="surface">
        <SectionTitle
          eyebrow="Funcionalidades"
          title="Tudo o que entra no preço, em um lugar só"
          description="Um sistema pequeno e direto, feito para responder uma pergunta com precisão: quanto cobrar."
        />

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FUNCIONALIDADES.map((item, indice) => (
            <Reveal key={item.titulo} delay={indice * 60} className="h-full">
              <FeatureCard icon={item.icone} title={item.titulo} description={item.descricao} />
            </Reveal>
          ))}
        </ul>
      </Section>

      {/* ---------------------------------------------------------- BENEFÍCIOS */}
      <Section id="beneficios">
        <SectionTitle
          eyebrow="Benefícios"
          title="O que muda no seu dia a dia"
          description="Não é sobre ter mais um sistema. É sobre parar de ter dúvida na hora de dizer o preço."
        />

        <ul className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2">
          {BENEFICIOS.map((beneficio, indice) => (
            <Reveal key={beneficio.titulo} delay={indice * 60} className="h-full">
              <BenefitCard title={beneficio.titulo} description={beneficio.descricao} />
            </Reveal>
          ))}
        </ul>
      </Section>

      {/* ------------------------------------------------------------ PÚBLICO */}
      <Section tone="surface">
        <SectionTitle
          eyebrow="Para quem é"
          title="Se você faz doce para vender, é para você"
          description="A conta não muda com o tipo de produto: o que muda é a receita, e isso quem informa é você."
        />

        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PUBLICO.map((perfil, indice) => (
            <Reveal key={perfil.titulo} delay={indice * 50} className="h-full">
              <AudienceCard title={perfil.titulo} description={perfil.descricao} />
            </Reveal>
          ))}
        </ul>
      </Section>

      {/* ------------------------------------------- COMECE PELO PRIMEIRO PRODUTO */}
      <Section tone="soft">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance font-display text-3xl font-bold tracking-display-tight text-content-strong sm:text-4xl">
            Seu próximo preço pode ser calculado, não chutado.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-content-muted">
            Comece por um produto só — normalmente é o suficiente para a ficha cair.
          </p>
          <div className="mt-8 flex justify-center">
            <ButtonLink href="/criar-conta" size="lg">
              Começar agora
              <IconArrowRight />
            </ButtonLink>
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------------- FAQ */}
      <Section id="faq">
        <div className="mx-auto max-w-3xl">
          <SectionTitle eyebrow="Dúvidas" title="Perguntas frequentes" />
          <div className="mt-8">
            <Faq items={PERGUNTAS} />
          </div>
          <p className="mt-6 text-sm text-content-subtle">
            Não achou sua dúvida?{' '}
            <Link href="/suporte" className="font-medium text-primary hover:text-primary-hover">
              Veja a página de suporte
            </Link>
            .
          </p>
        </div>
      </Section>

      {/* ----------------------------------------------------------- CTA FINAL */}
      <Section>
        <CallToAction
          title="Comece a precificar seus produtos com mais segurança."
          description="Cadastre-se e faça sua primeira precificação."
          note="Leva poucos minutos e você pode começar com um único produto."
        />
      </Section>
    </>
  );
}
