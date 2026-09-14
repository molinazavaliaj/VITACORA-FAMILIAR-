// La edición final que la dueña deja en `narradores.edicion` (jsonb, la
// escribe la web — spec docs/panel-usuario.md §7.2). La fábrica aplica
// SOLO orden de capítulos, título, subtítulo y foto de tapa. `excluidas` y
// `correcciones` existen en el contrato pero se ignoran a propósito: una
// vez respondida una pregunta no se modifica nada (decisión de Naza,
// 13/09, ver docs/superpowers/specs/2026-09-13-fabrica-aprobacion-design.md).
//
// Nunca tira: un jsonb roto no puede tumbar un pedido pagado. Lo que no se
// entiende se descarta con un aviso y se usa el default.

export type Edicion = {
  ordenCapitulos: string[];
  titulo: string | null;
  subtitulo: string | null;
  portadaFotoId: string | null;
};

const EDICION_VACIA: Edicion = { ordenCapitulos: [], titulo: null, subtitulo: null, portadaFotoId: null };

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
  };
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
