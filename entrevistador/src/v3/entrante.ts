// Lo que llega de un narrador V3 (spec 2026-10-07, "Al llegar un mensaje de un
// narrador V3"). Se entra desde procesar.ts, antes de las fotos de la familia,
// de manejarTexto (que llama a un modelo) y de la evaluación con Opus: la V3
// no usa modelos durante la entrevista (salvo el cazador, en segundo plano).
// Ningún texto se arma acá: salen del banco (turno.ts) o de textos-fijos.json.
//
// Meta ya recibió el 200 cuando esto corre: si el proceso se cae en el medio,
// no reintenta. Por eso una fila de `respuestas` se da por procesada recién
// cuando tiene `clave_v3` (se pone DESPUÉS de guardar el estado), y el reloj
// reconcilia las que quedaron sin clave (reconciliarV3). Las que se dejan
// afuera a propósito llevan SIN_CLAVE_V3, para que el reloj no las reintente.

import { fechaLocal } from '../flujo/tiempo.js';
import type { MensajeEntrante } from '../whatsapp/webhook.js';
import { lanzarCazador } from './cazador.js';
import type { Idioma } from './nucleo/entrevista/idioma.js';
import type { DepsV3, Transcripcion } from './deps.js';
import { drenar } from './enviar.js';
import { conReintento, type Paso } from './estado.js';
import {
  anotarTranscripcion, avisarFamiliaTarde, bajarAudioGuardado, leerFamilia, guardarAudioV3, guardarFotoV3, guardarTextoV3, marcarRespondido, numeroDeLlegada, ponerClave,
  ponerClaveSiFalta, yaLlego,
} from './filas.js';
import { leerBoton, respuestaDeBoton } from './nucleo/entrevista/respuesta.js';
import { cumplirPedido, pedidoDe } from './pedidos.js';
import { esSaludo } from './saludo.js';
import { aplicarTanda, hitosDe } from './tanda.js';
import { textoFijo } from './textos-fijos.js';
import { fichaTexto, MARCA_FOTO, SIN_CLAVE_V3, type EstadoV3, type FilaV3, type NarradorV3 } from './tipos.js';
import { anotarVisto, avanzar, cerrarYSeguir, encolar, sumarFamilia, marcarFoto, recibirAudio, reenviarAbierta, sinRecordatorios, textoDelBanco, tocarBoton, yaVisto } from './turno.js';

/** Una fila sin clave_v3 más vieja que esto la retoma el reloj (el proceso que la guardó se cayó o falló). */
export const RECONCILIAR_MS = 5 * 60_000;

/**
 * ¿La pregunta abierta todavía no le llegó? Queda en la cola (`salientes`) cuando la ventana de 24 h está
 * cerrada y no hay plantilla aprobada en su idioma (drenar la retiene y avisa a los socios): el estado ya
 * dice `esperando`, pero el narrador nunca la vio. Le pasó a Imma el 09/10.
 */
export function abiertaSinEntregar(e: Pick<EstadoV3, 'esperando' | 'preguntaAbierta' | 'salientes' | 'charla'>): boolean {
  const pregunta = e.preguntaAbierta?.partes[0]?.texto;
  if (!e.esperando || !pregunta) return false;
  if (!e.salientes.some((s) => s.tipo === 'turno' && s.texto.includes(pregunta))) return false;
  // Un reenvío (reenviarAbierta: la vuelta de una pausa, o con botones después de salir por plantilla) suma la
  // pregunta a la charla otra vez: esa ya la vio, y lo que mande la contesta.
  const id = e.esperando;
  const veces = e.charla.filter((g) => g.de === 'bio' && g.partes.some((p) => p.id === id)).length;
  return veces <= 1;
}

