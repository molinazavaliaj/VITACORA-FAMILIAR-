# El panel del usuario — spec

> **Decidido entre los dos socios el 2026-09-12**, con el dashboard de Remento como
> referencia (20 pantallas). Es la guía de construcción de `web/src/app/tablero/`.
> Lo que dice acá manda sobre `brief-landing.md` §9 y sobre el tablero actual.
>
> **Construye Joaquín** (tiene `web/` completo mientras Naza está sin créditos).
> Los cambios de esquema los confirma Naza cuando vuelva — están marcados ⚠️.

---

## Regla 0 — El servicio funciona sin el panel

**Martina puede no entrar nunca al panel durante la entrevista.** Compra → arranca solo
con los datos obligatorios → los mails le cuentan el progreso → el biógrafo termina su
trabajo sin necesitarla.

**El único momento en que la necesitamos es al final: cerrar el libro.** Cuando el
narrador termina, le llega un mail: *"Ya está listo para los últimos retoques."* Entra,
ordena capítulos, sube las fotos que falten, revisa nombres, excluye lo que no quiere — o
no toca nada y acepta nuestra propuesta — y aprieta **Cerrar libro**. Recién ahí se produce,
sea digital o impreso.

**Ese botón es el punto de aprobación, y es deliberado:** después de cerrar no hay vuelta
atrás ni devolución porque "no le gustó cómo quedó escrito algo". *Vos acá confirmaste
todo.* Nos protege de descontentos y confusiones.

⚠️ **Si nunca cierra:** recordatorios a los 3, 7 y 14 días. **A los 30 días el libro se
produce solo con nuestra propuesta** — y eso está escrito en los términos. Un cliente que
pagó y no recibe nada es peor que uno que discute el orden de un capítulo.

Todo lo demás del panel es un *plus* para hacer una biografía mejor. Por eso **cada
pantalla tiene un default que funciona sin tocarlo** y ningún paso bloquea al biógrafo.

---

## 1. Vocabulario

| Término | Qué es |
|---|---|
| **Historia** | Un narrador = un libro. "La historia de Alfredo", "La historia de Dora". Es lo que lista el menú Historias |
| **Capítulo** | Los 8 del guion (La infancia … La sabiduría). Ordenados por el biógrafo |
| **Pregunta** | Una de las hasta 40 que recibe el narrador. Cada narrador tiene **su propio guion** |
| **Respuesta** | Audio + transcripción de una pregunta |
| **Dueña** | Quien compró. Una por historia. Ve y puede todo |
| **Invitado** | Hasta 3 por historia. Ven, agregan preguntas y fotos, compran su copia. No deciden |
| **Visitante** | Abre el link público de un libro cerrado. Ve una muestra, puede guardar o comprar |

No usamos "stories" sueltas como Remento: **nuestro producto es una biografía con guion**,
no una bolsa de grabaciones.

---

## 2. Quién entra y qué puede

| | Dueña | Invitado | Visitante (link) |
|---|---|---|---|
| Ver Inicio con la historia | ✅ | ✅ marcada "invitado" | — |
| Ver respuestas, audios, transcripciones, fotos, anticipo | ✅ | ✅ | Solo muestra: portada, nombres de capítulos, primer párrafo, 30 s de audio |
| Agregar preguntas y subir fotos | ✅ | ✅ (mientras el libro está abierto) | — |
| Editar / saltar / reordenar el guion | ✅ | ❌ | — |
| Cambiar el ritmo, temas a evitar | ✅ | ❌ | — |
| Invitar / compartir | ✅ | ❌ | — |
| Encargar libro (wizard de edición y aprobación) | ✅ | ❌ blurreado | — |
| Comprar copia impresa | ✅ | ✅ | ✅ (crea cuenta al comprar) |
| Descargar PDF y audiolibro | ✅ | ❌ (ve, no baja: es lo que Martina pagó) | ❌ |
| Ver lo que pagó Martina | ✅ | ❌ | ❌ |

**El narrador nunca entra.** Su canal es WhatsApp.

---

## 3. Navegación

- **Desktop:** sidebar izquierdo, fondo `#14140F`, el toroide arriba, selector de historia
  debajo (*"La historia de Alfredo ▾"*), 4 secciones. **Mobile:** pestañas abajo.
