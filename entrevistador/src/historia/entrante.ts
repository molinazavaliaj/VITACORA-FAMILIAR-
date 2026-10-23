// Lo que llega de un narrador de «Vitácora de una historia». Se entra desde procesar.ts: un narrador con fila en
// `historias` va entero por acá, desde la bienvenida hasta después de FIN-H, y a nada más. No se llama a ningún modelo
// (salvo la transcripción y el cazador, en segundo plano). Ningún texto se arma acá: salen del banco (turno.ts,
// arranque.ts) o de los textos fijos ya aprobados.
//
// Antes del SÍ (arranque.ts): SÍ → activo y arranca (TEMA-ABIERTO, o COMO y la primera pregunta). Otra cosa → si la
// bienvenida no le llegó, sale ahora como texto; si ya le llegó, se le contesta una vez (`noEntendi` / `noQuiere`);
// después, silencio y aviso a los socios. Antes del SÍ no se guarda nada de lo que mande: el SÍ es el permiso.
//
// Después del SÍ es el entrante de la V3 (src/v3/entrante.ts) sobre la tabla `historias` y `clave_historia`: Meta ya
// recibió el 200 cuando esto corre, así que una fila de `respuestas` se da por procesada recién cuando tiene clave (se
// pone DESPUÉS de guardar el estado) y el reloj reconcilia las que quedaron sin clave. Las que se dejan afuera a
// propósito llevan SIN_CLAVE_HISTORIA.

import { fechaLocal } from '../flujo/tiempo.js';
import { esSaludo } from '../v3/saludo.js';
import { textoFijo } from '../v3/textos-fijos.js';
import type { MensajeEntrante } from '../whatsapp/webhook.js';
import { leerSiNo, respuestaAntesDelSi, textoDeBienvenida } from './arranque.js';
import { lanzarCazador } from './cazador.js';
import type { DepsHistoria, Transcripcion } from './deps.js';
import { drenar, ventanaAbierta } from './enviar.js';
import { conReintento, type CambioFila, type Paso } from './estado.js';
import { leerSacadas, type Sacadas } from './fuera.js';
import {
  anotarTranscripcion, bajarAudioGuardado, guardarAudio, guardarFoto, guardarTexto, marcarRespondido, numeroDeLlegada, ponerClave, ponerClaveSiFalta, yaLlego,
} from './filas.js';
import type { Idioma } from './nucleo/entrevista/idioma.js';
import { leerBoton, respuestaDeBoton } from './nucleo/entrevista/respuesta.js';
import { cumplirPedido, pedidoDe } from './pedidos.js';
import { aplicarTanda, hitosDe } from './tanda.js';
import { CLAVE_TEMA, fichaTexto, MARCA_FOTO, SIN_CLAVE_HISTORIA, type EstadoHistoria, type FilaHistoria, type NarradorHistoria } from './tipos.js';
import { anotarVisto, arrancar, avanzar, cerrarYSeguir, encolar, marcarFoto, recibirAudio, reenviarAbierta, sinRecordatorios, textoDelBanco, tocarBoton, yaVisto } from './turno.js';

/** Una fila sin clave más vieja que esto la retoma el reloj (el proceso que la guardó se cayó o falló). */
export const RECONCILIAR_MS = 5 * 60_000;

/** Los estados en que el narrador habla con este bot: antes del SÍ (invitado, acepto) y durante la entrevista. */
const ESTADOS_QUE_ESCUCHAN = ['invitado', 'acepto', 'activo', 'pausado'];

/**
 * ¿Lo abierto todavía no le llegó? (como en V3: queda en la cola cuando la ventana de 24 h está cerrada y no hay
 * plantilla aprobada en su idioma).
 */
export function abiertaSinEntregar(e: Pick<EstadoHistoria, 'esperando' | 'preguntaAbierta' | 'salientes' | 'charla'>): boolean {
  const pregunta = e.preguntaAbierta?.partes[0]?.texto;
  if (!e.esperando || !pregunta) return false;
  if (!e.salientes.some((s) => s.tipo === 'turno' && s.texto.includes(pregunta))) return false;
  const id = e.preguntaAbierta!.partes[0].id;
  const veces = e.charla.filter((g) => g.de === 'bio' && g.partes.some((p) => p.id === id)).length;
  return veces <= 1;
}

