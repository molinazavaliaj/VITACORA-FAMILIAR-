// El aviso de dudas por WhatsApp a quien contó (plan 2026-11-06-dudas-narrador-sobre-212): si la Etapa A dejó dudas, un
// link para contestarlas y un recordatorio a las 48 horas. Vale para privados y para «para mí» (`dudasAQuienConto`): un
// regalo no privado no recibe nada de acá, sus dudas siguen con la familia. Solo V3 (`escritor/`) e historia
// (`escritor-historia/`): Kids y Viaje no tienen esas filas. El link para sacar respuestas lo manda el mensaje final
// (`mandarLinkAlTerminar`). Sale de acá solo si quien regala cerró antes de tiempo un libro privado: ahí no hubo mensaje
// final, y la web deja `ultima_respuesta_at` en la hora del cierre para que las 48 horas cuenten desde entonces.
//
// Corre en el tick de 15 minutos. Lo que ya pasó se lee de las marcas en Storage (CONTRATO, «Las dudas para quien
// contó»), las mismas que mira la fábrica. Un mensaje que no sale no escribe marca y se reintenta en el tick siguiente;
// la fábrica corre su plazo igual, así que nada se traba. Un mensaje que salió y cuya marca no se pudo escribir NO se
// vuelve a mandar: la marca queda en memoria y se reintenta primero.
//
// Dos procesos a la vez (un deploy): antes de mandar se sube `aviso-en-curso.txt` sin pisar y se vuelve a mirar qué le
// toca. La fábrica no lee ese archivo, así que nunca pasa por una marca de «salió». Se borra al terminar.

import type { SupabaseClient } from '@supabase/supabase-js';
import { PLANTILLAS_REVISION } from '../config.js';
import { esPrivado, firmarTokenRespuestas, linkConVentanaCerrada, plazoParaSacar, textoDelLink } from '../link-respuestas.js';
import { marcaEnStorage } from '../v3/avisos.js';
import { esTablaAusente } from '../v3/estado.js';
import { enLineaParaPlantilla, ventanaAbierta } from '../v3/enviar.js';
import type { Idioma } from '../v3/nucleo/entrevista/idioma.js';
import type { FichaTexto } from '../v3/nucleo/entrevista/texto.js';
import { enmascarar } from './regalo-entrega.js';
import { TEXTOS_REVISION } from './revision-narrador-textos.js';
import { minutosLocales } from './tiempo.js';

export type Mensaje = 'dudas' | 'recordatorio';
export type Situacion = {
  hayEtapaA: boolean; libroEscrito: boolean; cantidadDudas: number;
  todasContestadas: boolean; dudasAvisadasAt: string | null; recordada: boolean;
};
export type DepsRevision = {
  db: SupabaseClient;
  enviarTexto: (tel: string, texto: string, o: { timeoutMs: number }) => Promise<string>;
  enviarPlantilla: (tel: string, nombre: string, variables: string[], idiomaMeta: string, o: { botonUrl: string; timeoutMs: number }) => Promise<string>;
  /** Una vez por clave y por día; con `unaVez`, una sola. Nunca tira. */
  avisarSocios: (clave: string, asunto: string, detalle: string, o?: { unaVez?: boolean }) => Promise<unknown>;
  /** ¿Está aprobada en Meta? (WA_PLANTILLAS_V3_LISTAS) */
  plantillaLista: (idioma: Idioma, cual: 'dudas_narrador' | 'revision') => boolean;
  /** Donde vive la web (URL_BASE). */
  urlBase: string;
};

const RECORDAR_A_LAS_MS = 48 * 3600_000;
/** Como `TIMEOUT_ENVIO_V3_MS`: un envío colgado no puede trabar el tick. */
const TIMEOUT_ENVIO_MS = 20_000;
const DESDE_MINUTOS = 9 * 60;
const HASTA_MINUTOS = 21 * 60;
const BUCKET = 'audios';
const TANDA = 100;
/** El tope de filas por consulta de la base. */
const FILAS_POR_PAGINA = 1000;
const ESTADOS_TERMINADA = ['completado', 'cerrado_anticipado'];
/** El libro ya se está haciendo, ya salió o falló: no se le ofrece cambiar nada. */
const PEDIDOS_SIN_AVISO = new Set(['entregado', 'generando', 'esperando_voz', 'fallido']);
const ZONA_POR_IDIOMA: Readonly<Record<Idioma, string>> = {
  'es-AR': 'America/Argentina/Buenos_Aires', 'es-ES': 'Europe/Madrid', ca: 'Europe/Madrid',
};

