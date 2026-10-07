// fabrica/test/escritor/ejecutor.test.ts
import { describe, expect, it } from 'vitest';
import { AlmacenMemoria } from '../../src/escritor/almacen/memoria.js';
import { Ejecutor, ErrorJSON, OPCIONES_CLIENTE, TopeDeGasto, type Encargo } from '../../src/escritor/ejecutor.js';
import { maxSalidaDe } from '../../src/escritor/modelo/configuracion.js';
import { hashDePedido } from '../../src/escritor/modelo/pedido.js';
import type { Llamada } from '../../src/escritor/llamadas/armar.js';
import { LoteFalso, ModeloFalso, claveBase } from '../../src/escritor/modelo/falso.js';
import { ErrorDelModelo, type Lote, type Modelo, type PedidoModelo, type RespuestaModelo } from '../../src/escritor/modelo/tipos.js';

const llamada = (nombre: string, instr = 'Hacé esto.'): Llamada => ({ nombre, docs: ['<ficha>\nf\n</ficha>', '<voz>\nv\n</voz>'], instr });
const enc = (clave: string, json = false, instr?: string): Encargo => ({ clave, llamada: llamada(claveBase(clave), instr), json });

describe('Ejecutor.uno', () => {
  it('memoriza: otro ejecutor con el mismo almacén no vuelve a llamar y cuenta lo ya pagado', async () => {
    const almacen = new AlmacenMemoria();
    const e1 = new Ejecutor({ modelo: new ModeloFalso({ '6-arreglo-cap_1': 'cap' }), almacen });
    expect(await e1.uno(enc('C/6-arreglo-cap_1'))).toBe('cap');
    expect(e1.filas).toEqual([{ clave: 'C/6-arreglo-cap_1', modelo: 'claude-opus-5-5', lote: false, de_memoria: false, input: 1000, output: 100, cache_write: 0, cache_read: 0, usd: 0.006 }]);
    const m2 = new ModeloFalso({});
    const e2 = new Ejecutor({ modelo: m2, almacen });
    expect(await e2.uno(enc('C/6-arreglo-cap_1'))).toBe('cap');
    expect(m2.llamadas).toHaveLength(0);
    expect(e2.filas).toEqual([{ ...e1.filas[0], de_memoria: true }]);
    expect(e2.gastado).toBe(0.006);
  });

  it('si el pedido cambió (otro material), la memoria no sirve: se llama de nuevo', async () => {
    const almacen = new AlmacenMemoria();
    await new Ejecutor({ modelo: new ModeloFalso({ '6-arreglo-cap_1': 'viejo' }), almacen }).uno(enc('C/6-arreglo-cap_1', false, 'versión 1'));
    const m = new ModeloFalso({ '6-arreglo-cap_1': 'nuevo' });
    expect(await new Ejecutor({ modelo: m, almacen }).uno(enc('C/6-arreglo-cap_1', false, 'versión 2'))).toBe('nuevo');
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

  it('el pedido sale de la configuración económica: modelo y pensamiento por el nombre de la llamada', () => {
    const e = new Ejecutor({ modelo: new ModeloFalso({}), almacen: new AlmacenMemoria() });
    expect(e.pedido({ clave: 'C/3b-capitulo-01', llamada: llamada('3b-capitulo-01'), json: false })).toMatchObject({ modelo: 'claude-opus-5-5', esfuerzo: 'xhigh', maxTokens: 128000, cacheEn: [1] });
    expect(e.pedido(enc('C/6-arreglo-cap_1'))).toMatchObject({ modelo: 'claude-opus-5-5', esfuerzo: 'medium', maxTokens: 64000 });
    // La reescritura C30 baja a alto; un esfuerzo pedido nunca sube el del rol.
    expect(e.pedido({ clave: 'C/3b-capitulo-01#2', llamada: llamada('3b-capitulo-01'), json: false, esfuerzo: 'high' }).esfuerzo).toBe('high');
    expect(e.pedido({ ...enc('C/6-arreglo-cap_1'), esfuerzo: 'xhigh' }).esfuerzo).toBe('medium');
    expect(e.pedido({ clave: 'C/7-estilo-cap_1', llamada: llamada('7-estilo-cap_1'), json: true, esfuerzo: 'low' })).not.toHaveProperty('esfuerzo');
    const haiku = e.pedido(enc('B/correccion-registro'));
    expect(haiku).toMatchObject({ modelo: 'claude-haiku-4-5', pensamiento: 8000, maxTokens: 64000 });
    expect('esfuerzo' in haiku).toBe(false);
    expect(e.pedido({ ...enc('A/1-registro'), maxTokens: 128000 }).maxTokens).toBe(128000);
  });

  it('la caché de 1 hora va solo en los hechos, el repaso y las disputas, y solo si hay dónde marcarla', () => {
    const e = new Ejecutor({ modelo: new ModeloFalso({}), almacen: new AlmacenMemoria() });
    const docs = ['l', 'g', 'f', 'r', 'reg', 'lib', 'pres', 'pas'];
    const de = (nombre: string): Encargo => ({ clave: `C/${nombre}`, llamada: { nombre, docs, instr: 'x' }, json: true });
    expect(e.pedido(de('4-hechos'))).toMatchObject({ cacheEn: [4, 7], cacheUnaHora: true, maxTokens: 128000, esfuerzo: 'medium' });
    expect(e.pedido(de('disputa-cap_1-1'))).toMatchObject({ cacheEn: [4, 7], cacheUnaHora: true });
    expect('cacheUnaHora' in e.pedido(enc('C/6-arreglo-cap_1'))).toBe(false);
  });
});

describe('Ejecutor.uno: cortes por max_tokens y lo que cuesta fallar (revisión de la Task 14)', () => {
  const corte = (): ErrorDelModelo => new ErrorDelModelo('la respuesta se cortó por max_tokens', true, { uso: { input_tokens: 1000, output_tokens: 64000 }, porMaxTokens: true });

  it('un corte por max_tokens se repite una sola vez, sin esperar, con el máximo de salida (otro pedido)', async () => {
    const vistos: PedidoModelo[] = [];
    let cortes = 1;
    const m: Modelo = { llamar: async (p) => { vistos.push(p); if (cortes-- > 0) throw corte(); return { texto: 'entero', uso: { input_tokens: 1000, output_tokens: 100 }, motivoFin: 'end_turn' }; } };
    const esperas: number[] = [];
    const almacen = new AlmacenMemoria();
    const e = new Ejecutor({ modelo: m, almacen, esperar: async (ms) => { esperas.push(ms); } });
    expect(await e.uno(enc('C/6-arreglo-cap_1'))).toBe('entero');
    expect(vistos.map((p) => p.maxTokens)).toEqual([64000, 128000]);
    expect(hashDePedido(vistos[1])).not.toBe(hashDePedido(vistos[0]));
    expect(vistos[1]).toEqual({ ...vistos[0], maxTokens: 128000 });
    expect(esperas).toEqual([]);
    // Al retomar, la respuesta (la del pedido con el máximo) sale de la memoria: no se paga otra vez.
    const m2 = new ModeloFalso({});
    expect(await new Ejecutor({ modelo: m2, almacen }).uno(enc('C/6-arreglo-cap_1'))).toBe('entero');
    expect(m2.llamadas).toHaveLength(0);
  });

  it('si el pedido ya tenía el máximo de salida, un corte no se repite: falla', async () => {
    let llamadas = 0;
    const m: Modelo = { llamar: async () => { llamadas++; throw corte(); } };
    const e = new Ejecutor({ modelo: m, almacen: new AlmacenMemoria(), esperar: async () => {} });
    const err = await e.uno({ ...enc('A/1-registro'), maxTokens: 128000 }).catch((x: unknown) => x);
    expect(err).toBeInstanceOf(ErrorDelModelo);
    expect((err as ErrorDelModelo).reintentable).toBe(false);
    expect(llamadas).toBe(1);
  });

  it('dos cortes por max_tokens: la llamada falla (no reintentable) y no se sigue pagando', async () => {
    let llamadas = 0;
    const m: Modelo = { llamar: async () => { llamadas++; throw corte(); } };
    const e = new Ejecutor({ modelo: m, almacen: new AlmacenMemoria(), esperar: async () => {} });
    const err = await e.uno(enc('C/6-arreglo-cap_1')).catch((x: unknown) => x);
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

  it('lo pagado en intentos fallidos queda en el almacén: al volver a correr cuenta para el gasto y el tope', async () => {
    const almacen = new AlmacenMemoria();
    const m: Modelo = { llamar: async () => { throw corte(); } };
    const e1 = new Ejecutor({ modelo: m, almacen, esperar: async () => {}, topeUsd: 3 });
    await expect(e1.uno(enc('C/a'))).rejects.toBeInstanceOf(ErrorDelModelo);
    expect(e1.gastado).toBe(2.568);
    // Se vuelve a correr con otra clave (C/a no se toca más): el gasto viejo cuenta igual.
    const m2 = new ModeloFalso({}, [['', 'ok']], { input_tokens: 1000, output_tokens: 64000 });
    const e2 = new Ejecutor({ modelo: m2, almacen, topeUsd: 3 });
    expect(await e2.uno(enc('C/b'))).toBe('ok');
    expect(e2.gastado).toBe(3.852);
    expect(e2.filas.map((f) => [f.clave, f.falla, f.de_memoria])).toEqual([['C/a', true, true], ['C/a', true, true], ['C/b', undefined, false]]);
    await expect(e2.uno(enc('C/c'))).rejects.toBeInstanceOf(TopeDeGasto);
    expect(m2.llamadas).toHaveLength(1);
    await e2.guardarCostos();
    expect(JSON.parse((await almacen.leer('costos.json')) as string)).toMatchObject({ total_usd: 3.852 });
    // Un tercer ejecutor no las cuenta dos veces.
    const e3 = new Ejecutor({ modelo: new ModeloFalso({}), almacen });
    await e3.guardarCostos();
    expect(e3.gastado).toBe(2.568);
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
    expect(e.filas.map((f) => [f.clave, f.lote, f.de_memoria, f.usd])).toEqual([['C/7-estilo-cap_1', true, false, 0.00075], ['C/7-estilo-cap_2', false, false, 0.0015]]);
    await e.guardarCostos();
    expect(JSON.parse((await almacen.leer('costos.json')) as string)).toMatchObject({ total_usd: 0.00225, tope_usd: 15 });
  });

  it('con lote: lo que el lote devolvió fallado pero cobrado (rechazo, corte) suma al gasto a precio de lote', async () => {
    const lote: Lote = { enviar: async (_g, ps) => ps.map((p) => ({ clave: p.clave, ok: false as const, error: 'max_tokens', uso: { input_tokens: 1000, output_tokens: 100 } })) };
    const e = new Ejecutor({ modelo: new ModeloFalso({ '7-estilo-cap_1': '{}' }), lote, almacen: new AlmacenMemoria() });
    await e.varios([enc('C/7-estilo-cap_1', true)], { lote: true, grupo: 'G' });
    expect(e.filas.map((f) => [f.clave, f.lote, f.falla, f.usd])).toEqual([['C/7-estilo-cap_1', true, true, 0.00075], ['C/7-estilo-cap_1', false, undefined, 0.0015]]);
    expect(e.gastado).toBe(0.00225);
  });

  it('un corte por max_tokens en el lote cuenta: sin lote se intenta una sola vez más (dos cortes pagos como mucho)', async () => {
    const lote: Lote = { enviar: async (_g, ps) => ps.map((p) => ({ clave: p.clave, ok: false as const, error: 'la respuesta se cortó por max_tokens', porMaxTokens: true, uso: { input_tokens: 1000, output_tokens: 100 } })) };
    let directas = 0;
    const maximos: number[] = [];
    const m: Modelo = { llamar: async (p) => { directas++; maximos.push(p.maxTokens); throw new ErrorDelModelo('la respuesta se cortó por max_tokens', true, { uso: { input_tokens: 1000, output_tokens: 100 }, porMaxTokens: true }); } };
    const e = new Ejecutor({ modelo: m, lote, almacen: new AlmacenMemoria(), esperar: async () => {} });
    const r = await e.varios([enc('C/6-arreglo-cap_1')], { lote: true, grupo: 'G' });
    expect(directas).toBe(1);
    // El corte del lote fue el primero: el intento sin lote ya sale con el máximo de salida.
    expect(maximos).toEqual([maxSalidaDe('claude-opus-5-5')]);
    expect([...r.fallas.keys()]).toEqual(['C/6-arreglo-cap_1']);
    expect(e.filas.filter((f) => f.falla)).toHaveLength(2);
  });

  it('si la fase falla, ningún trabajador arranca otra llamada paga', async () => {
    const claves: string[] = [];
    const m: Modelo = {
      llamar: async (p) => {
        claves.push(p.clave);
        if (p.clave === 'C/p1') throw new Error('se rompió algo que no es del modelo');
        await new Promise((r) => setTimeout(r, 20));
        return { texto: 'ok', uso: { input_tokens: 1 }, motivoFin: 'end_turn' };
      },
    };
    const e = new Ejecutor({ modelo: m, almacen: new AlmacenMemoria(), limite: 2 });
    await expect(e.varios(['C/p1', 'C/p2', 'C/p3', 'C/p4', 'C/p5'].map((k) => enc(k)), { lote: false, grupo: 'G' })).rejects.toThrow('se rompió');
    await new Promise((r) => setTimeout(r, 100));
    expect(claves).toEqual(['C/p1', 'C/p2']);
  });
});

describe('Ejecutor con todoPorLote (configuración económica: también las llamadas de a una van por Batch)', () => {
  /** Un lote que anota cada grupo y cada pedido, y responde con `responder`. */
  const loteQue = (responder: (p: PedidoModelo, i: number) => Awaited<ReturnType<Lote['enviar']>>[number]) => {
    const grupos: string[] = [];
    const pedidos: PedidoModelo[] = [];
    const lote: Lote = { enviar: async (g, ps) => { grupos.push(g); return ps.map((p) => { pedidos.push(p); return responder(p, pedidos.length - 1); }); } };
    return { lote, grupos, pedidos };
  };
  const bien = (texto: string) => (p: PedidoModelo) => ({ clave: p.clave, ok: true as const, respuesta: { texto, uso: { input_tokens: 1000, output_tokens: 100 }, motivoFin: 'end_turn' } });

  it('una llamada sola va en un lote de una, a mitad de precio; el grupo no lleva "#"', async () => {
    const { lote, grupos } = loteQue(bien('cap'));
    const directo = new ModeloFalso({});
    const almacen = new AlmacenMemoria();
    const e = new Ejecutor({ modelo: directo, lote, todoPorLote: true, almacen });
    expect(await e.uno(enc('C/6-arreglo-cap_1#2'))).toBe('cap');
    expect(grupos).toEqual(['uno/C/6-arreglo-cap_1__2']);
    expect(directo.llamadas).toHaveLength(0);
    expect(e.filas.map((f) => [f.clave, f.lote, f.usd])).toEqual([['C/6-arreglo-cap_1#2', true, 0.003]]);
    // Al retomar sale de la memoria: ni lote ni directa.
    const otro = loteQue(bien('otro'));
    expect(await new Ejecutor({ modelo: directo, lote: otro.lote, todoPorLote: true, almacen }).uno(enc('C/6-arreglo-cap_1#2'))).toBe('cap');
    expect(otro.grupos).toEqual([]);
  });

  it('sin todoPorLote, una llamada sola sale directa aunque haya lote (como antes)', async () => {
    const { lote, grupos } = loteQue(bien('x'));
    const directo = new ModeloFalso({ '6-arreglo-cap_1': 'directo' });
    expect(await new Ejecutor({ modelo: directo, lote, almacen: new AlmacenMemoria() }).uno(enc('C/6-arreglo-cap_1'))).toBe('directo');
    expect(grupos).toEqual([]);
  });

  it('si el lote vuelve con error (no un corte), la llamada sale directa con sus reintentos; lo cobrado suma', async () => {
    const { lote } = loteQue((p) => ({ clave: p.clave, ok: false, error: 'overloaded', uso: { input_tokens: 1000, output_tokens: 100 } }));
    const directo = new ModeloFalso({ '6-arreglo-cap_1': 'directo' });
    const e = new Ejecutor({ modelo: directo, lote, todoPorLote: true, almacen: new AlmacenMemoria() });
    expect(await e.uno(enc('C/6-arreglo-cap_1'))).toBe('directo');
    expect(directo.llamadas).toHaveLength(1);
    expect(e.filas.map((f) => [f.lote, f.falla, f.usd])).toEqual([[true, true, 0.003], [false, undefined, 0.006]]);
  });

  it('Haiku ya pide su máximo (64.000): un corte en el lote no se repite, ni por lote ni directo', async () => {
    const { lote, grupos } = loteQue((p) => ({ clave: p.clave, ok: false, error: 'max_tokens', porMaxTokens: true, uso: { input_tokens: 1000, output_tokens: 100 } }));
    const directo = new ModeloFalso({ '7-estilo-cap_1': '{}' });
    const err = await new Ejecutor({ modelo: directo, lote, todoPorLote: true, almacen: new AlmacenMemoria() }).uno(enc('C/7-estilo-cap_1', true)).catch((x: unknown) => x);
    expect(err).toBeInstanceOf(ErrorDelModelo);
    expect(grupos).toEqual(['uno/C/7-estilo-cap_1']);
    expect(directo.llamadas).toHaveLength(0);
  });

  it('Opus: el corte del lote se repite por lote con 128.000 (grupo "-max"); la respuesta queda con el hash del pedido original', async () => {
    const { lote, pedidos, grupos } = loteQue((p, i) => (i === 0
      ? { clave: p.clave, ok: false, error: 'max_tokens', porMaxTokens: true, uso: { input_tokens: 1000, output_tokens: 100 } }
      : bien('entero')(p)));
    const almacen = new AlmacenMemoria();
    const e = new Ejecutor({ modelo: new ModeloFalso({}), lote, todoPorLote: true, almacen });
    expect(await e.uno(enc('C/6-arreglo-cap_1'))).toBe('entero');
    expect(pedidos.map((p) => p.maxTokens)).toEqual([64000, 128000]);
    expect(grupos).toEqual(['uno/C/6-arreglo-cap_1', 'uno/C/6-arreglo-cap_1-max']);
    expect(e.filas.map((f) => [f.falla, f.lote])).toEqual([[true, true], [undefined, true]]);
    const m2 = new ModeloFalso({});
    expect(await new Ejecutor({ modelo: m2, almacen }).uno(enc('C/6-arreglo-cap_1'))).toBe('entero');
    expect(m2.llamadas).toHaveLength(0);
  });

  it('dos cortes por lote, o un corte de un pedido que ya tenía el máximo: falla sin seguir pagando', async () => {
    const corta = (p: PedidoModelo) => ({ clave: p.clave, ok: false as const, error: 'max_tokens', porMaxTokens: true, uso: { input_tokens: 1000, output_tokens: 100 } });
    const a = loteQue(corta);
    const directo = new ModeloFalso({ '6-arreglo-cap_1': 'no', '4-hechos': 'no' });
    const err = await new Ejecutor({ modelo: directo, lote: a.lote, todoPorLote: true, almacen: new AlmacenMemoria() }).uno(enc('C/6-arreglo-cap_1')).catch((x: unknown) => x);
    expect(err).toBeInstanceOf(ErrorDelModelo);
    expect((err as ErrorDelModelo).reintentable).toBe(false);
    expect(a.grupos).toHaveLength(2);
    // Los hechos ya piden 128.000: un corte no se repite.
    const b = loteQue(corta);
    const err2 = await new Ejecutor({ modelo: directo, lote: b.lote, todoPorLote: true, almacen: new AlmacenMemoria() }).uno(enc('C/4-hechos', true)).catch((x: unknown) => x);
    expect(err2).toBeInstanceOf(ErrorDelModelo);
    expect(b.grupos).toHaveLength(1);
    expect(directo.llamadas).toHaveLength(0);
  });

  it('el tope de gasto frena también el lote de una', async () => {
    const { lote, grupos } = loteQue(bien('x'));
    const e = new Ejecutor({ modelo: new ModeloFalso({}), lote, todoPorLote: true, almacen: new AlmacenMemoria(), topeUsd: 0.003 });
    await e.uno(enc('C/6-arreglo-cap_1'));
    await expect(e.uno(enc('C/6-arreglo-cap_2'))).rejects.toBeInstanceOf(TopeDeGasto);
    expect(grupos).toHaveLength(1);
  });

  it('en una fase: lo que el lote grande devolvió con error sale directo, sin esperar otro lote', async () => {
    const { lote, grupos } = loteQue((p) => ({ clave: p.clave, ok: false, error: 'errored' }));
    const directo = new ModeloFalso({ '7-estilo-cap_1': '{}' });
    const e = new Ejecutor({ modelo: directo, lote, todoPorLote: true, almacen: new AlmacenMemoria() });
    const r = await e.varios([enc('C/7-estilo-cap_1', true)], { lote: true, grupo: 'C-estilo-1' });
    expect(r.textos.get('C/7-estilo-cap_1')).toBe('{}');
    expect(grupos).toEqual(['C-estilo-1']);
    expect(directo.llamadas).toHaveLength(1);
  });

  it('en una fase: un corte en el lote grande se repite en un lote de una con el máximo', async () => {
    const { lote, grupos, pedidos } = loteQue((p, i) => (i === 0
      ? { clave: p.clave, ok: false, error: 'max_tokens', porMaxTokens: true, uso: { input_tokens: 1000, output_tokens: 100 } }
      : bien('{}')(p)));
    const e = new Ejecutor({ modelo: new ModeloFalso({}), lote, todoPorLote: true, almacen: new AlmacenMemoria() });
    const r = await e.varios([enc('C/6-arreglo-cap_1', true)], { lote: true, grupo: 'C-arreglos' });
    expect(r.textos.get('C/6-arreglo-cap_1')).toBe('{}');
    expect(grupos).toEqual(['C-arreglos', 'uno/C/6-arreglo-cap_1-max']);
    expect(pedidos.map((p) => p.maxTokens)).toEqual([64000, 128000]);
  });

  it('al retomar, un lote ya terminado que vuelve con el mismo corte no se cuenta dos veces', async () => {
    let cortes = 0;
    const loteFijo: Lote = { enviar: async (_g, ps) => ps.map((p) => (p.maxTokens < 128000
      ? (cortes++, { clave: p.clave, ok: false as const, error: 'max_tokens', porMaxTokens: true, uso: { input_tokens: 1000, output_tokens: 64000 } })
      : { clave: p.clave, ok: false as const, error: 'expired' })) };
    const almacen = new AlmacenMemoria();
    const directo: Modelo = { llamar: async () => { throw new ErrorDelModelo('red', false); } };
    const e1 = new Ejecutor({ modelo: directo, lote: loteFijo, todoPorLote: true, almacen });
    await expect(e1.uno(enc('C/6-arreglo-cap_1'))).rejects.toThrow();
    const antes = e1.gastado;
    const e2 = new Ejecutor({ modelo: directo, lote: loteFijo, todoPorLote: true, almacen });
    await expect(e2.uno(enc('C/6-arreglo-cap_1'))).rejects.toThrow();
    expect(cortes).toBe(2);
    expect(e2.gastado).toBe(antes);
    expect(e2.filas.filter((f) => f.falla)).toHaveLength(1);
  });
});