export async function procesarEntranteHistoria(deps: DepsHistoria, n: NarradorHistoria, m: MensajeEntrante): Promise<void> {
  if (!ESTADOS_QUE_ESCUCHAN.includes(n.estado)) {
    console.warn(`historia: entrante de ${n.id} en estado '${n.estado}': se ignora`);
    return;
  }
  if (await yaLlego(deps.db, m.waMessageId)) return; // el reintento de Meta
  const ahora = deps.ahora();
  const anotado = await anotarEntrante(deps, n.id, ahora, m.tipo === 'audio');
  if (!anotado) {
    console.warn(`historia: ${n.id} no tiene fila en historias: se ignora el mensaje`);
    return;
  }
  const { fila, ventanaAntes } = anotado;
  if (yaVisto(fila.estado, m.waMessageId)) return;
  if (fila.estado.fase === 'bienvenida') {
    await antesDelSi(deps, n, m, fila, ahora);
    return;
  }
  await marcarRespondido(deps.db, n.id, ahora);
  const pausado = n.estado === 'pausado';
  const escrito = m.tipo === 'texto' && !m.esBoton;
  const pedidoEscrito = escrito && pedidoDe((m.texto ?? '').trim(), fila.idioma) !== null;
  // Lo abierto todavía no le llegó (como en V3, el caso de Imma): lo que mande no lo contesta.
  const trabada = !ventanaAntes || fila.estado.fallosEnvio > 0;
  if (abiertaSinEntregar(fila.estado) && trabada && !pedidoEscrito) {
    console.warn(`historia: ${n.id} escribió con ${fila.estado.esperando} todavía sin entregar: queda aparte y sale ahora`);
    await guardarAparte(deps, n, m, fila);
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
    // Vuelve escribiendo con algo abierto: se le reenvía (sin M22). Lo que escribió no contesta (un «Hola, volví»
    // no puede ser la respuesta), pero queda guardado con ∅ y, si es más que un saludo, se avisa a los socios.
    const ahoraIso = ahora.toISOString();
    const escritoTexto = (m.texto ?? '').trim();
    const guardada = escritoTexto
      ? await guardarTexto(deps.db, n.id, await numeroDeLlegada(deps.db, n.id), escritoTexto, { waMessageId: m.waMessageId, clave: SIN_CLAVE_HISTORIA, esBoton: false })
      : null;
    await conReintento(deps.db, n.id, (f) => {
      if (yaVisto(f.estado, m.waMessageId)) return null;
      const estado = { ...anotarVisto(reenviarAbierta(f.estado), m.waMessageId), m8En: undefined, ...(f.estado.esperando ? { abiertaDesde: ahoraIso } : {}) };
      return { cambio: { estado, ...(f.estado.borrador?.trim() ? { ultimo_audio_at: ahoraIso } : {}) }, resultado: true };
    });
    if (guardada && !esSaludo(escritoTexto, fila.idioma)) {
      await deps.avisar(
        `texto-pausado-${m.waMessageId}`,
        'Un narrador de historia pausado volvió escribiendo',
        `${n.id} estaba pausado y volvió escribiendo con ${fila.estado.esperando} abierta. Se le reenvió; lo que escribió no se sumó a ninguna respuesta (quedó con clave ∅). Lo que escribió: «${recortar(escritoTexto)}». Si vale para el libro, hay que sumarlo a mano.`,
      );
    }
    await drenar(deps, n.id);
    return;
  }
  const contestaEscrito = escrito && !pedidoEscrito && (m.texto ?? '').trim() !== '' && !esSaludo((m.texto ?? '').trim(), fila.idioma);
  if (!pedidoEscrito && m.tipo !== 'audio') await reenviarSiSalioPorPlantilla(deps, n.id, m, contestaEscrito);
  let llegada: Llegada = 'mensaje';
  if (m.tipo === 'imagen') await recibirImagen(deps, n, m, fila);
  else if (m.tipo === 'audio') {
    llegada = await recibirAudioHistoria(deps, n, m, fila);
    if (llegada !== 'pedido') await reenviarSiSalioPorPlantilla(deps, n.id, m, true);
  } else if (m.esBoton) {
    if (!(await recibirBoton(deps, n, m, fila, ahora))) await botonSuelto(deps, n, m);
  } else llegada = await recibirTexto(deps, n, m, fila.idioma);
  if (pausado && llegada !== 'pedido') {
    await reactivar(deps, n.id);
    if (!fila.estado.esperando) await abrirAlVolver(deps, n, ahora);
  }
  await drenar(deps, n.id);
}

