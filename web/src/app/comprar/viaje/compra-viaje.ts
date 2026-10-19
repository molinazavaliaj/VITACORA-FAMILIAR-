import type { IdiomaWeb } from "@/lib/idioma-web";
import type { Direccion } from "@/lib/entregas";
import { validarDireccion } from "@/lib/entregas";
import {
  HORA_NOCHE_POR_DEFECTO,
  MAX_PREGUNTAS_PROPIAS,
  PREGUNTA_PROPIA_MAXIMO,
  diasDelViaje,
  paisDeId,
  validarFechas,
  type FormatoViaje,
  type FotosAlbum,
  type IdiomaViaje,
} from "@/lib/viaje";
import type { TextosCheckout } from "../../_textos/checkout";
import type { TextosViaje } from "../../_textos/checkout-viaje";

// Lo puro de la compra de la Vitácora de Viaje V2 (16/10), para probarlo sin
// navegador: el estado, qué pide cada paso y el cuerpo de /api/compra. El
// cuerpo lleva `productos.viaje` y `narrador.contexto.viaje` con los nombres
// del tipo `Compra` del bot (lib/viaje.ts); el servidor arma el carrito con el
// formato y el álbum, y pone `v: 2`.

export type PasoViaje = 1 | 2 | 3;

export type EstadoViaje = {
  formato: FormatoViaje;
  album: FotosAlbum;
  /** Para quien compra o un regalo (con el WhatsApp de quien viaja). */
  paraMi: boolean;
  /** Quien viaja. */
  nombre: string;
  comoLeDicen: string;
  telefono: string;
  /** Si es un regalo: el nombre de quien compra y cómo lo nombra el biógrafo ({{quien_regala}}). */
  tuNombre: string;
  quienRegala: string;
  salida: string;
  vuelta: string;
  /** Ids de PAISES (lib/viaje.ts): el país principal del viaje y dónde vive quien viaja. */
  paisViaje: string;
  paisCasa: string;
  hora: string;
  idioma: IdiomaViaje;
  preguntas: string[];
  email: string;
  recibe: string;
  telefonoRecibe: string;
  direccion: Partial<Direccion>;
};

const IDIOMA_DE_LA_WEB: Record<IdiomaWeb, IdiomaViaje> = { es: "es-ES", ca: "ca", ar: "es-AR" };

export function estadoViajeInicial(idioma: IdiomaWeb, conImpreso = true): EstadoViaje {
  return {
    // El impreso se muestra como el producto (flujo-vigente §1); sin impreso en la región, PDF.
    formato: conImpreso ? "impreso" : "pdf",
    album: 20,
    paraMi: true,
    nombre: "",
    comoLeDicen: "",
    telefono: "",
    tuNombre: "",
    quienRegala: "",
    salida: "",
    vuelta: "",
    paisViaje: "",
    paisCasa: idioma === "ar" ? "argentina" : "espana",
    hora: HORA_NOCHE_POR_DEFECTO,
    idioma: IDIOMA_DE_LA_WEB[idioma],
    preguntas: [""],
    email: "",
    recibe: "",
    telefonoRecibe: "",
    direccion: { pais: idioma === "ar" ? "Argentina" : "España" },
  };
}

/** Los días del viaje (salida y vuelta incluidas), o null si faltan o están al revés. */
export function diasDe(e: Pick<EstadoViaje, "salida" | "vuelta">): number | null {
  if (!e.salida || !e.vuelta || e.vuelta < e.salida) return null;
  return diasDelViaje(e);
}

/** Hoy en el navegador (la fecha local de quien compra). */
export function hoyLocal(ahora: Date = new Date()): string {
  const d = (n: number) => String(n).padStart(2, "0");
  return `${ahora.getFullYear()}-${d(ahora.getMonth() + 1)}-${d(ahora.getDate())}`;
}

const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function fallaViaje(
  paso: PasoViaje,
  e: EstadoViaje,
  V: TextosViaje,
  T: TextosCheckout,
  hoy: string = hoyLocal(),
): { texto: string; campo?: string } | null {
  if (paso === 1) return null;
  if (paso === 2) {
    if (!e.paraMi && !e.tuNombre.trim()) return { texto: V.faltaTuNombre, campo: "tu-nombre" };
    if (!e.paraMi && !e.quienRegala.trim()) return { texto: V.faltaQuienRegala, campo: "quien-regala" };
    if (!e.nombre.trim()) return { texto: e.paraMi ? V.faltaNombre : V.faltaNombreViajero, campo: "nombre" };
    if (!e.telefono.trim()) return { texto: e.paraMi ? V.faltaWhatsapp : V.faltaWhatsappViajero, campo: "telefono" };
    const f = validarFechas(e.salida, e.vuelta, hoy, { ...V.fechas, faltanFechas: V.faltaFechas });
    if (!f.ok) return { texto: f.mensaje, campo: "fechas" };
    if (!paisDeId(e.paisViaje)) return { texto: V.faltaPais, campo: "pais-viaje" };
    if (!paisDeId(e.paisCasa)) return { texto: V.faltaCasa, campo: "pais-casa" };
    const llenas = e.preguntas.map((p) => p.trim()).filter(Boolean);
    if (llenas.length > MAX_PREGUNTAS_PROPIAS) return { texto: V.muchasPreguntas, campo: "preguntas" };
    if (llenas.some((p) => p.length > PREGUNTA_PROPIA_MAXIMO)) return { texto: V.preguntaLarga, campo: "preguntas" };
    return null;
  }
  if (!CORREO_RE.test(e.email.trim())) return { texto: V.correoMal, campo: "email" };
  if (e.formato === "impreso") {
    if (!e.recibe.trim()) return { texto: T.faltaRecibe, campo: "recibe" };
    if (!e.telefonoRecibe.trim()) return { texto: T.faltaTelefonoRecibe, campo: "telefono-recibe" };
    const d = validarDireccion(e.direccion);
    if (!d.ok) return { texto: d.mensaje, campo: "direccion" };
  }
  return null;
}

export function cuerpoViaje(e: EstadoViaje, idiomaWeb: IdiomaWeb) {
  const impreso = e.formato === "impreso";
  const nombre = e.nombre.trim();
  const comoLeDicen = e.comoLeDicen.trim() || nombre.split(" ")[0];
  const zonaCasa = paisDeId(e.paisCasa)?.zona ?? "";
  return {
    nombreComprador: e.paraMi ? nombre : e.tuNombre.trim(),
    vinculoComprador: e.paraMi ? "yo mismo" : "le regala el viaje",
    region: idiomaWeb === "ar" ? "AR" : "ES",
    email: e.email.trim(),
    idiomaWeb,
    narrador: {
      nombre,
      comoLeDicen,
      telefonoWhatsapp: e.telefono.trim(),
      horaPreferida: e.hora,
      zonaHoraria: zonaCasa,
      contexto: {
        viaje: {
          salida: e.salida,
          vuelta: e.vuelta,
          zonaCasa,
          zonaViaje: paisDeId(e.paisViaje)?.zona ?? "",
          horaNoche: e.hora,
          ...(e.paraMi ? {} : { regalo: { quienRegala: e.quienRegala.trim() } }),
          preguntasPropias: e.preguntas.map((p) => p.trim()).filter(Boolean),
          formato: e.formato,
          fotosAlbum: e.album,
          idioma: e.idioma,
        },
      },
    },
    productos: { viaje: true, impresos: impreso ? 1 : 0, marcos: 0 },
  };
}
