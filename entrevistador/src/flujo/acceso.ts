// El narrador elige quién ve lo que cuenta (Joaquín, 05/11). Solo los que llevan
// la marca que pone la compra (`contexto.acceso.elige`, web/src/lib/acceso-contenido.ts):
// ventas nuevas de Familiar e Historia para otra persona. Sin la marca, nada de
// esto corre y la entrevista sigue exactamente como siempre.
//
// La pregunta va después del SÍ y NO frena la entrevista: la primera pregunta
// sale igual. Si no contesta, queda privado (el silencio no abre nada). Los
// botones se pueden tocar cuando sea: vale el último, así se cambia de opinión.
// El botón se atiende en procesar.ts ANTES de los motores: nunca cuenta como
// respuesta de la entrevista.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Idioma } from '../v3/nucleo/entrevista/idioma.js';
import { avisarSocios } from '../v3/avisos.js';

export const VERSION_ELECCION = '2026-11-06';

type Quien = 'familia' | 'narrador';

// A-01 · vos y tú: APROBADOS por Naza el 06/11. El catalán lo revisa Imma.
const PREGUNTA: Record<Idioma, string> = {
  'es-AR': 'Una cosa más, {{nombre}}. ¿Quién querés que vea lo que me vas contando mientras armamos tu libro? Si elegís a tu familia, quien te lo regaló y los familiares que invite pueden escuchar tus audios y leer tus respuestas, y quien te lo regaló puede dejar cosas afuera del libro. Si elegís solo vos, nadie de tu familia los ve mientras tanto, y cuando terminemos vas a tener 48 horas para sacar lo que quieras. En los dos casos, tu familia lee el libro cuando esté listo. Si no contestás, queda como si hubieras elegido solo vos. Podés cambiarlo cuando quieras tocando el otro botón.',
  'es-ES': 'Una cosa más, {{nombre}}. ¿Quién quieres que vea lo que me vas contando mientras preparamos tu libro? Si eliges a tu familia, quien te lo regaló y los familiares que invite pueden escuchar tus audios y leer tus respuestas, y quien te lo regaló puede dejar cosas fuera del libro. Si eliges solo tú, nadie de tu familia los ve mientras tanto, y cuando terminemos tendrás 48 horas para quitar lo que quieras. En los dos casos, tu familia lee el libro cuando esté listo. Si no contestas, queda como si hubieras elegido solo tú. Puedes cambiarlo cuando quieras pulsando el otro botón.',
  ca: "Una cosa més, {{nombre}}. Qui vols que vegi el que m'expliques mentre preparem el teu llibre? Si tries la teva família, qui te l'ha regalat i els familiars que convidi poden escoltar els teus àudios i llegir les teves respostes, i qui te l'ha regalat pot deixar coses fora del llibre. Si tries només tu, ningú de la teva família no els veu mentrestant, i quan acabem tindràs 48 hores per treure el que vulguis. En tots dos casos, la teva família llegeix el llibre quan estigui a punt. Si no contestes, queda com si haguessis triat només tu. Ho pots canviar quan vulguis tocant l'altre botó.",
};

const BOTONES: Record<Idioma, { familia: string; narrador: string }> = {
  'es-AR': { familia: 'Mi familia', narrador: 'Solo yo' },
  'es-ES': { familia: 'Mi familia', narrador: 'Solo yo' },
  ca: { familia: 'La meva família', narrador: 'Només jo' },
};

// A-02 · vos y tú: APROBADOS por Naza el 06/11. El catalán lo revisa Imma.
const ACUSE: Record<Idioma, Record<Quien, string>> = {
  'es-AR': {
    familia: 'Listo, {{nombre}}. Tu familia va a poder ver todo lo que me cuentes, también lo que ya me contaste.',
    narrador: 'Listo, {{nombre}}. Lo que me cuentes no lo va a ver tu familia hasta que el libro esté listo. Cuando terminemos te mando un link, y vas a tener 48 horas para sacar lo que quieras.',
  },
  'es-ES': {
    familia: 'Listo, {{nombre}}. Tu familia podrá ver todo lo que me cuentes, también lo que ya me has contado.',
    narrador: 'Listo, {{nombre}}. Lo que me cuentes no lo verá tu familia hasta que el libro esté listo. Cuando terminemos te enviaré un enlace, y tendrás 48 horas para quitar lo que quieras.',
  },
  ca: {
    familia: "D'acord, {{nombre}}. La teva família podrà veure tot el que m'expliquis, també el que ja m'has explicat.",
    narrador: "D'acord, {{nombre}}. El que m'expliquis no ho veurà la teva família fins que el llibre estigui a punt. Quan acabem t'enviaré un enllaç, i tindràs 48 hores per treure el que vulguis.",
  },
};

