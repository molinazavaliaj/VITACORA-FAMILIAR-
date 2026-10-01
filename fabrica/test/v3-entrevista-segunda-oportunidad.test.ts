// La salida "contame en general" solo después de un "no me acuerdo" (Naza,
// 01/10, chat "La entrevista trae escenas"; plan:
// docs/v3/entrevista/cazador/plan-codigo.md, parte A). Las 8 preguntas que
// piden un día ya no traen la salida en el mismo mensaje: si contesta con un
// olvido puro, llega una segunda oportunidad (M33.1 a M33.8), una sola vez.
// Los textos son de Fable con el OK de Naza: se comparan letra por letra.

import { describe, expect, it } from 'vitest';
import { BANCO, mensajePorId, preguntaPorId } from '../src/v3/entrevista/banco.js';
import { mensajesDespues, PIDEN_DIA, preguntaDeClave, siguientePregunta, type Siguiente } from '../src/v3/entrevista/flujo.js';
import { acuseDeTurno } from '../src/v3/entrevista/mensajes.js';
import { nuevaEntrevista, responder, type Resultado } from '../scripts/v3-entrevista-turno.js';

const p = (id: string) => preguntaPorId(id)!;
const CUENTA = 'Sí, te cuento: fue una historia larga que me acuerdo muy bien.';
const OLVIDO = 'No me acuerdo.';
const A_MEDIAS = 'No me acuerdo bien, pero sé que íbamos al río con mis primos y llevábamos la merienda en una canasta de mimbre.';
const PASO = 'Paso.';
const NO = 'No, nada.';

const SALIDA = 'Si ya me lo contaste, decímelo, y si querés reforzar algo, es el momento.';

const PREGUNTAS: Record<string, string> = {
  CA16: 'Contame un día de chic{{o/a}} que esperabas con muchas ganas: qué era, quién estaba, qué pasó.',
  AD5: '¿Te acordás de la primera vez que saliste de noche, a un baile o a una fiesta? Contame cómo te preparaste, con quién fuiste y cómo fue esa noche.',
  JU12: 'Contame del primer lugar que fue tuyo, donde ya vivías por tu cuenta. Capaz ya me nombraste ese lugar; ahora contámelo por dentro: cómo era, con qué lo fuiste armando, qué se veía por la ventana. Y esa primera noche ahí, ¿cómo fue? Si nunca te fuiste de la casa de tus viejos, contame el día en que esa casa pasó a ser tuya, o el rincón que siempre fue tuyo.',
  TR5: '¿Cuál fue el día de trabajo del que estás más orgullos{{o/a}}? No hace falta que haya sido grande: algo que salió bien, que alguien reconoció, o que solo vos sabés lo que costó. Contámelo.',
  HG4: 'Te quiero pedir un día concreto de la pandemia. No toda esa época: un solo día. Dónde estabas, con quién, qué hiciste, cómo te sentías. Pensá en el que más te haya quedado.',
  GI2: `Pensá en un día que empezó como cualquier otro y terminó cambiándote algo. Contame ese día entero: cómo arrancó la mañana, en qué momento te diste cuenta de que ya no había vuelta atrás, y cómo terminó. ${SALIDA}`,
  GI9: '¿Hubo algún momento en tu vida en que te sentiste chiquit{{o/a}} frente a algo enorme? Un cielo de noche, por ejemplo. Contame ese momento: dónde estabas, con quién, qué había alrededor.',
  HO2: '¿Qué cosas te hacen gracia hoy, qué te hace reír? Contame la última vez que te reíste con ganas: dónde estabas y qué había pasado.',
};

