// Helpers de tiempo puros (en la zona del narrador). Viven aparte de
// scheduler.ts (que importa la base) para que la V3 los use sin arrastrarla.

/** 'YYYY-MM-DD' en la zona del narrador. */
export function fechaLocal(fecha: Date, zona: string): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: zona }).format(fecha);
}

/** Minutos transcurridos del día en la zona del narrador. */
export function minutosLocales(fecha: Date, zona: string): number {
  const hhmm = new Intl.DateTimeFormat('es', {
    timeZone: zona, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(fecha);
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
