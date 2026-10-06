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
