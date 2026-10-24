// Task 5.4 del plan de «Vitácora de una historia»: la imprenta del libro de una historia
// (src/escritor-historia/produccion/imprenta.ts). El armado de Bookmundo (Chromium) se prueba en bookmundo.test.ts:
// acá se simula y se mira lo que decide la fábrica con las páginas que salen.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({ paginas: 60, opciones: [] as unknown[], datos: [] as unknown[] }));
vi.mock('../../src/libro/bookmundo/armar.js', async () => ({
  ...(await vi.importActual<object>('../../src/libro/bookmundo/armar.js')),
  armarLibroBookmundo: vi.fn(async (libro: unknown, cubierta: unknown, o: unknown) => {
    m.datos.push({ libro, cubierta });
    m.opciones.push(o);
    return {
      interior: Buffer.from('%PDF'), cubierta: { png: Buffer.from('png'), guias: Buffer.from('guias') },
      informeInterior: { paginas: m.paginas }, ok: true, color: false, archivoInterior: 'interior-168x240-BLANCO-Y-NEGRO.pdf', informe: 'INFORME',
    };
  }),
}));
vi.mock('../../src/escritor-historia/produccion/textos-tapa.js', async () => ({
  ...(await vi.importActual<object>('../../src/escritor-historia/produccion/textos-tapa.js')),
  textosTapaHistoria: (l: string) => (l === 'ca' ? null : { eyebrow: 'TAPA', cubierta: { etiqueta: 'Etiqueta', contra: (n: string) => `Contra ${n}`, lema: 'Lema' } }),
}));
vi.mock('../../src/config.js', () => ({ cargarConfig: () => ({ resendApiKey: 'clave-prueba', urlBase: 'https://www.vitacorafamiliar.com', supabaseServiceRoleKey: 'secreto-de-prueba' }) }));

import { imprentaHistoria } from '../../src/escritor-historia/produccion/imprenta.js';

const ID = '3f6c2a10-8b4e-4d71-9a2c-5e0b7d1f4c88'; // Rubén, inventado
const LIBRO = '# La valija verde\n\n# I · El taller\n\nYo era tornero en Bahía Blanca. [[R01]]\n';

function base(idioma = 'es-AR') {
  const archivos = new Map<string, string | Buffer>([[`${ID}/escritor-historia/libro.md`, LIBRO]]);
  const filas: Record<string, Record<string, unknown>[]> = {
    narradores: [{ id: ID, nombre: 'Rubén García', como_le_dicen: 'Rubén', contexto: {}, foto_url: null, edicion: null }],
    historias: [{ narrador_id: ID, idioma }],
  };
  const db = {
    from: (tabla: string) => {
      const q: any = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: filas[tabla]?.[0] ?? null, error: null }) };
      return q;
    },
    storage: {
      from: () => ({
        download: async (r: string) => (archivos.has(r) ? { data: new Blob([archivos.get(r) as string]), error: null } : { data: null, error: { message: 'Object not found' } }),
        upload: async (r: string, c: string | Buffer) => { archivos.set(r, c); return { error: null }; },
        remove: async () => ({ error: null }),
      }),
    },
  };
  return { db: db as any, archivos };
}

let mails: { subject: string; text?: string }[];
beforeEach(() => {
  mails = [];
  m.opciones = [];
  m.datos = [];
  vi.stubEnv('MAIL_SOCIOS', 'socios@ejemplo.com');
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init: { body: string }) => { mails.push(JSON.parse(init.body)); return new Response('{}', { status: 200 }); }));
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('imprentaHistoria', () => {
  it('con menos de 88 páginas: flaco, sin archivos para subir, el informe y un solo mail a los socios', async () => {
    m.paginas = 60;
    const { db, archivos } = base();
    expect(await imprentaHistoria(db, ID)).toBe('flaco');
    expect(m.opciones[0]).toEqual({ sinNotas: true });
    expect([...archivos.keys()].filter((k) => k.startsWith(`${ID}/bookmundo/`))).toEqual([`${ID}/bookmundo/informe.txt`]);
    expect(String(archivos.get(`${ID}/bookmundo/informe.txt`))).toContain('NO SUBIR A BOOKMUNDO EN TAPA DURA');
    expect(mails).toHaveLength(1);
    expect(mails[0].text).toContain('El libro de Rubén salió con 60 páginas. La tapa dura pide 88. Hay que ofrecerle tapa blanda.');
    expect(await imprentaHistoria(db, ID)).toBe('flaco');
    expect(mails).toHaveLength(1);
  });

  it('con 88 o más: bookmundo, con interior, cubierta, guías e informe, la tapa de historia y sin mail', async () => {
    m.paginas = 92;
    const { db, archivos } = base();
    expect(await imprentaHistoria(db, ID)).toBe('bookmundo');
    for (const a of ['interior-168x240-BLANCO-Y-NEGRO.pdf', 'cubierta.png', 'cubierta-GUIAS-no-subir.png', 'informe.txt']) expect(archivos.has(`${ID}/bookmundo/${a}`), a).toBe(true);
    expect(mails).toHaveLength(0);
    const d = m.datos[0] as { libro: { tapaEyebrow: string; titulo: string }; cubierta: { textos: { etiqueta: string }; lengua: string } };
    expect(d.libro).toMatchObject({ tapaEyebrow: 'TAPA', titulo: 'La valija verde' });
    expect(d.cubierta).toMatchObject({ lengua: 'es-AR', textos: { etiqueta: 'Etiqueta' } });
  });

  it('sin los textos de tapa aprobados de su idioma, no arma nada', async () => {
    const { db } = base('ca');
    await expect(imprentaHistoria(db, ID)).rejects.toThrow('faltan los textos de tapa de historia aprobados en ca');
    expect(m.opciones).toHaveLength(0);
  });
});
