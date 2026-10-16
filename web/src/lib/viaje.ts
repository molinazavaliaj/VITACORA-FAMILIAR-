// Vitácora de Viaje V2 (16/10: la web vende SOLO la V2; nada del viaje viejo
// de etapas, ciudades, ángulos o «con quién viajás»). Lo puro de la compra y
// del panel: validar lo que llega del formulario, las fechas, el país y el
// carrito.
//
// Fuente de verdad: docs/viajes-v2/flujo-vigente.md §1 (la compra) y el tipo
// `Compra` de entrevistador/src/viaje-v2/nucleo/tipos.ts. CONTRATO con el bot
// (PR #52, compra-contrato.md): `contexto.modo = 'viaje'` y `contexto.viaje`
// con los nombres de `Compra` más `v: 2`, sin `nombre` (sale de como_le_dicen). La web no crea la fila de
// `viajes_v2`: la crea el bot con lo que lee de acá. El código no sabe de
// ciudades: solo fechas y zonas horarias (salen de lo que cuenta el viajero).

import type { Carrito } from "./productos";

/** `es-AR`: de vos. `es-ES`: de tú. `ca`: en catalán. Los mismos del bot (nucleo/idioma.ts). */
export type IdiomaViaje = "es-AR" | "es-ES" | "ca";
export const IDIOMAS_VIAJE: readonly IdiomaViaje[] = ["es-AR", "es-ES", "ca"];
export type FormatoViaje = "impreso" | "pdf";
export type FotosAlbum = 20 | 40;

/**
 * Lo que va a `narradores.contexto.viaje` (contrato del bot, docs/viajes-v2/compra-contrato.md
 * en la rama viaje-v2-solo). El nombre del viajero NO va acá: el bot lo toma de `como_le_dicen`.
 */
export type CompraViaje = {
  v: 2;
  /** Día de salida, YYYY-MM-DD (hora de casa). */
  salida: string;
  /** El día que emprende la vuelta, YYYY-MM-DD. */
  vuelta: string;
  zonaCasa: string;
  /** La del país principal del viaje. */
  zonaViaje: string;
  /** La hora de la noche; sin ella, 21:30. */
  horaNoche?: string;
  /** Solo si es un regalo: {{quien_regala}}. */
  regalo?: { quienRegala: string };
  /** Hasta 5, tal cual las escribieron. */
  preguntasPropias: string[];
  formato: FormatoViaje;
  fotosAlbum: FotosAlbum;
  idioma: IdiomaViaje;
};

/** Mínimo de días (salida y vuelta incluidas): MINIMO_DIAS del bot (nucleo/calendario.ts). */
export const MINIMO_DIAS = 3;
/** Un viaje más largo se arma aparte (el mismo tope de siempre). */
export const DIAS_MAXIMO = 120;
export const MAX_PREGUNTAS_PROPIAS = 5;
export const PREGUNTA_PROPIA_MAXIMO = 300;
export const QUIEN_REGALA_MAXIMO = 60;
export const HORA_NOCHE_POR_DEFECTO = "21:30";
/** La noche que acepta el bot: entre NOCHE_DESDE y NOCHE_HASTA (nucleo/calendario.ts). */
export const NOCHE_DESDE = "19:00";
export const NOCHE_HASTA = "22:30";
/** Las horas que se ofrecen en la compra (todas dentro de la franja del bot). */
export const HORAS_NOCHE = ["19:30", "20:30", "21:30", "22:30"] as const;

/**
 * Los países que se ofrecen, con la zona horaria de cada uno (la hora de los
 * mensajes). Los que tienen varias zonas van partidos. Si el país no está, se
 * elige el de la misma hora; el nombre solo se muestra, lo que se guarda es la zona.
 */
