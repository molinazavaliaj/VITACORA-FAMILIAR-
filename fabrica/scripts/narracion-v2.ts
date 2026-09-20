// Convierte en v2 (híbrido) el `narracion.json` de un libro YA producido: las
// historias se escuchan con el audio REAL del narrador y la voz clonada narra
// solo el anuncio del capítulo y los conectores entre historias. Existe para
// rehacer el audiolibro de un pedido entregado sin volver a escribir el libro
// (el caso del libro de Joaquín: se entregó todo-clonado el 19/09 y la decisión
// del 20/09 es híbrido):
//
//   npx tsx scripts/narracion-v2.ts <narradorId> <pedidoId>
//   npx tsx scripts/narracion-v2.ts <narradorId> <pedidoId> --solo-json [--salida <ruta>] [--cachear-conectores]
//
// Corre desde `fabrica/`. Lee `fabrica/.env` si está (SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY y ANTHROPIC_API_KEY — esta última solo si hay que
// pedirle conectores al modelo); si no, usa las variables del entorno.
//
// Qué hace, en orden:
//   1. Lee el pedido (tiene que ser de ese narrador y estar `entregado` o
//      `esperando_voz`: en cualquier otro estado, la narración que hay es la que
//      corresponde) y el narrador con su
//      `edicion` (orden y títulos de capítulos, congelados al cerrar el libro).
//   2. Baja `{narrador}/paquete/estructura.json` y el `narracion.json` que ya
//      está (v1: tiene el TEXTO de cada capítulo, que es lo único que quedó del
//      libro escrito — los borradores se borran al entregar). NO inventa
//      ninguno de los dos: si falta, se planta.
//   3. Arma las historias (`historiasDelCapitulo`: solo respuestas con audio, en
//      el orden del libro) y los conectores por capítulo (`escribirConectores`),
//      reusando `conectores_cap_NN.json` si ya está cacheado. Los conectores
//      nuevos se cachean ANTES de escribir el v2 (mismo checkpoint que
//      `generar-paquete.ts`): un reintento no le vuelve a pagar al modelo.
//   4. Sube `narracion.json` v2 (upsert), reemplaza la narración vieja del pedido
//      (`reemplazarNarracion`: la marca `reemplazada` y encola la nueva
//      `pendiente`) y recién ahí deja el pedido en `esperando_voz`.
//
// `--solo-json` NO escribe nada en Supabase (ni Storage ni tablas): deja el v2
// en un archivo local (por defecto `narracion-v2-<narradorId>.json` en el
// directorio actual) para leer los conectores antes de narrar. Ojo: así los
// conectores pagados en esa corrida no quedan cacheados; con
// `--cachear-conectores` se guardan en Storage (solo eso) para que la corrida
// en serio no le vuelva a pagar al modelo.
//
// OJO (para el caso de un pedido ya entregado): el worker de voz solo toma
// narraciones `pendiente`, así que la narración de la entrega anterior (la
// `lista`) la saca de circulación `reemplazarNarracion` ANTES de encolar la
// nueva: dejar el pedido en `esperando_voz` con una `lista` vieja haría que la
// fábrica ensamble ESA voz como si fuera la nueva. Solo se reemplaza con el
// pedido `entregado` o `esperando_voz`, y nunca con una narración en curso
// (`pendiente`/`procesando`): eso se narraría dos veces.
//
// Ver `supabase/CONTRATO.md` (sección "narracion.json v2 — audiolibro híbrido").

import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { cargarConfig } from '../src/config.js';
import { obtenerClienteDb, type Narrador, type Pregunta, type Respuesta } from '../src/db.js';
import { aplicarOrdenCapitulos, aplicarTitulosCapitulos, leerEdicion } from '../src/libro/edicion.js';
import { descargarTextoOpcional, RUTA_CONECTORES_CAP, subirTexto } from '../src/libro/comun.js';
import type { Estructura } from '../src/libro/estructura.js';
import { armarNarracionJson, type ConectoresNarracion, type NarracionJson } from '../src/voz/narracion-json.js';
import { escribirConectores, historiasDelCapitulo } from '../src/voz/conectores.js';
import { motivoEnCurso, narracionesDelPedido, puedeReemplazarNarracion, reemplazarNarracion, RUTA_NARRACION_JSON } from '../src/voz/narraciones.js';
import type { NarracionDelPedido } from '../src/voz/narraciones.js';

type Db = ReturnType<typeof obtenerClienteDb>;

