import { obtenerPrecioKids, type Region } from "./precios";

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

/** COMPRA-2-HORA: 18:00 por defecto; el motor solo escribe entre las 9:00 y las 21:59. */
export const HORA_KIDS_POR_DEFECTO = "18:00";
export const HORAS_KIDS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"] as const;

/** La zona del país del número (README de kids v2): la de la región de la web. */
export function zonaKids(region: Region): string {
  return region === "AR" ? "America/Argentina/Buenos_Aires" : "Europe/Madrid";
}

/**
 * Dónde se vende Kids. Solo Argentina: el bot de Kids hoy habla solo
 * rioplatense (K7), así que en España (tú) y en catalán el WhatsApp le
 * llegaría en vos. España se suma cuando estén los textos del bot en es-ES y
 * ca (y `kids_v2.idioma` deje de ser siempre es-AR).
 */
export const KIDS_REGIONES: readonly Region[] = ["AR"];

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
};

export function estadoKidsInicial(): EstadoKids {
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
    hora: HORA_KIDS_POR_DEFECTO,
    temas: [],
    // COMPRA-3-FOTOS: la casilla arranca apagada.
    fotosConOtrosChicos: false,
  };
}

/**
 * «Quién se lo regala» como lo guarda el motor: «tu mamá», «tus abuelos»…, en
 * minúscula (fabrica/src/kids-v2/texto.ts, normalizarQuienRegala). Va en vos
 * porque el motor hoy solo habla rioplatense. «Otra persona» va como la
 * escribieron, con «tu»/«tus» en minúscula.
 */
const QUIEN_TEXTO: Record<Exclude<QuienRegala, "otra">, string> = {
  mama: "tu mamá",
  papa: "tu papá",
  papas: "tus papás",
  abuela: "tu abuela",
  abuelo: "tu abuelo",
  abuelos: "tus abuelos",
};

export function quienRegalaTexto(e: Pick<EstadoKids, "quien" | "quienOtra">): string {
  if (e.quien === "") return "";
  if (e.quien !== "otra") return QUIEN_TEXTO[e.quien];
  return e.quienOtra.trim().replace(/^(tus?)\b/i, (m) => m.toLowerCase());
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
export function fichaDeCompra(e: EstadoKids, region: Region) {
  return {
    nombre: e.nombre.trim(),
    apodo: e.apodo.trim(),
    genero: e.genero,
    edad: edadValida(e.edad),
    quienRegala: quienRegalaTexto(e),
    canal: e.canal,
    nombrePadre: e.tuNombre.trim(),
    hora: e.hora,
    zona: zonaKids(region),
    temasSacados: TEMAS_KIDS.filter((t) => e.temas.includes(t)),
    fotosConOtrosChicos: e.fotosConOtrosChicos,
    preguntasPadre: [] as never[],
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
    kids: fichaDeCompra(e, region),
  };
}
