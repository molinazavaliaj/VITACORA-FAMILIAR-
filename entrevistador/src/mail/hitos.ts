import { db } from '../db/cliente.js';
import { HITO_ACEPTO_REGALO, HITO_ACEPTO_VIAJE, TEXTOS_REGALO_BOT, tratoDeComprador, type TratoComprador } from '../flujo/regalo-textos.js';

// Los mails de hitos que manda el entrevistador (docs/panel-usuario.md §9 y
// §11.6): los momentos de la entrevista que la familia quiere saber. Los del
// libro (terminó, recordatorios de cierre, libro listo) los manda la fábrica.
//
//   acepto    → dijo que sí: mañana arranca
//   primera   → contestó la primera pregunta: ya hay algo para escuchar
//   mitad     → va por la mitad del guion
//   silencio  → tres días sin responder: un llamado ayuda
//
// Resend por su API HTTP, igual que la web (web/src/lib/mail.ts): sin SDK.
// Sin RESEND_API_KEY no se tira: avisa por consola y sigue. Cada hito se
// manda UNA vez por narrador: queda anotado en `contexto.mailsEnviados`.
//
// Trato por país (Naza, 09/10): con vos a las familias de Argentina y con tú a las
// de España (`familias.region`). Sin región, vos, como siempre.

export type Hito = 'acepto' | 'primera' | 'mitad' | 'silencio';

type NarradorParaMail = {
  id: string;
  nombre?: string;
  como_le_dicen: string;
  familia_id: string;
  contexto: Record<string, any>;
};

const REMITENTE = process.env.MAIL_FROM ?? 'Vitácora Familiar <hola@vitacorafamiliar.com>';
const URL_BASE = process.env.URL_BASE ?? 'https://www.vitacorafamiliar.com';

function escapar(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Asunto y cuerpo de cada hito. Puro, para probarlo sin red. Un regalo tiene su
 * propio «dijo que sí» (la primera pregunta ya salió con el SÍ). Todos van de vos
 * o de tú según el trato de quien compró (Naza, 09/10: tú para España).
 */
export function redactarHito(
  hito: Hito,
  n: { nombre?: string; como_le_dicen: string; id: string },
  o: { regalo?: boolean; trato?: TratoComprador; viaje?: boolean } = {},
): { asunto: string; cuerpo: string } {
  const quien = n.nombre ?? n.como_le_dicen;
  const panel = `${URL_BASE}/tablero/${n.id}`;
  const tu = o.trato === 'tu';
  switch (hito) {
    case 'acepto':
      if (o.viaje === true || o.regalo === true) {
        const t = (o.viaje === true ? HITO_ACEPTO_VIAJE : HITO_ACEPTO_REGALO)[o.trato ?? 'vos'];
        return { asunto: t.asunto(quien), cuerpo: `<p>${escapar(t.cuerpo(quien))}</p><p><a href="${panel}">${panel}</a></p>` };
      }
      return {
        asunto: `${quien} dijo que sí`,
        // Texto aprobado por Naza el 06/10 (rama web-textos-v3): sin "repasar el guion", que en la V3 no existe.
        cuerpo: `<p>${escapar(quien)} aceptó. Enseguida le llega la primera pregunta por WhatsApp.</p><p>Mientras tanto, ${tu ? 'puedes' : 'podés'} sumar fotos de cada época o preguntas para su entrevista.</p><p><a href="${panel}?editar=1">${panel}</a></p>`,
      };
    case 'primera':
      return {
        asunto: `Ya ${tu ? 'puedes' : 'podés'} escuchar a ${quien}`,
        cuerpo: `<p>${escapar(quien)} contestó la primera pregunta. Ya hay un audio y su transcripción en el panel.</p><p><a href="${panel}">${panel}</a></p>`,
      };
    case 'mitad':
      return {
        asunto: `${quien} va por la mitad`,
        cuerpo: `<p>${escapar(quien)} ya contó la mitad de su historia. Es un buen momento para leer lo que hay y, si ${tu ? 'quieres' : 'querés'}, pedirle que cuente más sobre algo.</p><p><a href="${panel}">${panel}</a></p>`,
      };
    case 'silencio':
      return {
        asunto: `Hace tres días que ${quien} no responde`,
        cuerpo: `<p>${escapar(quien)} lleva tres días sin contestar. No pasa nada grave: a veces es el teléfono, a veces las ganas. Un llamado tuyo suele destrabarlo.</p><p>Cuando retome, la entrevista sigue donde quedó: <a href="${panel}">${panel}</a></p>`,
      };
  }
}

/** `pie` (por defecto true): la línea de abajo, en castellano (el mail del regalo en catalán va sin ella). */
function envoltorio(cuerpo: string, pie = true): string {
  return `<!DOCTYPE html><html lang="es"><body style="margin:0;background:#F7F7F5;font-family:Georgia,serif;color:#14140F;">
<div style="max-width:560px;margin:0 auto;padding:40px 24px;">
<p style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#5F5F55;font-family:Helvetica,Arial,sans-serif;">Vitácora Familiar</p>
<div style="font-size:17px;line-height:1.6;">${cuerpo}</div>
${pie ? '<p style="margin-top:40px;font-size:12px;color:#83837A;font-family:Helvetica,Arial,sans-serif;">Para las vidas que merecen su propio libro.</p>\n' : ''}</div></body></html>`;
}

async function enviar(para: string, asunto: string, html: string): Promise<boolean> {
  const clave = process.env.RESEND_API_KEY;
  if (!clave) {
    console.warn(`mail: falta RESEND_API_KEY, no se manda "${asunto}" a ${para}.`);
    return false;
  }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${clave}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: REMITENTE, to: [para], subject: asunto, html }),
  });
  if (!r.ok) throw new Error(`Resend rechazó "${asunto}" (${r.status}): ${await r.text()}`);
  return true;
}

