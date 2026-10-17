// Las etapas del libro de Kids (docs/kids/v2/escritor/plan.md, «Las etapas»), sobre la máquina de Familiar: la
// Carpeta, el Ejecutor (checkpoint por llamada, reintentos, tope de gasto, Batch) y los snapshots por etapa.
//
// A · Leer todo (una llamada). Si marca algo preocupante: frenado.json (en la carpeta y en el almacén), aviso a los
//     socios, y no sigue hasta que exista liberado.json en el almacén (lo pone Naza).
// B · Parte 1 a 4, Sobre y Álbum, todo en un lote.
// C · Controles de código + Veedor por parte (en lote); si una parte tiene problemas, Arreglo de esa parte una sola
//     vez (en lote). Lo que no se arregló queda en el informe.
// Armado (sin modelo): libro.md, sobre.md e informe.md. El HTML y el PDF los arma salida/ (con fotos y QR).
//
// Un JSON que no cumple su forma se pide una vez más con el error pegado; si sigue mal, la etapa falla. El gasto se
// guarda (costos.json) aunque la etapa corte.
import { parseJSONTolerante } from '../escritor/carpeta.js';
import { ErrorJSON, TopeDeGasto, type Encargo } from '../escritor/ejecutor.js';
import type { Llamada } from '../escritor/llamadas/armar.js';
import { guardarSnapshot, type Contexto } from '../escritor/orquestador/contexto.js';
import { ErrorDelModelo } from '../escritor/modelo/tipos.js';
import { aplicarArreglo, controlarAlbum, controlarParte, controlarSobre, cubiertas, formaAlbum, formaLectura, formaParte, formaSobre, formaVeedor, suVozValida, type Salidas } from './controles.js';
import { llamadaAlbum, llamadaArreglo, llamadaLeer, llamadaParte, llamadaSobre, llamadaVeedor, type PiezaKids, type ProblemaKids, type SalidaAlbum, type SalidaLectura, type SalidaParte, type SalidaSobre, type SalidaVeedor } from './llamadas.js';
import { materialDe, salidaKids } from './material/carpeta.js';
import type { MaterialKids } from './material/tipos.js';
import { escribirArmado } from './salida/libro-md.js';

export type ContextoKids = Contexto & {
  /** El aviso a los socios cuando el libro se frena (en producción, produccion/avisos; en el script, la consola). */
  avisar?: (asunto: string, texto: string) => Promise<void>;
};

export const RUTA_FRENADO = 'frenado.json';
export const RUTA_LIBERADO = 'liberado.json';

export type Frenado = { at: string; preocupante: SalidaLectura['preocupante']; texto: string };
export type ResultadoKids =
  | { estado: 'frenado'; frenado: Frenado }
  | { estado: 'listo'; arregladas: number[]; problemasFinales: number; llamadas: number }
  | { estado: 'fallido'; motivo: string };

type Forma = (j: unknown) => string[];
const escribirJSON = (x: ContextoKids, archivo: string, j: unknown): void => x.c.escribir(salidaKids(archivo), JSON.stringify(j, null, 1));
const leerSalida = <T>(x: ContextoKids, archivo: string): T | null => (x.c.existe(salidaKids(archivo)) ? (parseJSONTolerante(x.c.leer(salidaKids(archivo))) as T) : null);

class PasoFallido extends Error {}

/** Revisa la forma de un texto ya pedido; si no sirve, lo pide una vez más con el error. */
async function conForma<T>(x: ContextoKids, clave: string, texto: string | undefined, forma: Forma, rehacer: (error: string) => Llamada): Promise<T> {
  let error = texto === undefined ? 'la respuesta no llegó o no es un JSON válido' : '';
  if (texto !== undefined) {
    try {
      const j = parseJSONTolerante(texto);
      const e = forma(j);
      if (!e.length) return j as T;
      error = e.join('\n');
    } catch {
      error = 'la respuesta no es un JSON válido (no parsea)';
    }
  }
  x.log(`${clave}: ${error.split('\n')[0]}; se pide otra vez`);
  let otro: string;
  try {
    otro = await x.ej.uno({ clave: `${clave}#2`, llamada: rehacer(error), json: true });
  } catch (err) {
    if (err instanceof TopeDeGasto) throw err;
    if (err instanceof ErrorJSON || (err instanceof ErrorDelModelo && !err.reintentable)) throw new PasoFallido(`${clave}: ${(err as Error).message}`);
    throw err;
  }
  const j = parseJSONTolerante(otro);
  const e = forma(j);
  if (e.length) throw new PasoFallido(`${clave}: el JSON no cumple su forma dos veces (${e[0]})`);
  return j as T;
}

