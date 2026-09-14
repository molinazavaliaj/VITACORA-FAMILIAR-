/**
 * El biógrafo que ESCUCHA: personaliza la pregunta del día con lo que el
 * narrador ya contó, para que sienta que lo vienen siguiendo.
 *
 * Medido con la vida real del set dorado (26 preguntas de Osvaldo): el 100% de
 * las preguntas se personalizan, cuesta **~USD 0,10 por narrador** (una llamada
 * a Haiku por día) y el costo es PLANO: se le pasa la ficha, los resúmenes de
 * los capítulos ya contados (`resumenes.ts`) y las últimas 6 respuestas —
 * nunca el historial completo, que crecería al cuadrado.
 *
 * La memoria por capítulo es la que marca la diferencia: con las últimas
 * respuestas solas la pregunta 25 se olvida de lo que contó el día 1, y con el
 * historial completo (medido: USD 0,30 y creciendo) el modelo se va por las
 * ramas. Con los resúmenes nombró a los cuatro nietos y arregló la pregunta 26.
 *
 * ⚠️ Los resúmenes son para el ENTREVISTADOR. La fábrica sigue leyendo las
 * respuestas completas con su modelo grande: el libro no se escribe con resúmenes.
 *
 * Ejemplos reales de lo que produce:
 *   guion:  "¿A qué jugaba de chico, y con quién?"
 *   biógrafo: "Con el Rubén y la Marta en Villa Domínico, ¿a qué jugaban en ese
 *               patio con la bomba y el limonero? ¿Alguna travesura que todavía
 *               lo haga reír?"
 *
 * Tres reglas de seguridad, todas nacidas de errores reales del prototipo:
 *   1. La ficha va con los roles nombrados (`ficha.ts`): sin eso el modelo
 *      confundió a la madre con el amor de la vida.
 *   2. Si la versión personalizada pierde alguna de las preguntas del original,
 *      se manda el ORIGINAL. La pregunta firmada por los socios nunca se pierde.
 *   3. La que se mandó queda guardada, así el panel muestra lo que él leyó.
 *
 * No toca el guion: `preguntas` queda como está y la personalización se guarda
 * aparte (ver `recordarEnviada`).
 */
import Anthropic from '@anthropic-ai/sdk';
import { textoEvitar } from './evitar.js';
import { cargarConfig } from '../config.js';
import { db } from '../db/cliente.js';
import { fichaEnTexto } from './ficha.js';
import { memoriaDeCapitulos } from './resumenes.js';

// Un modelo chico alcanza: es reescribir una pregunta con contexto, no escribir
// el libro. Haiku 4.5 cuesta USD 1/5 por millón (input/output).
const MODELO = 'claude-haiku-4-5';
const MAX_TOKENS = 400;

/** Cuántas respuestas anteriores se le pasan (las de estos días). */
const ULTIMAS_RESPUESTAS = 6;
/** Cada respuesta se recorta: una de 3 minutos tiene ~1.700 caracteres y no hace falta entera. */
const RECORTE_RESPUESTA = 900;
/** Más largo que esto no lo lee cómodo una persona mayor en el celular. */
export const MAX_PALABRAS = 60;

export type NarradorParaPersonalizar = {
  id: string;
  como_le_dicen: string;
  contexto: Record<string, any>;
};

type RespuestaPrevia = {
  pregunta_orden: number; transcripcion: string | null; texto_directo: string | null; es_repregunta: boolean;
};

