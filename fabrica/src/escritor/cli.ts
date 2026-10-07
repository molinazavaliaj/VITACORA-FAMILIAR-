// Lo testeable del comando local (scripts/escritor-correr.ts): argumentos y carpeta de disco.
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { Carpeta } from './carpeta.js';
import { estimarUsd } from './estimar.js';
import { PERFILES, type Perfil } from './modelo/configuracion.js';

export type ArgsCli = { carpeta: string; etapa: 'A' | 'B' | 'C'; soloCapitulo?: number; topeUsd: number; lote: boolean; si: boolean; correcciones?: string; perfil: Perfil; salida?: string; soloEscritura?: boolean };

export function leerArgs(argv: string[]): ArgsCli {
  const a: { carpeta?: string; etapa: ArgsCli['etapa']; soloCapitulo?: number; topeUsd: number; lote: boolean; si: boolean; correcciones?: string; perfil: Perfil; salida?: string; soloEscritura?: boolean } = { etapa: 'C', topeUsd: 15, lote: true, si: false, perfil: 'eco' };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const valor = (): string => { const v = argv[++i]; if (v === undefined) throw new Error(`falta el valor de ${k}`); return v; };
    if (k === '--carpeta') a.carpeta = valor();
    else if (k === '--etapa') { const e = valor(); if (e !== 'A' && e !== 'B' && e !== 'C') throw new Error(`--etapa es A, B o C (no ${e})`); a.etapa = e; }
    else if (k === '--solo-capitulo') { const n = Number(valor()); if (!Number.isInteger(n) || n < 1) throw new Error('--solo-capitulo es un número de capítulo'); a.soloCapitulo = n; }
    else if (k === '--tope') { const n = Number(valor()); if (!(n > 0)) throw new Error('--tope es un monto en USD mayor que 0'); a.topeUsd = n; }
    else if (k === '--correcciones') a.correcciones = valor();
    else if (k === '--sin-lote') a.lote = false;
    else if (k === '--perfil') { const p = valor(); if (!PERFILES.includes(p as Perfil)) throw new Error(`--perfil es ${PERFILES.join(', ')} (no ${p})`); a.perfil = p as Perfil; }
    else if (k === '--salida') a.salida = valor();
    else if (k === '--solo-escritura') a.soloEscritura = true;
    else if (k === '--si') a.si = true;
    else throw new Error(`argumento desconocido: ${k}`);
  }
  if (!a.carpeta) throw new Error('falta --carpeta <dir> (la carpeta con entradas/)');
  if (a.soloCapitulo !== undefined && a.etapa !== 'C') throw new Error('--solo-capitulo es de la etapa C');
  if (a.etapa === 'B' && !a.correcciones) throw new Error('la etapa B necesita --correcciones <archivo> (una corrección por línea)');
  const { carpeta, ...resto } = a;
  return { carpeta: carpeta as string, ...resto };
}

/** Lo que dejó una revisión anterior no se carga: si no, el informe y los arreglos mezclarían dos corridas. */
export const SALIDAS_DE_REVISION = new Set(['salidas/hechos.json', 'salidas/veedor.json', 'salidas/hechos-repaso.json', 'salidas/lectura.json', 'salidas/lectura-final.json', 'salidas/cotejo.json']);

export function cargarCarpeta(dir: string): Carpeta {
  const c = new Carpeta();
  const recorrer = (sub: string): void => {
    const abs = path.join(dir, sub);
    let nombres: string[];
    try { nombres = readdirSync(abs); } catch { return; }
    for (const n of nombres) {
      const rel = `${sub}/${n}`;
      if (statSync(path.join(dir, rel)).isDirectory()) recorrer(rel);
      else if (!SALIDAS_DE_REVISION.has(rel)) c.escribir(rel, readFileSync(path.join(dir, rel), 'utf8'));
    }
  };
  for (const sub of ['entradas', 'salidas', 'pendientes']) recorrer(sub);
  return c;
}

export function guardarCarpeta(c: Carpeta, dir: string): void {
  for (const [rel, texto] of Object.entries(c.aObjeto())) {
    mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    writeFileSync(path.join(dir, rel), texto, 'utf8');
  }
}

/** El texto de la estimación que se muestra ANTES de llamar (nada de esto llama a la API). */
export function textoEstimacion(c: Carpeta, a: Pick<ArgsCli, 'soloCapitulo' | 'topeUsd'> & { lote?: boolean; perfil?: Perfil }): string[] {
  if (a.soloCapitulo === undefined) return ['Sin estimación: solo se estima con --solo-capitulo N (el libro entero no se estima).'];
  const e = estimarUsd(c, { soloCapitulo: a.soloCapitulo, lote: a.lote, perfil: a.perfil });
  const l = [`Estimación del capítulo ${a.soloCapitulo} (entrada sin lectura de caché, la de 1 hora se paga al doble, ${a.lote ? 'todo por Batch (mitad de precio)' : 'sin Batch'}, salida supuesta; no es un tope ni una promesa):`];
  if (e.conRelleno) l.push('  (el capítulo todavía no está escrito: las filas que lo incluyen usan un capítulo de relleno)');
  for (const f of e.filasPeor) l.push(`  ${f.paso.padEnd(28)} ${f.modelo.padEnd(16)} entrada ~${f.entradaTokens} tok, salida ~${f.salidaTokens} tok  USD ${f.usd.toFixed(4)}`);
  l.push(`  estimación típica: USD ${e.total.toFixed(2)}`);
  l.push(`  peor caso: USD ${e.peorCaso.toFixed(2)} (con reescritura C30, reintento de JSON y una segunda vuelta de revisión; la reescritura de la primera página, C7, no corre con --solo-capitulo)`);
  l.push(`  tope actual: USD ${a.topeUsd}`);
  if (e.peorCaso >= 0.7 * a.topeUsd) l.push(`  AVISO: el peor caso llega al ${Math.round((e.peorCaso / a.topeUsd) * 100)}% del tope. Para cubrirlo, usar --tope ${Math.ceil(e.peorCaso * 1.1)}.`);
  l.push(a.lote ? '  Todo va por Batch (--sin-lote lo apaga): un libro puede tardar horas.' : '  Sin Batch: todo a precio lleno.');
  return l;
}

/** Saca la clave de cualquier mensaje que se imprima. */
export function sinClave(msg: string, env: NodeJS.ProcessEnv = process.env): string {
  const k = env.ANTHROPIC_API_KEY;
  return k && k.length >= 8 ? msg.split(k).join('[clave]') : msg;
}
