import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { crearBaseFalsa } from '../v3/base-falsa.js';
import { depsViajeDePrueba } from './deps-prueba.js';
import { crearFila, leerFila } from '../../src/viaje-v2/filas.js';
import { estadoInicial, type EstadoBotViaje } from '../../src/viaje-v2/tipos.js';
import { drenar, elegirEnvio } from '../../src/viaje-v2/enviar.js';
import { procesarEntranteViajeV2, reenvioDe, esSi } from '../../src/viaje-v2/entrante.js';
import { trabajarViajero, tickViajeV2 } from '../../src/viaje-v2/reloj.js';
import type { Saliente } from '../../src/viaje-v2/nucleo/planificador.js';
import type { Compra } from '../../src/viaje-v2/nucleo/tipos.js';
import type { MensajeEntrante } from '../../src/whatsapp/webhook.js';

// Viajera y viaje INVENTADOS.
const COMPRA: Compra = {
  nombre: 'Olga',
  salida: '2026-11-10',
  vuelta: '2026-11-16',
  zonaCasa: 'America/Argentina/Buenos_Aires',
  zonaViaje: 'Europe/Madrid',
  horaNoche: '21:30',
  preguntasPropias: [],
  formato: 'pdf',
  fotosAlbum: 20,
};
const TEL = '+5491100000000';
const AHORA = new Date('2026-11-01T13:00:00Z'); // 10:00 en Buenos Aires
const MIN = 60_000;
const ENV = 'WA_PLANTILLAS_VIAJE_V2_LISTAS';

let previo: string | undefined;
beforeEach(() => { previo = process.env[ENV]; delete process.env[ENV]; });
afterEach(() => { if (previo === undefined) delete process.env[ENV]; else process.env[ENV] = previo; });

async function preparar(o: { estado?: Partial<EstadoBotViaje>; narrador?: Record<string, unknown>; compra?: Compra } = {}) {
  const n = { id: 'n1', estado: 'invitado', telefono_whatsapp: TEL, como_le_dicen: 'Olga', contexto: { modo: 'viaje' }, ...o.narrador };
  const base = crearBaseFalsa({ narradores: [{ ...n }], viajes_v2: [], respuestas: [], envios: [], fotos: [] });
  await crearFila(base.cliente, { narrador_id: 'n1', idioma: 'es-AR', compra: o.compra ?? COMPRA, estado: { ...estadoInicial(), ...o.estado } });
  const p = depsViajeDePrueba(base, { ahora: AHORA });
  const leer = async () => (await leerFila<Compra, EstadoBotViaje>(base.cliente, 'n1'))!;
  const narrador = () => base.tablas.narradores.find((x) => x.id === 'n1')!;
  const entra = (m: Partial<MensajeEntrante> & { waMessageId: string }) =>
    procesarEntranteViajeV2(p.deps, narrador() as never, { telefono: TEL, tipo: 'texto', ...m } as MensajeEntrante);
  const trabajar = async () => trabajarViajero(p.deps, await leer(), narrador() as never);
  return { base, ...p, leer, narrador, entra, trabajar };
}

const saliente = (id: string, x: Partial<Saliente>): Saliente =>
  ({ id, tipo: 'texto', desde: AHORA.toISOString(), zona: COMPRA.zonaCasa, origen: 'programado', iniciativa: true, ids: ['X'], texto: `texto ${id}`, ...x });

