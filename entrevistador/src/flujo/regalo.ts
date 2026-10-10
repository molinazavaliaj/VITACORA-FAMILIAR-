// Gift card (spec 2026-10-07-gift-card-design §6): un número que no conocemos
// escribe con el código de su tarjeta. Se le pone el teléfono al narrador que
// armó quien regala, pasa a 'invitado' y le llega la bienvenida como texto
// libre (escribió él primero: la ventana de 24 hs está abierta). Desde ahí,
// el SÍ sigue en procesar.ts, en el idioma del regalo, y la entrevista va
// siempre por la V3 (regalo-arranque.ts).

import type { SupabaseClient } from '@supabase/supabase-js';
import { esTablaAusente } from '../v3/estado.js';
import { esGenero } from '../v3/tipos.js';
import { variantesDeTelefono } from '../whatsapp/telefonos.js';
import { bienvenidaDeRegalo, idiomaDeRegalo, idiomaPorTelefono } from './regalo-arranque.js';
import { extraerCodigo } from './regalo-codigo.js';
import { AVISOS, RECORDATORIO, tratoDeComprador } from './regalo-textos.js';
import { zonaPorTelefono } from './regalo-zona.js';

export type DepsRegalo = {
  db: SupabaseClient;
  enviarTexto: (telefono: string, texto: string) => Promise<string>;
  /** Reloj inyectable (tests del límite de "no encuentro ese código"). */
  ahora?: () => number;
};
/** 'ya_era_suyo': el mismo teléfono mandó el código dos veces; se queda callado. */
export type ResultadoCanje = 'sin_codigo' | 'no_existe' | 'usado_por_otro' | 'ya_era_suyo' | 'no_listo' | 'canjeado';

// Contra quien prueba códigos al azar: después de 5 "no encuentro ese código"
// al mismo teléfono en 24 hs, no se le contesta más. En memoria, por proceso:
// un reinicio lo borra, y alcanza.
const MAXIMO_NO_EXISTE = 5;
const VENTANA_MS = 24 * 3600_000;
const noExistePorTelefono = new Map<string, number[]>();

/** Para los tests: vacía el límite de "no encuentro ese código". */
export function reiniciarLimiteDeCodigos(): void {
  noExistePorTelefono.clear();
}

/** ¿Todavía se le puede contestar "no encuentro ese código"? Si sí, lo anota. */
function puedeContestarNoExiste(telefono: string, ahora: number): boolean {
  const recientes = (noExistePorTelefono.get(telefono) ?? []).filter((t) => ahora - t < VENTANA_MS);
  if (recientes.length >= MAXIMO_NO_EXISTE) {
    noExistePorTelefono.set(telefono, recientes);
    return false;
  }
  recientes.push(ahora);
  noExistePorTelefono.set(telefono, recientes);
  return true;
}

const esDeEsteTelefono = (usadoPor: string | null | undefined, telefono: string) =>
  usadoPor != null && variantesDeTelefono(telefono).includes(usadoPor);

/**
 * El regalo que se le mandó por WhatsApp a este número el día elegido (spec
 * 2026-10-10): quien contesta la plantilla no necesita escribir el código.
 * Solo si salió y Meta no avisó que falló. Sin la migración, null.
 */
async function codigoPorEntrega(db: DepsRegalo['db'], telefono: string): Promise<string | null> {
  const { data, error } = await db.from('regalos')
    .select('codigo')
    .eq('entrega_canal', 'whatsapp').in('entrega_contacto', variantesDeTelefono(telefono))
    .not('entrega_enviada_at', 'is', null).is('entrega_fallo', null).is('usado_at', null)
    .limit(1);
  if (error) {
    const sinMigracion = esTablaAusente(error) || error.code === '42703' || error.code === 'PGRST204';
    if (!sinMigracion) console.error('regalo: no pude buscar un regalo mandado a este número:', error.message);
    return null;
  }
  return (data as { codigo: string }[] | null)?.[0]?.codigo ?? null;
}

