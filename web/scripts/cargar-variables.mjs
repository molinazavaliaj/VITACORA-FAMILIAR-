// Carga en Vercel las variables que le faltan a la web nueva (traspaso del 19/10), sin mostrar ningún valor.
//
//   node web/scripts/cargar-variables.mjs preview      → entorno Preview (la página de prueba)
//   node web/scripts/cargar-variables.mjs produccion   → entorno Production (el día del switch, antes del merge)
//   node web/scripts/cargar-variables.mjs probar       → solo mira y cuenta qué haría; no escribe nada
//
// Qué carga en el entorno elegido:
//   - MAIL_SOCIOS y WHATSAPP_NUMERO_PUBLICO: los mismos que tiene el bot en Railway.
//   - ENTREVISTADOR_URL: el dominio del bot en Railway.
//   - SUGERIDAS_CLAVE: la clave compartida con el bot para las preguntas sugeridas del panel. Si el bot no tiene
//     ninguna, se inventa una y se carga también en Railway (el bot se vuelve a publicar solo, un par de minutos).
//   - PRECIO_MARCO_EUR y PRECIO_MARCO_ADICIONAL_EUR = 19. PRECIO_MARCO_EUR hoy es una sola fila para Production y
//     Preview: en `preview` se separa (Production queda con el precio de hoy hasta el switch).
//
// Las claves salen del login de la CLI de Vercel (`npx vercel login`) y de RAILWAY_API_TOKEN en
// fabrica/.env de la carpeta principal. Los cambios de Vercel se ven en el próximo deploy: al final se pide
// uno (en `preview`, el workflow «Preview web (rediseño)»; en `produccion`, deploy-web.yml sobre main).

