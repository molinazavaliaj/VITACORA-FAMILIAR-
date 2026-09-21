# Panel de la empresa — diseño

**Fecha:** 2026-09-21 · **Autora:** Naza · **Estado:** para revisar
**Rama:** `panel-de-la-empresa` · **Mockup:** `docs/panel-interno.html`

---

## 1. El dolor, en una línea

Hoy la empresa se administra mirando tres lugares que no se hablan: la consola de Anthropic para
saber cuánto se gastó, el panel de Railway para saber si un servicio vive, y `GASTOS.md` a mano
para saber cuánto costó cada libro. Y no hay ningún lugar donde ver **si una entrevista se quedó
muda o un libro quedó trabado** — eso se descubre por casualidad, o cuando la familia reclama.

**La frase que lo vende:** *un solo tablero donde ver si algo se frenó, cuánto se gastó y cuánto
quedó.*

## 2. Qué es y qué no es

Es el **panel interno de la empresa** (`/admin`): la trastienda de Naza y Joaquín. **No** es el panel
del cliente — ese ya existe y no se toca (`/tablero`, con las preguntas, las respuestas, las fotos y
el libro).

Lo que el panel **no** hace, por decisión del 21/09:

- **No escribe en la base.** No hay botones para pausar, reintentar, reenviar ni aprobar nada. Se
  mira y se actúa por fuera (una llamada, la puerta manual, el SQL Editor).
  **Única excepción:** cargar un gasto a mano (decisión abierta 5).
- **No avisa.** Ni mail ni WhatsApp: el panel se mira cuando se quiere mirar.
- **No reemplaza la contabilidad.** Es una vista de gestión, no un libro contable.

## 3. Decisiones tomadas (2026-09-21, en orden)

1. **Vive dentro de la web** (`web/`), en la ruta `/admin`, sin ningún link que lleve hasta ahí. La
   entrada está habilitada sólo para los mails de Naza y Joaquín, y **el permiso se chequea en el
   servidor** (no en el navegador).
2. **Sólo lectura**, sin acciones, con la excepción del gasto cargado a mano.
3. **Sin avisos** fuera del panel.
4. **Lo construimos nosotros** (entrevistador + fábrica + web); Joaquín sube la rama.
5. **La estética es la de la marca**: los tokens de `web/src/app/globals.css` (grises, violeta
   `#5D3FD3`, Playfair Display / Archivo / Source Serif 4) y el claro/oscuro que el tablero ya tiene.
   El panel tiene que convivir con la landing, no parecer de otro producto.
6. **Los consumos que entran:** la estructura de cada cliente (entrevista + libro + su voz) y las
   suscripciones del producto (Railway, dominio, mails, Vercel/Supabase cuando se paguen), más otras
   APIs del producto y sus mediciones. **Fuera:** Claude Code, Hermes y cualquier herramienta de
   desarrollo — ese gasto no es de la empresa.
7. **El gasto se anota solo en cada llamada** (una fila por llamada) y **lo que no pasa por una API
   se carga a mano** (una suscripción, una recarga, un gasto raro).
8. **Cada venta muestra país y margen** (lo que pagó menos lo que costó su libro). La cuenta
   destinataria se deduce de la pasarela (Stripe / Mercado Pago); una etiqueta por venta queda para
   cuando haya dos cuentas cobrando.
9. **El mapa de cerebros es en vivo y su función principal es mostrar dónde se frenó**, no
   documentar la arquitectura.
10. **Ganancia limpia = lo que entró − lo que se gastó**, en euros, con el tipo de cambio a la vista.
    Incluye por primera vez **las comisiones de la pasarela** (que hoy no están contadas en ningún
    lado: el 86-89 % de `GASTOS.md` es margen bruto) y muestra aparte **lo ya comprometido** (los
    libros vendidos que todavía no se escribieron).

## 4. Unidad del producto

- **Una historia** = un narrador (una entrevista de 30 preguntas, una por día) con su familia, su
  libro y su voz. Es la fila de la pantalla *Familias*.
