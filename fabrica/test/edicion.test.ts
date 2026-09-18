import { describe, it, expect, vi } from 'vitest';
import { leerEdicion, aplicarOrdenCapitulos, aplicarTitulosCapitulos } from '../src/libro/edicion.js';

describe('leerEdicion', () => {
  it('{} → todos los defaults', () => {
    expect(leerEdicion({})).toEqual({ ordenCapitulos: [], titulo: null, subtitulo: null, portadaFotoId: null, titulosCapitulos: {} });
  });

  it('null / undefined / string → defaults, sin tirar', () => {
    for (const valor of [null, undefined, 'hola', 42, []]) {
      expect(leerEdicion(valor)).toEqual({ ordenCapitulos: [], titulo: null, subtitulo: null, portadaFotoId: null, titulosCapitulos: {} });
    }
  });

  it('lee las cinco claves que aplica la fábrica', () => {
    expect(
      leerEdicion({
        ordenCapitulos: ['El amor', 'La infancia'],
        titulo: 'Mi abuela Rosa',
        subtitulo: 'Rosa Pérez',
        portadaFotoId: '0b1c9e2a-1111-4222-8333-944455566677',
        titulosCapitulos: { 'Los hijos': 'Los hermanos' },
      })
    ).toEqual({
      ordenCapitulos: ['El amor', 'La infancia'],
      titulo: 'Mi abuela Rosa',
      subtitulo: 'Rosa Pérez',
      portadaFotoId: '0b1c9e2a-1111-4222-8333-944455566677',
      titulosCapitulos: { 'Los hijos': 'Los hermanos' },
    });
  });

  it('titulosCapitulos: recorta espacios y descarta los vacíos y los que no son texto, sin tirar', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(
      leerEdicion({ titulosCapitulos: { 'Los hijos': '  Los hermanos ', 'El amor': '   ', 'El trabajo': 7, 'La infancia': null } })
        .titulosCapitulos
    ).toEqual({ 'Los hijos': 'Los hermanos' });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('titulosCapitulos que no es un objeto se ignora con aviso', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(leerEdicion({ titulosCapitulos: ['Los hermanos'] }).titulosCapitulos).toEqual({});
    expect(leerEdicion({ titulosCapitulos: 'Los hermanos' }).titulosCapitulos).toEqual({});
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it('un valor con tipo inesperado se descarta (default) y se loguea, sin tirar', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const edicion = leerEdicion({ ordenCapitulos: 'La infancia', titulo: 7, subtitulo: ['x'], portadaFotoId: 12 });
    expect(edicion).toEqual({ ordenCapitulos: [], titulo: null, subtitulo: null, portadaFotoId: null, titulosCapitulos: {} });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('ordenCapitulos con elementos que no son string: se filtran', () => {
    expect(leerEdicion({ ordenCapitulos: ['A', 3, null, 'B'] }).ordenCapitulos).toEqual(['A', 'B']);
  });

  it('strings vacíos o solo espacios en titulo/subtitulo cuentan como null', () => {
    expect(leerEdicion({ titulo: '   ', subtitulo: '' })).toEqual({ ordenCapitulos: [], titulo: null, subtitulo: null, portadaFotoId: null, titulosCapitulos: {} });
  });

  it('ignora excluidas y correcciones (decisión de Naza 13/09) y claves desconocidas', () => {
    const edicion = leerEdicion({ excluidas: ['r1'], correcciones: 'cambiá Rosana por Rosa', loQueSea: 1 });
    expect(edicion).toEqual({ ordenCapitulos: [], titulo: null, subtitulo: null, portadaFotoId: null, titulosCapitulos: {} });
    expect('excluidas' in edicion).toBe(false);
  });
});

describe('aplicarOrdenCapitulos', () => {
  const capitulos = [
    { nombre: 'La infancia', ordenes: [1, 2] },
    { nombre: 'El amor', ordenes: [3] },
    { nombre: 'El trabajo', ordenes: [4] },
  ];

  it('sin orden → los mismos capítulos en el mismo orden', () => {
    expect(aplicarOrdenCapitulos(capitulos, [])).toEqual(capitulos);
  });

  it('reordena por nombre; los no nombrados van al final en su orden original', () => {
    expect(aplicarOrdenCapitulos(capitulos, ['El trabajo']).map((c) => c.nombre)).toEqual([
      'El trabajo',
      'La infancia',
      'El amor',
    ]);
  });

  it('nombres que no existen se ignoran; repetidos cuentan una vez', () => {
    expect(aplicarOrdenCapitulos(capitulos, ['Nada', 'El amor', 'El amor']).map((c) => c.nombre)).toEqual([
      'El amor',
      'La infancia',
      'El trabajo',
    ]);
  });

  it('no muta la lista original', () => {
    const copia = structuredClone(capitulos);
    aplicarOrdenCapitulos(capitulos, ['El amor']);
    expect(capitulos).toEqual(copia);
  });
});

describe('aplicarTitulosCapitulos', () => {
  const capitulos = [
    { nombre: 'La infancia', ordenes: [1, 2] },
    { nombre: 'Los hijos', ordenes: [19, 20, 21] },
  ];

  it('sin títulos → los mismos capítulos, cada uno con nombreGuion = nombre', () => {
    expect(aplicarTitulosCapitulos(capitulos, {})).toEqual([
      { nombre: 'La infancia', ordenes: [1, 2], nombreGuion: 'La infancia' },
      { nombre: 'Los hijos', ordenes: [19, 20, 21], nombreGuion: 'Los hijos' },
    ]);
  });

  it('renombra por nombre del guion y guarda el original en nombreGuion; el resto queda igual', () => {
    expect(aplicarTitulosCapitulos(capitulos, { 'Los hijos': 'Los hermanos', 'No existe': 'Nada' })).toEqual([
      { nombre: 'La infancia', ordenes: [1, 2], nombreGuion: 'La infancia' },
      { nombre: 'Los hermanos', ordenes: [19, 20, 21], nombreGuion: 'Los hijos' },
    ]);
  });

  it('no muta la lista original', () => {
    const copia = structuredClone(capitulos);
    aplicarTitulosCapitulos(capitulos, { 'Los hijos': 'Los hermanos' });
    expect(capitulos).toEqual(copia);
  });
});
