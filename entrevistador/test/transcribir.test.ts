import { describe, it, expect, vi } from 'vitest';

// transcribir.ts importa el cliente de la base, que carga el config al arrancar.
vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'clave');
vi.stubEnv('ANTHROPIC_API_KEY', 'clave');
vi.stubEnv('OPENAI_API_KEY', 'clave');
vi.stubEnv('WA_TOKEN', 'clave');
vi.stubEnv('WA_PHONE_NUMBER_ID', '123');
vi.stubEnv('WA_VERIFY_TOKEN', 'verificador');

describe('transcribir', () => {
  it('manda el audio a whisper y devuelve texto y duración', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      JSON.stringify({ text: 'Yo nací en un pueblo chico.', duration: 52.3 }), { status: 200 },
    )));
    const { transcribir } = await import('../src/ia/transcribir.js');
    const resultado = await transcribir(Buffer.from('audio-falso'));
    expect(resultado.texto).toBe('Yo nací en un pueblo chico.');
    expect(resultado.duracionSegundos).toBe(52);
    const [url] = (fetch as any).mock.calls[0];
    expect(url).toContain('audio/transcriptions');
  });
});
