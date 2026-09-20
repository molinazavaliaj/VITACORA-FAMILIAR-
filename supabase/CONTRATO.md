# CONTRATO DE DATOS — leer antes de tocar cualquier tabla

Los dos servicios se comunican SOLO por esta base. Cambiar el esquema = nueva
migración en `supabase/migrations/` + actualizar este archivo + avisar al otro socio.

## Propiedad de escritura

| Tabla | Escribe | Lee | Nota |
|---|---|---|---|
| `familias` | web | entrevistador | |
| `narradores` | web (crea, edita datos, `edicion`, `libro_aprobado_at`) / entrevistador (solo `estado`, `dia_actual`, `ultima_respuesta_at`, `alerta_silencio`, `consentimiento_voz_at`) / fábrica (solo `libro_aprobado_at`, a los 30 días sin cierre) | ambos | Única tabla compartida. La web también apaga `alerta_silencio`. La fábrica lee `edicion` y **no produce nada sin `libro_aprobado_at`** (ni digital ni impreso). Desde el 13/09, si pasan 30 días desde `ultima_respuesta_at` sin cierre, la fábrica misma pone `libro_aprobado_at` (único caso en que alguien más que la web escribe esa columna). |
| `preguntas` | **web** (copia las fijas al comprar; la familia edita, salta, reordena, agrega) / **entrevistador** (adaptativas y reemplazos) / seed (plantilla global) | ambos | Desde el 12/09 **cada narrador tiene su guion propio**. Las globales (`narrador_id = null`) son solo plantilla. Regla: `orden ≤ dia_actual` está **congelado**, nadie lo toca. |
| `respuestas` | entrevistador | web | La web NUNCA escribe acá. |
| `saludos` | ~~web / entrevistador~~ | — | **Fuera de la fase 1 (10/09).** Nadie la escribe ni la lee — desde el 13/09 tampoco la fábrica (dejó de leerla en `generarPaquete`/`generarAudiolibro`; el audiolibro ya no tiene bonus de saludos). Se deja por si la fase 2 la revive. |
| `fotos` | web (sube y ordena) | fábrica | Nueva 12/09. Por capítulo; `principal` abre, el resto cierra. Desde el 13/09 la fábrica las embebe como data URI en `libro.html`. **14/09: `capitulo` nullable** — NULL = foto del álbum del libro (candidata a tapa / contratapa / marco), no va en ningún capítulo; la fábrica la ignora al armar capítulos. |
| `invitados` | web | web | Nueva 12/09. `rol` (13/09): `'invitado'` (hasta 3, con el libro abierto, ven todo) o `'visitante'` (abrió el link del libro cerrado y lo guardó: ve la muestra y compra su copia, sin tope). |
| `pedidos` | web y fábrica | — | El entrevistador no la mira. Un pedido por comprador: los invitados y visitantes que compran su copia tienen su propia `familia` y su propio pedido sobre el mismo `narrador_id`. |
| `envios` | entrevistador | — | Log de salientes; idempotencia del scheduler. |
| `narraciones` | fábrica (crea la fila; y `estado = 'reemplazada'` cuando pide la voz de nuevo — migración 20260920) / worker de voz (`estado`, `motor`, `muestras`, `capitulos_paths`, `error`, `tomada_at`) | fábrica | Nueva 16/09. Buzón con el worker de voz (PC de Naza); ver "Narraciones (voz clonada)". |

## Transiciones de estado de `narradores.estado`

    pendiente_pago → invitado    (web: el pago se confirmó — migración 20260911, pago por adelantado)
    invitado → acepto            (entrevistador: recibió el "SÍ")
    acepto → activo              (entrevistador: envió la pregunta 1)
    activo → pausado             (entrevistador: el narrador pidió parar)
    pausado → activo             (entrevistador: el narrador volvió a escribir)
    activo → completado          (entrevistador: última respuesta recibida y despedida enviada)
    activo|pausado → cerrado_anticipado  (web: la familia pidió cierre con ≥10 respuestas)

Ningún otro salto es válido. Quien detecta un estado imposible loguea y NO corrige solo.

`pendiente_pago` existe porque la compra crea al narrador ANTES de que el cobro esté
confirmado (modelo del 11/09). **El entrevistador no lo mira nunca**: no está en ninguna
de sus listas, así que un narrador sin pagar no recibe WhatsApp. Si el pago no llega, el
narrador queda ahí y la web lo limpia; no es un estado del que el entrevistador tenga que
salir.

