// El bot de historia con la base en memoria y un WhatsApp falso: del SÍ a FIN-H (entrante.ts, reloj.ts, enviar.ts).

import { afterEach, describe, expect, it } from 'vitest';
import { crearBaseFalsa } from './base-falsa.js';
import { depsDePrueba } from './deps-prueba.js';
import { crearFila, leerFila } from '../../src/historia/estado.js';
import { procesarEntranteHistoria } from '../../src/historia/entrante.js';
import { tickHistoria } from '../../src/historia/reloj.js';
import { estadoInicial, SIN_CLAVE_HISTORIA, type FichaFila, type NarradorHistoria } from '../../src/historia/tipos.js';
import { bienvenidaDe, textoDeBienvenida } from '../../src/historia/arranque.js';
import type { MensajeEntrante } from '../../src/whatsapp/webhook.js';
import type { Idioma } from '../../src/historia/nucleo/entrevista/idioma.js';

const AHORA = new Date('2026-10-23T13:00:00Z'); // 10:00 en Buenos Aires
const TEL = '+5491100000000';
let wa = 0;
const audio = (t: string): MensajeEntrante => ({ telefono: TEL, tipo: 'audio', mediaId: t, waMessageId: `wamid.${++wa}` });
const texto = (t: string, esBoton = false): MensajeEntrante => ({ telefono: TEL, tipo: 'texto', texto: t, waMessageId: `wamid.${++wa}`, ...(esBoton ? { esBoton: true as const } : {}) });
const imagen = (): MensajeEntrante => ({ telefono: TEL, tipo: 'imagen', mediaId: 'FOTO', mimeType: 'image/jpeg', waMessageId: `wamid.${++wa}` });

const CUENTA = 'Fue una época larga, me acuerdo de la casa, de la calle y de la gente que estaba conmigo.';

afterEach(() => {
  delete process.env.WA_PLANTILLAS_V3_LISTAS;
});

async function preparar(o: { ficha?: Partial<FichaFila>; temaAbierto?: boolean; propias?: string[]; idioma?: Idioma; estado?: string } = {}) {
  const narrador: NarradorHistoria = {
    id: 'n1', familia_id: 'f1', como_le_dicen: 'Marta', telefono_whatsapp: TEL, hora_preferida: '10:00:00',
    zona_horaria: 'America/Argentina/Buenos_Aires', contexto: { modo: 'historia' }, estado: o.estado ?? 'invitado', dia_actual: 0, ultima_respuesta_at: null, alerta_silencio: false,
  };
  const base = crearBaseFalsa({ narradores: [{ ...narrador }] }, { ahora: () => AHORA });
  const ficha: FichaFila = { nombre: 'Marta', genero: 'mujer', tema: 'mudanza', ...o.ficha };
  await crearFila(base.cliente, {
    narrador_id: 'n1', idioma: o.idioma ?? 'es-AR', ficha, compra: { preguntasPropias: o.propias ?? [] },
    estado: estadoInicial({ temaAbierto: o.temaAbierto ?? false, propias: o.propias ?? [] }),
    ultimo_audio_at: null, tanda_dia: null, tanda_cuenta: 0,
  });
  const p = depsDePrueba(base, { ahora: AHORA });
  const n = () => ({ ...narrador, ...base.tablas.narradores[0] }) as NarradorHistoria;
  const entra = (m: MensajeEntrante) => procesarEntranteHistoria(p.deps, n(), m);
  /** Pasan 3 minutos y corre el reloj (cierra la respuesta y manda lo que sigue). */
  const silencio = async () => {
    p.pasar(181_000);
    await tickHistoria(p.deps);
  };
  return { base, ...p, n, entra, silencio, fila: () => leerFila(base.cliente, 'n1') };
}

/** La primera línea de lo que salió en cada envío (alcanza para ver el orden). */
const primeras = (enviados: { texto?: string; plantilla?: string }[]) => enviados.map((e) => (e.texto ?? `[${e.plantilla}]`).split('\n')[0].slice(0, 40));