type ConContexto = { contexto?: Record<string, any> | null };

export function eligeAcceso(n: ConContexto): boolean {
  return n.contexto?.acceso?.elige === true;
}

const conNombre = (t: string, nombre: string) => t.replaceAll('{{nombre}}', nombre);

/** El idioma del mensaje. Nunca de usted (Naza, 06/11): si una venta nueva pasara por el guion clásico, va de tú. */
export function vozDeEleccion(contexto: ConContexto['contexto']): Idioma {
  if (contexto?.idioma === 'ca' || contexto?.idioma === 'es-ES') return contexto.idioma;
  if (contexto?.regalo === true || contexto?.bienvenidaV3 === true || contexto?.modo === 'historia' || contexto?.trato === 'vos') return 'es-AR';
  return 'es-ES';
}

/** La pregunta con sus botones, si le toca. Nunca tira: si no sale, queda privado y la entrevista sigue. */
export async function preguntarAcceso(
  n: ConContexto & { id: string; como_le_dicen: string | null; telefono_whatsapp: string },
  voz: Idioma,
  botones: (telefono: string, texto: string, botones: string[]) => Promise<unknown>,
): Promise<void> {
  if (!eligeAcceso(n) || n.contexto?.acceso?.quien) return;
  const b = BOTONES[voz];
  try {
    await botones(n.telefono_whatsapp, conNombre(PREGUNTA[voz], n.como_le_dicen ?? ''), [b.familia, b.narrador]);
  } catch (err) {
    console.error(`acceso: no pude preguntarle a ${n.id}; queda privado:`, err instanceof Error ? err.message : err);
  }
}

/** ¿Este botón es de la elección? */
export function quienDelBoton(texto: string | null | undefined): Quien | null {
  const t = (texto ?? '').trim();
  for (const b of Object.values(BOTONES)) {
    if (t === b.familia) return 'familia';
    if (t === b.narrador) return 'narrador';
  }
  return null;
}

/**
 * Atiende el botón. true: era de la elección y ya está (no sigue a ningún motor). Guarda con anotar_eleccion_acceso,
 * que la escribe de una sola vez y sin tocar el resto del contexto; un trigger impide que otra escritura la pise
 * (migración 20261106000100). Solo confirma lo que quedó guardado. Un reenvío de Meta o el mismo botón no cambian nada.
 */
export async function atenderEleccion(
  db: SupabaseClient,
  n: ConContexto & { id: string; como_le_dicen: string | null; telefono_whatsapp: string },
  m: { esBoton?: boolean; texto?: string | null; waMessageId?: string },
  enviarTexto: (telefono: string, texto: string) => Promise<unknown>,
  ahora = new Date(),
): Promise<boolean> {
  if (!eligeAcceso(n) || m.esBoton !== true) return false;
  const quien = quienDelBoton(m.texto);
  if (!quien) return false;
  const acceso = { quien, at: ahora.toISOString(), waMessageId: m.waMessageId, version: VERSION_ELECCION };
  const { data: cambio, error } = await db.rpc('anotar_eleccion_acceso', { p_narrador: n.id, p_acceso: acceso });
  if (error) {
    // El botón se traga igual: no puede terminar como respuesta de la entrevista. No se le confirma nada.
    console.error(`acceso: no pude anotar la elección de ${n.id}:`, error.message);
    await avisarSocios(`acceso-eleccion:${n.id}`, 'No se guardó la elección de un narrador',
      `${n.id} tocó «${m.texto}» y no se pudo guardar (${error.message}). No se le confirmó nada y sigue como estaba. Si es la primera vez, mirar que la migración 20261106000100 esté aplicada.`,
      { unaVez: true }).catch(() => undefined);
    return true;
  }
  if (cambio !== true) return true;
  n.contexto = { ...n.contexto, acceso: { ...n.contexto?.acceso, ...acceso } };
  try {
    await enviarTexto(n.telefono_whatsapp, conNombre(ACUSE[vozDeEleccion(n.contexto)][quien], n.como_le_dicen ?? ''));
  } catch (err) {
    console.error(`acceso: no pude confirmarle a ${n.id}:`, err instanceof Error ? err.message : err);
  }
  return true;
}
