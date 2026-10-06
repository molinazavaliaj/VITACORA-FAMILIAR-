import { describe, expect, it } from 'vitest';
import { Carpeta } from '../../src/escritor/carpeta.js';
import { controlar } from '../../src/escritor/controles/correr.js';
import { ficha, idioma, nombreDePila, respuestas } from '../../src/escritor/lectura.js';
import { agregarConfirmados, materialACarpeta } from '../../src/escritor/material/a-carpeta.js';
import { fichaXml } from '../../src/escritor/material/ficha-xml.js';
import type { FichaEntrevista } from '../../src/v3/entrevista/texto.js';
import { carpetaNelida } from './ayuda.js';

const elvira: FichaEntrevista = { nombre: 'Elvira', apodo: 'Vira', genero: 'mujer', anioNacimiento: 1950, paisNacimiento: 'Argentina', paisResidencia: 'Argentina', destinatarios: 'sus nietos', hijos: [{ nombre: 'Laura' }, { nombre: 'Pablo' }], hermanos: 'no-tiene' };

describe('ficha.xml desde la ficha V3', () => {
  it('castellano rioplatense: vos, y los datos que hay', () => {
    expect(fichaXml(elvira)).toBe([
      '<ficha>',
      'Nombre: Elvira (le dicen Vira)',
      'Género: mujer',
      'Año de nacimiento: 1950',
      'Trato: vos',
      'Idioma del libro: castellano',
      'Para quién es el libro: sus nietos',
      'País donde nació: Argentina',
      'País donde vive: Argentina',
      'Hijos: Laura, Pablo',
      'Hermanos: no tiene',
      'Parejas: (no se cargó)',
      '(El resto de la ficha no se cargó: sale de sus respuestas.)',
      '</ficha>',
    ].join('\n'));
  });

  it('catalán y castellano de España: el escritor lee el idioma y el nombre de la ficha', () => {
    const c = new Carpeta({ 'entradas/ficha.xml': fichaXml({ ...elvira, idioma: 'ca' }) });
    expect(idioma(c)).toBe('ca');
    expect(nombreDePila(c)).toBe('Elvira');
    expect(fichaXml({ ...elvira, idioma: 'ca' })).toContain('Trato: tu\nIdioma del libro: catalán');
    const e = new Carpeta({ 'entradas/ficha.xml': fichaXml({ ...elvira, idioma: 'es-ES' }) });
    expect(idioma(e)).toBe('es');
    expect(fichaXml({ ...elvira, idioma: 'es-ES' })).toContain('Trato: tu\nIdioma del libro: castellano de España');
  });
});

describe('materialACarpeta', () => {
  it('escribe respuestas (sin las "paso"), etiquetas y ficha', () => {
    const c = new Carpeta();
    const r = materialACarpeta(c, { estado: { ficha: elvira, respuestas: [['CA2', 'Mi mamá cosía para afuera y cantaba tangos.'], ['CA17', 'Paso.']] } });
    expect(r.descartadas).toEqual(['R02']);
    expect(respuestas(c).map((x) => x.id)).toEqual(['R01']);
    expect(respuestas(c)[0].texto).toBe('Mi mamá cosía para afuera y cantaba tangos.');
    expect(JSON.parse(c.leer('entradas/etiquetas.json')).map((x: { id: string; paso: boolean }) => [x.id, x.paso])).toEqual([['R01', false], ['R02', true]]);
    expect(c.leer('entradas/ficha.xml')).toBe(fichaXml(elvira));
    expect(c.existe('entradas/confirmado.xml')).toBe(false);
  });
});

describe('agregarConfirmados (las correcciones de la familia)', () => {
  it('suman un bloque a confirmado.xml, una vez, y C14 pide que el registro las tenga', () => {
    const c = carpetaNelida();
    expect(agregarConfirmados(c, [{ texto: 'La Negra se llamaba Ofelia Sánchez.', dudaId: 'D01' }, { texto: '  ' }])).toBe(true);
    expect(agregarConfirmados(c, [{ texto: 'La Negra se llamaba Ofelia Sánchez.', dudaId: 'D01' }])).toBe(false);
    expect(c.leer('entradas/confirmado.xml')).toBe('(Correcciones de la familia antes de escribir el libro. Mandan sobre las respuestas.)\n- La Negra se llamaba Ofelia Sánchez.\n');
    expect(ficha(c)).toContain('<confirmado_por_el_narrador>\n(Correcciones de la familia');
    expect(controlar(c, 'registro').resumen).toContain('C14: hay 1 confirmados en la ficha y el registro tiene 0');
  });
});
