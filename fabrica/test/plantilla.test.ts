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

  it('la portada tiene el nombre del narrador (extraído del título) y el año', () => {
    const html = construir();
    expect(html).toContain('Roberto');
    expect(html).toContain('1945');
  });

  it('la portada trae la franja de lomo con el acento por default', () => {
    const html = construir();
    expect(html).toContain('#6e2618');
    expect(html).toContain('class="franja"');
  });

  it('la franja de lomo usa el acento pasado por parámetro', () => {
    const html = construir({ acento: '#1e3a5f' });
    expect(html).toContain('#1e3a5f');
    expect(html).not.toContain('#6e2618');
  });

  it('el frontispicio aparece con la foto entera cuando hay foto', () => {
    const html = construir();
    expect(html).toContain('class="frontispicio-img"');
    expect(html).toContain('https://x/foto.jpg');
  });

  it('sin foto no hay ni <img> ni el bloque de frontispicio', () => {
    const html = construir({ fotoUrl: null });
    expect(html).not.toContain('<img');
    expect(html).not.toContain('class="frontispicio-img"');
  });

  it('cada capítulo del índice arranca con su numeral de capítulo', () => {
    const html = construir();
    // Infancia es el 1° capítulo real del índice, El amor el 2°.
    expect(html).toContain('<div class="numeral">01</div>');
    expect(html).toContain('<div class="numeral">02</div>');
    expect(html).toContain('<div class="cap-nombre">Infancia</div>');
    expect(html).toContain('<div class="cap-nombre">El amor</div>');
  });

  it('la contratapa está presente, con la marca de la colección', () => {
    const html = construir();
    expect(html).toContain('VITÁCORA FAMILIAR · UNA COLECCIÓN DE VIDAS CONTADAS');
  });

  it('el colofón está presente', () => {
    const html = construir();
    expect(html).toContain('Este libro fue contado por');
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
