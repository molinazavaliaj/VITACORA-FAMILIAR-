// Parser de docs/v3/entrevista/banco.md → filas tipadas. Lo usa el script
// `scripts/v3-entrevista-json.ts` para generar `banco.json`; un test compara
// el json commiteado contra este parseo, así nunca queda viejo respecto del
// md (el md es la fuente: Naza aprueba los textos ahí).

export type Parte = 'nucleo' | 'extra';
export type Clase = 'historia' | 'cierre' | 'aviso' | 'foto' | 'final';

/** Una condición de "Depende de": `si:X` (X no fue un "no" corto) o `sino:X` (X fue un "no" corto). */
export type Condicion = { tipo: 'si' | 'sino'; de: string };

/** Qué vale tocar un botón: "sí" (contame), "no" (un "no" corto) o "paso" (Naza, 30/09, simulaciones). */
export type ValeBoton = 'si' | 'no' | 'paso';

/** Un botón de respuesta de WhatsApp debajo de la pregunta (sección "## Botones" del banco). */
export type Boton = { texto: string; vale: ValeBoton };

/** Lo que acepta WhatsApp en los botones de respuesta: hasta 3 por mensaje y hasta 20 letras cada uno. */
export const MAX_BOTONES = 3;
export const MAX_LETRAS_BOTON = 20;

export type PreguntaEntrevista = {
  id: string;
  bloque: number; // 1-15
  orden: number; // posición en todo el banco (orden de envío), desde 1
  texto: string; // tal cual el md, con sus marcas ({{o/a}}, «sino:X: a ‖ b»…)
  depende: Condicion[]; // OR: alcanza con que se cumpla una; vacío = a todos
  parte: Parte;
  clase: Clase;
  sensible: boolean;
  /** Los botones de respuesta, si lleva (Naza, 30/09, simulaciones). Sin botones, la propiedad no está. */
  botones?: Boton[];
};

export type MensajeEntrevista = {
  id: string; // BIEN, M6, M1, M3.1…
  cuando: string;
  texto: string;
};

export type BancoEntrevista = {
  preguntas: PreguntaEntrevista[];
  mensajes: MensajeEntrevista[];
  nombresBloque: Record<number, string>;
};

const ID = /^[A-Z]{1,4}\d*(\.\d+)?b?$/;
const CLASES: readonly Clase[] = ['historia', 'cierre', 'aviso', 'foto', 'final'];

/** `<br>` en una celda es un salto de línea en el mensaje (la bienvenida tiene párrafos). */
function saltos(texto: string): string {
  return texto.replace(/<br>/g, '\n');
}

function celdas(linea: string): string[] {
  return linea
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

/** Lee la columna "Depende de": "", "si:AM0", "sino:AM9 o si:AM16". Tira error si no respeta la sintaxis. */
export function parsearDepende(celda: string): Condicion[] {
  const t = celda.trim();
  if (t === '') return [];
  return t.split(' o ').map((parte) => {
    const m = /^(si|sino):([A-Z]{1,4}\d*(?:\.\d+)?b?)$/.exec(parte.trim());
    if (!m) throw new Error(`"Depende de" mal escrito: "${celda}"`);
    return { tipo: m[1] as 'si' | 'sino', de: m[2] };
  });
}

function parsearParte(celda: string, id: string): Parte {
  if (celda === 'núcleo') return 'nucleo';
  if (celda === 'extra') return 'extra';
  throw new Error(`${id}: Parte desconocida "${celda}"`);
}

function parsearClase(celda: string, id: string): Clase {
  if ((CLASES as readonly string[]).includes(celda)) return celda as Clase;
  throw new Error(`${id}: Clase desconocida "${celda}"`);
}

const VALE: Record<string, ValeBoton> = { sí: 'si', no: 'no', paso: 'paso' };

/**
 * Pega los botones de la sección "## Botones" a sus preguntas, validando lo
 * que WhatsApp acepta (Naza, 30/09, simulaciones): la pregunta existe, "Vale
 * como" es sí / no / paso, hasta 3 botones y hasta 20 letras cada uno.
 */
function pegarBotones(preguntas: PreguntaEntrevista[], filas: string[][]): void {
  const porId = new Map(preguntas.map((p) => [p.id, p]));
  for (const [id, texto, valeComo] of filas) {
    const p = porId.get(id);
    if (!p) throw new Error(`Botón "${texto}": la pregunta ${id} no existe`);
    const vale = VALE[valeComo];
    if (!vale) throw new Error(`${id}: "Vale como" desconocido "${valeComo}" (va sí, no o paso)`);
    if ([...texto].length > MAX_LETRAS_BOTON) throw new Error(`${id}: el botón "${texto}" tiene más de ${MAX_LETRAS_BOTON} letras`);
    const botones = (p.botones ??= []);
    botones.push({ texto, vale });
    if (botones.length > MAX_BOTONES) throw new Error(`${id}: más de ${MAX_BOTONES} botones`);
  }
}

/**
 * Recorre el md: "## Arranque", "## Mensajes fijos" y "## Entradas de bloque" dan los mensajes
 * (ID | Cuándo | Texto); cada "## Bloque N · Nombre" da sus preguntas
 * (ID | Pregunta | Depende de | Parte | Clase | Sensible); "## Botones" da
 * los botones de cada pregunta (ID | Botón | Vale como). Se corta en
 * "## Reglas del flujo". El orden es el de las tablas.
 */
export function parsearEntrevistaMd(md: string): BancoEntrevista {
  const preguntas: PreguntaEntrevista[] = [];
  const mensajes: MensajeEntrevista[] = [];
  const nombresBloque: Record<number, string> = {};
  const filasBotones: string[][] = [];
  let seccion: 'mensajes' | 'bloque' | 'botones' | null = null;
  let bloque = 0;

  for (const linea of md.split(/\r?\n/)) {
    if (/^## Reglas del flujo/.test(linea)) break;
    const b = /^## Bloque (\d+) · (.+)$/.exec(linea);
    if (b) {
      bloque = Number(b[1]);
      nombresBloque[bloque] = b[2].trim();
      seccion = 'bloque';
      continue;
    }
    if (/^## (Arranque|Mensajes fijos|Entradas de bloque)/.test(linea)) {
      seccion = 'mensajes';
      continue;
    }
    if (/^## Botones/.test(linea)) {
      seccion = 'botones';
      continue;
    }
    if (/^## /.test(linea)) {
      seccion = null;
      continue;
    }
    if (!linea.startsWith('|') || seccion === null) continue;
    const c = celdas(linea);
    if (c[0] === 'ID' || !ID.test(c[0] ?? '')) continue; // encabezado o separador

    if (seccion === 'botones') {
      filasBotones.push(c);
      continue;
    }
    if (seccion === 'mensajes') {
      const [id, cuando, texto] = c;
      mensajes.push({ id, cuando, texto: saltos(texto) });
      continue;
    }
    if (c.length !== 6) throw new Error(`${c[0]}: la fila tiene ${c.length} columnas y van 6`);
    const [id, texto, depende, parte, clase, sensible] = c;
    preguntas.push({
      id,
      bloque,
      orden: preguntas.length + 1,
      texto,
      depende: parsearDepende(depende),
      parte: parsearParte(parte, id),
      clase: parsearClase(clase, id),
      sensible: sensible === 'sí',
    });
  }
  pegarBotones(preguntas, filasBotones);
  return { preguntas, mensajes, nombresBloque };
}
