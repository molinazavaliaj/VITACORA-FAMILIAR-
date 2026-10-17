import { describe, it, expect } from 'vitest';
import { BANCO, fijo, pregunta } from '../src/kids-v2/banco.js';
import { conGenero, esPlural, llenar, normalizarQuienRegala, primerNombre, quedanMarcas } from '../src/kids-v2/texto.js';

describe('kids v2: texto', () => {
  it('{{o/a}} según chico o chica', () => {
    expect(conGenero(pregunta('K10').texto, 'chico')).toBe('Tu mamá. Contame cómo es, y una vez que te cuidó cuando estabas enfermo.');
    expect(conGenero(pregunta('K30').texto, 'chica')).toBe('Decime algo que todavía no te dejan hacer sola y vos ya te sentís lista.');
    expect(conGenero('nervios{{o/a}} y roj{{o/a}}', 'chica')).toBe('nerviosa y roja');
  });

  it('variables {{1}}, {{2}}, {{3}}', () => {
    expect(llenar(fijo('PREG-NUEVA-CHICO').texto, ['Tini'])).toBe('Hola Tini, hay una pregunta esperándote. Tocá el botón y te la mando.');
    expect(llenar(fijo('AVISO-PADRE').texto, ['Laura', 'Tini', 'vitacora.com/panel/tini'])).toContain('en tu panel, en vitacora.com/panel/tini (audios');
  });

  it('si falta una variable, error con su número', () => {
    expect(() => llenar(fijo('BIEN-CHICO').texto, ['Tini'])).toThrow(/\{\{2\}\}/);
    expect(() => llenar('Hola {{1}}', [' '])).toThrow(/\{\{1\}\}/);
  });

  it('quién se lo regala: plural si empieza con "tus"; "Tu"/"Tus" en minúscula; un nombre propio queda', () => {
    expect(esPlural('Tus abuelos')).toBe(true);
    expect(esPlural('tus padrinos')).toBe(true);
    expect(esPlural('Tu mamá')).toBe(false);
    expect(esPlural('Tusnelda')).toBe(false);
    expect(normalizarQuienRegala('Tu mamá')).toBe('tu mamá');
    expect(normalizarQuienRegala('  Tus   papás ')).toBe('tus papás');
    expect(normalizarQuienRegala('Tomás')).toBe('Tomás');
  });

  it('primer nombre para el saludo al padre', () => {
    expect(primerNombre('Laura Gómez')).toBe('Laura');
    expect(primerNombre('  Ana ')).toBe('Ana');
    expect(() => primerNombre('   ')).toThrow();
  });

  it('todos los textos del banco se llenan sin dejar marcas', () => {
    const vars = ['Uno', 'tu mamá', 'tres'];
    for (const t of [...BANCO.mensajes.map((m) => m.texto), ...BANCO.preguntas.flatMap((p) => [p.texto, p.op?.texto ?? '', p.foto?.texto ?? '']), ...BANCO.extras.map((x) => x.texto)]) {
      for (const g of ['chico', 'chica'] as const) expect(quedanMarcas(llenar(conGenero(t, g), vars)), t).toBe(false);
    }
  });
});
