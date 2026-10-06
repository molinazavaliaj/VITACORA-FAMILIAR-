// fabrica/test/escritor/ejecutor.test.ts
import { describe, expect, it } from 'vitest';
import { AlmacenMemoria } from '../../src/escritor/almacen/memoria.js';
import { Ejecutor, ErrorJSON, OPCIONES_CLIENTE, TopeDeGasto, type Encargo } from '../../src/escritor/ejecutor.js';
import type { Llamada } from '../../src/escritor/llamadas/armar.js';
import { LoteFalso, ModeloFalso, claveBase } from '../../src/escritor/modelo/falso.js';
import { ErrorDelModelo, type Lote, type Modelo, type PedidoModelo, type RespuestaModelo } from '../../src/escritor/modelo/tipos.js';

const llamada = (nombre: string, instr = 'Hacé esto.'): Llamada => ({ nombre, docs: ['<ficha>\nf\n</ficha>', '<voz>\nv\n</voz>'], instr });
const enc = (clave: string, json = false, instr?: string): Encargo => ({ clave, llamada: llamada(claveBase(clave), instr), json });

describe('Ejecutor.uno', () => {
  it('memoriza: otro ejecutor con el mismo almacén no vuelve a llamar y cuenta lo ya pagado', async () => {
    const almacen = new AlmacenMemoria();
    const e1 = new Ejecutor({ modelo: new ModeloFalso({ '3b-capitulo-01': 'cap' }), almacen });
    expect(await e1.uno(enc('C/3b-capitulo-01'))).toBe('cap');
    expect(e1.filas).toEqual([{ clave: 'C/3b-capitulo-01', modelo: 'claude-opus-5-5', lote: false, de_memoria: false, input: 1000, output: 100, cache_write: 0, cache_read: 0, usd: 0.006 }]);
    const m2 = new ModeloFalso({});
    const e2 = new Ejecutor({ modelo: m2, almacen });
    expect(await e2.uno(enc('C/3b-capitulo-01'))).toBe('cap');
    expect(m2.llamadas).toHaveLength(0);
    expect(e2.filas).toEqual([{ ...e1.filas[0], de_memoria: true }]);
    expect(e2.gastado).toBe(0.006);
  });

  it('si el pedido cambió (otro material), la memoria no sirve: se llama de nuevo', async () => {
    const almacen = new AlmacenMemoria();
    await new Ejecutor({ modelo: new ModeloFalso({ '3b-capitulo-01': 'viejo' }), almacen }).uno(enc('C/3b-capitulo-01', false, 'versión 1'));
    const m = new ModeloFalso({ '3b-capitulo-01': 'nuevo' });
    expect(await new Ejecutor({ modelo: m, almacen }).uno(enc('C/3b-capitulo-01', false, 'versión 2'))).toBe('nuevo');
    expect(m.llamadas).toHaveLength(1);
  });

  it('un JSON que no parsea se pide una vez más con otra clave; dos veces, ErrorJSON', async () => {
    const m = new ModeloFalso({ '4-hechos': 'no es json', '4-hechos#json': '```json\n{"problemas": []}\n```' });
    expect(await new Ejecutor({ modelo: m, almacen: new AlmacenMemoria() }).uno(enc('C/4-hechos', true))).toContain('"problemas"');
    expect(m.llamadas.map((p) => p.clave)).toEqual(['C/4-hechos', 'C/4-hechos#json']);
    await expect(new Ejecutor({ modelo: new ModeloFalso({ '4-hechos': 'x' }), almacen: new AlmacenMemoria() }).uno(enc('C/4-hechos', true))).rejects.toBeInstanceOf(ErrorJSON);
  });

  it('un error reintentable (red, 529) espera y reintenta; uno que no lo es corta enseguida', async () => {
    let fallas = 2;
    const inestable: Modelo = { llamar: async (): Promise<RespuestaModelo> => { if (fallas-- > 0) throw new ErrorDelModelo('529 overloaded', true); return { texto: 'ok', uso: { input_tokens: 1 }, motivoFin: 'end_turn' }; } };
    const esperas: number[] = [];
    const e = new Ejecutor({ modelo: inestable, almacen: new AlmacenMemoria(), esperar: async (ms) => { esperas.push(ms); }, esperasMs: [10, 20, 30] });
    expect(await e.uno(enc('C/3r-resumen-cap_1'))).toBe('ok');
    expect(esperas).toEqual([10, 20]);
    const rechazo: Modelo = { llamar: async () => { throw new ErrorDelModelo('refusal', false); } };
    await expect(new Ejecutor({ modelo: rechazo, almacen: new AlmacenMemoria(), esperar: async () => {} }).uno(enc('C/x'))).rejects.toThrow('refusal');
  });

  it('tope de gasto: con el tope alcanzado no se hace ninguna llamada nueva', async () => {
    const m = new ModeloFalso({}, [['', '{}']]);
    const e = new Ejecutor({ modelo: m, almacen: new AlmacenMemoria(), topeUsd: 0.01 });
    await e.uno(enc('C/a'));
    await e.uno(enc('C/b'));
    await expect(e.uno(enc('C/c'))).rejects.toBeInstanceOf(TopeDeGasto);
    expect(m.llamadas).toHaveLength(2);
  });

  it('el pedido usa Opus 5.5 en xhigh, salvo el rol barato (Sonnet 5.5, low)', () => {
    const e = new Ejecutor({ modelo: new ModeloFalso({}), almacen: new AlmacenMemoria() });
    expect(e.pedido(enc('C/3b-capitulo-01'))).toMatchObject({ modelo: 'claude-opus-5-5', esfuerzo: 'xhigh', maxTokens: 64000, cacheEn: [1] });
    expect(e.pedido({ ...enc('B/correccion-registro'), rol: 'barato' })).toMatchObject({ modelo: 'claude-sonnet-5-5', esfuerzo: 'low' });
    expect(e.pedido({ ...enc('A/1-registro'), maxTokens: 128000 }).maxTokens).toBe(128000);
  });
});

