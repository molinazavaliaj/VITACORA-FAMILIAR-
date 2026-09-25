// La edición final que la dueña deja en `narradores.edicion` (jsonb, la
// escribe la web — spec docs/panel-usuario.md §7.2). La fábrica aplica
// orden de capítulos, título de cada capítulo (`titulosCapitulos`), título,
// subtítulo y foto de tapa, y desde el 25/09 (decisión D1 de Naza, que da
// vuelta la del 13/09) también lo que la familia excluye o corrige:
// - `excluidas` (ids de `respuestas`): quedan afuera del libro y del
//   audiolibro, igual que una reservada (`sinExcluidas`).
// - `correcciones` (texto libre): va a todos los pasos que escriben o revisan
//   el libro —escritor, editor, lector— con `seccionCorrecciones`.
//
// Nunca tira: un jsonb roto no puede tumbar un pedido pagado. Lo que no se
// entiende se descarta con un aviso y se usa el default.

export type Edicion = {
  ordenCapitulos: string[];
  titulo: string | null;
  subtitulo: string | null;
  portadaFotoId: string | null;
  /** Nombre del capítulo en el guion → título que eligió la dueña (ya
   *  recortado, nunca vacío). Los capítulos que no están acá conservan el
   *  nombre del guion. */
  titulosCapitulos: Record<string, string>;
  /** Ids de `respuestas` que la familia sacó del libro (sin repetidos). */
  excluidas: string[];
  /** Lo que la familia corrigió, en texto libre (recortado), o null si no escribió nada. */
  correcciones: string | null;
};

export const CORRECCIONES_MAXIMO = 4000;

const EDICION_VACIA: Edicion = {
  ordenCapitulos: [],
  titulo: null,
  subtitulo: null,
  portadaFotoId: null,
  titulosCapitulos: {},
  excluidas: [],
  correcciones: null,
};

function textoONull(valor: unknown, clave: string): string | null {
  if (valor === undefined || valor === null) return null;
  if (typeof valor !== 'string') {
    console.warn(`leerEdicion: "${clave}" no es texto, se ignora.`);
    return null;
  }
  const limpio = valor.trim();
  return limpio.length > 0 ? limpio : null;
}

export function leerEdicion(valor: unknown): Edicion {
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) {
    return { ...EDICION_VACIA };
  }
  const objeto = valor as Record<string, unknown>;

  let ordenCapitulos: string[] = [];
  if (objeto.ordenCapitulos !== undefined && objeto.ordenCapitulos !== null) {
    if (Array.isArray(objeto.ordenCapitulos)) {
      ordenCapitulos = objeto.ordenCapitulos.filter((n): n is string => typeof n === 'string');
    } else {
      console.warn('leerEdicion: "ordenCapitulos" no es una lista, se ignora.');
    }
  }

  return {
    ordenCapitulos,
    titulo: textoONull(objeto.titulo, 'titulo'),
    subtitulo: textoONull(objeto.subtitulo, 'subtitulo'),
    portadaFotoId: textoONull(objeto.portadaFotoId, 'portadaFotoId'),
    titulosCapitulos: leerTitulosCapitulos(objeto.titulosCapitulos),
    excluidas: leerExcluidas(objeto.excluidas),
    // El mismo tope que la web (web/src/lib/edicion.ts): un jsonb escrito a mano no infla los prompts.
    correcciones: textoONull(objeto.correcciones, 'correcciones')?.slice(0, CORRECCIONES_MAXIMO) ?? null,
  };
}

function leerExcluidas(valor: unknown): string[] {
  if (valor === undefined || valor === null) return [];
  if (!Array.isArray(valor)) {
    console.warn('leerEdicion: "excluidas" no es una lista, se ignora.');
    return [];
  }
  const ids = valor.filter((id): id is string => typeof id === 'string').map((id) => id.trim()).filter(Boolean);
  return [...new Set(ids)];
}

/**
 * Las excluidas como las entiende la familia. El tablero muestra una fila por pregunta —la respuesta
 * principal, sin sus repreguntas (web/src/app/tablero/[narradorId]/libro/page.tsx)— y dice "si hay
 * algo que no querés que salga, destildalo": destildar esa fila es sacar la pregunta entera, así que
 * una principal excluida se lleva las repreguntas de su misma orden. Una repregunta excluida por id
 * se va sola. Ante la duda, de menos.
 */
export function ampliarExcluidas(
  respuestas: { id?: string; pregunta_orden: number; es_repregunta?: boolean | null }[],
  excluidas: string[]
): string[] {
  if (excluidas.length === 0) return [];
  const fuera = new Set(excluidas);
  const ordenesFuera = new Set(respuestas.filter((r) => r.id && fuera.has(r.id) && !r.es_repregunta).map((r) => r.pregunta_orden));
  for (const r of respuestas) {
    if (r.id && r.es_repregunta && ordenesFuera.has(r.pregunta_orden)) fuera.add(r.id);
  }
  return [...fuera];
}

/**
 * Las respuestas sin las que la familia excluyó. Una excluida es como una reservada: no existe para
 * el libro (ni para el material, ni para la historia completa, ni para «Su voz», ni para el audio).
 */