export async function procesarEntranteV3(deps: DepsV3, n: NarradorV3, m: MensajeEntrante): Promise<void> {
  if (n.estado !== 'activo' && n.estado !== 'pausado') {
    console.warn(`V3: entrante de ${n.id} en estado '${n.estado}': se ignora`);
    return;
  }
  if (await yaLlego(deps.db, m.waMessageId)) return; // el reintento de Meta
  const ahora = deps.ahora();
  // Cualquier mensaje del narrador abre la ventana de 24 h de Meta: sin esto,
  // drenar mandaría todo como plantilla.
  const fila = await anotarEntrante(deps, n.id, ahora, m.tipo === 'audio');
  if (!fila) {
    console.warn(`V3: ${n.id} no tiene fila en entrevistas_v3: se ignora el mensaje`);
    return;
  }
  // Lo que no deja fila en `respuestas` (el texto que reactiva a un pausado, la
  // foto suelta, el audio que no se pudo bajar) se deduplica con los vistos.
  if (yaVisto(fila.estado, m.waMessageId)) return;
  await marcarRespondido(deps.db, n.id, ahora);
  const pausado = n.estado === 'pausado';
  const escrito = m.tipo === 'texto' && !m.esBoton;
  // «Quiero parar» / «que no vaya al libro» escrito (pedidos.ts): no reactiva ni reenvía nada.
  const pedidoEscrito = escrito && pedidoDe((m.texto ?? '').trim(), fila.idioma) !== null;
  // La pregunta abierta todavía no le llegó (Naza, 09/10, Imma): lo que mande no la contesta. Queda aparte
  // (∅), sin acuse, y la pregunta sale ahora, que la ventana se acaba de abrir. Un pedido escrito sigue su camino.
  if (abiertaSinEntregar(fila.estado) && !pedidoEscrito) {
    console.warn(`V3: ${n.id} escribió con la pregunta ${fila.estado.esperando} todavía sin entregar: queda aparte y la pregunta sale ahora`);
    await guardarAparte(deps, n, m, fila);
    // La pregunta sale ahora: M8 cuenta desde ahora (no desde que se trabó) y no hay silencio que cerrar.
    const ahoraIso = ahora.toISOString();
    await conReintento(deps.db, n.id, (f) => ({
      cambio: { estado: { ...f.estado, abiertaDesde: ahoraIso, m8En: undefined }, ultimo_audio_at: null },
      resultado: true,
    }));
    if (pausado) await reactivar(deps, n.id);
    await drenar(deps, n.id);
    return;
  }
  if (pausado && escrito && !pedidoEscrito && fila.estado.esperando) {
    await reactivar(deps, n.id);
    // Vuelve escribiendo con una pregunta abierta: se le reenvía (sin M22). M8 cuenta de
    // nuevo desde ahora y, si había algo contado, el silencio de 3' también (que no la
    // cierre apenas se reenvía).
    const ahoraIso = ahora.toISOString();
    await conReintento(deps.db, n.id, (f) => {
      if (yaVisto(f.estado, m.waMessageId)) return null;
      const estado = { ...anotarVisto(reenviarAbierta(f.estado), m.waMessageId), m8En: undefined, ...(f.estado.esperando ? { abiertaDesde: ahoraIso } : {}) };
      return { cambio: { estado, ...(f.estado.borrador?.trim() ? { ultimo_audio_at: ahoraIso } : {}) }, resultado: true };
    });
    await drenar(deps, n.id);
    return;
  }
  // Un pedido (pausa o reserva) no dispara el reenvío por plantilla: el audio se sabe recién transcripto.
  if (!pedidoEscrito && m.tipo !== 'audio') await reenviarSiSalioPorPlantilla(deps, n.id, m);
  let llegada: Llegada = 'mensaje';
  if (m.tipo === 'imagen') await recibirImagen(deps, n, m, fila);
  else if (m.tipo === 'audio') {
    llegada = await recibirAudioV3(deps, n, m, fila);
    if (llegada !== 'pedido') await reenviarSiSalioPorPlantilla(deps, n.id, m);
  } else if (m.esBoton) {
    if (!(await recibirBoton(deps, n, m, fila, ahora))) await botonSuelto(deps, n, m);
  } else llegada = await recibirTexto(deps, n, m, fila.idioma);
  // Un pausado vuelve con cualquier mensaje, salvo que lo que mandó sea un pedido (pausa o reserva).
  // Si no tenía pregunta abierta, le sale la siguiente en el momento (Naza, 07/10); lo que mandó
  // ya quedó aparte (sin abierta, '∅').
  if (pausado && llegada !== 'pedido') {
    await reactivar(deps, n.id);
    if (!fila.estado.esperando) await abrirAlVolver(deps, n, ahora);
  }
  // Lo que haya quedado en la cola (también lo que esperaba la ventana) sale ahora.
  await drenar(deps, n.id);
}