async function conCostos<T>(x: ContextoKids, f: () => Promise<T>): Promise<T> {
  try {
    return await f();
  } finally {
    await x.ej.guardarCostos();
  }
}

// ---------- A ----------

export type ResultadoA = { ok: true; frenado: false; lectura: SalidaLectura } | { ok: true; frenado: true; datos: Frenado } | { ok: false; motivo: string };

export function textoFrenado(m: MaterialKids, l: SalidaLectura): string {
  return [
    `El libro de ${m.ficha.llamado} (${m.ficha.nombre}, ${m.ficha.edad} años) quedó frenado antes de escribirse.`,
    'El escritor encontró algo que tiene que mirar un adulto de Vitácora.',
    '',
    ...l.preocupante.map((p) => `- ${p.ids.join(', ')} · «${p.cita}» · ${p.por_que}`),
    '',
    'El libro no sigue hasta que exista liberado.json en la carpeta del escritor de este chico.',
  ].join('\n');
}

export async function etapaAKids(x: ContextoKids): Promise<ResultadoA> {
  return conCostos(x, async () => {
    const m = materialDe(x.c);
    let lectura = leerSalida<SalidaLectura>(x, 'lectura.json');
    if (!lectura) {
      const clave = 'A/kids-leer';
      let texto: string | undefined;
      try {
        texto = await x.ej.uno({ clave, llamada: llamadaLeer(m), json: true });
      } catch (err) {
        if (!(err instanceof ErrorJSON)) throw err;
      }
      try {
        lectura = await conForma<SalidaLectura>(x, clave, texto, formaLectura, (error) => llamadaLeer(m, { error }));
      } catch (err) {
        if (err instanceof PasoFallido) return { ok: false, motivo: err.message };
        throw err;
      }
      escribirJSON(x, 'lectura.json', lectura);
    }
    const liberado = (await x.almacen.leer(RUTA_LIBERADO)) !== null;
    if (lectura.preocupante.length && !liberado) {
      const previo = await x.almacen.leer(RUTA_FRENADO);
      const frenado: Frenado = previo ? (JSON.parse(previo) as Frenado) : { at: new Date().toISOString(), preocupante: lectura.preocupante, texto: textoFrenado(m, lectura) };
      x.c.escribir(RUTA_FRENADO, JSON.stringify(frenado, null, 1));
      if (!previo) {
        await x.almacen.escribir(RUTA_FRENADO, JSON.stringify(frenado, null, 1));
        // El aviso es una sola vez (el frenado ya escrito quiere decir que ya se avisó).
        await x.avisar?.(`Libro de Kids frenado: ${m.ficha.llamado}`, frenado.texto);
      }
      x.log(`A: frenado por algo preocupante (${lectura.preocupante.length}); sigue solo con ${RUTA_LIBERADO}`);
      await guardarSnapshot(x, 'A');
      return { ok: true, frenado: true, datos: frenado };
    }
    if (lectura.preocupante.length) x.log('A: había algo preocupante y Naza lo liberó; sigue');
    await guardarSnapshot(x, 'A');
    return { ok: true, frenado: false, lectura };
  });
}

// ---------- B ----------

