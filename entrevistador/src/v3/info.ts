// El botón INFO de la bienvenida: la segunda capa de la información (18/10).
//
// Por qué existe: la revisión legal del 17/10 acepta informar por capas —lo
// esencial en la plantilla, el detalle a un paso— pero avisa que, para una
// persona de 80 años, un enlace a la web es una segunda capa débil porque
// probablemente no lo abra. La salida es traerle el detalle por el mismo canal
// donde da el permiso: toca INFO y le llega acá.
//
// Es gratis: su mensaje abre la ventana de 24 h de Meta, así que la respuesta
// sale como texto libre y no como plantilla.
//
// Qué NO hace, a propósito:
//   - No cuenta como respuesta: la fila va con SIN_CLAVE_V3, igual que un
//     botón suelto. Pedir información no es contestar una pregunta.
//   - No da el permiso ni lo quita: después de leer, sigue pudiendo tocar SÍ
//     o NO. El texto se lo recuerda al final.
//   - No reactiva a un pausado ni toca la pregunta abierta.
//
// El texto vive en textos-fijos.json, clave `info`, uno por idioma. Sin texto
// en su idioma no sale nada (misma regla que el resto de los textos fijos).

import { conReintento } from './estado.js';
import { normalizar } from './nucleo/entrevista/respuesta.js';
import { textoFijo } from './textos-fijos.js';
import { fichaTexto, type FilaV3 } from './tipos.js';
import { anotarVisto, encolar, yaVisto } from './turno.js';

/** El botón de la bienvenida, tal como va en la plantilla de Meta. */
export const BOTON_INFO = 'INFO';

/**
 * ¿Pide la segunda capa? El botón manda el texto exacto «INFO», y aceptamos
 * también que lo escriba. Nada más: no queremos que una respuesta que
 * mencione la palabra se coma el turno.
 */
export function pideInfo(texto: string): boolean {
  return normalizar(texto).trim() === 'info';
}

/**
 * Deja el texto de la segunda capa en la cola. Devuelve false si no hay texto
 * en ese idioma: el que llama lo trata como un mensaje cualquiera.
 */
export async function encolarInfo(db: Parameters<typeof conReintento>[0], fila: FilaV3, waMessageId: string): Promise<boolean> {
  const texto = textoFijo('info', fila.idioma, fichaTexto(fila));
  if (!texto) return false;
  await conReintento(db, fila.narrador_id, (f) => {
    if (yaVisto(f.estado, waMessageId)) return null;
    return { cambio: { estado: anotarVisto(encolar(f.estado, { texto, tipo: 'suelto' }), waMessageId) }, resultado: true };
  });
  return true;
}
