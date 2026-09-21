import { fileURLToPath } from 'node:url';
import { obtenerClienteDb, type Narrador } from './db.js';
import { cargarConfig } from './config.js';
import { generarAnticipo } from './libro/anticipo.js';
import { firmarTokenAnticipo } from './libro/token-anticipo.js';
import { borrarArchivos, descargarJson, rutasDeBorradores, subirTexto } from './libro/comun.js';
import { enviarMailAnticipo } from './mail/anticipo.js';
import { enviarMailHito, CANDADO_POR_HITO, type Hito } from './mail/hitos.js';
import {
  CANDADO_RECORDATORIO_FRASES,
  DIAS_RECORDATORIO_FRASES,
  enviarMailRecordatorioFrases,
  RUTA_RECORDATORIO_FRASES,
} from './mail/frases.js';
import { avisarSocios, asuntoAviso, cuerpoAviso, CANDADO_AVISO, type MotivoAviso } from './mail/socios.js';
import { generarEstructura } from './libro/estructura.js';
import { generarPrevisualizacion } from './libro/previsualizar.js';
import { generarPaquete } from './libro/generar-paquete.js';
import { leerFrases } from './libro/publicar-frases.js';
import { narracionesListas, narracionesAtascadas, RUTA_NARRACION_JSON } from './voz/narraciones.js';
import { ensamblarAudiolibroClonado } from './voz/ensamblar.js';
import type { NarracionJson } from './voz/narracion-json.js';

const INTERVALO_MS = 60_000;

/**
 * A la tercera respuesta se le manda a la familia el anticipo del libro.
 * Configurable por entorno, como acordaron los socios: mover este momento
 * tiene que ser cambiar un valor, no reescribir el producto.
 */
const RESPUESTAS_PARA_ANTICIPO = Number(process.env.RESPUESTAS_PARA_ANTICIPO ?? 3);

/** Estados del narrador en los que ya no hay más preguntas: el libro se puede cerrar. */
const ESTADOS_TERMINADO = ['completado', 'cerrado_anticipado'];

/** Días desde la última respuesta a los que se recuerda que falta Cerrar libro. */
const DIAS_RECORDATORIO = [3, 7, 14] as const;

/** A los 30 días sin cerrar, la fábrica cierra sola con la propuesta (está en los términos). */
const DIAS_CIERRE_AUTOMATICO = 30;

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/** Marca de que fue la fábrica la que cerró el libro (ver `avisarHitosDeCierre`). No es un candado de mail. */
const MARCA_CIERRE_AUTOMATICO = 'cierre_automatico.txt';

type Db = ReturnType<typeof obtenerClienteDb>;

/** Lo que hace falta de un narrador para mandarle un mail de hito a su familia. */
type NarradorConFamilia = Pick<Narrador, 'id' | 'como_le_dicen' | 'familia_id'>;

/** Lo mismo, más las fechas que deciden recordatorios y cierre automático. */
type NarradorTerminado = NarradorConFamilia & Pick<Narrador, 'ultima_respuesta_at' | 'libro_aprobado_at'>;

let corriendo = false;

/**
 * Ids de pedidos en 'generando' que ESTE proceso reclamó y todavía tiene en
 * curso (generarPaquete no terminó). Un pedido sale del Set apenas
 * generarPaquete resuelve, sea éxito o falla — ella misma es responsable de
 * dejarlo en 'entregado' o 'fallido'. Si el proceso muere a mitad de camino,
 * el Set se pierde con él y `liberarPedidosGenerandoHuerfanos` lo detecta en
 * el próximo tick de OTRO proceso (o de este mismo, si sobrevivió pero el
 * pedido quedó huérfano por algún motivo).
 */
const pedidosGenerandoClaimados = new Set<string>();

/**
 * Un ciclo del worker. Se exporta para poder testearlo directo (sin esperar
 * el setInterval). Guardado por `corriendo` para no solapar ticks si un
 * ciclo tarda más que el intervalo.
 */
export async function tick(): Promise<void> {
  if (corriendo) return;
  corriendo = true;
  try {
    await generarAnticiposFaltantes();
    await generarEstructurasFaltantes();
    await generarPrevisualizacionesFaltantes();
    await avisarHitosDeCierre();
    await procesarPedidosPagados();
    await ensamblarNarracionesListas();
    await avisarNarracionesAtascadas();
    await avisarLibrosListos();
  } finally {
    corriendo = false;
  }
}
    await recordarFrasesPendientes();

/**
 * Los nombres de archivo que hay en `{narrador_id}/paquete/` en Storage: ahí
 * viven los productos (estructura.json, preview.pdf...) y los candados de
 * los mails. Tira si Storage no responde — quien llama decide si loguea y
 * sigue con el próximo narrador.
 */
async function listarPaquete(db: Db, narradorId: string): Promise<Set<string>> {
  return (await listarPaqueteDeStorage(db, narradorId)).archivos;
}

/**
 * Lo mismo, más la fecha de creación de cada archivo. Existe aparte porque el
 * recordatorio de frases necesita CUÁNDO se entregó el libro, y sin migración no
 * hay `pedidos.entregado_at`: `frases.json` se escribe en el mismo tick que la
 * entrega (paso 2 de `generarPaquete`, segundos antes del update a 'entregado'),
 * así que su `created_at` es la fecha de entrega más fiel que hay en el paquete.
 * Las dos cosas van juntas para no listar el paquete dos veces por narrador.
 */
