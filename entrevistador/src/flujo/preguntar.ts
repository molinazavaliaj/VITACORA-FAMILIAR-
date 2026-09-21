import { db } from '../db/cliente.js';
import { enviarPlantilla, enviarTexto, enviarAudioPorLink, enviarImagenPorLink } from '../whatsapp/enviar.js';
import { generarPreguntaReemplazo } from '../ia/cerebro.js';
import { personalizarPregunta } from '../ia/personalizar.js';
import { generarAudioVoz } from '../ia/voz.js';
import { armarHistoria } from '../db/historia.js';
import { generarPreguntasAdaptativas } from '../ia/adaptativas.js';
import { capitulosDe, preguntaDeOrden as preguntaDelGuion, tieneAdaptativas, ultimoOrden, type PreguntaDelGuion } from '../db/guion.js';
import { textoEvitar } from '../ia/evitar.js';
import { tratoDe } from '../ia/trato.js';
import { mensajeDePregunta } from '../manual/puro.js';

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

/** Los dos capítulos que pueden no existir en una vida, y su clave en `contexto.arbol`. */
export const CLAVE_DEL_ARBOL: Record<string, 'hijos' | 'conyuge'> = { 'Los hijos': 'hijos', 'El amor': 'conyuge' };

/**
 * Debajo de esta edad, sin hijos cargados en el árbol, «Los hijos» se reemplaza
 * sin preguntar. Es deliberadamente bajo: a los 28 (Joaquín) se puede tener
 * hijos y una ficha vacía, y "ante la duda, no toca nada" — para ese caso la
 * familia carga `hijos = no tuvo` (o `ficha --hijos no` en la puerta manual),
 * y el propio narrador lo dispara al contestar (bitácora 35).
 */
export const EDAD_SIN_HIJOS = 25;
/** Debajo de esta edad, sin pareja cargada, «El amor» tampoco. */
export const EDAD_SIN_PAREJA = 18;

/** La edad hoy a partir del año de nacimiento de la ficha; null si no está o no es un año. */
export function edadDe(contexto: Record<string, any> | null | undefined, hoy = new Date()): number | null {
  const anio = Number(contexto?.anioNacimiento);
  if (!Number.isInteger(anio)) return null;
  const edad = hoy.getFullYear() - anio;
  return edad >= 0 && edad <= 120 ? edad : null;
}

/**
 * Capítulos que no aplican a esta vida:
 * - según el árbol (`'no tuvo'`): lo carga la familia al comprar, o lo anota el
 *   propio biógrafo cuando el narrador dice que no tuvo (bitácora 35);
 * - según la ficha (bitácora 20-27): las 26 fijas están pensadas para un abuelo
 *   (boda, hijos, nietos). Con el año de nacimiento se sabe antes de preguntar
 *   que a un narrador muy joven ese capítulo no le aplica — salvo que la
 *   familia haya cargado hijos o pareja, que siempre manda.
 */
export function capituloNoAplica(contexto: Record<string, any>, capitulo: string, hoy = new Date()): boolean {
  const clave = CLAVE_DEL_ARBOL[capitulo];
  if (!clave) return false;
  const cargado = (contexto?.arbol ?? {})[clave];
  if (cargado === 'no tuvo') return true;
  if (typeof cargado === 'string' && cargado.trim()) return false; // hay nombres: aplica
  const edad = edadDe(contexto, hoy);
  if (edad === null) return false;
  return clave === 'hijos' ? edad < EDAD_SIN_HIJOS : edad < EDAD_SIN_PAREJA;
}

export type Ritmo = 'diario' | 'dos_por_dia' | 'seguido';

/**
 * El ritmo de la entrevista (docs/panel-usuario.md §6.4): lo elige la familia
 * en el panel. `modoRapido` es el nombre viejo de 'seguido' (los pilotos).
 */
export function ritmoDe(contexto: Record<string, any>): Ritmo {
  const r = contexto?.ritmo;
  if (r === 'diario' || r === 'dos_por_dia' || r === 'seguido') return r;
  return contexto?.modoRapido === true ? 'seguido' : 'diario';
}

/** ¿Este narrador está en modo rápido (la siguiente pregunta sale al instante)? */
export function esModoRapido(contexto: Record<string, any>): boolean {
  return ritmoDe(contexto) === 'seguido';
}

/** La pregunta de ese orden, del guion propio del narrador (o la plantilla si aún no tiene). */
export async function preguntaDeOrden(narradorId: string, orden: number): Promise<PreguntaDelGuion | null> {
  return preguntaDelGuion(narradorId, orden);
}

/**
 * Genera y guarda una pregunta personalizada que reemplaza a la fija que no aplica.
 * Si la fija es de la plantilla global, se inserta la propia con el mismo orden
 * (la propia pisa a la global); si ya es una fila propia del narrador (guion
 * copiado al editarlo en el panel), se reescribe esa misma fila.
 */
