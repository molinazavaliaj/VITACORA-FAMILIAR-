"""Masterizar: el último paso antes de subir cada `cap_NN.mp3`, igual para el
capítulo clonado, el real y el híbrido (central, 19/09, directiva 01 punto 3).

Un capítulo es una lista de piezas (wav/ogg/mp3): para el clonado, una sola
pieza (lo que devolvió el motor, ya con sus pausas por puntuación); para el
híbrido, los originales y los conectores en orden. A cada pieza:

1. Limpieza: pasa-altos 80 Hz, afftdn suave, recorte de silencio en las puntas.
2. Igualación espectral al objetivo (el promedio del libro, o de las muestras
   del narrador): EQ por bandas de octava, con tope, para que no cambie el
   sonido entre historias.
3. Pegado con la pausa `historia` de voz/pausas.py entre piezas, con fades.
4. `loudnorm` en dos pasadas sobre el capítulo entero: −19 LUFS / TP −1,5 / LRA 7.
5. Medición antes y después (nivel, pico, ruido por pieza; LUFS/TP/LRA por
   capítulo) a `master.json`, con avisos si algo queda fuera de rango.

    python -m voz.masterizar --capitulo 2 --salida cap_02.wav --piezas a.wav b.wav …
                             [--objetivo muestra1.wav …] [--master master.json]

Solo ffmpeg (subprocess), numpy y soundfile.
"""

import argparse
import json
import re
import subprocess
import sys
import tempfile
from dataclasses import asdict, dataclass
from pathlib import Path

import numpy as np
import soundfile as sf

from dotenv import load_dotenv

from .config import RAIZ
from .pausas import pausas_ms
from .restaurar import restaurar
from .ritmo import aplicar_plan, plan_de_ritmo
from .ritmo import resumen as resumen_ritmo
from .transcribir import palabras_con_tiempos

TASA = 24000

OBJETIVO_LUFS = -19.0
OBJETIVO_TP = -1.5
OBJETIVO_LRA = 7.0

# Fuera de esto, `master.json` lleva un aviso (no se frena: se sube igual y se mira).
TOLERANCIA_LUFS = 1.0  # el capítulo tiene que quedar a ±1 LU del objetivo
TP_MAXIMO = -1.0  # pico real por encima de esto: riesgo de clipping en el mp3
RUIDO_MAXIMO_DB = -45.0  # piso de ruido por pieza, después
PIEZA_MINIMA_S = 0.4
TOPE_EQ_SUBIR_DB = 3.0  # subir una banda infla lo que la grabación no tiene (retumbe, siseo): poco
TOPE_EQ_BAJAR_DB = 6.0  # bajar es más seguro
LIMITE_PICO_DB = -3.5  # limitador suave antes de loudnorm: deja 2 dB de aire bajo el techo de −1,5 para que trabaje en lineal

BANDAS_HZ = (125, 250, 500, 1000, 2000, 4000, 8000)
FADE_MS = 40

# Limpieza por pieza. `silenceremove` con stop_periods no recorta "el final" (ver
# audio.py): se recorta el principio, se da vuelta, se recorta y se vuelve a dar vuelta.
_RECORTE = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.25"
FILTRO_LIMPIEZA = f"highpass=f=80,afftdn=nr=10:nf=-28:tn=1,{_RECORTE},areverse,{_RECORTE},areverse"
# Una pieza real ya restaurada con modelo (directiva 02) no necesita afftdn: solo el pasa-altos y las puntas.
FILTRO_LIMPIEZA_RESTAURADA = f"highpass=f=80,{_RECORTE},areverse,{_RECORTE},areverse"


@dataclass(frozen=True)
class Pieza:
    ruta: Path
    nombre: str  # cómo aparece en master.json ("dia_05", "c1_05_a_05_2", "cap_02")
    tipo: str  # "clonado" | "real" | "conector"


@dataclass
class Medida:
    duracion_s: float
    rms_db: float
    pico_db: float
    ruido_db: float


# ----------------------------------------------------------------- ffmpeg ---


