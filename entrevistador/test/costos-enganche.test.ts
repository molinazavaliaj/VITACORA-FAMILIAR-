import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { registrarUso } from '../src/costos.js';

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
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { nombre: 'Osvaldo', contexto: {} }, error: null }),
        }),
      }),
    }),
  },
}));

// `sugerirPreguntas` arma el prompt con el guion y la historia: se mockean sus datos.
vi.mock('../src/db/guion.js', () => ({
  guionDe: async () => ({ preguntas: [{ texto: 'P1', capitulo: 'La infancia' }], propio: true }),
}));
vi.mock('../src/db/historia.js', () => ({
  armarHistoria: async () => 'historia de prueba',
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

  it('tratoDe deja su fila (una llamada por narrador que antes era invisible)', async () => {
    insertadas.length = 0;
    const { tratoDe } = await import('../src/ia/trato.js');

    await tratoDe({ id: 'n-9', como_le_dicen: 'Don Osvaldo', contexto: { anioNacimiento: 1945 } });

    expect(insertadas).toHaveLength(1);
    expect(insertadas[0]).toMatchObject({ paso: 'trato', narrador_id: 'n-9', input_tokens: 2000 });
  });

  it('sugerirPreguntas deja su fila (es un endpoint pago detrás de una clave)', async () => {
    insertadas.length = 0;
    crearMock.mockResolvedValueOnce({
      content: [{
        type: 'text',
        text: JSON.stringify(Array.from({ length: 5 }, (_, i) => ({ texto: `Sugerida ${i + 1}`, capitulo: 'La infancia' }))),
      }],
      usage: { input_tokens: 1500, output_tokens: 220, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
    });
    const { sugerirPreguntas } = await import('../src/ia/sugeridas.js');

    const sugeridas = await sugerirPreguntas('n-7');

    expect(sugeridas).toHaveLength(5);
    expect(insertadas).toHaveLength(1);
    expect(insertadas[0]).toMatchObject({ paso: 'sugeridas', narrador_id: 'n-7', input_tokens: 1500 });
  });

  it('si la anotación no vuelve, el narrador NO espera: se sigue y se avisa', async () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const dbColgado = { from: () => ({ insert: () => new Promise(() => {}) }) } as unknown as SupabaseClient;

    const arranque = Date.now();
    await registrarUso(
      dbColgado,
      { servicio: 'entrevistador', paso: 'evaluar', modelo: 'claude-opus-5', proveedor: 'anthropic', uso: { input_tokens: 10 } },
      { timeoutMs: 20 }
    );

    expect(Date.now() - arranque).toBeLessThan(1000);
    expect(aviso).toHaveBeenCalled();
    aviso.mockRestore();
  });
});
