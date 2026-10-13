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
    ...overrides,
  });
}

describe('construirHtmlLibro', () => {
  it('arma un documento HTML completo', async () => {
    const html = await construir();
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('</html>');
  });

  it('la portada tiene el nombre del narrador (extraído del título) y el año', async () => {
    const html = await construir();
    expect(html).toContain('Roberto');
    expect(html).toContain('1945');
  });

  it('el acento por default es el vino de la identidad', async () => {
    const html = await construir();
    expect(html).toContain('#6e2618');
  });

  it('la franja de lomo usa el acento pasado por parámetro', async () => {
    const html = await construir({ acento: '#1e3a5f' });
    expect(html).toContain('#1e3a5f');
    expect(html).not.toContain('#6e2618');
  });

  it('la foto va en la tapa, arriba, y ya no hay frontispicio (Naza, 13/10)', async () => {
    const html = await construir();
    expect(html).toContain('<div class="tapa-foto"><img src="https://x/foto.jpg" alt="" /></div>');
    expect(html).not.toContain('frontispicio');
    expect((html.match(/https:\/\/x\/foto\.jpg/g) ?? []).length).toBe(1);
  });

  it('sin foto la tapa lleva el toroide en lugar de la foto, sin <img>', async () => {
    const html = await construir({ fotoUrl: null });
    expect(html).not.toContain('<img');
    expect(html).toContain('class="tapa-toroide"');
  });

  it('la tapa: «EL LIBRO DE SU VIDA», el nombre, «para siempre» y la marca', async () => {
    const html = await construir();
    expect(html).toContain('<div class="tapa-eyebrow">EL LIBRO DE SU VIDA</div>');
    expect(html).toContain('<div class="portada-nombre-narrador">Roberto</div>');
    expect(html).toContain('<span class="tapa-siempre">para siempre</span>');
    expect(html).toContain('V·F</span>');
  });

  it('libro en catalán: la tapa en catalán', async () => {
    const html = await construir({ idioma: 'ca' });
    expect(html).toContain('<div class="tapa-eyebrow">EL LLIBRE DE LA SEVA VIDA</div>');
    expect(html).toContain('<span class="tapa-siempre">per sempre</span>');
  });

  it('cada capítulo del índice arranca con su numeral de capítulo', async () => {
    const html = await construir();
    // Infancia es el 1° capítulo real del índice, El amor el 2°.
    expect(html).toContain('<div class="numeral">01</div>');
    expect(html).toContain('<div class="numeral">02</div>');
    expect(html).toContain('<div class="cap-nombre">Infancia</div>');
    expect(html).toContain('<div class="cap-nombre">El amor</div>');
  });

  it('la contratapa está presente, con la marca de la colección', async () => {
    const html = await construir();
    expect(html).toContain('VITÁCORA FAMILIAR · UNA COLECCIÓN DE VIDAS CONTADAS');
  });

  it('libro en catalán: la contratapa en catalán (13/10)', async () => {
    const html = await construir({ idioma: 'ca' });
    expect(html).toContain('VITÁCORA FAMILIAR · UNA COL·LECCIÓ DE VIDES EXPLICADES');
    expect(html).toContain('La seva història, explicada amb la seva pròpia veu.');
    expect(html).toContain('LA HISTÒRIA D’UNA VIDA · DES DE 1945');
    expect(html).not.toContain('UNA COLECCIÓN DE VIDAS CONTADAS');
  });

  it('el colofón está presente', async () => {
    const html = await construir();
    expect(html).toContain('Este libro fue contado por');
  });

  it('contiene TODOS los encabezados del markdown, incluidos los que no vienen del índice', async () => {
    const html = await construir();
    expect(html).toContain('A mis lectores');
    expect(html).toContain('Infancia');
    expect(html).toContain('El amor');
    expect(html).toContain('Sus frases');
    expect(html).toContain('Para cerrar');
  });

  it('el cuerpo de cada capítulo aparece como párrafo, y las citas como blockquote', async () => {
    const html = await construir();
    expect(html).toContain('<p>Nací en Rosario, en la casa de mi abuela.</p>');
    expect(html).toContain('<blockquote>Cortito y verdadero, así viví.</blockquote>');
  });

  it('escapa HTML en el texto del narrador para no romper el documento', async () => {
    const html = await construir({ libroMarkdown: '# Infancia\n\nEl & la <cosa>.' });
    expect(html).toContain('El &amp; la &lt;cosa&gt;.');
    expect(html).not.toContain('<cosa>');
  });

  it('### dentro de un capítulo se renderiza como subtítulo, no como texto literal', async () => {
    const html = await construir({ libroMarkdown: '# Infancia\n\n### Sub\n\nTexto después.' });
    expect(html).toContain('<h3>Sub</h3>');
    expect(html).not.toContain('###');
  });

  it('## dentro de un capítulo se renderiza como subtítulo de nivel 2', async () => {
    const html = await construir({ libroMarkdown: '# Infancia\n\n## Título mediano\n\nTexto.' });
    expect(html).toContain('<h2>Título mediano</h2>');
    expect(html).not.toContain('##');
  });

  it('**negrita** se renderiza como <strong>', async () => {
    const html = await construir({ libroMarkdown: '# Sus frases\n\nEsto es **importante** de verdad.' });
    expect(html).toContain('<strong>importante</strong>');
    expect(html).not.toContain('**');
  });

  it('una lista de 3 ítems "- " se renderiza como <ul> con 3 <li>', async () => {
    const html = await construir({
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

const LIBRO = '# A mis lectores\n\nHola.\n\n# La infancia\n\nNací en 1940.\n\n# Sus frases\n\n> Todo pasa.\n';

describe('construirHtmlLibro — tapa de la edición', () => {
  it('sin tapa: la portada lleva el nombre del narrador', async () => {
    const html = await construirHtmlLibro({ titulo: 'Rosa Pérez — La historia de una vida', indice: ['La infancia'], libroMarkdown: LIBRO });
    expect(html).toContain('<div class="portada-nombre-narrador">Rosa Pérez</div>');
  });

  it('con tapa: el título elegido va grande y el subtítulo ya no sale (Naza, 13/10)', async () => {
    const html = await construirHtmlLibro({
      titulo: 'Rosa Pérez — La historia de una vida',
      nombreNarrador: 'Rosa Pérez',
      tapa: { titulo: 'Mi abuela Rosa', subtitulo: 'Rosa Pérez de Gómez' },
      indice: ['La infancia'],
      libroMarkdown: LIBRO,
    });
    expect(html).toContain('<div class="portada-nombre-narrador">Mi abuela Rosa</div>');
    expect(html).not.toContain('Rosa Pérez de Gómez');
    // el nombre del narrador sigue mandando en cabeceras y aperturas
    expect(html).toContain('<div class="marca-narrador">Rosa Pérez</div>');
  });

  it('nombreNarrador explícito manda sobre el que se saca del título', async () => {
    const html = await construirHtmlLibro({ titulo: 'Mi abuela', nombreNarrador: 'Rosa Pérez', indice: ['La infancia'], libroMarkdown: LIBRO });
    expect(html).toContain('<div class="marca-narrador">Rosa Pérez</div>');
  });
});

describe('construirHtmlLibro — fotos por capítulo', () => {
  const foto = (tag: string, epigrafe: string | null) => ({ dataUri: `data:image/jpeg;base64,${tag}`, epigrafe });

  it('sin fotos: ninguna página de foto', async () => {
    const html = await construirHtmlLibro({ titulo: 'Rosa — x', indice: ['La infancia'], libroMarkdown: LIBRO });
    expect(html).not.toContain('class="lienzo foto quiebre"');
  });

  it('la de apertura va entre la apertura del capítulo y el texto; las de cierre después del texto, con epígrafe', async () => {
    const fotosPorCapitulo = new Map([
      ['La infancia', { apertura: foto('APERTURA', 'En el patio'), cierre: [foto('CIERRE1', null), foto('CIERRE2', 'Con mamá')] }],
    ]);
    const html = await construirHtmlLibro({ titulo: 'Rosa — x', indice: ['La infancia'], libroMarkdown: LIBRO, fotosPorCapitulo });
    const iApertura = html.indexOf('class="lienzo apertura quiebre"');
    const iFotoApertura = html.indexOf('base64,APERTURA');
    const iTexto = html.indexOf('Nací en 1940');
    const iCierre1 = html.indexOf('base64,CIERRE1');
    const iCierre2 = html.indexOf('base64,CIERRE2');
    expect(iApertura).toBeGreaterThan(-1);
    expect(iFotoApertura).toBeGreaterThan(iApertura);
    expect(iTexto).toBeGreaterThan(iFotoApertura);
    expect(iCierre1).toBeGreaterThan(iTexto);
    expect(iCierre2).toBeGreaterThan(iCierre1);
    expect(html).toContain('<div class="foto-epigrafe">En el patio</div>');
    expect(html).toContain('<div class="foto-epigrafe">Con mamá</div>');
    expect((html.match(/class="lienzo foto quiebre"/g) ?? []).length).toBe(3);
  });

  it('el epígrafe se escapa', async () => {
    const fotosPorCapitulo = new Map([['La infancia', { apertura: foto('A', '<b>x</b>'), cierre: [] }]]);
    const html = await construirHtmlLibro({ titulo: 'Rosa — x', indice: ['La infancia'], libroMarkdown: LIBRO, fotosPorCapitulo });
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
  });

  it('fotos de un capítulo que no está en el índice se ignoran', async () => {
    const fotosPorCapitulo = new Map([['Otro', { apertura: foto('A', null), cierre: [] }]]);
    const html = await construirHtmlLibro({ titulo: 'Rosa — x', indice: ['La infancia'], libroMarkdown: LIBRO, fotosPorCapitulo });
    expect(html).not.toContain('base64,A"');
  });

  it('la de apertura se recorta al marco con su foco; las de cierre van enteras', async () => {
    const apertura = { ...foto('APERTURA', null), foco: { x: 0.3, y: 0.2 } };
    const cierre = { ...foto('CIERRE', null), foco: { x: 0.9, y: 0.9 } };
    const fotosPorCapitulo = new Map([['La infancia', { apertura, cierre: [cierre] }]]);
    const html = await construirHtmlLibro({ titulo: 'Rosa — x', indice: ['La infancia'], libroMarkdown: LIBRO, fotosPorCapitulo });
    expect(html).toContain('<img class="foto-img recorte" src="data:image/jpeg;base64,APERTURA" style="object-position: 30% 20%" alt="" />');
    expect(html).toContain('<img class="foto-img" src="data:image/jpeg;base64,CIERRE" alt="" />');
    expect(html).not.toContain('object-position: 90% 90%');
  });

  it('sin foco la apertura se recorta desde el centro', async () => {
    const fotosPorCapitulo = new Map([
      ['La infancia', { apertura: { ...foto('APERTURA', null), foco: { x: 0.5, y: 0.5 } }, cierre: [] }],
    ]);
    const html = await construirHtmlLibro({ titulo: 'Rosa — x', indice: ['La infancia'], libroMarkdown: LIBRO, fotosPorCapitulo });
    expect(html).toContain('<img class="foto-img recorte" src="data:image/jpeg;base64,APERTURA" style="object-position: 50% 50%" alt="" />');
  });

  it('sin foco ni posición —fila vieja o migración 20260918 sin aplicar— la foto sale igual que hoy: entera y sin object-position', async () => {
    const fotosPorCapitulo = new Map([
      ['La infancia', { apertura: foto('APERTURA', 'En el patio'), cierre: [foto('CIERRE', null)] }],
    ]);
    const html = await construirHtmlLibro({ titulo: 'Rosa — x', indice: ['La infancia'], libroMarkdown: LIBRO, fotosPorCapitulo });
    // El marcado de las fotos es EXACTAMENTE el de antes de la migración.
    expect(html).toContain('<div class="foto-marco"><img class="foto-img" src="data:image/jpeg;base64,APERTURA" alt="" /></div>');
    expect(html).toContain('<div class="foto-marco"><img class="foto-img" src="data:image/jpeg;base64,CIERRE" alt="" /></div>');
    // Ni atributo de foco ni la clase que recorta (la clase, en la CSS, es
    // inerte mientras no esté escrita en una foto).
    expect(html).not.toContain('object-position:');
    expect(html).not.toContain('class="foto-img recorte"');
    expect(html).not.toContain('class="apertura-foto');
    expect(html).toContain('<div class="foto-epigrafe">En el patio</div>');
  });

  it('un foco que no se entiende se ignora sin romper: texto vacío, número, un eje que no es número, null', async () => {
    for (const basura of ['', 3, '30% 20%', { x: '0.3', y: '0.2' }, { x: 0.3 }, null]) {
      const fotosPorCapitulo = new Map([
        ['La infancia', { apertura: { ...foto('APERTURA', null), foco: basura as never }, cierre: [] }],
      ]);
      const html = await construirHtmlLibro({ titulo: 'Rosa — x', indice: ['La infancia'], libroMarkdown: LIBRO, fotosPorCapitulo });
      expect(html).toContain('<div class="foto-marco"><img class="foto-img" src="data:image/jpeg;base64,APERTURA" alt="" /></div>');
      expect(html).not.toContain('object-position:');
    }
  });

  it('posición abajo: la foto va en la portadilla del capítulo, debajo del título, y no hay página de foto aparte', async () => {
    const apertura = { ...foto('APERTURA', 'En el patio'), foco: { x: 0.3, y: 0.2 } };
    const fotosPorCapitulo = new Map([
      ['La infancia', { apertura, posicionApertura: 'abajo' as const, cierre: [foto('CIERRE', null)] }],
    ]);
    const html = await construirHtmlLibro({ titulo: 'Rosa — x', indice: ['La infancia'], libroMarkdown: LIBRO, fotosPorCapitulo });
    const iApertura = html.indexOf('class="lienzo apertura quiebre"');
    const iNombre = html.indexOf('<div class="cap-nombre">La infancia</div>');
    const iFoto = html.indexOf('base64,APERTURA');
    const iFinApertura = html.indexOf('class="fuente-texto antes"', iNombre);
    expect(iNombre).toBeGreaterThan(iApertura);
    expect(iFoto).toBeGreaterThan(iNombre);
    expect(iFoto).toBeLessThan(iFinApertura);
    expect(html).toContain('<div class="apertura-foto"><img class="apertura-foto-img" src="data:image/jpeg;base64,APERTURA" style="object-position: 30% 20%" alt="" /></div>');
    expect(html).toContain('<div class="apertura-foto-epigrafe">En el patio</div>');
    // Solo la de cierre tiene página propia.
    expect((html.match(/class="lienzo foto quiebre"/g) ?? []).length).toBe(1);
  });

  it('posición arriba (o sin posición): la foto tiene página propia después de la portadilla, como siempre', async () => {
    const fotosPorCapitulo = new Map([
      ['La infancia', { apertura: foto('APERTURA', null), posicionApertura: 'arriba' as const, cierre: [] }],
    ]);
    const html = await construirHtmlLibro({ titulo: 'Rosa — x', indice: ['La infancia'], libroMarkdown: LIBRO, fotosPorCapitulo });
    expect(html).not.toContain('class="apertura-foto"');
    expect((html.match(/class="lienzo foto quiebre"/g) ?? []).length).toBe(1);
  });
});

describe('construirHtmlLibro — foco de la tapa', () => {
  it('con foco, la foto de tapa recorta alrededor de ese punto', async () => {
    const html = await construir({ fotoFoco: { x: 0.3, y: 0.2 } });
    expect(html).toContain('<img src="https://x/foto.jpg" style="object-position: 30% 20%" alt="" />');
  });

  it('sin foco, la tapa sale igual que hoy: sin object-position', async () => {
    const html = await construir();
    expect(html).toContain('<img src="https://x/foto.jpg" alt="" />');
    expect(html).not.toContain('object-position:');
  });
});

describe('construirHtmlLibro — sin saludos', () => {
  it('no acepta ni emite la sección de saludos', async () => {
    const html = await construirHtmlLibro({ titulo: 'Rosa — x', indice: ['La infancia'], libroMarkdown: LIBRO });
    expect(html).not.toContain('saludos');
  });
});
