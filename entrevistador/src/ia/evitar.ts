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
