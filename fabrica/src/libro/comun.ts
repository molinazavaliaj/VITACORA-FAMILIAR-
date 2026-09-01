import { obtenerClienteDb, type Pregunta, type Respuesta } from '../db.js';

// Helpers compartidos entre previsualizar.ts (capítulo 1, para enamorar antes
// de comprar) y generar-paquete.ts (el libro completo, ya pagado). Viven acá
// para no duplicar lógica que tiene que comportarse idéntico en los dos
// lugares — dos implementaciones del mismo "cómo armamos el material de un
// capítulo" es la clase de divergencia silenciosa que después cuesta cara.

export type Nombres = { correcciones: { original: string; corregido: string }[] };

export function textoRespuesta(r: Pick<Respuesta, 'transcripcion' | 'texto_directo'>): string | null {
  const texto = r.transcripcion?.trim() || r.texto_directo;
  return texto && texto.trim() !== '' ? texto : null;
}

export function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Formatea las correcciones de nombres para el prompt del capítulo:
 * "original → corregido", una por línea. Vacío → "(sin correcciones)" (el
 * prompt igual necesita algo ahí para no confundir al modelo).
 */
export function formatearNombresCorregidos(correcciones: Nombres['correcciones']): string {
  if (correcciones.length === 0) return '(sin correcciones)';
  return correcciones.map((c) => `${c.original} → ${c.corregido}`).join('\n');
}

/**
 * Arma el bloque "P: ... / R: ..." para un conjunto de órdenes de pregunta,
 * en el orden dado. Se usa tanto para el material de un capítulo (subset de
 * órdenes) como para "la historia completa" (todos los órdenes).
 */
export function armarMaterial(
  ordenes: number[],
  preguntasPorOrden: Map<number, Pick<Pregunta, 'texto'>>,
  respuestasPorOrden: Map<number, Pick<Respuesta, 'transcripcion' | 'texto_directo'>[]>
): string {
  const bloques: string[] = [];
  for (const orden of ordenes) {
    const pregunta = preguntasPorOrden.get(orden);
    const respuestas = respuestasPorOrden.get(orden) ?? [];
    for (const respuesta of respuestas) {
      const texto = textoRespuesta(respuesta);
      if (!texto) continue;
      bloques.push(`P: ${pregunta?.texto ?? `Pregunta ${orden}`}\nR: ${texto}`);
    }
  }
  return bloques.join('\n\n');
}

/**
 * Convierte el Markdown mínimo que devuelve el modelo (párrafos + líneas
 * "> cita") a HTML. No es un parser de Markdown general — el prompt solo
 * pide estas dos formas, así que alcanza con esto.
 */
export function capituloMarkdownAHtml(texto: string): string {
  const lineas = texto.split(/\r?\n/);
  const bloques: string[] = [];
  let actual: string[] = [];
  let tipoActual: 'p' | 'blockquote' | null = null;

  function cerrarBloque() {
    if (actual.length === 0) return;
    const contenido = actual.join(' ').trim();
    if (contenido) {
      const etiqueta = tipoActual === 'blockquote' ? 'blockquote' : 'p';
      bloques.push(`<${etiqueta}>${escaparHtml(contenido)}</${etiqueta}>`);
    }
    actual = [];
    tipoActual = null;
  }

  for (const lineaCruda of lineas) {
    const linea = lineaCruda.trim();
    if (linea === '') {
      cerrarBloque();
      continue;
    }
    const esCita = linea.startsWith('>');
    const tipo: 'p' | 'blockquote' = esCita ? 'blockquote' : 'p';
    if (tipoActual !== null && tipoActual !== tipo) cerrarBloque();
    tipoActual = tipo;
    actual.push(esCita ? linea.replace(/^>\s?/, '') : linea);
  }
  cerrarBloque();

  return bloques.join('\n');
}

/**
 * Descarga y parsea un JSON de Storage. Tira si no existe o no parsea —
 * ambos casos son "no cumple la precondición" para quien llama.
 */
export async function descargarJson<T>(
  db: ReturnType<typeof obtenerClienteDb>,
  ruta: string,
  descripcion: string
): Promise<T> {
  const { data, error } = await db.storage.from('audios').download(ruta);
  if (error || !data) {
    throw new Error(`No se pudo descargar ${descripcion} (${ruta}): ${error?.message ?? 'sin datos'}`);
  }
  const texto = typeof data.text === 'function' ? await data.text() : String(data);
  try {
    return JSON.parse(texto) as T;
  } catch (err) {
    throw new Error(`${descripcion} (${ruta}) no es JSON válido: ${(err as Error).message}`);
  }
}
