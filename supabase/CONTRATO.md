# CONTRATO DE DATOS — leer antes de tocar cualquier tabla

Los dos servicios se comunican SOLO por esta base. Cambiar el esquema = nueva
migración en `supabase/migrations/` + actualizar este archivo + avisar al otro socio.

## Propiedad de escritura

| Tabla | Escribe | Lee | Nota |
|---|---|---|---|
| `familias` | web | entrevistador | |
| `narradores` | web (crea, edita datos, `edicion`, `libro_aprobado_at`) / entrevistador (solo `estado`, `dia_actual`, `ultima_respuesta_at`, `alerta_silencio`, `consentimiento_voz_at`) / fábrica (solo `libro_aprobado_at`, a los 30 días sin cierre) | ambos | Única tabla compartida. La web también apaga `alerta_silencio`. La fábrica lee `edicion` y **no produce nada sin `libro_aprobado_at`** (ni digital ni impreso). Desde el 13/09, si pasan 30 días desde `ultima_respuesta_at` sin cierre, la fábrica misma pone `libro_aprobado_at` (único caso en que alguien más que la web escribe esa columna). |
| `preguntas` | **web** (copia las fijas al comprar; la familia edita, salta, reordena, agrega) / **entrevistador** (adaptativas y reemplazos) / seed (plantilla global) | ambos | Desde el 12/09 **cada narrador tiene su guion propio**. Las globales (`narrador_id = null`) son solo plantilla. Regla: `orden ≤ dia_actual` está **congelado**, nadie lo toca. |
| `respuestas` | entrevistador | web, fábrica | La web NUNCA escribe acá. **20/09 (propuesta, sin aplicar):** `reservada` / `reservado_tramo` — "esto que no vaya al libro", ver la sección propia. **21/09 (propuesta, sin aplicar):** `tema_de_orden` / `tema_motivo` — "esto es de otra parte", ver la sección propia. |
| `respuestas_descartadas` | entrevistador (solo la puerta manual, vía las funciones `descartar_respuesta` / `restaurar_respuesta`) | nadie la usa para el libro | **23/09 (acordada Naza + Joaquín, pendiente de aplicar).** Respuestas que entraron por error. Lo que está acá NO existe para el libro ni el audiolibro. Ver la sección propia. |
| `saludos` | ~~web / entrevistador~~ | — | **Fuera de la fase 1 (10/09).** Nadie la escribe ni la lee — desde el 13/09 tampoco la fábrica (dejó de leerla en `generarPaquete`/`generarAudiolibro`; el audiolibro ya no tiene bonus de saludos). Se deja por si la fase 2 la revive. |
| `fotos` | web (sube y ordena) | fábrica | Nueva 12/09. Por capítulo; `principal` abre, el resto cierra. Desde el 13/09 la fábrica las embebe como data URI en `libro.html`. **14/09: `capitulo` nullable** — NULL = foto del álbum del libro (candidata a tapa / contratapa / marco), no va en ningún capítulo; la fábrica la ignora al armar capítulos. |
| `invitados` | web | web | Nueva 12/09. `rol` (13/09): `'invitado'` (hasta 3, con el libro abierto, ven todo) o `'visitante'` (abrió el link del libro cerrado y lo guardó: ve la muestra y compra su copia, sin tope). |
| `pedidos` | web y fábrica | — | El entrevistador no la mira. Un pedido por comprador: los invitados y visitantes que compran su copia tienen su propia `familia` y su propio pedido sobre el mismo `narrador_id`. **24/09, pendiente de aplicar (Tarea 14):** el estado `revision` — lo pone la fábrica (`dejarEnRevision`, ver "La revisión") y lo saca la web desde el panel de la empresa, o la fábrica a mano (`update pedidos set estado = ... where id = ...`) hasta que el panel exista. |
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

`pedidos.extras` (jsonb, misma migración): **qué se compró**. **Desde el 21/09 (catálogo base +
upsells, `docs/superpowers/specs/2026-09-22-catalogo-base-y-upsells-design.md`)**: la base (PDF +
Su voz) va siempre en el checkout → `pdf: true`; el impreso es siempre a color (`"bn"` solo en pedidos
viejos); `copias` = cuántos impresos van en ESE pedido (el primero y las copias extra); los marcos solo
existen con impreso. Un pedido posterior desde el panel (más copias, marcos) lleva `pdf: false`.
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
**Pilotos (21/09, Naza — `web/src/lib/admin/frenos.ts`):** un pedido de piloto lleva
`pedidos.extras.piloto = true`. Los pilotos se corren a mano (la puerta manual del
entrevistador), no pasan por una pasarela, así que su pedido queda en `pendiente` para
siempre: **el panel de la empresa no alerta por ellos** (`esPiloto`), porque no hay cobro
que confirmar. La marca **no** cambia la plata: un piloto marcado sigue contando en "sin
cobrar todavía". Se marca a mano al armar el piloto; **no se deduce** del contexto del
narrador, porque el checkout normal también escribe `ritmo`/`modoRapido` y una deducción
silenciaría compras reales sin cobrar (medido sobre los 9 pendientes del 21/09).

`angulos`). Su guion nace al SÍ: una pregunta por día, `capitulo` = la etapa del día
(o "Por definir"); las fotos entran por WhatsApp a `fotos` con `capitulo` = la etapa y
`subida_por` null. Para la fábrica, hoy, capítulo = etapa sale solo con el libro común;
el layout de viaje (mapa, números, una foto por día) queda para cuando termine el
primer viaje. El entrevistador escribe `contexto.viaje.etapas` **no**: lo edita la web
(`/api/viaje`) y reasigna `preguntas.capitulo` de las órdenes por venir.

