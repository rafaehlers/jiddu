# Benchmark PolitiFact × Jiddu

**Fecha de la ejecución:** 31/05/2026
**Pipeline:** verificador de fact-check de Jiddu — Perplexity Sonar Reasoning Pro vía OpenRouter, prompt en inglés, `force: true` (caché omitido)
**Fuente:** [dataset LIAR2](https://github.com/chengxuphd/liar2) (Apache-2.0, ~23k afirmaciones de PolitiFact etiquetadas por humanos, 2008-2023)
**Muestra:** 200 afirmaciones, estratificadas en 50 por bucket en las cuatro categorías polares de PolitiFact (`true`, `mostly_true`, `false`, `pants_on_fire`), filtradas desde 2020 en adelante para que la búsqueda web de Perplexity Sonar todavía alcance fuentes primarias contemporáneas
**Costo:** ~US$ 5-6 de crédito OpenRouter (200 llamadas Sonar Reasoning Pro)

## TL;DR

> **En 200 afirmaciones tomadas de los buckets polares de PolitiFact, el veredicto de Jiddu coincidió con el veredicto humano en 67,5% de los casos. Desacuerdo polar estricto — Jiddu llamando una afirmación con la polaridad *opuesta* a la humana — ocurrió solo en 4,5% de los casos (9 de 200). El 28% restante fue Jiddu devolviendo `mixed` o `unverified` en lugar de un veredicto polar, patrón fuertemente concentrado en el bucket `mostly_true` de PolitiFact (58% de las afirmaciones `mostly_true` etiquetadas por el humano recibieron `mixed` de Jiddu — discutiblemente un mapeo coherente, ya que "mostly true" y "afirmación es parcialmente correcta, parcialmente no" se solapan por definición).**

Restringiendo a los tres buckets menos ambiguos de PolitiFact (`true`, `false`, `pants_on_fire`), Jiddu concuerda con el veredicto humano en **122/150 = 81,3%** de los casos. El bucket intermedio `mostly_true` es donde la salida de mayor resolución de Jiddu (`mixed`) reemplaza un veredicto polar en más de la mitad de los casos.

Esta es la primera medición de calidad de Jiddu contra un estándar-oro humano de terceros. Será reejecutado cuando el prompt del verificador, la elección de modelo o el pipeline cambien materialmente.

## Setup

### Qué se midió

Para cada afirmación muestreada, llamamos la misma función `verifyClaim()` usada en producción en `/api/factcheck/[id]/verify`. Entradas:
- `statement` — el texto de la afirmación viniendo de LIAR2, tal cual, sin el contexto del artículo de PolitiFact alrededor
- `type` — heurística best-effort basada en el texto de la afirmación (numeric / date / quote / causal / categorical)
- `lang` — `en`
- `force: true` — omite el caché de veredictos de Jiddu para que cada llamada golpee a Perplexity fresca

Salida capturada por afirmación:
- El veredicto (`supported` / `contradicted` / `mixed` / `unverified`)
- La confianza (0-1)
- El texto de la justificación
- El número de fuentes citadas devuelto por Sonar
- La duración wall-clock

El harness corrió con concurrencia 6 (igual que producción). Wall-clock total: 6m 2s.

### Cómo se puntuó la concordancia

PolitiFact usa un Truth-O-Meter de 6 niveles (`pants_on_fire` / `false` / `mostly_false` / `half_true` / `mostly_true` / `true`); Jiddu usa 4 (`supported` / `contradicted` / `mixed` / `unverified`). Medimos solo los cuatro buckets polares y aplicamos este mapeo:

`pants_on_fire` es [la calificación más baja del Truth-O-Meter de PolitiFact](https://www.politifact.com/article/2018/feb/12/principles-truth-o-meter-politifacts-methodology-i/). PolitiFact la aplica cuando una afirmación es inexacta y, en palabras de la organización, formula una afirmación ridícula. Es una etiqueta del dataset de origen, no un veredicto de Jiddu; Jiddu asigna tanto `false` como `pants_on_fire` a `contradicted`.

| Etiqueta PolitiFact | Veredicto esperado en Jiddu |
|---|---|
| `true` | `supported` |
| `mostly_true` | `supported` |
| `false` | `contradicted` |
| `pants_on_fire` | `contradicted` |

Una afirmación está **concordada** si Jiddu devolvió el veredicto polar esperado. Está **discordada** si Jiddu devolvió el veredicto polar *opuesto* — el peor caso. Los casos restantes — `mixed` y `unverified` — se contabilizan por separado, ya que están más cerca de "no estamos haciendo una afirmación polar aquí" que de concordancia o desacuerdo.

Las etiquetas intermedias de PolitiFact (`mostly_false`, `half_true`) fueron excluidas del muestreo. Son la zona de ruido documentada en [Sahitaj et al. 2025](https://arxiv.org/abs/2502.08909) — agregarlas diluiría la señal que buscamos.

## Resultados

### Números principales

| Resultado | Cantidad | Porcentaje |
|---|---:|---:|
| Concordó (match polar) | 135 | **67,5%** |
| Discordó (opuesto polar) | 9 | **4,5%** |
| Devolvió `mixed` | 45 | 22,5% |
| Devolvió `unverified` | 11 | 5,5% |
| Error | 0 | 0% |
| **Total** | **200** | 100% |

### Matriz de confusión

Las filas son etiquetas de PolitiFact, las columnas son veredictos de Jiddu. Las celdas son conteos de afirmaciones (cada fila suma 50).

| | supported | contradicted | mixed | unverified |
|---|---:|---:|---:|---:|
| **true** | **32** | 2 | 11 | 5 |
| **mostly_true** | 13 | 5 | **29** | 3 |
| **false** | 2 | **43** | 4 | 1 |
| **pants_on_fire** | 0 | **47** | 1 | 2 |

La diagonal — afirmaciones polares de PolitiFact que recibieron el veredicto polar esperado — suma 122. El bloque más grande fuera de la diagonal es `mostly_true → mixed` con 29 casos (ver "El patrón `mixed`" abajo).

### Por tipo de afirmación

El harness asignó un tipo heurístico a cada afirmación. Muestras menores en algunos buckets:

| Tipo | Muestra | Concordó | Tasa |
|---|---:|---:|---:|
| `date` | 14 | 13 | **92,9%** |
| `numeric` | 10 | 7 | 70,0% |
| `quote` | 44 | 29 | 65,9% |
| `categorical` | 130 | 85 | 65,4% |
| `causal` | 2 | 1 | 50,0% |

Afirmaciones del tipo `date` (eventos específicos con timestamps verificables) son donde Sonar brilla. `categorical` — el catch-all para aseveraciones no estructuradas — queda en el promedio. `causal` tuvo pocas muestras para leer con confianza.

## El patrón `mixed`

La señal más sobresaliente es el solapamiento `mostly_true → mixed`: **29 de 50 afirmaciones `mostly_true` de PolitiFact recibieron `mixed` de Jiddu**.

Esto *no* es el mismo modo de fallo que un esquema de 5 clases por gradación de confianza degradándose en la frontera (según el hallazgo de Sahitaj 2025). Es un solapamiento estructural entre dos categorías semánticamente adyacentes:

- El `mostly_true` de PolitiFact se define como "la declaración es precisa pero necesita aclaración o información adicional" — i.e. parcialmente verdadera con reparos.
- El `mixed` de Jiddu se define como "afirmación es parcialmente respaldada y parcialmente contradicha por la evidencia."

Los dos describen el mismo estado epistémico. La diferencia es retórica: PolitiFact parte de "true" y baja, Jiddu queda en el medio y se extiende hacia ambos lados. **Si `mostly_true → mixed` se cuenta como mapeo sensato en lugar de error**, la tasa efectiva de salidas sensatas es `(135 + 29) / 200 = 82,0%`.

Concretamente, de la ejecución:
- *"The (Erie Co., N.Y.) health commissioner makes more than the governor, the vice president…"* — `mostly_true` según PolitiFact, `mixed` según Jiddu. Justificación de Jiddu: "Salario del Comisionado de Salud más horas extras excedió salarios-base del Gob. de NY…" — verdadero en algunas comparaciones, falso en otras.
- *"The Virginia Employment Commission is sixth in the nation for getting benefits to eligible people quickly"* — `mostly_true` según PolitiFact, `mixed` según Jiddu. Justificación de Jiddu: rankeada en sexto en algunos períodos, debajo en otros.

Son afirmaciones donde todo lector se beneficia de ver la calificación, no un veredicto en cualquiera de los dos lados.

## Los 9 desacuerdos estrictos

Los 9 casos donde el veredicto polar de Jiddu fue el opuesto del veredicto polar de PolitiFact son el conjunto más importante de esta ejecución. Se dividen en cuatro causas:

### (a) Sensibilidad temporal — Sonar evaluó evidencia actual contra afirmación histórica (4 casos)

Cuando una afirmación se hizo años atrás sobre un tema cuya situación desde entonces se invirtió, Sonar tiende a encontrar evidencia reflejando la realidad de hoy, no el momento original de la afirmación.

- *"If the vaccine came out tomorrow, how in the heck would we get it to people? There is no game plan."* — Biden, ago/2020. PolitiFact lo llamó `mostly_true` reflejando la distribución subplaneada en aquel momento. Sonar buscó en 2026 y encontró documentación extensa de distribución de vacunas, llamándolo `contradicted`.
- *"NYC could pay to house its homeless population in hotel rooms, but de Blasio has refused to do that"* — abr/2020. PolitiFact `mostly_true` para aquel momento; Sonar encontró que NYC subsecuentemente sí albergó personas sin hogar en hoteles y lo llamó `contradicted`.
- *"A 'default on our debt' would be unprecedented in American history"* — Jeffries, ene/2023. PolitiFact `mostly_true` en el contexto moderno; Sonar encontró near-defaults históricos (mini-default de 1979, salida del patrón-oro de 1933) y lo llamó `contradicted`.
- *"No state gets back less from Washington than New York state"* — Cuomo, ene/2021. Rankings estatales cambian año a año; Sonar tomó un informe del Rockefeller Institute de 2025 que rankea NY diferente.

**Conclusión:** el pipeline no sabe cuándo se hizo una afirmación y aplica resultados de búsqueda *actuales*. Una mejora futura sería inyectar la fecha de la afirmación en el prompt de Sonar — "en <fecha>, ¿esto era verdadero?". Vale señalar en la justificación aunque no lo resolvamos del todo.

### (b) Cita literal verdadera vs. meta-afirmación falsa (2 casos)

PolitiFact frecuentemente clasifica una afirmación como `false` cuando las palabras literales fueron dichas pero la implicación engaña. Sonar verifica que la cita fue dicha, luego la defiende.

- *"Foxconn hasn't hit job targets on its Wisconsin factory because 'No. 1, you had a pandemic'"* — Trump, 2020. PolitiFact `false` porque Foxconn ya estaba incumpliendo metas pre-pandemia. Sonar `supported` porque la cita en efecto se dijo.
- *"An audio message lists five ways people can prevent the novel coronavirus"* — mensaje en cadena, 2020. PolitiFact `false` porque el audio viral específico era engañoso. Sonar `supported` porque existe un segmento NPR parecido.

**Conclusión:** Jiddu no distingue "la afirmación fue hecha" de "la afirmación es verdadera." Una adición corta al prompt preguntando "¿la implicación de esta afirmación es verdadera?" en lugar de "¿la afirmación es verdadera?" capturaría algunos de estos.

### (c) Matiz de Sonar es correcto, PolitiFact fue lenient en el contexto (2 casos)

Son casos donde la lectura cuidadosa de Sonar es técnicamente más defendible que la clasificación de PolitiFact — aunque la clasificación pudo haber sido correcta en el enmarcado más estrecho del artículo original.

- *"Says it's illegal to hold an absentee-only election or mail ballots to every registered voter"* — Sonar nota correctamente que Colorado, Oregon, Washington y otros lo hacen legalmente. El `true` de PolitiFact aquí puede reflejar el contexto legal más estrecho de un estado específico.
- *"Congress has one job here: to count electoral votes that have in fact been cast by any state"* — Sonar nota que el Electoral Count Act le da al Congreso más autoridad que mera cuenta. PolitiFact `true` para la descripción básica de la función.

**Conclusión:** no son fallas — son puntos donde el pipeline automatizado lee con más cuidado que el humano. Vale no sobre-corregir.

### (d) Salida del modelo / desajuste con la justificación (1 caso)

- *"Sen. Marco Rubio 'helped write the law to raise prescription prices'"* — La justificación de Sonar dice que Rubio co-patrocinó un proyecto que *aumentaría* precios si se promulgara (consistente con `mostly_true` de PolitiFact), pero el veredicto salió `contradicted`. Es una inconsistencia a nivel de modelo entre el texto explicativo y la etiqueta final.

**Conclusión:** desajustes entre justificación y veredicto ocurren a tasas bajas. Una mejora futura: un paso automatizado de sanity-check que señale afirmaciones donde la justificación y el veredicto son mutuamente inconsistentes.

## Limitaciones

1. **Tamaño de la muestra.** 200 afirmaciones dan un intervalo de confianza de ±5% en el número principal. Una ejecución de 500 afirmaciones lo apretaría a ±3%, a un costo de ~US$ 15.
2. **PolitiFact es política de EE.UU.** El benchmark no dice nada sobre la precisión de Jiddu en política brasileña, claims científicas, deportivas o cualquier dominio no político-estadounidense. Elegimos este dataset porque es el único corpus de fact-check a gran escala estructurado con licencia permisiva, no porque represente la distribución de entrada de Jiddu. Un benchmark Lupa/Aos Fatos en PT-BR requeriría raspar el HTML publicado de ellos — trabajo separado.
3. **PolitiFact tiene sus propios sesgos.** La metodología fue criticada por aplicación inconsistente a lo largo del espectro político, particularmente por fuentes de derecha. Estamos midiendo alineación con el juicio editorial de un equipo humano, no con "verdad".
4. **Sin contexto de la afirmación.** Jiddu recibió solo el texto de la afirmación pelado. Los fact-checkers humanos de PolitiFact tenían el artículo original, la declaración completa del orador y el contexto histórico. Esto handicapa a Jiddu frente a la referencia humana — lo que también es la condición realista de producción.
5. **Calidad auto-declarada.** Esto es ejecutado por el desarrollador del pipeline siendo medido. Reproducibilidad (abajo) es la mitigación.
6. **Riesgo de filtración en tiempo de prueba.** Algunas afirmaciones de PolitiFact en LIAR2 pueden estar indexadas por la búsqueda web de Perplexity — Sonar podría en principio encontrar el artículo PolitiFact original y repetir el veredicto. No filtramos esto; hacerlo requeriría inspeccionar URLs de fuente manualmente. La matriz de confusión no muestra precisión patológica que sugiera que esto está ocurriendo (43-47/50 en los buckets polares), entonces el sesgo probablemente es pequeño.

## Reproducción

```bash
# Desde un checkout local autorizado:
npm install
cp .env.example .env   # agrega tu OPENROUTER_API_KEY
npx prisma migrate dev
npx tsx scripts/benchmark-politifact.mts            # ejecución completa de 200 claims, ~6 min, ~US$ 6
npx tsx scripts/benchmark-politifact.mts --sample=20  # smoke run, ~1 min, ~US$ 0,60
```

La seed es fija (`SHUFFLE_SEED = 0x6a696464`) entonces las mismas 200 afirmaciones se muestrean en reruns. Resultados por afirmación caen en `scripts/data/bench-<timestamp>.json`. Reejecuta después de cualquier cambio de prompt en `src/lib/verify-claim-prompt.ts` para detectar regresiones.

## Ver también

- [Claimify (arxiv 2502.10855)](https://arxiv.org/abs/2502.10855) — el paper que inspiró la etapa de extracción de Jiddu
- [Distilling Expert Judgment at Scale](https://www.byforum.com/whitepaper-files/distilling-expert-judgment-at-scale.pdf) (Goldfarb et al., Forum AI / Stanford 2025) — metodología para tiers de calidad de fuente e imparcialidad
- [Sahitaj et al. 2025 (arxiv 2502.08909)](https://arxiv.org/abs/2502.08909) — el paper mostrando que 3 clases superan a 5 clases para etiquetado de fact-check con LLMs
- [Lenz Research — desacuerdo entre LLMs](https://lenz.io/research/llm-disagreement) — por qué desacuerdo de panel no es bug
