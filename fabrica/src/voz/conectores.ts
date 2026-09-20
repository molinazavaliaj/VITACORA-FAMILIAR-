import type Anthropic from '@anthropic-ai/sdk';
import type { Pregunta, Respuesta } from '../db.js';
import { extraerTexto, textoRespuesta } from '../libro/comun.js';
import type { ConectoresNarracion, HistoriaNarracion } from './narracion-json.js';

// Los conectores del audiolibro híbrido: lo único que narra la voz clonada
// además del anuncio del capítulo. Entre historia e historia (el audio REAL
// del narrador, restaurado por el worker) va una frase suya que hace de
// puente; `entrada` abre el capítulo y `salida` lo cierra. Ver
// narracion-json.ts (v2) y supabase/CONTRATO.md.

/**
 * Las historias de un capítulo para narracion.json: SOLO las respuestas con
 * audio, en el orden del libro — el de `ordenes` del capítulo (no el
 * numérico), y dentro de una misma pregunta primero la respuesta y después
 * la(s) repregunta(s), por `recibido_at` si hay que desempatar. Las
 * respuestas escritas (sin audio) no son historias: no hay voz que pegar.
 * Pura, sin I/O — la misma que arma `armarMaterial`, pero para el oído.
 */
export function historiasDelCapitulo(
  ordenes: number[],
  preguntasPorOrden: Map<number, Pick<Pregunta, 'texto'>>,
  respuestasPorOrden: Map<
    number,
    Pick<
      Respuesta,
      'id' | 'pregunta_orden' | 'es_repregunta' | 'audio_path' | 'duracion_segundos' | 'transcripcion' | 'texto_directo' | 'recibido_at'
    >[]
  >
): HistoriaNarracion[] {
  const historias: HistoriaNarracion[] = [];
  for (const orden of ordenes) {
    const pregunta = preguntasPorOrden.get(orden);
    const conAudio = (respuestasPorOrden.get(orden) ?? []).filter((r) => Boolean(r.audio_path));
    const ordenadas = [...conAudio].sort((a, b) => {
      if (a.es_repregunta !== b.es_repregunta) return a.es_repregunta ? 1 : -1;
      return (a.recibido_at ?? '').localeCompare(b.recibido_at ?? '');
    });
    for (const respuesta of ordenadas) {
      historias.push({
        respuesta_id: respuesta.id,
        pregunta_orden: orden,
        es_repregunta: respuesta.es_repregunta,
        audio_path: respuesta.audio_path as string,
        segundos: Math.round(respuesta.duracion_segundos ?? 0),
        pregunta: pregunta?.texto ?? `Pregunta ${orden}`,
        texto: textoRespuesta(respuesta) ?? '',
      });
    }
  }
  return historias;
}

// El prompt de los conectores — es la voz del narrador, igual que el del
// capítulo (escribir-capitulo.ts). Se usa textual: cada frase que salga de
// acá se va a escuchar con SU voz clonada, pegada a SUS audios de verdad;
// si suena a locutor, se nota al instante.
const PROMPT_CONECTORES = (
  nombre: string,
  capitulo: string,
  textoCapitulo: string,
  historias: { pregunta: string; texto: string }[]
) => {
  const cantidadPuentes = Math.max(historias.length - 1, 0);
  const bloques = historias
    .map((h, i) => `HISTORIA ${i + 1} (le preguntaron: ${h.pregunta})\n${h.texto.trim() || '(sin transcripción)'}`)
    .join('\n\n');
  const ejemploEntre =
    cantidadPuentes === 0
      ? '[]'
      : `[${Array.from({ length: cantidadPuentes }, (_, i) => `"...puente de la historia ${i + 1} a la ${i + 2}..."`).join(', ')}]`;

  return `
Estás armando el audiolibro de la vida de ${nombre}, a partir de lo que él mismo contó
en entrevistas grabadas. Este es el capítulo «${capitulo}».

En el audiolibro, las historias de este capítulo se escuchan con SU PROPIA VOZ, tal
cual las grabó. Lo único que hay que escribir son los CONECTORES: las frases cortas,
dichas por él, que abren el capítulo, unen una historia con la siguiente y lo cierran.

LAS HISTORIAS, EN EL ORDEN EN QUE SE VAN A ESCUCHAR (textuales):
${bloques}

EL CAPÍTULO YA ESCRITO EN SU VOZ (referencia de registro y de giros — NO lo resumas, NO
lo vuelvas a contar; es para que los conectores suenen como suena él ahí):
${textoCapitulo}

REGLAS — estos conectores son SU voz, no la tuya:
1. Primera persona. El que habla es él.
2. Usá SUS palabras, SUS giros, SUS muletillas queridas, las que aparecen en las
   historias y en el capítulo. Si él dice «mi vieja», el conector dice «mi vieja».
3. Cada conector tiene 1 o 2 oraciones, nunca más de 35 palabras. Es un respiro entre
   historias, no un párrafo.
4. No inventes NADA. Ni un dato, ni un nombre, ni un adjetivo emocional que él no haya
   dado. Todo lo que diga un conector tiene que estar ya en las historias o en el capítulo.
5. Hay ${cantidadPuentes} puentes (${cantidadPuentes === 0 ? 'una sola historia: «entre» va vacío' : 'uno menos que historias'}).
   El puente k va DESPUÉS de la historia k y ANTES de la historia k+1: anticipa con
   naturalidad de qué va a hablar a continuación, como quien sigue conversando. Nunca
   digas «pregunta», «entrevista», «capítulo», «grabación» ni «audio».
6. «entrada» abre el capítulo con una o dos oraciones suyas; «salida» lo cierra en una
   frase. Las dos pueden ir vacías si no hay nada verdadero que decir.
7. Prohibido el perfume a IA: nada de «fue una época llena de desafíos», «sin duda»,
   «cabe destacar», «un viaje inolvidable». Si una frase la podría haber escrito un
   robot, sacala.

Devolvé SOLO un JSON, sin comentarios ni texto alrededor, exactamente con esta forma:
{"entrada": "...", "entre": ${ejemploEntre}, "salida": "..."}`;
};

