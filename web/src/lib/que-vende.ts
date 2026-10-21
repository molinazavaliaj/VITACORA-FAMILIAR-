import { catalogo } from "@/lib/productos";
import { kidsVendeEn } from "@/lib/kids";
import type { IdiomaWeb } from "@/lib/idioma-web";

// Qué vende hoy la web, por producto y en qué idioma le habla el bot a esa persona (21/10). El bot lo lee una
// vez cada tanto (GET /api/vende) y lo compara con las plantillas de Meta que tiene marcadas como aprobadas: si
// la web vende algo que el bot no puede mandar (pasó con Kids en catalán el 20/10: la venta prendida y las
// plantillas sin marcar), avisa a los socios. Es información pública, la misma que muestra la web.

export type IdiomaBot = "es-AR" | "es-ES" | "ca";
export type QueVende = { familiar: IdiomaBot[]; viaje: IdiomaBot[]; kids: IdiomaBot[]; regaloEntrega: boolean };

/** Cada web y el idioma en que el bot le escribe a quien compra ahí (/ca es la región ES, en catalán). */
const WEBS: ReadonlyArray<readonly [IdiomaWeb, IdiomaBot, "AR" | "ES"]> = [
  ["ar", "es-AR", "AR"],
  ["es", "es-ES", "ES"],
  ["ca", "ca", "ES"],
];

export function queVende(env: NodeJS.ProcessEnv = process.env): QueVende {
  const r: QueVende = { familiar: [], viaje: [], kids: [], regaloEntrega: env.REGALO_ENTREGA_WHATSAPP === "1" };
  for (const [web, bot, region] of WEBS) {
    const cat = catalogo(region);
    if (cat.base.precio > 0) r.familiar.push(bot);
    if (cat.viaje !== null) r.viaje.push(bot);
    if (kidsVendeEn(web, env)) r.kids.push(bot);
  }
  return r;
}