- **Un freno** = una condición medible con umbral (silencio del narrador, libro sin arrancar, voz sin
  avanzar, pago sin confirmar, worker sin latido). Es la fila de *Estado* y el color del nodo en
  *Cerebros*.
- **Un cerebro** = un paso del camino de un libro que hace una sola cosa, con su modelo. Los tres
  carriles son las tres etapas: la entrevista (WhatsApp), el libro (la fábrica), su voz (la PC de
  música).
- **Un gasto** = una fila de `consumo_ia` (una llamada) o una fila de `gastos_manuales` (lo que no
  pasa por una API).

## 5. Arquitectura

```
ENTREVISTADOR (Railway)          FÁBRICA (Railway)              VOZ (PC de música)
WhatsApp → transcribir           pedido pagado → estructura     pedido de corte en Storage
→ evaluar → personalizar         → anticipo → capítulos         → ubicar en el audio
→ voz de la pregunta             → editor → PDF + paquete       → cortar, restaurar, emparejar
   │                                 │                             │
   └── anota cada llamada ────────────┴── anota cada llamada ───────┴── 0 USD (GPU propia)
                    ↓                              ↓                        ↓
                ┌───────────── tabla consumo_ia ─────────────┐        latido cada 30 s
                │             tabla latidos                 │
                └───────────────────────┬───────────────────┘
                                        ↓
                        WEB (Vercel) · /admin · sólo lectura
              lee: consumo_ia · latidos · gastos_manuales · pedidos · familias
                   narradores · respuestas · envios · narraciones
```

**Un escritor por tabla, nadie más:**

| Tabla | Escribe | Lee |
|---|---|---|
| `consumo_ia` (nueva) | entrevistador (14 pasos) y fábrica (5 pasos) | `/admin` |
| `latidos` (nueva) | los tres workers | `/admin` |
| `gastos_manuales` (nueva) | `/admin` (única escritura del panel) | `/admin` |

## 6. Contrato de datos

Migración nueva e idempotente, `supabase/migrations/2026092*_panel_empresa.sql`, **la aplica Naza en
el SQL Editor** y se verifica leyendo de vuelta. Se agrega su sección a `supabase/CONTRATO.md`.

### `consumo_ia` — una fila por llamada al modelo

| Columna | Tipo | Nota |
|---|---|---|
| `id` | uuid pk | |
| `fecha` | timestamptz | la hora de la llamada |
| `servicio` | text | `entrevistador` · `fabrica` · `voz` |
| `paso` | text | entrevistador: `transcribir`, `evaluar`, `reserva`, `reemplazo`, `no_tuvo`, `cierre`, `intencion`, `adaptativas`, `personalizar`, `personalizar_viaje`, `resumenes`, `voz_pregunta`, `sugeridas`, `trato` · fábrica: `estructura`, `anticipo`, `preview`, `capitulo`, `editor` |
| `modelo` | text | `claude-opus-5`, `claude-haiku-4-5`, `claude-fable-5`, `gpt-transcribe`, `gpt-4o-mini-tts`, `local` |
| `proveedor` | text | `anthropic` · `openai` · `local` |
| `cuenta` | text | quién paga la key: `naza` · `joaquin` · `local` (decisión abierta 7) |
| `narrador_id` | uuid null | null = no es de un narrador (una medición, una prueba) |
| `input_tokens` `output_tokens` `cache_write` `cache_read` | int | desglosados para poder recalcular si cambian los precios |
| `cantidad` | numeric null | lo que se cobra por unidad: los segundos de audio o los caracteres del texto |
| `unidad` | text null | `segundos` (transcripción) · `caracteres` (TTS) |
| `usd` | numeric(12,6) | lo que costó, con la tabla de precios de `fabrica/src/costos.ts` |

### `latidos` — si el worker está vivo

| Columna | Tipo | Nota |
|---|---|---|
| `servicio` | text pk | `entrevistador` · `fabrica` · `voz` |
| `ultimo_ping` | timestamptz | se pisa en cada vuelta |
| `detalle` | jsonb null | qué está haciendo (para la columna "ahora mismo") |

### `gastos_manuales` — lo que no pasa por una API

