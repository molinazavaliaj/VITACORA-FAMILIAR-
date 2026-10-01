# Prueba 2 — receta v2, escritor Opus contra escritor Fable (01/10/2026)

Mismo material que la prueba 1 (entrevista vieja de Naza, 57 respuestas, con dashboard). Registro y plan compartidos (Opus); escriben y arreglan Opus en `receta-v2-opus/` y Fable en `receta-v2-fable/`; revisan los mismos roles (Opus). Una ronda de arreglos (más una chica de hechos en Opus). Agentes en la sesión, USD 0 de API. Todo lo que es su vida queda en `fabrica/prueba-v3-naza/` (fuera de git).

## Juicio a ciegas (Fable, tres libros, sin saber cuál era cuál)
| Libro | Nota |
|---|---|
| **Receta v2, escribe Opus** | **7,5** |
| Receta v2, escribe Fable | 7 |
| Libro anterior (el que le gustó a Naza) | 6,5 |

La v2 con Opus gana en primera página, voz, verdad (0 inventos contra 4 + 3 del anterior). Empatan escenas (las mismas 8 en los tres: el techo lo pone la entrevista). El anterior sigue ganando en último capítulo (tiene columna) y en "material completo".

**Decisión: el escritor de la receta es Opus.**

## Lo que mejoró de la prueba 1 a la 2 (controles del código)
| | Prueba 1 | Prueba 2 (Opus) |
|---|---|---|
| Respuestas que no entraron al libro | no se medía | 1 de 57 |
| Mensajes a la familia fuera de la carta | perdidos | 0 |
| Escenas con menos del 70 % de sus detalles | no se medía | 0 |
| Primera página | 61 palabras | ~230 palabras, presentándose |

## Lo que falta corregir en la receta (próxima vuelta)
1. **El último capítulo sigue siendo bolsa** en los tres libros. El plan tiene que darle una columna (un hilo con imagen de cierre) y el balance de vida (la prueba más dura, en qué se apoyó, los altibajos) necesita una casa propia en el cuerpo ("Antes de cerrar", como el libro anterior), no "Sus frases".
2. **Se caen líneas chicas al pulir** aunque C18 diga que la respuesta está marcada: la marca prueba que la respuesta se usó, no que entraron sus frases de identidad. Falta un cotejo respuesta por respuesta (qué quedó afuera y por qué) antes de entregar.
3. **Corte de capítulos por hecho, no por época**: el hecho más fuerte de una etapa tiene que poder dar el título. Y una lectura final solo de referencias ("ese día", "ahí", "esa casa": ¿ya se nombró?).
4. **El verificador oscila** entre rondas (ronda 1 pide presente, ronda 2 pide pasado sobre lo mismo). Tiene que ver lo que se decidió antes, y el registro "hoy"/"rasgos_hoy" manda.
5. La entrevista nunca pidió un mensaje para los padres: ninguna carta lo tiene (va para el Chat B).

## Opción B ya programada (Naza, 01/10: gastar menos)
Cada paso recibe solo las secciones de la guía que le tocan (`SECCIONES` en `fabrica/scripts/escritor/lib.mjs`) y una sola ronda de arreglos. Falta el workflow automático (opción A) para correr un libro entero sin llenar el chat.