const SEGUNDAS: Record<string, string> = {
  'M33.1': 'Está bien, {{nombre}}, no hace falta un día justo. Contame qué cosas esperabas con ganas en esa época, aunque sea una o dos. Y si no, decímelo nomás y vamos con otra.',
  'M33.2': 'Está bien, {{nombre}}, la primera no hace falta. Contame cómo eran esas salidas de noche en general: adónde iban, con quiénes. Con un par de cosas me alcanza. Y si no, decímelo nomás y vamos con otra.',
  'M33.3': 'Está bien, {{nombre}}, la noche justa no hace falta. Contame cómo eran los primeros tiempos en ese lugar, lo que te venga. Con un par de cosas me alcanza. Y si no, decímelo nomás y vamos con otra.',
  'M33.4': 'Está bien, {{nombre}}, no hace falta un día puntual. Contame de qué parte de tu trabajo estás más orgullos{{o/a}}, aunque sea una sola cosa. Y si no, decímelo nomás y vamos con otra.',
  'M33.5': 'Está bien, {{nombre}}, si ningún día se te separa de los demás, contame cómo eran tus días en la pandemia, así en general. Con un par de cosas me alcanza. Y si no, decímelo nomás y vamos con otra.',
  'M33.6': 'Está bien, {{nombre}}, el día justo no hace falta. Contame nomás qué fue lo que cambió: cómo eras antes y cómo después. Con eso me alcanza. Y si no, decímelo nomás y vamos con otra.',
  'M33.7': 'Está bien, {{nombre}}, no hace falta un momento puntual. Contame frente a qué cosas te pasa eso, aunque sea una. Y si no, decímelo nomás y vamos con otra.',
  'M33.8': 'Está bien, {{nombre}}, la última vez no hace falta. Contame con qué te reís seguido, aunque sea una cosa. Y si no, decímelo nomás y vamos con otra.',
};

/**
 * Las respuestas hasta justo antes de `hasta`, contando todo, en el orden del
 * flujo (como el entrevistador: el Map conserva el orden en que llegaron).
 */
function respuestasHasta(hasta: string): Map<string, string> {
  const respuestas = new Map<string, string>();
  const enviados = new Set<string>();
  for (let i = 0; i < 400; i++) {
    const s = siguientePregunta({ respuestas, enviados });
    if (s.tipo !== 'pregunta') throw new Error(`no llegué a ${hasta}: ${s.tipo}`);
    if (s.pregunta.id === hasta) return respuestas;
    if (s.esperaRespuesta) respuestas.set(s.pregunta.id, CUENTA);
    else enviados.add(s.pregunta.id);
  }
  throw new Error(`no llegué a ${hasta}`);
}

const siguiente = (respuestas: Map<string, string>): Siguiente => siguientePregunta({ respuestas });

describe('A1. el banco: las 8 preguntas sin la salida, letra por letra', () => {
  it.each(Object.entries(PREGUNTAS))('%s', (id, texto) => {
    expect(p(id).texto).toBe(texto);
  });

  it('las 8 son las que piden un día, y cada una tiene su segunda oportunidad', () => {
    expect(Object.keys(PIDEN_DIA)).toEqual(Object.keys(PREGUNTAS));
    expect(Object.values(PIDEN_DIA)).toEqual(Object.keys(SEGUNDAS));
  });

  it('ninguna de las 8 lleva botones (la segunda oportunidad es solo para el olvido dicho en audio)', () => {
    for (const id of Object.keys(PREGUNTAS)) expect(p(id).botones, id).toBeUndefined();
  });
});

describe('A1. los mensajes M33.1 a M33.8, letra por letra', () => {
  it.each(Object.entries(SEGUNDAS))('%s', (id, texto) => {
    expect(mensajePorId(id)?.texto).toBe(texto);
  });
});

