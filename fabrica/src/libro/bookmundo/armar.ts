// El libro para Bookmundo tapa dura (o tapa blanda, la de las historias flacas), de punta a punta: interior,
// cubierta y su verificación.
// Es la receta del 17/10 (docs/bookmundo/receta-imprenta.md) hecha código. NO sube nada a Bookmundo
// (no tienen API): deja los archivos listos y el informe, y una persona los sube y pide el ejemplar.
import { construirHtmlLibro } from '../plantilla-html.js';
import { htmlAPdf } from '../pdf.js';
import { fuentesImprentaCss } from './fuentes.js';
import { FORMATO_TAPA_DURA, formatoDe, paginasMinimasDe, type Encuadernacion, type Papel } from './formato.js';
import { generarCubierta, type DatosCubierta, type ResultadoCubierta } from './cubierta.js';
import { verificarCubierta, verificarInterior, type Informe, type InformeInterior } from './verificar.js';

/** Lo mismo que recibe la plantilla del libro de pantalla (sin el modo, que lo pone esto). */
export type DatosLibro = Omit<Parameters<typeof construirHtmlLibro>[0], 'imprenta'>;

export type LibroBookmundo = {
  interior: Buffer;
  cubierta: ResultadoCubierta;
  informeInterior: InformeInterior;
  informeCubierta: Informe;
  ok: boolean;
  /** Qué marcar en Bookmundo para el interior: COLOR si alguna página tiene color (las fotos), si no BLANCO Y NEGRO. */
  color: boolean;
  /** El nombre del interior, que ya dice qué marcar: interior-168x240-COLOR.pdf o interior-168x240-BLANCO-Y-NEGRO.pdf. */
  archivoInterior: string;
  /** Los dos informes juntos, para leer antes de subir. */
  informe: string;
};

/** Los nombres de los archivos: llevan la medida, para que nadie suba uno de otro formato. */
export const ARCHIVOS_BOOKMUNDO = {
  /** El interior lleva en el nombre qué marcar en Bookmundo, para que un libro con fotos en color no se pida en blanco y negro. */
  interior: (color: boolean, formato: { anchoMm: number; altoMm: number } = FORMATO_TAPA_DURA) => `interior-${formato.anchoMm}x${formato.altoMm}-${color ? 'COLOR' : 'BLANCO-Y-NEGRO'}.pdf`,
  cubierta: 'cubierta.png',
  guias: 'cubierta-GUIAS-no-subir.png',
  informe: 'informe.txt',
} as const;

export async function armarLibroBookmundo(
  libro: DatosLibro,
  cubierta: Omit<DatosCubierta, 'paginas'>,
  /**
   * `sinNotas` («Vitácora de una historia»): el interior no se rellena con hojas de Notas hasta el mínimo; sale con
   * las páginas que tiene (más blancas hasta un número par), y si son menos que el mínimo, el informe lo dice.
   * `formato`: tapa dura (lo de siempre) o tapa blanda (170×240, la que se arma a mano).
   */
  o: { papel?: Papel; sinNotas?: boolean; formato?: Encuadernacion } = {},
): Promise<LibroBookmundo> {
  const papel = o.papel ?? 'crema';
  const encuadernacion = o.formato ?? 'tapa-dura';
  const formato = formatoDe(encuadernacion);
  const html = await construirHtmlLibro({
    ...libro,
    imprenta: {
      anchoMm: formato.anchoMm, altoMm: formato.altoMm, fuentesCss: fuentesImprentaCss(),
      paginasMinimas: o.sinNotas ? 0 : paginasMinimasDe(encuadernacion, papel), ...(o.sinNotas ? { sinNotas: true } : {}),
    },
  });
  const interior = await htmlAPdf(html, formato);
  const informeInterior = await verificarInterior(interior, { papel, formato, encuadernacion });
  // El lomo depende de las páginas que salieron de verdad, no de las que se esperaban.
  const datosCubierta: DatosCubierta = { ...cubierta, paginas: informeInterior.paginas, encuadernacion };
  const hecha = await generarCubierta(datosCubierta);
  const informeCubierta = verificarCubierta(hecha, { urlQr: cubierta.urlQr, paginas: informeInterior.paginas, encuadernacion });
  const ok = informeInterior.ok && informeCubierta.ok;
  const color = informeInterior.paginasColor.length > 0;
  const archivoInterior = ARCHIVOS_BOOKMUNDO.interior(color, formato);
  const informe = [
    color
      ? `>>> EN BOOKMUNDO MARCAR «COLOR». Tiene fotos en color (págs. ${informeInterior.paginasColor.join(', ')}). En blanco y negro saldrían en grises. <<<`
      : '>>> EN BOOKMUNDO MARCAR «BLANCO Y NEGRO». No tiene nada en color. <<<',
    '',
    informeInterior.texto,
    '',
    informeCubierta.texto,
    '',
    'Para pedirlo en Bookmundo (a mano: no tienen API):',
    `- Formato ${formato.nombre}, ${encuadernacion === 'tapa-blanda' ? 'tapa blanda' : 'tapa dura'}, papel ${papel}, ${informeInterior.paginas} páginas, interior en ${color ? `COLOR (${informeInterior.paginasColor.length} páginas con fotos en color)` : 'BLANCO Y NEGRO'}.`,
    `- Interior: ${archivoInterior}. Cubierta: ${ARCHIVOS_BOOKMUNDO.cubierta} con la plantilla FullEmpty (${ARCHIVOS_BOOKMUNDO.guias} es solo para mirar).`,
    '- Declarar el uso de IA (obligatorio en Bookmundo).',
    '- Sin ISBN ni publicar: es un libro privado.',
  ].join('\n');
  return { interior, cubierta: hecha, informeInterior, informeCubierta, ok, color, archivoInterior, informe };
}
