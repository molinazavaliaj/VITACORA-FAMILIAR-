// La alarma de la clave de Anthropic en la fábrica (11/10). La ANTHROPIC_API_KEY del
// entrevistador estuvo revocada desde ~23/09 y nadie se enteró: cada catch tragaba el
// 401. En la fábrica un 401 avisa a los socios, una vez por día (clave
// anthropic-401-fabrica, en memoria: tras un reinicio puede repetirse una vez), sin
// cambiar lo que hace cada llamada.
//
// - vigilarClave(cliente, servicio) envuelve el cliente del SDK: messages.create y
//   messages.stream (paquete, estructura, capítulos, frases, escritor directo) y
//   messages.batches (el escritor va por Batch). Un 401 al crear o consultar el lote
//   sube como siempre (el lote lo atrapa y sigue sin lote) y avisa; si un resultado del
//   lote vuelve con authentication_error, también avisa.
// - chequearClaveAlArrancar() prueba la clave cuando arranca el worker con
//   models.list({ limit: 1 }): la API de modelos no se cobra (no hay tokens) y exige
//   una clave válida. Nunca frena el arranque (sin reintentos, timeout de 10 s, no tira).
//
// Son mails internos (MAIL_SOCIOS); no los ve ninguna familia.

import Anthropic from '@anthropic-ai/sdk';
import { avisarSocios } from './escritor/produccion/avisos.js';

export const CLAVE_AVISO_401 = 'anthropic-401-fabrica';
export const ASUNTO_CLAVE_MALA = 'La clave de Anthropic de la fábrica no anda';
const TIMEOUT_CHEQUEO_MS = 10_000;

const YA_AVISADO = new Set<string>();

/** Para los tests. */
export function olvidarAlarmas(): void {
  YA_AVISADO.clear();
}

function textoDe(err: unknown): string {
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err) ?? '';
  } catch {
    return String(err);
  }
}

/** ¿El error es Anthropic rechazando la clave? (401, authentication_error, invalid x-api-key) */
export function esClaveMala(err: unknown): boolean {
  if (err === null || err === undefined) return false;
  if (typeof err === 'object' && (err as { status?: unknown }).status === 401) return true;
  const t = textoDe(err);
  return /authentication_error|invalid x-api-key/i.test(t) || /^\s*401\b/.test(t);
}

/**
 * Si el error es un 401 de Anthropic, avisa a los socios (una vez por día; si el mail
 * no salió, lo intenta de nuevo la próxima vez). Devuelve true si avisó. Nunca tira.
 */
export async function avisarSiClaveMala(err: unknown, servicio: string, o: { ahora?: Date } = {}): Promise<boolean> {
  let llave: string | null = null;
  try {
    if (!esClaveMala(err)) return false;
    llave = `${CLAVE_AVISO_401}|${(o.ahora ?? new Date()).toISOString().slice(0, 10)}`;
    if (YA_AVISADO.has(llave)) return false;
    YA_AVISADO.add(llave);
    const mensaje = textoDe(err).slice(0, 300);
    const detalle =
      `Anthropic rechazó la clave de la fábrica (401) en ${servicio}.\n` +
      'Mientras no se cambie, no sale ningún libro (escritor, paquete, frases y anticipos fallan).\n' +
      'Hay que cargar una clave nueva en ANTHROPIC_API_KEY del servicio de la fábrica en Railway.\n\n' +
      `Respuesta de Anthropic «${mensaje}»\n\n` +
      'Este aviso sale una vez por día.';
    const salio = await avisarSocios(ASUNTO_CLAVE_MALA, detalle);
    if (!salio) YA_AVISADO.delete(llave);
    return salio;
  } catch (e) {
    if (llave) YA_AVISADO.delete(llave);
    console.error('alarma: no pude avisar la clave mala de Anthropic:', e instanceof Error ? e.message : e);
    return false;
  }
}

const avisarEnParalelo = (servicio: string) => (err: unknown): void => { void avisarSiClaveMala(err, servicio); };

type Lotes = { create: (...a: any[]) => any; retrieve: (...a: any[]) => any; results: (...a: any[]) => any };
type ClienteVigilable = { messages: { create?: (...a: any[]) => any; stream?: (...a: any[]) => any; batches?: Lotes } };

/**
 * Envuelve el cliente: cada método devuelve lo mismo que antes (la misma promesa, el
 * mismo stream, los mismos resultados) y un 401 avisa a los socios en paralelo.
 */
export function vigilarClave<T extends ClienteVigilable>(cliente: T, servicio: string): T {
  const m = cliente.messages;
  const avisar = avisarEnParalelo(servicio);
  const promesa = (f: (...a: any[]) => any) => (...args: unknown[]) => {
    const p = f(...args);
    Promise.resolve(p).catch(avisar);
    return p;
  };
  if (typeof m.create === 'function') m.create = promesa(m.create.bind(m));
  if (typeof m.stream === 'function') {
    const original = m.stream.bind(m);
    m.stream = (...args: unknown[]) => {
      const s = original(...args);
      // Escuchar 'error' no cambia nada: quien llama igual recibe el rechazo de finalMessage().
      if (s && typeof s.on === 'function') s.on('error', avisar);
      return s;
    };
  }
  const b = m.batches;
  if (b && typeof b.create === 'function') {
    b.create = promesa(b.create.bind(b));
    b.retrieve = promesa(b.retrieve.bind(b));
    const resultados = b.results.bind(b);
    b.results = async (...args: unknown[]) => {
      const it: AsyncIterable<{ result?: { type?: string; error?: unknown } }> = await promesa(resultados)(...args);
      return {
        async *[Symbol.asyncIterator]() {
          for await (const r of it) {
            if (r?.result?.type === 'errored' && esClaveMala(r.result.error)) avisar(r.result.error);
            yield r;
          }
        },
      };
    };
  }
  return cliente;
}

type ClienteModelos = { models: { list: (params: { limit: number }, opciones: { maxRetries: number; timeout: number }) => Promise<unknown> } };

/**
 * Prueba la clave al arrancar el worker (models.list con límite 1: gratis). 'ok',
 * 'clave-mala' (y aviso) o 'no-se-pudo' (red, 5xx, sin clave: solo se anota). Nunca tira.
 */
export async function chequearClaveAlArrancar(o: {
  cliente?: ClienteModelos;
  crearCliente?: () => ClienteModelos;
} = {}): Promise<'ok' | 'clave-mala' | 'no-se-pudo'> {
  try {
    const crear = o.crearCliente ?? (() => {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error('Falta ANTHROPIC_API_KEY');
      return new Anthropic({ apiKey }) as unknown as ClienteModelos;
    });
    const cliente = o.cliente ?? crear();
    await cliente.models.list({ limit: 1 }, { maxRetries: 0, timeout: TIMEOUT_CHEQUEO_MS });
    console.log('alarma: la clave de Anthropic de la fábrica anda.');
    return 'ok';
  } catch (err) {
    if (esClaveMala(err)) {
      console.error('alarma: Anthropic rechazó la clave de la fábrica al arrancar (401).');
      await avisarSiClaveMala(err, 'el chequeo al arranque del worker');
      return 'clave-mala';
    }
    console.warn('alarma: no pude probar la clave de Anthropic al arrancar:', textoDe(err).slice(0, 200));
    return 'no-se-pudo';
  }
}