- **Marca:** tokens de `docs/design.md`, los mismos que la landing (`--fuente-micro`,
  Playfair para títulos, Source Serif para texto, violeta en **una** cosa por pantalla).
- **Selector de historia:** lista los narradores de la familia + los que le compartieron
  (marcados "invitado") + *"Empezar otra historia"* → `/comprar` con los datos del
  comprador y de pago precargados. La nueva historia aparece sola en el panel.

Las 4 secciones:

| Sección | Qué hace |
|---|---|
| **Inicio** | La foto general: historias, próximo paso, anticipo, alertas |
| **Historias** | Una historia a la vez: cómo va, qué contó, las fotos, compartir |
| **Preguntas** | El guion de esa historia: ver, editar, saltar, agregar, sugeridas, ritmo, evitar |
| **Encargar libro** | Lo que compró · edición final y aprobación · extras y copias |

---

## 4. Inicio

- **Una tarjeta por historia:** nombre, estado en humano (`ESTADO_EN_HUMANO`, ya existe),
  progreso (*"12 de 30 respuestas"*), y **un solo próximo paso** (regla de Naza).
- **El anticipo** cuando existe: *"Ya podés leer el capítulo 1 de la historia de Alfredo"*.
  Vive acá y en la historia, no solo en el mail — es lo que la motiva a motivar al narrador.
- **Dato emocional:** *"2 h 14 min de su voz guardadas"* (suma de `duracion_segundos`).
- **Alertas:** silencio de 3 días (`BannerAlertaSilencio`, ya existe).
- Historias donde es invitada: misma tarjeta, con la etiqueta *"Te invitó Martina"*.

---

## 5. Historias — la vista de un narrador

**Arriba:** nombre · estado actual · barra de progreso · botón **Compartir** (ver §8).

**El cuerpo se organiza por capítulo, no por fecha.** 8 bloques, cada uno con su
progreso (*"La infancia · 3 de 4"*). Así ella ve el libro formándose.

**Cada respuesta muestra:** la pregunta · el audio (`RespuestaAudioOTexto`, ya existe) ·
**la transcripción** (hoy no se muestra; la tenemos) · la foto si la pregunta la tenía ·
la fecha. **Sin atribución de quién preguntó**: pregunta siempre el biógrafo.

**Acciones sobre una respuesta:** solo **"Pedirle que cuente más"** → abre el formulario
de agregar pregunta (§6) con el tema precargado. Nada de volver a grabar ni descargar
audios sueltos.

**Fotos por capítulo:** en cada bloque, *"Agregar una foto de esta época"*. Ver §6.3.

**El anticipo** (página del capítulo 1 + audio) embebido cuando existe.

**Cuando el libro está cerrado** (`completado` / `cerrado_anticipado`): esta vista pasa a
ser **el lector**: el HTML que la fábrica ya genera, paginado por capítulo, con el audio
de cada uno. La dueña tiene **Descargar PDF** y **Descargar audiolibro**; los invitados no.

---

## 6. Preguntas — el guion editable

### 6.1 · Reglas

- **Cada narrador tiene su propio guion.** Al comprar, la web **copia las 26 fijas** a
  filas propias del narrador. Las globales quedan como plantilla.
- **Enviada = congelada.** Lo que tiene `orden ≤ dia_actual` no se toca.
- Sobre las **futuras** la dueña puede: **editar el texto**, **saltar** (se elimina y se
  renumera), **reordenar**, **agregar** al final.
- **Piso 15, tope 40.** Las **4 adaptativas del cerebro siempre existen** y cuentan para
  el tope → dueña e invitados llegan a **36 como máximo** si no borran ninguna.
- **Los invitados solo agregan** (y suben fotos). No editan, no saltan, no reordenan.
- **Cuando se cierra el libro**, esta sección deja de permitir cambios.

### 6.2 · Agregar una pregunta (dueña e invitados)

Modal con dos caminos, como Remento:

1. **Escribir una pregunta.** Texto libre + elegir capítulo. El biógrafo la hará como
   propia: *"Hoy me gustaría que me cuente…"*.
