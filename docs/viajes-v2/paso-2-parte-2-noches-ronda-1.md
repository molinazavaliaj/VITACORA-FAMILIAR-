# Viaje V2 · Paso 2, parte 2: las noches, ronda 1 (30/09/2026)

Parte 1 cerrada: `paso-2-parte-1-aprobada.md` (Naza: IM1 B, VA1 A).

La pregunta de cada noche: una sola cosa de HOY, que rota, y termina pidiendo la foto de eso. Redactó Fable; controló Claude. **A aprobar por Naza.**

## ¿Saludo fijo antes de la pregunta?
Fable: **no**. Un saludo igual todas las noches es lo primero que delata la plantilla; mejor que cada pregunta arranque distinto. Si Naza lo quiere: (a) "Buenas noches, {{nombre}}." (b) "¿Cómo terminó el día, {{nombre}}?" (la b abre una segunda pregunta; iría la a).

## Primera tanda

| ID | Qué busca | Riesgo | Fable elige |
|---|---|---|---|
| NO1 | Una comida como escena (el primer bocado) | La lista de todo lo que comió | A |
| NO2 | Un lugar donde se quedó un rato | La lista de lo visitado | A |
| NO3 | Algo que se hace distinto que donde vive | Generalidades ("la gente es más amable") | A |
| NO4 | El momento en que más se sintió de viaje | Un adjetivo suelto | B |
| NO5 | Un cruce con alguien que no conocía | Que conteste con quién anduvo | A |
| NO6 | Lo que no estaba en el plan, y cómo siguió | Que se lea como "qué salió mal" | B |
| NO7 | Un rato sin hacer nada | "No tuve" | A |
| NO8 | El cuerpo (pies, sueño, calor) | La queja general | B |
| NO9 | Una risa | "Nada en especial" | B |
| NO10 | Llegar a un lugar nuevo | Día sin llegada; el parte del traslado | A |

### NO1 · Una comida de hoy
- **A:** Hoy, de todo lo que comiste, quedate con una cosa. Contame qué era, dónde te la comiste y qué te pasó con el primer bocado. Si le sacaste una foto, mandámela.
- **B:** ¿Qué comiste hoy que valga la pena contar? Una sola: el plato, el lugar y por qué esa. Si tenés la foto, mandala.

### NO2 · Un lugar de hoy
- **A:** De los lugares donde estuviste hoy, contame uno donde te hayas quedado un rato, aunque haya sido un banco en una plaza. Qué se veía desde ahí y qué hacías. Si le sacaste foto, mandámela.
- **B:** Un lugar de hoy, {{nombre}}, uno solo. No el más famoso: el que te quedó. Qué había ahí y qué estabas haciendo. Si tenés una foto, mandala.

### NO3 · Lo que se hace distinto
- **A:** ¿Qué viste hoy que en tu país se hace distinto? Puede ser una pavada, cómo cruzan la calle. Contame el momento en que lo notaste. Si hay foto, mandala.
- **B:** Algo de hoy que allá donde vivís sería raro. Una sola cosa, y el momento en que la viste. Si le sacaste una foto, mandámela.

### NO4 · Lo que sentiste
- **A:** ¿Hubo hoy un momento en que algo te pegó, {{nombre}}? Una emoción de golpe, la que fuera. Contame dónde estabas y qué pasó justo antes. Si tenés una foto de ese lugar, mandala.
- **B:** Contame el momento de hoy en que más sentiste que estabas de viaje. Dónde estabas, qué estaba pasando alrededor. Si hay foto de eso, mandámela.

### NO5 · Alguien de hoy
- **A:** Alguien con quien hablaste hoy y no conocías de antes, aunque haya sido el que te cobró el café. Contame qué pasó y qué te dijo. Si hay foto, mandala.
- **B:** Hoy seguro cruzaste a alguien nuevo. Contame ese cruce, aunque haya durado un minuto: cómo era, qué se dijeron. Si le sacaste foto, mandámela.

### NO6 · Lo que no estaba en el plan
- **A:** Contame algo de hoy que no salió como lo tenías pensado, grande o chiquito: un lugar cerrado, por ejemplo. Qué hiciste después. Si hay foto, mandala.
- **B:** ¿Qué pasó hoy que no estaba en el plan? Contame ese momento y cómo siguió la cosa. Si tenés una foto, mandala.

### NO7 · Un rato sin hacer nada
- **A:** ¿Hubo hoy algún rato en que no estabas haciendo nada, esperando algo o mirando por ahí? Contame dónde fue y en qué pensabas. Si le sacaste foto a eso, mandámela.
- **B:** El momento de parar de hoy: un café, una espera, lo que fuera. Contame dónde fue y qué había alrededor. Si tenés foto, mandala.

### NO8 · El cuerpo
- **A:** ¿Cómo terminó el cuerpo hoy? Contame el momento en que más lo sentiste, los pies o el sueño, lo que fuera, y dónde estabas. Si hay foto, mandala.
- **B:** El cuerpo también viaja. ¿En qué momento de hoy te avisó algo, cansancio o hambre, lo que fuera? Contame dónde estabas y qué hiciste con eso. Si tenés foto, mandala.

### NO9 · Una risa
- **A:** ¿De qué te reíste hoy, {{nombre}}? Contame ese momento como si me lo contaras en la mesa. Si hay foto de eso, mandala.
- **B:** Algo de hoy que te hizo reír, aunque sea una tontería: qué pasó, dónde estabas. Si le sacaste una foto, mandámela.

### NO10 · Llegar a un lugar nuevo
- **A:** ¿Llegaste hoy a algún lugar nuevo, {{nombre}}? Contame el primer momento ahí, lo primero que viste al bajar. Si hoy no te tocó, decímelo y ya; si hay foto, mandala.
- **B:** Si hoy llegaste a un lugar nuevo, contame el primer rato: lo primero que viste y qué pensaste. Si tenés una foto de esa llegada, mandala.

## Criterio de rotación (Fable)
Alternar afuera (lugar, lo distinto, alguien, llegada) y adentro (lo que sentiste, el cuerpo, el rato quieto), con las livianas (comida, risa) entre dos pesadas. Empezar por comida y lugar, que son las más fáciles.

## Control de reglas (Claude)
| ID | Qué se cambia |
|---|---|
| NO3 A | "En tu país" da por hecho que viaja al exterior (puede ser un viaje dentro del país). La B ("allá donde vivís") no tiene ese problema. |
| NO10 A | "Si hoy no te tocó, decímelo y ya; si hay foto, mandala" junta dos avisos y se lee torpe. Además, en la mayoría de los días no hay llegada: conviene que sea una de las que menos veces vuelve. |
| NO8 A | "¿Cómo terminó el cuerpo hoy?" suena raro. La B está mejor. |
