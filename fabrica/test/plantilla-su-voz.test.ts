import { describe, expect, it, beforeEach } from 'vitest';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';
import { createHmac } from 'node:crypto';
import { construirHtmlLibro, seccionFrasesHtml } from '../src/libro/plantilla-html.js';
import type { EstadoFrase, FraseCandidata, FrasesJson } from '../src/libro/frases.js';
import { firmarTokenVoz, urlFraseDeVoz, urlVozDeNarrador } from '../src/libro/token-voz.js';

const NARRADOR = '3691baf4-ee78-4c6b-9238-4cbed1872be7';
const SECRETO = 'clave-service-role';

beforeEach(() => {
  process.env.SUPABASE_URL = 'https://x.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = SECRETO;
  process.env.ANTHROPIC_API_KEY = 'clave-anthropic';
  process.env.OPENAI_API_KEY = 'clave-openai';
  process.env.URL_BASE = 'https://www.vitacorafamiliar.com';
});

const LIBRO = `# A mis lectores

Esto es lo que les quiero contar.

# La infancia

Nací en Rosario, en la casa de mi abuela.

> Cortito y verdadero, así viví.

# El oficio

Aprendí el taller de mi viejo.

# Sus frases

> Al mal tiempo, buena cara.`;

function construir(overrides: Partial<Parameters<typeof construirHtmlLibro>[0]> = {}) {
  return construirHtmlLibro({
    titulo: 'Roberto — La historia de una vida',
    indice: ['La infancia', 'El oficio'],
    libroMarkdown: LIBRO,
    ...overrides,
  });
}

/** El link público del libro en su voz, tal como lo arma la fábrica de verdad. */
function urlVoz(): string {
  return urlVozDeNarrador(NARRADOR);
}

function frase(
  id: string,
  texto: string,
  opciones: { elegida?: boolean; estado?: EstadoFrase; audio?: string | null } = {}
): FraseCandidata {
  const conAudio = opciones.estado === undefined ? 'cortada' : opciones.estado;
  return {
    id,
    texto,
    origen: 'cita',
    grupo: null,
    respuesta_id: 'respuesta-1',
    pregunta_orden: 1,
    por_que: 'se repite en la mesa',
    elegida: opciones.elegida ?? true,
    elegida_por: 'modelo',
    estado: conAudio,
    audio_path: opciones.audio !== undefined ? opciones.audio : conAudio === 'cortada' ? `${NARRADOR}/voz/frases/${id}.mp3` : null,
    segundos: conAudio === 'cortada' ? 12.4 : null,
    inicio: conAudio === 'cortada' ? 41.2 : null,
    fin: conAudio === 'cortada' ? 53.6 : null,
  };
}

function frasesDePrueba(capitulos: { numero: number; capitulo: string; candidatas: FraseCandidata[] }[]): FrasesJson {
  return { version: 1, narrador_id: NARRADOR, pedido_id: 'pedido-1', confirmado_at: null, capitulos };
}

/** Los PNG (QR) que quedaron en el HTML, en el orden en que se imprimen. */
function qrDelHtml(html: string): string[] {
  return [...html.matchAll(/src="(data:image\/png;base64,[^"]+)"/g)].map((m) => m[1]);
}

/** Qué dice de verdad el código: se lee con un lector, como lo haría un celular. */
function leerQr(dataUri: string): string {
  const png = PNG.sync.read(Buffer.from(dataUri.split(',')[1], 'base64'));
  return jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data ?? '';
}

const CAPITULOS = [
  {
    numero: 1,
    capitulo: 'La infancia',
    candidatas: [frase('c01-01', 'Yo nunca quise ser como mi viejo.'), frase('c01-02', 'El mejor ring que tuve fue esa casa.')],
  },
  { numero: 2, capitulo: 'El oficio', candidatas: [frase('c02-01', 'No hay tornillo que no salga.')] },
];

