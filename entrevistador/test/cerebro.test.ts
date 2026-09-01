import { describe, it, expect, vi } from 'vitest';

// El cerebro crea el cliente Anthropic al importarse (usa cargarConfig).
vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'clave');
vi.stubEnv('ANTHROPIC_API_KEY', 'clave');
vi.stubEnv('OPENAI_API_KEY', 'clave');
vi.stubEnv('WA_TOKEN', 'clave');
vi.stubEnv('WA_PHONE_NUMBER_ID', '123');
vi.stubEnv('WA_VERIFY_TOKEN', 'verificador');

const crearMock = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
  default: class { messages = { create: crearMock }; },
}));

describe('cerebro', () => {
  it('genera un reconocimiento de una sola frase', async () => {
    crearMock.mockResolvedValueOnce({ content: [{ type: 'text', text: 'Qué historia la del taller de su padre, Don Roberto.' }] });
    const { generarReconocimiento } = await import('../src/ia/cerebro.js');
    const frase = await generarReconocimiento('Don Roberto', 'Mi padre tenía un taller...', '¿Cómo era su casa?', '');
    expect(frase).toContain('taller');
  });

  it('evalúa una respuesta corta como insuficiente y trae repregunta', async () => {
    crearMock.mockResolvedValueOnce({ content: [{ type: 'text', text: '{"suficiente": false, "repregunta": "¿Y qué sentía usted en ese taller?"}' }] });
    const { evaluarRespuesta } = await import('../src/ia/cerebro.js');
    const r = await evaluarRespuesta('¿Cómo era su casa?', 'Linda.', 8);
    expect(r.suficiente).toBe(false);
    expect(r.repregunta).toBeTruthy();
  });

  it('una respuesta larga y rica pasa sin repregunta', async () => {
    crearMock.mockResolvedValueOnce({ content: [{ type: 'text', text: '{"suficiente": true}' }] });
    const { evaluarRespuesta } = await import('../src/ia/cerebro.js');
    const r = await evaluarRespuesta('¿Cómo era su casa?', 'Era una casa de adobe con un patio enorme donde...', 95);
    expect(r.suficiente).toBe(true);
  });
});