/**
 * Lo que llegó mientras la pregunta abierta no le había llegado: se guarda con SIN_CLAVE_V3 (no se suma a
 * nada; el reloj no lo reintenta). Un audio se transcribe igual y se avisa a los socios (puede ser un relato
 * que vale la pena: lo deciden ellos); la foto queda como foto suelta, sin acuse.
 */
async function guardarAparte(deps: DepsV3, n: NarradorV3, m: MensajeEntrante, fila: FilaV3): Promise<void> {
  const llegada = await numeroDeLlegada(deps.db, n.id);
  if (m.tipo === 'texto') {
    const t = m.esBoton ? respuestaDeBoton(m.texto ?? '') : (m.texto ?? '').trim();
    if (t) await guardarTextoV3(deps.db, n.id, llegada, t, { waMessageId: m.waMessageId, clave: SIN_CLAVE_V3, esBoton: m.esBoton === true });
    return;
  }
  if (m.tipo === 'audio' && m.mediaId) {
    let dicho = '(no se pudo transcribir)';
    try {
      const audio = await deps.wa.descargar(m.mediaId);
      const g = await guardarAudioV3(deps.db, n.id, llegada, audio, m.waMessageId);
      if (!g) return; // duplicado
      await ponerClave(deps.db, g.id, SIN_CLAVE_V3);
      try {
        const t = await deps.transcribir(audio, { nombre: fila.ficha.nombre, idioma: fila.idioma, narradorId: n.id });
        if (t.texto.trim()) {
          await anotarTranscripcion(deps.db, g.id, t);
          dicho = t.texto.trim();
        }
      } catch (err) {
        console.error(`V3: no pude transcribir el audio aparte de ${n.id}:`, err instanceof Error ? err.message : err);
      }
    } catch (err) {
      dicho = `(no se pudo bajar ni guardar: ${err instanceof Error ? err.message : String(err)})`;
    }
    await deps.avisar(
      `audio-aparte-${m.waMessageId}`,
      'Un narrador V3 mandó un audio antes de ver su pregunta',
      `${n.id} mandó un audio cuando la pregunta ${fila.estado.esperando} todavía no le había llegado. No se sumó a ninguna respuesta (quedó con clave ∅); la pregunta le sale ahora. Lo que dijo: «${dicho.length > 600 ? `${dicho.slice(0, 600)}…` : dicho}». Si vale para el libro, hay que sumarlo a mano.`,
    );
    return;
  }
  const nueva = await conReintento(deps.db, n.id, (f) =>
    yaVisto(f.estado, m.waMessageId) ? null : { cambio: { estado: anotarVisto(f.estado, m.waMessageId) }, resultado: true });
  if (nueva && m.tipo === 'imagen' && m.mediaId) await guardarFotoV3(deps, n.id, m.mediaId, m.mimeType, m.texto, llegada);
}

/** 'pedido': era «quiero parar» o «que no vaya al libro» (pedidos.ts) y no se sumó a nada. */
type Llegada = 'mensaje' | 'pedido';