describe('A2. la segunda oportunidad, solo después de un olvido puro', () => {
  it('CA16 con "No me acuerdo." → M33.1, con la clave CA16~2', () => {
    const r = respuestasHasta('CA16');
    r.set('CA16', OLVIDO);
    expect(siguiente(r)).toEqual({ tipo: 'segunda-oportunidad', de: 'CA16', mensaje: 'M33.1', clave: 'CA16~2' });
  });

  it.each(Object.entries(PIDEN_DIA))('%s → %s', (id, mensaje) => {
    const r = respuestasHasta(id);
    r.set(id, OLVIDO);
    expect(siguiente(r)).toMatchObject({ tipo: 'segunda-oportunidad', de: id, mensaje, clave: `${id}~2` });
  });

  it.each([
    ['contó algo', CUENTA],
    ['olvido a medias', A_MEDIAS],
    ['paso', PASO],
    ['"no" corto', NO],
  ])('no después de %s', (_, resp) => {
    const r = respuestasHasta('CA16');
    r.set('CA16', resp);
    expect(siguiente(r).tipo).toBe('pregunta');
  });

  it('no en una pregunta que no pide un día (CA2 con olvido sigue con la próxima)', () => {
    const r = respuestasHasta('CA2');
    r.set('CA2', OLVIDO);
    expect(siguiente(r)).toMatchObject({ tipo: 'pregunta' });
  });

  it('una sola vez: con CA16~2 contestada (aunque sea otro olvido) sigue la entrevista', () => {
    const r = respuestasHasta('CA16');
    r.set('CA16', OLVIDO);
    const sinSegunda = respuestasHasta('CA16');
    sinSegunda.set('CA16', CUENTA);
    const normal = siguiente(sinSegunda);
    r.set('CA16~2', OLVIDO);
    expect(siguiente(r)).toEqual(normal);
  });

  it('mientras no contesta la segunda oportunidad, sigue siendo lo próximo (como una pregunta abierta)', () => {
    const r = respuestasHasta('HO2');
    r.set('HO2', OLVIDO);
    expect(siguiente(r)).toMatchObject({ tipo: 'segunda-oportunidad', de: 'HO2' });
    expect(siguiente(r)).toMatchObject({ tipo: 'segunda-oportunidad', de: 'HO2' });
  });

  it('la clave X~2 no es un ID del banco', () => {
    expect(BANCO.some((q) => q.id.includes('~'))).toBe(false);
  });
});

describe('A2. acuses alrededor de la segunda oportunidad', () => {
  it('delante de la segunda oportunidad, ninguno: su "Está bien, {{nombre}}…" hace de acuse', () => {
    expect(mensajesDespues(p('CA16'), OLVIDO, new Map())).toEqual([]);
    expect(mensajesDespues(p('HO2'), OLVIDO, new Map([['HO1', CUENTA]]))).toEqual([]);
  });

  it('las demás respuestas a una de las 8 llevan su acuse de siempre', () => {
    expect(mensajesDespues(p('CA16'), CUENTA)).toEqual(['M3']);
    expect(mensajesDespues(p('CA16'), A_MEDIAS)).toEqual(['M28.4']);
    expect(mensajesDespues(p('CA16'), PASO)).toEqual(['M21']);
    expect(mensajesDespues(p('CA16'), NO)).toEqual(['M25']);
  });

  const segunda = preguntaDeClave('CA16~2')!;

  it('la clave CA16~2 se interpreta como una pregunta común del bloque de CA16', () => {
    expect(segunda).toMatchObject({ id: 'CA16~2', bloque: p('CA16').bloque, clase: 'historia', sensible: false });
  });

  it('después de lo que contesta: contó → M28.4 (rota con M28.5); olvido o "no" corto → M28.1; "paso" → M21', () => {
    expect(mensajesDespues(segunda, CUENTA)).toEqual(['M28.4']);
    expect(mensajesDespues(segunda, A_MEDIAS)).toEqual(['M28.4']);
    expect(mensajesDespues(segunda, OLVIDO)).toEqual(['M28']);
    expect(mensajesDespues(segunda, NO)).toEqual(['M28']);
    expect(mensajesDespues(segunda, PASO)).toEqual(['M21']);
  });

  it('delante de un cierre o de LE9, el M28.4 de la segunda oportunidad deja lugar a M26, como siempre', () => {
    expect(acuseDeTurno('M28.4', 0, 'Hasta acá…', p('CI2'))).toBe('M26');
    expect(acuseDeTurno('M28.4', 1, '…', p('CA17'))).toBe('M28.5');
  });
});

