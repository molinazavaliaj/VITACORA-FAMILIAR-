// fabrica/test/escritor/proveedores.test.ts
// PRUEBA del 07/10: DeepSeek y Gemini (clientes, perfiles, precios y el reparto). Ningún test llama a una API.
import { describe, expect, it } from 'vitest';
import { usdDeLlamada } from '../../src/escritor/costos.js';
import { AlmacenMemoria } from '../../src/escritor/almacen/memoria.js';
import { Ejecutor } from '../../src/escritor/ejecutor.js';
import { DEEPSEEK, GEMINI_FLASH, GEMINI_PRO, OPUS, rolDe } from '../../src/escritor/modelo/configuracion.js';
import { cuerpoDeepSeek, ModeloDeepSeek } from '../../src/escritor/modelo/deepseek.js';
import { cuerpoGemini, ModeloGemini } from '../../src/escritor/modelo/gemini.js';
import { LoteMixto, ModeloMixto, proveedorDe } from '../../src/escritor/modelo/mixto.js';
import type { Fetch } from '../../src/escritor/modelo/sse.js';
import { ErrorDelModelo, type Lote, type Modelo, type PedidoModelo } from '../../src/escritor/modelo/tipos.js';

const pedido = (modelo: string, o: Partial<PedidoModelo> = {}): PedidoModelo => ({ clave: 'C/3b-capitulo-01', modelo, bloques: ['<ficha>\nf\n</ficha>', 'Escribí.'], cacheEn: [1], maxTokens: 64000, esfuerzo: 'xhigh', ...o });

/** Un fetch falso que devuelve estas líneas SSE, partidas en trozos chicos (como llegan por la red). */
function fetchFalso(lineas: string[], status = 200) {
  const vistos: { url: string; headers: Record<string, string>; body: unknown }[] = [];
  const f: Fetch = async (url, init) => {
    vistos.push({ url, headers: init.headers, body: JSON.parse(init.body) });
    const todo = new TextEncoder().encode(lineas.map((l) => `${l}\n\n`).join(''));
    const trozos = Array.from({ length: Math.ceil(todo.length / 7) }, (_, i) => todo.slice(i * 7, i * 7 + 7));
    return { ok: status === 200, status, text: async () => 'error de prueba', body: (async function* () { yield* trozos; })() };
  };
  return { f, vistos };
}

describe('DeepSeek', () => {
  it('manda el pedido con streaming y el pensamiento traducido; junta el texto (sin el razonamiento) y el uso', async () => {
    const { f, vistos } = fetchFalso([
      'data: {"choices":[{"delta":{"reasoning_content":"pienso..."}}]}',
      'data: {"choices":[{"delta":{"content":"Hola, "}}]}',
      'data: {"choices":[{"delta":{"content":"mundo."},"finish_reason":"stop"}]}',
      'data: {"choices":[],"usage":{"prompt_tokens":1000,"prompt_cache_hit_tokens":200,"prompt_cache_miss_tokens":800,"completion_tokens":5000}}',
      'data: [DONE]',
    ]);
    const r = await new ModeloDeepSeek({ key: () => 'k', fetch: f }).llamar(pedido(DEEPSEEK));
    expect(r).toEqual({ texto: 'Hola, mundo.', uso: { input_tokens: 800, output_tokens: 5000, cache_read_input_tokens: 200 }, motivoFin: 'stop' });
    expect(vistos[0].url).toBe('https://api.deepseek.com/chat/completions');
    expect(vistos[0].headers.authorization).toBe('Bearer k');
    expect(vistos[0].body).toMatchObject({ model: DEEPSEEK, max_tokens: 64000, stream: true, thinking: { type: 'enabled', reasoning_effort: 'max' }, messages: [{ role: 'user', content: '<ficha>\nf\n</ficha>\n\nEscribí.' }] });
  });

  it('esfuerzos: xhigh → max, medium/high → high, low o nada → low', () => {
    const e = (esfuerzo?: PedidoModelo['esfuerzo']) => (cuerpoDeepSeek(pedido(DEEPSEEK, { esfuerzo })).thinking as { reasoning_effort: string }).reasoning_effort;
    expect([e('xhigh'), e('medium'), e('high'), e('low'), e(undefined)]).toEqual(['max', 'high', 'high', 'low', 'low']);
  });

  it('un corte por largo es porMaxTokens con el uso; un 429 es reintentable; un 400 no', async () => {
    const corte = fetchFalso(['data: {"choices":[{"delta":{"content":"a"},"finish_reason":"length"}],"usage":{"prompt_cache_miss_tokens":10,"completion_tokens":64000}}']);
    const err = await new ModeloDeepSeek({ key: () => 'k', fetch: corte.f }).llamar(pedido(DEEPSEEK)).catch((x: unknown) => x as ErrorDelModelo);
    expect(err).toMatchObject({ porMaxTokens: true, uso: { input_tokens: 10, output_tokens: 64000 } });
    const e429 = await new ModeloDeepSeek({ key: () => 'k', fetch: fetchFalso([], 429).f }).llamar(pedido(DEEPSEEK)).catch((x: unknown) => x as ErrorDelModelo);
    expect(e429.reintentable).toBe(true);
    const e400 = await new ModeloDeepSeek({ key: () => 'k', fetch: fetchFalso([], 400).f }).llamar(pedido(DEEPSEEK)).catch((x: unknown) => x as ErrorDelModelo);
    expect(e400.reintentable).toBe(false);
  });

  it('una respuesta que termina sin motivo (stream cortado) es un error reintentable', async () => {
    const err = await new ModeloDeepSeek({ key: () => 'k', fetch: fetchFalso(['data: {"choices":[{"delta":{"content":"a medias"}}]}']).f }).llamar(pedido(DEEPSEEK)).catch((x: unknown) => x as ErrorDelModelo);
    expect(err).toBeInstanceOf(ErrorDelModelo);
    expect(err.reintentable).toBe(true);
  });
});