def _ffmpeg(*args: str) -> str:
    """Corre ffmpeg y devuelve stderr (ahí imprime loudnorm su JSON)."""
    proceso = subprocess.run(["ffmpeg", "-y", "-nostdin", "-hide_banner", *args], capture_output=True, text=True)
    if proceso.returncode != 0:
        raise RuntimeError(f"ffmpeg falló: {' '.join(args)}\n{proceso.stderr[-1500:]}")
    return proceso.stderr


def leer(ruta: Path) -> np.ndarray:
    """Mono float32 a 24 kHz. Lo que no es wav (ogg/opus de WhatsApp, mp3) pasa
    por ffmpeg, que libsndfile no lee opus."""
    ruta = Path(ruta)
    if ruta.suffix.lower() != ".wav":
        with tempfile.TemporaryDirectory() as tmp:
            wav = Path(tmp) / "decodificado.wav"
            _ffmpeg("-i", str(ruta), "-ac", "1", "-ar", str(TASA), str(wav))
            return leer(wav)
    audio, tasa = sf.read(str(ruta), dtype="float32")
    if audio.ndim == 2:
        audio = audio[:, 0]
    if tasa != TASA:
        n = int(round(len(audio) * TASA / tasa))
        audio = np.interp(np.linspace(0, 1, n, endpoint=False), np.linspace(0, 1, len(audio), endpoint=False), audio).astype(np.float32)
    return audio


def escribir(ruta: Path, audio: np.ndarray, subtipo: str = "PCM_16") -> Path:
    """Los intermedios van en FLOAT: la EQ puede empujar picos por encima de
    0 dBFS y en 16 bit eso clipea antes de que loudnorm lo baje."""
    ruta.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(ruta), audio, TASA, subtype=subtipo)
    return ruta


# ---------------------------------------------------------------- medir ---


def _db(x) -> float:
    return float(20 * np.log10(max(float(x), 1e-9)))


def _rms_por_ventana(audio: np.ndarray, ms: int = 50) -> np.ndarray:
    """RMS de cada ventana de `ms`; un audio más corto que una ventana es una sola."""
    v = int(TASA * ms / 1000)
    if len(audio) < v:
        return np.array([np.sqrt(np.mean(audio**2))], dtype=np.float32)
    n = len(audio) // v
    return np.sqrt(np.mean(audio[: n * v].reshape(n, v) ** 2, axis=1))


def medir(audio: np.ndarray) -> Medida:
    """Nivel (RMS), pico y piso de ruido: la ventana de 50 ms más silenciosa,
    sin contar la primera y la última (los fades)."""
    if len(audio) == 0:
        return Medida(0.0, -99.0, -99.0, -99.0)
    ventanas = _rms_por_ventana(audio)
    interior = ventanas[1:-1] if len(ventanas) > 2 else ventanas
    return Medida(
        duracion_s=round(len(audio) / TASA, 2),
        rms_db=round(_db(np.sqrt(np.mean(audio**2))), 1),
        pico_db=round(_db(np.max(np.abs(audio))), 1),
        ruido_db=round(_db(interior.min()), 1),
    )


def medir_loudnorm(ruta: Path) -> dict:
    """Primera pasada de loudnorm: LUFS integrado, pico real y LRA de entrada."""
    err = _ffmpeg("-i", str(ruta), "-af", f"loudnorm=I={OBJETIVO_LUFS}:TP={OBJETIVO_TP}:LRA={OBJETIVO_LRA}:print_format=json", "-f", "null", "-")
    datos = _json_de_loudnorm(err)
    return {"lufs": _num(datos.get("input_i")), "tp_dbtp": _num(datos.get("input_tp")), "lra": _num(datos.get("input_lra")), "_crudo": datos}


def _json_de_loudnorm(err: str) -> dict:
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", err, re.S)
    if not m:
        raise RuntimeError("loudnorm no imprimió su JSON:\n" + err[-800:])
    return json.loads(m.group(0))


def _num(x) -> float | None:
    try:
        v = float(x)
    except (TypeError, ValueError):
        return None
    return None if v in (float("inf"), float("-inf")) or v != v else round(v, 1)


# ----------------------------------------------------- limpiar / igualar ---


