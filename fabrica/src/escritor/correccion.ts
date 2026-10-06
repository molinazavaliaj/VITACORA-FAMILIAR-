// fabrica/src/escritor/correccion.ts
// Etapa B: aplica lo que devolvió el modelo barato (entradas enteras que cambian) al registro.
// No decide nada: reemplaza por id (linea_de_tiempo por "orden"), borra lo que dice "borrar" y
// pone los confirmados. C14 controla después; si falla, rehace Opus.
import type { Json } from './tipos.js';

function reemplazar(lista: Json[] | undefined, nuevos: Json[] | undefined, clave: string): Json[] {
  const out = [...(lista || [])];
  for (const x of nuevos || []) {
    const i = out.findIndex((y) => y?.[clave] === x?.[clave]);
    if (i >= 0) out[i] = x;
    else out.push(x);
  }
  return out;
}

export function aplicarCorreccion(reg: Json, cambios: Json): Json {
  const r = structuredClone(reg);
  for (const k of ['personas', 'lugares', 'episodios']) r[k] = reemplazar(r[k], cambios?.[k], 'id');
  r.linea_de_tiempo = reemplazar(r.linea_de_tiempo, cambios?.linea_de_tiempo, 'orden');
  const borrar = new Set<string>(cambios?.borrar || []);
  for (const k of ['personas', 'lugares', 'episodios']) r[k] = (r[k] || []).filter((x: Json) => !borrar.has(x.id));
  if (Array.isArray(cambios?.confirmados)) r.confirmados = cambios.confirmados;
  return r;
}

const ID_ESTRUCTURA = /^[RE]\d+$/; // respuestas y episodios: de ahí sale la estructura del plan
const CLAVES_FIJAS = new Set(['tipo', 'forma', 'peso']); // los valores de lista cerrada no los toca una corrección
const CLAVES_LIBRES = new Set(['anios']); // las fechas sí las puede corregir la familia

/** El plan sin sus textos: queda la forma (claves, orden, números) y los ids de respuestas y episodios. Los nombres, las personas (P..), los títulos y las fechas se tapan. */
function esqueleto(v: Json, clave = ''): Json {
  if (Array.isArray(v)) return v.map((x) => esqueleto(x, clave));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, CLAVES_LIBRES.has(k) ? '<texto>' : esqueleto(x, k)]));
  if (typeof v === 'string') return ID_ESTRUCTURA.test(v) || CLAVES_FIJAS.has(clave) ? v : '<texto>';
  return v;
}

/** El plan corregido llega entero: tiene que ser el mismo plan con otros nombres. Mismos capítulos, mismas respuestas y episodios en cada lugar, mismos hilo_ids; solo cambian los textos. Si no, tira y rehace Opus. */
export function validarPlanCorregido(viejo: Json, nuevo: Json): Json {
  if (!nuevo || typeof nuevo !== 'object' || !Array.isArray(nuevo.capitulos)) throw new Error('el plan corregido no trae capítulos');
  const a = JSON.stringify(esqueleto(viejo));
  const b = JSON.stringify(esqueleto(nuevo));
  if (a !== b) {
    const donde = (x: Json, y: Json): string => {
      const ca = x.capitulos as Json[];
      const cb = y.capitulos as Json[];
      for (let i = 0; i < Math.max(ca.length, cb.length); i++) if (JSON.stringify(ca[i]) !== JSON.stringify(cb[i])) return `capítulo ${ca[i]?.n ?? cb[i]?.n ?? i + 1}`;
      return 'fuera de los capítulos';
    };
    throw new Error(`el plan corregido cambió la estructura (${donde(esqueleto(viejo), esqueleto(nuevo))})`);
  }
  return nuevo;
}