const DUDAS_AVISADAS = 'dudas-narrador-avisadas.txt';
const DUDAS_RECORDADAS = 'dudas-recordadas.txt';
/** El mail de dudas a los socios, de la fábrica. */
const DUDAS_A_SOCIOS = 'dudas-avisadas.txt';
const TRABAJANDO = 'trabajando.json';
const TOMA = 'aviso-en-curso.txt';
/** Quien regala cerró antes de tiempo y ya se resolvió el link para sacar respuestas: salió, o no va a salir. */
const LINK_CIERRE = 'link-cierre-avisado.txt';
/** Como `MARCA_VIGENTE_MS` de la fábrica. */
const TRABAJANDO_VIGENTE_MS = 10 * 60_000;
/** Pasado este tiempo, las dudas ya vencieron para la fábrica: es un libro viejo. */
const DUDAS_VENCIDAS_MS = 72 * 3600_000;
/** Pasado este tiempo, una toma es de un proceso que murió. */
const TOMA_VIGENTE_MS = 30 * 60_000;

/** Qué le toca. Puro. Una fecha de aviso rota cuenta como no avisado, igual que en la fábrica. */
export function queMandar(s: Situacion, ahora: Date): Mensaje | null {
  if (s.libroEscrito || !s.hayEtapaA) return null;
  if (s.cantidadDudas === 0 || s.todasContestadas) return null;
  const avisadas = Date.parse(s.dudasAvisadasAt ?? '');
  if (!Number.isFinite(avisadas)) return 'dudas';
  if (s.recordada) return null;
  const pasaron = ahora.getTime() - avisadas;
  // Vencidas las 72 horas la fábrica ya no espera: recordarle sería prometer algo que no va a pasar.
  return pasaron >= RECORDAR_A_LAS_MS && pasaron < DUDAS_VENCIDAS_MS ? 'recordatorio' : null;
}

/** ¿Las dudas se las preguntamos a quien contó? Como `dudasAQuienConto` de la fábrica: Viaje y Kids nunca, aunque sean «para mí». */
export function dudasAQuienConto(contexto: unknown): boolean {
  const c = contexto as { modo?: unknown; vinculoComprador?: unknown } | null | undefined;
  if (c?.modo === 'viaje' || c?.modo === 'kids') return false;
  return esPrivado(contexto) || c?.vinculoComprador === 'yo mismo';
}

/** El mismo criterio que `escritorHistoriaPrendido` de la fábrica: sin escritor, a esa historia no le toca nada. */
function escritorHistoriaPrendido(narradorId: string): boolean {
  const v = (process.env.ESCRITOR_HISTORIA ?? '').trim();
  if (v === '1') return true;
  if (!v.startsWith('solo:')) return false;
  return v.slice(5).split(',').map((s) => s.trim()).filter(Boolean).includes(narradorId);
}

type Narrador = { id: string; estado: string; telefono_whatsapp: string | null; zona_horaria: string | null; como_le_dicen: string | null; ultima_respuesta_at?: string | null; contexto?: unknown };
type FilaEntrevista = { narrador_id: string; idioma: Idioma; estado: { ultimoEntranteAt?: string; linkFinal?: string } | null; ficha?: { nombre?: string; genero?: FichaTexto['genero'] } | null };
type Candidato = { narrador: Narrador; fila: FilaEntrevista; carpeta: 'escritor' | 'escritor-historia' };
type Marca = { path: string; contenido: string };
type Tabla = 'entrevistas_v3' | 'historias';

/** Con libro.md ya no hay nada que mandar: no se vuelve a listar su carpeta hasta el próximo deploy. */
const TERMINADOS = new Set<string>();
/** El mensaje salió y la marca no se pudo escribir: mientras esté acá, a ese narrador no se le manda nada. */
const MARCAS_SIN_ESCRIBIR = new Map<string, Marca>();

/** Para los tests. */
export function olvidarRevisiones(): void {
  TERMINADOS.clear();
  MARCAS_SIN_ESCRIBIR.clear();
}

