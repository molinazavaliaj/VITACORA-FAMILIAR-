import { describe, it, expect } from 'vitest';
import { crearBaseFalsa } from './base-falsa.js';
import { depsDePrueba } from './deps-prueba.js';
import { crearFila, leerFila } from '../../src/v3/estado.js';
import { tickV3, trabajarNarrador } from '../../src/v3/reloj.js';
import { avanzar, cerrarYSeguir, encolar, recibirAudio, textoDelBanco } from '../../src/v3/turno.js';
import { estadoInicial, type EstadoV3, type FilaV3, type NarradorV3 } from '../../src/v3/tipos.js';

const FICHA = { nombre: 'Prueba', genero: 'mujer' as const };
const AHORA = new Date('2026-10-08T13:05:00Z'); // 10:05 en Buenos Aires
const HOY = '2026-10-08';
const AYER = '2026-10-07';
const hace = (ms: number) => new Date(AHORA.getTime() - ms).toISOString();
const MIN = 60_000;
const HORA = 3600_000;

const narrador = (extra: Partial<NarradorV3> = {}): NarradorV3 => ({
  id: 'n1', familia_id: 'f1', como_le_dicen: 'Prueba', telefono_whatsapp: '+5491100000000', hora_preferida: '10:00:00',
  zona_horaria: 'America/Argentina/Buenos_Aires', contexto: { ritmo: 'diario' }, estado: 'activo', dia_actual: 0, ultima_respuesta_at: null, ...extra,
});
/** OR1 mandada, cola vacía, ventana abierta. */
const enOR1 = (): EstadoV3 => ({ ...avanzar(estadoInicial(), FICHA).estado, salientes: [], ultimoEntranteAt: hace(HORA) });

async function preparar(estado: EstadoV3, fila: Partial<FilaV3> = {}, n: Partial<NarradorV3> = {}) {
  const n1 = narrador(n);
  const base = crearBaseFalsa({ narradores: [{ ...n1 }] });
  await crearFila(base.cliente, { narrador_id: 'n1', idioma: 'es-AR', ficha: FICHA, estado, ultimo_audio_at: null, tanda_dia: HOY, tanda_cuenta: 1, migrada_de: null });
  Object.assign(base.tablas.entrevistas_v3[0], fila);
  const p = depsDePrueba(base, { ahora: AHORA });
  const leer = async () => (await leerFila(base.cliente, 'n1'))!;
  return { base, n1, ...p, leer, trabajar: async () => trabajarNarrador(p.deps, await leer(), n1) };
}

describe('cierre por silencio', () => {
  it('a los 3 minutos de la última transcripción cierra y manda la siguiente', async () => {
    const r = await preparar({ ...enOR1(), borrador: 'Nací en un pueblo chico.' }, { ultimo_audio_at: hace(4 * MIN) });
    expect(await r.trabajar()).toBe('cierre');
    expect(r.enviados[0].texto?.startsWith(`${textoDelBanco('M3.1', FICHA)}\n`)).toBe(true);
    const f = await r.leer();
    expect(f).toMatchObject({ tanda_cuenta: 2, ultimo_audio_at: null });
    expect(f.estado.respuestas).toEqual([['OR1', 'Nací en un pueblo chico.']]);
    expect(r.hitos).toContain('n1:primera');
  });

  it('a los 2 minutos todavía no', async () => {
    const r = await preparar({ ...enOR1(), borrador: 'Nací en un pueblo chico.' }, { ultimo_audio_at: hace(2 * MIN) });
    expect(await r.trabajar()).toBe('nada');
    expect(r.enviados).toEqual([]);
  });

  it('con la tanda diaria en el tope (4): cierra, guarda el acuse y no manda nada', async () => {
    const r = await preparar({ ...enOR1(), borrador: 'Nací en un pueblo chico.' }, { ultimo_audio_at: hace(4 * MIN), tanda_cuenta: 4 });
    expect(await r.trabajar()).toBe('cierre');
    expect(r.enviados).toEqual([]);
    const f = await r.leer();
    expect(f.estado.esperando).toBeUndefined();
    expect(f.estado.acuse).toEqual({ familia: 'M3', n: 0 });
  });

  it('con otro proceso mandando (toma vigente) no toca nada', async () => {
    const r = await preparar({ ...enOR1(), borrador: 'Algo.' }, { ultimo_audio_at: hace(4 * MIN), enviando_hasta: new Date(AHORA.getTime() + MIN).toISOString() });
    expect(await r.trabajar()).toBe('nada');
  });
});

