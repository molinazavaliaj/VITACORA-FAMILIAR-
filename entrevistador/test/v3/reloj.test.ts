import { describe, it, expect } from 'vitest';
import { crearBaseFalsa } from './base-falsa.js';
import { depsDePrueba } from './deps-prueba.js';
import { crearFila, leerFila } from '../../src/v3/estado.js';
import { tickV3, trabajarNarrador } from '../../src/v3/reloj.js';
import { avanzar, cerrarYSeguir, encolar, recibirAudio, textoDelBanco } from '../../src/v3/turno.js';
import { estadoInicial, MARCA_FOTO, SIN_CLAVE_V3, type EstadoV3, type FilaV3, type NarradorV3 } from '../../src/v3/tipos.js';
import { procesarEntranteV3 } from '../../src/v3/entrante.js';
import { preguntaPorId } from '../../src/v3/nucleo/entrevista/banco.js';
import { renderizar } from '../../src/v3/nucleo/entrevista/texto.js';

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

  it('aunque ya haya contestado 4 hoy (ritmo diario): cierra y le manda la siguiente (Naza 10/10, sin tope)', async () => {
    const r = await preparar({ ...enOR1(), borrador: 'Nací en un pueblo chico.' }, { ultimo_audio_at: hace(4 * MIN), tanda_cuenta: 4 });
    expect(await r.trabajar()).toBe('cierre');
    expect(r.enviados.map((e) => e.texto).some((t) => t?.includes(renderizar(preguntaPorId('OR2')!.texto, FICHA)))).toBe(true);
    const f = await r.leer();
    expect(f.estado.esperando).toBe('OR2');
    expect(f).toMatchObject({ tanda_cuenta: 5 });
  });

  it('quedó cortada hoy por el tope viejo (acuse guardado, nada abierto): le sale la siguiente ya, sin esperar su hora', async () => {
    const cortada = { ...cerrarYSeguir(recibirAudio(enOR1(), 'Nací en un pueblo chico.').estado, FICHA, false).estado, salientes: [] };
    const r = await preparar(cortada, { tanda_dia: HOY, tanda_cuenta: 8 });
    expect(await r.trabajar()).toBe('tanda');
    expect(r.enviados[0].texto?.startsWith(`${textoDelBanco('M3.1', FICHA)}
`)).toBe(true);
    expect(r.enviados[0].texto).toContain(renderizar(preguntaPorId('OR2')!.texto, FICHA));
    const f = await r.leer();
    expect(f.estado.esperando).toBe('OR2');
    expect(f).toMatchObject({ tanda_dia: HOY, tanda_cuenta: 9 });
    expect(f.estado.acuse).toBeUndefined();
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
    // Por plantilla va SOLO la pregunta: sin el acuse de ayer ni la entrada (spec: final-findings F3).
    expect(r.enviados[0].variables).toEqual([renderizar(preguntaPorId('OR2')!.texto, FICHA).replace(/\s+/g, ' ').trim()]);
    const f = await r.leer();
    expect(f).toMatchObject({ tanda_dia: HOY, tanda_cuenta: 1 });
    expect(f.estado.esperando).toBe('OR2');
    expect(f.estado.abiertaDesde).toBe(AHORA.toISOString());
    expect(f.estado.abiertaPorPlantilla).toBe(true);
    expect(f.estado.salientes).toEqual([]);
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

describe('reconciliación: filas de respuestas que quedaron sin clave_v3', () => {
  const CREADA = '2026-10-01T00:00:00.000Z';
  const fila = (extra: Record<string, unknown>) => ({
    narrador_id: 'n1', wa_message_id: `wamid.${Math.random()}`, audio_path: null, transcripcion: null, texto_directo: null,
    clave_v3: null, es_repregunta: false, pregunta_orden: 1, recibido_at: hace(6 * MIN), ...extra,
  });
  async function conFilas(estado: EstadoV3, filas: Record<string, unknown>[]) {
    const r = await preparar(estado, { creada_at: CREADA });
    r.base.tablas.respuestas = filas.map((f, i) => ({ id: `r${i + 1}`, ...fila(f) }));
    return r;
  }
  const clave = (r: Awaited<ReturnType<typeof conFilas>>, id: string) => r.base.tablas.respuestas.find((x) => x.id === id)?.clave_v3;

  it('un audio ya transcripto entra a la abierta, corre el reloj y queda con su clave (una sola vez)', async () => {
    const r = await conFilas(enOR1(), [{ audio_path: 'n1/dia_01.ogg', transcripcion: 'Nací en un pueblo chico.' }]);
    expect(await r.trabajar()).toBe('reconciliar');
    const f = await r.leer();
    expect(f.estado.borrador).toBe('Nací en un pueblo chico.');
    expect(f.ultimo_audio_at).toBe(AHORA.toISOString());
    expect(clave(r, 'r1')).toBe('OR1');
    expect(await r.trabajar()).toBe('nada');
    expect((await r.leer()).estado.borrador).toBe('Nací en un pueblo chico.');
  });

  it('un audio sin transcribir se transcribe desde Storage (en su idioma)', async () => {
    const r = await conFilas(enOR1(), [{ audio_path: 'n1/dia_01.ogg' }]);
    r.base.archivos.set('audios/n1/dia_01.ogg', 'Mi mamá cosía.');
    await r.trabajar();
    expect((await r.leer()).estado.borrador).toBe('Mi mamá cosía.');
    expect(r.base.tablas.respuestas[0]).toMatchObject({ transcripcion: 'Mi mamá cosía.', clave_v3: 'OR1' });
  });

  it('si la transcripción vuelve a fallar: M23 y la fila queda afuera (no se reintenta para siempre)', async () => {
    const r = await conFilas(enOR1(), [{ audio_path: 'n1/dia_01.ogg' }]);
    r.base.archivos.set('audios/n1/dia_01.ogg', 'FALLA');
    await r.trabajar();
    expect(r.enviados.map((e) => e.texto)).toEqual([textoDelBanco('M23', FICHA)]);
    expect(clave(r, 'r1')).toBe(SIN_CLAVE_V3);
    expect(await r.trabajar()).toBe('nada');
    expect(r.enviados).toHaveLength(1);
  });

  it('un texto, un botón y la foto de FO1 pasan por el mismo camino que un mensaje nuevo', async () => {
    const enCA6: EstadoV3 = { ...estadoInicial(), esperando: 'CA6', preguntaAbierta: { partes: [{ id: 'CA6', texto: '¿Hermanos?' }] }, ultimoEntranteAt: hace(HORA) };
    const boton = await conFilas(enCA6, [{ texto_directo: '⟦botón:Sí, tuve⟧' }]);
    await boton.trabajar();
    expect((await boton.leer()).estado).toMatchObject({ tocoSi: true, respuestas: [['CA6', '⟦botón:Sí, tuve⟧']] });
    expect(boton.enviados.map((e) => e.texto)).toEqual([textoDelBanco('M30', FICHA)]);
    expect(clave(boton, 'r1')).toBe('CA6');

    const texto = await conFilas(enOR1(), [{ texto_directo: 'Nací en un pueblo.', transcripcion: 'Nací en un pueblo.' }]);
    await texto.trabajar();
    expect((await texto.leer()).estado.borrador).toBe('Nací en un pueblo.');
    expect(texto.enviados.map((e) => e.texto)).toEqual([textoDelBanco('M22', FICHA)]);

    const foto = await conFilas({ ...estadoInicial(), esperando: 'FO1', ultimoEntranteAt: hace(HORA) }, [{ texto_directo: MARCA_FOTO, transcripcion: MARCA_FOTO }]);
    await foto.trabajar();
    expect((await foto.leer()).estado.borrador).toBe(MARCA_FOTO);
    expect(clave(foto, 'r1')).toBe('FO1');
  });

  it('no toca lo reciente (< 5 min), lo de antes de la V3, lo marcado como afuera ni lo que no vino de WhatsApp', async () => {
    const r = await conFilas(enOR1(), [
      { transcripcion: 'Reciente.', texto_directo: 'Reciente.', recibido_at: hace(2 * MIN) },
      { transcripcion: 'Vieja.', texto_directo: 'Vieja.', recibido_at: '2026-09-20T10:00:00.000Z' },
      { transcripcion: 'Afuera.', texto_directo: 'Afuera.', clave_v3: SIN_CLAVE_V3 },
      { transcripcion: 'Sin wamid.', texto_directo: 'Sin wamid.', wa_message_id: null },
    ]);
    expect(await r.trabajar()).toBe('nada');
    expect((await r.leer()).estado.borrador).toBeUndefined();
  });

  it('de punta a punta: se cae al guardar el estado, y a los 5 minutos el reloj lo recupera', async () => {
    const r = await preparar(enOR1(), { creada_at: CREADA });
    const cliente = r.base.cliente as unknown as { from: (t: string) => { update: (v: unknown) => unknown } };
    const from = cliente.from.bind(cliente);
    let k = 0;
    cliente.from = (t: string) => {
      const q = from(t);
      if (t === 'entrevistas_v3') {
        const update = q.update.bind(q);
        q.update = (v: unknown) => { if (++k === 2) r.base.fallarProxima.set('entrevistas_v3', { code: 'XX000', message: 'se cayó: prueba' }); return update(v); };
      }
      return q;
    };
    await expect(procesarEntranteV3(r.deps, r.n1, { telefono: '+5491100000000', tipo: 'audio', mediaId: 'Nací en un pueblo chico.', waMessageId: 'wamid.caida' })).rejects.toThrow(/se cayó/);
    expect((await r.leer()).estado.borrador).toBeUndefined();
    r.base.tablas.respuestas[0].recibido_at = AHORA.toISOString(); // la base pone now()
    r.pasar(6 * MIN);
    expect(await r.trabajar()).toBe('reconciliar');
    expect((await r.leer()).estado.borrador).toBe('Nací en un pueblo chico.');
    expect(r.base.tablas.respuestas[0].clave_v3).toBe('OR1');
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

describe('preguntas de la familia agregadas después del alta (Naza, 07/10)', () => {
  const sinAbierta = (): EstadoV3 => ({ ...cerrarYSeguir(recibirAudio(enOR1(), 'Nací en un pueblo chico.').estado, FICHA, false).estado, salientes: [] });
  const deLaFamilia = (id: string, texto: string, orden = 1) => ({ id, narrador_id: 'n1', orden, texto, tipo: 'familia' });

  it('al abrir la tanda del día se suman las nuevas (por id), sin repetir las que ya tenía', async () => {
    const r = await preparar({ ...sinAbierta(), familia: [{ id: 'F:pf1', texto: '¿Qué te acordás de la abuela?' }] }, { tanda_dia: AYER });
    r.base.tablas.preguntas = [
      deLaFamilia('pf1', '¿Qué te acordás de la abuela?', 1),
      deLaFamilia('pf2', '¿Cómo era el patio de la casa?', 2),
      { id: 'g1', narrador_id: null, orden: 1, texto: 'Una de la plantilla', tipo: 'fija' },
      { id: 'otro', narrador_id: 'n2', orden: 1, texto: 'De otro narrador', tipo: 'familia' },
    ];
    expect(await r.trabajar()).toBe('tanda');
    expect((await r.leer()).estado.familia).toEqual([
      { id: 'F:pf1', texto: '¿Qué te acordás de la abuela?' },
      { id: 'F:pf2', texto: '¿Cómo era el patio de la casa?' },
    ]);
    expect(r.avisos).toEqual([]);
  });

  it('si la familia borra o edita una, no se toca lo que ya estaba', async () => {
    const r = await preparar({ ...sinAbierta(), familia: [{ id: 'F:pf1', texto: 'Texto de cuando se cargó' }] }, { tanda_dia: AYER });
    r.base.tablas.preguntas = [deLaFamilia('pf1', 'Texto editado después')];
    await r.trabajar();
    expect((await r.leer()).estado.familia).toEqual([{ id: 'F:pf1', texto: 'Texto de cuando se cargó' }]);
  });

  it('con FO1 ya mandada o contestada no se suman: se avisa a los socios una sola vez', async () => {
    const pasoFO1: EstadoV3 = { ...sinAbierta(), respuestas: [...sinAbierta().respuestas, ['FO1', MARCA_FOTO]] };
    const r = await preparar(pasoFO1, { tanda_dia: AYER });
    r.base.tablas.preguntas = [deLaFamilia('pf9', '¿Y el perro?')];
    await r.trabajar();
    expect((await r.leer()).estado.familia).toEqual([]);
    expect(r.avisos).toHaveLength(1);
    expect(r.avisos[0].detalle).toContain('F:pf9');
    // Al día siguiente, otra tanda: no se repite el aviso.
    const f = await r.leer();
    r.base.tablas.entrevistas_v3[0] = { ...f, tanda_dia: AYER, estado: { ...f.estado, esperando: undefined, preguntaAbierta: undefined } };
    await r.trabajar();
    expect(r.avisos).toHaveLength(1);
  });

  it('antes de su hora (sin tanda) no se lee nada', async () => {
    const r = await preparar(sinAbierta(), { tanda_dia: AYER });
    r.fijar(new Date('2026-10-08T12:30:00Z')); // 09:30
    r.base.tablas.preguntas = [deLaFamilia('pf2', '¿Cómo era el patio?')];
    expect(await r.trabajar()).toBe('nada');
    expect((await r.leer()).estado.familia).toEqual([]);
  });
});
