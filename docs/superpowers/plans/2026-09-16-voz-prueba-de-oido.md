# Voz clonada — plan 1: paquete `voz/` y prueba de oído

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que la PC de música pueda producir `A.mp3 … D.mp3` (el mismo párrafo de Joaquín en cuatro motores de clonación, barajados) a partir de sus audios reales en Supabase, para elegir el motor escuchando.

**Architecture:** Un paquete Python `voz/` en el monorepo con las piezas puras que después reutiliza el worker (selección de muestras, partición de texto, ffmpeg) más un script de preparación (baja los audios de Supabase, limpia, elige la referencia y el texto) y un orquestador de la prueba. Cada motor vive aislado en `voz/motores/<motor>/` con **su propio venv y su propio `generar.py`** (sus dependencias no conviven en un solo entorno); el orquestador los llama por subprocess.

**Tech Stack:** Python 3.11 (PC) / 3.12 (laptop, solo tests), ffmpeg 9, `supabase` (python), `python-dotenv`, `faster-whisper` (transcribir la referencia si hace falta), pytest. Motores: `chatterbox-tts`, `qwen-tts`, `f5-tts`, `omnivoice`.

Spec: `docs/superpowers/specs/2026-09-16-voz-clonada-design.md`.

## Global Constraints

- Todo lo de la PC de música queda confinado a `C:\vitacora-voz\` (código, venvs, logs, prueba) y `D:\vitacora-modelos\` (pesos de los modelos). Nada de música se toca. Sin puertos ni túneles.
- Los secretos (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) van en `voz/.env`, lo carga Naza a mano. `.env` está en `.gitignore`. Claude no imprime ni commitea claves.
- Identificadores, archivos y nombres de módulo **sin tildes**; textos que lee una persona (log, README) con tildes bien puestas. Repo CRLF.
- Muestras: candidatas = respuestas con `audio_path` y `duracion_segundos >= 20`, orden por duración descendente, limpiar (wav mono 24 kHz, `silenceremove` de bordes, `loudnorm` a -19 LUFS), acumular hasta 15 min; **si el total limpio es < 10 min, la prueba avisa pero sigue** (la prueba de oído no es producción; el piso de 10 min lo aplica el worker).
- Referencia zero-shot: una respuesta entera de entre 12 y 30 s (así su `transcripcion` es exactamente el texto del clip); si no hay ninguna, los primeros 25 s de la más larga y se transcribe con faster-whisper.
- Partición de texto: frases de ≤ 220 caracteres cortando por `.?!;` y, si sigue larga, por `,`; nunca dentro de una palabra.
- Pausas al pegar: 350 ms entre frases, 800 ms entre párrafos; salida mp3 128 kbps mono.
- Motores y licencias: Chatterbox Multilingual (MIT), Qwen3-TTS 1.7B Base (Apache 2.0), F5-TTS con checkpoint español (MIT), OmniVoice (Apache 2.0). XTTS-v2 prohibido (licencia no comercial).
- Nada se declara verificado sin la salida del comando pegada. Los motores no se pueden correr en la laptop (sin GPU útil): sus `generar.py` se prueban en la PC de música; lo puro se prueba con pytest en cualquier lado.

---

## Estructura de archivos

```
voz/
  README.md                    cómo instalar y correr en la PC (Naza lo lee)
  requirements.txt             base: supabase, python-dotenv, faster-whisper, soundfile, numpy
  pytest.ini                   testpaths = tests
  .env.ejemplo                 SUPABASE_URL=, SUPABASE_SERVICE_ROLE_KEY=, CARPETA_MODELOS=D:\vitacora-modelos
  voz/__init__.py
  voz/config.py                cargar_config() -> Config(supabase_url, supabase_key, carpeta_modelos, carpeta_trabajo)
  voz/muestras.py              PURO: elegir_muestras(), elegir_referencia()
  voz/texto.py                 PURO: partir_en_frases(), parrafos_de(), texto_de_prueba()
  voz/audio.py                 ffmpeg: a_wav_limpio(), duracion(), pegar_con_pausas(), a_mp3()
  voz/supabase_cliente.py      narrador_por_nombre(), respuestas_de(), descargar_audio()
  voz/transcribir.py           transcribir_clip() con faster-whisper (solo si la referencia no tiene texto exacto)
  voz/preparar_muestras.py     CLI → prueba/muestras/{referencia.wav, referencia.txt, texto.txt, muestras.json, limpias/*.wav}
  voz/prueba_oido.py           CLI → prueba/{A..D}.mp3 + clave.txt (llama a cada motor en su venv)
  motores/
    chatterbox/requirements.txt, generar.py
    qwen3tts/requirements.txt, generar.py
    f5tts/requirements.txt, generar.py
    omnivoice/requirements.txt, generar.py
    comun.py                   lo que comparten los generar.py: leer args, partir texto, pegar, escribir wav
  tests/test_muestras.py, tests/test_texto.py, tests/test_audio.py
```

Contrato de cada `motores/<m>/generar.py` (lo que el orquestador invoca):

```
python motores/<m>/generar.py --referencia REF.wav --referencia-texto REF.txt --texto TEXTO.txt --salida OUT.wav [--modelos D:\vitacora-modelos]
```
Lee el texto, lo parte con `voz.texto.partir_en_frases`, genera frase por frase, pega con `motores.comun.pegar` (pausas), escribe `OUT.wav` a 24 kHz mono. Sale con código 0 si escribió el archivo.

---

### Task 1: esqueleto del paquete + `muestras.py` (puro, con tests)

**Files:**
- Create: `voz/README.md`, `voz/requirements.txt`, `voz/pytest.ini`, `voz/.env.ejemplo`, `voz/voz/__init__.py`, `voz/voz/config.py`, `voz/voz/muestras.py`
- Test: `voz/tests/test_muestras.py`

**Interfaces (Produces):**
```python
# voz/voz/muestras.py
@dataclass(frozen=True)
class Respuesta:
    id: str
    pregunta_orden: int
    audio_path: str | None
    duracion_segundos: int | None
    transcripcion: str | None

@dataclass(frozen=True)
class Seleccion:
    respuestas: list[Respuesta]      # en el orden en que se acumulan (duración desc)
    segundos_totales: int            # suma de duracion_segundos de las elegidas
    alcanza_piso: bool               # segundos_totales >= PISO_SEGUNDOS

PISO_SEGUNDOS = 600
TOPE_SEGUNDOS = 900
MINIMO_CLIP = 20

def elegir_muestras(respuestas: list[Respuesta]) -> Seleccion
def elegir_referencia(respuestas: list[Respuesta]) -> Respuesta | None   # 12 <= dur <= 30, con transcripción, la más larga
```

- [ ] **Step 1: Test que falla** — `voz/tests/test_muestras.py`:

```python
from voz.muestras import Respuesta, elegir_muestras, elegir_referencia, PISO_SEGUNDOS

def r(id, dur, texto="hola", audio="x.ogg"):
    return Respuesta(id=id, pregunta_orden=int(id), audio_path=audio, duracion_segundos=dur, transcripcion=texto)

def test_descarta_cortas_y_sin_audio_y_ordena_por_duracion():
    sel = elegir_muestras([r("1", 19), r("2", 120), r("3", 300), r("4", 60, audio=None)])
    assert [x.id for x in sel.respuestas] == ["3", "2"]
    assert sel.segundos_totales == 420
    assert sel.alcanza_piso is False

def test_acumula_hasta_el_tope_y_marca_el_piso():
    sel = elegir_muestras([r(str(i), 200) for i in range(10)])  # 2000 s disponibles
    assert sel.segundos_totales <= 900
    assert sel.segundos_totales >= PISO_SEGUNDOS
    assert sel.alcanza_piso is True
    assert len(sel.respuestas) == 4  # 200*4 = 800; la quinta pasaría el tope

def test_referencia_es_una_respuesta_entera_entre_12_y_30_s_con_texto():
    ref = elegir_referencia([r("1", 8), r("2", 25), r("3", 29, texto=None), r("4", 45), r("5", 18)])
    assert ref is not None and ref.id == "2"

def test_referencia_none_si_no_hay_candidata():
    assert elegir_referencia([r("1", 8), r("2", 45)]) is None
```

- [ ] **Step 2:** `cd voz && python -m pytest -q` → falla por módulo inexistente.
- [ ] **Step 3: Implementar** `voz/voz/muestras.py`:

```python
from dataclasses import dataclass

PISO_SEGUNDOS = 600   # sin 10 min limpios no se clona (decisión de Naza, 16/09)
TOPE_SEGUNDOS = 900   # con 15 min alcanza; más solo hace lenta la preparación
MINIMO_CLIP = 20      # por debajo, casi todo es silencio y "hola"

@dataclass(frozen=True)
class Respuesta:
    id: str
    pregunta_orden: int
    audio_path: str | None
    duracion_segundos: int | None
    transcripcion: str | None

@dataclass(frozen=True)
class Seleccion:
    respuestas: list[Respuesta]
    segundos_totales: int
    alcanza_piso: bool

def _candidatas(respuestas):
    return sorted(
        (x for x in respuestas if x.audio_path and (x.duracion_segundos or 0) >= MINIMO_CLIP),
        key=lambda x: x.duracion_segundos or 0,
        reverse=True,
    )

def elegir_muestras(respuestas: list[Respuesta]) -> Seleccion:
    """Las más largas primero, hasta el tope. La que no entra entera no entra."""
    elegidas, total = [], 0
    for x in _candidatas(respuestas):
        if total + (x.duracion_segundos or 0) > TOPE_SEGUNDOS:
            continue
        elegidas.append(x)
        total += x.duracion_segundos or 0
    return Seleccion(respuestas=elegidas, segundos_totales=total, alcanza_piso=total >= PISO_SEGUNDOS)

def elegir_referencia(respuestas: list[Respuesta]) -> Respuesta | None:
    """Una respuesta entera de 12-30 s con transcripción: el texto coincide con el audio."""
    aptas = [x for x in _candidatas_ref(respuestas)]
    return max(aptas, key=lambda x: x.duracion_segundos or 0) if aptas else None

def _candidatas_ref(respuestas):
    for x in respuestas:
        d = x.duracion_segundos or 0
        if x.audio_path and x.transcripcion and 12 <= d <= 30:
            yield x
```

- [ ] **Step 4:** `python -m pytest -q` → 4 passed.
- [ ] **Step 5:** `config.py` (dotenv desde `voz/.env`, dataclass `Config`, error claro si falta una variable), `requirements.txt` (`supabase>=2`, `python-dotenv`, `faster-whisper`, `soundfile`, `numpy`, `pytest`), `pytest.ini` (`[pytest]\ntestpaths = tests\npythonpath = .`), `.env.ejemplo`, README con: instalar (`python -m venv .venv`, `pip install -r requirements.txt`), correr tests, y los pasos 1-3 de la prueba de oído.
- [ ] **Step 6:** Commit `voz: paquete base y selección de muestras`.

---

### Task 2: `texto.py` (puro, con tests)

**Files:** Create `voz/voz/texto.py`; Test `voz/tests/test_texto.py`.

**Interfaces (Produces):**
```python
MAX_FRASE = 220
def partir_en_frases(texto: str, maximo: int = MAX_FRASE) -> list[str]
def parrafos_de(texto: str) -> list[list[str]]        # [[frases del párrafo 1], [frases del párrafo 2], ...]
def texto_de_prueba(transcripciones: list[str], excluir: str | None = None, frases: int = 7) -> str
```

- [ ] **Step 1: Test que falla**:

```python
from voz.texto import partir_en_frases, parrafos_de, texto_de_prueba

def test_corta_por_puntuacion_y_conserva_el_texto():
    frases = partir_en_frases("Nací en Rosario. Mi padre era ferroviario; mi madre cosía. ¿Qué más? Nada.")
    assert frases == ["Nací en Rosario.", "Mi padre era ferroviario;", "mi madre cosía.", "¿Qué más?", "Nada."]

def test_una_frase_larguisima_se_parte_por_comas_y_nunca_dentro_de_una_palabra():
    larga = ", ".join(["palabra"] * 60) + "."
    frases = partir_en_frases(larga, maximo=50)
    assert all(len(f) <= 50 for f in frases)
    assert " ".join(frases).replace(" ,", ",") == larga or "".join(frases).count("palabra") == 60

def test_parrafos_respetan_lineas_en_blanco():
    p = parrafos_de("Uno. Dos.\n\nTres.")
    assert p == [["Uno.", "Dos."], ["Tres."]]

def test_texto_de_prueba_toma_frases_de_otra_transcripcion():
    t = texto_de_prueba(["Corta.", "Primera frase. Segunda frase. Tercera frase. Cuarta. Quinta. Sexta. Séptima. Octava."], excluir="Corta.", frases=3)
    assert t == "Primera frase. Segunda frase. Tercera frase."
```

- [ ] **Step 2:** pytest → falla.
- [ ] **Step 3: Implementar**:

```python
import re

MAX_FRASE = 220
_FIN = re.compile(r"(?<=[.!?;…])\s+")

def partir_en_frases(texto: str, maximo: int = MAX_FRASE) -> list[str]:
    salida = []
    for trozo in _FIN.split(texto.strip()):
        trozo = trozo.strip()
        if not trozo:
            continue
        salida.extend(_partir_larga(trozo, maximo))
    return salida

def _partir_larga(frase: str, maximo: int) -> list[str]:
    if len(frase) <= maximo:
        return [frase]
    partes, actual = [], ""
    for pedazo in re.split(r"(?<=,)\s+", frase):
        candidato = f"{actual} {pedazo}".strip() if actual else pedazo
        if len(candidato) <= maximo or not actual:
            actual = candidato
        else:
            partes.append(actual)
            actual = pedazo
    if actual:
        partes.append(actual)
    # si una parte sigue larga (sin comas), cortar por espacios
    final = []
    for p in partes:
        final.extend(_por_palabras(p, maximo))
    return final

def _por_palabras(frase: str, maximo: int) -> list[str]:
    if len(frase) <= maximo:
        return [frase]
    palabras, actual, salida = frase.split(" "), "", []
    for w in palabras:
        candidato = f"{actual} {w}".strip()
        if len(candidato) <= maximo or not actual:
            actual = candidato
        else:
            salida.append(actual)
            actual = w
    if actual:
        salida.append(actual)
    return salida

def parrafos_de(texto: str) -> list[list[str]]:
    return [partir_en_frases(p) for p in re.split(r"\n\s*\n", texto.strip()) if p.strip()]

def texto_de_prueba(transcripciones: list[str], excluir: str | None = None, frases: int = 7) -> str:
    """El párrafo de la prueba: las primeras `frases` de la transcripción más larga que no sea la referencia."""
    candidatas = [t for t in transcripciones if t and t != excluir]
    if not candidatas:
        return ""
    fuente = max(candidatas, key=len)
    return " ".join(partir_en_frases(fuente)[:frases])
```

- [ ] **Step 4:** pytest → verde (ajustar el segundo test para que sea una aserción única y clara: todas ≤ 50 y ninguna termina/empieza a mitad de "palabra").
- [ ] **Step 5:** Commit `voz: partición de texto en frases`.

---

### Task 3: `audio.py` (ffmpeg) con test sobre un wav sintético

**Files:** Create `voz/voz/audio.py`; Test `voz/tests/test_audio.py`.

**Interfaces (Produces):**
```python
def duracion(ruta: Path) -> float                                   # ffprobe
def a_wav_limpio(entrada: Path, salida: Path) -> Path               # mono 24k, silenceremove bordes, loudnorm -19
def recortar(entrada: Path, salida: Path, segundos: float) -> Path
def pegar_con_pausas(frases_wav: list[Path], salida: Path, pausa_ms: int = 350) -> Path   # concat con silencio entre medio
def a_mp3(entrada: Path, salida: Path) -> Path                      # 128k mono
```

- [ ] **Step 1: Test** (genera un wav con `ffmpeg -f lavfi -i sine=...` de 3 s con 1 s de silencio a cada lado, y comprueba que `a_wav_limpio` lo deja en ~3 s, mono, 24000 Hz; que `pegar_con_pausas` de dos clips de 1 s con pausa 500 ms dura ~2.5 s; que `a_mp3` produce un archivo > 0 bytes). Usar `tmp_path`. Marcar con `@pytest.mark.skipif(shutil.which("ffmpeg") is None)`.
- [ ] **Step 2:** falla. **Step 3:** implementar con `subprocess.run([... ], check=True, capture_output=True)`; `silenceremove=start_periods=1:start_threshold=-45dB:stop_periods=1:stop_threshold=-45dB`, `loudnorm=I=-19:TP=-1.5:LRA=11`; pegar con `concat` demuxer y un `silencio.wav` generado con `anullsrc`. **Step 4:** verde. **Step 5:** Commit `voz: ffmpeg — limpieza, pegado con pausas, mp3`.

---

### Task 4: `supabase_cliente.py`, `transcribir.py` y `preparar_muestras.py`

**Files:** Create `voz/voz/supabase_cliente.py`, `voz/voz/transcribir.py`, `voz/voz/preparar_muestras.py`.

**Interfaces:**
```python
# supabase_cliente.py
def cliente(config: Config) -> Client
def narrador_por_nombre(sb, nombre: str) -> dict            # ilike sobre narradores.nombre; error si 0 o >1
def respuestas_de(sb, narrador_id: str) -> list[Respuesta]  # select id, pregunta_orden, audio_path, duracion_segundos, transcripcion
def descargar_audio(sb, audio_path: str, destino: Path) -> Path   # bucket 'audios'
# transcribir.py
def transcribir_clip(ruta: Path, modelos: Path) -> str      # faster-whisper 'small', language='es', download_root=modelos
```

CLI `python -m voz.preparar_muestras --narrador Joaquin --salida prueba/muestras`:
1. carga config; busca el narrador; trae respuestas.
2. `elegir_muestras` → descarga y limpia cada una a `limpias/dia_NN.wav`; escribe `muestras.json` (ids, segundos limpios por clip con `duracion()`, total, `alcanza_piso`). Si no alcanza el piso, **loguea un aviso claro y sigue**.
3. `elegir_referencia` → si hay, `referencia.wav` = ese clip limpio entero y `referencia.txt` = su transcripción; si no, `recortar(la más larga, 25 s)` y `referencia.txt` = `transcribir_clip(...)`.
4. `texto.txt` = `texto_de_prueba(transcripciones, excluir=transcripción de la referencia)`; el log dice "editá prueba/muestras/texto.txt si querés otro párrafo".
5. Imprime un resumen: cuántas respuestas, segundos limpios, qué respuesta es la referencia.

- [ ] Sin test unitario de red; prueba real: correrlo contra Joaquín **desde la laptop** (tiene ffmpeg y la clave en `entrevistador/.env`; exportarla al entorno sin imprimirla) y pegar el resumen. Commit `voz: preparar muestras desde Supabase`.

---

### Task 5: `motores/comun.py` y los cuatro `generar.py` (+ requirements por motor)

**Files:** Create `voz/motores/comun.py`, `voz/motores/{chatterbox,qwen3tts,f5tts,omnivoice}/{requirements.txt,generar.py}`.

`comun.py`:
```python
def leer_args() -> argparse.Namespace       # --referencia --referencia-texto --texto --salida --modelos
def frases_del_texto(ruta) -> list[str]     # voz.texto.partir_en_frases sobre el archivo
def escribir_wav(ruta, audio: np.ndarray, sr: int)
def pegar_frases(wavs_np: list[np.ndarray], sr: int, pausa_ms=350) -> np.ndarray   # sin ffmpeg: np.concatenate con ceros
```
Cada `generar.py` hace `sys.path.insert(0, raíz de voz/)`, carga el modelo una vez, itera frases, pega, escribe 24 kHz (resamplea si el motor sale a otra tasa, con `torchaudio.functional.resample`).

APIs verificadas el 16/09 (no inventar otras):
- **chatterbox**: `pip install chatterbox-tts` · `from chatterbox.mtl_tts import ChatterboxMultilingualTTS` · `m = ChatterboxMultilingualTTS.from_pretrained(device="cuda")` · `wav = m.generate(frase, language_id="es", audio_prompt_path=ref)` · tasa `m.sr`.
- **qwen3tts**: `pip install -U qwen-tts soundfile` · `from qwen_tts import Qwen3TTSModel` · `m = Qwen3TTSModel.from_pretrained("Qwen/Qwen3-TTS-12Hz-1.7B-Base", device_map="cuda:0", dtype=torch.bfloat16)` (sin `attn_implementation="flash_attention_2"` salvo que flash-attn esté instalado) · `wavs, sr = m.generate_voice_clone(text=frase, language="Spanish", ref_audio=ref, ref_text=ref_texto)`.
- **f5tts**: `pip install f5-tts` · usar la API Python `from f5_tts.api import F5TTS`; `F5TTS(model="F5TTS_v1_Base", ckpt_file=<ckpt español>, vocab_file=<vocab>)` con el checkpoint comunitario en español bajado a `CARPETA_MODELOS/f5-spanish` (README del motor indica cuál y cómo bajarlo con `huggingface_hub.snapshot_download("jpgallegoar/F5-Spanish")`); `wav, sr, _ = f5.infer(ref_file=ref, ref_text=ref_texto, gen_text=frase)`.
- **omnivoice**: `pip install omnivoice` · `from omnivoice import OmniVoice` · `m = OmniVoice.from_pretrained("k2-fsa/OmniVoice", device_map="cuda:0", dtype=torch.float16)` · `audios = m.generate(text=frase, ref_audio=ref, ref_text=ref_texto)` → lista de arrays a 24 kHz.

Todos con `HF_HOME=CARPETA_MODELOS` para que los pesos caigan en `D:\vitacora-modelos`.

- [ ] Cada motor: `requirements.txt` con el paquete + `torch` (la versión que cada uno pida; el venv es propio) · `generar.py` según el contrato · `README` corto en `voz/README.md` con `python -m venv motores/<m>/.venv && motores\<m>\.venv\Scripts\pip install -r motores/<m>/requirements.txt`.
- [ ] Prueba: solo en la PC de música. Cada `generar.py` con la referencia real y `texto.txt` → un wav audible. Pegar la salida (tiempo y tamaño). Commit `voz: los cuatro motores de la prueba de oído`.

---

### Task 6: `prueba_oido.py` (orquestador a ciegas)

**Files:** Create `voz/voz/prueba_oido.py`.

CLI `python -m voz.prueba_oido --muestras prueba/muestras --salida prueba [--motores chatterbox,qwen3tts,f5tts,omnivoice]`:
1. Para cada motor: `subprocess.run([motores/<m>/.venv/Scripts/python.exe, motores/<m>/generar.py, --referencia ..., --referencia-texto ..., --texto ..., --salida prueba/crudo/<m>.wav, --modelos CARPETA_MODELOS], env={**os.environ, "HF_HOME": CARPETA_MODELOS})`; loguea tiempo; si falla, anota el error y sigue con el siguiente.
2. Baraja los que salieron bien con `random.Random(<semilla del día>)` → `A.mp3`, `B.mp3`, … (`a_mp3`), y escribe `clave.txt` con `A = <motor>` por línea. Imprime **solo** "Listo: A, B, C, D en prueba/. La clave está en prueba/clave.txt: no la abras hasta elegir."
3. Test puro: la función `barajar(motores, semilla) -> dict[letra, motor]` es determinista para la misma semilla y biyectiva (test en `tests/test_prueba_oido.py`).

- [ ] Test → implementar → verde → commit `voz: prueba de oído a ciegas`.

---

### Task 7: README final + instrucciones para la PC + ROADMAP

- [ ] `voz/README.md`: pasos completos en la PC: `git clone` en `C:\vitacora-voz\repo` (o `git pull`), venv base, `.env`, venv por motor, `preparar_muestras`, `prueba_oido`, dónde quedan A-D. Qué hacer si un motor falla (mandar el log, seguir con los otros).
- [ ] ROADMAP 3t.14: "plan 1 (prueba de oído) en `docs/superpowers/plans/2026-09-16-voz-prueba-de-oido.md`".
- [ ] Commit y push a `main`.
