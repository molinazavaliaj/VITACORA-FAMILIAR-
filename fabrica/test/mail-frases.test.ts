import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  asuntoRecordatorioFrases,
  cuerpoRecordatorioFrases,
  enviarMailRecordatorioFrases,
  CANDADO_RECORDATORIO_FRASES,
  DIAS_RECORDATORIO_FRASES,
  RUTA_RECORDATORIO_FRASES,
} from '../src/mail/frases.js';

describe('asuntoRecordatorioFrases / cuerpoRecordatorioFrases', () => {
  const cuerpo = () => cuerpoRecordatorioFrases({ comoLeDicen: 'papá', enlace: 'https://x/tablero/n1' });

  it('el asunto nombra como le dicen y el cuerpo lleva el enlace', () => {
    expect(asuntoRecordatorioFrases('la abuela')).toContain('la abuela');
    expect(asuntoRecordatorioFrases('la abuela')).toContain('frases');
    expect(cuerpo()).toContain('https://x/tablero/n1');
    expect(cuerpo()).toContain('En cada familia hay un libro sin escribir.');
  });

  it('respeta la promesa del spec: si nadie responde, se imprime lo que eligió el biógrafo', () => {
    expect(DIAS_RECORDATORIO_FRASES).toBe(15);
    expect(cuerpo()).toContain('cuando se imprima va la lista que eligió el biógrafo');
  });

  it('no le echa la culpa a la familia: dice que no hay ninguna obligación', () => {
    expect(cuerpo()).toContain('No hay ninguna obligación');
    expect(cuerpo()).not.toMatch(/tenés que|deberías|pendiente|todavía no/i);
  });

  it('escapa el como_le_dicen', () => {
    const conHtml = cuerpoRecordatorioFrases({ comoLeDicen: '<b>', enlace: 'https://x' });
    expect(conHtml).toContain('&lt;b&gt;');
    expect(conHtml).not.toContain('<b>');
  });

  it('el candado vive en el paquete del narrador, con nombre fijo', () => {
    expect(CANDADO_RECORDATORIO_FRASES).toBe('recordatorio_frases_enviado.txt');
    expect(RUTA_RECORDATORIO_FRASES('n1')).toBe('n1/paquete/recordatorio_frases_enviado.txt');
  });
});

describe('enviarMailRecordatorioFrases', () => {
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
    const ok = await enviarMailRecordatorioFrases({ para: 'a@b.c', comoLeDicen: 'papá', enlace: 'https://x' });
    expect(ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('con clave, POSTea a Resend con el asunto del recordatorio y devuelve true', async () => {
    process.env.RESEND_API_KEY = 're_test';
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock as never;

    const ok = await enviarMailRecordatorioFrases({ para: 'a@b.c', comoLeDicen: 'papá', enlace: 'https://x/tablero/n1' });

    expect(ok).toBe(true);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.to).toEqual(['a@b.c']);
    expect(body.subject).toBe(asuntoRecordatorioFrases('papá'));
    expect(body.html).toContain('https://x/tablero/n1');
  });

  it('si Resend rechaza, tira', async () => {
    process.env.RESEND_API_KEY = 're_test';
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 422, text: async () => 'nope' }) as never;
    await expect(
      enviarMailRecordatorioFrases({ para: 'a@b.c', comoLeDicen: 'papá', enlace: 'https://x' })
    ).rejects.toThrow('422');
  });
});
