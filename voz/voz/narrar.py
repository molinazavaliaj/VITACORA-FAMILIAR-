"""Lo que hace el worker con una narración tomada: preparar la voz del
narrador y narrar el libro capítulo por capítulo, subiendo cada mp3 apenas
sale y anotando en la fila cuáles ya están.

Desde la directiva 04 (20/09) el audiolibro es híbrido: en un capítulo
`modo = "hibrido"` las historias van con el audio REAL del narrador
(restaurado, con el ritmo arreglado) y la voz clonada narra solo el anuncio
del capítulo y los conectores que escribió la fábrica. Un capítulo `clonado`
(o un narracion.json v1) se narra entero como siempre.

Ese anotar es la reanudación: si el worker se cae a mitad de un libro, al
retomar recibe `capitulos_paths` con lo que ya se subió y saltea esos
capítulos. Un capítulo con el motor real tarda minutos; perder ocho por un
corte de luz no.
"""

import subprocess
import time
from pathlib import Path

from .audio import a_mp3
from .buzon import Narracion, marcar
from .libro import Capitulo, ruta_capitulo, textos_de_conectores, texto_a_narrar
from .masterizar import Pieza, agregar_a_master, masterizar_capitulo, objetivo_de
from .restaurar import restaurar
from .transcribir import palabras_con_tiempos
from .motor_subprocess import correr_motor_subprocess
from .muestras import PISO_SEGUNDOS, elegir_muestras
from .preparar_muestras import preparar_de
from .supabase_cliente import BUCKET, narrador_por_id, respuestas_de


class FaltanMinutos(Exception):
    """El narrador no tiene los minutos limpios que pide el piso para clonar."""

    def __init__(self, segundos: float):
        self.segundos = segundos
        super().__init__(f"solo {segundos:.0f} s de audio; el piso para clonar son {PISO_SEGUNDOS} s")


def preparar_voz(sb, narrador_id: str, carpeta: Path) -> tuple[Path, Path, dict]:
    """Deja en `carpeta` la referencia (wav + txt) y devuelve (wav, txt, resumen).

    Antes de bajar nada mira si las respuestas elegidas suman el piso en
    crudo: limpiar solo saca segundos, así que si en crudo no alcanza, en
    limpio tampoco. Después de limpiar vuelve a mirar.
    """
    narrador = narrador_por_id(sb, narrador_id)
    respuestas = respuestas_de(sb, narrador_id)
    seleccion = elegir_muestras(respuestas)
    if seleccion.segundos_totales < PISO_SEGUNDOS:
        raise FaltanMinutos(float(seleccion.segundos_totales))
    resumen = preparar_de(sb, narrador, respuestas, carpeta)
    if resumen["segundos_limpios"] < PISO_SEGUNDOS:
        raise FaltanMinutos(float(resumen["segundos_limpios"]))
    return carpeta / "referencia.wav", carpeta / "referencia.txt", resumen


SEGUNDOS_OBJETIVO = 60  # perfil_espectral solo mira los primeros 60 s de cada muestra: se restaura eso
REINTENTOS_SUBIDA = 3


def objetivo_del_narrador(carpeta: Path, modelos: Path, restaurador, log) -> tuple:
    """El sonido objetivo del master: las muestras limpias del narrador, YA
    restauradas (revisión 03e: con las muestras crudas de WhatsApp la EQ le
    bajaba hasta 6 dB en 8 kHz al clonado). Se restauran solo los primeros 60 s
    de cada una, que es lo que mira `perfil_espectral`; queda en
    `carpeta/objetivo/` para no repetirlo en un reintento. Si restaurar falla,
    esa muestra entra cruda y queda anotado."""
    limpias = sorted((carpeta / "limpias").glob("*.wav")) if (carpeta / "limpias").is_dir() else []
    if not limpias:
        return None, {}
    destino = carpeta / "objetivo"
    destino.mkdir(exist_ok=True)
    usadas, sin_restaurar = [], []
    for i, limpia in enumerate(limpias):
        corta = destino / f"{i:02d}_60s.wav"
        restaurada = destino / f"{i:02d}_restaurada.wav"
        if not restaurada.exists():
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(limpia), "-t", str(SEGUNDOS_OBJETIVO), "-ac", "1", str(corta)], check=True)
            try:
                restaurador(corta, restaurada, log=log.info, modelos=modelos)
            except Exception as e:
                log.warning("objetivo espectral: %s no se pudo restaurar (%s: %s); entra cruda", limpia.name, type(e).__name__, str(e)[:120])
                sin_restaurar.append(limpia.name)
                usadas.append(corta)
                continue
        usadas.append(restaurada)
    return objetivo_de(usadas), {"muestras": len(limpias), "sin_restaurar": sin_restaurar}