### `contexto.temas` y `contexto.imprescindible` — hacia dónde llevar las preguntas (22/09)

Mismo mecanismo que los `angulos` de la Vitácora de viaje, pero para el Familiar. **La web los
escribe** en la compra (paso 5, `registro.ts`); **el entrevistador los lee** en `ia/ficha.ts` y
entran al prompt de cada pregunta, de las repreguntas y de las adaptativas. **La fábrica no los
mira.** Sin migración: son claves del jsonb `narradores.contexto`.

- `temas`: lista de `familia | oficio | origen | fe | viajes | musica | dificiles | amor`, sin
  repetidos y en el orden que los eligió quien compró. Vacío o ausente = el guion sale como hoy.
  Los nombres en palabras viven **dos veces** (`web/src/lib/temas.ts` y `entrevistador/src/ia/ficha.ts`):
  si cambia uno, cambia el otro. Un tema que el entrevistador no conoce se ignora en silencio.
- `imprescindible`: una línea de texto libre (máximo 200 caracteres) con lo que la familia pide que
  no falte ("la casa de Pelliza"). Entra a la ficha como `No puede faltar: …`.

**No cambian QUÉ preguntas existen** — eso son las plantillas de guion (`preguntas.plantilla`, que
todavía no existe): cambian cómo el biógrafo escribe cada una.

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
- `resumenesHasta[capítulo]` (20/09) — con qué material se escribió el resumen de ese
  capítulo: `{orden: N, respuestas: M}` (el orden más alto con texto y cuántas respuestas
  con texto había). Es lo que hace que "lo último manda" (hallazgo 16): si el narrador
  contó algo más de un capítulo ya resumido —una orden nueva, o una **ampliación de la
  misma orden**, que es lo que el orden solo no detecta— la memoria rehace ese resumen con
  todo el material, así una corrección posterior pisa el dato viejo. Un resumen guardado sin
  marca (los de antes del cambio) se rehace una vez y queda al día.

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

## Respuestas reservadas — "esto que no vaya al libro" (PROPUESTA del 20/09, pendiente del OK de Joaquín)

⚠️ **No está aplicada todavía.** La migración es `20260920000100_respuestas_reservadas.sql` y
la aplica Naza en el SQL Editor de Supabase **cuando Joaquín dé el OK** (toca una tabla del
entrevistador). Mientras tanto el código ya funciona sin las columnas: `select *` no las trae
y se leen como ausentes = nada reservado, así que aplicarla no puede romper nada. Es
idempotente y no toca datos.

Sale del piloto (hallazgo 19): en la respuesta 12 el narrador dijo "estas historias prefiero
que queden en mi mente, no en mi biografía" y la transcripción entró entera al material del
libro. Publicar lo que pidió reservar es la peor falla posible del producto.

| Columna | Tipo | Escribe | Lee | Qué es |
|---|---|---|---|---|
| `respuestas.reservada` | boolean, `not null default false` | entrevistador (la evaluación de la respuesta) | fábrica y web | El narrador pidió reservar algo de esta respuesta. **Sin `reservado_tramo`, no se publica nada de ella.** |
| `respuestas.reservado_tramo` | text, null | entrevistador | fábrica | Si el pedido es por una PARTE: el tramo textual que no se publica, tal como lo dijo. Con tramo, se publica **todo menos eso** (la reserva parcial es el caso `reservada = true` + `reservado_tramo = '…'`). |

Reglas:

- **La escribe el entrevistador** al evaluar cada respuesta: `evaluarRespuesta` devuelve
  `reservado` / `reservadoTramo` y `reservaDe()` (`entrevistador/src/ia/cerebro.ts`) los
  normaliza. Si el tramo que marcó el modelo no está **textual** en la transcripción, se
  reserva la respuesta entera: sacar un texto que no está no sacaría nada y lo reservado se
  publicaría igual.
- ⚠️ **Estado (20/09)**: el flujo YA la guarda — `procesar.ts` llama a `guardarReserva(respuestaId,
  reservaDe(evaluacion, transcripcion))` después de evaluar, y la puerta manual hace lo mismo en
  `evaluarYAnotar` (`scripts/manual.ts`). `guardarReserva` avisa por consola y no frena el día si
  la columna todavía no existe (`respuestas.ts`, Joaquín, `f2686b2`).
- **Falta aplicar la migración** `20260920000100_respuestas_reservadas.sql` (Naza, SQL Editor):
  los dos socios ya dieron el OK. Hasta que se aplique, la detección funciona pero el `UPDATE`
  avisa por consola y no queda nada anotado.
- **Cubre la respuesta principal del día.** Quedan afuera las **ampliaciones** (la respuesta a
  una repregunta: `procesar.ts` no la evalúa a propósito) y la **pregunta de cierre** (el
  `esOrdenDeCierre` corta la evaluación). Para esas dos está `detectarReservaYDejarTema`
  (`entrevistador/src/ia/cerebro.ts`, 20/09): una llamada corta que devuelve solo `reserva` y
  `dejarTema`, sin juzgar la respuesta — o sea, sin riesgo de repreguntar en el cierre. Falta
  que el flujo y la puerta manual la llamen en esos dos caminos (Joaquín).
