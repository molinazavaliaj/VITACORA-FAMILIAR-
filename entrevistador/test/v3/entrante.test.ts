import { describe, it, expect } from 'vitest';
import { crearBaseFalsa } from './base-falsa.js';
import { depsDePrueba } from './deps-prueba.js';
import { crearFila, leerFila } from '../../src/v3/estado.js';
import { procesarEntranteV3 } from '../../src/v3/entrante.js';
import { avanzar, textoDelBanco } from '../../src/v3/turno.js';
import { estadoInicial, MARCA_FOTO, type EstadoV3, type NarradorV3 } from '../../src/v3/tipos.js';
import type { MensajeEntrante } from '../../src/whatsapp/webhook.js';
import type { Idioma } from '../../src/v3/nucleo/entrevista/idioma.js';

const AHORA = new Date('2026-10-08T13:00:00Z');
const FICHA = { nombre: 'Prueba', genero: 'mujer' as const };
const narrador = (extra: Partial<NarradorV3> = {}): NarradorV3 => ({
  id: 'n1', familia_id: 'f1', como_le_dicen: 'Prueba', telefono_whatsapp: '+5491100000000', hora_preferida: '10:00:00',
  zona_horaria: 'America/Argentina/Buenos_Aires', contexto: { ritmo: 'diario' }, estado: 'activo', dia_actual: 0, ultima_respuesta_at: null, ...extra,
});
/** La entrevista con OR1 ya mandada (cola vacía) y la ventana abierta. */
const enOR1 = (): EstadoV3 => ({ ...avanzar(estadoInicial(), FICHA).estado, salientes: [], ultimoEntranteAt: AHORA.toISOString() });
let n = 0;
const audio = (texto: string, waMessageId = `wamid.${++n}`): MensajeEntrante => ({ telefono: '+5491100000000', tipo: 'audio', mediaId: texto, waMessageId });
const texto = (t: string, esBoton = false): MensajeEntrante => ({ telefono: '+5491100000000', tipo: 'texto', texto: t, waMessageId: `wamid.${++n}`, ...(esBoton ? { esBoton: true as const } : {}) });

async function preparar(estado: EstadoV3, o: { narrador?: Partial<NarradorV3>; idioma?: Idioma; tanda?: { dia: string; cuenta: number } } = {}) {
  const n1 = narrador(o.narrador);
  const base = crearBaseFalsa({ narradores: [{ ...n1 }] });
  await crearFila(base.cliente, {
    narrador_id: 'n1', idioma: o.idioma ?? 'es-AR', ficha: FICHA, estado, ultimo_audio_at: null,
    tanda_dia: o.tanda?.dia ?? '2026-10-08', tanda_cuenta: o.tanda?.cuenta ?? 1, migrada_de: null,
  });
  const p = depsDePrueba(base, { ahora: AHORA });
  return { base, n1, ...p, fila: () => leerFila(base.cliente, 'n1') };
}

describe('un audio de un narrador V3', () => {
  it('se transcribe y se suma a la abierta, sin contestar nada', async () => {
    const { deps, n1, base, enviados, fila } = await preparar(enOR1());
    await procesarEntranteV3(deps, n1, audio('Nací en un pueblo chico.'));
    await procesarEntranteV3(deps, n1, audio('Mi mamá cosía.'));
    const f = await fila();
    expect(f?.estado.borrador).toBe('Nací en un pueblo chico. Mi mamá cosía.');
    expect(f?.ultimo_audio_at).toBe(AHORA.toISOString());
    expect(enviados).toEqual([]);
    expect(base.tablas.respuestas.map((r) => [r.pregunta_orden, r.clave_v3, r.transcripcion])).toEqual([[1, 'OR1', 'Nací en un pueblo chico.'], [2, 'OR1', 'Mi mamá cosía.']]);
    expect(base.tablas.narradores[0].alerta_silencio).toBe(false);
  });

  it('el reintento de Meta (mismo wa_message_id) no se suma dos veces', async () => {
    const { deps, n1, fila, base } = await preparar(enOR1());
    await procesarEntranteV3(deps, n1, audio('Nací en un pueblo chico.', 'wamid.igual'));
    await procesarEntranteV3(deps, n1, audio('Nací en un pueblo chico.', 'wamid.igual'));
    expect((await fila())?.estado.borrador).toBe('Nací en un pueblo chico.');
    expect(base.tablas.respuestas).toHaveLength(1);
  });

  it('si la transcripción falla dos veces, o sale vacía: M23', async () => {
    const { deps, n1, enviados } = await preparar(enOR1());
    await procesarEntranteV3(deps, n1, audio('FALLA'));
    await procesarEntranteV3(deps, n1, audio('VACIO'));
    expect(enviados.map((e) => e.texto)).toEqual([textoDelBanco('M23', FICHA), textoDelBanco('M23', FICHA)]);
  });
});