describe('viaje V2 en el bot: la bienvenida y el SÍ', () => {
  it('sin la plantilla aprobada no sale y se avisa; aprobada, sale una sola vez con nombre y formato', async () => {
    const r = await preparar();
    expect(await r.trabajar()).toBe('nada');
    expect(r.enviados).toEqual([]);
    expect(r.avisos.map((a) => a.clave)).toEqual(['viaje-bienvenida-es-AR-bienvenida']);
    process.env[ENV] = 'es-AR:bienvenida';
    expect(await r.trabajar()).toBe('bienvenida');
    expect(r.enviados).toEqual([{ a: TEL, tipo: 'plantilla', plantilla: 'bienvenida_viaje_v2', idiomaMeta: 'es', variables: ['Olga', 'un libro en PDF'] }]);
    expect((await r.leer()).estado.bienvenida?.por).toBe('plantilla');
    await r.trabajar();
    expect(r.enviados).toHaveLength(1);
    expect(r.base.tablas.envios.map((e) => e.tipo)).toEqual(['bienvenida']);
  });

  it('un regalo usa bienvenida_viaje_regalo_v2 con quién regala', async () => {
    process.env[ENV] = 'es-AR:bienvenida_regalo';
    const r = await preparar({ compra: { ...COMPRA, regalo: { quienRegala: 'Tomás' } } });
    await r.trabajar();
    expect(r.enviados[0]).toMatchObject({ plantilla: 'bienvenida_viaje_regalo_v2', variables: ['Olga', 'Tomás', 'un libro en PDF'] });
  });

  it('con el SÍ arranca: BIEN-2 y AS1 como texto, y queda activa', async () => {
    const r = await preparar({ estado: { bienvenida: { en: AHORA.toISOString(), por: 'plantilla' } } });
    await r.entra({ waMessageId: 'w1', texto: 'Sí, dale' });
    expect(r.enviados.map((e) => e.tipo)).toEqual(['texto', 'texto']);
    expect(r.enviados[0].texto).toMatch(/^Vamos\./);
    expect(r.narrador().estado).toBe('activo');
    const f = await r.leer();
    expect(f.estado.plan?.envios.map((e) => e.clave)).toEqual(['AS1']);
    expect(f.estado.salida).toEqual([]);
    // El SÍ no deja fila: es el permiso, no una respuesta.
    expect(r.base.tablas.respuestas).toEqual([]);
  });

  it('el «dijo que sí» por mail va solo si el viaje es un regalo', async () => {
    const propio = await preparar({ estado: { bienvenida: { en: AHORA.toISOString(), por: 'plantilla' } } });
    await propio.entra({ waMessageId: 'w1', texto: 'sí' });
    expect(propio.mailsSi).toEqual([]);
    const regalo = await preparar({ compra: { ...COMPRA, regalo: { quienRegala: 'Tomás' } }, estado: { bienvenida: { en: AHORA.toISOString(), por: 'plantilla' } } });
    await regalo.entra({ waMessageId: 'w1', texto: 'sí' });
    expect(regalo.mailsSi).toEqual(['n1']);
  });

  it('«Sii» también es SÍ; «hola» no', () => {
    expect(esSi('Sii', COMPRA)).toBe(true);
    expect(esSi('siii!!', COMPRA)).toBe(true);
    expect(esSi('hola', COMPRA)).toBe(false);
    expect(esSi('si, pero no sé si tengo tiempo', COMPRA)).toBe(false);
  });

  it('escribe antes de la bienvenida: le sale como texto; otra vez, se repite una vez; después silencio y aviso', async () => {
    const r = await preparar();
    await r.entra({ waMessageId: 'w1', texto: 'hola' });
    expect(r.enviados).toHaveLength(1);
    expect(r.enviados[0].texto).toMatch(/^Hola, Olga\. Soy quien va a escribir el libro de tu viaje/);
    await r.entra({ waMessageId: 'w2', texto: '¿qué es esto?' });
    expect(r.enviados).toHaveLength(2);
    await r.entra({ waMessageId: 'w3', texto: 'no entiendo' });
    expect(r.enviados).toHaveLength(2);
    expect(r.avisos.map((a) => a.clave)).toContain('viaje-sin-si-n1');
    // Un audio antes del SÍ no se guarda.
    await r.entra({ waMessageId: 'w4', tipo: 'audio', mediaId: 'te cuento algo' });
    expect(r.base.tablas.respuestas).toEqual([]);
    expect(r.base.archivos.size).toBe(0);
  });
});

