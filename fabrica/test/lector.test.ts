import { describe, it, expect, vi } from 'vitest';
import { parsearLectura, leerLibro, PROMPT_LECTOR } from '../src/libro/lector.js';

// El lector final (diseño §3.2, idea de Naza): otro modelo lee el libro entero contra los audios y
// avisa lo que ningún contador ve. Con avisos, el libro espera a un socio.

describe('parsearLectura', () => {
  it('lee la lista y deja solo los avisos bien formados', () => {
    const r = parsearLectura('```json\n{"avisos":[{"capitulo":"Tucumán","frase":"Jugábamos con muñecos en el balcón","problema":"fundido","evidencia":"los muñecos en dia_03, el balcón en dia_27"},{"frase":"x"},{"capitulo":"A","frase":"B","problema":"lo que sea","evidencia":""}]}\n```');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.avisos).toEqual([{ capitulo: 'Tucumán', frase: 'Jugábamos con muñecos en el balcón', problema: 'fundido', evidencia: 'los muñecos en dia_03, el balcón en dia_27' }]);
  });
  it('lista vacía = libro sin problemas; sin JSON = no pudo', () => {
    expect(parsearLectura('{"avisos":[]}')).toEqual({ ok: true, avisos: [] });
    expect(parsearLectura('todo bien').ok).toBe(false);
  });
});

describe('PROMPT_LECTOR', () => {
  it('lleva el encargo, el libro, los audios, los nombres y lo reservado, y pide los siete problemas', () => {
    const p = PROMPT_LECTOR('ENCARGO', 'LIBRO', 'AUDIOS', 'Bausá', 'lo de la plata');
    for (const x of ['ENCARGO', 'LIBRO', 'AUDIOS', 'Bausá', 'lo de la plata', 'inventado', 'epoca-o-lugar', 'fundido', 'reservado', 'genero', 'nombre']) expect(p).toContain(x);
    expect(p).toMatch(/no está en ningún audio/);
  });
});

describe('leerLibro', () => {
  it('llama al lector con Opus y devuelve los avisos', async () => {
    const stream = vi.fn().mockReturnValue({ finalMessage: async () => ({ content: [{ type: 'text', text: '{"avisos":[]}' }], usage: { input_tokens: 10, output_tokens: 2 } }) });
    const r = await leerLibro({ messages: { stream } } as never, { nombre: 'Élida', genero: 'mujer' }, '# A', ['audio'], '', []);
    expect(stream.mock.calls[0][0].model).toBe('claude-opus-5');
    expect(r.resultado).toEqual({ ok: true, avisos: [] });
  });
});
