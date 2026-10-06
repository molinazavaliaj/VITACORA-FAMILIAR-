// fabrica/src/escritor/orquestador/etapa-c.ts
// Etapa C: el libro con el escritor v5.5, el recorrido de fabrica/scripts/escritor-v55/workflow-libro.js
// con { puro: true, soloHechos: true } (así corrió el libro aprobado), paso por paso y en el mismo orden.
// Sin la lectura final (spec, ahorro 4). Las fases paralelas van por lote (Batch) si `x.usarLote`.
// Con `soloCapitulo`: lo que workflow-tres.js hacía para la prueba corta, para un capítulo.
// El tope de gasto (TopeDeGasto) no se ataja en ningún lado de la etapa: corta el libro.
import { controlarAfuera } from '../controles/afuera.js';
import { aplicar, armar, juntar } from '../controles/arreglos.js';
import { controlar } from '../controles/correr.js';
import { estado, type Disputa } from '../controles/estado.js';
import { aplicarEstiloPieza } from '../controles/estilo.js';
import { informe } from '../controles/informe.js';
import { ErrorJSON, type Encargo } from '../ejecutor.js';
import { salida } from '../lectura.js';
import { llamadaAntes, llamadaArmador, llamadaArreglo, llamadaCapitulo, llamadaCarta, llamadaEstilo, llamadaHechos, llamadaPrimera, llamadaResumen, llamadaSusFrases, llamadaTitulo, llamadaVeedor, type Llamada } from '../llamadas/armar.js';
import { armarLibro, susFrasesMd } from '../llamadas/codigo.js';
import { llamadaDisputa } from '../llamadas/fabrica.js';
import { archivoDe } from '../texto.js';
import { guardarSnapshot, type Contexto } from './contexto.js';

export type OpcionesEtapaC = { soloCapitulo?: number };
export type ResultadoEtapaC = { libro: string; informe: string; capitulos: number; arreglados: string[]; disputas: number; controlesFinal: string; usd: number };

const nn = (n: number): string => String(n).padStart(2, '0');
const encargo = (l: Llamada, json: boolean, sufijo = ''): Encargo => ({ clave: `C/${l.nombre}${sufijo}`, llamada: l, json });
const copiarMd = (x: Contexto, a: string): void => { for (const f of x.c.listar('salidas').filter((f) => f.endsWith('.md'))) x.c.copiar(salida(f), `${a}/${f}`); };

async function disputas(x: Contexto, ds: Disputa[], grupo: string): Promise<void> {
  if (!ds.length) return;
  const docs = JSON.parse(x.c.leer('llamadas/4-hechos.docs.json')) as string[];
  const r = await x.ej.varios(ds.map((d) => encargo(llamadaDisputa(docs, d), true)), { lote: x.usarLote, grupo });
  for (const d of ds) {
    const t = r.textos.get(`C/disputa-${d.clave}`);
    if (t !== undefined) x.c.escribir(`arreglos/disputa-${d.clave}.json`, t);
    else x.log(`disputa ${d.clave}: sin respuesta válida; queda "sin decidir" en el informe`);
  }
}

export async function etapaC(x: Contexto, o: OpcionesEtapaC = {}): Promise<ResultadoEtapaC> {
  // Lo pagado queda anotado aunque la etapa corte (tope, error de la API); el snapshot, solo si la etapa termina.
  try {
    return await etapaCSinCostos(x, o);
  } finally {
    await x.ej.guardarCostos();
  }
}

