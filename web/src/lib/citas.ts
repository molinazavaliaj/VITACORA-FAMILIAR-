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
