/**
 * La memoria del biógrafo: un resumen corto por capítulo ya contado.
 *
 * Problema que resuelve: para personalizar la pregunta del día, pasarle TODA la
 * historia es carísimo y crece al cuadrado (el día 30 son 13.000 tokens), y
 * pasarle sólo las últimas respuestas lo deja sin memoria ("en todo lo que
 * contó nunca me habló de esto"). Medido con la vida real del set dorado:
 *
 *   sólo 2 últimas respuestas  → USD 0,05  · se olvida de lo viejo
 *   6 últimas respuestas       → USD 0,09  · mejor, pero se olvida igual
 *   historia completa          → USD 0,30  · y se va por las ramas
 *   resúmenes + 6 últimas      → ~USD 0,10 · recuerda todo, costo plano
 *
 * Con los resúmenes, la pregunta 25 recuerda el capítulo 1 — y en la prueba real
 * nombró a los cuatro nietos y arregló la pregunta 26, que sin memoria se
 * olvidaba del pedido.
 *
 * ⚠️ ESTO ES PARA EL ENTREVISTADOR, NO PARA EL LIBRO. La fábrica sigue leyendo
 * las respuestas completas con su modelo grande: un resumen hereda los errores
 * del original y no sirve para escribir el texto final. Son dos cosas distintas
 * a propósito.
 *
 * Se generan PEREZOSOS: cuando la personalización de una pregunta necesita
 * memoria, se resume lo que haga falta y queda guardado. Un capítulo se resume
 * una sola vez en toda la entrevista (8 en total).
 */
import Anthropic from '@anthropic-ai/sdk';
import { cargarConfig } from '../config.js';
import { db } from '../db/cliente.js';

const MODELO = 'claude-haiku-4-5';
const MAX_TOKENS = 500;

/** Corte duro del resumen. Medido: sin límite, Haiku escribía 590 tokens en vez de 220. */
export const MAX_PALABRAS_RESUMEN = 150;
/**
 * Tope duro en letras, por las dudas: el modelo no cuenta palabras bien (medido:
 * le pedís 150 y escribe 190). Se corta en el último punto, nunca a mitad de frase.
 */
export const MAX_CARACTERES_RESUMEN = 1200;

export type NarradorConMemoria = {
  id: string;
  como_le_dicen: string;
  contexto: Record<string, any>;
};

type RespuestaFila = {
  pregunta_orden: number; transcripcion: string | null; texto_directo: string | null; es_repregunta: boolean;
};
type PreguntaFila = { orden: number; capitulo: string; narrador_id: string | null };

/**
 * El modelo se pasa de largo y a veces agrega títulos o negritas que nadie pidió
 * (medido: `**RESUMEN CAPÍTULO "LAS PRUEBAS"**`). Se limpia acá. La línea
 * "Pendiente:" se rescata ANTES del recorte: es la que dice qué falta contar.
 */
