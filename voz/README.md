# `voz/` — la voz clonada del narrador

El worker que corre en la PC de música de Naza (GPU) y narra el libro con la voz
del narrador. Diseño: `docs/superpowers/specs/2026-09-16-voz-clonada-design.md`.
Plan de esta primera entrega (la prueba de oído):
`docs/superpowers/plans/2026-09-16-voz-prueba-de-oido.md`.

**Estado (18/09/2026):** motor elegido con Joaquín en la prueba de oído del 16/09:
**`MOTOR=qwen3tts`** (Qwen3-TTS 1.7B; ~2,4× tiempo real en la 4060 Ti: un audiolibro
de 90 min ≈ 3,5 h de GPU). La PC ya lo tiene en `.env` y el worker arranca; falta
aplicar la migración `narraciones` (después del OK de Joaquín) y registrar la tarea
programada. Notas de la prueba: F5-TTS salió al doble de velocidad porque recorta la
referencia a 12 s y se queda con la transcripción de 21 s (si se le quiere dar otra
chance: referencia ≤ 12 s con su transcripción exacta). En esa PC, torchcodec
necesita las DLL de FFmpeg (build *shared*), agregadas al final del PATH de usuario
en `C:\vitacora-voz\ffmpeg-shared\`.

**Después del primer libro (19/09/2026):** dos cosas que se escucharon y se corrigieron.
(1) La referencia manda más que el motor: con la del día 23 (la respuesta más larga)
el libro sonó peor que con la del día 02; ahora `muestras.py` elige la referencia por
**riqueza fonética del arranque** ("ll/y" = el "sh" rioplatense, voseo, ñ, rr,
preguntas; puntos por cada 100 caracteres de los primeros ~300, que es lo que entra
en el clip de 25 s) entre todas las respuestas con audio de ≥ 30 s, y `muestras.json`
registra `criterio`, `riqueza_fonetica` y el `ranking_referencia` para ver por qué
ganó la que ganó. (2) Los "ruidos raros" al terminar cada frase: los motores siguen
emitiendo hasta el último instante y el pegado cortaba eso en seco contra silencio
digital; ahora `motores/comun.py` limpia cada frase antes de pegar (recorta la cola
por envolvente, fade in 12 ms / out 60 ms, y empareja el volumen a −20 dB RMS —
antes variaba hasta 5 dB entre frases). Pendiente de escuchar: subir el corte de
220 caracteres en `voz/texto.py` a 400-500 (menos uniones, menos artefactos).

## Qué hay

| Archivo | Para qué |
|---|---|
| `voz/muestras.py` | Elegir qué respuestas del narrador se usan (las más largas, hasta 15 min; piso 10 min) y cuál es la referencia (una entera de 12-30 s, o el arranque de 25 s de la respuesta fonéticamente más rica). Puro. |
| `voz/texto.py` | Partir el texto en tramos de ≤ 220 caracteres sin romper palabras, cada uno con el signo que lo cerró (`Tramo.cierre`). Puro. |
| `voz/pausas.py` | `PAUSAS_MS`, las pausas por signo en un solo lugar (Naza las pisa desde `.env`), y el separador `* * *` entre historias. Puro. |
| `voz/masterizar.py` | El último paso antes de subir cada `cap_NN.mp3`: las piezas reales pasan por restaurar + ritmo; después limpieza por pieza, EQ al sonido real del narrador, pegado con pausas, loudnorm −19 LUFS en dos pasadas, `master.json` con medidas y avisos. También CLI. |
| `voz/restaurar.py` | Directiva 02 A: cada original de WhatsApp pasa por resemble-enhance (denoise + enhance a 44,1 kHz) en su venv (`herramientas/restaurar/`). `RESTAURACION_NIVEL` 0..1 en `.env`. Mide ruido en pausas, SNR y ancho de banda antes/después. |
| `voz/ritmo.py` | Directiva 02 B: con marcas por palabra de Whisper corta el arranque que responde a la pregunta (`ARRANQUES_A_CORTAR`, < 2,5 s) y lleva los silencios internos de > 1,5 s a 0,7 s. Nunca corta voz. Puro. |
| `voz/transcribir.py` | Whisper de OpenAI: transcribir un clip, y `palabras_con_tiempos` para el ritmo. |
| `voz/audio.py` | ffmpeg: limpiar (mono 24 kHz, sin silencios en los bordes, volumen parejo), recortar en una pausa, pegar con pausas, mp3. |
| `voz/preparar_muestras.py` | Paso 1: baja los audios de Supabase y deja `referencia.wav`, `referencia.txt`, `texto.txt`, `limpias/`. |
| `voz/prueba_oido.py` | Paso 2: corre cada motor en su venv y deja `A.mp3 … D.mp3` + `clave.txt`. |
| `voz/buzon.py` | El buzón `narraciones`: tomar la pendiente más vieja, liberar colgadas, marcar cómo fue. |
| `voz/libro.py` | Leer `narracion.json` (los capítulos numerados 1..N). Puro. |
| `voz/narrar.py` | Preparar la voz del narrador y narrar capítulo por capítulo con checkpoint en la fila. |
| `voz/worker.py` | El bucle: `python -m voz.worker` sondea el buzón y narra de a una. Log en `logs/worker.log`. |
| `voz/reintentar.py` | `python -m voz.reintentar <id>`: vuelve una narración fallida a pendiente. |
| `motores/<motor>/generar.py` | Un motor por carpeta, con su propio `requirements.txt` y su propio venv. Todos con el mismo contrato. |
| `motores/comun.py` | Lo que comparten los motores (argumentos, bucle tramo a tramo, limpieza por frase, pegado con la pausa de cada signo, wav). |

## Pausas y masterizado (central 19/09, directiva 01)

**El motor no decide las pausas.** `texto.partir_en_tramos` corta por puntuación
y se acuerda de qué signo cerró cada tramo; `comun.pegar_tramos` pone el silencio
de ese signo, siempre el mismo. Los valores viven en `voz/pausas.py` y Naza los
pisa desde `.env` sin tocar código:

| signo | pausa | `.env` |
|---|---|---|
| `,` `;` `:` | 250 ms | `PAUSAS_MS=coma=250,…` |
| `.` `?` `!` | 500 ms | `punto=500` |
| `…` | 700 ms | `suspensivos=700` |
| fin de párrafo | 1 s | `parrafo=1000` |
| `* * *` (entre historias, tras el anuncio del capítulo) | 1,2 s | `historia=1200` |

Dos modos de corte, `TRAMOS=oracion` (default) o `TRAMOS=coma`. Se probaron los
dos sobre el capítulo 6 de Joaquín (19/09): en modo **oración** el motor recibe
la oración entera (35 tramos), pausa en las comas que le parecen (19 de 40) y
esas pausas se igualan a 250 ms exactos; en modo **coma** todas las comas pausan
(75 tramos) pero aparecen 18 tramos de una o dos palabras ("No,", "Es,",
"bueno,"), que es donde un motor zero-shot más inventa, y la voz dura 12 % más.
Quedó **oración**; el otro modo sigue disponible por si Naza lo prefiere al oído.

**Restaurar y ritmo, primero** (directiva 02, 19/09): las notas de WhatsApp son
Opus a ~16 kbps (nada por encima de ~8-9 kHz, mic de celular, ambiente) y
`highpass + afftdn` no alcanzaba: "suena a WhatsApp". Cada pieza **real** pasa,
antes de todo lo demás, por (A) `voz/restaurar.py` — resemble-enhance en su
propio venv `herramientas/restaurar/.venv` (instalación: torch cu126, después
`resemble-enhance --no-deps` y sus dependencias de inferencia; deepspeed no
compila en Windows y solo sirve para entrenar, hay un stub; `numpy<2`) —
graduado con `RESTAURACION_NIVEL` (0..1 en `.env`, default 0,7: al 100 % Naza
oyó la voz "temblar"; nfe 64 y tau 0,3 en el corredor por lo mismo); y (B)
`voz/ritmo.py` con marcas por palabra de Whisper: corta el arranque que
responde a la pregunta ("Sí, exacto,", "No,", "Bueno,") hasta la primera coma o
punto si dura < 2,5 s desde la primera palabra (`ARRANQUES_A_CORTAR`, editable),
y lleva los silencios internos de más de 1,5 s a 0,7 s, con fades; nunca corta
voz. Medido en el cap 2 de Joaquín: ruido en pausas −41…−57 → −51…−66 dBFS,
ancho de banda 8,4-9,5 → 10,7-12,1 kHz, 41 s menos de capítulo por arranques y
silencios. Los conectores se igualan a los originales ya restaurados.

**Masterizar** (`voz/masterizar.py`) corre en el worker sobre cada capítulo antes
del mp3, igual para clonado, real e híbrido: cada pieza se limpia (pasa-altos
80 Hz, afftdn suave, silencios de las puntas), se iguala por bandas de octava al
sonido **real** del narrador (las muestras limpias; en un híbrido, las piezas
reales — nunca el promedio con los conectores, que arrastraría la voz real hacia
lo sintético), se nivela, se pega con la pausa `historia`, se limita a −3,5 dB y
se normaliza con `loudnorm` en dos pasadas a −19 LUFS / TP −1,5 / LRA 7 (queda en
modo lineal: solo ganancia, sin compresión). `master.json` va al lado de los mp3
(`{narrador}/voz/master.json`) con nivel, pico y ruido de cada pieza antes y
después, el loudnorm del capítulo y avisos si algo queda fuera de rango. La
fábrica ya no normaliza: solo pega.

```powershell
.\.venv\Scripts\python -m voz.masterizar --capitulo 2 --salida cap_02.wav --master master.json `
  --piezas c0.wav:conector dia_05.ogg:real c1.wav:conector … [--objetivo muestras\limpias\*.wav]
```

