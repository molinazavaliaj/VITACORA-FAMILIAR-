import { describe, it, expect } from 'vitest';
import { edadDicha, etapaPorLexico, madrePorEdad, personaNombrada, mencionaActividad, numeroEnPalabras } from '../src/v3/etapa.js';
import type { FichaV3 } from '../src/v3/ficha.js';

const FICHA: FichaV3 = {
  nombre: 'Rosa', anioNacimiento: 1950, genero: 'mujer', paisNacimiento: 'Argentina', paisResidencia: 'Argentina',
  parejas: [{ nombre: 'Ricardo', actual: false, fin: 'fallecio' }],
  hijos: [{ nombre: 'Pablo', anio: 1975 }, { nombre: 'Ana', anio: 1979 }],
  nietos: ['Juli'],
  oficios: [{ nombre: 'modista' }],
  migracion: { de: 'Galicia', a: 'Buenos Aires', anio: 1969 },
};
const ANIO = 2026;

describe('números en palabras', () => {
  it('lee de uno a noventa y nueve', () => {
    expect(numeroEnPalabras('ocho')).toBe(8);
    expect(numeroEnPalabras('quince')).toBe(15);
    expect(numeroEnPalabras('diecisiete')).toBe(17);
    expect(numeroEnPalabras('veintitres')).toBe(23);
    expect(numeroEnPalabras('treinta y dos')).toBe(32);
    expect(numeroEnPalabras('casa')).toBeNull();
  });
});

describe('edadDicha: solo con sujeto propio', () => {
  const edad = (t: string) => edadDicha(t, FICHA, ANIO)?.edad ?? null;
  it('"yo tenía N", "a mis N", "a los N años", "cuando tenía N"', () => {
    expect(edad('Eso fue cuando yo tenía 8 años, en la casa de mi abuela.')).toBe(8);
    expect(edad('A mis diecisiete me fui a trabajar.')).toBe(17);
    expect(edad('A los quince me compraron el vestido.')).toBe(15);
    expect(edad('Cuando tenía veintitrés años llegué.')).toBe(23);
  });
  it('rechaza la edad de otro: parentesco en las 3 palabras siguientes', () => {
    expect(edad('Fue a los 17 de mi hija, cuando se recibió.')).toBeNull();
    expect(edad('a los cinco años de mi nieto le regalamos la bici')).toBeNull();
  });
  it('rechaza duraciones: "a los 5 minutos", "a los dos años de casados"', () => {
    expect(edad('A los 5 minutos llegó la policía.')).toBeNull();
    expect(edad('A los dos años de casados nos mudamos.')).toBeNull();
  });
  it('año de cuatro cifras → edad con el año de nacimiento; fuera de la vida no vale', () => {
    expect(edadDicha('En 1966 empecé el secundario.', FICHA, ANIO)).toMatchObject({ edad: 16, motivo: 'edad-numero' });
    expect(edad('Mi abuelo llegó en 1920 al puerto.')).toBeNull();
  });
  it('la edad propia gana al año', () => {
    expect(edad('En 1990 volví; yo tenía 12 cuando pasó.')).toBe(12);
  });
});

describe('madrePorEdad', () => {
  it('0-12 → 2, 13-18 → 3, 19-25 → 4, 26+ → null', () => {
    expect([0, 12, 13, 18, 19, 25, 26].map(madrePorEdad)).toEqual([2, 2, 3, 3, 4, 4, null]);
  });
});

describe('etapaPorLexico', () => {
  const lex = (t: string) => etapaPorLexico(t, FICHA)?.madre ?? null;
  it('expresiones fijas de etapa', () => {
    expect(lex('De chica me encantaba el circo.')).toBe(2);
    expect(lex('Eso pasó en la primaria.')).toBe(2);
    expect(lex('De adolescente era tímida.')).toBe(3);
    expect(lex('En el secundario tuve una profesora…')).toBe(3);
    expect(lex('de pibe jugaba al fútbol')).toBe(3);
    expect(lex('De soltera trabajaba en una tienda.')).toBe(4);
    expect(lex('En la colimba conocí a Tito.')).toBe(4);
    expect(lex('en la mili me tocó Melilla')).toBe(4);
    expect(lex('Cuando me fui de casa tenía poco.')).toBe(4);
    expect(lex('Esto no dice nada de etapa.')).toBeNull();
  });
  it('expresiones con la ficha: hijo, oficio, pareja', () => {
    expect(lex('Cuando nació Pablo nos mudamos.')).toBe(7);
    expect(lex('En la época de modista cosía de noche.')).toBe(6);
    expect(lex('Cuando murió Ricardo me quedé sola.')).toBe(5);
  });
  it('gana la primera expresión que aparece', () => {
    expect(lex('En el secundario, no, de chica ya lo sabía.')).toBe(3);
  });
});

describe('personaNombrada y mencionaActividad', () => {
  it('pareja → 5, hijo o nieto → 7, oficio → 6', () => {
    expect(personaNombrada('Con Ricardo fuimos a Mar del Plata.', FICHA)).toBe(5);
    expect(personaNombrada('Juli me hizo reír.', FICHA)).toBe(7);
    expect(personaNombrada('Cosía de modista para afuera.', FICHA)).toBe(6);
    expect(personaNombrada('Una tarde de lluvia.', FICHA)).toBeNull();
  });
  it('los nombres van con mayúscula: "ana" dentro de otra palabra no cuenta', () => {
    expect(personaNombrada('La semana pasada fue lindo.', FICHA)).toBeNull();
  });
  it('actividad por raíz: música / músico, programación / programador', () => {
    expect(mencionaActividad('Soy músico desde chico', 'música')).toBe(true);
    expect(mencionaActividad('trabajo de programador', 'programación')).toBe(true);
    expect(mencionaActividad('juego al fútbol', 'música')).toBe(false);
  });
});
