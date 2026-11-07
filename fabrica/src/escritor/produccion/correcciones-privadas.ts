// Lo que quien regala escribe en «Correcciones», en un libro privado (Naza, 06/11; CONTRATO, «Lo contado es privado»).
// Quien regala no conoce lo que contó el narrador, y sus correcciones son solo de datos. Como en la Etapa B cada corrección
// manda en todos los pasos, en un privado no entra ninguna sola: el texto les llega a los socios, que lo aplican a mano si
// corresponde. Sin llamar a ningún modelo. Si crece el volumen, se revisa.
import type { Almacen } from '../almacen/tipos.js';
import type { CorreccionFamilia } from '../material/a-carpeta.js';
import { avisarSocios } from './avisos.js';
import { esPrivado } from './privacidad.js';

/** El texto que ya se les mandó a los socios. Si quien regala lo cambia antes de que se escriba, se les vuelve a mandar. */
export const CORRECCIONES_AVISADAS = 'correcciones-avisadas-socios.txt';

/**
 * Las correcciones de quien regala que entran a la Etapa B: todas si el libro no es privado, ninguna si lo es. Nunca tira
 * por el aviso, porque el libro no se frena por un mail: la marca se escribe solo si salió, así que se reintenta.
 */
export async function correccionesDeQuienRegalo(
  almacen: Almacen,
  narradorId: string,
  o: { contexto: unknown; quien: () => Promise<string>; correcciones: CorreccionFamilia[] },
): Promise<CorreccionFamilia[]> {
  if (!esPrivado(o.contexto)) return o.correcciones;
  const texto = o.correcciones.map((c) => c.texto.trim()).filter(Boolean).join('\n');
  if (!texto) return [];
  try {
    if ((await almacen.leer(CORRECCIONES_AVISADAS)) === texto) return [];
    const salio = await avisarSocios(
      `Correcciones de quien regaló en el libro de ${await o.quien()}`,
      `El libro es privado, así que estas correcciones no se aplican solas y el libro se escribe sin ellas. Son solo de datos. Si alguna hay que aplicarla, frená el pedido ahora y cargala a mano en correcciones.json. No apliques lo que pida sacar una historia, cambiar lo que dijo el narrador o cambiar el tono.\n\n${texto}\n\n(${narradorId})`,
    );
    if (salio) await almacen.escribir(CORRECCIONES_AVISADAS, texto);
  } catch (err) {
    console.error(`correcciones de ${narradorId}: no pude avisar a los socios:`, err instanceof Error ? err.message : err);
  }
  return [];
}
