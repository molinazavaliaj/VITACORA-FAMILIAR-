// Los dos PDF A5 del libro de Kids: el libro y el sobre cerrado (aparte, decisión 6), con htmlAPdf de la casa.
import { htmlAPdf } from '../../libro/pdf.js';
import { htmlLibroKids, htmlSobreKids, type OpcionesHtml } from './html.js';
import type { LibroKids } from './libro-md.js';

export type PdfsKids = { libroHtml: string; sobreHtml: string; libro: Buffer; sobre: Buffer };

export async function pdfsKids(l: LibroKids, o: OpcionesHtml & { aPdf?: (html: string) => Promise<Buffer> }): Promise<PdfsKids> {
  const aPdf = o.aPdf ?? htmlAPdf;
  const libroHtml = await htmlLibroKids(l, o);
  const sobreHtml = htmlSobreKids(l, o);
  return { libroHtml, sobreHtml, libro: await aPdf(libroHtml), sobre: await aPdf(sobreHtml) };
}
