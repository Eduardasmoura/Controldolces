# Testes do banco

Validam, contra um PostgreSQL de verdade, as duas coisas que a aplicação não pode
errar no banco:

1. **Isolamento entre contas** — cada usuária só alcança as próprias linhas,
   mesmo tentando ler, apagar ou gravar diretamente pela API.
2. **Gravação transacional da receita** — `save_product` cria produto, ficha
   técnica e custos adicionais de uma vez, e uma regravação substitui a ficha em
   vez de duplicá-la.

| Arquivo | Papel |
| --- | --- |
| `00_supabase_stub.sql` | Recria o mínimo do ambiente Supabase (`auth.users`, `auth.uid()`, `storage`, papéis `anon`/`authenticated`) para as migrações rodarem fora dele. |
| `10_isolamento.sql` | O teste: duas usuárias, uma receita completa e as tentativas de invasão. |

## Rodando

Com um PostgreSQL 16 local:

```bash
./supabase/tests/run.sh
```

O script cria um cluster temporário, aplica o stub e as três migrações, executa o
teste e derruba o cluster no final. Ele **não** toca no seu banco de produção.

## Lendo o resultado

O teste é auto-explicativo: cada bloco imprime o que está verificando. O que
precisa aparecer:

- `perfis_criados` = 2 — o trigger de `auth.users` funciona
- após a regravação: `receitas` = 1 e `itens_da_ficha` = 1 — substituiu, não duplicou
- na visão da segunda usuária, tudo da primeira em zero
- `DELETE 0` — a exclusão alheia não encontra linha para apagar
- `NOTICE: OK: RLS bloqueou a insercao no negocio de outra usuaria`
- `tabelas_sem_rls` = 0 — nenhuma tabela ficou desprotegida
- `politicas_de_update_no_historico` = 0 — o histórico não é reescrito
