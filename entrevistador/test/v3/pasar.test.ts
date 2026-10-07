import { describe, it, expect } from 'vitest';
import { crearBaseFalsa } from './base-falsa.js';
import { depsDePrueba } from './deps-prueba.js';
import { leerFila } from '../../src/v3/estado.js';
import { altaNuevo, aplicarPase, bloqueosDePase, argumentosDePase, describirPase, leerEquivalencias, normalizarPregunta, planDePase } from '../../src/v3/pasar.js';
import { tocaM8, tocaTanda, trabajarNarrador } from '../../src/v3/reloj.js';
import { procesarEntranteV3 } from '../../src/v3/entrante.js';
import { renderizar } from '../../src/v3/nucleo/entrevista/texto.js';
import { preguntaPorId } from '../../src/v3/nucleo/entrevista/banco.js';
import type { NarradorV3 } from '../../src/v3/tipos.js';

const EQUIVALENCIAS = leerEquivalencias({
  version: 1,
  porTexto: { 'Contame dónde naciste.': 'OR1', '¿Cómo era tu casa?': 'CA1', '¿Y tu barrio?': 'CA1' },
});

/** 09:00 en Buenos Aires: todavía no es su hora (10:00). */
const ANTES_DE_LA_HORA = new Date('2026-10-08T12:00:00Z');
/** 15:00 en Buenos Aires: su hora ya pasó hoy. */
const DESPUES_DE_LA_HORA = new Date('2026-10-08T18:00:00Z');
const DIA = 86_400_000;

function baseConNarrador(narrador: Record<string, unknown> = {}) {
  return crearBaseFalsa({
    familias: [{ id: 'f1', nombre: 'Laura' }],
    narradores: [{ id: 'n1', familia_id: 'f1', como_le_dicen: 'Prueba', telefono_whatsapp: '+5491100000000', hora_preferida: '10:00:00', zona_horaria: 'America/Argentina/Buenos_Aires', estado: 'activo', dia_actual: 6, contexto: { trato: 'usted' }, ultima_respuesta_at: '2026-10-07T20:00:00Z', ...narrador }],
    preguntas: [
      { id: 'g1', narrador_id: null, orden: 1, texto: 'Contame dónde naciste.', tipo: 'fija' },
      { id: 'g2', narrador_id: null, orden: 2, texto: '¿Cómo era tu casa?', tipo: 'fija' },
      { id: 'g3', narrador_id: null, orden: 3, texto: '¿A qué jugabas?', tipo: 'fija' },
      { id: 'g4', narrador_id: null, orden: 4, texto: '¿Quién te enseñó a leer?', tipo: 'fija' },
      { id: 'g5', narrador_id: null, orden: 5, texto: '¿Y tu barrio?', tipo: 'fija' },
      { id: 'pf1', narrador_id: 'n1', orden: 6, texto: '¿Qué te acordás de la abuela?', tipo: 'familia' },
    ],
    respuestas: [
      { id: 'r1', narrador_id: 'n1', pregunta_orden: 1, transcripcion: 'Nací en un pueblo.', texto_directo: null, recibido_at: '2026-10-01T10:00:00Z' },
      { id: 'r2', narrador_id: 'n1', pregunta_orden: 1, transcripcion: 'Había un río.', texto_directo: null, recibido_at: '2026-10-01T10:05:00Z' },
      { id: 'r3', narrador_id: 'n1', pregunta_orden: 2, transcripcion: 'Una casa chorizo.', texto_directo: null, recibido_at: '2026-10-02T10:00:00Z' },
      { id: 'r4', narrador_id: 'n1', pregunta_orden: 3, transcripcion: 'A la bolita.', texto_directo: null, recibido_at: '2026-10-03T10:00:00Z' },
      { id: 'r5', narrador_id: 'n1', pregunta_orden: 4, transcripcion: null, texto_directo: null, recibido_at: '2026-10-04T10:00:00Z' },
      { id: 'r6', narrador_id: 'n1', pregunta_orden: 5, transcripcion: 'Empedrado.', texto_directo: null, recibido_at: '2026-10-05T10:00:00Z' },
      { id: 'r7', narrador_id: 'n1', pregunta_orden: 6, transcripcion: 'Hacía pan.', texto_directo: null, recibido_at: '2026-10-06T10:00:00Z' },
    ],
  });
}