export const PROMPT_PERSONALIZAR = (original: string, ficha: string, previas: string, resumenes = '', evitar = '') => `Sos el biógrafo de esta persona: le escribís todos los días por WhatsApp y querés que sienta que lo venís escuchando.
${evitar}
ESTO ES LO QUE YA CONTÓ (lo único que sabés de él):
${resumenes ? `MEMORIA DE LOS CAPÍTULOS QUE YA CERRÓ:\n${resumenes}\n\n` : ''}LO QUE VIENE CONTANDO ESTOS DÍAS:
${previas || '(todavía no contó nada)'}

${ficha ? `QUIÉN ES (datos que cargó su familia):\n${ficha}\n` : ''}
LA PREGUNTA QUE LE TOCA HOY (está escrita así en el guion, es genérica):
"${original}"

Reescribila para que se note que lo escuchaste. Reglas:
- Si en lo que ya contó hay un detalle concreto que entra en esta pregunta (una persona, un lugar, una época, algo que dijo), nombralo con sus palabras: "¿Cómo era su casa de Pelliza?" en vez de "¿cómo era su casa?". Usá los nombres tal como aparecen arriba.
- RESPETÁ EL PARENTESCO de cada persona: el amor de su vida / su esposa es quien figura ahí como tal, y sus padres son sus padres. Nunca le pongas a alguien un rol que no tiene.
- Si en la memoria dice que un tema ya quedó cerrado, NO lo vuelvas a preguntar: llevá la pregunta a lo que figura como pendiente o a lo que todavía no tocó.
- CONSERVÁ TODAS LAS PREGUNTAS del original: si tiene dos o tres, la versión nueva tiene que tener las mismas dos o tres. Podés cambiar el orden, no borrar ninguna.
- El AÑO DE NACIMIENTO (si figura arriba) es para anclar la época, no es un lugar: se dice "cuando usted tenía seis años" o "allá por 1945", NUNCA "su infancia en 1939".
- Tratalo de usted, cálido, en castellano rioplatense (Argentina). Máximo ${MAX_PALABRAS} palabras.
- NUNCA inventes nada que él no haya contado. Si no hay nada concreto para enganchar, devolvé la pregunta original sin cambiarle nada.
- No saludes, no expliques nada, no agregues comillas.

Respondé SOLO con la pregunta.`;

/** Cuenta los signos de pregunta: es lo que delata que se perdió una parte. */
export function contarPreguntas(texto: string): number {
  return (texto.match(/\?/g) ?? []).length;
}