describe('viaje V2 en el bot: lo que llega después del SÍ', () => {
  async function arrancada() {
    const r = await preparar({ estado: { bienvenida: { en: AHORA.toISOString(), por: 'plantilla' } } });
    await r.entra({ waMessageId: 'w-si', texto: 'sí' });
    r.enviados.length = 0;
    return r;
  }

  it('un audio a AS1: se guarda con su transcripción y clave AS1; la reacción sale a los 3 minutos de silencio', async () => {
    const r = await arrancada();
    r.pasar(10 * MIN);
    await r.entra({ waMessageId: 'w1', tipo: 'audio', mediaId: 'Voy a Madrid por primera vez, con mi hermana.' });
    const filaR = r.base.tablas.respuestas[0];
    expect(filaR).toMatchObject({ narrador_id: 'n1', wa_message_id: 'w1', clave_viaje: 'AS1', transcripcion: 'Voy a Madrid por primera vez, con mi hermana.' });
    expect(filaR.audio_path).toMatch(/^n1\/dia_01/);
    expect(r.enviados).toEqual([]); // el grupo sigue abierto
    r.pasar(4 * MIN);
    expect(await r.trabajar()).toBe('toca');
    expect(r.enviados.length).toBeGreaterThan(0);
    expect(r.enviados.every((e) => e.tipo === 'texto')).toBe(true);
    const f = await r.leer();
    expect(f.estado.plan!.envios.find((e) => e.clave === 'AS1')!.respuestas).toHaveLength(1);
    expect(f.estado.salida).toEqual([]);
  });

  it('el mismo mensaje dos veces (Meta reintenta) deja una sola fila', async () => {
    const r = await arrancada();
    await r.entra({ waMessageId: 'w1', texto: 'Me voy con mi hermana a Madrid' });
    await r.entra({ waMessageId: 'w1', texto: 'Me voy con mi hermana a Madrid' });
    expect(r.base.tablas.respuestas).toHaveLength(1);
    expect((await r.leer()).estado.plan!.grupo!.entradas).toHaveLength(1);
  });

  it('un audio que no se pudo bajar: sin fila, y a los 3 minutos COR (la pregunta sigue abierta)', async () => {
    const r = await arrancada();
    await r.entra({ waMessageId: 'w1', tipo: 'audio', mediaId: 'NO-BAJA' });
    expect(r.base.tablas.respuestas).toEqual([]);
    r.pasar(4 * MIN);
    await r.trabajar();
    expect(r.enviados.map((e) => e.texto)).toEqual([expect.stringMatching(/^Se me cortó el audio/)]);
    expect((await r.leer()).estado.plan!.envios.find((e) => e.clave === 'AS1')!.respuestas.every((x) => x.audioMal)).toBe(true);
  });

  it('una foto: va a fotos y a respuestas con la marca de foto', async () => {
    const r = await arrancada();
    await r.entra({ waMessageId: 'w1', tipo: 'imagen', mediaId: 'bytes-de-foto', mimeType: 'image/jpeg', texto: 'la valija' });
    expect(r.base.tablas.fotos).toHaveLength(1);
    expect(r.base.tablas.respuestas[0]).toMatchObject({ texto_directo: '⟦foto⟧ la valija', clave_viaje: 'AS1' });
  });
});