describe('la tabla de equivalencias', () => {
  it('va por texto normalizado', () => {
    expect(normalizarPregunta('¿Cómo era tu  casa?')).toBe('como era tu casa');
    expect(EQUIVALENCIAS.porTexto['como era tu casa']).toBe('CA1');
  });

  it('rechaza una clave que no es del banco V3 y un formato roto', () => {
    expect(() => leerEquivalencias({ version: 1, porTexto: { 'Algo': 'ZZ9' } })).toThrow(/ZZ9/);
    expect(() => leerEquivalencias({ porTexto: {} })).toThrow(/formato/);
  });

  it('dos textos que se normalizan igual y van a claves distintas: error', () => {
    expect(() => leerEquivalencias({ version: 1, porTexto: { '¿Cómo era tu casa?': 'CA1', 'como era tu casa': 'OR1' } })).toThrow(/normaliza igual/);
    expect(leerEquivalencias({ version: 1, porTexto: { '¿Cómo era tu casa?': 'CA1', 'como era tu casa': 'CA1' } }).porTexto).toEqual({ 'como era tu casa': 'CA1' });
  });

  it('la del repo arranca vacía (la arma la sesión principal y la aprueba Naza)', () => {
    expect(leerEquivalencias()).toEqual({ version: 1, porTexto: {} });
  });
});