| Columna | Tipo | Nota |
|---|---|---|
| `id` | uuid pk | |
| `fecha` | date | |
| `concepto` | text | "Railway", "recarga OpenAI", "mail de empresa" |
| `monto` | numeric(10,2) | |
| `moneda` | text | `EUR` · `USD` · `ARS` |
| `categoria` | text | `suscripcion` · `api` · `imprenta` · `otro` |
| `quien` | text | a quién le corresponde |

### Lo que no se toca

`narradores`, `familias`, `pedidos`, `respuestas`, `envios`, `narraciones` y `fotos` **se leen tal
cual**. No se agregan columnas (salvo lo que decida la decisión abierta 1) y ningún servicio cambia
lo que ya escribe.

## 7. Las cinco pantallas

Cada dato que se muestra, y de dónde sale:

| Pantalla | Pregunta que responde | De dónde lee |
|---|---|---|
| **01 Estado** | ¿se frenó algo y quién me necesita hoy? | los frenos, agrupados por gravedad |
| **02 Familias** | ¿cómo va cada relación con el biógrafo? | `narradores` (estado, `dia_actual`, `ultima_respuesta_at`, `alerta_silencio`), `respuestas`, `envios`, `pedidos`, y `narradores.contexto.preguntasEnviadas` / `repreguntasEnviadas` para la pregunta real que se mandó |
| **03 Plata** | ¿cuánto entró, cuánto se gastó y cuánto quedó? | `pedidos` (monto, moneda, estado, `extras`) + `familias.region` + `consumo_ia` + `gastos_manuales` |
| **04 Gastos** | ¿de dónde sale cada peso que se gastó? | `consumo_ia` (por día, por agente, por modelo) + `gastos_manuales` |
| **05 Cerebros** | ¿qué cerebro trabaja, qué hace y dónde se cortó? | `respuestas.recibido_at`, `envios.enviado_at`, `narraciones.actualizada_at`, `pedidos.estado` y fecha, `latidos`, y el último `consumo_ia` de cada paso |

**Los frenos y sus umbrales** (los que ya existían quedan igual; los nuevos los decide Naza):

| Freno | Umbral | De dónde se mide |
|---|---|---|
| El narrador no contesta | 3 días | `narradores.ultima_respuesta_at` / `alerta_silencio` (ya existe) |
| El libro se quedó en la cola | 24 h | `pedidos.estado = pagado` desde su fecha |
| La voz no avanza | 6 h | `narraciones.actualizada_at` (ya existe: sin avance en 6 h) |
| El pago sin confirmar | 12 h | `pedidos.estado = pendiente` desde su fecha |
| Un worker se cayó | 3 × su intervalo | `latidos.ultimo_ping` |

## 8. Lo que se descarta y lo que queda histórico

- **Queda como está:** `{narrador}/paquete/costos.json` — la fábrica lo sigue escribiendo y sirve
  para recalcular un libro puntual. **El panel no lo lee** (lee `consumo_ia`): recorrer Storage para
  armar el gasto del día no escala y no permite preguntar "cuándo se usó este modelo por última vez".
- **Se descarta:** estimar el costo por cliente con la tabla de `GASTOS.md` (se mide, no se estima);
  las alertas por mail/WhatsApp; las acciones desde el panel; la etiqueta de cuenta destinataria por
  venta.
- **Historial:** los mockups que llevaron hasta éste quedan en `docs/` —
  `panel-interno-mockup.html` (la primera versión, densa), `panel-interno-mockup-simple.html`,
  `panel-interno-estado-variantes.html` (las tres composiciones de la pantalla de entrada) y
  `panel-interno-plata.html`. El que vale es `panel-interno.html`.

## 9. Costos

- **Inteligencia artificial del panel: USD 0.** No le paga a ningún modelo: lee lo que otros ya
  anotaron.
- **Infraestructura: USD 0.** `/admin` es una ruta más de la web, que ya corre en Vercel (plan free);
  Supabase sigue en free.
- **Lo que aparece por primera vez es la comisión de la pasarela**, y cambia el margen que hoy está
  escrito en `GASTOS.md` (calculado, no medido aún en una venta real):

