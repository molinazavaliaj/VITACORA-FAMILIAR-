# `voz/` — el worker de «Su voz»

El worker que corre en la PC de música de Naza (GPU) y corta las frases de
**«Su voz»**: el libro trae códigos QR que llevan a fragmentos del audio REAL
del narrador, y este worker es el que corta esos fragmentos de sus respuestas
de WhatsApp, los restaura y los sube.

**16/10/2026: se sacó el audiolibro con voz clonada.** Se había descartado el
20-21/09 («Su voz» lo reemplazó) y desde que la fábrica dejó de pedir
narraciones nadie escribía en la tabla `narraciones`, pero el worker la seguía
mirando y no arrancaba sin `MOTOR` en `.env`. Ahora solo hace frases y latido;
**`MOTOR` ya no hace falta** (si quedó en el `.env` no molesta). Se fueron los
motores (`motores/`), la prueba de oído, la narración por capítulos y
`python -m voz.reintentar`. Todo eso queda en la historia de git. La tabla
`narraciones` sigue en Supabase sin uso (se puede borrar más adelante).

## Qué hace

Cada vuelta del bucle (`python -m voz.worker`):

1. **Late**: pisa la fila `servicio = 'voz'` de la tabla `latidos`. El panel
   de admin y la fábrica la miran para saber si la PC está viva.
2. **Corta las frases pedidas**: por cada narrador con
   `{narrador}/paquete/frases_pedido.txt` en el bucket `audios`, baja
   `frases.json` y, por cada frase pendiente, baja el audio de su respuesta, lo
   escucha con Whisper (palabras con su minuto), ubica la frase, corta el tramo
   con un poco de aire, lo restaura con resemble-enhance, lo deja a −19 LUFS y
   sube `{narrador}/voz/frases/{id}.mp3`. Si la frase no aparece en el audio,
   queda `fallida` (el libro la imprime sin QR); si falla algo pasajero (red,
   Whisper), queda pendiente y se reintenta en la vuelta siguiente.
3. Si no hubo nada, duerme `INTERVALO_SEGUNDOS` (30 por defecto).

Nada de esto tumba el bucle: un error se anota en `logs\worker.log` y se sigue.

## Qué hay

| Archivo | Para qué |
|---|---|
| `voz/worker.py` | El bucle: late y atiende los pedidos de frases. Log en `logs/worker.log` (rota a 5 MB, guarda 3). |
| `voz/buzon.py` | El latido (`latidos`, servicio `voz`). |
| `voz/cortar_frases.py` | El contrato con la fábrica: qué frases faltan, cómo se anotan cortada o fallida. Puro. |
| `voz/procesar_frases.py` | El corte en sí: del pedido en Storage al mp3 de cada frase. |
| `voz/frases.py` | Ubicar la frase entre las palabras de Whisper y calcular el aire del recorte. Puro. |
| `voz/transcribir.py` | Whisper de OpenAI: `palabras_con_tiempos`. |
| `voz/restaurar.py` | Pasar el tramo por resemble-enhance (denoise + enhance a 44,1 kHz) en su venv (`herramientas/restaurar/`). `RESTAURACION_NIVEL` 0..1 en `.env`. |
| `voz/masterizar.py` | La cadena de audio de cada frase: leer, limpiar, nivelar, limitar picos y loudnorm −19 LUFS en dos pasadas. |
| `voz/audio.py` | Pasar a mp3 (ffmpeg). |
| `voz/subir.py` | Subir a Storage con reintentos. |
| `voz/supabase_cliente.py` | Lo que se lee de Supabase: las respuestas del narrador y sus audios. |
| `voz/muestras.py` | El tipo `Respuesta`. |
| `voz/config.py` | El `.env`. |

## Instalar en la PC de música (una vez)

Requisitos: Python 3.11, **ffmpeg en el PATH**, driver NVIDIA al día. Todo
queda en `C:\vitacora-voz\` y los pesos del modelo en `D:\vitacora-modelos\`.

```powershell
cd C:\vitacora-voz
git clone https://github.com/molinazavaliaj/VITACORA-FAMILIAR-.git repo
cd repo\voz

