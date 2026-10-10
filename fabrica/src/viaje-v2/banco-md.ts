// Parser de docs/viajes-v2/banco.md → filas tipadas. Lo usa el script
// `scripts/viaje-v2-json.ts` para generar `banco.json`; un test compara el
// json commiteado contra este parseo, así nunca queda viejo respecto del md
// (el md es la fuente: Naza aprueba los textos ahí).
//
// Solo se leen las tablas con el encabezado exacto
// | ID | Momento | Orden | Texto | Ya de viaje |
// (las de Notación tienen otros encabezados y se saltean). Se corta en
// "## Reglas del flujo".

export const MOMENTOS = [
  'arranque',
  'antes',
  'salida',
  'dia-siguiente-salida',
  'noche-comienzo',
  'noche-puerta',
  'noche-cierre',
  'mediodia',
  'ultima-noche',
  'vuelta',
  'dia-siguiente-vuelta',
  'noche-casa',
  'album',
  'acuse-noche',
  'acuse-mediodia',
  'acuse-antes',
  'caso',
  'atraso',
  'propia',
  'despedida',
] as const;

export type Momento = (typeof MOMENTOS)[number];

export type FilaBanco = {
  id: string; // BIEN-1, AS1, NO5, ACM2, DES+…
  momento: Momento;
  orden: number | null; // vacío en el md → null
  texto: string; // tal cual el md, con sus marcas {{…}}
  yaDeViaje: string | null; // variante para cuando ya salió (solo las de antes de salir)
};

const ENCABEZADO = ['ID', 'Momento', 'Orden', 'Texto', 'Ya de viaje'];

function celdas(linea: string): string[] {
  return linea
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

const esSeparador = (c: string[]) => c.every((x) => /^:?-+:?$/.test(x));

export function parsearBancoViajeMd(md: string): FilaBanco[] {
  const filas: FilaBanco[] = [];
  const vistos = new Set<string>();
  let enTabla = false;

  for (const linea of md.split(/\r?\n/)) {
    if (/^## Reglas del flujo/.test(linea)) break;
    if (!linea.startsWith('|')) {
      enTabla = false;
      continue;
    }
    const c = celdas(linea);
    if (c.join('|') === ENCABEZADO.join('|')) {
      enTabla = true;
      continue;
    }
    if (!enTabla || esSeparador(c)) continue;

    const id = c[0];
    if (c.length !== ENCABEZADO.length) throw new Error(`${id}: la fila tiene ${c.length} columnas y van ${ENCABEZADO.length}`);
    const [, momento, orden, texto, yaDeViaje] = c;
    if (!(MOMENTOS as readonly string[]).includes(momento)) throw new Error(`${id}: Momento desconocido "${momento}"`);
    if (orden !== '' && !/^\d+$/.test(orden)) throw new Error(`${id}: Orden no es un número: "${orden}"`);
    if (vistos.has(id)) throw new Error(`${id}: ID repetido en el banco`);
    if (texto === '') throw new Error(`${id}: sin texto`);
    vistos.add(id);
    filas.push({
      id,
      momento: momento as Momento,
      orden: orden === '' ? null : Number(orden),
      texto,
      yaDeViaje: yaDeViaje === '' ? null : yaDeViaje,
    });
  }
  return filas;
}