export async function canjearRegalo(deps: DepsRegalo, m: { telefono: string; texto: string }): Promise<ResultadoCanje> {
  const { db } = deps;
  // Primero el regalo que se le mandó a este número: así un «buenas» (que
  // parece un código) no termina en «no encuentro ese código».
  const codigo = (await codigoPorEntrega(db, m.telefono)) ?? extraerCodigo(m.texto);
  if (!codigo) return 'sin_codigo';

  const { data: regalo, error } = await db.from('regalos')
    .select('id, narrador_id, usado_at, usado_por_telefono').eq('codigo', codigo).maybeSingle();
  if (error) {
    if (esTablaAusente(error)) { console.warn('regalo: la tabla regalos todavía no existe'); return 'sin_codigo'; }
    throw error;
  }
  if (!regalo) {
    if (puedeContestarNoExiste(m.telefono, deps.ahora?.() ?? Date.now())) {
      // Todavía no se sabe de qué regalo es: el idioma sale del teléfono.
      await deps.enviarTexto(m.telefono, AVISOS[idiomaPorTelefono(m.telefono)].noExiste);
    } else {
      console.warn(`regalo: ${m.telefono} ya probó ${MAXIMO_NO_EXISTE} códigos que no existen en 24 hs; no se le contesta`);
    }
    return 'no_existe';
  }
  if (regalo.usado_at) return yaUsado(deps, m, codigo, regalo.narrador_id, regalo.usado_por_telefono);

  // 1. Se toma el regalo. Compare-and-swap: dos mensajes juntos no lo canjean dos veces.
  const ahora = new Date().toISOString();
  const { data: tomado, error: errorTomar } = await db.from('regalos')
    .update({ usado_at: ahora, usado_por_telefono: m.telefono })
    .eq('id', regalo.id).is('usado_at', null).select('id');
  // Un error de la base no es "lo usó otro": se tira, y el que llama lo anota.
  if (errorTomar) throw errorTomar;
  if (!tomado?.length) {
    // Lo ganó otro mensaje. ¿De quién? Si es de este mismo teléfono (mandó el
    // código dos veces), el otro mensaje ya se ocupa de la bienvenida.
    const { data: ahoraEs, error: errorRelectura } = await db.from('regalos')
      .select('usado_por_telefono').eq('id', regalo.id).maybeSingle();
    if (errorRelectura) throw errorRelectura;
    return yaUsado(deps, m, codigo, regalo.narrador_id, ahoraEs?.usado_por_telefono ?? null);
  }

  // 2. El narrador: teléfono e invitado, solo si estaba esperando el regalo.
  // La zona horaria sale de SU teléfono, no de la región de quien regala
  // (+54 o +34; otro prefijo deja la que había).
  const cambios: Record<string, string> = { telefono_whatsapp: m.telefono, estado: 'invitado' };
  const zona = zonaPorTelefono(m.telefono);
  if (zona) cambios.zona_horaria = zona;
  const { data: narrador, error: errorNarrador } = await db.from('narradores')
    .update(cambios)
    .eq('id', regalo.narrador_id).eq('estado', 'regalo_pendiente').select('id');
  if (errorNarrador || !narrador?.length) {
    // No se pagó todavía, o ese teléfono ya es de otro narrador (23505). Se
    // devuelve el regalo para que se pueda canjear cuando se arregle (solo si
    // sigue siendo nuestra la marca).
    const { error: errorDevolver } = await db.from('regalos').update({ usado_at: null, usado_por_telefono: null })
      .eq('id', regalo.id).eq('usado_por_telefono', m.telefono);
    if (errorDevolver) console.error(`regalo: no pude devolver ${codigo} después de un canje fallido:`, errorDevolver.message);
    console.error(`regalo: no pude canjear ${codigo} para ${m.telefono}:`, errorNarrador?.message ?? 'el narrador no estaba en regalo_pendiente');
    return 'no_listo';
  }

  // 3. La bienvenida. Si falla, el próximo mensaje la vuelve a intentar (procesar.ts).
  await mandarBienvenidaDeRegalo(deps, regalo.narrador_id, m.telefono);
  return 'canjeado';
}

/** El código ya está usado: si fue este mismo teléfono, silencio; si no, se le avisa en el idioma del regalo. */
async function yaUsado(deps: DepsRegalo, m: { telefono: string }, codigo: string, narradorId: string, usadoPor: string | null): Promise<ResultadoCanje> {
  if (esDeEsteTelefono(usadoPor, m.telefono)) return 'ya_era_suyo';
  const { data: n, error } = await deps.db.from('narradores').select('contexto').eq('id', narradorId).maybeSingle();
  // Sin poder leer el regalo, el aviso igual sale (en es-AR): callarse es peor.
  if (error) console.error(`regalo: no pude leer el idioma de ${narradorId}:`, error.message);
  await deps.enviarTexto(m.telefono, AVISOS[idiomaDeRegalo(n?.contexto)].usadoPorOtro);
  console.warn(`regalo: ${codigo} ya usado por ${usadoPor}; ahora escribe ${m.telefono}`);
  return 'usado_por_otro';
}

/**
 * La bienvenida del regalo, como texto libre: el BIEN del banco en el idioma
 * del regalo y el pedido de SÍ (regalo-arranque.ts). Ya no la vieja
 * `bienvenida()` de puro.ts: esa describía la entrevista vieja, y un regalo va
 * siempre por la V3.
 */
