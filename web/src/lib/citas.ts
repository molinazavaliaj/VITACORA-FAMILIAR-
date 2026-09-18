// La frase textual donde el narrador dijo un nombre (17/09, pedido de Joaquín
// en el paso 3 de Encargar libro). La fábrica manda, por cada nombre, un
// "contexto" que escribe el modelo — una paráfrasis. Para corregir un nombre
// hace falta recordar QUÉ se dijo, y eso solo lo da la transcripción literal.
// Acá se busca el nombre en las respuestas y se devuelven las oraciones donde
// aparece, con el número de pregunta. Sin llamadas al modelo: es texto.

export type RespuestaConTexto = { pregunta_orden: number; transcripcion: string | null; texto_directo?: string | null };
export type Cita = { orden: number; frase: string };

/** Sin acentos, en minúscula: "Pelliza" encuentra "pelliza" y "Pellíza" (la transcripción no es consistente). */
function plano(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Oraciones: se corta en . ! ? y saltos de línea, sin perder el signo de cierre. Los puntos suspensivos no cortan: son una pausa, no un final. */
export function oraciones(texto: string): string[] {
  return texto
    .split(/(?<=[.!?])\s+|\n+/)
    .map((o) => o.trim())
    .filter(Boolean);
}

/** Las oraciones donde aparece el nombre (palabra entera), en orden de pregunta. */
export function citasDeNombre(nombre: string, respuestas: RespuestaConTexto[], maximo = 3): Cita[] {
  const buscado = plano(nombre.trim());
  if (!buscado) return [];
  // Palabra entera, sin acentos, sobre el texto aplanado. `\b` no entiende de
  // letras con acento, por eso se aplana antes y se usa un lookaround propio.
  const patron = new RegExp(`(?<![\\p{L}\\p{N}])${escaparRegex(buscado)}(?![\\p{L}\\p{N}])`, "u");
  const citas: Cita[] = [];
  const ordenadas = [...respuestas].sort((a, b) => a.pregunta_orden - b.pregunta_orden);
  for (const r of ordenadas) {
    const texto = r.transcripcion ?? r.texto_directo ?? "";
    for (const frase of oraciones(texto)) {
      if (patron.test(plano(frase))) {
        citas.push({ orden: r.pregunta_orden, frase });
        if (citas.length >= maximo) return citas;
      }
    }
  }
  return citas;
}

/** Parte una frase en [antes, nombre, después] para resaltar el nombre tal como se dijo; null si no está. */
export function resaltar(frase: string, nombre: string): [string, string, string] | null {
  const f = plano(frase);
  const n = plano(nombre.trim());
  // Aplanar no cambia el largo (solo saca marcas combinantes y baja a minúscula),
  // así que las posiciones en `f` valen para `frase`.
  const patron = new RegExp(`(?<![\\p{L}\\p{N}])${escaparRegex(n)}(?![\\p{L}\\p{N}])`, "u");
  const m = patron.exec(f);
  if (!m) return null;
  return [frase.slice(0, m.index), frase.slice(m.index, m.index + n.length), frase.slice(m.index + n.length)];
}

// ── Nombres que suenan igual (18/09) ──────────────────────────────────
// La transcripción escribe el mismo nombre de dos formas ("Naza" / "NASA",
// "Pelliza" / "Peliza") y la fábrica los lista como dos personas. Acá se
// detectan los que suenan igual en castellano rioplatense para SUGERIR que
// son la misma; la familia decide, nunca se unifica solo.

/** Forma "sonora": sin acentos, minúsculas, s=z=c(e,i), b=v, ll=y, h muda, letras dobles simplificadas. */
export function sonido(nombre: string): string {
  let t = nombre.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  t = t.replace(/h/g, "");
  t = t.replace(/c(?=[ei])/g, "s").replace(/z/g, "s").replace(/qu/g, "k").replace(/c/g, "k");
  t = t.replace(/v/g, "b").replace(/ll/g, "y").replace(/ge(?=[ei])|j/g, "j").replace(/(.)\1+/g, "$1");
  return t;
}

/** Levenshtein acotado: cuántas letras hay que cambiar para pasar de una a otra. */
function distancia(a: string, b: string): number {
  const fila = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = fila[0];
    fila[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = fila[j];
      fila[j] = Math.min(fila[j] + 1, fila[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return fila[b.length];
}

/** ¿Suenan igual (o casi: una letra de diferencia en nombres de 4+ letras)? */
export function suenanIgual(a: string, b: string): boolean {
  const sa = sonido(a);
  const sb = sonido(b);
  const escritosIgual = a.trim().toLowerCase() === b.trim().toLowerCase();
  if (escritosIgual || !sa || !sb) return false; // dos "Juan" son dos filas, no un parecido
  if (sa === sb) return true;
  return Math.min(sa.length, sb.length) >= 4 && distancia(sa, sb) <= 1;
}

/**
 * Para cada nombre, los otros de la lista que suenan igual. Se mira solo hacia
 * atrás (índices menores), así la sugerencia aparece en el segundo y no en los
 * dos: "NASA — ¿es la misma persona que Naza?".
 */
export function parecidosAnteriores(nombres: string[]): Map<number, number[]> {
  const resultado = new Map<number, number[]>();
  nombres.forEach((n, i) => {
    const previos: number[] = [];
    for (let j = 0; j < i; j++) if (suenanIgual(n, nombres[j])) previos.push(j);
    if (previos.length) resultado.set(i, previos);
  });
  return resultado;
}
