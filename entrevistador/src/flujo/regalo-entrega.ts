// El regalo llega solo el día elegido (spec 2026-10-10-regalo-dia-de-entrega).
// Quien compró eligió fecha, hora (de 8 a 22, en la zona de quien recibe) y
// canal: ese día le llega a quien recibe un mail o una plantilla de WhatsApp, y
// a quien compró el «Hoy le llegó». Si no sale, el «dásela vos».
//
// Corre en el tick de 15 minutos del scheduler (sale a la hora en punto). El
// regalo se toma ANTES de mandar (compare-and-swap sobre entrega_enviada_at):
// dos ticks a la vez no lo mandan dos veces. Un envío que falla NO se reintenta
// solo: queda `entrega_fallo` y quien compró se entera para dársela en mano.

import type { SupabaseClient } from '@supabase/supabase-js';
import { PLANTILLA_REGALO_ENTREGA } from '../config.js';
import type { Idioma } from '../v3/nucleo/entrevista/idioma.js';
import { esTablaAusente } from '../v3/estado.js';
import { idiomaDeRegalo } from './regalo-arranque.js';
import { diaLocal, instanteDeEntrega } from './regalo-hora.js';
import { ENTREGA_ABUELO, ENTREGA_COMPRADOR, tratoDeComprador } from './regalo-textos.js';
import type { MandarMailFamilia } from './regalo.js';

export type DepsEntrega = {
  db: SupabaseClient;
  /** Un mail a cualquier dirección (Resend). Nunca tira: false si no salió. */
  mandarMail: (para: string, asunto: string, html: string, o?: { pie?: boolean }) => Promise<boolean>;
  mandarMailFamilia: MandarMailFamilia;
  enviarPlantilla: (tel: string, nombre: string, variables: string[], idiomaMeta: string, o: { botonUrl: string }) => Promise<string>;
  /** Donde vive la web (URL_BASE): el link a la página del regalo. */
  urlBase: string;
  /** El número del bot, solo dígitos (WHATSAPP_NUMERO_PUBLICO). Sin él, el mail va sin código. */
  numeroPublico: string | null;
  /** ¿Está aprobada en Meta la plantilla de ese idioma? (WA_PLANTILLAS_V3_LISTAS) */
  plantillaLista: (idioma: Idioma) => boolean;
};

type FilaRegalo = {
  id: string; codigo: string; narrador_id: string; quien_regala: string; mensaje: string; audio_path: string | null;
  fecha_entrega: string | null; entrega_canal: 'mail' | 'whatsapp' | null; entrega_contacto: string | null;
  entrega_hora: number | null; entrega_zona: string | null;
};

type Narrador = { familia_id: string; como_le_dicen: string; estado: string; contexto: Record<string, unknown> | null };

/** Para los logs: nunca el correo ni el teléfono entero. */
export function enmascarar(contacto: string): string {
  const arroba = contacto.indexOf('@');
  if (arroba > 0) return `${contacto.slice(0, Math.min(2, arroba))}***${contacto.slice(arroba)}`;
  return `${contacto.slice(0, 3)}***${contacto.slice(-4)}`;
}

/** PostgREST no conoce la tabla o la columna: la migración todavía no se aplicó. */
function faltaLaMigracion(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return esTablaAusente(error) || error.code === '42703' || error.code === 'PGRST204';
}