describe('Gemini', () => {
  it('saca el pensamiento del texto pero lo cobra como salida; key en el header, no en la URL', async () => {
    const { f, vistos } = fetchFalso([
      'data: {"candidates":[{"content":{"parts":[{"text":"pienso","thought":true}]}}]}',
      'data: {"candidates":[{"content":{"parts":[{"text":"El capítulo."}]},"finishReason":"STOP"}],"usageMetadata":{"promptTokenCount":1000,"candidatesTokenCount":300,"thoughtsTokenCount":2000,"cachedContentTokenCount":100}}',
    ]);
    const r = await new ModeloGemini({ key: () => 'g', fetch: f }).llamar(pedido(GEMINI_PRO));
    expect(r).toEqual({ texto: 'El capítulo.', uso: { input_tokens: 900, output_tokens: 2300, cache_read_input_tokens: 100 }, motivoFin: 'STOP' });
    expect(vistos[0].url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:streamGenerateContent?alt=sse');
    expect(vistos[0].headers['x-goog-api-key']).toBe('g');
    expect(vistos[0].body).toEqual(cuerpoGemini(pedido(GEMINI_PRO)));
    expect(cuerpoGemini(pedido(GEMINI_PRO))).toMatchObject({ generationConfig: { maxOutputTokens: 64000, thinkingConfig: { thinkingLevel: 'high' } } });
    expect(cuerpoGemini(pedido(GEMINI_FLASH, { esfuerzo: 'low' }))).toMatchObject({ generationConfig: { thinkingConfig: { thinkingLevel: 'low' } } });
  });

  it('MAX_TOKENS es un corte; SAFETY no se reintenta', async () => {
    const corte = await new ModeloGemini({ key: () => 'g', fetch: fetchFalso(['data: {"candidates":[{"finishReason":"MAX_TOKENS"}],"usageMetadata":{"promptTokenCount":5}}']).f }).llamar(pedido(GEMINI_PRO)).catch((x: unknown) => x as ErrorDelModelo);
    expect(corte.porMaxTokens).toBe(true);
    const seg = await new ModeloGemini({ key: () => 'g', fetch: fetchFalso(['data: {"candidates":[{"finishReason":"SAFETY"}]}']).f }).llamar(pedido(GEMINI_PRO)).catch((x: unknown) => x as ErrorDelModelo);
    expect(seg.reintentable).toBe(false);
  });
});

describe('perfiles de la prueba', () => {
  it('eco es la configuración de producción (sin perfil, igual)', () => {
    for (const n of ['3b-capitulo-01', '4-hechos', '7-estilo-cap_1', '2h-armador-01']) expect(rolDe(n, 'eco')).toEqual(rolDe(n));
  });
  it('deepseek y gemini: el capítulo y la primera página siguen en Opus xhigh; lo demás afuera', () => {
    for (const perfil of ['deepseek', 'gemini'] as const) {
      expect(rolDe('3b-capitulo-01', perfil)).toEqual({ modelo: OPUS, maxTokens: 64000, esfuerzo: 'xhigh' });
      expect(rolDe('3a-primera', perfil).modelo).toBe(OPUS);
    }
    expect(rolDe('4-hechos', 'deepseek')).toEqual({ modelo: DEEPSEEK, maxTokens: 128000, esfuerzo: 'high' });
    expect(rolDe('7-estilo-cap_1', 'deepseek')).toMatchObject({ modelo: DEEPSEEK, esfuerzo: 'low' });
    expect(rolDe('4-hechos', 'gemini')).toEqual({ modelo: GEMINI_FLASH, maxTokens: 65536, esfuerzo: 'high' });
    expect(rolDe('7-estilo-cap_1', 'gemini')).toMatchObject({ modelo: GEMINI_FLASH, esfuerzo: 'low' });
  });
  it('los perfiles -todo mandan también el capítulo afuera, con su pensamiento máximo', () => {
    expect(rolDe('3b-capitulo-01', 'deepseek-todo')).toMatchObject({ modelo: DEEPSEEK, esfuerzo: 'xhigh' });
    expect(rolDe('3b-capitulo-01', 'gemini-todo')).toMatchObject({ modelo: GEMINI_FLASH, esfuerzo: 'xhigh' });
  });
  it('el ejecutor arma el pedido con el perfil', () => {
    const e = new Ejecutor({ modelo: { llamar: async () => { throw new Error('no'); } }, almacen: new AlmacenMemoria(), perfil: 'deepseek' });
    expect(e.pedido({ clave: 'C/5c-veedor', llamada: { nombre: '5c-veedor', docs: ['x'], instr: 'y' }, json: true }).modelo).toBe(DEEPSEEK);
  });
});

describe('precios y reparto', () => {
  it('DeepSeek y Gemini no llevan el descuento del Batch aunque la fila diga lote', () => {
    const M = 1_000_000;
    expect(usdDeLlamada(DEEPSEEK, { input_tokens: M, output_tokens: M }, { lote: true })).toBe(5.28);
    expect(usdDeLlamada(GEMINI_PRO, { input_tokens: M, output_tokens: M }, { lote: true })).toBe(14);
    expect(usdDeLlamada(OPUS, { input_tokens: M, output_tokens: M }, { lote: true })).toBe(12);
  });
  it('cada modelo va a su proveedor; lo de afuera sale directo y lo de Anthropic por su lote', async () => {
    expect([proveedorDe(OPUS), proveedorDe(DEEPSEEK), proveedorDe(GEMINI_FLASH)]).toEqual(['anthropic', 'deepseek', 'google']);
    const llamados: string[] = [];
    const m = (q: string): Modelo => ({ llamar: async (p) => { llamados.push(`${q}:${p.clave}`); return { texto: q, uso: {}, motivoFin: 'stop' }; } });
    const mixto = new ModeloMixto({ anthropic: m('anthropic'), deepseek: m('deepseek'), google: m('google') });
    const grupos: string[][] = [];
    const lote: Lote = { enviar: async (_g, ps) => { grupos.push(ps.map((p) => p.clave)); return ps.map((p) => ({ clave: p.clave, ok: true as const, respuesta: { texto: 'lote', uso: {}, motivoFin: 'end_turn' } })); } };
    const r = await new LoteMixto(lote, mixto).enviar('G', [pedido(OPUS, { clave: 'a' }), pedido(DEEPSEEK, { clave: 'b' }), pedido(GEMINI_PRO, { clave: 'c' })]);
    expect(r.map((x) => [x.clave, x.ok && x.respuesta.texto])).toEqual([['a', 'lote'], ['b', 'deepseek'], ['c', 'google']]);
    expect(grupos).toEqual([['a']]);
    expect(llamados.sort()).toEqual(['deepseek:b', 'google:c']);
  });
  it('un error de afuera vuelve como falla con su uso y su corte (el ejecutor lo repite)', async () => {
    const malo: Modelo = { llamar: async () => { throw new ErrorDelModelo('la respuesta se cortó por max_tokens', true, { uso: { output_tokens: 9 }, porMaxTokens: true }); } };
    const [r] = await new LoteMixto(undefined, new ModeloMixto({ anthropic: undefined, deepseek: malo, google: undefined })).enviar('G', [pedido(DEEPSEEK)]);
    expect(r).toMatchObject({ ok: false, porMaxTokens: true, uso: { output_tokens: 9 } });
  });
});