Motores: `chatterbox` (Chatterbox Multilingual, MIT) · `qwen3tts` (Qwen3-TTS 1.7B,
Apache 2.0) · `f5tts` (F5-TTS con checkpoint en español, MIT) · `omnivoice`
(OmniVoice de k2-fsa, Apache 2.0). XTTS-v2 no: licencia no comercial.

## Instalar en la PC de música (una vez)

Requisitos ya verificados en esa PC: Python 3.11, ffmpeg en el PATH, driver
NVIDIA al día. Todo queda en `C:\vitacora-voz\` y los modelos en
`D:\vitacora-modelos\`.

```powershell
cd C:\vitacora-voz
git clone https://github.com/molinazavaliaj/VITACORA-FAMILIAR-.git repo
cd repo\voz

# 1. El venv base (sin motores: liviano)
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt

# 2. Las credenciales — las carga Naza a mano, nunca se commitean
copy .env.ejemplo .env
notepad .env      # SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY, CARPETA_MODELOS=D:\vitacora-modelos, CARPETA_TRABAJO=C:\vitacora-voz\prueba

# 3. Un venv por motor (cada uno baja su torch con CUDA; son varios GB, en C:)
foreach ($m in "chatterbox","qwen3tts","f5tts","omnivoice") {
  python -m venv motores\$m\.venv
  & "motores\$m\.venv\Scripts\pip" install -r motores\$m\requirements.txt
}
```

Si un motor no se deja instalar, no frena a los otros: la prueba se corre con
los que hay (`--motores chatterbox,omnivoice`, por ejemplo) y el que falló se
anota con el error.

## Correr la prueba de oído

```powershell
cd C:\vitacora-voz\repo\voz
.\.venv\Scripts\python -m voz.preparar_muestras --narrador Joaquin
```
Deja en `C:\vitacora-voz\prueba\muestras\`: las muestras limpias, la referencia
(`referencia.wav` + `referencia.txt`) y el párrafo a narrar (`texto.txt`, se
puede editar). Con Joaquín (16/09): 4 muestras, 886 s limpios, referencia de 21 s.

```powershell
.\.venv\Scripts\python -m voz.prueba_oido
```
La primera vez baja los pesos de cada modelo a `D:\vitacora-modelos` (varios GB,
tarda). Deja en `C:\vitacora-voz\prueba\`: `A.mp3`, `B.mp3`, `C.mp3`, `D.mp3` y
`clave.txt`. **Escuchen A-D con Joaquín y elijan sin abrir `clave.txt`.** Los
logs de cada motor quedan en `prueba\crudo\<motor>.log`.

## El worker

Cuando el motor esté elegido:

```powershell
cd C:\vitacora-voz\repo\voz
git pull

