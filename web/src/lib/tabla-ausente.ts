// ¿Este error de la base dice que la tabla todavía no existe (migración sin
// aplicar)? Postgres responde 42P01; PostgREST, PGRST205 o "could not find the
// table". La misma regla que entrevistador/src/v3/estado.ts (son dos servicios).

type ErrorDeBase = { code?: string; message?: string } | null | undefined;

export function esTablaAusente(error: ErrorDeBase): boolean {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  return /relation "[^"]+" does not exist|could not find the table/i.test(error.message ?? "");
}
