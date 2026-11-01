import { obtenerPrecioKids, type Region } from "./precios";
import type { IdiomaWeb } from "./idioma-web";
import { armarCompra, type Catalogo, type Compra } from "./productos";
import { validarDireccion, type Direccion } from "./entregas";

// Vitácora Kids («Mi Primer Capítulo») en la web nueva (15/10). Lo que la web
// sabe de Kids, sin red, para probarlo sin mocks.
//
// Lo que manda es la rama `vitacora-kids` (worktree «01 VITACORA/VITACORA KIDS»):
//   - docs/kids/v2/mensajes.md §8: la compra en 3 pantallas, textos aprobados
//     por Naza el 05/10 (en vos);
//   - fabrica/src/kids-v2/compra.ts: la `Ficha` que el motor necesita (nombre,
//     apodo, genero, edad, quienRegala, canal, nombrePadre, hora, zona,
//     temasSacados, fotosConOtrosChicos, preguntasPadre).
//
// La base (CONTRATO, «Vitácora Kids V2 por WhatsApp», migración
// 20261016000000_kids_v2, PROPUESTA para Joaquín) guarda un pedido de Kids
// así: narrador con `contexto.modo = "kids"`, pedido con `extras.tipo =
// "kids"` y una fila en `kids_v2` con la ficha, el canal y el WhatsApp del
// padre. /api/compra los crea (K4, lib/kids-compra.ts). Mientras la migración
// no esté aplicada, la compra se deshace y contesta KIDS_TODAVIA_NO. Y nada se
// vende sin KIDS_VENTA, que no se prende hasta que Joaquín conecte el motor al
// entrevistador (PENDIENTES, «Apuntado: Kids»).

/** Lo que contesta /api/compra a un cuerpo de Kids que no se puede vender (de tú; el de vos está en _textos/checkout-kids). */
export const KIDS_TODAVIA_NO = "Vitácora Kids todavía no se vende. Escríbenos y te avisamos cuando abra.";

/** COMPRA-3-TEMAS, en el orden de la pantalla (los mismos ids que el motor). */
export const TEMAS_KIDS = ["mama", "papa", "abuelo-murio", "ensamblada", "mudanza", "escuela"] as const;
export type TemaKids = (typeof TEMAS_KIDS)[number];

/** COMPRA-2-REGALA: quién se lo regala (lo que no es «otra» va tal cual al primer mensaje). */
export const QUIENES_REGALAN = ["mama", "papa", "papas", "abuela", "abuelo", "abuelos", "otra"] as const;
export type QuienRegala = (typeof QUIENES_REGALAN)[number];

export type CanalKids = "A" | "B";
export type GeneroKids = "chico" | "chica";

/** COMPRA-2-HORA: 18:00 por defecto en Argentina; el motor solo escribe entre las 9:00 y las 21:59. */
export const HORA_KIDS_POR_DEFECTO = "18:00";
/**
 * La hora por defecto de cada región. En España, 20:00 (Naza 16/10, tanda 8):
 * muchos coles acaban a las dos y las extraescolares a las siete u ocho. El
 * texto de ayuda es el mismo.
 */
// APROBADO por Naza 16/10 (tanda 8) · hora por defecto en España
export function horaKidsPorDefecto(region: Region): string {
  return region === "ES" ? "20:00" : HORA_KIDS_POR_DEFECTO;
}
export const HORAS_KIDS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"] as const;

/** La zona del país del número (README de kids v2): la de la región de la web. */
export function zonaKids(region: Region): string {
  return region === "AR" ? "America/Argentina/Buenos_Aires" : "Europe/Madrid";
}

/**
 * El idioma en que le habla el bot de Kids (fabrica/src/kids-v2/idioma.ts):
 * 'es-AR' (vos, el de siempre), 'es-ES' (tú) o 'ca' (catalán, de tu; Naza
 * 16/10, tanda 10). Sin el campo, es-AR. Es también el idioma de todo lo que
 * ve el padre (panel, «Su voz», mails, «Pedido confirmado»).
 */
export type IdiomaKids = "es-AR" | "es-ES" | "ca";
export const IDIOMAS_KIDS: readonly IdiomaKids[] = ["es-AR", "es-ES", "ca"];

export function esIdiomaKids(x: unknown): x is IdiomaKids {
  return x === "es-AR" || x === "es-ES" || x === "ca";
}

/**
 * El de la compra: Argentina de vos; España de tú, o en catalán si se compró
 * desde la web en catalán (/ca, misma región ES, mismo precio y zona).
 */
export function idiomaKidsDeRegion(region: Region, idiomaWeb?: unknown): IdiomaKids {
  if (region !== "ES") return "es-AR";
  return idiomaWeb === "ca" ? "ca" : "es-ES";
}

