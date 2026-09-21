import { describe, it, expect, vi, beforeEach } from 'vitest';

// Estos módulos llaman a cargarConfig() al importarse, así que el entorno se
// arma ANTES y los módulos se importan adentro de cada test (mismo patrón que
// test/cerebro.test.ts).
vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'clave');
vi.stubEnv('ANTHROPIC_API_KEY', 'clave');
vi.stubEnv('OPENAI_API_KEY', 'clave');
vi.stubEnv('WA_TOKEN', 'clave');
vi.stubEnv('WA_PHONE_NUMBER_ID', '123');
vi.stubEnv('WA_VERIFY_TOKEN', 'verificador');

const { insertadas } = vi.hoisted(() => ({ insertadas: [] as Record<string, unknown>[] }));

// El doble es del BORDE: la base (para capturar la fila) y el modelo.
vi.mock('../src/db/cliente.js', () => ({
  db: {
    from: () => ({
      insert: async (fila: Record<string, unknown>) => {
        insertadas.push(fila);
        return { error: null };
      },
      update: () => ({ eq: async () => ({ error: null }) }),
    }),
  },
}));

const crearMock = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create: crearMock };
  },
}));

beforeEach(() => {
  insertadas.length = 0;
  crearMock.mockReset();
  crearMock.mockResolvedValue({
    content: [{ type: 'text', text: '{"suficiente": true}' }],
    usage: { input_tokens: 2000, output_tokens: 300, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
  });
});

describe('el enganche del costo', () => {
  it('evaluarRespuesta deja una fila en consumo_ia con su paso y su narrador', async () => {
    const { evaluarRespuesta } = await import('../src/ia/cerebro.js');

    await evaluarRespuesta('¿A qué jugaba?', 'Jugaba al fútbol en la calle.', 40, '', 'usted', { narradorId: 'n-1' });

    expect(insertadas).toHaveLength(1);
    expect(insertadas[0]).toMatchObject({
      servicio: 'entrevistador', paso: 'evaluar', modelo: 'claude-opus-5',
      proveedor: 'anthropic', narrador_id: 'n-1', input_tokens: 2000, output_tokens: 300,
    });
  });

  it('la transcripción deja su fila con los segundos, y sigue devolviendo el texto', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ text: 'una historia', usage: { seconds: 191 } }),
    })));

    const { transcribirYActualizar } = await import('../src/ia/transcribir.js');

    const resultado = await transcribirYActualizar('r-1', Buffer.from('audio'), undefined, 'n-2');

    expect(resultado.duracionSegundos).toBe(191);
    expect(insertadas).toHaveLength(1);
    expect(insertadas[0]).toMatchObject({
      servicio: 'entrevistador', paso: 'transcribir', modelo: 'gpt-transcribe',
      proveedor: 'openai', narrador_id: 'n-2', cantidad: 191, unidad: 'segundos',
    });
  });
});
