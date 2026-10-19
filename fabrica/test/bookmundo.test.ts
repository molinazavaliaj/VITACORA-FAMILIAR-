// El libro para Bookmundo tapa dura (src/libro/bookmundo): medidas, modo imprenta de la plantilla,
// verificador y cubierta. Los dos últimos tests levantan Chromium de verdad (unos segundos cada uno).
import { describe, expect, it } from 'vitest';
import { PNG } from 'pngjs';
import { construirHtmlLibro } from '../src/libro/plantilla-html.js';
import { medidaExacta } from '../src/libro/pdf.js';
import { lomoMm, medidasCubierta, PAGINAS_MINIMAS_TAPA_DURA } from '../src/libro/bookmundo/formato.js';
import { fuentesImprentaCss } from '../src/libro/bookmundo/fuentes.js';
import { conPpp, deCatalan, nombreEnRenglones, pppDePng, cuerpoNombreCubierta, htmlCubierta } from '../src/libro/bookmundo/cubierta.js';
import { evaluarInterior, type PaginaMedida } from '../src/libro/bookmundo/verificar.js';
import { armarLibroBookmundo } from '../src/libro/bookmundo/armar.js';

const parrafo = 'Aquella mañana salimos temprano hacia el pueblo, con el carro cargado y mi padre callado, mirando el camino. ';
const LIBRO = [
  'Una primera página para los lectores, antes de todo.',
  '',
  '# I · La casa',
  '',
  ...Array.from({ length: 14 }, () => parrafo.repeat(4) + '\n'),
  '# II · El trabajo',
  '',
  ...Array.from({ length: 5 }, () => parrafo.repeat(3) + '\n'),
  '# Sus frases',
  '',
  '> Nunca me fui del todo.',
  '',
  '# Para los míos',
  '',
  'Gracias por escuchar.',
].join('\n');

const datosLibro = {
  titulo: 'Roberto — La historia de una vida',
  nombreNarrador: 'Roberto Pérez',
  indice: ['I · La casa', 'II · El trabajo'],
  libroMarkdown: LIBRO,
};

describe('medidas de Bookmundo tapa dura', () => {
  it('el lomo de 88 páginas en crema es 9,6 mm e interpola entre medidas', () => {
    expect(lomoMm(88)).toBe(9.6);
    expect(lomoMm(40)).toBe(7.2);
    expect(lomoMm(110)).toBe(10.6);
    expect(lomoMm(500)).toBeGreaterThan(24.7);
  });

  it('la cubierta de 88 páginas mide lo de la vista previa real (401,6 × 280), no lo de la calculadora (399,6)', () => {
    const m = medidasCubierta(88);
    expect(m.anchoTotalMm).toBe(401.6);
    expect(m.altoTotalMm).toBe(280);
    expect(m.anchoTapaMm).toBe(176);
  });

  it('el mínimo en papel crema es 88', () => {
    expect(PAGINAS_MINIMAS_TAPA_DURA.crema).toBe(88);
  });
});

describe('plantilla en modo imprenta', () => {
  const imprenta = { anchoMm: 168, altoMm: 240, paginasMinimas: 88, fuentesCss: fuentesImprentaCss() };

  it('incrusta las TrueType estáticas y no carga Google Fonts', async () => {
    const html = await construirHtmlLibro({ ...datosLibro, imprenta });
    expect(html).not.toContain('fonts.googleapis.com');
    expect(html).toContain("font-family: 'Playfair Display'; font-style: normal; font-weight: 900; src: url(data:font/ttf;base64,");
    expect(html).toContain('@page { size: 168mm 240mm; margin: 0; }');
    expect(html).toContain('data-imprenta="1" data-paginas-min="88"');
  });

  it('va sin tapa ni contratapa, con portadilla y su blanca', async () => {
    const html = await construirHtmlLibro({ ...datosLibro, imprenta, tapa: { titulo: 'ROBERTO PÉREZ', subtitulo: null } });
    expect(html).not.toContain('class="tapa-foto"');
    expect(html).not.toContain('<div class="contratapa-pie">');
    expect(html).toContain('<div class="lienzo quiebre portadilla-imp">');
    expect(html).toContain('<div class="nombre">ROBERTO PÉREZ</div>');
    expect(html).toContain('<div class="lienzo quiebre blanca"></div>');
  });

  it('el título de las notas va en la lengua del libro', async () => {
    expect(await construirHtmlLibro({ ...datosLibro, imprenta, idioma: 'ca' })).toContain('data-notas="Notes"');
    expect(await construirHtmlLibro({ ...datosLibro, imprenta })).toContain('data-notas="Notas"');
  });

  it('el libro de pantalla no cambia: Google Fonts, tapa, contratapa y A5', async () => {
    const html = await construirHtmlLibro(datosLibro);
    expect(html).toContain('fonts.googleapis.com');
    expect(html).toContain('class="tapa-foto"');
    expect(html).toContain('<div class="contratapa-pie">');
    expect(html).toContain('@page { size: A5; margin: 0; }');
    expect(html).not.toContain('data-imprenta="1"');
    expect(html).not.toContain('@font-face');
  });
});