describe('el pase de un narrador en curso', () => {
  it('arma el plan: cada respuesta vieja en su clave V3; lo que no tiene tabla queda afuera', async () => {
    const base = baseConNarrador();
    const plan = await planDePase(base.cliente, 'n1', { genero: 'mujer', equivalencias: EQUIVALENCIAS });
    expect(plan.cargadas.map((c) => [c.clave, c.ordenes, c.texto])).toEqual([
      ['OR1', [1], 'Nací en un pueblo. Había un río.'],
      ['CA1', [2, 5], 'Una casa chorizo. Empedrado.'],
      ['F:pf1', [6], 'Hacía pan.'],
    ]);
    expect(plan.sinEquivalencia).toEqual([{ orden: 3, pregunta: '¿A qué jugabas?', respuestas: 1 }]);
    expect(plan.sinTexto).toEqual([4]);
    expect(plan.familia).toEqual([{ id: 'F:pf1', texto: '¿Qué te acordás de la abuela?' }]);
    expect(plan).toMatchObject({ idioma: 'es-AR', ficha: { nombre: 'Prueba', genero: 'mujer', quienRegala: 'Laura' }, migradaDe: { de: 'v-vieja', dia_actual: 6 } });
    const texto = describirPase(plan);
    expect(texto).toContain('OR1 ← orden 1');
    expect(texto).toContain('¿A qué jugabas?');
    expect(texto).not.toContain('Nací en un pueblo'); // el dry-run no imprime lo que contó
  });

  it('con la tabla vacía, todo lo viejo sale "sin equivalencia" (no se pierde: queda en respuestas) y el dry-run no muestra lo que contó', async () => {
    const base = baseConNarrador();
    const plan = await planDePase(base.cliente, 'n1', { genero: 'mujer', equivalencias: leerEquivalencias() });
    expect(plan.cargadas.map((c) => c.clave)).toEqual(['F:pf1']);
    expect(plan.sinEquivalencia.map((s) => s.orden)).toEqual([1, 2, 3, 5]);
    const texto = describirPase(plan);
    expect(texto).toContain('Sin equivalencia');
    expect(texto).toContain('Contame dónde naciste.');
    for (const r of base.tablas.respuestas) if (r.transcripcion) expect(texto).not.toContain(r.transcripcion);
  });

  it('aplicar: crea la fila con las respuestas cargadas, pone clave_v3 y no manda nada', async () => {
    const base = baseConNarrador();
    const plan = await planDePase(base.cliente, 'n1', { genero: 'mujer', equivalencias: EQUIVALENCIAS });
    await aplicarPase(base.cliente, plan, ANTES_DE_LA_HORA);
    const fila = await leerFila(base.cliente, 'n1');
    expect(fila?.estado.respuestas).toEqual([['OR1', 'Nací en un pueblo. Había un río.'], ['CA1', 'Una casa chorizo. Empedrado.'], ['F:pf1', 'Hacía pan.']]);
    expect(fila?.estado.salientes).toEqual([]);
    expect(fila?.estado.ultimoEntranteAt).toBe('2026-10-07T20:00:00Z');
    expect(fila).toMatchObject({ tanda_dia: null, migrada_de: { de: 'v-vieja', dia_actual: 6 } });
    expect(Object.fromEntries(base.tablas.respuestas.map((r) => [r.id, r.clave_v3 ?? null]))).toEqual({ r1: 'OR1', r2: 'OR1', r3: 'CA1', r4: null, r5: null, r6: 'CA1', r7: 'F:pf1' });
    // Las respuestas viejas no se tocan (ni las que quedaron sin equivalencia).
    expect(base.tablas.respuestas.find((r) => r.id === 'r4')?.transcripcion).toBe('A la bolita.');
    await expect(aplicarPase(base.cliente, plan, ANTES_DE_LA_HORA)).rejects.toThrow(/ya tiene/);
  });

  it('un activo queda activo y el reloj le abre la tanda a su hora (no antes)', async () => {
    const base = baseConNarrador();
    await aplicarPase(base.cliente, await planDePase(base.cliente, 'n1', { genero: 'mujer', equivalencias: EQUIVALENCIAS }), ANTES_DE_LA_HORA);
    expect(base.tablas.narradores[0].estado).toBe('activo');
    const fila = (await leerFila(base.cliente, 'n1'))!;
    const n = base.tablas.narradores[0] as NarradorV3;
    expect(fila.estado.esperando).toBeUndefined();
    expect(tocaTanda(fila, n, ANTES_DE_LA_HORA, '2026-10-08')).toBe(false); // 09:00: todavía no
    expect(tocaTanda(fila, n, new Date('2026-10-08T13:00:00Z'), '2026-10-08')).toBe(true); // 10:00: sale

    // Y el reloj de verdad: a las 10:00 abre la siguiente con abiertaDesde (para M8).
    const p = depsDePrueba(base, { ahora: new Date('2026-10-08T13:00:00Z') });
    expect(await trabajarNarrador(p.deps, fila, n)).toBe('tanda');
    expect(p.enviados).toHaveLength(1);
    const despues = (await leerFila(base.cliente, 'n1'))!;
    expect(despues.estado.esperando).toBeDefined();
    expect(despues.estado.esperando).not.toBe('OR1'); // OR1 ya la tenía contestada
    expect(despues.estado.abiertaDesde).toBe('2026-10-08T13:00:00.000Z');
  });

  it('pasado después de su hora: hoy no le sale nada; la tanda abre mañana a su hora', async () => {
    const base = baseConNarrador();
    await aplicarPase(base.cliente, await planDePase(base.cliente, 'n1', { genero: 'mujer', equivalencias: EQUIVALENCIAS }), DESPUES_DE_LA_HORA);
    const fila = (await leerFila(base.cliente, 'n1'))!;
    const n = base.tablas.narradores[0] as NarradorV3;
    expect(fila).toMatchObject({ tanda_dia: '2026-10-08', tanda_cuenta: 0 });
    expect(tocaTanda(fila, n, new Date(DESPUES_DE_LA_HORA.getTime() + 60_000), '2026-10-08')).toBe(false);
    const p = depsDePrueba(base, { ahora: new Date(DESPUES_DE_LA_HORA.getTime() + 60_000) });
    expect(await trabajarNarrador(p.deps, fila, n)).toBe('nada');
    expect(p.enviados).toEqual([]);
    expect(tocaTanda(fila, n, new Date('2026-10-09T13:00:00Z'), '2026-10-09')).toBe(true);
  });

  it('un pausado no cambia de estado', async () => {
    const base = baseConNarrador({ estado: 'pausado' });
    await aplicarPase(base.cliente, await planDePase(base.cliente, 'n1', { genero: 'mujer', equivalencias: EQUIVALENCIAS }), ANTES_DE_LA_HORA);
    expect(base.tablas.narradores[0].estado).toBe('pausado');
  });

  it('en catalán con --idioma ca; un acepto pasa a activo', async () => {
    const base = baseConNarrador({ estado: 'acepto', dia_actual: 0 });
    const plan = await planDePase(base.cliente, 'n1', { genero: 'mujer', idioma: 'ca', equivalencias: EQUIVALENCIAS });
    await aplicarPase(base.cliente, plan, ANTES_DE_LA_HORA);
    expect((await leerFila(base.cliente, 'n1'))?.idioma).toBe('ca');
    expect(base.tablas.narradores[0].estado).toBe('activo');
  });

  it('no pasa un viaje, un invitado ni a quien ya es V3', async () => {
    await expect(planDePase(baseConNarrador({ contexto: { modo: 'viaje' } }).cliente, 'n1', { genero: 'mujer', equivalencias: EQUIVALENCIAS })).rejects.toThrow(/viaje/i);
    await expect(planDePase(baseConNarrador({ estado: 'invitado' }).cliente, 'n1', { genero: 'mujer', equivalencias: EQUIVALENCIAS })).rejects.toThrow(/invitado/);
    const base = baseConNarrador();
    await aplicarPase(base.cliente, await planDePase(base.cliente, 'n1', { genero: 'mujer', equivalencias: EQUIVALENCIAS }), ANTES_DE_LA_HORA);
    await expect(planDePase(base.cliente, 'n1', { genero: 'mujer', equivalencias: EQUIVALENCIAS })).rejects.toThrow(/ya tiene/);
  });

  it('una respuesta reservada entera no se carga ni lleva clave_v3, y el dry-run la nombra sin contenido', async () => {
    const base = baseConNarrador();
    Object.assign(base.tablas.respuestas.find((r) => r.id === 'r3')!, { reservada: true, reservado_tramo: null });
    const plan = await planDePase(base.cliente, 'n1', { genero: 'mujer', equivalencias: EQUIVALENCIAS });
    expect(plan.reservadas).toEqual([2]);
    expect(plan.cargadas.find((c) => c.clave === 'CA1')).toMatchObject({ ordenes: [5], texto: 'Empedrado.', respuestaIds: ['r6'] });
    const texto = describirPase(plan);
    expect(texto).toContain('Reservada, no se carga');
    expect(texto).not.toContain('Una casa chorizo');
    expect(bloqueosDePase(plan)).toEqual([]);
    await aplicarPase(base.cliente, plan, ANTES_DE_LA_HORA);
    expect(base.tablas.respuestas.find((r) => r.id === 'r3')?.clave_v3 ?? null).toBeNull();
    expect(JSON.stringify((await leerFila(base.cliente, 'n1'))!.estado)).not.toContain('Una casa chorizo');
  });

  it('un tramo reservado: el dry-run dice que decide una persona y --aplicar no cambia nada', async () => {
    const base = baseConNarrador();
    Object.assign(base.tablas.respuestas.find((r) => r.id === 'r2')!, { reservada: true, reservado_tramo: 'Había un río.' });
    const plan = await planDePase(base.cliente, 'n1', { genero: 'mujer', equivalencias: EQUIVALENCIAS });
    expect(plan.tramosReservados).toEqual([1]);
    const texto = describirPase(plan);
    expect(texto).toContain('Tramo reservado: decide una persona');
    expect(texto).not.toContain('Había un río');
    await expect(aplicarPase(base.cliente, plan, ANTES_DE_LA_HORA)).rejects.toThrow(/tramo reservado/);
    expect(base.tablas.entrevistas_v3 ?? []).toHaveLength(0);
    expect(base.tablas.respuestas.every((r) => (r.clave_v3 ?? null) === null)).toBe(true);
  });

  it('con la pregunta vieja pendiente (dia_actual sin respuesta): el dry-run lo dice y --aplicar no cambia nada', async () => {
    const base = baseConNarrador({ dia_actual: 7 });
    const plan = await planDePase(base.cliente, 'n1', { genero: 'mujer', equivalencias: EQUIVALENCIAS });
    expect(plan.pendiente).toBe(7);
    expect(describirPase(plan)).toContain('Tiene la pregunta orden 7 pendiente: pasar después de que conteste');
    await expect(aplicarPase(base.cliente, plan, ANTES_DE_LA_HORA)).rejects.toThrow(/pendiente/);
    expect(base.tablas.entrevistas_v3 ?? []).toHaveLength(0);
    expect(base.tablas.respuestas.every((r) => (r.clave_v3 ?? null) === null)).toBe(true);
    // Contestada la 6 (dia_actual 6), no hay pendiente; un acepto sin preguntas (dia_actual 0), tampoco.
    expect((await planDePase(baseConNarrador().cliente, 'n1', { genero: 'mujer', equivalencias: EQUIVALENCIAS })).pendiente).toBeNull();
    expect((await planDePase(baseConNarrador({ estado: 'acepto', dia_actual: 0 }).cliente, 'n1', { genero: 'mujer', equivalencias: EQUIVALENCIAS })).pendiente).toBeNull();
  });

  it('sin nada cargado, la pregunta vieja pendiente solo avisa y se aplica (el que nunca contestó, en catalán)', async () => {
    const base = baseConNarrador({ dia_actual: 1, contexto: {} });
    base.tablas.respuestas = [];
    const plan = await planDePase(base.cliente, 'n1', { genero: 'mujer', idioma: 'ca', equivalencias: EQUIVALENCIAS });
    expect(plan).toMatchObject({ pendiente: 1, cargadas: [] });
    expect(bloqueosDePase(plan)).toEqual([]);
    const texto = describirPase(plan);
    expect(texto).toContain('tenía la pregunta orden 1 pendiente; si contesta esa antes de que salga la primera V3');
    expect(texto).not.toContain('--aplicar no aplica nada');
    await aplicarPase(base.cliente, plan, ANTES_DE_LA_HORA);
    expect(await leerFila(base.cliente, 'n1')).toMatchObject({ idioma: 'ca', tanda_dia: null });

    // Hoy: si contesta tarde la vieja antes de la primera V3, no se rompe y el audio queda
    // guardado (con su transcripción, sin clave_v3), pero no entra al estado V3 (ver el reporte).
    const p = depsDePrueba(base, { ahora: ANTES_DE_LA_HORA });
    const n = base.tablas.narradores[0] as NarradorV3;
    await procesarEntranteV3(p.deps, n, { telefono: '+5491100000000', tipo: 'audio', mediaId: 'Nací en un pueblo.', waMessageId: 'wamid.tarde' });
    expect(base.tablas.respuestas.map((r) => [r.transcripcion, r.clave_v3 ?? null])).toEqual([['Nací en un pueblo.', null]]);
    const fila = (await leerFila(base.cliente, 'n1'))!;
    expect(fila.estado.respuestas).toEqual([]);
    expect(fila.estado.borrador).toBeUndefined();
    expect(tocaTanda(fila, n, new Date('2026-10-08T13:00:00Z'), '2026-10-08')).toBe(true); // la primera V3 sale igual a su hora
  });

  it('si ya es V3, aplicar no toca clave_v3', async () => {
    const base = baseConNarrador();
    const plan = await planDePase(base.cliente, 'n1', { genero: 'mujer', equivalencias: EQUIVALENCIAS });
    await aplicarPase(base.cliente, plan, ANTES_DE_LA_HORA);
    base.tablas.respuestas.find((r) => r.id === 'r1')!.clave_v3 = 'OTRA';
    await expect(aplicarPase(base.cliente, plan, ANTES_DE_LA_HORA)).rejects.toThrow(/ya tiene/);
    expect(base.tablas.respuestas.find((r) => r.id === 'r1')?.clave_v3).toBe('OTRA');
  });

  it('una transcripción vacía no tapa el texto escrito', async () => {
    const base = baseConNarrador();
    Object.assign(base.tablas.respuestas.find((r) => r.id === 'r5')!, { transcripcion: '  ', texto_directo: 'Mi maestra.' });
    const plan = await planDePase(base.cliente, 'n1', { genero: 'mujer', equivalencias: leerEquivalencias({ version: 1, porTexto: { '¿Quién te enseñó a leer?': 'OR1' } }) });
    expect(plan.sinTexto).toEqual([]);
    expect(plan.cargadas.find((c) => c.clave === 'OR1')?.texto).toBe('Mi maestra.');
  });

  it('los argumentos del script', () => {
    expect(argumentosDePase(['n1', '--genero', 'mujer'])).toEqual({ narradorId: 'n1', genero: 'mujer', aplicar: false });
    expect(argumentosDePase(['n1', '--idioma', 'ca', '--genero', 'varon', '--aplicar', '--equivalencias', 'otra.json'])).toEqual({ narradorId: 'n1', genero: 'varon', idioma: 'ca', aplicar: true, equivalencias: 'otra.json' });
    expect(() => argumentosDePase(['n1'])).toThrow(/--genero/);
    expect(() => argumentosDePase(['n1', '--genero', 'mujer', '--idioma', 'fr'])).toThrow(/idioma/);
  });
});

