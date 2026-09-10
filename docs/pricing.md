# Regras de cálculo

Este documento explica o que `src/lib/pricing/engine.ts` faz e por quê. O motor é
a única fonte das fórmulas: nenhuma tela, action ou relatório recalcula nada por
conta própria.

## Unidades

Cada unidade pertence a uma dimensão — massa, volume ou contagem — e converte
para a unidade-base daquela dimensão:

| Dimensão | Unidade-base | Unidades aceitas |
| --- | --- | --- |
| massa | grama (g) | kg, g, mg |
| volume | mililitro (ml) | L, ml |
| contagem | unidade (un) | un, dz |

Misturar dimensões é recusado com mensagem explícita: 200 ml de um ingrediente
comprado em quilos não é uma conversão possível sem saber a densidade, e chutar
uma equivalência seria pior do que pedir a correção.

## Custo do ingrediente

```
custoPorUnidadeBase = preçoPago ÷ quantidadeConvertidaParaBase
custoDaLinha        = custoPorUnidadeBase × quantidadeUsadaConvertida
```

1 kg de chocolate por R$ 29,90 → 1.000 g → R$ 0,0299 por grama. Usando 150 g:
`150 × 0,0299 = R$ 4,485`, exibido como R$ 4,49.

## Custos além dos ingredientes

Cada custo adicional declara **onde incide**:

- `scope: 'unit'` — por unidade produzida (embalagem, forminha, etiqueta)
- `scope: 'batch'` — uma vez por produção (gás, energia, transporte)

Essa distinção não é detalhe: tratar embalagem como custo de lote divide o valor
pelo rendimento e subestima o custo unitário em várias vezes.

Gás e energia têm uma estimativa por produção no nível do negócio
(`cost_settings.gas_cost` e `cost_settings.electricity_cost`). Ela entra no
cálculo apenas quando o produto **não** declara um custo próprio daquela
categoria: uma receita que ocupa o forno por duas horas merece um valor seu, e o
padrão do negócio não deve competir com ele.

Mão de obra é sempre um custo de lote:

```
custoMãoDeObra = valorDaHora × (minutos ÷ 60)
```

## Custos indiretos

Quatro métodos, padrão desligado:

| Método | Fórmula |
| --- | --- |
| `none` | 0 |
| `percent` | `custoDiretoDoLote × percentual` |
| `monthly_units` | `(valorMensal ÷ unidadesPorMês) × rendimento` |
| `monthly_hours` | `(valorMensal ÷ horasPorMês) × horasDoLote` |

## Do lote para a unidade

```
custoDiretoDoLote = ingredientes + embalagem + mãoDeObra + gás + energia + outros
custoTotalDoLote  = custoDiretoDoLote + custosIndiretos
custoUnitário     = custoTotalDoLote ÷ rendimento
```

## Margem e markup

Duas grandezas diferentes, com denominadores diferentes:

```
margem = lucro ÷ preçoDeVenda
markup = preçoDeVenda ÷ custo
```

Um doce que custa R$ 5,00 e é vendido por R$ 10,00 tem **50% de margem** e
**markup de 2,00x**. Confundir os dois é o erro mais caro da precificação
artesanal: quem quer 60% de margem e multiplica o custo por 1,6 termina com 37,5%.

## Preço recomendado

Com margem desejada *m* e taxas sobre a venda *f* (maquininha, comissão, imposto):

```
preço = custo ÷ (1 − m − f)
```

Dedução: o lucro é `preço − custo − f×preço`. Impondo `lucro = m × preço`:

```
preço − custo − f·preço = m·preço
preço(1 − f − m)        = custo
preço                   = custo ÷ (1 − m − f)
```

Quando `m + f ≥ 100%` o preço tenderia ao infinito. O motor recusa a conta e
explica o motivo em vez de devolver um número absurdo.

## Preço mínimo

O ponto de equilíbrio — cobre todos os custos considerados, **incluindo as
taxas**, e deixa lucro zero:

```
preçoMínimo = custo ÷ (1 − f)
```

Uma margem mínima de segurança pode ser exigida nas configurações; nesse caso a
regra é `custo ÷ (1 − mMínima − f)`. O resultado é arredondado **para cima**, para
que o arredondamento nunca empurre o preço abaixo do custo.

Preço mínimo não significa "qualquer preço com lucro". É o limite: abaixo dele a
venda tira dinheiro do caixa.

## O custo do ingrediente existe em dois lugares

`ingredients.unit_cost` é uma **coluna gerada** no Postgres: o banco calcula a
partir do preço e da quantidade da própria linha, e recusa escrita. Serve para
relatórios e consultas SQL diretas, sem precisar refazer a conta.

`costPerBaseUnit`, em TypeScript, é o que o motor usa — é a via autoritativa da
precificação.

Duas implementações da mesma conversão poderiam divergir em silêncio, então elas
são amarradas por um contrato: `supabase/tests/unit-cost-cases.json` lista os
casos, o teste do motor confere o lado TypeScript e `npm run test:db` confere o
lado do banco. Mexer em um sem mexer no outro quebra um dos dois.

## Precisão e arredondamento

Os cálculos correm com a precisão total do ponto flutuante. O arredondamento
acontece na exibição (`src/lib/format.ts`) e ao gravar o resultado. Arredondar a
cada etapa intermediária acumularia erro — em receitas com dezenas de itens isso
vira centavos visíveis no preço final.

`roundCurrency` arredonda meia-unidade para cima corrigindo a representação
binária: `1.005 * 100` vale `100.49999999999999` em IEEE-754, e um `Math.round`
ingênuo devolveria R$ 1,00 em vez de R$ 1,01.

## Erros são mensagens, não exceções

`calculatePricing` devolve `{ ok: true, result }` ou `{ ok: false, issues }`, com
cada `issue` já escrita para a tela:

> "Morango" está sem preço de compra cadastrado. Atualize o ingrediente para continuar.

Nenhuma tela do sistema mostra "Calculation error".