# 1. Solo el venv del motor ganador (los otros tres se pueden borrar)
python -m venv motores\<motor>\.venv
& "motores\<motor>\.venv\Scripts\pip" install -r motores\<motor>\requirements.txt

# 2. En .env: MOTOR=<motor> (chatterbox | qwen3tts | f5tts | omnivoice) e INTERVALO_SEGUNDOS=30
notepad .env
```
`OPENAI_API_KEY` hace falta solo si el narrador no tiene ninguna respuesta
entera de 12-30 s: ahí se recorta una y se transcribe con Whisper.

Primero a mano, para verlo andar:

```powershell
.\.venv\Scripts\python -m voz.worker
```
Sondea `narraciones` cada 30 s; cuando toma una, dice a quién narra y por qué
capítulo va. Todo queda en `logs\worker.log` (rota a 5 MB, guarda 3). Ctrl+C
lo apaga limpio; una narración a medias vuelve a `pendiente` sola a las 6 h sin
avance (sin subir ningún capítulo) y al retomarla se saltean los que ya estaban.

Después, la tarea programada (PowerShell como administrador): arranca al
iniciar sesión, se reinicia sola si se cae y no tiene límite de tiempo.

```powershell
Register-ScheduledTask -TaskName 'VitacoraVoz' -Trigger (New-ScheduledTaskTrigger -AtLogOn) `
  -Action (New-ScheduledTaskAction -Execute 'C:\vitacora-voz\repo\voz\.venv\Scripts\python.exe' -Argument '-m voz.worker' -WorkingDirectory 'C:\vitacora-voz\repo\voz') `
  -Settings (New-ScheduledTaskSettingsSet -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero))
