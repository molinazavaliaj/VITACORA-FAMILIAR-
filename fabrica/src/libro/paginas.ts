import type Anthropic from '@anthropic-ai/sdk';
import { encargoDelLibro, formasDeGenero, type Genero, type Quien } from './encargo.js';
import { esTextual } from './frases.js';
import { extraerTexto } from './comun.js';
import { medirRepeticion, type Fuente } from './medir-repeticion.js';

// El editor v2 y el control del libro (biógrafo v2, 23/09 — EXPERIMENTO; producción sigue con
// `editarLibro` de generar-paquete.ts hasta que Naza y Joaquín lo aprueben).
//
// El editor de hoy relee el libro ENTERO y lo reescribe (USD 2,08 por libro, el paso más caro),
// con una instrucción de una oración que no dice "no inventes" ni nada de la voz, y que pide
// "referencias cruzadas" —mezclar historias—. Además elige los títulos que quiere: en el libro de
// Joaquín eligió unos que el lector de «Sus frases» no reconoce, y las frases que le dejaron sus
// padres nunca llegaron a elegirse para el QR.
//
// Acá el editor NO toca los capítulos: escribe lo que el libro no tiene (la apertura, el cierre y
// «Sus frases»), el código arma el libro con títulos fijos, y las frases que no están textuales
// en sus audios se caen (el QR reproduce su voz: si no lo dijo así, no hay audio).

const MODELO = 'claude-fable-5';

export type Paginas = {
  apertura: string;
  cierre: string;
  suyas: string[];
  heredadas: { frase: string; quien: string }[];
  muletillas: string[];
};

export const PROMPT_PAGINAS = (encargo: string, capitulos: string, transcripciones: string) => `
Estás terminando el libro de una vida.

${encargo}

EL LIBRO YA ESCRITO (los capítulos, en orden — no se tocan):
${capitulos}

LO QUE CONTÓ, TEXTUAL (todas sus respuestas):
${transcripciones}

Te toca escribir lo que el libro todavía no tiene:

1. La apertura, «A mis lectores», en su voz, de 120 a 220 palabras: quién es, desde dónde cuenta
   y para quién, con lo que ya está en el libro. No adelantes todas las historias: invitá a
   leerlas.
2. El cierre, «Antes de cerrar el libro», en su voz, de 100 a 200 palabras: lo que queda cuando
   mira todo junto, con lo que dijo sobre eso (sus alegrías, lo que aprendió, lo que quiere
   dejar). Nada que no haya dicho.
3. «Sus frases», copiadas TEXTUALES de sus respuestas, palabra por palabra (se verifican contra
   los audios y la que no esté, se cae):
   - "suyas": los dichos y frases que repite o que la/lo definen (hasta 15);
   - "heredadas": lo que le dijeron otros y no soltó más, con quién se lo dijo (hasta 8);
   - "muletillas": sus palabras de entrecasa, las que se le escapan (hasta 8).

Devolvé SOLO un JSON con esta forma:
{"apertura":"...","cierre":"...","suyas":["..."],"heredadas":[{"frase":"...","quien":"..."}],"muletillas":["..."]}`;

/**
 * Lee lo que devolvió el modelo y deja solo las frases textuales. `caidas` son las que el modelo
 * propuso y no están en ninguna respuesta: se anotan para poder leerlas.
 */
export function parsearPaginas(
  salida: string,
  transcripciones: string[],
): { ok: true; paginas: Paginas; caidas: string[] } | { ok: false } {
  let crudo: Partial<Paginas>;
  try {
    const limpio = salida.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    crudo = JSON.parse(limpio.slice(limpio.indexOf('{'), limpio.lastIndexOf('}') + 1));
  } catch {
    return { ok: false };
  }
  if (typeof crudo.apertura !== 'string' || typeof crudo.cierre !== 'string') return { ok: false };

  const caidas: string[] = [];
  const textual = (f: string) => {
    if (esTextual(f, transcripciones)) return true;
    caidas.push(f);
    return false;
  };
  const textos = (xs: unknown) => (Array.isArray(xs) ? xs.filter((x): x is string => typeof x === 'string') : []);
  const paginas: Paginas = {
    apertura: crudo.apertura.trim(),
    cierre: crudo.cierre.trim(),
    suyas: textos(crudo.suyas).filter(textual),
    heredadas: (Array.isArray(crudo.heredadas) ? crudo.heredadas : [])
      .filter((h): h is { frase: string; quien: string } => typeof h?.frase === 'string')
      .filter((h) => textual(h.frase))
      .map((h) => ({ frase: h.frase, quien: typeof h.quien === 'string' ? h.quien : '' })),
    muletillas: textos(crudo.muletillas).filter(textual),
  };
  return { ok: true, paginas, caidas };
}