def limpiar_pieza(entrada: Path, salida: Path, filtro: str = FILTRO_LIMPIEZA) -> Path:
    _ffmpeg("-i", str(entrada), "-af", filtro, "-ac", "1", "-ar", str(TASA), "-c:a", "pcm_f32le", str(salida))
    return salida


def preparar_real(pieza: "Pieza", tmp: Path, i: int, restaurador, transcriptor, log) -> tuple[Path, dict]:
    """Directiva 02, antes de todo lo demás y solo para piezas reales:
    (A) restaurar con modelo, (B) ritmo con marcas por palabra (arranque que
    responde a la pregunta, silencios internos largos). Devuelve el wav listo
    para la cadena de siempre y lo medido."""
    crudo = tmp / f"{i:02d}_crudo.wav"
    _ffmpeg("-i", str(pieza.ruta), "-ac", "1", str(crudo))  # a la tasa original (48 kHz en WhatsApp)
    restaurado = tmp / f"{i:02d}_restaurado.wav"
    medidas = {"restauracion": restaurador(crudo, restaurado, log=log)}
    audio, tasa = sf.read(str(restaurado), dtype="float32")
    audio = audio[:, 0] if audio.ndim == 2 else audio
    # Whisper acepta hasta 25 MB: se le manda una copia 16 bit a 24 kHz (la línea de tiempo es la misma).
    para_whisper = tmp / f"{i:02d}_para_whisper.wav"
    _ffmpeg("-i", str(restaurado), "-ac", "1", "-ar", str(TASA), "-c:a", "pcm_s16le", str(para_whisper))
    marcas = transcriptor(para_whisper)
    plan = plan_de_ritmo(marcas["texto"], marcas["palabras"])
    con_ritmo = aplicar_plan(audio, tasa, plan)
    medidas["ritmo"] = resumen_ritmo(plan, len(audio) / tasa, len(con_ritmo) / tasa)
    log(f"  ritmo {pieza.nombre}: arranque -{plan.corte_arranque_s:.2f} s «{plan.arranque}», "
        f"{len(plan.silencios)} silencios acortados (-{medidas['ritmo']['silencio_sacado_s']} s)")
    listo = tmp / f"{i:02d}_listo.wav"
    sf.write(str(listo), con_ritmo, tasa, subtype="FLOAT")
    return listo, medidas


def perfil_espectral(audio: np.ndarray) -> np.ndarray:
    """Energía por banda de octava en dB, relativa a la banda de 1 kHz. Sobre
    los primeros 60 s (alcanza y no pesa)."""
    seg = audio[: min(len(audio), TASA * 60)]
    if len(seg) < TASA // 2:
        return np.zeros(len(BANDAS_HZ), dtype=np.float32)
    espectro = np.abs(np.fft.rfft(seg * np.hanning(len(seg)))) ** 2
    f = np.fft.rfftfreq(len(seg), 1 / TASA)
    energia = []
    for banda in BANDAS_HZ:
        sel = (f >= banda / 1.4142) & (f < banda * 1.4142)
        energia.append(float(espectro[sel].mean()) if sel.any() else 1e-12)
    e = 10 * np.log10(np.maximum(np.array(energia), 1e-12))
    return (e - e[3]).astype(np.float32)


def objetivo_de(rutas: list[Path]) -> np.ndarray:
    """El objetivo espectral: promedio de los perfiles de esos audios."""
    perfiles = [perfil_espectral(leer(r)) for r in rutas]
    return np.mean(perfiles, axis=0).astype(np.float32) if perfiles else np.zeros(len(BANDAS_HZ), dtype=np.float32)


def igualar_espectro(entrada: Path, salida: Path, objetivo: np.ndarray) -> list[float]:
    """EQ por bandas para acercar la pieza al objetivo. Devuelve las ganancias aplicadas."""
    ganancias = np.clip(objetivo - perfil_espectral(leer(entrada)), -TOPE_EQ_BAJAR_DB, TOPE_EQ_SUBIR_DB)
    ganancias[3] = 0.0  # 1 kHz es la referencia
    eq = ",".join(f"equalizer=f={b}:t=o:w=1:g={g:.1f}" for b, g in zip(BANDAS_HZ, ganancias))
    _ffmpeg("-i", str(entrada), "-af", eq, "-ac", "1", "-ar", str(TASA), "-c:a", "pcm_f32le", str(salida))
    return [round(float(g), 1) for g in ganancias]