describe('la sección impresa de Su voz', () => {
  it('imprime las frases elegidas de cada capítulo con su QR y el código de la contratapa', async () => {
    const html = await construir({ frases: frasesDePrueba(CAPITULOS), urlCliente: urlVoz() });

    expect(html).toContain('class="su-voz-titulo"');
    expect(html).toContain('Cap. 01 · La infancia');
    expect(html).toContain('Cap. 02 · El oficio');
    expect(html).toContain('«Yo nunca quise ser como mi viejo.»');
    expect(html).toContain('«No hay tornillo que no salga.»');
    // Tres frases con audio + el código de la contratapa = cuatro códigos.
    expect(qrDelHtml(html)).toHaveLength(4);
    expect(html).toContain('class="su-voz-contratapa"');
  });

  it('va después del cuerpo y antes de las páginas de cierre', async () => {
    const html = await construir({ frases: frasesDePrueba(CAPITULOS), urlCliente: urlVoz() });
    const iCuerpo = html.indexOf('Aprendí el taller de mi viejo.');
    const iSeccion = html.indexOf('data-etiqueta="Su voz"');
    const iColofon = html.indexOf('Este libro fue contado por');
    const iContratapa = html.indexOf('VITÁCORA FAMILIAR · UNA COLECCIÓN DE VIDAS CONTADAS');
    expect(iCuerpo).toBeGreaterThan(-1);
    expect(iSeccion).toBeGreaterThan(iCuerpo);
    expect(iColofon).toBeGreaterThan(iSeccion);
    expect(iContratapa).toBeGreaterThan(iColofon);
  });

  it('una frase sin audio se imprime igual, sin QR: nunca un código que no suena', async () => {
    const capitulos = [
      {
        numero: 1,
        capitulo: 'La infancia',
        candidatas: [
          frase('c01-01', 'Yo nunca quise ser como mi viejo.'),
          // Muletilla: no hay cápsula que cortar, va impresa y sin código.
          frase('c01-02', 'Viste.', { estado: 'pendiente', audio: null }),
          // El corte falló: la frase queda, el código no.
          frase('c01-03', 'Pumba.', { estado: 'fallida', audio: null }),
        ],
      },
    ];
    const html = await construir({ frases: frasesDePrueba(capitulos), urlCliente: urlVoz() });

    expect(html).toContain('«Viste.»');
    expect(html).toContain('«Pumba.»');
    expect(html).toContain('«Yo nunca quise ser como mi viejo.»');
    // Solo la que suena: la contratapa (siempre) + la frase 1.
    expect(qrDelHtml(html)).toHaveLength(2);
    const urls = qrDelHtml(html).map(leerQr);
    expect(urls).toEqual([urlFraseDeVoz(urlVoz(), 'c01-01'), urlVoz()]);
  });

  it('el tope de 3 y el orden del archivo mandan', async () => {
    const capitulos = [
      {
        numero: 3,
        capitulo: 'La juventud',
        // El orden del archivo ES el orden impreso: la cuarta no entra, y sale
        // primero la que está primera (no la última elegida ni la más corta).
        candidatas: [
          frase('c03-01', 'Primera de la lista.'),
          frase('c03-02', 'Segunda de la lista.'),
          frase('c03-03', 'Tercera de la lista.'),
          frase('c03-04', 'Cuarta, no entra.'),
          frase('c03-01b', 'Alternativa sin elegir.', { elegida: false }),
        ],
      },
    ];
    const html = await construir({ frases: frasesDePrueba(capitulos), urlCliente: urlVoz() });

    expect(html).toContain('«Primera de la lista.»');
    expect(html).toContain('«Segunda de la lista.»');
    expect(html).toContain('«Tercera de la lista.»');
    expect(html).not.toContain('Cuarta, no entra.');
    expect(html).not.toContain('Alternativa sin elegir.');
    expect(qrDelHtml(html)).toHaveLength(4); // las tres + la contratapa
    const iPrimera = html.indexOf('Primera de la lista.');
    const iSegunda = html.indexOf('Segunda de la lista.');
    const iTercera = html.indexOf('Tercera de la lista.');
    expect(iPrimera).toBeLessThan(iSegunda);
    expect(iSegunda).toBeLessThan(iTercera);
  });

  it('un libro sin frases sale sin la sección: nada de páginas vacías ni códigos que no llevan a nada', async () => {
    // Los tres casos que el diseño manda a tratar igual.
    const sinArchivo = await construir({ urlCliente: urlVoz() });
    const sinElegidas = await construir({
      frases: frasesDePrueba([{ numero: 1, capitulo: 'La infancia', candidatas: [frase('c01-01', 'x', { elegida: false })] }]),
      urlCliente: urlVoz(),
    });
    const sinAudio = await construir({
      frases: frasesDePrueba([
        { numero: 1, capitulo: 'La infancia', candidatas: [frase('c01-01', 'Viste.', { estado: 'pendiente', audio: null })] },
      ]),
      urlCliente: urlVoz(),
    });

    for (const html of [sinArchivo, sinElegidas, sinAudio]) {
      expect(html).not.toContain('data-etiqueta="Su voz"');
      expect(html).not.toContain('class="su-voz-titulo"');
      // Ojo: los estilos de la sección están siempre en el libro; lo que no puede
      // estar es el bloque impreso.
      expect(html).not.toContain('class="su-voz-contratapa"');
      expect(html).not.toContain('class="su-voz-frase"');
      expect(qrDelHtml(html)).toHaveLength(0);
      // El libro se imprime igual: sigue estando todo lo de siempre.
      expect(html).toContain('<div class="portada-nombre-narrador">Roberto</div>');
      expect(html).toContain('Este libro fue contado por');
      expect(html).toContain('class="fuente-texto antes"');
    }
  });

  it('sin urlCliente no hay sección: no se inventa un link', async () => {
    const html = await construir({ frases: frasesDePrueba(CAPITULOS) });
    expect(html).not.toContain('data-etiqueta="Su voz"');
    expect(qrDelHtml(html)).toHaveLength(0);
  });

  it('cada QR apunta a su frase: token firmado con la service role, pestaña de frases y ancla', async () => {
    const html = await construir({ frases: frasesDePrueba(CAPITULOS), urlCliente: urlVoz() });
    const urls = qrDelHtml(html).map(leerQr);

    // El orden impreso: las frases en el orden del archivo y, al final, el
    // código de la contratapa (que abre la página entera).
    expect(urls).toEqual([
      `${urlVoz()}#f-c01-01`,
      `${urlVoz()}#f-c01-02`,
      `${urlVoz()}#f-c02-01`,
      urlVoz(),
    ]);

    // Y el token que viaja adentro del código es el que la web sabe verificar
    // (verificarTokenVoz de web/src/lib/token-libro.ts).
    for (const url of urls) {
      expect(url.startsWith('https://www.vitacorafamiliar.com/voz/')).toBe(true);
      const token = url.split('/voz/')[1].split('#')[0];
      const [encabezado, payload, firma] = token.split('.');
      const esperada = createHmac('sha256', SECRETO).update(`${encabezado}.${payload}`).digest('base64url');
      expect(firma).toBe(esperada);
      expect(JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))).toEqual({ narradorId: NARRADOR, tipo: 'voz' });
      expect(token).toBe(firmarTokenVoz(NARRADOR));
    }
  });

  it('el QR de cada frase es distinto: el ancla no se pierde', async () => {
    const html = await construir({ frases: frasesDePrueba(CAPITULOS), urlCliente: urlVoz() });
    const codigos = qrDelHtml(html);
    expect(new Set(codigos).size).toBe(codigos.length);
  });

  it('escapa el texto del narrador: una frase con < no rompe el libro', async () => {
    const capitulos = [
      { numero: 1, capitulo: 'La infancia', candidatas: [frase('c01-01', 'Dijo <esto> & aquello.')] },
    ];
    const html = await construir({ frases: frasesDePrueba(capitulos), urlCliente: urlVoz() });
    expect(html).toContain('«Dijo &lt;esto&gt; &amp; aquello.»');
    expect(html).not.toContain('<esto>');
  });

  it('el link del código de la contratapa va impreso al lado, para quien no tiene el teléfono', async () => {
    const html = await construir({ frases: frasesDePrueba(CAPITULOS), urlCliente: urlVoz() });
    expect(html).toContain(`<div class="su-voz-contratapa-url">${urlVoz().replace('&', '&amp;')}</div>`);
  });
});

describe('seccionFrasesHtml', () => {
  it('sin ninguna frase que suene devuelve vacío (no arma una sección que no se puede escuchar)', async () => {
    const seccion = await seccionFrasesHtml({
      frases: frasesDePrueba([{ numero: 1, capitulo: 'La infancia', candidatas: [frase('c01-01', 'Viste.', { estado: 'pendiente', audio: null })] }]),
      urlCliente: urlVoz(),
    });
    expect(seccion).toBe('');
  });

  it('con una frase que suena, la sección es una más del flujo del libro (la pagina el paginador)', async () => {
    const seccion = await seccionFrasesHtml({ frases: frasesDePrueba(CAPITULOS), urlCliente: urlVoz() });
    expect(seccion.startsWith('<section class="fuente-texto antes" data-etiqueta="Su voz"')).toBe(true);
    expect(seccion.trimEnd().endsWith('</section>')).toBe(true);
  });
});