- **La fábrica solo lee**, y respeta las dos en el mismo lugar donde arma el material del
  libro (`fabrica/src/libro/comun.ts`, `textoRespuesta`): el escritor nunca ve una respuesta
  `reservada` (ni en el capítulo ni en "la historia completa"), y el tramo se quita del
  texto. Tampoco entran al audiolibro híbrido (`historiasDelCapitulo` en
  `fabrica/src/voz/conectores.ts`) ni a la muestra de audio del anticipo (esa muestra se
  publica en la landing), porque **un tramo no se puede recortar de una grabación**: una
  reserva parcial también deja el audio afuera (`esPublicable`).
- **La web solo lee**: muestra la respuesta marcada como reservada ("no va al libro", a
  pedido del narrador). Si algún día la familia quiere re-publicarla, sería escritura de la
  web — a decidir entre los dos.
- Corregir a mano (`update respuestas set reservada = true where …`) vale como cualquier
  dato: la familia puede pedirlo por teléfono y es lo más rápido que tenemos hoy.
- Ante la duda **siempre se reserva de más**: volver a agregar algo es fácil, desdecir algo
  que la familia ya leyó impreso, no.

## Respuestas de otra parte — "esto es de otra parte" (PROPUESTA del 21/09, acordada entre los dos, pendiente de aplicar)

⚠️ **No está aplicada todavía.** La migración es `20260921000000_tema_de_otra_parte.sql` y la
aplica Naza en el SQL Editor de Supabase. Mientras tanto el código funciona sin las columnas:
`guardarTemaDeOtraParte` avisa por consola y no anota, y la fábrica las lee como ausentes = sin
marca. Es idempotente y no toca datos.

El problema (decisión de Naza y Joaquín, 21/09): el narrador responde la pregunta 9 y ahí
recuerda algo que pertenece a la historia de la pregunta 2. Hoy esa respuesta queda atada a su
pregunta, y en el libro la historia aparece en el capítulo equivocado: no se pierde, queda mal
ubicada. **Es una MARCA, no una bifurcación de la conversación**: el bot nunca reencuadra en el
momento (no le pide que vuelva al tema, no le aclara que habló de otra cosa); si lo interrumpen
para encarrilarlo, se calla.

| Columna | Tipo | Escribe | Lee | Qué es |
|---|---|---|---|---|
| `respuestas.tema_de_orden` | integer, null | entrevistador (la evaluación de la respuesta principal) | fábrica (y la web, para mostrarlo) | La `orden` de la pregunta cuyo tema trata de verdad esta respuesta. Null = contestó la suya (o el modelo dudó). |
| `respuestas.tema_motivo` | text, null | entrevistador | fábrica, web | Una línea de por qué. |

Reglas:

- **La escribe el entrevistador** al evaluar la respuesta principal (`evaluarRespuesta` devuelve
  `temaDeOrden` / `temaMotivo`; `temaDe()` en `entrevistador/src/ia/cerebro.ts` lo normaliza).
  Para que el modelo pueda acertar, el prompt lleva la lista de las preguntas ya hechas (orden ·
  capítulo · texto, la personalizada si la hubo). Es **conservador a propósito**: solo se guarda
  un entero que esté en esa lista y sea anterior a la pregunta de hoy; ante la duda, null. Una
  marca de más ensucia el libro; una de menos lo deja como está hoy.
- **Solo la respuesta principal** se marca. Las ampliaciones de una repregunta y la pregunta de
  cierre no: si el narrador vuelve a un tema a propósito, eso ya tiene su mecanismo (la
  ampliación) y no se reemplaza con esta marca.
- **La fábrica solo lee** (Naza, en curso): al armar el material de cada capítulo suma esa
  respuesta al capítulo del tema que marca, y en el capítulo donde la contó la deja anotada como
  "recuerdo de otro tema: ya va en el capítulo N" para que el escritor no la repita. **No se
  mueve nada de lugar: se copia.**
- Corregir a mano (`update respuestas set tema_de_orden = 2 where …`, o `= null`) vale como
  cualquier dato.

## El paquete `frases.json` — «Su voz» (decisión de los socios, 20/09)

`frases.json` **no es una tabla**: vive en Storage, en el paquete del narrador
(`{narrador_id}/paquete/frases.json`), al lado de `estructura.json` y `narracion.json`. Lo crea la
fábrica; el worker de la PC de audio y la web solo lo completan. Arriba lleva `version`,
`narrador_id`, `pedido_id` y `confirmado_at`; abajo, `capitulos[].candidatas[]`. El pedido de corte
(`{narrador_id}/paquete/frases_pedido.txt`) es el aviso de que hay algo para cortar: lo escribe la
fábrica y lo borra el worker recién cuando no queda ninguna frase pendiente.

**Quién escribe qué** (mismo criterio que las tablas: un escritor por campo):

- **La fábrica** (`fabrica/src/libro/frases.ts` + `publicar-frases.ts`) crea el archivo y escribe
  `id`, `texto`, `origen` (`cita` | `sus-frases`), `grupo`, `respuesta_id`, `pregunta_orden`,
  `por_que`, `elegida`, `elegida_por` (`modelo`), `estado` (`pendiente`) y, la primera vez,
  `audio_path`, `segundos`, `inicio` y `fin` en null. Es la única que elige frases nuevas.
- **El worker de la PC de audio** (`voz/voz/procesar_frases.py`) corta y completa: `audio_path`,
  `segundos`, `inicio`, `fin` y `estado` (`cortada` | `fallida`, con `error` cuando falla). Nunca
  toca `texto`, `elegida` ni `confirmado_at`.
