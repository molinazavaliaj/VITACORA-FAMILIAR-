// Cuánto puede costar el libro de un chico, ANTES de llamar (la prueba paga se avisa con el costo). Como
// escritor/estimar.ts: la entrada se cuenta por caracteres sobre las llamadas de verdad (sin caché), cada fila con el
// precio del modelo de su llamada (rolDe) y la salida es un supuesto, no una medida.
//
// La salida se cuenta en dos: lo que escribe (visible, calculado del material: el JSON que devolvería) y lo que
// piensa. En Familiar el pensamiento fue ~85% del costo; acá todos los pasos van con pensamiento medio y se cuenta
// aparte, con un número por paso para el caso típico y otro para el peor.
//  - típico: Leer todo, las 4 partes, sobre, álbum, los 4 veedores y el arreglo de 2 partes.
//  - peor caso: todo con el pensamiento del peor caso, un reintento de JSON en Leer todo y en cada paso de la etapa B,
//    un veedor que marca más, y el arreglo de las 4 partes.
// Batch: la mitad de todo (entrada y salida).
import type { Carpeta } from '../escritor/carpeta.js';
import { PRECIOS_ESCRITOR } from '../escritor/costos.js';
import type { Llamada } from '../escritor/llamadas/armar.js';
import { HAIKU, rolDe } from '../escritor/modelo/configuracion.js';
import { textoParaElModelo } from '../escritor/llamadas/armar.js';
import { albumFalso, parteFalsa, sobreFalso } from './falso.js';
import { llamadaAlbum, llamadaArreglo, llamadaLeer, llamadaParte, llamadaSobre, llamadaVeedor, type ProblemaKids, type SalidaParte } from './llamadas.js';
import { materialDe } from './material/carpeta.js';

/** Pensamiento supuesto por paso (tokens), típico y peor. */
export const PENSAMIENTO_KIDS: Record<string, { tipico: number; peor: number }> = {
  leer: { tipico: 8000, peor: 16000 },
  parte: { tipico: 6000, peor: 12000 },
  sobre: { tipico: 2500, peor: 6000 },
  album: { tipico: 2500, peor: 6000 },
  veedor: { tipico: 6000, peor: 12000 },
  arreglo: { tipico: 4000, peor: 10000 },
};
/** Lo que escribe el veedor (problemas) y Leer todo (un JSON corto), en tokens. */
const VISIBLE_FIJO = { leer: 800, veedorTipico: 800, veedorPeor: 2500 };

const tokens = (t: string, modelo: string): number => Math.ceil(t.length / (modelo === HAIKU ? 3.1 : 2.3));
const r4 = (x: number): number => Math.round(x * 1e4) / 1e4;

export type FilaKids = { paso: string; modelo: string; llamadas: number; entradaTokens: number; visibleTokens: number; pensamientoTokens: number; usd: number; usdLote: number };
export type EstimacionKids = {
  tipico: FilaKids[]; peor: FilaKids[];
  total: { tipico: number; tipicoLote: number; peor: number; peorLote: number };
  pensamientoParte: { tipico: number; peor: number };
};

function fila(paso: string, l: Llamada, visible: number, pensamiento: number, veces = 1): FilaKids {
  const { modelo } = rolDe(l.nombre);
  const p = PRECIOS_ESCRITOR[modelo];
  const entrada = tokens(textoParaElModelo(l), modelo);
  const usd = ((entrada * p.input + (visible + pensamiento) * p.output) / 1e6) * veces;
  return { paso, modelo, llamadas: veces, entradaTokens: entrada * veces, visibleTokens: visible * veces, pensamientoTokens: pensamiento * veces, usd: r4(usd), usdLote: r4(usd / 2) };
}