/** pausado → activo; la alerta de silencio se apaga (como marcarRespondido y el flujo viejo). */
async function reactivar(deps: DepsV3, narradorId: string): Promise<void> {
  await deps.db.from('narradores').update({ estado: 'activo', alerta_silencio: false }).eq('id', narradorId).eq('estado', 'pausado');
}

/**
 * La vuelta de una pausa sin pregunta abierta: la siguiente sale ya, sin
 * esperar su hora, y cuenta en la tanda de hoy. Si la tanda ya llegó al
 * tope, igual sale esta una. Con la entrevista terminada, nada. Antes se
 * suman las preguntas que la familia cargó después (como al abrir la tanda).
 */
async function abrirAlVolver(deps: DepsV3, n: NarradorV3, ahora: Date): Promise<void> {
  const hoy = fechaLocal(ahora, n.zona_horaria);
  const familia = (await leerFamilia(deps.db, n.id)) ?? [];
  const r = await conReintento(deps.db, n.id, (f) => {
    if (f.estado.esperando || f.estado.terminada) return null;
    const conFamilia = sumarFamilia(f.estado, familia);
    const a = avanzar(conFamilia.estado, fichaTexto(f));
    const t = aplicarTanda(f, a.estado, hoy, a.abrio, ahora);
    return { cambio: { estado: t.estado, tanda_dia: t.tanda_dia, tanda_cuenta: t.tanda_cuenta }, resultado: conFamilia.tarde };
  });
  if (r) await avisarFamiliaTarde(deps, n, r.resultado);
}

/**
 * ultimoEntranteAt = ahora (nunca para atrás) y fuera los M8 que no salieron
 * (ya escribió). Si es un audio y hay una pregunta abierta, el reloj de
 * silencio arranca ya, antes de transcribir: un audio que se está
 * transcribiendo no deja cerrar la respuesta. Devuelve la fila, o null si no tiene.
 */
async function anotarEntrante(deps: DepsV3, narradorId: string, ahora: Date, esAudio: boolean): Promise<FilaV3 | null> {
  const r = await conReintento(deps.db, narradorId, (f) => {
    const antes = f.estado.ultimoEntranteAt ? Date.parse(f.estado.ultimoEntranteAt) : Number.NEGATIVE_INFINITY;
    const ultimoEntranteAt = antes > ahora.getTime() ? f.estado.ultimoEntranteAt : ahora.toISOString();
    const audioAntes = f.ultimo_audio_at ? Date.parse(f.ultimo_audio_at) : Number.NEGATIVE_INFINITY;
    const relojDeSilencio = esAudio && f.estado.esperando && audioAntes < ahora.getTime() ? { ultimo_audio_at: ahora.toISOString() } : {};
    return { cambio: { estado: { ...sinRecordatorios(f.estado), ultimoEntranteAt }, ...relojDeSilencio }, resultado: true };
  });
  return r?.fila ?? null;
}

/**
 * La abierta salió por plantilla (sin botones). Al volver a escribir, la
 * ventana está abierta: si la pregunta tiene botones, se le reenvía con ellos,
 * salvo que lo que mandó sea justo un botón de la abierta.
 */
async function reenviarSiSalioPorPlantilla(deps: DepsV3, narradorId: string, m: MensajeEntrante): Promise<void> {
  await conReintento(deps.db, narradorId, (f) => {
    const e = f.estado;
    if (!e.abiertaPorPlantilla) return null;
    const tocaLaAbierta = m.esBoton === true && tocarBoton(e, fichaTexto(f), m.texto ?? '') !== null;
    const reenviar = !!e.esperando && (e.preguntaAbierta?.botones?.length ?? 0) > 0 && !tocaLaAbierta;
    return { cambio: { estado: reenviar ? reenviarAbierta(e) : { ...e, abiertaPorPlantilla: undefined } }, resultado: true };
  });
}

