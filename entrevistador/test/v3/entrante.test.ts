import { describe, it, expect } from 'vitest';
import { crearBaseFalsa } from './base-falsa.js';
import { depsDePrueba } from './deps-prueba.js';
import { crearFila, leerFila } from '../../src/v3/estado.js';
import { procesarEntranteV3 } from '../../src/v3/entrante.js';
import { avanzar, encolar, textoDelBanco } from '../../src/v3/turno.js';
import { estadoInicial, MARCA_FOTO, SIN_CLAVE_V3, type EstadoV3, type NarradorV3 } from '../../src/v3/tipos.js';
import type { BaseFalsa } from './base-falsa.js';
import type { MensajeEntrante } from '../../src/whatsapp/webhook.js';
import type { Idioma } from '../../src/v3/nucleo/entrevista/idioma.js';
import { preguntaPorId } from '../../src/v3/nucleo/entrevista/banco.js';
import { renderizar } from '../../src/v3/nucleo/entrevista/texto.js';

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

  it('si la transcripción falla dos veces, o sale vacía: M23, y la fila queda marcada para que el reloj no la reintente', async () => {
    const { deps, n1, enviados, base } = await preparar(enOR1());
    await procesarEntranteV3(deps, n1, audio('FALLA'));
    await procesarEntranteV3(deps, n1, audio('VACIO'));
    expect(enviados.map((e) => e.texto)).toEqual([textoDelBanco('M23', FICHA), textoDelBanco('M23', FICHA)]);
    expect(base.tablas.respuestas.map((r) => r.clave_v3)).toEqual([SIN_CLAVE_V3, SIN_CLAVE_V3]);
  });

  it('si no se puede bajar el audio de Meta: M23 (no se pierde en silencio), y el mismo mensaje otra vez no repite M23', async () => {
    const { deps, n1, enviados, base } = await preparar(enOR1());
    deps.wa.descargar = async () => { throw new Error('Meta no devolvió el audio: prueba'); };
    await procesarEntranteV3(deps, n1, audio('Nací en un pueblo chico.', 'wamid.sin-bajar'));
    await procesarEntranteV3(deps, n1, audio('Nací en un pueblo chico.', 'wamid.sin-bajar'));
    expect(enviados.map((e) => e.texto)).toEqual([textoDelBanco('M23', FICHA)]);
    expect(base.tablas.respuestas ?? []).toHaveLength(0);
  });

  it('si Storage o la base rechazan el audio: M23', async () => {
    const { deps, n1, enviados, base } = await preparar(enOR1());
    base.fallarProxima.set('respuestas', { code: 'XX000', message: 'la base no anda: prueba' });
    await procesarEntranteV3(deps, n1, audio('Nací en un pueblo chico.'));
    expect(enviados.map((e) => e.texto)).toEqual([textoDelBanco('M23', FICHA)]);
  });

  it('la clave se pone recién después de guardar el estado: si eso falla, la fila queda sin clave (para el reloj)', async () => {
    const { deps, n1, base, fila } = await preparar(enOR1());
    fallarEscrituraDelEstado(base, 2); // la 1ª es anotarEntrante; la 2ª, sumar el audio
    await expect(procesarEntranteV3(deps, n1, audio('Nací en un pueblo chico.'))).rejects.toThrow(/se cayó/);
    expect(base.tablas.respuestas[0]).toMatchObject({ transcripcion: 'Nací en un pueblo chico.', clave_v3: null });
    expect((await fila())?.estado.borrador).toBeUndefined();
  });

  it('un texto escrito también: la clave va después del estado', async () => {
    const { deps, n1, base } = await preparar(enOR1());
    fallarEscrituraDelEstado(base, 2);
    await expect(procesarEntranteV3(deps, n1, texto('Nací en un pueblo chico.'))).rejects.toThrow(/se cayó/);
    expect(base.tablas.respuestas[0]).toMatchObject({ texto_directo: 'Nací en un pueblo chico.', clave_v3: null });
  });

  it('el reloj de silencio arranca cuando LLEGA el audio, antes de transcribirlo (y otra vez al guardar la transcripción)', async () => {
    const hace4 = new Date(AHORA.getTime() - 4 * 60_000).toISOString();
    const { deps, n1, base, fila, pasar } = await preparar({ ...enOR1(), borrador: 'Nací en un pueblo chico.' });
    base.tablas.entrevistas_v3[0].ultimo_audio_at = hace4;
    let mientras: string | null | undefined;
    const original = deps.transcribir;
    deps.transcribir = async (a, o) => { mientras = (await fila())?.ultimo_audio_at; pasar(30_000); return original(a, o); };
    await procesarEntranteV3(deps, n1, audio('Mi mamá cosía.'));
    expect(mientras).toBe(AHORA.toISOString());
    expect((await fila())?.ultimo_audio_at).toBe(new Date(AHORA.getTime() + 30_000).toISOString());
  });
});