# 1. El venv del worker (liviano)
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt

# 2. El venv de la restauración (trae su torch con CUDA; varios GB)
python -m venv herramientas\restaurar\.venv
.\herramientas\restaurar\.venv\Scripts\pip install -r herramientas\restaurar\requirements.txt

# 3. Las credenciales — las carga Naza a mano, nunca se commitean
copy .env.ejemplo .env
notepad .env
```

En `.env`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY` (Whisper,
la misma clave del entrevistador), `INTERVALO_SEGUNDOS=30`,
`CARPETA_TRABAJO=C:\vitacora-voz\prueba` y `CARPETA_MODELOS=D:\vitacora-modelos`.
`MOTOR` ya no hace falta.

Notas de la restauración: deepspeed no compila en Windows y solo sirve para
entrenar (hay un stub); resemble-enhance necesita `numpy<2`.
`RESTAURACION_NIVEL=0` la apaga (no hace falta el venv ni torch).

## El worker

Primero a mano, para verlo andar:

```powershell
.\.venv\Scripts\python -m voz.worker
```

Tiene que decir `worker arriba (frases de «Su voz»)`. Ctrl+C lo apaga limpio.

Después, la tarea programada (PowerShell como administrador): arranca al
iniciar sesión, se reinicia sola si se cae y no tiene límite de tiempo.

```powershell
Register-ScheduledTask -TaskName 'VitacoraVoz' -Trigger (New-ScheduledTaskTrigger -AtLogOn) `
  -Action (New-ScheduledTaskAction -Execute 'C:\vitacora-voz\repo\voz\.venv\Scripts\python.exe' -Argument '-m voz.worker' -WorkingDirectory 'C:\vitacora-voz\repo\voz') `
  -Settings (New-ScheduledTaskSettingsSet -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero))
```

Para arrancarla ya, sin cerrar sesión: `Start-ScheduledTask -TaskName VitacoraVoz`.
Para pararla del todo: `Unregister-ScheduledTask -TaskName VitacoraVoz`.

## Actualizar la PC

Cuando cambia algo de `voz/` en `main`, en la PC de música (PowerShell), de a
una línea:

```powershell
git -C C:\vitacora-voz\repo status
git -C C:\vitacora-voz\repo pull
Stop-ScheduledTask -TaskName VitacoraVoz
Start-ScheduledTask -TaskName VitacoraVoz
```

El primer comando es para mirar antes: tiene que decir que está en `main` y sin
cambios propios. Si la carpeta o el remoto de esa PC son otros (o hay archivos
cambiados a mano), parar y revisarlo antes del `pull`. Después de arrancar, en
`C:\vitacora-voz\repo\voz\logs\worker.log` tiene que aparecer
`worker arriba (frases de «Su voz»)`. Si `Stop-ScheduledTask` pide permisos, abrir
PowerShell como administrador.

Las carpetas `motores\` que hayan quedado en esa PC (con sus venvs de varios
GB) ya no se usan: se pueden borrar a mano cuando se quiera.

## Tests (en cualquier máquina con ffmpeg)

```powershell
.\.venv\Scripts\python -m pytest -q
```

Prueban lo puro (las frases, el contrato), ffmpeg con audio sintético y el
worker completo con un Supabase falso. La restauración real solo se prueba en
la PC con GPU.

## Reglas de la casa

- Nada de música se toca. El worker vive en `C:\vitacora-voz\` y `D:\vitacora-modelos\`.
- Sin puertos ni túneles: la PC siempre va a buscar a Supabase, nunca recibe.

## Buzón entre la central y esta PC (19/09)

No se copian mensajes a mano. En el bucket privado `audios`:

- `central/<fecha>-<nn>-<tema>.md` — directivas de la central para esta PC. Al
  leer una, subir `central/<mismo-nombre>.leido.txt` (vacío) como acuse.
- `pruebas/<fecha>/…` — lo que esta PC entrega: parches (`git format-patch`),
  muestras mp3, `notas.txt` con lo medido.

Naza le dice al Claude de esta PC "leé el buzón" y eso alcanza. Tope 50 MB por
archivo.