describe('Ejecutor.uno: cortes por max_tokens y lo que cuesta fallar (revisión de la Task 14)', () => {
  const corte = (): ErrorDelModelo => new ErrorDelModelo('la respuesta se cortó por max_tokens', true, { uso: { input_tokens: 1000, output_tokens: 64000 }, porMaxTokens: true });

  it('un corte por max_tokens se repite una sola vez, sin esperar, con el mismo pedido', async () => {
    const vistos: PedidoModelo[] = [];
    let cortes = 1;
    const m: Modelo = { llamar: async (p) => { vistos.push(p); if (cortes-- > 0) throw corte(); return { texto: 'entero', uso: { input_tokens: 1000, output_tokens: 100 }, motivoFin: 'end_turn' }; } };
    const esperas: number[] = [];
    const e = new Ejecutor({ modelo: m, almacen: new AlmacenMemoria(), esperar: async (ms) => { esperas.push(ms); } });
    expect(await e.uno(enc('C/3b-capitulo-01'))).toBe('entero');
    expect(vistos).toHaveLength(2);
    expect(vistos[1]).toEqual(vistos[0]);
    expect(esperas).toEqual([]);
  });

  it('dos cortes por max_tokens: la llamada falla (no reintentable) y no se sigue pagando', async () => {
    let llamadas = 0;
    const m: Modelo = { llamar: async () => { llamadas++; throw corte(); } };
    const e = new Ejecutor({ modelo: m, almacen: new AlmacenMemoria(), esperar: async () => {} });
    const err = await e.uno(enc('C/3b-capitulo-01')).catch((x: unknown) => x);
    expect(err).toBeInstanceOf(ErrorDelModelo);
    expect((err as ErrorDelModelo).reintentable).toBe(false);
    expect(llamadas).toBe(2);
  });

  it('lo que se pagó en un intento fallido suma al gasto y frena el tope', async () => {
    // Cada corte: 1000 in + 64000 out en Opus 5.5 = 0,004 + 1,28 = USD 1,284.
    const m: Modelo = { llamar: async () => { throw corte(); } };
    const e = new Ejecutor({ modelo: m, almacen: new AlmacenMemoria(), esperar: async () => {}, topeUsd: 2 });
    await expect(e.uno(enc('C/a'))).rejects.toBeInstanceOf(ErrorDelModelo);
    expect(e.gastado).toBe(2.568);
    expect(e.filas.map((f) => [f.clave, f.falla, f.usd])).toEqual([['C/a', true, 1.284], ['C/a', true, 1.284]]);
    await expect(e.uno(enc('C/b'))).rejects.toBeInstanceOf(TopeDeGasto);
  });

  it('un rechazo con uso también se cobra; la memoria de la clave sigue vacía', async () => {
    const almacen = new AlmacenMemoria();
    const m: Modelo = { llamar: async () => { throw new ErrorDelModelo('refusal', false, { uso: { input_tokens: 1000, output_tokens: 100 } }); } };
    const e = new Ejecutor({ modelo: m, almacen });
    await expect(e.uno(enc('C/x'))).rejects.toThrow('refusal');
    expect(e.gastado).toBe(0.006);
    expect(await almacen.leer('pasos/C/x.json')).toBeNull();
    await e.guardarCostos();
    expect(JSON.parse((await almacen.leer('costos.json')) as string)).toMatchObject({ total_usd: 0.006 });
  });

  it('el cliente real se crea sin reintentos propios: los reintentos son solo los del ejecutor', () => {
    expect(OPCIONES_CLIENTE).toEqual({ maxRetries: 0 });
  });
});