/** La escritura número `cual` del estado (entrevistas_v3) falla, como si se cayera el proceso o la base. */
function fallarEscrituraDelEstado(base: BaseFalsa, cual: number) {
  const cliente = base.cliente as unknown as { from: (t: string) => { update: (v: unknown) => unknown } };
  const from = cliente.from.bind(cliente);
  let k = 0;
  cliente.from = (t: string) => {
    const q = from(t);
    if (t !== 'entrevistas_v3') return q;
    const update = q.update.bind(q);
    q.update = (v: unknown) => {
      if (++k === cual) base.fallarProxima.set('entrevistas_v3', { code: 'XX000', message: 'se cayó: prueba' });
      return update(v);
    };
    return q;
  };
}

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

  it('un botón que no es de la abierta se guarda, pero no toca la respuesta ni manda M22', async () => {
    const { deps, n1, enviados, fila, base } = await preparar(enOR1());
    await procesarEntranteV3(deps, n1, texto('Sí, tuve', true));
    expect(enviados).toEqual([]);
    const f = await fila();
    expect(f?.estado.borrador).toBeUndefined();
    expect(f?.estado.m22Enviado).toBeUndefined();
    expect(base.tablas.respuestas[0]).toMatchObject({ texto_directo: '⟦botón:Sí, tuve⟧', clave_v3: SIN_CLAVE_V3 });
  });

  it('"No" después de "Sí" (botón viejo) no cierra ni se suma', async () => {
    const enCA6: EstadoV3 = { ...estadoInicial(), esperando: 'CA6', preguntaAbierta: { partes: [{ id: 'CA6', texto: '¿Hermanos?' }] }, ultimoEntranteAt: AHORA.toISOString() };
    const { deps, n1, enviados, fila, base } = await preparar(enCA6);
    await procesarEntranteV3(deps, n1, texto('Sí, tuve', true));
    await procesarEntranteV3(deps, n1, texto('No tuve hermanos', true));
    expect(enviados.map((e) => e.texto)).toEqual([textoDelBanco('M30', FICHA)]);
    const f = await fila();
    expect(f?.estado).toMatchObject({ esperando: 'CA6', tocoSi: true, respuestas: [['CA6', '⟦botón:Sí, tuve⟧']] });
    expect(f?.estado.borrador).toBeUndefined();
    expect(base.tablas.respuestas.map((r) => r.clave_v3)).toEqual(['CA6', SIN_CLAVE_V3]);
  });

  it('el "SI" tardío de la plantilla de bienvenida no entra a la respuesta', async () => {
    const { deps, n1, enviados, fila } = await preparar(enOR1());
    await procesarEntranteV3(deps, n1, texto('SI', true));
    expect(enviados).toEqual([]);
    expect((await fila())?.estado.borrador).toBeUndefined();
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
    expect(enviados.map((e) => e.texto)).toEqual(['📷 Guardada.']);
  });

  it('foto suelta en catalán: se guarda y se acusa en catalán (aprobado 07/10)', async () => {
    const { deps, n1, base, enviados } = await preparar({ ...enOR1() }, { idioma: 'ca' });
    await procesarEntranteV3(deps, n1, { telefono: '+5491100000000', tipo: 'imagen', mediaId: 'img-3', waMessageId: 'wamid.ca' });
    expect(base.tablas.fotos).toHaveLength(1);
    expect(enviados.map((e) => e.texto)).toEqual(['📷 Desada.']);
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

describe('dedupe de lo que no deja fila en respuestas (wamidsVistos)', () => {
  it('pausado: el mismo texto dos veces reenvía la abierta una sola vez', async () => {
    const { deps, n1, enviados } = await preparar(enOR1(), { narrador: { estado: 'pausado' } });
    const m = texto('Hola, volví');
    await procesarEntranteV3(deps, n1, m);
    await procesarEntranteV3(deps, n1, m); // Meta lo reintenta antes de que se relea el narrador
    expect(enviados).toHaveLength(1);
  });

  it('una foto suelta repetida se guarda y se acusa una sola vez', async () => {
    const { deps, n1, base, enviados } = await preparar(enOR1());
    const m: MensajeEntrante = { telefono: '+5491100000000', tipo: 'imagen', mediaId: 'img-r', waMessageId: 'wamid.suelta-repetida' };
    await procesarEntranteV3(deps, n1, m);
    await procesarEntranteV3(deps, n1, m);
    expect(base.tablas.fotos).toHaveLength(1);
    expect(enviados).toHaveLength(1);
  });

  it('FO1: el duplicado se detecta antes de subir la foto', async () => {
    const { deps, n1, base } = await preparar({ ...estadoInicial(), esperando: 'FO1', ultimoEntranteAt: AHORA.toISOString() });
    const m: MensajeEntrante = { telefono: '+5491100000000', tipo: 'imagen', mediaId: 'img-fo1', mimeType: 'image/jpeg', waMessageId: 'wamid.fo1-repetida' };
    await procesarEntranteV3(deps, n1, m);
    await procesarEntranteV3(deps, n1, m);
    expect(base.tablas.fotos).toHaveLength(1);
    expect([...base.archivos.keys()].filter((k) => k.includes('/fotos/'))).toHaveLength(1);
  });

  it('se recuerdan los últimos 50', async () => {
    const { deps, n1, fila } = await preparar({ ...enOR1(), m22Enviado: true });
    for (let i = 0; i < 55; i++) await procesarEntranteV3(deps, n1, texto(`Parte ${i}.`));
    expect((await fila())?.estado.wamidsVistos).toHaveLength(50);
  });
});

describe('M8 en la cola (no salió: ventana cerrada y sin plantilla)', () => {
  const HACE_TRES_DIAS = new Date(AHORA.getTime() - 72 * 3600_000).toISOString();
  it('se descarta cuando el narrador escribe: no le llega el recordatorio después de contestar', async () => {
    const conM8 = encolar({ ...enOR1(), ultimoEntranteAt: HACE_TRES_DIAS, m8En: 'OR1' }, { texto: textoDelBanco('M8', FICHA), tipo: 'recordatorio' });
    const { deps, n1, enviados, fila } = await preparar(conM8);
    await procesarEntranteV3(deps, n1, audio('Nací en un pueblo chico.'));
    expect(enviados.map((e) => e.texto)).not.toContain(textoDelBanco('M8', FICHA));
    expect((await fila())?.estado.salientes).toEqual([]);
  });
});

describe('la abierta salió por plantilla (sin botones)', () => {
  const BOTONES = ['Sí, tuve', 'No tuve hermanos'];
  const porPlantilla = (): EstadoV3 => ({
    ...estadoInicial(), esperando: 'CA6', abiertaPorPlantilla: true,
    preguntaAbierta: { partes: [{ id: 'CA6', texto: '¿Tuviste hermanos?' }], botones: BOTONES },
    ultimoEntranteAt: new Date(AHORA.getTime() - 48 * 3600_000).toISOString(),
  });

  it('al volver a escribir, se le reenvía la pregunta con sus botones (una vez)', async () => {
    const { deps, n1, enviados, fila } = await preparar(porPlantilla());
    await procesarEntranteV3(deps, n1, audio('Éramos cuatro.'));
    await procesarEntranteV3(deps, n1, audio('Yo era la más chica.'));
    expect(enviados).toEqual([{ a: '+5491100000000', tipo: 'botones', texto: '¿Tuviste hermanos?', botones: BOTONES }]);
    expect((await fila())?.estado.abiertaPorPlantilla).toBeUndefined();
  });

  it('si lo que manda es un botón que coincide, no se reenvía', async () => {
    const { deps, n1, enviados, fila } = await preparar(porPlantilla());
    await procesarEntranteV3(deps, n1, texto('Sí, tuve', true));
    await procesarEntranteV3(deps, n1, audio('Éramos cuatro.'));
    expect(enviados.map((e) => e.texto)).toEqual([textoDelBanco('M30', FICHA)]);
    expect((await fila())?.estado.abiertaPorPlantilla).toBeUndefined();
  });

  it('sin botones no hace falta reenviarla', async () => {
    const sinBotones: EstadoV3 = { ...porPlantilla(), esperando: 'OR1', preguntaAbierta: { partes: [{ id: 'OR1', texto: '¿Dónde naciste?' }] } };
    const { deps, n1, enviados, fila } = await preparar(sinBotones);
    await procesarEntranteV3(deps, n1, audio('En un pueblo.'));
    expect(enviados).toEqual([]);
    expect((await fila())?.estado.abiertaPorPlantilla).toBeUndefined();
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

describe('«quiero parar» (Naza, 07/10: frases fijas, sin modelo)', () => {
  const PAUSA = 'Listo, Prueba, frenamos acá. Lo que contaste queda guardado. Cuando quieras seguir, mandame un mensaje y retomamos donde quedamos.';

  it('un texto corto: no se suma, queda pausado, sale el texto de pausa y lo abierto queda abierto', async () => {
    const { deps, n1, base, fila, enviados } = await preparar({ ...enOR1(), borrador: 'Nací en un pueblo chico.' });
    await procesarEntranteV3(deps, n1, texto('Quiero parar.'));
    const f = await fila();
    expect(f?.estado).toMatchObject({ esperando: 'OR1', borrador: 'Nací en un pueblo chico.' });
    expect(f?.estado.m22Enviado).toBeUndefined();
    expect(base.tablas.narradores[0].estado).toBe('pausado');
    expect(enviados.map((e) => e.texto)).toEqual([PAUSA]);
    expect(base.tablas.respuestas.map((r) => [r.texto_directo, r.clave_v3])).toEqual([['Quiero parar.', SIN_CLAVE_V3]]);
  });

  it('un audio corto también (después de transcribirlo)', async () => {
    const { deps, n1, base, fila, enviados } = await preparar(enOR1());
    await procesarEntranteV3(deps, n1, audio('Bueno, paremos por hoy.'));
    expect((await fila())?.estado.borrador).toBeUndefined();
    expect(base.tablas.narradores[0].estado).toBe('pausado');
    expect(enviados.map((e) => e.texto)).toEqual([PAUSA]);
    expect(base.tablas.respuestas[0].clave_v3).toBe(SIN_CLAVE_V3);
  });

  it('una historia larga que dice "parar" se suma como siempre', async () => {
    const { deps, n1, base, fila } = await preparar(enOR1());
    const historia = 'Quería parar el auto en la ruta pero mi papá no quería, decía que íbamos a llegar tarde a lo de la abuela.';
    await procesarEntranteV3(deps, n1, audio(historia));
    expect((await fila())?.estado.borrador).toBe(historia);
    expect(base.tablas.narradores[0].estado).toBe('activo');
  });

  it('en catalán sale el texto en catalán', async () => {
    const { deps, n1, base, enviados } = await preparar(enOR1(), { idioma: 'ca' });
    await procesarEntranteV3(deps, n1, texto('Prou per avui.'));
    expect(base.tablas.narradores[0].estado).toBe('pausado');
    expect(enviados.map((e) => e.texto)).toEqual(["D'acord, Prueba, parem aquí. El que has explicat queda guardat. Quan vulguis continuar, envia'm un missatge i seguim on ho vam deixar."]);
  });

  it('un pausado que vuelve a pedir parar sigue pausado (no se reactiva ni se le reenvía la pregunta)', async () => {
    const { deps, n1, base, enviados } = await preparar(enOR1(), { narrador: { estado: 'pausado' } });
    await procesarEntranteV3(deps, n1, texto('No quiero seguir.'));
    expect(base.tablas.narradores[0].estado).toBe('pausado');
    expect(enviados.map((e) => e.texto)).toEqual([PAUSA]);
  });

  it('el reintento de Meta no repite el texto de pausa', async () => {
    const { deps, n1, enviados } = await preparar(enOR1());
    const m = texto('Paremos.');
    await procesarEntranteV3(deps, n1, m);
    await procesarEntranteV3(deps, n1, m);
    expect(enviados).toHaveLength(1);
  });
});

describe('«esto que no vaya al libro» (Naza, 07/10)', () => {
  const RESERVA = 'Entendido. Eso no va a ir al libro.';

  it('con un borrador abierto: no se suma, se reserva la abierta (estado y filas) y la entrevista sigue igual', async () => {
    const { deps, n1, base, fila, enviados } = await preparar(enOR1());
    await procesarEntranteV3(deps, n1, audio('Mi tío tenía un almacén.'));
    await procesarEntranteV3(deps, n1, texto('Pero esto que no vaya al libro.'));
    const f = await fila();
    expect(f?.estado).toMatchObject({ esperando: 'OR1', borrador: 'Mi tío tenía un almacén.', reservadas: ['OR1'] });
    expect(base.tablas.narradores[0].estado).toBe('activo');
    expect(enviados.map((e) => e.texto)).toEqual([RESERVA]);
    expect(base.tablas.respuestas.map((r) => [r.clave_v3, r.reservada ?? false])).toEqual([['OR1', true], [SIN_CLAVE_V3, false]]);
  });

  it('sin borrador abierto: se reserva la última respuesta cerrada', async () => {
    const e: EstadoV3 = { ...enOR1(), esperando: 'OR2', respuestas: [['OR1', 'Nací en un pueblo chico.']] };
    const { deps, n1, base, fila } = await preparar(e);
    base.tablas.respuestas = [{ id: 'r-or1', narrador_id: 'n1', clave_v3: 'OR1', wa_message_id: 'wamid.viejo', transcripcion: 'Nací en un pueblo chico.' }];
    await procesarEntranteV3(deps, n1, texto('No lo pongas en el libro.'));
    expect((await fila())?.estado.reservadas).toEqual(['OR1']);
    expect(base.tablas.respuestas.find((r) => r.id === 'r-or1')?.reservada).toBe(true);
  });

  it('por audio, en una historia larga', async () => {
    const { deps, n1, fila, enviados } = await preparar({ ...enOR1(), borrador: 'Mi tío tenía un almacén.' });
    await procesarEntranteV3(deps, n1, audio('Y bueno, lo de mi tío se terminó muy mal, con la policía y todo, pero eso no va en el libro.'));
    const f = await fila();
    expect(f?.estado.borrador).toBe('Mi tío tenía un almacén.');
    expect(f?.estado.reservadas).toEqual(['OR1']);
    expect(enviados.map((e) => e.texto)).toEqual([RESERVA]);
  });

  it('sin la columna `reservada` (42703): avisa a los socios, no falla y el estado la guarda igual', async () => {
    const { deps, n1, fila, avisos, base } = await preparar({ ...enOR1(), borrador: 'Algo.' });
    fallarUpdateDeReservada(base);
    await procesarEntranteV3(deps, n1, texto('Que no salga en el libro.'));
    expect((await fila())?.estado.reservadas).toEqual(['OR1']);
    expect(avisos).toHaveLength(1);
    expect(avisos[0].detalle).not.toContain('Algo.');
  });

  it('si dice las dos cosas: gana la reserva y además pausa', async () => {
    const { deps, n1, base, fila, enviados } = await preparar({ ...enOR1(), borrador: 'Algo.' });
    await procesarEntranteV3(deps, n1, texto('Eso no lo pongas. Paremos.'));
    expect((await fila())?.estado.reservadas).toEqual(['OR1']);
    expect(base.tablas.narradores[0].estado).toBe('pausado');
    expect(enviados.map((e) => e.texto)).toEqual([RESERVA, 'Listo, Prueba, frenamos acá. Lo que contaste queda guardado. Cuando quieras seguir, mandame un mensaje y retomamos donde quedamos.']);
  });

  it('en es-ES sale el texto de es-ES', async () => {
    const { deps, n1, enviados } = await preparar({ ...enOR1(), borrador: 'Algo.' }, { idioma: 'es-ES' });
    await procesarEntranteV3(deps, n1, texto('Quítalo del libro.'));
    expect(enviados.map((e) => e.texto)).toEqual(['Entendido. Eso no irá en el libro.']);
  });
});

describe('lo que llega sin pregunta abierta (Naza, 07/10): se guarda aparte', () => {
  /** OR1 contestada y cerrada con la tanda en el tope: no hay nada abierto hasta mañana. */
  const trasElTope = (): EstadoV3 => ({
    ...enOR1(), esperando: undefined, preguntaAbierta: undefined, respuestas: [['OR1', 'Nací en un pueblo chico.']], acuse: { familia: 'M3', n: 0 },
  });

  it('un "Gracias" escrito: fila con ∅, no toca la respuesta anterior y no sale nada (ni M22)', async () => {
    const { deps, n1, base, fila, enviados } = await preparar(trasElTope(), { tanda: { dia: '2026-10-08', cuenta: 4 } });
    await procesarEntranteV3(deps, n1, texto('Gracias'));
    const f = await fila();
    expect(f?.estado.respuestas).toEqual([['OR1', 'Nací en un pueblo chico.']]);
    expect(f?.estado.m22Enviado).toBeUndefined();
    expect(enviados).toEqual([]);
    expect(base.tablas.respuestas.map((r) => [r.texto_directo, r.clave_v3])).toEqual([['Gracias', SIN_CLAVE_V3]]);
  });

  it('un audio: fila con ∅ (con su transcripción), sin tocar la respuesta anterior', async () => {
    const { deps, n1, base, fila, enviados } = await preparar(trasElTope(), { tanda: { dia: '2026-10-08', cuenta: 4 } });
    await procesarEntranteV3(deps, n1, audio('Y me olvidaba del río.'));
    expect((await fila())?.estado.respuestas).toEqual([['OR1', 'Nací en un pueblo chico.']]);
    expect(enviados).toEqual([]);
    expect(base.tablas.respuestas.map((r) => [r.transcripcion, r.clave_v3])).toEqual([['Y me olvidaba del río.', SIN_CLAVE_V3]]);
  });

  it('después de "Sí" sí hay pregunta abierta: el audio se suma', async () => {
    const enCA6: EstadoV3 = { ...estadoInicial(), esperando: 'CA6', preguntaAbierta: { partes: [{ id: 'CA6', texto: '¿Hermanos?' }] }, ultimoEntranteAt: AHORA.toISOString() };
    const { deps, n1, base, fila } = await preparar(enCA6);
    await procesarEntranteV3(deps, n1, texto('Sí, tuve', true));
    await procesarEntranteV3(deps, n1, audio('Éramos cuatro.'));
    expect((await fila())?.estado.borrador).toBe('Éramos cuatro.');
    expect(base.tablas.respuestas.map((r) => r.clave_v3)).toEqual(['CA6', 'CA6']);
  });
});

describe('pausado que vuelve sin pregunta abierta (Naza, 07/10): le sale la siguiente en el momento', () => {
  const sinAbierta = (): EstadoV3 => ({
    ...enOR1(), esperando: undefined, preguntaAbierta: undefined, respuestas: [['OR1', 'Nací en un pueblo chico.']], acuse: { familia: 'M3', n: 0 },
  });
  const OR2 = () => renderizar(preguntaPorId('OR2')!.texto, FICHA);

  it('un texto: se reactiva, el texto queda aparte (∅) y sale OR2, aunque la tanda de hoy esté en el tope', async () => {
    const { deps, n1, base, fila, enviados } = await preparar(sinAbierta(), { narrador: { estado: 'pausado' }, tanda: { dia: '2026-10-08', cuenta: 4 } });
    await procesarEntranteV3(deps, n1, texto('Hola, volví'));
    expect(base.tablas.narradores[0].estado).toBe('activo');
    const f = await fila();
    expect(f?.estado.esperando).toBe('OR2');
    expect(f?.estado.respuestas).toEqual([['OR1', 'Nací en un pueblo chico.']]);
    expect(f).toMatchObject({ tanda_dia: '2026-10-08', tanda_cuenta: 5 });
    expect(f?.estado.abiertaDesde).toBe(AHORA.toISOString());
    expect(enviados).toHaveLength(1);
    expect(enviados[0].texto).toContain(OR2());
    expect(enviados[0].texto?.startsWith(`${textoDelBanco('M3.1', FICHA)}\n`)).toBe(true);
    expect(base.tablas.respuestas.map((r) => [r.texto_directo, r.clave_v3])).toEqual([['Hola, volví', SIN_CLAVE_V3]]);
  });

  it('un audio: queda aparte (∅) y sale la siguiente; la tanda de ayer se renueva y cuenta esta', async () => {
    const { deps, n1, base, fila, enviados } = await preparar(sinAbierta(), { narrador: { estado: 'pausado' }, tanda: { dia: '2026-10-07', cuenta: 4 } });
    await procesarEntranteV3(deps, n1, audio('Ya estoy de vuelta.'));
    expect(base.tablas.narradores[0].estado).toBe('activo');
    const f = await fila();
    expect(f?.estado.esperando).toBe('OR2');
    expect(f?.estado.borrador).toBeUndefined();
    expect(f).toMatchObject({ tanda_dia: '2026-10-08', tanda_cuenta: 1 });
    expect(enviados.map((e) => e.texto).some((t) => t?.includes(OR2()))).toBe(true);
    expect(base.tablas.respuestas[0].clave_v3).toBe(SIN_CLAVE_V3);
  });

  it('el reintento de Meta no abre dos preguntas', async () => {
    const { deps, n1, enviados, fila } = await preparar(sinAbierta(), { narrador: { estado: 'pausado' } });
    const m = texto('Hola, volví');
    await procesarEntranteV3(deps, n1, m);
    await procesarEntranteV3(deps, { ...n1, estado: 'pausado' }, m); // Meta lo reintenta antes de que se relea el narrador
    expect(enviados).toHaveLength(1);
    expect((await fila())?.estado.esperando).toBe('OR2');
  });

  it('si pide parar, no se reactiva ni sale nada más que el texto de pausa', async () => {
    const { deps, n1, base, fila, enviados } = await preparar(sinAbierta(), { narrador: { estado: 'pausado' } });
    await procesarEntranteV3(deps, n1, texto('Por ahora no.'));
    expect(base.tablas.narradores[0].estado).toBe('pausado');
    expect((await fila())?.estado.esperando).toBeUndefined();
    expect(enviados).toHaveLength(1);
  });

  it('con la entrevista terminada no se abre nada', async () => {
    const { deps, n1, fila, enviados } = await preparar({ ...sinAbierta(), terminada: true }, { narrador: { estado: 'pausado' } });
    await procesarEntranteV3(deps, n1, texto('Hola, volví'));
    expect((await fila())?.estado.esperando).toBeUndefined();
    expect(enviados).toEqual([]);
  });
});

/** El update de `respuestas.reservada` falla como si la columna no existiera (sin la migración de reservas). */
function fallarUpdateDeReservada(base: BaseFalsa) {
  const cliente = base.cliente as unknown as { from: (t: string) => { update: (v: Record<string, unknown>) => unknown } };
  const from = cliente.from.bind(cliente);
  cliente.from = (t: string) => {
    const q = from(t);
    if (t !== 'respuestas') return q;
    const update = q.update.bind(q);
    q.update = (v: Record<string, unknown>) => {
      if ('reservada' in v) base.fallarProxima.set('respuestas', { code: '42703', message: 'column "reservada" does not exist' });
      return update(v);
    };
    return q;
  };
}