- **La web** (`web/src/lib/frases.ts` y `POST /api/frases`, solo la dueña) escribe la selección de la
  familia: `elegida`, `elegida_por` (`familia`) y `confirmado_at` al darla por buena. Nunca toca
  `audio_path`, `segundos`, `inicio`, `fin` ni `estado`.

**Reglas que no se rompen:**

- Una candidata vive en **un solo capítulo** y su `id` es único: es el nombre del audio
  (`{narrador_id}/voz/frases/{id}.mp3`). Dos frases no pueden compartir id, y una frase que no sea
  textual (verificada contra la transcripción) no entra: no habría audio que cortar.
- Se cuentan **hasta 3 elegidas por capítulo**; el resto queda como alternativas para el panel.
- La web **relee el archivo justo antes de escribir** y sube el entero, así lo que el worker cortó
  mientras la familia miraba no se pisa. Queda una carrera teórica si el worker escribe en el mismo
  segundo; si molesta, se separa en `seleccion.json` y la fábrica mezcla al imprimir.
- La fábrica **no espera** a que haya audios: el libro se entrega igual y las frases se completan
  cuando la PC corta. Si nadie confirma la selección, a los 15 días va la del biógrafo.

## Respuestas descartadas — "esto entró por error" (acordada el 23/09 entre los dos, pendiente de aplicar)

**Por qué (hallazgo 43):** el 17/09 un audio de Ciro se cargó en la orden 27 de Joaquín. Quien
cargaba se dio cuenta y cargó el correcto, pero la puerta manual no tenía cómo reemplazar: el malo
quedó en `respuestas` con la misma forma que un par respuesta + repregunta, la fábrica usó los dos
y la historia de Ciro terminó en el libro de Joaquín (y su voz, en el capítulo 7 del audiolibro).

**Qué es descartar:** MOVER una respuesta —por id, nunca "todas las de una orden"— de
`respuestas` a `respuestas_descartadas`, con el motivo. Una tabla aparte y no una columna porque
hay 25 lectores de `respuestas` en las tres piezas: con una columna, el que se olvide de filtrar
vuelve a meter el audio ajeno. **Ningún lector cambia.**

| Columna | Tipo | Qué es |
|---|---|---|
| `id` | uuid, pk | el mismo que tenía en `respuestas` |
| `narrador_id`, `pregunta_orden` | | para listar y verificar dueño |
| `audio_path` | text, null | dónde quedó el audio: `{narrador}/descartadas/dia_NN.ogg` |
| `fila` | jsonb | la fila entera tal cual estaba, para restaurarla |
| `motivo` | text, no vacío | por qué ("audio de Ciro", "reemplazada al cargar …") |
| `descartada_at` | timestamptz | |

- **El audio se mueve, no se borra**, a la subcarpeta `descartadas/` del narrador. Hace falta
  porque el audiolibro elige los archivos por NOMBRE (`dia_NN*.ogg` en la carpeta del narrador),
  no por la tabla. `list(narradorId)` no entra a subcarpetas, así que lo descartado queda afuera.
- El movimiento de la fila lo hacen dos funciones (`descartar_respuesta`, `restaurar_respuesta`)
  en un solo paso; **solo las puede llamar el servidor** (execute revocado a anon/authenticated).
  RLS activo sin políticas: la web no la lee.
- Quién la escribe: la puerta manual (`manual descartar`, `manual restaurar`, `manual cargar
  --reemplazar`). La fábrica y la web no la tocan.
- Migración: `20260923000300_respuestas_descartadas.sql`, idempotente, no toca datos. Sin
  aplicarla, `descartar` falla con un error claro y no mueve nada (el audio vuelve a su lugar).

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
{narrador_id}/paquete/recordatorio_frases_enviado.txt   candado del recordatorio de «Su voz» a los 15 días (lo escribe la fábrica)
{narrador_id}/paquete/revision.json                     el informe de "La revisión" (24/09, pendiente de aplicar; lo escribe la fábrica)
aparte: no es candado de mail, es la marca que deja el cierre automático de los 30 días
para saber que fue la fábrica quien puso `libro_aprobado_at`.

## Tipos TypeScript

Cada servicio genera sus tipos con:
`npx supabase gen types typescript --linked > src/db/tipos.ts`
Regenerar después de cada migración.

## Panel de la empresa (21/09) — tres tablas nuevas, todas de sólo agregar

| Tabla | Escribe | Lee | Nota |
|---|---|---|---|
| `consumo_ia` | entrevistador (14 pasos) y fábrica (5 pasos) — insert | `/admin` | Una fila por llamada al modelo. **El worker de voz no escribe acá**: su trabajo es GPU propia (USD 0) y sólo deja su latido. Nadie hace update ni delete. |
| `latidos` | los tres workers (upsert por `servicio`) | `/admin` | Si un servicio deja de latir, `/admin` lo muestra en rojo. |
| `gastos_manuales` | `/admin` (es la ÚNICA escritura del panel) | `/admin` | Lo que no pasa por una API: suscripciones, recargas, imprenta. |

Las tres tienen RLS prendido y **sin políticas**: sólo la service role las toca (el navegador nunca). Si la
migración no está aplicada, el producto sigue andando: los servicios avisan por consola y no anotan nada.

## Entregas — logística de lo físico (PROPUESTA del 21/09, Joaquín; pendiente del OK y la aplicación de Naza)