export function estimarKids(c: Carpeta): EstimacionKids {
  const m = materialDe(c);
  const partes = m.partes.filter((p) => p.items.length);
  const salidaParte = new Map<number, SalidaParte>(partes.map((p) => [p.n, parteFalsa(m, p.n)]));
  const vis = (j: unknown, l: Llamada): number => tokens(JSON.stringify(j), rolDe(l.nombre).modelo);
  // Un arreglo típico reescribe la mitad de las piezas de la parte; el peor, todas. Los problemas son de relleno.
  const arreglo = (n: number, fraccion: number) => {
    const s = salidaParte.get(n) ?? { piezas: [], afuera: [] };
    const piezas = s.piezas.slice(0, Math.max(1, Math.ceil(s.piezas.length * fraccion)));
    const problemas: ProblemaKids[] = piezas.map((pz) => ({ clave: pz.clave, tipo: 'inventado', cita: pz.texto.slice(0, 60), arreglo: 'sacar, no lo dijo' }));
    const l = llamadaArreglo(m, n, piezas, problemas);
    return { l, visible: vis({ piezas, afuera: [] }, l) };
  };

  const armar = (caso: 'tipico' | 'peor'): FilaKids[] => {
    const T = (k: string) => PENSAMIENTO_KIDS[k][caso];
    const reintento = caso === 'peor' ? 2 : 1;
    const out: FilaKids[] = [];
    const leer = llamadaLeer(m);
    out.push(fila('A · Leer todo', leer, VISIBLE_FIJO.leer, T('leer'), reintento));
    for (const p of partes) { const l = llamadaParte(m, p.n); out.push(fila(`B · Parte ${p.n}`, l, vis(salidaParte.get(p.n), l), T('parte'), reintento)); }
    if (m.sobre.items.length) { const l = llamadaSobre(m); out.push(fila('B · Sobre', l, vis(sobreFalso(m), l), T('sobre'), reintento)); }
    if (m.fotos.length) { const l = llamadaAlbum(m); out.push(fila('B · Álbum', l, vis(albumFalso(m), l), T('album'), reintento)); }
    for (const p of partes) out.push(fila(`C · Veedor ${p.n}`, llamadaVeedor(m, p.n, salidaParte.get(p.n) ?? { piezas: [], afuera: [] }), caso === 'peor' ? VISIBLE_FIJO.veedorPeor : VISIBLE_FIJO.veedorTipico, T('veedor')));
    // Típico: arreglo de las 2 partes con más piezas, a la mitad. Peor: las 4, enteras.
    const aArreglar = caso === 'peor' ? partes : [...partes].sort((a, b) => b.items.length - a.items.length).slice(0, 2).sort((a, b) => a.n - b.n);
    for (const p of aArreglar) { const a = arreglo(p.n, caso === 'peor' ? 1 : 0.5); out.push(fila(`C · Arreglo ${p.n}`, a.l, a.visible, T('arreglo'))); }
    return out;
  };
  const tipico = armar('tipico');
  const peor = armar('peor');
  const suma = (fs: FilaKids[], k: 'usd' | 'usdLote') => r4(fs.reduce((s, f) => s + f[k], 0));
  const parteDelPensamiento = (fs: FilaKids[]) => {
    const total = fs.reduce((s, f) => s + (f.entradaTokens * 4 + (f.visibleTokens + f.pensamientoTokens) * 20), 0);
    return Math.round((fs.reduce((s, f) => s + f.pensamientoTokens * 20, 0) / total) * 100) / 100;
  };
  return {
    tipico, peor,
    total: { tipico: suma(tipico, 'usd'), tipicoLote: suma(tipico, 'usdLote'), peor: suma(peor, 'usd'), peorLote: suma(peor, 'usdLote') },
    pensamientoParte: { tipico: parteDelPensamiento(tipico), peor: parteDelPensamiento(peor) },
  };
}

/** Las rondas que van una detrás de otra (cada una espera a la anterior): con Batch, cada una es un lote. */
export const RONDAS_KIDS = ['A · Leer todo', 'B · Partes, sobre y álbum', 'C · Veedores', 'C · Arreglos'] as const;

export function textoEstimacionKids(e: EstimacionKids, o: { lote: boolean; topeUsd: number }): string[] {
  const l: string[] = [`Estimación del libro (entrada sin caché, salida supuesta con el pensamiento contado aparte; no es un tope ni una promesa):`];
  const tabla = (fs: FilaKids[]) => fs.map((f) => `  ${f.paso.padEnd(16)} ${f.modelo.padEnd(16)} x${f.llamadas}  entrada ~${String(f.entradaTokens).padStart(6)}  escribe ~${String(f.visibleTokens).padStart(5)}  piensa ~${String(f.pensamientoTokens).padStart(6)}  USD ${f.usd.toFixed(4)} (Batch ${f.usdLote.toFixed(4)})`);
  l.push('Típico:', ...tabla(e.tipico));
  l.push(`  típico: USD ${e.total.tipico.toFixed(2)} sin Batch · USD ${e.total.tipicoLote.toFixed(2)} con Batch (el pensamiento es ~${Math.round(e.pensamientoParte.tipico * 100)}% del costo)`);
  l.push('Peor caso (reintentos de JSON, más pensamiento, arreglo de las 4 partes):', ...tabla(e.peor));
  l.push(`  peor caso: USD ${e.total.peor.toFixed(2)} sin Batch · USD ${e.total.peorLote.toFixed(2)} con Batch (pensamiento ~${Math.round(e.pensamientoParte.peor * 100)}%)`);
  l.push(`  tope actual: USD ${o.topeUsd}${(o.lote ? e.total.peorLote : e.total.peor) >= 0.7 * o.topeUsd ? ` · AVISO: el peor caso llega cerca del tope; usar --tope ${Math.ceil((o.lote ? e.total.peorLote : e.total.peor) * 1.2)}` : ''}`);
  l.push(o.lote
    ? `  Va por Batch (--sin-lote lo apaga): ${RONDAS_KIDS.length} lotes uno detrás de otro (${RONDAS_KIDS.join(' → ')}); cada lote suele tardar de minutos a una hora, y la API da hasta 24 h por lote.`
    : '  Sin Batch: todo a precio lleno, en minutos.');
  return l;
}
