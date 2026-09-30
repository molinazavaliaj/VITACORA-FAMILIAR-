// Llena un texto del banco de viaje (docs/viajes-v2/banco.md, "Notación"):
// {{nombre}}, {{quien_regala}}, {{formato}}, {{fotos_album}}, {{pregunta}} y
// {{fotos_mandadas}} (AL3: cuántas fotos mandó al álbum).
// Puro. A diferencia de V3, si falta un dato que el texto usa, tira error:
// en viaje no hay revisión humana antes de mandar, y un "{{quien_regala}}"
// no puede llegar a un WhatsApp.

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

/** "impreso" → "un libro impreso"; "pdf" → "un libro en PDF". */
export function textoFormato(formato: Compra['formato']): string {
  return formato === 'impreso' ? 'un libro impreso' : 'un libro en PDF';
}

/** Lo que la compra pone en los textos. La {{pregunta}} se suma aparte, una por vez. */
export function datosDeCompra(compra: Compra): DatosTexto {
  return {
    nombre: compra.nombre,
    quien_regala: compra.regalo?.quienRegala,
    formato: textoFormato(compra.formato),
    fotos_album: String(compra.fotosAlbum),
  };
}

/** Las marcas que usa un texto, en orden y sin repetir. */
export function marcasDe(texto: string): string[] {
  return [...new Set([...texto.matchAll(MARCA)].map((m) => m[1]))];
}

export function renderizar(texto: string, datos: DatosTexto): string {
  return texto.replace(MARCA, (_m, campo: string) => {
    const valor = (datos as Record<string, string | undefined>)[campo];
    if (valor === undefined || valor === '') {
      throw new Error(`Falta el dato {{${campo}}} para llenar: "${texto.slice(0, 60)}…"`);
    }
    return valor;
  });
}
