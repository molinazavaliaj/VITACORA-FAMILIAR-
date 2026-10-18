"""La prueba de que la copia de los archivos sirve (18/10).

Una copia que nunca se probó no se sabe si sirve. Esto agarra archivos al azar de
la copia en Cloudflare R2, baja el mismo archivo de Supabase y compara los dos byte
por byte (sha256). Corre una vez por mes sola (GitHub Actions) y avisa a los socios
si alguno no coincide.

    python copias/verificar.py            # 25 archivos al azar
    python copias/verificar.py --cuantos 100
"""

import argparse
import hashlib
import random
import sys
import urllib.parse

from copiar import avisar, boto3, Config, supabase, variable, BASE

sys.stdout.reconfigure(encoding="utf-8")


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--cuantos", type=int, default=25)
    a = p.parse_args()

    balde = variable("R2_BUCKET", "vitacora-copia-audios")
    r2 = boto3.client(
        "s3", endpoint_url=variable("R2_ENDPOINT"), region_name="auto",
        aws_access_key_id=variable("R2_ACCESS_KEY_ID"), aws_secret_access_key=variable("R2_SECRET_ACCESS_KEY"),
        config=Config(retries={"max_attempts": 5, "mode": "standard"}),
    )
    claves = [o["Key"] for pag in r2.get_paginator("list_objects_v2").paginate(Bucket=balde)
              for o in pag.get("Contents", [])
              if not o["Key"].startswith("_control/") and not BASE.search(o["Key"])]
    muestra = random.sample(claves, min(a.cuantos, len(claves)))

    iguales, distintos, ya_no_estan = 0, [], 0
    for clave in muestra:
        bucket, ruta = clave.split("/", 1)
        copia = r2.get_object(Bucket=balde, Key=clave)["Body"].read()
        try:
            original = supabase("GET", f"/storage/v1/object/{bucket}/{urllib.parse.quote(ruta)}")
        except Exception:
            ya_no_estan += 1  # se borró en Supabase: la copia lo guarda sus 30 días, no es un error
            continue
        if hashlib.sha256(copia).digest() == hashlib.sha256(original).digest():
            iguales += 1
        else:
            distintos.append(f"{clave} (copia {len(copia)} bytes, original {len(original)} bytes)")

    print(f"en la copia: {len(claves)} archivos | revisados: {len(muestra)} | idénticos: {iguales} | "
          f"distintos: {len(distintos)} | ya borrados en Supabase: {ya_no_estan}")
    for d in distintos:
        print("  DISTINTO", d)
    if distintos or (muestra and iguales == 0):
        avisar("la copia de los archivos no coincide",
               f"La prueba mensual comparó {len(muestra)} archivos de la copia de Cloudflare R2 con Supabase y "
               f"{len(distintos)} no son iguales.\n\n" + "\n".join(distintos[:20]) +
               "\n\nEl detalle está en GitHub, Actions, «Verificar la copia de archivos».")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
