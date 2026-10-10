// Gift card: la zona horaria del narrador sale del teléfono con que canjea,
// no de la región de quien regala (alguien en España le regala a su abuela en
// Argentina: las preguntas no pueden llegarle a las 5 de la mañana).
// Solo los dos países donde vendemos; cualquier otro prefijo no toca nada.

const ZONAS: [prefijo: string, zona: string][] = [
  ['+54', 'America/Argentina/Buenos_Aires'],
  ['+34', 'Europe/Madrid'],
];

export function zonaPorTelefono(telefono: string): string | null {
  const t = telefono.trim();
  if (!t) return null;
  const conMas = t.startsWith('+') ? t : `+${t}`;
  for (const [prefijo, zona] of ZONAS) if (conMas.startsWith(prefijo)) return zona;
  return null;
}
