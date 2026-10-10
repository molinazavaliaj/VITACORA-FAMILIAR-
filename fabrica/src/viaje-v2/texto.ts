// Llena un texto del banco de viaje (docs/viajes-v2/banco.md, "Notación"):
// {{nombre}}, {{quien_regala}}, {{formato}}, {{fotos_album}}, {{pregunta}} y
// {{fotos_mandadas}} (AL3: cuántas fotos mandó al álbum).
// Puro. A diferencia de V3, si falta un dato que el texto usa, tira error:
// en viaje no hay revisión humana antes de mandar, y un "{{quien_regala}}"
// no puede llegar a un WhatsApp.

import { idiomaDe, IDIOMA_POR_DEFECTO, type Idioma } from './idioma.js';
import { paqueteDe } from './paquete.js';
import type { Compra } from './tipos.js';

export type DatosTexto = {
  nombre?: string;
  quien_regala?: string;
  formato?: string;
  fotos_album?: string;
  pregunta?: string;
  fotos_mandadas?: string;
};

const MARCA = /\{\{(\w+)\}\}/g;

/** "impreso" → "un libro impreso"; "pdf" → "un libro en PDF" (en cada idioma, del paquete). */
export function textoFormato(formato: Compra['formato'], idioma: Idioma = IDIOMA_POR_DEFECTO): string {
  return paqueteDe(idioma).formato[formato];
}

/** Lo que la compra pone en los textos. La {{pregunta}} se suma aparte, una por vez. */
export function datosDeCompra(compra: Compra): DatosTexto {
  return {
    nombre: compra.nombre,
    quien_regala: compra.regalo?.quienRegala,
    formato: textoFormato(compra.formato, idiomaDe(compra)),
    fotos_album: String(compra.fotosAlbum),
  };
}

/** Las marcas que usa un texto, en orden y sin repetir. */
export function marcasDe(texto: string): string[] {
  return [...new Set([...texto.matchAll(MARCA)].map((m) => m[1]))];
}

/** Abreviaturas que terminan en punto sin cerrar la oración ("Sr. {{nombre}}"). */
const ABREVIATURAS = /(^|[^\p{L}])(sr|sra|srta|dr|dra)\.\s+$/iu;

/**
 * ¿La marca que empieza en `i` abre una oración? Al principio del texto,
 * después de un salto de línea, o después de . ! ? … y un espacio (con ¿ o ¡
 * en el medio, si los hay). Después de "Sr.", "Sra.", "Dr."…, no.
 */
function abreOracion(texto: string, i: number): boolean {
  const antes = texto.slice(0, i).replace(/[¿¡]+$/, '');
  if (antes === '' || /\n[ \t]*$/.test(antes)) return true;
  return /[.!?…]\s+$/.test(antes) && !ABREVIATURAS.test(antes);
}

/**
 * Llena las marcas. Si una marca abre una oración y el valor empieza en
 * minúscula ("el teu pare", "su hija"), sube la primera letra: "El teu pare
 * ha volgut saber…". Vale para todos los idiomas y todas las marcas (Naza,
 * 05/10, con el catalán corregido). En medio de una oración queda tal cual.
 */
export function renderizar(texto: string, datos: DatosTexto): string {
  return texto.replace(MARCA, (_m, campo: string, i: number) => {
    const valor = (datos as Record<string, string | undefined>)[campo];
    if (valor === undefined || valor === '') {
      throw new Error(`Falta el dato {{${campo}}} para llenar: "${texto.slice(0, 60)}…"`);
    }
    return abreOracion(texto, i) ? valor.charAt(0).toLocaleUpperCase() + valor.slice(1) : valor;
  });
}