/** ¿Son de 9 a 21 en su zona? Con una zona que no vale, la de su idioma. */
function enHorario(zona: string | null, idioma: Idioma, ahora: Date): boolean {
  let minutos: number;
  try {
    if (!zona) throw new RangeError('sin zona');
    minutos = minutosLocales(ahora, zona);
  } catch {
    minutos = minutosLocales(ahora, ZONA_POR_IDIOMA[idioma]);
  }
  return minutos >= DESDE_MINUTOS && minutos < HASTA_MINUTOS;
}

function enTandas<T>(lista: T[]): T[][] {
  const tandas: T[][] = [];
  for (let i = 0; i < lista.length; i += TANDA) tandas.push(lista.slice(i, i + TANDA));
  return tandas;
}

/** Todos los narradores de la tabla, de a páginas por el tope de filas. Sin la tabla (migración sin aplicar), ninguno. */
async function idsDe(db: SupabaseClient, tabla: Tabla): Promise<string[]> {
  const ids: string[] = [];
  let ultimo: string | null = null;
  for (;;) {
    const base = db.from(tabla).select('narrador_id');
    const { data, error } = await (ultimo === null ? base : base.gt('narrador_id', ultimo)).order('narrador_id').limit(FILAS_POR_PAGINA);
    if (error) {
      if (esTablaAusente(error)) return [];
      throw new Error(`No pude leer ${tabla}: ${error.message}`);
    }
    const pagina: string[] = ((data as { narrador_id: string }[] | null) ?? []).map((f) => f.narrador_id);
    ids.push(...pagina);
    if (pagina.length < FILAS_POR_PAGINA) return ids;
    ultimo = pagina[pagina.length - 1];
  }
}

async function filasDe(db: SupabaseClient, tabla: Tabla, ids: string[]): Promise<FilaEntrevista[]> {
  if (ids.length === 0) return [];
  const { data, error } = await db.from(tabla).select('narrador_id, idioma, estado, ficha').in('narrador_id', ids);
  if (error) {
    if (esTablaAusente(error)) return [];
    throw new Error(`No pude leer ${tabla}: ${error.message}`);
  }
  return (data as FilaEntrevista[] | null) ?? [];
}

async function candidatos(db: SupabaseClient): Promise<Candidato[]> {
  const conV3 = await idsDe(db, 'entrevistas_v3');
  // Como en la fábrica, una fila en `historias` manda: ese narrador no recibe nada del libro de siempre.
  const conHistoria = new Set(await idsDe(db, 'historias'));
  const ids = [...new Set([...conV3, ...conHistoria])]
    .filter((id) => !TERMINADOS.has(id) && (!conHistoria.has(id) || escritorHistoriaPrendido(id)));

  const salida: Candidato[] = [];
  for (const tanda of enTandas(ids)) {
    const { data, error } = await db.from('narradores')
      .select('id, estado, telefono_whatsapp, zona_horaria, como_le_dicen, ultima_respuesta_at, contexto')
      .in('id', tanda).in('estado', ESTADOS_TERMINADA);
    if (error) throw new Error(`No pude leer los narradores: ${error.message}`);
    const narradores = ((data as Narrador[] | null) ?? []).filter((n) => dudasAQuienConto(n.contexto));
    if (narradores.length === 0) continue;
    const idsTanda = narradores.map((n) => n.id);

    const { data: pedidos, error: errorPedidos } = await db.from('pedidos').select('narrador_id, estado').in('narrador_id', idsTanda);
    if (errorPedidos) throw new Error(`No pude leer los pedidos: ${errorPedidos.message}`);
    const sinAviso = new Set(((pedidos as { narrador_id: string; estado: string }[] | null) ?? [])
      .filter((p) => PEDIDOS_SIN_AVISO.has(p.estado)).map((p) => p.narrador_id));

    const quedan = narradores.filter((n) => !sinAviso.has(n.id));
    const filas = new Map([
      ...await filasDe(db, 'entrevistas_v3', quedan.filter((n) => !conHistoria.has(n.id)).map((n) => n.id)),
      ...await filasDe(db, 'historias', quedan.filter((n) => conHistoria.has(n.id)).map((n) => n.id)),
    ].map((f) => [f.narrador_id, f]));
    for (const narrador of quedan) {
      const fila = filas.get(narrador.id);
      if (fila) salida.push({ narrador, fila, carpeta: conHistoria.has(narrador.id) ? 'escritor-historia' : 'escritor' });
    }
  }
  return salida;
}

