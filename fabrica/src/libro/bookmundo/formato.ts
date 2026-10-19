// Las medidas de Bookmundo tapa dura (docs/bookmundo/especificaciones-bookmundo-2026-10.md, relevado el 17/10/2026).
//
// Bookmundo no tiene API: todo esto sale de su calculadora (covercalc / pricecalc) y de la vista previa real
// de la cubierta del libro de Imma (pedido JMBS3000000112287). Si Bookmundo cambia algo, se cambia acá.

/** Papeles del interior. Se pide crema: el fondo del PDF es blanco y el crema lo pone el papel. */
export type Papel = 'crema' | 'blanco' | 'semibrillante';

/**
 * Formato del libro. En tapa dura Bookmundo NO tiene A5: el de la misma proporción es 168×240 (×1,135),
 * así el diseño A5 se escala entero sin rediseñar y la letra queda más grande (lectores de 60+).
 */
export const FORMATO_TAPA_DURA = { anchoMm: 168, altoMm: 240, nombre: 'Mediano 2 (168 × 240)' } as const;

/**
 * Mínimo de páginas en tapa dura (calculadora 17/10: «menos de 87 hojas» en crema, 88 en blanco, 84 en
 * semibrillante). Se redondea a par: un libro tiene caras, no hojas sueltas.
 */
export const PAGINAS_MINIMAS_TAPA_DURA: Record<Papel, number> = { crema: 88, blanco: 88, semibrillante: 84 };

/** Lo que el cartón dobla hacia adentro en cada borde de la cubierta (calculadora: «sangrado 20,0 mm»). */
export const SOLAPA_CARTON_MM = 20;

/**
 * El lomo en papel crema, medido en la calculadora (17/10) para varias cantidades de páginas. No hay
 * fórmula oficial: entre dos medidas se interpola. Con otro papel varía unas décimas (88 págs: blanco 9,5,
 * semibrillante 9,7), menos que lo que Bookmundo tolera al ajustar la imagen.
 */
const LOMO_CREMA: [paginas: number, lomoMm: number][] = [
  [40, 7.2], [80, 9.2], [87, 9.5], [88, 9.6], [96, 9.9], [100, 10.1], [120, 11.1], [200, 15.0], [300, 19.8], [400, 24.7],
];

export function lomoMm(paginas: number): number {
  const t = LOMO_CREMA;
  if (paginas <= t[0][0]) return t[0][1];
  for (let i = 1; i < t.length; i++) {
    const [p1, l1] = t[i];
    if (paginas <= p1) {
      const [p0, l0] = t[i - 1];
      return Math.round((l0 + ((l1 - l0) * (paginas - p0)) / (p1 - p0)) * 10) / 10;
    }
  }
  // Más de 400: la última pendiente medida (≈0,049 mm por página).
  const [pa, la] = t[t.length - 2];
  const [pb, lb] = t[t.length - 1];
  return Math.round((lb + ((lb - la) * (paginas - pb)) / (pb - pa)) * 10) / 10;
}

/** Con lomo de menos de 6 mm Bookmundo no imprime texto en el lomo. */
export const LOMO_MINIMO_TEXTO_MM = 6;

export type MedidasCubierta = {
  /** Toda la imagen que se sube (plantilla FullEmpty), con lo que dobla el cartón. */
  anchoTotalMm: number;
  altoTotalMm: number;
  /** Cada tapa visible (contratapa y frente): el libro más el borde del cartón. */
  anchoTapaMm: number;
  altoTapaMm: number;
  lomoMm: number;
  solapaMm: number;
};

/**
 * La medida de la cubierta. OJO: la calculadora dice 2 × (ancho + 7) + lomo + 40 (399,6 × 280 con 88 págs),
 * pero la plantilla real de la vista previa mide 2 mm más (401,6 × 280): cada tapa es ancho + 8. Con la
 * medida de la calculadora Bookmundo estiraba la imagen. Se usa la de la vista previa.
 */
export function medidasCubierta(paginas: number, formato: { anchoMm: number; altoMm: number } = FORMATO_TAPA_DURA): MedidasCubierta {
  const lomo = lomoMm(paginas);
  const anchoTapa = formato.anchoMm + 8;
  const altoTapa = formato.altoMm;
  return {
    anchoTotalMm: Math.round((2 * anchoTapa + lomo + 2 * SOLAPA_CARTON_MM) * 10) / 10,
    altoTotalMm: altoTapa + 2 * SOLAPA_CARTON_MM,
    anchoTapaMm: anchoTapa,
    altoTapaMm: altoTapa,
    lomoMm: lomo,
    solapaMm: SOLAPA_CARTON_MM,
  };
}

/** Resolución de la cubierta (covercalc: «min. 250 DPI»). Se genera a 300. */
export const PPP_CUBIERTA = 300;

/**
 * Resolución de las fotos del interior. Bookmundo se contradice (ES: mínimo 150; EN: 200, «preferiblemente
 * 250 o más»): menos de 200 frena, entre 200 y 250 avisa.
 */
export const PPP_FOTO_MINIMO = 200;
export const PPP_FOTO_RECOMENDADO = 250;

/** Distancias mínimas de la tinta, en mm (corte con ±3 mm de tolerancia, T&C 7.11; lomo de tapa dura encolada). */
export const MARGENES_MINIMOS = {
  /** Texto del lado del lomo: el diseño lo pone a 21,6. */
  textoLomo: 20,
  /** Tinta oscura (texto, folios, cruces) del lado del lomo. */
  tintaLomo: 15,
  /** Tinta oscura contra el corte (arriba, abajo, afuera). */
  tintaCorte: 10,
  /** Cualquier tinta, aunque sea un adorno claro, del lado del lomo. */
  adornoLomo: 10,
} as const;

/** Tamaño máximo del archivo del interior (500 MB; más que eso va por WeTransfer). */
export const MAXIMO_BYTES_INTERIOR = 500 * 1024 * 1024;