describe('A2. M29: la pregunta entera cuenta como UN olvido', () => {
  /** Los acuses de una tanda, pasando las anteriores en orden (como el entrevistador). */
  function acuses(tanda: [string, string][]): string[][] {
    const anteriores = new Map<string, string>();
    return tanda.map(([id, r]) => {
      const a = mensajesDespues(preguntaDeClave(id)!, r, anteriores);
      anteriores.set(id, r);
      return a;
    });
  }

  it('olvido, olvido, y CA16 con olvido dos veces: el tercero es el de CA16~2 → M29', () => {
    expect(acuses([['ES1', OLVIDO], ['ES2', OLVIDO], ['CA16', OLVIDO], ['CA16~2', OLVIDO]])).toEqual([['M28'], ['M28'], [], ['M29']]);
  });

  it('el olvido de CA16 no suma por su cuenta: olvido, CA16 (olvido + olvido), olvido → M29 en el último', () => {
    expect(acuses([['ES1', OLVIDO], ['CA16', OLVIDO], ['CA16~2', OLVIDO], ['ES5', OLVIDO]])).toEqual([['M28'], [], ['M28'], ['M29']]);
  });

  it('si en la segunda oportunidad cuenta, la cuenta vuelve a cero', () => {
    expect(acuses([['ES1', OLVIDO], ['ES2', OLVIDO], ['CA16', OLVIDO], ['CA16~2', CUENTA], ['ES5', OLVIDO]])).toEqual([['M28'], ['M28'], [], ['M28.4'], ['M28']]);
  });

  it('un olvido a medias en la segunda oportunidad ni suma ni corta, como hoy', () => {
    expect(acuses([['ES1', OLVIDO], ['CA16', OLVIDO], ['CA16~2', A_MEDIAS], ['ES2', OLVIDO], ['ES5', OLVIDO]])).toEqual([['M28'], [], ['M28.4'], ['M28'], ['M29']]);
  });
});

describe('A2. en la simulación por turnos (v3-entrevista-turno.ts)', () => {
  /** Contesta contando todo hasta que espera `id`. */
  function hasta(id: string): Resultado {
    let r = nuevaEntrevista({ nombre: 'Marta', genero: 'mujer' });
    for (let i = 0; i < 300 && r.estado.esperando !== id; i++) r = responder(r.estado, CUENTA);
    expect(r.estado.esperando).toBe(id);
    return r;
  }

  it('olvido en CA16 → M33.1 solo, sin acuse arriba; después de contar, M28.4 pegado a la que sigue', () => {
    const r1 = responder(hasta('CA16').estado, OLVIDO);
    expect(r1.mensajes).toEqual(['Está bien, Marta, no hace falta un día justo. Contame qué cosas esperabas con ganas en esa época, aunque sea una o dos. Y si no, decímelo nomás y vamos con otra.']);
    expect(r1.estado.esperando).toBe('CA16~2');
    const r2 = responder(r1.estado, 'Los carnavales del pueblo, y la llegada del circo en verano.');
    expect(r2.estado.respuestas.slice(-2)).toEqual([['CA16', OLVIDO], ['CA16~2', 'Los carnavales del pueblo, y la llegada del circo en verano.']]);
    expect(r2.mensajes[0].split('\n')[0]).toBe('Con ese pedacito me alcanza, Marta. Gracias.');
    expect(r2.estado.esperando).not.toBe('CA16~2');
  });

  it('con un "no" corto en la segunda oportunidad: M28.1 y sigue', () => {
    const r1 = responder(hasta('CA16').estado, OLVIDO);
    const r2 = responder(r1.estado, 'No, nada.');
    expect(r2.mensajes[0].split('\n')[0]).toBe('No pasa nada, Marta. Vamos con otra.');
  });
});