Diseño: `docs/superpowers/specs/2026-09-21-logistica-fisica-propuesta.md`. Migración:
`20260922000000_entregas.sql`. Una fila por pedido que lleva **libro impreso y/o marcos**
(`pedidos.extras.impreso` o `marcos > 0`); un pedido de solo PDF no tiene fila. **Qué va
adentro no se duplica**: se lee de `pedidos.extras` (copias, acabado, marcos).

| Columna | Escribe | Lee | Nota |
|---|---|---|---|
| fila nueva (`estado = 'sin_direccion'`, `pedido_id`, `narrador_id`, `familia_id`, `origen`) | **web**, al confirmar el pago (webhook o `/api/pago/vuelta`) | fábrica, `/admin` | `origen` = la región del comprador (`AR`/`ES`): el centro que despacha. |
| `destinatario_*`, `direccion`, `nota`, `direccion_at` → `estado = 'lista'` | **web** (`PATCH /api/entrega`, solo el comprador de ese pedido) | fábrica, `/admin` | **Obligatoria para encargar**: sin `lista`, el botón Encargar no se habilita si hay algo físico. Editable hasta `en_produccion`; después la web no la toca. |
| `estado = 'en_produccion'`, `produccion_at` | **fábrica** | web, `/admin` | **Es el portón de impresión de «Su voz»**: congela la selección de frases y arma el PDF de imprenta con la sección QR. Si la entrega no está `lista`, la fábrica **no produce lo físico** y avisa a los socios. |
| `etiqueta_proveedor`, `etiqueta_url`, `envio_externo_id`, `transportista`, `seguimiento`, `seguimiento_url`, `peso_g`, `dimensiones` | **fábrica** (al pasar a `en_produccion`, crea el envío en el agregador del país) | `/admin`, la imprenta (imprime `etiqueta_url`) | Agregador por país (ES: Sendcloud/Packlink; AR: Enviopack/Zippin/Shipnow — a elegir). El envío va **incluido en el precio**: nada se cotiza al comprador. |
| `estado = 'impreso'`, `impreso_at` | **fábrica / Naza** (`/admin` → Envíos) | web | |
| `estado = 'enviado'`, `enviado_at` | **fábrica / Naza** | web | Dispara el **mail de hito "enviado"** (con seguimiento). |
| `estado = 'entregado'`, `entregado_at` | **fábrica / Naza**, o **web** (botón "ya me llegó" del comprador) | `/admin` | Dispara el mail de hito "entregado"; en la web, gracias + link a Trustpilot. |
| `estado = 'con_problema'`, `problema` | **fábrica / Naza** | web | Aviso a los socios y mail al comprador. |

`direccion` es `{ linea1, linea2?, ciudad, provincia?, cp, pais }` (texto libre por país; lo valida la
web al guardar). `updated_at` lo mantiene un trigger. RLS prendido y **sin políticas**: sólo la
service role (web y fábrica del lado del servidor, `/admin`); el navegador nunca. Si la migración
no está aplicada, la web no muestra la sección Envío y el resto del producto sigue igual.

**Estados válidos y quién puede pasar de uno a otro:** `sin_direccion → lista` (web) · `lista →
en_produccion` (fábrica) · `en_produccion → impreso → enviado → entregado` (fábrica/Naza; `entregado`
también la web) · cualquiera `→ con_problema` (fábrica/Naza) y de `con_problema` vuelve al estado
anterior a mano desde `/admin`. `lista → sin_direccion` no existe: una dirección cargada no se borra,
se corrige.

**La dirección es un dato personal nuevo**: una línea en `/legal/privacidad` §7 (se guarda solo
para entregar lo físico; se borra al año de `entregado`). Texto: Naza.

## «Sus objetos preciados» — el pedido de una foto concreta (PROPUESTA del 22/09, la aplica Naza)

⚠️ **No está aplicada todavía.** La migración es `20260923000000_preguntas_de_objeto.sql` y la aplica
Naza en el SQL Editor. Mientras tanto el código funciona sin la columna: `fotos.pregunta_orden` se lee
como ausente = la foto no contesta a ningún pedido, que es exactamente lo que pasa hoy. Es idempotente
y no toca datos.

De dónde sale (Joaquín, 22/09): el guion lleva la entrevista para el lado de la biografía y está bien,
pero todo lo que la persona tiene en la casa —el primer reloj, la camisa que no tira, el amuleto, la
mascota, el mueble que no tiraría— no entra por ningún lado. Antes de cerrar cada capítulo el biógrafo
pide **un** objeto: la foto y de dónde salió. Ocho en todo el libro, uno por capítulo.

| Columna | Tipo | Escribe | Lee | Qué es |
|---|---|---|---|---|
| `preguntas.tipo` | suma el valor `'objeto'` al check | web (panel) y entrevistador | entrevistador, web | Un tipo más de pregunta, con su fila propia. **Orden 101-108, fuera de la secuencia de días**: no cuenta en el total del guion, no se arrastra con las otras y no entra en la renumeración al sacar una pregunta. Hoy el panel las **muestra** (Ajustes → Fotos de sus cosas) y se apagan todas juntas con `contexto.sinFotos`; editarlas o sacarlas de a una queda para más adelante. |
| `fotos.pregunta_orden` | integer, null | entrevistador | fábrica, web | La pregunta de objeto que esta foto contesta (`preguntas.orden` del guion propio). Null = llegó suelta o la subió la familia desde el panel. |

Reglas:

