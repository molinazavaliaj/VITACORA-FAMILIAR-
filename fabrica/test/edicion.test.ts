import { describe, it, expect, vi } from 'vitest';
import { leerEdicion, aplicarOrdenCapitulos, aplicarTitulosCapitulos, seccionCorrecciones, sinExcluidas, sinOrdenesExcluidas, ampliarExcluidas } from '../src/libro/edicion.js';

describe('leerEdicion', () => {
  it('{} → todos los defaults', () => {
    expect(leerEdicion({})).toEqual({ ordenCapitulos: [], titulo: null, subtitulo: null, portadaFotoId: null, titulosCapitulos: {}, excluidas: [], correcciones: null });
  });

  it('null / undefined / string → defaults, sin tirar', () => {
    for (const valor of [null, undefined, 'hola', 42, []]) {
      expect(leerEdicion(valor)).toEqual({ ordenCapitulos: [], titulo: null, subtitulo: null, portadaFotoId: null, titulosCapitulos: {}, excluidas: [], correcciones: null });
    }
  });

  it('lee las siete claves que aplica la fábrica', () => {
    expect(
      leerEdicion({
        ordenCapitulos: ['El amor', 'La infancia'],
        titulo: 'Mi abuela Rosa',
        subtitulo: 'Rosa Pérez',
        portadaFotoId: '0b1c9e2a-1111-4222-8333-944455566677',
        titulosCapitulos: { 'Los hijos': 'Los hermanos' },
        excluidas: ['r1', 'r2'],
        correcciones: 'Mi hermana se llama Rosa, no Rosana.',
      })
    ).toEqual({
      ordenCapitulos: ['El amor', 'La infancia'],
      titulo: 'Mi abuela Rosa',
      subtitulo: 'Rosa Pérez',
      portadaFotoId: '0b1c9e2a-1111-4222-8333-944455566677',
      titulosCapitulos: { 'Los hijos': 'Los hermanos' },
      excluidas: ['r1', 'r2'],
      correcciones: 'Mi hermana se llama Rosa, no Rosana.',
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
    expect(edicion).toEqual({ ordenCapitulos: [], titulo: null, subtitulo: null, portadaFotoId: null, titulosCapitulos: {}, excluidas: [], correcciones: null });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('ordenCapitulos con elementos que no son string: se filtran', () => {
    expect(leerEdicion({ ordenCapitulos: ['A', 3, null, 'B'] }).ordenCapitulos).toEqual(['A', 'B']);
  });

  it('strings vacíos o solo espacios en titulo/subtitulo cuentan como null', () => {
    expect(leerEdicion({ titulo: '   ', subtitulo: '' })).toEqual({ ordenCapitulos: [], titulo: null, subtitulo: null, portadaFotoId: null, titulosCapitulos: {}, excluidas: [], correcciones: null });
  });

  it('ignora claves desconocidas', () => {
    const edicion = leerEdicion({ loQueSea: 1 });
    expect('loQueSea' in edicion).toBe(false);
  });

  // D1 (25/09): lo que la familia excluye o corrige en el tablero llega al libro.
  it('excluidas: solo textos no vacíos, sin repetidos; lo que no es lista se ignora con aviso', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(leerEdicion({ excluidas: ['r1', 3, '', ' r2 ', 'r1', null] }).excluidas).toEqual(['r1', 'r2']);
    expect(leerEdicion({ excluidas: 'r1' }).excluidas).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('correcciones: texto recortado; vacío o no-texto → null', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(leerEdicion({ correcciones: '  Rosa, no Rosana.  ' }).correcciones).toBe('Rosa, no Rosana.');
    expect(leerEdicion({ correcciones: '   ' }).correcciones).toBeNull();
    expect(leerEdicion({ correcciones: 42 }).correcciones).toBeNull();
    warn.mockRestore();
  });
});

describe('seccionCorrecciones', () => {
  it('con texto: la sección para el prompt, en un párrafo propio', () => {
    expect(seccionCorrecciones('Mi hermana es Rosa.')).toBe(
      '\n\nCORRECCIONES DE LA FAMILIA (mandan sobre lo que se transcribió; aplicalas donde corresponda, sin inventar nada más): Mi hermana es Rosa.'
    );
  });

  it('vacío, espacios o null: no agrega nada', () => {
    for (const v of [null, undefined, '', '   ']) expect(seccionCorrecciones(v)).toBe('');
  });
});

describe('sinExcluidas', () => {
  it('saca las respuestas cuyo id está en excluidas; sin excluidas devuelve todas', () => {
    const rs = [{ id: 'r1' }, { id: 'r2' }, { id: 'r3' }];
    expect(sinExcluidas(rs, ['r2']).map((r) => r.id)).toEqual(['r1', 'r3']);
    expect(sinExcluidas(rs, [])).toEqual(rs);
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

describe('sinOrdenesExcluidas', () => {
  const capitulos = [
    { nombre: 'La infancia', ordenes: [1, 2] },
    { nombre: 'El amor', ordenes: [3] },
    { nombre: 'Los nietos', ordenes: [9] },
  ];
  const respuestas = [
    { id: 'r1', pregunta_orden: 1 },
    { id: 'r2', pregunta_orden: 2 },
    { id: 'r2b', pregunta_orden: 2 },
    { id: 'r3', pregunta_orden: 3 },
  ];

  it('saca la orden con todas sus respuestas excluidas y el capítulo que queda vacío; una a medias queda', () => {
    expect(sinOrdenesExcluidas(capitulos, respuestas, ['r1', 'r2', 'r3'])).toEqual([
      { nombre: 'La infancia', ordenes: [2] },
      { nombre: 'Los nietos', ordenes: [9] },
    ]);
  });

  it('una orden sin respuestas propias queda (puede recibir un recuerdo de otro tema); sin excluidas, igual', () => {
    expect(sinOrdenesExcluidas(capitulos, respuestas, [])).toEqual(capitulos);
    expect(sinOrdenesExcluidas(capitulos, respuestas, ['otra'])).toEqual(capitulos);
  });
});

describe('ampliarExcluidas', () => {
  // El tablero muestra una fila por pregunta (la respuesta principal, sin repreguntas): destildarla
  // es sacar esa pregunta entera, con sus repreguntas.
  const respuestas = [
    { id: 'r1', pregunta_orden: 1, es_repregunta: false },
    { id: 'r1b', pregunta_orden: 1, es_repregunta: true },
    { id: 'r1c', pregunta_orden: 1, es_repregunta: true },
    { id: 'r2', pregunta_orden: 2, es_repregunta: false },
    { id: 'r2b', pregunta_orden: 2, es_repregunta: true },
  ];

  it('una principal excluida se lleva sus repreguntas; una repregunta excluida sola, solo ella', () => {
    expect(ampliarExcluidas(respuestas, ['r1']).sort()).toEqual(['r1', 'r1b', 'r1c']);
    expect(ampliarExcluidas(respuestas, ['r2b'])).toEqual(['r2b']);
  });

  it('sin excluidas, nada; un id que no es de ninguna respuesta queda tal cual', () => {
    expect(ampliarExcluidas(respuestas, [])).toEqual([]);
    expect(ampliarExcluidas(respuestas, ['otra'])).toEqual(['otra']);
  });
});