async function listarPaqueteDeStorage(
  db: Db,
  narradorId: string
): Promise<{ archivos: Set<string>; creados: Map<string, string> }> {
  const { data: archivos, error } = await db.storage.from('audios').list(`${narradorId}/paquete`);
  if (error) throw new Error(`No se pudo listar el paquete de ${narradorId}: ${error.message}`);
  const lista = archivos ?? [];
  const creados = new Map<string, string>();
  for (const archivo of lista) {
    // Storage puede no devolver la fecha (objeto raro, API vieja). El que la
    // necesita decide qué hacer sin ella; acá no se inventa una.
    if (archivo.created_at) creados.set(archivo.name, archivo.created_at);
  }
  return { archivos: new Set(lista.map((archivo) => archivo.name)), creados };
}

/**
 * Branch (a0): narradores que ya contestaron 3 preguntas y todavía no
 * recibieron el anticipo → generarlo y avisarle a la familia por mail.
 *
 * Es el momento de la venta: el material más barato que tenemos (30 centavos
 * de entrevista) contra la prueba completa de que el producto funciona.
 *
 * DOS candados separados, y es a propósito:
 *   - `anticipo.pdf` corta la generación (lo caro: la llamada al modelo).
 *   - `anticipo_enviado.txt` corta el envío del mail.
 * Si el mail falla después de generar, el próximo tick reintenta SOLO el
 * mail y no vuelve a pagarle al modelo. Con un candado único habría que
 * elegir entre repagar o no reintentar nunca.
 */
async function generarAnticiposFaltantes(): Promise<void> {
  const db = obtenerClienteDb();

  const { data: narradores, error } = await db
    .from('narradores')
    .select('id, como_le_dicen, familia_id')
    .in('estado', ['activo', 'pausado']);

  if (error) {
    console.error('tick: no se pudieron leer los narradores para el anticipo:', error.message);
    return;
  }

  for (const narrador of (narradores ?? []) as {
    id: string;
    como_le_dicen: string;
    familia_id: string;
  }[]) {
    try {
      const nombresArchivos = await listarPaquete(db, narrador.id);
      if (nombresArchivos.has('anticipo_enviado.txt')) continue;

      const { count, error: errorCuenta } = await db
        .from('respuestas')
        .select('*', { count: 'exact', head: true })
        .eq('narrador_id', narrador.id);
      if (errorCuenta) {
        console.error(`tick: no se pudieron contar las respuestas de ${narrador.id}:`, errorCuenta.message);
        continue;
      }
      if ((count ?? 0) < RESPUESTAS_PARA_ANTICIPO) continue;

      if (!nombresArchivos.has('anticipo.pdf')) {
        await generarAnticipo(narrador.id);
      }

      await avisarDelAnticipo(narrador);
    } catch (err) {
      console.error(`tick: falló el anticipo de ${narrador.id}:`, err);
    }
  }
}

/**
 * El mail que le avisa a la familia que ya hay algo para ver. Solo deja el
 * candado `anticipo_enviado.txt` si Resend confirmó el envío: si falta la
 * clave, `enviarMailAnticipo` devuelve false y el próximo tick reintenta
 * (así, cargar RESEND_API_KEY alcanza para que salgan los pendientes).
 */
async function avisarDelAnticipo(narrador: {
  id: string;
  como_le_dicen: string;
  familia_id: string;
}): Promise<void> {
  const db = obtenerClienteDb();

  const { data: familia, error: errorFamilia } = await db
    .from('familias')
    .select('email')
    .eq('id', narrador.familia_id)
    .single();
  if (errorFamilia || !familia) {
    throw new Error(`No se pudo leer la familia de ${narrador.id}: ${errorFamilia?.message ?? 'sin datos'}`);
  }

  // La primera pregunta que efectivamente contestó, para citarla en el mail.
  const { data: respuestas } = await db
    .from('respuestas')
    .select('pregunta_orden')
    .eq('narrador_id', narrador.id)
    .order('pregunta_orden', { ascending: true })
    .limit(1);
  const primerOrden = (respuestas ?? [])[0]?.pregunta_orden ?? 1;

  const { data: pregunta } = await db
    .from('preguntas')
    .select('texto')
    .is('narrador_id', null)
    .eq('orden', primerOrden)
    .single();

  const enviado = await enviarMailAnticipo({
    para: (familia as { email: string }).email,
    comoLeDicen: narrador.como_le_dicen,
    primeraPregunta: (pregunta as { texto: string } | null)?.texto ?? '',
    enlace: `${cargarConfig().urlBase}/anticipo/${firmarTokenAnticipo(narrador.id)}`,
  });

  if (enviado) {
    await subirTexto(db, `${narrador.id}/paquete/anticipo_enviado.txt`, new Date().toISOString());
  }
}

/**
 * Branch (a): narradores completado/cerrado_anticipado sin
 * {narrador_id}/paquete/estructura.json en Storage → generarEstructura.
 */
