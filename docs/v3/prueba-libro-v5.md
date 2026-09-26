# Prueba del escritor v5 — 26/09/2026, noche

Segunda prueba del día, después de la [v4](prueba-libro-v4.md). Base: el escritor de la mañana más las reglas de verdad de la v4, con las decisiones D1-D6 de Naza y Fable (en [`diseno-v3.md`](diseno-v3.md) §6). Prompts: [`prompts-escritor-v3.md`](prompts-escritor-v3.md) versión 5. Índice: `fabrica/src/v3/etapas.ts`. Todo dentro de la sesión, USD 0 de API; scripts y salidas en `fabrica/prueba-v3-naza/libro-v5/` (ignorada).

## Cómo se corrió

| Paso | Resultado |
|---|---|
| 1 Biblia | 52 personas, 39 anécdotas, 45 eventos (27 con "cambio"), 40 citas, 32 dudas. Dejó 8 anécdotas sin año → validación → reintento → 0 sin año |
| 1c Revisión | 20 dudas resueltas, 12 sin respuesta. Además de sumar lo confirmado, hubo que corregir en el texto de la biblia 4 cosas que la revisión contradecía (quién lo sacó del Liceo, la EcoSport, quién convenció a Fran) |
| 1b Etapas | 6 capítulos: 1998–2004, 2004–2010, 2010–2013, 2013–2017, 2017–2023, 2023–hoy. Con piso 800 daba 4 o 5 |
| 2 Plan | "Sin bajar los brazos"; validación 2b ok a la primera |
| 3 Prólogo, 6 capítulos **en secuencia**, carta | 5.967 palabras |
| 4 Controles | 15 marcas: 3 reales (frases repetidas) y 12 falsas (los años de los títulos, que pone el código; una paráfrasis fiel; un eco de pregunta) |
| 5 Lectura final | 16 problemas (1 alto), contra 30 (4 altos) en la v4 |
| 6 Retoque | 7 llamadas, 0 falsas alarmas; 86 de 105 párrafos idénticos |

## Comparación a ciegas de los tres libros (vara fija: [`comparador.md`](comparador.md), comparador + revisor)

| | Anterior (mañana) | **v5** | v4 |
|---|---|---|---|
| Errores graves | 0 | 1 (se perdió "Tricky") | 2 |
| Errores leves | 7 | 9 | 15 |
| Fuera de orden | 1 | **0** | 4 |
| Vida (ranking del comparador) | 1.º, por poco | 2.º, casi empate: "el que más suena a Naza hablando" | 3.º, el más tieso |
| Palabras textuales suyas (grupos de 4) | 33 % | **39 %** | 32 % |

**Lectura:** la v5 recuperó la vida y el orden del libro de la mañana y mantuvo la verdad de la v4 (0 datos falsos, 0 fuera de orden). Pierde por poco en errores leves, casi todos repeticiones dentro de un capítulo, y por un dato importante perdido.

## Hallazgos (para la v6)

1. **"Tricky" no aparece.** La biblia metió su nombre artístico como dato suelto de "los suyos hoy" y nadie lo escribió. Propuesta: el control de código exige que el apodo o nombre artístico de la ficha esté en el libro, y el plan dice en qué capítulo se cuenta.
2. **La lectura final marcó como "repetido" la vuelta a la escena del prólogo**, que el prompt pide; el retoque la dejó en media línea. Propuesta: la lectura final no marca esa vuelta salvo que copie las mismas oraciones.
3. **Un "adelanta" se arregla borrando:** la separación de Chiara estaba en la anécdota de 2016 (su inicio); el retoque la sacó por adelantar y no quedó en ningún capítulo. Propuesta: el retoque nunca borra un hecho que no se cuenta en otro lado (lo deja en media línea vaga), y la biblia parte las anécdotas que cruzan de etapa (inicio y fin en años distintos).
4. **Duda de grafía sin respuesta borró un nombre** ("Juancito" quedó "el que hoy es mi mejor amigo"). Propuesta: una duda de *cómo se escribe* no impide usar el nombre como lo dijo.
5. **1c tiene que corregir el texto de la biblia**, no solo sumar hechos: los hechos contradichos por la revisión quedaban vivos en resúmenes y en la línea de tiempo.
6. **La biblia deja años en null** aunque el prompt dice que se calcule: la validación con reintento lo resolvió. Queda en el código (1b valida y reintenta).
7. **Piso 600, no 800:** con 800 su libro daba 4 capítulos (lo que no le gustó de la v4). A confirmar con otro narrador.
8. **El tope de palabras por capítulo quedó justo** (×1,15 de lo estimado): un capítulo con 6 anécdotas tuvo 800. Propuesta: ×1,4; igual rige "nunca estirar".
9. **Presentaciones:** dos personas aparecen en el capítulo 5 y se presentan en el 6 (la regla de ≥150 palabras eligió el 6). Propuesta: se presenta en el primer capítulo donde tiene un hecho propio.
10. **Los años de los títulos son calculados** (1998–2004…). El control de años tiene que saltear los títulos; si se quiere, "hacia 2004" cuando el corte no es seguro. A decidir.
11. **Duda para Naza:** ¿"Juancito" (mejor amigo de la facultad) es Juan Damico (amigo del Fátima)?

## Tokens

Unos 3,5 millones de tokens de agentes dentro de la suscripción; USD 0 de API.
