import type { MensajeEntrante } from '../whatsapp/webhook.js';
import { db } from '../db/cliente.js';
import { enviarTexto } from '../whatsapp/enviar.js';
import { descargarAudio } from '../whatsapp/media.js';
import { guardarRespuestaAudio } from '../db/respuestas.js';
import { guardarRepreguntaEnviada } from '../db/envios.js';
import { transcribirYActualizar } from '../ia/transcribir.js';
import { evaluarRespuesta, detectarIntencion } from '../ia/cerebro.js';
import { generarPreguntasAdaptativas } from '../ia/adaptativas.js';
import { preguntaDeOrden, tieneAdaptativas, ultimoOrden } from '../db/guion.js';
import { textoEvitar } from '../ia/evitar.js';
import { mandarHito } from '../mail/hitos.js';
import { cerrarBitacora } from './cierre.js';
import { enviarPregunta, ritmoDe, type Narrador } from './preguntar.js';

const MAXIMO_POR_DIA_DOS = 2; // ritmo 'dos_por_dia': la segunda se ofrece, no se impone

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
  // La pregunta tal como se le mandó (personalizada) si la tenemos; si no, la del guion.
  const n = await db.from('narradores').select('contexto').eq('id', narradorId).maybeSingle();
  const enviada = ((n.data as { contexto?: Record<string, any> } | null)?.contexto?.preguntasEnviadas ?? {})[String(orden)];
  if (typeof enviada === 'string' && enviada.trim()) return enviada;
  return (await preguntaDeOrden(narradorId, orden))?.texto ?? '';
}

/** ¿Este orden es la última pregunta que existe para este narrador (su guion propio)? */
async function esLaUltimaPregunta(narradorId: string, orden: number): Promise<boolean> {
  const ultima = await ultimoOrden(narradorId);
  return ultima > 0 && orden >= ultima;
}

/** ¿Hay una oferta de "otra ahora" sin resolver para la pregunta vigente? */
async function ofertaPendiente(narradorId: string, orden: number): Promise<boolean> {
  const { data: oferta } = await db.from('envios').select('id')
    .eq('narrador_id', narradorId).eq('tipo', 'oferta_siguiente').eq('pregunta_orden', orden).limit(1);
  if ((oferta?.length ?? 0) === 0) return false;
  const { data: siguiente } = await db.from('envios').select('id')
    .eq('narrador_id', narradorId).eq('tipo', 'pregunta').eq('pregunta_orden', orden + 1).limit(1);
  return (siguiente?.length ?? 0) === 0;
}

/** Cuántas preguntas salieron hoy (en la zona del narrador). */
async function preguntasEnviadasHoy(n: Narrador, ahora = new Date()): Promise<number> {
  const desde = new Date(ahora.getTime() - 24 * 3600_000).toISOString();
  const { data } = await db.from('envios').select('enviado_at')
    .eq('narrador_id', n.id).eq('tipo', 'pregunta').gte('enviado_at', desde);
  const hoy = new Intl.DateTimeFormat('sv-SE', { timeZone: n.zona_horaria }).format(ahora);
  return ((data as { enviado_at: string }[] | null) ?? [])
    .filter((e) => new Intl.DateTimeFormat('sv-SE', { timeZone: n.zona_horaria }).format(new Date(e.enviado_at)) === hoy)
    .length;
}