const recortar = (t: string) => (t.length > 600 ? `${t.slice(0, 600)}…` : t);

// ---------------------------------------------------------------- antes del SÍ

/**
 * Antes del SÍ (banco.md, regla 1). SÍ → activo y arranca. «No» → `noQuiere`, una vez, y aviso a los socios (los
 * términos prometen devolver sin que lo pida). Otra cosa → la bienvenida como texto si no le llegó; si ya le llegó,
 * `noEntendi`, una vez; después, silencio y aviso. No se guarda nada de lo que mande.
 */
async function antesDelSi(deps: DepsHistoria, n: NarradorHistoria, m: MensajeEntrante, fila: FilaHistoria, ahora: Date): Promise<void> {
  const dijo = m.tipo === 'texto' ? leerSiNo(m.texto ?? '') : null;
  type Que = 'si' | 'no' | 'bienvenida' | 'no-entendi' | 'nada';
  const r = await conReintento(deps.db, n.id, (f): Paso<Que> => {
    if (f.estado.fase !== 'bienvenida' || yaVisto(f.estado, m.waMessageId)) return null;
    const e = anotarVisto(f.estado, m.waMessageId);
    if (dijo === 'si') {
      const a = arrancar(e, fichaTexto(f));
      return { cambio: { estado: a.abrio ? { ...a.estado, abiertaDesde: ahora.toISOString() } : a.estado }, resultado: 'si' };
    }
    if (dijo !== 'no' && !e.bienvenida) {
      const conBienvenida = encolar(e, { texto: textoDeBienvenida(f), tipo: 'bienvenida' });
      return { cambio: { estado: { ...conBienvenida, bienvenida: { en: ahora.toISOString(), por: 'texto' } } }, resultado: 'bienvenida' };
    }
    if (!e.sePidioSi) {
      const conRespuesta = encolar(e, { texto: respuestaAntesDelSi(f, dijo), tipo: 'suelto' });
      return { cambio: { estado: { ...conRespuesta, sePidioSi: true } }, resultado: dijo === 'no' ? 'no' : 'no-entendi' };
    }
    return { cambio: { estado: e }, resultado: dijo === 'no' ? 'no' : 'nada' };
  });
  if (!r) return;
  const que = r.resultado;
  if (que === 'si') {
    // invitado → activo de una vez (como la Viaje V2): con el SÍ sale lo primero de la entrevista.
    const { error } = await deps.db.from('narradores').update({ estado: 'activo', alerta_silencio: false }).eq('id', n.id).in('estado', ['invitado', 'acepto']);
    if (error) console.error(`historia: no pude dejar activo a ${n.id}: ${error.message}`);
    await marcarRespondido(deps.db, n.id, ahora);
  } else if (que === 'no') {
    await deps.avisar(
      `dijo-que-no:${n.id}`,
      `${n.como_le_dicen ?? n.id} dijo que no quiere participar`,
      `${n.como_le_dicen ?? n.id} (${n.id}) contestó que no a la bienvenida de su historia.\n\n`
      + 'Corresponde devolverle el dinero a quien compró, completo y sin que lo pida, dentro de los 14 días (términos §8). No se le insiste.',
    );
  } else if (que === 'nada') {
    await deps.avisar(
      `historia-sin-si-${n.id}`,
      `${n.como_le_dicen ?? n.id} escribe pero no dice SÍ (historia)`,
      `${n.id} recibió la bienvenida de su historia y sigue escribiendo sin decir SÍ (lo último: ${m.tipo === 'texto' ? `«${recortar((m.texto ?? '').slice(0, 200))}»` : m.tipo}). El bot no le contesta más: hay que verlo a mano.`,
    );
  }
  await drenar(deps, n.id);
}

// ---------------------------------------------------------------- después del SÍ

/**
 * Lo que llegó mientras lo abierto no le había llegado: se guarda con SIN_CLAVE_HISTORIA. Un audio se transcribe
 * igual y se avisa a los socios; la foto queda como foto suelta, sin acuse.
 */