describe('un botón de un narrador V3', () => {
  const enCA6 = (): EstadoV3 => ({ ...estadoInicial(), esperando: 'CA6', preguntaAbierta: { partes: [{ id: 'CA6', texto: '¿Hermanos?' }] }, ultimoEntranteAt: AHORA.toISOString() });

  it('"Sí" manda M30 solo y queda esperando el audio', async () => {
    const { deps, n1, enviados, fila, base } = await preparar(enCA6());
    await procesarEntranteV3(deps, n1, texto('Sí, tuve', true));
    expect(enviados).toEqual([{ a: '+5491100000000', tipo: 'texto', texto: textoDelBanco('M30', FICHA) }]);
    expect((await fila())?.estado).toMatchObject({ esperando: 'CA6', tocoSi: true });
    expect(base.tablas.respuestas[0]).toMatchObject({ texto_directo: '⟦botón:Sí, tuve⟧', clave_v3: 'CA6' });
  });

  it('"No" cierra y manda la siguiente en el momento; cuenta para la tanda', async () => {
    const { deps, n1, enviados, fila } = await preparar(enCA6(), { tanda: { dia: '2026-10-08', cuenta: 1 } });
    await procesarEntranteV3(deps, n1, texto('No tuve hermanos', true));
    const f = await fila();
    expect(f?.estado.respuestas).toEqual([['CA6', '⟦botón:No tuve hermanos⟧']]);
    expect(f?.estado.esperando).not.toBe('CA6');
    expect(f?.tanda_cuenta).toBe(2);
    expect(enviados.length).toBeGreaterThan(0);
  });

  it('"No" con la tanda en el tope: cierra y no manda nada hasta mañana', async () => {
    const { deps, n1, enviados, fila } = await preparar(enCA6(), { tanda: { dia: '2026-10-08', cuenta: 4 } });
    await procesarEntranteV3(deps, n1, texto('No tuve hermanos', true));
    expect(enviados).toEqual([]);
    const f = await fila();
    expect(f?.estado.esperando).toBeUndefined();
    expect(f?.estado.acuse?.familia).toBe('M25');
  });
});

