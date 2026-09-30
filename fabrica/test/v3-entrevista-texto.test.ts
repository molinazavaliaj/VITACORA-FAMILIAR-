import { describe, it, expect } from 'vitest';
import { preguntaPorId, mensajePorId } from '../src/v3/entrevista/banco.js';
import { renderizar, idsEnVariantes, tratoMasculino } from '../src/v3/entrevista/texto.js';

const texto = (id: string) => preguntaPorId(id)!.texto;
const varon = { nombre: 'Rogelio', genero: 'varon' as const };
const mujer = { nombre: 'Elvira', genero: 'mujer' as const };

describe('entrevista: renderizar', () => {
  it('{{o/a}} según el género', () => {
    expect(renderizar(texto('CA13'), varon)).toContain('la primera vez que saliste solo:');
    expect(renderizar(texto('CA13'), mujer)).toContain('la primera vez que saliste sola:');
    expect(renderizar(texto('CA6'), mujer)).toContain('¿con cuál eras más cercana de chica?');
  });

  it('{{padre/madre}} según el género', () => {
    expect(renderizar(texto('HI1'), varon)).toContain('ibas a ser padre por primera vez');
    expect(renderizar(texto('HI5'), mujer)).toBe(
      'Ser madre también tiene sus tiempos duros. ¿Cuál fue la época más difícil para vos como madre? Qué pasaba, cómo la fuiste llevando, y un día de esa época que te haya marcado.',
    );
  });

  it('género "otro": la forma de trato decide; sin forma de trato, femenino', () => {
    expect(tratoMasculino({ genero: 'otro', formaTrato: 'masculino' })).toBe(true);
    expect(tratoMasculino({ genero: 'otro', formaTrato: 'femenino' })).toBe(false);
    expect(tratoMasculino({ genero: 'otro' })).toBe(false);
    expect(renderizar('chic{{o/a}}', { nombre: 'Alex', genero: 'otro', formaTrato: 'masculino' })).toBe('chico');
  });

  it('{{nombre}}, {{quien_regala}} y {{etapa}}; lo que no tiene valor queda a la vista', () => {
    expect(renderizar(texto('FO1'), mujer)).toMatch(/^Otra cosa, Elvira\./); // desde la ronda 3 del 30/09 (antes "Una última cosa")
    expect(renderizar(mensajePorId('M9')!.texto, { ...mujer, quienRegala: 'Lucía' })).toMatch(/^Hola, Lucía\. Te aviso que Elvira hace una semana/);
    expect(renderizar(mensajePorId('M9')!.texto, mujer)).toMatch(/^Hola, \{\{quien_regala\}\}\./);
    expect(renderizar(mensajePorId('M10')!.texto, mujer)).toBe('Terminamos esta etapa, Elvira. Pasamos a la siguiente.');
    expect(renderizar(mensajePorId('M10')!.texto, mujer)).not.toContain('{{etapa}}'); // 30/09: M10 ya no usa {{etapa}}
  });

  it('AM7: "repite" si AM9 fue un "no" corto; "repetía" si contó un final, dijo "paso" o no hay respuesta', () => {
    const am7 = texto('AM7');
    expect(idsEnVariantes(am7)).toEqual(['AM9']);
    const con = (am9?: string) => renderizar(am7, mujer, am9 === undefined ? undefined : new Map([['AM9', am9]]));
    expect(con('No, seguimos juntos.')).toBe(
      'Contame algo muy de esa persona: una frase que repite, una costumbre, una manía. Y una vez puntual en que salió eso, para que quien lea la tenga enfrente.',
    );
    expect(con('Nos separamos hace muchos años, después de una época difícil para los dos.')).toContain('una frase que repetía, una costumbre');
    expect(con('paso')).toContain('una frase que repetía,');
    expect(con()).toContain('una frase que repetía,');
  });

  it('ningún texto del banco queda con marcas de género ni variantes sin resolver', () => {
    for (const id of ['CA2', 'AM7', 'HI5', 'HS1', 'GI9', 'FI1', 'LE2']) {
      const t = renderizar(texto(id), varon, new Map([['AM9', 'No.']]));
      expect(t, id).not.toMatch(/\{\{|«|»/);
    }
  });
});