async function escribir(db: SupabaseClient, m: Marca): Promise<boolean> {
  try {
    const { error } = await db.storage.from(BUCKET).upload(m.path, Buffer.from(m.contenido), { contentType: 'text/plain', upsert: true });
    if (error) console.error(`revision-narrador: no pude escribir ${m.path}: ${error.message}`);
    return !error;
  } catch (err) {
    console.error(`revision-narrador: no pude escribir ${m.path}:`, err instanceof Error ? err.message : err);
    return false;
  }
}

async function leer(db: SupabaseClient, path: string): Promise<string> {
  const { data, error } = await db.storage.from(BUCKET).download(path);
  if (error || !data) throw new Error(`No pude bajar ${path}: ${error?.message ?? 'sin datos'}`);
  return data.text();
}

async function listar(db: SupabaseClient, base: string): Promise<Set<string>> {
  const { data, error } = await db.storage.from(BUCKET).list(base, { limit: 1000 });
  if (error) throw new Error(`No pude listar ${base}: ${error.message}`);
  return new Set(((data as { name: string }[] | null) ?? []).map((a) => a.name));
}

/** Subir sin pisar es atómico: si ya existe, otro proceso está mandando. Una toma vieja es de un proceso que murió. */
async function tomar(db: SupabaseClient, base: string, ahora: Date): Promise<boolean> {
  const path = `${base}/${TOMA}`;
  const subir = () => db.storage.from(BUCKET).upload(path, Buffer.from(ahora.toISOString()), { contentType: 'text/plain', upsert: false });
  const yaExiste = (e: { message?: string; statusCode?: string | number }) => String(e.statusCode) === '409' || /already exists|duplicate/i.test(e.message ?? '');
  const { error } = await subir();
  if (!error) return true;
  if (!yaExiste(error)) throw new Error(`No pude tomar ${path}: ${error.message}`);
  const desde = Date.parse((await leer(db, path)).trim());
  if (Number.isFinite(desde) && ahora.getTime() - desde < TOMA_VIGENTE_MS) return false;
  await soltar(db, base);
  const { error: otraVez } = await subir();
  if (otraVez && !yaExiste(otraVez)) throw new Error(`No pude tomar ${path}: ${otraVez.message}`);
  return !otraVez;
}

/** Nunca tira. Si no se puede borrar, a la media hora se la da por vieja. */
async function soltar(db: SupabaseClient, base: string): Promise<void> {
  try {
    const { error } = await db.storage.from(BUCKET).remove([`${base}/${TOMA}`]);
    if (error) console.warn(`revision-narrador: no pude borrar la toma de ${base}: ${error.message}`);
  } catch (err) {
    console.warn(`revision-narrador: no pude borrar la toma de ${base}:`, err instanceof Error ? err.message : err);
  }
}

/** Los ids de las dudas, como `leerDudas` de la web. Rotas, tira: ese narrador se saltea en este tick. */
function idsDeDudas(texto: string, path: string): string[] {
  const j = JSON.parse(texto) as { dudas?: unknown };
  const lista = j?.dudas ?? [];
  if (!Array.isArray(lista)) throw new Error(`${path} no tiene la lista "dudas"`);
  return lista
    .filter((d) => typeof d?.id === 'string' && typeof d?.pregunta === 'string')
    .map((d) => d.id as string);
}

/** Las dudas con una respuesta con texto. Roto, ninguna: mismo criterio que `todasContestadas` de la fábrica. */
function contestadas(texto: string, path: string): Set<string> {
  try {
    const j = JSON.parse(texto) as unknown;
    const lista = Array.isArray(j) ? j : (j as { correcciones?: unknown } | null)?.correcciones;
    if (!Array.isArray(lista)) return new Set();
    return new Set(lista
      .filter((c) => typeof c?.dudaId === 'string' && c.dudaId && typeof c?.texto === 'string' && c.texto.trim())
      .map((c) => c.dudaId as string));
  } catch {
    console.warn(`revision-narrador: ${path} no es un JSON válido`);
    return new Set();
  }
}