export async function etapaBKids(x: ContextoKids): Promise<{ ok: true } | { ok: false; motivo: string }> {
  return conCostos(x, async () => {
    const m = materialDe(x.c);
    type Paso = { archivo: string; encargo: Encargo; forma: Forma; rehacer: (error: string) => Llamada };
    const pasos: Paso[] = [];
    for (const p of m.partes) {
      if (!p.items.length) { escribirJSON(x, `parte-${p.n}.json`, { piezas: [], afuera: [] }); continue; }
      const llamada = llamadaParte(m, p.n);
      pasos.push({ archivo: `parte-${p.n}.json`, encargo: { clave: `B/${llamada.nombre}`, llamada, json: true }, forma: formaParte, rehacer: (error) => llamadaParte(m, p.n, { error }) });
    }
    if (m.sobre.items.length) pasos.push({ archivo: 'sobre.json', encargo: { clave: 'B/kids-sobre', llamada: llamadaSobre(m), json: true }, forma: formaSobre, rehacer: (error) => llamadaSobre(m, { error }) });
    else escribirJSON(x, 'sobre.json', { piezas: [] });
    if (m.fotos.length) pasos.push({ archivo: 'album.json', encargo: { clave: 'B/kids-album', llamada: llamadaAlbum(m), json: true }, forma: formaAlbum, rehacer: (error) => llamadaAlbum(m, { error }) });
    else escribirJSON(x, 'album.json', { fotos: [] });

    const r = await x.ej.varios(pasos.map((p) => p.encargo), { lote: x.usarLote, grupo: 'B-escritura' });
    try {
      for (const p of pasos) {
        if (r.fallas.has(p.encargo.clave)) x.log(`${p.encargo.clave}: ${r.fallas.get(p.encargo.clave)}`);
        escribirJSON(x, p.archivo, await conForma(x, p.encargo.clave, r.textos.get(p.encargo.clave), p.forma, p.rehacer));
      }
    } catch (err) {
      if (err instanceof PasoFallido) return { ok: false, motivo: err.message };
      throw err;
    }
    await guardarSnapshot(x, 'B');
    return { ok: true };
  });
}

// ---------- C ----------

export function salidasDe(x: Pick<ContextoKids, 'c'>, m: MaterialKids): Salidas {
  const leer = <T>(a: string): T | null => (x.c.existe(salidaKids(a)) ? (parseJSONTolerante(x.c.leer(salidaKids(a))) as T) : null);
  const partes = new Map<number, SalidaParte>();
  for (const p of m.partes) partes.set(p.n, leer<SalidaParte>(`parte-${p.n}.json`) ?? { piezas: [], afuera: [] });
  return { partes, sobre: leer<SalidaSobre>('sobre.json'), album: leer<SalidaAlbum>('album.json') };
}

export type ControlFinal = { partes: Record<string, ProblemaKids[]>; veedor: Record<string, ProblemaKids[]>; arregladas: number[]; sobre: string[]; album: string[]; ignoradas: string[] };

