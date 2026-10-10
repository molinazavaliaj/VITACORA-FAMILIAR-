import { describe, it, expect } from 'vitest';
import { crearBaseFalsa } from './base-falsa.js';
import { depsDePrueba } from './deps-prueba.js';
import { leerFila } from '../../src/v3/estado.js';
import { altaNuevo, aplicarPase, fichaDeNarrador, bloqueosDePase, argumentosDePase, describirPase, leerEquivalencias, normalizarPregunta, planDePase } from '../../src/v3/pasar.js';
import { tocaM8, tocaTanda, trabajarNarrador } from '../../src/v3/reloj.js';
import { procesarEntranteV3 } from '../../src/v3/entrante.js';
import { drenar } from '../../src/v3/enviar.js';
import { renderizar } from '../../src/v3/nucleo/entrevista/texto.js';
import { preguntaPorId } from '../../src/v3/nucleo/entrevista/banco.js';
import { siguientePregunta } from '../../src/v3/nucleo/entrevista/flujo.js';
import { avanzar, textoMandado } from '../../src/v3/turno.js';
import { fichaTexto } from '../../src/v3/tipos.js';
import equivalenciasRepo from '../../src/v3/equivalencias.json' with { type: 'json' };
import { SIN_CLAVE_V3, type NarradorV3 } from '../../src/v3/tipos.js';

/** Una tabla parcial: '¿A qué jugabas?' (orden 3) queda sin equivalencia. */
const PARCIAL = leerEquivalencias({
  version: 1,
  porTexto: { 'Contame dónde naciste.': 'OR1', '¿Cómo era tu casa?': 'CA1', '¿Y tu barrio?': 'CA1' },
});
/** La tabla completa para el guion de prueba: todo lo viejo tiene clave V3. */
const EQUIVALENCIAS = leerEquivalencias({
  version: 1,
  porTexto: { 'Contame dónde naciste.': 'OR1', '¿Cómo era tu casa?': 'CA1', '¿Y tu barrio?': 'CA1', '¿A qué jugabas?': 'CA2', '¿Quién te enseñó a leer?': 'ES1' },
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
      { id: 'r5', narrador_id: 'n1', pregunta_orden: 4, transcripcion: 'Mi maestra.', texto_directo: null, recibido_at: '2026-10-04T10:00:00Z' },
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

  it('la del repo carga: la aprobada por Naza (07/10), con todas sus claves en el banco V3 (es-AR)', () => {
    const tabla = leerEquivalencias();
    // La segunda CA1 es la pregunta 1 editada ("…en cordoba") del narrador de prueba de Naza.
    // Y de AD5 en adelante, las 8–14 del guion viejo (Naza, 07/10, para el pase de Mariano).
    expect(Object.values(tabla.porTexto)).toEqual(['CA1', 'CA1', ['CA2', 'CA3'], 'ES6', 'ES2', 'OR2', 'CA6', 'CA10', 'AD5', 'AD3', 'JU2', 'TR1', 'JU13', 'AM1', ['AM3', 'AM4']]);
    for (const valor of Object.values(equivalenciasRepo.porTexto)) for (const clave of [valor].flat()) expect(preguntaPorId(clave, 'es-AR')).toBeDefined();
  });

  it('varias claves para un texto: valida cada una, no acepta lista vacía ni repetida, y el choque compara la lista entera', () => {
    expect(leerEquivalencias({ version: 1, porTexto: { 'Algo': ['CA2', 'CA3'] } }).porTexto).toEqual({ algo: ['CA2', 'CA3'] });
    expect(() => leerEquivalencias({ version: 1, porTexto: { 'Algo': ['CA2', 'ZZ9'] } })).toThrow(/ZZ9/);
    expect(() => leerEquivalencias({ version: 1, porTexto: { 'Algo': [] } })).toThrow(/ninguna clave/);
    expect(() => leerEquivalencias({ version: 1, porTexto: { 'Algo': ['CA2', 'CA2'] } })).toThrow(/repite/);
    expect(() => leerEquivalencias({ version: 1, porTexto: { 'Algo': ['CA2', 'CA3'], 'algo': 'CA2' } })).toThrow(/normaliza igual/);
    expect(leerEquivalencias({ version: 1, porTexto: { 'Algo': ['CA2', 'CA3'], 'algo': ['CA2', 'CA3'] } }).porTexto).toEqual({ algo: ['CA2', 'CA3'] });
  });
});

