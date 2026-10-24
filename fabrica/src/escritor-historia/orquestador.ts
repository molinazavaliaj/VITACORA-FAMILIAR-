// Las etapas del libro de «Vitácora de una historia» (receta, sección 1), sobre la máquina de Familiar (la Carpeta,
// el Ejecutor con su checkpoint por llamada, reintentos, tope de gasto y Batch, los snapshots por etapa, el arreglo,
// el corrector y el informe), que no se toca. Mismo recorrido que escritor/orquestador/etapa-{a,b,c}.ts con lo de
// historia: las llamadas de llamadas.ts, los controles de controles.ts y el armado de libro.ts.
//
// A · Leer todo (registro, C14) y Plan (C12, C13, C19, C20, C33), con hasta 2 reintentos cada uno, y las dudas de
//     datos para la familia (los prompts de fabrica.md de Familiar, tal cual).
// B · Las correcciones de la familia: al registro y al plan con el barato; si no pasan, Opus los rehace.
// C · Por capítulo, en orden: Armador, Capítulo (C30, una reescritura si deja afuera más de un tercio) y su ficha.
//     Después la carta a quien era (si hay), Sus frases, los controles, Hechos y Veedor, una ronda de arreglos con
//     su repaso, el corrector en dos pasadas, los títulos y el libro con su informe.
import { leerJSON, parseJSONTolerante } from '../escritor/carpeta.js';
import { controlarAfuera } from '../escritor/controles/afuera.js';
import { aplicarRepaso } from '../escritor/controles/aplicar-repaso.js';
import { aplicar, armar, juntar } from '../escritor/controles/arreglos.js';
import { estado, type Disputa } from '../escritor/controles/estado.js';
import { aplicarEstiloPieza } from '../escritor/controles/estilo.js';
import { informe } from '../escritor/controles/informe.js';
import { aplicarCorreccion, validarPlanCorregido } from '../escritor/correccion.js';
import { dudasDelRegistro, validarDudas, type DudaParaLaFamilia } from '../escritor/dudas.js';
import { ErrorJSON, TopeDeGasto, type Encargo } from '../escritor/ejecutor.js';
import { respuestas, salida } from '../escritor/lectura.js';
import type { Llamada } from '../escritor/llamadas/armar.js';
import { llamadaCorreccion, llamadaCorreccionPlan, llamadaDisputa, llamadaDudas } from '../escritor/llamadas/fabrica.js';
import { agregarConfirmados, type CorreccionFamilia } from '../escritor/material/a-carpeta.js';
import { cargarSnapshot, guardarSnapshot, type Contexto } from '../escritor/orquestador/contexto.js';
import { archivoDe } from '../escritor/texto.js';
import { controlarHistoria } from './controles.js';
import { armarLibroHistoria, informeHistoria, susFrasesHistoria } from './libro.js';
import { llamadaArmador, llamadaArreglo, llamadaCapitulo, llamadaCarta, llamadaEstilo, llamadaHechos, llamadaPlan, llamadaRegistro, llamadaResumen, llamadaSusFrases, llamadaTitulo, llamadaVeedor } from './llamadas.js';

export type ContextoHistoria = Contexto;

const nn = (n: number): string => String(n).padStart(2, '0');
const encargo = (l: Llamada, json: boolean, sufijo = ''): Encargo => ({ clave: `C/${l.nombre}${sufijo}`, llamada: l, json });
const reescritura = (l: Llamada): Encargo => ({ ...encargo(l, false, '#2'), esfuerzo: 'high' });
const copiarMd = (x: ContextoHistoria, a: string): void => { for (const f of x.c.listar('salidas').filter((f) => f.endsWith('.md'))) x.c.copiar(salida(f), `${a}/${f}`); };

async function conCostos<T>(x: ContextoHistoria, f: () => Promise<T>): Promise<T> {
  // Lo pagado queda anotado aunque la etapa corte (reintentos agotados, tope, error de la API).
  try {
    return await f();
  } finally {
    await x.ej.guardarCostos();
  }
}