/** "sí" / "no" cortos, sin acentos ni signos: para la oferta de otra pregunta. */
export function leerSiNo(texto: string): 'si' | 'no' | null {
  const limpio = texto.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z\s]/g, ' ').trim();
  if (!limpio || limpio.split(/\s+/).length > 6) return null;
  if (/^(si|dale|bueno|ok|okey|claro|de acuerdo|va|vamos|si dale|si claro|si bueno|si vamos|bueno dale|dale si|si si)\b/.test(limpio)) return 'si';
  if (/^(no|ahora no|manana|mañana|despues|mas tarde|hoy no|no gracias)\b/.test(limpio)) return 'no';
  return null;
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
  await mandarHito(narrador, 'acepto');
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

  // ¿Le ofrecimos otra pregunta ahora? Un "sí" corto la manda; un "no", la deja para mañana.
  if (await ofertaPendiente(narrador.id, orden)) {
    const respuesta = leerSiNo(m.texto);
    if (respuesta === 'si') {
      await enviarPregunta(narrador, orden + 1, { plantilla: false });
      return;
    }
    if (respuesta === 'no') {
      await enviarTexto(narrador.telefono_whatsapp, `Perfecto, ${narrador.como_le_dicen}. Mañana a la mañana le llega la siguiente. Que descanse. 🌙`);
      return;
    }
    // Ni sí ni no: es una respuesta más a la pregunta vigente.
  }

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
  let repreguntaEnviada = false;
  if (!esRepregunta) {
    // Los hitos de la familia (§9): la primera respuesta, y la mitad del guion.
    if (orden === 1) await mandarHito(narrador, 'primera');
    const total = await ultimoOrden(narrador.id);
    if (total > 2 && orden === Math.ceil(total / 2)) await mandarHito(narrador, 'mitad');

    const pregunta = await textoDePregunta(narrador.id, orden);
    const evaluacion = await evaluarRespuesta(pregunta, transcripcion, duracionSegundos, textoEvitar(narrador.contexto));
    if (!evaluacion.suficiente && evaluacion.repregunta && !(await yaSeRepregunto(narrador.id, orden))) {
      const waId = await enviarTexto(narrador.telefono_whatsapp, evaluacion.repregunta);
      await db.from('envios').insert({
        narrador_id: narrador.id, tipo: 'repregunta', pregunta_orden: orden, wa_message_id: waId,
      });
      // El texto queda guardado para que el panel muestre qué se le preguntó
      // (la familia ve la respuesta que llegó después; sin esto, no la pregunta).
      await guardarRepreguntaEnviada(narrador, orden, evaluacion.repregunta);
      repreguntaEnviada = true;
    }
  }

  // Paso 8 (§11.2): al responder la ÚLTIMA pregunta que existe en su guion —sea
  // la 26 o la 36, según lo que la familia sacó o sumó— el cerebro estudia toda
  // la historia y escribe las 4 finales a medida (N+1..N+4). Recién si ya las
  // tenía y esta era la última, la entrevista termina.
  if (await esLaUltimaPregunta(narrador.id, orden) && !(await tieneAdaptativas(narrador.id))) {
    await generarPreguntasAdaptativas(narrador.id);
  }

  // Paso 7: si acaba de responder la última pregunta que existe para él,
  // se despide y queda 'completado'.
  if (await esLaUltimaPregunta(narrador.id, orden)) {
    await cerrarBitacora(narrador.id);
    return;
  }

  // Si salió una repregunta, esperamos su respuesta antes de avanzar.
  if (repreguntaEnviada) return;

  // El ritmo (§6.4). Como el narrador acaba de escribir, la ventana de 24 hs
  // está abierta: lo que salga va como texto libre, sin plantilla.
  //   seguido     → la siguiente sale YA (los pilotos, el "modo rápido").
  //   dos_por_dia → se le OFRECE otra ahora (como mucho dos por día); un "sí" la manda.
  //   diario      → nada: mañana, a su hora, el scheduler manda la siguiente.
  const ritmo = ritmoDe(narrador.contexto);
  if (ritmo === 'seguido') {
    await enviarPregunta(narrador, orden + 1, { plantilla: false });
  } else if (ritmo === 'dos_por_dia' && (await preguntasEnviadasHoy(narrador)) < MAXIMO_POR_DIA_DOS) {
    await ofrecerSiguiente(narrador, orden);
  }
}

/** La oferta de "otra ahora" (§11.4). Queda en `envios` como 'oferta_siguiente' para leer su respuesta. */
async function ofrecerSiguiente(narrador: Narrador, orden: number): Promise<void> {
  const waId = await enviarTexto(
    narrador.telefono_whatsapp,
    `Qué lindo lo que contó, ${narrador.como_le_dicen}. ¿Tiene ganas de seguir con otra pregunta ahora? Si me dice que sí, se la mando. Si prefiere, mañana a la mañana le llega la siguiente.`,
  );
  await db.from('envios').insert({
    narrador_id: narrador.id, tipo: 'oferta_siguiente', pregunta_orden: orden, wa_message_id: waId,
  });
}
