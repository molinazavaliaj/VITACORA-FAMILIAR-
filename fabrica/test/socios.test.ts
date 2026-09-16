import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { asuntoAviso, cuerpoAviso, avisarSocios, CANDADO_AVISO } from '../src/mail/socios.js';

describe('asuntoAviso / cuerpoAviso', () => {
  it('el asunto lleva el prefijo de la casa y el como_le_dicen', () => {
    for (const motivo of ['pendiente_24h', 'procesando_6h', 'fallida', 'ensamblado_fallido'] as const) {
      const asunto = asuntoAviso(motivo, 'papá');
      expect(asunto.startsWith('Vitácora — voz clonada:')).toBe(true);
      expect(asunto).toContain('papá');
    }
  });

  it('pendiente_24h pregunta por la PC de voz', () => {
    const cuerpo = cuerpoAviso({ id: 'abc', motivo: 'pendiente_24h', error: null }, 'papá');
    expect(cuerpo).toContain('La narración de papá lleva más de 24 h sin tomarse: ¿está prendida la PC de voz?');
  });

  it('procesando_6h dice que se colgó y dónde mirar', () => {
    const cuerpo = cuerpoAviso({ id: 'abc', motivo: 'procesando_6h', error: null }, 'papá');
    expect(cuerpo).toContain('La narración de papá se colgó (más de 6 h sin avance).');
    expect(cuerpo).toContain('logs\\worker.log');
  });

  it('fallida trae el motivo y el comando para reintentar con el id', () => {
    const cuerpo = cuerpoAviso({ id: 'abc-123', motivo: 'fallida', error: 'faltan_minutos_de_voz: 412 s' }, 'papá');
    expect(cuerpo).toContain('La narración de papá falló: faltan_minutos_de_voz: 412 s.');
    expect(cuerpo).toContain('npm run narracion -- reintentar abc-123');
  });

  it('fallida sin error anotado no queda con "null"', () => {
    const cuerpo = cuerpoAviso({ id: 'abc', motivo: 'fallida', error: null }, 'papá');
    expect(cuerpo).not.toContain('null');
    expect(cuerpo).toContain('falló');
  });

  it('ensamblado_fallido dice que la fábrica no pudo armar el audiolibro, el error y que reintenta sola', () => {
    const cuerpo = cuerpoAviso({ id: 'abc', motivo: 'ensamblado_fallido', error: 'ffmpeg reventó' }, 'papá');
    expect(cuerpo).toContain('La fábrica no pudo armar el audiolibro clonado de papá: ffmpeg reventó.');
    expect(cuerpo).toContain('Lo reintenta en cada vuelta; si sigue así, mirá los logs de Railway.');
  });

  it('escapa el como_le_dicen y el error en el cuerpo', () => {
    const cuerpo = cuerpoAviso({ id: 'abc', motivo: 'fallida', error: '<b>' }, '<i>');
    expect(cuerpo).toContain('&lt;i&gt;');
    expect(cuerpo).toContain('&lt;b&gt;');
    expect(cuerpo).not.toContain('<i>');
    expect(cuerpo).not.toContain('<b>');
  });

  it('el candado va por narración y motivo', () => {
    expect(CANDADO_AVISO('abc', 'pendiente_24h')).toBe('aviso_narracion_abc_pendiente_24h.txt');
    expect(CANDADO_AVISO('abc', 'fallida')).not.toBe(CANDADO_AVISO('abc', 'pendiente_24h'));
    expect(CANDADO_AVISO('abc', 'ensamblado_fallido')).toBe('aviso_narracion_abc_ensamblado_fallido.txt');
  });
});

describe('avisarSocios', () => {
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
    delete process.env.MAIL_SOCIOS;
  });

  it('sin RESEND_API_KEY devuelve false y no llama a fetch', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as never;
    const ok = await avisarSocios('asunto', '<p>cuerpo</p>');
    expect(ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('con clave, POSTea a Resend al mail de los socios (por defecto hola@) y devuelve true', async () => {
    process.env.RESEND_API_KEY = 're_test';
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock as never;
    const ok = await avisarSocios('el asunto', '<p>cuerpo</p>');
    expect(ok).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.resend.com/emails');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.to).toEqual(['hola@vitacorafamiliar.com']);
    expect(body.subject).toBe('el asunto');
    expect(body.html).toBe('<p>cuerpo</p>');
  });

  it('MAIL_SOCIOS cambia el destinatario', async () => {
    process.env.RESEND_API_KEY = 're_test';
    process.env.MAIL_SOCIOS = 'socios@ejemplo.com';
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock as never;
    await avisarSocios('asunto', '<p>cuerpo</p>');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.to).toEqual(['socios@ejemplo.com']);
  });

  it('si Resend rechaza, tira', async () => {
    process.env.RESEND_API_KEY = 're_test';
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 422, text: async () => 'nope' }) as never;
    await expect(avisarSocios('asunto', '<p>cuerpo</p>')).rejects.toThrow('422');
  });
});