describe('viaje V2 en el bot: el envío y la ventana de 24 h', () => {
  const activa = (estado: Partial<EstadoBotViaje>) => preparar({ narrador: { estado: 'activo' }, estado: { bienvenida: { en: AHORA.toISOString(), por: 'plantilla' }, ...estado } });
  const hace = (ms: number) => new Date(AHORA.getTime() - ms).toISOString();

  it('ventana abierta: texto, y la ❤️ como reacción sobre su mensaje', async () => {
    const r = await activa({ ultimoEntranteAt: hace(MIN), salida: [saliente('s1', {}), saliente('s2', { tipo: 'reaccion', texto: '', ids: [], emoji: '❤️', aMensaje: 'w9' })] });
    expect(await drenar(r.deps, 'n1')).toBe('enviado');
    expect(r.enviados).toEqual([{ a: TEL, tipo: 'texto', texto: 'texto s1' }, { a: TEL, tipo: 'reaccion', aMensaje: 'w9', emoji: '❤️' }]);
    expect(r.base.tablas.envios.map((e) => e.tipo)).toEqual(['viaje_v2', 'viaje_v2']);
    expect((await r.leer()).estado.salida).toEqual([]);
  });

  it('ventana cerrada sin plantilla aprobada: no sale nada, queda en la cola y se avisa', async () => {
    const r = await activa({ ultimoEntranteAt: hace(30 * 3_600_000), salida: [saliente('s1', { tipo: 'pregunta' })] });
    expect(await drenar(r.deps, 'n1')).toBe('sin-plantilla');
    expect(r.enviados).toEqual([]);
    expect((await r.leer()).estado.salida).toHaveLength(1);
    expect(r.avisos[0].clave).toBe('viaje-plantilla-es-AR-mensaje');
  });

  it('ventana cerrada con plantilla: todo en una mensaje_viaje_v2, en una línea; las ❤️ se descartan', async () => {
    process.env[ENV] = 'es-AR:mensaje';
    const r = await activa({
      ultimoEntranteAt: hace(30 * 3_600_000),
      salida: [
        saliente('s1', { tipo: 'reaccion', texto: '', ids: [], emoji: '❤️', aMensaje: 'w9' }),
        saliente('s2', { tipo: 'pregunta', texto: 'Ayer no supe de vos.\n\n¿Cómo fue el día?' }),
      ],
    });
    await drenar(r.deps, 'n1');
    expect(r.enviados).toEqual([{ a: TEL, tipo: 'plantilla', plantilla: 'mensaje_viaje_v2', idiomaMeta: 'es', variables: ['Olga', 'Ayer no supe de vos. ¿Cómo fue el día?'] }]);
    expect((await r.leer()).estado.salida).toEqual([]);
  });

  it('solo el recordatorio de la última de antes de salir: recordatorio_viaje_ultima_v2', async () => {
    process.env[ENV] = 'es-AR:recordatorio_ultima';
    const r = await activa({ ultimoEntranteAt: hace(30 * 3_600_000), salida: [saliente('s1', { tipo: 'recordatorio', ids: ['REC1-U'] })] });
    await drenar(r.deps, 'n1');
    expect(r.enviados[0]).toMatchObject({ plantilla: 'recordatorio_viaje_ultima_v2', variables: ['Olga'] });
  });

  it('una ❤️ que Meta rechaza se descarta y no frena lo que sigue', async () => {
    const r = await activa({ ultimoEntranteAt: hace(MIN), salida: [saliente('s1', { tipo: 'reaccion', texto: '', ids: [], emoji: '❤️', aMensaje: 'w9' }), saliente('s2', {})] });
    r.fallar(1);
    await drenar(r.deps, 'n1');
    expect(r.enviados).toEqual([{ a: TEL, tipo: 'texto', texto: 'texto s2' }]);
  });

  it('un texto que falla queda; al tercer fallo seguido se avisa una vez', async () => {
    const r = await activa({ ultimoEntranteAt: hace(MIN), salida: [saliente('s1', {})] });
    r.fallar(5);
    for (let i = 0; i < 4; i++) expect(await drenar(r.deps, 'n1')).toBe('fallo');
    expect((await r.leer()).estado.salida).toHaveLength(1);
    expect(r.avisos.filter((a) => a.clave === 'viaje-envios-n1')).toHaveLength(1);
  });

  it('elegirEnvio no manda nada con la toma de otro (drenar devuelve ocupado)', async () => {
    const r = await activa({ ultimoEntranteAt: hace(MIN), salida: [saliente('s1', {})] });
    r.base.tablas.viajes_v2[0].enviando_hasta = new Date(AHORA.getTime() + MIN).toISOString();
    expect(await drenar(r.deps, 'n1')).toBe('ocupado');
    expect(elegirEnvio(await r.leer(), AHORA).tipo).toBe('texto');
  });
});

