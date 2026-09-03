import { describe, it, expect } from 'vitest';
import { construirHtmlLibro } from '../src/libro/plantilla-html.js';

const LIBRO_MARKDOWN = `# A mis lectores

Esto es lo que les quiero contar.

# Infancia

Nací en Rosario, en la casa de mi abuela.

> Cortito y verdadero, así viví.

# El amor

La conocí bailando un sábado.

# Sus frases

> Al mal tiempo, buena cara.

# Para cerrar

Gracias por escucharme.`;

function construir(overrides: Partial<Parameters<typeof construirHtmlLibro>[0]> = {}) {
  return construirHtmlLibro({
    titulo: 'Roberto — La historia de una vida',
    anioNacimiento: 1945,
    fotoUrl: 'https://x/foto.jpg',
    indice: ['Infancia', 'El amor'],
    libroMarkdown: LIBRO_MARKDOWN,
    saludos: [
      { nombre: 'Marta', vinculo: 'hija' },
      { nombre: 'Tomás', vinculo: 'nieto' },
    ],
    ...overrides,
  });
}

describe('construirHtmlLibro', () => {
  it('arma un documento HTML completo', () => {
    const html = construir();
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('</html>');
  });

  it('la portada tiene título, año y foto', () => {
    const html = construir();
    expect(html).toContain('Roberto — La historia de una vida');
    expect(html).toContain('1945');
    expect(html).toContain('https://x/foto.jpg');
  });

  it('la portada no rompe si falta la foto', () => {
    const html = construir({ fotoUrl: null });
    expect(html).not.toContain('<img');
  });

  it('el índice lista los capítulos', () => {
    const html = construir();
    expect(html).toContain('Índice');
    expect(html).toContain('<li>Infancia</li>');
    expect(html).toContain('<li>El amor</li>');
  });

  it('contiene TODOS los encabezados del markdown, incluidos los que no vienen del índice', () => {
    const html = construir();
    expect(html).toContain('A mis lectores');
    expect(html).toContain('Infancia');
    expect(html).toContain('El amor');
    expect(html).toContain('Sus frases');
    expect(html).toContain('Para cerrar');
  });

  it('el cuerpo de cada capítulo aparece como párrafo, y las citas como blockquote', () => {
    const html = construir();
    expect(html).toContain('<p>Nací en Rosario, en la casa de mi abuela.</p>');
    expect(html).toContain('<blockquote>Cortito y verdadero, así viví.</blockquote>');
  });

  it('la página de saludos lista nombre y vínculo de cada saludo', () => {
    const html = construir();
    expect(html).toContain('Los saludos de la familia');
    expect(html).toContain('Marta');
    expect(html).toContain('hija');
    expect(html).toContain('Tomás');
    expect(html).toContain('nieto');
  });

  it('sin saludos, la página se omite entera', () => {
    const html = construir({ saludos: [] });
    expect(html).not.toContain('Los saludos de la familia');
    expect(html).not.toContain('class="saludos"');
  });

  it('con al menos un saludo, la página aparece (comportamiento existente)', () => {
    const html = construir({ saludos: [{ nombre: 'Marta', vinculo: 'hija' }] });
    expect(html).toContain('Los saludos de la familia');
  });

  it('escapa HTML en el texto del narrador para no romper el documento', () => {
    const html = construir({ libroMarkdown: '# Infancia\n\nEl & la <cosa>.' });
    expect(html).toContain('El &amp; la &lt;cosa&gt;.');
    expect(html).not.toContain('<cosa>');
  });

  it('### dentro de un capítulo se renderiza como subtítulo, no como texto literal', () => {
    const html = construir({ libroMarkdown: '# Infancia\n\n### Sub\n\nTexto después.' });
    expect(html).toContain('<h3>Sub</h3>');
    expect(html).not.toContain('###');
  });

  it('## dentro de un capítulo se renderiza como subtítulo de nivel 2', () => {
    const html = construir({ libroMarkdown: '# Infancia\n\n## Título mediano\n\nTexto.' });
    expect(html).toContain('<h2>Título mediano</h2>');
    expect(html).not.toContain('##');
  });

  it('**negrita** se renderiza como <strong>', () => {
    const html = construir({ libroMarkdown: '# Sus frases\n\nEsto es **importante** de verdad.' });
    expect(html).toContain('<strong>importante</strong>');
    expect(html).not.toContain('**');
  });

  it('una lista de 3 ítems "- " se renderiza como <ul> con 3 <li>', () => {
    const html = construir({
      libroMarkdown:
        '# Sus frases\n\n- **Al mal tiempo** — buena cara.\n- **Más vale tarde** — que nunca.\n- **En boca cerrada** — no entran moscas.',
    });
    const matchUl = html.match(/<ul>[\s\S]*?<\/ul>/);
    expect(matchUl).not.toBeNull();
    const liCount = (matchUl?.[0].match(/<li>/g) ?? []).length;
    expect(liCount).toBe(3);
    expect(html).toContain('<strong>Al mal tiempo</strong>');
    expect(html).toContain('— buena cara.');
  });
});
