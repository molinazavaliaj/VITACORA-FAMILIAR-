// Vitácora de viaje (docs/vitacora-de-viaje.md, 18/09). Lo puro, espejo de
// entrevistador/src/flujo/viaje.ts: fechas, etapas y el capítulo de cada día.
// La web lo usa para validar la compra y para reasignar capítulos cuando el
// viajero agrega o fecha etapas desde el panel.

export type Etapa = { nombre: string; desde?: string; hasta?: string };
export const COMPANIAS = ["solo", "pareja", "amigos", "familia"] as const;
export const PROPOSITOS = ["recuerdo", "compartir", "publico"] as const;
export const ANGULOS = ["mejor", "persona", "comida", "plan", "lugar", "vos"] as const;
export type Viaje = {
  salida: string;
  vuelta: string;
  etapas: Etapa[];
  compania?: (typeof COMPANIAS)[number];
  proposito?: (typeof PROPOSITOS)[number];
  angulos?: string[];
};

export const NOMBRE_COMPANIA: Record<(typeof COMPANIAS)[number], string> = { solo: "Solo", pareja: "En pareja", amigos: "Con amigos", familia: "En familia" };
export const NOMBRE_PROPOSITO: Record<(typeof PROPOSITOS)[number], { titulo: string; detalle: string }> = {
  recuerdo: { titulo: "Para mí, como recuerdo", detalle: "Íntimo. Lo que quieras contar, sin filtro." },
  compartir: { titulo: "Para compartir con mi gente", detalle: "Contable: para leerlo con quienes te quieren." },
  publico: { titulo: "Para mi público", detalle: "Publicable: con lo que te gustaría que otros lean." },
};
export const NOMBRE_ANGULO: Record<(typeof ANGULOS)[number], string> = {
  mejor: "Lo mejor del día", persona: "La gente que conozco", comida: "Lo que como", plan: "Lo que sale distinto del plan", lugar: "Los lugares inesperados", vos: "Lo que pienso de mí",
};

export const SIN_ETAPA = "Por definir";
export const DIAS_MAXIMO = 120;
export const ETAPAS_MAXIMO = 30;
export const ETAPA_NOMBRE_MAXIMO = 60;

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;
export function esFecha(v: unknown): v is string {
  return typeof v === "string" && FECHA_RE.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
}

export function diasDelViaje(viaje: Pick<Viaje, "salida" | "vuelta">): number {
  const a = Date.parse(`${viaje.salida}T00:00:00Z`);
  const b = Date.parse(`${viaje.vuelta}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return 1;
  return Math.round((b - a) / 86_400_000) + 1;
}

export function fechaDelDia(viaje: Pick<Viaje, "salida">, dia: number): string {
  const d = new Date(`${viaje.salida}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + (dia - 1));
  return d.toISOString().slice(0, 10);
}

/** La última etapa que ya empezó manda; sin `hasta`, dura hasta que empieza la siguiente. */
export function etapaDeFecha(viaje: Viaje, fecha: string): string {
  const empezadas = viaje.etapas.filter((e) => e.desde && e.desde <= fecha).sort((x, y) => (x.desde! < y.desde! ? 1 : -1));
  const actual = empezadas[0];
  if (actual && (!actual.hasta || fecha <= actual.hasta)) return actual.nombre;
  if (!viaje.etapas.some((e) => e.desde) && viaje.etapas.length === 1) return viaje.etapas[0].nombre;
  return SIN_ETAPA;
}

