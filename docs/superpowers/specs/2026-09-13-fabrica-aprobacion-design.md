# La fábrica después del panel del usuario — diseño

> Decidido con Naza el 2026-09-13, sobre `docs/panel-usuario.md` §12 y `supabase/CONTRATO.md`
> (migración `20260912`, aplicada en producción el 13/09). Este documento manda sobre §12
> donde difieren; las diferencias con el spec de Joaquín están marcadas con ⚠️ para
> conversarlas con él.

## Qué cambia, en una frase

**Nada del libro se escribe hasta que la dueña aprieta "Cerrar libro"** (`libro_aprobado_at`).
Al terminar el narrador la fábrica sigue armando la estructura y el capítulo 1 de muestra;
al cerrar, escribe el libro aplicando la edición, arma HTML, PDF y audiolibro, entrega y avisa.

## 1. Decisiones de producto (Naza, 13/09)

1. **⚠️ Martina no ve nada terminado antes de cerrar.** Antes de `libro_aprobado_at` el
   lector del panel muestra la *propuesta*: capítulos con sus respuestas y transcripciones,
   más el capítulo 1 del anticipo. El spec de Joaquín (§5 último párrafo y §7.2 paso 4:
   "ve el libro completo") suponía el libro ya escrito; no es así.
2. **Una vez respondida una pregunta, no se modifica nada.** Sacar o cambiar preguntas es
   cosa del guion (§6, solo `orden > dia_actual`), lo hace la web. Antes de generar, la
   dueña **verifica los datos dudosos** que detectó el modelo (nombres, lugares) — eso es el
   `nombres.json` que ya existe — y cierra.
3. **⚠️ La fábrica ignora `edicion.excluidas` y `edicion.correcciones`** aunque el contrato
   los defina. El paso 3 del wizard de Joaquín no debería ofrecer "excluir respuestas" ni
   "correcciones libres".
4. Impreso y marcos: se venden, se cumplen a mano. La fábrica no habla con Lulu ni con
   nadie. (Decisión previa del 13/09, sin cambio.)

## 2. Cuándo hace cada cosa la fábrica

| Momento | Hoy | Nuevo |
|---|---|---|
| 3 respuestas | anticipo + mail | igual |
| narrador `completado` / `cerrado_anticipado` | `estructura.json`; `preview.pdf` cuando existe `nombres.json`; **y `generarPaquete` entero** (libro, PDF, audiolibro, `entregado`) | `estructura.json`; `preview.pdf` cuando existe `nombres.json`. **Nada más.** |
| `narradores.libro_aprobado_at` no nulo | — | `generarPaquete`: libro con la edición aplicada → `libro.html` + `libro.pdf` + audiolibro → pedido `entregado` → mail "tu libro está listo" |
| 3, 7 y 14 días desde `completado` sin `libro_aprobado_at` | — | mail recordatorio de cierre (uno por hito) |
| 30 días sin cierre | — | **la web** lo cierra con la propuesta y avisa (`CONTRATO.md`); la fábrica lo ve como un cierre más |

El freno está en un solo lugar: `procesarPedidosPagados` (`fabrica/src/worker.ts`) deja de
filtrar por `narradores.estado ∈ {completado, cerrado_anticipado}` y pasa a filtrar por
`narradores.libro_aprobado_at is not null`. Un pedido `pagado` de un narrador sin
aprobación se saltea, sin reclamarlo, como hoy se saltea el de un narrador activo.

## 3. La edición que sí se aplica (`narradores.edicion`)

`edicion` es jsonb con default `{}`; toda clave es opcional y tiene default. `generarPaquete`
la lee una vez, junto con el narrador, y la valida con un parser tolerante
(`leerEdicion(jsonb): Edicion`): claves desconocidas se ignoran, valores con tipo
inesperado se descartan (se loguea y se usa el default), nunca se tira.

| Clave | Tipo | Efecto | Default |
|---|---|---|---|
| `ordenCapitulos` | `text[]` (nombres de capítulo) | Reordena `estructura.capitulos` por nombre. Nombres que no existen se ignoran; capítulos no nombrados van al final en su orden original | orden de `estructura.json` |
| `titulo` | `text` | Título de tapa | `estructura.titulo` (`"{nombre} — La historia de una vida"`) |
| `subtitulo` | `text` | Subtítulo de tapa | `narrador.nombre` |
| `portadaFotoId` | `uuid` de `fotos` | Foto de tapa | `narrador.foto_url` |
| `excluidas`, `correcciones` | — | **Ignoradas** (decisión 1.3) | — |

`nombres.json` pasa a ser **opcional** en `generarPaquete`: si no existe, se escribe sin
correcciones de nombres (Regla 0 del spec: el servicio funciona sin el panel; a los 30 días
la web cierra sola y no puede depender de que haya revisado nombres). `preview.pdf` sigue
esperando `nombres.json`, como hoy — es una muestra, no bloquea nada.

## 4. Fotos (`tabla fotos`)

Por capítulo (`fotos.capitulo` = nombre del capítulo, mismo texto que `preguntas.capitulo`):

- La `principal` (a lo sumo una por capítulo; si hay varias, la de menor `orden`) abre el
  capítulo a página completa, antes del texto, con su `epigrafe` debajo.
- Las demás cierran el capítulo en su `orden`, una por página, con epígrafe.
- Sin fotos: el capítulo sale como hoy.
- La tapa usa `portadaFotoId` si está y existe; si no, `narrador.foto_url` como hoy.

