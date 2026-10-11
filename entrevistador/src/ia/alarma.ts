// La alarma de la clave de Anthropic (11/10). La ANTHROPIC_API_KEY del entrevistador
// estuvo revocada desde ~23/09: cada llamada a Claude devolvía 401, cada catch lo
// tragaba (así tiene que ser, la entrevista no se frena por el modelo) y nadie se
// enteró en semanas. Desde ahora un 401 avisa a los socios, una vez por día
// (avisarSocios deduplica por clave y día), sin cambiar lo que hace cada llamada.
//
// - vigilarClave(cliente, servicio) envuelve el cliente del SDK: si messages.create
//   rechaza con un 401, avisa; el error sigue subiendo igual que antes.
// - chequearClaveAlArrancar() prueba la clave al arrancar el servidor con
//   models.list({ limit: 1 }): la API de modelos no se cobra (no hay tokens) y
//   exige una clave válida, así que un 401 ahí es la clave mala. Nunca frena el
//   arranque: sin reintentos, timeout de 10 s y nunca tira.
//
// Son avisos internos (mail a MAIL_SOCIOS); no los ve ningún narrador ni familia.

import Anthropic from '@anthropic-ai/sdk';
import { avisarSocios } from '../v3/avisos.js';

export const CLAVE_AVISO_401 = 'anthropic-401-entrevistador';
export const ASUNTO_CLAVE_MALA = 'La clave de Anthropic del entrevistador no anda';
const TIMEOUT_CHEQUEO_MS = 10_000;

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
  // El SDK arma el mensaje como «401 {cuerpo}»; el cazador guarda solo ese texto.
  return /authentication_error|invalid x-api-key/i.test(t) || /^\s*401\b/.test(t);
}

/** Si el error es un 401 de Anthropic, avisa a los socios (una vez por día). Nunca tira. */
export async function avisarSiClaveMala(err: unknown, servicio: string, contexto?: string): Promise<boolean> {
  try {
    if (!esClaveMala(err)) return false;
    const mensaje = textoDe(err).slice(0, 300);
    const donde = contexto ? `${servicio} (${contexto})` : servicio;
    const detalle =
      `Anthropic rechazó la clave del entrevistador (401) en ${donde}.\n` +
      'Mientras no se cambie, todo lo que usa a Claude en el entrevistador falla callado ' +
      '(cazador de escenas, evaluación, resúmenes, adaptativas, trato).\n' +
      'Hay que cargar una clave nueva en ANTHROPIC_API_KEY del servicio entrevistador en Railway.\n\n' +
      `Respuesta de Anthropic «${mensaje}»\n\n` +
      'Este aviso sale una vez por día.';
    return await avisarSocios(CLAVE_AVISO_401, ASUNTO_CLAVE_MALA, detalle);
  } catch (e) {
    console.error('alarma: no pude avisar la clave mala de Anthropic:', e instanceof Error ? e.message : e);
    return false;
  }
}

type ConMensajes = { messages: { create: (...a: any[]) => any } };

/**
 * Envuelve messages.create del cliente: devuelve lo mismo que antes (la misma
 * promesa, así un 401 sigue subiendo a su catch de siempre) y, si rechaza con un
 * 401, avisa a los socios en paralelo.
 */
export function vigilarClave<T extends ConMensajes>(cliente: T, servicio: string): T {
  const original = cliente.messages.create.bind(cliente.messages);
  cliente.messages.create = (...args: unknown[]) => {
    const p = original(...args);
    Promise.resolve(p).catch((err: unknown) => { void avisarSiClaveMala(err, servicio); });
    return p;
  };
  return cliente;
}

type ClienteModelos = { models: { list: (params: { limit: number }, opciones: { maxRetries: number; timeout: number }) => Promise<unknown> } };

/**
 * Prueba la clave al arrancar (models.list con límite 1: gratis). 'ok', 'clave-mala'
 * (y aviso) o 'no-se-pudo' (red, 5xx, sin clave: solo se anota). Nunca tira.
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
    console.log('alarma: la clave de Anthropic del entrevistador anda.');
    return 'ok';
  } catch (err) {
    if (esClaveMala(err)) {
      console.error('alarma: Anthropic rechazó la clave del entrevistador al arrancar (401).');
      await avisarSiClaveMala(err, 'el chequeo al arranque del servidor');
      return 'clave-mala';
    }
    console.warn('alarma: no pude probar la clave de Anthropic al arrancar:', textoDe(err).slice(0, 200));
    return 'no-se-pudo';
  }
}
