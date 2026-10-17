// web/src/lib/carta-textos.ts
// ⚠️ BORRADOR (17/10). Ningún texto de este archivo está aprobado. Naza los
// aprueba de a 10 antes de mergear (vos, tú y catalán). Reglas: sin dos
// puntos, sin oraciones que empiecen con «Y», sin precio, sin «tu vida» hacia
// quien compra.

import type { IdiomaRegalo, TratoComprador } from "./regalo-textos";

/** La página que abre el QR de una carta que nadie pagó todavía. La lee quien la tiene en la mano. */
export type TextosCartaLibre = {
  titulo: string;
  cuerpo: string;
  regalarla: string;
  paraVos: string;
  siTeLaRegalaron: string;
};

const CARTA_LIBRE: Record<IdiomaRegalo, TextosCartaLibre> = {
  "es-AR": {
    titulo: "Esta carta es un regalo que todavía no se activó",
    cuerpo: "Con ella alguien que querés cuenta su vida por WhatsApp y nosotros escribimos su libro. Se activa cuando la regalás desde acá.",
    regalarla: "Regalarla",
    paraVos: "¿La querés para vos?",
    siTeLaRegalaron: "Si te la dieron como regalo, avisale a quien te la dio.",
  },
  "es-ES": {
    titulo: "Esta carta es un regalo que todavía no se ha activado",
    cuerpo: "Con ella alguien a quien quieres cuenta su vida por WhatsApp y nosotros escribimos su libro. Se activa cuando la regalas desde aquí.",
    regalarla: "Regalarla",
    paraVos: "¿La quieres para ti?",
    siTeLaRegalaron: "Si te la han dado como regalo, avísale a quien te la dio.",
  },
  ca: {
    titulo: "Aquesta carta és un regal que encara no s'ha activat",
    cuerpo: "Amb ella algú que estimes explica la seva vida per WhatsApp i nosaltres n'escrivim el llibre. S'activa quan la regales des d'aquí.",
    regalarla: "Regalar-la",
    paraVos: "La vols per a tu?",
    siTeLaRegalaron: "Si te l'han donat com a regal, avisa qui te la va donar.",
  },
};

export function textosCartaLibre(idioma: IdiomaRegalo): TextosCartaLibre {
  return CARTA_LIBRE[idioma];
}

/** Lo nuevo de /regalar cuando se llega desde una carta. Lo lee quien compra. */
export type TextosCartaComprador = {
  avisoCarta: (codigo: string) => string;
  cartaUsada: string;
  queLibro: string;
  digital: string;
  digitalDetalle: string;
  impreso: string;
  impresoDetalle: string;
  tarjetaTitulo: string;
  tarjetaDetalle: string;
  direccionTitulo: string;
};

const CARTA_COMPRADOR: Record<TratoComprador, TextosCartaComprador> = {
  vos: {
    avisoCarta: (codigo) => `Estás regalando la carta ${codigo}. Cuando pagues, esa misma carta queda activada.`,
    cartaUsada: "Esta carta ya fue regalada. Podés regalar igual un libro nuevo desde acá.",
    queLibro: "Qué libro le regalás",
    digital: "El libro digital",
    digitalDetalle: "Se lee en la web, con sus fotos y su voz.",
    impreso: "El libro impreso",
    impresoDetalle: "Tapa dura, a color, con su voz en un código. Incluye el digital.",
    tarjetaTitulo: "Sumar la tarjeta negra por correo",
    tarjetaDetalle: "Te la mandamos a tu casa en un sobre negro, para dársela en mano.",
    direccionTitulo: "Dónde te la mandamos",
  },
  tu: {
    avisoCarta: (codigo) => `Estás regalando la carta ${codigo}. Cuando pagues, esa misma carta queda activada.`,
    cartaUsada: "Esta carta ya se ha regalado. Puedes regalar igualmente un libro nuevo desde aquí.",
    queLibro: "Qué libro le regalas",
    digital: "El libro digital",
    digitalDetalle: "Se lee en la web, con sus fotos y su voz.",
    impreso: "El libro impreso",
    impresoDetalle: "Tapa dura, a color, con su voz en un código. Incluye el digital.",
    tarjetaTitulo: "Añadir la tarjeta negra por correo",
    tarjetaDetalle: "Te la enviamos a casa en un sobre negro, para dársela en mano.",
    direccionTitulo: "Dónde te la enviamos",
  },
};

export function textosCartaComprador(trato: TratoComprador): TextosCartaComprador {
  return CARTA_COMPRADOR[trato];
}

/** El panel de solo lectura del local. */
export type TextosPanelLocal = {
  titulo: (nombre: string) => string;
  sobres: (n: number) => string;
  sinVentas: string;
  mes: string;
  cartas: string;
  teToca: string;
  pago: string;
};

const PANEL: Record<IdiomaRegalo, TextosPanelLocal> = {
  "es-AR": {
    titulo: (nombre) => `Vitácora Familiar en ${nombre}`,
    sobres: (n) => `Te dejamos ${n} sobres.`,
    sinVentas: "Todavía no se pagó ninguna carta de tu caja.",
    mes: "Mes", cartas: "Cartas pagadas", teToca: "Te toca",
    pago: "Lo de cada mes te lo pagamos a principios del mes siguiente.",
  },
  "es-ES": {
    titulo: (nombre) => `Vitácora Familiar en ${nombre}`,
    sobres: (n) => `Os hemos dejado ${n} sobres.`,
    sinVentas: "Todavía no se ha pagado ninguna carta de vuestra caja.",
    mes: "Mes", cartas: "Cartas pagadas", teToca: "Os toca",
    pago: "Lo de cada mes os lo pagamos a principios del mes siguiente.",
  },
  ca: {
    titulo: (nombre) => `Vitácora Familiar a ${nombre}`,
    sobres: (n) => `Us hem deixat ${n} sobres.`,
    sinVentas: "Encara no s'ha pagat cap carta de la vostra caixa.",
    mes: "Mes", cartas: "Cartes pagades", teToca: "Us toca",
    pago: "El de cada mes us el paguem a principis del mes següent.",
  },
};

export function textosPanelLocal(idioma: IdiomaRegalo): TextosPanelLocal {
  return PANEL[idioma];
}
