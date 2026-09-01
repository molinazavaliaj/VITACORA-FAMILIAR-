import type { MensajeEntrante } from '../whatsapp/webhook.js';
import { db } from '../db/cliente.js';
import { enviarTexto } from '../whatsapp/enviar.js';
import { descargarAudio } from '../whatsapp/media.js';
import { guardarRespuestaAudio } from '../db/respuestas.js';
import { transcribirYActualizar } from '../ia/transcribir.js';
import { evaluarRespuesta, detectarIntencion } from '../ia/cerebro.js';
import { generarPreguntasAdaptativas } from '../ia/adaptativas.js';

const ULTIMA_FIJA = 25; // después de la 25 vienen las 5 adaptativas

type Narrador = {
  id: string;
  telefono_whatsapp: string;
  como_le_dicen: string;
  estado: string;
  dia_actual: number;
};

async function buscarNarrador(telefono: string): Promise<Narrador | null> {
  const { data } = await db.from('narradores').select('*').eq('telefono_whatsapp', telefono).maybeSingle();
  return (data as Narrador | null) ?? null;
}

// ¿Ya se le mandó una repregunta a este narrador para esta pregunta?
async function yaSeRepregunto(narradorId: string, orden: number): Promise<boolean> {
  const { data } = await db.from('envios').select('id')
    .eq('narrador_id', narradorId).eq('tipo', 'repregunta').eq('pregunta_orden', orden).limit(1);
  return (data?.length ?? 0) > 0;
}

async function textoDePregunta(narradorId: string, orden: number): Promise<string> {
  // Preferimos una pregunta propia del narrador (adaptativa/reemplazo) sobre la fija global.
  const { data } = await db.from('preguntas').select('texto,narrador_id')
    .or(`narrador_id.eq.${narradorId},narrador_id.is.null`)
    .eq('orden', orden)
    .order('narrador_id', { nullsFirst: false })
    .limit(1).maybeSingle();
  return (data as { texto?: string } | null)?.texto ?? '';
}

async function marcarRespondido(narradorId: string): Promise<void> {
  await db.from('narradores')
    .update({ ultima_respuesta_at: new Date().toISOString(), alerta_silencio: false })
    .eq('id', narradorId);
}

// Estima cuánto duraría hablada una respuesta escrita (~130 palabras/min).
function estimarDuracion(texto: string): number {
  const palabras = texto.trim().split(/\s+/).filter(Boolean).length;
  return Math.round((palabras / 130) * 60);
}

export async function procesarEntrante(m: MensajeEntrante): Promise<void> {
  const narrador = await buscarNarrador(m.telefono);
  if (!narrador) {
    console.warn(`Mensaje de un número no registrado: ${m.telefono}`);
    return;
  }

  switch (narrador.estado) {
    case 'invitado':
      await manejarConsentimiento(narrador, m);
      return;
    case 'pausado':
      await reactivar(narrador);
      return;
    case 'activo':
      if (m.tipo === 'texto') await manejarTexto(narrador, m);
      else await manejarRespuestaAudio(narrador, m);
      return;
    default:
      // acepto (espera la 1ª pregunta), completado, cerrado_anticipado: no se procesa entrada espontánea
      console.warn(`Entrante en estado '${narrador.estado}' de ${narrador.id}: se ignora`);
      return;
  }
}

// Paso 2: el "SÍ" del consentimiento.
async function manejarConsentimiento(narrador: Narrador, m: MensajeEntrante): Promise<void> {
  if (m.tipo !== 'texto' || !m.texto) return; // en 'invitado' solo cuenta el SÍ escrito
  // Sin acentos y en minúscula: "SÍ", "Sí!", "si dale" valen todos.
  const limpio = m.texto.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const dijoSi = /^si\b/.test(limpio);
  if (!dijoSi) return;
  await db.from('narradores').update({ estado: 'acepto' }).eq('id', narrador.id);
  await enviarTexto(
    narrador.telefono_whatsapp,
    `¡Qué alegría, ${narrador.como_le_dicen}! Mañana a la mañana le llega la primera pregunta. No hay apuro ni respuestas incorrectas: esto es una charla entre usted y yo, a su ritmo. 📖`,
  );
}