export function limpiarResumen(bruto: string): string {
  const sinFormato = bruto
    .replace(/\*\*/g, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^[ \t]*(?:RESUMEN|Resumen)[^\n.]*:?[ \t]*\n+/, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const pendiente = sinFormato.match(/(?:^|\n)\s*Pendiente:[^\n]*/i)?.[0]?.trim() ?? '';
  const cuerpo = (pendiente ? sinFormato.replace(pendiente, '') : sinFormato).trim();
  if (cuerpo.length <= MAX_CARACTERES_RESUMEN) return [cuerpo, pendiente].filter(Boolean).join('\n\n');

  const corte = cuerpo.slice(0, MAX_CARACTERES_RESUMEN);
  const ultimoPunto = Math.max(corte.lastIndexOf('. '), corte.lastIndexOf('.\n'));
  const recortado = (ultimoPunto > MAX_CARACTERES_RESUMEN * 0.6 ? corte.slice(0, ultimoPunto + 1) : corte).trim();
  return [recortado, pendiente].filter(Boolean).join('\n\n');
}

export const PROMPT_RESUMEN = (comoLeDicen: string, capitulo: string, material: string) =>
  `Esto es lo que ${comoLeDicen} contó en el capítulo «${capitulo}» de su libro, en entrevistas grabadas.

${material}

Escribí el resumen de este capítulo para que su biógrafo lo recuerde mientras sigue entrevistándolo. Le tiene que servir para dos cosas: no volver a preguntar lo que ya contó, y saber qué quedó pendiente.

Guardá los hechos importantes, los nombres propios TAL COMO APARECEN, las fechas, los lugares y las frases textuales que valen la pena recuperar. Terminá con una línea que empiece con "Pendiente:" con lo que quedó sin contar de este capítulo.

Son para uso interno del entrevistador: no van al libro.
- Máximo ${MAX_PALABRAS_RESUMEN} palabras (unas 900 letras). Si te pasás, estás contando cosas que no hacen falta.
- Texto corrido, sin títulos, sin negritas, sin viñetas. Frases separadas por puntos.
- No inventes nada: si algo no está arriba, no existe. No expliques qué estás haciendo.
- La ÚLTIMA línea del texto (después de un renglón vacío) es "Pendiente: ..." con lo que quedó sin contar. Es obligatoria.`;

/** El capítulo al que pertenece cada orden respondida, prefiriendo la copia propia del narrador. */
async function capitulosConRespuestas(narradorId: string, orden: number): Promise<string[]> {
  const { data: respuestas } = await db.from('respuestas')
    .select('pregunta_orden')
    .eq('narrador_id', narradorId)
    .lt('pregunta_orden', orden);

  const ordenes = [...new Set(((respuestas as { pregunta_orden: number }[] | null) ?? []).map((r) => r.pregunta_orden))];
  if (!ordenes.length) return [];

  const { data: preguntas } = await db.from('preguntas')
    .select('orden,capitulo,narrador_id')
    .or(`narrador_id.eq.${narradorId},narrador_id.is.null`)
    .in('orden', ordenes);

  const porOrden = new Map<number, string>();
  for (const p of ((preguntas as PreguntaFila[] | null) ?? [])) {
    if (!p.capitulo) continue;
    if (!porOrden.has(p.orden) || p.narrador_id === narradorId) porOrden.set(p.orden, p.capitulo);
  }
  return [...new Set(porOrden.values())];
}

/** El material de un capítulo: las respuestas textuales de sus preguntas. */
async function materialDeCapitulo(narradorId: string, capitulo: string, orden: number): Promise<string> {
  const { data: preguntas } = await db.from('preguntas')
    .select('orden,capitulo,narrador_id')
    .or(`narrador_id.eq.${narradorId},narrador_id.is.null`)
    .eq('capitulo', capitulo)
    .lt('orden', orden);

  // Si el narrador tiene su propia copia de la pregunta, esa manda.
  const porOrden = new Map<number, PreguntaFila>();
  for (const p of ((preguntas as PreguntaFila[] | null) ?? [])) {
    if (!porOrden.has(p.orden) || p.narrador_id === narradorId) porOrden.set(p.orden, p);
  }
  const ordenes = [...porOrden.keys()].sort((a, b) => a - b);
  if (!ordenes.length) return '';

  const { data: respuestas } = await db.from('respuestas')
    .select('pregunta_orden,transcripcion,texto_directo,es_repregunta')
    .eq('narrador_id', narradorId)
    .in('pregunta_orden', ordenes);

  return ((respuestas as RespuestaFila[] | null) ?? [])
    .sort((a, b) => a.pregunta_orden - b.pregunta_orden || Number(a.es_repregunta) - Number(b.es_repregunta))
    .map((r) => {
      const texto = (r.transcripcion ?? r.texto_directo ?? '').trim();
      if (!texto) return '';
      // Las ampliaciones (cuando se le repreguntó) son parte del capítulo: el
      // libro las usa, la memoria tiene que usarlas también.
      return r.es_repregunta
        ? `Pregunta ${r.pregunta_orden} (lo amplió después):\n${texto}`
        : `Pregunta ${r.pregunta_orden}:\n${texto}`;
    })
    .filter(Boolean)
    .join('\n\n');
}

let _cliente: Anthropic | null = null;
const cliente = () => (_cliente ??= new Anthropic({ apiKey: cargarConfig().anthropicKey }));

/**
 * El bloque de memoria para personalizar la pregunta `orden`: los resúmenes de
 * los capítulos ya contados (resumiendo lo que falte, una sola vez cada uno).
 *
 * Nunca tira: si el modelo falla, devuelve lo que ya tenía guardado. El
 * entrevistador no se queda sin pregunta porque no se pudo resumir.
 */
export async function memoriaDeCapitulos(
  n: NarradorConMemoria, orden: number, opciones: { regenerar?: boolean } = {},
): Promise<string> {
  const guardados: Record<string, string> = opciones.regenerar ? {} : { ...(n.contexto?.resumenesCapitulos ?? {}) };
  const nuevos: Record<string, string> = {};

  try {
    const capituloActual = await capituloDeOrden(n.id, orden);
    const capitulos = (await capitulosConRespuestas(n.id, orden)).filter((c) => c !== capituloActual);

    for (const capitulo of capitulos) {
      if (guardados[capitulo]) continue;
      const material = await materialDeCapitulo(n.id, capitulo, orden);
      if (!material) continue;

      const respuesta = await cliente().messages.create({
        model: MODELO, max_tokens: MAX_TOKENS,
        messages: [{ role: 'user', content: PROMPT_RESUMEN(n.como_le_dicen, capitulo, material) }],
      });
      const bloque = respuesta.content.find((b) => b.type === 'text');
      const texto = bloque && bloque.type === 'text' ? limpiarResumen(bloque.text) : '';
      if (!texto) continue;

      guardados[capitulo] = texto;
      nuevos[capitulo] = texto;
    }

    if (Object.keys(nuevos).length) {
      // Se guardan juntos y en el propio objeto: así el que escriba después
      // (la pregunta enviada) no los pisa.
      n.contexto = { ...n.contexto, resumenesCapitulos: guardados };
      const { error } = await db.from('narradores').update({ contexto: n.contexto }).eq('id', n.id);
      if (error) console.error(`resumenes: no pude guardar los resúmenes de ${n.id}:`, error.message);
    }
  } catch (err) {
    console.error(`resumenes: falló la memoria de ${n.id} (sigo sin ella):`, err);
  }

  return Object.entries(guardados)
    .map(([capitulo, texto]) => `CAPÍTULO «${capitulo}» (ya contado):\n${texto}`)
    .join('\n\n');
}

/** El capítulo de esta pregunta, para no resumir el que se está contando ahora. */
async function capituloDeOrden(narradorId: string, orden: number): Promise<string | null> {
  const { data } = await db.from('preguntas')
    .select('orden,capitulo,narrador_id')
    .or(`narrador_id.eq.${narradorId},narrador_id.is.null`)
    .eq('orden', orden)
    .limit(1)
    .maybeSingle();
  return (data as PreguntaFila | null)?.capitulo ?? null;
}