- **La pregunta de objeto sale el mismo día que la última de su capítulo**, como segundo mensaje, dentro
  de la ventana de 24 hs desde que el narrador respondió. **No consume un día** y no necesita plantilla
  nueva de Meta. Si el capítulo no aplica a esa vida (no tuvo hijos, no tuvo pareja), desaparece con él:
  es la misma regla de `capituloNoAplica` que ya existe.
- **Se pide una vez y no se insiste nunca.** Si no llega la foto, muere ahí y no se vuelve a mencionar.
  Si contesta por texto en vez de mandar la foto ("no la tengo, pero me acuerdo…"), eso vale igual y
  entra al libro como historia.
- **La foto que llega se ata al último pedido abierto** (mandado hace menos de 48 hs y sin foto todavía)
  y hereda su capítulo. Si no hay pedido abierto, va al capítulo de la pregunta vigente. WhatsApp no
  dice a qué mensaje responde una imagen: no se adivina con visión artificial, y si se equivoca lo
  corrige la familia desde el panel.
- **En el libro cierra su capítulo**, entera y sin recortar, como las fotos de cierre del 18/09.
  **La fábrica no cambia**: `pregunta_orden` le sirve para poner el pie de foto si algún día se quiere,
  pero hoy puede ignorarla sin perder nada.
- **`contexto.sinFotos`** (boolean, lo escribe la web desde el panel): si está en true, las preguntas de
  objeto se saltean. Es para el narrador que no puede sacar ni mandar fotos.

## Saber si el mensaje llegó — `envios.entrega` (PROPUESTA del 23/09, la aplica Naza)

⚠️ **No está aplicada todavía.** La migración es `20260923000200_envios_entrega.sql`. Mientras tanto
el código funciona sin las columnas: avisa por consola (los logs de Railway ya sirven para saber qué
pasó) y sigue. Es idempotente y no toca datos.

De dónde sale: el 21/09 salieron tres bienvenidas —Dora, Mariano e Immaculada—, las tres con
`wa_message_id` de Meta, y **las tres personas dicen que no les llegó nada**. `wa_message_id` solo
dice que Meta **aceptó** el mensaje; no dice que lo haya entregado. Sin este dato no se pueden
distinguir tres problemas distintos que hoy parecen uno solo.

| Columna | Tipo | Escribe | Lee | Qué es |
|---|---|---|---|---|
| `envios.entrega` | text, null, check `enviado`/`entregado`/`leido`/`fallido` | entrevistador (webhook) | web (admin), entrevistador | Lo último que dijo Meta de este mensaje. Null = todavía no llegó ningún aviso, o el envío es anterior al 23/09. |
| `envios.entrega_at` | timestamptz, null | entrevistador | web | Cuándo lo dijo Meta (su timestamp, no el nuestro). |
| `envios.error_codigo` | int, null | entrevistador | web | El código de Meta cuando `entrega = 'fallido'`. |
| `envios.error_detalle` | text, null | entrevistador | web | Qué dijo Meta. Es lo que hay que leer para saber por qué no llegó. |

Reglas:

- **Los avisos llegan por el mismo webhook** que los mensajes entrantes, en `value.statuses`. Hasta el
  23/09 los tirábamos a la basura.
- **Un aviso viejo no pisa a uno nuevo**: el orden es enviado → entregado → leido, y `fallido` gana
  siempre. Meta no garantiza el orden de llegada.
- **Nada de esto puede tumbar el webhook**: si la columna no existe o la fila no está, se avisa y se
  sigue. Un mensaje que no salió de `envios` (la confirmación de una foto) simplemente no se anota.
- Cómo se lee: `fallido` = el número o la cuenta tienen un problema · `entregado` sin `leido` = le
  llegó y no lo abrió · `leido` sin respuesta = el problema es lo que dice el mensaje.

## La revisión — `pedidos.estado = 'revision'` (diseño 23/09 §3.3, decisión de Naza; PENDIENTE de aplicar)

⚠️ **No está aplicada todavía.** La migración es `20260924000000_pedidos_revision.sql` (Tarea 14
del plan del biógrafo que piensa) y la aplica Naza en el SQL Editor, **cuando lo acuerde con
Joaquín** (toca `pedidos_estado_check`, que también lee la fábrica en `esperando_voz` y
`entregado`). Es idempotente y no toca datos. Hasta que se aplique, `dejarEnRevision` (abajo) falla
con la constraint vieja: la fábrica no puede dejar un pedido en `revision`.

Con avisos del lector final o de los controles de contenido, el libro **espera** a que un socio lo
mire antes de imprimirse o entregarse: un invento impreso no tiene arreglo. **La familia no ve nada
de esto.**

| Qué | Escribe | Lee | Nota |
|---|---|---|---|
| `pedidos.estado = 'revision'` | **fábrica** (`dejarEnRevision`, `fabrica/src/libro/revision.ts`) | web, fábrica | Lo pone cuando `hayQueRevisar()` da true: el lector final avisó algo, un control se disparó, o el lector directamente no pudo leer. |
| `{narrador}/paquete/revision.json` | fábrica (mismo momento) | fábrica, y a mano (Naza/Joaquín) mientras no haya panel | El informe completo: forma `InformeRevision` — `{narrador, lector: AvisoLector[], control: string[], lectorFallo: boolean, fecha}` (`revision.ts`). |
| Mail a `MAIL_SOCIOS` | fábrica (`mailDeRevision`, mismo momento) | Naza y Joaquín | El detalle para decidir sin ir a mirar la base: qué vio el lector, qué controles saltaron. Nunca le llega a la familia. |
| Sacar el pedido de `revision` | **la web** desde el panel de la empresa (cuando exista), o **la fábrica a mano** (`update pedidos set estado = '…' where id = '…'`) mientras tanto | — | Corregir a mano el capítulo señalado, o decidir entregar igual. |