2. **Subir una foto.** La foto es la pregunta: *"¿Qué estaba pasando ese día?"* (texto
   editable) + capítulo. El biógrafo se la manda por WhatsApp con la imagen. Su respuesta
   es la historia de esa foto, y **la foto entra al libro con esa historia.**

Y un tercer botón, solo dueña: **"Sugerime preguntas"** → 5 sugeridas por el cerebro con
lo que él ya contó + el contexto que cargó ella. Elige cuáles agregar. A pedido, no
automático.

**Mensaje fijo arriba de la sección:** *"Cuanto más personal es el guion, mejor queda el
libro. Repasá las preguntas, sumá las tuyas y agregá fotos de cada época."*

### 6.3 · Fotos sin pregunta

Desde Historias (por capítulo) o desde acá: subir una foto y elegir capítulo. Por
capítulo hay **una principal** (abre el capítulo) y **adicionales** (lo cierran), cada una
con epígrafe opcional. **La foto del marco NFC es una elección aparte**, en Encargar libro.

**Calidad:** se guarda **el original sin recomprimir**. Se valida al subir y se avisa ahí:
página del libro → ≥ 1200×1800 px; marco 20×25 cm → ≥ 2400×3000 px. Instrucciones en
castellano: *"apoyá la foto en una mesa, con luz de día, sin flash"*.

### 6.4 · Ritmo y temas a evitar (solo dueña)

- **Ritmo:** *una por día* (default) · *dos por día* · *apenas responde*. Además, el
  biógrafo **le ofrece al narrador seguir** al terminar una respuesta: *"¿Quiere que le
  mande la siguiente ahora, o la dejamos para mañana?"*. El narrador manda su propio ritmo.
- **Temas a evitar:** campo libre → `contexto.evitar`. El cerebro lo lee en todos sus
  prompts.

---

## 7. Encargar libro

### 7.1 · Antes de que termine

Muestra **lo que compró** (base + extras) y: *"Cuando termine de contar su historia, te
avisamos por mail para que le des los últimos retoques y lo cierres."*

### 7.2 · Al terminar la entrevista: la edición final (solo dueña)

Se habilita con `completado` o `cerrado_anticipado`. Llega el mail *"ya está listo para
los últimos retoques"*. Se cierran Preguntas; **las fotos se pueden seguir subiendo hasta
cerrar**. Wizard en 4 pasos, **siempre con nuestra propuesta como punto de partida**:

| Paso | Qué decide | Default |
|---|---|---|
| **1 · Portada** | Foto, título, subtítulo. Preview de tapa y lomo. **Sin colores** (marca B/N) | Foto de perfil del narrador · *"Alfredo — La historia de una vida"* · nombre completo |
| **2 · Capítulos** | **Reordenar capítulos** (arrastrar). Las respuestas dentro de cada capítulo **no se reordenan**: ese orden lo decidió el biógrafo | El orden del guion |
| **3 · Contenido** | **Excluir respuestas** (*"esto no quiero que salga"*) · **fotos que falten** · **revisar nombres** (ya existe) · **correcciones libres** (campo de texto que la fábrica aplica) | Todo incluido |
| **4 · Cerrar libro** | Ve el libro completo (el lector de §5), lee el aviso de que no hay vuelta atrás, y **cierra**. ⚠️ ver nota en §12 | — |

**Cerrar libro → se produce**, digital e impreso. Es **siempre** obligatorio (ver Regla 0).
Recordatorios a los 3, 7 y 14 días; a los 30 se produce solo con la propuesta.

### 7.3 · Extras y copias (dueña e invitados)

Siempre visible. Reusa `lib/productos.ts` y el checkout. Para tentar el upsell una vez más:
libro impreso (si no lo compró), pasar a color, marcos NFC con **elección de la foto del
marco**, y **copias**.

**Descuento por cantidad — solo en un mismo pedido:** 2 copias −10 %, 3 −15 %, 4 o más
−20 % sobre las copias. Es por ahorro de producción, no un premio: **el primo que compra
su copia por separado paga precio lleno.**

**"Ver pedidos anteriores"** con estado de cada uno.

---

## 8. Compartir — un botón, dos comportamientos

