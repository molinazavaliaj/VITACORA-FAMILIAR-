"""La config arranca sin MOTOR y no se traba con las variables de un `.env` viejo."""

from voz import config as c


def test_arranca_sin_motor_y_con_variables_viejas_de_mas(monkeypatch):
    monkeypatch.setattr(c, "load_dotenv", lambda *a, **k: None)  # que no lea el .env de la máquina
    monkeypatch.setenv("SUPABASE_URL", "https://ejemplo.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "clave-de-prueba")
    monkeypatch.setenv("MOTOR", "qwen3tts")  # de cuando había audiolibro: se ignora
    monkeypatch.setenv("PAUSAS_MS", "coma=250")
    monkeypatch.setenv("INTERVALO_SEGUNDOS", "15")

    config = c.cargar_config()

    assert config.intervalo_segundos == 15
    assert not hasattr(config, "motor")


def test_sin_motor_tampoco_falta_nada(monkeypatch):
    monkeypatch.setattr(c, "load_dotenv", lambda *a, **k: None)
    monkeypatch.setenv("SUPABASE_URL", "https://ejemplo.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "clave-de-prueba")
    monkeypatch.delenv("MOTOR", raising=False)

    assert c.cargar_config().supabase_url == "https://ejemplo.supabase.co"
