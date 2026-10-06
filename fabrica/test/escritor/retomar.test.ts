// Si el proceso se corta a mitad del libro, volver a correr la etapa no paga de nuevo lo que ya se pagó
// y llega al mismo libro. Y con lote (Batch), el libro es el mismo y lo que el lote devuelve mal va sin lote.
import { describe, expect, it } from 'vitest';
import { AlmacenMemoria } from '../../src/escritor/almacen/memoria.js';
import { Ejecutor } from '../../src/escritor/ejecutor.js';
import { LoteFalso, ModeloFalso } from '../../src/escritor/modelo/falso.js';
import { ErrorDelModelo, type Modelo, type PedidoModelo } from '../../src/escritor/modelo/tipos.js';
import type { Contexto } from '../../src/escritor/orquestador/contexto.js';
import { etapaC } from '../../src/escritor/orquestador/etapa-c.js';
import { carpetaParaC, DEFECTOS_NELIDA, salidasModeloNelida } from './ayuda.js';

const falso = () => new ModeloFalso(salidasModeloNelida(), DEFECTOS_NELIDA);

describe('cortar y retomar', () => {
  it('el retomo no vuelve a llamar lo que ya estaba pagado y llega al mismo libro', async () => {
    const referencia = falso();
    const almacenRef = new AlmacenMemoria();
    const libro = (await etapaC({ c: carpetaParaC(), ej: new Ejecutor({ modelo: referencia, almacen: almacenRef }), almacen: almacenRef, log: () => {}, usarLote: false })).libro;

    const almacen = new AlmacenMemoria();
    const base = falso();
    let quedan = 7;
    const seCorta: Modelo = { llamar: async (p: PedidoModelo) => { if (quedan-- <= 0) throw new ErrorDelModelo('se cortó la luz', false); return base.llamar(p); } };
    await expect(etapaC({ c: carpetaParaC(), ej: new Ejecutor({ modelo: seCorta, almacen }), almacen, log: () => {}, usarLote: false })).rejects.toThrow('se cortó la luz');
    const pagadas = base.llamadas.map((p) => p.clave);
    expect(pagadas).toHaveLength(7);

    const segundo = falso();
    const ej = new Ejecutor({ modelo: segundo, almacen });
    const r = await etapaC({ c: carpetaParaC(), ej, almacen, log: () => {}, usarLote: false });
    expect(r.libro).toBe(libro);
    expect(segundo.llamadas.map((p) => p.clave).filter((k) => pagadas.includes(k))).toEqual([]);
    expect(segundo.llamadas).toHaveLength(referencia.llamadas.length - 7);
    expect(ej.filas.filter((f) => f.de_memoria)).toHaveLength(7);
  });
});

describe('Etapa C con lote', () => {
  it('mismo libro; las fases paralelas van por lote y lo que vuelve mal se repite sin lote', async () => {
    const sinLote = new AlmacenMemoria();
    const libro = (await etapaC({ c: carpetaParaC(), ej: new Ejecutor({ modelo: falso(), almacen: sinLote }), almacen: sinLote, log: () => {}, usarLote: false })).libro;

    const enLote = falso();
    const directo = falso();
    const lote = new LoteFalso(enLote, new Set(['7-estilo-carta']));
    const almacen = new AlmacenMemoria();
    const ej = new Ejecutor({ modelo: directo, lote, almacen });
    const x: Contexto = { c: carpetaParaC(), ej, almacen, log: () => {}, usarLote: true };
    expect((await etapaC(x)).libro).toBe(libro);
    expect(lote.grupos).toEqual(['C-revision', 'C-estilo-1', 'C-estilo-2', 'C-titulos']);
    expect(directo.llamadas.map((p) => p.clave)).toContain('C/7-estilo-carta');
    expect(directo.llamadas.map((p) => p.clave)).not.toContain('C/4-hechos');
    expect(ej.filas.filter((f) => f.lote).length).toBe(enLote.llamadas.length);
    expect(enLote.llamadas.map((p) => p.clave)).not.toContain('C/7-estilo-carta');
  });
});

describe('un solo capítulo desde lo que deja la Etapa B', () => {
  it('con solo registro y plan (como la prueba paga), la etapa termina y libro.md tiene ese capítulo solo', async () => {
    const modelo = falso();
    const almacen = new AlmacenMemoria();
    const x: Contexto = { c: carpetaParaC(), ej: new Ejecutor({ modelo, almacen }), almacen, log: () => {}, usarLote: false };
    const r = await etapaC(x, { soloCapitulo: 2 });
    const libro = x.c.leer('libro.md');
    expect(r.libro).toBe(libro);
    expect(libro.split('\n').filter((l) => /^# [IVXLC]+ · /.test(l))).toEqual(['# II · El bastidor en la falda']);
    expect(libro).not.toContain('La persiana de madera');
    expect(await almacen.leer('libro.md')).toBe(libro);
  });
});
