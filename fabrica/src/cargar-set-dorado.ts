// Carga el "set dorado": Osvaldo Benítez, un narrador ficticio con las 30
// respuestas ya escritas a mano. Sirve para iterar la calidad del libro sin
// esperar 30 días reales de entrevista.
//
//   npm run set-dorado
//
// Es idempotente a lo bruto: si el narrador del set dorado ya existe (se lo
// identifica por el teléfono), se borra TODO lo suyo — respuestas, preguntas
// adaptativas, saludos, pedidos y los archivos de {narrador_id}/paquete/ en
// Storage — y se recarga de cero. Lo de Storage no es un detalle: el worker
// decide si tiene que trabajar mirando si ya existen estructura.json y
// preview.pdf, así que si no se borran, la segunda corrida deja el libro
// viejo y parece que la fábrica se colgó.
//
// Variable de entorno opcional:
//
//   SET_DORADO_AUTH_USER_ID   uuid de un usuario de auth.users. La web resuelve
//                             todo con .eq('auth_user_id', user.id), así que sin
//                             esto el set dorado existe pero es invisible desde
//                             el navegador. Si no se pasa, el script avisa y
//                             deja el SQL para hacerlo a mano.
//
// OJO: es una herramienta de desarrollo. Escribe en tablas que según
// supabase/CONTRATO.md son del entrevistador (preguntas, respuestas) — nunca
// correrla apuntando a la base de producción con narradores reales.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { SupabaseClient } from '@supabase/supabase-js';
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

/**
 * Borra todo lo que el set dorado dejó en `{narrador_id}/paquete/` la vez
 * anterior. Sin esto, el worker ve el estructura.json viejo y se saltea al
 * narrador: la recarga no recargaría nada.
 */
async function vaciarPaquete(db: SupabaseClient, narradorId: string): Promise<number> {
  const carpeta = `${narradorId}/paquete`;
  const { data: archivos, error } = await db.storage.from('audios').list(carpeta);
  if (error) throw new Error(`No se pudo listar ${carpeta}: ${error.message}`);
  if (!archivos || archivos.length === 0) return 0;

  const rutas = archivos.map((archivo) => `${carpeta}/${archivo.name}`);
  const { error: errorBorrado } = await db.storage.from('audios').remove(rutas);
  if (errorBorrado) throw new Error(`No se pudo vaciar ${carpeta}: ${errorBorrado.message}`);
  return rutas.length;
}

export async function cargarSetDorado(): Promise<void> {
  const db = obtenerClienteDb();
  const { familia, narrador } = leerJson<SetDoradoNarrador>('narrador.json');
  const respuestas = leerJson<EntradaRespuesta[]>('respuestas.json');
  const authUserId = process.env.SET_DORADO_AUTH_USER_ID?.trim() || null;

  // 1. Familia: se reusa la del set dorado si ya está.
  const filaFamilia = authUserId ? { ...familia, auth_user_id: authUserId } : familia;

  const { data: familiaExistente, error: errorBuscarFamilia } = await db
    .from('familias')
    .select('id')
    .eq('email', familia.email)
    .limit(1)
    .maybeSingle();
  if (errorBuscarFamilia) throw new Error(`No se pudo buscar la familia: ${errorBuscarFamilia.message}`);

  let familiaId = familiaExistente?.id as string | undefined;
  if (familiaId) {
    // Si esta corrida trae el uuid de auth, se lo pegamos a la familia que ya
    // estaba (típico: primero se cargó el set y después se creó el usuario).
    if (authUserId) {
      const { error } = await db.from('familias').update({ auth_user_id: authUserId }).eq('id', familiaId);
      if (error) throw new Error(`No se pudo asociar la familia al usuario de auth: ${error.message}`);
    }
  } else {
    const { data, error } = await db.from('familias').insert(filaFamilia).select('id').single();
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
  let archivosBorrados = 0;
  if (narradorExistente) {
    narradorId = narradorExistente.id as string;
    recargado = true;

    // Los pedidos van primero: si quedara uno viejo en 'entregado' apuntando a
    // un PDF que estamos por borrar, la web mostraría una descarga rota.
    for (const tabla of ['pedidos', 'respuestas', 'saludos'] as const) {
      const { error } = await db.from(tabla).delete().eq('narrador_id', narradorId);
      if (error) throw new Error(`No se pudo limpiar ${tabla}: ${error.message}`);
    }

    archivosBorrados = await vaciarPaquete(db, narradorId);
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
      `  familia:    ${familia.nombre} <${familia.email}> (${familiaId})`,
      `  narrador:   ${narrador.nombre} — ${narrador.telefono_whatsapp} (${narradorId})`,
      `  estado:     completado, día 30`,
      `  preguntas:  ${preguntasAdaptativas.length} adaptativas (26-30)`,
      `  respuestas: ${filasRespuestas.length} — ${palabras} palabras en total`,
      recargado ? `  paquete:    ${archivosBorrados} archivo(s) viejo(s) borrado(s) de Storage` : null,
      `  auth:       ${authUserId ? `familia asociada a ${authUserId}` : 'sin asociar (ver aviso)'}`,
      '',
      'El próximo tick del worker le va a generar la estructura.',
    ]
      .filter((linea): linea is string => linea !== null)
      .join('\n')
  );

  if (!authUserId) {
    console.warn(
      [
        '',
        'AVISO: la familia del set dorado no tiene auth_user_id, así que no se ve',
        'desde la web (todas las rutas resuelven por .eq("auth_user_id", user.id)).',
        'Creá el usuario en Supabase Auth y volvé a correr el script con:',
        '',
        '  SET_DORADO_AUTH_USER_ID=<uuid> npm run set-dorado',
        '',
        'o hacelo a mano en el SQL editor:',
        '',
        `  update familias set auth_user_id = '<uuid>' where email = '${familia.email}';`,
      ].join('\n')
    );
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  cargarSetDorado().catch((err) => {
    console.error('El set dorado no se pudo cargar:', err);
    process.exit(1);
  });
}
