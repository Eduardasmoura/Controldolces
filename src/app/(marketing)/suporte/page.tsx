import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalPage } from '@/components/marketing/legal-page';

export const metadata: Metadata = {
  title: 'Suporte',
  description: 'Como resolver as dúvidas mais comuns do ControlDolces e onde pedir ajuda.',
  alternates: { canonical: '/suporte' },
};

/**
 * Endereço de contato do suporte.
 *
 * Vem do ambiente de propósito: inventar um e-mail que ninguém lê seria pior do
 * que não mostrar nenhum. Sem a variável configurada, a página continua útil e
 * simplesmente não exibe o bloco de contato.
 */
const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();

export default function SuportePage() {
  return (
    <LegalPage
      title="Suporte"
      intro="A maior parte das dúvidas cai em um destes casos. Se a sua não estiver aqui, fale com a gente."
    >
      <section>
        <h2>O custo do meu produto saiu diferente do que eu esperava</h2>
        <p>
          Comece pelo rendimento: informar 20 unidades numa receita que rende 25 infla o custo
          unitário em 25%. Depois confira os preços de compra dos ingredientes — se o valor do
          chocolate mudou e o cadastro não, o cálculo usa o preço antigo.
        </p>
      </section>

      <section>
        <h2>Um ingrediente não aparece na receita</h2>
        <p>
          A ficha técnica só lista ingredientes cadastrados. Cadastre o insumo primeiro, com a
          quantidade da embalagem e o valor pago, e ele passa a aparecer.
        </p>
      </section>

      <section>
        <h2>Aparece que a unidade não combina</h2>
        <p>
          O sistema converte medidas do mesmo tipo — grama com quilo, mililitro com litro — mas não
          converte peso em volume, porque isso depende da densidade de cada ingrediente. Se você
          comprou em quilos, informe a quantidade da receita em gramas ou quilos.
        </p>
      </section>

      <section>
        <h2>Não recebi o e-mail de confirmação</h2>
        <p>
          Procure na caixa de spam e na aba de promoções. Se não estiver lá, tente{' '}
          <Link href="/recuperar-senha" className="font-medium text-primary hover:text-primary-hover">
            recuperar a senha
          </Link>{' '}
          com o mesmo endereço: se a conta existir, o link chega por ali.
        </p>
      </section>

      <section>
        <h2>Quero entender melhor as contas</h2>
        <p>
          O{' '}
          <Link href="/como-funciona" className="font-medium text-primary hover:text-primary-hover">
            guia de precificação
          </Link>{' '}
          explica passo a passo como o custo é calculado e qual a diferença entre margem e markup.
        </p>
      </section>

      {email ? (
        <section>
          <h2>Falar com uma pessoa</h2>
          <p>
            Escreva para{' '}
            <a
              href={`mailto:${email}`}
              className="font-medium text-primary hover:text-primary-hover"
            >
              {email}
            </a>
            . Contar qual produto você estava precificando ajuda a responder mais rápido.
          </p>
        </section>
      ) : null}
    </LegalPage>
  );
}
