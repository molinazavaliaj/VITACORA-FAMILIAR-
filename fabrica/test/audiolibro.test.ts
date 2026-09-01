import { describe, it, expect } from 'vitest';
import { armarListaConcat } from '../src/audio/audiolibro.js';

describe('armarListaConcat', () => {
  it('respeta el orden: dia_NN.ogg antes que dia_NN_2.ogg, ordenes en el orden de la estructura', () => {
    const estructura = {
      capitulos: [{ nombre: 'Infancia', ordenes: [4] }],
    };
    // El archivo _2 aparece ANTES en la lista de Storage a propósito — el
    // orden final tiene que venir de la lógica, no de cómo Storage devolvió
    // los nombres.
    const archivos = ['dia_04_2.ogg', 'dia_04.ogg', 'otro-narrador/dia_04.ogg'];

    const resultado = armarListaConcat(estructura, archivos);

    expect(resultado).toEqual([
      { capitulo: 'Infancia', numero: 1, archivos: ['dia_04.ogg', 'dia_04_2.ogg'] },
    ]);
  });

  it('concatena los archivos de varias órdenes de un capítulo en el orden de las órdenes', () => {
    const estructura = {
      capitulos: [{ nombre: 'Infancia', ordenes: [1, 2] }],
    };
    const archivos = ['dia_02.ogg', 'dia_01.ogg', 'dia_01_2.ogg'];

    const resultado = armarListaConcat(estructura, archivos);

    expect(resultado).toEqual([
      { capitulo: 'Infancia', numero: 1, archivos: ['dia_01.ogg', 'dia_01_2.ogg', 'dia_02.ogg'] },
    ]);
  });

  it('numera los capítulos en el orden de la estructura, empezando en 1', () => {
    const estructura = {
      capitulos: [
        { nombre: 'Infancia', ordenes: [1] },
        { nombre: 'El amor', ordenes: [2] },
      ],
    };
    const archivos = ['dia_01.ogg', 'dia_02.ogg'];

    const resultado = armarListaConcat(estructura, archivos);

    expect(resultado).toEqual([
      { capitulo: 'Infancia', numero: 1, archivos: ['dia_01.ogg'] },
      { capitulo: 'El amor', numero: 2, archivos: ['dia_02.ogg'] },
    ]);
  });

  it('omite las órdenes sin ningún audio disponible, sin tirar', () => {
    const estructura = {
      capitulos: [{ nombre: 'Infancia', ordenes: [1, 2, 3] }],
    };
    // Orden 2 no tiene audio (por ejemplo, respondió por texto).
    const archivos = ['dia_01.ogg', 'dia_03.ogg'];

    const resultado = armarListaConcat(estructura, archivos);

    expect(resultado).toEqual([
      { capitulo: 'Infancia', numero: 1, archivos: ['dia_01.ogg', 'dia_03.ogg'] },
    ]);
  });

  it('un capítulo sin ningún audio queda con archivos: []', () => {
    const estructura = {
      capitulos: [{ nombre: 'Infancia', ordenes: [1] }],
    };

    const resultado = armarListaConcat(estructura, []);

    expect(resultado).toEqual([{ capitulo: 'Infancia', numero: 1, archivos: [] }]);
  });

  it('no confunde dia_1.ogg con dia_10.ogg ni con dia_04.ogg', () => {
    const estructura = {
      capitulos: [{ nombre: 'Infancia', ordenes: [4] }],
    };
    const archivos = ['dia_1.ogg', 'dia_10.ogg', 'dia_04.ogg', 'dia_040.ogg'];

    const resultado = armarListaConcat(estructura, archivos);

    expect(resultado).toEqual([{ capitulo: 'Infancia', numero: 1, archivos: ['dia_04.ogg'] }]);
  });

  it('ordena por sufijo numérico, no alfabéticamente (dia_04_10.ogg después de dia_04_2.ogg)', () => {
    const estructura = {
      capitulos: [{ nombre: 'Infancia', ordenes: [4] }],
    };
    const archivos = ['dia_04_10.ogg', 'dia_04.ogg', 'dia_04_2.ogg'];

    const resultado = armarListaConcat(estructura, archivos);

    expect(resultado).toEqual([
      { capitulo: 'Infancia', numero: 1, archivos: ['dia_04.ogg', 'dia_04_2.ogg', 'dia_04_10.ogg'] },
    ]);
  });
});