describe('cubierta: piezas', () => {
  it('en catalán, «de» se apostrofa ante vocal y hache', () => {
    expect(deCatalan('Imma Colell')).toBe('d’Imma Colell');
    expect(deCatalan('Hilari')).toBe('d’Hilari');
    expect(deCatalan('Joan')).toBe('de Joan');
  });

  it('el nombre va en dos renglones, como la tapa de Imma, y escapado', () => {
    expect(nombreEnRenglones('IMMA COLELL')).toBe('IMMA<br>COLELL');
    expect(nombreEnRenglones('María del Carmen')).toBe('María<br>del Carmen');
    expect(nombreEnRenglones('Ana')).toBe('Ana');
    expect(nombreEnRenglones('<b>x</b> y')).toBe('&lt;b&gt;x&lt;/b&gt;<br>y');
  });

  it('un nombre muy largo achica la letra para no cortar la palabra', () => {
    expect(cuerpoNombreCubierta('IMMA COLELL')).toBe(11.4);
    expect(cuerpoNombreCubierta('INMACULADA CONCEPCIÓN')).toBeLessThan(11.4);
  });

  it('el lomo lleva texto solo desde 6 mm, y el lomo negro es 1 mm más ancho por lado', () => {
    const base = { nombreTapa: 'Ana Ruiz', nombreNarrador: 'Ana Ruiz', lengua: 'es-AR' as const, foto: null, urlQr: 'https://x/voz/t' };
    expect(htmlCubierta({ ...base, paginas: 88 })).toContain('class="lomo-texto"');
    expect(htmlCubierta({ ...base, paginas: 88 })).toContain('width: 11.6mm');
    expect(htmlCubierta({ ...base, paginas: 88 }, { ...medidasCubierta(88), lomoMm: 5 })).not.toContain('class="lomo-texto"');
  });

  it('los textos de la cubierta no dan género por sentado', () => {
    const html = htmlCubierta({ nombreTapa: 'Ana', nombreNarrador: 'Ana', lengua: 'es-AR', foto: null, urlQr: 'https://x', paginas: 88 });
    expect(html).toContain('tal como las vivió');
    expect(html).not.toMatch(/\bella\b|\bél\b/);
    expect(html).toContain('Escuchá su voz');
  });

  it('el PNG lleva escrita su resolución (pHYs) y se puede leer de vuelta', () => {
    const png = new PNG({ width: 4, height: 4 });
    const crudo = PNG.sync.write(png);
    expect(pppDePng(crudo)).toBeNull();
    const con = conPpp(crudo, 300);
    expect(pppDePng(con)).toBe(300);
    expect(pppDePng(conPpp(con, 250))).toBe(250);
    expect(PNG.sync.read(con).width).toBe(4); // sigue siendo un PNG válido (CRC bien)
  });
});

describe('medida exacta del PDF', () => {
  it('corrige el MediaBox redondeado de Chromium sin cambiar el largo del archivo', () => {
    const pdf = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Page /MediaBox [0 0 475.91998 679.91998] >> endobj\n', 'latin1');
    const exacto = medidaExacta(pdf, { anchoMm: 168, altoMm: 240 });
    expect(exacto.length).toBe(pdf.length);
    expect(exacto.toString('latin1')).toContain('/MediaBox [0 0 476.22047 680.31496]');
  });

  it('no toca un MediaBox de otra medida', () => {
    const pdf = Buffer.from('/MediaBox [0 0 419.52756 595.27559]', 'latin1');
    expect(medidaExacta(pdf, { anchoMm: 168, altoMm: 240 }).equals(pdf)).toBe(true);
  });
});