describe('viaje V2 en el bot: AL3 (las fotos que saca)', () => {
  it('reconoce el reenvío por la cita o por el mismo archivo', () => {
    const e = { ...estadoInicial(), fotosAlbum: { sha1: 'wA', sha2: 'wB' } };
    expect(reenvioDe(e, { citaA: 'wB' })).toBe('wB');
    expect(reenvioDe(e, { sha256: 'sha1' })).toBe('wA');
    expect(reenvioDe(e, { sha256: 'otra', citaA: 'wZ' })).toBeUndefined();
  });
});

describe('viaje V2 en el bot: el reloj', () => {
  it('lee solo invitados y activos con fila, y saltea los de la simulación', async () => {
    process.env[ENV] = 'es-AR:bienvenida';
    const r = await preparar({ narrador: { contexto: { modo: 'viaje', simulacion: true } } });
    await tickViajeV2(r.deps);
    expect(r.enviados).toEqual([]);
    r.narrador().contexto = { modo: 'viaje' };
    await tickViajeV2(r.deps);
    expect(r.enviados).toHaveLength(1);
  });
});

describe('viaje V2 en el bot: revisión del 10/10', () => {
  async function arrancada() {
    const r = await preparar({ estado: { bienvenida: { en: AHORA.toISOString(), por: 'plantilla' } } });
    await r.entra({ waMessageId: 'w-si', texto: 'sí' });
    r.enviados.length = 0;
    return r;
  }

  it('12 fotos a la vez: todas llegan al plan y todas las filas tienen clave', async () => {
    const r = await arrancada();
    await Promise.all(Array.from({ length: 12 }, (_, i) => r.entra({ waMessageId: `f${i}`, tipo: 'imagen', mediaId: `foto-${i}`, sha256: `sha${i}` })));
    expect((await r.leer()).estado.plan!.grupo!.entradas).toHaveLength(12);
    expect(r.base.tablas.respuestas.filter((x) => !x.clave_viaje)).toEqual([]);
  });

  it('una fila que quedó sin pasar al plan (el proceso se cayó) la retoma el reloj', async () => {
    const r = await arrancada();
    r.base.tablas.respuestas.push({
      id: 'r-huerfana', narrador_id: 'n1', wa_message_id: 'w-perdido', audio_path: 'n1/dia_01.ogg', transcripcion: 'Me voy con mi hermana',
      texto_directo: null, clave_viaje: null, recibido_at: new Date(AHORA.getTime() - 10 * MIN).toISOString(), es_repregunta: false,
    });
    r.narrador().estado = 'activo';
    expect(await r.trabajar()).toBe('reconciliar');
    expect(r.base.tablas.respuestas.find((x) => x.id === 'r-huerfana')!.clave_viaje).toBe('AS1');
    expect((await r.leer()).estado.plan!.grupo!.entradas.map((e) => e.idMensaje)).toEqual(['w-perdido']);
    // La siguiente vez ya no la toca.
    expect(await r.trabajar()).not.toBe('reconciliar');
  });

  it('dijo SÍ pero quedó en invitado: el reloj lo deja activo y el viaje sigue', async () => {
    const r = await arrancada();
    r.narrador().estado = 'invitado';
    await r.trabajar();
    expect(r.narrador().estado).toBe('activo');
  });

  it('la transcripción falla una vez: se reintenta y no sale COR', async () => {
    const r = await arrancada();
    let veces = 0;
    const orig = r.deps.transcribir;
    r.deps.transcribir = async (a, o) => { if (veces++ === 0) throw new Error('OpenAI 500: prueba'); return orig(a, o); };
    await r.entra({ waMessageId: 'w1', tipo: 'audio', mediaId: 'Me voy a Madrid' });
    expect(r.base.tablas.respuestas[0].transcripcion).toBe('Me voy a Madrid');
  });
});