describe('la tanda diaria', () => {
  const conAcusePendiente = (): EstadoV3 => ({ ...cerrarYSeguir(recibirAudio(enOR1(), 'Nací en un pueblo chico.').estado, FICHA, false).estado, salientes: [] });

  it('a su hora, con el acuse de ayer pegado arriba; fuera de las 24 h, con la plantilla', async () => {
    const r = await preparar({ ...conAcusePendiente(), ultimoEntranteAt: hace(25 * HORA) }, { tanda_dia: AYER, tanda_cuenta: 4 });
    expect(await r.trabajar()).toBe('tanda');
    expect(r.enviados).toHaveLength(1);
    expect(r.enviados[0]).toMatchObject({ tipo: 'plantilla', plantilla: 'pregunta_diaria_vos' });
    expect(r.enviados[0].variables![0].startsWith(textoDelBanco('M3.1', FICHA))).toBe(true);
    const f = await r.leer();
    expect(f).toMatchObject({ tanda_dia: HOY, tanda_cuenta: 1 });
    expect(f.estado.esperando).toBe('OR2');
    expect(f.estado.abiertaDesde).toBe(AHORA.toISOString());
  });

  it('si la de ayer quedó sin contestar, NO se reenvía ni arranca otra (se espera; a los 2 días, M8)', async () => {
    const r = await preparar(enOR1(), { tanda_dia: AYER, tanda_cuenta: 1 });
    expect(await r.trabajar()).toBe('nada');
    expect(r.enviados).toEqual([]);
    expect((await r.leer()).tanda_dia).toBe(AYER);
  });

  it('antes de su hora no arranca', async () => {
    const r = await preparar(conAcusePendiente(), { tanda_dia: AYER });
    r.fijar(new Date('2026-10-08T12:30:00Z')); // 09:30
    expect(await r.trabajar()).toBe('nada');
  });

  it('si está mandando audios, no la pisa: primero se cierra lo suyo', async () => {
    const r = await preparar({ ...enOR1(), borrador: 'Algo.' }, { tanda_dia: AYER, ultimo_audio_at: hace(MIN) });
    expect(await r.trabajar()).toBe('nada');
  });
});

describe('M8', () => {
  it('a los 2 días sin respuesta a la pregunta abierta; una sola vez por pregunta', async () => {
    const r = await preparar({ ...enOR1(), abiertaDesde: hace(48 * HORA + MIN) }, { tanda_dia: AYER });
    expect(await r.trabajar()).toBe('m8');
    expect(r.enviados.map((e) => e.texto)).toEqual([textoDelBanco('M8', FICHA)]);
    expect((await r.leer()).estado.m8En).toBe('OR1');
    r.pasar(24 * HORA);
    expect(await r.trabajar()).toBe('nada');
    expect(r.enviados).toHaveLength(1);
  });

  it('a las 47 horas, no; si ya está contando algo, tampoco', async () => {
    expect(await (await preparar({ ...enOR1(), abiertaDesde: hace(47 * HORA) })).trabajar()).toBe('nada');
    const contando = await preparar({ ...enOR1(), abiertaDesde: hace(49 * HORA), borrador: 'Algo.' }, { ultimo_audio_at: hace(MIN) });
    expect(await contando.trabajar()).toBe('nada');
  });

  it('fuera de las 24 h sale por la plantilla con el texto de M8, si está aprobada', async () => {
    process.env.WA_PLANTILLAS_V3_LISTAS = 'es-AR:recordatorio';
    try {
      const r = await preparar({ ...enOR1(), ultimoEntranteAt: hace(49 * HORA), abiertaDesde: hace(49 * HORA) }, { tanda_dia: AYER });
      expect(await r.trabajar()).toBe('m8');
      expect(r.enviados).toEqual([{ a: '+5491100000000', tipo: 'plantilla', plantilla: 'm8_vos', idiomaMeta: 'es', variables: ['Prueba'] }]);
    } finally {
      delete process.env.WA_PLANTILLAS_V3_LISTAS;
    }
  });
});