Se descargan del bucket `audios` (`fotos.storage_path`) y se **embeben como data URI** en el
HTML, tal cual se subieron (original, sin recomprimir: la resolución la valida la web al
subir). Un `storage_path` que no se pueda bajar no frena el libro: se loguea y la foto se
omite. El `libro.html` resultante puede pesar varios MB; es aceptable para la v1 y el lector
de Joaquín lo carga completo.

`construirHtmlLibro` (`plantilla-html.ts`) suma `subtitulo` y, por capítulo, `fotoApertura` y
`fotosCierre` (`{dataUri, epigrafe}`); el paginador embebido ya reparte bloques en lienzos A5 —
una foto es un bloque que ocupa un lienzo entero.

## 5. Salidas en Storage (`{narrador_id}/paquete/`)

| Archivo | Quién lo lee |
|---|---|
| `libro.html` (**nuevo**) | el lector online del panel (Joaquín). Es el mismo HTML que se imprime |
| `libro.pdf` | descarga de la dueña, impreso a mano |
| audiolibro (`audiolibro_paths` en el pedido) | descarga de la dueña |

Los borradores (`borrador_cap_XX.md`, `borrador_libro.md`) siguen siendo caché contra
reintentos y se borran al entregar, como hoy. Como la edición está congelada una vez
aprobado, un reintento reusa el caché sin riesgo de mezclar dos ediciones.

`saludos`: fuera de la fase 1 (10/09). `generarPaquete` y `generarAudiolibro` dejan de
leer la tabla y de producir el bonus de saludos. El código de audiolibro que arma el bonus
se saca, no se deja muerto.

## 6. Mails desde la fábrica

Salen por Resend desde `fabrica/src/mail/` (mismo mecanismo que `anticipo.ts`; sin
`RESEND_API_KEY` devuelven `false` y el próximo tick reintenta). Cada mail tiene su candado
en Storage (`{narrador_id}/paquete/`), como `anticipo_enviado.txt`:

| Mail | Cuándo | Candado |
|---|---|---|
| "Tu libro está listo" | pedido pasa a `entregado` | `libro_listo_enviado.txt` |
| Recordatorio de cierre 1 | 3 días desde que el narrador pasó a `completado`/`cerrado_anticipado`, sin `libro_aprobado_at` | `recordatorio_cierre_3.txt` |
| Recordatorio de cierre 2 | 7 días | `recordatorio_cierre_7.txt` |
| Recordatorio de cierre 3 | 14 días | `recordatorio_cierre_14.txt` |

La fecha base es `narradores.ultima_respuesta_at` (no hay `completado_at`; la última
respuesta es el momento en que terminó). Si un hito quedó atrás sin candado (la fábrica
estuvo caída), se manda una sola vez el más reciente y se marcan todos los anteriores.

Los mails de "aceptó", "primera respuesta", "mitad", "terminó — listos los retoques" y
"silencio" son del entrevistador (§9). El aviso de cierre automático a los 30 días es de la
web.

**Los textos de los cuatro mails son producto: Naza los aprueba, uno por uno, antes de
commitear.** Van con el destinatario `familias.email`, remitente `hola@vitacorafamiliar.com`,
y el link al panel (`{urlBase}/tablero/{narrador_id}`, con `urlBase` de `config.ts`).

## 7. Errores

- `generarPaquete` sigue dejando el pedido en `fallido` ante cualquier excepción y no
  reintenta solo (alguien lo vuelve a `pagado`). Excepciones que **no** fallan el pedido:
  una foto que no baja (se omite), un mail que no sale (candado ausente → reintento).
- `edicion` inválida no tira: default + log.
- Si `libro_aprobado_at` está pero falta `estructura.json` (cerró antes de que el tick
  armara la estructura), `generarPaquete` la genera ahí mismo en vez de fallar.

## 8. Pruebas

Método de la casa: cada pieza con un test que **falla contra el código viejo** (se pega la
salida roja y la verde), un agente construye, otro la revisa **corriendo** el código, y una
revisión de la rama entera antes del PR. Tests en `fabrica/test/` con vitest, mockeando el
cliente de Supabase como hacen los existentes (`worker.test.ts`, `generar-paquete.test.ts`).

Casos mínimos:

- worker: pedido `pagado` + narrador `completado` sin `libro_aprobado_at` → **no se reclama**;
  con `libro_aprobado_at` → se reclama.
- `leerEdicion`: `{}` → defaults; tipos inválidos → default sin tirar; `ordenCapitulos` con
  nombres inexistentes y faltantes.
- `generarPaquete`: reordena capítulos; título/subtítulo/portada de la edición; sin
  `nombres.json` escribe igual; `excluidas` y `correcciones` no alteran nada.
- plantilla: foto de apertura y de cierre con epígrafe ocupan un lienzo; sin fotos, igual que hoy.
- fotos: `storage_path` que no baja → libro sale sin ella.
- mails: candados; hitos atrasados mandan uno solo; sin `RESEND_API_KEY` no deja candado.

## 9. Fuera de alcance

Cierre automático a los 30 días (web) · copia de las 26 fijas al comprar (web, paso 6 de
Joaquín) · lector online (web) · impresión y marcos (a mano) · `excluidas`/`correcciones`
(decisión 1.3) · reescritura de capítulos post-aprobación (no hay: se escribe una sola vez).

## 10. Para conversar con Joaquín

1. El lector antes de cerrar muestra la propuesta, no el libro escrito (1.1).
2. El wizard de edición no ofrece excluir respuestas ni correcciones libres (1.3);
   `edicion.excluidas` y `edicion.correcciones` quedan en el contrato sin lector.
3. `libro.html` es el archivo que lee el lector online.
4. La copia de las 26 fijas al confirmar la compra todavía no está en `confirmar-pago.ts`.