async function generarEstructurasFaltantes(): Promise<void> {
  const db = obtenerClienteDb();

  const { data: narradores, error } = await db
    .from('narradores')
    .select('id')
    .in('estado', ['completado', 'cerrado_anticipado']);

  if (error) {
    console.error('tick: no se pudieron leer los narradores listos para armar el libro:', error.message);
    return;
  }

  for (const narrador of (narradores ?? []) as { id: string }[]) {
    try {
      const archivos = await listarPaquete(db, narrador.id);
      if (archivos.has('estructura.json')) continue;

      await generarEstructura(narrador.id);
    } catch (err) {
      console.error(`tick: falló generarEstructura para ${narrador.id}:`, err);
    }
  }
}

/**
 * Branch (a2): narradores completado/cerrado_anticipado que YA tienen
 * estructura.json Y nombres.json (la familia corrigió los nombres) pero
 * todavía no tienen preview.pdf → generarPrevisualizacion. El momento de
 * enamorar: el capítulo 1 escrito de verdad, con los nombres bien.
 */
async function generarPrevisualizacionesFaltantes(): Promise<void> {
  const db = obtenerClienteDb();

  const { data: narradores, error } = await db
    .from('narradores')
    .select('id')
    .in('estado', ['completado', 'cerrado_anticipado']);

  if (error) {
    console.error('tick: no se pudieron leer los narradores listos para previsualizar:', error.message);
    return;
  }

  for (const narrador of (narradores ?? []) as { id: string }[]) {
    try {
      const archivos = await listarPaquete(db, narrador.id);
      const tieneEstructura = archivos.has('estructura.json');
      const tieneNombres = archivos.has('nombres.json');
      const tienePreview = archivos.has('preview.pdf');

      if (!tieneEstructura || !tieneNombres || tienePreview) continue;

      await generarPrevisualizacion(narrador.id);
    } catch (err) {
      console.error(`tick: falló generarPrevisualizacion para ${narrador.id}:`, err);
    }
  }
}

/**
 * Los mails que acompañan el cierre del libro (spec §9 y §6 del diseño):
 * "terminó" cuando el narrador pasa a completado, recordatorios a los 3, 7 y
 * 14 días sin Cerrar libro, y a los 30 el cierre automático con la
 * propuesta (la fábrica pone `libro_aprobado_at` ella misma — es el único
 * caso en que lo escribe alguien que no es la web, ver CONTRATO.md).
 * Un candado por mail en Storage; se deja SOLO si Resend confirmó.
 * Si la fábrica estuvo caída y pasaron varios hitos, se manda una sola vez
 * el más reciente y se marcan los anteriores.
 *
 * El cierre automático deja además la marca `cierre_automatico.txt` apenas
 * el CAS confirma que fuimos nosotros los que cerramos: es lo único que
 * distingue "lo cerramos nosotros y el mail no salió" (hay que reintentar)
 * de "lo cerró la dueña desde la web" (no hay nada que mandar).
 */
async function avisarHitosDeCierre(): Promise<void> {
  const db = obtenerClienteDb();
  const { urlBase } = cargarConfig();

  const { data: narradores, error } = await db
    .from('narradores')
    .select('id, como_le_dicen, familia_id, ultima_respuesta_at, libro_aprobado_at')
    .in('estado', ESTADOS_TERMINADO);

  if (error) {
    console.error('tick: no se pudieron leer los narradores terminados:', error.message);
    return;
  }

  for (const narrador of (narradores ?? []) as NarradorTerminado[]) {
    try {
      const archivos = await listarPaquete(db, narrador.id);
      const enlace = `${urlBase}/tablero/${narrador.id}`;
      const mandar = (hito: Hito) => mandarHito(db, narrador, hito, enlace, archivos);

      if (!archivos.has(CANDADO_POR_HITO.terminado)) await mandar('terminado');

      // Lo cerramos nosotros en un tick anterior pero el mail no salió
      // (sin clave, Resend caído): reintentar antes de mirar
      // `libro_aprobado_at`, que ya está puesto y cortaría acá abajo.
      if (archivos.has(MARCA_CIERRE_AUTOMATICO) && !archivos.has(CANDADO_POR_HITO.cierre_automatico)) {
        await mandar('cierre_automatico');
        continue;
      }

      // Con el libro cerrado (por la web o por nosotros) no hay nada que
      // recordar. Sin fecha de última respuesta no hay desde cuándo contar.
      // `!= null` a propósito: si la columna no vino en el select (o llega
      // undefined desde un fake), se trata como cerrado y no se recuerda de más.
      if (narrador.libro_aprobado_at != null || !narrador.ultima_respuesta_at) continue;
      const dias = Math.floor((Date.now() - new Date(narrador.ultima_respuesta_at).getTime()) / MS_POR_DIA);

      if (dias >= DIAS_CIERRE_AUTOMATICO) {
        // Compare-and-swap: solo cerramos si sigue abierto. Si no vuelve
        // ninguna fila, la dueña lo cerró desde la web entre el SELECT y
        // este UPDATE — su cierre vale, y el mail de "lo cerramos por ti"
        // sería mentira. (Si ya está la marca de cierre automático,
        // `libro_aprobado_at` está puesto y no se llega acá.)
        const { data: cerrado, error: errorCierre } = await db
          .from('narradores')
          .update({ libro_aprobado_at: new Date().toISOString() })
          .eq('id', narrador.id)
          .is('libro_aprobado_at', null)
          .select('id');
        if (errorCierre) throw new Error(`no se pudo cerrar solo: ${errorCierre.message}`);
        if (!cerrado || (cerrado as unknown[]).length !== 1) continue;
        // La marca va DESPUÉS del CAS y ANTES del mail: recién ahora sabemos
        // que fuimos nosotros, y si el mail falla el próximo tick lo reintenta.
        await subirTexto(db, `${narrador.id}/paquete/${MARCA_CIERRE_AUTOMATICO}`, new Date().toISOString());
        archivos.add(MARCA_CIERRE_AUTOMATICO);
        await mandar('cierre_automatico');
        continue;
      }

      const vencidos = DIAS_RECORDATORIO.filter((d) => dias >= d);
      if (vencidos.length === 0) continue;
      const mayor = vencidos[vencidos.length - 1];
      const hitoMayor = `recordatorio_${mayor}` as Hito;
      if (archivos.has(CANDADO_POR_HITO[hitoMayor])) continue;

      const enviado = await mandar(hitoMayor);
      if (enviado) {
        // Los recordatorios anteriores que quedaron sin mandar se marcan
        // como hechos: la familia ya recibió el más reciente, no hace falta
        // que le lleguen tres mails seguidos.
        for (const d of vencidos.slice(0, -1)) {
          const candado = CANDADO_POR_HITO[`recordatorio_${d}` as Hito];
          if (archivos.has(candado)) continue;
          await subirTexto(db, `${narrador.id}/paquete/${candado}`, new Date().toISOString());
          archivos.add(candado);
        }
      }
    } catch (err) {
      console.error(`tick: fallaron los mails de cierre de ${narrador.id}:`, err);
    }
  }
}

