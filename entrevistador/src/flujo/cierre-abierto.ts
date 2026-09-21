import { db } from '../db/cliente.js';
import { capitulosDe, preguntaDeOrden, ultimoOrden } from '../db/guion.js';
import { clasificarCierre } from '../ia/cerebro.js';
import { tratoDe, type Trato } from '../ia/trato.js';
import { textoEvitar } from '../ia/evitar.js';
import { armarHistoria } from '../db/historia.js';
import { enviarPregunta, ritmoDe, type Narrador } from './preguntar.js';

// La pregunta de cierre (Joaquín, 18/09): después de las 4 finales, el biógrafo
// pregunta si faltó algo. Es UNA pregunta más del guion (tipo 'adaptativa',
// la familia no la edita), así que ritmo, recordatorio, panel y fábrica la
// tratan como a cualquiera. Lo distinto pasa al responderla:
//   - contó algo   → queda como respuesta (la pregunta se reescribe para que el
//                    libro tenga un pie coherente, en el capítulo que toque)
//   - nombró un tema → esa misma orden se convierte en una pregunta sobre el
//                    tema y se le manda ya; su "preguntame por…" no va al libro
//   - dijo que no  → se borran pregunta y respuesta, y se despide
// Como mucho dos vueltas de "¿algo más?" (`contexto.cierre.vueltas`).

export const VUELTAS_MAXIMO = 2;

type EstadoCierre = { vueltas: number; ordenes: number[] };

function estadoDe(contexto: Record<string, any>): EstadoCierre {
  const c = contexto?.cierre;
  return { vueltas: Number(c?.vueltas ?? 0), ordenes: Array.isArray(c?.ordenes) ? c.ordenes.map(Number) : [] };
}

/** El texto de la pregunta de cierre, según la vuelta y el trato. Aprobado por los socios el 18/09. */
export function textoDeCierre(vuelta: number, trato: Trato): string {
  if (vuelta <= 1) {
    return trato === 'vos'
      ? 'Antes de cerrar: ¿hay algo que no te pregunté y que te gustaría que esté en el libro? Una persona, una época, una historia que te quedaste con ganas de contar. Contame, o decime el tema y yo te pregunto.'
      : 'Antes de cerrar: ¿hay algo que no le pregunté y que le gustaría que esté en el libro? Una persona, una época, una historia que se quedó con ganas de contar. Cuénteme, o dígame el tema y yo le pregunto.';
  }
  return trato === 'vos'
    ? '¿Algo más que quieras agregar al libro? Si no, con esto cerramos.'
    : '¿Algo más que quiera agregar al libro? Si no, con esto cerramos.';
}

export function esOrdenDeCierre(contexto: Record<string, any>, orden: number): boolean {
  return estadoDe(contexto).ordenes.includes(orden);
}

async function guardarEstado(n: Narrador, cierre: EstadoCierre): Promise<void> {
  const { data } = await db.from('narradores').select('contexto').eq('id', n.id).maybeSingle();
  const contexto = { ...(((data as { contexto?: Record<string, any> } | null)?.contexto) ?? {}), cierre };
  await db.from('narradores').update({ contexto }).eq('id', n.id);
  n.contexto = { ...n.contexto, cierre };
}

async function borrarRespuestasDe(narradorId: string, orden: number): Promise<void> {
  const { data } = await db.from('respuestas').select('id, audio_path').eq('narrador_id', narradorId).eq('pregunta_orden', orden);
  const filas = (data as { id: string; audio_path: string | null }[] | null) ?? [];
  const paths = filas.map((r) => r.audio_path).filter((p): p is string => Boolean(p));
  if (paths.length) await db.storage.from('audios').remove(paths);
  if (filas.length) await db.from('respuestas').delete().eq('narrador_id', narradorId).eq('pregunta_orden', orden);
}

/** Inserta la pregunta de cierre en la orden siguiente y la manda según el ritmo. */
async function ofrecerCierre(n: Narrador, cierre: EstadoCierre): Promise<void> {
  const orden = (await ultimoOrden(n.id)) + 1;
  const capitulos = await capitulosDe(n.id);
  const vuelta = cierre.vueltas + 1;
  await db.from('preguntas').insert({
    narrador_id: n.id, orden, texto: textoDeCierre(vuelta, await tratoDe(n)),
    capitulo: capitulos[capitulos.length - 1] ?? 'Otros', tipo: 'adaptativa',
  });
  await guardarEstado(n, { vueltas: vuelta, ordenes: [...cierre.ordenes, orden] });
  // En modo seguido sale ya; en los otros ritmos la manda el scheduler a su hora.
  if (ritmoDe(n.contexto) === 'seguido') await enviarPregunta(n, orden, { plantilla: false });
}

/**
 * Se llama cuando acaba de responder la ÚLTIMA pregunta que existe en su guion
 * (con las adaptativas ya generadas). Devuelve true si la entrevista SIGUE
 * (se mandó o programó otra pregunta); false si hay que despedirse.
 */
export async function faseDeCierre(n: Narrador, orden: number, transcripcion: string): Promise<boolean> {
  const cierre = estadoDe(n.contexto);

  if (cierre.ordenes.includes(orden)) {
    const pregunta = await preguntaDeOrden(n.id, orden);
    const capitulos = await capitulosDe(n.id);
    const veredicto = await clasificarCierre(n.como_le_dicen, transcripcion, capitulos, await armarHistoria(n.id), textoEvitar(n.contexto), await tratoDe(n), n.id);

    if (veredicto.tipo === 'nada') {
      // "No, está todo": ni la pregunta ni el "no" van al libro.
      await borrarRespuestasDe(n.id, orden);
      if (pregunta) await db.from('preguntas').delete().eq('id', pregunta.id);
      await guardarEstado(n, { vueltas: cierre.vueltas, ordenes: cierre.ordenes.filter((o) => o !== orden) });
      return false;
    }

    if (veredicto.tipo === 'tema') {
      // Nombró un tema: esa orden pasa a ser la pregunta sobre el tema y se la mandamos ya
      // (acaba de escribir, la ventana está abierta). Su "preguntame por…" no va al libro.
      await borrarRespuestasDe(n.id, orden);
      if (pregunta) await db.from('preguntas').update({ texto: veredicto.pregunta, capitulo: veredicto.capitulo }).eq('id', pregunta.id);
      await guardarEstado(n, { vueltas: cierre.vueltas, ordenes: cierre.ordenes.filter((o) => o !== orden) });
      await enviarPregunta(n, orden, { plantilla: false });
      return true;
    }

    // Contó algo: queda como respuesta; la pregunta se reescribe para que el libro
    // tenga un pie coherente, en el capítulo que corresponda.
    if (pregunta) await db.from('preguntas').update({ texto: veredicto.pregunta, capitulo: veredicto.capitulo }).eq('id', pregunta.id);
  }

  if (cierre.vueltas >= VUELTAS_MAXIMO) return false;
  await ofrecerCierre(n, cierre);
  return true;
}
