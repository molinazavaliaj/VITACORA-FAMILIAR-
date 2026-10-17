// El libro para Bookmundo tapa dura, de punta a punta: interior, cubierta y su verificación.
// Es la receta del 17/10 (docs/bookmundo/receta-imprenta.md) hecha código. NO sube nada a Bookmundo
// (no tienen API): deja los archivos listos y el informe, y una persona los sube y pide el ejemplar.
import { construirHtmlLibro } from '../plantilla-html.js';
import { htmlAPdf } from '../pdf.js';
import { fuentesImprentaCss } from './fuentes.js';
import { FORMATO_TAPA_DURA, PAGINAS_MINIMAS_TAPA_DURA, type Papel } from './formato.js';
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
  /** Los dos informes juntos, para leer antes de subir. */
  informe: string;
};

/** Los nombres de los archivos: llevan la medida, para que nadie suba uno de otro formato. */
export const ARCHIVOS_BOOKMUNDO = {
  interior: `interior-${FORMATO_TAPA_DURA.anchoMm}x${FORMATO_TAPA_DURA.altoMm}.pdf`,
  cubierta: 'cubierta.png',
  guias: 'cubierta-GUIAS-no-subir.png',
  informe: 'informe.txt',
} as const;

export async function armarLibroBookmundo(
  libro: DatosLibro,
  cubierta: Omit<DatosCubierta, 'paginas'>,
  o: { papel?: Papel } = {},
): Promise<LibroBookmundo> {
  const papel = o.papel ?? 'crema';
  const formato = FORMATO_TAPA_DURA;
  const html = await construirHtmlLibro({
    ...libro,
    imprenta: { anchoMm: formato.anchoMm, altoMm: formato.altoMm, paginasMinimas: PAGINAS_MINIMAS_TAPA_DURA[papel], fuentesCss: fuentesImprentaCss() },
  });
  const interior = await htmlAPdf(html, formato);
  const informeInterior = await verificarInterior(interior, { papel, formato });
  // El lomo depende de las páginas que salieron de verdad, no de las que se esperaban.
  const datosCubierta: DatosCubierta = { ...cubierta, paginas: informeInterior.paginas };
  const hecha = await generarCubierta(datosCubierta);
  const informeCubierta = verificarCubierta(hecha, { urlQr: cubierta.urlQr, paginas: informeInterior.paginas });
  const ok = informeInterior.ok && informeCubierta.ok;
  const informe = [
    informeInterior.texto,
    '',
    informeCubierta.texto,
    '',
    'Para pedirlo en Bookmundo (a mano: no tienen API):',
    `- Formato ${formato.nombre}, tapa dura, papel ${papel}, ${informeInterior.paginas} páginas, interior en ${informeInterior.paginasColor.length ? `COLOR (${informeInterior.paginasColor.length} páginas con fotos en color)` : 'BLANCO Y NEGRO'}.`,
    `- Interior: ${ARCHIVOS_BOOKMUNDO.interior}. Cubierta: ${ARCHIVOS_BOOKMUNDO.cubierta} con la plantilla FullEmpty (${ARCHIVOS_BOOKMUNDO.guias} es solo para mirar).`,
    '- Declarar el uso de IA (obligatorio en Bookmundo).',
    '- Sin ISBN ni publicar: es un libro privado.',
  ].join('\n');
  return { interior, cubierta: hecha, informeInterior, informeCubierta, ok, informe };
}
