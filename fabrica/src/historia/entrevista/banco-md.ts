// Parser de docs/historia/banco.md → filas tipadas. Copia del de V3
// (src/v3/entrevista/banco-md.ts) con lo que cambia en historia: las tablas
// de preguntas tienen 8 columnas (las 6 de V3 más `Tema` y `Reemplaza`), los
// IDs llevan guion (HC8-Q, HC1-A, BIEN-H, PR-H1), no hay ronda extra y las
// clases son solo `historia` y `cierre`. Lo usa `scripts/historia-json.ts`
// para generar `banco.json`; un test compara el json commiteado contra este
// parseo (el md es la fuente: Naza aprueba los textos ahí).

import { esTema, type TemaHistoria } from './temas.js';

export type Parte = 'nucleo';
/** `historia` (todas) y `cierre` (HC10, la última). FOTO-H y FIN-H son mensajes, no preguntas. */
export type Clase = 'historia' | 'cierre';

/**
 * Una condición simple de "Depende de": `si:X` (X fue un "sí"), `sino:X` (X
 * fue un "no" corto) o `paso:X` (X fue "paso"). Hoy ninguna pregunta de
 * historia depende de otra, pero la columna está y se valida como en V3.
 */
export type CondicionSimple = { tipo: 'si' | 'sino' | 'paso'; de: string };

/** Un término de "Depende de" (se juntan con " o "). Si trae `y`, tienen que cumplirse todas. */
export type Condicion = CondicionSimple & { y?: CondicionSimple[] };

/** Todas las condiciones simples de un término (la principal y las de `y`). */
export function condicionesDe(c: Condicion): CondicionSimple[] {
  return [{ tipo: c.tipo, de: c.de }, ...(c.y ?? [])];
}

/** Qué vale tocar un botón: "sí" (contame), "no" (un "no" corto) o "paso". */
export type ValeBoton = 'si' | 'no' | 'paso';

/** Un botón de respuesta de WhatsApp debajo del mensaje. */
export type Boton = { texto: string; vale: ValeBoton };

/** Lo que acepta WhatsApp en los botones de respuesta: hasta 3 por mensaje y hasta 20 letras cada uno. */
export const MAX_BOTONES = 3;
export const MAX_LETRAS_BOTON = 20;

/** `comun` le llega a todos los temas; si no, la clave del tema (docs/historia/temas.md). */
export type TemaPregunta = 'comun' | TemaHistoria;

export type PreguntaEntrevista = {
  id: string;
  /**
   * El bloque del md (1-7). Una variante (`reemplaza`) toma el bloque de la
   * común que reemplaza, no el de la tabla "Variantes": va en su lugar.
   */
  bloque: number;
  orden: number; // posición en el md, desde 1 (el orden de envío lo da `bancoDeTema`)
  texto: string; // tal cual el md, con sus marcas ({{o/a}}, {{historia}}, «sino:X: a ‖ b»…)
  depende: Condicion[]; // OR: alcanza con que se cumpla una; vacío = a todos
  parte: Parte;
  clase: Clase;
  sensible: boolean;
  /** Columna `Tema`. */
  tema: TemaPregunta;
  /** Columna `Reemplaza`: la común que esta fila reemplaza (en su tema; con `comun`, solo con tema abierto). */
  reemplaza?: string;
  /** Los botones de respuesta, si lleva. Hoy ninguna pregunta de historia lleva. */
  botones?: Boton[];
};

export type MensajeEntrevista = {
  id: string; // BIEN-H, COMO, FOTO-H, M1, M3.1…
  cuando: string;
  texto: string;
};

export type BancoEntrevista = {
  preguntas: PreguntaEntrevista[];
  mensajes: MensajeEntrevista[];
  nombresBloque: Record<number, string>;
};

/** Un ID del banco: HC1, M3.1, M28.4, y con guion HC8-Q, HC1-A, BIEN-HR-A, TEMA-ABIERTO, PR-H1, FOTO-H. */
export const PATRON_ID = '[A-Z]{1,12}\\d*(?:\\.\\d+)?(?:-[A-Z]{1,12}\\d*)*';
const ID = new RegExp(`^${PATRON_ID}$`);
const CLASES: readonly Clase[] = ['historia', 'cierre'];
/** Las columnas de una tabla de preguntas: las 6 de V3, `Tema` y `Reemplaza`. */
export const COLUMNAS_PREGUNTA = 8;

/** `<br>` en una celda es un salto de línea en el mensaje (TEMA-LISTA y PR-H tienen párrafos). */
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

/**
 * Lee la columna "Depende de": "", "si:HC3", "sino:HC3 o si:HC4", "si:HC3 y
 * si:HC4". " o " separa términos (alcanza uno); " y " junta condiciones dentro
 * de un término. Tira error si no respeta la sintaxis.
 */