export async function mandarBienvenidaDeRegalo(deps: DepsRegalo, narradorId: string, telefono: string): Promise<boolean> {
  try {
    const [{ data: n }, { data: r }] = await Promise.all([
      deps.db.from('narradores').select('como_le_dicen, contexto').eq('id', narradorId).maybeSingle(),
      deps.db.from('regalos').select('quien_regala').eq('narrador_id', narradorId).maybeSingle(),
    ]);
    if (!n || !r) return false;
    // El BIEN no tiene marcas de género hoy; si llega a tenerlas, sin género cargado va 'otro'.
    const genero = esGenero(n.contexto?.genero) ? n.contexto.genero : 'otro';
    const texto = bienvenidaDeRegalo(idiomaDeRegalo(n.contexto), {
      nombre: n.como_le_dicen, genero, ...(r.quien_regala ? { quienRegala: r.quien_regala } : {}),
    });
    const waId = await deps.enviarTexto(telefono, texto);
    const { error } = await deps.db.from('envios').insert({ narrador_id: narradorId, tipo: 'bienvenida', pregunta_orden: null, wa_message_id: waId });
    if (error) {
      // Salió, pero sin el envío anotado el próximo mensaje la repetiría: se avisa.
      console.error(`regalo: la bienvenida de ${narradorId} salió pero no pude anotar el envío:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`regalo: falló la bienvenida de ${narradorId}:`, err);
    return false;
  }
}

// ── El recordatorio de los 15 días (spec §7) ──────────────────────────

const DIAS_RECORDATORIO = 15;

/** `boton` (por defecto true): el botón «Ver la tarjeta» a la página del regalo en el tablero. */
export type MandarMailFamilia = (familiaId: string, asunto: string, cuerpo: string, narradorId: string, o?: { boton?: boolean }) => Promise<boolean>;

/**
 * Nunca al narrador: una sola vez a quien regaló, si a los 15 días de la fecha
 * de entrega (o de la compra, si no puso fecha) la tarjeta sigue sin usar.
 * Devuelve cuántos mandó.
 *
 * El regalo se toma ANTES de mandar (compare-and-swap sobre recordatorio_at):
 * dos ticks o dos procesos a la vez no mandan dos veces. Si el mail falla se
 * devuelve la marca, y el próximo tick reintenta.
 */
export async function recordarRegalos(
  deps: DepsRegalo & { mandarMail: MandarMailFamilia },
  ahora: Date = new Date(deps.ahora?.() ?? Date.now()),
): Promise<number> {
  const limite = ahora.getTime() - DIAS_RECORDATORIO * 24 * 3600_000;
  // Corte grueso en la consulta: fecha_entrega nunca es anterior a la compra,
  // así que un regalo comprado hace menos de 15 días no puede estar vencido.
  // Sin esto, cada tick releería todos los regalos sin usar.
  const { data, error } = await deps.db.from('regalos')
    .select('id, narrador_id, fecha_entrega, created_at')
    .is('usado_at', null).is('recordatorio_at', null)
    .lte('created_at', new Date(limite).toISOString());
  if (error) {
    if (esTablaAusente(error)) return 0;
    throw error;
  }
  const marca = ahora.toISOString();
  let mandados = 0;
  for (const r of data ?? []) {
    // La regla exacta: desde la fecha de entrega, o desde la compra.
    const desde = Date.parse(r.fecha_entrega ?? r.created_at);
    if (Number.isNaN(desde) || desde > limite) continue;
    // Solo se lee el narrador de los regalos ya vencidos (pocos por tick).
    const { data: n } = await deps.db.from('narradores')
      .select('familia_id, como_le_dicen, estado').eq('id', r.narrador_id).maybeSingle();
    if (!n || n.estado !== 'regalo_pendiente') continue;

    const { data: tomado, error: errorTomar } = await deps.db.from('regalos')
      .update({ recordatorio_at: marca }).eq('id', r.id).is('recordatorio_at', null).select('id');
    if (errorTomar) {
      console.error(`regalo: no pude tomar el recordatorio de ${r.id}:`, errorTomar.message);
      continue;
    }
    if (!tomado?.length) continue; // lo tomó otra corrida

    // De vos o de tú según desde dónde compró (familias.region). Si no se puede
    // leer, vos: el texto de siempre.
    const { data: familia } = await deps.db.from('familias').select('region').eq('id', n.familia_id).maybeSingle();
    const textos = RECORDATORIO[tratoDeComprador((familia as { region?: unknown } | null)?.region)];
    const ok = await deps.mandarMail(n.familia_id, textos.asunto(n.como_le_dicen), textos.cuerpo, r.narrador_id);
    if (!ok) {
      const { error: errorDevolver } = await deps.db.from('regalos')
        .update({ recordatorio_at: null }).eq('id', r.id).eq('recordatorio_at', marca);
      if (errorDevolver) console.error(`regalo: falló el recordatorio de ${r.id} y no pude devolver la marca:`, errorDevolver.message);
      continue;
    }
    mandados++;
  }
  return mandados;
}
