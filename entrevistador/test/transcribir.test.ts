import { describe, it, expect, vi } from 'vitest';

// transcribir.ts importa el cliente de la base, que carga el config al arrancar.
vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'clave');
vi.stubEnv('ANTHROPIC_API_KEY', 'clave');
vi.stubEnv('OPENAI_API_KEY', 'clave');
vi.stubEnv('WA_TOKEN', 'clave');
vi.stubEnv('WA_PHONE_NUMBER_ID', '123');
vi.stubEnv('WA_VERIFY_TOKEN', 'verificador');

// Forma REAL de la respuesta de `gpt-transcribe` (medida el 2026-09-14): no
// trae `duration` en la raíz, la trae en `usage.seconds`.
const respuestaGptTranscribe = (texto: string, segundos: number) => new Response(
  JSON.stringify({ text: texto, languages: ['es'], usage: { type: 'duration', seconds: segundos } }),
  { status: 200 },
);

describe('transcribir', () => {
  it('manda el audio al modelo y devuelve texto y duración (usage.seconds)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respuestaGptTranscribe('Yo nací en un pueblo chico.', 52.3)));
    const { transcribir } = await import('../src/ia/transcribir.js');
    const resultado = await transcribir(Buffer.from('audio-falso'));
    expect(resultado.texto).toBe('Yo nací en un pueblo chico.');
    expect(resultado.duracionSegundos).toBe(52);
  });

  it('manda el prompt de contexto cuando se lo pasan (es el sesgo de vocabulario)', async () => {
    const fetchFalso = vi.fn(async () => respuestaGptTranscribe('texto', 10));
    vi.stubGlobal('fetch', fetchFalso);
    const { transcribir } = await import('../src/ia/transcribir.js');
    await transcribir(Buffer.from('audio-falso'), 'Vocabulario frecuente: laburar, pileta.');
    const cuerpo = (fetchFalso as any).mock.calls[0][1].body as FormData;
    expect(cuerpo.get('prompt')).toBe('Vocabulario frecuente: laburar, pileta.');
    expect(cuerpo.get('model')).toBe('gpt-transcribe');
  });

  it('sin prompt no manda el campo (el camino del webhook queda igual)', async () => {
    const fetchFalso = vi.fn(async () => respuestaGptTranscribe('texto', 10));
    vi.stubGlobal('fetch', fetchFalso);
    const { transcribir } = await import('../src/ia/transcribir.js');
    await transcribir(Buffer.from('audio-falso'));
    const cuerpo = (fetchFalso as any).mock.calls[0][1].body as FormData;
    expect(cuerpo.get('prompt')).toBeNull();
  });

  it('si la respuesta no trae duración, falla fuerte en vez de devolver 0', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      JSON.stringify({ text: 'algo' }), { status: 200 },
    )));
    const { transcribir } = await import('../src/ia/transcribir.js');
    await expect(transcribir(Buffer.from('audio-falso'))).rejects.toThrow(/no devolvió duración/);
  });
});