async function guardarAparte(deps: DepsHistoria, n: NarradorHistoria, m: MensajeEntrante, fila: FilaHistoria): Promise<void> {
  const llegada = await numeroDeLlegada(deps.db, n.id);
  if (m.tipo === 'texto') {
    const t = m.esBoton ? respuestaDeBoton(m.texto ?? '') : (m.texto ?? '').trim();
    if (!t) return;
    const g = await guardarTexto(deps.db, n.id, llegada, t, { waMessageId: m.waMessageId, clave: SIN_CLAVE_HISTORIA, esBoton: m.esBoton === true });
    if (g && !m.esBoton && !esSaludo(t, fila.idioma)) {
      await deps.avisar(
        `texto-aparte-${m.waMessageId}`,
        'Un narrador de historia escribió antes de ver su pregunta',
        `${n.id} escribió cuando ${fila.estado.esperando} todavía no le había llegado. No se sumó a ninguna respuesta (quedó con clave ∅); le sale ahora. Lo que escribió: «${recortar(t)}». Si vale para el libro, hay que sumarlo a mano.`,
      );
    }
    return;
  }
  if (m.tipo === 'audio' && m.mediaId) {
    let dicho = '(no se pudo transcribir)';
    try {
      const audio = await deps.wa.descargar(m.mediaId);
      const g = await guardarAudio(deps.db, n.id, llegada, audio, m.waMessageId);
      if (!g) return; // duplicado
      await ponerClave(deps.db, g.id, SIN_CLAVE_HISTORIA);
      try {
        const t = await deps.transcribir(audio, { nombre: fila.ficha.nombre, idioma: fila.idioma, narradorId: n.id });
        if (t.texto.trim()) {
          await anotarTranscripcion(deps.db, g.id, t);
          dicho = t.texto.trim();
        }
      } catch (err) {
        console.error(`historia: no pude transcribir el audio aparte de ${n.id}:`, err instanceof Error ? err.message : err);
      }
    } catch (err) {
      dicho = `(no se pudo bajar ni guardar: ${err instanceof Error ? err.message : String(err)})`;
    }
    await deps.avisar(
      `audio-aparte-${m.waMessageId}`,
      'Un narrador de historia mandó un audio antes de ver su pregunta',
      `${n.id} mandó un audio cuando ${fila.estado.esperando} todavía no le había llegado. No se sumó a ninguna respuesta (quedó con clave ∅); le sale ahora. Lo que dijo: «${recortar(dicho)}». Si vale para el libro, hay que sumarlo a mano.`,
    );
    return;
  }
  const nueva = await conReintento(deps.db, n.id, (f) =>
    yaVisto(f.estado, m.waMessageId) ? null : { cambio: { estado: anotarVisto(f.estado, m.waMessageId) }, resultado: true });
  if (nueva && m.tipo === 'imagen' && m.mediaId) await guardarFotoOAvisar(deps, n, m.mediaId, m.mimeType, m.texto, llegada, m.waMessageId, 'suelta');
}

/** 'pedido': era «quiero parar» o «que no vaya al libro» y no se sumó a nada. */
type Llegada = 'mensaje' | 'pedido';

/** pausado → activo; la alerta de silencio se apaga. */
async function reactivar(deps: DepsHistoria, narradorId: string): Promise<void> {
  await deps.db.from('narradores').update({ estado: 'activo', alerta_silencio: false }).eq('id', narradorId).eq('estado', 'pausado');
}

/** La vuelta de una pausa sin nada abierto: lo siguiente sale ya, sin esperar su hora. */
async function abrirAlVolver(deps: DepsHistoria, n: NarradorHistoria, ahora: Date): Promise<void> {
  const hoy = fechaLocal(ahora, n.zona_horaria);
  const sacadas = await leerSacadas(deps.db, n.id);
  await conReintento(deps.db, n.id, (f) => {
    if (f.estado.esperando || f.estado.terminada) return null;
    const a = avanzar(f.estado, fichaTexto(f), sacadas);
    const t = aplicarTanda(f, a.estado, hoy, a.abrio, ahora);
    return { cambio: { estado: t.estado, tanda_dia: t.tanda_dia, tanda_cuenta: t.tanda_cuenta }, resultado: true };
  });
}

/**
 * ultimoEntranteAt = ahora (nunca para atrás) y fuera los M8 que no salieron. Si es un audio y hay algo abierto, el
 * reloj de silencio arranca ya. Devuelve la fila y si la ventana de 24 h ya estaba abierta antes de este mensaje.
 */
