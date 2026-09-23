import { describe, it, expect } from 'vitest';
import { parsearPaginas, armarLibro, controlarLibro } from '../src/libro/paginas.js';
import { seccionesDelLibro } from '../src/libro/frases.js';

// El editor v2 (biógrafo v2, 23/09). El de hoy relee el libro ENTERO y lo reescribe con una
// instrucción de una oración y sin reglas (USD 2,08 por libro), elige los títulos que quiere —y
// en el libro de Joaquín eligió unos que el lector de «Sus frases» no reconoce: las 5 frases
// heredadas y las muletillas se perdieron—. El v2 no toca los capítulos: escribe lo que falta y
// el código arma el libro con títulos fijos. Las frases que no estén textuales en sus audios, se
// caen.

const TRANSCRIPCIONES = [
  'Mi vieja siempre decía ¿quién se sacó diez? cuando alguien traía un nueve.',
  'Yo siempre digo que hay que confiar en el proceso, mirá. Viste cómo es.',
];

describe('parsearPaginas', () => {
  it('deja solo las frases que están textuales en sus respuestas y anota las que se cayeron', () => {
    const r = parsearPaginas(JSON.stringify({
      apertura: 'Esto lo cuento para ustedes.',
      cierre: 'Y eso fue todo, por ahora.',
      suyas: ['hay que confiar en el proceso', 'la vida es un viaje hermoso'],
      heredadas: [{ frase: '¿Quién se sacó diez?', quien: 'mi vieja' }],
      muletillas: ['mirá', 'viste', 'obvio'],
    }), TRANSCRIPCIONES);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.paginas.suyas).toEqual(['hay que confiar en el proceso']);
    expect(r.paginas.heredadas).toEqual([{ frase: '¿Quién se sacó diez?', quien: 'mi vieja' }]);
    expect(r.paginas.muletillas).toEqual(['mirá', 'viste']);
    expect(r.caidas).toEqual(['la vida es un viaje hermoso', 'obvio']);
  });

  it('si no es JSON, no inventa: devuelve que no pudo', () => {
    expect(parsearPaginas('hola', TRANSCRIPCIONES).ok).toBe(false);
  });
});

describe('armarLibro', () => {
  it('arma el libro con títulos fijos que el lector de «Sus frases» entiende', () => {
    const md = armarLibro(
      { apertura: 'Apertura.', cierre: 'Cierre.', suyas: ['hay que confiar en el proceso'], heredadas: [{ frase: '¿Quién se sacó diez?', quien: 'mi vieja' }], muletillas: ['mirá'] },
      [{ nombre: 'La infancia', texto: 'Texto.\n\n> Una cita suya.' }, { nombre: 'El oficio', texto: 'Más texto.' }],
    );
    const s = seccionesDelLibro(md);
    // Solo los capítulos de verdad: ni la apertura, ni el cierre, ni los subtítulos de «Sus frases».
    expect(s.capitulos.map((c) => c.nombre)).toEqual(['La infancia', 'El oficio']);
    expect(s.capitulos[0].citas).toEqual(['Una cita suya.']);
    expect(s.susFrases.suyas).toEqual(['hay que confiar en el proceso']);
    expect(s.susFrases.heredadas).toEqual(['¿Quién se sacó diez?']);
    expect(s.muletillas).toEqual(['mirá']);
  });
});

describe('controlarLibro', () => {
  const fuentes = [{ id: 'a', texto: 'Yo era chica en Tucumán y jugaba en el patio de la abuela con mis primas todas las tardes.' }];

  it('sin problemas, sin avisos', () => {
    const r = controlarLibro([{ nombre: 'La infancia', texto: 'Cuando era chica en Tucumán jugaba en el patio de la abuela con mis primas todas las tardes.' }], fuentes, 'mujer');
    expect(r.avisos).toEqual([]);
  });

  it('avisa si el libro habla en el género equivocado', () => {
    const r = controlarLibro([{ nombre: 'La infancia', texto: 'De chico jugaba en el patio de la abuela en Tucumán con mis primas todas las tardes.' }], fuentes, 'mujer');
    expect(r.avisos.join(' ')).toMatch(/masculino/);
  });

  it('avisa si se repite entre capítulos o si hay mucho sin respaldo en los audios', () => {
    const t = 'Jugaba en el patio de la abuela en Tucumán con mis primas todas las tardes.';
    const r = controlarLibro([{ nombre: 'A', texto: t }, { nombre: 'B', texto: t }], fuentes, null);
    expect(r.avisos.join(' ')).toMatch(/repite/);
    const inventado = controlarLibro([{ nombre: 'A', texto: 'Viajamos a París en un globo aerostático rojo con mi primo Esteban.' }], fuentes, null);
    expect(inventado.avisos.join(' ')).toMatch(/respaldo/);
  });
});
