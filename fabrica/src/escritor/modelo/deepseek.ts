// fabrica/src/escritor/modelo/deepseek.ts
// PRUEBA (Naza, 07/10/2026: "que tareas podemos delegar en deepseek y probarlas antes"; autorizó mandar SU
// material a DeepSeek y a Google). DeepSeek por su API compatible con OpenAI, con streaming. OJO: la API
// directa guarda los datos en China; solo con el material de Naza. Para clientes haría falta un proveedor
// en EE. UU./Europa.
//
// - El pensamiento va con `thinking.reasoning_effort`: xhigh/max → max, high/medium → high, low o sin esfuerzo → low.
// - El uso se pasa al formato de Anthropic: lo que pegó en la caché va a `cache_read_input_tokens`.
import type { UsoApi } from '../costos.js';
import { leerSSE, type Fetch } from './sse.js';
import { ErrorDelModelo, type Esfuerzo, type Modelo, type PedidoModelo, type RespuestaModelo } from './tipos.js';

export const URL_DEEPSEEK = 'https://api.deepseek.com/chat/completions';

const esfuerzoDeepSeek = (e?: Esfuerzo): 'low' | 'high' | 'max' => (e === 'xhigh' || e === 'max' ? 'max' : e === 'low' || e === undefined ? 'low' : 'high');

export function cuerpoDeepSeek(p: PedidoModelo): Record<string, unknown> {
  return {
    model: p.modelo,
    max_tokens: p.maxTokens,
    thinking: { type: 'enabled', reasoning_effort: esfuerzoDeepSeek(p.esfuerzo) },
    stream: true,
    stream_options: { include_usage: true },
    messages: [{ role: 'user', content: p.bloques.join('\n\n') }],
  };
}

type UsoDeepSeek = { prompt_tokens?: number; prompt_cache_hit_tokens?: number; prompt_cache_miss_tokens?: number; completion_tokens?: number };
export function usoDeDeepSeek(u: UsoDeepSeek): UsoApi {
  const hit = u.prompt_cache_hit_tokens ?? 0;
  return { input_tokens: u.prompt_cache_miss_tokens ?? Math.max(0, (u.prompt_tokens ?? 0) - hit), output_tokens: u.completion_tokens ?? 0, cache_read_input_tokens: hit };
}

export class ModeloDeepSeek implements Modelo {
  constructor(private readonly o: { key: () => string; fetch?: Fetch }) {}
  async llamar(p: PedidoModelo): Promise<RespuestaModelo> {
    let texto = '', motivo = '';
    let uso: UsoApi = {};
    await leerSSE(this.o.fetch, `DeepSeek (${p.clave})`, URL_DEEPSEEK, { authorization: `Bearer ${this.o.key()}` }, cuerpoDeepSeek(p), (j) => {
      const d = j as { choices?: { delta?: { content?: string | null }; finish_reason?: string | null }[]; usage?: UsoDeepSeek | null };
      for (const c of d.choices ?? []) {
        if (c.delta?.content) texto += c.delta.content;
        if (c.finish_reason) motivo = c.finish_reason;
      }
      if (d.usage) uso = usoDeDeepSeek(d.usage);
    });
    if (motivo === 'length') throw new ErrorDelModelo('la respuesta se cortó por max_tokens', true, { uso, porMaxTokens: true });
    if (motivo === 'content_filter') throw new ErrorDelModelo('DeepSeek filtró la respuesta (content_filter)', false, { uso });
    if (motivo !== 'stop') throw new ErrorDelModelo(`DeepSeek cortó la respuesta (${motivo || 'sin motivo'})`, true, { uso });
    return { texto, uso, motivoFin: motivo };
  }
}