/**
 * Manda el mail de un hito a la familia del narrador y, si Resend confirmó,
 * deja el candado en Storage (y lo agrega al Set de `archivos`, para que el
 * mismo tick no lo vuelva a considerar pendiente). Devuelve si salió.
 * Si falta la clave, `enviarMailHito` devuelve false y no queda candado: el
 * próximo tick reintenta — igual que el anticipo.
 */
async function mandarHito(
  db: Db,
  narrador: NarradorConFamilia,
  hito: Hito,
  enlace: string,
  archivos: Set<string>
): Promise<boolean> {
  // El candado manda: si ya está, ese mail ya salió (o alguien lo sembró a
  // mano para que no salga, como los 7 de Osvaldo al preparar el redeploy).
  // Sin este chequeo, el cierre automático de los 30 días volvía a mandarlo: la
  // rama del CAS llamaba a `mandar('cierre_automatico')` sin mirar el candado y
  // `mandarHito` tampoco lo miraba — a Osvaldo le llegó el mail que se había
  // sembrado el candado para evitar (bitácora 33). El cierre del libro en sí no
  // se frena acá: eso lo decide `libro_aprobado_at`, no el mail.
  if (archivos.has(CANDADO_POR_HITO[hito])) return false;

  const { data: familia, error: errorFamilia } = await db
    .from('familias')
    .select('email')
    .eq('id', narrador.familia_id)
    .single();
  if (errorFamilia || !familia) {
    throw new Error(`No se pudo leer la familia de ${narrador.id}: ${errorFamilia?.message ?? 'sin datos'}`);
  }

  const enviado = await enviarMailHito({
    hito,
    para: (familia as { email: string }).email,
    comoLeDicen: narrador.como_le_dicen,
    enlace,
  });

  if (enviado) {
    const candado = CANDADO_POR_HITO[hito];
    await subirTexto(db, `${narrador.id}/paquete/${candado}`, new Date().toISOString());
    archivos.add(candado);
  }
  return enviado;
}

/**
 * Branch (c): pedidos 'entregado' cuyo narrador todavía no tiene
 * `libro_listo_enviado.txt` → el mail de "el libro está listo". Un mail por
 * narrador, no por pedido: un extra (otro ejemplar) del mismo narrador
 * comparte el candado.
 */
async function avisarLibrosListos(): Promise<void> {
  const db = obtenerClienteDb();
  const { urlBase } = cargarConfig();

  const { data: pedidos, error } = await db.from('pedidos').select('id, narrador_id').eq('estado', 'entregado');

  if (error) {
    console.error('tick: no se pudieron leer los pedidos entregados:', error.message);
    return;
  }

  const narradoresEntregados = new Set(((pedidos ?? []) as { narrador_id: string }[]).map((p) => p.narrador_id));

  for (const narradorId of narradoresEntregados) {
    try {
      const archivos = await listarPaquete(db, narradorId);
      if (archivos.has(CANDADO_POR_HITO.libro_listo)) continue;

      const { data: narrador, error: errorNarrador } = await db
        .from('narradores')
        .select('id, como_le_dicen, familia_id')
        .eq('id', narradorId)
        .single();
      if (errorNarrador || !narrador) {
        throw new Error(`No se pudo leer el narrador: ${errorNarrador?.message ?? 'sin datos'}`);
      }

      await mandarHito(db, narrador as NarradorConFamilia, 'libro_listo', `${urlBase}/tablero/${narradorId}`, archivos);
    } catch (err) {
      console.error(`tick: falló el mail de libro listo de ${narradorId}:`, err);
    }
  }
}

