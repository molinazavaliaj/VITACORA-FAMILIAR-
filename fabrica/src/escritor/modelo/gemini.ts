// fabrica/src/escritor/modelo/gemini.ts
// PRUEBA (Naza, 07/10/2026: autorizó mandar SU material a DeepSeek y a Google). Gemini por la API de Google
// (generativelanguage), con streaming (streamGenerateContent?alt=sse). La key de Naza es de la capa gratis:
// Google puede usar lo que se manda para entrenar, y los límites por minuto son bajos (un 429 lo reintenta el
// ejecutor). Para clientes haría falta la cuenta paga (no entrena; servidores en Europa).
//
// - Pensamiento con `thinkingConfig.thinkingLevel`: xhigh/max/high → high; medium, low o sin esfuerzo → low.
// - Las partes con `thought: true` son el pensamiento: no van al texto, pero se cobran como salida.
import type { UsoApi } from '../costos.js';
import { leerSSE, type Fetch } from './sse.js';
import { ErrorDelModelo, type Esfuerzo, type Modelo, type PedidoModelo, type RespuestaModelo } from './tipos.js';

export const urlGemini = (modelo: string): string => `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:streamGenerateContent?alt=sse`;

const nivelGemini = (e?: Esfuerzo): 'low' | 'high' => (e === 'xhigh' || e === 'max' || e === 'high' ? 'high' : 'low');

export function cuerpoGemini(p: PedidoModelo): Record<string, unknown> {
  return {
    contents: [{ role: 'user', parts: [{ text: p.bloques.join('\n\n') }] }],
    generationConfig: { maxOutputTokens: p.maxTokens, thinkingConfig: { thinkingLevel: nivelGemini(p.esfuerzo) } },
  };
}

type UsoGemini = { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number; cachedContentTokenCount?: number };
export function usoDeGemini(u: UsoGemini): UsoApi {
  const cache = u.cachedContentTokenCount ?? 0;
  return { input_tokens: Math.max(0, (u.promptTokenCount ?? 0) - cache), output_tokens: (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0), cache_read_input_tokens: cache };
}

export class ModeloGemini implements Modelo {
  constructor(private readonly o: { key: () => string; fetch?: Fetch }) {}
  async llamar(p: PedidoModelo): Promise<RespuestaModelo> {
    let texto = '', motivo = '';
    let uso: UsoApi = {};
    await leerSSE(this.o.fetch, `Gemini (${p.clave})`, urlGemini(p.modelo), { 'x-goog-api-key': this.o.key() }, cuerpoGemini(p), (j) => {
      const d = j as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[]; usageMetadata?: UsoGemini };
      for (const c of d.candidates ?? []) {
        for (const parte of c.content?.parts ?? []) if (parte.text && !parte.thought) texto += parte.text;
        if (c.finishReason) motivo = c.finishReason;
      }
      if (d.usageMetadata) uso = usoDeGemini(d.usageMetadata);
    });
    if (motivo === 'MAX_TOKENS') throw new ErrorDelModelo('la respuesta se cortó por max_tokens', true, { uso, porMaxTokens: true });
    if (motivo !== 'STOP') throw new ErrorDelModelo(`Gemini cortó la respuesta (${motivo || 'sin motivo'})`, motivo === '' , { uso });
    return { texto, uso, motivoFin: motivo };
  }
}
