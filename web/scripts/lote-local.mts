// Locales (regalo en locales, 17/10): da de alta un local y genera el lote de
// cartas para imprimir.
//
//   npx tsx scripts/lote-local.mts crear-local --nombre "Copistería Berga" --pais ES --idioma ca [--contacto "…"]
//   npx tsx scripts/lote-local.mts lote --local <uuid> --cantidad 10
//
// Necesita SUPABASE_SERVICE_ROLE_KEY en web/.env.local. El lote queda en
// scripts/salida/ (ignorada por git). Solo imports relativos: tsx no resuelve `@/`.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { generarCodigo } from "../src/lib/regalo";
import { qrDataUri, urlRegalo } from "../src/lib/qr";
import { armarHojaLote } from "../src/lib/lote-imprimible";
import type { IdiomaRegalo } from "../src/lib/regalo-textos";

const USO = `Uso:
  npx tsx scripts/lote-local.mts crear-local --nombre "…" --pais ES|AR --idioma es-AR|es-ES|ca [--contacto "…"]
  npx tsx scripts/lote-local.mts lote --local <uuid> --cantidad 10`;

function fallar(mensaje: string): never {
  console.error(mensaje);
  process.exit(1);
}

/** Lee `--clave valor` de los argumentos. */
function opciones(args: string[]): Record<string, string> {
  const o: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--") && args[i + 1] !== undefined) o[args[i].slice(2)] = args[++i];
  }
  return o;
}

const [comando, ...resto] = process.argv.slice(2);
if (comando !== "crear-local" && comando !== "lote") fallar(USO);
const opt = opciones(resto);

const IDIOMAS: IdiomaRegalo[] = ["es-AR", "es-ES", "ca"];
if (comando === "crear-local") {
  if (!opt.nombre || (opt.pais !== "ES" && opt.pais !== "AR") || !IDIOMAS.includes(opt.idioma as IdiomaRegalo)) fallar(USO);
} else {
  const cant = Number(opt.cantidad);
  if (!opt.local || !Number.isInteger(cant) || cant < 1) fallar(USO);
}

// Carga de web/.env.local, como scripts/codigo-local.mts.
const rutaEnv = new URL("../.env.local", import.meta.url);
if (!existsSync(rutaEnv)) fallar("No encuentro web/.env.local (necesito NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY).");
for (const linea of readFileSync(rutaEnv, "utf8").split("\n")) {
  const m = linea.match(/^\s*([A-Z_]+)\s*=\s*(.*)$/);
  if (m && m[2]) process.env[m[1]] ??= m[2].trim();
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !clave) fallar("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en web/.env.local");
const admin = createClient(url, clave, { auth: { autoRefreshToken: false, persistSession: false } });
const URL_BASE = process.env.URL_BASE || "https://www.vitacorafamiliar.com";

if (comando === "crear-local") {
  const token = randomBytes(24).toString("base64url");
  const { data, error } = await admin
    .from("locales")
    .insert({ nombre: opt.nombre, pais: opt.pais, idioma: opt.idioma, contacto: opt.contacto ?? null, token_panel: token })
    .select("id")
    .single();
  if (error || !data) fallar(`No pude crear el local: ${error?.message ?? "sin respuesta"}`);
  console.log(`\n  Local creado: ${data.id}`);
  console.log(`  Panel:        ${URL_BASE}/local/${token}\n`);
} else {
  const cantidad = Number(opt.cantidad);
  const { data: local, error: errLocal } = await admin.from("locales").select("id, idioma").eq("id", opt.local).maybeSingle();
  if (errLocal || !local) fallar(`No encuentro el local ${opt.local}${errLocal ? `: ${errLocal.message}` : ""}`);
  const idioma = local.idioma as IdiomaRegalo;

  const { data: lote, error: errLote } = await admin
    .from("lotes_impresos")
    .insert({ local_id: local.id, idioma, cantidad })
    .select("id")
    .single();
  if (errLote || !lote) fallar(`No pude crear el lote: ${errLote?.message ?? "sin respuesta"}`);

  const cartas: { codigo: string; qr: string }[] = [];
  for (let n = 0; n < cantidad; n++) {
    let codigo: string | null = null;
    for (let intento = 0; intento < 5 && !codigo; intento++) {
      const candidato = generarCodigo();
      const { error } = await admin.from("codigos_impresos").insert({ codigo: candidato, lote_id: lote.id });
      if (!error) codigo = candidato;
      else if (error.code !== "23505") fallar(`No pude guardar un código: ${error.message}`);
    }
    if (!codigo) fallar("No logré un código libre en 5 intentos.");
    cartas.push({ codigo, qr: await qrDataUri(urlRegalo(codigo)) });
  }

  const carpeta = fileURLToPath(new URL("./salida/", import.meta.url));
  mkdirSync(carpeta, { recursive: true });
  const fecha = new Date().toISOString().slice(0, 10);
  const ruta = `${carpeta}lote-${fecha}-${String(local.id).slice(0, 8)}.html`;
  writeFileSync(ruta, armarHojaLote(cartas, idioma));
  console.log(`\n  ${cantidad} cartas guardadas. Abrilo en el navegador e imprimilo a doble faz (borde largo):\n  ${ruta}\n`);
}
