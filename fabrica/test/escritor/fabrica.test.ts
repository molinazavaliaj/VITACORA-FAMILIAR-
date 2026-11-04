// fabrica/test/escritor/fabrica.test.ts
import { describe, expect, it } from 'vitest';
import { leerJSON } from '../../src/escritor/carpeta.js';
import { dudasDelRegistro, validarDudas } from '../../src/escritor/dudas.js';
import { respuestas } from '../../src/escritor/lectura.js';
import { llamadaDisputa, llamadaDudas } from '../../src/escritor/llamadas/fabrica.js';
import { carpetaNelida } from './ayuda.js';

describe('dudas de datos para la familia', () => {
  const c = carpetaNelida();
  const reg = leerJSON(c, 'salidas/registro.json');

  it('salen del registro, sin las que resolvió la ficha, con lo que dijo textual', () => {
    const conResuelta = { ...reg, dudas: [...reg.dudas, { tipo: 'fecha', que: 'el año del casamiento', ids: ['R02'], resuelta_por_ficha: true }] };
    expect(dudasDelRegistro(conResuelta, respuestas(c))).toEqual([
      { id: 'D01', tipo: 'nombre', que: 'No dice el nombre de la Negra', ids: ['R10'], citas: [{ id: 'R10', texto: 'La Negra era mi amiga del barrio. Nos sentábamos en la vereda a tomar mate.' }] },
    ]);
  });

  it('la llamada lleva la ficha, las dudas, el nombre, el idioma de la familia y el esquema', () => {
    const l = llamadaDudas(c, dudasDelRegistro(reg, respuestas(c)));
    expect(l.nombre).toBe('dudas');
    expect(l.docs[0].startsWith('<ficha>')).toBe(true);
    expect(l.docs[1]).toContain('"D01"');
    expect(l.instr).toContain('la familia de Nélida');
    expect(l.instr).toContain('en castellano rioplatense');
    expect(l.instr).toContain('Esquema de salida');
    const ca = carpetaNelida();
    ca.escribir('entradas/ficha.xml', ca.leer('entradas/ficha.xml').replace('</ficha>', 'Idioma del libro: catalán\n</ficha>'));
    expect(llamadaDudas(ca, []).instr).toContain('en catalán');
  });

  // «Para mí» (15/10): el libro es de quien lo compró; las preguntas las lee el mismo que contó.
  it('si el libro es propio, la llamada usa el prompt que le habla a quien narra', () => {
    const dudas = dudasDelRegistro(reg, respuestas(c));
    const propia = llamadaDudas(c, dudas, { propia: true });
    expect(propia.instr).toContain('las preguntas las lee la misma persona que contó');
    expect(propia.instr).toContain('segunda persona');
    expect(propia.instr).not.toContain('la familia de Nélida');
    expect(propia.instr).toContain('en castellano rioplatense');
    expect(propia.instr).toContain('Esquema de salida');
    expect(propia.docs).toEqual(llamadaDudas(c, dudas).docs);
    expect(llamadaDudas(c, dudas, { propia: false }).instr).toContain('la familia de Nélida');
  });

  it('validarDudas exige una pregunta por duda', () => {
    const dudas = dudasDelRegistro(reg, respuestas(c));
    expect(validarDudas(dudas, { dudas: [{ id: 'D01', pregunta: ' ¿Cómo se llamaba la Negra? ', opciones: ['', 'Ofelia'] }] })[0]).toMatchObject({ pregunta: '¿Cómo se llamaba la Negra?', opciones: ['Ofelia'] });
    expect(() => validarDudas(dudas, { dudas: [] })).toThrow(/D01/);
  });
});

describe('disputa y corrección del registro', () => {
  it('la disputa lleva los documentos de los hechos tal cual y la pregunta con sus huecos llenos', () => {
    const docs = ['<guia>\ng\n</guia>', '<registro>\nr\n</registro>'];
    const l = llamadaDisputa(docs, { clave: 'cap_1-2', pieza: 'cap_1', n: 2, frase: 'Raúl tenía la mercería', id: 'R02', cita: 'abrimos la mercería con Raúl' });
    expect(l.nombre).toBe('disputa-cap_1-2');
    expect(l.docs).toBe(docs);
    expect(l.instr).toContain('Frase del libro: "Raúl tenía la mercería". Respuesta R02');
  });
});