## El biógrafo v2 en `narradores.contexto.v2` (diseño 23/09; Tareas 1-13 del plan; PENDIENTE de conectar)

Todo el estado del biógrafo que piensa vive bajo **una clave, `contexto.v2`**, adentro del mismo
jsonb `narradores.contexto` que ya usa v1 (`preguntasEnviadas`, `repreguntasEnviadas`, `evitar`,
`ritmo`…): no es una columna ni una tabla nueva, así que **no hace falta migración** para esto.
`entrevistador/src/manual/estado-v2.ts` define la forma (`EstadoV2`) y las funciones puras que la
leen y la escriben.

**Quién escribe:** hasta que el v2 se conecte al flujo real (WhatsApp), **solo la puerta manual v2**
(`entrevistador/scripts/manual-v2.ts`, Tarea 8) escribe `contexto.v2` — a mano, comando por comando,
mientras Naza corre su piloto. El flujo v1 nunca toca `contexto.v2` (lee y escribe las claves de
siempre, arriba de la misma raíz) y la puerta manual v1 tampoco. **Quién lee:** hoy, la fábrica —
`fabrica/scripts/prueba-reparto.ts` y `fabrica/scripts/contexto-v2.ts` (Tarea 12) leen `contexto.v2`
para armar las épocas y la línea de tiempo del libro de un narrador v2. Más adelante, el panel de la
empresa va a leer `marcas` para mostrar los controles que saltaron.

**⚠️ Por qué el narrador v2 nace en `estado: 'pausado'` y no en `'activo'`:** el scheduler de
producción (el que dispara la fábrica) solo toma narradores en `acepto` o `activo` — es el único
estado que ignora. Si un narrador de prueba v2 quedara `activo`, el scheduler lo tomaría con
cualquier snapshot viejo de `contexto` (la fábrica no sabe de `v2`) y podría pisarlo o producir un
libro a medio entrevistar. `'pausado'` es el único estado del que el scheduler de producción **nunca**
saca nada: por eso la puerta manual v2 crea ahí al narrador de piloto, a propósito (ver el script y
la nota de cierre de la Tarea 8). El panel de la empresa, mientras tanto, va a **mostrar a ese
narrador como "pausado"** — es un efecto secundario esperado del mismo truco, no un bug.

Las claves de `EstadoV2` (todas puras, `entrevistador/src/manual/estado-v2.ts` + los tipos que
importa):

