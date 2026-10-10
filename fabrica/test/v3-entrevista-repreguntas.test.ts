// La cola de repreguntas del cazador en el flujo (plan: docs/v3/entrevista/
// cazador/plan-codigo.md, parte B2; Naza, 01/10). Una repregunta sale cuando
// ya pasaron 3 respuestas del banco después de la de origen, nunca dos
// seguidas, y antes de entrar al bloque 15 salen todas las que queden.
// Datos inventados.

import { describe, expect, it } from 'vitest';
import { preguntaPorId } from '../src/v3/entrevista/banco.js';
import { BOTON_YA_LO_CONTE, mensajesDespues, preguntaDeClave, siguientePregunta, type Repregunta } from '../src/v3/entrevista/flujo.js';
import { acuseDeTurno } from '../src/v3/entrevista/mensajes.js';
import { respuestaDeBoton } from '../src/v3/entrevista/respuesta.js';

const CUENTA = 'Sí, te cuento: fue una historia larga que me acuerdo muy bien.';
const OLVIDO = 'No me acuerdo.';

const rp = (origen: string, bloque = preguntaPorId(origen)!.bloque): Repregunta => ({
  clave: `RP~${origen}`,
  origen,
  bloque,
  cita: 'la parra del patio',
  pregunta: '¿Te acordás de una siesta debajo de esa parra?',
  tema: `algo de ${origen}`,
});

/** Las respuestas hasta justo antes de `hasta`, contando todo, en el orden del flujo. */
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

/** Contesta `n` preguntas del banco más (contando), siguiendo el flujo sin cola. */
function contestar(respuestas: Map<string, string>, n: number): void {
  for (let i = 0; i < n; i++) {
    const s = siguientePregunta({ respuestas });
    if (s.tipo !== 'pregunta') throw new Error(s.tipo);
    respuestas.set(s.pregunta.id, CUENTA);
  }
}

describe('B2. cuándo sale una repregunta', () => {
  it('con 2 respuestas del banco después de la de origen, todavía no; con 3, sí (con el botón [Ya lo conté todo])', () => {
    const r = respuestasHasta('CA2');
    r.set('CA2', CUENTA);
    contestar(r, 2);
    const cola = [rp('CA2')];
    expect(siguientePregunta({ respuestas: r, repreguntas: cola }).tipo).toBe('pregunta');
    contestar(r, 1);
    expect(siguientePregunta({ respuestas: r, repreguntas: cola })).toEqual({ tipo: 'repregunta', repregunta: cola[0], botones: [BOTON_YA_LO_CONTE] });
  });

  it('las claves X~2 y RP~X no cuentan como respuestas del banco', () => {
    const r = respuestasHasta('CA2');
    r.set('CA2', CUENTA);
    contestar(r, 2);
    r.set('RP~OR1', CUENTA);
    r.set('CA16~2', CUENTA);
    expect(siguientePregunta({ respuestas: r, repreguntas: [rp('CA2')] }).tipo).toBe('pregunta');
  });

  it('una vez contestada, no vuelve; mientras no la contesta, sigue siendo lo próximo', () => {
    const r = respuestasHasta('CA2');
    r.set('CA2', CUENTA);
    contestar(r, 3);
    const cola = [rp('CA2')];
    expect(siguientePregunta({ respuestas: r, repreguntas: cola }).tipo).toBe('repregunta');
    expect(siguientePregunta({ respuestas: r, repreguntas: cola }).tipo).toBe('repregunta');
    r.set('RP~CA2', CUENTA);
    expect(siguientePregunta({ respuestas: r, repreguntas: cola }).tipo).toBe('pregunta');
  });

  it('nunca dos seguidas: después de contestar una, va una del banco y recién después la otra', () => {
    const r = respuestasHasta('CA2');
    r.set('CA2', CUENTA);
    contestar(r, 1);
    const otra = [...r.keys()].at(-1)!;
    contestar(r, 3);
    const cola = [rp('CA2'), rp(otra)];
    const s1 = siguientePregunta({ respuestas: r, repreguntas: cola });
    expect(s1).toMatchObject({ tipo: 'repregunta', repregunta: { origen: 'CA2' } });
    r.set('RP~CA2', CUENTA);
    expect(siguientePregunta({ respuestas: r, repreguntas: cola }).tipo).toBe('pregunta');
    contestar(r, 1);
    expect(siguientePregunta({ respuestas: r, repreguntas: cola })).toMatchObject({ tipo: 'repregunta', repregunta: { origen: otra } });
  });

  it('la segunda oportunidad va antes que una repregunta lista', () => {
    const r = respuestasHasta('CA16');
    r.set('CA16', OLVIDO);
    const cola = [rp([...r.keys()].at(-5)!)];
    expect(siguientePregunta({ respuestas: r, repreguntas: cola })).toMatchObject({ tipo: 'segunda-oportunidad', de: 'CA16' });
  });

  it('antes de entrar al bloque 15 salen todas las que queden, aunque no hayan pasado 3 y aunque vayan seguidas', () => {
    const r = respuestasHasta('LE1'); // la primera del bloque 15 (legado)
    const [penultima, ultima] = [...r.keys()].slice(-2);
    const cola = [rp(penultima), rp(ultima)];
    const enviados = new Set(['AV11']); // el aviso del bloque 11 ya se mandó
    expect(siguientePregunta({ respuestas: r, enviados, repreguntas: cola })).toMatchObject({ tipo: 'repregunta', repregunta: { origen: penultima } });
    r.set(cola[0].clave, CUENTA);
    expect(siguientePregunta({ respuestas: r, enviados, repreguntas: cola })).toMatchObject({ tipo: 'repregunta', repregunta: { origen: ultima } });
    r.set(cola[1].clave, CUENTA);
    expect(siguientePregunta({ respuestas: r, enviados, repreguntas: cola })).toMatchObject({ tipo: 'pregunta', pregunta: { id: 'LE1' } });
  });
});

describe('B2. acuses después de una repregunta', () => {
  const p = preguntaDeClave('RP~CA2')!;

  it('la clave RP~CA2 se interpreta como una común del bloque de CA2, con el botón [Ya lo conté todo]', () => {
    expect(p).toMatchObject({ id: 'RP~CA2', bloque: 2, clase: 'historia', sensible: false, botones: [BOTON_YA_LO_CONTE] });
  });

  it('contó → M3 (con acuseAntesDe: M26 delante de un cierre); botón o "no" corto → M25; olvido → M28.1; "paso" → M21', () => {
    expect(mensajesDespues(p, CUENTA)).toEqual(['M3']);
    expect(acuseDeTurno('M3', 0, 'Hasta acá…', preguntaPorId('CI2')!)).toBe('M26');
    expect(mensajesDespues(p, respuestaDeBoton('Ya lo conté todo'))).toEqual(['M25']);
    expect(mensajesDespues(p, 'No, nada más.')).toEqual(['M25']);
    expect(mensajesDespues(p, OLVIDO)).toEqual(['M28']);
    expect(mensajesDespues(p, 'Paso.')).toEqual(['M21']);
  });

  it('el olvido de una repregunta no suma a M29 (ni es M29 aunque sea el tercero)', () => {
    const anteriores = new Map([['ES1', OLVIDO], ['ES2', OLVIDO]]);
    expect(mensajesDespues(p, OLVIDO, anteriores)).toEqual(['M28']);
    anteriores.set('RP~CA2', OLVIDO);
    expect(mensajesDespues(preguntaPorId('ES5')!, OLVIDO, anteriores)).toEqual(['M29']);
  });
});
