// Prende la venta de Vitácora Kids (Naza, 20/10), sin mostrar ningún valor secreto.
//
//   node web/scripts/prender-kids.mjs                 → prende Kids en Argentina
//   node web/scripts/prender-kids.mjs espana          → suma España y catalán (20/10: las 39 plantillas aprobadas en Meta)
//   node web/scripts/prender-kids.mjs probar          → solo cuenta qué haría (también: probar espana)
//
// Qué hace:
//   - Railway, bot: WA_PLANTILLAS_KIDS_LISTAS = las 13 plantillas de Kids en rioplatense (aprobadas en Meta).
//     Las de España y catalán (_es_es, _ca) no se suman hasta que Joaquín confirme que Meta las aprobó.
//   - Railway, fábrica: ESCRITOR_KIDS=1 (el libro de Kids se escribe solo al cerrar).
//   - Vercel, Production y Preview: KIDS_VENTA=1 y PRECIO_KIDS_ARS = el libro digital de Familiar ($ 85.750).
//     Sin PRECIO_KIDS_EUR, España todavía no vende Kids (lib/kids.ts: sin precio de la región, no vende).
//   - Pide un deploy nuevo de vitacorafamiliar.com y de la página de prueba.
//
// Las claves salen del login de la CLI de Vercel y de RAILWAY_API_TOKEN en fabrica/.env de la carpeta principal.

