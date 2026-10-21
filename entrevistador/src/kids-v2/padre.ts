// El padre de un chico de canal A que le escribe al número del bot (CONTRATO, «Vitácora Kids V2 por WhatsApp»,
// «Para decidir con Joaquín», punto 2; decisión de Naza del 15/10). En canal A las preguntas van al WhatsApp del chico
// y el padre tiene su número en `kids_v2.telefono_padre`, que no es un narrador: procesar.ts no lo encuentra y llega
// acá (antes del canje del regalo, salvo que el mensaje traiga un código con VF).
//
// - Se le contesta UNA vez por chico TEXTO_AL_PADRE, como texto libre (acaba de escribir: la ventana de 24 h está
//   abierta), y nada más. Que ya se le contestó queda en `kids_v2.estado.respondioAlPadre`, con compare-and-swap: se
//   marca antes de mandar (dos mensajes juntos no contestan dos veces) y, si Meta falla, se desmarca y se avisa.
// - Lo que mande NO entra al motor ni a `respuestas` (se acusaría como si fuera del chico). Se les avisa a los socios
//   qué escribió, cada vez: puede ser importante.
// - Si el número es padre de dos chicos de canal A, no se contesta (no hay texto aprobado para varios) y se avisa.
// - Antes del arranque (`estado` null) no hay dónde recordar que se contestó: no se contesta y se avisa.
// - Si el número además es un narrador (un padre que también tiene su biografía), procesar.ts lo encuentra primero y
//   manda el flujo del narrador, como siempre: esto no corre.
// - Sin la migración, o si el chico está en pendiente_pago, no es un padre de Kids: todo sigue como hoy.

import type { MensajeEntrante } from '../whatsapp/webhook.js';
import { variantesDeTelefono } from '../whatsapp/telefonos.js';
import type { DepsKids } from './deps.js';
import { conReintento, filasDelPadre } from './filas.js';
import { idiomaDeFila } from './idioma.js';
import type { IdiomaKids } from './nucleo/idioma.js';
import type { FilaKids } from './tipos.js';

/**
 * Lo que se le contesta al padre, una sola vez por chico. Texto aprobado por Naza 15/10 («panel» → «la página de su historia», Naza 20/10): no se cambia sin su OK.
 * `{apodo}` = cómo le dicen al chico (`ficha.apodo`). No está en el banco del motor porque el banco sale de los md
 * aprobados de docs/kids/v2 (que no se editan) y el motor no ve al padre de canal A. Tampoco tiene versión en
 * banco-es-ES.md: va el mismo a España (no tiene voseo: «ves» es igual con tú), hasta que Naza apruebe otro.
 * Si un idioma no tuviera el suyo, al padre no se le contesta nada, nunca en castellano, y se avisa a los socios.
 */
export const TEXTO_AL_PADRE = 'Este número es para las preguntas de {apodo}. Lo que cuenta lo ves en la página de su historia.';

/** En catalán: Aprobado por Naza el 16/10/2026 (tanda 10), de docs/rediseno-2026-10/kids/textos-ca-2026-10-16.md (rama de la web). */
export const TEXTO_AL_PADRE_CA = 'Aquest número és per a les preguntes de {apodo}. El que explica ho veus a la pàgina de la seva història.';

/** Por idioma del chico. */
export const TEXTOS_AL_PADRE: Readonly<Partial<Record<IdiomaKids, string>>> = { 'es-AR': TEXTO_AL_PADRE, 'es-ES': TEXTO_AL_PADRE, ca: TEXTO_AL_PADRE_CA };

/** El texto en el idioma del chico, o null si ese idioma todavía no tiene el suyo aprobado. */
export function textoAlPadre(apodo: string, idioma: IdiomaKids = 'es-AR'): string | null {
  return TEXTOS_AL_PADRE[idioma]?.replace('{apodo}', apodo) ?? null;
}

export type ResultadoPadre = 'no-es-padre' | 'contestado' | 'ya-contestado' | 'varios' | 'sin-arrancar' | 'sin-texto' | 'fallo-envio';

/** ¿Es el padre de un chico de canal A? Si lo es, se ocupa de todo y devuelve true; si no (o la base falla), false: sigue como hoy. */
export async function atenderPadreKids(deps: DepsKids, m: MensajeEntrante): Promise<boolean> {
  return (await procesarPadreKids(deps, m)) !== 'no-es-padre';
}