export const USO =
  'Uso: npx tsx scripts/narracion-v2.ts <narradorId> <pedidoId> [--solo-json [--salida <ruta>]] [--cachear-conectores]';

/** Igual que en `generar-paquete.ts` (ahí la constante es privada). */
const RUTA_ESTRUCTURA = (narradorId: string) => `${narradorId}/paquete/estructura.json`;

export type Opciones = {
  narradorId: string;
  pedidoId: string;
  soloJson: boolean;
  rutaSalida: string | null;
  cachearConectores: boolean;
};

export function parsearArgs(argv: string[]): Opciones {
  const [narradorId, pedidoId, ...resto] = argv;
  if (!narradorId || !pedidoId) throw new Error(USO);

  let soloJson = false;
  let rutaSalida: string | null = null;
  let cachearConectores = false;
  for (let i = 0; i < resto.length; i++) {
    const flag = resto[i];
    if (flag === '--solo-json') {
      soloJson = true;
    } else if (flag === '--cachear-conectores') {
      cachearConectores = true;
    } else if (flag === '--salida') {
      const valor = resto[i + 1];
      if (!valor || valor.startsWith('--')) throw new Error(`--salida necesita una ruta. ${USO}`);
      rutaSalida = valor;
      i++;
    } else {
      throw new Error(`No entiendo «${flag}». ${USO}`);
    }
  }
  // Sin --solo-json el v2 va a Storage: una ruta local ahí no significa nada y
  // aceptarla en silencio haría creer que el archivo se escribió donde dijo.
  if (rutaSalida !== null && !soloJson) {
    throw new Error(`--salida solo vale con --solo-json (sin --solo-json el v2 va a Storage). ${USO}`);
  }
  return { narradorId, pedidoId, soloJson, rutaSalida, cachearConectores };
}

export type ResumenCapitulo = {
  numero: number;
  nombre: string;
  modo: 'hibrido' | 'clonado';
  historias: number;
  /** De dónde salieron los conectores: del caché o del modelo en esta corrida. */
  conectores: 'cache' | 'modelo' | null;
};

export type NarracionV2Armada = {
  narracion: NarracionJson;
  capitulos: ResumenCapitulo[];
  conectoresDelModelo: number;
  /** El narracion.json que había (v1 o v2 anterior), tal cual: se guarda como narracion_v1.json antes de pisarlo. */
  v1Texto: string | null;
  /** Las narraciones del pedido ya leídas (para no volver a consultar al reemplazar). */
  narracionesDelBuzon: NarracionDelPedido[];
};

export type ResultadoCorrida = NarracionV2Armada & {
  /** Dónde quedó el v2: la ruta local (con `--solo-json`) o null (Storage). */
  rutaSalida: string | null;
  narracionId: string | null;
};

type CapituloV1 = { numero?: unknown; nombre?: unknown; texto?: unknown };

/**
 * El texto de un capítulo, del `narracion.json` que ya estaba. Se empareja por
 * el título final, después por el nombre del guion (si la dueña lo renombró
 * después de generar ese archivo) y, si no, por el número (el orden final está
 * congelado desde que se cerró el libro, así que es el mismo). Si no está en
 * ninguno de los tres, no hay texto que narrar: tira.
 */
function buscarTexto(
  capitulosV1: CapituloV1[],
  capitulo: { nombre: string; nombreGuion: string },
  numero: number
): { texto: string; por: 'nombre' | 'guion' | 'numero' } {
  const porNombre = (nombre: string) => capitulosV1.find((c) => c.nombre === nombre && typeof c.texto === 'string');
  const candidatos: [CapituloV1 | undefined, 'nombre' | 'guion' | 'numero'][] = [
    [porNombre(capitulo.nombre), 'nombre'],
    [porNombre(capitulo.nombreGuion), 'guion'],
    [capitulosV1.find((c) => c.numero === numero && typeof c.texto === 'string'), 'numero'],
  ];
  for (const [encontrado, por] of candidatos) {
    if (encontrado) return { texto: encontrado.texto as string, por };
  }
  throw new Error(
    `El narracion.json que ya estaba no trae el texto del capítulo ${numero} («${capitulo.nombre}»): sin texto no se puede narrar (ni clonado ni híbrido). ¿Es el narracion.json de este libro?`
  );
}

