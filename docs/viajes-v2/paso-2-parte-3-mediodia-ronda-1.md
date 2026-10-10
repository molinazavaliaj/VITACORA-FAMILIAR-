# Viaje V2 · Paso 2, parte 3: el mediodía, ronda 1 (30/09/2026)

Naza aprobó la noche tal cual y sacó NO10 (`paso-2-parte-2-noches-aprobada.md`).

## Qué es el mediodía (Fable)
La noche pide el día contado, en pasado y con tiempo. El mediodía pide un pedazo del **ahora**, sin contar: una foto o un audio de diez segundos de lo que tiene delante. Eso arma después el hilo del viaje y el álbum.

## Primera tanda

| ID | Qué busca | Riesgo | Fable elige |
|---|---|---|---|
| MD1 | Dónde estás: el hilo del viaje, día por día | La foto de postal | A |
| MD2 | Lo que tenés en la mano | Siempre el celular | A |
| MD3 | Lo que se escucha | Que hable arriba del sonido | A |
| MD4 | El cielo, la luz del día | Ninguno serio | B |
| MD5 | Lo que llevás puesto: el retrato del día | Vergüenza | A |
| MD6 | Algo escrito: un cartel, un menú | Buscar el gracioso | B |
| MD7 | Un detalle chiquito | Foto genérica | A |
| MD8 | Lo que viene ahora | Que conteste el plan del día entero | A |

- **MD1** A: Foto de dónde estás ahora mismo, {{nombre}}, sin explicar nada. · B: Sacale una foto a lo que tenés delante en este momento, tal cual está.
- **MD2** A: ¿Qué tenés en la mano ahora, además del teléfono? Foto, y si querés un audio de qué es. · B: Mostrame algo que tengas a mano en este momento, lo primero que agarres.
- **MD3** A: Mandame diez segundos de audio de lo que se escucha ahí ahora, sin hablar vos. · B: Callate un momento y grabame lo que suena alrededor tuyo.
- **MD4** A: Mirá para arriba y sacale una foto al cielo de hoy. · B: ¿Cómo está el cielo ahí? Foto, con lo que se cuele abajo.
- **MD5** A: Foto de cómo saliste hoy, {{nombre}}: de cuerpo entero o solo las zapatillas, como te dé. · B: Mostrame lo que tenés puesto hoy. Vale un espejo, una vidriera o solo los pies.
- **MD6** A: Sacale foto a algo escrito que tengas cerca ahora: un cartel, lo que sea. · B: Un cartel, un menú, un nombre de calle: foto del primero que veas.
- **MD7** A: Foto de algo chiquito que tengas a menos de un metro, lo que sea. · B: Acercate a algo, lo que tengas más cerca, y sacale una foto de cerca.
- **MD8** A: En una frase, {{nombre}}: ¿qué viene ahora? Y una foto de por dónde vas. · B: ¿Adónde vas caminando ahora mismo? Un audio cortito, o foto del camino.

**Rotación (Fable):** alternar foto sin texto (MD1, MD4, MD6, MD7) con las que piden voz o cuerpo (MD2, MD3, MD5, MD8). El mediodía no toca lo mismo que la puerta de esa noche; si choca, el código lo saltea.

**Si queda sin contestar (Fable):** nada. A la noche llega la de la noche, sin recordatorio. El mediodía es un regalo, no una tarea.

## Control (Claude)
| ID | Nota |
|---|---|
| MD3 | El libro es de papel: un sonido sin palabras no entra, salvo que el libro tenga QR o audio. Si no, sale. |
| MD8 A | Pide dos cosas (una frase y una foto). |
| El tono | Son más secas que el resto ("Foto de…"). Es a propósito (se contesta en la calle), pero cambia la voz del biógrafo. A mirar en la lectura de corrido. |