| | Margen sobre 49 € |
|---|---|
| Como está hoy en `GASTOS.md` (bruto, sin comisión) | 88,7 % |
| Con Stripe (~3 %) | **85,7 %** |
| Con Mercado Pago (~4 %) | **84,7 %** |

La IA por cliente no cambia: ~USD 5,80-6,10 por libro digital (medido). `GASTOS.md` suma la línea de
comisiones.

## 10. Fuera de alcance

- Acciones desde el panel (pausar, reintentar, reenviar la pregunta, aprobar el libro).
- Avisos por mail o WhatsApp.
- La imprenta y los marcos con NFC (se cumplen a mano).
- La cuenta destinataria por venta.
- El gasto de Claude Code y Hermes.
- Los escenarios con publicidad de `GASTOS.md` (quedaron viejos con el pago directo).

## 11. Decisiones abiertas

1. **`pedidos` no tiene `updated_at`.** "El pago quedó sin confirmar hace 26 h" sólo se puede medir
   desde `created_at`. *Recomendación: medir desde la creación ahora; agregar la columna si molesta.*
2. **Cada cuánto late cada worker.** Medido: la fábrica cada 60 s (`fabrica/src/worker.ts`,
   `INTERVALO_MS = 60_000`) y la voz cada 30 s (`voz/voz/config.py`, `intervalo_segundos = 30`). El
   del entrevistador no tiene un intervalo fijo que yo haya encontrado (corre por webhook y por su
   scheduler): si su scheduler ya corre por vuelta, late ahí; si no, se le agrega una vuelta propia.
   Umbral de "sin latido": 3 × su intervalo.
3. **Los porcentajes de comisión por pasarela** (Stripe ~3 %, Mercado Pago ~4 %): confirmar y cargar
   a mano.
4. **Quién actualiza el tipo de cambio** (ARS/EUR y USD/EUR) y cada cuánto.
5. **El gasto cargado a mano**: dejarlo (recomendación) o sacarlo y cargarlo por SQL.
6. **Los umbrales de freno** de la tabla de arriba: correrlos o cambiarlos.
7. **`cuenta` en `consumo_ia`**: hoy el entrevistador usa la key de Joaquín y la fábrica la de Naza
   (lección de `GASTOS.md`). La columna deja ver quién pagó qué sin adivinar.

## 12. Cómo se verifica

- **Suites en verde** en los tres paquetes + typecheck, y los tests nuevos de cada tarea.
- **La migración se lee de vuelta** por PostgREST: antes falla con "no existe la tabla", después
  responde `200` con la fila creada.
- **Una llamada real deja una fila**: se corre un paso de verdad (una medición del set dorado sirve)
  y se lee la fila en `consumo_ia` con sus tokens y su USD.
- **El panel no escribe**: hay un test de guardia que falla si aparece cualquier escritura que no sea
  `gastos_manuales`.
- **Los tres workers laten**: se ve el `ultimo_ping` avanzar en los tres, y el nodo se pone rojo
  cuando se lo frena a mano.
- **Los números de la pantalla de plata cierran**: la resta de `consumo_ia` + `gastos_manuales` sobre
  los `pedidos` cobrados y con el tipo de cambio guardado.

## 13. Qué sigue

1. Naza lee este spec y lo corrige (sobre todo las decisiones abiertas).
2. Con el OK: plan en `docs/superpowers/plans/2026-09-21-panel-de-la-empresa.md`, con las tareas
   chicas y con test primero, y los entregables que no son código: el mensaje para Joaquín (la rama,
   archivo por archivo, la migración que aplica Naza y qué sube él) y el texto de la directiva al
   buzón para la PC de música (el latido de la voz).

**Nota de alcance:** el trabajo toca cuatro lugares (la migración, el entrevistador, la fábrica y la
web). Conviene que el plan salga en **dos partes**: (a) la instrumentación —migración + el anotador
en el entrevistador + el latido en los tres— y (b) el panel en la web. La primera no se ve y se mide
con tests; la segunda es la que Naza mira. Así la segunda no espera a que esté todo lo invisible.
