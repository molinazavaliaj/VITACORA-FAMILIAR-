// Los controles de código del cazador v3 (prompt-v3.md, notas para el código).
import { describe, expect, it } from 'vitest';
import { controlarElegida, mensajeCompleto } from '../scripts/v3-cazador-prueba-v3.js';

const RESP = 'Después de la colimba, la persona que nos ayudó cuando llegamos a Córdoba fue un vecino.';
const bien = { cita: 'la persona que nos ayudó cuando llegamos a Córdoba', pregunta: '¿Te acordás del día que lo conociste, dónde estaban?' };

describe('controles del cazador v3', () => {
  it('pasa una cita textual que arranca con un artículo, sin tope de palabras', () => {
    expect(controlarElegida(bien, RESP, false)).toEqual([]);
  });
  it('rechaza la cita que no es textual', () => {
    expect(controlarElegida({ ...bien, cita: 'el vecino que nos ayudó en Córdoba' }, RESP, false)).toContain('la cita no es textual');
  });
  it('rechaza dos preguntas y los tiempos relativos; "hoy" solo vale en el bloque Hoy', () => {
    expect(controlarElegida({ ...bien, pregunta: '¿Dónde? ¿Con quién?' }, RESP, false)).toContain('la pregunta no tiene un solo "?"');
    expect(controlarElegida({ ...bien, pregunta: 'Como me contaste ayer, ¿cómo fue?' }, RESP, false)).toContain('tiempo relativo');
    expect(controlarElegida({ ...bien, pregunta: '¿Cómo fue hoy?' }, RESP, false)).toContain('tiempo relativo');
    expect(controlarElegida({ ...bien, pregunta: '¿Cómo fue hoy?' }, RESP, true)).toEqual([]);
  });
  it('arma el mensaje mitad fijo, mitad escrito', () => {
    expect(mensajeCompleto(bien)).toBe(
      'Me quedé pensando en algo que me contaste: «la persona que nos ayudó cuando llegamos a Córdoba». ¿Te acordás del día que lo conociste, dónde estaban? Y si no te vuelve, o ya me lo contaste todo, decímelo nomás y seguimos con otra.',
    );
  });
});