describe('antes del SÍ', () => {
  it('si escribe antes de que le llegue la bienvenida, sale como texto; después «no te entendí» una vez; después silencio y aviso', async () => {
    const { entra, enviados, avisos, base, fila } = await preparar();
    await entra(texto('Hola, ¿quién es?'));
    expect(enviados.map((e) => e.texto)).toEqual([textoDeBienvenida((await fila())!)]);
    expect(enviados[0].texto).toContain('Hola, Marta, ¿cómo estás? Soy quien te va a entrevistar para armar tu libro sobre cuando te fuiste a vivir lejos.');
    await entra(texto('¿Esto es una estafa?'));
    expect(enviados[1].texto).toBe('Perdón, no te entendí. Para arrancar necesito que me escribas SÍ. ¿Vamos?');
    await entra(texto('Hola'));
    expect(enviados).toHaveLength(2);
    expect(avisos.map((a) => a.clave)).toEqual(['historia-sin-si-n1']);
    expect(base.tablas.respuestas ?? []).toEqual([]); // antes del SÍ no se guarda nada
  });

  it('«No» : «cuando quieras», una vez, y aviso a los socios para devolver', async () => {
    const { entra, enviados, avisos } = await preparar();
    await entra(texto('No, gracias'));
    expect(enviados.map((e) => e.texto)).toEqual(['Sin problema, Marta. Cuando tengas ganas me escribís SÍ y arrancamos. Acá voy a estar.']);
    expect(avisos.map((a) => a.clave)).toEqual(['dijo-que-no:n1']);
  });

  it('SÍ: queda activo y salen COMO y HC1', async () => {
    const { entra, enviados, base, fila } = await preparar();
    await entra(texto('Sí'));
    expect(base.tablas.narradores[0].estado).toBe('activo');
    expect(base.tablas.narradores[0].consentimiento_voz_at).toBe(AHORA.toISOString());
    expect(primeras(enviados)).toEqual(['Funciona así. Son unas quince preguntas ', 'Empecemos por el antes, Marta. Este libr']);
    expect((await fila())!.estado).toMatchObject({ fase: 'entrevista', esperando: 'HC1' });
    expect(base.tablas.envios.map((e) => e.tipo)).toEqual(['historia', 'historia']);
  });

  it('un audio que llega junto con el SÍ no se pierde: va como respuesta a lo que abrió el SÍ', async () => {
    const { entra, base, fila } = await preparar();
    await entra(texto('Hola'));
    await Promise.all([entra(texto('Sí')), entra(audio(CUENTA))]);
    expect(base.tablas.narradores[0].estado).toBe('activo');
    expect((await fila())!.estado.borrador).toContain(CUENTA.slice(0, 30));
  });

  it('la bienvenida que le toca: BIEN-H, BIEN-HR con quién regala, BIEN-HR-A con el tema abierto', async () => {
    const f = (ficha: Partial<FichaFila>, temaAbierto = false) =>
      bienvenidaDe({ idioma: 'es-AR', ficha: { nombre: 'Marta', genero: 'mujer', tema: 'padres', ...ficha }, estado: estadoInicial({ temaAbierto, propias: [] }) });
    expect(f({})).toEqual({ id: 'BIEN-H', plantilla: 'bienvenida', variables: ['Marta', 'la llegada de tu primer hijo'] });
    expect(f({ quienRegala: 'Pablo' })).toEqual({ id: 'BIEN-HR', plantilla: 'bienvenida_regalo', variables: ['Marta', 'Pablo', 'la llegada de tu primer hijo'] });
    expect(f({ quienRegala: 'Pablo', tema: 'otra' }, true)).toEqual({ id: 'BIEN-HR-A', plantilla: 'bienvenida_regalo_abierta', variables: ['Marta', 'Pablo'] });
  });
});