| Estado del libro | Qué hace "Compartir" |
|---|---|
| **Abierto** (entrevista en curso) | **Invitar** por mail, hasta 3. El invitado entra con código, ve la historia en su Inicio marcada "invitado", agrega preguntas y fotos |
| **Cerrado** | **Link público** del libro. El visitante ve portada + nombres de capítulos + primer párrafo + 30 s de audio, y dos botones: **"Guardarlo en mi cuenta"** (crea cuenta; lo ve como muestra) y **"Comprar mi copia impresa"** (paga con su tarjeta, se envía a su casa, se le crea la cuenta) |

El link cerrado existe para que **Martina, que ya hizo todo el trabajo, no tenga que
seguir trabajando**: le manda el link al primo y el primo se ocupa.

Al cerrar el libro **los invitados dejan de tener función** (ya no hay qué agregar): siguen
viendo el libro, no pueden bajarlo.

---

## 9. Mails — siete, ninguno más

El panel es opcional; los mails son lo que la mantiene parte de la construcción.

| Hito | Cuándo | Quién lo dispara |
|---|---|---|
| **Aceptó** | El narrador dijo "SÍ" | entrevistador |
| **Primera respuesta** | Llegó la 1 | entrevistador |
| **Terminó el capítulo 1 + anticipo** | Respuesta 3 | fábrica (ya existe) |
| **Mitad del camino** | Respuesta ⌈N/2⌉ | entrevistador |
| **Terminó — ya está listo para los últimos retoques** | `completado` / `cerrado_anticipado` | fábrica (desde el 13/09; ver §12) |
| **El libro está listo** | La fábrica terminó | fábrica |
| **Silencio de 3 días** | `alerta_silencio` | entrevistador (ya prende la alerta; falta el mail) |

Más los tres recordatorios de cierre (3, 7 y 14 días) y el aviso de producción automática a los 30. Todos van por
Resend desde `web/src/lib/mail.ts` (ya existe) — el entrevistador los pide a la web o
escribe en una cola; **a definir en implementación**, sin bloquear.

---

## 10. Modelo de datos — lo que cambia ⚠️ toca `CONTRATO.md`

```sql
-- preguntas: el guion pasa a ser por narrador
alter table preguntas
  add column foto_id uuid references fotos(id),         -- pregunta-foto
  add column agregada_por uuid references auth.users(id); -- null = del guion o del cerebro
-- tipo: se amplía el check a ('fija','adaptativa','familia','sugerida')

-- fotos: nueva
create table fotos (
  id uuid primary key default gen_random_uuid(),
  narrador_id uuid not null references narradores(id) on delete cascade,
  capitulo text not null,
  storage_path text not null,          -- {narrador_id}/fotos/{id}.{ext} en bucket 'audios'
  epigrafe text,
  principal boolean not null default false,
  orden int not null default 0,
  ancho_px int, alto_px int,
  subida_por uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- invitados: nueva. Hasta 3 por narrador (lo cuida la web).
create table invitados (
  id uuid primary key default gen_random_uuid(),
  narrador_id uuid not null references narradores(id) on delete cascade,
  email text not null,
  auth_user_id uuid references auth.users(id),   -- null hasta que entra por primera vez
  invitado_por uuid not null references familias(id),
  created_at timestamptz not null default now(),
  aceptado_at timestamptz,
  unique (narrador_id, lower(email))
);

-- narradores: la edición final y la aprobación
alter table narradores
  add column edicion jsonb not null default '{}'::jsonb,
  --   {ordenCapitulos: text[], excluidas: uuid[] (respuestas.id), titulo, subtitulo,
  --    portadaFotoId, correcciones: text}
  add column libro_aprobado_at timestamptz;

-- contexto (jsonb, sin migración): ritmo: 'diario'|'dos_por_dia'|'seguido' · evitar: text
-- envios.tipo: se amplía con 'oferta_siguiente'
```

**Sin cambio:** `respuestas` sigue uniendo por `(narrador_id, pregunta_orden)`. Como lo
enviado está congelado, renumerar las futuras no rompe nada.

**Backfill:** a los narradores existentes se les copian las 26 fijas a filas propias.

---

## 11. Lo que cambia en el entrevistador (Joaquín) — ✅ hecho el 14/09 (ver `ESTADO.md`)