describe('un texto escrito', () => {
  it('cuenta como respuesta: se suma a la abierta, corre el reloj y M22 sale una sola vez', async () => {
    const { deps, n1, enviados, fila, base } = await preparar(enOR1());
    await procesarEntranteV3(deps, n1, texto('Nací en un pueblo chico.'));
    await procesarEntranteV3(deps, n1, audio('Mi mamá cosía.'));
    await procesarEntranteV3(deps, n1, texto('Y había un río.'));
    expect(enviados.map((e) => e.texto)).toEqual([textoDelBanco('M22', FICHA)]);
    const f = await fila();
    expect(f?.estado.borrador).toBe('Nací en un pueblo chico. Mi mamá cosía. Y había un río.');
    expect(f?.estado.m22Enviado).toBe(true);
    expect(f?.ultimo_audio_at).toBe(AHORA.toISOString());
    expect(base.tablas.respuestas.map((r) => [r.texto_directo, r.clave_v3])).toEqual([['Nací en un pueblo chico.', 'OR1'], [null, 'OR1'], ['Y había un río.', 'OR1']]);
  });

  it('si M22 ya salió en otra pregunta, no vuelve a salir en toda la entrevista', async () => {
    const { deps, n1, enviados, fila } = await preparar({ ...enOR1(), m22Enviado: true });
    await procesarEntranteV3(deps, n1, texto('Nací en un pueblo chico.'));
    expect(enviados).toEqual([]);
    expect((await fila())?.estado.borrador).toBe('Nací en un pueblo chico.');
  });

  it('un botón que no es de la abierta es un texto escrito (cuenta como respuesta)', async () => {
    const { deps, n1, enviados, fila } = await preparar(enOR1());
    await procesarEntranteV3(deps, n1, texto('Sí, tuve', true));
    expect(enviados.map((e) => e.texto)).toEqual([textoDelBanco('M22', FICHA)]);
    expect((await fila())?.estado.borrador).toBe('Sí, tuve');
  });

  it('pausado: el texto lo reactiva y se le reenvía la pregunta abierta (sin M22)', async () => {
    const { deps, n1, enviados, base } = await preparar(enOR1(), { narrador: { estado: 'pausado' } });
    await procesarEntranteV3(deps, n1, texto('Hola, volví'));
    expect(base.tablas.narradores[0].estado).toBe('activo');
    expect(enviados).toHaveLength(1);
    expect(enviados[0].texto?.startsWith(avanzar(estadoInicial(), FICHA).estado.salientes[0].texto)).toBe(true);
  });

  it('completado: no se procesa nada', async () => {
    const { deps, n1, enviados, base } = await preparar(enOR1(), { narrador: { estado: 'completado' } });
    await procesarEntranteV3(deps, { ...n1, estado: 'completado' }, audio('Algo más.'));
    expect(enviados).toEqual([]);
    expect(base.tablas.respuestas ?? []).toHaveLength(0);
  });
});

describe('una imagen', () => {
  it('con FO1 abierta: la foto la contesta y corre el reloj de silencio', async () => {
    const { deps, n1, fila, base, enviados } = await preparar({ ...estadoInicial(), esperando: 'FO1', ultimoEntranteAt: AHORA.toISOString() });
    await procesarEntranteV3(deps, n1, { telefono: '+5491100000000', tipo: 'imagen', mediaId: 'img-1', mimeType: 'image/jpeg', waMessageId: 'wamid.foto' });
    const f = await fila();
    expect(f?.estado.borrador).toBe(MARCA_FOTO);
    expect(f?.ultimo_audio_at).toBe(AHORA.toISOString());
    expect(base.tablas.fotos).toHaveLength(1);
    expect(base.tablas.respuestas[0]).toMatchObject({ texto_directo: MARCA_FOTO, clave_v3: 'FO1', wa_message_id: 'wamid.foto' });
    expect(enviados).toEqual([]);
  });

  it('foto suelta en es-AR: se guarda y se acusa con el texto aprobado', async () => {
    const { deps, n1, base, enviados } = await preparar(enOR1());
    await procesarEntranteV3(deps, n1, { telefono: '+5491100000000', tipo: 'imagen', mediaId: 'img-2', waMessageId: 'wamid.suelta' });
    expect(base.tablas.fotos).toHaveLength(1);
    expect(enviados.map((e) => e.texto)).toEqual(['📷 Guardada. Si querés, contame qué pasaba ahí.']);
  });

  it('foto suelta en catalán: se guarda y no se manda nada (falta el texto aprobado)', async () => {
    const { deps, n1, base, enviados } = await preparar({ ...enOR1() }, { idioma: 'ca' });
    await procesarEntranteV3(deps, n1, { telefono: '+5491100000000', tipo: 'imagen', mediaId: 'img-3', waMessageId: 'wamid.ca' });
    expect(base.tablas.fotos).toHaveLength(1);
    expect(enviados).toEqual([]);
  });
});

