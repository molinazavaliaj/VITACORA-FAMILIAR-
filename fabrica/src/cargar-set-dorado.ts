// Carga el "set dorado": Osvaldo Benítez, un narrador ficticio con las 30
// respuestas ya escritas a mano. Sirve para iterar la calidad del libro sin
// esperar 30 días reales de entrevista.
//
//   npm run set-dorado
//
// Es idempotente a lo bruto: si el narrador del set dorado ya existe (se lo
// identifica por el teléfono), se le borran respuestas, preguntas adaptativas
// y saludos, y se recarga todo de cero. Así, si retocás una respuesta en el
// JSON, volvés a correr el script y la base queda como el JSON.
//
// OJO: es una herramienta de desarrollo. Escribe en tablas que según
// supabase/CONTRATO.md son del entrevistador (preguntas, respuestas) — nunca
// correrla apuntando a la base de producción con narradores reales.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { obtenerClienteDb } from './db.js';

type SetDoradoNarrador = {
  familia: { email: string; nombre: string; region: string };
  narrador: {
    nombre: string;
    como_le_dicen: string;
    telefono_whatsapp: string;
    hora_preferida: string;
    zona_horaria: string;
    contexto: Record<string, unknown>;
  };
};

export type EntradaRespuesta = {
  orden: number;
  pregunta?: { texto: string; capitulo: string };
  texto: string;
};

// Los JSON viven fuera de src/, así que se leen en runtime en vez de
// importarse: si los importáramos, tsc los metería en dist/ y cambiaría el
// layout de la compilación (dist/worker.js dejaría de existir donde el
// `npm start` lo busca). Desde src/ (tsx) y desde dist/ (node) '..' apunta
// igual a la raíz de fabrica/.
function leerJson<T>(nombre: string): T {
  const ruta = fileURLToPath(new URL(`../set-dorado/${nombre}`, import.meta.url));
  return JSON.parse(readFileSync(ruta, 'utf8')) as T;
}

export async function cargarSetDorado(): Promise<void> {
  const db = obtenerClienteDb();
  const { familia, narrador } = leerJson<SetDoradoNarrador>('narrador.json');
  const respuestas = leerJson<EntradaRespuesta[]>('respuestas.json');

  // 1. Familia: se reusa la del set dorado si ya está.
  const { data: familiaExistente, error: errorBuscarFamilia } = await db
    .from('familias')
    .select('id')
    .eq('email', familia.email)
    .limit(1)
    .maybeSingle();
  if (errorBuscarFamilia) throw new Error(`No se pudo buscar la familia: ${errorBuscarFamilia.message}`);

  let familiaId = familiaExistente?.id as string | undefined;
  if (!familiaId) {
    const { data, error } = await db.from('familias').insert(familia).select('id').single();
    if (error) throw new Error(`No se pudo crear la familia: ${error.message}`);
    familiaId = data.id as string;
  }

  // 2. Narrador: si ya existe, se le borra todo lo cargado antes y se
  //    actualizan sus datos; si no, se crea. Queda 'completado' en el día 30
  //    para que el worker lo tome en el próximo tick.
  const filaNarrador = {
    familia_id: familiaId,
    ...narrador,
    estado: 'completado',
    dia_actual: 30,
    ultima_respuesta_at: new Date().toISOString(),
  };

  const { data: narradorExistente, error: errorBuscarNarrador } = await db
    .from('narradores')
    .select('id')
    .eq('telefono_whatsapp', narrador.telefono_whatsapp)
    .limit(1)
    .maybeSingle();
  if (errorBuscarNarrador) throw new Error(`No se pudo buscar el narrador: ${errorBuscarNarrador.message}`);

  let narradorId: string;
  let recargado = false;
  if (narradorExistente) {
    narradorId = narradorExistente.id as string;
    recargado = true;

    for (const tabla of ['respuestas', 'saludos'] as const) {
      const { error } = await db.from(tabla).delete().eq('narrador_id', narradorId);
      if (error) throw new Error(`No se pudo limpiar ${tabla}: ${error.message}`);
    }
    // Solo las adaptativas de ESTE narrador; las 25 fijas son globales
    // (narrador_id null) y no se tocan nunca.
    const { error: errorPreguntas } = await db.from('preguntas').delete().eq('narrador_id', narradorId);
    if (errorPreguntas) throw new Error(`No se pudieron limpiar las preguntas: ${errorPreguntas.message}`);

    const { error } = await db.from('narradores').update(filaNarrador).eq('id', narradorId);
    if (error) throw new Error(`No se pudo actualizar el narrador: ${error.message}`);
  } else {
    const { data, error } = await db.from('narradores').insert(filaNarrador).select('id').single();
    if (error) throw new Error(`No se pudo crear el narrador: ${error.message}`);
    narradorId = data.id as string;
  }

  // 3. Preguntas adaptativas (26-30). Las 25 fijas ya vienen del seed.
  const preguntasAdaptativas = respuestas
    .filter((entrada) => entrada.pregunta)
    .map((entrada) => ({
      narrador_id: narradorId,
      orden: entrada.orden,
      texto: entrada.pregunta!.texto,
      capitulo: entrada.pregunta!.capitulo,
      tipo: 'adaptativa',
    }));

  if (preguntasAdaptativas.length > 0) {
    const { error } = await db.from('preguntas').insert(preguntasAdaptativas);
    if (error) throw new Error(`No se pudieron insertar las preguntas adaptativas: ${error.message}`);
  }

  // 4. Las 30 respuestas. Osvaldo "contestó por texto": sin audio, y con el
  //    mismo texto en texto_directo y transcripcion, que es lo que lee la
  //    fábrica sin importar por dónde llegó la respuesta.
  const filasRespuestas = respuestas.map((entrada) => ({
    narrador_id: narradorId,
    pregunta_orden: entrada.orden,
    texto_directo: entrada.texto,
    transcripcion: entrada.texto,
    audio_path: null,
    duracion_segundos: null,
    es_repregunta: false,
  }));

  const { error: errorRespuestas } = await db.from('respuestas').insert(filasRespuestas);
  if (errorRespuestas) throw new Error(`No se pudieron insertar las respuestas: ${errorRespuestas.message}`);

  const palabras = respuestas.reduce((total, entrada) => total + entrada.texto.trim().split(/\s+/).length, 0);
  console.log(
    [
      `Set dorado ${recargado ? 'recargado' : 'cargado'}.`,
      `  familia:   ${familia.nombre} <${familia.email}> (${familiaId})`,
      `  narrador:  ${narrador.nombre} — ${narrador.telefono_whatsapp} (${narradorId})`,
      `  estado:    completado, día 30`,
      `  preguntas: ${preguntasAdaptativas.length} adaptativas (26-30)`,
      `  respuestas: ${filasRespuestas.length} — ${palabras} palabras en total`,
      '',
      'El próximo tick del worker le va a generar la estructura.',
    ].join('\n')
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  cargarSetDorado().catch((err) => {
    console.error('El set dorado no se pudo cargar:', err);
    process.exit(1);
  });
}