import { execFileSync, execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const modo = process.argv[2];
if (!["preview", "produccion", "probar"].includes(modo)) {
  console.error("Uso: node web/scripts/cargar-variables.mjs preview | produccion | probar");
  process.exit(1);
}
const escribir = modo !== "probar";
const destino = modo === "produccion" ? "production" : "preview";

const VERCEL_PROYECTO = "prj_oYk4cfitEdqG2gVzlAlEUY3Q6Isa";
const VERCEL_EQUIPO = "team_Dby99Pb5AzpVpYroZy9VJIdr";
const RAILWAY_PROYECTO = "6be71d28-d1f2-4f30-989c-d997a2de58f9";
const RAILWAY_ENTORNO = "012b3346-855e-4fd0-93e3-53e249f660fc";
const RAILWAY_BOT = "VITACORA-FAMILIAR-";
const PRECIO_MARCO = "19";

function tokenVercel() {
  // El login de la CLI vence a las pocas horas y la CLI lo renueva sola cuando se usa: se la usa una vez antes de
  // leerlo (19/10: sin esto, Vercel contestó 403 con el login vencido).
  try {
    execSync("npx -y vercel@latest whoami", { stdio: "ignore" });
  } catch {
    throw new Error("El login de Vercel no anda. Corré antes: npx vercel login");
  }
  const rutas = [
    resolve(process.env.APPDATA ?? "", "com.vercel.cli/Data/auth.json"),
    resolve(process.env.APPDATA ?? "", "xdg.data/com.vercel.cli/auth.json"),
  ];
  for (const r of rutas) if (existsSync(r)) return JSON.parse(readFileSync(r, "utf8")).token;
  throw new Error("No encontré el login de Vercel. Corré antes: npx vercel login");
}

function tokenRailway() {
  if (process.env.RAILWAY_API_TOKEN) return process.env.RAILWAY_API_TOKEN;
  const aqui = dirname(fileURLToPath(import.meta.url));
  const env = resolve(aqui, "../../../VITACORA FAMILIAR/fabrica/.env");
  const linea = existsSync(env) && readFileSync(env, "utf8").match(/^RAILWAY_API_TOKEN=(.*)$/m);
  if (!linea) throw new Error(`No encontré RAILWAY_API_TOKEN en ${env}`);
  return linea[1].trim().replace(/^"|"$/g, "");
}

const tv = tokenVercel();
const tr = tokenRailway();

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

// 1. Lo que tiene el bot en Railway.
const servicios = (
  await railway(
    "query($p:String!){ project(id:$p){ services{ edges{ node{ id name serviceInstances{ edges{ node{ domains{ serviceDomains{ domain } } } } } } } } } }",
    { p: RAILWAY_PROYECTO },
  )
).project.services.edges.map((e) => e.node);
const bot = servicios.find((s) => s.name === RAILWAY_BOT);
if (!bot) throw new Error(`No encontré el servicio ${RAILWAY_BOT} en Railway`);
const dominio = bot.serviceInstances.edges[0]?.node.domains.serviceDomains[0]?.domain;
if (!dominio) throw new Error("El bot no tiene dominio en Railway");
const delBot = (
  await railway("query($p:String!,$e:String!,$s:String!){ variables(projectId:$p,environmentId:$e,serviceId:$s) }", {
    p: RAILWAY_PROYECTO,
    e: RAILWAY_ENTORNO,
    s: bot.id,
  })
).variables;
for (const k of ["MAIL_SOCIOS", "WHATSAPP_NUMERO_PUBLICO"]) if (!delBot[k]) throw new Error(`El bot no tiene ${k} en Railway`);

let clave = delBot.SUGERIDAS_CLAVE;
if (clave) {
  console.log("· SUGERIDAS_CLAVE: el bot ya tiene una, uso esa.");
} else {
  clave = randomBytes(24).toString("base64url");
  if (escribir) {
    await railway("mutation($i:VariableUpsertInput!){ variableUpsert(input:$i) }", {
      i: { projectId: RAILWAY_PROYECTO, environmentId: RAILWAY_ENTORNO, serviceId: bot.id, name: "SUGERIDAS_CLAVE", value: clave },
    });
    console.log("✓ SUGERIDAS_CLAVE nueva cargada en el bot (Railway lo vuelve a publicar solo).");
  } else {
    console.log("· SUGERIDAS_CLAVE: el bot no tiene; inventaría una y la cargaría en Railway.");
  }
}

// 2. Vercel.
const { envs } = await vercel("GET", `/v10/projects/${VERCEL_PROYECTO}/env`);

async function poner(key, value, type = "encrypted") {
  const fila = envs.find((e) => e.key === key && e.target?.length === 1 && e.target[0] === destino);
  const compartida = envs.find((e) => e.key === key && e.target?.includes(destino) && e.target.length > 1);
  if (!escribir) {
    console.log(`· ${key}: ${fila ? "la reemplazaría" : compartida ? "la separaría y cargaría" : "la cargaría"} en ${destino}.`);
    return;
  }
  if (compartida) {
    // Una sola fila para varios entornos: se queda con los otros y el destino tiene la suya.
    await vercel("PATCH", `/v9/projects/${VERCEL_PROYECTO}/env/${compartida.id}`, {
      target: compartida.target.filter((t) => t !== destino),
    });
  }
  if (fila) await vercel("DELETE", `/v9/projects/${VERCEL_PROYECTO}/env/${fila.id}`);
  await vercel("POST", `/v10/projects/${VERCEL_PROYECTO}/env`, { key, value, type, target: [destino] });
  console.log(`✓ ${key} en ${destino}.`);
}

await poner("MAIL_SOCIOS", delBot.MAIL_SOCIOS);
await poner("WHATSAPP_NUMERO_PUBLICO", delBot.WHATSAPP_NUMERO_PUBLICO);
await poner("ENTREVISTADOR_URL", `https://${dominio}`);
await poner("SUGERIDAS_CLAVE", clave, "sensitive");
await poner("PRECIO_MARCO_EUR", PRECIO_MARCO);
await poner("PRECIO_MARCO_ADICIONAL_EUR", PRECIO_MARCO);

// 3. Que la página de prueba las tome.
if (modo === "preview") {
  try {
    execFileSync("gh", ["workflow", "run", "preview-web.yml", "--ref", "rediseno-web", "--repo", "molinazavaliaj/VITACORA-FAMILIAR-"], { stdio: "ignore" });
    console.log("✓ Pedí un deploy nuevo de la página de prueba (tarda unos 3 minutos).");
  } catch {
    console.log("· No pude pedir el deploy de la página de prueba: las variables se toman en el próximo push a rediseno-web.");
  }
}
if (modo === "produccion") {
  // Si el merge ya se publicó, sin un deploy nuevo producción sigue sin estas variables (19/10).
  try {
    execFileSync("gh", ["workflow", "run", "deploy-web.yml", "--ref", "main", "--repo", "molinazavaliaj/VITACORA-FAMILIAR-"], { stdio: "ignore" });
    console.log("✓ Pedí un deploy nuevo de vitacorafamiliar.com (tarda unos 3 minutos).");
  } catch {
    console.log("· No pude pedir el deploy de producción: las variables se toman en el próximo merge a main.");
  }
}
