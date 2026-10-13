import type { Etapa, Viaje } from "@/lib/viaje";
import type { IdiomaWeb } from "@/lib/idioma-web";
import type { Direccion } from "@/lib/entregas";
import { validarDireccion } from "@/lib/entregas";
import type { TextosCheckout } from "../../_textos/checkout";
import type { TextosViaje } from "../../_textos/checkout-viaje";

// Lo puro de la compra de viaje, para probarlo sin navegador: el estado, qué
// pide cada paso y el cuerpo de /api/compra (el mismo de antes: el viajero se
// compra a sí mismo, `productos.viaje` y `narrador.contexto.viaje`).

export type PasoViaje = 1 | 2 | 3;

export type EstadoViaje = {
  formato: "digital" | "impreso";
  copias: number;
  marcos: number;
  nombre: string;
  comoLeDicen: string;
  telefono: string;
  email: string;
  salida: string;
  vuelta: string;
  etapas: Etapa[];
  compania: NonNullable<Viaje["compania"]>;
  proposito: NonNullable<Viaje["proposito"]>;
  angulos: string[];
  hora: string;
  zona: string;
  evitar: string;
  recibe: string;
  telefonoRecibe: string;
  direccion: Partial<Direccion>;
};

export function estadoViajeInicial(idioma: IdiomaWeb): EstadoViaje {
  return {
    // Como antes: el viaje arranca solo con el PDF; el impreso y los marcos se suman.
    formato: "digital",
    copias: 0,
    marcos: 0,
    nombre: "",
    comoLeDicen: "",
    telefono: "",
    email: "",
    salida: "",
    vuelta: "",
    etapas: [{ nombre: "" }],
    compania: "solo",
    proposito: "recuerdo",
    angulos: [],
    hora: "21:30",
    zona: "Europe/Madrid",
    evitar: "",
    recibe: "",
    telefonoRecibe: "",
    direccion: { pais: idioma === "ar" ? "Argentina" : "España" },
  };
}

/** Los días del viaje (salida y vuelta incluidas), o null si faltan o están al revés. */
export function diasDe(e: Pick<EstadoViaje, "salida" | "vuelta">): number | null {
  const a = Date.parse(`${e.salida}T00:00:00Z`);
  const b = Date.parse(`${e.vuelta}T00:00:00Z`);
  return Number.isFinite(a) && Number.isFinite(b) && b >= a ? Math.round((b - a) / 86_400_000) + 1 : null;
}

const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function fallaViaje(paso: PasoViaje, e: EstadoViaje, V: TextosViaje, T: TextosCheckout): { texto: string; campo?: string } | null {
  if (paso === 1) return null;
  if (paso === 2) {
    if (!e.nombre.trim()) return { texto: V.faltaNombre, campo: "nombre" };
    if (!e.telefono.trim()) return { texto: V.faltaWhatsapp, campo: "telefono" };
    if (!e.salida || !e.vuelta) return { texto: V.faltaFechas, campo: "fechas" };
    if (e.vuelta < e.salida) return { texto: V.vueltaAntes, campo: "fechas" };
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
  return {
    nombreComprador: e.nombre.trim(),
    vinculoComprador: "yo mismo",
    region: idiomaWeb === "ar" ? "AR" : "ES",
    email: e.email.trim(),
    idiomaWeb,
    narrador: {
      nombre: e.nombre.trim(),
      comoLeDicen: e.comoLeDicen.trim() || e.nombre.trim().split(" ")[0],
      telefonoWhatsapp: e.telefono.trim(),
      horaPreferida: e.hora,
      zonaHoraria: e.zona,
      contexto: {
        ritmo: "diario",
        evitar: e.evitar.trim(),
        viaje: { salida: e.salida, vuelta: e.vuelta, etapas: e.etapas.filter((x) => x.nombre.trim()), compania: e.compania, proposito: e.proposito, angulos: e.angulos },
      },
    },
    productos: { viaje: true, impresos: impreso ? 1 + e.copias : 0, marcos: impreso ? e.marcos : 0 },
  };
}
