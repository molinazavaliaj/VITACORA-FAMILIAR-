// Aviso a los socios (spec 2026-10-07: plantilla que falta, 3 fallos de envío,
// alta frenada sin género). No existía un canal: va a la consola de Railway y,
// si están RESEND_API_KEY y MAIL_SOCIOS (separados por coma), por mail. Una vez
// por clave y por día (o una sola vez, con `unaVez`): en memoria y, en producción, también con una marca en
// Storage (11/10: el «ya avisé» solo en memoria se olvidaba en cada deploy y
// llegaban 5 mails iguales el mismo día). Nunca tira: un aviso no puede frenar
// la entrevista. Es un mail interno, no un texto para el narrador.

import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

const REMITENTE = process.env.MAIL_FROM ?? 'Vitácora Familiar <hola@vitacorafamiliar.com>';
const YA_AVISADO = new Set<string>();

/** 'nueva': esta es la primera vez hoy; 'ya': otro proceso (o antes de un reinicio) ya avisó; 'no-se': no se pudo saber. */
export type Marca = ((dia: string, clave: string) => Promise<'nueva' | 'ya' | 'no-se'>) & {
  /** Borra la marca: un aviso `unaVez` que no salió por mail se vuelve a intentar. Nunca tira. */
  quitar?: (dia: string, clave: string) => Promise<void>;
};
let marcaPersistente: Marca | null = null;

/** La configura el servidor al arrancar. Sin ella (tests, scripts), solo memoria. */
export function usarMarcaPersistente(m: Marca | null): void {
  marcaPersistente = m;
}

/**
 * La marca en el bucket privado `audios`: `avisos/<día>/<sha1 de la clave>.txt`
 * (el nombre no muestra la clave, que puede llevar ids de WhatsApp). Subir sin
 * pisar es atómico: si ya existe, Storage contesta 409 y ya se avisó.
 */
export function marcaEnStorage(db: Pick<SupabaseClient, 'storage'>, esperaMs = 6_000): Marca {
  const pathDe = (dia: string, clave: string) => `avisos/${dia}/${createHash('sha1').update(clave).digest('hex')}.txt`;
  const marca: Marca = async (dia, clave) => {
    try {
      const path = pathDe(dia, clave);
      // Con tope: el aviso se espera en el camino del mensaje entrante y un Storage colgado no puede trabarlo.
      let reloj: ReturnType<typeof setTimeout> | undefined;
      const tarde = new Promise<'tarde'>((r) => { reloj = setTimeout(() => r('tarde'), esperaMs); });
      const subida = db.storage.from('audios').upload(path, new Blob([dia]), { contentType: 'text/plain', upsert: false });
      const res = await Promise.race([subida, tarde]).finally(() => clearTimeout(reloj));
      if (res === 'tarde') {
        console.warn('avisos: el Storage no contestó a tiempo la marca del aviso; avisa igual.');
        return 'no-se';
      }
      const { error } = res;
      if (!error) return 'nueva';
      const e = error as { message?: string; statusCode?: string | number };
      if (String(e.statusCode) === '409' || /already exists|duplicate/i.test(e.message ?? '')) return 'ya';
      console.warn(`avisos: no pude guardar la marca del aviso (${e.message ?? 'sin detalle'}); avisa igual.`);
      return 'no-se';
    } catch (err) {
      console.warn('avisos: no pude guardar la marca del aviso; avisa igual.', err instanceof Error ? err.message : err);
      return 'no-se';
    }
  };
  marca.quitar = async (dia, clave) => {
    try {
      const { error } = await db.storage.from('audios').remove([pathDe(dia, clave)]);
      if (error) console.warn(`avisos: no pude borrar la marca del aviso (${error.message}).`);
    } catch (err) {
      console.warn('avisos: no pude borrar la marca del aviso.', err instanceof Error ? err.message : err);
    }
  };
  return marca;
}

export function olvidarAvisos(): void {
  YA_AVISADO.clear();
}

export async function avisarSocios(
  clave: string, asunto: string, detalle: string,
  o: { ahora?: Date; fetch?: typeof fetch; unaVez?: boolean } = {},
): Promise<boolean> {
  // `unaVez`: el aviso sale una sola vez por clave, no una por día (la marca va en avisos/siempre/).
  const dia = o.unaVez ? 'siempre' : (o.ahora ?? new Date()).toISOString().slice(0, 10);
  const llave = `${clave}|${dia}`;
  if (YA_AVISADO.has(llave)) return false;
  YA_AVISADO.add(llave);
  // Si el Storage no responde, se avisa igual: mejor un aviso de más que ninguno.
  if (marcaPersistente && (await marcaPersistente(dia, clave)) === 'ya') return false;
  console.error(`AVISO A LOS SOCIOS [${clave}]: ${asunto} — ${detalle}`);
  const claveResend = process.env.RESEND_API_KEY;
  const para = (process.env.MAIL_SOCIOS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  // Un aviso `unaVez` que no salió por mail no puede quedar marcado para siempre (el de «sin datos» deja a un
  // viajero que pagó sin mensajes): se borra la marca. Sin Resend o sin destinatarios, solo la de Storage (sale
  // cuando se carguen, sin repetir el log en cada tick); si Resend falla, también la de memoria (se reintenta).
  const deshacer = async (tambienMemoria: boolean) => {
    if (!o.unaVez) return;
    if (tambienMemoria) YA_AVISADO.delete(llave);
    await marcaPersistente?.quitar?.(dia, clave);
  };
  if (!claveResend || para.length === 0) {
    console.warn('avisos: falta RESEND_API_KEY o MAIL_SOCIOS; el aviso quedó solo en la consola.');
    await deshacer(false);
    return true;
  }
  try {
    const r = await (o.fetch ?? fetch)('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${claveResend}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: REMITENTE, to: para, subject: `[Vitácora V3] ${asunto}`, text: detalle }),
      signal: AbortSignal.timeout(15_000), // un Resend colgado no cuelga el aviso: tira y se atrapa abajo
    });
    if (!r.ok) {
      console.error(`avisos: Resend rechazó el aviso «${asunto}» (${r.status}).`);
      await deshacer(true);
    }
  } catch (err) {
    console.error(`avisos: no pude mandar el aviso «${asunto}» por mail:`, err instanceof Error ? err.message : err);
    await deshacer(true);
  }
  return true;
}