/**
 * Branch (f): pedidos 'entregado' cuya familia todavía no confirmó las frases de
 * «Su voz» y ya pasaron los `DIAS_RECORDATORIO_FRASES` → UN recordatorio por mail
 * (spec 2026-09-20: la selección se cierra al apretar "imprimir", y si nadie
 * responde queda la del biógrafo).
 *
 * Un mail por NARRADOR, no por pedido: el candado vive en el paquete del libro y
 * una copia extra del mismo libro (invitado, visitante) no es otro libro ni otra
 * selección de frases. El candado se chequea ANTES de todo lo demás, así que la
 * promesa de "una sola vez" la sostiene el archivo, no el paso del tiempo.
 *
 * La fecha de entrega sale del `created_at` de `frases.json` en Storage (no hay
 * `pedidos.entregado_at` y no se migra: ver `listarPaqueteDeStorage`). Si el
 * archivo no está, o Storage no dice cuándo se creó, no se manda: el recordatorio
 * puede llegar tarde, nunca antes de tiempo.
 *
 * Devuelve cuántos mails salieron. El mail que falla NO se marca: el próximo tick
 * lo reintenta (sin candado no hay "ya está" falso), y la falla se atrapa por
 * narrador — una familia sin dirección de mail no puede frenar a las demás ni
 * tumbar el tick.
 */
export async function recordarFrasesPendientes(ahora: Date = new Date()): Promise<number> {
  const db = obtenerClienteDb();
  const { urlBase } = cargarConfig();

  const { data: pedidos, error } = await db.from('pedidos').select('id, narrador_id').eq('estado', 'entregado');

  if (error) {
    console.error('tick: no se pudieron leer los pedidos entregados para el recordatorio de frases:', error.message);
    return 0;
  }

  const narradoresEntregados = new Set(((pedidos ?? []) as { narrador_id: string }[]).map((p) => p.narrador_id));

  let enviados = 0;
  for (const narradorId of narradoresEntregados) {
    try {
      const { archivos, creados } = await listarPaqueteDeStorage(db, narradorId);

      // El candado manda: ya salió (o alguien lo sembró a mano para que no salga).
      if (archivos.has(CANDADO_RECORDATORIO_FRASES)) continue;

      // Sin `frases.json` no hay nada que confirmar: libro entregado antes de Su
      // voz, o un libro sin audios (la selección con cero capítulos no existe).
      const creado = creados.get('frases.json');
      if (!creado) continue;

      const dias = Math.floor((ahora.getTime() - new Date(creado).getTime()) / MS_POR_DIA);
      if (!Number.isFinite(dias)) {
        console.warn(`tick: la fecha de frases.json de ${narradorId} no se entiende ("${creado}") — no se recuerda nada.`);
        continue;
      }
      if (dias < DIAS_RECORDATORIO_FRASES) continue;

      const frases = await leerFrases(db, narradorId);
      // Confirmó (`confirmado_at`) → no hay nada que recordarle. Sin capítulos
      // con frases, el mail prometería algo que no existe.
      if (!frases || frases.confirmado_at != null || (frases.capitulos ?? []).length === 0) continue;

      const { data: narrador, error: errorNarrador } = await db
        .from('narradores')
        .select('id, como_le_dicen, familia_id')
        .eq('id', narradorId)
        .single();
      if (errorNarrador || !narrador) {
        throw new Error(`No se pudo leer el narrador: ${errorNarrador?.message ?? 'sin datos'}`);
      }
      const quien = narrador as NarradorConFamilia;

      const { data: familia, error: errorFamilia } = await db
        .from('familias')
        .select('email')
        .eq('id', quien.familia_id)
        .single();
      if (errorFamilia || !familia) {
        throw new Error(`No se pudo leer la familia de ${narradorId}: ${errorFamilia?.message ?? 'sin datos'}`);
      }

      const enviado = await enviarMailRecordatorioFrases({
        para: (familia as { email: string }).email,
        comoLeDicen: quien.como_le_dicen,
        // Al panel del libro, que es el que existe hoy: la pestaña de frases
        // (`/tablero/{id}/frases`, spec §Arquitectura) la hace la web y se entra
        // desde ahí. Es una línea, el día que la web la publique.
        enlace: `${urlBase}/tablero/${narradorId}`,
      });

      if (enviado) {
        await subirTexto(db, RUTA_RECORDATORIO_FRASES(narradorId), ahora.toISOString());
        enviados++;
      }
    } catch (err) {
      console.error(`tick: falló el recordatorio de frases de ${narradorId}:`, err);
    }
  }

  return enviados;
}

/**
 * Un pedido en 'generando' que este proceso NO tiene en
 * `pedidosGenerandoClaimados` es huérfano: nadie lo está procesando ahora
 * mismo (el proceso que lo reclamó murió antes de que generarPaquete
 * pudiera dejarlo en 'entregado' o 'fallido'). Se devuelve a 'pagado' para
 * que el próximo `for` de este mismo tick (o el de otro proceso) lo vuelva
 * a intentar. El `.eq('estado','generando')` en el reset es la misma
 * precaución que el CAS del claim: si justo en este instante otro proceso
 * lo terminó (pasó a 'entregado'/'fallido') entre nuestro SELECT y este
 * UPDATE, no lo pisamos.
 */
