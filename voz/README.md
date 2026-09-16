# `voz/` — la voz clonada del narrador

El worker que corre en la PC de música de Naza (GPU) y narra el libro con la voz
del narrador. Diseño: `docs/superpowers/specs/2026-09-16-voz-clonada-design.md`.
Plan de esta primera entrega (la prueba de oído):
`docs/superpowers/plans/2026-09-16-voz-prueba-de-oido.md`.

**Estado (16/09/2026):** existe la prueba de oído. El worker que sondea Supabase
(`narraciones`) viene después, cuando el motor esté elegido.

## Qué hay

| Archivo | Para qué |
|---|---|
| `voz/muestras.py` | Elegir qué respuestas del narrador se usan (las más largas, hasta 15 min; piso 10 min) y cuál es la referencia (una entera de 12-30 s). Puro. |
| `voz/texto.py` | Partir el texto en frases de ≤ 220 caracteres sin romper palabras. Puro. |
| `voz/audio.py` | ffmpeg: limpiar (mono 24 kHz, sin silencios en los bordes, volumen parejo), recortar en una pausa, pegar con pausas, mp3. |
| `voz/preparar_muestras.py` | Paso 1: baja los audios de Supabase y deja `referencia.wav`, `referencia.txt`, `texto.txt`, `limpias/`. |
| `voz/prueba_oido.py` | Paso 2: corre cada motor en su venv y deja `A.mp3 … D.mp3` + `clave.txt`. |
| `motores/<motor>/generar.py` | Un motor por carpeta, con su propio `requirements.txt` y su propio venv. Todos con el mismo contrato. |
| `motores/comun.py` | Lo que comparten los motores (argumentos, bucle frase a frase, pegado, wav). |

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

## Tests (en cualquier máquina con ffmpeg)

```powershell
.\.venv\Scripts\python -m pytest -q
```
Prueban lo puro (selección, texto, barajado), ffmpeg con audio sintético, y el
orquestador completo con un motor falso. Los cuatro motores reales solo se
prueban en la PC con GPU.

## Reglas de la casa

- Nada de música se toca. El worker vive en `C:\vitacora-voz\` y `D:\vitacora-modelos\`.
- Sin puertos ni túneles: la PC siempre va a buscar a Supabase, nunca recibe.
- Sin 10 minutos limpios de voz no se clona; sin `consentimiento_voz_at` no se clona (eso lo aplica el worker, no la prueba).
