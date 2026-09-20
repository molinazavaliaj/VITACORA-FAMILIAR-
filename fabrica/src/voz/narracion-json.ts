// El `narracion.json` que la fábrica deja en `{narrador}/paquete/` para que
// el worker de voz clonada (la PC de música) sepa qué narrar, capítulo por
// capítulo — ver docs del plan 2 de voz clonada, buzón + worker + fábrica.
//
// Versión 2 (decisión de los socios, 20/09): el audiolibro clonado es
// HÍBRIDO. Las historias van con el audio REAL del narrador (el worker lo
// restaura) y la voz clonada narra solo el anuncio del capítulo y los
// "conectores" entre historias. Un capítulo sin ningún audio (respondió
// escribiendo) sigue narrándose entero con la voz clonada, como en la v1.
// El formato es contrato con el worker: ver supabase/CONTRATO.md,
// "narracion.json v2 — audiolibro híbrido".

/** Una respuesta con audio, en el orden del libro: lo que el worker pega tal cual (restaurado). */
export type HistoriaNarracion = {
  respuesta_id: string;
  pregunta_orden: number;
  es_repregunta: boolean;
  audio_path: string;
  /** `duracion_segundos` redondeado; 0 si no se sabía. */
  segundos: number;
  pregunta: string;
  /** La transcripción (o el texto directo); vacío si no hay ninguna. */
  texto: string;
};

/** Lo que narra la voz clonada alrededor de las historias: `entre[k]` va de la historia k a la k+1. */
export type ConectoresNarracion = { entrada: string; entre: string[]; salida: string };

/** Un capítulo listo para narrar: numerado en el orden final del libro, con
 *  el Markdown ya reducido a texto plano. `hibrido` trae historias y
 *  conectores; `clonado` (sin audio) solo el texto. */
export type CapituloNarracion = {
  numero: number;
  nombre: string;
  texto: string;
  modo: 'hibrido' | 'clonado';
  historias?: HistoriaNarracion[];
  conectores?: ConectoresNarracion;
};

export type NarracionJson = {
  version: 2;
  narrador_id: string;
  pedido_id: string;
  titulo: string;
  capitulos: CapituloNarracion[];
};

/**
 * Saca el Markdown que puede traer un capítulo y deja texto plano: lo que
 * hay que narrar en voz alta, no lo que hay que renderizar. `escribir-
 * capitulo.ts` solo pide párrafos y `> cita` para las frases textuales más
 * potentes (ver `capituloMarkdownAHtml`, que le da el mismo trato: la cita
 * queda como su propio párrafo, sin el `>`); también se sacan títulos,
 * imágenes, épigrafes en cursiva de línea entera y énfasis en negrita o
 * cursiva, por si aparecen. Los párrafos siguen separados por una línea en
 * blanco.
 */
export function markdownATextoPlano(markdown: string): string {
  const lineas = markdown.split(/\r?\n/).map((lineaCruda) => {
    const linea = lineaCruda.trim();
    if (/^#/.test(linea)) return '';
    if (/^!\[.*\]\(.*\)$/.test(linea)) return '';
    if (/^\*[^*]+\*$/.test(linea) || /^_[^_]+_$/.test(linea)) return '';
    const sinCita = lineaCruda.replace(/^\s*>\s?/, '');
    return sinCita
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/_(.+?)_/g, '$1');
  });

  return lineas.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Arma el `narracion.json` (v2) para un pedido: numera los capítulos en el
 * orden final (el de `estructuraFinal.capitulos`, ya con la edición de la
 * dueña aplicada — ver `generarPaquete`) y deja el texto de cada uno en
 * plano. Un capítulo con al menos una historia (respuesta con audio) sale
 * `hibrido`, con sus historias y conectores; sin historias, `clonado`.
 *
 * Cuida el contrato antes de escribirlo: un híbrido sin conectores, o con
 * una cantidad de puentes que no es historias − 1, tira — mejor que el
 * pedido caiga a 'fallido' acá que el worker narre un capítulo a medias.
 */
export function armarNarracionJson(args: {
  narradorId: string;
  pedidoId: string;
  titulo: string;
  capitulos: { nombre: string; markdown: string; historias?: HistoriaNarracion[]; conectores?: ConectoresNarracion }[];
}): NarracionJson {
  return {
    version: 2,
    narrador_id: args.narradorId,
    pedido_id: args.pedidoId,
    titulo: args.titulo,
    capitulos: args.capitulos.map((capitulo, i) => {
      const numero = i + 1;
      const base = { numero, nombre: capitulo.nombre, texto: markdownATextoPlano(capitulo.markdown) };
      const historias = capitulo.historias ?? [];
      if (historias.length === 0) return { ...base, modo: 'clonado' as const };

      const conectores = capitulo.conectores;
      if (!conectores) {
        throw new Error(`narracion.json: el capítulo ${numero} («${capitulo.nombre}») tiene historias pero no conectores`);
      }
      if (conectores.entre.length !== historias.length - 1) {
        throw new Error(
          `narracion.json: el capítulo ${numero} («${capitulo.nombre}») tiene ${historias.length} historias pero ${conectores.entre.length} conectores entre (esperaba ${historias.length - 1})`
        );
      }
      return { ...base, modo: 'hibrido' as const, historias, conectores };
    }),
  };
}
