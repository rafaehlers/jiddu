# Benchmark PolitiFact × Jiddu

**Data da execução:** 31/05/2026
**Pipeline:** verificador de fact-check do Jiddu — Perplexity Sonar Reasoning Pro via OpenRouter, prompt em inglês, `force: true` (cache contornado)
**Fonte:** [dataset LIAR2](https://github.com/chengxuphd/liar2) (Apache-2.0, ~23k afirmações do PolitiFact rotuladas por humanos, 2008-2023)
**Amostra:** 200 afirmações, estratificadas em 50 por bucket nas quatro categorias polares do PolitiFact (`true`, `mostly_true`, `false`, `pants_on_fire`), filtradas para 2020 em diante para que a busca web do Perplexity Sonar ainda alcance fontes primárias contemporâneas
**Custo:** ~US$ 5-6 de crédito OpenRouter (200 chamadas Sonar Reasoning Pro)

## TL;DR

> **Em 200 afirmações tiradas dos buckets polares do PolitiFact, o veredito do Jiddu coincidiu com o veredito humano em 67,5% dos casos. Discordância polar estrita — Jiddu chamando uma afirmação com a polaridade *oposta* à do humano — aconteceu em apenas 4,5% dos casos (9 de 200). Os 28% restantes foram Jiddu devolvendo `mixed` ou `unverified` em vez de um veredito polar, padrão fortemente concentrado no bucket `mostly_true` do PolitiFact (58% das afirmações `mostly_true` rotuladas pelo humano receberam `mixed` do Jiddu — discutivelmente um mapeamento coerente, já que "mostly true" e "afirmação é parcialmente correta, parcialmente não" se sobrepõem por definição).**

Restringindo aos três buckets menos ambíguos do PolitiFact (`true`, `false`, `pants_on_fire`), o Jiddu concorda com o veredito humano em **122/150 = 81,3%** dos casos. O bucket intermediário `mostly_true` é onde a saída de maior resolução do Jiddu (`mixed`) substitui um veredito polar em mais da metade dos casos.

Esta é a primeira medição de qualidade do Jiddu contra um padrão-ouro humano de terceiros. Será reexecutado quando o prompt do verificador, a escolha de modelo ou o pipeline mudarem materialmente.

## Setup

### O que foi medido

Para cada afirmação amostrada, chamamos a mesma função `verifyClaim()` usada em produção em `/api/factcheck/[id]/verify`. Entradas:
- `statement` — o texto da afirmação vindo do LIAR2, como está, sem o contexto do artigo do PolitiFact ao redor
- `type` — heurística best-effort baseada no texto da afirmação (numeric / date / quote / causal / categorical)
- `lang` — `en`
- `force: true` — contorna o cache de vereditos do Jiddu para cada chamada bater no Perplexity fresca

Saída capturada por afirmação:
- O veredito (`supported` / `contradicted` / `mixed` / `unverified`)
- A confiança (0-1)
- O texto da justificativa
- O número de fontes citadas devolvido pelo Sonar
- A duração wall-clock

O harness rodou com concorrência 6 (igual à produção). Wall-clock total: 6m 2s.

### Como a concordância foi pontuada

O PolitiFact usa um Truth-O-Meter de 6 níveis (`pants_on_fire` / `false` / `mostly_false` / `half_true` / `mostly_true` / `true`); o Jiddu usa 4 (`supported` / `contradicted` / `mixed` / `unverified`). Medimos apenas os quatro buckets polares e aplicamos este mapeamento:

| Rótulo PolitiFact | Veredito esperado no Jiddu |
|---|---|
| `true` | `supported` |
| `mostly_true` | `supported` |
| `false` | `contradicted` |
| `pants_on_fire` | `contradicted` |

Uma afirmação está **concordada** se o Jiddu devolveu o veredito polar esperado. Está **discordada** se o Jiddu devolveu o veredito polar *oposto* — o pior caso. Os casos restantes — `mixed` e `unverified` — são contabilizados em separado, já que ficam mais próximos de "não estamos fazendo uma afirmação polar aqui" do que de concordância ou discordância.

Rótulos intermediários do PolitiFact (`mostly_false`, `half_true`) foram excluídos da amostragem. Eles são a zona de ruído documentada em [Sahitaj et al. 2025](https://arxiv.org/abs/2502.08909) — adicioná-los diluiria o sinal que estamos atrás.

## Resultados

### Números principais

| Resultado | Quantidade | Percentual |
|---|---:|---:|
| Concordou (match polar) | 135 | **67,5%** |
| Discordou (oposto polar) | 9 | **4,5%** |
| Devolveu `mixed` | 45 | 22,5% |
| Devolveu `unverified` | 11 | 5,5% |
| Erro | 0 | 0% |
| **Total** | **200** | 100% |

### Matriz de confusão

As linhas são rótulos do PolitiFact, as colunas são vereditos do Jiddu. As células são contagens de afirmações (cada linha soma 50).

| | supported | contradicted | mixed | unverified |
|---|---:|---:|---:|---:|
| **true** | **32** | 2 | 11 | 5 |
| **mostly_true** | 13 | 5 | **29** | 3 |
| **false** | 2 | **43** | 4 | 1 |
| **pants_on_fire** | 0 | **47** | 1 | 2 |

A diagonal — afirmações polares do PolitiFact que receberam o veredito polar esperado — soma 122. O maior bloco fora da diagonal é `mostly_true → mixed` com 29 casos (ver "O padrão `mixed`" abaixo).

### Por tipo de afirmação

O harness atribuiu um tipo heurístico a cada afirmação. Amostras menores em alguns buckets:

| Tipo | Amostra | Concordou | Taxa |
|---|---:|---:|---:|
| `date` | 14 | 13 | **92,9%** |
| `numeric` | 10 | 7 | 70,0% |
| `quote` | 44 | 29 | 65,9% |
| `categorical` | 130 | 85 | 65,4% |
| `causal` | 2 | 1 | 50,0% |

Afirmações do tipo `date` (eventos específicos com timestamps verificáveis) são onde o Sonar brilha. `categorical` — o catch-all para asserções não estruturadas — fica na média. `causal` teve poucas amostras para ler com confiança.

## O padrão `mixed`

O sinal mais marcante é a sobreposição `mostly_true → mixed`: **29 das 50 afirmações `mostly_true` do PolitiFact receberam `mixed` do Jiddu**.

Isto *não* é o mesmo modo de falha que um esquema de 5 classes por gradação de confiança degradando na fronteira (conforme o achado de Sahitaj 2025). É uma sobreposição estrutural entre duas categorias semanticamente adjacentes:

- O `mostly_true` do PolitiFact é definido como "a declaração é precisa mas precisa de esclarecimento ou informação adicional" — i.e. parcialmente verdadeira com ressalvas.
- O `mixed` do Jiddu é definido como "afirmação é parcialmente sustentada e parcialmente contradita pela evidência."

Os dois descrevem o mesmo estado epistêmico. A diferença é retórica: o PolitiFact parte de "true" e desce, o Jiddu fica no meio e estende para ambos os lados. **Se `mostly_true → mixed` for contado como mapeamento sensato em vez de erro**, a taxa efetiva de saídas sensatas é `(135 + 29) / 200 = 82,0%`.

Concretamente, da execução:
- *"The (Erie Co., N.Y.) health commissioner makes more than the governor, the vice president…"* — `mostly_true` pelo PolitiFact, `mixed` pelo Jiddu. Justificativa do Jiddu: "Salário do Comissário de Saúde mais horas extras excedeu salários-base do Gov. de NY…" — verdadeiro em algumas comparações, falso em outras.
- *"The Virginia Employment Commission is sixth in the nation for getting benefits to eligible people quickly"* — `mostly_true` pelo PolitiFact, `mixed` pelo Jiddu. Justificativa do Jiddu: ranqueada em sexto em alguns períodos, abaixo em outros.

São afirmações onde todo leitor se beneficia de ver a qualificação, não um veredito num dos dois lados.

## As 9 discordâncias estritas

Os 9 casos onde o veredito polar do Jiddu foi o oposto do veredito polar do PolitiFact são o conjunto mais importante desta execução. Eles se dividem em quatro causas:

### (a) Sensibilidade temporal — Sonar avaliou evidência atual contra afirmação histórica (4 casos)

Quando uma afirmação foi feita anos atrás sobre um tópico cuja situação desde então se inverteu, o Sonar tende a achar evidência refletindo a realidade de hoje, não o momento original da afirmação.

- *"If the vaccine came out tomorrow, how in the heck would we get it to people? There is no game plan."* — Biden, ago/2020. O PolitiFact chamou isso de `mostly_true` refletindo a distribuição subplanejada naquele momento. O Sonar buscou em 2026 e achou documentação extensa de distribuição de vacinas, chamando de `contradicted`.
- *"NYC could pay to house its homeless population in hotel rooms, but de Blasio has refused to do that"* — abr/2020. PolitiFact `mostly_true` para aquele momento; Sonar achou que NYC subsequentemente abrigou sim moradores de rua em hotéis e chamou de `contradicted`.
- *"A 'default on our debt' would be unprecedented in American history"* — Jeffries, jan/2023. PolitiFact `mostly_true` no contexto moderno; Sonar achou near-defaults históricos (mini-default de 1979, saída do padrão-ouro de 1933) e chamou de `contradicted`.
- *"No state gets back less from Washington than New York state"* — Cuomo, jan/2021. Rankings estaduais mudam ano a ano; Sonar puxou um relatório do Rockefeller Institute de 2025 que ranqueia NY diferente.

**Conclusão:** o pipeline não sabe quando uma afirmação foi feita e aplica resultados de busca *atuais*. Uma melhoria futura seria injetar a data da afirmação no prompt do Sonar — "em <data>, isto era verdadeiro?". Vale sinalizar na justificativa mesmo que não resolvamos totalmente.

### (b) Citação literal verdadeira vs. meta-afirmação falsa (2 casos)

O PolitiFact frequentemente avalia uma afirmação como `false` quando as palavras literais foram pronunciadas mas a implicação engana. O Sonar verifica que a citação foi dita, daí a defende.

- *"Foxconn hasn't hit job targets on its Wisconsin factory because 'No. 1, you had a pandemic'"* — Trump, 2020. PolitiFact `false` porque a Foxconn já estava perdendo metas pré-pandemia. Sonar `supported` porque a citação de fato foi dita.
- *"An audio message lists five ways people can prevent the novel coronavirus"* — mensagem em corrente, 2020. PolitiFact `false` porque o áudio viral específico era enganoso. Sonar `supported` porque existe um segmento NPR parecido.

**Conclusão:** o Jiddu não distingue "a afirmação foi feita" de "a afirmação é verdadeira." Uma adição curta ao prompt perguntando "a implicação desta afirmação é verdadeira?" em vez de "a afirmação é verdadeira?" capturaria alguns desses.

### (c) Nuance do Sonar está correta, PolitiFact foi leniente no contexto (2 casos)

São casos onde a leitura cuidadosa do Sonar é tecnicamente mais defensável que a classificação do PolitiFact — embora a classificação possa ter sido correta no enquadramento mais estreito do artigo original.

- *"Says it's illegal to hold an absentee-only election or mail ballots to every registered voter"* — Sonar nota corretamente que Colorado, Oregon, Washington e outros fazem isso legalmente. O `true` do PolitiFact aqui pode refletir o contexto legal mais estreito de um estado específico.
- *"Congress has one job here: to count electoral votes that have in fact been cast by any state"* — Sonar nota que o Electoral Count Act dá ao Congresso mais autoridade que mera contagem. PolitiFact `true` para a descrição básica da função.

**Conclusão:** não são falhas — são pontos onde o pipeline automatizado lê com mais cuidado que o humano. Vale não corrigir demais.

### (d) Saída do modelo / desencontro com a justificativa (1 caso)

- *"Sen. Marco Rubio 'helped write the law to raise prescription prices'"* — A justificativa do Sonar diz que Rubio co-patrocinou um projeto que *aumentaria* preços se promulgado (consistente com `mostly_true` do PolitiFact), mas o veredito saiu `contradicted`. É uma inconsistência a nível de modelo entre o texto explicativo e o rótulo final.

**Conclusão:** desencontros entre justificativa e veredito acontecem em taxas baixas. Uma melhoria futura: um passo automatizado de sanity-check que sinaliza afirmações onde a justificativa e o veredito são mutuamente inconsistentes.

## Limitações

1. **Tamanho da amostra.** 200 afirmações dão um intervalo de confiança de ±5% no número principal. Uma execução de 500 afirmações apertaria para ±3%, a um custo de ~US$ 15.
2. **PolitiFact é política dos EUA.** O benchmark não diz nada sobre a acurácia do Jiddu em política brasileira, claims científicas, esportivas ou qualquer domínio não político-estadunidense. Escolhemos este dataset porque é o único corpus de fact-check em larga escala estruturado com licença permissiva, não porque ele representa a distribuição de entrada do Jiddu. Um benchmark Lupa/Aos Fatos em PT-BR exigiria raspar o HTML publicado deles — trabalho separado.
3. **PolitiFact tem seus próprios vieses.** A metodologia foi criticada por aplicação inconsistente ao longo do espectro político, particularmente por fontes de direita. Estamos medindo alinhamento com o julgamento editorial de um time humano, não com "verdade".
4. **Sem contexto da afirmação.** O Jiddu recebeu apenas o texto da afirmação pelado. Os fact-checkers humanos do PolitiFact tinham o artigo original, a fala completa do orador e o contexto histórico. Isto handicapa o Jiddu em relação à referência humana — o que também é a condição realista de produção.
5. **Qualidade auto-declarada.** Isto é executado pelo desenvolvedor do pipeline sendo medido. Reprodutibilidade (abaixo) é a mitigação.
6. **Risco de vazamento em tempo de teste.** Algumas afirmações do PolitiFact no LIAR2 podem estar indexadas pela busca web do Perplexity — o Sonar poderia em princípio achar o artigo PolitiFact original e papagaiar o veredito. Não filtramos isso; fazê-lo exigiria inspecionar URLs de fonte manualmente. A matriz de confusão não mostra acurácia patológica que sugerisse isto acontecendo (43-47/50 nos buckets polares), então o viés provavelmente é pequeno.

## Reprodução

```bash
git clone git@github.com:rafaehlers/jiddu.git
cd jiddu
npm install
cp .env.example .env   # adicione seu OPENROUTER_API_KEY
npx prisma migrate dev
npx tsx scripts/benchmark-politifact.mts            # execução completa de 200 claims, ~6 min, ~US$ 6
npx tsx scripts/benchmark-politifact.mts --sample=20  # smoke run, ~1 min, ~US$ 0,60
```

A seed é fixa (`SHUFFLE_SEED = 0x6a696464`) então as mesmas 200 afirmações são amostradas em reruns. Resultados por afirmação caem em `scripts/data/bench-<timestamp>.json`. Reexecute depois de qualquer mudança de prompt em `src/lib/verify-claim-prompt.ts` para detectar regressões.

## Veja também

- [Claimify (arxiv 2502.10855)](https://arxiv.org/abs/2502.10855) — o paper que inspirou a etapa de extração do Jiddu
- [Distilling Expert Judgment at Scale](https://www.byforum.com/whitepaper-files/distilling-expert-judgment-at-scale.pdf) (Goldfarb et al., Forum AI / Stanford 2025) — metodologia para tiers de qualidade de fonte e imparcialidade
- [Sahitaj et al. 2025 (arxiv 2502.08909)](https://arxiv.org/abs/2502.08909) — o paper mostrando que 3 classes superam 5 classes para rotulagem de fact-check com LLMs
- [Lenz Research — desacordo entre LLMs](https://lenz.io/research/llm-disagreement) — por que desacordo de painel não é bug