describe('el pase de un narrador en curso', () => {
  it('arma el plan: cada respuesta vieja en su clave V3; lo que no tiene tabla queda afuera', async () => {
    const base = baseConNarrador();
    base.tablas.respuestas.find((r) => r.id === 'r5')!.transcripcion = null; // un audio sin transcripción
    const plan = await planDePase(base.cliente, 'n1', { genero: 'mujer', equivalencias: PARCIAL });
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

  it('sin equivalencia o sin texto: --aplicar no aplica nada (se perdería material en silencio)', async () => {
    const base = baseConNarrador();
    base.tablas.respuestas.find((r) => r.id === 'r5')!.transcripcion = null;
    const plan = await planDePase(base.cliente, 'n1', { genero: 'mujer', equivalencias: PARCIAL });
    expect(bloqueosDePase(plan)).toEqual([
      'sin equivalencia en órdenes 3: completar la tabla (la aprueba Naza)',
      'sin texto en órdenes 4: transcribir o revisar a mano',
    ]);
    expect(describirPase(plan)).toContain('--aplicar no aplica nada');
    await expect(aplicarPase(base.cliente, plan, ANTES_DE_LA_HORA)).rejects.toThrow(/sin equivalencia en órdenes 3.*sin texto en órdenes 4/);
    expect(base.tablas.entrevistas_v3 ?? []).toHaveLength(0);
    expect(base.tablas.respuestas.every((r) => (r.clave_v3 ?? null) === null)).toBe(true);
  });

  it('con la tabla vacía, todo lo viejo sale "sin equivalencia" (no se pierde: queda en respuestas) y el dry-run no muestra lo que contó', async () => {
    const base = baseConNarrador();
    const plan = await planDePase(base.cliente, 'n1', { genero: 'mujer', equivalencias: leerEquivalencias({ version: 1, porTexto: {} }) });
    expect(plan.cargadas.map((c) => c.clave)).toEqual(['F:pf1']);
    expect(plan.sinEquivalencia.map((s) => s.orden)).toEqual([1, 2, 3, 4, 5]);
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
    expect(fila?.estado.respuestas).toEqual([['OR1', 'Nací en un pueblo. Había un río.'], ['CA1', 'Una casa chorizo. Empedrado.'], ['CA2', 'A la bolita.'], ['ES1', 'Mi maestra.'], ['F:pf1', 'Hacía pan.']]);
    expect(fila?.estado.salientes).toEqual([]);
    // Dos preguntas viejas en CA1: un globo con las dos.
    expect(fila?.estado.charla[1]).toEqual({ de: 'bio', partes: [{ id: 'CA1', texto: '¿Cómo era tu casa?' }, { id: 'CA1', texto: '¿Y tu barrio?' }] });
    expect(fila?.estado.ultimoEntranteAt).toBe('2026-10-07T20:00:00Z');
    expect(fila).toMatchObject({ tanda_dia: null, migrada_de: { de: 'v-vieja', dia_actual: 6 } });
    expect(Object.fromEntries(base.tablas.respuestas.map((r) => [r.id, r.clave_v3 ?? null]))).toEqual({ r1: 'OR1', r2: 'OR1', r3: 'CA1', r4: 'CA2', r5: 'ES1', r6: 'CA1', r7: 'F:pf1' });
    // Las respuestas viejas no se tocan (solo se les pone clave_v3).
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
    // guardado (con su transcripción, marcado como afuera: clave_v3 = SIN_CLAVE_V3, así el reloj
    // no lo reintenta), pero no entra al estado V3 (ver el reporte).
    const p = depsDePrueba(base, { ahora: ANTES_DE_LA_HORA });
    const n = base.tablas.narradores[0] as NarradorV3;
    await procesarEntranteV3(p.deps, n, { telefono: '+5491100000000', tipo: 'audio', mediaId: 'Nací en un pueblo.', waMessageId: 'wamid.tarde' });
    expect(base.tablas.respuestas.map((r) => [r.transcripcion, r.clave_v3 ?? null])).toEqual([['Nací en un pueblo.', SIN_CLAVE_V3]]);
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

  it('una fila que la V3 dejó afuera (clave_v3 = SIN_CLAVE_V3) no se carga ni bloquea', async () => {
    const base = baseConNarrador();
    base.tablas.respuestas.push({ id: 'r8', narrador_id: 'n1', pregunta_orden: 9, transcripcion: 'Un botón suelto.', texto_directo: null, recibido_at: '2026-10-07T10:00:00Z', clave_v3: SIN_CLAVE_V3 });
    const plan = await planDePase(base.cliente, 'n1', { genero: 'mujer', equivalencias: EQUIVALENCIAS });
    expect(plan.sinEquivalencia).toEqual([]);
    expect(bloqueosDePase(plan)).toEqual([]);
    expect(plan.cargadas.flatMap((c) => c.respuestaIds)).not.toContain('r8');
  });

  it('una transcripción vacía no tapa el texto escrito', async () => {
    const base = baseConNarrador();
    Object.assign(base.tablas.respuestas.find((r) => r.id === 'r5')!, { transcripcion: '  ', texto_directo: 'Mi maestra.' });
    const plan = await planDePase(base.cliente, 'n1', { genero: 'mujer', equivalencias: leerEquivalencias({ version: 1, porTexto: { '¿Quién te enseñó a leer?': 'OR1' } }) });
    expect(plan.sinTexto).toEqual([]);
    expect(plan.cargadas.find((c) => c.clave === 'OR1')?.texto).toBe('Mi maestra.');
  });

  // Producción 08/10: a Dora le dicen Babu; OR6 tiene que preguntar por "Dora".
  it('la ficha lleva el nombre de pila de narradores.nombre (solo para OR6)', async () => {
    const plan = await planDePase(baseConNarrador({ nombre: 'DORA PEREZ', como_le_dicen: 'Babu' }).cliente, 'n1', { genero: 'mujer', equivalencias: PARCIAL });
    expect(plan.ficha).toEqual({ nombre: 'Babu', nombrePila: 'Dora', genero: 'mujer', quienRegala: 'Laura' });
    const ficha = fichaTexto({ ficha: plan.ficha, idioma: plan.idioma });
    expect(renderizar(preguntaPorId('OR6')!.texto, ficha)).toMatch(/^¿Por qué te pusieron Dora\? /);
    expect(renderizar(preguntaPorId('OR1')!.texto, ficha)).not.toContain('Dora');
    // Sin nombre (o igual a como le dicen): como antes.
    expect((await planDePase(baseConNarrador().cliente, 'n1', { genero: 'mujer', equivalencias: PARCIAL })).ficha).toEqual({ nombre: 'Prueba', genero: 'mujer', quienRegala: 'Laura' });
    expect(fichaDeNarrador({ como_le_dicen: 'Mariano', nombre: 'MARIANO' }, 'varon')).toEqual({ nombre: 'Mariano', genero: 'varon' });
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

  it('con nombre en narradores: la fila guarda el nombre de pila, pero los mensajes usan como le dicen', async () => {
    const n = { ...nuevo({ genero: 'mujer' }), nombre: 'DORA PEREZ', como_le_dicen: 'Babu' };
    const { deps, base, enviados } = preparar({ genero: 'mujer' });
    expect(await altaNuevo(deps, n, { ventanaAbierta: true })).toBe('mandada');
    expect((await leerFila(base.cliente, 'n1'))!.ficha).toEqual({ nombre: 'Babu', nombrePila: 'Dora', genero: 'mujer', quienRegala: 'Laura' });
    expect(enviados[0].texto).not.toContain('Dora');
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

// El mail «dijo que sí» de un regalo dice que la primera pregunta ya salió
// (robustez, 10/10): altaNuevo da 'mandada' solo si OR1 de verdad salió (Meta
// aceptó el envío). Si queda en la cola (Meta la rechazó, o no hay plantilla
// aprobada en es-ES/ca), da 'en-cola' y el mail sale cuando drenar la saca.
describe('el alta de un regalo y el mail «dijo que sí»', () => {
  const AHORA = new Date('2026-10-08T13:00:00Z');
  const narrador = (contexto: Record<string, unknown>): NarradorV3 => ({
    id: 'n1', familia_id: 'f1', como_le_dicen: 'Prueba', telefono_whatsapp: '+5491100000000', hora_preferida: '10:00:00',
    zona_horaria: 'America/Argentina/Buenos_Aires', contexto, estado: 'acepto', dia_actual: 0, ultima_respuesta_at: null,
  });
  const preparar = (contexto: Record<string, unknown>, o: { fallarEnvios?: number } = {}) => {
    const base = crearBaseFalsa({ familias: [{ id: 'f1', nombre: 'Laura' }], narradores: [{ ...narrador(contexto) }] });
    return { base, ...depsDePrueba(base, { ahora: AHORA, ...o }) };
  };
  /** El narrador escribe: se abre la ventana de 24 h. */
  const abrirVentana = (base: ReturnType<typeof crearBaseFalsa>) => {
    base.tablas.entrevistas_v3[0].estado = { ...base.tablas.entrevistas_v3[0].estado, ultimoEntranteAt: AHORA.toISOString() };
  };

  it('OR1 sale: «mandada» y el mail sale una vez', async () => {
    const ctx = { genero: 'mujer', regalo: true, idioma: 'es-ES' };
    const { deps, enviados, hitos } = preparar(ctx);
    expect(await altaNuevo(deps, narrador(ctx), { ventanaAbierta: true })).toBe('mandada');
    expect(enviados).toHaveLength(1);
    expect(hitos).toEqual(['n1:acepto']);
  });

  it('Meta rechaza OR1: «en-cola», sin mail; cuando sale en el tick siguiente, sale el mail', async () => {
    const ctx = { genero: 'mujer', regalo: true, idioma: 'ca' };
    const { deps, base, enviados, hitos } = preparar(ctx, { fallarEnvios: 1 });
    expect(await altaNuevo(deps, narrador(ctx), { ventanaAbierta: true })).toBe('en-cola');
    expect(enviados).toEqual([]);
    expect(hitos).toEqual([]);
    expect(await drenar(deps, 'n1')).toBe('enviado');
    expect(enviados).toHaveLength(1);
    expect(hitos).toEqual(['n1:acepto']);
    expect((await leerFila(base.cliente, 'n1'))!.estado.salientes).toEqual([]);
  });

  it('es-ES fuera de la ventana y sin plantilla: «en-cola», sin mail; cuando el narrador escribe y sale, sale el mail', async () => {
    const ctx = { genero: 'varon', regalo: true, idioma: 'es-ES' };
    const { deps, base, enviados, hitos, avisos } = preparar(ctx);
    expect(await altaNuevo(deps, narrador(ctx), { ventanaAbierta: false })).toBe('en-cola');
    expect(enviados).toEqual([]);
    expect(avisos.map((a) => a.clave)).toContain('plantilla-es-ES-pregunta');
    expect(hitos).toEqual([]);
    abrirVentana(base);
    await drenar(deps, 'n1');
    expect(enviados).toHaveLength(1);
    expect(hitos).toEqual(['n1:acepto']);
  });

  it('si el narrador ya contestó algo, drenar no manda un «dijo que sí» tardío (diría «enseguida le llega la primera»)', async () => {
    const ctx = { genero: 'mujer', regalo: true, idioma: 'ca' };
    const { deps, base, enviados, hitos } = preparar(ctx, { fallarEnvios: 1 });
    expect(await altaNuevo(deps, narrador(ctx), { ventanaAbierta: true })).toBe('en-cola');
    // Mientras tanto ya hay una respuesta anotada (p. ej., el mail falló al aceptar y se soltó).
    base.tablas.entrevistas_v3[0].estado = { ...base.tablas.entrevistas_v3[0].estado, respuestas: [['OR1', 'una respuesta']] };
    expect(await drenar(deps, 'n1')).toBe('enviado');
    expect(enviados).toHaveLength(1);
    expect(hitos).toEqual([]);
  });

  it('un regalo que ya tiene el mail anotado no lo pide de nuevo', async () => {
    const ctx = { genero: 'mujer', regalo: true, mailsEnviados: ['acepto'] };
    const { deps, hitos } = preparar(ctx);
    expect(await altaNuevo(deps, narrador(ctx), { ventanaAbierta: true })).toBe('mandada');
    expect(hitos).toEqual([]);
  });

  it('un nuevo de la V3 que no es regalo: drenar no manda el mail «dijo que sí» (sale por el camino de siempre)', async () => {
    const ctx = { genero: 'mujer', bienvenidaV3: true };
    const { deps, hitos } = preparar(ctx, { fallarEnvios: 1 });
    expect(await altaNuevo(deps, narrador(ctx), { ventanaAbierta: true })).toBe('en-cola');
    await drenar(deps, 'n1');
    expect(hitos).toEqual([]);
  });
});

/** Las 7 primeras del guion viejo (supabase/seed.sql), tal cual. */
const GUION_VIEJO = [
  'Cuénteme de la casa donde pasó su infancia. Si cierra los ojos y entra por la puerta, ¿qué ve, qué huele, quién está?',
  '¿Cómo eran su mamá y su papá? ¿Qué hacían, cómo era vivir con ellos? Cuénteme cómo los recuerda a cada uno.',
  '¿A qué jugaba de chico, y con quién? ¿Hermanos, amigos del barrio? Cuénteme alguna travesura que todavía lo haga reír.',
  '¿Cómo era su escuela? ¿Tuvo algún maestro o compañero que nunca se olvidó?',
  'Hábleme de sus abuelos y de dónde viene su familia. ¿Qué historias le contaban de antes de que usted naciera?',
  'Hábleme de sus hermanos. ¿Cómo era cada uno, con quién se llevaba mejor? ¿O fue hijo único — cómo era eso?',
  '¿Qué tradiciones había en su casa? Las comidas, las fiestas, los domingos... ¿qué olores y sabores lo devuelven a esa mesa?',
];

/** Un narrador del guion viejo que contestó las órdenes 1..hasta. */
function narradorViejo(hasta: number) {
  return crearBaseFalsa({
    familias: [{ id: 'f1', nombre: 'Laura' }],
    narradores: [{ id: 'n1', familia_id: 'f1', como_le_dicen: 'Prueba', telefono_whatsapp: '+5491100000000', hora_preferida: '10:00:00', zona_horaria: 'America/Argentina/Buenos_Aires', estado: 'activo', dia_actual: hasta, contexto: { trato: 'usted' }, ultima_respuesta_at: '2026-10-07T20:00:00Z' }],
    preguntas: [...GUION_VIEJO, '¿Cuál fue su primer trabajo?'].map((texto, i) => ({ id: `g${i + 1}`, narrador_id: null, orden: i + 1, texto, tipo: 'fija' })),
    respuestas: Array.from({ length: hasta }, (_, i) => ({ id: `r${i + 1}`, narrador_id: 'n1', pregunta_orden: i + 1, transcripcion: `Respuesta vieja ${i + 1}.`, texto_directo: null, recibido_at: `2026-10-0${i + 1}T10:00:00Z` })),
  });
}

describe('el pase con la tabla aprobada (07/10)', () => {
  it('como Dora (órdenes 1 a 3): CA1, CA2 con todo el texto y CA3 inferida de CA2, ES6; el motor no las vuelve a preguntar', async () => {
    const base = narradorViejo(3);
    const plan = await planDePase(base.cliente, 'n1', { genero: 'mujer', equivalencias: leerEquivalencias() });
    expect(plan.cargadas.map((c) => [c.clave, c.ordenes])).toEqual([['CA1', [1]], ['CA2', [2]], ['ES6', [3]]]);
    expect(plan.inferidas).toEqual([{ clave: 'CA3', de: 'CA2', ordenes: [2] }]);
    expect(plan.sinEquivalencia).toEqual([]);
    expect(bloqueosDePase(plan)).toEqual([]);
    expect(describirPase(plan)).toContain('CA3 ← ya está en CA2 (orden 2)');
    await aplicarPase(base.cliente, plan, ANTES_DE_LA_HORA);
    const fila = await leerFila(base.cliente, 'n1');
    expect(fila?.estado.respuestas).toEqual([
      ['CA1', 'Respuesta vieja 1.'],
      ['CA2', 'Respuesta vieja 2.'],
      ['CA3', '⟦inferida:CA2⟧'],
      ['ES6', 'Respuesta vieja 3.'],
    ]);
    // La charla lleva lo que se le preguntó de verdad (lo que lee el escritor como «lo que se mandó»), en orden.
    expect(fila?.estado.charla).toEqual([
      { de: 'bio', partes: [{ id: 'CA1', texto: GUION_VIEJO[0] }] },
      { de: 'bio', partes: [{ id: 'CA2', texto: GUION_VIEJO[1] }] },
      { de: 'bio', partes: [{ id: 'ES6', texto: GUION_VIEJO[2] }] },
    ]);
    const ficha = fichaTexto(fila!);
    expect(textoMandado(fila!.estado, ficha, 'CA2')).toBe(GUION_VIEJO[1]); // «mamá y papá», no la CA2 del banco
    expect(textoMandado(fila!.estado, ficha, 'CA1')).toBe(GUION_VIEJO[0]);
    expect(textoMandado(fila!.estado, ficha, 'ES6')).toBe(GUION_VIEJO[2]);
    // No es la cola: no sale nada, y el turno siguiente abre OR1 como siempre.
    expect(fila?.estado.salientes).toEqual([]);
    const a = avanzar(fila!.estado, ficha);
    expect(a.estado.esperando).toBe('OR1');
    expect(a.estado.salientes).toHaveLength(1);
    // clave_v3 de las filas viejas: la primera clave (CA2), nunca CA3.
    expect(Object.fromEntries(base.tablas.respuestas.map((r) => [r.id, r.clave_v3 ?? null]))).toEqual({ r1: 'CA1', r2: 'CA2', r3: 'ES6' });
    // El motor, contestando todo lo que pregunta hasta salir del bloque 3, no manda ninguna de las cargadas.
    const respuestas = new Map(fila!.estado.respuestas);
    const preguntadas: string[] = [];
    for (let i = 0; i < 200; i++) {
      const s = siguientePregunta({ respuestas, enviados: new Set(), rondaExtra: 'rechazada', familia: [], idioma: 'es-AR' });
      if (s.tipo !== 'pregunta' || s.pregunta.bloque > 3) break;
      preguntadas.push(s.pregunta.id);
      respuestas.set(s.pregunta.id, 'Me acuerdo bien: era una época linda y la cuento con gusto.');
    }
    expect(preguntadas[0]).toBe('OR1');
    expect(preguntadas).toEqual(expect.arrayContaining(['CA6', 'CA10', 'ES5', 'ES7']));
    for (const id of ['CA1', 'CA2', 'CA3', 'ES6']) expect(preguntadas).not.toContain(id);
  });

  it('como Mariano (órdenes 1 a 7): todo tiene equivalencia', async () => {
    const base = narradorViejo(7);
    const plan = await planDePase(base.cliente, 'n1', { genero: 'varon', equivalencias: leerEquivalencias() });
    expect(plan.sinEquivalencia).toEqual([]);
    expect(plan.cargadas.map((c) => c.clave)).toEqual(['CA1', 'CA2', 'ES6', 'ES2', 'OR2', 'CA6', 'CA10']);
    expect(plan.inferidas.map((i) => i.clave)).toEqual(['CA3']);
  });

  it('si otra pregunta vieja va directo a la clave inferida, gana la respuesta', async () => {
    const base = narradorViejo(3);
    const tabla = leerEquivalencias({ version: 1, porTexto: { [GUION_VIEJO[0]]: 'CA1', [GUION_VIEJO[1]]: ['CA2', 'CA3'], [GUION_VIEJO[2]]: 'CA3' } });
    const plan = await planDePase(base.cliente, 'n1', { genero: 'mujer', equivalencias: tabla });
    expect(plan.inferidas).toEqual([]);
    expect(plan.cargadas.map((c) => c.clave)).toEqual(['CA1', 'CA2', 'CA3']);
  });
});