async function liberarPedidosGenerandoHuerfanos(db: ReturnType<typeof obtenerClienteDb>): Promise<void> {
  const { data: pedidosGenerando, error } = await db.from('pedidos').select('id').eq('estado', 'generando');

  if (error) {
    console.error('tick: no se pudieron leer los pedidos en generando:', error.message);
    return;
  }

  for (const pedido of (pedidosGenerando ?? []) as { id: string }[]) {
    if (pedidosGenerandoClaimados.has(pedido.id)) continue;

    console.warn(
      `tick: el pedido ${pedido.id} quedó huérfano en 'generando' (el proceso que lo reclamó no lo terminó) — lo devolvemos a 'pagado'.`
    );

    const { error: errorReset } = await db
      .from('pedidos')
      .update({ estado: 'pagado' })
      .eq('id', pedido.id)
      .eq('estado', 'generando');

    if (errorReset) {
      console.error(`tick: no se pudo devolver a 'pagado' el pedido huérfano ${pedido.id}:`, errorReset.message);
    }
  }
}

/**
 * Branch (b): pedidos en estado 'pagado' → armar el libro y el audiolibro
 * (generarPaquete). Antes de nada, cada pedido se reclama con un
 * compare-and-swap: `update estado='generando' where id=... and
 * estado='pagado'`, devolviendo la fila afectada. Si no vuelve ninguna fila,
 * alguien más (otra instancia del worker, u otro tick solapado) ya lo
 * reclamó primero — no lo procesamos dos veces. generarPaquete es
 * responsable de dejar el pedido en 'entregado' o 'fallido'; acá no hay
 * try/catch alrededor de esa llamada porque esa responsabilidad ya es
 * suya — ver su propio manejo de errores. Antes de reclamar nada, se
 * liberan los pedidos que quedaron huérfanos en 'generando' de un proceso
 * anterior que murió a mitad de camino.
 */
export async function procesarPedidosPagados(): Promise<void> {
  const db = obtenerClienteDb();

  await liberarPedidosGenerandoHuerfanos(db);

  // `extras` viaja hasta generarPaquete: de ahí lee qué se compró (voz
  // clonada → buzón `narraciones` en vez de armar el audiolibro acá).
  const { data: pedidos, error } = await db
    .from('pedidos')
    .select('id, narrador_id, extras')
    .eq('estado', 'pagado');

  if (error) {
    console.error('tick: no se pudieron leer los pedidos pagados:', error.message);
    return;
  }

  const pedidosPagados = (pedidos ?? []) as { id: string; narrador_id: string; extras: unknown }[];
  if (pedidosPagados.length === 0) return;

  // Con el pago por adelantado (11/09) un pedido está 'pagado' desde el día
  // cero, mucho antes de que haya un libro que escribir. Sin este filtro, el
  // worker reclamaría el pedido, generarPaquete fallaría por falta de
  // estructura.json/nombres.json y el pedido quedaría en 'fallido' para que
  // alguien lo resetee a mano.
  //
  // El libro se escribe recién cuando la dueña apretó "Cerrar libro"
  // (`narradores.libro_aprobado_at`). Es el punto de aprobación del cliente:
  // antes de eso no se produce nada, ni digital ni impreso — decisión de los
  // socios del 12/09, y de Naza el 13/09: ella no ve nada escrito antes de
  // cerrar. Que el narrador esté `completado` ya no alcanza.
  const { data: narradores, error: errorNarradores } = await db
    .from('narradores')
    .select('id, libro_aprobado_at')
    .in('id', pedidosPagados.map((p) => p.narrador_id));

  if (errorNarradores) {
    console.error('tick: no se pudieron leer los narradores de los pedidos pagados:', errorNarradores.message);
    return;
  }

  const narradoresListos = new Set(
    ((narradores ?? []) as { id: string; libro_aprobado_at: string | null }[])
      .filter((n) => n.libro_aprobado_at !== null)
      .map((n) => n.id)
  );

  // Un narrador con un pedido ya 'entregado' tiene el libro hecho. Los
  // pedidos posteriores sobre el mismo narrador (extras de la dueña, la
  // copia de un visitante — CONTRATO.md: un pedido por comprador) llegan
  // 'pagado' igual que el primero, pero NO hay nada que generar: repagarle
  // al modelo y pisar libro.html/libro.pdf/audiolibro sería un error. Se
  // reclaman igual (CAS) y pasan a 'entregado' apuntando a los mismos
  // archivos. Se traen todos los entregados y se filtra acá: el fake de los
  // tests distingue las consultas a `pedidos` por estado.
  const { data: entregados, error: errorEntregados } = await db
    .from('pedidos')
    .select('id, narrador_id, libro_pdf_path, audiolibro_paths')
    .eq('estado', 'entregado');

  if (errorEntregados) {
    console.error('tick: no se pudieron leer los pedidos entregados:', errorEntregados.message);
    return;
  }

  const entregadoPorNarrador = new Map<string, PedidoEntregado>();
  for (const entregado of (entregados ?? []) as PedidoEntregado[]) {
    if (!entregadoPorNarrador.has(entregado.narrador_id)) entregadoPorNarrador.set(entregado.narrador_id, entregado);
  }

  // Un narrador con un pedido 'esperando_voz' tiene el libro hecho y la voz
  // en camino (buzón `narraciones`). Un segundo pedido 'pagado' sobre él no
  // se reclama todavía: generarPaquete volvería a escribir el libro (los
  // borradores ya se borraron → se le paga al modelo de nuevo) y no hay
  // pedido entregado del que copiar rutas. Se deja en 'pagado'; cuando el
  // primero pase a 'entregado', el camino de arriba lo entrega con los
  // mismos archivos.
  const { data: esperandoVoz, error: errorEsperando } = await db
    .from('pedidos')
    .select('id, narrador_id')
    .eq('estado', 'esperando_voz');

  if (errorEsperando) {
    console.error('tick: no se pudieron leer los pedidos esperando voz:', errorEsperando.message);
    return;
  }

  const narradoresEsperandoVoz = new Set(((esperandoVoz ?? []) as { narrador_id: string }[]).map((p) => p.narrador_id));

  for (const pedido of pedidosPagados) {
    if (!narradoresListos.has(pedido.narrador_id)) continue;
    if (narradoresEsperandoVoz.has(pedido.narrador_id)) continue;
    const { data: reclamado, error: errorClaim } = await db
      .from('pedidos')
      .update({ estado: 'generando' })
      .eq('id', pedido.id)
      .eq('estado', 'pagado')
      .select('id');

    if (errorClaim) {
      console.error(`tick: no se pudo reclamar el pedido ${pedido.id}:`, errorClaim.message);
      continue;
    }

    // Compare-and-swap: si no volvió ninguna fila, otro proceso ya lo
    // reclamó entre el SELECT de arriba y este UPDATE.
    if (!reclamado || (reclamado as unknown[]).length !== 1) {
      continue;
    }

    pedidosGenerandoClaimados.add(pedido.id);
    try {
      const yaEntregado = entregadoPorNarrador.get(pedido.narrador_id);
      if (yaEntregado) {
        await entregarConLosMismosArchivos(db, pedido, yaEntregado);
      } else {
        await generarPaquete(pedido);
      }
    } finally {
      pedidosGenerandoClaimados.delete(pedido.id);
    }
  }
}

