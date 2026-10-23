import type { Carrito, Catalogo } from "@/lib/productos";
import type { Region } from "@/lib/precios";
import type { IdiomaWeb } from "@/lib/idioma-web";
import type { IdiomaRegalo, TextosEntrega } from "@/lib/regalo-textos";
import { errorDeFechaEntrega, type Genero } from "@/lib/regalo-reglas";
import { esPalabraDeFamilia } from "@/lib/como-le-dicen";
import { validarDireccion, type Direccion } from "@/lib/entregas";
import type { Para, TextosCheckout } from "../_textos/checkout";
import { errorDeEleccion, type EleccionEntrega } from "../regalar/entrega";
import { eleccionInicial, type OpcionLibro } from "../_checkout/opciones-libro";
import { PROPIA_MAXIMO, type TemaHistoria } from "@/lib/historia";
import type { TextosHistoria } from "../_textos/historia";

// La lógica del checkout del libro de una vida (rediseño 2026-10, DECISIONES D3),
// sin React ni navegador para poder probarla: el estado, qué pide cada uno de los
// tres pasos y el cuerpo que va a /api/compra. El orden es el de hoy: primero
// el libro, después para quién es, al final los datos de quien paga y el pago.
// Cero cambios de base: el cuerpo es el mismo contrato de /api/compra, con el
// regalo (gift card) y su `retomar` cuando es un regalo, y el idioma de la web
// para que la pasarela vuelva a la versión correcta.

/**
 * En Familiar: 1 su libro, 2 para quién, 3 el pago. En «Vitácora de una historia» (23/10) hay uno más entre
 * «Para quién» y el pago: 3 la historia, 4 el pago (pasoDelPago).
 */
export type Paso = 1 | 2 | 3 | 4;

export type Formato = "digital" | "impreso";
export type ModoFecha = "" | "navidad" | "otra";

/** La prueba de una compra anterior sin pagar (la devuelve /api/compra). */
export type Retomar = { narradorId: string; token: string };

export type EstadoCompra = {
  formato: Formato;
  /** Marcos (0 = sin marco). Solo cuentan con el impreso. */
  marcos: number;
  /** Cuál de las tres opciones del paso 1 eligió (sin ella, se deduce de formato y marcos). */
  opcion?: OpcionLibro;
  /** Copias impresas además de la primera. */
  copias: number;
  para: Para | null;
  /** El género elegido a mano («Otra persona» y «Para mí»); los demás salen de `para`. */
  genero: Genero | null;
  nombre: string;
  comoLeDicen: string;
  /** null = todavía no eligió; solo cuando no es «Para mí». */
  regalo: boolean | null;
  mensaje: string;
  modoFecha: ModoFecha;
  fechaEntrega: string;
  entrega: EleccionEntrega;
  telefono: string;
  hora: string;
  idioma: IdiomaRegalo;
  /** Si eligió el trato a mano: entonces el prefijo del número ya no lo cambia. */
  idiomaAMano: boolean;
  anio: string;
  estadoCivil: string;
  hijos: "" | "si" | "no";
  dondeVive: string;
  email: string;
  nombreComprador: string;
  vinculo: string;
  recibe: string;
  telefonoRecibe: string;
  direccion: Partial<Direccion>;
  retomar: Retomar | null;
  /** Solo en «Vitácora de una historia» (/comprar/historia): el paso «La historia». */
  historia?: EstadoHistoriaCompra;
};

/** El paso «La historia»: el tema (o «Otra historia» con sus palabras), el tema abierto y las preguntas de regalo. */
export type EstadoHistoriaCompra = { tema: TemaHistoria | null; temaLibre: string; temaAbierto: boolean; preguntasPropias: string[] };

export const historiaInicial = (): EstadoHistoriaCompra => ({ tema: null, temaLibre: "", temaAbierto: false, preguntasPropias: [""] });

/** El paso del pago: el 3 en Familiar, el 4 en historia. */
export const pasoDelPago = (e: Pick<EstadoCompra, "historia">): Paso => (e.historia ? 4 : 3);

/** El idioma de la entrevista con el que arranca cada versión de la web. */
export function idiomaInicial(idioma: IdiomaWeb): IdiomaRegalo {
  return idioma === "ar" ? "es-AR" : idioma === "ca" ? "ca" : "es-ES";
}