/** El idioma guardado (kids_v2.idioma o ficha.idioma); sin él o uno raro, es-AR (como el motor sin el campo). */
export function idiomaKidsDe(x: unknown): IdiomaKids {
  return esIdiomaKids(x) ? x : "es-AR";
}

/** El idioma de la web de la casa que le corresponde (los textos compartidos: mail, «Pedido confirmado»). */
export function idiomaWebDeKids(idioma: IdiomaKids): IdiomaWeb {
  return idioma === "es-ES" ? "es" : idioma === "ca" ? "ca" : "ar";
}

/**
 * Dónde se vende Kids: Argentina (vos) y España, en tú y en catalán (Naza 16/10,
 * tanda 8 y tanda 10; el bot ya habla es-ES y ca). /ca es la región ES.
 */
// APROBADO por Naza 16/10 (tanda 10) · Kids se vende también en catalán
export const KIDS_REGIONES: readonly Region[] = ["AR", "ES"];

/** Las webs que venden Kids: /ar, la de España en castellano y /ca. */
// APROBADO por Naza 16/10 (tanda 10)
export const KIDS_IDIOMAS_WEB: readonly IdiomaWeb[] = ["ar", "es", "ca"];

/**
 * ¿Se vende Kids? Solo con todo: una región de KIDS_REGIONES, el interruptor
 * KIDS_VENTA="1" (lo prende Naza cuando Joaquín haya conectado el motor y la
 * migración de kids_v2 esté aplicada) y un precio válido para la región. Sin
 * alguna, la página y la compra dicen «Próximamente» y ofrecen escribirnos, y
 * /api/compra contesta 409.
 */
export function kidsVende(region: Region, env: NodeJS.ProcessEnv = process.env): boolean {
  return KIDS_REGIONES.includes(region) && env.KIDS_VENTA === "1" && obtenerPrecioKids(region) !== null;
}

/** ¿Se vende Kids en esta web? Como `kidsVende`, con la región de la web (/ca es España). */
export function kidsVendeEn(idioma: IdiomaWeb, env: NodeJS.ProcessEnv = process.env): boolean {
  return KIDS_IDIOMAS_WEB.includes(idioma) && kidsVende(idioma === "ar" ? "AR" : "ES", env);
}

/** Lo que se llena en las 3 pantallas de la compra. */
export type EstadoKids = {
  // 1 · Tú
  tuNombre: string;
  tuWhatsapp: string;
  email: string;
  // 2 · Quién lo cuenta
  nombre: string;
  apodo: string;
  genero: GeneroKids | "";
  edad: string;
  quien: QuienRegala | "";
  /** Si eligió «Otra persona»: cómo se lo diría a quien lo recibe («tu tía»). */
  quienOtra: string;
  canal: CanalKids | "";
  /** Su WhatsApp, solo con el canal A. */
  suWhatsapp: string;
  hora: string;
  // 3 · Temas y pago
  temas: TemaKids[];
  fotosConOtrosChicos: boolean;
  // El libro impreso (Naza 15/10, tanda 3, punto 10): las opciones de la casa,
  // sin marco. `marcos` queda siempre en 0 (Kids no tiene marco); está porque
  // las opciones de la casa (_checkout/opciones-libro) lo leen.
  formato: "digital" | "impreso";
  marcos: number;
  opcion?: "digital" | "impreso" | "marco";
  /** Copias impresas además de la primera. */
  copias: number;
  recibe: string;
  telefonoRecibe: string;
  direccion: Partial<Direccion>;
};

/**
 * Con qué arranca. Con el catálogo de Kids (`catalogoKids`) y un impreso con
 * precio, arranca con el impreso elegido, como la casa; sin catálogo, digital.
 */
export function estadoKidsInicial(cat?: Pick<Catalogo, "impreso">, region: Region = "AR"): EstadoKids {
  const impreso = Boolean(cat?.impreso);
  return {
    tuNombre: "",
    tuWhatsapp: "",
    email: "",
    nombre: "",
    apodo: "",
    genero: "",
    edad: "",
    quien: "",
    quienOtra: "",
    canal: "",
    suWhatsapp: "",
    hora: horaKidsPorDefecto(region),
    temas: [],
    // COMPRA-3-FOTOS: la casilla arranca apagada.
    fotosConOtrosChicos: false,
    formato: impreso ? "impreso" : "digital",
    marcos: 0,
    opcion: impreso ? "impreso" : "digital",
    copias: 0,
    recibe: "",
    telefonoRecibe: "",
    direccion: { pais: region === "AR" ? "Argentina" : "España" },
  };
}