export async function etapaCKids(x: ContextoKids): Promise<{ ok: true; final: ControlFinal } | { ok: false; motivo: string }> {
  return conCostos(x, async () => {
    const m = materialDe(x.c);
    const s = salidasDe(x, m);
    const cub = cubiertas(m, s);
    const deCodigo = new Map(m.partes.map((p) => [p.n, controlarParte(m, p, s.partes.get(p.n) as SalidaParte, cub)]));
    for (const [n, ps] of deCodigo) escribirJSON(x, `controles-${n}.json`, ps);

    const conPiezas = m.partes.filter((p) => (s.partes.get(p.n)?.piezas.length ?? 0) > 0);
    const veedores = conPiezas.map((p) => { const llamada = llamadaVeedor(m, p.n, s.partes.get(p.n) as SalidaParte); return { n: p.n, encargo: { clave: `C/${llamada.nombre}`, llamada, json: true } satisfies Encargo }; });
    const rv = await x.ej.varios(veedores.map((v) => v.encargo), { lote: x.usarLote, grupo: 'C-veedor' });
    const delVeedor = new Map<number, ProblemaKids[]>();
    try {
      for (const v of veedores) {
        const j = await conForma<SalidaVeedor>(x, v.encargo.clave, rv.textos.get(v.encargo.clave), formaVeedor, () => v.encargo.llamada);
        delVeedor.set(v.n, j.problemas);
        escribirJSON(x, `veedor-${v.n}.json`, j);
      }
    } catch (err) {
      if (err instanceof PasoFallido) return { ok: false, motivo: err.message };
      throw err;
    }

    // Arreglo: una vez por parte con problemas (del veedor o del código).
    const arreglos: { n: number; encargo: Encargo; permitidas: Set<string> }[] = [];
    for (const p of m.partes) {
      const problemas = [...(delVeedor.get(p.n) ?? []), ...(deCodigo.get(p.n) ?? [])].filter((q) => q.clave !== 'afuera');
      if (!problemas.length) continue;
      const salida = s.partes.get(p.n) as SalidaParte;
      const claves = [...new Set(problemas.map((q) => q.clave))].filter((k) => p.items.some((i) => i.clave === k) || salida.piezas.some((pz) => pz.clave === k));
      if (!claves.length) continue;
      // Un item que no tiene pieza va igual, vacío, para que el arreglo la escriba.
      const conProblemas: PiezaKids[] = claves.map((k) => salida.piezas.find((pz) => pz.clave === k) ?? { clave: k, titulo: '', texto: '(no tiene pieza)', ids: [] });
      const llamada = llamadaArreglo(m, p.n, conProblemas, problemas.filter((q) => claves.includes(q.clave)));
      arreglos.push({ n: p.n, encargo: { clave: `C/${llamada.nombre}`, llamada, json: true }, permitidas: new Set(claves) });
    }
    const ignoradas: string[] = [];
    const arregladas: number[] = [];
    if (arreglos.length) {
      const ra = await x.ej.varios(arreglos.map((a) => a.encargo), { lote: x.usarLote, grupo: 'C-arreglo' });
      for (const a of arreglos) {
        let j: SalidaParte;
        try {
          j = await conForma<SalidaParte>(x, a.encargo.clave, ra.textos.get(a.encargo.clave), formaParte, (error) => ({ ...a.encargo.llamada, instr: `${a.encargo.llamada.instr}\n\nTu respuesta anterior no pasó estos controles. Devolvé el JSON completo corregido.\n${error}` }));
        } catch (err) {
          if (!(err instanceof PasoFallido)) throw err;
          // El arreglo es una ayuda: si no sale, la parte queda como estaba y va al informe.
          x.log(`${a.encargo.clave}: ${err.message}; la parte queda sin arreglar`);
          ignoradas.push(`parte ${a.n}: el arreglo no salió (${err.message})`);
          continue;
        }
        const parte = m.partes.find((p) => p.n === a.n) as MaterialKids['partes'][number];
        const r = aplicarArreglo(parte, s.partes.get(a.n) as SalidaParte, j, a.permitidas);
        for (const k of r.ignoradas) ignoradas.push(`parte ${a.n}: el arreglo devolvió ${k}, que no tenía problemas (no se usó)`);
        s.partes.set(a.n, r.salida);
        escribirJSON(x, `parte-${a.n}.json`, r.salida);
        arregladas.push(a.n);
      }
    }

    // Lo que queda después del arreglo (sin otra vuelta de modelo): al informe.
    const cubFinal = cubiertas(m, s);
    const final: ControlFinal = {
      partes: Object.fromEntries(m.partes.map((p) => [String(p.n), controlarParte(m, p, s.partes.get(p.n) as SalidaParte, cubFinal)])),
      veedor: Object.fromEntries([...delVeedor].map(([n, ps]) => [String(n), ps])),
      arregladas,
      sobre: controlarSobre(m, s.sobre, cubFinal),
      album: controlarAlbum(m, s.album),
      ignoradas,
    };
    escribirJSON(x, 'controles-final.json', final);
    await guardarSnapshot(x, 'C');
    return { ok: true, final };
  });
}

// ---------- Todo ----------

/** A → (si no está frenado) B → C → armado de los md. Cada etapa arranca de lo que dejó la anterior en la carpeta. */
export async function correrKids(x: ContextoKids): Promise<ResultadoKids> {
  const a = await etapaAKids(x);
  if (!a.ok) return { estado: 'fallido', motivo: a.motivo };
  if (a.frenado) return { estado: 'frenado', frenado: a.datos };
  const b = await etapaBKids(x);
  if (!b.ok) return { estado: 'fallido', motivo: b.motivo };
  const c = await etapaCKids(x);
  if (!c.ok) return { estado: 'fallido', motivo: c.motivo };
  const m = materialDe(x.c);
  const lectura = a.lectura;
  const voz = suVozValida(m, lectura);
  await escribirArmado(x, { m, s: salidasDe(x, m), lectura, voz, final: c.final, gastado: x.ej.gastado });
  await x.ej.guardarCostos();
  const problemasFinales = Object.values(c.final.partes).reduce((s, ps) => s + ps.length, 0) + c.final.sobre.length + c.final.album.length;
  return { estado: 'listo', arregladas: c.final.arregladas, problemasFinales, llamadas: x.ej.filas.length };
}
