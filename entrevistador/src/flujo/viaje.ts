// Vitácora de viaje (docs/vitacora-de-viaje.md, 18/09). Lo puro: fechas, etapas,
// ángulos y el guion (una pregunta por día). Nada de red acá; lo que toca la
// base está en viaje-db.ts. Se prueba solo.

export type Etapa = { nombre: string; desde?: string; hasta?: string };
export type Viaje = {
  salida: string;   // YYYY-MM-DD
  vuelta: string;   // YYYY-MM-DD
  etapas: Etapa[];
  compania?: 'solo' | 'pareja' | 'amigos' | 'familia';
  proposito?: 'recuerdo' | 'compartir' | 'publico';
  angulos?: string[];
};

export const SIN_ETAPA = 'Por definir';

/** Los ángulos rotan para que veinte noches seguidas no sean "¿cómo te fue?". */
export const ANGULOS: Record<string, string> = {
  mejor: 'lo mejor del día: el momento que te gustaría volver a vivir',
  persona: 'una persona con la que hablaste hoy: quién era, qué te dijo, qué te quedó',
  comida: 'algo que comiste o tomaste hoy que no vas a olvidar, y dónde',
  plan: 'lo que salió distinto de lo planeado: qué pasó y cómo lo resolviste',
  lugar: 'un lugar que no esperabas y te frenó: cómo era, qué sentiste',
  vos: 'qué pensaste de vos mismo hoy, lejos de casa',
  llegada: 'el momento en que sentiste que habías llegado a esta etapa',
  despedida: 'te vas de esta etapa: con qué te quedás, qué dejás',
};
const ROTACION = ['mejor', 'persona', 'comida', 'plan', 'lugar', 'vos'];

export function esViaje(contexto: Record<string, any> | null | undefined): boolean {
  return contexto?.modo === 'viaje' && Boolean(contexto?.viaje?.salida && contexto?.viaje?.vuelta);
}

export function viajeDe(contexto: Record<string, any>): Viaje {
  const v = contexto.viaje as Viaje;
  return { ...v, etapas: Array.isArray(v.etapas) ? v.etapas.filter((e) => e && typeof e.nombre === 'string' && e.nombre.trim()) : [] };
}

/** YYYY-MM-DD de un día contado desde la salida (día 1 = salida). */
export function fechaDelDia(viaje: Viaje, dia: number): string {
  const d = new Date(`${viaje.salida}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + (dia - 1));
  return d.toISOString().slice(0, 10);
}

/** Cuántos días tiene el viaje (salida y vuelta inclusive). Mínimo 1. */
export function diasDelViaje(viaje: Viaje): number {
  const a = Date.parse(`${viaje.salida}T00:00:00Z`);
  const b = Date.parse(`${viaje.vuelta}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return 1;
  return Math.round((b - a) / 86_400_000) + 1;
}

/** La etapa de una fecha: la que la contiene; si ninguna, la última que empezó antes; si no, SIN_ETAPA. */
export function etapaDeFecha(viaje: Viaje, fecha: string): string {
  // La última etapa que ya empezó manda; una etapa sin `hasta` dura hasta que empieza la siguiente.
  const empezadas = viaje.etapas.filter((e) => e.desde && e.desde <= fecha).sort((x, y) => (x.desde! < y.desde! ? 1 : -1));
  const actual = empezadas[0];
  if (actual && (!actual.hasta || fecha <= actual.hasta)) return actual.nombre;
  // Sin fechas en ninguna etapa y hay una sola: es esa.
  if (!viaje.etapas.some((e) => e.desde) && viaje.etapas.length === 1) return viaje.etapas[0].nombre;
  return SIN_ETAPA;
}

/** El ángulo del día: llegada el primer día de una etapa, despedida el último, y rotación en el medio. */
export function anguloDelDia(viaje: Viaje, dia: number): string {
  const fecha = fechaDelDia(viaje, dia);
  const etapa = etapaDeFecha(viaje, fecha);
  const e = viaje.etapas.find((x) => x.nombre === etapa);
  if (dia === 1 || (e?.desde && e.desde === fecha)) return 'llegada';
  if (dia === diasDelViaje(viaje) || (e?.hasta && e.hasta === fecha)) return 'despedida';
  const preferidos = (viaje.angulos ?? []).filter((a) => ROTACION.includes(a));
  const lista = preferidos.length >= 2 ? [...preferidos, ...ROTACION.filter((a) => !preferidos.includes(a))] : ROTACION;
  return lista[(dia - 2) % lista.length];
}

/** El texto base de la pregunta del día (lo que ve el panel antes de que se mande; el modelo la reescribe al mandar). */
export function textoBaseDelDia(viaje: Viaje, dia: number): string {
  const etapa = etapaDeFecha(viaje, fechaDelDia(viaje, dia));
  const donde = etapa === SIN_ETAPA ? '' : ` en ${etapa}`;
  const angulo = anguloDelDia(viaje, dia);
  if (angulo === 'llegada') return `Día ${dia}${donde}: contame el momento en que sentiste que habías llegado.`;
  if (angulo === 'despedida') return `Día ${dia}${donde}: te vas. ¿Con qué te quedás? ¿Qué dejás?`;
  return `Día ${dia}${donde}: contame ${ANGULOS[angulo]}. Y mandame la foto de hoy con lo que estaba pasando.`;
}

/** El guion entero: una pregunta por día. */
export function guionDelViaje(viaje: Viaje): { orden: number; texto: string; capitulo: string }[] {
  const dias = diasDelViaje(viaje);
  return Array.from({ length: dias }, (_, i) => {
    const dia = i + 1;
    return { orden: dia, texto: textoBaseDelDia(viaje, dia), capitulo: etapaDeFecha(viaje, fechaDelDia(viaje, dia)) };
  });
}

/** Qué día del viaje es hoy en su zona horaria (1..N); fuera del viaje, null. */
export function diaDeHoy(viaje: Viaje, ahora: Date, zonaHoraria: string): number | null {
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: zonaHoraria, year: 'numeric', month: '2-digit', day: '2-digit' }).format(ahora);
  const a = Date.parse(`${viaje.salida}T00:00:00Z`);
  const h = Date.parse(`${hoy}T00:00:00Z`);
  const dia = Math.round((h - a) / 86_400_000) + 1;
  return dia >= 1 && dia <= diasDelViaje(viaje) ? dia : null;
}