1. **Leer el guion del narrador.** `preguntaDeOrden` ya prefiere las filas propias — con
   todos los narradores copiados, la fija global no se usa más.
2. **Adaptativas al final real, no en la 26.** Se disparan cuando el narrador responde la
   última pregunta que existe y todavía no hay adaptativas → genera 4 en `N+1..N+4`.
   Reemplaza `ULTIMA_FIJA = 26`.
3. **Mandar imágenes por WhatsApp** para la pregunta-foto (media upload a Meta + `image`).
4. **Ofrecer la siguiente** al terminar una respuesta suficiente, según `contexto.ritmo`;
   si el narrador dice que sí, se manda ya (texto libre, ventana abierta). Nuevo
   `envios.tipo = 'oferta_siguiente'`.
5. **`contexto.evitar`** en todos los prompts del cerebro.
6. **Mails de hitos** que le tocan (aceptó, primera, mitad, terminó, silencio).
7. **Sugeridas a pedido:** un endpoint o función que la web llama con el narrador → 5
   preguntas. Reusa el prompt de adaptativas.

## 12. Lo que cambia en la fábrica (Naza, cuando vuelva)

> Construido el 13/09 según
> `docs/superpowers/specs/2026-09-13-fabrica-aprobacion-design.md`, que difiere en tres
> puntos: (1) antes de cerrar no hay libro escrito, el lector muestra la propuesta;
> (2) `excluidas` y `correcciones` no se aplican —**ya no: desde el 25/09 (D1) la fábrica los
> aplica, ver `supabase/CONTRATO.md` "Cerrar el libro"**—; (3) el mail "terminó" y el cierre
> automático a los 30 días los manda la fábrica, no el entrevistador ni la web.

- Leer `narradores.edicion`: orden de capítulos, respuestas excluidas, título, subtítulo,
  portada, correcciones libres.
- Ubicar `fotos` por capítulo: principal abre, adicionales cierran, con epígrafe.
- **No producir nada sin `libro_aprobado_at`** — ni digital ni impreso. A los 30 días de
  `completado` sin cierre, la web lo cierra con la propuesta y avisa.
- El HTML del libro expuesto para el lector online (ya se genera antes del PDF).
- Mails "libro listo" y recordatorios de aprobación.

## 13. Fuera de la v1

Video · reacciones al narrador · atribución de quién preguntó · editor de texto párrafo a
párrafo · colores de tapa · más de 3 invitados · referidos · regalar una cuenta.

---

## 14. Orden de construcción

1. Sacar los saludos de `web/` (11 archivos)
2. Migración + `CONTRATO.md` (⚠️ Naza confirma)
3. Esqueleto: sidebar, 4 secciones, marca, selector de historia (fuera el `limit(1)`)
4. Inicio
5. Historias por capítulo, con transcripción y estado
6. Preguntas: ver / editar / saltar / reordenar / agregar / foto / ritmo / evitar
7. Invitados: invitar, entrar, permisos, blur
8. Encargar libro: estado previo + extras con descuento por cantidad
9. Edición final en 4 pasos + aprobación
10. Compartir cerrado: link público, guardar, comprar copia
11. Lector online + descargas
12. Mails de hitos

---

## 15. Decisiones del 13/09 (tarde) — ⚠️ pendientes de implementar

> Decididas por Joaquín en la sesión de rediseño. Reemplazan lo que diga
> arriba donde se contradigan. Se implementan cuando se elija la dirección
> visual (lienzo "Vitácora · Direcciones del panel", `docs/diseno/panel-v2/`).

### 15.1 · Tres productos, al menos uno — "ricitos de oro"

> **Superado el 21/09** por el catálogo base + upsells (`docs/superpowers/specs/2026-09-22-catalogo-base-y-upsells-design.md`):
> la base (PDF + Su voz) va siempre; el impreso y los marcos se suman. Lo de abajo queda como historia.

