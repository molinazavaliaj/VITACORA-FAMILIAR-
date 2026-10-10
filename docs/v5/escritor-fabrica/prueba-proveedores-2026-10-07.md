# Prueba de proveedores: DeepSeek y Gemini (07/10/2026)

Pedido de Naza: "que tareas podemos delegar en deepseek y probarlas antes"; después sumó Gemini. Solo con el material de Naza (su libro v5.3, 95 respuestas), con su autorización. Versión barata: sin la versión "Opus como hoy"; la referencia es el capítulo VI de su libro aprobado (sesión, Opus).

Código: `fabrica/src/escritor/modelo/{deepseek,gemini,mixto,sse}.ts`, perfiles en `modelo/configuracion.ts` (`--perfil` en `scripts/escritor-correr.ts`), cazador con `--proveedor`. Carpetas (fuera de git): `fabrica/prueba-v3-naza-proveedores/`, `fabrica/prueba-v3-naza-etapa-a/`.

## Gasto
DeepSeek a precio de hora pico (la API lo cobró menos). Capítulo todo DeepSeek USD 0,76; capítulo Opus + resto DeepSeek USD 1,49 (0,74 de Opus, con una reescritura C30); registro DeepSeek USD 0,71; cazador DeepSeek 0,10. Gemini: 0 (no se pudo).

## Resultados
- **Gemini: sin resultado.** La capa gratis no deja usar 3.1 Pro (429) y 3.8 Flash devolvió 503 (sobrecargado) en todos los intentos. Para probarlo hace falta la cuenta paga.
- **Registro con DeepSeek: falla.** Tres intentos, ninguno pasa C14 (frases que no son textuales, fechas como seguras sin número).
- **Cazador con DeepSeek: falla.** Devolvió un JSON roto en el bloque 3; y cuesta 0,03–0,07 por bloque (no es más barato que Opus 5.5 medio).
- **Capítulo VI, jueces a ciegas (Opus / Fable):**

| Versión | Opus | Fable | Inventos |
|---|---|---|---|
| Sesión (Opus, aprobado) | 7 | 7,5 | ninguno |
| Capítulo Opus + armador, hechos, veedor, arreglo y estilo DeepSeek | 6 | 6 | una fecha falsa (arquitectura vs R74), enlace secuestro→deudas, "era una reunión más", pierde la cita textual del hermano |
| Todo DeepSeek (321 palabras) | 4,5 | 5,5 | mezcla la deuda con Ivo, agrega cosas del secuestro; un resumen, no un relato |

- **El trabajo de DeepSeek sobre el capítulo de Opus** (juez Opus): verificador de hechos 4/10 (se le escaparon un tiempo verbal y una cronología), veedor 5/10 (pidió sacar la única cita textual), **arreglador 2/10 (metió el dato falso de arquitectura, cambió la cita por una paráfrasis, giros con dos puntos, borró que el hermano está preso)**, estilo 5/10.

## Veredicto
DeepSeek no sirve para este producto: inventa justo donde el libro no puede fallar (arreglos, registro) y en lo mecánico no es más barato que Haiku (piensa mucho: estilo 0,07 vs 0,03). Lo único "con cuidado" (verificar hechos, veedor, estilo) no compensa el riesgo. Gemini queda sin juzgar: solo vale la pena con la cuenta paga (también por privacidad).
