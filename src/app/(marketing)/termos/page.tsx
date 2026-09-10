import type { Metadata } from 'next';

import { LegalPage } from '@/components/marketing/legal-page';

export const metadata: Metadata = {
  title: 'Termos de uso',
  description: 'As regras de uso do ControlDolces, em linguagem direta.',
  alternates: { canonical: '/termos' },
};

export default function TermosPage() {
  return (
    <LegalPage
      title="Termos de uso"
      intro="As regras de uso do ControlDolces, escritas para serem lidas."
      updatedAt="setembro de 2026"
    >
      <section>
        <h2>O que o ControlDolces é</h2>
        <p>
          Uma ferramenta de cálculo. Você informa quanto paga pelos ingredientes, o que entra em
          cada receita e quais custos tem, e o sistema calcula o custo de produção e sugere preços a
          partir da margem que você escolher.
        </p>
      </section>

      <section>
        <h2>O que ele não é</h2>
        <p>
          Não é consultoria contábil, financeira ou jurídica, e não substitui um contador. Os
          resultados dependem inteiramente dos dados que você cadastra: um preço de compra
          desatualizado gera um custo errado, e o sistema não tem como saber disso.
        </p>
        <p>
          O preço sugerido é uma referência calculada, não uma garantia de venda nem de lucro.
          A decisão sobre quanto cobrar é sua.
        </p>
      </section>

      <section>
        <h2>Sua conta</h2>
        <ul>
          <li>Você é responsável por manter sua senha em segurança.</li>
          <li>
            Uma conta pertence a uma pessoa. Se outras pessoas trabalham com você, cada uma deve ter
            a sua.
          </li>
          <li>
            Avise imediatamente se suspeitar que alguém acessou sua conta sem autorização.
          </li>
        </ul>
      </section>

      <section>
        <h2>Seus dados são seus</h2>
        <p>
          Ingredientes, receitas, fichas técnicas e precificações que você cadastra pertencem a você.
          Não vendemos, não alugamos e não usamos esses dados para outra finalidade que não seja
          fazer o sistema funcionar para você.
        </p>
        <p>
          Você pode apagar seus registros a qualquer momento dentro do sistema, e pode pedir a
          exclusão da conta inteira.
        </p>
      </section>

      <section>
        <h2>Disponibilidade</h2>
        <p>
          Fazemos o possível para manter o serviço no ar, mas ele pode ficar indisponível por
          manutenção ou por falha de terceiros. Não garantimos funcionamento ininterrupto.
        </p>
      </section>

      <section>
        <h2>Limite de responsabilidade</h2>
        <p>
          O ControlDolces não se responsabiliza por decisões comerciais tomadas com base nos
          cálculos, nem por prejuízos decorrentes de dados incorretos cadastrados por você.
        </p>
      </section>

      <section>
        <h2>Mudanças nestes termos</h2>
        <p>
          Se estes termos mudarem de forma relevante, avisaremos pelo e-mail cadastrado antes de a
          mudança valer.
        </p>
      </section>
    </LegalPage>
  );
}
