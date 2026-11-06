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

export const VERSION_ELECCION = '2026-11-05';

type Quien = 'familia' | 'narrador';
export type VozEleccion = Idioma | 'usted';

// ESPERA aprobación de Naza · A-01 (05/11). «usted» es el guion clásico, que tutea o no según la ficha.
const PREGUNTA: Record<VozEleccion, string> = {
  'es-AR': 'Una cosa más, {{nombre}}. ¿Quién querés que vea lo que me vas contando y revise tu libro antes de imprimirlo? Si elegís a tu familia, quien te lo regaló y los familiares que invite pueden escuchar tus audios y leer tus respuestas mientras contás. Si preferís ser vos, nadie de tu familia los ve mientras tanto. Cuando terminemos vas a tener 48 horas para sacar lo que quieras, y cuando el libro esté listo te mando el link para que lo revises. Ellos lo reciben después. Si no contestás, queda como si hubieras elegido ser vos. Podés cambiarlo cuando quieras tocando el otro botón.',
  'es-ES': 'Una cosa más, {{nombre}}. ¿Quién quieres que vea lo que me vas contando y revise tu libro antes de imprimirlo? Si eliges a tu familia, quien te lo regaló y los familiares que invite pueden escuchar tus audios y leer tus respuestas mientras cuentas. Si prefieres ser tú, nadie de tu familia los ve mientras tanto. Cuando terminemos tendrás 48 horas para quitar lo que quieras, y cuando el libro esté listo te mando el enlace para que lo revises. Ellos lo reciben después. Si no contestas, queda como si hubieras elegido ser tú. Puedes cambiarlo cuando quieras pulsando el otro botón.',
  ca: "Una cosa més, {{nombre}}. Qui vols que vegi el que m'expliques i revisi el teu llibre abans d'imprimir-lo? Si tries la teva família, qui te l'ha regalat i els familiars que convidi poden escoltar els teus àudios i llegir les teves respostes mentre expliques. Si prefereixes ser tu, ningú de la teva família no els veu mentrestant. Quan acabem tindràs 48 hores per treure el que vulguis, i quan el llibre estigui a punt t'envio l'enllaç perquè el revisis. Ells el reben després. Si no contestes, queda com si haguessis triat ser tu. Ho pots canviar quan vulguis tocant l'altre botó.",
  usted: 'Una cosa más, {{nombre}}. ¿Quién quiere que vea lo que me va contando y revise su libro antes de imprimirlo? Si elige a su familia, quien se lo regaló y los familiares que invite pueden escuchar sus audios y leer sus respuestas mientras cuenta. Si prefiere ser usted, nadie de su familia los ve mientras tanto. Cuando terminemos va a tener 48 horas para sacar lo que quiera, y cuando el libro esté listo le mando el link para que lo revise. Ellos lo reciben después. Si no contesta, queda como si hubiera elegido ser usted. Puede cambiarlo cuando quiera tocando el otro botón.',
};

const BOTONES: Record<VozEleccion, { familia: string; narrador: string }> = {
  'es-AR': { familia: 'Mi familia', narrador: 'Prefiero yo' },
  'es-ES': { familia: 'Mi familia', narrador: 'Prefiero yo' },
  ca: { familia: 'La meva família', narrador: 'Prefereixo jo' },
  usted: { familia: 'Mi familia', narrador: 'Prefiero yo' },
};

// ESPERA aprobación de Naza · A-02 (05/11)
const ACUSE: Record<VozEleccion, Record<Quien, string>> = {
  'es-AR': {
    familia: 'Listo, {{nombre}}. Tu familia va a poder ver lo que vayas contando.',
    narrador: 'Listo, {{nombre}}. Lo que me cuentes no lo ve tu familia hasta que el libro esté listo. Cuando terminemos te mando un link, y vas a tener 48 horas para sacar lo que quieras.',
  },
  'es-ES': {
    familia: 'Listo, {{nombre}}. Tu familia podrá ver lo que vayas contando.',
    narrador: 'Listo, {{nombre}}. Lo que me cuentes no lo verá tu familia hasta que el libro esté listo. Cuando terminemos te enviaré un enlace, y tendrás 48 horas para quitar lo que quieras.',
  },
  ca: {
    familia: "D'acord, {{nombre}}. La teva família podrà veure el que vagis explicant.",
    narrador: "D'acord, {{nombre}}. El que m'expliquis no ho veurà la teva família fins que el llibre estigui a punt. Quan acabem t'enviaré un enllaç, i tindràs 48 hores per treure el que vulguis.",
  },
  usted: {
    familia: 'Listo, {{nombre}}. Su familia va a poder ver lo que vaya contando.',
    narrador: 'Listo, {{nombre}}. Lo que me cuente no lo ve su familia hasta que el libro esté listo. Cuando terminemos le mando un link, y va a tener 48 horas para sacar lo que quiera.',
  },
};

type ConContexto = { contexto?: Record<string, any> | null };

export function eligeAcceso(n: ConContexto): boolean {
  return n.contexto?.acceso?.elige === true;
}

const conNombre = (t: string, nombre: string) => t.replaceAll('{{nombre}}', nombre);

/** La voz del mensaje: el idioma, o el trato en el guion clásico. */
export function vozDeEleccion(contexto: ConContexto['contexto']): VozEleccion {
  if (contexto?.idioma === 'ca' || contexto?.idioma === 'es-ES') return contexto.idioma;
  if (contexto?.regalo === true || contexto?.bienvenidaV3 === true || contexto?.modo === 'historia') return 'es-AR';
  return contexto?.trato === 'vos' ? 'es-AR' : 'usted';
}

/** La pregunta con sus botones, si le toca. Nunca tira: si no sale, queda privado y la entrevista sigue. */
export async function preguntarAcceso(
  n: ConContexto & { id: string; como_le_dicen: string | null; telefono_whatsapp: string },
  voz: VozEleccion,
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
 * Atiende el botón. true: era de la elección y ya está (no sigue a ningún motor). Se relee el contexto: otro módulo puede
 * haberlo escrito entre medio. Un reenvío de Meta o el mismo botón otra vez no cambian nada ni contestan.
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
  const { data, error } = await db.from('narradores').select('contexto').eq('id', n.id).maybeSingle();
  if (error) {
    // No se pisa nada a ciegas. El botón se traga igual: no puede terminar como respuesta de la entrevista.
    console.error(`acceso: no pude leer a ${n.id} para anotar su elección:`, error.message);
    return true;
  }
  const contexto = { ...((data as ConContexto | null)?.contexto ?? n.contexto ?? {}) };
  if (contexto.acceso?.quien === quien) return true;
  contexto.acceso = { ...contexto.acceso, elige: true, quien, at: ahora.toISOString(), waMessageId: m.waMessageId, version: VERSION_ELECCION };
  const { error: errorUpdate } = await db.from('narradores').update({ contexto }).eq('id', n.id);
  if (errorUpdate) {
    console.error(`acceso: no pude anotar la elección de ${n.id}:`, errorUpdate.message);
    return true;
  }
  n.contexto = contexto;
  try {
    await enviarTexto(n.telefono_whatsapp, conNombre(ACUSE[vozDeEleccion(contexto)][quien], n.como_le_dicen ?? ''));
  } catch (err) {
    console.error(`acceso: no pude confirmarle a ${n.id}:`, err instanceof Error ? err.message : err);
  }
  return true;
}