function escapar(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** El cuerpo del mail a quien recibe, en el idioma del regalo. Puro. */
export function htmlParaQuienRecibe(o: {
  idioma: Idioma; comoLeDicen: string; quienRegala: string; mensaje: string; conAudio: boolean;
  link: string; codigo: string; numeroPublico: string | null;
}): string {
  const t = ENTREGA_ABUELO[o.idioma];
  const partes = [
    `<p style="font-size:22px;">${escapar(t.titulo(o.comoLeDicen, o.quienRegala))}</p>`,
    `<p>${escapar(t.antesDelMensaje)}</p>`,
    `<p style="font-style:italic;border-left:3px solid #D4D4CE;padding-left:16px;">${escapar(o.mensaje).replace(/\r?\n/g, '<br>')}</p>`,
    ...(o.conAudio ? [`<p>${escapar(t.siHayAudio)}</p>`] : []),
    `<p>${t.explica.map(escapar).join('<br>')}</p>`,
    `<p style="margin-top:28px;"><a href="${escapar(o.link)}" style="display:inline-block;background:#5D3FD3;color:#ffffff;text-decoration:none;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;">${escapar(t.boton)}</a></p>`,
  ];
  if (o.numeroPublico) {
    partes.push(
      `<p style="margin-top:28px;font-size:14px;color:#5F5F55;">${escapar(t.debajoDelBoton(`+${o.numeroPublico}`))}</p>`,
      `<p style="font-size:24px;letter-spacing:0.12em;font-family:Helvetica,Arial,sans-serif;">${escapar(o.codigo)}</p>`,
    );
  }
  return partes.join('\n');
}

async function tratoDeLaFamilia(db: SupabaseClient, familiaId: string) {
  const { data } = await db.from('familias').select('region').eq('id', familiaId).maybeSingle();
  return tratoDeComprador((data as { region?: unknown } | null)?.region);
}

/**
 * Anota por qué no salió (una sola vez) y le avisa a quien compró que se la dé
 * en mano. Lo usa también el webhook, cuando Meta avisa que la plantilla no se
 * entregó. Nunca tira.
 */
export async function fallarEntregaRegalo(
  deps: Pick<DepsEntrega, 'db' | 'mandarMailFamilia'>, narradorId: string, motivo: string,
): Promise<void> {
  try {
    const { data, error } = await deps.db.from('regalos')
      .update({ entrega_fallo: motivo })
      .eq('narrador_id', narradorId).not('entrega_canal', 'is', null).is('entrega_fallo', null)
      .select('id, entrega_contacto');
    if (error) {
      console.error(`regalo-entrega: no pude anotar el fallo de ${narradorId}:`, error.message);
      return;
    }
    const fila = (data as { entrega_contacto: string }[] | null)?.[0];
    if (!fila) return; // ya estaba anotado (o no tenía entrega): ya se avisó
    const { data: n } = await deps.db.from('narradores').select('familia_id, como_le_dicen').eq('id', narradorId).maybeSingle();
    if (!n) return;
    const t = ENTREGA_COMPRADOR[await tratoDeLaFamilia(deps.db, n.familia_id)];
    const ok = await deps.mandarMailFamilia(n.familia_id, t.falloAsunto(n.como_le_dicen), t.falloCuerpo(fila.entrega_contacto), narradorId, { boton: true });
    console.warn(`regalo-entrega: no salió el regalo de ${narradorId} (${motivo})${ok ? '' : '; tampoco salió el aviso a la familia'}`);
  } catch (err) {
    console.error(`regalo-entrega: falló el aviso de fallo de ${narradorId}:`, err);
  }
}

/** Manda los regalos cuya fecha y hora ya llegaron. Devuelve cuántos salieron. */
export async function entregarRegalos(deps: DepsEntrega, ahora: Date): Promise<number> {
  const { db } = deps;
  // Corte grueso: hasta mañana en UTC (en ninguna zona nuestra el día local va más adelante).
  const manana = new Date(ahora.getTime() + 24 * 3600_000).toISOString().slice(0, 10);
  const { data, error } = await db.from('regalos')
    .select('id, codigo, narrador_id, quien_regala, mensaje, audio_path, fecha_entrega, entrega_canal, entrega_contacto, entrega_hora, entrega_zona')
    .not('entrega_canal', 'is', null).is('entrega_enviada_at', null).is('usado_at', null)
    .lte('fecha_entrega', manana);
  if (error) {
    if (faltaLaMigracion(error)) return 0;
    throw error;
  }

  let mandados = 0;
  for (const r of (data ?? []) as FilaRegalo[]) {
    if (!r.entrega_canal || !r.entrega_contacto || r.entrega_hora === null || !r.entrega_zona || !r.fecha_entrega) continue;
    if (instanteDeEntrega(r.fecha_entrega, r.entrega_hora, r.entrega_zona).getTime() > ahora.getTime()) continue;

    const { data: n } = await db.from('narradores')
      .select('familia_id, como_le_dicen, estado, contexto').eq('id', r.narrador_id).maybeSingle();
    const narrador = n as Narrador | null;
    if (!narrador || narrador.estado !== 'regalo_pendiente') continue;

    const { data: tomado, error: errorTomar } = await db.from('regalos')
      .update({ entrega_enviada_at: ahora.toISOString() })
      .eq('id', r.id).is('entrega_enviada_at', null).select('id');
    if (errorTomar) {
      console.error(`regalo-entrega: no pude tomar ${r.id}:`, errorTomar.message);
      continue;
    }
    if (!tomado?.length) continue; // lo tomó otra corrida

    // Se pasó el día (el bot estuvo caído): no se manda tarde.
    if (diaLocal(ahora, r.entrega_zona) > r.fecha_entrega) {
      await fallarEntregaRegalo(deps, r.narrador_id, 'dia_vencido');
      continue;
    }

    const idioma = idiomaDeRegalo(narrador.contexto);
    let fallo: string | null = null;
    if (r.entrega_canal === 'mail') {
      const html = htmlParaQuienRecibe({
        idioma, comoLeDicen: narrador.como_le_dicen, quienRegala: r.quien_regala, mensaje: r.mensaje,
        conAudio: !!r.audio_path, link: `${deps.urlBase}/regalo/${encodeURIComponent(r.codigo)}`,
        codigo: r.codigo, numeroPublico: deps.numeroPublico,
      });
      // El pie de los mails está en castellano: en catalán va sin él.
      const ok = await deps.mandarMail(r.entrega_contacto, ENTREGA_ABUELO[idioma].asunto(r.quien_regala), html, { pie: idioma !== 'ca' });
      if (!ok) fallo = 'mail';
    } else if (!deps.plantillaLista(idioma)) {
      fallo = 'sin_plantilla';
    } else {
      try {
        const p = PLANTILLA_REGALO_ENTREGA[idioma];
        const waId = await deps.enviarPlantilla(r.entrega_contacto, p.nombre, [narrador.como_le_dicen, r.quien_regala], p.idiomaMeta, { botonUrl: r.codigo });
        // Anotada en envios para que el webhook sepa si Meta la entregó (entregas.ts).
        const { error: errorEnvio } = await db.from('envios')
          .insert({ narrador_id: r.narrador_id, tipo: 'regalo_entrega', pregunta_orden: null, wa_message_id: waId });
        if (errorEnvio) console.error(`regalo-entrega: salió la plantilla de ${r.narrador_id} pero no pude anotar el envío:`, errorEnvio.message);
      } catch (err) {
        console.error(`regalo-entrega: Meta rechazó la plantilla a ${enmascarar(r.entrega_contacto)}:`, err instanceof Error ? err.message : err);
        fallo = 'whatsapp';
      }
    }
    if (fallo) {
      await fallarEntregaRegalo(deps, r.narrador_id, fallo);
      continue;
    }

    mandados++;
    console.log(`regalo-entrega: salió el regalo de ${r.narrador_id} por ${r.entrega_canal} a ${enmascarar(r.entrega_contacto)}`);
    const t = ENTREGA_COMPRADOR[await tratoDeLaFamilia(db, narrador.familia_id)];
    const ok = await deps.mandarMailFamilia(narrador.familia_id, t.llegoAsunto(narrador.como_le_dicen), t.llegoCuerpo(r.entrega_contacto), r.narrador_id, { boton: false });
    if (!ok) console.error(`regalo-entrega: salió el regalo de ${r.narrador_id} pero no el «Hoy le llegó» a la familia`);
  }
  return mandados;
}
