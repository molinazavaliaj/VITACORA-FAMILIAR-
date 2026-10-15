// El material del libro de Kids, ya armado para la receta (docs/kids/v2/escritor/receta.md, sección 2) y las
// filas de la base de donde sale (kids_v2, narradores, respuestas con clave_kids, fotos).

// ---------- Las filas (mismo formato en la base y en test/fijos/escritor-kids/<chico>/) ----------

export type PreguntaPadreFila = { texto: string; conLinea: boolean; quien?: string };
export type FichaFila = {
  nombre: string;
  apodo?: string;
  genero: 'chico' | 'chica';
  edad: number;
  quienRegala: string;
  preguntasPadre?: PreguntaPadreFila[];
  [otro: string]: unknown;
};
/** Una corrección de nombre que hizo el padre en el panel (kids_v2.correcciones). */
export type CorreccionFila = { respuesta_id: string; dice: string; es: string; at?: string };
export type FilaKidsV2 = { narrador_id: string; idioma: string; ficha: FichaFila; correcciones?: CorreccionFila[] | null; termino_at?: string | null };
export type FilaNarradorKids = { id: string; nombre: string; como_le_dicen?: string | null };
export type FilaRespuestaKids = {
  id: string;
  pregunta_orden: number;
  audio_path: string | null;
  texto_directo: string | null;
  transcripcion: string | null;
  reservada?: boolean | null;
  recibido_at?: string;
  clave_kids: string | null;
};
export type FilaFotoKids = { id: string; storage_path: string; epigrafe: string | null; pregunta_orden: number | null; ancho_px?: number | null; alto_px?: number | null; orden?: number | null };
export type FilasKids = { kids: FilaKidsV2; narrador: FilaNarradorKids; respuestas: FilaRespuestaKids[]; fotos: FilaFotoKids[] };

// ---------- El material ----------

/** Una respuesta con texto. `id` es el corto (R01…); `respuestaId` es la fila de `respuestas` (el audio sale de ahí). */
export type RespuestaKids = { id: string; clave: string; pregunta: string; texto: string; audio: boolean; respuestaId: string; audioPath: string | null; orden: number };
/** Un item del banco con lo que contestó alrededor. Las PADRE-n llevan quién la manda y su línea. */
export type ItemKids = { clave: string; pregunta: string; respuestas: RespuestaKids[]; padre?: { quien: string; conLinea: boolean; linea: string } };
export type ParteKids = { n: 1 | 2 | 3 | 4; titulo: string; items: ItemKids[] };
/** Una foto con lo que dijo de ella (el texto que mandó con la foto y los audios de esa misma clave). */
export type FotoKids = { id: string; clave: string; item: string; parte: number; pregunta: string; fotoId: string; storagePath: string; ancho: number | null; alto: number | null; respuestas: RespuestaKids[] };
export type PreguntaPadreKids = { clave: string; texto: string; conLinea: boolean; quien: string; linea: string };
export type FichaKids = {
  narradorId: string;
  nombre: string;
  /** Cómo se lo llama en las instrucciones ({{NOMBRE}}): el apodo, o el nombre de pila. */
  llamado: string;
  edad: number;
  genero: 'm' | 'f';
  quienRegala: string;
  idioma: string;
  preguntasPadre: PreguntaPadreKids[];
};
export type MaterialKids = {
  ficha: FichaKids;
  partes: ParteKids[];
  /** La parte 5 (la cápsula) y sus extras, con el «¿quedó algo?» del final: va al sobre cerrado. */
  sobre: { titulo: string; items: ItemKids[] };
  fotos: FotoKids[];
  /** Las correcciones de nombres que se aplicaron (en la copia; la base no cambia). */
  correcciones: { dice: string; es: string; veces: number }[];
  /** Filas con texto que no tenían a qué item ir (se cuentan en el informe). */
  sinLugar: { respuestaId: string; clave: string; texto: string }[];
};