// Paso 3: pausado → activo con cualquier mensaje.
async function reactivar(narrador: Narrador): Promise<void> {
  await db.from('narradores').update({ estado: 'activo' }).eq('id', narrador.id);
  await enviarTexto(
    narrador.telefono_whatsapp,
    `¡Qué bueno tenerlo de vuelta, ${narrador.como_le_dicen}! Retomamos donde habíamos dejado. Mañana le llega la siguiente pregunta.`,
  );
}

// Paso 4: texto de un narrador activo.
async function manejarTexto(narrador: Narrador, m: MensajeEntrante): Promise<void> {
  const intencion = await detectarIntencion(m.texto ?? '');
  if (intencion === 'quiere_parar') {
    await db.from('narradores').update({ estado: 'pausado', alerta_silencio: true }).eq('id', narrador.id);
    await enviarTexto(
      narrador.telefono_whatsapp,
      `Entiendo perfectamente, ${narrador.como_le_dicen}. Hacemos una pausa, sin ningún problema. Cuando tenga ganas de seguir, me escribe cualquier cosa y retomamos donde dejamos. Su historia queda guardada. 🤝`,
    );
    return;
  }
  if (narrador.dia_actual < 1 || !m.texto) return; // sin pregunta vigente todavía

  const orden = narrador.dia_actual;
  const esRepregunta = await yaSeRepregunto(narrador.id, orden);
  const { data, error } = await db.from('respuestas')
    .insert({
      narrador_id: narrador.id, pregunta_orden: orden,
      texto_directo: m.texto, transcripcion: m.texto, es_repregunta: esRepregunta,
    })
    .select('id').single();
  if (error) throw new Error(`No pude guardar la respuesta de texto: ${error.message}`);
  await marcarRespondido(narrador.id);
  await trasResponder(narrador, orden, esRepregunta, m.texto, estimarDuracion(m.texto), data.id);
}

// Paso 5: audio de un narrador activo.
async function manejarRespuestaAudio(narrador: Narrador, m: MensajeEntrante): Promise<void> {
  if (narrador.dia_actual < 1 || !m.mediaId) return; // sin pregunta vigente todavía
  const orden = narrador.dia_actual;
  const esRepregunta = await yaSeRepregunto(narrador.id, orden);
  const audio = await descargarAudio(m.mediaId);
  const { id } = await guardarRespuestaAudio(narrador.id, orden, audio, esRepregunta);
  const { texto, duracionSegundos } = await transcribirYActualizar(id, audio);
  await marcarRespondido(narrador.id);
  await trasResponder(narrador, orden, esRepregunta, texto, duracionSegundos, id);
}

// Pasos 6-8: evaluación + repregunta, y disparadores de fase adaptativa / cierre.
async function trasResponder(
  narrador: Narrador, orden: number, esRepregunta: boolean,
  transcripcion: string, duracionSegundos: number, _respuestaId: string,
): Promise<void> {
  // Paso 6: solo la PRIMERA respuesta a una pregunta se evalúa (las de la repregunta, no).
  if (!esRepregunta) {
    const pregunta = await textoDePregunta(narrador.id, orden);
    const evaluacion = await evaluarRespuesta(pregunta, transcripcion, duracionSegundos);
    if (!evaluacion.suficiente && evaluacion.repregunta && !(await yaSeRepregunto(narrador.id, orden))) {
      const waId = await enviarTexto(narrador.telefono_whatsapp, evaluacion.repregunta);
      await db.from('envios').insert({
        narrador_id: narrador.id, tipo: 'repregunta', pregunta_orden: orden, wa_message_id: waId,
      });
    }
  }

  // Paso 8: al completar la respuesta 25, el cerebro estudia toda la historia
  // y genera las 5 preguntas finales a medida (órdenes 26-30).
  if (orden === ULTIMA_FIJA) await generarPreguntasAdaptativas(narrador.id);

  // Paso 7: al responder la última pregunta, cerrar la bitácora y entregar los saludos.
  // TODO Task 10: if (esLaUltima(orden)) await cerrarBitacora(narrador.id);
}
