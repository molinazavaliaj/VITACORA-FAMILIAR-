import { describe, it, expect } from 'vitest';
import { crearBaseFalsa } from '../v3/base-falsa.js';
import { conReintento, crearFila, esViajeroV2, guardarSiNoCambio, leerFila, listarFilas, soltarTurno, tomarTurno, viajerosV2 } from '../../src/viaje-v2/filas.js';

// La fila de viajes_v2: compare-and-swap sobre version y la toma del turno, como entrevistas_v3.
const NUEVA = { narrador_id: 'n1', idioma: 'es-AR' as const, compra: { salida: '2026-11-01' }, estado: { n: 0 } };
const AHORA = new Date('2026-10-10T12:00:00Z');

describe('viajes_v2 en la base', () => {
  it('crear, leer y saber quién la tiene; crear dos veces no duplica', async () => {
    const b = crearBaseFalsa({ viajes_v2: [] });
    expect(await crearFila(b.cliente, NUEVA)).toBe('creada');
    expect(await crearFila(b.cliente, NUEVA)).toBe('ya-existia');
    expect(await esViajeroV2(b.cliente, 'n1')).toBe(true);
    expect(await esViajeroV2(b.cliente, 'n2')).toBe(false);
    expect([...(await viajerosV2(b.cliente))]).toEqual(['n1']);
    expect((await leerFila(b.cliente, 'n1'))?.version).toBe(0);
    expect(await listarFilas(b.cliente, [])).toEqual([]);
    expect((await listarFilas(b.cliente, ['n1', 'n9'])).map((f) => f.narrador_id)).toEqual(['n1']);
  });

  it('sin la migración, nadie la tiene y no tira', async () => {
    const b = crearBaseFalsa({});
    b.ausentes.add('viajes_v2');
    expect(await esViajeroV2(b.cliente, 'n1')).toBe(false);
    expect((await viajerosV2(b.cliente)).size).toBe(0);
  });

  it('compare-and-swap: una escritura vieja pierde y conReintento relee', async () => {
    const b = crearBaseFalsa({ viajes_v2: [] });
    await crearFila(b.cliente, NUEVA);
    const vieja = (await leerFila<unknown, { n: number }>(b.cliente, 'n1'))!;
    expect(await guardarSiNoCambio(b.cliente, vieja, { estado: { n: 1 } })).not.toBeNull();
    expect(await guardarSiNoCambio(b.cliente, vieja, { estado: { n: 99 } })).toBeNull();
    const r = await conReintento<unknown, { n: number }, number>(b.cliente, 'n1', (f) => ({ cambio: { estado: { n: f.estado.n + 1 } }, resultado: f.estado.n + 1 }));
    expect(r?.resultado).toBe(2);
    expect((await leerFila<unknown, { n: number }>(b.cliente, 'n1'))?.estado.n).toBe(2);
  });

  it('la toma del turno es de uno solo y se suelta', async () => {
    const b = crearBaseFalsa({ viajes_v2: [] });
    await crearFila(b.cliente, NUEVA);
    const tomada = await tomarTurno(b.cliente, 'n1', AHORA);
    expect(tomada).not.toBeNull();
    expect(await tomarTurno(b.cliente, 'n1', AHORA)).toBeNull();
    expect(await soltarTurno(b.cliente, 'n1', tomada!)).not.toBeNull();
    expect(await tomarTurno(b.cliente, 'n1', AHORA)).not.toBeNull();
  });
});
