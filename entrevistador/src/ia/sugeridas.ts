import Anthropic from '@anthropic-ai/sdk';
import { cargarConfig } from '../config.js';
import { db } from '../db/cliente.js';
import { armarHistoria } from '../db/historia.js';
import { guionDe } from '../db/guion.js';
import { textoEvitar } from './evitar.js';
import { tratoDe, type Trato } from './trato.js';
import { registrarUso, cuentaDeEsteServicio } from '../costos.js';

// Sugeridas a pedido (docs/panel-usuario.md §6.2 y §11.7): la familia toca
// "Sugerime preguntas" en el panel y el biógrafo, con todo lo que él ya contó
// y lo que ya está en el guion, propone 5. No se guardan: la familia elige
// cuáles agregar (eso lo hace la web con `tipo = 'sugerida'`). Reusa la idea
// del prompt de las adaptativas, pero evita repetir lo que ya está preguntado.

const MODELO = 'claude-opus-5';
const MAX_TOKENS = 3000;
export const CANTIDAD_SUGERIDAS = 5;

export type Sugerida = { texto: string; capitulo: string };

export const PROMPT_SUGERIDAS = (nombre: string, historia: string, guion: string[], capitulos: string[], evitar = '', trato: Trato = 'usted') => `
Sos el biógrafo de ${nombre}. Esto es lo que contó hasta ahora en la entrevista:

${historia || '(todavía no contó nada)'}
${evitar}
Estas son las preguntas que YA están en el guion (no las repitas ni las reformules):
${guion.map((q) => `- ${q}`).join('\n')}

Su familia quiere sumar preguntas y te pide ${CANTIDAD_SUGERIDAS} ideas. Buscá lo que falta:
- Personas que nombró y no exploró; épocas con huecos; algo que disfrutó contar y da para más.
- Si todavía no contó nada, proponé preguntas concretas y cálidas sobre la vida cotidiana que el guion no cubre.

Cada pregunta: tratarlo de ${trato}, una sola pregunta clara, máximo 45 palabras, con un solo detalle concreto si lo hay.
Capítulos disponibles del libro: ${capitulos.join(', ')}.

Respondé SOLO con JSON: [{"texto": "...", "capitulo": "..."}, ...] (exactamente ${CANTIDAD_SUGERIDAS}).`;

/** Tolera ```json y valida que vengan 5 con texto y capítulo. */
export function parsearSugeridas(crudo: string, capitulosValidos: string[]): Sugerida[] {
  const limpio = crudo.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  const lista = JSON.parse(limpio) as Sugerida[];
  if (!Array.isArray(lista) || lista.length < CANTIDAD_SUGERIDAS) {
    throw new Error(`esperaba ${CANTIDAD_SUGERIDAS} sugeridas y vinieron ${Array.isArray(lista) ? lista.length : 0}`);
  }
  const validos = new Set(capitulosValidos);
  return lista.slice(0, CANTIDAD_SUGERIDAS).map((s) => {
    if (!s?.texto?.trim()) throw new Error('una sugerida vino sin texto');
    // Un capítulo inventado por el modelo cae en el primero: nunca se guarda uno que no existe.
    const capitulo = validos.has(s.capitulo?.trim()) ? s.capitulo.trim() : capitulosValidos[0] ?? 'Otros';
    return { texto: s.texto.trim(), capitulo };
  });
}

let _cliente: Anthropic | null = null;
const cliente = () => (_cliente ??= new Anthropic({ apiKey: cargarConfig().anthropicKey }));

export async function sugerirPreguntas(narradorId: string): Promise<Sugerida[]> {
  const { data: narrador } = await db.from('narradores').select('como_le_dicen, contexto').eq('id', narradorId).maybeSingle();
  const n = narrador as { como_le_dicen?: string; contexto?: Record<string, unknown> } | null;
  if (!n) throw new Error('No encontramos ese narrador');

  const { preguntas } = await guionDe(narradorId);
  const capitulos = [...new Set(preguntas.map((p) => p.capitulo))];
  const historia = await armarHistoria(narradorId);
  const trato = await tratoDe({ id: narradorId, como_le_dicen: n.como_le_dicen ?? 'el narrador', contexto: (n.contexto ?? {}) as Record<string, any> });
  const prompt = PROMPT_SUGERIDAS(n.como_le_dicen ?? 'el narrador', historia, preguntas.map((p) => p.texto), capitulos, textoEvitar(n.contexto), trato);

  const respuesta = await cliente().messages.create({ model: MODELO, max_tokens: MAX_TOKENS, messages: [{ role: 'user', content: prompt }] });
  await registrarUso(db, {
    servicio: 'entrevistador', paso: 'sugeridas', modelo: MODELO, proveedor: 'anthropic',
    cuenta: cuentaDeEsteServicio(), narradorId, uso: respuesta.usage,
  });
  const bloque = respuesta.content.find((b) => b.type === 'text');
  if (!bloque || bloque.type !== 'text') throw new Error('Claude no devolvió texto');
  return parsearSugeridas(bloque.text.trim(), capitulos);
}