describe('la entrevista entera', () => {
  it('del SÍ a FIN-H: cada audio cierra a los 3 minutos, la foto contesta FOTO-H y al final queda completado', async () => {
    const { entra, silencio, enviados, base, fila, hitos } = await preparar({ propias: ['¿Qué te llevaste de casa?'], ficha: { quienRegala: 'Pablo' } });
    await entra(texto('Sí'));
    for (let vuelta = 0; vuelta < 40; vuelta++) {
      const e = (await fila())!.estado;
      if (e.terminada) break;
      if (e.esperando === 'FOTO-H') await entra(imagen());
      await entra(audio(CUENTA));
      await silencio();
    }
    const f = (await fila())!;
    expect(f.estado.terminada).toBe(true);
    expect(base.tablas.narradores[0].estado).toBe('completado');
    expect(f.estado.respuestas.map(([k]) => k)).toEqual([
      'HC1', 'HC2', 'HC3', 'HC4', 'HM1', 'HM2', 'HM3', 'HM4', 'HM5', 'FOTO-H', 'HC5', 'HC6', 'HC7', 'HC8', 'HC9', 'PR-H1', 'HC10',
    ]);
    expect(f.estado.respuestas.find(([k]) => k === 'FOTO-H')![1]).toBe(`⟦foto⟧ ${CUENTA}`);
    expect(enviados.at(-1)!.texto).toMatch(/^Hasta acá llegamos, Marta\./);
    expect(enviados.at(-1)!.texto).toContain('Si te quedó alguna foto');
    expect(base.tablas.fotos).toHaveLength(1);
    // Cada fila de respuestas quedó con su clave.
    expect(base.tablas.respuestas.every((r) => typeof r.clave_historia === 'string' && r.clave_historia !== SIN_CLAVE_HISTORIA)).toBe(true);
    expect(new Set(base.tablas.respuestas.map((r) => r.clave_historia))).toEqual(new Set(f.estado.respuestas.map(([k]) => k)));
    expect(hitos).toContain('n1:primera');
    expect(hitos).toContain('n1:mitad');
    const pr = enviados.find((e) => e.texto?.includes('Esta te la manda Pablo'));
    expect(pr?.texto).toContain('«¿Qué te llevaste de casa?»');
  });

  it('las preguntas sumadas desde el panel llegan después de las de quien regala y antes de HC10 (PF-H1, PF-H2), con su clave', async () => {
    const { entra, silencio, enviados, base, fila } = await preparar({ propias: ['¿Qué te llevaste de casa?'], ficha: { quienRegala: 'Pablo' } });
    await entra(texto('Sí'));
    // Una se suma antes de arrancar y otra a mitad de la entrevista; una de otro narrador no cuenta.
    base.tablas.preguntas = [
      { id: 'p1', narrador_id: 'n1', orden: 200, texto: '¿Seguís viendo a alguien de esa época?', tipo: 'familia' },
      { id: 'px', narrador_id: 'otro', orden: 200, texto: 'No es tuya', tipo: 'familia' },
    ];
    for (let vuelta = 0; vuelta < 40; vuelta++) {
      const e = (await fila())!.estado;
      if (e.terminada) break;
      if (e.esperando === 'HC5') base.tablas.preguntas.push({ id: 'p2', narrador_id: 'n1', orden: 201, texto: 'qué pasó con la casa??', tipo: 'familia' });
      if (e.esperando === 'FOTO-H') await entra(imagen());
      await entra(audio(CUENTA));
      await silencio();
    }
    const f = (await fila())!;
    expect(f.estado.respuestas.map(([k]) => k).slice(-5)).toEqual(['HC9', 'PR-H1', 'F:p1', 'F:p2', 'HC10']);
    expect(enviados.find((e) => e.texto?.includes('Una pregunta más, Marta, que quedó anotada para vos.'))?.texto).toContain('«¿Seguís viendo a alguien de esa época?»');
    expect(enviados.find((e) => e.texto?.includes('Otra que quedó anotada para vos.'))?.texto).toContain('«qué pasó con la casa??»');
    expect(base.tablas.respuestas.filter((r) => r.clave_historia === 'F:p1')).toHaveLength(1);
    expect(JSON.stringify(f.estado.charla)).not.toContain('No es tuya');
  });

  it('una sumada cuando ya salió HC10 no llega', async () => {
    const { entra, silencio, enviados, base, fila } = await preparar();
    await entra(texto('Sí'));
    for (let vuelta = 0; vuelta < 40 && (await fila())!.estado.esperando !== 'HC10'; vuelta++) {
      if ((await fila())!.estado.esperando === 'FOTO-H') await entra(imagen());
      await entra(audio(CUENTA));
      await silencio();
    }
    base.tablas.preguntas = [{ id: 'tarde', narrador_id: 'n1', orden: 200, texto: '¿Llega?', tipo: 'familia' }];
    await entra(audio(CUENTA));
    await silencio();
    expect((await fila())!.estado.terminada).toBe(true);
    expect(enviados.some((e) => e.texto?.includes('«¿Llega?»'))).toBe(false);
  });

  it('[No tengo fotos] cierra FOTO-H en el momento y sigue HC5', async () => {
    const { entra, silencio, enviados, fila } = await preparar();
    await entra(texto('Sí'));
    while ((await fila())!.estado.esperando !== 'FOTO-H') {
      await entra(audio(CUENTA));
      await silencio();
    }
    const foto = enviados.at(-1)!;
    expect(foto).toMatchObject({ tipo: 'botones', botones: ['No tengo fotos'] });
    expect(foto.texto).toContain('_Podés tocar el botón de abajo, o contestarme en audio como siempre._');
    await entra(texto('No tengo fotos', true));
    expect((await fila())!.estado.esperando).toBe('HC5');
    expect(enviados.at(-1)!.texto).toMatch(/^Bien, seguimos\.\nAhora vamos a lo más difícil, Marta\./);
  });
});