async function anotarEntrante(deps: DepsHistoria, narradorId: string, ahora: Date, esAudio: boolean): Promise<{ fila: FilaHistoria; ventanaAntes: boolean } | null> {
  const r = await conReintento(deps.db, narradorId, (f) => {
    const antes = f.estado.ultimoEntranteAt ? Date.parse(f.estado.ultimoEntranteAt) : Number.NEGATIVE_INFINITY;
    const ultimoEntranteAt = antes > ahora.getTime() ? f.estado.ultimoEntranteAt : ahora.toISOString();
    const audioAntes = f.ultimo_audio_at ? Date.parse(f.ultimo_audio_at) : Number.NEGATIVE_INFINITY;
    const relojDeSilencio = esAudio && f.estado.esperando && audioAntes < ahora.getTime() ? { ultimo_audio_at: ahora.toISOString() } : {};
    return { cambio: { estado: { ...sinRecordatorios(f.estado), ultimoEntranteAt }, ...relojDeSilencio }, resultado: ventanaAbierta(f.estado, ahora) };
  });
  return r ? { fila: r.fila, ventanaAntes: r.resultado } : null;
}

/** Lo abierto salió por plantilla (sin botones): al volver a escribir, si no lo contestó, se le reenvía con ellos. */
async function reenviarSiSalioPorPlantilla(deps: DepsHistoria, narradorId: string, m: MensajeEntrante, contesta = false): Promise<void> {
  await conReintento(deps.db, narradorId, (f) => {
    const e = f.estado;
    if (!e.abiertaPorPlantilla) return null;
    const tocaLaAbierta = m.esBoton === true && tocarBoton(e, fichaTexto(f), m.texto ?? '') !== null;
    const reenviar = !contesta && !!e.esperando && (e.preguntaAbierta?.botones?.length ?? 0) > 0 && !tocaLaAbierta;
    return { cambio: { estado: reenviar ? reenviarAbierta(e) : { ...e, abiertaPorPlantilla: undefined } }, resultado: true };
  });
}

/** La clave de la fila, después de guardar el estado. Sin resultado (ya estaba aplicada por otro camino): solo si nadie la puso. */
async function anotarClave(deps: DepsHistoria, respuestaId: string, r: { resultado: string | null } | null): Promise<void> {
  if (r) await ponerClave(deps.db, respuestaId, r.resultado ?? SIN_CLAVE_HISTORIA);
  else await ponerClaveSiFalta(deps.db, respuestaId, SIN_CLAVE_HISTORIA);
}

/** M23 ("se me cortó el audio"), una sola vez por mensaje. */
async function pedirDeNuevo(deps: DepsHistoria, narradorId: string, waMessageId: string): Promise<void> {
  await conReintento(deps.db, narradorId, (f) => {
    if (yaVisto(f.estado, waMessageId)) return null;
    const conM23 = encolar(f.estado, { texto: textoDelBanco('M23', fichaTexto(f)), tipo: 'suelto' });
    return { cambio: { estado: anotarVisto(conM23, waMessageId) }, resultado: true };
  });
}

type FilaGuardada = { id: string; waMessageId: string };

async function recibirAudioHistoria(deps: DepsHistoria, n: NarradorHistoria, m: MensajeEntrante, fila: FilaHistoria): Promise<Llegada> {
  if (!m.mediaId) return 'mensaje';
  let audio: Buffer;
  let guardada: { id: string } | null;
  try {
    audio = await deps.wa.descargar(m.mediaId);
    guardada = await guardarAudio(deps.db, n.id, await numeroDeLlegada(deps.db, n.id), audio, m.waMessageId);
  } catch (err) {
    console.error(`historia: no pude bajar o guardar el audio de ${n.id}:`, err instanceof Error ? err.message : err);
    await pedirDeNuevo(deps, n.id, m.waMessageId);
    return 'mensaje';
  }
  if (!guardada) return 'mensaje'; // duplicado
  return aplicarAudio(deps, n.id, fila, { id: guardada.id, waMessageId: m.waMessageId }, null, async () => audio);
}

