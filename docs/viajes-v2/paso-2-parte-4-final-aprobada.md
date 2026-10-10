# Viaje V2 · Paso 2, parte 4 aprobada: el final del viaje (30/09/2026)

Aprobada por Naza (rondas en `paso-2-parte-4-final-ronda-*.md`). Redactó Fable.

| ID | Cuándo | Texto |
|---|---|---|
| FN1 | Noche anterior a la vuelta (reemplaza la noche común; el mediodía llega normal) | Mañana te volvés. Antes de armar la valija, contame una cosa de este viaje que no querés que se te olvide, una sola, y por qué esa. Si tenés una foto, que venga. |
| VU0 | Mediodía del día de vuelta (la única extra de ese día) | Hoy se vuelve, {{nombre}}. ¿Qué te traés en la valija que no estaba a la ida? Sacale una foto, donde estés. |
| VU1 | Noche del día de vuelta | La vuelta se hace distinto que la ida. Contame el momento del viaje de hoy en que sentiste que ya estabas volviendo, lo que fuera que te lo marcó. Qué había alrededor y en qué pensabas. |
| CA1 | Al otro día de volver (última pregunta de historia) | Ya volviste, {{nombre}}. Quedate en el primer rato en casa, con la valija todavía cerrada: contame qué te llamó la atención de tu propia casa después de estar afuera, aunque sea una pavada. Si tenés una foto de eso, mandala. |
| AL1 | Apenas contesta CA1 | Una última cosa, {{nombre}}: el álbum. Juntá las {{fotos_album}} fotos del viaje que más quieras tener en el libro y mandámelas acá mismo, en una tanda o en varias, como te quede cómodo. Cuando estén todas, escribime "listo"; si te olvidás, en un rato te pregunto yo. |
| AL2 | 5 horas sin fotos nuevas | ¿Ya están todas, {{nombre}}? Si me decís que sí, o si no me contestás, cierro el álbum con las que mandaste. |

**Reglas del álbum:**
- `{{fotos_album}}` = 20 o 40, según lo que compró.
- Se cierra con "listo", o con un sí a AL2, o si no contesta AL2.
- Si contesta "no" o manda más fotos, se vuelven a contar 5 horas y AL2 sale **una vez más como mucho**; después se cierra igual.
- Si manda de más, se guardan las primeras {{fotos_album}} y la despedida lo aclara.
- **Con cero fotos no sale AL2: se avisa a Naza y decide él** (el libro es pago; una persona mira antes).
- Entre AL1 y la despedida no hay otros recordatorios.

**Cambio de regla:** el día de vuelta ahora sí tiene extra de mediodía (VU0). El de salida sigue sin extra (a la mañana va UC1).

**Descartado (queda en las rondas):** FN1 A, VU1 A, CA1 A, AL1 B, AL2 B, VU0 B; la regla de 48 horas; la foto de la puerta con CA1.
