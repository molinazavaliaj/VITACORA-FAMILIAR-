"""Lo que hace el worker con una narración tomada: preparar la voz del
narrador y narrar el libro capítulo por capítulo, subiendo cada mp3 apenas
sale y anotando en la fila cuáles ya están.

Ese anotar es la reanudación: si el worker se cae a mitad de un libro, al
retomar recibe `capitulos_paths` con lo que ya se subió y saltea esos
capítulos. Un capítulo con el motor real tarda minutos; perder ocho por un
corte de luz no.
"""

from pathlib import Path

from .audio import a_mp3
from .buzon import Narracion, marcar
from .libro import Capitulo, ruta_capitulo, texto_a_narrar
from .masterizar import Pieza, agregar_a_master, masterizar_capitulo, objetivo_de
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
) -> list[str]:
    """Narra cada capítulo en orden y sube su mp3 a `{narrador}/voz/cap_NN.mp3`.

    Después de cada subida marca la fila con la lista acumulada
    (`capitulos_paths`): ese es el checkpoint. Los que ya vienen en
    `ya_subidos` se saltean pero quedan en la lista que se devuelve, así el
    resultado siempre es el libro completo en orden.
    """
    acumulado: list[str] = []
    total = len(capitulos)
    # El sonido objetivo del master es la voz real del narrador: las muestras
    # limpias que dejó preparar_voz. Si no están (tests), cada capítulo se
    # iguala a sí mismo.
    limpias = sorted((carpeta / "limpias").glob("*.wav")) if (carpeta / "limpias").is_dir() else []
    objetivo = objetivo_de(limpias) if limpias else None
    master_json = carpeta / "master.json"
    ruta_master = f"{narracion.narrador_id}/voz/master.json"
    for cap in capitulos:
        ruta = ruta_capitulo(narracion.narrador_id, cap.numero)
        if ruta in ya_subidos:
            log.info("capítulo %d ya estaba, lo salteo", cap.numero)
            acumulado.append(ruta)
            continue

        log.info("narrando a %s, capítulo %d de %d: %s", narracion.narrador_id[:8], cap.numero, total, cap.nombre)
        base = carpeta / f"cap_{cap.numero:02d}"
        texto = base.with_suffix(".txt")
        wav = base.with_suffix(".wav")
        # Con el anuncio adelante ("Capítulo dos. Las raíces."): en el audiolibro
        # clonado no suena ninguna voz que no sea la del narrador (CONTRATO).
        texto.write_text(texto_a_narrar(cap), encoding="utf-8")
        ok, segundos, cola = correr_motor_subprocess(
            motor, referencia, referencia_texto, texto, wav, modelos, base.with_suffix(".log")
        )
        if not ok:
            raise RuntimeError(f"el motor {motor} falló en el capítulo {cap.numero} a los {segundos:.0f} s:\n{cola}")
        # Masterizar (central 19/09): limpieza, igualación al sonido del narrador,
        # loudnorm a −19 LUFS. El capítulo clonado es una sola pieza: el motor ya
        # puso las pausas por puntuación adentro.
        master_wav = base.with_suffix(".master.wav")
        medido = masterizar_capitulo(cap.numero, [Pieza(wav, f"cap_{cap.numero:02d}", "clonado")], master_wav, objetivo, log=log.info)
        agregar_a_master(master_json, medido, libro={"narracion": narracion.id, "narrador": narracion.narrador_id, "motor": motor})
        mp3 = a_mp3(master_wav, base.with_suffix(".mp3"))
        # Los wav pesan decenas de MB por capítulo y ya no sirven: con el mp3
        # hecho se borran. El mp3 y el txt quedan para mirar si algo sonó mal.
        wav.unlink()
        master_wav.unlink()
        sb.storage.from_(BUCKET).upload(ruta, mp3.read_bytes(), {"content-type": "audio/mpeg", "upsert": "true"})
        # master.json va al lado de los mp3, actualizado capítulo a capítulo.
        sb.storage.from_(BUCKET).upload(ruta_master, master_json.read_bytes(), {"content-type": "application/json", "upsert": "true"})
        acumulado.append(ruta)
        marcar(sb, narracion.id, "procesando", capitulos_paths=list(acumulado))
        log.info("capítulo %d listo en %.0f s → %s", cap.numero, segundos, ruta)
    return acumulado