```
Para arrancarla ya, sin cerrar sesión: `Start-ScheduledTask -TaskName VitacoraVoz`.
Para pararla del todo: `Unregister-ScheduledTask -TaskName VitacoraVoz`.

Si una narración quedó `fallida` (en la fila está el motivo: `error`) y ya se
arregló la causa:

```powershell
.\.venv\Scripts\python -m voz.reintentar <id de la narración>
```
Solo acepta una `fallida`; la vuelve a `pendiente` y borra el candado del aviso
para que, si falla otra vez, la fábrica avise de nuevo.

## Tests (en cualquier máquina con ffmpeg)

```powershell
.\.venv\Scripts\python -m pytest -q
```
Prueban lo puro (selección, texto, barajado, el buzón, el libro), ffmpeg con audio
sintético, y la prueba de oído y el worker completos con un motor falso. Los cuatro motores reales solo se
prueban en la PC con GPU.

## Reglas de la casa

- Nada de música se toca. El worker vive en `C:\vitacora-voz\` y `D:\vitacora-modelos\`.
- Sin puertos ni túneles: la PC siempre va a buscar a Supabase, nunca recibe.
- Sin 10 minutos limpios de voz no se clona; sin `consentimiento_voz_at` no se clona (eso lo aplica el worker, no la prueba).

## Buzón entre la central y esta PC (19/09)

No se copian mensajes a mano. En el bucket privado `audios`:

- `central/<fecha>-<nn>-<tema>.md` — directivas de la central para esta PC. Al
  leer una, subir `central/<mismo-nombre>.leido.txt` (vacío) como acuse.
- `pruebas/<fecha>/…` — lo que esta PC entrega: parches (`git format-patch`),
  muestras mp3, `notas.txt` con lo medido.

Naza le dice al Claude de esta PC "leé el buzón" y eso alcanza. Tope 50 MB por
archivo.