export type Pais = { id: string; zona: string; es: string; ca: string };
export const PAISES: readonly Pais[] = [
  { id: "alemania", zona: "Europe/Berlin", es: "Alemania", ca: "Alemanya" },
  { id: "andorra", zona: "Europe/Andorra", es: "Andorra", ca: "Andorra" },
  { id: "argentina", zona: "America/Argentina/Buenos_Aires", es: "Argentina", ca: "Argentina" },
  { id: "australia", zona: "Australia/Sydney", es: "Australia (Sídney)", ca: "Austràlia (Sydney)" },
  { id: "austria", zona: "Europe/Vienna", es: "Austria", ca: "Àustria" },
  { id: "belgica", zona: "Europe/Brussels", es: "Bélgica", ca: "Bèlgica" },
  { id: "bolivia", zona: "America/La_Paz", es: "Bolivia", ca: "Bolívia" },
  { id: "brasil", zona: "America/Sao_Paulo", es: "Brasil", ca: "Brasil" },
  { id: "canada-este", zona: "America/Toronto", es: "Canadá (este)", ca: "Canadà (est)" },
  { id: "canarias", zona: "Atlantic/Canary", es: "Canarias", ca: "Canàries" },
  { id: "chile", zona: "America/Santiago", es: "Chile", ca: "Xile" },
  { id: "china", zona: "Asia/Shanghai", es: "China", ca: "Xina" },
  { id: "colombia", zona: "America/Bogota", es: "Colombia", ca: "Colòmbia" },
  { id: "croacia", zona: "Europe/Zagreb", es: "Croacia", ca: "Croàcia" },
  { id: "cuba", zona: "America/Havana", es: "Cuba", ca: "Cuba" },
  { id: "dinamarca", zona: "Europe/Copenhagen", es: "Dinamarca", ca: "Dinamarca" },
  { id: "egipto", zona: "Africa/Cairo", es: "Egipto", ca: "Egipte" },
  { id: "emiratos", zona: "Asia/Dubai", es: "Emiratos Árabes", ca: "Emirats Àrabs" },
  { id: "espana", zona: "Europe/Madrid", es: "España", ca: "Espanya" },
  { id: "eeuu-este", zona: "America/New_York", es: "Estados Unidos (este)", ca: "Estats Units (est)" },
  { id: "eeuu-oeste", zona: "America/Los_Angeles", es: "Estados Unidos (oeste)", ca: "Estats Units (oest)" },
  { id: "francia", zona: "Europe/Paris", es: "Francia", ca: "França" },
  { id: "grecia", zona: "Europe/Athens", es: "Grecia", ca: "Grècia" },
  { id: "india", zona: "Asia/Kolkata", es: "India", ca: "Índia" },
  { id: "indonesia", zona: "Asia/Makassar", es: "Indonesia (Bali)", ca: "Indonèsia (Bali)" },
  { id: "irlanda", zona: "Europe/Dublin", es: "Irlanda", ca: "Irlanda" },
  { id: "islandia", zona: "Atlantic/Reykjavik", es: "Islandia", ca: "Islàndia" },
  { id: "italia", zona: "Europe/Rome", es: "Italia", ca: "Itàlia" },
  { id: "japon", zona: "Asia/Tokyo", es: "Japón", ca: "Japó" },
  { id: "marruecos", zona: "Africa/Casablanca", es: "Marruecos", ca: "Marroc" },
  { id: "mexico", zona: "America/Mexico_City", es: "México", ca: "Mèxic" },
  { id: "noruega", zona: "Europe/Oslo", es: "Noruega", ca: "Noruega" },
  { id: "nueva-zelanda", zona: "Pacific/Auckland", es: "Nueva Zelanda", ca: "Nova Zelanda" },
  { id: "paises-bajos", zona: "Europe/Amsterdam", es: "Países Bajos", ca: "Països Baixos" },
  { id: "paraguay", zona: "America/Asuncion", es: "Paraguay", ca: "Paraguai" },
  { id: "peru", zona: "America/Lima", es: "Perú", ca: "Perú" },
  { id: "polonia", zona: "Europe/Warsaw", es: "Polonia", ca: "Polònia" },
  { id: "portugal", zona: "Europe/Lisbon", es: "Portugal", ca: "Portugal" },
  { id: "reino-unido", zona: "Europe/London", es: "Reino Unido", ca: "Regne Unit" },
  { id: "republica-checa", zona: "Europe/Prague", es: "República Checa", ca: "República Txeca" },
  { id: "republica-dominicana", zona: "America/Santo_Domingo", es: "República Dominicana", ca: "República Dominicana" },
  { id: "suecia", zona: "Europe/Stockholm", es: "Suecia", ca: "Suècia" },
  { id: "suiza", zona: "Europe/Zurich", es: "Suiza", ca: "Suïssa" },
  { id: "tailandia", zona: "Asia/Bangkok", es: "Tailandia", ca: "Tailàndia" },
  { id: "turquia", zona: "Europe/Istanbul", es: "Turquía", ca: "Turquia" },
  { id: "uruguay", zona: "America/Montevideo", es: "Uruguay", ca: "Uruguai" },
  { id: "vietnam", zona: "Asia/Ho_Chi_Minh", es: "Vietnam", ca: "Vietnam" },
];

export function paisDeId(id: string): Pais | undefined {
  return PAISES.find((p) => p.id === id);
}

/** El nombre del país de una zona (el primero que la usa), para mostrarla; si no está en la lista, la zona tal cual. */
export function nombreDePais(zona: string, lengua: "es" | "ca" = "es"): string {
  const p = PAISES.find((x) => x.zona === zona);
  return p ? p[lengua] : zona;
}

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;
const HORA_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** YYYY-MM-DD de un día que existe (2026-02-30 no). */
export function esFecha(v: unknown): v is string {
  if (typeof v !== "string" || !FECHA_RE.test(v)) return false;
  const t = Date.parse(`${v}T00:00:00Z`);
  return !Number.isNaN(t) && new Date(t).toISOString().slice(0, 10) === v;
}

