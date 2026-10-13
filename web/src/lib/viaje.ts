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
    const a = validarAngulos(e.angulos);
    if (!a.ok) return a;
    viaje.angulos = a.angulos;
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

// ── El panel de viaje (3t.19) ────────────────────────────────────────────────

export type CapituloDelViaje = Etapa & { dias: number[] };

/**
 * Las etapas como capítulos, en el orden en que las declaró el viajero, cada una
 * con las noches (día 1..N) que le tocan por fecha. Si alguna noche no cae en
 * ninguna etapa, va a "Por definir", al final. Se calcula desde `contexto.viaje`,
 * así el panel se ve bien aunque el bot todavía no haya creado el guion.
 */
export function capitulosDelViaje(viaje: Viaje): CapituloDelViaje[] {
  const capitulos: CapituloDelViaje[] = viaje.etapas.map((e) => ({ ...e, dias: [] }));
  const sinEtapa: number[] = [];
  for (let dia = 1; dia <= diasDelViaje(viaje); dia++) {
    const nombre = etapaDeFecha(viaje, fechaDelDia(viaje, dia));
    const cap = capitulos.find((c) => c.nombre === nombre);
    if (cap) cap.dias.push(dia);
    else sinEtapa.push(dia);
  }
  if (sinEtapa.length > 0) capitulos.push({ nombre: SIN_ETAPA, dias: sinEtapa });
  return capitulos;
}

/** Qué día del viaje es hoy en su zona horaria (1..N); fuera del viaje, null. Espejo del bot. */
export function diaDeHoy(viaje: Pick<Viaje, "salida" | "vuelta">, ahora: Date, zonaHoraria: string): number | null {
  let hoy: string;
  try {
    hoy = new Intl.DateTimeFormat("en-CA", { timeZone: zonaHoraria, year: "numeric", month: "2-digit", day: "2-digit" }).format(ahora);
  } catch {
    hoy = ahora.toISOString().slice(0, 10); // zona inválida: UTC antes que romper el panel
  }
  const dia = Math.round((Date.parse(`${hoy}T00:00:00Z`) - Date.parse(`${viaje.salida}T00:00:00Z`)) / 86_400_000) + 1;
  return dia >= 1 && dia <= diasDelViaje(viaje) ? dia : null;
}

// ── Las fechas, vivas (12/10) ────────────────────────────────────────────────
// El viajero puede correr la salida y la vuelta desde el panel. Antes de que
// salga la primera pregunta, las dos; con el viaje en marcha, solo la vuelta:
// cada noche contada es "salida + N", y mover la salida le cambiaría la fecha
// a lo que ya contó. El bot manda la noche N recién en su fecha (scheduler),
// así que correr la salida también corre la primera pregunta.

/**
 * Valida las fechas nuevas contra lo que ya pasó. `diaActual` es la última
 * noche que el bot mandó (0 = todavía ninguna). La regla de "esa noche ya la
 * contó" (acortar justo hasta la última mandada) necesita la base: va en la ruta.
 */
export function validarFechas(
  actual: Pick<Viaje, "salida" | "vuelta">,
  salida: unknown,
  vuelta: unknown,
  diaActual: number,
): { ok: true; salida: string; vuelta: string } | { ok: false; mensaje: string } {
  if (!esFecha(salida) || !esFecha(vuelta)) return { ok: false, mensaje: "Necesitamos la fecha de salida y la de vuelta." };
  if (vuelta < salida) return { ok: false, mensaje: "La vuelta no puede ser antes de la salida." };
  if (diasDelViaje({ salida, vuelta }) > DIAS_MAXIMO) return { ok: false, mensaje: `Un viaje de más de ${DIAS_MAXIMO} días: escribinos y lo armamos aparte.` };
  if (diaActual >= 1 && salida !== actual.salida) return { ok: false, mensaje: "El viaje ya arrancó: la salida queda fija. La vuelta sí se puede cambiar." };
  if (diaActual >= 1 && diasDelViaje({ salida, vuelta }) < diaActual) {
    const ultima = new Date(`${fechaDelDia({ salida }, diaActual)}T00:00:00Z`).toLocaleDateString("es", { day: "numeric", month: "long", timeZone: "UTC" });
    return { ok: false, mensaje: `Ya te mandamos la pregunta del ${ultima}: la vuelta no puede ser antes.` };
  }
  return { ok: true, salida, vuelta };
}

// El guion del viaje: espejo EXACTO de entrevistador/src/flujo/viaje.ts (el bot
// lo crea al decir SÍ). La web lo necesita para rearmar las noches que todavía
// no salieron cuando cambian las fechas o las etapas. web/test/viaje.test.ts
// compara los dos: si uno cambia y el otro no, el test falla.

