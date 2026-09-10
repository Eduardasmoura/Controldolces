import type { Metadata } from 'next';

import { LegalPage } from '@/components/marketing/legal-page';

export const metadata: Metadata = {
  title: 'Política de privacidade',
  description:
    'Quais dados o ControlDolces guarda, por que guarda e como o acesso de cada conta é isolado.',
  alternates: { canonical: '/privacidade' },
};

export default function PrivacidadePage() {
  return (
    <LegalPage
      title="Política de privacidade"
      intro="O que guardamos, por que guardamos e o que você pode fazer a respeito."
      updatedAt="setembro de 2026"
    >
      <section>
        <h2>O que guardamos</h2>
        <ul>
          <li>
            <strong className="text-content">Cadastro:</strong> seu nome, e-mail e senha (guardada
            apenas como hash — não temos como ler sua senha).
          </li>
          <li>
            <strong className="text-content">Seu negócio:</strong> nome da confeitaria, tipo de
            negócio e as respostas do onboarding.
          </li>
          <li>
            <strong className="text-content">Seu trabalho:</strong> ingredientes, preços de compra,
            receitas, custos e precificações.
          </li>
        </ul>
        <p>
          Não pedimos CPF, endereço, telefone nem dados de cartão. Não usamos rastreadores de
          publicidade.
        </p>
      </section>

      <section>
        <h2>Por que guardamos</h2>
        <p>
          Exclusivamente para o sistema funcionar: sem os preços de compra não há como calcular
          custo, e sem a conta não há como você reencontrar suas receitas amanhã.
        </p>
      </section>

      <section>
        <h2>Quem consegue ver</h2>
        <p>
          Só você. O isolamento não depende da tela: cada linha do banco de dados carrega a
          identificação do seu negócio, e o próprio PostgreSQL recusa leituras e escritas de outra
          conta, mesmo que alguém tente falar diretamente com a API.
        </p>
      </section>

      <section>
        <h2>Onde ficam</h2>
        <p>
          Num banco PostgreSQL hospedado no Supabase. Sua sessão fica num cookie seguro, que não é
          legível por JavaScript no navegador.
        </p>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>
          Usamos apenas os cookies necessários para manter você conectada. Não há cookie de
          publicidade nem de perfilamento.
        </p>
      </section>

      <section>
        <h2>Seus direitos</h2>
        <ul>
          <li>Acessar e corrigir seus dados a qualquer momento dentro do sistema.</li>
          <li>Apagar ingredientes, receitas e precificações quando quiser.</li>
          <li>Pedir a exclusão da conta inteira, com todos os dados vinculados.</li>
        </ul>
      </section>
    </LegalPage>
  );
}
