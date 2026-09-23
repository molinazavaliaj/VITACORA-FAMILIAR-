import { describe, it, expect, vi, beforeEach } from 'vitest';

// El portón de impresión (3t.26 fase 2): cuando la familia confirma las frases de
// «Su voz», la fábrica arma el PDF que va a la imprenta —el mismo libro, más la
// sección con los códigos QR— y pasa la entrega a `en_produccion`.
//
// Decisión de Naza (23/09): "cuando confirma los audios se manda a imprimir todo".
// No hay espera de días ni botón aparte: la confirmación ES el portón.

const { construirHtmlLibroMock, generarPdfMock } = vi.hoisted(() => ({
  construirHtmlLibroMock: vi.fn().mockResolvedValue('<html>libro con qr</html>'),
  generarPdfMock: vi.fn().mockResolvedValue(Buffer.from('%PDF-falso')),
}));

vi.mock('../src/libro/plantilla-html.js', async () => {
  const actual = await vi.importActual<typeof import('../src/libro/plantilla-html.js')>(
    '../src/libro/plantilla-html.js'
  );
  return { ...actual, construirHtmlLibro: construirHtmlLibroMock };
});

vi.mock('../src/libro/pdf.js', () => ({ htmlAPdf: generarPdfMock }));

const { armarLibroDeImprenta, RUTA_LIBRO_IMPRENTA } = await import('../src/libro/imprenta.js');

/** Una base de mentira: Storage con archivos en memoria y `narradores` con una fila. */
function baseFalsa(opciones: { archivos: Record<string, string>; narrador?: Record<string, unknown> }) {
  const subidos: Record<string, { cuerpo: unknown; tipo?: string }> = {};
  const narrador = {
    id: 'n1',
    nombre: 'Roberto Pérez',
    contexto: { anioNacimiento: 1945 },
    foto_url: null,
    edicion: null,
    ...(opciones.narrador ?? {}),
  };
  const db = {
    from: (tabla: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: tabla === 'narradores' ? narrador : null,
            error: null,
          }),
          single: async () => ({ data: tabla === 'narradores' ? narrador : null, error: null }),
          // `fotos` se lee ordenada; sin fotos cargadas devuelve una lista vacía.
          order: async () => ({ data: [], error: null }),
        }),
      }),
    }),
    storage: {
      from: () => ({
        download: async (ruta: string) => {
          const texto = opciones.archivos[ruta];
          // Igual que Storage: "no está" se distingue de "falló" (`esErrorDeNoEncontrado`).
          if (texto === undefined) return { data: null, error: { message: 'Object not found', statusCode: 404 } };
          return { data: { text: async () => texto }, error: null };
        },
        upload: async (ruta: string, cuerpo: unknown, op?: { contentType?: string }) => {
          subidos[ruta] = { cuerpo, tipo: op?.contentType };
          return { error: null };
        },
        list: async () => ({ data: Object.keys(opciones.archivos).map((r) => ({ name: r.split('/').pop() })), error: null }),
      }),
    },
  };
  return { db: db as never, subidos };
}

const ESTRUCTURA = JSON.stringify({
  titulo: 'La historia de Roberto',
  capitulos: [{ numero: 1, nombre: 'La infancia' }],
});

const FRASES_CONFIRMADAS = JSON.stringify({
  version: 1,
  narrador_id: 'n1',
  pedido_id: 'p1',
  confirmado_at: '2026-09-23T10:00:00Z',
  capitulos: [
    {
      numero: 1,
      nombre: 'La infancia',
      candidatas: [{ id: 'f1', texto: 'Éramos pobres pero felices', elegida: true, audio_path: 'n1/voz/f1.mp3' }],
    },
  ],
});

const FRASES_SIN_CONFIRMAR = FRASES_CONFIRMADAS.replace('"2026-09-23T10:00:00Z"', 'null');

function archivos(frasesJson: string | null): Record<string, string> {
  const base: Record<string, string> = {
    'n1/paquete/estructura.json': ESTRUCTURA,
    'n1/paquete/borrador_libro.md': '# La infancia\n\nTexto del libro.',
  };
  if (frasesJson !== null) base['n1/paquete/frases.json'] = frasesJson;
  return base;
}