| Clave | Tipo | Qué es |
|---|---|---|
| `perfil` | `Perfil` (`entrevistador/src/ia/perfil.ts`) | La ficha del biógrafo: quién es la persona (edad, género, cómo habla, cómo le dicen, dónde vive), su línea de tiempo (`etapas`), las personas de su vida, `bisagras`, `tono`, `noSabemos`, `cubiertos`, `puertaAbierta`, `hoyFueFuerte`. Cada dato dice su `fuente` (`dicho` / `ficha` / `deducido`). La escribe el entrevistador (hoy, la puerta manual) después de cada respuesta; **la lee la fábrica** para armar las etapas del libro (`fabrica/scripts/contexto-v2.ts`). Desde el esqueleto v2 tiene topes (`TOPES` en `perfil.ts`): etapa (cada campo) ≤ 220 caracteres, bisagra ≤ 150 y máximo 12, nota de persona ≤ 80 y máximo 30 personas, `noSabemos` ≤ 12, `tono` ≤ 300, y además un presupuesto total de 5.750 caracteres de `perfilEnTexto` que se cumple podando en un orden fijo (primero notas y personas no familiares, después `noSabemos`, campos de etapas, bisagras y notas de familiares) cuando los topes por campo solos no alcanzan. `noTuvo` guarda los vínculos que dijo no tener. `puertaAbierta` queda siempre `null`: el prompt de la ficha ya no lo pide (solo sigue en el tipo para no romper lo guardado en `contexto.v2` de antes). |
| `secuencia` | `Secuencia` (`entrevistador/src/ia/secuencia.ts`) | La secuencia fija del esqueleto v2: `pendientes` (los objetivos —filas del guion, libres u objetos— que faltan, ya instanciados por persona: `hermano-ariel`, `hijo-marta`, `historia-grande-pandemia`, las puertas `hermanos-puerta`/`pareja-puerta` cuando no se sabe si tuvo, las variantes `hijo-unico`/`quienes-fueron-tu-familia`/`dejar-el-trabajo-sigue` cuando corresponden, y las libres `libre-<tramo en slug>-1` —p. ej. `libre-adulto-joven-1`, nunca con el espacio del tramo crudo—: como mucho una por etapa, hasta 4, elegida recién cuando se cerró esa etapa —es decir, después de su última pregunta—), `hechas` (`{id, orden, tramo, objetivo}`, una por pregunta ya mandada; **la fábrica las lee igual que antes**: `objetivo.tipo` `nucleo` con `tramo` y `bloque`, `variable` con `desde/hasta`, `objeto`), `cubiertos` (ids que se cayeron sin preguntarse: desde el ajuste E del 25/09, **solo puertas** —`*-puerta`, saber un dato—; en estados de antes puede haber otras filas), `nombrados` (ajuste E, 25/09: `Record<id de fila pendiente, id de la fila desde cuya respuesta la ficha la dio por contada>`; esas filas **no se tachan**: se preguntan igual y la pregunta va a lo que todavía no contó; falta en los estados guardados antes del 25/09 y al leer vale `{}`), `caidas` (`{id, motivo}`: filas que no aplican a esta persona, con el motivo), `objetos` (`{orden, tramo, final?}`, las hasta 8 fotos de "sus objetos preciados" con `final` marcando la del cierre), `ultimoTramo`, `libres` (cuántas libres se agregaron, hasta 4). Una etapa se da por cerrada cuando ya no queda nada pendiente de su `bloque` (para una fila del núcleo) o su `tramo` (para una libre) — no por el `tramo` propio de la fila que la cerró, que en varias filas queda `null`. El bloque `futuro` es nuevo: la fábrica lo trata como "sin época" (el modelo lo ubica), igual que `inicio`. Ajuste F (25/09): para quien no vive la adultez media (menos de 36) entra `lo-que-salio-mal` (bloque y tramo `adulto joven`), y para quien no vive la segunda mitad, `perdidas` puede entrar con `bloque` = su última etapa vivida (p. ej. `adulto joven`) y `tramo: null` (sin época: la muerte pudo ser en cualquier momento); para 56+ `perdidas` sigue en `segunda mitad` con su tramo. La fábrica cruza `hechas` contra `RANGO_TRAMO` (`entrevistador/src/ia/plan-preguntas.ts`) para saber la época de cada respuesta (`epocaV2`/`epocaDeTramo`, `contexto-v2.ts`). |
| `marcas` | `Record<string, Marca>` (`Marca = {control, motivo, intentos}`, `entrevistador/src/ia/control-pregunta.ts`) | Por `orden` (o `orden-repregunta`): qué control se disparó tres veces seguidas y no se pudo evitar (trato, largo, pregunta, lugar, supuestos), con el motivo y los intentos. **La va a mostrar el panel** cuando exista; hoy no la lee nadie más. |
| `preguntasEnviadas`, `repreguntasEnviadas` | `Record<string, string>` | Como en v1, pero adentro de `v2`: el texto que de verdad se le mandó, por `orden` (string) — `0` es la presentación, `101+` son los objetos. Necesario porque el v2 no repite la pregunta del guion tal cual: el biógrafo la personaliza. |
| `sinRepreguntarHasta`, `cansancioDesdeOrden` | `string?` (fecha YYYY-MM-DD), `number?` | El cansancio (§2.8): mientras la fecha no pasó, no se repregunta; `cansancioDesdeOrden` marca desde dónde cuentan las repreguntas sin contestar. |
| `firmaGuion` | `string` | La firma (edad, árbol, eventos — `firmaGuion()` en `guion-v2.ts`) con la que se armó la secuencia; si la ficha la cambia, la secuencia se rearma (`rearmar`, `secuencia.ts`) respetando lo hecho. Un `contexto.v2` guardado sin esta clave (el piloto del 24/09, con el plan viejo por peso) se rearma la primera vez que se carga, y las `var-*` pendientes de ese plan viejo se descartan (las `libre-*` del esqueleto v2 sí se conservan). |
| `retomar` | `number?` | "Hoy no" (§2.8): la orden que se vuelve a mandar tal cual mañana; mientras esté, la secuencia no avanza. |
| `gastoUsd` | `number` | USD acumulados de esta entrevista (modelo + transcripción), calculado con `calcularUsd`/`calcularUsdPorUnidad` (`entrevistador/src/costos.ts`). |
| `pausa` | `{motivo: 'quiereParar', fecha}?` | "No quiero seguir" (§2.8): vive acá y no en `narradores.estado` porque ese campo está fijo en `'pausado'` (ver arriba). Frena `siguiente`; se saca con `--reanudar`. |
| `terminada` | `string?` (fecha YYYY-MM-DD) | La entrevista terminó (revisión 24/09). Vive acá y NO en `narradores.estado = 'completado'`: la fábrica de producción arma la estructura v1 (llamada paga con el guion viejo) y manda el mail "terminó" a la familia apenas ve un `completado`. El narrador v2 queda `pausado` de punta a punta; su libro lo arma `fabrica/scripts/prueba-reparto.ts` a mano. |
| `reusar` | `{ desde: string; usadas: Record<string, string> }?` | Solo en el piloto "de cero, reusando respuestas viejas" (ajuste D, 24/09; `manual-v2 empezar --reusar <id>`). `desde`: el narrador del piloto viejo (solo se lee, nunca se escribe). `usadas`: **orden nueva → id de la respuesta vieja** que se cargó sola en esa orden; es la fuente de verdad de qué filas de `respuestas` de este narrador son reusadas (la fila no lleva marca propia: `respuestas` no tiene columna libre de metadatos y no se agrega DDL para un piloto). Las reusadas son copias como texto (`texto_directo` = `transcripcion`); nunca se reusa una vieja reservada (entera o por tramo) ni un objeto (101+). Sin `--reusar`, la clave no existe. |
| `procesadas`, `bloqueadas` | `string[]` (ids de `respuestas`) | `procesadas`: las que ya pasaron por perfil + evaluación (una fila fuera de esta lista es una carga cortada a medias). `bloqueadas`: las que frenó el candado de audio cruzado (hallazgo 43) — no entran a los prompts ni cuentan como contestadas hasta que se descarten o se recarguen con `--es-suyo`. |
