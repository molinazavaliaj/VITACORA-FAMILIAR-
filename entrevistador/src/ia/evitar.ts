// Lo que la familia pidió NO tocar (docs/panel-usuario.md §6.4 y §11.5):
// `contexto.evitar`, texto libre que escribe la dueña en el panel ("no preguntar
// por su hermano Rubén"). Entra en todos los prompts del cerebro: evaluar,
// personalizar, reemplazar, las adaptativas y las sugeridas.

export function textoEvitar(contexto: Record<string, unknown> | null | undefined): string {
  const evitar = typeof contexto?.evitar === 'string' ? contexto.evitar.trim() : '';
  if (!evitar) return '';
  return `
TEMAS QUE LA FAMILIA PIDIÓ NO TOCAR (respetalo siempre, aunque él los mencione; no preguntes ni insistas sobre esto):
${evitar}
`;
}

/** Más largo que esto no es un tema: es el modelo contando la respuesta de nuevo. */
const TEMA_MAXIMO = 120;
/** El tope del panel (`EVITAR_MAXIMO` en `web/src/lib/guion.ts`): si lo pasamos, la familia no puede volver a guardar el campo. */
const EVITAR_MAXIMO = 1000;

/**
 * Bitácora 34: el narrador dijo "vamos por otro lado" y la evaluación devolvió
 * el tema (`dejarTema`). Acá se suma a `contexto.evitar` para que el resto de
 * la entrevista —personalizar, repreguntar, adaptativas— no vuelva ahí. Es
 * puro: devuelve el contexto nuevo, o null si no hay nada que anotar (tema
 * vacío, demasiado largo, o ya estaba).
 *
 * Se anota con una marca ("lo pidió él") para que la familia, que ve `evitar`
 * en el panel, sepa de dónde salió cada línea.
 */
export function sumarTemaEvitado(
  contexto: Record<string, any> | null | undefined, tema: unknown,
): Record<string, any> | null {
  const limpio = typeof tema === 'string' ? tema.trim().replace(/\s+/g, ' ').replace(/[.]+$/, '') : '';
  if (!limpio || limpio.length > TEMA_MAXIMO) return null;
  const actual = typeof contexto?.evitar === 'string' ? contexto.evitar.trim() : '';
  if (actual.toLowerCase().includes(limpio.toLowerCase())) return null;
  const linea = `${limpio} (lo pidió él en la entrevista)`;
  const evitar = actual ? `${actual}\n${linea}` : linea;
  if (evitar.length > EVITAR_MAXIMO) return null;
  return { ...(contexto ?? {}), evitar };
}
