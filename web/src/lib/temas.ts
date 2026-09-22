// "¿De qué querés que le preguntemos más?" (22/09, decisión de Joaquín).
//
// No cambian QUÉ preguntas existen —eso son las plantillas del guion, que
// vienen después— sino hacia dónde inclina el biógrafo cada pregunta cuando la
// escribe (`entrevistador/src/ia/personalizar.ts`, con la ficha). Es el mismo
// mecanismo que los ángulos de la Vitácora de viaje.
//
// Palabras de familia, no de producto: quien completa esto es un nieto desde el
// celular (docs/ficha-del-narrador.md §6). ⚠️ Textos a revisar por Naza.

export const TEMAS = ["familia", "oficio", "origen", "fe", "viajes", "musica", "dificiles", "amor"] as const;
export type Tema = (typeof TEMAS)[number];

export const NOMBRE_TEMA: Record<Tema, string> = {
  familia: "Su familia",
  oficio: "Su trabajo y lo que construyó",
  origen: "De dónde vino su familia",
  fe: "Su fe y sus creencias",
  viajes: "Los viajes y los lugares",
  musica: "La música y las fiestas",
  dificiles: "Los años difíciles",
  amor: "El amor y la pareja",
};

export const IMPRESCINDIBLE_MAXIMO = 200;

export function validarTemas(entrada: unknown): { ok: true; temas: Tema[] } | { ok: false; mensaje: string } {
  if (entrada === undefined || entrada === null) return { ok: true, temas: [] };
  if (!Array.isArray(entrada) || !entrada.every((t) => (TEMAS as readonly unknown[]).includes(t))) {
    return { ok: false, mensaje: "Los temas elegidos no son válidos." };
  }
  return { ok: true, temas: [...new Set(entrada as Tema[])] };
}

export function validarImprescindible(entrada: unknown): { ok: true; texto: string } | { ok: false; mensaje: string } {
  if (entrada === undefined || entrada === null) return { ok: true, texto: "" };
  if (typeof entrada !== "string") return { ok: false, mensaje: "Eso que no puede faltar tiene que ser texto." };
  return { ok: true, texto: entrada.trim().slice(0, IMPRESCINDIBLE_MAXIMO) };
}