async function situacionDe(db: SupabaseClient, base: string, nombres: Set<string>): Promise<Situacion> {
  const s: Situacion = {
    hayEtapaA: nombres.has('carpeta-A.json'), libroEscrito: nombres.has('libro.md'),
    cantidadDudas: 0, todasContestadas: false, dudasAvisadasAt: null, recordada: false,
  };
  if (!s.hayEtapaA || s.libroEscrito || !nombres.has('dudas-familia.json')) return s;
  const pathDudas = `${base}/dudas-familia.json`;
  const ids = idsDeDudas(await leer(db, pathDudas), pathDudas);
  s.cantidadDudas = ids.length;
  if (ids.length === 0) return s;
  if (nombres.has('correcciones.json')) {
    const pathCorrecciones = `${base}/correcciones.json`;
    const hechas = contestadas(await leer(db, pathCorrecciones), pathCorrecciones);
    s.todasContestadas = ids.every((id) => hechas.has(id));
  }
  if (s.todasContestadas || !nombres.has(DUDAS_AVISADAS)) return s;
  // Vacía o rota: una Etapa A rehecha la dejó sin valor (fábrica, CONTRATO).
  const avisadas = Date.parse((await leer(db, `${base}/${DUDAS_AVISADAS}`)).trim());
  if (!Number.isFinite(avisadas)) return s;
  s.dudasAvisadasAt = new Date(avisadas).toISOString();
  if (nombres.has(DUDAS_RECORDADAS)) {
    // Un recordatorio anterior a este aviso era de las dudas de antes.
    const recordada = Date.parse((await leer(db, `${base}/${DUDAS_RECORDADAS}`)).trim());
    s.recordada = Number.isFinite(recordada) && recordada > avisadas;
  }
  return s;
}

/** ¿La fábrica está con este narrador ahora? Si no se puede leer la marca, no, como en la fábrica. */
async function fabricaTrabajando(db: SupabaseClient, base: string, nombres: Set<string>, ahora: Date): Promise<boolean> {
  if (!nombres.has(TRABAJANDO)) return false;
  try {
    const m = JSON.parse(await leer(db, `${base}/${TRABAJANDO}`)) as { latido?: string };
    return ahora.getTime() - Date.parse(m.latido ?? '') < TRABAJANDO_VIGENTE_MS;
  } catch {
    return false;
  }
}

/** ¿El mail de dudas a los socios salió hace más de 72 horas? Entonces el plazo ya venció: es un libro viejo. */
async function dudasVencidas(db: SupabaseClient, base: string, nombres: Set<string>, ahora: Date): Promise<boolean> {
  if (!nombres.has(DUDAS_A_SOCIOS)) return false;
  const desde = Date.parse((await leer(db, `${base}/${DUDAS_A_SOCIOS}`)).trim());
  return Number.isFinite(desde) && ahora.getTime() - desde > DUDAS_VENCIDAS_MS;
}

