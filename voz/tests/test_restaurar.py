"""restaurar (directiva 02 A) sin GPU: el nivel desde .env, la medición de
calidad sobre audio sintético, y el contrato del subprocess con un corredor
falso en lugar del venv de resemble-enhance."""

import sys

import numpy as np
import pytest
import soundfile as sf

import voz.restaurar as r
from voz.restaurar import Calidad, medir_calidad, nivel_de_restauracion, restaurar

SR = 24000


def _voz(segundos: float, ruido: float, brillo: float) -> np.ndarray:
    t = np.arange(int(SR * segundos)) / SR
    rng = np.random.default_rng(1)
    # sílabas con silencio real entre medio, pero con subida suave: un gate cuadrado esparce energía hasta Nyquist
    silabas = np.clip(np.sin(2 * np.pi * 1.5 * t) * 3.0, 0.0, 1.0).astype(np.float32)
    voz = 0.3 * silabas * (np.sin(2 * np.pi * 160 * t) + 0.4 * np.sin(2 * np.pi * 320 * t) + brillo * np.sin(2 * np.pi * 6000 * t))
    return (voz + ruido * rng.standard_normal(len(t))).astype(np.float32)


def test_nivel_desde_env_con_default_y_tope():
    assert nivel_de_restauracion({}) == r.RESTAURACION_NIVEL_DEFAULT
    assert nivel_de_restauracion({"RESTAURACION_NIVEL": "0.6"}) == 0.6
    assert nivel_de_restauracion({"RESTAURACION_NIVEL": "7"}) == 1.0
    assert nivel_de_restauracion({"RESTAURACION_NIVEL": "-1"}) == 0.0
    assert nivel_de_restauracion({"RESTAURACION_NIVEL": "abc"}) == r.RESTAURACION_NIVEL_DEFAULT


def test_medir_calidad_ve_el_ruido_y_el_ancho_de_banda():
    sucia = medir_calidad(_voz(6.0, ruido=0.01, brillo=0.0), SR)
    limpia = medir_calidad(_voz(6.0, ruido=0.0005, brillo=0.0), SR)
    assert isinstance(sucia, Calidad)
    assert limpia.ruido_dbfs < sucia.ruido_dbfs - 15
    assert limpia.snr_db > sucia.snr_db
    # ancho de banda: la que tiene un armónico en 6 kHz llega más lejos. Sin ruido:
    # el ruido blanco sintético, aun bajo, llena todo el espectro (en una nota de
    # WhatsApp real el criterio da ~8,7 kHz, el techo del Opus a 16 kbps).
    opaca = medir_calidad(_voz(6.0, ruido=0.0, brillo=0.0), SR)
    brillante = medir_calidad(_voz(6.0, ruido=0.0, brillo=0.5), SR)
    assert brillante.ancho_banda_khz > opaca.ancho_banda_khz
    assert medir_calidad(np.zeros(100, dtype=np.float32), SR).ancho_banda_khz == 0.0


def test_restaurar_llama_al_corredor_del_venv_y_mide_antes_y_despues(tmp_path, monkeypatch):
    entrada = tmp_path / "in.wav"
    sf.write(str(entrada), _voz(4.0, ruido=0.02, brillo=0.0), SR)
    salida = tmp_path / "out.wav"
    # corredor falso: escribe una versión "limpia" y anota con qué lo llamaron
    falso = tmp_path / "corredor.py"
    falso.write_text(
        "import sys, numpy as np, soundfile as sf\n"
        "args = dict(zip(sys.argv[1::2], sys.argv[2::2]))\n"
        "a, sr = sf.read(args['--entrada'], dtype='float32')\n"
        "sf.write(args['--salida'], a * 0.5, 44100, subtype='FLOAT')\n"
        "print('corredor falso nivel', args['--nivel'])\n",
        encoding="utf-8",
    )
    monkeypatch.setattr(r, "python_de_restaurar", lambda: sys.executable)
    monkeypatch.setattr(r, "RAIZ", tmp_path)
    (tmp_path / "herramientas" / "restaurar").mkdir(parents=True)
    (tmp_path / "herramientas" / "restaurar" / "restaurar.py").write_text(falso.read_text(encoding="utf-8"), encoding="utf-8")

    registro = tmp_path / "restaurar.log"
    resultado = restaurar(entrada, salida, nivel=0.7, registro=registro)

    assert salida.exists()
    assert resultado["nivel"] == 0.7
    assert set(resultado["antes"]) == set(resultado["despues"]) == {"ruido_dbfs", "voz_dbfs", "snr_db", "ancho_banda_khz"}
    assert "corredor falso nivel 0.70" in registro.read_text(encoding="utf-8")


def test_restaurar_explota_claro_si_el_corredor_falla(tmp_path, monkeypatch):
    entrada = tmp_path / "in.wav"
    sf.write(str(entrada), _voz(2.0, ruido=0.01, brillo=0.0), SR)
    monkeypatch.setattr(r, "python_de_restaurar", lambda: sys.executable)
    monkeypatch.setattr(r, "RAIZ", tmp_path)
    (tmp_path / "herramientas" / "restaurar").mkdir(parents=True)
    (tmp_path / "herramientas" / "restaurar" / "restaurar.py").write_text("raise SystemExit('sin GPU')\n", encoding="utf-8")
    with pytest.raises(RuntimeError, match="restaurar falló"):
        restaurar(entrada, tmp_path / "out.wav", nivel=0.5)


def test_nivel_cero_no_toca_nada_y_no_necesita_el_venv(tmp_path, monkeypatch):
    # Revisión 03a: RESTAURACION_NIVEL=0 tiene que apagar la restauración sin venv ni torch.
    entrada = tmp_path / "in.wav"
    sf.write(str(entrada), _voz(2.0, ruido=0.01, brillo=0.0), SR)
    monkeypatch.setattr(r, "python_de_restaurar", lambda: (_ for _ in ()).throw(FileNotFoundError("no hay venv")))
    resultado = restaurar(entrada, tmp_path / "out.wav", nivel=0.0)
    assert (tmp_path / "out.wav").exists()
    assert resultado["nivel"] == 0.0 and resultado["antes"] == resultado["despues"]
    a, sr = sf.read(str(tmp_path / "out.wav"))
    assert sr == 44100


def test_modelos_va_como_hf_home_al_corredor(tmp_path, monkeypatch):
    # Revisión 03f: HF_HOME sale de CARPETA_MODELOS, no de una ruta fija.
    entrada = tmp_path / "in.wav"
    sf.write(str(entrada), _voz(2.0, ruido=0.01, brillo=0.0), SR)
    visto = {}
    corredor = tmp_path / "herramientas" / "restaurar" / "restaurar.py"
    corredor.parent.mkdir(parents=True)
    corredor.write_text(
        "import os, sys, soundfile as sf\n"
        "args = dict(zip(sys.argv[1::2], sys.argv[2::2]))\n"
        "a, sr = sf.read(args['--entrada'], dtype='float32'); sf.write(args['--salida'], a, 44100, subtype='FLOAT')\n"
        "print('HF_HOME=' + os.environ.get('HF_HOME', ''))\n",
        encoding="utf-8",
    )
    monkeypatch.setattr(r, "python_de_restaurar", lambda: sys.executable)
    monkeypatch.setattr(r, "RAIZ", tmp_path)
    registro = tmp_path / "log.txt"
    restaurar(entrada, tmp_path / "out.wav", nivel=0.5, registro=registro, modelos=tmp_path / "modelos")
    assert f"HF_HOME={tmp_path / 'modelos'}" in registro.read_text(encoding="utf-8")