| Producto | Qué es | ARS | EUR | Variable |
|---|---|---|---|---|
| **El libro en PDF** | Se **lee en la web**, capítulo por capítulo, con las fotos. **No se descarga.** | 85.750 | 49 | `PRECIO_ARS` / `PRECIO_EUR` (sin cambio de valor: antes incluía el audiolibro) |
| **El audiolibro** | La historia completa **en primera persona**, con **su voz clonada de sus audios reales** o con **un narrador** — lo elige quien compra. Se **escucha en la web**, no se descarga. | 61.250 | 35 | `PRECIO_AUDIOLIBRO_ARS` / `_EUR` (nuevas) |
| **El libro impreso** | Tapa dura, B/N o color, QR en la contratapa. Lo único que sale de la nube. | 70.000 / 80.500 | 40 / 46 | sin cambio |
| Marcos con NFC | Se suman a cualquiera de los tres. | 35.000 c/u | 20 | sin cambio |

- **Al menos uno de los tres es obligatorio** en el checkout. Los marcos solos, no.
- **Por qué:** mostrar los tres a la vista hace que el impreso —el que queda en la
  repisa— se lea como la opción buena frente a "lo otro está en la nube". Y quien
  quiera los tres, puede.
- **La entrevista es la misma** para los tres. Lo que cambia es la salida.
- El PDF y el audiolibro **dejan de ser descargables**: `/tablero/[id]/leer`
  (antes `/descarga`) es el **lector**: el `libro.html` que publica la fábrica
  (Naza, 14/09) en un iframe sin permisos, y el audiolibro capítulo por
  capítulo con el reproductor de la casa. **Integrado el 14/09**: la pantalla
  de Joaquín con el contenido de Naza. Rutas: `api/libro/html` y
  `api/libro/audio/[indice]`. **Leen y escuchan la dueña y los invitados**
  (§2, §5); el visitante del link público ve solo la muestra. No existe ruta
  del PDF: nada se descarga.
- ⚠️ **Toca al entrevistador y a la fábrica:** la voz clonada necesita muestras
  limpias de sus audios (el entrevistador ya las tiene) y un proveedor de
  clonación (fábrica). El narrador es un TTS de una voz fija. Definir proveedor
  antes de prometer fechas.

### 15.2 · Fotos: también sin capítulo

Hoy `fotos.capitulo` es obligatorio: toda foto pertenece a un capítulo y el
wizard elige la tapa entre esas. Falta el **álbum general** — fotos que no son
de una época sino del libro: tapa, contratapa, la del marco.

- `fotos.capitulo` pasa a **nullable**. Sin capítulo = álbum general.
- `narradores.edicion` suma `contratapaFotoId` y `marcoFotoId` (ya tiene
  `portadaFotoId`).
- **Dónde se suben:** desde el botón **Agregar fotos** arriba a la derecha de la
  historia (general o a un capítulo, se elige en el mismo diálogo) y desde cada
  capítulo (ya va a ese capítulo).
- **Dónde se eligen tapa / contratapa / marco:** en **Encargar libro**, debajo
  del libro en miniatura. Se puede elegir en cualquier momento; se confirma al
  cerrar.
- Calidad: tapa y contratapa piden lo mismo que el libro (≥ 1200×1800); el
  marco, ≥ 2400×3000 (§6.3). El aviso se muestra al elegir, no solo al subir.

### 15.3 · Las secciones se reordenan: la historia ES el guion

Hoy las preguntas se listan dos veces (Historias por capítulo con respuestas;
Preguntas con el guion editable). Queda **una**.

- **Inicio** → sigue igual: una tarjeta por historia.
- **Historias** → la lista de historias (lo que hoy está en Inicio) y, al tocar
  una, **el panel general de la historia**: todas las preguntas **numeradas por
  capítulo**, con la respuesta (audio + transcripción) debajo de las contestadas
  y "todavía no" en las que faltan.
- Arriba a la derecha, dos botones: **Agregar/Editar preguntas** y **Agregar fotos**.
  - *Agregar/Editar preguntas* pone en modo edición **todas las que vienen** (las
    enviadas no se tocan, §6.1) —editar, sacar, mover— y suma la **burbuja de
    agregar una pregunta**, con foto opcional y a qué capítulo. "Listo" vuelve
    a la vista normal.
  - *Agregar fotos* abre el diálogo de subida: general o a un capítulo.
- **Preguntas** deja de ser una sección de navegación. **Ajustes de la
  entrevista** (ritmo) y **temas que no se preguntan** quedan **al final** de la
  historia, después del último capítulo.