export function estadoInicial(idioma: IdiomaWeb, cat: Catalogo): EstadoCompra {
  const region: Region = idioma === "ar" ? "AR" : "ES";
  return {
    // Arranca con el libro completo (impreso + digital + marco, Naza 14/10; antes,
    // desde el 06/10, con el impreso): quien quiera menos, lo cambia. Sin marco en
    // la región arranca con el impreso; sin impreso, en digital (si no, el pago
    // se rechazaría).
    ...eleccionInicial(cat),
    copias: 0,
    para: null,
    genero: null,
    nombre: "",
    comoLeDicen: "",
    regalo: null,
    mensaje: "",
    modoFecha: "",
    fechaEntrega: "",
    entrega: { canal: null, contacto: "", hora: null },
    telefono: "",
    hora: "09:00",
    idioma: idiomaInicial(idioma),
    idiomaAMano: false,
    anio: "",
    estadoCivil: "",
    hijos: "",
    dondeVive: "",
    email: "",
    nombreComprador: "",
    vinculo: "",
    recibe: "",
    telefonoRecibe: "",
    direccion: { pais: region === "AR" ? "Argentina" : "España" },
    retomar: null,
  };
}

export const esPropia = (e: Pick<EstadoCompra, "para">) => e.para === "yo";
export const esRegalo = (e: Pick<EstadoCompra, "para" | "regalo">) => e.para !== "yo" && e.regalo === true;

/** Padre y abuelo son él; madre y abuela, ella; en «Otra persona» y «Para mí» se elige. */
export function generoDe(e: Pick<EstadoCompra, "para" | "genero">): Genero | null {
  if (e.para === "padre" || e.para === "abuelo") return "varon";
  if (e.para === "madre" || e.para === "abuela") return "mujer";
  return e.genero;
}

/** Lo que va al ticket: el PDF siempre; el impreso y sus copias; los marcos solo con impreso. */
export function carritoDe(e: Pick<EstadoCompra, "formato" | "copias" | "marcos">): Carrito {
  const impreso = e.formato === "impreso";
  return { base: "pdf", impresos: impreso ? 1 + Math.max(0, e.copias) : 0, marcos: impreso ? Math.max(0, e.marcos) : 0 };
}

/** Hay algo que viaja: entonces el paso 3 pide la dirección. */
export const llevaDireccion = (e: Pick<EstadoCompra, "formato">) => e.formato === "impreso";

const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type Falla = { texto: string; campo?: string };

/** Lo que falta en un paso, con el campo a marcar; null si se puede seguir. */
export function fallaDelPaso(paso: Paso, e: EstadoCompra, T: TextosCheckout, entrega: TextosEntrega, ahora: Date, TH?: TextosHistoria["paso"]): Falla | null {
  if (paso === 1) return null;
  if (paso === 3 && e.historia) return fallaDeLaHistoria(e, e.historia, TH);
  if (paso === 2) {
    const yo = esPropia(e);
    if (!e.para) return { texto: T.faltaPara, campo: "para" };
    if ((e.para === "otra" || yo) && !e.genero) return { texto: yo ? T.faltaGeneroYo : T.faltaGeneroOtro, campo: "genero" };
    if (!e.nombre.trim()) return { texto: yo ? T.faltaNombreYo : T.faltaNombreOtro, campo: "nombre" };
    if (!e.comoLeDicen.trim()) return { texto: T.faltaComo, campo: "como" };
    if (!yo && esPalabraDeFamilia(e.comoLeDicen)) return { texto: T.palabraDeFamilia, campo: "como" };
    if (!yo && e.regalo === null) return { texto: T.faltaRegalo, campo: "regalo" };
    if (esRegalo(e)) {
      if (!e.mensaje.trim()) return { texto: T.faltaMensaje, campo: "mensaje" };
      const problemaFecha = e.fechaEntrega ? errorDeFechaEntrega(e.fechaEntrega, ahora) : null;
      if (problemaFecha) return { texto: problemaFecha, campo: "fecha" };
      const problemaEntrega = errorDeEleccion(e.entrega, e.fechaEntrega, e.idioma, ahora, entrega);
      if (problemaEntrega) return problemaEntrega;
    } else if (!e.telefono.trim()) {
      return { texto: T.faltaWhatsapp, campo: "telefono" };
    }
    const anio = e.anio.trim();
    if (anio && (Number(anio) < 1900 || Number(anio) > 2015)) return { texto: T.anioMal, campo: "anio" };
    return null;
  }
  if (!CORREO_RE.test(e.email.trim())) return { texto: T.correoMal, campo: "email" };
  if (!esPropia(e)) {
    if (!e.nombreComprador.trim()) return { texto: T.faltaTuNombre, campo: "comprador" };
    if (!e.vinculo.trim()) return { texto: T.faltaVinculo, campo: "vinculo" };
  }
  if (llevaDireccion(e)) {
    if (!e.recibe.trim()) return { texto: T.faltaRecibe, campo: "recibe" };
    if (!e.telefonoRecibe.trim()) return { texto: T.faltaTelefonoRecibe, campo: "telefono-recibe" };
    const d = validarDireccion(e.direccion);
    if (!d.ok) return { texto: d.mensaje, campo: "direccion" };
  }
  return null;
}

