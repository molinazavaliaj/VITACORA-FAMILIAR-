// La prueba de repetición (biógrafo v2, hallazgo 41 medido el 23/09).
//
// Joaquín leyó su libro y dijo que repite. Medido: el 11,6 % de las palabras eran frases que
// él dijo UNA vez, impresas en 2 o 3 capítulos. Esto convierte "repite" en un número para
// comparar dos versiones del libro sin leerlas enteras.
//
// Cómo: cada oración del libro se rastrea hasta la frase de las transcripciones que más se le
// parece (palabras de contenido compartidas). Si la MISMA frase del audio aparece en más de un
// capítulo, cada aparición después de la primera es una copia. Es una heurística: sirve para
// comparar versiones entre sí, no como verdad al detalle — el detalle se lee.

export type CapituloMedible = { nombre: string; texto: string };
export type Fuente = { id: string; texto: string };

export type Medicion = {
  palabras: number;
  palabrasDuplicadas: number;
  porcentaje: number;
  /** Oraciones del libro que no se parecen a nada de lo que dijo (inventadas, o muy reescritas). */
  sinRespaldo: number;
  frasesEnVariosCapitulos: { fuente: string; oracion: string; capitulos: string[] }[];
};

const VACIAS = new Set(('para como pero porque cuando donde entonces este esta esto esos esas eso ese una unos unas todo todos toda todas ' +
  'mucho mucha muchos muchas algo nada cosa cosas mismo misma tambien siempre nunca ahora despues antes quizas bueno digamos tenia ' +
  'tenian habia hacia hacer hace estaba estaban eran fue fueron mas muy tan sino desde hasta sobre entre ella ellos ellas ahi alla ' +
  'aca bien sabes creo mejor').split(' '));

/** Minúsculas, sin acentos: la misma palabra aunque cambie la ortografía. */
function normalizar(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]+/g, ' ');
}

/** Palabras de contenido, cortadas a 6 letras para que "trabajé" y "trabajaba" cuenten igual. */
function contenido(texto: string): string[] {
  return [...new Set(normalizar(texto).split(/\s+/).filter((p) => p.length >= 4 && !VACIAS.has(p)).map((p) => p.slice(0, 6)))];
}

/** Oraciones con al menos 5 palabras de contenido: menos que eso no alcanza para decidir. */
function oraciones(texto: string): string[] {
  return texto
    .replace(/^>\s*/gm, '')
    .replace(/\*/g, '')
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((o) => o.trim())
    .filter((o) => contenido(o).length >= 5);
}

function solapamiento(a: string[], b: string[]): number {
  const conjunto = new Set(b);
  return a.filter((x) => conjunto.has(x)).length / Math.min(a.length, b.length);
}

const UMBRAL_RESPALDO = 0.5;

export function medirRepeticion(capitulos: CapituloMedible[], fuentes: Fuente[]): Medicion {
  const frasesFuente = fuentes.flatMap((f) => oraciones(f.texto).map((o, i) => ({ clave: `${f.id}#${i + 1}`, palabras: contenido(o) })));

  const respaldo = (o: string): string | null => {
    const p = contenido(o);
    let mejor: { clave: string; valor: number } | null = null;
    for (const f of frasesFuente) {
      const valor = solapamiento(p, f.palabras);
      if (!mejor || valor > mejor.valor) mejor = { clave: f.clave, valor };
    }
    return mejor && mejor.valor >= UMBRAL_RESPALDO ? mejor.clave : null;
  };

  let palabras = 0;
  let sinRespaldo = 0;
  const usos = new Map<string, { capitulo: string; oracion: string; palabras: number }[]>();
  for (const c of capitulos) {
    for (const o of oraciones(c.texto)) {
      const n = o.split(/\s+/).length;
      palabras += n;
      const clave = respaldo(o);
      if (!clave) { sinRespaldo++; continue; }
      usos.set(clave, [...(usos.get(clave) ?? []), { capitulo: c.nombre, oracion: o, palabras: n }]);
    }
  }

  let palabrasDuplicadas = 0;
  const frasesEnVariosCapitulos: Medicion['frasesEnVariosCapitulos'] = [];
  for (const [fuente, apariciones] of usos) {
    const enCapitulos = [...new Set(apariciones.map((a) => a.capitulo))];
    if (enCapitulos.length < 2) continue;
    // La primera aparición es la legítima; las demás, copias. Solo cuentan las de OTRO
    // capítulo: dos veces en el mismo es que él lo repitió al hablar (otro problema).
    const primera = apariciones[0];
    for (const a of apariciones.slice(1)) if (a.capitulo !== primera.capitulo) palabrasDuplicadas += a.palabras;
    frasesEnVariosCapitulos.push({ fuente, oracion: primera.oracion, capitulos: enCapitulos });
  }

  return { palabras, palabrasDuplicadas, porcentaje: palabras ? (100 * palabrasDuplicadas) / palabras : 0, sinRespaldo, frasesEnVariosCapitulos };
}
