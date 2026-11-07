import { kidsVendeEn } from "@/lib/kids";
import { obtenerPrecioKids } from "@/lib/precios";
import type { Catalogo } from "@/lib/productos";
import { regionDeIdioma, ruta, type IdiomaWeb } from "@/lib/idioma-web";
import { TEXTOS_EDICIONES } from "../_textos/ediciones";
import { TEXTOS_PORTADA } from "../_textos/portada";
import { TEXTOS_PORTADA_INICIO } from "../_textos/portada-inicio";
import { TEXTOS_PORTADA_NUEVA, type TextoCaja } from "../_textos/portada-nueva";
import { LIBRO_VIAJE_EJEMPLO } from "../_textos/viaje";

// Las cajitas de la portada, puras: reciben el catálogo y devuelven lo que se
// pinta. Sin un precio en el catálogo, esa fila no existe. Biógrafo se prende
// con VITACORA_BIOGRAFO=1 cuando estén el permiso, la foto y el texto de
// Florencia. «Para un niño» dice Próximamente solo donde Kids no se vende.

export type IdCaja = "familiar" | "ti" | "nino" | "viaje" | "evento" | "biografo" | "historia";
/** La contratapa, parada al lado de la tapa en los estantes de un solo libro. */
export type ContraCaja = { iniciales: string; texto: string; escucha: string };
export type TapaCaja = { etiqueta: string; nombre: [string, string] | string; firma: string; foto: string; apaisado?: boolean; contra?: ContraCaja };
export type Caja = {
  id: IdCaja;
  textos: TextoCaja;
  tinte: 1 | 2 | 3 | 4 | 5 | 6;
  tapa: TapaCaja | null;
  filas: FilaPrecio[];
  /** Sin enlace, la nota no lleva botón (lo que no se vende). Biógrafo abre su bloque. */
  href: string | null;
  /** WhatsApp o correo: se abre afuera, con un enlace común. */
  externo?: boolean;
  marca: "regalo" | "pronto" | null;
};
/** Una línea de precios. `antes`, el precio de lista tachado mientras hay promo. */
export type FilaPrecio = { etiqueta: string; valor: string; antes?: string };

/**
 * Las dos líneas de una nota: impreso y digital (si la región tiene impreso) y
 * solo digital. Salen del catálogo, nunca a mano, y nunca dicen «desde».
 */
export function filasDePrecio(idioma: IdiomaWeb, cat: Catalogo, formatear: (n: number) => string, digital: number, antes?: string | null): FilaPrecio[] {
  const p = TEXTOS_PORTADA_NUEVA[idioma].precios;
  const adicional = cat.impreso?.precio ?? null;
  return [
    ...(adicional === null ? [] : [{ etiqueta: p.impresoDigital, valor: formatear(digital + adicional) }]),
    { etiqueta: p.soloDigital, valor: formatear(digital), ...(antes ? { antes } : {}) },
  ];
}

export function cajasPortada(
  idioma: IdiomaWeb,
  cat: Catalogo,
  formatear: (n: number) => string,
  biografo = process.env.VITACORA_BIOGRAFO === "1",
): Caja[] {
  const t = TEXTOS_PORTADA_NUEVA[idioma];
  const p = t.precios;
  const inicio = TEXTOS_PORTADA_INICIO[idioma];
  const ediciones = TEXTOS_EDICIONES[idioma];
  const familiar = TEXTOS_PORTADA[idioma].direccion.libro;
  const dos = (digital: number) => filasDePrecio(idioma, cat, formatear, digital);
  const comprar = ruta(idioma, "/comprar");
  // Mismo criterio que /kids: sin venta o sin precio, «Próximamente».
  const precioKids = kidsVendeEn(idioma) ? obtenerPrecioKids(regionDeIdioma(idioma)) : null;

  const cajas: Caja[] = [
    {
      id: "familiar",
      textos: t.cajas.familiar,
      tinte: 1,
      tapa: { etiqueta: familiar.etiqueta, nombre: familiar.nombre, firma: familiar.paraSiempre, foto: "/rediseno/juan-domingo-tapa-foto.jpg" },
      filas: dos(cat.base.precio),
      href: `${comprar}?regalo=1`,
      marca: "regalo",
    },
    {
      id: "ti",
      textos: t.cajas.ti,
      tinte: 2,
      tapa: { ...inicio.tapaTi, foto: "/rediseno/historia-carmen-tapa.jpg" },
      filas: dos(cat.base.precio),
      href: comprar,
      marca: null,
    },
    {
      id: "nino",
      textos: t.cajas.nino,
      tinte: 3,
      tapa: { etiqueta: ediciones.tapaKids.etiqueta, nombre: ediciones.tapaKids.nombre, firma: ediciones.tapaKids.edad, foto: "/rediseno/kids-cuarto-juguetes.jpg" },
      filas: precioKids === null ? [{ etiqueta: p.pronto, valor: p.prontoValor }] : dos(precioKids),
      href: ruta(idioma, "/kids"),
      marca: precioKids === null ? "pronto" : null,
    },
  ];
  if (cat.viaje !== null) {
    cajas.push({
      id: "viaje",
      textos: t.cajas.viaje,
      tinte: 4,
      tapa: {
        etiqueta: LIBRO_VIAJE_EJEMPLO.etiqueta,
        nombre: LIBRO_VIAJE_EJEMPLO.nombre.join(" "),
        firma: LIBRO_VIAJE_EJEMPLO.paraSiempre,
        foto: "/rediseno/viaje-mirador-lisboa.jpg",
        apaisado: true,
      },
      filas: dos(cat.viaje),
      href: ruta(idioma, "/viaje"),
      marca: null,
    });
  }
  cajas.push({
    id: "evento",
    textos: t.cajas.evento,
    tinte: 5,
    tapa: { ...inicio.tapaEvento, foto: "/rediseno/eventos-casamiento-stand.jpg" },
    filas: [{ etiqueta: p.evento, valor: p.consultar }],
    href: ruta(idioma, "/eventos"),
    marca: null,
  });
  if (biografo) {
    cajas.push({ id: "biografo", textos: t.cajas.biografo, tinte: 6, tapa: null, filas: [{ etiqueta: p.biografo, valor: p.consultar }], href: null, marca: null });
  }
  return cajas;
}