describe('el tick', () => {
  it('primero vacía la cola que quedó (un envío que había fallado)', async () => {
    const r = await preparar(encolar(enOR1(), { texto: 'Pendiente', tipo: 'turno' }));
    expect(await r.trabajar()).toBe('drenar');
    expect(r.enviados.map((e) => e.texto)).toEqual(['Pendiente']);
  });

  it('un narrador pausado no recibe nada', async () => {
    const r = await preparar(enOR1(), { tanda_dia: AYER }, { estado: 'pausado' });
    expect(await r.trabajar()).toBe('nada');
  });

  it('tickV3 recorre las filas y un narrador que falla no frena a los demás', async () => {
    const r = await preparar({ ...enOR1(), borrador: 'Algo.' }, { ultimo_audio_at: hace(4 * MIN) });
    await crearFila(r.base.cliente, { narrador_id: 'n-sin-narrador', idioma: 'es-AR', ficha: FICHA, estado: estadoInicial(), ultimo_audio_at: null, tanda_dia: null, tanda_cuenta: 0, migrada_de: null });
    await tickV3(r.deps);
    expect((await r.leer()).estado.respuestas).toHaveLength(1);
  });
});

describe('casos que el reloj no puede romper', () => {
  it('tocó "Sí", sin audio: no cierra ni tira; a las 48 h sale M8 una vez', async () => {
    // Abierta hace casi 2 días; escribió hace una hora (la ventana de 24 h sigue abierta).
    const r = await preparar({ ...enOR1(), tocoSi: true, abiertaDesde: hace(48 * HORA - MIN) }, { ultimo_audio_at: hace(10 * MIN), tanda_dia: AYER });
    expect(await r.trabajar()).toBe('nada');
    expect(r.enviados).toEqual([]);
    r.pasar(2 * MIN);
    expect(await r.trabajar()).toBe('m8');
    expect(r.enviados.map((e) => e.texto)).toEqual([textoDelBanco('M8', FICHA)]);
    r.pasar(24 * HORA);
    expect(await r.trabajar()).toBe('nada');
    expect(r.enviados).toHaveLength(1);
  });

  it('tickV3: un narrador cuya fila hace tirar no frena al siguiente', async () => {
    const r = await preparar({ ...enOR1(), borrador: 'Algo.' }, { ultimo_audio_at: hace(4 * MIN) });
    r.base.tablas.narradores.unshift({ ...narrador({ id: 'n0' }) });
    await crearFila(r.base.cliente, { narrador_id: 'n0', idioma: 'es-AR', ficha: FICHA, estado: estadoInicial(), ultimo_audio_at: null, tanda_dia: null, tanda_cuenta: 0, migrada_de: null });
    // Una fila rota: sin cola. Leerla en trabajarNarrador tira.
    const filas = r.base.tablas.entrevistas_v3 as any[];
    const rota = filas.splice(filas.findIndex((f) => f.narrador_id === 'n0'), 1)[0];
    rota.estado = { ...rota.estado, salientes: undefined };
    filas.unshift(rota); // la rota va primero
    const errores: unknown[] = [];
    const original = console.error;
    console.error = (...a: unknown[]) => { errores.push(a); };
    try {
      await tickV3(r.deps);
    } finally {
      console.error = original;
    }
    expect(errores).toHaveLength(1);
    expect((await r.leer()).estado.respuestas).toHaveLength(1);
  });
});

describe('narradores de la simulación', () => {
  it('el tick de producción los saltea (contexto.simulacion) y sigue con los demás', async () => {
    const sim = narrador({ id: 'sim', contexto: { ritmo: 'diario', simulacion: true } });
    const real = narrador({ id: 'real' });
    const base = crearBaseFalsa({ narradores: [{ ...sim }, { ...real }] });
    const viejo = { ...enOR1(), borrador: 'Nací en un pueblo chico.' };
    for (const id of ['sim', 'real']) {
      await crearFila(base.cliente, { narrador_id: id, idioma: 'es-AR', ficha: FICHA, estado: viejo, ultimo_audio_at: hace(4 * MIN), tanda_dia: HOY, tanda_cuenta: 1, migrada_de: null });
    }
    const p = depsDePrueba(base, { ahora: AHORA });
    await tickV3(p.deps);
    expect((await leerFila(base.cliente, 'sim'))?.estado.borrador).toBe('Nací en un pueblo chico.');
    expect((await leerFila(base.cliente, 'real'))?.estado.borrador).not.toBe('Nací en un pueblo chico.');
    expect(p.enviados.length).toBeGreaterThan(0);
  });
});
