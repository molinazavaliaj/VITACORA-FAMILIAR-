# Audiolibro con la voz clonada del narrador — diseño

Fecha: 2026-09-16. Aprobado por Naza parte por parte (en llamada con Joaquín) en la sesión
de brainstorming. Es la mitad "voz clonada" de ROADMAP 3t.14; el resto de esa fila (producir
solo lo comprado, "narrador" con TTS fijo, contratapa/marco/HTML paginado) queda para specs
aparte — ver "Fuera de alcance".

## Decisiones de producto (Naza + Joaquín, 16/09)

- **Motor abierto, en hardware propio.** Nada de ElevenLabs. El modelo corre en la **PC de
  música de Naza** (Ryzen 9 5900X, 32 GB, **RTX 4060 Ti**). Diseñado para que el mismo
  programa pueda correr en una GPU alquilada si hiciera falta: cambia dónde corre, no qué hace.
- **Comunicación por buzón, no por llamada.** La fábrica (Railway) y la PC se hablan **solo por
  Supabase**, como todo el proyecto: una tabla `narraciones` que la PC sondea. Sin puertos
  abiertos ni túneles. PC apagada = la cola espera.
- **Piso de 10 minutos de voz limpia.** Si el narrador no tiene 10 minutos de audio utilizable,
  la voz **no se clona**: la narración queda `fallida` con motivo y se avisa por mail.
- **Permiso del narrador, no del comprador.** La voz es dato biométrico (lo dice nuestra
  política de privacidad). El permiso va **dentro del primer mensaje** de bienvenida del
  entrevistador (el mismo SÍ con el que acepta participar; el texto menciona explícitamente que
  el audiolibro puede llevar su voz hecha a partir de sus audios). Se guarda con fecha en
  `narradores.consentimiento_voz_at`. **Sin fecha, no se clona.** Más adelante lo reemplaza un
  link tipo formulario con el texto completo.
- **El motor se elige con una prueba de oído a ciegas** (A/B/C) con los audios reales de Joaquín
  (narrador del piloto), antes de escribir el worker definitivo.
- **La intro de cada capítulo** ("Capítulo 3: El amor") sigue con la voz del entrevistador
  (OpenAI TTS, como hoy). El cuerpo del capítulo va con la voz clonada.

## Arquitectura

```
web (Vercel) ──crea pedido extras.audiolibro="clonada"──▶ Supabase ◀── entrevistador (Railway)
                                                            ▲  ▲          escribe consentimiento_voz_at
fábrica (Railway) ── inserta narración `pendiente`; ────────┘  │
                     pedido → `esperando_voz`                   │
                  ◀─ ve narración `lista`, arma audiolibro,     │
                     pedido → `entregado`, mail                 │
                                                                │
worker voz (PC de Naza, GPU) ── sondea `narraciones` cada 30 s ─┘
   toma `pendiente` → `procesando` → sube mp3 por capítulo → `lista` | `fallida`
```

Tres procesos, un solo escritor por columna. Ningún proceso llama a otro.

## Contrato en Supabase (migración nueva + `supabase/CONTRATO.md`)

```sql
create table narraciones (
  id uuid primary key default gen_random_uuid(),
  narrador_id uuid not null references narradores (id),
  pedido_id uuid not null references pedidos (id),
  estado text not null default 'pendiente'
    check (estado in ('pendiente','procesando','lista','fallida')),
  motor text,                         -- el worker anota cuál usó (p. ej. 'f5-tts-es-ft', 'chatterbox-ml')
  muestras jsonb,                     -- qué respuestas usó y cuántos segundos limpios juntó
  capitulos_paths jsonb,              -- ["{narrador}/voz/cap_01.mp3", ...] en orden de la estructura
  error text,
  tomada_at timestamptz,              -- cuándo pasó a procesando (para detectar cuelgues)
  created_at timestamptz not null default now(),
  actualizada_at timestamptz not null default now()
);
alter table narradores add column consentimiento_voz_at timestamptz;
-- pedidos.estado suma 'esperando_voz' al check existente.
```

Quién escribe qué:

| Columna / tabla | Escribe | Lee |
|---|---|---|
| `narraciones` fila nueva (`pendiente`) | fábrica | worker voz |
| `narraciones.estado/motor/muestras/capitulos_paths/error/tomada_at` | worker voz | fábrica |
| `narradores.consentimiento_voz_at` | entrevistador (3t.15) — en el piloto, `npm run manual -- ficha <narrador> --voz-si` | worker voz |
| `pedidos.estado = 'esperando_voz'` / `'entregado'`, `audiolibro_paths` | fábrica | web |
| Storage `{narrador}/voz/cap_NN.mp3` (cuerpo narrado, sin intro) | worker voz | fábrica |
| Storage `{narrador}/paquete/audiolibro_cap_NN.mp3`, `audiolibro_completo.mp3` | fábrica | web |

## El worker de voz (`voz/`, Python, en la PC)

Carpeta nueva del monorepo: `voz/` (Python 3.11, PyTorch CUDA, ffmpeg). Un solo proceso,
`python -m voz.worker`, que:

1. Cada 30 s: `select * from narraciones where estado='pendiente' order by created_at limit 1`.
   La toma con un update condicional (`where estado='pendiente'`) → `procesando`, `tomada_at`.
2. **Permiso**: si `narradores.consentimiento_voz_at` es null → `fallida`, error
   `sin_consentimiento_voz`. Fin.
3. **Muestras** (`voz/muestras.py`, función pura sobre la lista de respuestas + ffmpeg):
   - Candidatas: `respuestas` del narrador con `audio_path` y `duracion_segundos >= 20`.
   - Orden: duración descendente. Descargar, convertir a wav mono 24 kHz, `silenceremove` de
     bordes, `loudnorm` a -19 LUFS, descartar clips con SNR estimado bajo (ruido de fondo:
     energía en silencios vs. en voz).
   - Acumular hasta **15 min**; si el total limpio es **< 10 min** → `fallida`, error
     `faltan_minutos_de_voz: NNN s`. Anotar en `muestras` qué respuestas y cuántos segundos.
   - Para motores zero-shot, además elegir **la referencia**: el clip de 15-30 s con mejor SNR.
   - Para el motor afinado: partir los 10-15 min en trozos de 5-15 s alineados con texto
     (faster-whisper en la GPU para los timestamps; la transcripción ya existe por respuesta pero
     no por trozo).
4. **Texto** (`voz/texto.py`, pura): el libro final es el HTML que publica la fábrica
   (`{narrador}/paquete/libro.html`) → por capítulo, texto plano del cuerpo (sin título, sin
   epígrafes de fotos, sin "frases de siempre" si son lista) → frases de ≤ 220 caracteres
   (cortar por `.?!;` y, si aún es largo, por `,`), agrupadas en párrafos.
5. **Narración** (`voz/motor/*.py`, una clase por motor, misma interfaz):
   `preparar(muestras) -> Voz` y `narrar(frase, voz) -> wav`. Frase por frase; pausa 350 ms entre
   frases, 800 ms entre párrafos; `loudnorm`; mp3 128 kbps mono por capítulo. **Cada capítulo
   terminado se sube en el acto** y se anota en `capitulos_paths`: si se corta a mitad, al
   reanudar (`procesando` con `tomada_at` viejo → el propio worker la retoma) sigue desde el
   primer capítulo que falta, no desde cero.
6. Al terminar todos: `lista`. Cualquier excepción: `fallida` con el error y el traceback
   resumido; el worker sigue con la siguiente.

Log en `voz/logs/worker.log` en castellano llano: "esperando…", "narrando a Roberto, capítulo 4
de 8", "listo: 8 capítulos, 47 min". Configuración en `voz/.env` (Naza la carga a mano):
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `MOTOR`, `CARPETA_MODELOS` (en el disco con
espacio).

## Prueba de oído (antes del worker)

`voz/prueba_oido.py`: con el narrador "Joaquin" del piloto, toma las muestras según el paso 3 y
narra **el mismo párrafo** (unas 6-8 frases de su libro, o de una respuesta transcrita si el
libro aún no existe) con los tres motores candidatos:

| Clave | Motor | Tipo | Licencia |
|---|---|---|---|
| A/B/C (barajado) | Chatterbox Multilingual (Resemble) | zero-shot, referencia 15-30 s | MIT |
| A/B/C | Qwen3-TTS (Alibaba) | zero-shot, referencia corta | Apache 2.0 |
| A/B/C | F5-TTS con checkpoint en español, **afinado** con los 10-15 min | fine-tune por narrador (~30-60 min en la 4060 Ti) | MIT |

Salida: `voz/prueba/A.mp3`, `B.mp3`, `C.mp3` + `clave.txt` (que no se abre hasta elegir). Eligen
Naza y Joaquín escuchando. XTTS-v2 queda fuera por licencia no comercial. El ganador se
fija en `MOTOR`; los otros dos se mantienen instalables pero no se usan.

