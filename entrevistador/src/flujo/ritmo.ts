// El ritmo de la entrevista (docs/panel-usuario.md §6.4). Vive aparte de
// preguntar.ts (que importa la base) para que la V3 lo use sin arrastrarla.

export type Ritmo = 'diario' | 'dos_por_dia' | 'seguido';

/**
 * El ritmo de la entrevista (docs/panel-usuario.md §6.4): lo elige la familia
 * en el panel. `modoRapido` es el nombre viejo de 'seguido' (los pilotos).
 */
export function ritmoDe(contexto: Record<string, any>): Ritmo {
  const r = contexto?.ritmo;
  if (r === 'diario' || r === 'dos_por_dia' || r === 'seguido') return r;
  return contexto?.modoRapido === true ? 'seguido' : 'diario';
}

/** ¿Este narrador está en modo rápido (la siguiente pregunta sale al instante)? */
export function esModoRapido(contexto: Record<string, any>): boolean {
  return ritmoDe(contexto) === 'seguido';
}