async function mandar(deps: DepsRevision, c: Candidato, base: string, mensaje: Mensaje, ahora: Date): Promise<void> {
  const { narrador: n, fila } = c;
  const tel = n.telefono_whatsapp as string;
  const idioma = fila.idioma;
  const nombre = enLineaParaPlantilla([n.como_le_dicen ?? '']);
  const quien = nombre || n.id;
  const token = firmarTokenRespuestas(n.id, ahora);
  const abierta = ventanaAbierta({ ultimoEntranteAt: fila.estado?.ultimoEntranteAt }, ahora);

  if (!abierta && !deps.plantillaLista(idioma, 'dudas_narrador')) {
    await deps.avisarSocios(
      `revision-narrador|${n.id}|${mensaje}|sin-plantilla`,
      `No le pude mandar a ${quien} el aviso de ${mensaje}`,
      `Narrador ${n.id}. Pasaron más de 24 horas desde su último mensaje y falta «${idioma}:dudas_narrador» en WA_PLANTILLAS_V3_LISTAS.\n`
        + 'Si la plantilla ya está aprobada en Meta, sumarla a la lista en Railway. El libro sigue igual cuando vence el plazo.',
    );
    return;
  }
  // {{1}} es el nombre y Meta rechaza una variable vacía.
  if (!abierta && !nombre) {
    await deps.avisarSocios(
      `revision-narrador|${n.id}|${mensaje}|sin-nombre`,
      `No le pude mandar a ${n.id} el aviso de ${mensaje}`,
      `Narrador ${n.id}. Pasaron más de 24 horas desde su último mensaje y no tiene como_le_dicen, que la plantilla necesita. El libro sigue igual cuando vence el plazo.`,
      { unaVez: true },
    );
    return;
  }

  if (!(await tomar(deps.db, base, ahora))) return;
  let soltarAlFinal = true;
  try {
    // Otro proceso pudo terminar entre que se miró y se tomó: lo que vale es lo de ahora.
    const nombres = await listar(deps.db, base);
    if (queMandar(await situacionDe(deps.db, base, nombres), ahora) !== mensaje) return;

    let waId: string;
    try {
      if (abierta) {
        waId = await deps.enviarTexto(tel, `${TEXTOS_REVISION[idioma].dudas} ${deps.urlBase.replace(/\/$/, '')}/mi-historia/${token}`, { timeoutMs: TIMEOUT_ENVIO_MS });
      } else {
        const p = PLANTILLAS_REVISION[idioma].dudas;
        waId = await deps.enviarPlantilla(tel, p.nombre, [nombre], p.idiomaMeta, { botonUrl: token, timeoutMs: TIMEOUT_ENVIO_MS });
      }
    } catch (err) {
      console.error(`revision-narrador: Meta rechazó el aviso de ${mensaje} a ${enmascarar(tel)}:`, err instanceof Error ? err.message : err);
      await deps.avisarSocios(
        `revision-narrador|${n.id}|${mensaje}|meta`,
        `No le pude mandar a ${quien} el aviso de ${mensaje}`,
        `Narrador ${n.id}. Meta rechazó el mensaje y se reintenta en cada tick. El libro sigue igual cuando vence el plazo.`,
      );
      return;
    }

    // Salió: de acá en adelante nada puede hacer que se vuelva a mandar.
    // Un aviso nuevo deja sin valor el recordatorio de las dudas anteriores (lo confirma la fecha, en situacionDe).
    if (mensaje === 'dudas' && nombres.has(DUDAS_RECORDADAS)) await escribir(deps.db, { path: `${base}/${DUDAS_RECORDADAS}`, contenido: '' });
    const marca: Marca = { path: `${base}/${mensaje === 'dudas' ? DUDAS_AVISADAS : DUDAS_RECORDADAS}`, contenido: ahora.toISOString() };
    if (!(await escribir(deps.db, marca))) {
      MARCAS_SIN_ESCRIBIR.set(n.id, marca);
      soltarAlFinal = false; // la toma sigue frenando a otro proceso hasta que la marca esté escrita
    }

    // Anotado para que el webhook sepa si Meta lo entregó (entregas.ts). Sin la migración, solo queda en el log.
    const { error } = await deps.db.from('envios').insert({ narrador_id: n.id, tipo: 'dudas_narrador', pregunta_orden: null, wa_message_id: waId });
    if (error) console.error(`revision-narrador: salió el aviso de ${n.id} pero no pude anotar el envío: ${error.message}`);
    console.log(`revision-narrador: salió el aviso de ${mensaje} de ${n.id} a ${enmascarar(tel)}`);
  } finally {
    if (soltarAlFinal) await soltar(deps.db, base);
  }
}

/** ¿Quien regala cerró antes de tiempo un libro privado y el narrador todavía no tiene su link? Con el plazo vencido, ya no. */
function leTocaLinkDeCierre({ narrador: n, fila }: Candidato, nombres: Set<string>, ahora: Date): boolean {
  if (n.estado !== 'cerrado_anticipado' || !esPrivado(n.contexto) || fila.estado?.linkFinal || nombres.has(LINK_CIERRE)) return false;
  const plazo = plazoParaSacar(n);
  return plazo !== null && plazo > ahora.getTime();
}