## La fábrica (`fabrica/`, TypeScript)

- `generarPaquete`: lee `pedidos.extras` con la misma regla que la web (`productosDelPedido`:
  pedidos viejos = `pdf: true, audiolibro: "real"`). Si `audiolibro === "clonada"`:
  inserta la narración `pendiente`, genera el PDF/HTML como hoy, y deja el pedido en
  `esperando_voz` (no `entregado`, no mail de libro listo). Cualquier otro valor: como hoy.
- Tick nuevo en `worker.ts`: narraciones `lista` cuyo pedido está `esperando_voz` → descarga
  `capitulos_paths`, genera la intro TTS de cada capítulo (como `generarAudiolibro` hoy), pega
  intro + cuerpo, produce `audiolibro_cap_NN.mp3` y `audiolibro_completo.mp3`, escribe
  `audiolibro_paths`, pedido → `entregado`, mail `libro_listo`.
- Avisos a `hola@` (mail existente de la fábrica): narración `pendiente` > 24 h (PC apagada),
  `procesando` > 6 h (colgada), o `fallida` (con el error). Un mail por narración y motivo.
- Reintento: comando `npm run narracion -- reintentar <id>` en la fábrica pone `pendiente`.

## El entrevistador (`entrevistador/`, Joaquín — 3t.15)

- Texto de bienvenida: una frase que diga que, si la familia lo pide, el audiolibro puede tener
  su propia voz hecha a partir de estos audios, y que el SÍ incluye eso.
- Al pasar a `acepto`, escribir también `consentimiento_voz_at = now()`.
- Piloto manual: `npm run manual -- ficha <narrador> --voz-si` carga la fecha a mano.

## La PC de música (una sola vez)

1. Sesión aparte de limpieza y orden del disco (nunca se toca nada de música: `.flp`, samples,
   audios, proyectos; nada se borra sin que Naza vea la lista; revisar el disco "que no corre").
2. Drivers NVIDIA al día, Python 3.11, ffmpeg. Carpeta propia (`C:\vitacora-voz` o en el disco
   con espacio) con el venv, el código (`voz/`) y `CARPETA_MODELOS`.
3. Tarea programada de Windows al iniciar sesión que corre el worker y escribe el log.
4. Naza carga `voz/.env` con la clave de Supabase (Claude no la maneja).

## Fallos y qué ve cada uno

- **PC apagada**: la fila espera; a las 24 h, mail a `hola@`. El panel de la familia muestra el
  audiolibro "en producción": la web trata `esperando_voz` igual que `pagado` (un caso más en
  `web/src/lib/pedido-a-mostrar.ts`; es el único toque a la web).
- **Faltan minutos / sin permiso / error del motor**: `fallida` + mail con el motivo. Decisión a
  mano: reintentar, cambiar a narrador, o devolver.
- **Corte a mitad**: reanuda desde el capítulo que falta.
- **Nunca** se produce un audiolibro clonado sin `consentimiento_voz_at`.

## Pruebas

- `voz/`: pytest sobre las funciones puras — selección de muestras (piso de 10 min, orden,
  descarte por SNR), partición de texto (límite de 220, no corta dentro de una palabra, respeta
  párrafos), reanudación (capítulos ya subidos no se regeneran), permiso (sin fecha → fallida).
- `fabrica/`: vitest sobre la lectura de `extras`, la creación de la narración, el tick de
  ensamblado y los avisos (mocks de Supabase como en `web/test`).
- Punta a punta: el libro de Joaquín — compra `clonada` → PC narra → panel reproduce.

## Orden de trabajo

1. Sesión en la PC de música (limpieza + base).
2. Prueba de oído → elegir motor.
3. Worker de voz (tabla, permiso, muestras, narración, reanudación).
4. Fábrica (crear narración, ensamblar, avisos) + CONTRATO + migración.
5. Entrevistador (Joaquín): bienvenida + `consentimiento_voz_at`.
6. Prueba completa con Joaquín.

## Fuera de alcance (specs aparte)

- Producir solo lo comprado (`pdf: false`, `audiolibro: null`) y el audiolibro **"narrador"**
  (TTS de voz fija leyendo el libro entero).
- Contratapa, marco y HTML paginado (con 3b.4/3b.5 y 3.8).
- Correr el worker en GPU alquilada (mismo código; solo cambia dónde).