/** Lo que hace falta de un pedido entregado para que otro del mismo narrador apunte a los mismos archivos. */
type PedidoEntregado = {
  id: string;
  narrador_id: string;
  libro_pdf_path: string | null;
  audiolibro_paths: unknown;
};

/**
 * Deja 'entregado' un pedido recién reclamado copiando las rutas del pedido
 * ya entregado del mismo narrador. Si el UPDATE falla, se loguea y el
 * pedido queda en 'generando': el próximo tick lo ve huérfano, lo devuelve
 * a 'pagado' y vuelve a pasar por acá.
 */
async function entregarConLosMismosArchivos(
  db: Db,
  pedido: { id: string; narrador_id: string },
  yaEntregado: PedidoEntregado
): Promise<void> {
  console.log(
    `tick: el pedido ${pedido.id} es de un narrador con libro entregado (pedido ${yaEntregado.id}) — se entrega con los mismos archivos, sin generar.`
  );
  const { error } = await db
    .from('pedidos')
    .update({
      estado: 'entregado',
      libro_pdf_path: yaEntregado.libro_pdf_path,
      audiolibro_paths: yaEntregado.audiolibro_paths,
    })
    .eq('id', pedido.id);
  if (error) {
    console.error(`tick: no se pudo entregar el pedido ${pedido.id} con los archivos del ${yaEntregado.id}:`, error.message);
  }
}

/**
 * Branch (d): narraciones que el worker de voz terminó (`lista`) con su
 * pedido todavía `esperando_voz` → pegar las intros, subir el audiolibro y
 * entregar el pedido con `audiolibro_paths`. Los nombres de los capítulos
 * salen de `narracion.json` — es lo que el worker narró, en ese orden — y
 * no de recomputar la edición. La fila de `narraciones` no se toca (la
 * escribe el worker): si el ensamblado falla, se loguea y la narración
 * sigue `lista`, así el próximo tick lo reintenta — un tropiezo pasajero
 * de Storage o ffmpeg se cura solo. Pero la primera falla avisa a los
 * socios (`ensamblado_fallido`, con candado): si es permanente, alguien
 * tiene que enterarse, porque cada reintento cuesta una intro TTS por
 * capítulo y no hay tope. El UPDATE del pedido exige
 * `estado = 'esperando_voz'`: si alguien lo movió entre el SELECT y acá, no
 * se pisa. Recién con el pedido entregado se borran los borradores
 * (`borrador_cap_NN.md` + `borrador_libro.md`): hasta ese momento son el
 * caché que evita repagarle al modelo si la narración queda `fallida` y
 * alguien vuelve el pedido a `pagado` con `audiolibro: "real"` (CONTRATO,
 * "Narraciones"). El mail `libro_listo` lo manda `avisarLibrosListos`, que
 * corre después en el mismo tick.
 */