describe('evaluarInterior (sin navegador)', () => {
  const pagina = (n: number, o: Partial<PaginaMedida> = {}): PaginaMedida => ({
    numero: n, anchoMm: 168, altoMm: 240,
    tinta: { lomo: 21, fuera: 19, arriba: 12, abajo: 12 }, tintaClara: { lomo: 21, fuera: 0, arriba: 0, abajo: 12 },
    textoAlLomo: 21.6, pixelesColor: 0, fraccionColor: 0,
    fuentes: [{ nombre: 'SourceSerif4', tipo: 'TrueType', incrustada: true, type3: false }], imagenes: [], anotaciones: 0,
    ...o,
  });
  const libro = (f: (n: number) => Partial<PaginaMedida> = () => ({}), total = 88) =>
    Array.from({ length: total }, (_, i) => pagina(i + 1, f(i + 1)));

  it('un libro bien armado pasa', () => {
    const r = evaluarInterior(libro(), { bytes: 1e6 });
    expect(r.errores).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it('frena con menos de 88 páginas o impares', () => {
    expect(evaluarInterior(libro(() => ({}), 34), { bytes: 1e6 }).errores.join()).toContain('mínimo de tapa dura');
    expect(evaluarInterior(libro(() => ({}), 89), { bytes: 1e6 }).errores.join()).toContain('número par');
  });

  it('frena con fuentes Type 3 (las variables de Google)', () => {
    const r = evaluarInterior(libro((n) => (n === 5 ? { fuentes: [{ nombre: 'Type3', tipo: 'Type3', incrustada: true, type3: true }] } : {})), { bytes: 1e6 });
    expect(r.ok).toBe(false);
    expect(r.errores.join()).toContain('Type 3');
  });

  it('frena con texto cerca del lomo y tinta cerca del corte, diciendo la página', () => {
    const r = evaluarInterior(libro((n) => (n === 7 ? { textoAlLomo: 8, tinta: { lomo: 8, fuera: 19, arriba: 4, abajo: 12 } } : {})), { bytes: 1e6 });
    expect(r.errores.join('\n')).toMatch(/Texto del lado del lomo a menos de 20 mm en págs\. 7/);
    expect(r.errores.join('\n')).toMatch(/Tinta del corte de arriba a menos de 10 mm en págs\. 7/);
  });

  it('fotos: menos de 200 ppp frena, entre 200 y 250 avisa', () => {
    const baja = evaluarInterior(libro((n) => (n === 9 ? { imagenes: [{ ppp: 150, anchoMm: 100, altoMm: 80 }] } : {})), { bytes: 1e6 });
    expect(baja.ok).toBe(false);
    const justa = evaluarInterior(libro((n) => (n === 9 ? { imagenes: [{ ppp: 229, anchoMm: 100, altoMm: 80 }] } : {})), { bytes: 1e6 });
    expect(justa.ok).toBe(true);
    expect(justa.avisos.join()).toContain('229 ppp');
  });

  it('cuenta las páginas en color', () => {
    const r = evaluarInterior(libro((n) => (n % 2 ? { pixelesColor: 50, fraccionColor: 0.001 } : {})), { bytes: 1e6 });
    expect(r.paginasColor).toHaveLength(44);
  });
});

describe('de punta a punta con Chromium', () => {
  it('arma interior y cubierta que pasan la verificación', async () => {
    const url = 'https://www.vitacorafamiliar.com/voz/prueba.token.firma';
    const r = await armarLibroBookmundo(
      { ...datosLibro, tapa: { titulo: 'ROBERTO PÉREZ', subtitulo: null } },
      { nombreTapa: 'ROBERTO PÉREZ', nombreNarrador: 'Roberto Pérez', lengua: 'es-AR', foto: null, urlQr: url },
    );
    expect(r.informeInterior.errores).toEqual([]);
    expect(r.informeInterior.paginas).toBe(88);
    const m = r.informeInterior.paginasMedidas;
    // Exacto, no el redondeo de Chromium.
    expect(m[0].anchoMm).toBeCloseTo(168, 1);
    expect(m[0].altoMm).toBeCloseTo(240, 1);
    // Portadilla y blanca; los capítulos en impar; la última es el colofón (con tinta).
    expect(m[1].tinta).toBeNull();
    expect(r.informeInterior.texto).toContain('ninguna Type 3');
    expect(m[87].tinta).not.toBeNull();
    expect(r.informeCubierta.errores).toEqual([]);
    expect(r.cubierta.qrLeido).toBe(url);
    expect(r.cubierta.anchoPx).toBe(Math.round((401.6 / 25.4) * 300));
    expect(pppDePng(r.cubierta.png)).toBe(300);
    expect(r.informe).toContain('sin foto');
    // Sin fotos no queda ninguna página en color: el acento va en gris (Bookmundo cobra cada página con color).
    expect(r.informeInterior.paginasColor).toEqual([]);
    expect(r.informe.split(/\r?\n/)[0]).toContain('MARCAR «BLANCO Y NEGRO»');
    expect(r.archivoInterior).toBe('interior-168x240-BLANCO-Y-NEGRO.pdf');
    expect(r.color).toBe(false);
  }, 180_000);

  it('ordena como un libro: capítulos en impar, notas, colofón en la última, márgenes en espejo', async () => {
    const { chromium } = await import('playwright');
    const html = await construirHtmlLibro({ ...datosLibro, idioma: 'ca', imprenta: { anchoMm: 168, altoMm: 240, paginasMinimas: 88, fuentesCss: fuentesImprentaCss() } });
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.setContent(html, { timeout: 120_000 });
      await page.waitForFunction('window.__libroPaginado === true', undefined, { timeout: 120_000 });
      const r = (await page.evaluate(`(() => {
        const ls = Array.from(document.querySelectorAll('.lienzo'));
        const clase = (c) => ls.map((l, i) => l.classList.contains(c) ? i + 1 : 0).filter(Boolean);
        const col = (i) => { const c = ls[i - 1].querySelector('.columna-texto'); return c ? getComputedStyle(c).left + '|' + getComputedStyle(c).right : null; };
        const textos = clase('pagina-texto');
        return { total: ls.length, aperturas: clase('apertura'), ultima: ls[ls.length - 1].className, notas: clase('notas-titulo'),
          tituloNotas: document.querySelector('.notas-titulo .t').textContent, portadilla: ls[0].className, blanca: ls[1].className,
          impar: col(textos.find((n) => n % 2 === 1)), par: col(textos.find((n) => n % 2 === 0)), folio3: ls[2].querySelector('.folio') && ls[2].querySelector('.folio').textContent };
      })()`)) as { total: number; aperturas: number[]; ultima: string; notas: number[]; tituloNotas: string; portadilla: string; blanca: string; impar: string; par: string; folio3: string };
      expect(r.total).toBe(88);
      expect(r.portadilla).toContain('portadilla-imp');
      expect(r.blanca).toContain('blanca');
      expect(r.aperturas.length).toBe(2);
      r.aperturas.forEach((n) => expect(n % 2).toBe(1));
      expect(r.notas[0] % 2).toBe(1);
      expect(r.tituloNotas).toBe('Notes');
      expect(r.ultima).toContain('colofon');
      // 72 px del lado del lomo (izquierda en la impar, derecha en la par) y 64 del lado del corte.
      expect(r.impar).toBe('72px|64px');
      expect(r.par).toBe('64px|72px');
      expect(r.folio3).toBe('3');
    } finally {
      await browser.close();
    }
  }, 180_000);
});

describe('armarBookmundoSinFrenar', () => {
  it('si algo falla, no tira: la entrega del libro sigue', async () => {
    const { armarBookmundoSinFrenar } = await import('../src/libro/bookmundo/narrador.js');
    const db = { from: () => { throw new Error('base caída'); } } as unknown as Parameters<typeof armarBookmundoSinFrenar>[0];
    await expect(armarBookmundoSinFrenar(db, 'n1')).resolves.toBeUndefined();
  });
});
