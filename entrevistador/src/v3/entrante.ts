// Lo que llega de un narrador V3 (spec 2026-10-07, "Al llegar un mensaje de un
// narrador V3"). Se entra desde procesar.ts, antes de las fotos de la familia,
// de manejarTexto (que llama a un modelo) y de la evaluación con Opus: la V3
// no usa modelos durante la entrevista (salvo el cazador, en segundo plano).
// Ningún texto se arma acá: salen del banco (turno.ts) o de textos-fijos.json.

import { ritmoDe } from '../flujo/ritmo.js';
import { fechaLocal } from '../flujo/tiempo.js';
import type { MensajeEntrante } from '../whatsapp/webhook.js';
import { lanzarCazador } from './cazador.js';
import type { DepsV3, Transcripcion } from './deps.js';
import { drenar } from './enviar.js';
import { conReintento, leerFila } from './estado.js';
import { anotarTranscripcion, guardarAudioV3, guardarFotoV3, guardarTextoV3, marcarRespondido, numeroDeLlegada, ponerClave, yaLlego } from './filas.js';
import { respuestaDeBoton } from './nucleo/entrevista/respuesta.js';
import { aplicarTanda, hitosDe, puedeAbrirHoy } from './tanda.js';
import { textoFijo } from './textos-fijos.js';
import { fichaTexto, MARCA_FOTO, type FilaV3, type NarradorV3 } from './tipos.js';
import { cerrarYSeguir, encolar, marcarFoto, recibirAudio, reenviarAbierta, textoDelBanco, tocarBoton } from './turno.js';

export async function procesarEntranteV3(deps: DepsV3, n: NarradorV3, m: MensajeEntrante): Promise<void> {
  if (n.estado !== 'activo' && n.estado !== 'pausado') {
    console.warn(`V3: entrante de ${n.id} en estado '${n.estado}': se ignora`);
    return;
  }
  if (await yaLlego(deps.db, m.waMessageId)) return; // el reintento de Meta
  const ahora = deps.ahora();
  // Cualquier mensaje del narrador abre la ventana de 24 h de Meta: sin esto,
  // drenar mandaría todo como plantilla.
  const fila = await anotarEntrante(deps, n.id, ahora);
  if (!fila) {
    console.warn(`V3: ${n.id} no tiene fila en entrevistas_v3: se ignora el mensaje`);
    return;
  }
  await marcarRespondido(deps.db, n.id, ahora);
  if (n.estado === 'pausado') {
    await deps.db.from('narradores').update({ estado: 'activo' }).eq('id', n.id).eq('estado', 'pausado');
    if (m.tipo === 'texto' && !m.esBoton) {
      // Vuelve escribiendo: se le reenvía la pregunta abierta (sin M22).
      await conReintento(deps.db, n.id, (f) => ({ cambio: { estado: reenviarAbierta(f.estado) }, resultado: true }));
      await drenar(deps, n.id);
      return;
    }
  }
  if (m.tipo === 'imagen') await recibirImagen(deps, n, m, fila);
  else if (m.tipo === 'audio') await recibirAudioV3(deps, n, m, fila);
  else if (!(m.esBoton && (await recibirBoton(deps, n, m, fila, ahora)))) await recibirTexto(deps, n, m, fila);
  // Lo que haya quedado en la cola (también lo que esperaba la ventana) sale ahora.
  await drenar(deps, n.id);
}

/** ultimoEntranteAt = ahora (nunca para atrás). Devuelve la fila, o null si no tiene. */
async function anotarEntrante(deps: DepsV3, narradorId: string, ahora: Date): Promise<FilaV3 | null> {
  const r = await conReintento(deps.db, narradorId, (f) => {
    const antes = f.estado.ultimoEntranteAt ? Date.parse(f.estado.ultimoEntranteAt) : Number.NEGATIVE_INFINITY;
    const ultimoEntranteAt = antes > ahora.getTime() ? f.estado.ultimoEntranteAt : ahora.toISOString();
    return { cambio: { estado: { ...f.estado, ultimoEntranteAt } }, resultado: true };
  });
  return r?.fila ?? null;
}

/**
 * Audio: fila en `respuestas` → transcripción en su idioma (un reintento) → si
 * falla o sale vacía, M23; si no, se suma a la abierta y corre el reloj de
 * silencio desde que se guardó la transcripción. No se contesta nada.
 */
async function recibirAudioV3(deps: DepsV3, n: NarradorV3, m: MensajeEntrante, fila: FilaV3): Promise<void> {
  if (!m.mediaId) return;
  const audio = await deps.wa.descargar(m.mediaId);
  const guardada = await guardarAudioV3(deps.db, n.id, await numeroDeLlegada(deps.db, n.id), audio, m.waMessageId);
  if (!guardada) return; // duplicado
  let t: Transcripcion | null = null;
  for (let intento = 0; intento < 2 && !t; intento++) {
    try {
      t = await deps.transcribir(audio, { nombre: fila.ficha.nombre, idioma: fila.idioma, narradorId: n.id });
    } catch (err) {
      console.error(`V3: falló la transcripción de ${n.id} (intento ${intento + 1}):`, err instanceof Error ? err.message : err);
    }
  }
  if (!t || !t.texto.trim()) {
    // Audio cortado, vacío o que no se pudo transcribir: M23 (se le pide de nuevo).
    await conReintento(deps.db, n.id, (f) => ({
      cambio: { estado: encolar(f.estado, { texto: textoDelBanco('M23', fichaTexto(f)), tipo: 'suelto' }) },
      resultado: true,
    }));
    return;
  }
  await anotarTranscripcion(deps.db, guardada.id, t);
  const texto = t.texto;
  const guardadaAt = deps.ahora().toISOString();
  const r = await conReintento(deps.db, n.id, (f) => {
    const a = recibirAudio(f.estado, texto);
    return { cambio: { estado: a.estado, ...(a.abierta ? { ultimo_audio_at: guardadaAt } : {}) }, resultado: a.clave };
  });
  await ponerClave(deps.db, guardada.id, r?.resultado ?? null);
}