# ------------------------------------------------------- pegar / loudnorm ---


NIVEL_PIEZA_DB = -17.0  # RMS de la voz de cada pieza antes de pegar (≈ −19 LUFS con sus pausas): loudnorm después solo retoca


def nivelar(audio: np.ndarray, objetivo_db: float = NIVEL_PIEZA_DB) -> np.ndarray:
    """Todas las piezas al mismo nivel de voz antes de pegar: así loudnorm
    después solo ajusta unos dB y el LRA de entrada no dispara el modo
    dinámico. RMS sobre las ventanas con voz (las 60 % más fuertes), no
    sobre las pausas."""
    if len(audio) == 0:
        return audio
    ventanas = _rms_por_ventana(audio)
    fuertes = np.sort(ventanas)[int(len(ventanas) * 0.4) :]
    rms = float(np.sqrt(np.mean(fuertes**2))) if len(fuertes) else 0.0
    if rms <= 0:
        return audio
    return (audio * 10 ** ((objetivo_db - _db(rms)) / 20)).astype(np.float32)


def _fundir(audio: np.ndarray, ms: int = FADE_MS) -> np.ndarray:
    audio = audio.copy()
    n = min(int(TASA * ms / 1000), len(audio) // 4)
    if n:
        audio[:n] *= np.linspace(0.0, 1.0, n, dtype=np.float32)
        audio[-n:] *= np.linspace(1.0, 0.0, n, dtype=np.float32)
    return audio


def pegar_piezas(audios: list[np.ndarray], pausa_ms: int) -> tuple[np.ndarray, list[tuple[int, int]]]:
    """Concatena con `pausa_ms` de silencio entre piezas y fades en cada borde.
    Devuelve también dónde quedó cada pieza (inicio, fin en muestras), para
    medirla después en el capítulo terminado."""
    silencio = np.zeros(int(TASA * pausa_ms / 1000), dtype=np.float32)
    partes, posiciones, cursor = [], [], 0
    for i, a in enumerate(audios):
        if i:
            partes.append(silencio)
            cursor += len(silencio)
        a = _fundir(a)
        partes.append(a)
        posiciones.append((cursor, cursor + len(a)))
        cursor += len(a)
    return np.concatenate(partes) if partes else np.zeros(0, dtype=np.float32), posiciones


def limitar_picos(entrada: Path, salida: Path) -> Path:
    """Limitador suave sobre los picos aislados (golpes de "p", clicks) que
    impedirían a loudnorm subir a −19 LUFS sin pasar el techo. Con esto la
    segunda pasada queda en modo lineal (solo ganancia) casi siempre."""
    _ffmpeg("-i", str(entrada), "-af", f"alimiter=limit={10 ** (LIMITE_PICO_DB / 20):.4f}:attack=5:release=50:level=false",
            "-ac", "1", "-ar", str(TASA), "-c:a", "pcm_f32le", str(salida))
    return salida


def loudnorm_dos_pasadas(entrada: Path, salida: Path) -> dict:
    """Mide, y después normaliza con lo medido (linear cuando se puede: sin
    compresión, solo ganancia). Devuelve lo que informa la segunda pasada."""
    primera = medir_loudnorm(entrada)["_crudo"]
    filtro = (
        f"loudnorm=I={OBJETIVO_LUFS}:TP={OBJETIVO_TP}:LRA={OBJETIVO_LRA}"
        f":measured_I={primera['input_i']}:measured_TP={primera['input_tp']}"
        f":measured_LRA={primera['input_lra']}:measured_thresh={primera['input_thresh']}"
        f":offset={primera.get('target_offset', 0)}:linear=true:print_format=json"
    )
    err = _ffmpeg("-i", str(entrada), "-af", filtro, "-ac", "1", "-ar", str(TASA), str(salida))
    segunda = _json_de_loudnorm(err)
    return {
        "antes": {"lufs": _num(primera["input_i"]), "tp_dbtp": _num(primera["input_tp"]), "lra": _num(primera["input_lra"])},
        "despues": {"lufs": _num(segunda.get("output_i")), "tp_dbtp": _num(segunda.get("output_tp")), "lra": _num(segunda.get("output_lra"))},
        "modo": segunda.get("normalization_type", "?"),  # "linear" (solo ganancia) o "dynamic" (comprimió para llegar al LRA)
    }


# ---------------------------------------------------------- el capítulo ---


def avisos_de(capitulo: dict) -> list[str]:
    avisos = []
    d = capitulo["loudnorm"]["despues"]
    if d["lufs"] is not None and abs(d["lufs"] - OBJETIVO_LUFS) > TOLERANCIA_LUFS:
        avisos.append(f"capítulo a {d['lufs']} LUFS (objetivo {OBJETIVO_LUFS} ± {TOLERANCIA_LUFS})")
    if d["tp_dbtp"] is not None and d["tp_dbtp"] > TP_MAXIMO:
        avisos.append(f"pico real {d['tp_dbtp']} dBTP (máximo {TP_MAXIMO})")
    if capitulo["loudnorm"]["modo"] == "dynamic":
        avisos.append("loudnorm trabajó en modo dinámico (no llegó a −19 con solo ganancia: pico o LRA de entrada): escuchar si respira raro")
    for p in capitulo["piezas"]:
        if p["despues"]["ruido_db"] > RUIDO_MAXIMO_DB:
            avisos.append(f"{p['nombre']}: piso de ruido {p['despues']['ruido_db']} dB (máximo {RUIDO_MAXIMO_DB})")
        if p["despues"]["duracion_s"] < PIEZA_MINIMA_S:
            avisos.append(f"{p['nombre']}: quedó de {p['despues']['duracion_s']} s (¿se recortó de más?)")
    return avisos


def masterizar_capitulo(
    numero: int,
    piezas: list[Pieza],
    salida: Path,
    objetivo: np.ndarray | None = None,
    pausas: dict[str, int] | None = None,
    log=None,
    restaurador=restaurar,
    transcriptor=palabras_con_tiempos,
) -> dict:
    """Limpia, iguala, pega y normaliza; deja `salida` (wav 24 kHz mono) y
    devuelve la entrada de este capítulo para master.json. Las piezas reales
    pasan antes por restaurar + ritmo (directiva 02); `restaurador` y
    `transcriptor` se inyectan para los tests (el modelo pide GPU, Whisper red)."""
    if not piezas:
        raise ValueError("un capítulo necesita al menos una pieza")
    pausas = pausas or pausas_ms()
    log = log or (lambda *a, **k: None)
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        # 1. Las reales primero: restaurar y ritmo. Lo que sale de acá define el
        #    sonido objetivo y sigue por la cadena de siempre.
        fuentes: list[Path] = []
        extras: list[dict] = []
        for i, pieza in enumerate(piezas):
            if pieza.tipo == "real":
                listo, medidas = preparar_real(pieza, tmp, i, restaurador, transcriptor, log)
                fuentes.append(listo)
                extras.append(medidas)
            else:
                fuentes.append(pieza.ruta)
                extras.append({})
        if objetivo is None:
            # El sonido objetivo es la voz REAL del narrador (ya restaurada): si el
            # capítulo trae piezas reales, el promedio de esas; si es todo clonado,
            # el de todas (el worker pasa el de las muestras limpias). Nunca el
            # promedio con los conectores: los sintéticos tienen mucho más grave
            # que una nota de WhatsApp y arrastrarían a la voz real hacia ellos.
            reales = [f for f, p in zip(fuentes, piezas) if p.tipo == "real"]
            objetivo = objetivo_de(reales or fuentes)
        entradas: list[dict] = []
        limpias: list[np.ndarray] = []
        for i, (pieza, fuente, extra) in enumerate(zip(piezas, fuentes, extras)):
            antes = medir(leer(pieza.ruta))
            filtro = FILTRO_LIMPIEZA_RESTAURADA if pieza.tipo == "real" else FILTRO_LIMPIEZA
            limpia = limpiar_pieza(fuente, tmp / f"{i:02d}_limpia.wav", filtro)
            igualada = tmp / f"{i:02d}_igualada.wav"
            eq = igualar_espectro(limpia, igualada, objetivo)
            limpias.append(nivelar(leer(igualada)))
            entradas.append({"nombre": pieza.nombre, "tipo": pieza.tipo, "antes": asdict(antes), "eq_db": eq, **extra})
            log(f"  masterizar: {pieza.nombre} ({pieza.tipo}) {antes.duracion_s:.1f} s, EQ {eq}")
        pegado, posiciones = pegar_piezas(limpias, pausas["historia"])
        escribir(tmp / "pegado.wav", pegado, subtipo="FLOAT")
        limitar_picos(tmp / "pegado.wav", tmp / "limitado.wav")
        loud = loudnorm_dos_pasadas(tmp / "limitado.wav", salida)
        final = leer(salida)
        for entrada, (ini, fin) in zip(entradas, posiciones):
            entrada["despues"] = asdict(medir(final[ini:fin]))
    capitulo = {
        "capitulo": numero,
        "salida": salida.name,
        "duracion_s": round(len(final) / TASA, 2),
        "pausa_entre_piezas_ms": pausas["historia"],
        "objetivo_espectral_db": [round(float(x), 1) for x in objetivo],
        "loudnorm": loud,
        "piezas": entradas,
    }
    capitulo["avisos"] = avisos_de(capitulo)
    for aviso in capitulo["avisos"]:
        log(f"  masterizar AVISO cap {numero}: {aviso}")
    return capitulo


def agregar_a_master(ruta: Path, capitulo: dict, libro: dict | None = None) -> dict:
    """Un master.json por libro: se va completando capítulo a capítulo."""
    datos = json.loads(ruta.read_text(encoding="utf-8")) if ruta.exists() else {"libro": libro or {}, "objetivos": {"lufs": OBJETIVO_LUFS, "tp_dbtp": OBJETIVO_TP, "lra": OBJETIVO_LRA}, "capitulos": []}
    datos["capitulos"] = [c for c in datos["capitulos"] if c["capitulo"] != capitulo["capitulo"]] + [capitulo]
    datos["capitulos"].sort(key=lambda c: c["capitulo"])
    datos["avisos"] = [f"cap {c['capitulo']}: {a}" for c in datos["capitulos"] for a in c["avisos"]]
    ruta.write_text(json.dumps(datos, ensure_ascii=False, indent=2), encoding="utf-8")
    return datos


# ---------------------------------------------------------------- CLI ---


def main() -> None:
    for flujo in (sys.stdout, sys.stderr):
        if hasattr(flujo, "reconfigure"):
            flujo.reconfigure(encoding="utf-8", errors="replace")
    # Sin esto RESTAURACION_NIVEL, PAUSAS_MS y OPENAI_API_KEY de voz/.env se
    # ignoraban (revisión 20/09). Solo el .env: esta herramienta no usa Supabase.
    load_dotenv(RAIZ / ".env")
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--capitulo", type=int, required=True)
    p.add_argument("--salida", type=Path, required=True, help="wav del capítulo masterizado")
    p.add_argument("--piezas", type=Path, nargs="+", required=True, help="en orden; nombre[:tipo], tipo = clonado|real|conector")
    p.add_argument("--objetivo", type=Path, nargs="*", default=None, help="audios que definen el sonido objetivo (por defecto, las piezas)")
    p.add_argument("--master", type=Path, default=None, help="master.json a completar")
    args = p.parse_args()
    piezas = []
    for cruda in args.piezas:
        texto = str(cruda)
        tipo = "real"
        if ":" in texto[2:]:  # no la de "C:\"
            texto, tipo = texto.rsplit(":", 1)
        piezas.append(Pieza(Path(texto), Path(texto).stem, tipo))
    objetivo = objetivo_de(args.objetivo) if args.objetivo else None
    capitulo = masterizar_capitulo(args.capitulo, piezas, args.salida, objetivo, log=print)
    if args.master:
        agregar_a_master(args.master, capitulo)
    print(json.dumps({k: v for k, v in capitulo.items() if k in ("capitulo", "duracion_s", "loudnorm", "avisos")}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
