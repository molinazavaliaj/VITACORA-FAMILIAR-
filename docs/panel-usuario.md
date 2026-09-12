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
| **4 · Cerrar libro** | Ve el libro completo (el lector de §5), lee el aviso de que no hay vuelta atrás, y **cierra** | — |

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
| **Terminó — ya está listo para los últimos retoques** | `completado` / `cerrado_anticipado` | entrevistador |
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

## 11. Lo que cambia en el entrevistador (Joaquín)

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
