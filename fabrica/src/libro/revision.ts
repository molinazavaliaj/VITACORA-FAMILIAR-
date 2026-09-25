import type { SupabaseClient } from '@supabase/supabase-js';
import type { AvisoLector } from './lector.js';
import { avisarSocios } from '../mail/socios.js';
import { escaparHtml, subirTexto } from './comun.js';

// La revisión (diseño §3.3, decisión de Naza): con avisos el libro ESPERA y los dueños reciben el
// detalle. Un invento impreso no tiene arreglo. Nada de esto le llega a la familia.

export type InformeRevision = {
  narrador: string; lector: AvisoLector[]; control: string[]; lectorFallo: boolean;
  /** Por qué falló el lector (ej. "cortada por el tope de tokens"), cuando se sabe. */
  lectorMotivo?: string;
  fecha: string;
};

/** Dónde queda el informe en Storage: mismo lugar que los borradores del narrador. */
export const RUTA_REVISION = (narradorId: string) => `${narradorId}/paquete/revision.json`;

/** ¿Hay que frenar antes de imprimir? Cualquier aviso del lector, cualquier control disparado, o que el lector directamente no haya podido leer. */
export function hayQueRevisar(i: InformeRevision): boolean {
  return i.lectorFallo || i.lector.length > 0 || i.control.length > 0;
}

/** La línea del lector para el informe de la prueba (y cualquier resumen corto). */
export function lineaDelLector(i: InformeRevision): string {
  if (i.lectorFallo) return i.lectorMotivo ? `⚠ el lector final falló: ${i.lectorMotivo}` : '⚠ no devolvió una lista: revisar a mano';
  return i.lector.length ? `${i.lector.length} aviso(s)` : 'sin avisos';
}

/** El mail a los socios (MAIL_SOCIOS, no la familia) con el detalle para decidir sin tener que ir a mirar la base. */
export function mailDeRevision(i: InformeRevision, pedidoId: string): { asunto: string; html: string } {
  const filas = i.lector
    .map(
      (a) =>
        `<li><b>${escaparHtml(a.capitulo)}</b> — «${escaparHtml(a.frase)}» — <i>${escaparHtml(a.problema)}</i>: ${escaparHtml(a.evidencia)}</li>`
    )
    .join('');
  const control = i.control.map((c) => `<li>${escaparHtml(c)}</li>`).join('');
  const html = `<p>El libro de <b>${escaparHtml(i.narrador)}</b> (pedido ${escaparHtml(pedidoId)}) <b>espera</b> a que uno de ustedes lo mire antes de entregarse.</p>
${i.lectorFallo ? `<p>⚠ El lector final no pudo leerlo (${escaparHtml(i.lectorMotivo ?? 'no devolvió una lista')}): revisar a mano.</p>` : ''}
${filas ? `<p>Lo que vio el lector:</p><ul>${filas}</ul>` : ''}
${control ? `<p>Controles:</p><ul>${control}</ul>` : ''}
<p>Para seguir: corregir a mano, rehacer el capítulo señalado, o entregar igual (desde el panel de la empresa; mientras no exista, con la fábrica a mano).</p>`;
  return { asunto: `Libro de ${i.narrador} en revisión: ${i.lector.length + i.control.length} aviso(s)`, html };
}

/**
 * Deja el pedido en revisión: sube el informe a Storage, mueve el pedido a 'revision' y avisa a los
 * socios por mail con el detalle. Si el update del pedido falla, se corta ahí (no se manda mail):
 * un aviso sin el pedido realmente frenado sería peor que ningún aviso.
 *
 * OJO: 'revision' como estado de `pedidos` todavía no tiene la constraint de la base (la migración es
 * la Tarea 14, la aplica Naza). Hasta que esté aplicada, este update falla con la constraint vieja.
 */
export async function dejarEnRevision(
  db: SupabaseClient,
  pedidoId: string,
  narradorId: string,
  informe: InformeRevision
): Promise<void> {
  await subirTexto(db, RUTA_REVISION(narradorId), JSON.stringify(informe, null, 2), 'application/json');
  const { error } = await db.from('pedidos').update({ estado: 'revision' }).eq('id', pedidoId);
  if (error) throw new Error(`No se pudo dejar el pedido ${pedidoId} en revisión: ${error.message}`);
  const { asunto, html } = mailDeRevision(informe, pedidoId);
  await avisarSocios(asunto, html);
}
