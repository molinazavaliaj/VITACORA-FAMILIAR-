# Plantillas de WhatsApp (Meta) para la entrevista V3 en catalán — 05/10/2026

Para cargar en **WhatsApp Manager → Plantillas de mensajes**, idioma **Catalan (`ca`)**, en la WABA "Vitácora" (`1997432587590526`). Las reglas de Meta que ya nos frenaron (ver `entrevistador/PLANTILLAS.md`): variables posicionales `{{1}}`, nunca al principio ni al final del cuerpo, y cada variable con un ejemplo.

Los textos son los de [`../banco-ca.md`](../banco-ca.md) (BIEN, M8, M9), con `{{nombre}}` → `{{1}}`. La única frase nueva es la de la plantilla 2 ("Aquí tens la pregunta que segueix…"), revisada con Softcatalà (0 avisos). Ejemplos de las variables: inventados.

## Cuándo se usa cada una

Dentro de las 24 h desde el último mensaje del narrador todo va como texto libre (con los textos de `banco-ca.json`, como en castellano). Las plantillas son solo para **abrir** la charla:

| # | Nombre | Cuándo | Categoría probable |
|---|---|---|---|
| 1 | `bienvenida_v3_ca` | El primer mensaje (BIEN). Lleva el botón [Comencem]: al tocarlo se abre la ventana y la primera pregunta (OR1, con M1) sale como texto libre, con su formato. | Marketing |
| 2 | `pregunta_v3_ca` | Si hay que mandar una pregunta con la ventana cerrada (por ejemplo, si no tocó [Comencem] y se decide mandar OR1 igual). Sin cursiva ni saltos adentro de la variable. | Marketing |
| 3 | `recordatorio_v3_ca` | M8: a los pocos días sin respuesta. | Utility |
| 4 | `aviso_familia_v3_ca` | M9: a la semana, a quien regaló. | Utility |

## 1. `bienvenida_v3_ca` — variables: {{1}} cómo le dicen · botón de respuesta rápida [Comencem]

Cuerpo:

```
Hola, {{1}}, com estàs? Una persona que t'estima molt t'ha regalat un llibre amb la història de la teva vida, i jo soc qui t'entrevistarà per fer-lo. Ho farem aquí, per WhatsApp, amb calma.

Funciona així: t'envio una pregunta i tu em respons amb un àudio, com si parléssim en persona. Envia'm tots els àudios que vulguis. Quan acabis no cal que m'avisis: si passen uns minuts sense àudios nous, t'envio la pregunta següent.

Si alguna pregunta no té res a veure amb la teva vida, m'ho dius, o m'expliques el que sí que et va passar a tu. I sense pressa: ho anirem fent al teu ritme.
```

Botón (respuesta rápida): `Comencem`
Ejemplo de {{1}}: `Roser`

## 2. `pregunta_v3_ca` — variables: {{1}} cómo le dicen, {{2}} la pregunta (en una sola línea)

Cuerpo:

```
Aquí tens la pregunta que segueix, {{1}}:

{{2}}

Quan vulguis, em respons amb un àudio. Sense pressa.
```

Ejemplos: {{1}} `Roser` · {{2}} `Com era la casa on vas créixer? Explica'm què recordes de quan hi entraves.`

## 3. `recordatorio_v3_ca` — variables: {{1}} cómo le dicen

Cuerpo:

```
Hola, {{1}}. Han passat uns quants dies i volia saber com estàs. La teva història és aquí, guardada tal com la vas deixar. Quan tinguis una estona, em respons a la pregunta que va quedar pendent. Sense pressa.
```

Ejemplo de {{1}}: `Roser`

## 4. `aviso_familia_v3_ca` — variables: {{1}} quién regaló, {{2}} cómo le dicen al narrador

Cuerpo:

```
Hola, {{1}}. T'aviso que fa una setmana que {{2}} no envia àudios. Pot ser qualsevol cosa: que tingui altres coses al cap, que no miri gaire el mòbil o que li costi una mica tornar-s'hi a posar. Si pots, truca-li o fes-li una visita i pregunta-li com va amb el llibre; moltes vegades, amb una conversa amb algú de la família, s'hi torna a enganxar. El que ja ha explicat està guardat. Si hi ha alguna cosa que hagi de saber, m'ho dius.
```

Ejemplos: {{1}} `Jordi` · {{2}} `Roser`

Ojo: este le llega a **quien regaló**, que eligió catalán para el narrador pero puede no hablarlo. Si el pedido dice que quien regala escribe en castellano, mandar el M9 castellano.

## Notas para Joaquín
- Si `pregunta_v3_ca` o `bienvenida_v3_ca` quedan en revisión, para Imma alcanza con que ella escriba primero (o conteste algo) y todo va como texto libre dentro de la ventana.
- El castellano V3 tampoco tiene todavía plantillas propias: las que hay (`bienvenida`, `pregunta_diaria_vos`, `recordatorio`) son de la entrevista vieja ("cada mañana", "responda SÍ"). Si se quieren las cuatro gemelas en castellano, salen de BIEN, M8 y M9 de `banco.md` con el mismo molde.