/**
 * Manda el mail del hito a la familia, una sola vez por narrador. Nunca tira:
 * un mail que falla no puede frenar la entrevista.
 */
export async function mandarHito(n: NarradorParaMail, hito: Hito, o: { viaje?: boolean } = {}): Promise<void> {
  try {
    // Se relee el contexto: otro módulo puede haberlo escrito entre medio.
    const { data: fresco } = await db.from('narradores').select('contexto').eq('id', n.id).maybeSingle();
    const contexto = { ...((fresco as { contexto?: Record<string, any> } | null)?.contexto ?? n.contexto) };
    const enviados: string[] = Array.isArray(contexto.mailsEnviados) ? contexto.mailsEnviados : [];
    if (enviados.includes(hito)) return;

    const { data: familia } = await db.from('familias').select('email, region').eq('id', n.familia_id).maybeSingle();
    const para = (familia as { email?: string } | null)?.email;
    if (!para) return;

    const { asunto, cuerpo } = redactarHito(hito, n, {
      regalo: contexto.regalo === true,
      viaje: o.viaje === true,
      trato: tratoDeComprador((familia as { region?: unknown } | null)?.region),
    });
    const mandado = await enviar(para, asunto, envoltorio(cuerpo));
    if (!mandado) return;

    contexto.mailsEnviados = [...enviados, hito];
    n.contexto = { ...n.contexto, mailsEnviados: contexto.mailsEnviados };
    await db.from('narradores').update({ contexto }).eq('id', n.id);
  } catch (err) {
    console.error(`mail: falló el hito '${hito}' de ${n.id}:`, err);
  }
}

/**
 * Un mail suelto a la familia (gift card: el recordatorio de los 15 días), con
 * el cuerpo escapado y el botón «Ver la tarjeta» a la página del regalo en el
 * tablero. Nunca tira: `false` si no hay mail, falta la key o Resend falla.
 */
export async function mandarMailFamilia(
  familiaId: string, asunto: string, cuerpo: string, narradorId: string, o: { boton?: boolean } = {},
): Promise<boolean> {
  try {
    const { data: familia } = await db.from('familias').select('email').eq('id', familiaId).maybeSingle();
    const para = (familia as { email?: string } | null)?.email;
    if (!para) return false;
    const link = `${URL_BASE}/tablero/${encodeURIComponent(narradorId)}/regalo`;
    const boton = o.boton === false ? '' : `<p style="margin-top:28px;"><a href="${escapar(link)}" style="display:inline-block;background:#5D3FD3;color:#ffffff;text-decoration:none;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;">${escapar(TEXTOS_REGALO_BOT.botonTarjeta)}</a></p>`;
    const html = `<p>${escapar(cuerpo)}</p>${boton}`;
    return await enviar(para, asunto, envoltorio(html));
  } catch (err) {
    console.error(`mail: falló el mail a la familia ${familiaId} ("${asunto}"):`, err);
    return false;
  }
}

/**
 * Un mail a cualquier dirección, con el cuerpo ya armado en HTML (el regalo que
 * llega solo el día elegido, a quien recibe). Nunca tira: false si falta la key
 * o Resend falla.
 */
export async function mandarMail(para: string, asunto: string, html: string, o: { pie?: boolean } = {}): Promise<boolean> {
  try {
    return await enviar(para, asunto, envoltorio(html, o.pie !== false));
  } catch (err) {
    console.error(`mail: falló "${asunto}":`, err instanceof Error ? err.message : err);
    return false;
  }
}