import { execFileSync, execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const probar = process.argv.includes("probar");
const espana = process.argv.includes("espana");
// España y catalán (20/10): las 13 plantillas de cada idioma ya aprobadas en Meta (_es_es y _ca). Precio = el
// libro digital de Familiar en España (49 €), como en Argentina.
const PRECIO_KIDS_EUR = "49";

const VERCEL_PROYECTO = "prj_oYk4cfitEdqG2gVzlAlEUY3Q6Isa";
const VERCEL_EQUIPO = "team_Dby99Pb5AzpVpYroZy9VJIdr";
const RAILWAY_PROYECTO = "6be71d28-d1f2-4f30-989c-d997a2de58f9";
const RAILWAY_ENTORNO = "012b3346-855e-4fd0-93e3-53e249f660fc";
const REPO = "molinazavaliaj/VITACORA-FAMILIAR-";
const PRECIO_KIDS_ARS = "85750";
const PLANTILLAS_KIDS_AR = [
  "kids_bienvenida", "kids_bienvenida_plural", "kids_bienvenida_padre", "kids_aviso_padre",
  "kids_recordatorio_padre", "kids_recordatorio_padre_8", "kids_recordatorio_lo_hago_yo", "kids_recordatorio_lo_hago_yo_8",
  "kids_pregunta_nueva", "kids_pregunta_nueva_padre", "kids_termino_padre", "kids_final", "kids_final_plural",
];

function tokenVercel() {
  try {
    execSync("npx -y vercel@latest whoami", { stdio: "ignore" });
  } catch {
    throw new Error("El login de Vercel no anda. Corré antes: npx vercel login");
  }
  for (const r of [
    resolve(process.env.APPDATA ?? "", "com.vercel.cli/Data/auth.json"),
    resolve(process.env.APPDATA ?? "", "xdg.data/com.vercel.cli/auth.json"),
  ]) if (existsSync(r)) return JSON.parse(readFileSync(r, "utf8")).token;
  throw new Error("No encontré el login de Vercel. Corré antes: npx vercel login");
}

function tokenRailway() {
  if (process.env.RAILWAY_API_TOKEN) return process.env.RAILWAY_API_TOKEN;
  const env = resolve(dirname(fileURLToPath(import.meta.url)), "../../../VITACORA FAMILIAR/fabrica/.env");
  const linea = existsSync(env) && readFileSync(env, "utf8").match(/^RAILWAY_API_TOKEN=(.*)$/m);
  if (!linea) throw new Error(`No encontré RAILWAY_API_TOKEN en ${env}`);
  return linea[1].trim().replace(/^"|"$/g, "");
}

const tv = tokenVercel();
const tr = tokenRailway();

async function railway(query, variables) {
  const r = await fetch("https://backboard.railway.com/graphql/v2", {
    method: "POST",
    headers: { "Project-Access-Token": tr, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (j.errors) throw new Error("Railway: " + j.errors.map((e) => e.message).join("; "));
  return j.data;
}

async function vercel(metodo, ruta, cuerpo) {
  const sep = ruta.includes("?") ? "&" : "?";
  const r = await fetch(`https://api.vercel.com${ruta}${sep}teamId=${VERCEL_EQUIPO}`, {
    method: metodo,
    headers: { Authorization: `Bearer ${tv}`, "Content-Type": "application/json" },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Vercel ${metodo} ${ruta.split("?")[0]}: ${r.status} ${j.error?.message ?? ""}`);
  return j;
}

// 1. Railway: el bot y la fábrica.
const servicios = (await railway("query($p:String!){ project(id:$p){ services{ edges{ node{ id name } } } } }", { p: RAILWAY_PROYECTO }))
  .project.services.edges.map((e) => e.node);
const bot = servicios.find((s) => s.name === "VITACORA-FAMILIAR-");
const fabrica = servicios.find((s) => s.name === "dazzling-friendship");
if (!bot || !fabrica) throw new Error("No encontré el bot o la fábrica en Railway");

async function ponerRailway(servicio, nombre, valor, que) {
  if (probar) return console.log(`· ${que}: pondría ${nombre}.`);
  await railway("mutation($i:VariableUpsertInput!){ variableUpsert(input:$i) }", {
    i: { projectId: RAILWAY_PROYECTO, environmentId: RAILWAY_ENTORNO, serviceId: servicio.id, name: nombre, value: valor },
  });
  console.log(`✓ ${que}: ${nombre} (Railway lo vuelve a publicar solo).`);
}
const plantillas = espana ? PLANTILLAS_KIDS_AR.flatMap((p) => [p, `${p}_es_es`, `${p}_ca`]) : PLANTILLAS_KIDS_AR;
await ponerRailway(bot, "WA_PLANTILLAS_KIDS_LISTAS", plantillas.join(","), `Bot (${plantillas.length} plantillas)`);
await ponerRailway(fabrica, "ESCRITOR_KIDS", "1", "Fábrica");

// 2. Vercel: la venta y el precio, en Production y Preview.
const { envs } = await vercel("GET", `/v10/projects/${VERCEL_PROYECTO}/env`);
async function ponerVercel(key, value) {
  for (const destino of ["production", "preview"]) {
    const fila = envs.find((e) => e.key === key && e.target?.length === 1 && e.target[0] === destino);
    const compartida = envs.find((e) => e.key === key && e.target?.includes(destino) && e.target.length > 1);
    if (probar) {
      console.log(`· ${key}: la cargaría en ${destino}.`);
      continue;
    }
    if (compartida) await vercel("PATCH", `/v9/projects/${VERCEL_PROYECTO}/env/${compartida.id}`, { target: compartida.target.filter((t) => t !== destino) });
    if (fila) await vercel("DELETE", `/v9/projects/${VERCEL_PROYECTO}/env/${fila.id}`);
    await vercel("POST", `/v10/projects/${VERCEL_PROYECTO}/env`, { key, value, type: "encrypted", target: [destino] });
    console.log(`✓ ${key} en ${destino}.`);
  }
}
await ponerVercel("KIDS_VENTA", "1");
await ponerVercel("PRECIO_KIDS_ARS", PRECIO_KIDS_ARS);
if (espana) await ponerVercel("PRECIO_KIDS_EUR", PRECIO_KIDS_EUR);

// 3. Que la web lo tome.
if (!probar) {
  for (const [flujo, rama, que] of [
    ["deploy-web.yml", "main", "vitacorafamiliar.com"],
    ["preview-web.yml", "rediseno-web", "la página de prueba"],
  ]) {
    try {
      execFileSync("gh", ["workflow", "run", flujo, "--ref", rama, "--repo", REPO], { stdio: "ignore" });
      console.log(`✓ Pedí un deploy nuevo de ${que} (tarda unos 3 minutos).`);
    } catch {
      console.log(`· No pude pedir el deploy de ${que}.`);
    }
  }
}