`narradores.contexto` — claves que escribe el **entrevistador** (14/09, además de las de
Naza `preguntasEnviadas` / `repreguntasEnviadas` / `resumenesCapitulos`):
`mailsEnviados` (lista de hitos ya mandados: `acepto`, `primera`, `mitad`, `silencio`).
La web escribe `ritmo` y `evitar`; el entrevistador los lee. Cada escritura relee el
contexto antes de guardar para no pisar al otro. `envios.tipo = 'oferta_siguiente'`
(migración 12/09) ya se usa: la oferta de "otra pregunta ahora" en ritmo `dos_por_dia`.

`pedidos.extras` (jsonb, misma migración): **qué se compró** (13/09: ya no hay "base";
los tres productos son independientes y al menos uno va).
```
{"pdf": true|false, "audiolibro": "clonada" | "narrador" | "real" | null,
 "impreso": "bn" | "color" | null, "copias": 0..N, "marcos": 0..N}
```
Lo escribe la web al crear el pedido; la fábrica lo lee cuando produce. El
entrevistador sigue sin mirar `pedidos`. `copias`: cuántos libros impresos van en ese
pedido. Un pedido posterior puede ser de un invitado (su propia `familia`, mismo
`narrador_id`). **Pedidos anteriores al 13/09** no traen la clave `pdf`: se leen como
`pdf: true, audiolibro: "real"` (la base vieja: PDF + audiolibro con sus audios) — la
web usa `productosDelPedido()` para eso; la fábrica debe hacer lo mismo.

**Vitácora de viaje (18/09, Joaquín — `docs/vitacora-de-viaje.md`):** un producto aparte.
`pedidos.extras` lleva `tipo: "viaje"` (además de `pdf: true`); sin la clave es biografía.
El narrador tiene `contexto.modo = "viaje"`, `contexto.trato = "vos"` y `contexto.viaje`
(`salida`, `vuelta`, `etapas: [{nombre, desde?, hasta?}]`, `compania`, `proposito`,
`angulos`). Su guion nace al SÍ: una pregunta por día, `capitulo` = la etapa del día
(o "Por definir"); las fotos entran por WhatsApp a `fotos` con `capitulo` = la etapa y
`subida_por` null. Para la fábrica, hoy, capítulo = etapa sale solo con el libro común;
el layout de viaje (mapa, números, una foto por día) queda para cuando termine el
primer viaje. El entrevistador escribe `contexto.viaje.etapas` **no**: lo edita la web
(`/api/viaje`) y reasigna `preguntas.capitulo` de las órdenes por venir.

**Para la fábrica (13/09):** `audiolibro: "clonada"` = narración en primera persona
con la voz clonada de sus audios; `"narrador"` = TTS con una voz fija; `"real"` = como
hasta ahora (sus audios). Nada se descarga: el PDF se lee y el audiolibro se escucha en
la web. Proveedor de clonación a definir antes de vender el primero.

**Lo que la fábrica hace hoy con eso (Naza, 13-14/09):** impreso, marcos y copias se
cumplen **a mano** por ahora — la fábrica no los lee. Un segundo pedido `pagado` sobre un
narrador que ya tiene un pedido `entregado` **no vuelve a generar nada**: la fábrica lo pasa
a `entregado` con los mismos `libro_pdf_path` y `audiolibro_paths`. Desde el 16/09 la fábrica
sí lee `audiolibro`: `"clonada"` pasa por el buzón `narraciones` (sección siguiente) y el
pedido espera en `esperando_voz` hasta que la voz vuelve y la fábrica ensambla. ⚠️ Pendiente
(3t.14): leer `pdf` y `"narrador"` para producir solo lo comprado.

## Narraciones (voz clonada) (migraciones 20260917 y 20260920)

⚠️ **La migración `20260917000000_narraciones.sql` NO se aplica en producción hasta que
Joaquín lea esta sección.** Toca `pedidos_estado_check` (agrega `esperando_voz`) y agrega
`narradores.consentimiento_voz_at` — impacta al entrevistador y a la fábrica.

Buzón entre la fábrica (Railway) y el worker de voz (Python, en la PC de música de Naza).
Los dos se hablan solo por Supabase, como el resto del proyecto: nadie llama a nadie. Diseño
completo en `docs/superpowers/specs/2026-09-16-voz-clonada-design.md`. RLS activa, sin
políticas: solo la service role (como todas las tablas).

Quién escribe qué:

