"""La copia diaria de los archivos de Supabase en Cloudflare R2 (18/10).

Supabase Pro copia la base todos los días, pero NO los archivos de Storage (los
audios de las entrevistas, las fotos, los PDF). Un audio borrado no vuelve con
el Restore. Este programa copia cada archivo de cada bucket a R2, en otra
empresa, con la misma ruta: `<bucket>/<ruta>`.

Reglas:
- Si en Supabase se borra un archivo, la copia lo guarda 30 días más (por si fue un
  error) y después lo borra también. Así la copia no guarda lo que los términos
  prometen borrar (audios a los 3 meses, todo si la familia lo pide). Lo que falta
  y desde cuándo se anota en `_control/borrados.json` dentro de R2.
- Si un día desaparecen muchos archivos juntos, avisa a los socios: puede ser un
  borrado por error y hay 30 días para recuperarlo de la copia.
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


DIAS_GRACIA = 30
CONTROL = "_control/borrados.json"
BASE = re.compile(r"@\d{4}-\d{2}-\d{2}$")


def base_de(clave: str) -> str:
    return BASE.sub("", clave)


def planear_borrados(copiados: set[str], presentes: set[str], anotados: dict[str, str], hoy: dt.date,
                     gracia: int = DIAS_GRACIA) -> tuple[dict[str, str], list[str], list[str]]:
    """Puro. Devuelve (anotados nuevos, archivos a borrar de R2, recién desaparecidos).

    `copiados`: las claves que hay en R2 (con sus versiones @fecha). `presentes`: las de Supabase hoy.
    `anotados`: archivo base -> día en que se vio que faltaba."""
    bases = {base_de(k) for k in copiados if not k.startswith("_control/")}
    nuevos: dict[str, str] = {}
    recien: list[str] = []
    vencidos: set[str] = set()
    for b in sorted(bases):
        if b in presentes:
            continue  # volvió o nunca se fue: deja de estar anotado
        desde = anotados.get(b)
        if desde is None:
            nuevos[b] = hoy.isoformat()
            recien.append(b)
        elif (hoy - dt.date.fromisoformat(desde)).days >= gracia:
            vencidos.add(b)
        else:
            nuevos[b] = desde
    a_borrar = sorted(k for k in copiados if base_de(k) in vencidos)
    return nuevos, a_borrar, recien


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

    # Lo que ya no está en Supabase: 30 días de gracia y después se borra también de la copia.
    # Solo si la lista de Supabase salió entera (si falló, archivos_de tiró antes de llegar acá).
    presentes = {f"{b}/{r}" for b in buckets for r, _ in archivos_de(b)}
    try:
        anotados = json.loads(r2.get_object(Bucket=balde, Key=CONTROL)["Body"].read())
    except r2.exceptions.NoSuchKey:
        anotados = {}
    nuevos_anotados, a_borrar, recien = planear_borrados(set(hay), presentes, anotados,
                                                          dt.datetime.now(dt.timezone.utc).date())
    if not a.probar:
        for i in range(0, len(a_borrar), 1000):
            r2.delete_objects(Bucket=balde, Delete={"Objects": [{"Key": k} for k in a_borrar[i:i + 1000]]})
        r2.put_object(Bucket=balde, Key=CONTROL, Body=json.dumps(nuevos_anotados, indent=1).encode(),
                      ContentType="application/json")
    if len(recien) >= 20:
        avisar(f"desaparecieron {len(recien)} archivos de Supabase",
               f"Hoy faltan en Supabase {len(recien)} archivos que ayer estaban. Si lo borraron ustedes a propósito, "
               f"no hay que hacer nada. Si no, la copia de Cloudflare R2 los guarda {DIAS_GRACIA} días más y "
               f"después los borra.\n\nLos primeros:\n" + "\n".join(recien[:20]))

    verbo = "copiaría" if a.probar else "copió"
    print(f"buckets: {', '.join(buckets)}")
    print(f"archivos en Supabase: {total} | ya estaban: {iguales} | {verbo} nuevos: {nuevos} | "
          f"{verbo} versiones nuevas: {cambiados} | subido: {bytes_subidos / 1e6:.1f} MB | errores: {len(errores)}")
    print(f"borrados en Supabase: {len(recien)} nuevos, {len(nuevos_anotados)} esperando sus {DIAS_GRACIA} días | "
          f"{'borraría' if a.probar else 'borró'} de la copia: {len(a_borrar)}")
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