/** El registro o el plan con sus controles: si ya está y pasa, no se rehace; si no, hasta 2 reintentos con el error (contexto.ts de Familiar). */
export async function conReintentosHistoria(x: ContextoHistoria, paso: 'registro' | 'plan', prefijo: 'A/' | 'B/'): Promise<boolean> {
  const archivo = salida(paso === 'registro' ? 'registro.json' : 'plan.json');
  if (x.c.existe(archivo) && controlarHistoria(x.c, paso).codigo === 0) {
    x.log(`${paso}: ya estaba y pasa`);
    return true;
  }
  for (let i = 0; i <= 2; i++) {
    const error = i ? x.c.leer(`controles/${paso}.json`) : undefined;
    const llamada = paso === 'registro' ? llamadaRegistro(x.c, { error }) : llamadaPlan(x.c, { error });
    let texto: string;
    try {
      texto = await x.ej.uno({ clave: `${prefijo}${llamada.nombre}${i ? `#${i + 1}` : ''}`, llamada, json: true, maxTokens: 128000 });
    } catch (err) {
      if (!(err instanceof ErrorJSON)) throw err;
      x.c.escribir(`controles/${paso}.json`, JSON.stringify([{ control: 'JSON', que: 'la respuesta no es un JSON válido (no parsea): devolvé solo el JSON pedido' }], null, 1));
      x.log(`${paso}: ${err.message}`);
      continue;
    }
    x.c.escribir(archivo, texto);
    const r = controlarHistoria(x.c, paso);
    x.log(`${paso}: ${r.resumen.split('\n')[0]}`);
    if (r.codigo === 0) return true;
  }
  return false;
}

// ---------- A ----------

export type ResultadoAHistoria = { ok: true; capitulos: number; dudas: DudaParaLaFamilia[] } | { ok: false; motivo: string };

export async function etapaAHistoria(x: ContextoHistoria): Promise<ResultadoAHistoria> {
  return conCostos(x, async () => {
    if (!(await conReintentosHistoria(x, 'registro', 'A/'))) return { ok: false, motivo: 'el registro no pasa C14 después de 2 reintentos' };
    if (!(await conReintentosHistoria(x, 'plan', 'A/'))) return { ok: false, motivo: 'el plan no pasa C12/C13/C19/C20/C33 después de 2 reintentos' };
    const dudas = dudasDelRegistro(leerJSON(x.c, salida('registro.json')), respuestas(x.c));
    let paraFamilia: DudaParaLaFamilia[] = [];
    if (dudas.length) {
      const llamada = llamadaDudas(x.c, dudas, { propia: x.propia });
      try {
        paraFamilia = validarDudas(dudas, parseJSONTolerante(await x.ej.uno({ clave: 'A/dudas', llamada, json: true })));
      } catch (err) {
        if (err instanceof TopeDeGasto) throw err;
        x.log(`dudas: ${(err as Error).message}; se piden otra vez`);
        try {
          paraFamilia = validarDudas(dudas, parseJSONTolerante(await x.ej.uno({ clave: 'A/dudas#2', llamada, json: true })));
        } catch (err2) {
          if (err2 instanceof TopeDeGasto) throw err2;
          return { ok: false, motivo: `las dudas para la familia no salieron: ${(err2 as Error).message}` };
        }
      }
    }
    const json = JSON.stringify({ dudas: paraFamilia }, null, 1);
    x.c.escribir(salida('dudas-familia.json'), json);
    await x.almacen.escribir('dudas-familia.json', json);
    await guardarSnapshot(x, 'A');
    return { ok: true, capitulos: leerJSON(x.c, salida('plan.json')).capitulos.length, dudas: paraFamilia };
  });
}

// ---------- B ----------

export type ResultadoBHistoria = { ok: true; corregido: 'nada' | 'barato' | 'opus' } | { ok: false; motivo: string };

/** Como la Etapa B de Familiar: arranca siempre de la carpeta de la A (agregarConfirmados no es idempotente). */
export async function etapaBHistoria(x: ContextoHistoria, correcciones: CorreccionFamilia[]): Promise<ResultadoBHistoria> {
  return conCostos(x, async () => {
    const terminar = async (r: ResultadoBHistoria): Promise<ResultadoBHistoria> => { await guardarSnapshot(x, 'B'); return r; };
    const a = await cargarSnapshot(x.almacen, 'A');
    if (a) {
      for (const ruta of Object.keys(x.c.aObjeto())) x.c.borrar(ruta);
      for (const [ruta, texto] of Object.entries(a.aObjeto())) x.c.escribir(ruta, texto);
    }
    if (!agregarConfirmados(x.c, correcciones) && !correcciones.some((k) => k.texto.trim())) return terminar({ ok: true, corregido: 'nada' });
    try {
      const texto = await x.ej.uno({ clave: 'B/correccion-registro', llamada: llamadaCorreccion(x.c), json: true });
      x.c.escribir(salida('registro.json'), JSON.stringify(aplicarCorreccion(leerJSON(x.c, salida('registro.json')), parseJSONTolerante(texto)), null, 1));
      const r = controlarHistoria(x.c, 'registro');
      x.log(`registro corregido (barato): ${r.resumen.split('\n')[0]}`);
      if (r.codigo === 0) {
        try {
          const tp = await x.ej.uno({ clave: 'B/correccion-plan', llamada: llamadaCorreccionPlan(x.c), json: true });
          x.c.escribir(salida('plan.json'), JSON.stringify(validarPlanCorregido(leerJSON(x.c, salida('plan.json')), parseJSONTolerante(tp)), null, 1));
          const rp = controlarHistoria(x.c, 'plan');
          x.log(`plan corregido (barato): ${rp.resumen.split('\n')[0]}`);
          if (rp.codigo === 0) return terminar({ ok: true, corregido: 'barato' });
        } catch (err) {
          if (err instanceof TopeDeGasto) throw err;
          x.log(`la corrección barata del plan no sirvió (${(err as Error).message}); rehace Opus`);
        }
        x.c.borrar(salida('plan.json'));
        if (await conReintentosHistoria(x, 'plan', 'B/')) return terminar({ ok: true, corregido: 'opus' });
        return terminar({ ok: false, motivo: 'el plan no pasa sus controles con el registro corregido después de 2 reintentos' });
      }
    } catch (err) {
      if (err instanceof TopeDeGasto) throw err;
      x.log(`la corrección barata no sirvió (${(err as Error).message}); rehace Opus`);
    }
    x.c.borrar(salida('registro.json'));
    x.c.borrar(salida('plan.json'));
    if (!(await conReintentosHistoria(x, 'registro', 'B/'))) return terminar({ ok: false, motivo: 'el registro no pasa C14 después de 2 reintentos (Etapa B)' });
    if (!(await conReintentosHistoria(x, 'plan', 'B/'))) return terminar({ ok: false, motivo: 'el plan no pasa sus controles después de 2 reintentos (Etapa B)' });
    return terminar({ ok: true, corregido: 'opus' });
  });
}

// ---------- C ----------

export type ResultadoCHistoria = { libro: string; informe: string; capitulos: number; arreglados: string[]; disputas: number; controlesFinal: string; usd: number };

async function disputas(x: ContextoHistoria, ds: Disputa[], grupo: string): Promise<void> {
  if (!ds.length) return;
  const docs = JSON.parse(x.c.leer('llamadas/4-hechos.docs.json')) as string[];
  const r = await x.ej.varios(ds.map((d) => encargo(llamadaDisputa(docs, d), true)), { lote: x.usarLote, grupo });
  for (const d of ds) {
    const t = r.textos.get(`C/disputa-${d.clave}`);
    if (t !== undefined) x.c.escribir(`arreglos/disputa-${d.clave}.json`, t);
    else x.log(`disputa ${d.clave}: sin respuesta válida; queda "sin decidir" en el informe`);
  }
}

export async function etapaCHistoria(x: ContextoHistoria): Promise<ResultadoCHistoria> {
  return conCostos(x, async () => {
    const { c, ej, log } = x;
    const caps = (estado(c, 'capitulos') as { n: number[] }).n;
    log(`plan: ${caps.length} capítulos`);

    // 2h, 3b, 3r: en orden, cada capítulo con la ficha de lo ya escrito.
    for (const n of caps) {
      c.escribir(salida(`historias/cap_${n}.md`), await ej.uno(encargo(llamadaArmador(c, n), false)));
      c.escribir(salida(archivoDe(`cap_${n}`)), await ej.uno(encargo(llamadaCapitulo(c, n), false)));
      let af = controlarAfuera(c, n);
      log(af.resumen);
      if (af.codigo === 3) {
        c.escribir(salida(archivoDe(`cap_${n}`)), await ej.uno(reescritura(llamadaCapitulo(c, n, { error: c.leer(`controles/afuera-cap_${n}.json`) }))));
        af = controlarAfuera(c, n);
        log(af.resumen);
      }
      c.escribir(salida(`resumenes/cap_${n}.md`), await ej.uno(encargo(llamadaResumen(c, `cap_${n}`), false)));
    }
    // 3c y 3e: la carta a quien era (si el plan la trae) y Sus frases.
    const carta = llamadaCarta(c);
    if (carta) c.escribir(salida('carta.md'), await ej.uno(encargo(carta, false)));
    c.escribir(salida('sus_frases.json'), await ej.uno(encargo(llamadaSusFrases(c), true)));
    log(susFrasesHistoria(c));
    log(`controles de piezas: ${controlarHistoria(c, 'piezas').resumen.split('\n')[0]}`);

    // 4 y 5c: hechos y veedor, en paralelo.
    copiarMd(x, 'sin-revision');
    const hechos = llamadaHechos(c, { repaso: false });
    c.escribir('llamadas/4-hechos.docs.json', JSON.stringify(hechos.docs));
    const rev = await ej.varios([encargo(hechos, true), encargo(llamadaVeedor(c), true)], { lote: x.usarLote, grupo: 'C-revision' });
    for (const [clave, archivo] of [['C/4-hechos', 'hechos.json'], ['C/5c-veedor', 'veedor.json']] as const) {
      const t = rev.textos.get(clave);
      if (t !== undefined) c.escribir(salida(archivo), t);
      else log(`${clave}: sin respuesta válida (${rev.fallas.get(clave) ?? 'sin detalle'}); se sigue sin esa lista`);
    }

    // 6: una ronda de arreglos, con C9, las disputas y el repaso de hechos (C26).
    log(`juntar:\n${juntar(c, { soloHechos: true })}`);
    const aArreglar = (estado(c, 'arreglos') as { piezas: string[] }).piezas;
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
      c9.push(controlarHistoria(c, 'arreglo', p).resumen);
      log(aplicar(c, p));
    }
    if (c9.length) log(c9.join('\n'));
    const disp1 = (estado(c, 'disputas') as { disputas: Disputa[] }).disputas;
    await disputas(x, disp1, 'C-disputas');
    if (arreglados.length) {
      try {
        c.escribir(salida('hechos-repaso.json'), await ej.uno(encargo(llamadaHechos(c, { repaso: true }), true)));
        log(controlarHistoria(c, 'repaso').resumen);
        await disputas(x, (estado(c, 'repaso') as { disputas: Disputa[] }).disputas, 'C-disputas-repaso');
        const ap = aplicarRepaso(c);
        log(`repaso aplicado: ${ap.aplicados.length} corregidos, ${ap.salteados.length} quedan abiertos en el informe`);
      } catch (err) {
        if (!(err instanceof ErrorJSON)) throw err;
        log(`repaso de hechos: ${err.message}; se sigue sin repaso`);
      }
    }

    // 7: corrector, dos pasadas, sobre los capítulos y la carta.
    const PIEZAS = [...caps.map((n) => `cap_${n}`), ...(c.existe(salida('carta.md')) ? ['carta'] : [])];
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

    // 3t: los títulos de los capítulos.
    const tit = await ej.varios(caps.map((n) => encargo(llamadaTitulo(c, n), true)), { lote: x.usarLote, grupo: 'C-titulos' });
    for (const n of caps) {
      const t = tit.textos.get(`C/3t-titulo-${nn(n)}`);
      if (t !== undefined) c.escribir(salida(`titulos/cap_${n}.json`), t);
    }

    // 8: controles, libro e informe.
    const fin = controlarHistoria(c, 'piezas');
    log(armarLibroHistoria(c));
    const inf = `${informe(c)}${informeHistoria(c)}`;
    c.escribir('informe.md', inf);
    await x.almacen.escribir('libro.md', c.leer('libro.md'));
    await x.almacen.escribir('informe.md', inf);
    await guardarSnapshot(x, 'C');
    return { libro: c.leer('libro.md'), informe: inf, capitulos: caps.length, arreglados, disputas: disp1.length, controlesFinal: fin.resumen.split('\n')[0], usd: ej.gastado };
  });
}

// ---------- Todo ----------

export type ResultadoHistoria =
  | { estado: 'listo'; capitulos: number; dudas: DudaParaLaFamilia[]; arreglados: string[]; usd: number; llamadas: number }
  | { estado: 'fallido'; motivo: string };

/**
 * A → B (con las correcciones que haya; sin correcciones no llama a ningún modelo) → C. Cada etapa arranca de lo
 * que dejó la anterior en la carpeta. En producción las dudas de la A van a la familia antes de la B (Task 5.3).
 */
export async function correrHistoria(x: ContextoHistoria, o: { correcciones?: CorreccionFamilia[] } = {}): Promise<ResultadoHistoria> {
  const a = await etapaAHistoria(x);
  if (!a.ok) return { estado: 'fallido', motivo: a.motivo };
  const b = await etapaBHistoria(x, o.correcciones ?? []);
  if (!b.ok) return { estado: 'fallido', motivo: b.motivo };
  const c = await etapaCHistoria(x);
  return { estado: 'listo', capitulos: c.capitulos, dudas: a.dudas, arreglados: c.arreglados, usd: c.usd, llamadas: x.ej.filas.length };
}
