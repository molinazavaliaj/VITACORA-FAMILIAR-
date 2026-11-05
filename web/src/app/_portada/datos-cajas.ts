import type { Catalogo } from "@/lib/productos";
import { ruta, type IdiomaWeb } from "@/lib/idioma-web";
import { TEXTOS_PORTADA_NUEVA, type TextoCaja } from "../_textos/portada-nueva";

// Las cajitas de la portada, puras: reciben el catálogo y devuelven lo que se
// pinta. Sin un precio en el catálogo, esa fila no existe. Biógrafo se prende
// con VITACORA_BIOGRAFO=1 cuando estén el permiso, la foto y el texto de
// Florencia. «Para un niño» sigue en Próximamente hasta que se venda Kids.

export type IdCaja = "familiar" | "ti" | "nino" | "viaje" | "evento" | "biografo";
export type Caja = {
  id: IdCaja;
  textos: TextoCaja;
  tinte: 1 | 2 | 3 | 4 | 5 | 6;
  foto: string | null;
  filas: { etiqueta: string; valor: string }[];
  href: string | null;
  marca: "regalo" | "pronto" | null;
};

export function cajasPortada(
  idioma: IdiomaWeb,
  cat: Catalogo,
  formatear: (n: number) => string,
  biografo = process.env.VITACORA_BIOGRAFO === "1",
): Caja[] {
  const t = TEXTOS_PORTADA_NUEVA[idioma];
  const p = t.precios;
  const adicional = cat.impreso?.precio ?? null;
  const dos = (digital: number) => [
    ...(adicional === null ? [] : [{ etiqueta: p.impresoDigital, valor: formatear(digital + adicional) }]),
    { etiqueta: p.soloDigital, valor: formatear(digital) },
  ];
  const comprar = ruta(idioma, "/comprar");

  const cajas: Caja[] = [
    { id: "familiar", textos: t.cajas.familiar, tinte: 1, foto: "/rediseno/para-tu-abuelo.jpg", filas: dos(cat.base.precio), href: `${comprar}?regalo=1`, marca: "regalo" },
    { id: "ti", textos: t.cajas.ti, tinte: 2, foto: "/rediseno/juan-domingo-tapa-foto.jpg", filas: dos(cat.base.precio), href: comprar, marca: null },
    { id: "nino", textos: t.cajas.nino, tinte: 3, foto: "/rediseno/kids-audio-cama.jpg", filas: [{ etiqueta: p.pronto, valor: p.prontoValor }], href: ruta(idioma, "/kids"), marca: "pronto" },
  ];
  if (cat.viaje !== null) {
    cajas.push({ id: "viaje", textos: t.cajas.viaje, tinte: 4, foto: "/rediseno/viaje-audio-hotel.jpg", filas: dos(cat.viaje), href: ruta(idioma, "/viaje"), marca: null });
  }
  cajas.push({ id: "evento", textos: t.cajas.evento, tinte: 5, foto: "/rediseno/eventos-casamiento-stand.jpg", filas: [{ etiqueta: p.evento, valor: p.consultar }], href: ruta(idioma, "/eventos"), marca: null });
  if (biografo) {
    cajas.push({ id: "biografo", textos: t.cajas.biografo, tinte: 6, foto: null, filas: [{ etiqueta: p.biografo, valor: p.consultar }], href: null, marca: null });
  }
  return cajas;
}
