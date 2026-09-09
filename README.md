# ControlDolces

SaaS de precificação para confeitarias e docerias artesanais. Responde uma
pergunta com precisão: **quanto custa produzir e quanto cobrar.**

- **Motor de cálculo** central e testado (`src/lib/pricing`)
- **Multi-tenant** com isolamento aplicado no banco (Row Level Security)
- **Mobile first**, porque é do celular que a conta costuma ser feita

## Stack

| Camada | Escolha |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19, TypeScript estrito |
| Estilo | Tailwind CSS, componentes próprios (sem biblioteca de UI) |
| Banco | PostgreSQL no Supabase |
| Autenticação | Supabase Auth, sessão em cookies httpOnly |
| Escrita | Server Actions com validação Zod no servidor |
| Testes | Vitest, focados no motor financeiro |

Dependências de produção: `next`, `react`, `react-dom`, `@supabase/supabase-js`,
`@supabase/ssr`, `zod`. Nada além disso.

## Colocando para rodar

### 1. Instalar

```bash
npm install
```

### 2. Criar o projeto no Supabase

Crie um projeto em [supabase.com](https://supabase.com) e, no SQL Editor, execute
as migrações **na ordem**:

1. `supabase/migrations/0001_schema.sql` — tabelas, tipos e triggers
2. `supabase/migrations/0002_rls.sql` — políticas de isolamento e bucket de fotos
3. `supabase/migrations/0003_save_product.sql` — gravação transacional da receita

Com a CLI do Supabase, `supabase db push` aplica as três.

### 3. Configurar as variáveis

```bash
cp .env.example .env.local
```

Preencha com os valores de **Project Settings → API**:

| Variável | Onde encontrar |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` |
| `NEXT_PUBLIC_SITE_URL` | URL da aplicação (em produção, o domínio real) |

A chave `service_role` **não é usada** e não deve entrar no projeto.

Em **Authentication → URL Configuration**, cadastre `NEXT_PUBLIC_SITE_URL` como
Site URL e adicione `<site>/auth/confirmar` às Redirect URLs — é o destino dos
links de confirmação de conta e de recuperação de senha.

### 4. Subir

```bash
npm run dev
```

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Ambiente de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run typecheck` | TypeScript sem emitir arquivos |
| `npm run lint` | ESLint |
| `npm test` | Testes do motor de precificação |

## Estrutura

```
src/
  app/
    (marketing)/          landing page e guia de precificação
    (auth)/               entrar, criar conta, recuperar e trocar senha
    (app)/                painel, ingredientes, receitas, precificar,
                          histórico, relatórios, configurações
    onboarding/           criação do negócio na primeira entrada
    auth/confirmar/       troca do token do e-mail pela sessão
  components/
    ui/                   botões, campos, cards, estados, ícones
    app/                  navegação e cabeçalhos das telas privadas
    pricing/              resultado, composição do custo, simulador
    marketing/            cabeçalho, rodapé e demonstração do produto
  lib/
    pricing/              MOTOR DE CÁLCULO (única fonte das fórmulas)
    validation/           esquemas Zod
    supabase/             clientes de servidor, navegador e middleware
    format.ts             formatação brasileira de moeda e números
  server/
    actions/              Server Actions (toda escrita passa por aqui)
    queries.ts            leitura
    pricing.ts            ponte banco → motor
    context.ts            usuária, negócio e configurações da requisição
supabase/migrations/      esquema, RLS e função transacional
docs/                     arquitetura e regras de cálculo
```

## As regras de cálculo, em uma tela

- **Custo do ingrediente**: `preço pago ÷ quantidade convertida para a unidade-base`
  (grama, mililitro ou unidade). 1 kg a R$ 29,90 → R$ 0,0299 por grama.
- **Custo do lote**: ingredientes + custos por lote + (custos por unidade × rendimento).
- **Custo unitário**: `custo do lote ÷ rendimento`, mais o rateio de custos indiretos.
- **Margem** = `lucro ÷ preço de venda`. **Markup** = `preço ÷ custo`. Nunca são
  tratados como sinônimos.
- **Preço recomendado**: `custo ÷ (1 − margem − taxas)`. Garante a margem pedida
  *depois* das taxas que incidem sobre a venda.
- **Preço mínimo**: `custo ÷ (1 − taxas)` — o ponto de equilíbrio, com margem
  mínima de segurança configurável.

Os cálculos correm com a precisão total do ponto flutuante; o arredondamento
acontece só na exibição. Detalhes e a dedução das fórmulas em
[`docs/pricing.md`](docs/pricing.md).

## Segurança

- RLS em todas as tabelas: cada linha só é visível para a dona do `business_id`.
- Middleware protege as rotas privadas; o RLS é a barreira definitiva.
- Toda escrita é validada com Zod **no servidor**.
- A precificação é recalculada no servidor a partir do banco — nenhum valor
  financeiro vindo do navegador é aceito como verdade.
- Recuperação de senha responde igual exista ou não a conta.
- Nenhuma secret no cliente; erros técnicos ficam no log, não na tela.