/** El link del cierre anticipado: texto con la ventana abierta y plantilla `revision` con la ventana cerrada, una sola vez. */
async function mandarLinkDeCierre(deps: DepsRevision, c: Candidato, base: string, ahora: Date): Promise<void> {
  const { narrador: n, fila } = c;
  const tel = n.telefono_whatsapp as string;
  const idioma = fila.idioma;
  if (!(await tomar(deps.db, base, ahora))) return;
  let soltarAlFinal = true;
  try {
    if (!leTocaLinkDeCierre(c, await listar(deps.db, base), ahora)) return;
    if (ventanaAbierta({ ultimoEntranteAt: fila.estado?.ultimoEntranteAt }, ahora)) {
      const ficha = { nombre: fila.ficha?.nombre ?? n.como_le_dicen ?? '', genero: fila.ficha?.genero, idioma } as FichaTexto;
      const texto = textoDelLink(n, n.id, idioma, ficha, ahora);
      if (!texto) return;
      let waId: string;
      try {
        waId = await deps.enviarTexto(tel, texto, { timeoutMs: TIMEOUT_ENVIO_MS });
      } catch (err) {
        console.error(`revision-narrador: no salió el link de cierre a ${enmascarar(tel)}:`, err instanceof Error ? err.message : err);
        await deps.avisarSocios(`link-cierre|${n.id}`, 'Un narrador terminó y no le llegó su link',
          `Narrador ${n.id}. Quien regala cerró antes de tiempo y Meta rechazó el link para sacar respuestas. Se reintenta en cada tick.`);
        return;
      }
      const { error } = await deps.db.from('envios').insert({ narrador_id: n.id, tipo: 'revision', pregunta_orden: null, wa_message_id: waId });
      if (error) console.error(`revision-narrador: salió el link de cierre de ${n.id} pero no pude anotar el envío: ${error.message}`);
    } else {
      const listo = await linkConVentanaCerrada(
        {
          db: deps.db,
          wa: { plantilla: (t, nombre, idiomaMeta, variables, o) => deps.enviarPlantilla(t, nombre, variables, idiomaMeta, { botonUrl: o?.botonUrl ?? '', timeoutMs: TIMEOUT_ENVIO_MS }) },
          avisar: async (clave, asunto, detalle) => { await deps.avisarSocios(clave, asunto, detalle); },
        },
        n.id, n, tel, idioma,
        { lista: deps.plantillaLista(idioma, 'revision'), nombre: enLineaParaPlantilla([n.como_le_dicen ?? '']), ahora },
      );
      if (!listo) return;
    }
    const marca: Marca = { path: `${base}/${LINK_CIERRE}`, contenido: ahora.toISOString() };
    if (!(await escribir(deps.db, marca))) {
      MARCAS_SIN_ESCRIBIR.set(n.id, marca);
      soltarAlFinal = false; // la toma sigue frenando a otro proceso hasta que la marca esté escrita
    }
  } finally {
    if (soltarAlFinal) await soltar(deps.db, base);
  }
}

async function atenderUno(deps: DepsRevision, c: Candidato, ahora: Date): Promise<void> {
  const { narrador: n, carpeta, fila } = c;
  const base = `${n.id}/${carpeta}`;
  const pendiente = MARCAS_SIN_ESCRIBIR.get(n.id);
  if (pendiente) {
    if (!(await escribir(deps.db, pendiente))) return;
    MARCAS_SIN_ESCRIBIR.delete(n.id);
    await soltar(deps.db, base);
  }
  if (!n.telefono_whatsapp?.trim() || !enHorario(n.zona_horaria, fila.idioma, ahora)) return;

  const nombres = await listar(deps.db, base);
  if (nombres.has('libro.md')) {
    TERMINADOS.add(n.id);
    return;
  }
  if (leTocaLinkDeCierre(c, nombres, ahora)) {
    await mandarLinkDeCierre(deps, c, base, ahora);
    return;
  }
  const mensaje = queMandar(await situacionDe(deps.db, base, nombres), ahora);
  if (!mensaje) return;
  if (await fabricaTrabajando(deps.db, base, nombres, ahora)) return;
  if (mensaje === 'dudas' && (await dudasVencidas(deps.db, base, nombres, ahora))) return;
  await mandar(deps, c, base, mensaje, ahora);
}

/** ¿Venció el plazo de las dudas? Desde el aviso a quien contó o, si nunca salió, desde el mail a los socios, como la fábrica. */
async function plazoVencido(db: SupabaseClient, base: string, nombres: Set<string>, ahora: Date): Promise<boolean> {
  const fecha = async (archivo: string): Promise<number | null> => {
    if (!nombres.has(archivo)) return null;
    const f = Date.parse((await leer(db, `${base}/${archivo}`)).trim());
    // Rota, vacía o del futuro no cuenta. Unos minutos de más son la diferencia entre relojes.
    return Number.isFinite(f) && f <= ahora.getTime() + 5 * 60_000 ? f : null;
  };
  const desde = (await fecha(DUDAS_AVISADAS)) ?? (await fecha(DUDAS_A_SOCIOS));
  return desde !== null && ahora.getTime() - desde >= DUDAS_VENCIDAS_MS;
}