describe('el tema abierto', () => {
  it('SÍ → TEMA-ABIERTO; lo que escribe queda como su historia (sin M22) y siguen TEMA-OK + COMO y HC1-A', async () => {
    const { entra, silencio, enviados, base, fila } = await preparar({ temaAbierto: true, ficha: { tema: 'otra', quienRegala: 'Pablo' } });
    await entra(texto('Sí'));
    expect(primeras(enviados)).toEqual(['Dale, Marta. Pablo quiso que la historia']);
    await entra(texto('Cuando me fui a vivir a Mendoza con mi hermana'));
    expect(enviados).toHaveLength(1); // ni M22 ni nada todavía
    await silencio();
    const f = (await fila())!;
    expect(f.ficha.temaLibre).toBe('Cuando me fui a vivir a Mendoza con mi hermana');
    expect(f.estado.respuestas[0]).toEqual(['TEMA', 'Cuando me fui a vivir a Mendoza con mi hermana']);
    expect(primeras(enviados).slice(1)).toEqual(['Queda anotado, Marta. De eso va a ser tu', 'Empecemos por el antes, Marta. Antes de ']);
    expect(base.tablas.respuestas.map((r) => r.clave_historia)).toEqual(['TEMA']);
  });

  it('si duda, TEMA-LISTA; si sigue sin elegir, un aviso a los socios', async () => {
    const { entra, silencio, enviados, avisos } = await preparar({ temaAbierto: true, ficha: { tema: 'otra', quienRegala: 'Pablo' } });
    await entra(texto('Sí'));
    await entra(texto('No sé, la verdad'));
    await silencio();
    expect(primeras(enviados).at(-1)).toBe('Te dejo algunas ideas, Marta. Son solo p');
    await entra(texto('Ni idea'));
    await silencio();
    expect(enviados.filter((e) => e.texto?.startsWith('Te dejo algunas ideas'))).toHaveLength(1);
    expect(avisos.map((a) => a.clave)).toEqual(['historia-sin-tema-n1']);
  });
});

describe('fuera de la ventana, pausa y recordatorio', () => {
  it('a los 2 días sin respuesta sale M8; fuera de la ventana, por la plantilla de recordatorio de la V3', async () => {
    process.env.WA_PLANTILLAS_V3_LISTAS = 'es-AR:recordatorio';
    const { entra, enviados, pasar, deps } = await preparar();
    await entra(texto('Sí'));
    pasar(2 * 86_400_000 + 60_000);
    await tickHistoria(deps);
    expect(enviados.at(-1)).toMatchObject({ tipo: 'plantilla', plantilla: 'm8_vos', variables: ['Marta'] });
  });

  it('a los 3 días sin contestar sale el mail de silencio a la familia, una vez; al contestar se apaga', async () => {
    const { entra, pasar, deps, base, hitos } = await preparar();
    await entra(texto('Sí'));
    pasar(2 * 86_400_000);
    await tickHistoria(deps);
    expect(hitos).not.toContain('n1:silencio');
    pasar(86_400_000 + 60_000);
    await tickHistoria(deps);
    await tickHistoria(deps);
    expect(hitos.filter((h) => h === 'n1:silencio')).toHaveLength(1);
    expect(base.tablas.narradores[0].alerta_silencio).toBe(true);
    await entra(audio(CUENTA));
    expect(base.tablas.narradores[0].alerta_silencio).toBe(false);
  });

  it('fuera de la ventana, lo abierto sale por la plantilla de la pregunta, solo la pregunta', async () => {
    const { entra, enviados, fila, pasar, deps } = await preparar();
    await entra(texto('Sí'));
    await entra(audio(CUENTA));
    pasar(25 * 3_600_000); // se cerró la ventana de 24 h antes de cerrar la respuesta
    await tickHistoria(deps);
    expect(enviados.at(-1)).toMatchObject({ tipo: 'plantilla', plantilla: 'pregunta_diaria_vos' });
    expect(enviados.at(-1)!.variables![0]).toMatch(/^¿Cómo eras vos en ese entonces\?/);
    expect((await fila())!.estado.abiertaPorPlantilla).toBe(true);
  });

  it('«quiero parar»: pausado, el texto de pausa, y al volver a escribir se le reenvía lo abierto', async () => {
    const { entra, enviados, base, avisos } = await preparar();
    await entra(texto('Sí'));
    await entra(texto('Quiero parar'));
    expect(base.tablas.narradores[0].estado).toBe('pausado');
    expect(enviados.at(-1)!.texto).toMatch(/^Listo, Marta, frenamos acá\./);
    expect(avisos.map((a) => a.clave)).toEqual(['pausa-n1']);
    await entra(texto('Hola, volví'));
    expect(base.tablas.narradores[0].estado).toBe('activo');
    expect(enviados.at(-1)!.texto).toMatch(/^Empecemos por el antes, Marta\./);
  });
});

describe('la fila', () => {
  it('un narrador con entrevista V3 no puede tener historia', async () => {
    const base = crearBaseFalsa({ entrevistas_v3: [{ narrador_id: 'n2' }] });
    await expect(crearFila(base.cliente, {
      narrador_id: 'n2', idioma: 'es-AR', ficha: { nombre: 'X', genero: 'varon', tema: 'otra' }, compra: {},
      estado: estadoInicial({ temaAbierto: false, propias: [] }), ultimo_audio_at: null, tanda_dia: null, tanda_cuenta: 0,
    })).rejects.toThrow('tiene entrevista V3');
  });
});