describe('Ejecutor.varios', () => {
  it('sin lote: en paralelo con límite; las fallas de JSON quedan a un costado', async () => {
    let activos = 0;
    let maximo = 0;
    const lento: Modelo = {
      llamar: async (p: PedidoModelo): Promise<RespuestaModelo> => {
        activos++; maximo = Math.max(maximo, activos);
        await new Promise((r) => setTimeout(r, 5));
        activos--;
        // también el reintento (C/7-estilo-p3#json) vuelve roto: así queda en fallas.
        return { texto: p.clave.includes('-p3') ? 'roto' : '{"ok": true}', uso: { input_tokens: 1 }, motivoFin: 'end_turn' };
      },
    };
    const e = new Ejecutor({ modelo: lento, almacen: new AlmacenMemoria(), limite: 2 });
    const r = await e.varios(['C/7-estilo-p1', 'C/7-estilo-p2', 'C/7-estilo-p3', 'C/7-estilo-p4'].map((k) => enc(k, true)), { lote: false, grupo: 'C-estilo-1' });
    expect(maximo).toBe(2);
    expect([...r.textos.keys()].sort()).toEqual(['C/7-estilo-p1', 'C/7-estilo-p2', 'C/7-estilo-p4']);
    expect([...r.fallas.keys()]).toEqual(['C/7-estilo-p3']);
  });

  it('con lote: lo que vuelve bien se cobra a mitad de precio; lo que falla va sin lote; nada se cuenta dos veces', async () => {
    const salidas = { '7-estilo-cap_1': '{"cambios": []}', '7-estilo-cap_2': '{"cambios": []}' };
    const enLote = new ModeloFalso(salidas);
    const directo = new ModeloFalso(salidas);
    const almacen = new AlmacenMemoria();
    const e = new Ejecutor({ modelo: directo, lote: new LoteFalso(enLote, new Set(['7-estilo-cap_2'])), almacen });
    const r = await e.varios([enc('C/7-estilo-cap_1', true), enc('C/7-estilo-cap_2', true)], { lote: true, grupo: 'C-estilo-1' });
    expect(r.textos.size).toBe(2);
    // LoteFalso no le pasa al modelo lo que hace fallar: en el lote solo llega a responder cap_1.
    expect(enLote.llamadas.map((p) => p.clave)).toEqual(['C/7-estilo-cap_1']);
    expect(directo.llamadas.map((p) => p.clave)).toEqual(['C/7-estilo-cap_2']);
    expect(e.filas.map((f) => [f.clave, f.lote, f.de_memoria, f.usd])).toEqual([['C/7-estilo-cap_1', true, false, 0.003], ['C/7-estilo-cap_2', false, false, 0.006]]);
    await e.guardarCostos();
    expect(JSON.parse((await almacen.leer('costos.json')) as string)).toMatchObject({ total_usd: 0.009, tope_usd: 15 });
  });

  it('con lote: lo que el lote devolvió fallado pero cobrado (rechazo, corte) suma al gasto a precio de lote', async () => {
    const lote: Lote = { enviar: async (_g, ps) => ps.map((p) => ({ clave: p.clave, ok: false as const, error: 'max_tokens', uso: { input_tokens: 1000, output_tokens: 100 } })) };
    const e = new Ejecutor({ modelo: new ModeloFalso({ '7-estilo-cap_1': '{}' }), lote, almacen: new AlmacenMemoria() });
    await e.varios([enc('C/7-estilo-cap_1', true)], { lote: true, grupo: 'G' });
    expect(e.filas.map((f) => [f.clave, f.lote, f.falla, f.usd])).toEqual([['C/7-estilo-cap_1', true, true, 0.003], ['C/7-estilo-cap_1', false, undefined, 0.006]]);
    expect(e.gastado).toBe(0.009);
  });
});
