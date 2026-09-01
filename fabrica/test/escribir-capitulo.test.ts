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

import { escribirCapitulo } from '../src/libro/escribir-capitulo.js';

describe('escribirCapitulo', () => {
  beforeEach(() => {
    streamMock.mockClear();
    finalMessageMock.mockReset();
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
});
