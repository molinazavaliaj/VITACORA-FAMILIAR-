import { describe, it, expect } from 'vitest';
import { crearBaseFalsa } from '../v3/base-falsa.js';
import {
  chicosKids, conReintento, esChicoKids, filasDelReloj, guardarSiNoCambio, leerFila, listarFilas, soltarTurno, tomarTurno,
} from '../../src/kids-v2/filas.js';
import { filaKidsNueva } from './deps-prueba.js';

// La fila de kids_v2: compare-and-swap sobre version, la condición sobre cambios_panel y la toma del turno.
const AHORA = new Date('2026-11-02T15:00:00Z');
// Como la crea la web: con los defaults de la migración (la base falsa no los pone a las filas iniciales).
const fila = (id: string, extra: Record<string, unknown> = {}) => ({ ...filaKidsNueva(id, { canal: 'A' }), ...extra });

describe('kids_v2 en la base', () => {
  it('saber quién es de Kids, leer y listar', async () => {
    const b = crearBaseFalsa({ kids_v2: [fila('k1')] });
    expect(await esChicoKids(b.cliente, 'k1')).toBe(true);
    expect(await esChicoKids(b.cliente, 'n2')).toBe(false);
    expect([...(await chicosKids(b.cliente))]).toEqual(['k1']);
    const f = await leerFila(b.cliente, 'k1');
    expect(f).toMatchObject({ version: 0, estado: null, cambios_panel: null, avance: {}, marcas: [], termino_at: null });
    expect(await listarFilas(b.cliente, [])).toEqual([]);
    expect((await listarFilas(b.cliente, ['k1', 'k9'])).map((x) => x.narrador_id)).toEqual(['k1']);
  });

  it('sin la migración, nadie es de Kids y no tira', async () => {
    const b = crearBaseFalsa({});
    b.ausentes.add('kids_v2');
    expect(await esChicoKids(b.cliente, 'k1')).toBe(false);
    expect((await chicosKids(b.cliente)).size).toBe(0);
    expect(await listarFilas(b.cliente, ['k1'])).toEqual([]);
    expect(await filasDelReloj(b.cliente, AHORA)).toEqual([]);
  });

  it('con otro error de la base, esChicoKids tira (mejor frenar que mandarle lo viejo)', async () => {
    const b = crearBaseFalsa({ kids_v2: [] });
    const cliente = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: { code: '57014', message: 'timeout' } }) }) }) }) };
    await expect(esChicoKids(cliente as unknown as typeof b.cliente, 'k1')).rejects.toThrow(/timeout/);
  });

  it('compare-and-swap: una escritura vieja pierde y conReintento relee', async () => {
    const b = crearBaseFalsa({ kids_v2: [fila('k1', { estado: { n: 0 } })] });
    const vieja = (await leerFila(b.cliente, 'k1'))!;
    expect(await guardarSiNoCambio(b.cliente, vieja, { estado: { n: 1 } })).not.toBeNull();
    expect(await guardarSiNoCambio(b.cliente, vieja, { estado: { n: 99 } })).toBeNull();
    const r = await conReintento<typeof vieja, number>(b.cliente, 'k1', (f) => ({ cambio: { estado: { n: (f.estado as { n: number }).n + 1 } }, resultado: 1 }));
    expect(r?.resultado).toBe(1);
    expect((await leerFila(b.cliente, 'k1'))?.estado).toEqual({ n: 2 });
  });

  it('la escritura que aplica cambios_panel pierde si la web lo cambió en el medio (sin tocar version)', async () => {
    const b = crearBaseFalsa({ kids_v2: [fila('k1', { cambios_panel: { hora: '19:00', pedido_at: 'a' } })] });
    const leida = (await leerFila(b.cliente, 'k1'))!;
    // La web fusiona otro cambio: no toca version.
    b.tablas.kids_v2[0].cambios_panel = { pedido_at: 'b', hora: '19:00', temasSacados: ['mudanza'] };
    expect(await guardarSiNoCambio(b.cliente, leida, { cambios_panel: null })).toBeNull();
    // Releída, gana (el orden de las claves no importa: es jsonb).
    b.tablas.kids_v2[0].cambios_panel = { temasSacados: ['mudanza'], hora: '19:00', pedido_at: 'b' };
    const releida = (await leerFila(b.cliente, 'k1'))!;
    b.tablas.kids_v2[0].cambios_panel = { pedido_at: 'b', hora: '19:00', temasSacados: ['mudanza'] };
    expect(await guardarSiNoCambio(b.cliente, releida, { cambios_panel: null, cambios_error: null })).not.toBeNull();
    expect(b.tablas.kids_v2[0].cambios_panel).toBeNull();
  });

  it('una escritura que no toca cambios_panel no lo mira (ni lo pisa)', async () => {
    const b = crearBaseFalsa({ kids_v2: [fila('k1')] });
    const leida = (await leerFila(b.cliente, 'k1'))!;
    b.tablas.kids_v2[0].cambios_panel = { hora: '20:00' };
    expect(await guardarSiNoCambio(b.cliente, leida, { enviando_hasta: null })).not.toBeNull();
    expect(b.tablas.kids_v2[0].cambios_panel).toEqual({ hora: '20:00' });
    // Y la que lo aplica con lo leído en null pierde: la web escribió uno.
    const otra = { ...(await leerFila(b.cliente, 'k1'))!, cambios_panel: null };
    expect(await guardarSiNoCambio(b.cliente, otra, { cambios_panel: null })).toBeNull();
  });

  it('el reloj encuentra las que despiertan, las del panel y las sin arrancar', async () => {
    const b = crearBaseFalsa({
      kids_v2: [
        fila('vence', { empezo_at: 'x', despertar_at: '2026-11-02T14:59:00.000Z' }),
        fila('despues', { empezo_at: 'x', despertar_at: '2026-11-03T14:59:00.000Z' }),
        fila('panel', { empezo_at: 'x', despertar_at: null, cambios_panel: { hora: '19:00' } }),
        fila('nuevo'),
      ],
    });
    expect((await filasDelReloj(b.cliente, AHORA)).map((f) => f.narrador_id).sort()).toEqual(['nuevo', 'panel', 'vence']);
  });

  it('la toma del turno es de uno solo y se suelta', async () => {
    const b = crearBaseFalsa({ kids_v2: [fila('k1')] });
    const t = await tomarTurno(b.cliente, 'k1', AHORA);
    expect(t?.enviando_hasta).not.toBeNull();
    expect(await tomarTurno(b.cliente, 'k1', AHORA)).toBeNull();
    await soltarTurno(b.cliente, 'k1', t!);
    expect(await tomarTurno(b.cliente, 'k1', AHORA)).not.toBeNull();
  });
});