export function contarPalabras(texto: string): number {
  return texto.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * ¿La versión personalizada sirve?
 *
 * El caso que la motivó: una pregunta de tres partes ("el noviazgo", "el día que
 * la presentó en su casa", "la propuesta y la boda") volvió con dos — se perdió
 * un hilo entero de la entrevista. Medido sobre las 26 preguntas reales, el
 * conteo de signos de pregunta detecta exactamente esos casos (4 de 26) y deja
 * pasar los otros 22.
 *
 * Cuando no sirve, se manda el original: el guion firmado siempre gana.
 */
export function esPersonalizacionValida(original: string, nueva: string): boolean {
  const limpia = nueva.trim();
  if (!limpia) return false;
  if (contarPalabras(limpia) > MAX_PALABRAS) return false;
  const preguntasOriginal = contarPreguntas(original);
  if (preguntasOriginal === 0) return limpia.length >= 15;
  return contarPreguntas(limpia) >= preguntasOriginal;
}

/**
 * Las últimas respuestas del narrador antes de esta pregunta.
 *
 * OJO (2026-09-14): las **ampliaciones** (lo que contó cuando el biógrafo le
 * repreguntó, `es_repregunta = true`) van INCLUIDAS y agrupadas con su pregunta.
 * Antes se descartaban, y ahí suele estar lo mejor de la historia: el narrador
 * contesta corto y después, con la repregunta, suelta la escena completa. El
 * libro sí las usa — la memoria del biógrafo no podía ser más pobre que el libro.
 */
const MAX_FILAS_PREVIAS = ULTIMAS_RESPUESTAS * 3; // una principal + hasta dos ampliaciones por día

async function respuestasPrevias(narradorId: string, orden: number): Promise<string> {
  const { data } = await db.from('respuestas')
    .select('pregunta_orden,transcripcion,texto_directo,es_repregunta')
    .eq('narrador_id', narradorId)
    .lt('pregunta_orden', orden)
    .order('pregunta_orden', { ascending: false })
    .limit(MAX_FILAS_PREVIAS);

  const filas = (data as RespuestaPrevia[] | null) ?? [];
  const ultimosDias = [...new Set(filas.map((r) => r.pregunta_orden))]
    .slice(0, ULTIMAS_RESPUESTAS)
    .reverse();

  return ultimosDias
    .map((dia) => {
      const delDia = filas
        .filter((r) => r.pregunta_orden === dia)
        .sort((a, b) => Number(a.es_repregunta) - Number(b.es_repregunta)); // la principal primero
      const textos = delDia
        .map((r) => {
          const texto = (r.transcripcion ?? r.texto_directo ?? '').trim().slice(0, RECORTE_RESPUESTA);
          if (!texto) return '';
          return r.es_repregunta ? `(le repregunté y amplió): ${texto}` : texto;
        })
        .filter(Boolean);
      return textos.length ? `Lo que contó el día ${dia}:\n${textos.join('\n')}` : '';
    })
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Guarda la pregunta que se le va a mandar, dentro del propio `contexto` del
 * narrador (`contexto.preguntasEnviadas[orden]`).
 *
 * ⚠️ Es provisorio: el lugar definitivo es una columna en `envios` o `preguntas`,
 * que toca `supabase/CONTRATO.md` y lo acuerdan los dos socios. Mientras tanto
 * esto da las dos cosas que hacen falta: que el panel pueda mostrar lo que él
 * leyó, y que un reintento del scheduler reúse el texto en vez de pagarlo de nuevo.
 */
async function recordarEnviada(n: NarradorParaPersonalizar, orden: number, texto: string): Promise<void> {
  const enviadas = { ...(n.contexto?.preguntasEnviadas ?? {}), [orden]: texto };
  const { error } = await db.from('narradores')
    .update({ contexto: { ...n.contexto, preguntasEnviadas: enviadas } })
    .eq('id', n.id);
  // Si no se pudo guardar, la pregunta sale igual: es una comodidad, no un requisito.
  if (error) console.error(`personalizar: no pude recordar la pregunta ${orden} de ${n.id}:`, error.message);
}

export type Resultado = { texto: string; personalizada: boolean; motivo?: string };

let _cliente: Anthropic | null = null;
const cliente = () => (_cliente ??= new Anthropic({ apiKey: cargarConfig().anthropicKey }));

/**
 * La pregunta del día, personalizada con lo que ya contó.
 *
 * Si algo falla (el modelo, la red, una respuesta rara), devuelve el original:
 * el entrevistador nunca se queda sin pregunta por culpa de esta mejora.
 */
export async function personalizarPregunta(
  n: NarradorParaPersonalizar, original: string, orden: number,
  opciones: { recordar?: boolean } = {},
): Promise<Resultado> {
  const recordar = opciones.recordar ?? true;
  const yaEnviada = n.contexto?.preguntasEnviadas?.[orden];
  if (typeof yaEnviada === 'string' && yaEnviada.trim()) {
    return { texto: yaEnviada, personalizada: yaEnviada !== original, motivo: 'ya estaba guardada de un envío anterior' };
  }

  try {
    const previas = await respuestasPrevias(n.id, orden);
    const resumenes = await memoriaDeCapitulos(n, orden);
    const respuesta = await cliente().messages.create({
      model: MODELO, max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content: PROMPT_PERSONALIZAR(original, fichaEnTexto(n.contexto, n.como_le_dicen), previas, resumenes, textoEvitar(n.contexto)) }],
    });
    const bloque = respuesta.content.find((b) => b.type === 'text');
    const cruda = bloque && bloque.type === 'text' ? bloque.text.trim().replace(/^["'«]|["'»]$/g, '') : '';

    if (!esPersonalizacionValida(original, cruda)) {
      console.warn(`personalizar: la orden ${orden} de ${n.id} volvió inválida — se manda el original.`);
      return { texto: original, personalizada: false, motivo: 'la versión del modelo no conservaba las preguntas del original' };
    }

    // `recordar: false` es para mirar sin comprometer: la puerta manual lo usa
    // con --solo-ver, así una pregunta que todavía no se mandó no queda congelada
    // con la personalización de hoy.
    if (recordar) await recordarEnviada(n, orden, cruda);
    return { texto: cruda, personalizada: cruda !== original };
  } catch (err) {
    console.error(`personalizar: falló la orden ${orden} de ${n.id} — se manda el original:`, err);
    return { texto: original, personalizada: false, motivo: 'el modelo falló' };
  }
}