async function etapaCSinCostos(x: Contexto, o: OpcionesEtapaC): Promise<ResultadoEtapaC> {
  const { c, ej, log } = x;
  const caps = estado(c, 'capitulos') as { n: number[]; antes: boolean };
  const solo = o.soloCapitulo;
  if (solo !== undefined && !caps.n.includes(solo)) throw new Error(`el plan no tiene el capítulo ${solo}`);
  const aEscribir = solo !== undefined ? [solo] : caps.n;
  log(`plan: ${caps.n.length} capítulos${caps.antes ? ' + Antes de cerrar' : ''}${solo !== undefined ? ` (se escribe solo el ${solo})` : ''}`);

  // ---------- 3: escritura, en orden (workflow-libro.js:66-101) ----------
  for (const n of aEscribir) {
    c.escribir(salida(`historias/cap_${n}.md`), await ej.uno(encargo(llamadaArmador(c, n), false)));
    c.escribir(salida(archivoDe(`cap_${n}`)), await ej.uno(encargo(llamadaCapitulo(c, n), false)));
    // C30: si dejó afuera más de un tercio, se reescribe una vez.
    let af = controlarAfuera(c, n);
    log(af.resumen);
    if (af.codigo === 3) {
      c.escribir(salida(archivoDe(`cap_${n}`)), await ej.uno(encargo(llamadaCapitulo(c, n, { error: c.leer(`controles/afuera-cap_${n}.json`) }), false, '#2')));
      af = controlarAfuera(c, n);
      log(af.resumen);
    }
    c.escribir(salida(`resumenes/cap_${n}.md`), await ej.uno(encargo(llamadaResumen(c, `cap_${n}`), false)));
  }
  if (solo === undefined) {
    const antes = caps.antes ? llamadaAntes(c) : null;
    if (antes) c.escribir(salida('antes_de_cerrar.md'), await ej.uno(encargo(antes, false)));
    c.escribir(salida('carta.md'), await ej.uno(encargo(llamadaCarta(c), false)));
    // C7: la primera página, al final; si repite, se reescribe una vez.
    c.escribir(salida('primera_pagina.md'), await ej.uno(encargo(llamadaPrimera(c), false)));
    const rp = controlar(c, 'repite', 'primera_pagina');
    log(rp.resumen);
    if (rp.codigo === 2) {
      c.escribir(salida('primera_pagina.md'), await ej.uno(encargo(llamadaPrimera(c, { error: c.leer('controles/repite-primera_pagina.json') }), false, '#2')));
      log(controlar(c, 'repite', 'primera_pagina').resumen);
    }
    c.escribir(salida('sus_frases.json'), await ej.uno(encargo(llamadaSusFrases(c), true)));
    log(susFrasesMd(c));
  }
  log(`controles de piezas: ${controlar(c, 'piezas').resumen.split('\n')[0]}`);

  // ---------- 4 y 5c: revisión, solo hechos, en paralelo (workflow-libro.js:104-116) ----------
  copiarMd(x, 'sin-revision');
  const hechos = llamadaHechos(c, { repaso: false });
  c.escribir('llamadas/4-hechos.docs.json', JSON.stringify(hechos.docs));
  const rev = await ej.varios([encargo(hechos, true), encargo(llamadaVeedor(c), true)], { lote: x.usarLote, grupo: 'C-revision' });
  for (const [clave, archivo] of [['C/4-hechos', 'hechos.json'], ['C/5c-veedor', 'veedor.json']] as const) {
    const t = rev.textos.get(clave);
    if (t !== undefined) c.escribir(salida(archivo), t);
    else log(`${clave}: sin respuesta válida (${rev.fallas.get(clave) ?? 'sin detalle'}); se sigue sin esa lista`);
  }

  // ---------- 6: juntar y UNA ronda de arreglos (workflow-libro.js:119-138) ----------
  log(`juntar:\n${juntar(c, { soloHechos: true })}`);
  let aArreglar = (estado(c, 'arreglos') as { piezas: string[] }).piezas;
  if (solo !== undefined) aArreglar = aArreglar.filter((p) => p === `cap_${solo}`);
  const arr = await ej.varios(aArreglar.map((p) => encargo(llamadaArreglo(c, p), true)), { lote: x.usarLote, grupo: 'C-arreglos' });
  const arreglados: string[] = [];
  for (const p of aArreglar) {
    const t = arr.textos.get(`C/6-arreglo-${p}`);
    if (t === undefined) { log(`arreglo ${p}: sin respuesta válida (${arr.fallas.get(`C/6-arreglo-${p}`) ?? 'sin detalle'}); sus problemas quedan abiertos`); continue; }
    c.escribir(`arreglos/cambios-${p}.json`, t);
    arreglados.push(p);
  }
  c.copiar('controles/piezas.json', 'controles/piezas-1.json');
  const c9: string[] = [];
  for (const p of arreglados) {
    log(armar(c, p));
    c9.push(controlar(c, 'arreglo', p).resumen);
    log(aplicar(c, p));
  }
  if (c9.length) log(c9.join('\n'));
  const disp1 = (estado(c, 'disputas') as { disputas: Disputa[] }).disputas;
  await disputas(x, disp1, 'C-disputas');

  // ---------- repaso de hechos, C26 (workflow-libro.js:142-147) ----------
  if (arreglados.length) {
    try {
      c.escribir(salida('hechos-repaso.json'), await ej.uno(encargo(llamadaHechos(c, { repaso: true }), true)));
      log(controlar(c, 'repaso').resumen);
      await disputas(x, (estado(c, 'repaso') as { disputas: Disputa[] }).disputas, 'C-disputas-repaso');
    } catch (err) {
      if (!(err instanceof ErrorJSON)) throw err;
      log(`repaso de hechos: ${err.message}; se sigue sin repaso`);
    }
  }

  // ---------- 7: corrector de estilo, dos pasadas (workflow-libro.js:149-158) ----------
  const PIEZAS = solo !== undefined ? [`cap_${solo}`] : ['primera_pagina', ...caps.n.map((n) => `cap_${n}`), ...(caps.antes ? ['antes_de_cerrar'] : []), 'carta'];
  copiarMd(x, 'sin-estilo');
  for (const ronda of [1, 2] as const) {
    const sufijo = ronda === 2 ? '-2' : '';
    const r = await ej.varios(PIEZAS.map((p) => encargo(llamadaEstilo(c, p, ronda), true)), { lote: x.usarLote, grupo: `C-estilo-${ronda}` });
    for (const p of PIEZAS) {
      const t = r.textos.get(`C/7-estilo-${p}${sufijo}`);
      if (t !== undefined) c.escribir(`estilo/cambios-${p}${sufijo}.json`, t);
    }
    log(PIEZAS.map((p) => aplicarEstiloPieza(c, p, ronda)).join('\n'));
  }

  // ---------- 3t: títulos (workflow-libro.js:160) ----------
  const conTitulo = solo !== undefined ? [solo] : caps.n;
  const tit = await ej.varios(conTitulo.map((n) => encargo(llamadaTitulo(c, n), true)), { lote: x.usarLote, grupo: 'C-titulos' });
  for (const n of conTitulo) {
    const t = tit.textos.get(`C/3t-titulo-${nn(n)}`);
    if (t !== undefined) c.escribir(salida(`titulos/cap_${n}.json`), t);
  }

  // ---------- cierre: controles, libro e informe; sin lectura final (workflow-libro.js:166-170) ----------
  const fin = controlar(c, 'piezas');
  log(armarLibro(c));
  const inf = informe(c);
  c.escribir('informe.md', inf);
  await x.almacen.escribir('libro.md', c.leer('libro.md'));
  await x.almacen.escribir('informe.md', inf);
  await guardarSnapshot(x, 'C');
  await ej.guardarCostos();
  return { libro: c.leer('libro.md'), informe: inf, capitulos: caps.n.length, arreglados, disputas: disp1.length, controlesFinal: fin.resumen.split('\n')[0], usd: ej.gastado };
}