/** La clave de la fila, después de guardar el estado. Sin resultado (ya estaba aplicada por otro camino): solo si nadie la puso. */
async function anotarClave(deps: DepsV3, respuestaId: string, r: { resultado: string | null } | null): Promise<void> {
  if (r) await ponerClave(deps.db, respuestaId, r.resultado ?? SIN_CLAVE_V3);
  else await ponerClaveSiFalta(deps.db, respuestaId, SIN_CLAVE_V3);
}

/** M23 ("se me cortó el audio, ¿me lo mandás de nuevo?"), una sola vez por mensaje. */
async function pedirDeNuevo(deps: DepsV3, narradorId: string, waMessageId: string): Promise<void> {
  await conReintento(deps.db, narradorId, (f) => {
    if (yaVisto(f.estado, waMessageId)) return null;
    const conM23 = encolar(f.estado, { texto: textoDelBanco('M23', fichaTexto(f)), tipo: 'suelto' });
    return { cambio: { estado: anotarVisto(conM23, waMessageId) }, resultado: true };
  });
}

type FilaGuardada = { id: string; waMessageId: string };

/**
 * Audio: se baja de Meta y se guarda (si falla, M23) → transcripción en su
 * idioma (un reintento) → si falla o sale vacía, M23; si no, se suma a la
 * abierta y corre el reloj de silencio desde que se guardó la transcripción.
 * No se contesta nada.
 */
async function recibirAudioV3(deps: DepsV3, n: NarradorV3, m: MensajeEntrante, fila: FilaV3): Promise<Llegada> {
  if (!m.mediaId) return 'mensaje';
  let audio: Buffer;
  let guardada: { id: string } | null;
  try {
    audio = await deps.wa.descargar(m.mediaId);
    guardada = await guardarAudioV3(deps.db, n.id, await numeroDeLlegada(deps.db, n.id), audio, m.waMessageId);
  } catch (err) {
    console.error(`V3: no pude bajar o guardar el audio de ${n.id}:`, err instanceof Error ? err.message : err);
    await pedirDeNuevo(deps, n.id, m.waMessageId);
    return 'mensaje';
  }
  if (!guardada) return 'mensaje'; // duplicado
  return aplicarAudio(deps, n.id, fila, { id: guardada.id, waMessageId: m.waMessageId }, null, async () => audio);
}

async function aplicarAudio(
  deps: DepsV3, narradorId: string, fila: Pick<FilaV3, 'ficha' | 'idioma'>, guardada: FilaGuardada,
  transcripcion: string | null, bajar: () => Promise<Buffer>,
): Promise<Llegada> {
  let texto = transcripcion?.trim() ? transcripcion : null;
  if (texto === null) {
    let t: Transcripcion | null = null;
    try {
      const audio = await bajar();
      for (let intento = 0; intento < 2 && !t; intento++) {
        try {
          t = await deps.transcribir(audio, { nombre: fila.ficha.nombre, idioma: fila.idioma, narradorId });
        } catch (err) {
          console.error(`V3: falló la transcripción de ${narradorId} (intento ${intento + 1}):`, err instanceof Error ? err.message : err);
        }
      }
    } catch (err) {
      console.error(`V3: no pude bajar el audio guardado de ${narradorId}:`, err instanceof Error ? err.message : err);
    }
    if (!t || !t.texto.trim()) {
      // Audio cortado, vacío o que no se pudo transcribir: M23 (se le pide de nuevo) y la fila queda afuera.
      await pedirDeNuevo(deps, narradorId, guardada.waMessageId);
      await ponerClave(deps.db, guardada.id, SIN_CLAVE_V3);
      return 'mensaje';
    }
    await anotarTranscripcion(deps.db, guardada.id, t);
    texto = t.texto;
  }
  const dicho = texto;
  const pedido = pedidoDe(dicho, fila.idioma);
  if (pedido) {
    await cumplirPedido(deps, narradorId, pedido, guardada);
    return 'pedido';
  }
  const guardadaAt = deps.ahora().toISOString();
  const r = await conReintento(deps.db, narradorId, (f): Paso<string | null> => {
    if (yaVisto(f.estado, guardada.waMessageId)) return null;
    const a = recibirAudio(f.estado, dicho);
    return { cambio: { estado: anotarVisto(a.estado, guardada.waMessageId), ...(a.abierta ? { ultimo_audio_at: guardadaAt } : {}) }, resultado: a.clave };
  });
  await anotarClave(deps, guardada.id, r);
  return 'mensaje';
}