- La navegación queda con **tres** entradas: Inicio · Historias · Encargar libro.
- **Dirección visual elegida (13/09, tarde):** la historia de la dirección B
  (riel de capítulos a la izquierda, filas compactas con el audio a la derecha)
  con los capítulos por venir en el formato de A·Edición al tocar *Editar
  preguntas*; Encargar libro nace en negro (C). **Tema claro/oscuro** con un botón
  arriba a la derecha, siempre a la vista, opuesto al logo — mismos roles de
  color invertidos (`.oscuro`), sin reescribir piezas. El riel de Historias
  muestra primero las historias creadas + el botón violeta *Empezar una
  historia*, y debajo los capítulos de la abierta. Lienzo: `docs/diseno/panel-v2/`.
- **Comprar desde la landing:** 4 pasos (Quién cuenta · Su WhatsApp · Tu mail ·
  Pagar); el último muestra los tres productos + marcos y el total.

### 15.4 · Encargar libro: el libro en miniatura

- Arriba: **Su libro** y el estado (en curso / terminó, faltan retoques / cerrado).
- Debajo: **el libro en miniatura, hojeable página por página** — la
  previsualización real de cómo va a quedar: dónde caen las fotos, los
  capítulos, la tapa elegida. Con lo contado hasta hoy; crece con la entrevista.
- Debajo: **Tapa · Contratapa · Marco** — elegir la foto de cada una (15.2).
- Debajo: lo comprado y los tres productos para sumar (15.1) + marcos.
- **Hecho el 13/09** (`libro/miniatura.tsx`): se arma en el navegador con la
  lógica de la fábrica (foto principal abre el capítulo, las demás lo cierran,
  texto cortado en oraciones, capítulos a la derecha). ⚠️ 3t.8 (Naza): cuando la
  fábrica exponga su HTML paginado, la miniatura lo muestra en vez de armarlo.
- Las fotos se eligen en cualquier momento (`PATCH /api/edicion` acepta solo
  las claves de fotos antes de que termine); título, capítulos y el encargo
  siguen esperando al final.
- **Revisión del 13/09 (noche):**
  - El botón final del wizard es **"Encargar"**: es la orden de producir (PDF,
    audiolibro, imprimir copias y fotos de los marcos, preparar el envío). Es
    el mismo `POST /api/edicion {accion:'cerrar'}` de siempre.
  - **Títulos de capítulos editables** (`edicion.titulosCapitulos`), en el paso
    Capítulos del wizard; el libro los usa, el guion no cambia.
  - **El álbum:** al subir una foto, "Todavía no sé — al álbum del libro". En
    Encargar libro, el álbum se ve arriba y las fotos se **arrastran** (o se
    eligen tocando) a la portada de cada capítulo, la tapa, la contratapa o un
    marco. Mover una foto a un capítulo es `PATCH /api/fotos/[id]`.
  - **Un marco por primo, con su foto** (`edicion.marcosFotoIds`): tantas
    ranuras como marcos comprados (mínimo una). El tag NFC apunta al link
    público del libro.
  - **Autobiografía** (`contexto.vinculoComprador = "yo mismo"`, `esPropia()`):
    el panel le habla de vos ("Tu historia", "terminaste de contar").
  - Sidebar: sin selector de historia (está en el riel); abajo, **Tu cuenta**
    (`/tablero/cuenta`) y **Cerrar sesión** (`/api/auth/salir`).
- **Integración del 14/09 (entrevistador de Naza):** la historia muestra, bajo
  cada pregunta del guion, **«Se lo preguntamos así: …»** cuando el biógrafo la
  reescribió con lo ya contado, y **«Le repreguntamos: …»** arriba de «y agregó».
  Salen de `narradores.contexto.preguntasEnviadas` / `repreguntasEnviadas`
  (provisorio: **después del primer piloto se migran a `envios.texto`**, para que
  web y entrevistador no se pisen el jsonb — decisión del 14/09).

### 15.5 · Qué toca a quién