/**
 * Botón de la abierta: "Sí" → M30 y espera el audio; "No"/"Paso" → cierra y
 * sigue en el momento, respetando el tope de la tanda; si cerró un CIn, el
 * cazador. Devuelve false si no es un botón de la abierta (se trata como texto).
 */
async function recibirBoton(deps: DepsV3, n: NarradorV3, m: MensajeEntrante, fila: FilaV3, ahora: Date): Promise<boolean> {
  const boton = m.texto ?? '';
  if (!tocarBoton(fila.estado, fichaTexto(fila), boton)) return false;
  const guardada = await guardarTextoV3(deps.db, n.id, await numeroDeLlegada(deps.db, n.id), respuestaDeBoton(boton), { waMessageId: m.waMessageId, clave: fila.estado.esperando ?? null, esBoton: true });
  if (!guardada) return true; // duplicado
  const hoy = fechaLocal(ahora, n.zona_horaria);
  const ritmo = ritmoDe(n.contexto);
  const r = await conReintento(deps.db, n.id, (f) => {
    const ficha = fichaTexto(f);
    const t = tocarBoton(f.estado, ficha, boton);
    if (!t) return null;
    if (!t.cerrar) return { cambio: { estado: t.estado }, resultado: { bloqueCerrado: undefined as number | undefined, cerro: false } };
    const s = cerrarYSeguir(t.estado, ficha, puedeAbrirHoy(f, ritmo, hoy));
    const tanda = aplicarTanda(f, s.estado, hoy, s.abrio, ahora);
    return {
      cambio: { estado: tanda.estado, ultimo_audio_at: null, tanda_dia: tanda.tanda_dia, tanda_cuenta: tanda.tanda_cuenta },
      resultado: { bloqueCerrado: s.bloqueCerrado, cerro: true },
    };
  });
  await drenar(deps, n.id); // la siguiente pregunta sale antes que los mails de hito
  if (r?.resultado.bloqueCerrado !== undefined) lanzarCazador(deps, n.id, r.resultado.bloqueCerrado);
  if (r?.resultado.cerro) for (const hito of hitosDe(r.fila.estado)) await deps.hito(n.id, hito);
  return true;
}

/**
 * Texto escrito (Naza, 07/10): cuenta como respuesta. Se suma a la abierta
 * igual que un audio y corre el mismo reloj de 3 minutos. M22 sale solo la
 * primera vez en toda la entrevista.
 */
async function recibirTexto(deps: DepsV3, n: NarradorV3, m: MensajeEntrante, fila: FilaV3): Promise<void> {
  const texto = (m.texto ?? '').trim();
  if (!texto) return;
  const guardada = await guardarTextoV3(deps.db, n.id, await numeroDeLlegada(deps.db, n.id), texto, { waMessageId: m.waMessageId, clave: fila.estado.esperando ?? null, esBoton: false });
  if (!guardada) return; // duplicado
  const guardadaAt = deps.ahora().toISOString();
  const r = await conReintento(deps.db, n.id, (f) => {
    const a = recibirAudio(f.estado, texto);
    const estado = f.estado.m22Enviado
      ? a.estado
      : { ...encolar(a.estado, { texto: textoDelBanco('M22', fichaTexto(f)), tipo: 'suelto' }), m22Enviado: true };
    return { cambio: { estado, ...(a.abierta ? { ultimo_audio_at: guardadaAt } : {}) }, resultado: a.clave };
  });
  await ponerClave(deps.db, guardada.id, r?.resultado ?? null);
}

/**
 * Imagen: con FO1 abierta, la foto la contesta (`⟦foto⟧`) y corre el reloj de
 * silencio, para sumar el audio que la describe. Si no, foto suelta: se guarda
 * y se acusa solo si hay texto aprobado en su idioma.
 */
async function recibirImagen(deps: DepsV3, n: NarradorV3, m: MensajeEntrante, fila: FilaV3): Promise<void> {
  if (!m.mediaId) return;
  const llegada = await numeroDeLlegada(deps.db, n.id);
  await guardarFotoV3(deps, n.id, m.mediaId, m.mimeType, m.texto, llegada);
  if (marcarFoto(fila.estado, fichaTexto(fila))) {
    const guardada = await guardarTextoV3(deps.db, n.id, llegada, MARCA_FOTO, { waMessageId: m.waMessageId, clave: fila.estado.esperando ?? null, esBoton: false });
    if (!guardada) return;
    const guardadaAt = deps.ahora().toISOString();
    await conReintento(deps.db, n.id, (f) => {
      const r = marcarFoto(f.estado, fichaTexto(f));
      return r ? { cambio: { estado: r.estado, ultimo_audio_at: guardadaAt }, resultado: true } : null;
    });
    return;
  }
  const acuse = textoFijo('fotoSuelta', fila.idioma);
  if (acuse) await conReintento(deps.db, n.id, (f) => ({ cambio: { estado: encolar(f.estado, { texto: acuse, tipo: 'suelto' }) }, resultado: true }));
}