export async function procesarPadreKids(deps: DepsKids, m: MensajeEntrante): Promise<ResultadoPadre> {
  let chicos: FilaKids[];
  try {
    chicos = await chicosDelPadre(deps, m.telefono);
  } catch (err) {
    console.warn(`kids: no pude saber si ${m.telefono} es padre de un chico: ${err instanceof Error ? err.message : err}`);
    return 'no-es-padre';
  }
  if (chicos.length === 0) return 'no-es-padre';
  const ids = chicos.map((f) => f.narrador_id).join(',');
  const apodos = chicos.map((f) => `${f.ficha.apodo} (${f.narrador_id})`).join(' y ');
  const loQueMando = await queMando(deps, m, chicos[0]);
  const aviso = (que: string) => deps.avisar(`kids-padre-${ids}-${m.waMessageId}`, `Kids: el padre de ${chicos.map((f) => f.ficha.apodo).join(' y ')} le escribió al bot`,
    `${m.telefono}, padre de ${apodos} (canal A), le escribió al número del bot: ${loQueMando}. No entró al motor ni a respuestas. ${que}`);

  if (chicos.length > 1) {
    await aviso('Es padre de más de un chico de canal A y no hay texto aprobado para eso: no se le contestó nada.');
    return 'varios';
  }
  const fila = chicos[0];
  if (!fila.estado) {
    await aviso('Su Kids todavía no arrancó (no hay dónde recordar que se le contestó): no se le contestó nada.');
    return 'sin-arrancar';
  }
  const texto = textoAlPadre(fila.ficha.apodo, idiomaDeFila(fila));
  if (texto === null) {
    await aviso(`El chico está en ${idiomaDeFila(fila)} y no hay texto aprobado para contestarle al padre en ese idioma (falta el de Naza): no se le contestó nada.`);
    return 'sin-texto';
  }
  if (fila.estado.respondioAlPadre) {
    await aviso('Ya se le había contestado una vez: esta vez no se le contestó.');
    return 'ya-contestado';
  }
  // Se marca antes de mandar: si dos mensajes llegan juntos, uno solo gana el compare-and-swap y contesta.
  const marcado = await marcar(deps, fila.narrador_id, true);
  if (!marcado) {
    await aviso('Ya se le había contestado una vez: esta vez no se le contestó.');
    return 'ya-contestado';
  }
  let waId: string;
  try {
    waId = await deps.wa.texto(fila.telefono_padre, texto);
  } catch (err) {
    await marcar(deps, fila.narrador_id, false); // el próximo mensaje suyo lo vuelve a intentar
    await aviso(`Se le quiso contestar «${texto}» y WhatsApp falló (${err instanceof Error ? err.message : err}): no le llegó.`);
    return 'fallo-envio';
  }
  const { error } = await deps.db.from('envios').insert({ narrador_id: fila.narrador_id, tipo: 'kids', pregunta_orden: null, wa_message_id: waId });
  if (error) console.warn(`kids: no pude anotar en envios la respuesta al padre de ${fila.narrador_id}: ${error.message}`);
  await aviso(`Se le contestó, esta única vez: «${texto}».`);
  return 'contestado';
}

/** Los chicos de canal A de ese padre, sin los que están en pendiente_pago (el entrevistador no los toca). */
async function chicosDelPadre(deps: DepsKids, telefono: string): Promise<FilaKids[]> {
  const filas = await filasDelPadre<FilaKids>(deps.db, variantesDeTelefono(telefono));
  if (filas.length === 0) return [];
  const { data, error } = await deps.db.from('narradores').select('id,estado').in('id', filas.map((f) => f.narrador_id));
  if (error) throw new Error(`No pude leer los narradores de kids_v2: ${error.message}`);
  const pagados = new Set(((data as { id: string; estado: string }[] | null) ?? []).filter((n) => n.estado !== 'pendiente_pago').map((n) => n.id));
  return filas.filter((f) => pagados.has(f.narrador_id));
}

/** `estado.respondioAlPadre` con compare-and-swap. True si esta escritura lo cambió. */
async function marcar(deps: DepsKids, narradorId: string, valor: boolean): Promise<boolean> {
  try {
    const r = await conReintento<FilaKids, true>(deps.db, narradorId, (f) =>
      f.estado && (f.estado.respondioAlPadre === true) !== valor
        ? { cambio: { estado: { ...f.estado, respondioAlPadre: valor } }, resultado: true }
        : null);
    return r !== null;
  } catch (err) {
    console.error(`kids: no pude anotar la respuesta al padre de ${narradorId}: ${err instanceof Error ? err.message : err}`);
    return false;
  }
}

/** Lo que mandó, para el aviso: el texto; un audio, con su transcripción si se pudo; una foto o lo demás, solo qué fue. */
async function queMando(deps: DepsKids, m: MensajeEntrante, fila: FilaKids): Promise<string> {
  if (m.tipo === 'audio') {
    if (!m.mediaId) return 'un audio (vino sin media id)';
    try {
      const audio = await deps.wa.descargar(m.mediaId);
      const t = await deps.transcribir(audio, { nombre: fila.ficha.nombrePadre, idioma: idiomaDeFila(fila), narradorId: fila.narrador_id });
      return t.texto.trim() ? `un audio que dice «${t.texto.trim()}»` : 'un audio (la transcripción vino vacía)';
    } catch (err) {
      return `un audio que no se pudo transcribir (${err instanceof Error ? err.message : err}; media ${m.mediaId})`;
    }
  }
  const texto = m.texto?.trim();
  if (m.tipo === 'imagen') return texto ? `una foto con el texto «${texto}» (no se guardó)` : 'una foto (no se guardó)';
  return texto ? `«${texto}»` : `un mensaje de tipo ${m.tipo} sin texto`;
}
