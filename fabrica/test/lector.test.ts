import { describe, it, expect, vi } from 'vitest';
import { parsearLectura, leerLibro, PROMPT_LECTOR, estimarLector, avisosPorCapitulo, TOPE_LECTOR } from '../src/libro/lector.js';

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
  it('cuando no puede, dice por qué', () => {
    expect(parsearLectura('todo bien')).toEqual({ ok: false, motivo: 'no es JSON' });
    expect(parsearLectura('{"avisos":[{"capitulo":"A"')).toEqual({ ok: false, motivo: 'no es JSON' });
    expect(parsearLectura('{"nada":1}')).toEqual({ ok: false, motivo: 'sin lista de avisos' });
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
    expect(r.crudo).toBe('{"avisos":[]}');
  });

  it('deja lugar para que piense y lea: tope de 32000 tokens (8000 se lo comía el pensamiento)', async () => {
    const stream = vi.fn().mockReturnValue({ finalMessage: async () => ({ content: [{ type: 'text', text: '{"avisos":[]}' }], stop_reason: 'end_turn', usage: {} }) });
    await leerLibro({ messages: { stream } } as never, { nombre: 'X', genero: null }, '# A', ['audio'], '', []);
    expect(stream.mock.calls[0][0].max_tokens).toBe(32000);
  });

  it('si la respuesta llegó cortada por el tope, lo dice (aunque el pedazo parezca JSON) y guarda lo crudo', async () => {
    const stream = vi.fn().mockReturnValue({ finalMessage: async () => ({ content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: '{"avisos":[{"capitulo":"A","frase":"B","problema":"inventado","evidencia":"x"}' }], stop_reason: 'max_tokens', usage: { input_tokens: 1, output_tokens: 32000 } }) });
    const r = await leerLibro({ messages: { stream } } as never, { nombre: 'X', genero: null }, '# A', ['audio'], '', []);
    expect(r.resultado).toEqual({ ok: false, motivo: 'cortada por el tope de tokens' });
    expect(r.crudo).toContain('"capitulo":"A"');
    expect(r.usage.output_tokens).toBe(32000);
  });

  it('cortada por el tope sin haber llegado a escribir nada: también es "cortada"', async () => {
    const stream = vi.fn().mockReturnValue({ finalMessage: async () => ({ content: [{ type: 'thinking', thinking: '' }], stop_reason: 'max_tokens', usage: {} }) });
    const r = await leerLibro({ messages: { stream } } as never, { nombre: 'X', genero: null }, '# A', ['audio'], '', []);
    expect(r.resultado).toEqual({ ok: false, motivo: 'cortada por el tope de tokens' });
    expect(r.crudo).toBe('');
  });

  it('sin bloque de texto: "sin texto"; texto que no es JSON: "no es JSON"', async () => {
    const sinTexto = vi.fn().mockReturnValue({ finalMessage: async () => ({ content: [{ type: 'thinking', thinking: '' }], stop_reason: 'end_turn', usage: {} }) });
    const a = await leerLibro({ messages: { stream: sinTexto } } as never, { nombre: 'X', genero: null }, '# A', ['audio'], '', []);
    expect(a.resultado).toEqual({ ok: false, motivo: 'sin texto' });
    const prosa = vi.fn().mockReturnValue({ finalMessage: async () => ({ content: [{ type: 'text', text: 'El libro está bien.' }], stop_reason: 'end_turn', usage: {} }) });
    const b = await leerLibro({ messages: { stream: prosa } } as never, { nombre: 'X', genero: null }, '# A', ['audio'], '', []);
    expect(b.resultado).toEqual({ ok: false, motivo: 'no es JSON' });
    expect(b.crudo).toBe('El libro está bien.');
  });
});

describe('estimarLector', () => {
  it('cuenta la entrada con el prompt entero y da un rango: poco que decir … el tope entero', () => {
    const e = estimarLector({ nombre: 'Naza', genero: 'hombre' }, 'x'.repeat(30000), ['y'.repeat(34000)], '', []);
    expect(e.tokensEntrada).toBeGreaterThan(64000 / 4);
    // Opus 5: USD 5 el millón de entrada, 25 el de salida.
    expect(e.usdMax).toBeCloseTo((e.tokensEntrada * 5 + TOPE_LECTOR * 25) / 1e6, 6);
    expect(e.usdMin).toBeLessThan(e.usdMax);
    expect(e.usdMin).toBeGreaterThan(e.tokensEntrada * 5 / 1e6);
  });
});

describe('avisosPorCapitulo', () => {
  it('agrupa en el orden en que aparecen los capítulos', () => {
    const a = (capitulo: string, frase: string) => ({ capitulo, frase, problema: 'inventado' as const, evidencia: '' });
    const g = avisosPorCapitulo([a('Lanús', '1'), a('Tucumán', '2'), a('Lanús', '3')]);
    expect(g.map(([c, l]) => [c, l.map((x) => x.frase)])).toEqual([['Lanús', ['1', '3']], ['Tucumán', ['2']]]);
  });
});

// D1 (25/09): el lector final también sabe lo que la familia corrigió.
describe('las correcciones de la familia en el lector', () => {
  const SECCION = 'CORRECCIONES DE LA FAMILIA (mandan sobre lo que se transcribió; aplicalas donde corresponda, sin inventar nada más): Rosa, no Rosana.';

  it('PROMPT_LECTOR las lleva; vacío queda igual que antes', () => {
    expect(PROMPT_LECTOR('E', 'L', 'A', 'N', 'R', 'Rosa, no Rosana.')).toContain(SECCION);
    expect(PROMPT_LECTOR('E', 'L', 'A', 'N', 'R', '')).toBe(PROMPT_LECTOR('E', 'L', 'A', 'N', 'R'));
    expect(PROMPT_LECTOR('E', 'L', 'A', 'N', 'R')).not.toContain('CORRECCIONES DE LA FAMILIA');
  });

  it('leerLibro se las pasa al modelo', async () => {
    const stream = vi.fn().mockReturnValue({ finalMessage: async () => ({ content: [{ type: 'text', text: '{"avisos":[]}' }], usage: {} }) });
    await leerLibro({ messages: { stream } } as never, { nombre: 'X', genero: null }, '# A', ['audio'], '', [], 'Rosa, no Rosana.');
    expect(stream.mock.calls[0][0].messages[0].content).toContain(SECCION);
  });
});