describe('la ventana de 24 h la abre cualquier mensaje del narrador', () => {
  const HACE_DOS_DIAS = new Date(AHORA.getTime() - 48 * 3600_000).toISOString();
  const cerrada = (e: EstadoV3): EstadoV3 => ({ ...e, ultimoEntranteAt: HACE_DOS_DIAS });
  const enCA6 = (): EstadoV3 => ({ ...estadoInicial(), esperando: 'CA6', preguntaAbierta: { partes: [{ id: 'CA6', texto: '¿Hermanos?' }] } });

  it('un audio anota ultimoEntranteAt', async () => {
    const { deps, n1, fila } = await preparar(cerrada(enOR1()));
    await procesarEntranteV3(deps, n1, audio('Nací en un pueblo chico.'));
    expect((await fila())?.estado.ultimoEntranteAt).toBe(AHORA.toISOString());
  });

  it('un audio que no se pudo transcribir también (y M23 sale como texto, no como plantilla)', async () => {
    const { deps, n1, fila, enviados } = await preparar(cerrada(enOR1()));
    await procesarEntranteV3(deps, n1, audio('FALLA'));
    expect((await fila())?.estado.ultimoEntranteAt).toBe(AHORA.toISOString());
    expect(enviados.map((e) => e.tipo)).toEqual(['texto']);
  });

  it('un texto escrito: M22 sale como texto libre, no como plantilla', async () => {
    const { deps, n1, fila, enviados } = await preparar(cerrada(enOR1()));
    await procesarEntranteV3(deps, n1, texto('Nací en un pueblo chico.'));
    expect((await fila())?.estado.ultimoEntranteAt).toBe(AHORA.toISOString());
    expect(enviados).toEqual([{ a: '+5491100000000', tipo: 'texto', texto: textoDelBanco('M22', FICHA) }]);
  });

  it('un botón: M30 sale como texto libre', async () => {
    const { deps, n1, fila, enviados } = await preparar(cerrada(enCA6()));
    await procesarEntranteV3(deps, n1, texto('Sí, tuve', true));
    expect((await fila())?.estado.ultimoEntranteAt).toBe(AHORA.toISOString());
    expect(enviados.map((e) => e.tipo)).toEqual(['texto']);
  });

  it('una imagen (FO1 y suelta)', async () => {
    const fo1 = await preparar({ ...estadoInicial(), esperando: 'FO1' });
    await procesarEntranteV3(fo1.deps, fo1.n1, { telefono: '+5491100000000', tipo: 'imagen', mediaId: 'img-4', waMessageId: 'wamid.fo1-ventana' });
    expect((await fo1.fila())?.estado.ultimoEntranteAt).toBe(AHORA.toISOString());
    const suelta = await preparar(cerrada(enOR1()));
    await procesarEntranteV3(suelta.deps, suelta.n1, { telefono: '+5491100000000', tipo: 'imagen', mediaId: 'img-5', waMessageId: 'wamid.suelta-ventana' });
    expect((await suelta.fila())?.estado.ultimoEntranteAt).toBe(AHORA.toISOString());
    expect(suelta.enviados.map((e) => e.tipo)).toEqual(['texto']);
  });

  it('pausado + texto: la pregunta abierta se reenvía como texto libre', async () => {
    const { deps, n1, fila, enviados } = await preparar(cerrada(enOR1()), { narrador: { estado: 'pausado' } });
    await procesarEntranteV3(deps, n1, texto('Hola, volví'));
    expect((await fila())?.estado.ultimoEntranteAt).toBe(AHORA.toISOString());
    expect(enviados.map((e) => e.tipo)).toEqual(['texto']);
  });
});

describe('el idioma de la transcripción', () => {
  it('un narrador en catalán transcribe en catalán', async () => {
    const { deps, n1 } = await preparar(enOR1(), { idioma: 'ca' });
    const pedidos: { nombre: string; idioma: Idioma; narradorId: string }[] = [];
    const original = deps.transcribir;
    deps.transcribir = async (a, o) => { pedidos.push(o); return original(a, o); };
    await procesarEntranteV3(deps, n1, audio('Vaig néixer a un poble petit.'));
    expect(pedidos).toEqual([{ nombre: 'Prueba', idioma: 'ca', narradorId: 'n1' }]);
  });
});

describe('pausado con audio', () => {
  it('lo reactiva y el audio se suma como siempre', async () => {
    const { deps, n1, base, fila, enviados } = await preparar(enOR1(), { narrador: { estado: 'pausado' } });
    await procesarEntranteV3(deps, n1, audio('Nací en un pueblo chico.'));
    expect(base.tablas.narradores[0].estado).toBe('activo');
    expect((await fila())?.estado.borrador).toBe('Nací en un pueblo chico.');
    expect(enviados).toEqual([]);
  });
});