async function aplicarAudio(
  deps: DepsHistoria, narradorId: string, fila: Pick<FilaHistoria, 'ficha' | 'idioma'>, guardada: FilaGuardada,
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
          console.error(`historia: falló la transcripción de ${narradorId} (intento ${intento + 1}):`, err instanceof Error ? err.message : err);
        }
      }
    } catch (err) {
      console.error(`historia: no pude bajar el audio guardado de ${narradorId}:`, err instanceof Error ? err.message : err);
    }
    if (!t || !t.texto.trim()) {
      await pedirDeNuevo(deps, narradorId, guardada.waMessageId);
      await ponerClave(deps.db, guardada.id, SIN_CLAVE_HISTORIA);
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

/** Lo que resulta de cerrar lo abierto y mandar lo que sigue (lo usan el botón y el reloj). */
export type Cerrado = { clave: string | null; bloqueCerrado?: number; avisarSinElegir: boolean };

/**
 * El paso de compare-and-swap que cierra lo abierto y manda lo que sigue (como en V3: si contesta, le llega la
 * siguiente siempre). Si eligió su historia en TEMA-ABIERTO, la escribe en `ficha.temaLibre`.
 */
export function pasoDeCierre(f: FilaHistoria, hoy: string, ahora: Date, sacadas: Sacadas, extra: Partial<EstadoHistoria> = {}): { cambio: CambioFila; resultado: Cerrado } {
  const clave = f.estado.esperando ?? null;
  const s = cerrarYSeguir(f.estado, fichaTexto(f), sacadas);
  const t = aplicarTanda(f, s.estado, hoy, s.abrio, ahora);
  const avisarSinElegir = s.sinElegir === true && !f.estado.temaSinElegirAvisado;
  const estado = { ...t.estado, ...extra, ...(avisarSinElegir ? { temaSinElegirAvisado: true } : {}) };
  return {
    cambio: {
      estado, ultimo_audio_at: null, tanda_dia: t.tanda_dia, tanda_cuenta: t.tanda_cuenta,
      ...(s.temaElegido !== undefined ? { ficha: { ...f.ficha, temaLibre: s.temaElegido } } : {}),
    },
    resultado: { clave, ...(s.bloqueCerrado !== undefined ? { bloqueCerrado: s.bloqueCerrado } : {}), avisarSinElegir },
  };
}

/** Después de guardar un cierre: drenar, el cazador si se cerró un bloque, los mails de hito y el aviso de tema sin elegir. */
export async function despuesDeCerrar(deps: DepsHistoria, n: Pick<NarradorHistoria, 'id' | 'como_le_dicen'>, fila: FilaHistoria, r: Cerrado): Promise<void> {
  await drenar(deps, n.id); // lo que sigue sale antes que los mails de hito
  if (r.bloqueCerrado !== undefined) lanzarCazador(deps, n.id, r.bloqueCerrado);
  for (const hito of hitosDe(fila.estado)) await deps.hito(n.id, hito);
  if (r.avisarSinElegir) {
    await deps.avisar(
      `historia-sin-tema-${n.id}`,
      `${n.como_le_dicen ?? n.id} todavía no eligió su historia`,
      `${n.id} tiene el tema abierto: recibió TEMA-ABIERTO y TEMA-LISTA y sigue sin decir qué historia quiere contar. La entrevista espera (el recordatorio M8 sale a los 2 días). Si hace falta, hay que hablarle a mano.`,
    );
  }
}

/**
 * Botón de lo abierto ([No tengo fotos], [Ya lo conté todo]): cierra y sigue en el momento. Devuelve false si no es
 * un botón de lo abierto.
 */
async function recibirBoton(deps: DepsHistoria, n: NarradorHistoria, m: MensajeEntrante, fila: FilaHistoria, ahora: Date): Promise<boolean> {
  const boton = m.texto ?? '';
  if (!tocarBoton(fila.estado, fichaTexto(fila), boton)) return false;
  const guardada = await guardarTexto(deps.db, n.id, await numeroDeLlegada(deps.db, n.id), respuestaDeBoton(boton), { waMessageId: m.waMessageId, clave: null, esBoton: true });
  if (!guardada) return true; // duplicado
  await aplicarBoton(deps, n, boton, { id: guardada.id, waMessageId: m.waMessageId }, ahora);
  return true;
}

async function aplicarBoton(deps: DepsHistoria, n: NarradorHistoria, boton: string, guardada: FilaGuardada, ahora: Date): Promise<void> {
  const hoy = fechaLocal(ahora, n.zona_horaria);
  const sacadas = await leerSacadas(deps.db, n.id);
  const r = await conReintento(deps.db, n.id, (f): Paso<Cerrado | null> => {
    if (yaVisto(f.estado, guardada.waMessageId)) return null;
    const t = tocarBoton(f.estado, fichaTexto(f), boton);
    // Ya no es un botón de lo abierto (cambió en el medio): se guarda y queda afuera.
    if (!t) return { cambio: { estado: anotarVisto(f.estado, guardada.waMessageId) }, resultado: null };
    const p = pasoDeCierre({ ...f, estado: t.estado }, hoy, ahora, sacadas);
    return { cambio: { ...p.cambio, estado: anotarVisto(p.cambio.estado!, guardada.waMessageId) }, resultado: p.resultado };
  });
  await anotarClave(deps, guardada.id, r ? { resultado: r.resultado?.clave ?? null } : null);
  if (r?.resultado) await despuesDeCerrar(deps, n, r.fila, r.resultado);
  else await drenar(deps, n.id);
}

/** Un botón que no es de lo abierto (el «SÍ» tardío de la bienvenida, uno de una pregunta vieja): se guarda y nada más. */
async function botonSuelto(deps: DepsHistoria, n: NarradorHistoria, m: MensajeEntrante): Promise<void> {
  await guardarTexto(deps.db, n.id, await numeroDeLlegada(deps.db, n.id), respuestaDeBoton(m.texto ?? ''), { waMessageId: m.waMessageId, clave: SIN_CLAVE_HISTORIA, esBoton: true });
}

/**
 * Texto escrito: cuenta como respuesta, igual que un audio, y corre el mismo reloj de 3 minutos. M22 sale solo la
 * primera vez en toda la entrevista, y no en TEMA-ABIERTO (que pide «en audio o escrito»). Sin nada abierto no se
 * suma a nada.
 */
async function recibirTexto(deps: DepsHistoria, n: NarradorHistoria, m: MensajeEntrante, idioma: Idioma): Promise<Llegada> {
  const texto = (m.texto ?? '').trim();
  if (!texto) return 'mensaje';
  const guardada = await guardarTexto(deps.db, n.id, await numeroDeLlegada(deps.db, n.id), texto, { waMessageId: m.waMessageId, clave: null, esBoton: false });
  if (!guardada) return pedidoDe(texto, idioma) ? 'pedido' : 'mensaje';
  return aplicarTexto(deps, n.id, idioma, texto, { id: guardada.id, waMessageId: m.waMessageId });
}

async function aplicarTexto(deps: DepsHistoria, narradorId: string, idioma: Idioma, texto: string, guardada: FilaGuardada): Promise<Llegada> {
  const pedido = pedidoDe(texto, idioma);
  if (pedido) {
    await cumplirPedido(deps, narradorId, pedido, guardada);
    return 'pedido';
  }
  if (esSaludo(texto, idioma)) {
    await ponerClave(deps.db, guardada.id, SIN_CLAVE_HISTORIA);
    return 'mensaje';
  }
  const guardadaAt = deps.ahora().toISOString();
  const r = await conReintento(deps.db, narradorId, (f): Paso<string | null> => {
    if (yaVisto(f.estado, guardada.waMessageId)) return null;
    const a = recibirAudio(f.estado, texto);
    const pideAudio = a.abierta && !f.estado.m22Enviado && f.estado.esperando !== CLAVE_TEMA;
    const estado = pideAudio ? { ...encolar(a.estado, { texto: textoDelBanco('M22', fichaTexto(f)), tipo: 'suelto' }), m22Enviado: true } : a.estado;
    return { cambio: { estado: anotarVisto(estado, guardada.waMessageId), ...(a.abierta ? { ultimo_audio_at: guardadaAt } : {}) }, resultado: a.clave };
  });
  await anotarClave(deps, guardada.id, r);
  return 'mensaje';
}

/**
 * Imagen: con FOTO-H abierta, la foto la contesta (`⟦foto⟧`) y corre el reloj de silencio, para sumar el audio que
 * la describe. Si no, foto suelta: se guarda siempre (spec §4.3) y se acusa si hay texto aprobado en su idioma.
 */
async function recibirImagen(deps: DepsHistoria, n: NarradorHistoria, m: MensajeEntrante, fila: FilaHistoria): Promise<void> {
  if (!m.mediaId) return;
  const llegada = await numeroDeLlegada(deps.db, n.id);
  if (marcarFoto(fila.estado)) {
    const guardada = await guardarTexto(deps.db, n.id, llegada, MARCA_FOTO, { waMessageId: m.waMessageId, clave: null, esBoton: false });
    if (!guardada) return;
    if (!(await guardarFotoOAvisar(deps, n, m.mediaId, m.mimeType, m.texto, llegada, m.waMessageId, 'FOTO-H'))) {
      await ponerClave(deps.db, guardada.id, SIN_CLAVE_HISTORIA);
      return;
    }
    await aplicarFoto(deps, n.id, { id: guardada.id, waMessageId: m.waMessageId });
    return;
  }
  const nueva = await conReintento(deps.db, n.id, (f) =>
    yaVisto(f.estado, m.waMessageId) ? null : { cambio: { estado: anotarVisto(f.estado, m.waMessageId) }, resultado: true });
  if (!nueva) return;
  if (!(await guardarFotoOAvisar(deps, n, m.mediaId, m.mimeType, m.texto, llegada, m.waMessageId, 'suelta'))) return;
  const acuse = textoFijo('fotoSuelta', fila.idioma);
  if (acuse) await conReintento(deps.db, n.id, (f) => ({ cambio: { estado: encolar(f.estado, { texto: acuse, tipo: 'suelto' }) }, resultado: true }));
}

/** Baja la foto de Meta y la guarda; si falla, `fotoFallo` al narrador (una vez) y aviso a los socios. Nunca tira. */
async function guardarFotoOAvisar(
  deps: DepsHistoria, n: NarradorHistoria, mediaId: string, mimeType: string | undefined, caption: string | undefined, llegada: number,
  waMessageId: string, cual: 'FOTO-H' | 'suelta',
): Promise<boolean> {
  try {
    await guardarFoto(deps, n.id, mediaId, mimeType, caption, llegada);
    return true;
  } catch (err) {
    const detalle = err instanceof Error ? err.message : String(err);
    console.error(`historia: no pude guardar la foto (${cual}) de ${n.id}: ${detalle}`);
    try {
      await conReintento(deps.db, n.id, (f) => {
        const t = textoFijo('fotoFallo', f.idioma, fichaTexto(f));
        return t ? { cambio: { estado: encolar(f.estado, { texto: t, tipo: 'suelto' }) }, resultado: true } : null;
      });
    } catch (errCola) {
      console.error(`historia: no pude encolar el pedido de la foto de ${n.id}:`, errCola instanceof Error ? errCola.message : errCola);
    }
    await deps.avisar(
      `foto-fallo-${waMessageId}`,
      'No se pudo guardar una foto de un narrador de historia',
      `${n.id} mandó una foto (${cual === 'FOTO-H' ? 'la de FOTO-H, que sigue abierta' : 'suelta'}) y no se pudo bajar de Meta o subir a Storage: ${detalle}. Se le pidió que la vuelva a mandar.`,
    );
    return false;
  }
}

async function aplicarFoto(deps: DepsHistoria, narradorId: string, guardada: FilaGuardada): Promise<void> {
  const guardadaAt = deps.ahora().toISOString();
  const r = await conReintento(deps.db, narradorId, (f): Paso<string | null> => {
    if (yaVisto(f.estado, guardada.waMessageId)) return null;
    const conFoto = marcarFoto(f.estado);
    if (!conFoto) return { cambio: { estado: anotarVisto(f.estado, guardada.waMessageId) }, resultado: null };
    return { cambio: { estado: anotarVisto(conFoto.estado, guardada.waMessageId), ultimo_audio_at: guardadaAt }, resultado: conFoto.clave };
  });
  await anotarClave(deps, guardada.id, r);
}

// ---------------------------------------------------------------- reconciliación

type FilaSinClave = { id: string; wa_message_id: string; audio_path: string | null; transcripcion: string | null; texto_directo: string | null };

/**
 * Las filas de `respuestas` de este narrador que llegaron después de crear su historia, hace más de RECONCILIAR_MS,
 * y siguen sin clave: el proceso que las guardó se cayó antes de sumarlas al estado. Se pasan por el mismo camino que
 * un mensaje nuevo. Devuelve cuántas tomó.
 */
export async function reconciliar(deps: DepsHistoria, fila: FilaHistoria, n: NarradorHistoria): Promise<number> {
  const limite = new Date(deps.ahora().getTime() - RECONCILIAR_MS).toISOString();
  const desde = new Date(fila.creada_at).toISOString();
  const { data, error } = await deps.db.from('respuestas')
    .select('id,wa_message_id,audio_path,transcripcion,texto_directo')
    .eq('narrador_id', n.id).is('clave_historia', null).not('wa_message_id', 'is', null)
    .gt('recibido_at', desde).lt('recibido_at', limite)
    .order('recibido_at', { ascending: true });
  if (error) throw new Error(`reloj historia: no pude buscar respuestas sin clave de ${n.id}: ${error.message}`);
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
      else await ponerClave(deps.db, r.id, SIN_CLAVE_HISTORIA);
    }
  }
  return filas.length;
}
