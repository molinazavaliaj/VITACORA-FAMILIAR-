// ¿El bot puede mandar todo lo que vende la web? (21/10). El 20/10 la web vendió Kids en catalán con las
// plantillas de Meta aprobadas pero sin marcar en WA_PLANTILLAS_KIDS_LISTAS: Martí pagó y no le llegó nada.
// Cada 6 horas, desde el tick, el bot lee qué vende la web (GET <URL_BASE>/api/vende) y lo compara con sus
// listas de plantillas. Si falta alguna, un mail a los socios (una vez por día). Si la web no contesta, solo
// queda en el log: no se avisa por un corte de red.

import { PLANTILLAS_KIDS_BASE, IDIOMAS_PLANTILLAS_KIDS, PLANTILLAS_VIAJE_V2, plantillaKidsLista, plantillaViajeLista } from '../config.js';
import { plantillaLista } from '../v3/enviar.js';
import { avisarSocios } from '../v3/avisos.js';

type Idioma = 'es-AR' | 'es-ES' | 'ca';
export type QueVende = { familiar: Idioma[]; viaje: Idioma[]; kids: Idioma[]; regaloEntrega: boolean };

const IDIOMAS: readonly Idioma[] = ['es-AR', 'es-ES', 'ca'];
const NOMBRE: Record<Idioma, string> = { 'es-AR': 'Argentina', 'es-ES': 'España', ca: 'catalán' };

const soloIdiomas = (x: unknown): Idioma[] => (Array.isArray(x) ? x.filter((i): i is Idioma => IDIOMAS.includes(i as Idioma)) : []);

/** Lo que vende la web y el bot no puede mandar, una línea por plantilla que falta marcar. */
export function faltantes(v: QueVende, env: NodeJS.ProcessEnv = process.env): string[] {
  const faltan: string[] = [];
  for (const i of v.familiar) {
    for (const cual of ['bienvenida', 'pregunta', 'recordatorio'] as const) {
      if (!plantillaLista(i, cual, env)) faltan.push(`Familiar (${NOMBRE[i]}): falta «${i}:${cual}» en WA_PLANTILLAS_V3_LISTAS`);
    }
    if (v.regaloEntrega && !(env.WA_PLANTILLAS_V3_LISTAS ?? '').split(',').map((s) => s.trim()).includes(`${i}:regalo_entrega`)) {
      faltan.push(`Regalo por WhatsApp (${NOMBRE[i]}): falta «${i}:regalo_entrega» en WA_PLANTILLAS_V3_LISTAS`);
    }
  }
  for (const i of v.viaje) {
    for (const cual of Object.keys(PLANTILLAS_VIAJE_V2[i]) as (keyof (typeof PLANTILLAS_VIAJE_V2)[Idioma])[]) {
      if (!plantillaViajeLista(i, cual, env)) faltan.push(`Viaje (${NOMBRE[i]}): falta «${i}:${cual}» en WA_PLANTILLAS_VIAJE_V2_LISTAS`);
    }
  }
  for (const i of v.kids) {
    const sinMarcar = PLANTILLAS_KIDS_BASE.map((b) => `${b}${IDIOMAS_PLANTILLAS_KIDS[i].sufijo}`).filter((n) => !plantillaKidsLista(n, env));
    if (sinMarcar.length) faltan.push(`Kids (${NOMBRE[i]}): faltan ${sinMarcar.length} en WA_PLANTILLAS_KIDS_LISTAS (${sinMarcar.join(', ')})`);
  }
  return faltan;
}

/** Lee qué vende la web y avisa si falta algo. Nunca tira. Devuelve las faltas, o null si la web no contestó. */
export async function controlarPlantillas(o: { fetch?: typeof fetch; env?: NodeJS.ProcessEnv; ahora?: Date } = {}): Promise<string[] | null> {
  const env = o.env ?? process.env;
  const base = (env.URL_BASE ?? 'https://www.vitacorafamiliar.com').replace(/\/$/, '');
  let vende: QueVende;
  try {
    const r = await (o.fetch ?? fetch)(`${base}/api/vende`, { signal: AbortSignal.timeout(10_000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = (await r.json()) as Partial<QueVende>;
    vende = { familiar: soloIdiomas(j.familiar), viaje: soloIdiomas(j.viaje), kids: soloIdiomas(j.kids), regaloEntrega: j.regaloEntrega === true };
  } catch (err) {
    console.warn('control de plantillas: no pude leer qué vende la web:', err instanceof Error ? err.message : err);
    return null;
  }
  const faltan = faltantes(vende, env);
  if (faltan.length) {
    await avisarSocios(
      'plantillas-vs-web',
      'La web vende algo que el bot todavía no puede mandar',
      `${faltan.join('\n')}\n\nQuien compre eso paga y no recibe la bienvenida por WhatsApp. Si la plantilla ya está aprobada en Meta, `
        + 'sumarla a la lista en Railway (servicio del bot). Si no, apagar esa venta en Vercel hasta que Meta la apruebe.',
      { ahora: o.ahora },
    );
  }
  return faltan;
}

let ultimoControl = 0;
const CADA_MS = 6 * 60 * 60 * 1000;

/** Para el tick: corre como mucho una vez cada 6 horas (y al arrancar). */
export async function controlarPlantillasCadaTanto(ahora: Date = new Date()): Promise<void> {
  if (process.env.VITEST) return; // los tests del tick no salen a internet; este control se prueba aparte
  if (ahora.getTime() - ultimoControl < CADA_MS) return;
  ultimoControl = ahora.getTime();
  await controlarPlantillas({ ahora });
}
