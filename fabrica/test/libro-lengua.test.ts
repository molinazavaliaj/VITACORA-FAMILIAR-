import { describe, expect, it } from 'vitest';
import { construirHtmlLibro, seccionFrasesHtml } from '../src/libro/plantilla-html.js';
import { tratoDelLibro } from '../src/escritor/produccion/html.js';
import { trato } from '../src/escritor/lectura.js';
import { Carpeta } from '../src/escritor/carpeta.js';
import type { FrasesJson } from '../src/libro/frases.js';

// Los textos fijos del cuerpo del libro (Sus frases, Su voz, colofón) por lengua
// (Naza, 13/10): de vos para acá, de tú para España y en catalán el libro en catalán.

const LIBRO = '# La infancia\n\nNací en 1940.\n\n# Sus frases\n\n> Todo pasa.\n\n> Nada queda.\n';
const construir = (o: Partial<Parameters<typeof construirHtmlLibro>[0]> = {}) =>
  construirHtmlLibro({ titulo: 'Rosa', nombreNarrador: 'Rosa', indice: ['La infancia'], libroMarkdown: LIBRO, ...o });

const FRASES = {
  capitulos: [{ numero: 1, capitulo: 'La infancia', candidatas: [{ id: 'c01-01', texto: 'Todo pasa.', elegida: true, estado: 'cortada', audio_path: 'n/frases/c01-01.mp3' }] }],
} as unknown as FrasesJson;

describe('textos fijos del libro por lengua', () => {
  it('sin trato (flujo viejo, Argentina): de vos, como siempre', async () => {
    const html = await construir();
    expect(html).toContain('Este libro fue contado por');
    expect(html).toContain('«Acá adentro están todos vivos.»');
  });

  it('España: de tú', async () => {
    const html = await construir({ trato: 'tu' });
    expect(html).toContain('«Aquí dentro están todos vivos.»');
    expect(html).not.toContain('Acá');
    const voz = await seccionFrasesHtml({ frases: FRASES, urlCliente: 'https://x/voz/t', lengua: 'es-ES' });
    expect(voz).toContain('Aquí están sus frases, tal como las dijo. Apunta el teléfono al código de una y la escuchas.');
    expect(voz).toContain('Escúchala');
  });

  it('catalán: todo en catalán', async () => {
    const html = await construir({ idioma: 'ca', trato: 'tu' });
    expect(html).toContain('Aquest llibre el va explicar');
    expect(html).toContain('amb la seva pròpia veu, i el va guardar per sempre');
    expect(html).toContain('«Aquí dins hi són tots vius.»');
    expect(html).not.toContain('Este libro fue contado por');
    const voz = await seccionFrasesHtml({ frases: FRASES, urlCliente: 'https://x/voz/t', lengua: 'ca' });
    expect(voz).toContain('data-etiqueta="La seva veu"');
    expect(voz).toContain('Escolta-la');
    expect(voz).toContain('El llibre sencer, amb la seva veu');
  });

  it('Argentina en Su voz: de vos', async () => {
    const voz = await seccionFrasesHtml({ frases: FRASES, urlCliente: 'https://x/voz/t' });
    expect(voz).toContain('Apuntá el teléfono');
    expect(voz).toContain('Escuchala');
  });

  it('el trato sale de la entrevista (imprenta) o de la ficha (escritor)', () => {
    expect(tratoDelLibro('es-ES')).toBe('tu');
    expect(tratoDelLibro('ca')).toBe('tu');
    expect(tratoDelLibro('es-AR')).toBe('vos');
    expect(tratoDelLibro(null)).toBe('vos');
    const c = new Carpeta();
    c.escribir('entradas/ficha.xml', '<ficha>\nNombre: Rosa\nTrato: tu\nIdioma del libro: castellano de España\n</ficha>');
    expect(trato(c)).toBe('tu');
    c.escribir('entradas/ficha.xml', '<ficha>\nNombre: Rosa\nTrato: vos\n</ficha>');
    expect(trato(c)).toBe('vos');
  });
});

describe('el álbum de fotos del final (02/11)', () => {
  const foto = (n: number) => ({ dataUri: `data:image/jpeg;base64,FOTO${n}`, epigrafe: n === 0 ? 'En el puerto' : null });

  it('de a cuatro por página, con su título y el epígrafe, después del texto y antes del colofón', async () => {
    const html = await construir({ album: Array.from({ length: 6 }, (_, i) => foto(i)) });
    expect(html.match(/class="lienzo foto album quiebre"/g)).toHaveLength(2);
    expect(html.match(/class="album-celda"/g)).toHaveLength(6);
    expect(html).toContain('<span>Álbum de fotos</span>');
    expect(html).toContain('<figcaption class="album-epigrafe">En el puerto</figcaption>');
    expect(html.indexOf('FOTO5')).toBeGreaterThan(html.indexOf('La infancia'));
    expect(html.indexOf('FOTO5')).toBeLessThan(html.indexOf('class="lienzo colofon'));
  });

  it('en catalán, «Àlbum de fotos»; con fotosPorPaginaAlbum, otra cantidad por página', async () => {
    const html = await construir({ idioma: 'ca', album: Array.from({ length: 6 }, (_, i) => foto(i)), fotosPorPaginaAlbum: 6 });
    expect(html).toContain('<span>Àlbum de fotos</span>');
    expect(html.match(/class="lienzo foto album quiebre"/g)).toHaveLength(1);
  });

  it('sin fotos no hay álbum', async () => {
    expect(await construir({ album: [] })).not.toContain('class="album-celda');
    expect(await construir()).not.toContain('class="album-celda');
  });
});
