# Banco de prueba de historia (NO es contenido real)

Fixture para los tests de `fabrica/src/historia/entrevista/`. Mismo formato que `docs/historia/banco.md` (8 columnas en las preguntas, IDs con guion). Los textos son de prueba: nada de acá le llega a una persona.

## Arranque

| ID | Cuándo | Texto | Notas |
|---|---|---|---|
| BIEN-H | Plantilla | [prueba] BIEN-H {{1}} {{2}} | |
| COMO | Después del SÍ | [prueba] COMO | |

## Mensajes fijos

| ID | Cuándo | Texto |
|---|---|---|
| PR-H1 | 1.ª propia | [prueba] PR-H1 {{quien_regala}}<br><br>«{{pregunta}}» |
| FOTO-H | Después de la última del tema; botón [No tengo fotos] + M31 | [prueba] FOTO-H, {{nombre}} |
| FIN-H | Después de HC10 | [prueba] FIN-H.«sino:FOTO-H:  ‖  Con foto.» |
| M1 | Las 3 primeras | _[prueba] M1_ |
| M3.1 | Acuse | [prueba] M3.1 |

## Bloque 1 · El antes

| ID | Pregunta | Depende de | Parte | Clase | Sensible | Tema | Reemplaza |
|---|---|---|---|---|---|---|---|
| HC1 | [prueba] HC1 sobre {{historia}}, {{nombre}} |  | núcleo | historia |  | comun |  |
| HC2 | [prueba] HC2 sol{{o/a}} |  | núcleo | historia |  | comun |  |

## Bloque 2 · Lo propio del tema

| ID | Pregunta | Depende de | Parte | Clase | Sensible | Tema | Reemplaza |
|---|---|---|---|---|---|---|---|
| HM1 | [prueba] HM1 |  | núcleo | historia |  | mudanza |  |
| HM2 | [prueba] HM2 |  | núcleo | historia |  | mudanza |  |
| HO1 | [prueba] HO1 |  | núcleo | historia |  | otra |  |

## Bloque 3 · Lo más difícil

| ID | Pregunta | Depende de | Parte | Clase | Sensible | Tema | Reemplaza |
|---|---|---|---|---|---|---|---|
| HC5 | [prueba] HC5 |  | núcleo | historia | sí | comun |  |

## Bloque 4 · El cierre

| ID | Pregunta | Depende de | Parte | Clase | Sensible | Tema | Reemplaza |
|---|---|---|---|---|---|---|---|
| HC10 | [prueba] HC10 |  | núcleo | cierre |  | comun |  |

## Bloque 5 · Variantes

| ID | Pregunta | Depende de | Parte | Clase | Sensible | Tema | Reemplaza |
|---|---|---|---|---|---|---|---|
| HC5-M | [prueba] HC5-M |  | núcleo | historia | sí | mudanza | HC5 |
| HC1-A | [prueba] HC1-A |  | núcleo | historia |  | comun | HC1 |

## Reglas del flujo

| HX9 | esto ya no se lee |  | núcleo | historia |  | comun |  |