const TEXTO_ANGULO: Record<string, string> = {
  mejor: "lo mejor del día: el momento que te gustaría volver a vivir",
  persona: "una persona con la que hablaste hoy: quién era, qué te dijo, qué te quedó",
  comida: "algo que comiste o tomaste hoy que no vas a olvidar, y dónde",
  plan: "lo que salió distinto de lo planeado: qué pasó y cómo lo resolviste",
  lugar: "un lugar que no esperabas y te frenó: cómo era, qué sentiste",
  vos: "qué pensaste de vos mismo hoy, lejos de casa",
  llegada: "el momento en que sentiste que habías llegado a esta etapa",
  despedida: "te vas de esta etapa: con qué te quedás, qué dejás",
};
const ROTACION = ["mejor", "persona", "comida", "plan", "lugar", "vos"];

/** El ángulo del día: llegada el primer día de una etapa, despedida el último, y rotación en el medio. */
export function anguloDelDia(viaje: Viaje, dia: number): string {
  const fecha = fechaDelDia(viaje, dia);
  const etapa = etapaDeFecha(viaje, fecha);
  const e = viaje.etapas.find((x) => x.nombre === etapa);
  if (dia === 1 || (e?.desde && e.desde === fecha)) return "llegada";
  if (dia === diasDelViaje(viaje) || (e?.hasta && e.hasta === fecha)) return "despedida";
  const preferidos = (viaje.angulos ?? []).filter((a) => ROTACION.includes(a));
  const lista = preferidos.length >= 2 ? [...preferidos, ...ROTACION.filter((a) => !preferidos.includes(a))] : ROTACION;
  return lista[(dia - 2) % lista.length];
}

/** El texto base de la pregunta del día (el bot la reescribe al mandar). */
export function textoBaseDelDia(viaje: Viaje, dia: number): string {
  const etapa = etapaDeFecha(viaje, fechaDelDia(viaje, dia));
  const donde = etapa === SIN_ETAPA ? "" : ` en ${etapa}`;
  const angulo = anguloDelDia(viaje, dia);
  if (angulo === "llegada") return `Día ${dia}${donde}: contame el momento en que sentiste que habías llegado.`;
  if (angulo === "despedida") return `Día ${dia}${donde}: te vas. ¿Con qué te quedás? ¿Qué dejás?`;
  return `Día ${dia}${donde}: contame ${TEXTO_ANGULO[angulo]}. Y mandame la foto de hoy con lo que estaba pasando.`;
}

/** El guion entero: una pregunta por día. */
export function guionDelViaje(viaje: Viaje): { orden: number; texto: string; capitulo: string }[] {
  const dias = diasDelViaje(viaje);
  return Array.from({ length: dias }, (_, i) => {
    const dia = i + 1;
    return { orden: dia, texto: textoBaseDelDia(viaje, dia), capitulo: etapaDeFecha(viaje, fechaDelDia(viaje, dia)) };
  });
}

type PreguntaGuardada = { id: string; orden: number; tipo: string; texto: string; capitulo: string };

/**
 * Qué hay que tocar en `preguntas` para que las noches que todavía no salieron
 * (orden > diaActual) coincidan con el viaje nuevo: actualizar texto y capítulo,
 * agregar las noches nuevas (estiró la vuelta) y borrar las que sobran (la
 * acortó). Lo ya mandado no se toca nunca. Solo las fijas del guion: si hay
 * otra cosa por venir (la pregunta de cierre), no se toca.
 */
export function planDeGuion(viaje: Viaje, diaActual: number, porVenir: PreguntaGuardada[]) {
  const guion = guionDelViaje(viaje).filter((p) => p.orden > diaActual);
  const fijas = porVenir.filter((p) => p.tipo === "fija" && p.orden > diaActual);
  const porOrden = new Map(fijas.map((p) => [p.orden, p]));
  const actualizar: { id: string; texto: string; capitulo: string; cambiaCapitulo: boolean }[] = [];
  const agregar: { orden: number; texto: string; capitulo: string }[] = [];
  for (const p of guion) {
    const guardada = porOrden.get(p.orden);
    if (!guardada) agregar.push(p);
    else if (guardada.texto !== p.texto || guardada.capitulo !== p.capitulo) {
      actualizar.push({ id: guardada.id, texto: p.texto, capitulo: p.capitulo, cambiaCapitulo: guardada.capitulo !== p.capitulo });
    }
  }
  const borrar = fijas.filter((p) => p.orden > diasDelViaje(viaje)).map((p) => p.id);
  return { actualizar, agregar, borrar };
}

/** Valida los ángulos elegidos desde el panel: solo los conocidos, sin repetir. */
export function validarAngulos(entrada: unknown): { ok: true; angulos: string[] } | { ok: false; mensaje: string } {
  if (!Array.isArray(entrada) || !entrada.every((a) => (ANGULOS as readonly unknown[]).includes(a))) return { ok: false, mensaje: "Los temas elegidos no son válidos." };
  return { ok: true, angulos: [...new Set(entrada as string[])] };
}
