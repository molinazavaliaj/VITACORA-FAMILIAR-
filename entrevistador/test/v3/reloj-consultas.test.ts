// Cuántas consultas a la base hace una vuelta del reloj V3 (roadmap 13/10, «Achicar el tráfico del reloj V3»).
// Antes: 2 + N por minuto (narradores activos, sus filas y, por cada narrador, una búsqueda de respuestas sin
// clave_v3 aunque no hubiera ninguna). Ahora: esa búsqueda va junta, de a TROZO_RECONCILIAR narradores, y solo
// se llama a reconciliarV3 para quien tiene algo. Este test fija el número: si sube, alguien volvió a meter un N+1.

import { describe, it, expect } from 'vitest';
import { crearBaseFalsa, type BaseFalsa } from './base-falsa.js';
import { depsDePrueba } from './deps-prueba.js';
import { crearFila, leerFila } from '../../src/v3/estado.js';
import { LIMITE_SIN_CLAVE, TROZO_RECONCILIAR, tickV3 } from '../../src/v3/reloj.js';
import { avanzar } from '../../src/v3/turno.js';
import { estadoInicial, type EstadoV3, type NarradorV3 } from '../../src/v3/tipos.js';

const FICHA = { nombre: 'Prueba', genero: 'mujer' as const };
const AHORA = new Date('2026-10-08T13:05:00Z');
const HOY = '2026-10-08';
const MIN = 60_000;
const CREADA = '2026-10-01T00:00:00.000Z';
const hace = (ms: number) => new Date(AHORA.getTime() - ms).toISOString();

const narrador = (id: string, extra: Partial<NarradorV3> = {}): NarradorV3 => ({
  id, familia_id: 'f1', como_le_dicen: 'Prueba', telefono_whatsapp: `+54911${id}`, hora_preferida: '10:00:00',
  zona_horaria: 'America/Argentina/Buenos_Aires', contexto: { ritmo: 'diario' }, estado: 'activo', dia_actual: 0, ultima_respuesta_at: null, ...extra,
});
/** OR1 abierta hace un rato, cola vacía, sin borrador: el reloj no tiene nada que hacer. */
const quieto = (): EstadoV3 => ({ ...avanzar(estadoInicial(), FICHA).estado, salientes: [], ultimoEntranteAt: hace(60 * MIN), abiertaDesde: hace(60 * MIN) });

async function conNarradores(n: number) {
  const ids = Array.from({ length: n }, (_, i) => `n${i}`);
  const base = crearBaseFalsa({ narradores: ids.map((id) => narrador(id)), respuestas: [] });
  for (const id of ids) {
    await crearFila(base.cliente, { narrador_id: id, idioma: 'es-AR', ficha: FICHA, estado: quieto(), ultimo_audio_at: null, tanda_dia: HOY, tanda_cuenta: 1, migrada_de: null });
  }
  for (const f of base.tablas.entrevistas_v3 ?? []) f.creada_at = CREADA;
  return { base, ids, ...depsDePrueba(base, { ahora: AHORA }) };
}

/** Cuenta cada `from(tabla)`: una consulta a PostgREST. */
function contar(base: BaseFalsa) {
  const porTabla: Record<string, number> = {};
  const desde = base.cliente.from.bind(base.cliente);
  (base.cliente as unknown as { from: (t: string) => unknown }).from = (t: string) => {
    porTabla[t] = (porTabla[t] ?? 0) + 1;
    return desde(t);
  };
  return { porTabla, total: () => Object.values(porTabla).reduce((a, b) => a + b, 0) };
}

const respuesta = (narradorId: string, extra: Record<string, unknown> = {}) => ({
  id: `r-${narradorId}-${Math.random()}`, narrador_id: narradorId, wa_message_id: `wamid.${Math.random()}`, audio_path: null,
  transcripcion: 'Nací en un pueblo chico.', texto_directo: null, clave_v3: null, es_repregunta: false, pregunta_orden: 1,
  recibido_at: hace(6 * MIN), ...extra,
});

