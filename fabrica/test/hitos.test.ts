import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { asuntoHito, cuerpoHito, enviarMailHito, CANDADO_POR_HITO, type Hito } from '../src/mail/hitos.js';

// Los seis del cierre del libro, más los tres de lo físico que viaja (3t.26 fase 2).
const HITOS: Hito[] = [
  'terminado',
  'libro_listo',
  'recordatorio_3',
  'recordatorio_7',
  'recordatorio_14',
  'cierre_automatico',
  'falta_direccion',
  'enviado',
  'entregado',
];

describe('asuntoHito / cuerpoHito', () => {
  it('cada hito tiene asunto con el como_le_dicen y cuerpo con el enlace', () => {
    for (const hito of HITOS) {
      expect(asuntoHito(hito, 'papá')).toContain('papá');
      const cuerpo = cuerpoHito(hito, { comoLeDicen: 'papá', enlace: 'https://x/tablero/n1' });
      expect(cuerpo).toContain('https://x/tablero/n1');
      expect(cuerpo).toContain('En cada familia hay un libro sin escribir.');
    }
  });

  it('escapa el como_le_dicen', () => {
    expect(cuerpoHito('terminado', { comoLeDicen: '<b>', enlace: 'https://x' })).toContain('&lt;b&gt;');
    expect(cuerpoHito('terminado', { comoLeDicen: '<b>', enlace: 'https://x' })).not.toContain('<b>');
  });

  it('cada hito tiene su candado, todos distintos', () => {
    expect(new Set(Object.values(CANDADO_POR_HITO)).size).toBe(HITOS.length);
    expect(CANDADO_POR_HITO.recordatorio_7).toBe('recordatorio_cierre_7.txt');
    expect(CANDADO_POR_HITO.libro_listo).toBe('libro_listo_enviado.txt');
  });
});

describe('enviarMailHito', () => {
  const fetchOriginal = globalThis.fetch;
  beforeEach(() => {
    process.env.SUPABASE_URL = 'https://x.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'k';
    process.env.ANTHROPIC_API_KEY = 'k';
    process.env.OPENAI_API_KEY = 'k';
  });
  afterEach(() => {
    globalThis.fetch = fetchOriginal;
    delete process.env.RESEND_API_KEY;
  });

  it('sin RESEND_API_KEY devuelve false y no llama a fetch', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as never;
    const ok = await enviarMailHito({ hito: 'libro_listo', para: 'a@b.c', comoLeDicen: 'papá', enlace: 'https://x' });
    expect(ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('con clave, POSTea a Resend con el asunto del hito y devuelve true', async () => {
    process.env.RESEND_API_KEY = 're_test';
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock as never;
    const ok = await enviarMailHito({ hito: 'recordatorio_3', para: 'a@b.c', comoLeDicen: 'papá', enlace: 'https://x' });
    expect(ok).toBe(true);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.to).toEqual(['a@b.c']);
    expect(body.subject).toBe(asuntoHito('recordatorio_3', 'papá'));
  });

  it('si Resend rechaza, tira', async () => {
    process.env.RESEND_API_KEY = 're_test';
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 422, text: async () => 'nope' }) as never;
    await expect(enviarMailHito({ hito: 'terminado', para: 'a@b.c', comoLeDicen: 'papá', enlace: 'https://x' })).rejects.toThrow('422');
  });
});

describe('"terminó de contar" de un narrador V3 (Naza, 08/10)', () => {
  it('con vos (Argentina) y con tú (España): sin nombres ni orden de capítulos', async () => {
    const { cuerpoHito, asuntoHito } = await import('../src/mail/hitos.js');
    const vos = cuerpoHito('terminado', { comoLeDicen: 'Babu', enlace: 'https://x', variante: 'vos' });
    expect(vos).toContain('Tu Babu respondió la última pregunta. Su historia está completa.');
    expect(vos).toContain('Ahora te toca a vos. Entrá, elegí la foto y el título de la tapa, y cerrá el libro.');
    expect(vos).toContain('Cuando lo cierres, lo escribimos con sus palabras y te avisamos.');
    const tu = cuerpoHito('terminado', { comoLeDicen: 'Imma', enlace: 'https://x', variante: 'tu' });
    expect(tu).toContain('Ahora te toca a ti. Entra, elige la foto y el título de la tapa, y cierra el libro.');
    for (const t of [vos, tu]) {
      expect(t).not.toContain('nombres');
      expect(t).not.toContain('orden de los capítulos');
      expect(t).toContain('Cerrar el libro');
    }
    expect(asuntoHito('terminado', 'Babu', 'vos')).toBe('Tu Babu terminó de contar');
    // Sin variante, el de siempre; y la variante no toca los demás hitos.
    expect(cuerpoHito('terminado', { comoLeDicen: 'papá', enlace: 'https://x' })).toContain('revisa los nombres');
    expect(cuerpoHito('recordatorio_3', { comoLeDicen: 'papá', enlace: 'https://x', variante: 'vos' })).toContain('Hace tres días');
  });
});
