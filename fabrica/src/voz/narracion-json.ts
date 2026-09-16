// El `narracion.json` que la fábrica deja en `{narrador}/paquete/` para que
// el worker de voz clonada (la PC de música) sepa qué texto narrar, capítulo
// por capítulo — ver docs del plan 2 de voz clonada, buzón + worker + fábrica.

/** Un capítulo listo para narrar: numerado en el orden final del libro, con
 *  el Markdown ya reducido a texto plano. */
export type CapituloNarracion = { numero: number; nombre: string; texto: string };

export type NarracionJson = {
  narrador_id: string;
  pedido_id: string;
  titulo: string;
  capitulos: CapituloNarracion[];
};

/**
 * Saca el Markdown mínimo que escribe `escribir-capitulo.ts` (títulos,
 * imágenes, épigrafes en cursiva de línea entera, y énfasis en negrita o
 * cursiva) y deja texto plano: lo que hay que narrar en voz alta, no lo que
 * hay que renderizar. Los párrafos siguen separados por una línea en blanco.
 */
export function markdownATextoPlano(markdown: string): string {
  const lineas = markdown.split(/\r?\n/).map((lineaCruda) => {
    const linea = lineaCruda.trim();
    if (/^#/.test(linea)) return '';
    if (/^!\[.*\]\(.*\)$/.test(linea)) return '';
    if (/^\*[^*]+\*$/.test(linea) || /^_[^_]+_$/.test(linea)) return '';
    return lineaCruda
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/_(.+?)_/g, '$1');
  });

  return lineas.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Arma el `narracion.json` para un pedido: numera los capítulos en el orden
 * final (el de `estructuraFinal.capitulos`, ya con la edición de la dueña
 * aplicada — ver `generarPaquete`) y deja el texto de cada uno en plano.
 */
export function armarNarracionJson(args: {
  narradorId: string;
  pedidoId: string;
  titulo: string;
  capitulos: { nombre: string; markdown: string }[];
}): NarracionJson {
  return {
    narrador_id: args.narradorId,
    pedido_id: args.pedidoId,
    titulo: args.titulo,
    capitulos: args.capitulos.map((capitulo, i) => ({
      numero: i + 1,
      nombre: capitulo.nombre,
      texto: markdownATextoPlano(capitulo.markdown),
    })),
  };
}
