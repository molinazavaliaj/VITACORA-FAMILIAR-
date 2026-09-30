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
    expect(renderizar(texto('CA6'), mujer)).toContain('contame con cuál eras más cercana de chica y alguna aventura'); // texto de las simulaciones (Naza, 30/09)
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

  // Desde la prueba de Naza en la página (30/09) la variante mira AMH ("¿esa persona sigue hoy a tu lado?"), no AM9.
  it('AM7: "repetía" si AMH fue un "no" (ya no está); "repite" si sigue o no hay respuesta', () => {
    const am7 = texto('AM7');
    expect(idsEnVariantes(am7)).toEqual(['AMH']);
    const con = (amh?: string) => renderizar(am7, mujer, amh === undefined ? undefined : new Map([['AMH', amh]]));
    expect(con('Sí, seguimos juntos.')).toBe(
      'Contame algo muy de esa persona: una frase que repite, una costumbre, una manía. Y una vez puntual en que salió eso, para que quien lea la tenga enfrente.',
    );
    expect(con('No, ya no.')).toContain('una frase que repetía, una costumbre');
    expect(con('Ya no, nos separamos hace muchos años.')).toContain('una frase que repetía,');
    expect(con()).toContain('una frase que repite,');
  });

  it('ningún texto del banco queda con marcas de género ni variantes sin resolver', () => {
    for (const id of ['CA2', 'AM7', 'HI5', 'HS1', 'GI9', 'FI1', 'LE2']) {
      const t = renderizar(texto(id), varon, new Map([['AMH', 'No.']]));
      expect(t, id).not.toMatch(/\{\{|«|»/);
    }
  });
});