describe('el alta de un narrador nuevo', () => {
  const nuevo = (contexto: Record<string, unknown>): NarradorV3 => ({
    id: 'n1', familia_id: 'f1', como_le_dicen: 'Prueba', telefono_whatsapp: '+5491100000000', hora_preferida: '10:00:00',
    zona_horaria: 'America/Argentina/Buenos_Aires', contexto, estado: 'acepto', dia_actual: 0, ultima_respuesta_at: null,
  });
  const preparar = (contexto: Record<string, unknown>) => {
    const base = crearBaseFalsa({ familias: [{ id: 'f1', nombre: 'Laura' }], narradores: [{ ...nuevo(contexto) }] });
    return { base, ...depsDePrueba(base) };
  };

  it('sin género: se frena, no sale nada y se avisa a los socios', async () => {
    const { deps, base, enviados, avisos } = preparar({});
    expect(await altaNuevo(deps, nuevo({}), { ventanaAbierta: true })).toBe('frenada');
    expect(base.tablas.entrevistas_v3 ?? []).toHaveLength(0);
    expect(enviados).toEqual([]);
    expect(avisos[0].clave).toBe('alta-sin-genero-n1');
    expect(base.tablas.narradores[0].estado).toBe('acepto');
  });

  it('con género: crea la fila, sale OR1 con M1 y pasa a activo', async () => {
    const { deps, base, enviados } = preparar({ genero: 'varon' });
    expect(await altaNuevo(deps, nuevo({ genero: 'varon' }), { ventanaAbierta: true })).toBe('mandada');
    expect(enviados).toHaveLength(1);
    expect(enviados[0].texto?.startsWith(renderizar(preguntaPorId('OR1')!.texto, { nombre: 'Prueba', genero: 'varon' }))).toBe(true);
    expect(base.tablas.narradores[0].estado).toBe('activo');
    expect(await leerFila(base.cliente, 'n1')).toMatchObject({ idioma: 'es-AR', tanda_cuenta: 1, ficha: { nombre: 'Prueba', genero: 'varon', quienRegala: 'Laura' } });
  });

  it('deja OR1 abierta con abiertaDesde: el reloj no le repite la tanda hoy y M8 sale a los 2 días', async () => {
    const { deps, base } = preparar({ genero: 'mujer' });
    await altaNuevo(deps, nuevo({ genero: 'mujer' }), { ventanaAbierta: true });
    const fila = (await leerFila(base.cliente, 'n1'))!;
    const n = base.tablas.narradores[0] as NarradorV3;
    expect(fila.estado.esperando).toBe('OR1');
    expect(fila.estado.abiertaDesde).toBe(deps.ahora().toISOString());
    expect(tocaTanda(fila, n, deps.ahora(), '2026-10-08')).toBe(false);
    expect(tocaM8(fila, new Date(deps.ahora().getTime() + DIA))).toBe(false);
    expect(tocaM8(fila, new Date(deps.ahora().getTime() + 2 * DIA))).toBe(true);
  });

  it('dos veces no arranca dos veces', async () => {
    const { deps, enviados } = preparar({ genero: 'mujer' });
    await altaNuevo(deps, nuevo({ genero: 'mujer' }), { ventanaAbierta: true });
    await altaNuevo(deps, nuevo({ genero: 'mujer' }), { ventanaAbierta: true });
    expect(enviados).toHaveLength(1);
  });

  it('en catalán si la web mandó contexto.idioma = ca', async () => {
    const ctx = { genero: 'mujer', idioma: 'ca' };
    const { deps, enviados } = preparar(ctx);
    await altaNuevo(deps, nuevo(ctx), { ventanaAbierta: true });
    expect(enviados[0].texto?.startsWith(renderizar(preguntaPorId('OR1', 'ca')!.texto, { nombre: 'Prueba', genero: 'mujer', idioma: 'ca' }))).toBe(true);
  });

  it('un idioma que no se conoce frena y avisa (mejor que entrevistar en otro)', async () => {
    const ctx = { genero: 'mujer', idioma: 'fr' };
    const { deps, avisos } = preparar(ctx);
    expect(await altaNuevo(deps, nuevo(ctx), { ventanaAbierta: true })).toBe('frenada');
    expect(avisos[0].clave).toBe('alta-idioma-n1');
  });
});
