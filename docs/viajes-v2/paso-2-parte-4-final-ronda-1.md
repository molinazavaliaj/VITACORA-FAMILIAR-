# Viaje V2 · Paso 2, parte 4: el final del viaje, ronda 1 (30/09/2026)

Mediodía aprobado en `paso-2-parte-3-mediodia-aprobada-v2.md`. Horario: opción A (país principal en la compra; la bienvenida avisa que se corrige desde el panel).

## Lo que trajo Fable

| ID | Cuándo | Qué busca | Riesgo | Fable elige |
|---|---|---|---|---|
| FN1 | Noche anterior a la vuelta (reemplaza la noche común) | El momento en que se dio cuenta de que se terminaba | El balance ("fue hermoso") | A |
| VU1 | Noche del día de vuelta | El momento de sentir que ya está volviendo | Horarios; que esté en el avión o ya en casa | B |
| CA1 | Al otro día de volver (última pregunta) | La primera escena en casa | El balance, o la lista de pendientes | B |
| AL1 | Después de CA1 | Que mande las fotos del álbum y se sepa cuándo terminó | Que mande cien, o de a una durante una semana | A |

- **FN1 A:** Última noche allá, {{nombre}}. No me hagas el balance todavía: contame el momento de hoy en que te cayó que mañana te volvés. Dónde estabas, qué estabas haciendo. Si hay foto de eso, mandala.
- **FN1 B:** Mañana te volvés. Antes de armar la valija, contame una cosa de este viaje que no querés que se te olvide, una sola, y por qué esa. Si tenés una foto, que venga.
- **VU1 A:** Hoy fue el viaje de vuelta, {{nombre}}. Contame un rato del camino en que ya no estabas allá y todavía no estabas en casa: qué te venía a la cabeza de estas semanas, y qué esperabas encontrar al llegar.
- **VU1 B:** La vuelta se hace distinto que la ida. Contame el momento del viaje de hoy en que sentiste que ya estabas volviendo, lo que fuera que te lo marcó. Qué había alrededor y en qué pensabas.
- **CA1 A:** Ya estás en casa. Contame el momento de abrir la puerta: qué fue lo primero que viste u oliste, y si algo te pareció distinto de como lo dejaste. Si hay foto, mandala.
- **CA1 B:** Ya volviste, {{nombre}}. Quedate en el primer rato en casa, con la valija todavía cerrada: qué hiciste primero, qué te llamó la atención de tu propia casa después de estar afuera. Si tenés una foto de eso, mandala.
- **AL1 A:** Una última cosa, {{nombre}}: el álbum. Elegí las {{fotos_album}} fotos del viaje que más quieras tener en el libro y mandámelas acá mismo, en una tanda o en varias, como te quede cómodo. Cuando estén todas, escribime "listo" y con eso cierro.
- **AL1 B:** Ahora el álbum del libro. Mandame acá las {{fotos_album}} fotos del viaje que más te gustan, las que quieras ver impresas, sin ningún orden. Avisame con un "ya está" cuando hayas mandado la última.
- Cómo se sabe que terminó (Fable): "listo"; o cuando llegan las {{fotos_album}}; o 48 horas sin fotos nuevas.

¿Qué le falta? (Fable): 1) una extra al mediodía del día de vuelta ("¿qué te traés en la valija que no estaba a la ida?"); 2) la foto de la puerta de casa con CA1; 3) ningún recordatorio entre AL1 y la despedida.

Control (Claude): la idea 1 va contra "sin extra el día de vuelta"; CA1 B también pide dos cosas; en AL1 "Elegí" suena a formulario ("Juntá").

## Decisiones de Naza
- **FN1 B · VU1 B · CA1 B · AL1 A.**
- **Control: aprobado** → CA1 B con una sola cosa; AL1 con "Juntá" en vez de "Elegí".
- **Sí a la idea 1 de Fable:** una extra al mediodía del día de vuelta (cambia la regla "sin extra el día de vuelta"; el de salida sigue sin extra).
- **Fin del álbum:** si pasan **5 horas sin fotos nuevas**, le llega un mensaje preguntando si ya está ("¿cerramos?") y con eso se cierra. Reemplaza la regla de las 48 horas. "Listo" también cierra.
- Ideas 2 y 3: no las eligió (la 3 queda cubierta por la regla de las 5 horas).