export async function ensamblarNarracionesListas(): Promise<void> {
  const db = obtenerClienteDb();

  let listas;
  try {
    listas = await narracionesListas(db);
  } catch (err) {
    console.error('tick: no se pudieron leer las narraciones listas:', err);
    return;
  }

  for (const narracion of listas) {
    try {
      const narracionJson = await descargarJson<NarracionJson>(
        db,
        RUTA_NARRACION_JSON(narracion.narrador_id),
        'narracion.json'
      );
      const audiolibroPaths = await ensamblarAudiolibroClonado(db, {
        narradorId: narracion.narrador_id,
        pedidoId: narracion.pedido_id,
        capitulosPaths: narracion.capitulos_paths,
        estructura: { capitulos: narracionJson.capitulos.map((c) => ({ nombre: c.nombre })) },
      });

      const { data: entregado, error } = await db
        .from('pedidos')
        .update({ estado: 'entregado', audiolibro_paths: audiolibroPaths })
        .eq('id', narracion.pedido_id)
        .eq('estado', 'esperando_voz')
        .select('id');
      if (error) throw new Error(`no se pudo entregar el pedido ${narracion.pedido_id}: ${error.message}`);
      if (!entregado || (entregado as unknown[]).length !== 1) {
        console.warn(
          `tick: el audiolibro de la narración ${narracion.id} se armó pero el pedido ${narracion.pedido_id} ya no estaba esperando_voz — no se tocó.`
        );
        continue;
      }

      // Entregado: los borradores ya no hacen falta. Si el borrado falla no
      // es motivo para deshacer nada (el pedido está bien entregado): se
      // loguea y se sigue, como `limpiarBorradores` en generar-paquete.ts.
      try {
        await borrarArchivos(db, rutasDeBorradores(narracion.narrador_id, narracionJson.capitulos.length));
      } catch (errorLimpieza) {
        console.error(`tick: no se pudieron borrar los borradores de ${narracion.narrador_id}:`, errorLimpieza);
      }
    } catch (err) {
      console.error(`tick: falló el ensamblado de la narración ${narracion.id} (pedido ${narracion.pedido_id}):`, err);
      try {
        const archivos = await listarPaquete(db, narracion.narrador_id);
        await mandarAvisoConCandado(
          db,
          { id: narracion.id, narrador_id: narracion.narrador_id, motivo: 'ensamblado_fallido', error: mensajeDe(err) },
          archivos
        );
      } catch (errorAviso) {
        console.error(`tick: no se pudo avisar del ensamblado fallido de ${narracion.id}:`, errorAviso);
      }
    }
  }
}

const mensajeDe = (err: unknown) => (err instanceof Error ? err.message : String(err));

/**
 * Manda a los socios el aviso de una narración (un motivo) y, si Resend
 * confirmó, deja el candado `aviso_narracion_{id}_{motivo}.txt` en el
 * paquete del narrador (y lo agrega a `archivos`). Con el candado ya puesto
 * no manda nada. Mismo par de pasos que `mandarHito`.
 */
async function mandarAvisoConCandado(
  db: Db,
  aviso: { id: string; narrador_id: string; motivo: MotivoAviso; error: string | null },
  archivos: Set<string>
): Promise<void> {
  const candado = CANDADO_AVISO(aviso.id, aviso.motivo);
  if (archivos.has(candado)) return;

  const { data: narrador, error: errorNarrador } = await db
    .from('narradores')
    .select('como_le_dicen')
    .eq('id', aviso.narrador_id)
    .single();
  if (errorNarrador || !narrador) {
    throw new Error(`No se pudo leer el narrador: ${errorNarrador?.message ?? 'sin datos'}`);
  }
  const comoLeDicen = (narrador as { como_le_dicen: string }).como_le_dicen;

  const enviado = await avisarSocios(asuntoAviso(aviso.motivo, comoLeDicen), cuerpoAviso(aviso, comoLeDicen));
  if (enviado) {
    await subirTexto(db, `${aviso.narrador_id}/paquete/${candado}`, new Date().toISOString());
    archivos.add(candado);
  }
}

/**
 * Branch (e): el buzón de voz se atascó (CONTRATO.md, "Atascos") → un mail
 * a los socios por (narración, motivo), con candado
 * `aviso_narracion_{id}_{motivo}.txt` en el paquete del narrador que se
 * deja SOLO si Resend confirmó — el mismo par de pasos que los hitos. Una
 * narración puede avisar dos veces con motivos distintos (pendiente 24 h y
 * después fallida): son candados distintos a propósito.
 */
export async function avisarNarracionesAtascadas(): Promise<void> {
  const db = obtenerClienteDb();

  let atascadas;
  try {
    atascadas = await narracionesAtascadas(db, new Date());
  } catch (err) {
    console.error('tick: no se pudieron leer las narraciones atascadas:', err);
    return;
  }

  // El listado del paquete se hace una vez por narrador, aunque tenga varias
  // narraciones atascadas; los candados que se suben se agregan al Set.
  const archivosPorNarrador = new Map<string, Set<string>>();

  for (const atascada of atascadas) {
    try {
      let archivos = archivosPorNarrador.get(atascada.narrador_id);
      if (!archivos) {
        archivos = await listarPaquete(db, atascada.narrador_id);
        archivosPorNarrador.set(atascada.narrador_id, archivos);
      }
      await mandarAvisoConCandado(db, atascada, archivos);
    } catch (err) {
      console.error(`tick: falló el aviso de la narración atascada ${atascada.id}:`, err);
    }
  }
}

export function iniciarWorker(): void {
  setInterval(() => {
    void tick();
  }, INTERVALO_MS);
}

// Arranca solo cuando el archivo se ejecuta directamente (dev/start), no cuando
// se importa desde los tests.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  iniciarWorker();
}
