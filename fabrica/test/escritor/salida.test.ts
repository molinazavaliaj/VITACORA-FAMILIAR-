// fabrica/test/escritor/salida.test.ts
import { describe, expect, it } from 'vitest';
import { frasesParaSuVoz, libroParaPlantilla, paraPlantilla } from '../../src/escritor/salida/plantilla.js';
import { armarLibro } from '../../src/escritor/llamadas/codigo.js';
import { construirHtmlLibro } from '../../src/libro/plantilla-html.js';
import { carpetaNelida } from './ayuda.js';

function conLibro(idiomaFicha = '') {
  const c = carpetaNelida();
  if (idiomaFicha) c.escribir('entradas/ficha.xml', c.leer('entradas/ficha.xml').replace('</ficha>', `${idiomaFicha}\n</ficha>`));
  c.escribir('salidas/titulos/cap_1.json', '{"titulo": "La persiana de madera"}');
  c.escribir('salidas/titulos/cap_2.json', '{"titulo": "El bastidor en la falda"}');
  armarLibro(c);
  return c;
}

describe('libro.md → plantilla de producción', () => {
  it('el título va aparte, la primera página sin encabezado y el índice son los capítulos', () => {
    const p = libroParaPlantilla(conLibro().leer('libro.md'));
    expect(p.titulo).toBe('sumá vos');
    expect(p.indice).toEqual(['I · La persiana de madera', 'II · El bastidor en la falda']);
    expect(p.libroMarkdown.startsWith('Soy de Echesortu')).toBe(true);
    expect(() => libroParaPlantilla('sin título')).toThrow(/sin título/);
  });

  it('arma el HTML con el nombre de quien narra y lang="es"', async () => {
    const p = paraPlantilla(conLibro());
    expect(p).toMatchObject({ nombreNarrador: 'Nélida', idioma: 'es' });
    const html = await construirHtmlLibro({ titulo: p.titulo, nombreNarrador: p.nombreNarrador, indice: p.indice, libroMarkdown: p.libroMarkdown, idioma: p.idioma });
    expect(html).toContain('<html lang="es">');
    expect(html).toContain('<div class="sus-frases-titulo">Sus frases</div>');
    expect(html).toContain('El bastidor en la falda');
  });

  it('en castellano de España: lang="es" (no ca) y «Sus frases»', async () => {
    const p = paraPlantilla(conLibro('Idioma del libro: castellano de España'));
    expect(p.idioma).toBe('es');
    const html = await construirHtmlLibro({ titulo: p.titulo, nombreNarrador: p.nombreNarrador, indice: p.indice, libroMarkdown: p.libroMarkdown, idioma: p.idioma });
    expect(html).toContain('<html lang="es">');
    expect(html).not.toContain('lang="ca"');
    expect(html).toContain('<div class="sus-frases-titulo">Sus frases</div>');
  });

  it('en catalán: lang="ca" y «Les seves frases» es la página de frases', async () => {
    const p = paraPlantilla(conLibro('Idioma del libro: catalán'));
    const html = await construirHtmlLibro({ titulo: p.titulo, nombreNarrador: p.nombreNarrador, indice: p.indice, libroMarkdown: p.libroMarkdown, idioma: p.idioma });
    expect(html).toContain('<html lang="ca">');
    expect(html).toContain('<div class="sus-frases-titulo">Les seves frases</div>');
    expect(html).toContain('<div class="sus-frases-hero">«Me gusta el mate amargo, bien caliente»</div>');
  });
});

describe('«Su voz» desde sus_frases.json', () => {
  it('cada frase va al capítulo que la marca (o al último), hasta 3 elegidas, con su respuesta', () => {
    const f = frasesParaSuVoz(conLibro(), { narradorId: 'nar-1', pedidoId: 'ped-1', fuentes: { R07: { respuestaId: 'resp-77', preguntaOrden: 7 } } });
    expect(f).toMatchObject({ version: 1, narrador_id: 'nar-1', pedido_id: 'ped-1', confirmado_at: null });
    expect(f.capitulos.map((x) => [x.numero, x.capitulo, x.candidatas.map((k) => [k.id, k.elegida, k.respuesta_id, k.pregunta_orden])])).toEqual([
      [2, 'II · El bastidor en la falda', [['R07', true, 'resp-77', 7], ['R08', true, null, 0]]],
    ]);
    expect(f.capitulos[0].candidatas[0]).toMatchObject({ texto: 'Me gusta el mate amargo, bien caliente', origen: 'sus-frases', grupo: 'suyas', estado: 'pendiente', audio_path: null, elegida_por: 'modelo' });
  });
});