describe('reloj V3: consultas por vuelta', () => {
  it.each([1, 5, 40])('con %i narradores quietos: 3 consultas (narradores, filas y una búsqueda de sin clave)', async (n) => {
    const r = await conNarradores(n);
    const c = contar(r.base);
    await tickV3(r.deps);
    expect(c.porTabla).toEqual({ narradores: 1, entrevistas_v3: 1, respuestas: 1 });
    expect(r.enviados).toEqual([]);
  });

  it(`con más de ${TROZO_RECONCILIAR} narradores la búsqueda va de a trozos (URL corta)`, async () => {
    const n = TROZO_RECONCILIAR * 2 + 1;
    const r = await conNarradores(n);
    const c = contar(r.base);
    await tickV3(r.deps);
    expect(c.total()).toBe(2 + 3);
    expect(c.porTabla.respuestas).toBe(3);
  });

  it('sin narradores activos: 1 consulta y nada más', async () => {
    const r = await conNarradores(0);
    const c = contar(r.base);
    await tickV3(r.deps);
    expect(c.total()).toBe(1); // sin activos no se piden filas
  });

  it('el que tiene una respuesta sin clave se reconcilia; los demás no generan consultas propias', async () => {
    const r = await conNarradores(10);
    r.base.tablas.respuestas.push(respuesta('n7', { audio_path: 'n7/dia_01.ogg' }));
    const c = contar(r.base);
    await tickV3(r.deps);
    expect((await leerFila(r.base.cliente, 'n7'))?.estado.borrador).toBe('Nací en un pueblo chico.');
    expect((await leerFila(r.base.cliente, 'n3'))?.estado.borrador).toBeUndefined();
    // La búsqueda junta + la de reconciliarV3 de n7 (las demás consultas de n7 son su trabajo, no del reloj).
    expect(c.porTabla.respuestas).toBeGreaterThanOrEqual(2);
    expect(c.porTabla.narradores).toBeLessThanOrEqual(2); // la lista + drenar de n7
  });

  it('una respuesta vieja de antes de la V3 (antes de creada_at) no dispara la reconciliación', async () => {
    const r = await conNarradores(3);
    r.base.tablas.entrevistas_v3.find((f) => f.narrador_id === 'n1')!.creada_at = '2026-10-05T00:00:00.000Z';
    // Posterior a la fila más vieja (n0, n2: 01/10) pero anterior a la de n1: es del flujo viejo de n1.
    r.base.tablas.respuestas.push(respuesta('n1', { recibido_at: '2026-10-03T00:00:00.000Z' }));
    const c = contar(r.base);
    await tickV3(r.deps);
    expect(c.porTabla).toEqual({ narradores: 1, entrevistas_v3: 1, respuestas: 1 });
    expect(r.base.tablas.respuestas[0].clave_v3).toBeNull();
  });

  it('si la búsqueda junta llega al tope, ese trozo vuelve al camino de antes (una por narrador): no se pierde nada', async () => {
    const r = await conNarradores(3);
    r.base.tablas.entrevistas_v3.find((f) => f.narrador_id === 'n1')!.creada_at = '2026-10-05T00:00:00.000Z';
    for (let i = 0; i < LIMITE_SIN_CLAVE; i++) r.base.tablas.respuestas.push(respuesta('n1', { recibido_at: '2026-10-03T00:00:00.000Z' }));
    r.base.tablas.respuestas.push(respuesta('n2', { recibido_at: hace(6 * MIN), audio_path: 'n2/dia_01.ogg' }));
    const c = contar(r.base);
    await tickV3(r.deps);
    expect((await leerFila(r.base.cliente, 'n2'))?.estado.borrador).toBe('Nací en un pueblo chico.');
    expect(c.porTabla.respuestas).toBeGreaterThanOrEqual(1 + 3);
  });

  it('respeta los mismos filtros que reconciliarV3: con clave, sin wa_message_id o muy reciente no cuenta', async () => {
    const r = await conNarradores(3);
    r.base.tablas.respuestas.push(
      respuesta('n0', { clave_v3: 'OR1' }),
      respuesta('n1', { wa_message_id: null }),
      respuesta('n2', { recibido_at: hace(1 * MIN) }),
    );
    const c = contar(r.base);
    await tickV3(r.deps);
    expect(c.porTabla).toEqual({ narradores: 1, entrevistas_v3: 1, respuestas: 1 });
  });

  it('los de la simulación ni entran en la búsqueda', async () => {
    const r = await conNarradores(2);
    r.base.tablas.narradores[0].contexto = { ritmo: 'diario', simulacion: true };
    r.base.tablas.narradores[1].contexto = { ritmo: 'diario', simulacion: true };
    const c = contar(r.base);
    await tickV3(r.deps);
    expect(c.porTabla).toEqual({ narradores: 1, entrevistas_v3: 1 });
  });
});