// ── El libro impreso de Kids (Naza 15/10, tanda 3, punto 10) ──────────────
//
// «El mismo precio de la casa, con el impreso arriba como en la casa»: el
// impreso y sus copias valen lo de la casa (PRECIO_IMPRESO_* y PRECIO_COPIA_*,
// el catálogo de lib/productos) y se suman al precio de Kids. Sin marco ni pack
// (Kids no los define). La misma cuenta en el navegador y en el servidor:
// `compraKids` es `armarCompra` con la base de Kids.

/** El nombre de la línea de Kids en la pasarela (Stripe / Mercado Pago). */
export const NOMBRE_LINEA_KIDS = "Vitácora Kids";

/** El catálogo de Kids: su precio de base y el impreso de la casa; sin viaje, marco, pack ni tarjeta impresa. */
export function catalogoKids(casa: Catalogo, precio: number): Catalogo {
  return { ...casa, base: { nombre: NOMBRE_LINEA_KIDS, detalle: "", precio }, viaje: null, marco: null, pack: null, tarjeta: null };
}

/** Cuántos impresos lleva lo elegido: el primero y sus copias, o ninguno. */
export function impresosKids(e: Pick<EstadoKids, "formato" | "copias">): number {
  return e.formato === "impreso" ? 1 + Math.max(0, Math.floor(e.copias || 0)) : 0;
}

/** El ticket de Kids: la base (id "pdf", para que `extras` diga `pdf: true`), el impreso y las copias. Nunca marcos. */
export function compraKids(cat: Catalogo, region: Region, impresos: number): Compra {
  const c = armarCompra(cat, region, { base: "pdf", impresos, marcos: 0 });
  return { ...c, lineas: c.lineas.map((l) => (l.id === "pdf" ? { ...l, nombre: NOMBRE_LINEA_KIDS } : l)) };
}

/** Los textos de la casa que pide el envío (_textos/checkout). */
type TextosEnvio = { faltaRecibe: string; faltaTelefonoRecibe: string };

/**
 * Lo que falta del envío en el paso 3, con los mismos textos y reglas que la
 * casa (comprar/compra.ts, `fallaDelPaso`); null si no lleva impreso o está todo.
 */
export function fallaEnvioKids(e: Pick<EstadoKids, "formato" | "recibe" | "telefonoRecibe" | "direccion">, T: TextosEnvio): { texto: string; campo: string } | null {
  if (e.formato !== "impreso") return null;
  if (!e.recibe.trim()) return { texto: T.faltaRecibe, campo: "recibe" };
  if (!e.telefonoRecibe.trim()) return { texto: T.faltaTelefonoRecibe, campo: "telefono-recibe" };
  const d = validarDireccion(e.direccion);
  return d.ok ? null : { texto: d.mensaje, campo: "direccion" };
}

/**
 * «Quién se lo regala» como lo guarda el motor: «tu mamá», «tus abuelos»…, en
 * minúscula (fabrica/src/kids-v2/texto.ts, normalizarQuienRegala), en el
 * idioma del chico: en España «tu madre», «tu padre», «tus padres» (Naza
 * 16/10, tanda 8), en catalán «la teva mare», «els teus pares» (tanda 10),
 * porque el bot le habla así. «Otra persona» va como la escribieron, con el
 * posesivo («tu», «tus», «la teva», «el teu», «els teus», «les teves») en minúscula.
 */
const QUIEN_TEXTO: Record<IdiomaKids, Record<Exclude<QuienRegala, "otra">, string>> = {
  "es-AR": {
    mama: "tu mamá",
    papa: "tu papá",
    papas: "tus papás",
    abuela: "tu abuela",
    abuelo: "tu abuelo",
    abuelos: "tus abuelos",
  },
  // APROBADO por Naza 16/10 (tanda 8) · quién se lo regala en España
  "es-ES": {
    mama: "tu madre",
    papa: "tu padre",
    papas: "tus padres",
    abuela: "tu abuela",
    abuelo: "tu abuelo",
    abuelos: "tus abuelos",
  },
  // APROBADO por Naza 16/10 (tanda 10) · quién li ho regala en catalán
  ca: {
    mama: "la teva mare",
    papa: "el teu pare",
    papas: "els teus pares",
    abuela: "la teva àvia",
    abuelo: "el teu avi",
    abuelos: "els teus avis",
  },
};

/** Los posesivos con que empieza quien regala (texto.ts del motor, POSESIVO). */
const POSESIVO = /^(tus?|la teva|el teu|els teus|les teves)(?=\s)/i;

/** La región ("AR", "ES") vale por su castellano; el catalán se pide con "ca". */
const idiomaDeQuien = (x: Region | IdiomaKids): IdiomaKids => (x === "AR" ? "es-AR" : x === "ES" ? "es-ES" : x);

