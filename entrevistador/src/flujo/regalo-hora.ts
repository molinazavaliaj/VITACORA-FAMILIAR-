// La hora del regalo que llega solo el día elegido (spec 2026-10-10). Copia de
// web/src/lib/regalo-reglas.ts (instanteDeEntrega): son dos servicios aparte.
// Si cambia una, cambia la otra.

/** Cuántos minutos le lleva la zona a UTC en ese instante (Madrid en verano: 120). */
function desfaseMinutos(instante: Date, zona: string): number {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: zona, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).formatToParts(instante);
  const v = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value);
  const comoUtc = Date.UTC(v('year'), v('month') - 1, v('day'), v('hour'), v('minute'));
  return Math.round((comoUtc - instante.getTime()) / 60_000);
}

/** La fecha y la hora en punto en esa zona, como instante (con el cambio de horario). */
export function instanteDeEntrega(fecha: string, hora: number, zona: string): Date {
  const [a, m, d] = fecha.split('-').map(Number);
  const ingenuo = Date.UTC(a, m - 1, d, hora);
  let t = ingenuo - desfaseMinutos(new Date(ingenuo), zona) * 60_000;
  t = ingenuo - desfaseMinutos(new Date(t), zona) * 60_000;
  return new Date(t);
}

/** El día de ese instante en esa zona, como 'AAAA-MM-DD'. */
export function diaLocal(instante: Date, zona: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instante);
}
