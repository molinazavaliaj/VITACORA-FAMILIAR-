"""Lee deploys y logs de la fábrica en Railway sin el CLI (que Windows bloquea
en la PC de Naza desde el 18/09). Usa el token de PROYECTO que está en
`fabrica/.env` como `RAILWAY_API_TOKEN` (proyecto fearless-kindness, producción):
solo ve ese proyecto, no la cuenta.

    python scripts/railway-logs.py                 # últimos 3 deploys + 40 líneas del activo
    python scripts/railway-logs.py --lineas 200    # más líneas
    python scripts/railway-logs.py --servicio VITACORA-FAMILIAR-   # el entrevistador
    python scripts/railway-logs.py --buscar "generarPaquete"      # filtra por texto

Esconde el ruido de PGRST205 y los stack traces ("    at ...").
"""
import argparse
import json
import os
import sys
import urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

PROYECTO = "6be71d28-d1f2-4f30-989c-d997a2de58f9"
ENTORNO = "012b3346-855e-4fd0-93e3-53e249f660fc"
API = "https://backboard.railway.com/graphql/v2"


def token() -> str:
    t = os.environ.get("RAILWAY_API_TOKEN")
    if not t:
        for linea in (Path(__file__).resolve().parent.parent / ".env").read_text(encoding="utf-8").splitlines():
            if linea.startswith("RAILWAY_API_TOKEN="):
                t = linea.split("=", 1)[1]
    if not t:
        sys.exit("Falta RAILWAY_API_TOKEN (en fabrica/.env o en el entorno).")
    return t.strip().strip('"')


def gql(query: str, variables: dict | None = None) -> dict:
    cuerpo = json.dumps({"query": query, "variables": variables or {}}).encode()
    req = urllib.request.Request(
        API,
        data=cuerpo,
        headers={"Project-Access-Token": token(), "Content-Type": "application/json", "User-Agent": "vitacora-fabrica/1.0"},
    )
    r = json.load(urllib.request.urlopen(req, timeout=30))
    if "errors" in r:
        sys.exit("Railway: " + "; ".join(e.get("message", "?") for e in r["errors"]))
    return r["data"]


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--servicio", default="dazzling-friendship")
    p.add_argument("--lineas", type=int, default=40)
    p.add_argument("--buscar", default="")
    p.add_argument("--deploy", default="", help="id de un deploy anterior (por defecto el más nuevo)")
    a = p.parse_args()

    servicios = {
        e["node"]["name"]: e["node"]["id"]
        for e in gql("query($p:String!){ project(id:$p){ services{ edges{ node{ id name } } } } }", {"p": PROYECTO})["project"]["services"]["edges"]
    }
    if a.servicio not in servicios:
        sys.exit(f"Servicio {a.servicio!r} no está; hay: {', '.join(servicios)}")

    deploys = [
        e["node"]
        for e in gql(
            "query($p:String!,$e:String!,$s:String!){ deployments(input:{projectId:$p,environmentId:$e,serviceId:$s}, first:3){ edges{ node{ id status createdAt meta } } } }",
            {"p": PROYECTO, "e": ENTORNO, "s": servicios[a.servicio]},
        )["deployments"]["edges"]
    ]
    print(f"== {a.servicio}: últimos deploys ==")
    for d in deploys:
        print(f"  {d['id'][:8]}  {d['status']:8}  {d['createdAt'][:16]}  {(d.get('meta') or {}).get('commitMessage', '')[:70]}")
    if not deploys:
        return

    deploy = a.deploy or deploys[0]["id"]
    logs = gql("query($d:String!,$n:Int!){ deploymentLogs(deploymentId:$d, limit:$n){ timestamp message severity } }", {"d": deploy, "n": a.lineas})["deploymentLogs"]
    print(f"== logs de {deploy[:8]} (sin ruido) ==")
    for l in logs:
        m = l["message"]
        if "PGRST205" in m or m.startswith("    at"):
            continue
        if a.buscar and a.buscar.lower() not in m.lower():
            continue
        print(f"  {l['timestamp'][:19]}  {m[:300]}")


if __name__ == "__main__":
    main()
