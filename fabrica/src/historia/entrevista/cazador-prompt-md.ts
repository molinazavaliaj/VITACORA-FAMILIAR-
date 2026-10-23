// Lee el prompt del cazador de su md. Va aparte de cazador.ts (que importa
// los json) para que `scripts/historia-cazador-json.ts` pueda generar los json
// aunque todavía no existan.

/** La sección "## Prompt" del md: lo que va entre el primer par de ``` después del título. */
export function extraerPrompt(md: string): string {
  const despues = md.replace(/\r\n/g, '\n').split('## Prompt')[1];
  if (despues === undefined) throw new Error('el md del cazador no tiene "## Prompt"');
  const bloque = despues.split('```')[1];
  if (bloque === undefined) throw new Error('el md del cazador no tiene el prompt entre ```');
  return bloque.trim();
}
