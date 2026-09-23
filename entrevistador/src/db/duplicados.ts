// El candado contra el audio cruzado (bitácora #43, 23/09).
//
// Qué pasó: el 17/09, cargando los dos pilotos en paralelo por la puerta manual, un
// audio de Ciro se cargó en Joaquín — mismo archivo, 38 segundos, dos minutos después
// del suyo. Quedó en la base, su material entró al libro de Joaquín, y lo detectó él
// leyendo el libro terminado: "esto me lo inventaron". No lo había dicho.
//
// Es el error más grave que puede tener este producto —la historia de otra persona
// dentro de tu libro— y no lo ve nadie: ni el modelo, que hace bien su trabajo con el
// material que le damos, ni la familia, que no estuvo en la entrevista. Solo el
// narrador, leyendo el libro final, cuando ya está impreso.
//
// El candado compara la transcripción nueva contra las que ya están cargadas en OTROS
// narradores. Es barato (una consulta) y atrapa exactamente este caso: el mismo audio
// transcripto dos veces da textos casi iguales, no idénticos, porque el prompt de
// transcripción lleva el contexto y los nombres de cada narrador.

/** Menos que esto no alcanza para decidir: dos "sí, claro" no son el mismo audio. */
const LARGO_MINIMO = 60;

/** Qué parecidos tienen que ser para considerarlos el mismo audio. */
const PARECIDO_MINIMO = 0.92;

/** Sin acentos, sin puntuación, sin mayúsculas: lo que queda es lo que se dijo. */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Cuánto se parecen dos textos, de 0 a 1, por palabras compartidas en orden. No es
 * una distancia de edición: alcanza con detectar el mismo audio transcripto dos
 * veces, y así no se trae una dependencia para esto.
 */
function parecido(a: string, b: string): number {
  const pa = a.split(' ');
  const pb = new Set(b.split(' '));
  if (pa.length === 0) return 0;
  const compartidas = pa.filter((palabra) => pb.has(palabra)).length;
  // Se mide contra el más largo para que un texto corto metido dentro de uno largo
  // no dé 1: "sí claro" está entero adentro de cualquier respuesta.
  return compartidas / Math.max(pa.length, pb.size);
}

/** ¿Son la misma respuesta, aunque la transcripción difiera en detalles? */
export function esLaMismaRespuesta(unaTranscripcion: string, otra: string): boolean {
  const a = normalizar(unaTranscripcion ?? '');
  const b = normalizar(otra ?? '');
  if (a.length < LARGO_MINIMO || b.length < LARGO_MINIMO) return false;
  return parecido(a, b) >= PARECIDO_MINIMO;
}

export type RespuestaAjena = {
  narrador_id: string;
  pregunta_orden: number;
  como_le_dicen?: string;
  transcripcion: string | null;
};

/**
 * ¿Esta transcripción ya está cargada en otro narrador? Devuelve la primera que
 * coincida, para poder decir de quién es y en qué pregunta.
 */
export function buscarCruce(transcripcion: string, ajenas: RespuestaAjena[]): RespuestaAjena | null {
  for (const otra of ajenas) {
    if (otra.transcripcion && esLaMismaRespuesta(transcripcion, otra.transcripcion)) return otra;
  }
  return null;
}