export function parsearDepende(celda: string): Condicion[] {
  const t = celda.trim();
  if (t === '') return [];
  const simple = new RegExp(`^(si|sino|paso):(${PATRON_ID})$`);
  return t.split(' o ').map((termino) => {
    const [primera, ...resto] = termino.split(' y ').map((parte) => {
      const m = simple.exec(parte.trim());
      if (!m) throw new Error(`"Depende de" mal escrito: "${celda}"`);
      return { tipo: m[1] as CondicionSimple['tipo'], de: m[2] };
    });
    return resto.length > 0 ? { ...primera, y: resto } : primera;
  });
}

function parsearParte(celda: string, id: string): Parte {
  if (celda === 'núcleo') return 'nucleo';
  throw new Error(`${id}: Parte desconocida "${celda}" (en historia todas son núcleo: no hay ronda extra)`);
}

function parsearClase(celda: string, id: string): Clase {
  if ((CLASES as readonly string[]).includes(celda)) return celda as Clase;
  throw new Error(`${id}: Clase desconocida "${celda}" (van ${CLASES.join(' o ')})`);
}

function parsearTema(celda: string, id: string): TemaPregunta {
  if (celda === 'comun' || esTema(celda)) return celda;
  throw new Error(`historia: tema desconocido «${celda}» en ${id}`);
}

const VALE: Record<string, ValeBoton> = { sí: 'si', no: 'no', paso: 'paso' };

/** Pega los botones de la sección "## Botones" (ID | Botón | Vale como) a sus preguntas, como en V3. */
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
 * Valida las variantes y les pone el bloque de la común que reemplazan:
 * `Reemplaza` apunta a una común (sin `Reemplaza`) que existe, y no hay dos
 * variantes que puedan caer sobre la misma común en el mismo banco (dos del
 * mismo tema, o una del tema y una `comun` de tema abierto).
 */
function validarVariantes(preguntas: PreguntaEntrevista[]): void {
  const porId = new Map(preguntas.map((p) => [p.id, p]));
  const vistas = new Map<string, PreguntaEntrevista[]>();
  for (const v of preguntas) {
    if (!v.reemplaza) continue;
    const comun = porId.get(v.reemplaza);
    if (!comun || comun.tema !== 'comun' || comun.reemplaza) throw new Error(`historia: ${v.id} reemplaza a «${v.reemplaza}», que no es una común del banco`);
    v.bloque = comun.bloque;
    const otras = vistas.get(v.reemplaza) ?? [];
    const choca = otras.find((o) => o.tema === v.tema || o.tema === 'comun' || v.tema === 'comun');
    if (choca) throw new Error(`historia: ${choca.id} y ${v.id} reemplazan los dos a ${v.reemplaza}`);
    vistas.set(v.reemplaza, [...otras, v]);
  }
}

/**
 * Recorre el md: "## Arranque" y "## Mensajes fijos" dan los mensajes (ID |
 * Cuándo | Texto, y en el arranque una columna de notas que no se usa); cada
 * "## Bloque N · Nombre" da sus preguntas (ID | Pregunta | Depende de | Parte
 * | Clase | Sensible | Tema | Reemplaza); "## Botones" da los botones de cada
 * pregunta (ID | Botón | Vale como). Se corta en "## Reglas del flujo". El
 * orden es el de las tablas.
 */
export function parsearEntrevistaMd(md: string): BancoEntrevista {
  const preguntas: PreguntaEntrevista[] = [];
  const mensajes: MensajeEntrevista[] = [];
  const nombresBloque: Record<number, string> = {};
  const filasBotones: string[][] = [];
  const ids = new Set<string>();
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
    if (/^## (Arranque|Mensajes fijos)/.test(linea)) {
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
    if (c[0] === 'ID' || /^-+$/.test(c[0] ?? '')) continue; // encabezado o separador
    if (!ID.test(c[0] ?? '')) throw new Error(`ID mal escrito: "${c[0]}"`);

    if (seccion === 'botones') {
      filasBotones.push(c);
      continue;
    }
    if (ids.has(c[0])) throw new Error(`${c[0]}: está dos veces`);
    ids.add(c[0]);
    if (seccion === 'mensajes') {
      const [id, cuando, texto] = c;
      mensajes.push({ id, cuando, texto: saltos(texto) });
      continue;
    }
    if (c.length !== COLUMNAS_PREGUNTA) throw new Error(`${c[0]}: la fila tiene ${c.length} columnas y van ${COLUMNAS_PREGUNTA}`);
    const [id, texto, depende, parte, clase, sensible, tema, reemplaza] = c;
    preguntas.push({
      id,
      bloque,
      orden: preguntas.length + 1,
      texto,
      depende: parsearDepende(depende),
      parte: parsearParte(parte, id),
      clase: parsearClase(clase, id),
      sensible: sensible === 'sí',
      tema: parsearTema(tema, id),
      ...(reemplaza ? { reemplaza } : {}),
    });
  }
  validarVariantes(preguntas);
  pegarBotones(preguntas, filasBotones);
  return { preguntas, mensajes, nombresBloque };
}