| | Dueño |
|---|---|
| Checkout con tres productos, `pedidos.extras` → `productos` (pdf / audiolibro{voz} / impreso{acabado} / marcos), precios nuevos, sin descargas, lector + reproductor online, historia unificada, fotos generales, tapa/contratapa/marco, miniatura | Joaquín (`web/`) |
| Migración `fotos.capitulo` nullable + `CONTRATO.md` | Joaquín escribe, **Naza aplica** |
| Audiolibro con voz clonada o narrador, HTML paginado para la miniatura, tapa/contratapa/marco en el PDF | Naza (`fabrica/`) |
| Muestras de voz limpias para clonar | Joaquín (`entrevistador/`) |

### 15.4 · Paso 5 de la compra: la entrevista y el álbum (17/09)

Decisión de Joaquín: **el libro tiene que poder terminarse sin entrar nunca al panel.**
Por eso `/comprar` tiene un quinto paso, antes de pagar y todo opcional: el ritmo
(`contexto.ritmo`, mismo texto que Ajustes), los temas a evitar (`contexto.evitar`) y las
fotos del álbum (sin capítulo: después se arrastran en Encargar libro).

Cómo funciona por detrás: al tocar **Pagar**, `/api/compra` crea familia + narrador
(`pendiente_pago`) + pedido y devuelve, además de la url de pago, un **token firmado de una
hora atado a ese narrador** (`lib/token-fotos.ts`). Con ese token el navegador sube las
fotos a `/api/fotos?narrador=…&token=…` —sin sesión, solo mientras el narrador siga en
`pendiente_pago`, `subida_por` queda vacío— y recién después redirige al proveedor de pago.
Si una foto falla, no se va a pagar: se avisa, y al reintentar no se repite ni la compra
(el narrador ya existe) ni las fotos ya subidas.

### 15.5 · Cuando terminó de contar (17/09, pedido de Joaquín)

- **El guion se cierra solo** al terminar (el biógrafo ya se despidió): el botón
  *Agregar/Editar preguntas* queda en gris, con el porqué al pasar el mouse. No desaparece.
- **Las fotos siguen abiertas** — desde la historia y también desde *Encargar libro*
  (botón "+ Agregar fotos" en el álbum), que es donde se ve cómo queda el libro.
- Aparece **Cerrar edición del libro** (solo la dueña). Al tocarlo la barra queda en gris
  y recién ahí aparece el paso siguiente: "Dale los últimos retoques y encargá su libro".
  Se guarda en `edicion.historiaCerradaEl`; es reversible ("Reabrir la edición") y **no
  toca la fábrica** — lo definitivo sigue siendo *Cerrar libro* en Encargar libro
  (`libro_aprobado_at`).
- En modo edición, el botón **Listo** va abajo, después de "Sugerime preguntas".

### 15.6 · Calidad de las fotos, recalibrada (17/09)

Antes todo lo que no llegaba a página entera (1200×1800) salía en rojo como "pixelada":
una tapa de disco de 1500×1500 o una foto de 1920×1080 asustaban sin motivo (lo vio
Naza). Ahora hay cuatro escalones (`calidadDeFoto`): **marco** ≥ 2400×3000 · **libro**
(página entera, tapa, portada de capítulo) ≥ 1200×1800 · **chica** (entre el texto)
≥ 800×1000 · **baja** (pixelada en cualquier tamaño). Solo *baja* es alerta roja; el resto
informa. En Encargar libro, una *chica* puesta en portada/tapa avisa que ahí se vería pixelada.

### 15.7 · Encuadrar y ubicar la foto (3b.6, 18/09)

No es un recorte libre. En Encargar libro, cada lugar con foto (portada de capítulo,
tapa, contratapa, marco) tiene **Encuadrar**: la familia toca el punto de la foto que
tiene que quedar a la vista (la cara) y ve al lado cómo queda recortada a la proporción
de ese lugar (capítulo 4:3, tapa 1:1, contratapa y marco 4:5). En la portada del
capítulo elige además **arriba del título** (default) o **debajo del título, antes del
texto**. Se guarda en `fotos.foco` (`{x,y}` 0..1) y `fotos.posicion`; la miniatura y la
fábrica aplican lo mismo (`object-fit: cover; object-position`). Acordado con Naza: la
principal se recorta con foco, las que cierran el capítulo van enteras, la tapa con foco.

