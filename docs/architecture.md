# Arquitetura

## Decisões e o motivo de cada uma

**Next.js App Router com Server Components.** A maioria das telas é leitura de
dados do banco. Renderizar no servidor evita enviar JavaScript de busca de dados
para o celular da usuária e mantém as consultas atrás da sessão.

**Server Actions para toda escrita.** Uma única porta de entrada por operação,
com validação Zod no servidor. Não existe rota de API pública que aceite dados
sem passar por validação.

**Motor de cálculo puro e isolado.** `src/lib/pricing` não importa React, não lê
banco e não formata nada. Por isso roda no servidor (ao salvar) e no navegador (no
simulador e nas prévias dos formulários) sem duplicar fórmula. É também o que
torna os testes rápidos e determinísticos.

**Uma ponte só entre banco e motor.** `src/server/pricing.ts` é o único tradutor
de linhas do Postgres para a entrada do motor. Painel, precificação, simulador e
relatórios enxergam exatamente os mesmos números.

**Gravação da receita numa função Postgres.** Salvar uma ficha técnica toca três
tabelas. Em chamadas separadas, uma falha no meio deixaria a receita pela metade
— e uma receita incompleta gera um preço errado. `save_product` resolve tudo numa
transação, com `SECURITY INVOKER` para o RLS continuar valendo.

**Sem biblioteca de componentes.** A identidade visual é própria e o conjunto de
componentes necessários é pequeno. Menos dependência, menos JavaScript, mais
controle sobre acessibilidade.

## Modelo de dados

```
auth.users
   │
   ├── profiles (1:1)
   │
   └── businesses (o tenant)
         ├── cost_settings (1:1)
         ├── subscriptions (1:1)
         ├── ingredients ──── ingredient_prices (histórico de custo)
         ├── products
         │     ├── recipes ──── recipe_ingredients ──→ ingredients
         │     └── product_extra_costs
         ├── pricing_calculations (preço vigente, 1 por produto)
         └── pricing_history (log imutável de cada precificação)
```

Toda tabela operacional carrega `business_id`. As políticas de RLS comparam esse
campo com os negócios da usuária autenticada:

```sql
business_id in (select public.owned_business_ids())
```

`owned_business_ids()` é `SECURITY DEFINER` com `search_path` fixo, o que evita
recursão de política e sequestro de schema.

`pricing_calculations` guarda o preço atual de cada produto (um registro por
produto, atualizado a cada gravação). `pricing_history` é append-only: recebe uma
linha por precificação salva, com o retrato completo dos custos daquele momento.
Assim uma precificação de três meses atrás continua explicável mesmo depois de os
ingredientes mudarem de preço — e a política de `update` é removida de propósito.

## Fluxo da usuária

```
landing → criar conta → e-mail de confirmação → onboarding
   → painel (vazio, com convite ao fluxo guiado)
   → ingredientes → receita/ficha técnica → custos
   → precificação → simulador → salvar
   → histórico → relatórios
```

O onboarding cria `businesses`, `cost_settings` e `subscriptions`. Sem negócio,
`requireContext()` devolve a usuária ao onboarding: nenhuma tela do app aparece
sem os dados mínimos.

## Camadas de segurança

1. **Middleware** renova a sessão e barra rotas privadas.
2. **`requireContext()`** garante usuária autenticada e negócio configurado em
   toda página privada.
3. **Zod no servidor** valida cada campo de cada escrita.
4. **RLS no Postgres** é a barreira final. Ainda que alguém chame a API do
   Supabase diretamente com a chave anônima, só alcança as próprias linhas.
5. **Recálculo no servidor**: ao salvar uma precificação, o preço vem da tela mas
   todos os custos são recalculados a partir do banco.

## O que ficou de fora, e por quê

- **Cobrança e planos pagos.** A tabela `subscriptions` existe e nasce com o plano
  gratuito real da conta, sem integração de pagamento e sem tela prometendo
  recurso que não existe.
- **Upload de fotos pelo navegador.** O bucket e as políticas de storage estão
  prontos e isolados por usuária; a tela aceita o endereço de uma imagem. O
  seletor de arquivo é o próximo passo natural.
- **Gráficos.** Os relatórios respondem perguntas com números e listas. Gráfico
  entra quando houver série temporal suficiente para dizer algo que a lista não diz.