| Columna / tabla | Escribe | Lee |
|---|---|---|
| `narraciones` fila nueva (`pendiente`) | fábrica | worker de voz |
| `narraciones.estado` / `motor` / `muestras` / `capitulos_paths` / `error` / `tomada_at` | worker de voz | fábrica |
| `narraciones.estado = 'reemplazada'` (+ `error = 'reemplazada por <id nueva>'`) | **fábrica** (`reemplazarNarracion`, migración 20260920) | — (no se narra ni se ensambla) |
| `narradores.consentimiento_voz_at` | entrevistador (3t.15) — en el piloto, `npm run manual -- ficha <narrador> --voz-si` | worker de voz |
| `pedidos.estado = 'esperando_voz'` / `'entregado'`, `audiolibro_paths` | fábrica | web |
| Storage `{narrador}/voz/cap_NN.mp3` (cuerpo narrado, sin intro) | worker de voz | fábrica |
| Storage `{narrador}/paquete/audiolibro_cap_NN.mp3`, `audiolibro_completo.mp3` | fábrica | web |

**Contrato `narracion.json`** — lo escribe la fábrica en `{narrador}/paquete/narracion.json`
al crear la narración; lo lee el worker de voz:
```
{"narrador_id": uuid, "pedido_id": uuid, "titulo": texto,
 "capitulos": [{"numero": 1..N contiguo, "nombre": texto,
                "texto": texto plano, párrafos separados por línea en blanco}, ...]}
```

**Salida del worker**: `{narrador}/voz/cap_NN.mp3` por capítulo — cuerpo narrado, **sin
intro**, mp3 128 kbps mono 24 kHz, en el orden de `capitulos` de `narracion.json`.
`narraciones.capitulos_paths` anota esa lista a medida que sube cada uno (permite reanudar
sin repetir capítulos si se corta a mitad).

**Salida de la fábrica**: pega la intro TTS (como hoy, voz del entrevistador) a cada
`cap_NN.mp3` y produce `{narrador}/paquete/audiolibro_cap_NN.mp3` +
`audiolibro_completo.mp3` — recién ahí el pedido pasa a `entregado` con `audiolibro_paths`
y sale el mail `libro_listo`.

**Estado de pedido nuevo: `esperando_voz`.** Un pedido con `extras.audiolibro = "clonada"`
queda ahí entre que la fábrica arma el paquete (inserta la narración `pendiente`) y el
worker termina y la fábrica ensambla. La web lo trata como en producción, igual que
`pagado`; es el único toque a la web.

**`narradores.consentimiento_voz_at`**: lo escribe el entrevistador al pasar el narrador a
`acepto` (tarea de Joaquín, 3t.15) — en el piloto, a mano con `npm run manual -- ficha
<narrador> --voz-si`. El texto de bienvenida debe decir que, si la familia lo pide, el
audiolibro puede llevar la propia voz del narrador hecha a partir de estos audios, y que el
SÍ con el que acepta participar incluye ese permiso — texto acordado entre los dos socios.

**Regla de permiso**: sin `consentimiento_voz_at` o sin 600 s (10 min) de voz limpia
acumulada → la narración queda `fallida` con el motivo (`sin_consentimiento_voz` /
`faltan_minutos_de_voz: NNN s`). **Nunca se clona sin esto.**

**Atascos** (avisan por mail a los socios, no a la familia): narración `pendiente` > 24 h
(la PC está apagada), `procesando` más de 6 h sin avance (`actualizada_at`; cada capítulo
subido la mueve, así un libro largo no cuenta como colgado — `tomada_at` solo registra
cuándo se tomó), o `fallida` (con el motivo) — un mail por narración y motivo. El worker
devuelve a `pendiente` las `procesando` sin avance en 6 h y las retoma salteando los
capítulos ya subidos. Reintento a mano: `npm run narracion -- reintentar <id>` en la
fábrica (o `python -m voz.reintentar <id>` en la PC de voz) vuelve a poner `pendiente`
una `fallida` y borra el candado de su aviso, así un segundo fallo vuelve a avisar.

**Si una narración queda `fallida` y no se va a reintentar** (sin consentimiento, pocos
minutos de voz): cambiar `pedidos.extras.audiolibro` a `"real"` (o `"narrador"` cuando
exista) y poner el pedido en `pagado`. La fábrica reusa los borradores
(`borrador_cap_NN.md`, `borrador_libro.md`, que solo se borran al entregar) y no vuelve a
pagarle al modelo; el libro sale con el audiolibro de sus audios.