export function esZona(zona: unknown): zona is string {
  if (typeof zona !== "string" || !zona) return false;
  try {
    new Intl.DateTimeFormat("es", { timeZone: zona });
    return true;
  } catch {
    return false;
  }
}

export function esIdiomaViaje(x: unknown): x is IdiomaViaje {
  return typeof x === "string" && (IDIOMAS_VIAJE as readonly string[]).includes(x);
}

/** Los días del viaje, salida y vuelta incluidas (1 si faltan o están al revés). */
export function diasDelViaje(viaje: { salida: string; vuelta: string }): number {
  const a = Date.parse(`${viaje.salida}T00:00:00Z`);
  const b = Date.parse(`${viaje.vuelta}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return 1;
  return Math.round((b - a) / 86_400_000) + 1;
}

/** El día de hoy (YYYY-MM-DD) en una zona; con una zona rota, el de UTC. */
export function hoyEn(zona: string, ahora: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit" }).format(ahora);
  } catch {
    return ahora.toISOString().slice(0, 10);
  }
}

export type MensajesFechas = {
  faltanFechas: string;
  vueltaAntes: string;
  salidaPasada: string;
  muyCorto: string;
  muyLargo: string;
};

// TEXTO PARA NAZA: los errores de las fechas.
/** Los errores de las fechas, de tú (España) o de vos; los usa la compra (servidor) y el panel. */
export function mensajesDeFechas(tu: boolean): MensajesFechas {
  return {
    faltanFechas: "Necesitamos la fecha de salida y la de vuelta.",
    vueltaAntes: "La vuelta no puede ser antes de la salida.",
    salidaPasada: "La salida no puede ser un día que ya pasó.",
    muyCorto: `El viaje tiene que durar al menos ${MINIMO_DIAS} días, contando la salida y la vuelta.`,
    muyLargo: tu
      ? `Para un viaje de más de ${DIAS_MAXIMO} días, escríbenos y lo armamos aparte.`
      : `Para un viaje de más de ${DIAS_MAXIMO} días, escribinos y lo armamos aparte.`,
  };
}

/** Las fechas solas: la compra y el panel las validan igual. `hoy` en la zona de casa. */
export function validarFechas(
  salida: unknown,
  vuelta: unknown,
  hoy: string,
  m: MensajesFechas = mensajesDeFechas(false),
): { ok: true; salida: string; vuelta: string } | { ok: false; mensaje: string } {
  if (!esFecha(salida) || !esFecha(vuelta)) return { ok: false, mensaje: m.faltanFechas };
  if (vuelta < salida) return { ok: false, mensaje: m.vueltaAntes };
  if (salida < hoy) return { ok: false, mensaje: m.salidaPasada };
  const dias = diasDelViaje({ salida, vuelta });
  if (dias < MINIMO_DIAS) return { ok: false, mensaje: m.muyCorto };
  if (dias > DIAS_MAXIMO) return { ok: false, mensaje: m.muyLargo };
  return { ok: true, salida, vuelta };
}

/** Las preguntas propias: sin vacías, hasta 5, cada una de un largo razonable. */
export function limpiarPreguntas(entrada: unknown): { ok: true; preguntas: string[] } | { ok: false; mensaje: string } {
  if (entrada === undefined || entrada === null) return { ok: true, preguntas: [] };
  if (!Array.isArray(entrada) || !entrada.every((p) => typeof p === "string")) return { ok: false, mensaje: "Las preguntas no son válidas." };
  const preguntas = (entrada as string[]).map((p) => p.trim().replace(/\s+/g, " ")).filter(Boolean);
  if (preguntas.length > MAX_PREGUNTAS_PROPIAS) return { ok: false, mensaje: `Van hasta ${MAX_PREGUNTAS_PROPIAS} preguntas propias.` };
  if (preguntas.some((p) => p.length > PREGUNTA_PROPIA_MAXIMO)) return { ok: false, mensaje: `Cada pregunta puede tener hasta ${PREGUNTA_PROPIA_MAXIMO} letras.` };
  return { ok: true, preguntas };
}

/**
 * Valida y limpia `contexto.viaje` de la compra. `nombre` (cómo le dicen, del
 * narrador) solo se exige: el bot lo lee de `como_le_dicen`. Sin `hoy`, el de
 * la zona de casa.
 */
export function validarViaje(
  entrada: unknown,
  { nombre, hoy, tu = false }: { nombre: string; hoy?: string; tu?: boolean },
): { ok: true; viaje: CompraViaje } | { ok: false; mensaje: string } {
  // TEXTO PARA NAZA: los errores de la compra que devuelve el servidor.
  if (!entrada || typeof entrada !== "object") return { ok: false, mensaje: "Faltan los datos del viaje." };
  const e = entrada as Record<string, unknown>;
  if (!esZona(e.zonaCasa)) return { ok: false, mensaje: "Falta dónde vive quien viaja." };
  if (!esZona(e.zonaViaje)) return { ok: false, mensaje: "Falta el país principal del viaje." };
  const f = validarFechas(e.salida, e.vuelta, hoy ?? hoyEn(e.zonaCasa), mensajesDeFechas(tu));
  if (!f.ok) return f;
  let horaNoche: string | undefined;
  if (e.horaNoche !== undefined && e.horaNoche !== null && e.horaNoche !== "") {
    if (typeof e.horaNoche !== "string" || !HORA_RE.test(e.horaNoche) || e.horaNoche < NOCHE_DESDE || e.horaNoche > NOCHE_HASTA) {
      return { ok: false, mensaje: `La hora de la noche va entre las ${NOCHE_DESDE} y las ${NOCHE_HASTA}.` };
    }
    horaNoche = e.horaNoche;
  }
  const p = limpiarPreguntas(e.preguntasPropias);
  if (!p.ok) return p;
  if (e.formato !== "impreso" && e.formato !== "pdf") return { ok: false, mensaje: "Falta elegir el libro, impreso o en PDF." };
  if (e.fotosAlbum !== 20 && e.fotosAlbum !== 40) return { ok: false, mensaje: "El álbum es de 20 o de 40 fotos." };
  if (!esIdiomaViaje(e.idioma)) return { ok: false, mensaje: "Falta el idioma en que le escribimos." };
  let regalo: CompraViaje["regalo"];
  if (e.regalo !== undefined && e.regalo !== null) {
    const quien = (e.regalo as { quienRegala?: unknown }).quienRegala;
    if (typeof quien !== "string" || !quien.trim()) return { ok: false, mensaje: "Falta quién regala el viaje." };
    regalo = { quienRegala: quien.trim().replace(/\s+/g, " ").slice(0, QUIEN_REGALA_MAXIMO) };
  }
  if (!nombre.trim()) return { ok: false, mensaje: "Falta cómo le dicen a quien viaja." };
  const viaje: CompraViaje = {
    v: 2,
    salida: f.salida,
    vuelta: f.vuelta,
    zonaCasa: e.zonaCasa,
    zonaViaje: e.zonaViaje,
    ...(horaNoche ? { horaNoche } : {}),
    ...(regalo ? { regalo } : {}),
    preguntasPropias: p.preguntas,
    formato: e.formato,
    fotosAlbum: e.fotosAlbum,
    idioma: e.idioma,
  };
  return { ok: true, viaje };
}

/**
 * El viaje de un `contexto` de narrador (modo viaje, con salida y vuelta). Un
 * viaje de antes de la V2 ya no se vende; si aparece en la base, se lee igual
 * con lo que tiene en común (salida y vuelta), sin etapas.
 */
export function viajeDelContexto(contexto: unknown): (Partial<CompraViaje> & { salida: string; vuelta: string }) | null {
  const c = contexto as { modo?: unknown; viaje?: { salida?: unknown; vuelta?: unknown } } | null | undefined;
  if (c?.modo !== "viaje" || !c.viaje || !esFecha(c.viaje.salida) || !esFecha(c.viaje.vuelta)) return null;
  return c.viaje as Partial<CompraViaje> & { salida: string; vuelta: string };
}

/**
 * El carrito de una compra de viaje, desde el contexto YA validado: el formato
 * decide el impreso y el álbum el precio. Así el cobro no depende de lo que
 * diga el navegador en `productos`. Sin viaje V2, null (el carrito de siempre).
 */
export function carritoDeViaje(contexto: unknown): Carrito | null {
  const c = contexto as { modo?: unknown; viaje?: Partial<CompraViaje> } | null | undefined;
  if (c?.modo !== "viaje" || c.viaje?.v !== 2) return null;
  return { base: "viaje", impresos: c.viaje.formato === "impreso" ? 1 : 0, marcos: 0, album: c.viaje.fotosAlbum === 40 ? 40 : 20 };
}

/** En qué momento está el viaje en un día dado: antes de salir, de viaje (salida a vuelta) o ya de vuelta. */
export function momentoDelViaje(viaje: { salida: string; vuelta: string }, hoy: string): "antes" | "viaje" | "vuelta" {
  if (hoy < viaje.salida) return "antes";
  if (hoy <= viaje.vuelta) return "viaje";
  return "vuelta";
}