/**
 * Quien contó escribe por WhatsApp teniendo dudas pendientes: lo que mande por acá no entra al libro. Una vez por día se
 * le contesta con el link (la ventana está abierta, acaba de escribir) y los socios se enteran. El mensaje no se guarda.
 * Devuelve true si el mensaje era por esto. Con false, sigue como siempre. Nunca tira: es el camino del webhook.
 */
export async function contestarSiEscribeConDudas(
  deps: Pick<DepsRevision, 'db' | 'enviarTexto' | 'avisarSocios' | 'urlBase'>,
  n: { id: string; estado: string; contexto?: unknown; telefono_whatsapp: string | null; como_le_dicen?: string | null },
  ahora: Date = new Date(),
): Promise<boolean> {
  try {
    if (!ESTADOS_TERMINADA.includes(n.estado) || !n.telefono_whatsapp?.trim() || !dudasAQuienConto(n.contexto)) return false;
    const [historia] = await filasDe(deps.db, 'historias', [n.id]);
    if (historia && !escritorHistoriaPrendido(n.id)) return false;
    const fila = historia ?? (await filasDe(deps.db, 'entrevistas_v3', [n.id]))[0];
    if (!fila) return false;
    const { data: pedidos, error } = await deps.db.from('pedidos').select('estado').eq('narrador_id', n.id);
    if (error) throw new Error(`No pude leer los pedidos: ${error.message}`);
    if (((pedidos as { estado: string }[] | null) ?? []).some((p) => PEDIDOS_SIN_AVISO.has(p.estado))) return false;

    const base = `${n.id}/${historia ? 'escritor-historia' : 'escritor'}`;
    const nombres = await listar(deps.db, base);
    const s = await situacionDe(deps.db, base, nombres);
    if (s.libroEscrito || !s.hayEtapaA || s.cantidadDudas === 0 || s.todasContestadas) return false;
    if (await plazoVencido(deps.db, base, nombres, ahora)) return false;
    if (await fabricaTrabajando(deps.db, base, nombres, ahora)) return false;

    const quien = enLineaParaPlantilla([n.como_le_dicen ?? '']) || n.id;
    const texto = TEXTOS_REVISION[fila.idioma].escribio.replace('{link}', `${deps.urlBase.replace(/\/$/, '')}/mi-historia/${firmarTokenRespuestas(n.id, ahora)}`);
    const dia = ahora.toISOString().slice(0, 10);
    const clave = `escribio-con-dudas|${n.id}`;
    const marca = marcaEnStorage(deps.db);
    if ((await marca(dia, clave)) !== 'ya') {
      try {
        const waId = await deps.enviarTexto(n.telefono_whatsapp, texto, { timeoutMs: TIMEOUT_ENVIO_MS });
        const { error: errorEnvio } = await deps.db.from('envios').insert({ narrador_id: n.id, tipo: 'dudas_narrador', pregunta_orden: null, wa_message_id: waId });
        if (errorEnvio) console.error(`revision-narrador: salió el link de ${n.id} pero no pude anotar el envío: ${errorEnvio.message}`);
      } catch (err) {
        // No salió: el próximo mensaje suyo lo vuelve a intentar.
        await marca.quitar?.(dia, clave);
        console.error(`revision-narrador: no le pude contestar a ${enmascarar(n.telefono_whatsapp)}:`, err instanceof Error ? err.message : err);
      }
    }
    await deps.avisarSocios(clave, `${quien} escribió por WhatsApp con dudas pendientes`,
      `Narrador ${n.id}. Escribió por WhatsApp y todavía tiene dudas sin contestar. Lo que mandó no se guarda: se le contesta con el link, una vez por día.`);
    return true;
  } catch (err) {
    console.error(`revision-narrador: falló el mensaje de ${n.id}:`, err instanceof Error ? err.message : err);
    return false;
  }
}

/** Una pasada del tick. Un narrador que falla no frena a los demás. */
export async function atenderRevisiones(deps: DepsRevision, ahora: Date): Promise<void> {
  for (const c of await candidatos(deps.db)) {
    try {
      await atenderUno(deps, c, ahora);
    } catch (err) {
      console.error(`revision-narrador: falló ${c.narrador.id}:`, err instanceof Error ? err.message : err);
    }
  }
}
