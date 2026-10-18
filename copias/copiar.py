"""La copia diaria de los archivos de Supabase en Cloudflare R2 (18/10).

Supabase Pro copia la base todos los días, pero NO los archivos de Storage (los
audios de las entrevistas, las fotos, los PDF). Un audio borrado no vuelve con
el Restore. Este programa copia cada archivo de cada bucket a R2, en otra
empresa, con la misma ruta: `<bucket>/<ruta>`.

Reglas:
- Nunca borra nada en R2. Si en Supabase se borra un archivo, la copia queda.
- Si un archivo cambió (otro tamaño), la versión nueva va al lado de la vieja
  (`<ruta>@<fecha>`), así ninguna se pisa.
- Si algo falla, avisa por mail a los socios (MAIL_SOCIOS por Resend) y sale con
  error, así GitHub lo marca en rojo.
- Nunca imprime una clave.

Variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, R2_ENDPOINT,
R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET (por defecto
vitacora-copia-audios), RESEND_API_KEY y MAIL_SOCIOS (para el aviso).

    python copias/copiar.py            # copia lo que falta
    python copias/copiar.py --probar   # solo cuenta qué copiaría, no sube nada
"""

import argparse
import datetime as dt
import json
import os
import re
import sys
import urllib.parse
import urllib.request

import boto3
from botocore.config import Config

sys.stdout.reconfigure(encoding="utf-8")


def variable(nombre: str, defecto: str | None = None) -> str:
    valor = (os.environ.get(nombre) or "").strip() or defecto
    if not valor:
        raise SystemExit(f"Falta la variable {nombre}.")
    return valor


def supabase(metodo: str, ruta: str, cuerpo: dict | None = None) -> bytes:
    url = variable("SUPABASE_URL").rstrip("/") + ruta
    clave = variable("SUPABASE_SERVICE_ROLE_KEY")
    datos = json.dumps(cuerpo).encode() if cuerpo is not None else None
    req = urllib.request.Request(url, data=datos, method=metodo, headers={
        "apikey": clave, "Authorization": f"Bearer {clave}", "Content-Type": "application/json",
    })
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


def archivos_de(bucket: str, prefijo: str = "") -> list[tuple[str, int]]:
    """Todos los archivos del bucket (ruta, tamaño), entrando en las carpetas."""
    salida: list[tuple[str, int]] = []
    desde = 0
    while True:
        items = json.loads(supabase("POST", f"/storage/v1/object/list/{bucket}",
                                    {"prefix": prefijo, "limit": 1000, "offset": desde}))
        for it in items:
            if it.get("id") is None:  # es una carpeta
                salida.extend(archivos_de(bucket, f"{prefijo}{it['name']}/"))
            else:
                salida.append((f"{prefijo}{it['name']}", int((it.get("metadata") or {}).get("size") or 0)))
        if len(items) < 1000:
            return salida
        desde += 1000


def ya_copiados(r2, balde: str) -> dict[str, int]:
    hay: dict[str, int] = {}
    for pagina in r2.get_paginator("list_objects_v2").paginate(Bucket=balde):
        for o in pagina.get("Contents", []):
            hay[o["Key"]] = o["Size"]
    return hay


def avisar(asunto: str, detalle: str) -> None:
    clave = (os.environ.get("RESEND_API_KEY") or "").strip()
    para = [m.strip() for m in (os.environ.get("MAIL_SOCIOS") or "").split(",") if m.strip()]
    if not clave or not para:
        print("aviso: sin RESEND_API_KEY o MAIL_SOCIOS, queda solo en este log.")
        return
    cuerpo = json.dumps({
        "from": os.environ.get("MAIL_FROM") or "Vitácora Familiar <hola@vitacorafamiliar.com>",
        "to": para, "subject": f"[Vitácora copias] {asunto}", "text": detalle,
    }).encode()
    req = urllib.request.Request("https://api.resend.com/emails", data=cuerpo, method="POST", headers={
        "Authorization": f"Bearer {clave}", "Content-Type": "application/json", "User-Agent": "vitacora-copias/1.0",
    })
    try:
        urllib.request.urlopen(req, timeout=30).read()
    except Exception as e:  # el aviso nunca tapa el error de verdad
        print(f"aviso: no pude mandar el mail ({type(e).__name__}).")


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--probar", action="store_true", help="solo cuenta, no sube nada")
    a = p.parse_args()

    balde = variable("R2_BUCKET", "vitacora-copia-audios")
    r2 = boto3.client(
        "s3", endpoint_url=variable("R2_ENDPOINT"), region_name="auto",
        aws_access_key_id=variable("R2_ACCESS_KEY_ID"), aws_secret_access_key=variable("R2_SECRET_ACCESS_KEY"),
        config=Config(retries={"max_attempts": 5, "mode": "standard"}),
    )
    hay = ya_copiados(r2, balde)
    # Qué tamaños hay copiados de cada archivo, contando las versiones `@fecha`.
    tamanos: dict[str, set[int]] = {}
    for k, t in hay.items():
        tamanos.setdefault(re.sub(r"@\d{4}-\d{2}-\d{2}$", "", k), set()).add(t)
    hoy = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d")

    buckets = [b["name"] for b in json.loads(supabase("GET", "/storage/v1/bucket"))]
    nuevos = cambiados = iguales = 0
    bytes_subidos = 0
    errores: list[str] = []
    total = 0
    for bucket in buckets:
        for ruta, tam in archivos_de(bucket):
            total += 1
            clave = f"{bucket}/{ruta}"
            if tam in tamanos.get(clave, set()):  # esta versión ya está copiada
                iguales += 1
                continue
            destino = clave if clave not in hay else f"{clave}@{hoy}"
            if a.probar:
                nuevos += clave not in hay
                cambiados += clave in hay
                continue
            try:
                ruta_url = urllib.parse.quote(ruta)
                datos = supabase("GET", f"/storage/v1/object/{bucket}/{ruta_url}")
                r2.put_object(Bucket=balde, Key=destino, Body=datos)
                bytes_subidos += len(datos)
                if clave in hay:
                    cambiados += 1
                else:
                    nuevos += 1
            except Exception as e:
                errores.append(f"{clave}: {type(e).__name__} {str(e)[:150]}")

    verbo = "copiaría" if a.probar else "copió"
    print(f"buckets: {', '.join(buckets)}")
    print(f"archivos en Supabase: {total} | ya estaban: {iguales} | {verbo} nuevos: {nuevos} | "
          f"{verbo} versiones nuevas: {cambiados} | subido: {bytes_subidos / 1e6:.1f} MB | errores: {len(errores)}")
    if errores:
        for e in errores[:20]:
            print("  ERROR", e)
        avisar(f"falló la copia de {len(errores)} archivos",
               f"La copia diaria de los archivos de Supabase a Cloudflare R2 no pudo copiar {len(errores)} "
               f"de {total} archivos.\n\nLos primeros:\n" + "\n".join(errores[:20]) +
               "\n\nEl detalle está en GitHub, Actions, «Copia diaria de archivos».")
        return 1
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except SystemExit:
        raise
    except Exception as e:
        print(f"La copia se cortó: {type(e).__name__} {str(e)[:300]}")
        avisar("la copia diaria se cortó", f"La copia diaria de los archivos a Cloudflare R2 se cortó antes de terminar.\n\n"
               f"{type(e).__name__}: {str(e)[:300]}\n\nEl detalle está en GitHub, Actions, «Copia diaria de archivos».")
        sys.exit(1)