/** Valida y limpia lo que llega del formulario o del panel. */
export function validarViaje(entrada: unknown): { ok: true; viaje: Viaje } | { ok: false; mensaje: string } {
  if (!entrada || typeof entrada !== "object") return { ok: false, mensaje: "Faltan los datos del viaje." };
  const e = entrada as Record<string, unknown>;
  if (!esFecha(e.salida) || !esFecha(e.vuelta)) return { ok: false, mensaje: "Necesitamos la fecha de salida y la de vuelta." };
  if (e.vuelta < e.salida) return { ok: false, mensaje: "La vuelta no puede ser antes de la salida." };
  if (diasDelViaje({ salida: e.salida, vuelta: e.vuelta }) > DIAS_MAXIMO) return { ok: false, mensaje: `Un viaje de más de ${DIAS_MAXIMO} días: escribinos y lo armamos aparte.` };
  const r = validarEtapas(e.etapas, { salida: e.salida, vuelta: e.vuelta });
  if (!r.ok) return r;
  const viaje: Viaje = { salida: e.salida, vuelta: e.vuelta, etapas: r.etapas };
  if (e.compania !== undefined) {
    if (!(COMPANIAS as readonly unknown[]).includes(e.compania)) return { ok: false, mensaje: "¿Con quién viajás? no es válido." };
    viaje.compania = e.compania as Viaje["compania"];
  }
  if (e.proposito !== undefined) {
    if (!(PROPOSITOS as readonly unknown[]).includes(e.proposito)) return { ok: false, mensaje: "¿Para qué es el libro? no es válido." };
    viaje.proposito = e.proposito as Viaje["proposito"];
  }
  if (e.angulos !== undefined) {
    if (!Array.isArray(e.angulos) || !e.angulos.every((a) => (ANGULOS as readonly unknown[]).includes(a))) return { ok: false, mensaje: "Los temas elegidos no son válidos." };
    viaje.angulos = [...new Set(e.angulos as string[])];
  }
  return { ok: true, viaje };
}

export function validarEtapas(entrada: unknown, viaje: Pick<Viaje, "salida" | "vuelta">): { ok: true; etapas: Etapa[] } | { ok: false; mensaje: string } {
  const lista = entrada === undefined ? [] : entrada;
  if (!Array.isArray(lista)) return { ok: false, mensaje: "Las etapas tienen que ser una lista." };
  if (lista.length > ETAPAS_MAXIMO) return { ok: false, mensaje: `Como mucho ${ETAPAS_MAXIMO} etapas.` };
  const etapas: Etapa[] = [];
  const nombres = new Set<string>();
  for (const cruda of lista) {
    if (!cruda || typeof cruda !== "object") return { ok: false, mensaje: "Una etapa no es válida." };
    const { nombre, desde, hasta } = cruda as Record<string, unknown>;
    if (typeof nombre !== "string" || !nombre.trim()) continue; // una fila vacía del formulario, se ignora
    const limpio = nombre.trim().replace(/\s+/g, " ").slice(0, ETAPA_NOMBRE_MAXIMO);
    if (limpio === SIN_ETAPA) return { ok: false, mensaje: `"${SIN_ETAPA}" es un nombre reservado.` };
    if (nombres.has(limpio.toLowerCase())) return { ok: false, mensaje: `La etapa "${limpio}" está dos veces.` };
    nombres.add(limpio.toLowerCase());
    const etapa: Etapa = { nombre: limpio };
    if (desde !== undefined && desde !== null && desde !== "") {
      if (!esFecha(desde)) return { ok: false, mensaje: `La fecha de "${limpio}" no es válida.` };
      if (desde < viaje.salida || desde > viaje.vuelta) return { ok: false, mensaje: `"${limpio}" empieza fuera del viaje.` };
      etapa.desde = desde;
    }
    if (hasta !== undefined && hasta !== null && hasta !== "") {
      if (!esFecha(hasta)) return { ok: false, mensaje: `La fecha de "${limpio}" no es válida.` };
      if (etapa.desde && hasta < etapa.desde) return { ok: false, mensaje: `"${limpio}" termina antes de empezar.` };
      if (hasta > viaje.vuelta) return { ok: false, mensaje: `"${limpio}" termina después de la vuelta.` };
      etapa.hasta = hasta;
    }
    etapas.push(etapa);
  }
  return { ok: true, etapas };
}