async function crearReemplazo(n: Narrador, pregunta: PreguntaDelGuion): Promise<string> {
  const capituloQueNoAplica = pregunta.capitulo;
  const capitulos = (await capitulosDe(n.id)).filter((c) => c !== capituloQueNoAplica);
  const nueva = await generarPreguntaReemplazo(
    n.como_le_dicen, await armarHistoria(n.id), capitulos, capituloQueNoAplica, textoEvitar(n.contexto),
    await tratoDe(n), n.id,
  );
  if (pregunta.narrador_id === null) {
    await db.from('preguntas').insert({
      narrador_id: n.id, orden: pregunta.orden, texto: nueva.texto, capitulo: nueva.capitulo, tipo: 'adaptativa',
    });
  } else {
    await db.from('preguntas').update({ texto: nueva.texto, capitulo: nueva.capitulo, tipo: 'adaptativa' }).eq('id', pregunta.id);
  }
  return nueva.texto;
}

/** La foto de la pregunta-foto: el original que subió la familia, por link firmado. Si falla, la pregunta va igual. */
async function enviarFotoDeLaPregunta(n: Narrador, fotoId: string): Promise<void> {
  try {
    const { data: foto } = await db.from('fotos').select('storage_path, epigrafe').eq('id', fotoId).maybeSingle();
    const f = foto as { storage_path?: string; epigrafe?: string | null } | null;
    if (!f?.storage_path) return;
    const { data } = await db.storage.from('audios').createSignedUrl(f.storage_path, 3600);
    if (data?.signedUrl) await enviarImagenPorLink(n.telefono_whatsapp, data.signedUrl, f.epigrafe ?? undefined);
  } catch (err) {
    console.error(`preguntar: no pude mandar la foto ${fotoId} a ${n.id}:`, err);
  }
}

/** La versión hablada de la pregunta: se sube a Storage y se manda por link firmado. */
async function enviarVozDeLaPregunta(n: Narrador, orden: number, contenido: string): Promise<void> {
  const audio = await generarAudioVoz(contenido, n.id);
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
  let pregunta = await preguntaDeOrden(n.id, orden);
  // Red de seguridad: las 4 finales se generan al responder la última del guion.
  // Si esa generación falló (el modelo devolvió algo raro, se cayó la API), el
  // narrador quedaría clavado para siempre. Si piden la que sigue a la última y
  // todavía no hay adaptativas, se reintenta acá.
  if (!pregunta && !(await tieneAdaptativas(n.id)) && orden === (await ultimoOrden(n.id)) + 1) {
    await generarPreguntasAdaptativas(n.id);
    pregunta = await preguntaDeOrden(n.id, orden);
  }
  if (!pregunta) return false; // no hay más preguntas: el cierre lo maneja procesar

  let texto = pregunta.texto;
  // Regla de reemplazo: el capítulo no aplica a esta vida. Vale para la fija de la
  // plantilla y para la fija propia (guion copiado); una adaptativa ya es reemplazo.
  if (pregunta.tipo === 'fija' && capituloNoAplica(n.contexto, pregunta.capitulo)) {
    texto = await crearReemplazo(n, pregunta);
  } else if (pregunta.tipo === 'fija') {
    // El biógrafo que escucha: las preguntas del guion se reescriben con lo que
    // el narrador ya contó ("¿a qué jugaba de chico?" → "con el Rubén y la Marta
    // en Villa Domínico, ¿a qué jugaban en ese patio?"). Las que escribió la
    // familia y las que generó el modelo ya vienen con contexto: se mandan tal cual.
    // Si algo falla, `personalizarPregunta` devuelve el original.
    const personalizada = await personalizarPregunta(n, texto, orden);
    texto = personalizada.texto;
    if (!personalizada.personalizada && personalizada.motivo) {
      console.warn(`preguntar: orden ${orden} de ${n.id} sale sin personalizar (${personalizada.motivo}).`);
    }
  }

  // El saludo personalizado se sacó el 2026-09-14 (decisión de producto de los
  // socios, no de costo): cada día era una llamada a Opus con TODA la historia
  // pegada al prompt (~USD 3,36 por narrador, el 70% del costo de la entrevista)
  // para decidir si agregaba una frase opcional. Ahora la pregunta sale sola.
  // La plantilla `pregunta_diaria` de Meta pasa a tener UNA variable.
  const trato = await tratoDe(n);
  const mensaje = mensajeDePregunta(texto, trato);

  // La gemela en vos (`pregunta_diaria_vos`, aprobada el 16/09) para quien se trata de vos.
  const waId = plantilla
    ? await enviarPlantilla(n.telefono_whatsapp, trato === 'vos' ? 'pregunta_diaria_vos' : 'pregunta_diaria', [texto])
    : await enviarTexto(n.telefono_whatsapp, mensaje);

  // La pregunta-foto (§6.3): la familia subió una foto y pregunta sobre ella.
  // Va después del texto (la plantilla abre la conversación; la imagen, dentro
  // de la ventana, sale como mensaje libre).
  if (pregunta.foto_id) await enviarFotoDeLaPregunta(n, pregunta.foto_id);

  await enviarVozDeLaPregunta(n, orden, texto);

  const avance: Record<string, unknown> = { dia_actual: orden };
  if (n.estado === 'acepto') avance.estado = 'activo';
  await db.from('narradores').update(avance).eq('id', n.id);
  await db.from('envios').insert({
    narrador_id: n.id, tipo: 'pregunta', pregunta_orden: orden, wa_message_id: waId,
  });
  return true;
}
