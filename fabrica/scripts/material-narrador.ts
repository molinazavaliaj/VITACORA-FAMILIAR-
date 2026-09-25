// Lo que la fábrica lee de la base para armar (o releer) el libro de prueba de un narrador: sus
// respuestas publicables en orden, lo reservado, quién cuenta, los nombres corregidos y las épocas.
// Lo comparten `prueba-reparto.ts` (el libro entero) y `releer-libro.ts` (solo el lector final),
// para que el lector relea EXACTAMENTE el mismo material con el que se escribió. Solo lee.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Pregunta, Respuesta } from '../src/db.js';
import { descargarTextoOpcional, type Nombres } from '../src/libro/comun.js';
import { generoDelMaterial, type Quien } from '../src/libro/encargo.js';
import type { EpocaDeRespuesta } from '../src/libro/etapas.js';
import {
  leerContextoV2, epocaV2, lineaDeTiempoV2, generoV2, preguntaV2, epocaDelGuion, materialDeRespuestas,
  type ContextoV2, type RespuestaDelLibro,
} from './contexto-v2.js';

export type MaterialDelNarrador = {
  narrador: { nombre: string; edicion: unknown; contexto: unknown };
  v2: ContextoV2 | null;
  /** Las que quedan afuera en esta corrida: las de `--excluir` más las `bloqueadas` del candado v2. */
  excluidas: Set<string>;
  respuestas: RespuestaDelLibro[];
  reservados: string[];
  epocas: EpocaDeRespuesta[];
  lineaDeTiempo: string;
  nombres: Nombres;
  quien: Quien;
  /** De dónde salió el género si no lo dijo en la entrevista. */
  delMaterial: ReturnType<typeof generoDelMaterial>;
};

export async function cargarMaterialDelNarrador(
  db: SupabaseClient,
  narradorId: string,
  excluirPorArgumento: Iterable<string>,
): Promise<MaterialDelNarrador> {
  const leer = async <T>(consulta: PromiseLike<{ data: T | null; error: { message: string } | null }>, que: string): Promise<T> => {
    const { data, error } = await consulta;
    if (error || !data) throw new Error(`No pude leer ${que}: ${error?.message ?? 'vacío'}`);
    return data;
  };

  const narrador = await leer(db.from('narradores').select('*').eq('id', narradorId).single(), 'el narrador') as MaterialDelNarrador['narrador'];
  const fijas = await leer(db.from('preguntas').select('*').is('narrador_id', null), 'las fijas') as Pregunta[];
  const propias = await leer(db.from('preguntas').select('*').eq('narrador_id', narradorId), 'sus preguntas') as Pregunta[];
  const filas = await leer(db.from('respuestas').select('*').eq('narrador_id', narradorId), 'las respuestas') as Respuesta[];
  const nombresTexto = await descargarTextoOpcional(db, `${narradorId}/paquete/nombres.json`);
  const nombres: Nombres = nombresTexto ? JSON.parse(nombresTexto) : { correcciones: [] };

  const excluidas = new Set(excluirPorArgumento);
  const v2 = leerContextoV2(narrador.contexto);
  for (const id of v2?.bloqueadas ?? []) excluidas.add(id);

  // El texto de la pregunta: en el v2, el que de verdad recibió (`preguntaV2`); en el guion viejo, la tabla.
  const preguntaDelGuion = new Map<number, Pregunta>();
  for (const p of [...fijas, ...propias]) preguntaDelGuion.set(p.orden, p);
  const preguntaDe = (orden: number, esRepregunta: boolean): string =>
    v2 ? preguntaV2(v2, orden, esRepregunta) : preguntaDelGuion.get(orden)?.texto ?? `Pregunta ${orden}`;

  const { respuestas, reservados } = materialDeRespuestas(filas, excluidas, preguntaDe);
  if (!respuestas.length) throw new Error('No hay respuestas publicables: nada para armar.');
  const ordenes = [...new Set(respuestas.map((r) => r.orden))];
  const epocas = v2
    ? ordenes.map((o) => epocaV2(v2, o))
    : ordenes.map((o) => epocaDelGuion(o, preguntaDelGuion.get(o)?.capitulo ?? ''));
  const lineaDeTiempo = v2 ? lineaDeTiempoV2(v2) : '';

  // Quién cuenta: lo que dijo en la entrevista v2 si lo dijo; si no, de lo que cuenta.
  const delMaterial = generoDelMaterial(respuestas.map((r) => r.texto));
  const genero = (v2 && generoV2(v2)) || delMaterial.genero;

  return { narrador, v2, excluidas, respuestas, reservados, epocas, lineaDeTiempo, nombres, quien: { nombre: narrador.nombre, genero }, delMaterial };
}