/**
 * Busca el JSON en lo que devolvió el modelo con tolerancia: saca los fences
 * (```json ... ```) y se queda con lo que hay entre el primer `{` y el
 * último `}`. Tira si no hay nada parseable.
 */
function parsearJsonTolerante(texto: string): unknown {
  const sinFences = texto.replace(/```[a-zA-Z]*\s*/g, '').replace(/```/g, '');
  const inicio = sinFences.indexOf('{');
  const fin = sinFences.lastIndexOf('}');
  if (inicio === -1 || fin === -1 || fin < inicio) throw new Error('no hay un objeto JSON en la respuesta');
  return JSON.parse(sinFences.slice(inicio, fin + 1));
}

/**
 * Valida la forma del contrato: tres claves, strings, y `entre` con
 * exactamente `cantidadPuentes` elementos. Devuelve el error como texto (para
 * agregarlo al prompt del reintento) o null si está bien.
 */
function validarConectores(valor: unknown, cantidadPuentes: number): string | null {
  if (typeof valor !== 'object' || valor === null) return 'la respuesta no es un objeto JSON';
  const c = valor as Record<string, unknown>;
  if (typeof c.entrada !== 'string') return '«entrada» tiene que ser un string';
  if (typeof c.salida !== 'string') return '«salida» tiene que ser un string';
  if (!Array.isArray(c.entre) || !c.entre.every((e) => typeof e === 'string')) {
    return '«entre» tiene que ser una lista de strings';
  }
  if (c.entre.length !== cantidadPuentes) {
    return `«entre» trae ${c.entre.length} puentes y tienen que ser exactamente ${cantidadPuentes}`;
  }
  return null;
}

/**
 * Escribe los conectores de un capítulo con la voz del narrador: una llamada
 * a `claude-fable-5` (mismo patrón que `escribirCapitulo`). `textoCapitulo`
 * es el capítulo ya escrito en su voz (el borrador), referencia de registro;
 * `historias` son las respuestas con audio, en el orden en que se van a oír.
 *
 * Si la respuesta no cumple el contrato (no es JSON, tipos mal, `entre` con
 * la cantidad equivocada), reintenta UNA vez diciéndole al modelo qué falló;
 * si vuelve a fallar, tira — el pedido cae a 'fallido' y alguien lo mira.
 */
export async function escribirConectores(
  cliente: Anthropic,
  args: { nombre: string; capitulo: string; textoCapitulo: string; historias: { pregunta: string; texto: string }[] }
): Promise<ConectoresNarracion> {
  const cantidadPuentes = Math.max(args.historias.length - 1, 0);
  const promptBase = PROMPT_CONECTORES(args.nombre, args.capitulo, args.textoCapitulo, args.historias);

  let prompt = promptBase;
  let ultimoError = '';
  for (let intento = 0; intento < 2; intento++) {
    const stream = cliente.messages.stream({
      model: 'claude-fable-5',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });
    const mensajeFinal = await stream.finalMessage();
    const texto = extraerTexto(mensajeFinal.content as Array<{ type: string; text?: string }>);

    let valor: unknown;
    try {
      valor = parsearJsonTolerante(texto);
      ultimoError = validarConectores(valor, cantidadPuentes) ?? '';
    } catch (err) {
      ultimoError = `no se pudo leer el JSON: ${(err as Error).message}`;
    }
    if (ultimoError === '') {
      const c = valor as ConectoresNarracion;
      return { entrada: c.entrada.trim(), entre: c.entre.map((e) => e.trim()), salida: c.salida.trim() };
    }

    prompt = `${promptBase}\n\nTu respuesta anterior no sirvió: ${ultimoError}. Devolvé de nuevo SOLO el JSON, con «entre» de exactamente ${cantidadPuentes} elementos.`;
  }

  throw new Error(`No se pudieron escribir los conectores del capítulo «${args.capitulo}» (dos intentos): ${ultimoError}`);
}