function parsearConectoresCacheados(texto: string, ruta: string): ConectoresNarracion {
  let valor: unknown;
  try {
    valor = JSON.parse(texto);
  } catch (err) {
    throw new Error(`El caché de conectores ${ruta} no es JSON válido (${(err as Error).message}): borralo y volvé a correr para regenerarlo.`);
  }
  return valor as ConectoresNarracion;
}

/**
 * Arma el v2 leyendo lo que hay: no escribe el libro, no regenera la estructura
 * y no inventa texto de capítulos. Devuelve el JSON y el resumen por capítulo
 * para que quien llama lo muestre. Los conectores que pide al modelo los sube
 * (upsert) solo si `guardarConectores`.
 */
export async function armarNarracionV2(
  db: Db,
  args: { narradorId: string; pedidoId: string; guardarConectores: boolean }
): Promise<NarracionV2Armada> {
  // El pedido: tiene que ser de este narrador (un id cruzado escribiría el
  // narracion.json del narrador equivocado y pondría el pedido de otro en cola).
  const { data: pedidoData, error: errorPedido } = await db
    .from('pedidos')
    .select('id, narrador_id, estado')
    .eq('id', args.pedidoId)
    .single();
  if (errorPedido || !pedidoData) {
    throw new Error(`No se pudo leer el pedido ${args.pedidoId}: ${errorPedido?.message ?? 'sin datos'}`);
  }
  const pedido = pedidoData as { id: string; narrador_id: string; estado: string };
  if (pedido.narrador_id !== args.narradorId) {
    throw new Error(
      `El pedido ${args.pedidoId} es del narrador ${pedido.narrador_id}, no de ${args.narradorId}: no se tocó nada.`
    );
  }
  // Se chequea acá (y no solo adentro de `reemplazarNarracion`) porque este es el
  // momento barato: si el pedido no es de los que se pueden reemplazar, no tiene
  // sentido pedirle conectores al modelo — eso se paga.
  if (!puedeReemplazarNarracion(pedido)) {
    throw new Error(
      `El pedido ${args.pedidoId} está '${pedido.estado}': una narración se reemplaza solo con el pedido entregado o esperando_voz (en el resto de los estados, la narración que hay es la que corresponde).`
    );
  }

  // Y antes de pagar conectores: si ya hay una narración en curso, reemplazar
  // va a fallar igual (narraciones.ts) — mejor cortar acá, sin gastar ni pisar nada.
  const narracionesDelBuzon = await narracionesDelPedido(db, args.pedidoId);
  const motivo = motivoEnCurso(args.pedidoId, narracionesDelBuzon);
  if (motivo) throw new Error(motivo);

  const { data: narradorData, error: errorNarrador } = await db.from('narradores').select('*').eq('id', args.narradorId).single();
  if (errorNarrador || !narradorData) {
    throw new Error(`No se pudo leer el narrador ${args.narradorId}: ${errorNarrador?.message ?? 'sin datos'}`);
  }
  const narrador = narradorData as Narrador;

  const estructuraTexto = await descargarTextoOpcional(db, RUTA_ESTRUCTURA(args.narradorId));
  if (estructuraTexto === null) {
    throw new Error(
      `No hay ${RUTA_ESTRUCTURA(args.narradorId)}: sin estructura no sé qué capítulos tiene el libro. La arma generarPaquete; este script no la inventa.`
    );
  }
  const estructura = JSON.parse(estructuraTexto) as Estructura;

  const v1Texto = await descargarTextoOpcional(db, RUTA_NARRACION_JSON(args.narradorId));
  if (v1Texto === null) {
    throw new Error(
      `No hay ${RUTA_NARRACION_JSON(args.narradorId)}: de ahí sale el texto de los capítulos (los borradores se borran al entregar), no hay nada que convertir.`
    );
  }
  let v1: { version?: unknown; capitulos?: CapituloV1[] };
  try {
    v1 = JSON.parse(v1Texto) as { version?: unknown; capitulos?: CapituloV1[] };
  } catch (err) {
    throw new Error(`El ${RUTA_NARRACION_JSON(args.narradorId)} que ya estaba no es JSON válido: ${(err as Error).message}`);
  }
  if (v1.version === 2) {
    console.warn('El narracion.json que ya estaba es v2: reuso sus textos y vuelvo a armar historias y conectores.');
  }
  const capitulosV1 = Array.isArray(v1.capitulos) ? v1.capitulos : [];

  const { data: preguntasFijas, error: errorFijas } = await db
    .from('preguntas')
    .select('*')
    .is('narrador_id', null)
    .order('orden', { ascending: true });
  if (errorFijas) throw new Error(`No se pudieron leer las preguntas fijas: ${errorFijas.message}`);

  const { data: preguntasNarrador, error: errorPreguntasNarrador } = await db
    .from('preguntas')
    .select('*')
    .eq('narrador_id', args.narradorId)
    .order('orden', { ascending: true });
  if (errorPreguntasNarrador) throw new Error(`No se pudieron leer las preguntas del narrador: ${errorPreguntasNarrador.message}`);

  const preguntas: Pregunta[] = [...(preguntasFijas ?? []), ...(preguntasNarrador ?? [])];
  const preguntasPorOrden = new Map<number, Pregunta>();
  for (const pregunta of preguntas) preguntasPorOrden.set(pregunta.orden, pregunta);

  const { data: respuestas, error: errorRespuestas } = await db.from('respuestas').select('*').eq('narrador_id', args.narradorId);
  if (errorRespuestas) throw new Error(`No se pudieron leer las respuestas: ${errorRespuestas.message}`);
  const respuestasPorOrden = new Map<number, Respuesta[]>();
  for (const respuesta of (respuestas ?? []) as Respuesta[]) {
    const lista = respuestasPorOrden.get(respuesta.pregunta_orden) ?? [];
    lista.push(respuesta);
    respuestasPorOrden.set(respuesta.pregunta_orden, lista);
  }

  // La edición de la dueña, igual que en `generarPaquete`: orden de capítulos y
  // títulos. `nombreGuion` guarda el nombre con el que el capítulo entró al
  // guion, que es con el que lo pueden nombrar la estructura o el v1 viejo.
  const edicion = leerEdicion(narrador.edicion);
  const capitulosFinales = aplicarTitulosCapitulos(
    aplicarOrdenCapitulos(estructura.capitulos, edicion.ordenCapitulos),
    edicion.titulosCapitulos
  );

  let cliente: Anthropic | undefined;
  const capitulos: Parameters<typeof armarNarracionJson>[0]['capitulos'] = [];
  const resumen: ResumenCapitulo[] = [];
  let conectoresDelModelo = 0;

  // Primero el texto de TODOS los capítulos: si el narracion.json viejo no lo
  // trae completo no hay v2 posible, y mejor saberlo antes de pedirle conectores
  // al modelo (una corrida a medias se pagaría igual).
  const plan = capitulosFinales.map((capitulo, i) => {
    const { texto, por } = buscarTexto(capitulosV1, capitulo, i + 1);
    if (por === 'numero') {
      console.warn(`El capítulo ${i + 1} no está por nombre en el narracion.json viejo: usé el texto del capítulo ${i + 1} de ese archivo.`);
    }
    return { capitulo, numero: i + 1, texto };
  });

  for (const { capitulo, numero, texto } of plan) {
    const historias = historiasDelCapitulo(capitulo.ordenes, preguntasPorOrden, respuestasPorOrden);
    if (historias.length === 0) {
      // Sin ningún audio: se narra entero con la voz clonada, como en la v1.
      capitulos.push({ nombre: capitulo.nombre, markdown: texto });
      resumen.push({ numero, nombre: capitulo.nombre, modo: 'clonado', historias: 0, conectores: null });
      continue;
    }

    const rutaConectores = RUTA_CONECTORES_CAP(args.narradorId, numero);
    const cacheado = await descargarTextoOpcional(db, rutaConectores);
    let conectores: ConectoresNarracion;
    let origen: 'cache' | 'modelo';
    if (cacheado !== null) {
      conectores = parsearConectoresCacheados(cacheado, rutaConectores);
      origen = 'cache';
    } else {
      cliente ??= new Anthropic({ apiKey: cargarConfig().anthropicApiKey });
      conectores = await escribirConectores(cliente, {
        nombre: narrador.nombre,
        capitulo: capitulo.nombre,
        textoCapitulo: texto,
        historias: historias.map((h) => ({ pregunta: h.pregunta, texto: h.texto })),
      });
      origen = 'modelo';
      conectoresDelModelo++;
      // Checkpoint: cacheado antes de escribir el v2 (si algo falla después, lo
      // pagado no se pierde).
      if (args.guardarConectores) {
        await subirTexto(db, rutaConectores, JSON.stringify(conectores, null, 2), 'application/json');
      }
    }

    capitulos.push({ nombre: capitulo.nombre, markdown: texto, historias, conectores });
    resumen.push({ numero, nombre: capitulo.nombre, modo: 'hibrido', historias: historias.length, conectores: origen });
  }

  // `armarNarracionJson` cuida el contrato (híbrido con la cantidad de puentes
  // que corresponde) — el texto ya viene en plano del v1, así que volver a
  // pasarlo por `markdownATextoPlano` (que hace `armarNarracionJson`) lo deja
  // igual.
  const narracion = armarNarracionJson({
    narradorId: args.narradorId,
    pedidoId: args.pedidoId,
    titulo: edicion.titulo ?? estructura.titulo,
    capitulos,
  });

  return { narracion, capitulos: resumen, conectoresDelModelo, v1Texto, narracionesDelBuzon };
}

