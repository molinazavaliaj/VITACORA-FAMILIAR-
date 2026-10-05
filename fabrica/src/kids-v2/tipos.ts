// Los tipos del banco de Vitácora Kids V2 («Mi Primer Capítulo»).
// La fuente de los textos es docs/kids/v2/banco.md y docs/kids/v2/mensajes.md;
// banco-md.ts los parsea y scripts/kids-v2-json.ts genera banco.json.

export type Cap = 1 | 2 | 3 | 4 | 5;

/** Qué pasa al tocar un botón propio de una principal (columna Botones de banco.md). */
export type AccionRama =
  /** Uno o dos mensajes que esperan respuesta (K12 "No tengo hermanos" tiene dos: "Y después, siempre"). */
  | { tipo: 'preguntar'; pasos: string[] }
  /** "Dale, esa la salteamos." */
  | { tipo: 'paso' }
  /** "Dale, no pasa nada." */
  | { tipo: 'no-aplica' };

export type Rama = { boton: string; accion: AccionRama };

export type Foto = {
  /** La principal donde está pegada en el banco (K10…). Si su tema se saca, la foto se muda pero esto no cambia. */
  de: string;
  texto: string;
  /** Tal cual el banco, en orden: "No tengo", "No hago", "De ninguno", "No miro", "Hoy no la como". */
  botones: string[];
  /** Respuesta propia a [No tengo] (solo K29). Si es null, va B-FOTO-NOTENGO. */
  noTengo: string | null;
};

export type Pregunta = {
  id: string;
  cap: Cap;
  texto: string;
  /** Los botones propios que no son "pasar" (K12, K13, K16, K18, K20, K25, K38). */
  ramas: Rama[];
  /** "Paso", salvo K10, K11 y K39 ("Esta la paso") y K41 ("Esta no, gracias"). */
  botonPaso: string;
  op: { texto: string; soloRama: string | null } | null;
  foto: Foto | null;
  estrella: boolean;
  sacable: boolean;
  sensible: boolean;
  avisoAntes: boolean;
};

export type Extra = {
  /** X1-1, X1-2… (capítulo y orden en banco.md; el banco no les pone ID). */
  id: string;
  cap: Cap;
  texto: string;
  /** "Foto: …" en el banco: es un pedido de foto con [No tengo]. */
  foto: boolean;
  /** Si es la otra puerta de una principal ("OP de K1"): no sale si esa OP ya salió. */
  deOp: string | null;
  soloSi: 'hermanos' | 'pelea-k36' | null;
  sacable: boolean;
  sensible: boolean;
  liviana: boolean;
};

export type MensajeFijo = {
  id: string;
  texto: string;
  botones: string[];
  /** Nombre de la plantilla de Meta, si sale como plantilla. */
  plantilla: string | null;
};

export type BancoKids = {
  capitulos: { n: Cap; titulo: string }[];
  preguntas: Pregunta[];
  extras: Extra[];
  mensajes: MensajeFijo[];
};