/** Lo que falta en el paso «La historia» (H8 a H10). El tema abierto y las preguntas propias son solo de regalo. */
function fallaDeLaHistoria(e: EstadoCompra, h: EstadoHistoriaCompra, TH?: TextosHistoria["paso"]): Falla | null {
  if (!TH) throw new Error("fallaDelPaso: falta el texto del paso «La historia»");
  const regalo = esRegalo(e);
  if (regalo && h.preguntasPropias.some((p) => p.trim().length > PROPIA_MAXIMO)) return { texto: TH.errorPropiaLarga, campo: "propias" };
  if (regalo && h.temaAbierto) return null;
  if (!h.tema) return { texto: TH.errorSinTema, campo: "tema" };
  if (h.tema === "otra" && !h.temaLibre.trim()) return { texto: TH.errorSinOtra, campo: "tema-libre" };
  return null;
}

/** Lo que va en `narrador.contexto.historia` (lib/historia.ts, CompraHistoria): lo de regalo, solo si es regalo. */
function historiaDelCuerpo(e: EstadoCompra, h: EstadoHistoriaCompra) {
  const regalo = esRegalo(e);
  const preguntasPropias = regalo ? h.preguntasPropias.map((p) => p.trim()).filter(Boolean) : [];
  if (regalo && h.temaAbierto) return { temaAbierto: true, preguntasPropias };
  return { tema: h.tema, ...(h.tema === "otra" ? { temaLibre: h.temaLibre.trim() } : {}), preguntasPropias };
}

/** El cuerpo de POST /api/compra, el mismo contrato de siempre. */
export function cuerpoDeLaCompra(e: EstadoCompra, idiomaWeb: IdiomaWeb) {
  const yo = esPropia(e);
  const regalo = esRegalo(e);
  const genero = generoDe(e);
  const region: Region = idiomaWeb === "ar" ? "AR" : "ES";
  const carrito = carritoDe(e);
  return {
    nombreComprador: yo ? e.nombre.trim() : e.nombreComprador.trim(),
    vinculoComprador: yo ? "yo mismo" : e.vinculo.trim(),
    region,
    email: e.email.trim(),
    idiomaWeb,
    narrador: {
      nombre: e.nombre.trim(),
      comoLeDicen: e.comoLeDicen.trim(),
      // El regalo no lleva teléfono: lo pone el entrevistador cuando el narrador escribe con su código.
      ...(regalo ? {} : { telefonoWhatsapp: e.telefono.trim(), horaPreferida: e.hora }),
      contexto: {
        idioma: e.idioma,
        ...(genero ? { genero } : {}),
        ...(e.anio.trim() ? { anioNacimiento: Number(e.anio.trim()) } : {}),
        ...(e.estadoCivil ? { estadoCivil: e.estadoCivil } : {}),
        // "no tiene hijos" = arbol.hijos 'no tuvo': el capítulo «Los hijos» se reemplaza sin preguntar.
        ...(e.hijos === "no" ? { arbol: { hijos: "no tuvo" } } : {}),
        ...(e.dondeVive.trim() ? { dondeVive: e.dondeVive.trim() } : {}),
        ...(e.historia ? { historia: historiaDelCuerpo(e, e.historia) } : {}),
      },
    },
    productos: { impresos: carrito.impresos, marcos: carrito.marcos },
    ...(regalo
      ? {
          regalo: {
            mensaje: e.mensaje.trim(),
            fechaEntrega: e.fechaEntrega || undefined,
            genero,
            idioma: e.idioma,
            ...(e.fechaEntrega && e.entrega.canal && e.entrega.hora !== null
              ? { entrega: { canal: e.entrega.canal, contacto: e.entrega.contacto.trim(), hora: e.entrega.hora } }
              : {}),
            ...(e.retomar ? { retomar: e.retomar } : {}),
          },
        }
      : {}),
  };
}

/** El próximo 24 de diciembre (este año, o el que viene si ya pasó), como lo pide input type="date". */
export function proximaNavidad(hoy: Date): string {
  const anio = hoy.getMonth() === 11 && hoy.getDate() > 24 ? hoy.getFullYear() + 1 : hoy.getFullYear();
  return `${anio}-12-24`;
}

/** Lo que se guarda para volver tras un pago fallido: todo menos los archivos (fotos y audio). */
export function claveDeCompra(idiomaWeb: IdiomaWeb, historia = false): string {
  return `${historia ? "historia" : "familiar"}-${idiomaWeb}`;
}