def narrar_texto(motor, referencia, referencia_texto, texto: str, base: Path, modelos: Path, log) -> Path:
    """Un texto con la voz clonada → wav. Si el motor falla, RuntimeError (la
    narración queda fallida: en un híbrido faltaría un conector, en un clonado
    el capítulo entero)."""
    txt, wav = base.with_suffix(".txt"), base.with_suffix(".wav")
    txt.write_text(texto, encoding="utf-8")
    ok, segundos, cola = correr_motor_subprocess(motor, referencia, referencia_texto, txt, wav, modelos, base.with_suffix(".log"))
    if not ok:
        raise RuntimeError(f"el motor {motor} falló en {base.name} a los {segundos:.0f} s:\n{cola}")
    log.info("  %s: %.0f s de motor", base.name, segundos)
    return wav


def bajar_historia(sb, audio_path: str, destino: Path) -> Path:
    if not destino.exists():
        destino.write_bytes(sb.storage.from_(BUCKET).download(audio_path))
    return destino


def piezas_de_capitulo(sb, cap: Capitulo, motor, referencia, referencia_texto, carpeta: Path, modelos: Path, log) -> list[Pieza]:
    """Las piezas de un capítulo en el orden en que van a sonar.

    clonado: una sola, el anuncio + texto con la voz clonada.
    hibrido: anuncio(+entrada) → historia 1 → entre[0] → historia 2 → … →
    historia N → salida. Las historias son el audio real bajado del bucket
    (tipo "real": masterizar las restaura y les arregla el ritmo); los
    conectores, la voz clonada (tipo "conector", igualada a las reales).
    """
    base = carpeta / f"cap_{cap.numero:02d}"
    if cap.modo != "hibrido":
        wav = narrar_texto(motor, referencia, referencia_texto, texto_a_narrar(cap), base, modelos, log)
        return [Pieza(wav, f"cap_{cap.numero:02d}", "clonado")]
    conectores = []
    for nombre, texto in textos_de_conectores(cap):
        wav = narrar_texto(motor, referencia, referencia_texto, texto, carpeta / f"cap_{cap.numero:02d}_{nombre}", modelos, log)
        conectores.append(Pieza(wav, nombre, "conector"))
    historias = []
    for k, h in enumerate(cap.historias, start=1):
        nombre = f"h{k}_p{h.pregunta_orden:02d}{'_re' if h.es_repregunta else ''}"
        local = bajar_historia(sb, h.audio_path, carpeta / f"cap_{cap.numero:02d}_{nombre}{Path(h.audio_path).suffix}")
        historias.append(Pieza(local, nombre, "real"))
    # c0 = anuncio(+entrada); c1..cN-1 = entre; el último, si está, la salida
    entre = conectores[1 : 1 + len(cap.historias) - 1]
    salida = conectores[len(cap.historias) :]
    piezas = [conectores[0]]
    for k, historia in enumerate(historias):
        piezas.append(historia)
        if k < len(entre):
            piezas.append(entre[k])
    piezas.extend(salida)
    return piezas


def subir_con_reintentos(sb, ruta: str, datos: bytes, opciones: dict, log) -> bool:
    for intento in range(1, REINTENTOS_SUBIDA + 1):
        try:
            sb.storage.from_(BUCKET).upload(ruta, datos, opciones)
            return True
        except Exception as e:
            log.warning("subida de %s falló (%d/%d): %s", ruta, intento, REINTENTOS_SUBIDA, str(e)[:120])
            time.sleep(min(2**intento, 8))
    return False


