// Parser de docs/v3/banco-v3.md → filas tipadas. Lo usa el script
// `scripts/v3-banco-json.ts` para generar `banco-v3.json`; el test compara el
// JSON commiteado contra este parseo, así el JSON nunca queda viejo respecto
// del md (el md es la fuente: Naza aprueba los textos ahí).

export type Tamanio = 'B' | 'E' | 'E-joven' | 'C';
export type Clase = 'historia' | 'puerta' | 'valvula';

export type PreguntaBanco = {
  id: string;
  bloque: number; // 1-15
  orden: number; // posición en el banco (orden de envío dentro de todo el banco)
  texto: string;
  tipo: string; // la columna Tipo tal cual ("C:PAREJA_TERMINÓ · S")
  tamanio: Tamanio;
  clase: Clase;
  gate: string | null; // sin tildes: PAREJA_TERMINO, MIGRACION, HIJOS_MAS_DE_4…
  gateNegado: boolean; // C:¬DATO
  sensible: boolean;
  edadMin: number | null; // E:45+ / E:60+
  repite: 'hijo' | null; // "(una por hijo)"
};

/** Texto de la válvula "más", igual en todos los bloques que la llevan. */
export const TEXTO_VALVULA =
  'De lo que contaste de esta época, ¿hay algo que quieras contar más largo? Elegí vos y contalo.';

const ID_PREGUNTA = /^[A-Z]{2,3}\d+(\.\d+)?b?$/;

function sinTildes(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function celdas(linea: string): string[] {
  return linea
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

/** Lee la columna Tipo: "O", "C:¬HERMANOS", "C:PAREJA_TERMINÓ · S", "C:JUBILADO · E:45+", "C:HIJOS (una por hijo)". */
export function parsearTipo(tipo: string): Pick<PreguntaBanco, 'gate' | 'gateNegado' | 'sensible' | 'edadMin' | 'repite'> {
  let gate: string | null = null;
  let gateNegado = false;
  let sensible = false;
  let edadMin: number | null = null;
  const repite = /una por hijo/.test(tipo) ? 'hijo' : null;
  for (const parte of tipo.split('·').map((p) => p.trim())) {
    if (parte === 'S') sensible = true;
    const c = /^C:(¬)?([A-ZÁÉÍÓÚÑ_]+)(>4)?/.exec(parte);
    if (c) {
      gateNegado = c[1] === '¬';
      gate = sinTildes(c[2]) + (c[3] ? '_MAS_DE_4' : '');
    }
    const e = /^E:(\d+)\+/.exec(parte);
    if (e) edadMin = Number(e[1]);
  }
  return { gate, gateNegado, sensible, edadMin, repite };
}

/**
 * Recorre el md: las tablas de "### Bloque N" dan las filas de historia; la
 * tabla de "Cierres de bloque" da la puerta abierta (con su id) y, si la
 * columna Válvula dice "sí", una válvula con id `MAS{bloque}` (el md no le da
 * id propio). Se corta en "## Preguntas de datos".
 */
export function parsearBancoMd(md: string): PreguntaBanco[] {
  const filas: PreguntaBanco[] = [];
  let bloque: number | null = null;
  let enCierres = false;

  for (const linea of md.split(/\r?\n/)) {
    if (/^## Preguntas de datos/.test(linea)) break;
    const encabezado = /^### Bloque (\d+)/.exec(linea);
    if (encabezado) {
      bloque = Number(encabezado[1]);
      continue;
    }
    if (/^## Cierres de bloque/.test(linea)) {
      enCierres = true;
      bloque = null;
      continue;
    }
    if (!linea.startsWith('|')) continue;
    const c = celdas(linea);
    if (!ID_PREGUNTA.test(c[0] ?? '')) continue;

    if (enCierres && c.length >= 6) {
      const [id, bloqueTxt, texto, valvula, tamanio] = c;
      const b = Number(bloqueTxt);
      filas.push({
        id, bloque: b, orden: 0, texto, tipo: 'puerta', tamanio: tamanio as Tamanio, clase: 'puerta',
        gate: null, gateNegado: false, sensible: false, edadMin: null, repite: null,
      });
      if (valvula === 'sí') {
        filas.push({
          id: `MAS${b}`, bloque: b, orden: 0, texto: TEXTO_VALVULA, tipo: 'valvula', tamanio: 'E', clase: 'valvula',
          gate: null, gateNegado: false, sensible: false, edadMin: null, repite: null,
        });
      }
      continue;
    }
    if (bloque !== null && c.length >= 5) {
      const [id, texto, tipo, tamanio] = c;
      filas.push({ id, bloque, orden: 0, texto, tipo, tamanio: tamanio as Tamanio, clase: 'historia', ...parsearTipo(tipo) });
    }
  }

  // Orden de envío: por bloque; dentro del bloque, las de historia en el
  // orden de la tabla y al final la puerta y después la válvula.
  const peso = { historia: 0, puerta: 1, valvula: 2 } as const;
  const ordenadas = filas
    .map((f, i) => ({ f, i }))
    .sort((a, b) => a.f.bloque - b.f.bloque || peso[a.f.clase] - peso[b.f.clase] || a.i - b.i)
    .map(({ f }, i) => ({ ...f, orden: i + 1 }));
  return ordenadas;
}