**Reemplazar una narración ya entregada (migración `20260920`, la aplica Naza en el SQL
Editor de Supabase)**: cuando se pide la voz **de nuevo** para un pedido ya producido —el
audiolibro clonado que se rehace híbrido, `fabrica/scripts/narracion-v2.ts`— la fábrica marca
**`reemplazada`** la narración `lista` (o `fallida`) de ese pedido, con
`error = 'reemplazada por <id nueva>'`, y crea la nueva `pendiente`, en ese orden
(`reemplazarNarracion`, `fabrica/src/voz/narraciones.ts`). Es la única excepción a "`estado` lo
escribe el worker". Solo con el pedido `entregado` o `esperando_voz`; con una narración en
curso (`pendiente` / `procesando`) no reemplaza nada — se narraría dos veces. **La fábrica y
el worker ignoran `reemplazada`**: no se narra, no se ensambla (`narracionesListas` solo mira
`lista`) y no se reclama como atascada (`narracionesAtascadas` solo mira
`pendiente`/`procesando`/`fallida`). El orden importa: marcar la vieja **antes** de que el
pedido vuelva a `esperando_voz` es lo que evita que la fábrica ensamble esa voz vieja como si
fuera la nueva.

## El guion por narrador (migración 20260912)

- Al confirmar la compra, **la web copia las 26 fijas globales** a filas del narrador
  (`tipo = 'fija'`). Los narradores anteriores ya fueron copiados por el backfill.
- La familia puede, sobre las preguntas con `orden > dia_actual`: editar `texto`, borrar
  (y renumerar las siguientes para que queden contiguas), reordenar, agregar al final con
  `tipo = 'familia'` o `'sugerida'`, y ligar una foto con `foto_id` (pregunta-foto).
- **Piso 15, tope 40** incluidas las 4 adaptativas (lo cuida la web).
- **El entrevistador** recorre `orden` de a uno con `preguntaDeOrden`, que prefiere la fila
  del narrador. Cuando responde la última que existe y no hay adaptativas, genera 4 en
  `N+1..N+4`. Ya no existe "la 26" como número mágico.
- `respuestas.pregunta_orden` sigue uniendo por `(narrador_id, orden)`. Como lo enviado está
  congelado, renumerar las futuras no rompe la unión.

`contexto` suma dos claves que **lee el entrevistador** y escribe la web:
`ritmo` (`'diario'` default · `'dos_por_dia'` · `'seguido'`) y `evitar` (texto libre).
`modoRapido: true` de los pilotos equivale a `ritmo: 'seguido'`.

**Nuevo (14/09) — claves que ESCRIBE el entrevistador y LEE la web** (provisorias,
sin migración; el lugar definitivo es una columna `texto` en `envios`):
- `preguntasEnviadas[orden]` — el texto de la pregunta tal como se le mandó al
  narrador (el guion dice una cosa y el biógrafo, con lo que ya contó, otra).
- `repreguntasEnviadas[orden]` — el texto de la repregunta del mismo día.
- `resumenesCapitulos[capítulo]` — la memoria interna del biógrafo. **No la usa la
  web ni la fábrica**: es para personalizar la pregunta del día.

