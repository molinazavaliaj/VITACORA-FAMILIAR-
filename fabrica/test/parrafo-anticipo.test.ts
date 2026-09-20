import { describe, it, expect, vi, beforeEach } from 'vitest';

// El SDK de Claude se mockea: la fábrica nunca debe pegarle a la API real en
// CI. El anticipo usa messages.create (sin stream): devuelve el mensaje entero.
const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }));
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(function () {
    return { messages: { create: createMock } };
  }),
}));

// El costo se anota aparte (src/costos.ts); este módulo no recibe `db`, así
// que le pasa `obtenerClienteDb` para que lo resuelva adentro.
const { registrarUsoMock } = vi.hoisted(() => ({ registrarUsoMock: vi.fn() }));
vi.mock('../src/costos.js', () => ({ registrarUso: registrarUsoMock }));
vi.mock('../src/db.js', () => ({ obtenerClienteDb: vi.fn() }));

import { obtenerClienteDb } from '../src/db.js';
import { escribirParrafoAnticipo } from '../src/libro/parrafo-anticipo.js';

describe('escribirParrafoAnticipo', () => {
  beforeEach(() => {
    createMock.mockReset();
    registrarUsoMock.mockReset();
    process.env.SUPABASE_URL = 'https://x.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'clave-service-role';
    process.env.ANTHROPIC_API_KEY = 'clave-anthropic';
    process.env.OPENAI_API_KEY = 'clave-openai';
  });

  it('pide un párrafo con el material y devuelve el texto trimeado', async () => {
    createMock.mockResolvedValue({ content: [{ type: 'text', text: '  Nací en Rosario.  ' }] });

    const resultado = await escribirParrafoAnticipo({ nombre: 'Roberto' }, 'P: ¿Dónde naciste?\nR: En Rosario.');

    expect(resultado).toBe('Nací en Rosario.');
    expect(createMock).toHaveBeenCalledTimes(1);
    const llamada = createMock.mock.calls[0][0] as { model: string; messages: { content: string }[] };
    expect(llamada.model).toBe('claude-fable-5');
    expect(llamada.messages[0].content).toContain('Roberto');
    expect(llamada.messages[0].content).toContain('En Rosario.');
    // Sin id de narrador no hay dónde anotar el costo.
    expect(registrarUsoMock).not.toHaveBeenCalled();
  });

  it('anota el usage del modelo como paso "anticipo" del narrador', async () => {
    const usage = { input_tokens: 500, output_tokens: 120, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 };
    createMock.mockResolvedValue({ content: [{ type: 'text', text: 'Párrafo.' }], usage });

    await escribirParrafoAnticipo({ id: 'narrador-1', nombre: 'Roberto' }, 'material');

    expect(registrarUsoMock).toHaveBeenCalledWith(obtenerClienteDb, 'narrador-1', {
      modelo: 'claude-fable-5',
      paso: 'anticipo',
      usage,
    });
  });
});