/**
 * Botón de la abierta: "Sí" → M30 y espera el audio; "No"/"Paso" → cierra y
 * sigue en el momento (siempre: Naza 10/10, si contesta le llega la siguiente); si cerró un CIn, el
 * cazador. Devuelve false si no es un botón de la abierta.
 */
async function recibirBoton(deps: DepsV3, n: NarradorV3, m: MensajeEntrante, fila: FilaV3, ahora: Date): Promise<boolean> {
  const boton = m.texto ?? '';
  if (!tocarBoton(fila.estado, fichaTexto(fila), boton)) return false;
  const guardada = await guardarTextoV3(deps.db, n.id, await numeroDeLlegada(deps.db, n.id), respuestaDeBoton(boton), { waMessageId: m.waMessageId, clave: null, esBoton: true });
  if (!guardada) return true; // duplicado
  await aplicarBoton(deps, n, boton, { id: guardada.id, waMessageId: m.waMessageId }, ahora);
  return true;
}

async function aplicarBoton(deps: DepsV3, n: NarradorV3, boton: string, guardada: FilaGuardada, ahora: Date): Promise<void> {
  const hoy = fechaLocal(ahora, n.zona_horaria);
  type Res = { resultado: string | null; bloqueCerrado?: number; cerro: boolean };
  const r = await conReintento(deps.db, n.id, (f): Paso<Res> => {
    if (yaVisto(f.estado, guardada.waMessageId)) return null;
    const ficha = fichaTexto(f);
    const t = tocarBoton(f.estado, ficha, boton);
    // Ya no es un botón de la abierta (cambió en el medio): se guarda y queda afuera.
    if (!t) return { cambio: { estado: anotarVisto(f.estado, guardada.waMessageId) }, resultado: { resultado: null, cerro: false } };
    if (!t.cerrar) return { cambio: { estado: anotarVisto(t.estado, guardada.waMessageId) }, resultado: { resultado: t.clave, cerro: false } };
    const s = cerrarYSeguir(t.estado, ficha, true);
    const tanda = aplicarTanda(f, s.estado, hoy, s.abrio, ahora);
    return {
      cambio: { estado: anotarVisto(tanda.estado, guardada.waMessageId), ultimo_audio_at: null, tanda_dia: tanda.tanda_dia, tanda_cuenta: tanda.tanda_cuenta },
      resultado: { resultado: t.clave, bloqueCerrado: s.bloqueCerrado, cerro: true },
    };
  });
  await anotarClave(deps, guardada.id, r ? { resultado: r.resultado.resultado } : null);
  await drenar(deps, n.id); // la siguiente pregunta sale antes que los mails de hito
  if (r?.resultado.bloqueCerrado !== undefined) lanzarCazador(deps, n.id, r.resultado.bloqueCerrado);
  if (r?.resultado.cerro) for (const hito of hitosDe(r.fila.estado)) await deps.hito(n.id, hito);
}

/**
 * Un botón que no es de la abierta (un "No" después de "Sí", el "SI" tardío
 * de la plantilla de bienvenida, uno de una pregunta vieja): se guarda, pero
 * no toca la respuesta ni manda M22.
 */
async function botonSuelto(deps: DepsV3, n: NarradorV3, m: MensajeEntrante): Promise<void> {
  await guardarTextoV3(deps.db, n.id, await numeroDeLlegada(deps.db, n.id), respuestaDeBoton(m.texto ?? ''), { waMessageId: m.waMessageId, clave: SIN_CLAVE_V3, esBoton: true });
}