El panel de la web muestra las dos primeras ("Se lo preguntamos así: …" / "Le
repreguntamos: …"). Sin ellas la familia veía la respuesta de la repregunta sin la
pregunta que la originó.

⚠️ **Cuidado con `contexto`: ahora lo escriben los dos servicios.** Cada uno hace
leer-modificar-escribir sobre el jsonb entero, así que si la web guarda `ritmo` en
el mismo instante en que el entrevistador guarda `preguntasEnviadas`, uno de los
dos cambios se pierde. Es la razón para mudar los tres textos a `envios.texto`
(migración chica): `envios` ya es "todo mensaje saliente" y cada fila es un
registro propio, sin pisadas.

## Cerrar el libro (migración 20260912)

`narradores.edicion` (jsonb, escribe la web, lee la fábrica):
`{ordenCapitulos: text[], excluidas: uuid[], titulo, subtitulo, portadaFotoId, correcciones}`.

**14/09 — se suman a `edicion`:**
- `contratapaFotoId` (uuid de `fotos` o null): la contratapa del impreso.
- `marcosFotoIds` (lista de uuid o null, uno por marco comprado, en orden): **cada marco lleva su foto** — el abuelo con cada primo, por ejemplo. `marcoFotoId` = el primero, se mantiene por compatibilidad. Un null = todavía no eligió; la fábrica usa la tapa.
- `titulosCapitulos` (`{ "<capítulo del guion>": "<título en el libro>" }`): la familia puede renombrar capítulos. Sin entrada = el del guion. La fábrica imprime el título del libro; el guion no cambia.
- Todas pueden apuntar a fotos con `capitulo` NULL (el álbum) o con capítulo.

**El tag NFC de cada marco** apunta al link público del libro (`/libro/<token>`, el mismo de "compartir"): quien lo acerca ve la muestra y, si compra, el lector completo. ⚠️ Idea para la fábrica (13/09): las **muletillas** — frases cortas sacadas de los audios de cada capítulo — como pieza aparte del audiolibro, para que suenen desde el marco.

`narradores.libro_aprobado_at`: lo escribe la web cuando la dueña aprieta **Cerrar libro**.
**Es el punto de aprobación del cliente: la fábrica no produce nada sin esto**, ni el PDF
ni el impreso. Si pasan 30 días desde `ultima_respuesta_at` sin cierre, ~~la web lo
cierra~~ **desde el 13/09 la fábrica** lo cierra (pone `libro_aprobado_at`, manda el
aviso) y lo produce en el mismo tick, con la propuesta por defecto (está en los
términos).

La fábrica aplica `ordenCapitulos`, `titulo`, `subtitulo` y `portadaFotoId`; **ignora
`excluidas` y `correcciones`** (decisión 13/09, ver
`docs/superpowers/specs/2026-09-13-fabrica-aprobacion-design.md`).

## Dónde va y cómo se encuadra la foto del capítulo (migración 20260918 — PROPUESTA de Joaquín, 18/09)

✅ **Acordada el 18/09** (Naza la aplica en el SQL Editor). La escribe la web, la lee la fábrica. Sale del piloto: la familia quiere decidir dónde queda la foto del
capítulo y que no se corte la cara al ajustarla al marco. Recorte libre queda para
después; esto cubre lo que hace falta con dos campos chicos en `fotos`:

| Columna | Tipo | Escribe | Lee | Qué es |
|---|---|---|---|---|
| `fotos.posicion` | text, `'arriba'` (default) o `'abajo'` | web | fábrica | Solo importa en la `principal` del capítulo. `arriba` = la foto ocupa **su propia página**, justo después de la portadilla del capítulo (la que tiene el numeral y el título), antes del texto — es lo que la fábrica hacía siempre. `abajo` = la foto va **dentro de la portadilla**, en la franja debajo del título; no hay página de foto aparte. Las que cierran el capítulo no la usan. |
| `fotos.foco` | jsonb `{"x": 0..1, "y": 0..1}`, default `{"x":0.5,"y":0.5}` | web | fábrica | El punto de la foto que tiene que quedar a la vista cuando se recorta al marco (la cara, no el techo). En CSS: `object-fit: cover; object-position: <x*100>% <y*100>%`. |

**Qué se recorta y qué no (acordado 18/09, Naza + Joaquín):** la **principal del
capítulo** se recorta al marco con `foco` (en las dos posiciones); la **tapa** se recorta
con el `foco` de la foto elegida en el wizard; las **fotos de cierre** van **enteras**,
sin recorte (son varias y ahí importa ver todo: la grupal, la carta, el documento) — su
`foco` se guarda pero no se usa. La fábrica sigue decidiendo el tamaño del marco; solo
respeta el punto y la posición. La miniatura web muestra lo mismo con estas reglas,
como **vista estimada** (el libro real se pagina después de encargarlo). Un `foco` que
no sea `{x, y}` numérico se toma como el centro; fuera de 0..1 se recorta al borde
(`fabrica/src/libro/fotos.ts`, `normalizarFoco`).

## Audiolibro con voz clonada — regla de voz única (Naza, 19/09)

En el audiolibro con voz clonada **no suena ninguna voz que no sea la del narrador**:
ni intro TTS genérica ni conectores con otra voz. La fábrica no antepone nada al mp3
del worker (solo normaliza volumen); el anuncio del capítulo ("Capítulo uno. La
infancia.") lo narra el worker con la voz clonada, a partir de `nombre` en
`narracion.json`. La intro TTS de OpenAI queda solo para el audiolibro con audios
reales (`extras.audiolibro = "real"` / pedidos viejos), donde alguien tiene que
anunciar el capítulo.

## narracion.json v2 — audiolibro híbrido (decisión de los socios, 20/09)

**El híbrido es el audiolibro clonado por defecto**: las historias se escuchan con el audio
REAL del narrador (restaurado por el worker) y la voz clonada narra solo el anuncio del
capítulo y los "conectores" entre historias; **el todo-clonado queda por capítulo, solo
cuando ese capítulo no tiene ningún audio** (respondió escribiendo). Reemplaza al contrato
`narracion.json` de la sección "Narraciones"; lo escribe la fábrica
(`fabrica/src/voz/narracion-json.ts`, conectores en `fabrica/src/voz/conectores.ts`) y lo
lee el worker de voz. **El formato es fijo — el worker ya está codeado contra esto.**

```json
{
  "version": 2, "narrador_id": "…", "pedido_id": "…", "titulo": "…",
  "capitulos": [
    { "numero": 2, "nombre": "Las raíces", "texto": "…texto plano del capítulo (como hoy)…",
      "modo": "hibrido",
      "historias": [
        { "respuesta_id": "uuid", "pregunta_orden": 5, "es_repregunta": false, "audio_path": "3691…/dia_05.ogg", "segundos": 266, "pregunta": "¿Quiénes fueron sus abuelos…?", "texto": "…transcripción…" }
      ],
      "conectores": { "entrada": "…", "entre": ["…"], "salida": "…" } },
    { "numero": 6, "nombre": "La familia", "texto": "…", "modo": "clonado" }
  ]
}
```

Reglas:

- `numero` es 1..N contiguo en el orden FINAL del libro (la edición de la dueña aplicada);
  `texto` es el capítulo en texto plano, párrafos separados por línea en blanco, como en v1.
- `modo = "hibrido"` si y solo si el capítulo tiene al menos una respuesta con `audio_path`
  no nulo; si no, `"clonado"`.
- `historias`: SOLO las respuestas con audio, en el orden del libro — el de `ordenes` del
  capítulo en `estructura.json`, y dentro de una misma pregunta primero la respuesta y
  después la(s) repregunta(s) (`es_repregunta`), por `recibido_at` si hay que desempatar.
  `segundos` = `duracion_segundos` redondeado (0 si null); `pregunta` = texto de la
  pregunta; `texto` = la transcripción (o el texto directo).
- `conectores`: los escribe el modelo en la voz del narrador (1–2 oraciones cada uno, nada
  inventado). `entrada` abre el capítulo, `entre[k]` va entre la historia k y la k+1
  (`entre.length === historias.length - 1`; con una sola historia, `[]`), `salida` lo
  cierra. `entrada` y `salida` pueden ser `""`.
- Un capítulo `clonado` NO lleva `historias` ni `conectores`: el worker narra `texto` entero.
- Caché: la fábrica guarda los conectores en `{narrador}/paquete/conectores_cap_NN.json`
  (mismo NN que `borrador_cap_NN.md`) para que un reintento no vuelva a pagarle al modelo;
  se borran junto con los borradores al entregar.

## Storage — bucket privado `audios`

    {narrador_id}/dia_NN.ogg          respuestas (entrevistador sube; NN = pregunta_orden, 2 dígitos; extras: dia_NN_2.ogg)
    {narrador_id}/fotos/{id}.{ext}    fotos por capítulo, ORIGINAL sin recomprimir (web sube)
    {narrador_id}/sistema/…           audios TTS del entrevistador (entrevistador sube)
    {narrador_id}/paquete/…           estructura, PDF, audiolibro, libro.html y candados de mails (web/fábrica — socio 2 — sube)

El navegador jamás recibe paths directos: solo URLs firmadas que genera la web.

Desde el 13/09, `{narrador_id}/paquete/` además de `estructura.json`, `preview.pdf`,
`libro.pdf` y el audiolibro, tiene `libro.html` (**nuevo**: el HTML que arma el lector
online del panel, el mismo que se imprime) y, junto a `anticipo_enviado.txt`, los seis
candados de los mails que manda la fábrica: `terminado_enviado.txt`,
`recordatorio_cierre_3.txt`, `recordatorio_cierre_7.txt`, `recordatorio_cierre_14.txt`,
`cierre_automatico_enviado.txt` y `libro_listo_enviado.txt`. `cierre_automatico.txt` es
aparte: no es candado de mail, es la marca que deja el cierre automático de los 30 días
para saber que fue la fábrica quien puso `libro_aprobado_at`.

## Tipos TypeScript

Cada servicio genera sus tipos con:
`npx supabase gen types typescript --linked > src/db/tipos.ts`
Regenerar después de cada migración.