export function sinExcluidas<T extends { id?: string }>(respuestas: T[], excluidas: Iterable<string>): T[] {
  const fuera = new Set(excluidas);
  if (fuera.size === 0) return [...respuestas];
  return respuestas.filter((r) => !(r.id && fuera.has(r.id)));
}

/**
 * Los capítulos sin lo que quedó vacío: una orden cuyas respuestas se fueron TODAS —excluidas por la
 * familia, o sin nada publicable según `publicable` (una reservada entera)— sale del capítulo, y un
 * capítulo que se queda sin órdenes sale del libro (escrito sin material, solo podría ser
 * inventado). Una orden que nunca tuvo respuestas propias queda: puede recibir un recuerdo de otro
 * tema (`tema_de_orden`). No muta la entrada.
 */
export function sinOrdenesExcluidas<T extends { ordenes: number[] }, R extends { id?: string; pregunta_orden: number }>(
  capitulos: T[],
  respuestas: R[],
  excluidas: Iterable<string>,
  publicable: (r: R) => boolean = () => true
): T[] {
  const fuera = new Set(excluidas);
  const porOrden = new Map<number, boolean[]>();
  for (const r of respuestas) {
    const ida = Boolean(r.id && fuera.has(r.id)) || !publicable(r);
    porOrden.set(r.pregunta_orden, [...(porOrden.get(r.pregunta_orden) ?? []), ida]);
  }
  const vaciada = (orden: number) => {
    const marcas = porOrden.get(orden);
    return Boolean(marcas && marcas.length > 0 && marcas.every(Boolean));
  };
  // Solo se cae el capítulo que PERDIÓ todas sus órdenes: uno que ya venía sin órdenes (o con
  // otra forma) no es asunto de esta función.
  return capitulos.flatMap((c) => {
    if (!Array.isArray(c.ordenes)) return [{ ...c }];
    const ordenes = c.ordenes.filter((o) => !vaciada(o));
    return ordenes.length === 0 && c.ordenes.length > 0 ? [] : [{ ...c, ordenes }];
  });
}

/**
 * La sección de las correcciones de la familia para los prompts del escritor, el editor y el
 * lector. Empieza con su propio salto de párrafo para que, vacía, el prompt quede byte por byte
 * como antes.
 */
export function seccionCorrecciones(correcciones: string | null | undefined): string {
  const texto = typeof correcciones === 'string' ? correcciones.trim() : '';
  if (!texto) return '';
  return `\n\nCORRECCIONES DE LA FAMILIA (mandan sobre lo que se transcribió; aplicalas donde corresponda, sin inventar nada más): ${texto}`;
}

// La web guarda solo títulos recortados y no vacíos (web/src/lib/edicion.ts),
// pero acá se limpia igual: un vacío o un no-texto no puede tumbar el pedido.
function leerTitulosCapitulos(valor: unknown): Record<string, string> {
  if (valor === undefined || valor === null) return {};
  if (typeof valor !== 'object' || Array.isArray(valor)) {
    console.warn('leerEdicion: "titulosCapitulos" no es un objeto, se ignora.');
    return {};
  }
  const titulos: Record<string, string> = {};
  for (const [capitulo, titulo] of Object.entries(valor as Record<string, unknown>)) {
    const limpio = textoONull(titulo, `titulosCapitulos.${capitulo}`);
    if (limpio !== null) titulos[capitulo] = limpio;
  }
  return titulos;
}

/**
 * Reordena los capítulos según los nombres que eligió la dueña. Los nombres
 * que no existen se ignoran; los capítulos que no nombró van al final, en
 * el orden que tenían. No muta la entrada.
 */
export function aplicarOrdenCapitulos<T extends { nombre: string }>(capitulos: T[], orden: string[]): T[] {
  if (orden.length === 0) return [...capitulos];
  const porNombre = new Map(capitulos.map((c) => [c.nombre, c]));
  const elegidos: T[] = [];
  const vistos = new Set<string>();
  for (const nombre of orden) {
    const capitulo = porNombre.get(nombre);
    if (!capitulo || vistos.has(nombre)) continue;
    vistos.add(nombre);
    elegidos.push(capitulo);
  }
  const resto = capitulos.filter((c) => !vistos.has(c.nombre));
  return [...elegidos, ...resto];
}

/**
 * Pone a cada capítulo el título que eligió la dueña (por nombre del guion)
 * y guarda el original en `nombreGuion`, que es la clave con la que las
 * fotos y las preguntas siguen apuntando al capítulo. Los nombres que no
 * están en `titulos` quedan como estaban. No muta la entrada.
 */
export function aplicarTitulosCapitulos<T extends { nombre: string }>(
  capitulos: T[],
  titulos: Record<string, string>
): (T & { nombreGuion: string })[] {
  return capitulos.map((capitulo) => ({
    ...capitulo,
    nombre: titulos[capitulo.nombre] ?? capitulo.nombre,
    nombreGuion: capitulo.nombre,
  }));
}