/**
 * Texto escrito (Naza, 07/10): cuenta como respuesta. Se suma a la abierta
 * igual que un audio y corre el mismo reloj de 3 minutos. M22 sale solo la
 * primera vez en toda la entrevista. Sin pregunta abierta no se suma a nada
 * (fila con SIN_CLAVE_V3) y no sale nada, tampoco M22.
 */
async function recibirTexto(deps: DepsV3, n: NarradorV3, m: MensajeEntrante, idioma: Idioma): Promise<Llegada> {
  const texto = (m.texto ?? '').trim();
  if (!texto) return 'mensaje';
  const guardada = await guardarTextoV3(deps.db, n.id, await numeroDeLlegada(deps.db, n.id), texto, { waMessageId: m.waMessageId, clave: null, esBoton: false });
  // El duplicado de un pedido sigue siendo un pedido (no reactiva al pausado).
  if (!guardada) return pedidoDe(texto, idioma) ? 'pedido' : 'mensaje';
  return aplicarTexto(deps, n.id, idioma, texto, { id: guardada.id, waMessageId: m.waMessageId });
}

async function aplicarTexto(deps: DepsV3, narradorId: string, idioma: Idioma, texto: string, guardada: FilaGuardada): Promise<Llegada> {
  const pedido = pedidoDe(texto, idioma);
  if (pedido) {
    await cumplirPedido(deps, narradorId, pedido, guardada);
    return 'pedido';
  }
  // Un saludo solo no contesta la pregunta (Naza, 09/10): no se suma, no corre el reloj, no sale M22.
  if (esSaludo(texto, idioma)) {
    await ponerClave(deps.db, guardada.id, SIN_CLAVE_V3);
    return 'mensaje';
  }
  const guardadaAt = deps.ahora().toISOString();
  const r = await conReintento(deps.db, narradorId, (f): Paso<string | null> => {
    if (yaVisto(f.estado, guardada.waMessageId)) return null;
    const a = recibirAudio(f.estado, texto);
    const estado = f.estado.m22Enviado || !a.abierta
      ? a.estado
      : { ...encolar(a.estado, { texto: textoDelBanco('M22', fichaTexto(f)), tipo: 'suelto' }), m22Enviado: true };
    return { cambio: { estado: anotarVisto(estado, guardada.waMessageId), ...(a.abierta ? { ultimo_audio_at: guardadaAt } : {}) }, resultado: a.clave };
  });
  await anotarClave(deps, guardada.id, r);
  return 'mensaje';
}

/**
 * Imagen: con FO1 abierta, la foto la contesta (`⟦foto⟧`) y corre el reloj de
 * silencio, para sumar el audio que la describe. Si no, foto suelta: se guarda
 * y se acusa solo si hay texto aprobado en su idioma.
 */
async function recibirImagen(deps: DepsV3, n: NarradorV3, m: MensajeEntrante, fila: FilaV3): Promise<void> {
  if (!m.mediaId) return;
  const llegada = await numeroDeLlegada(deps.db, n.id);
  if (marcarFoto(fila.estado, fichaTexto(fila))) {
    // La fila primero: el reintento de Meta se corta acá, antes de subir la foto otra vez.
    const guardada = await guardarTextoV3(deps.db, n.id, llegada, MARCA_FOTO, { waMessageId: m.waMessageId, clave: null, esBoton: false });
    if (!guardada) return;
    try {
      await guardarFotoV3(deps, n.id, m.mediaId, m.mimeType, m.texto, llegada);
    } catch (err) {
      console.error(`V3: no pude guardar la foto de FO1 de ${n.id}:`, err instanceof Error ? err.message : err);
      await ponerClave(deps.db, guardada.id, SIN_CLAVE_V3);
      return;
    }
    await aplicarFoto(deps, n.id, { id: guardada.id, waMessageId: m.waMessageId });
    return;
  }
  // Foto suelta: no deja fila en `respuestas`; su wamid queda entre los vistos antes de subirla.
  const nueva = await conReintento(deps.db, n.id, (f) =>
    yaVisto(f.estado, m.waMessageId) ? null : { cambio: { estado: anotarVisto(f.estado, m.waMessageId) }, resultado: true });
  if (!nueva) return;
  await guardarFotoV3(deps, n.id, m.mediaId, m.mimeType, m.texto, llegada);
  const acuse = textoFijo('fotoSuelta', fila.idioma);
  if (acuse) await conReintento(deps.db, n.id, (f) => ({ cambio: { estado: encolar(f.estado, { texto: acuse, tipo: 'suelto' }) }, resultado: true }));
}

