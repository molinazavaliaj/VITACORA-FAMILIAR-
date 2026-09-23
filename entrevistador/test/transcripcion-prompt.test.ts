import { describe, it, expect } from 'vitest';
import { promptDeTranscripcion, castellanoDe } from '../src/manual/puro.js';

// El prompt que se le pasa a la transcripción (biógrafo v2, 23/09). Dos cambios:
// 1. Estaba fijo en "castellano rioplatense (Argentina)" con glosario argentino: una narradora
//    de España recibía una transcripción empujada al argentino. Ahora sale de su zona horaria.
// 2. Le pasaba el texto libre de la familia ("Contexto: …"). La transcripción puede escribir
//    frases de su prompt que la persona nunca dijo, sobre todo en los silencios: los nombres
//    sirven (corrigen la ortografía), las frases no.

describe('castellanoDe', () => {
  it('sale de la zona horaria del narrador', () => {
    expect(castellanoDe('America/Argentina/Buenos_Aires')).toBe('rioplatense');
    expect(castellanoDe('America/Montevideo')).toBe('rioplatense');
    expect(castellanoDe('Europe/Madrid')).toBe('españa');
    expect(castellanoDe('America/Mexico_City')).toBe('latinoamerica');
    expect(castellanoDe(undefined)).toBe('rioplatense');
  });

  it('el trato manda sobre el reloj: un narrador de vos en Europe/Madrid es un argentino en Madrid', () => {
    expect(castellanoDe('Europe/Madrid', 'vos')).toBe('rioplatense');
    expect(castellanoDe('Europe/Madrid', 'usted')).toBe('españa');
    expect(promptDeTranscripcion({ trato: 'vos' }, 'Joaco', 'Europe/Madrid')).toContain('rioplatense');
  });
});

describe('promptDeTranscripcion', () => {
  const contexto = {
    arbol: { padres: 'Ramón y Haydée', hijos: 'no tuvo' },
    lugarNacimiento: 'Tucumán',
    datosExtra: 'No tiene hijos. Enviudó en 2010 y vive sola desde entonces.',
    oficio: 'costurera',
  };

  it('a una narradora de España no le habla de castellano rioplatense ni le pasa el glosario argentino', () => {
    const p = promptDeTranscripcion(contexto, 'Imma', 'Europe/Madrid');
    expect(p).toContain('castellano de España');
    expect(p).not.toContain('rioplatense');
    expect(p).not.toContain('laburo');
  });

  it('en Argentina sigue con el glosario rioplatense (el caso "de laburar")', () => {
    const p = promptDeTranscripcion(contexto, 'Élida', 'America/Argentina/Buenos_Aires');
    expect(p).toContain('rioplatense');
    expect(p).toContain('laburo');
  });

  it('lleva nombres y lugares, pero no el texto libre de la familia', () => {
    const p = promptDeTranscripcion(contexto, 'Élida', 'America/Argentina/Buenos_Aires');
    expect(p).toContain('Ramón y Haydée');
    expect(p).toContain('Tucumán');
    expect(p).not.toContain('Enviudó');
    expect(p).not.toContain('no tuvo');
  });

  it('no dice "el narrador": sirve igual para una mujer', () => {
    expect(promptDeTranscripcion({}, 'Élida')).not.toMatch(/el narrador/i);
  });
});
