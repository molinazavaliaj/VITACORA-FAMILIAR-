import { describe, it, expect } from 'vitest';
import { crearBaseFalsa } from './base-falsa.js';
import { conReintento, esTablaAusente, INTENTOS_CAS, crearFila, esNarradorV3, guardarSiNoCambio, leerFila, narradoresV3, soltarTurno, tomarTurno, TOMA_MS } from '../../src/v3/estado.js';
import { estadoInicial, type FilaV3 } from '../../src/v3/tipos.js';

const nueva = (narrador_id = 'n1') => ({
  narrador_id, idioma: 'es-AR' as const, ficha: { nombre: 'Prueba', genero: 'mujer' as const },
  estado: estadoInicial(), ultimo_audio_at: null, tanda_dia: null, tanda_cuenta: 0, migrada_de: null,
});
const AHORA = new Date('2026-10-08T13:00:00Z');

describe('la fila de entrevistas_v3', () => {
  it('se crea una sola vez', async () => {
    const base = crearBaseFalsa();
    expect(await crearFila(base.cliente, nueva())).toBe('creada');
    expect(await crearFila(base.cliente, nueva())).toBe('ya-existia');
    expect((await leerFila(base.cliente, 'n1'))?.version).toBe(0);
  });

  it('sin la migración aplicada nadie es V3 (y el flujo viejo sigue)', async () => {
    const base = crearBaseFalsa();
    base.ausentes.add('entrevistas_v3');
    expect(await esNarradorV3(base.cliente, 'n1')).toBe(false);
    expect(await narradoresV3(base.cliente)).toEqual(new Set());
  });

  it('esNarradorV3 y narradoresV3 miran la tabla', async () => {
    const base = crearBaseFalsa();
    await crearFila(base.cliente, nueva('n1'));
    expect(await esNarradorV3(base.cliente, 'n1')).toBe(true);
    expect(await esNarradorV3(base.cliente, 'n2')).toBe(false);
    expect(await narradoresV3(base.cliente)).toEqual(new Set(['n1']));
  });

  it('compare-and-swap: una escritura con la versión vieja pierde', async () => {
    const base = crearBaseFalsa();
    await crearFila(base.cliente, nueva());
    const leida = (await leerFila(base.cliente, 'n1')) as FilaV3;
    expect(await guardarSiNoCambio(base.cliente, leida, { tanda_cuenta: 1 })).not.toBeNull();
    expect(await guardarSiNoCambio(base.cliente, leida, { tanda_cuenta: 9 })).toBeNull();
    expect(await leerFila(base.cliente, 'n1')).toMatchObject({ tanda_cuenta: 1, version: 1 });
  });

  it('conReintento relee y vuelve a aplicar si otro escribió en el medio', async () => {
    const base = crearBaseFalsa();
    await crearFila(base.cliente, nueva());
    let vueltas = 0;
    const r = await conReintento(base.cliente, 'n1', (f) => {
      vueltas++;
      // La primera vez, otro proceso escribe entre la lectura y el guardado.
      if (vueltas === 1) base.tablas.entrevistas_v3[0].version = 7;
      return { cambio: { tanda_cuenta: f.tanda_cuenta + 1 }, resultado: vueltas };
    });
    expect(vueltas).toBe(2);
    expect(r?.fila).toMatchObject({ tanda_cuenta: 1, version: 8 });
  });

  it('conReintento con paso null no escribe', async () => {
    const base = crearBaseFalsa();
    await crearFila(base.cliente, nueva());
    expect(await conReintento(base.cliente, 'n1', () => null)).toBeNull();
    expect((await leerFila(base.cliente, 'n1'))?.version).toBe(0);
  });

  it('la toma: uno solo manda; vence a los 2 minutos; se suelta', async () => {
    const base = crearBaseFalsa();
    await crearFila(base.cliente, nueva());
    expect(await tomarTurno(base.cliente, 'n1', AHORA)).not.toBeNull();
    expect(await tomarTurno(base.cliente, 'n1', AHORA)).toBeNull();
    expect(await tomarTurno(base.cliente, 'n1', new Date(AHORA.getTime() + TOMA_MS + 1))).not.toBeNull();
    const tomada = (await leerFila(base.cliente, 'n1')) as FilaV3;
    await soltarTurno(base.cliente, 'n1', tomada);
    expect((await leerFila(base.cliente, 'n1'))?.enviando_hasta).toBeNull();
    expect(await tomarTurno(base.cliente, 'n1', AHORA)).not.toBeNull();
  });

  it('dos tomas a la vez: solo una manda', async () => {
    const base = crearBaseFalsa();
    await crearFila(base.cliente, nueva());
    const r = await Promise.all([tomarTurno(base.cliente, 'n1', AHORA), tomarTurno(base.cliente, 'n1', AHORA)]);
    expect(r.filter((x) => x !== null)).toHaveLength(1);
  });

  it('conReintento tira tras INTENTOS_CAS pérdidas', async () => {
    const base = crearBaseFalsa();
    await crearFila(base.cliente, nueva());
    let vueltas = 0;
    await expect(conReintento(base.cliente, 'n1', (f) => {
      vueltas++;
      base.tablas.entrevistas_v3[0].version = f.version + 5;
      return { cambio: { tanda_cuenta: 1 }, resultado: 1 };
    })).rejects.toThrow();
    expect(vueltas).toBe(INTENTOS_CAS);
  });

  it('soltarTurno no suelta una toma que ya es de otro', async () => {
    const base = crearBaseFalsa();
    await crearFila(base.cliente, nueva());
    const a = (await tomarTurno(base.cliente, 'n1', AHORA)) as FilaV3;
    const b = (await tomarTurno(base.cliente, 'n1', new Date(AHORA.getTime() + TOMA_MS + 1))) as FilaV3;
    expect(await soltarTurno(base.cliente, 'n1', a)).toBeNull();
    expect((await leerFila(base.cliente, 'n1'))?.enviando_hasta).toBe(b.enviando_hasta);
  });

  it('soltarTurno compara instantes: la base puede devolver +00:00 donde JS escribió Z', async () => {
    const base = crearBaseFalsa();
    await crearFila(base.cliente, nueva());
    const tomada = (await tomarTurno(base.cliente, 'n1', AHORA)) as FilaV3;
    expect(tomada.enviando_hasta).toBe('2026-10-08T13:02:00.000Z');
    // Como serializa PostgREST un timestamptz: el mismo instante, otra forma.
    base.tablas.entrevistas_v3[0].enviando_hasta = '2026-10-08T13:02:00+00:00';
    expect(await soltarTurno(base.cliente, 'n1', tomada)).not.toBeNull();
    expect((await leerFila(base.cliente, 'n1'))?.enviando_hasta).toBeNull();
  });

  it('soltarTurno con otro instante (aunque sea por un milisegundo) no suelta', async () => {
    const base = crearBaseFalsa();
    await crearFila(base.cliente, nueva());
    const tomada = (await tomarTurno(base.cliente, 'n1', AHORA)) as FilaV3;
    expect(await soltarTurno(base.cliente, 'n1', { ...tomada, enviando_hasta: '2026-10-08T13:02:00.001+00:00' })).toBeNull();
    expect(await soltarTurno(base.cliente, 'n1', { ...tomada, enviando_hasta: null })).toBeNull();
    expect((await leerFila(base.cliente, 'n1'))?.enviando_hasta).toBe('2026-10-08T13:02:00.000Z');
  });

  it('esTablaAusente no se traga errores de columna', () => {
    expect(esTablaAusente({ code: '42703', message: 'column "x" does not exist' })).toBe(false);
    expect(esTablaAusente({ code: '42P01' })).toBe(true);
    expect(esTablaAusente({ message: 'relation "entrevistas_v3" does not exist' })).toBe(true);
  });
});