beforeEach(() => {
  vi.clearAllMocks();
  // El entorno completo, como el resto de los tests de la fábrica: `urlVozDeNarrador`
  // firma el token con la service key y necesita la URL pública.
  process.env.SUPABASE_URL = 'https://x.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'clave-de-servicio-de-prueba';
  process.env.ANTHROPIC_API_KEY = 'clave-anthropic';
  process.env.OPENAI_API_KEY = 'clave-openai';
  process.env.URL_BASE = 'https://www.vitacorafamiliar.com';
});

describe('armarLibroDeImprenta', () => {
  it('con las frases confirmadas, arma el PDF de imprenta y lo sube aparte del libro.pdf', async () => {
    const { db, subidos } = baseFalsa({ archivos: archivos(FRASES_CONFIRMADAS) });

    const hecho = await armarLibroDeImprenta(db, 'n1');

    expect(hecho).toBe(true);
    expect(subidos[RUTA_LIBRO_IMPRENTA('n1')]).toBeDefined();
    expect(subidos[RUTA_LIBRO_IMPRENTA('n1')].tipo).toBe('application/pdf');
    // El libro que la familia ya descargó no se toca.
    expect(subidos['n1/paquete/libro.pdf']).toBeUndefined();
  });

  it('le pasa a la plantilla las frases y el link de voz: sin eso no hay QR que escanear', async () => {
    const { db } = baseFalsa({ archivos: archivos(FRASES_CONFIRMADAS) });

    await armarLibroDeImprenta(db, 'n1');

    const datos = construirHtmlLibroMock.mock.calls[0][0];
    expect(datos.frases).toBeDefined();
    expect(datos.frases.capitulos[0].candidatas[0].id).toBe('f1');
    expect(typeof datos.urlCliente).toBe('string');
    expect(datos.urlCliente).toContain('/voz/');
  });

  it('si la familia todavía no confirmó, no imprime nada', async () => {
    const { db, subidos } = baseFalsa({ archivos: archivos(FRASES_SIN_CONFIRMAR) });

    const hecho = await armarLibroDeImprenta(db, 'n1');

    expect(hecho).toBe(false);
    expect(Object.keys(subidos)).toHaveLength(0);
    expect(construirHtmlLibroMock).not.toHaveBeenCalled();
  });

  it('sin frases.json tampoco imprime: un libro sin «Su voz» no es el que se encargó', async () => {
    const { db, subidos } = baseFalsa({ archivos: archivos(null) });

    const hecho = await armarLibroDeImprenta(db, 'n1');

    expect(hecho).toBe(false);
    expect(Object.keys(subidos)).toHaveLength(0);
  });

  it('respeta lo que la dueña editó: el título de tapa y el orden de los capítulos', async () => {
    const { db } = baseFalsa({
      archivos: archivos(FRASES_CONFIRMADAS),
      narrador: { edicion: { titulo: 'Mi viejo', subtitulo: 'Una vida', ordenCapitulos: ['La infancia'] } },
    });

    await armarLibroDeImprenta(db, 'n1');

    const datos = construirHtmlLibroMock.mock.calls[0][0];
    expect(datos.tapa).toEqual({ titulo: 'Mi viejo', subtitulo: 'Una vida' });
    expect(datos.indice).toEqual(['La infancia']);
  });

  it('no reescribe el libro: usa el borrador que ya está guardado (escribirlo de nuevo cuesta dólares)', async () => {
    const { db } = baseFalsa({ archivos: archivos(FRASES_CONFIRMADAS) });

    await armarLibroDeImprenta(db, 'n1');

    const datos = construirHtmlLibroMock.mock.calls[0][0];
    expect(datos.libroMarkdown).toContain('Texto del libro.');
  });

  it('sin el borrador del libro guardado no inventa nada: avisa y no imprime', async () => {
    const sinBorrador = archivos(FRASES_CONFIRMADAS);
    delete sinBorrador['n1/paquete/borrador_libro.md'];
    const { db, subidos } = baseFalsa({ archivos: sinBorrador });

    const hecho = await armarLibroDeImprenta(db, 'n1');

    expect(hecho).toBe(false);
    expect(Object.keys(subidos)).toHaveLength(0);
  });
});