function imprimirResumen(armado: NarracionV2Armada, cierre: string): void {
  console.log(`narracion.json v2 — ${armado.narracion.capitulos.length} capítulo(s)`);
  for (const capitulo of armado.capitulos) {
    const detalle =
      capitulo.modo === 'hibrido'
        ? `híbrido: ${capitulo.historias} historia(s) con audio real, conectores del ${capitulo.conectores === 'cache' ? 'caché' : 'modelo'}`
        : 'clonado: sin ningún audio, se narra entero';
    console.log(`  ${String(capitulo.numero).padStart(2)}. ${capitulo.nombre} — ${detalle}`);
  }
  console.log(`Conectores pedidos al modelo en esta corrida: ${armado.conectoresDelModelo}`);
  console.log(cierre);
}

/**
 * La corrida completa: arma el v2 y, salvo `--solo-json`, lo deja en Storage con
 * la fila del buzón y el pedido en `esperando_voz`.
 */
export async function correrNarracionV2(
  db: Db,
  args: {
    narradorId: string;
    pedidoId: string;
    soloJson: boolean;
    rutaSalida?: string | null;
    cachearConectores?: boolean;
  }
): Promise<ResultadoCorrida> {
  const armado = await armarNarracionV2(db, {
    narradorId: args.narradorId,
    pedidoId: args.pedidoId,
    guardarConectores: !args.soloJson || args.cachearConectores === true,
  });

  if (args.soloJson) {
    const ruta = args.rutaSalida ?? path.join(process.cwd(), `narracion-v2-${args.narradorId}.json`);
    await writeFile(ruta, JSON.stringify(armado.narracion, null, 2), 'utf8');
    imprimirResumen(armado, `--solo-json: no se tocó la base. El v2 quedó en ${ruta}`);
    return { ...armado, rutaSalida: ruta, narracionId: null };
  }

  // El v1 es lo único que quedó del texto del libro (los borradores se borran
  // al entregar): copia antes de pisarlo, por si el upsert sale mal.
  if (armado.v1Texto !== null) {
    await subirTexto(db, RUTA_NARRACION_JSON(args.narradorId).replace(/narracion\.json$/, 'narracion_v1.json'), armado.v1Texto, 'application/json');
  }
  await subirTexto(db, RUTA_NARRACION_JSON(args.narradorId), JSON.stringify(armado.narracion, null, 2), 'application/json');

  // La narración vieja del pedido (la `lista` de la entrega anterior) queda
  // `reemplazada` y la nueva entra en cola — en ese orden. El pedido se toca
  // después: con una `lista` vieja y el pedido en `esperando_voz`, la fábrica
  // ensamblaría esa voz como si fuera la nueva.
  const narracionId = await reemplazarNarracion(db, args.pedidoId, { narraciones: armado.narracionesDelBuzon });

  const { error: errorUpdate } = await db.from('pedidos').update({ estado: 'esperando_voz' }).eq('id', args.pedidoId);
  if (errorUpdate) throw new Error(`No se pudo poner el pedido ${args.pedidoId} en esperando_voz: ${errorUpdate.message}`);

  imprimirResumen(
    armado,
    `Listo: narracion.json v2 en Storage, narración ${narracionId} en el buzón y el pedido ${args.pedidoId} esperando_voz. La PC de música lo narra en su próxima vuelta.`
  );
  return { ...armado, rutaSalida: null, narracionId };
}

function cargarEnvSiEsta(): void {
  const rutaEnv = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.env');
  if (existsSync(rutaEnv)) process.loadEnvFile(rutaEnv);
}

async function main(): Promise<void> {
  const opciones = parsearArgs(process.argv.slice(2));
  // El entorno antes de `obtenerClienteDb` (arma el cliente con `cargarConfig`).
  cargarEnvSiEsta();
  await correrNarracionV2(obtenerClienteDb(), opciones);
}

if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