async function aplicarFoto(deps: DepsV3, narradorId: string, guardada: FilaGuardada): Promise<void> {
  const guardadaAt = deps.ahora().toISOString();
  const r = await conReintento(deps.db, narradorId, (f): Paso<string | null> => {
    if (yaVisto(f.estado, guardada.waMessageId)) return null;
    const conFoto = marcarFoto(f.estado, fichaTexto(f));
    if (!conFoto) return { cambio: { estado: anotarVisto(f.estado, guardada.waMessageId) }, resultado: null };
    return { cambio: { estado: anotarVisto(conFoto.estado, guardada.waMessageId), ultimo_audio_at: guardadaAt }, resultado: conFoto.clave };
  });
  await anotarClave(deps, guardada.id, r);
}

// ---------------------------------------------------------------- reconciliación

type FilaSinClave = { id: string; wa_message_id: string; audio_path: string | null; transcripcion: string | null; texto_directo: string | null };

/**
 * Las filas de `respuestas` de este narrador que llegaron después de crear su
 * entrevista V3, hace más de RECONCILIAR_MS, y siguen sin clave_v3: el
 * proceso que las guardó se cayó (o falló) antes de sumarlas al estado. Se
 * pasan por el mismo camino que un mensaje nuevo (el audio sin transcribir se
 * transcribe desde Storage) y quedan con clave. Devuelve cuántas tomó.
 */
export async function reconciliarV3(deps: DepsV3, fila: FilaV3, n: NarradorV3): Promise<number> {
  const limite = new Date(deps.ahora().getTime() - RECONCILIAR_MS).toISOString();
  const desde = new Date(fila.creada_at).toISOString();
  const { data, error } = await deps.db.from('respuestas')
    .select('id,wa_message_id,audio_path,transcripcion,texto_directo')
    .eq('narrador_id', n.id).is('clave_v3', null).not('wa_message_id', 'is', null)
    .gt('recibido_at', desde).lt('recibido_at', limite)
    .order('recibido_at', { ascending: true });
  if (error) throw new Error(`reloj V3: no pude buscar respuestas sin clave de ${n.id}: ${error.message}`);
  const filas = (data as FilaSinClave[] | null) ?? [];
  for (const r of filas) {
    const guardada = { id: r.id, waMessageId: r.wa_message_id };
    const directo = r.texto_directo ?? '';
    const { boton } = leerBoton(directo);
    if (r.audio_path) {
      const path = r.audio_path;
      await aplicarAudio(deps, n.id, fila, guardada, r.transcripcion, () => bajarAudioGuardado(deps.db, path));
    } else if (directo === MARCA_FOTO) {
      await aplicarFoto(deps, n.id, guardada);
    } else if (boton !== undefined && r.transcripcion === null) {
      await aplicarBoton(deps, n, boton, guardada, deps.ahora());
    } else {
      const texto = (r.transcripcion ?? directo).trim();
      if (texto) await aplicarTexto(deps, n.id, fila.idioma, texto, guardada);
      else await ponerClave(deps.db, r.id, SIN_CLAVE_V3);
    }
  }
  return filas.length;
}
