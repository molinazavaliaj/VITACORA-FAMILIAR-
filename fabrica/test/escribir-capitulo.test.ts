import { describe, it, expect, vi, beforeEach } from 'vitest';

// El SDK de Claude se mockea: la fábrica nunca debe pegarle a la API real en
// CI. finalMessage() devuelve un array de bloques de texto, como el SDK real.
const finalMessageMock = vi.fn();
const streamMock = vi.fn(() => ({ finalMessage: finalMessageMock }));

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(function () {
      return { messages: { stream: streamMock } };
    }),
  };
});

// El costo de cada llamada se anota aparte (src/costos.ts); acá solo importa
// que se lo llame con lo que devolvió el modelo. Este módulo no recibe `db`,
// así que le pasa `obtenerClienteDb` para que lo resuelva adentro.
const { registrarUsoMock } = vi.hoisted(() => ({ registrarUsoMock: vi.fn() }));
vi.mock('../src/costos.js', () => ({ registrarUso: registrarUsoMock }));
vi.mock('../src/db.js', () => ({ obtenerClienteDb: vi.fn() }));

import { obtenerClienteDb } from '../src/db.js';
import { escribirCapitulo } from '../src/libro/escribir-capitulo.js';

describe('escribirCapitulo', () => {
  beforeEach(() => {
    streamMock.mockClear();
    finalMessageMock.mockReset();
    registrarUsoMock.mockReset();
    process.env.SUPABASE_URL = 'https://x.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'clave-service-role';
    process.env.ANTHROPIC_API_KEY = 'clave-anthropic';
    process.env.OPENAI_API_KEY = 'clave-openai';
  });

  it('arma el prompt con el material del capítulo, la historia completa, las correcciones de nombres y las reglas de estilo, y devuelve el texto (trimeado) del modelo', async () => {
    finalMessageMock.mockResolvedValue({
      content: [{ type: 'text', text: '  Este es el capítulo, ya escrito.  ' }],
    });

    const resultado = await escribirCapitulo(
      { nombre: 'Roberto' },
      'Infancia',
      'P: ¿Dónde naciste?\nR: En Rosario, en la casa de mi abuela.',
      'Acá va todo lo que contó en las treinta entrevistas, capítulo por capítulo.',
      'Rosorio → Rosario\nMartiniano → Martín'
    );

    expect(resultado).toBe('Este es el capítulo, ya escrito.');

    expect(streamMock).toHaveBeenCalledTimes(1);
    const llamada = streamMock.mock.calls[0][0] as {
      model: string;
      max_tokens: number;
      thinking?: unknown;
      messages: { role: string; content: string }[];
    };

    expect(llamada.model).toBe('claude-fable-5');
    expect(llamada.max_tokens).toBe(20000);
    // Fable 5 viene con thinking activado solo: no hay que pasar el parámetro.
    expect(llamada.thinking).toBeUndefined();
    expect(llamada.messages).toHaveLength(1);
    expect(llamada.messages[0].role).toBe('user');

    const prompt = llamada.messages[0].content;

    // El nombre del narrador y el capítulo.
    expect(prompt).toContain('Roberto');
    expect(prompt).toContain('«Infancia»');

    // Los dos bloques de material, textuales.
    expect(prompt).toContain('MATERIAL PRINCIPAL');
    expect(prompt).toContain('En Rosario, en la casa de mi abuela.');
    expect(prompt).toContain('LA HISTORIA COMPLETA');
    expect(prompt).toContain('Acá va todo lo que contó en las treinta entrevistas');

    // Las correcciones de nombres.
    expect(prompt).toContain('CORRECCIONES DE NOMBRES');
    expect(prompt).toContain('Rosorio → Rosario');
    expect(prompt).toContain('Martiniano → Martín');

    // Las reglas de estilo, textuales (es la voz del producto: no se resume).
    expect(prompt).toContain('Primera persona. El narrador es él.');
    expect(prompt).toContain('No inventes NADA');
    expect(prompt).toContain('Prohibido el perfume a IA');
  });

  it('descarta espacios sobrantes alrededor del texto devuelto por el modelo', async () => {
    finalMessageMock.mockResolvedValue({
      content: [{ type: 'text', text: '\n\n  Capítulo corto.\n' }],
    });

    const resultado = await escribirCapitulo({ nombre: 'Ana' }, 'El amor', 'material', 'historia', '(sin correcciones)');

    expect(resultado).toBe('Capítulo corto.');
  });

  it('concatena varios bloques de texto del modelo', async () => {
    finalMessageMock.mockResolvedValue({
      content: [
        { type: 'text', text: 'Primera parte.' },
        { type: 'text', text: 'Segunda parte.' },
      ],
    });

    const resultado = await escribirCapitulo({ nombre: 'Ana' }, 'El amor', 'material', 'historia', '(sin correcciones)');

    expect(resultado).toBe('Primera parte.\nSegunda parte.');
  });

  // --- costo por llamada ----------------------------------------------------

  it('anota el usage que devolvió el modelo como paso "capitulo" del narrador', async () => {
    const usage = { input_tokens: 1200, output_tokens: 800, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 };
    finalMessageMock.mockResolvedValue({ content: [{ type: 'text', text: 'Capítulo.' }], usage });

    await escribirCapitulo({ id: 'narrador-1', nombre: 'Ana' }, 'El amor', 'material', 'historia', '(sin correcciones)');

    expect(registrarUsoMock).toHaveBeenCalledTimes(1);
    expect(registrarUsoMock).toHaveBeenCalledWith(obtenerClienteDb, 'narrador-1', {
      modelo: 'claude-fable-5',
      paso: 'capitulo',
      usage,
    });
  });

  it('la previsualización anota el mismo capítulo como paso "preview"', async () => {
    const usage = { input_tokens: 10, output_tokens: 5 };
    finalMessageMock.mockResolvedValue({ content: [{ type: 'text', text: 'Capítulo.' }], usage });

    await escribirCapitulo({ id: 'narrador-1', nombre: 'Ana' }, 'Infancia', 'material', 'historia', '(sin correcciones)', 'preview');

    expect(registrarUsoMock).toHaveBeenCalledWith(obtenerClienteDb, 'narrador-1', { modelo: 'claude-fable-5', paso: 'preview', usage });
  });

  it('sin id de narrador no hay dónde anotar: no registra, y el capítulo sale igual', async () => {
    finalMessageMock.mockResolvedValue({ content: [{ type: 'text', text: 'Capítulo.' }], usage: { input_tokens: 10 } });

    const resultado = await escribirCapitulo({ nombre: 'Ana' }, 'Infancia', 'material', 'historia', '(sin correcciones)');

    expect(resultado).toBe('Capítulo.');
    expect(registrarUsoMock).not.toHaveBeenCalled();
  });
});
