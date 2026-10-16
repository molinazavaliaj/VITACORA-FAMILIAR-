# La compra de Viaje y el alta en la Viaje V2 (16/10/2026)

Desde el 16/10/2026 la Vitácora de Viaje es solo V2. El viaje viejo (V1) se borró del código.
Este es el acuerdo entre la web (la compra) y el bot (el alta).

## Qué escribe la web al comprar

En el narrador, como siempre, `estado = 'invitado'` cuando se paga, `como_le_dicen`, `zona_horaria`
y `hora_preferida`. En `narradores.contexto`:

```json
{
  "modo": "viaje",
  "viaje": {
    "v": 2,
    "salida": "2026-11-10",
    "vuelta": "2026-11-20",
    "zonaCasa": "America/Argentina/Buenos_Aires",
    "zonaViaje": "Europe/Rome",
    "horaNoche": "21:30",
    "regalo": { "quienRegala": "Tomás" },
    "preguntasPropias": ["¿Qué comiste en Nápoles?"],
    "formato": "impreso",
    "fotosAlbum": 40,
    "idioma": "es-AR"
  }
}
```

Los nombres son los de la `Compra` de `entrevistador/src/viaje-v2/nucleo/tipos.ts`. El nombre de la
persona no va: sale de `como_le_dicen`.

| Campo | Obligatorio | Qué es |
|---|---|---|
| `v` | sí | Siempre `2`. Es lo que distingue la compra nueva del formulario viejo. |
| `salida`, `vuelta` | sí | `YYYY-MM-DD`. Al menos 3 días contando los dos. `vuelta` es el día que emprende la vuelta. |
| `zonaCasa` | no | Zona IANA de su casa. Si falta, la del narrador (`zona_horaria`). |
| `zonaViaje` | sí | Zona IANA del país principal del viaje. |
| `horaNoche` | no | `HH:MM` entre 19:00 y 22:30. Si falta, 21:30. |
| `regalo` | no | Solo si es un regalo: `{ "quienRegala": "…" }`. Cambia la bienvenida (BIEN-1R). |
| `preguntasPropias` | no | Hasta 5, tal cual las escribieron. Si falta, ninguna. |
| `formato` | sí | `"pdf"` o `"impreso"`. |
| `fotosAlbum` | sí | `20` o `40`. |
| `idioma` | no | `"es-AR"`, `"es-ES"` o `"ca"`. Si falta, es-AR. |

Por tolerancia con el primer borrador de este contrato, el bot también entiende `quienRegala` suelto (en vez
de `regalo.quienRegala`), `preguntas` (en vez de `preguntasPropias`) y `album` (en vez de `fotosAlbum`). La web
nueva tiene que mandar los nombres de la tabla.

## Qué hace el bot

- **Alta sola.** Cada 15 minutos (el tick) mira los narradores `invitado` con `modo = 'viaje'` y sin fila en
  `viajes_v2`, arma la compra y crea la fila. Si la persona escribe antes del tick, el alta se hace en ese momento,
  antes de contestarle. Con la fila, el reloj de la V2 le manda la bienvenida (plantilla, o texto si ya escribió).
  Dos ticks a la vez no crean dos filas: la clave primaria es el narrador. Código: `entrevistador/src/viaje-v2/alta.ts`.
- **Formulario viejo.** Si `contexto.viaje` no trae `v: 2` (lo que manda hoy `/comprar/viaje` de main: `salida`,
  `vuelta`, `etapas`…), igual se da el alta: fechas tal cual, zona del viaje = la de su casa (el formulario no la
  pedía), formato según el pedido pagado (`pedidos.extras.impreso` o `copias`), álbum de 20 fotos, la hora de la
  noche si la que eligió cae entre 19:00 y 22:30. Los socios reciben un mail con lo que se supuso. Si viaja a otro
  país, se corrige con `npm run viaje-v2-cambiar-pais`.
- **Datos que no alcanzan.** Sin fechas, con un viaje de menos de 3 días, una zona o un idioma que no existen,
  no se adivina: un mail a los socios (una sola vez por motivo) y el narrador queda como está, sin mensajes. Con
  `contexto.viaje` corregido, el tick siguiente le da el alta. También sirve `npm run viaje-v2-alta -- <id>`
  (arma la compra de su contexto) o con `--compra compra.json`.
- **El que quedó en el viaje viejo.** Un viajero sin fila que ya había dicho SÍ (`acepto`, `activo` o `pausado`)
  no recibe nada más: ni el viaje viejo ni el Familiar, y si escribe no se le contesta. Los socios reciben un mail
  con la lista una sola vez (Ñako, 16/10).
- **Plantillas sin aprobar.** Igual que antes: dentro de las 24 h sale como texto; fuera, queda en la cola y se
  avisa a los socios. La alarma de variables pide `WA_PLANTILLAS_VIAJE_V2_LISTAS` siempre.
