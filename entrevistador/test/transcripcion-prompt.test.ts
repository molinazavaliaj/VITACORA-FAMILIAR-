import { describe, it, expect } from 'vitest';
import { promptDeTranscripcion, castellanoDe, nombresDeLaFicha, TOPE_PROMPT_TRANSCRIPCION } from '../src/manual/puro.js';
import { perfilVacio } from '../src/ia/perfil.js';

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

// E12 (piloto esqueleto v2, 25/09): la transcripción escribió "verga" por Berga, "Romero" por
// Homero, "Triki" por Tricky, "Sima" por Ima. El prompt suma los nombres propios que ya sabe la
// ficha: las personas (con sus apodos), los lugares de las etapas, dónde vive y cómo le dicen.
describe('promptDeTranscripcion con la ficha del v2 (E12)', () => {
  const ficha = () => {
    const p = perfilVacio();
    p.persona.comoLeDicen = { valor: 'Naza (en la familia) / Tricky (amigos y nombre de artista)', fuente: 'dicho' };
    p.persona.dondeViveHoy = { valor: 'Berga, provincia de Barcelona, España', fuente: 'dicho' };
    p.personas.push(
      { nombre: 'Melia Mary del Vecchio', vinculo: 'madre', vive: 'si', fuente: 'dicho' },
      { nombre: 'Ima', vinculo: 'pareja actual', vive: 'si', fuente: 'dicho' },
      { nombre: 'Homero', vinculo: 'perro de la infancia', vive: 'no se sabe', fuente: 'dicho' },
      { nombre: 'Francisco ("Fran")', vinculo: 'productor musical y amigo', vive: 'si', fuente: 'dicho' },
      { nombre: 'Martín Ricci ("Ciano", también le dice Tincho)', vinculo: 'amigo del colegio', vive: 'si', fuente: 'dicho' },
      { nombre: 'sin nombre (tíos y primos de Rosario)', vinculo: 'tíos', vive: 'si', fuente: 'dicho' },
      { nombre: 'Juan Di Damico (nombre según se escucha en el audio: "Juan y Damico")', vinculo: 'amigo', vive: 'no se sabe', fuente: 'dicho' },
    );
    p.etapas.push(
      { edades: '0 a 22', lugar: 'Martínez, provincia de Buenos Aires: casa de tres pisos en una esquina', conQuien: '', queHacia: '', fuente: 'dicho' },
      { edades: '23 a 24', lugar: 'Avià, cerca de Berga', conQuien: '', queHacia: '', fuente: 'dicho' },
    );
    return p;
  };

  it('lleva Berga, Avià, Homero, Tricky, Ima y los apodos entre comillas', () => {
    const p = promptDeTranscripcion({}, 'Naza', 'Europe/Madrid', ficha());
    for (const nombre of ['Berga', 'Avià', 'Homero', 'Tricky', 'Ima', 'Fran', 'Ciano', 'Tincho', 'Martínez', 'Melia Mary del Vecchio']) expect(p).toContain(nombre);
  });

  it('no mete las aclaraciones: ni "sin nombre", ni "nombre según se escucha", ni "provincia de"', () => {
    const p = promptDeTranscripcion({}, 'Naza', 'Europe/Madrid', ficha());
    expect(p).not.toMatch(/sin nombre|según se escucha|provincia de|nombre de artista|casa de tres pisos/);
    expect(p).toContain('Juan Di Damico');
  });

  it('familia primero, después lugares, y no repite', () => {
    expect(nombresDeLaFicha(ficha()).slice(0, 4)).toEqual(['Naza', 'Tricky', 'Melia Mary del Vecchio', 'Ima']);
    const nombres = nombresDeLaFicha(ficha());
    expect(new Set(nombres).size).toBe(nombres.length);
    expect(nombres.indexOf('Berga')).toBeLessThan(nombres.indexOf('Homero'));
  });

  it(`con una ficha enorme, el prompt no pasa de ${TOPE_PROMPT_TRANSCRIPCION} caracteres y la familia entra`, () => {
    const p = ficha();
    for (let i = 0; i < 60; i++) p.personas.push({ nombre: `Amigo Numero${i} Apellidolargo`, vinculo: 'amigo', vive: 'si', fuente: 'dicho' });
    const prompt = promptDeTranscripcion({ arbol: { padres: 'Juan Domingo y Melia' } }, 'Naza', 'America/Argentina/Buenos_Aires', p);
    expect(prompt.length).toBeLessThanOrEqual(TOPE_PROMPT_TRANSCRIPCION);
    expect(prompt).toContain('Melia Mary del Vecchio');
    expect(prompt).toContain('Berga');
    expect(prompt).toContain('laburo');
  });

  it('sin ficha, el prompt es el de siempre', () => {
    expect(promptDeTranscripcion({}, 'Joaquín')).toBe(promptDeTranscripcion({}, 'Joaquín', undefined, undefined));
    expect(promptDeTranscripcion({}, 'Joaquín')).not.toContain('Nombres propios');
  });
});
