// Una llamada a la API de Anthropic, con streaming (las respuestas largas no cortan por tiempo).
// En producción: new ModeloAnthropic(new Anthropic() as unknown as ClienteMensajes). Los tipos propios
// existen porque el SDK 0.71.2 no tipa `output_config`; el cuerpo se manda igual.
import { APIConnectionError } from '@anthropic-ai/sdk';
import type { UsoApi } from '../costos.js';
import { extraerTexto } from '../../libro/comun.js';
import { ErrorDelModelo, type Modelo, type PedidoModelo, type RespuestaModelo } from './tipos.js';
import { armarParams } from './pedido.js';

export type MensajeApi = { content: Array<{ type: string; text?: string }>; usage: UsoApi; stop_reason: string | null };
export type ClienteMensajes = { messages: { stream(params: Record<string, unknown>): { finalMessage(): Promise<MensajeApi> } } };

export function aRespuesta(m: MensajeApi): RespuestaModelo {
  if (m.stop_reason === 'refusal') throw new ErrorDelModelo('el modelo rechazó el pedido (refusal)', false);
  if (m.stop_reason === 'max_tokens') throw new ErrorDelModelo('la respuesta se cortó por max_tokens', true);
  return { texto: extraerTexto(m.content), uso: m.usage, motivoFin: m.stop_reason ?? '' };
}

export function esReintentable(err: unknown): boolean {
  // Los errores de red del SDK 0.71.2 tienen name "Error" (no lo fija): por eso también instanceof.
  // APIConnectionTimeoutError hereda de APIConnectionError.
  if (err instanceof APIConnectionError) return true;
  const e = err as { status?: unknown; name?: unknown } | null;
  if (e && (e.name === 'APIConnectionError' || e.name === 'APIConnectionTimeoutError')) return true;
  const s = e?.status;
  return typeof s === 'number' && (s === 408 || s === 409 || s === 429 || s >= 500);
}

export class ModeloAnthropic implements Modelo {
  constructor(private readonly cliente: ClienteMensajes) {}
  async llamar(p: PedidoModelo): Promise<RespuestaModelo> {
    let m: MensajeApi;
    try {
      m = await this.cliente.messages.stream(armarParams(p)).finalMessage();
    } catch (err) {
      throw new ErrorDelModelo(`API (${p.clave}): ${(err as Error).message}`, esReintentable(err));
    }
    return aRespuesta(m);
  }
}