def narrar_capitulos(
    sb,
    narracion: Narracion,
    capitulos: list[Capitulo],
    motor: str,
    referencia: Path,
    referencia_texto: Path,
    carpeta: Path,
    modelos: Path,
    ya_subidos: list[str],
    log,
    restaurador=restaurar,
    transcriptor=palabras_con_tiempos,
) -> list[str]:
    """Narra cada capítulo en orden y sube su mp3 a `{narrador}/voz/cap_NN.mp3`.

    Después de cada subida marca la fila con la lista acumulada
    (`capitulos_paths`): ese es el checkpoint. Los que ya vienen en
    `ya_subidos` se saltean pero quedan en la lista que se devuelve, así el
    resultado siempre es el libro completo en orden. `restaurador` y
    `transcriptor` se inyectan para los tests (GPU y red).
    """
    acumulado: list[str] = []
    total = len(capitulos)
    objetivo, sobre_objetivo = objetivo_del_narrador(carpeta, modelos, restaurador, log)
    master_json = carpeta / "master.json"
    ruta_master = f"{narracion.narrador_id}/voz/master.json"
    libro = {"narracion": narracion.id, "narrador": narracion.narrador_id, "motor": motor, "objetivo_espectral": sobre_objetivo}
    for cap in capitulos:
        ruta = ruta_capitulo(narracion.narrador_id, cap.numero)
        if ruta in ya_subidos:
            log.info("capítulo %d ya estaba, lo salteo", cap.numero)
            acumulado.append(ruta)
            continue

        log.info("narrando a %s, capítulo %d de %d (%s): %s", narracion.narrador_id[:8], cap.numero, total, cap.modo, cap.nombre)
        t0 = time.time()
        base = carpeta / f"cap_{cap.numero:02d}"
        piezas = piezas_de_capitulo(sb, cap, motor, referencia, referencia_texto, carpeta, modelos, log)
        # Masterizar (directivas 01 y 02): las reales se restauran y se les
        # arregla el ritmo; todo se iguala al sonido del narrador, se pega con
        # las pausas de `historia` y se normaliza a −19 LUFS.
        master_wav = base.with_suffix(".master.wav")
        medido = masterizar_capitulo(
            cap.numero, piezas, master_wav, objetivo, log=log.info,
            restaurador=lambda e, s, log=None: restaurador(e, s, log=log, modelos=modelos),
            transcriptor=transcriptor, cache=carpeta / "whisper", modo=cap.modo,
        )
        agregar_a_master(master_json, medido, libro=libro)
        mp3 = a_mp3(master_wav, base.with_suffix(".mp3"))
        # Los wav pesan decenas de MB por capítulo y ya no sirven: con el mp3
        # hecho se borran. El mp3, los txt y los logs quedan para mirar si algo sonó mal.
        master_wav.unlink()
        for pieza in piezas:
            if pieza.tipo != "real" and pieza.ruta.suffix == ".wav":
                pieza.ruta.unlink(missing_ok=True)
        # El mp3 es lo que importa: si no sube, el capítulo falla y se reintenta.
        sb.storage.from_(BUCKET).upload(ruta, mp3.read_bytes(), {"content-type": "audio/mpeg", "upsert": "true"})
        acumulado.append(ruta)
        marcar(sb, narracion.id, "procesando", capitulos_paths=list(acumulado))
        # master.json va al lado, después del checkpoint y con reintentos: si no
        # sube, se pierde una medición, no un capítulo (revisión 03c).
        if not subir_con_reintentos(sb, ruta_master, master_json.read_bytes(), {"content-type": "application/json", "upsert": "true"}, log):
            log.warning("master.json no se pudo subir; sigue local en %s", master_json)
        log.info("capítulo %d (%s) listo en %.0f s → %s", cap.numero, cap.modo, time.time() - t0, ruta)
    return acumulado