export function quienRegalaTexto(e: Pick<EstadoKids, "quien" | "quienOtra">, idioma: Region | IdiomaKids = "AR"): string {
  if (e.quien === "") return "";
  if (e.quien !== "otra") return QUIEN_TEXTO[idiomaDeQuien(idioma)][e.quien];
  return e.quienOtra.trim().replace(POSESIVO, (m) => m.toLowerCase());
}

/** Edad entera razonable (va en la tapa), o null. */
export function edadValida(crudo: string): number | null {
  const n = Number(crudo.trim());
  return Number.isInteger(n) && n >= 6 && n <= 17 ? n : null;
}

export type PasoKids = 1 | 2 | 3;
export type FallaKids = { campo: string; clave: ClaveFallaKids };
export type ClaveFallaKids =
  | "faltaTuNombre"
  | "faltaTuWhatsapp"
  | "correoMal"
  | "faltaNombre"
  | "faltaApodo"
  | "faltaGenero"
  | "edadMal"
  | "faltaQuien"
  | "faltaCanal"
  | "faltaSuWhatsapp";

const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const vacio = (s: string) => !s.trim();

/** Qué falta para pasar del paso. Puro: devuelve la clave del texto, no el texto. */
export function fallaKids(paso: PasoKids, e: EstadoKids): FallaKids | null {
  if (paso === 1) {
    if (vacio(e.tuNombre)) return { campo: "tu-nombre", clave: "faltaTuNombre" };
    if (vacio(e.tuWhatsapp)) return { campo: "tu-whatsapp", clave: "faltaTuWhatsapp" };
    if (!CORREO_RE.test(e.email.trim())) return { campo: "email", clave: "correoMal" };
    return null;
  }
  if (paso === 2) {
    if (vacio(e.nombre)) return { campo: "nombre", clave: "faltaNombre" };
    if (vacio(e.apodo)) return { campo: "apodo", clave: "faltaApodo" };
    if (e.genero === "") return { campo: "genero", clave: "faltaGenero" };
    if (edadValida(e.edad) === null) return { campo: "edad", clave: "edadMal" };
    if (quienRegalaTexto(e) === "") return { campo: "quien", clave: "faltaQuien" };
    if (e.canal === "") return { campo: "canal", clave: "faltaCanal" };
    if (e.canal === "A" && vacio(e.suWhatsapp)) return { campo: "su-whatsapp", clave: "faltaSuWhatsapp" };
    return null;
  }
  return null;
}

/**
 * La ficha del motor (fabrica/src/kids-v2/compra.ts, `Ficha`) con lo que se
 * llenó, sin `linkPanel` (lo pone /api/compra al crear el narrador) y sin
 * preguntas del padre (se escriben después, desde el panel). Los teléfonos y el
 * correo no van en la ficha: van a `narradores`, `kids_v2` y `familias`. El
 * servidor no la cree tal cual: la vuelve a armar y validar (lib/kids-compra.ts).
 */
export function fichaDeCompra(e: EstadoKids, region: Region, idiomaWeb?: unknown) {
  const idioma = idiomaKidsDeRegion(region, idiomaWeb);
  return {
    nombre: e.nombre.trim(),
    apodo: e.apodo.trim(),
    genero: e.genero,
    edad: edadValida(e.edad),
    quienRegala: quienRegalaTexto(e, idioma),
    canal: e.canal,
    nombrePadre: e.tuNombre.trim(),
    hora: e.hora,
    zona: zonaKids(region),
    temasSacados: TEMAS_KIDS.filter((t) => e.temas.includes(t)),
    fotosConOtrosChicos: e.fotosConOtrosChicos,
    preguntasPadre: [] as never[],
    // El servidor no se fía de esto: el idioma sale de la región y de la web (lib/kids-compra.ts).
    idioma,
  };
}

/**
 * El cuerpo que va a /api/compra. `producto: "kids"` es la marca para que la
 * API lo reconozca y cree el pedido de Kids (lib/kids-compra.ts).
 */
export function cuerpoKids(e: EstadoKids, region: Region, idiomaWeb: string) {
  return {
    producto: "kids" as const,
    region,
    idiomaWeb,
    email: e.email.trim(),
    nombreComprador: e.tuNombre.trim(),
    whatsappComprador: e.tuWhatsapp.trim(),
    whatsappChico: e.canal === "A" ? e.suWhatsapp.trim() : null,
    kids: fichaDeCompra(e, region, idiomaWeb),
    // Como la casa: solo cuántos impresos. El precio lo calcula el servidor.
    productos: { impresos: impresosKids(e) },
  };
}