/**
 * El libro en Markdown, con títulos FIJOS: los que la plantilla y el lector de «Sus frases»
 * (`seccionesDelLibro`) reconocen. El editor ya no elige cómo se llaman.
 */
export function armarLibro(p: Paginas, capitulos: { nombre: string; texto: string }[]): string {
  const lista = (xs: string[]) => xs.map((x) => `- «${x}»`).join('\n');
  const partes = [
    `# A mis lectores\n\n${p.apertura}`,
    ...capitulos.map((c) => `# ${c.nombre}\n\n${c.texto.trim()}`),
    `# Antes de cerrar el libro\n\n${p.cierre}`,
    '# Sus frases',
    ...(p.suyas.length ? [`## Las suyas\n\n${lista(p.suyas)}`] : []),
    ...(p.heredadas.length ? [`## Las que heredó\n\n${p.heredadas.map((h) => `- «${h.frase}»${h.quien ? ` — *${h.quien}*` : ''}`).join('\n')}`] : []),
    ...(p.muletillas.length ? [`## Las muletillas de siempre\n\n${lista(p.muletillas)}`] : []),
  ];
  return partes.join('\n\n') + '\n';
}

/** Una llamada: la apertura, el cierre y «Sus frases». Devuelve el uso para anotar el costo. */
export async function escribirPaginas(
  cliente: Anthropic,
  quien: Quien,
  capitulos: { nombre: string; texto: string }[],
  transcripciones: string[],
): Promise<{ resultado: ReturnType<typeof parsearPaginas>; usage: Anthropic.Usage }> {
  const libro = capitulos.map((c) => `# ${c.nombre}\n\n${c.texto}`).join('\n\n');
  const stream = cliente.messages.stream({
    model: MODELO,
    max_tokens: 16000,
    messages: [{ role: 'user', content: PROMPT_PAGINAS(encargoDelLibro(quien), libro, transcripciones.join('\n\n---\n\n')) }],
  });
  const final = await stream.finalMessage();
  const texto = extraerTexto(final.content as Array<{ type: string; text?: string }>);
  return { resultado: parsearPaginas(texto, transcripciones), usage: final.usage };
}

// ── El control del libro, antes de imprimir ───────────────────────────────────────────────────
// Sin modelo: las mediciones de hoy, como freno. Joaquín: "no faltaba una instrucción, faltaba
// alguien que mirara la salida".

/** Más que esto, se avisa. Hoy el libro de Joaquín daba 17,3 % y 4 %; con el reparto, 1,1 % y 2 %. */
const TOPE_REPETICION = 3;
const TOPE_SIN_RESPALDO = 8;

export function controlarLibro(
  capitulos: { nombre: string; texto: string }[],
  fuentes: Fuente[],
  genero: Genero | null,
): { avisos: string[]; repeticion: number; sinRespaldo: number } {
  const avisos: string[] = [];
  const m = medirRepeticion(capitulos, fuentes);
  const sinRespaldo = m.oraciones ? (100 * m.sinRespaldo) / m.oraciones : 0;
  if (m.porcentaje > TOPE_REPETICION) {
    avisos.push(`El libro repite: ${m.porcentaje.toFixed(1)} % de las palabras es una frase suya copiada en otro capítulo (${m.frasesEnVariosCapitulos.length} frases).`);
  }
  if (sinRespaldo > TOPE_SIN_RESPALDO) {
    avisos.push(`${sinRespaldo.toFixed(0)} % de las oraciones no tiene respaldo en ningún audio (${m.sinRespaldo} de ${m.oraciones}): leer si hay algo inventado.`);
  }
  const formas = formasDeGenero(capitulos.map((c) => c.texto).join('\n'));
  if (genero === 'mujer' && formas.hombre.length) avisos.push(`Es una mujer y el libro habla en masculino: ${formas.hombre.join(', ')}.`);
  if (genero === 'hombre' && formas.mujer.length) avisos.push(`Es un hombre y el libro habla en femenino: ${formas.mujer.join(', ')}.`);
  if (genero === null && formas.mujer.length && formas.hombre.length) {
    avisos.push(`El libro mezcla femenino y masculino: ${[...formas.mujer, ...formas.hombre].join(', ')}.`);
  }
  return { avisos, repeticion: m.porcentaje, sinRespaldo };
}
