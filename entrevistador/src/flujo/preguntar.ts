import { db } from '../db/cliente.js';
import { enviarPlantilla, enviarTexto, enviarAudioPorLink } from '../whatsapp/enviar.js';
import { generarReconocimiento, generarPreguntaReemplazo } from '../ia/cerebro.js';
import { generarAudioVoz } from '../ia/voz.js';
import { armarHistoria, ultimaTranscripcion } from '../db/historia.js';

export type Narrador = {
  id: string;
  familia_id: string;
  como_le_dicen: string;
  telefono_whatsapp: string;
  hora_preferida: string;
  zona_horaria: string;
  contexto: Record<string, any>;
  estado: string;
  dia_actual: number;
  ultima_respuesta_at: string | null;
  alerta_silencio: boolean;
};

/** Capítulos que no aplican a esta vida, según el árbol que cargó la familia. */
export function capituloNoAplica(contexto: Record<string, any>, capitulo: string): boolean {
  const arbol = contexto?.arbol ?? {};
  if (capitulo === 'Los hijos' && arbol.hijos === 'no tuvo') return true;
  if (capitulo === 'El amor' && arbol.conyuge === 'no tuvo') return true;
  return false;
}

/** ¿Este narrador está en modo rápido (pilotos: la siguiente pregunta sale al instante)? */
export function esModoRapido(contexto: Record<string, any>): boolean {
  return contexto?.modoRapido === true;
}

/** La pregunta de ese orden: la propia del narrador si existe, si no la fija global. */
export async function preguntaDeOrden(narradorId: string, orden: number) {
  const { data } = await db.from('preguntas').select('texto,capitulo,narrador_id')
    .or(`narrador_id.eq.${narradorId},narrador_id.is.null`)
    .eq('orden', orden)
    .order('narrador_id', { nullsFirst: false })
    .limit(1).maybeSingle();
  return data as { texto: string; capitulo: string; narrador_id: string | null } | null;
}

/** Genera y guarda una pregunta personalizada que reemplaza a la fija que no aplica. */
async function crearReemplazo(n: Narrador, orden: number, capituloQueNoAplica: string): Promise<string> {
  const { data: caps } = await db.from('preguntas').select('capitulo').is('narrador_id', null);
  const capitulos = [...new Set(((caps as { capitulo: string }[] | null) ?? []).map((c) => c.capitulo))]
    .filter((c) => c !== capituloQueNoAplica);
  const nueva = await generarPreguntaReemplazo(
    n.como_le_dicen, await armarHistoria(n.id), capitulos, capituloQueNoAplica,
  );
  await db.from('preguntas').insert({
    narrador_id: n.id, orden, texto: nueva.texto, capitulo: nueva.capitulo, tipo: 'adaptativa',
  });
  return nueva.texto;
}

/** La versión hablada de la pregunta: se sube a Storage y se manda por link firmado. */
async function enviarVozDeLaPregunta(n: Narrador, orden: number, contenido: string): Promise<void> {
  const audio = await generarAudioVoz(contenido);
  const path = `${n.id}/sistema/pregunta_${String(orden).padStart(2, '0')}.mp3`;
  await db.storage.from('audios').upload(path, audio, { contentType: 'audio/mpeg', upsert: true });
  const { data } = await db.storage.from('audios').createSignedUrl(path, 3600);
  if (data?.signedUrl) await enviarAudioPorLink(n.telefono_whatsapp, data.signedUrl);
}

/**
 * Manda la pregunta `orden` al narrador: reconocimiento + texto + audio,
 * avanza `dia_actual` y registra el envío.
 *
 * `plantilla: true`  → plantilla aprobada (inicia conversación, fuera de la ventana de 24 hs).
 * `plantilla: false` → texto libre (modo rápido: el narrador acaba de responder,
 *                      la ventana está abierta y no dependemos de una plantilla).
 *
 * Devuelve true si la envió, false si ya no quedan preguntas.
 */
export async function enviarPregunta(
  n: Narrador, orden: number, { plantilla }: { plantilla: boolean },
): Promise<boolean> {
  const pregunta = await preguntaDeOrden(n.id, orden);
  if (!pregunta) return false; // no hay más preguntas: el cierre lo maneja procesar

  let texto = pregunta.texto;
  // Regla de reemplazo: el capítulo no aplica a esta vida y todavía no hay reemplazo propio.
  if (pregunta.narrador_id === null && capituloNoAplica(n.contexto, pregunta.capitulo)) {
    texto = await crearReemplazo(n, orden, pregunta.capitulo);
  }

  const reconocimiento = n.dia_actual === 0
    ? 'Hoy empezamos este viaje.'
    : await generarReconocimiento(
        n.como_le_dicen,
        await ultimaTranscripcion(n.id),
        texto,
        await armarHistoria(n.id),
        n.contexto?.arbol ?? {},
        n.contexto?.anioNacimiento,
      );

  const waId = plantilla
    ? await enviarPlantilla(n.telefono_whatsapp, 'pregunta_diaria', [reconocimiento, texto])
    : await enviarTexto(n.telefono_whatsapp, `${reconocimiento}\n\nLa pregunta de hoy: ${texto}\n\nCuando quiera, me responde con un audio. Sin apuro. 🎙️`);

  await enviarVozDeLaPregunta(n, orden, `${reconocimiento} ${texto}`);

  const avance: Record<string, unknown> = { dia_actual: orden };
  if (n.estado === 'acepto') avance.estado = 'activo';
  await db.from('narradores').update(avance).eq('id', n.id);
  await db.from('envios').insert({
    narrador_id: n.id, tipo: 'pregunta', pregunta_orden: orden, wa_message_id: waId,
  });
  return true;
}
