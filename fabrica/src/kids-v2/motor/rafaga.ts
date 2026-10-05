// Lo que cuenta el chico: se junta en una ráfaga y se contesta una sola vez,
// cuando pasan 90 s sin nada nuevo (#19). Orden después de una respuesta
// (05/10): otra puerta (si fue muy corta) → acuse → foto pegada → seguir.

import { pregunta } from '../banco.js';
import { fraseQueSalta, normalizar } from '../preocupante.js';
import { CORTO_AUDIO_SEG, CORTO_PALABRAS, PALABRAS_NO } from '../reglas.js';
import { acusar, acuseFoto, acuseSobrio, emitir, enCurso, empezarItem, fotoOTerminar, marcar, soltarRetenido, terminarItem, type Ctx } from './flujo.js';
import { fotoEnCurso, hoyNoLaComo, noTengo } from './botones.js';
import { opMsg, ramaMsg } from './mensajes.js';
import { alPreocupante, enDiaSobrio } from './sobrio.js';
import type { Contenido } from './tipos.js';

const palabras = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

export function sumarARafaga(c: Ctx, contenido: Contenido): void {
  const ahora = c.ahora.toISOString();
  const r = c.e.rafaga ?? { desde: ahora, ultima: ahora, seg: 0, palabras: 0, fotos: 0, textos: [] };
  r.ultima = ahora;
  if (contenido.tipo === 'audio') {
    r.seg += contenido.seg;
    if (contenido.transcripcion) r.textos.push(contenido.transcripcion);
  } else if (contenido.tipo === 'texto') {
    r.palabras += palabras(contenido.texto);
    r.textos.push(contenido.texto);
  } else r.fotos += 1;
  c.e.rafaga = r;
}

/** "Muy corto" (#20): sin foto, audio de menos de 15 s y texto de menos de 8 palabras. */
export function esCorta(r: { seg: number; palabras: number; fotos: number }): boolean {
  return r.fotos === 0 && r.seg < CORTO_AUDIO_SEG && r.palabras < CORTO_PALABRAS;
}

/** ¿Lo que escribió (o la transcripción del audio) dice que no? Por palabras enteras (PALABRAS_NO). */
export function diceQueNo(textos: readonly string[]): boolean {
  return textos.some((t) => PALABRAS_NO.some((w) => normalizar(t).includes(` ${w} `)));
}

export function procesarRafaga(c: Ctx): void {
  const e = c.e;
  const r = e.rafaga;
  if (!r) return;
  e.rafaga = null;
  const corta = esCorta(r);
  // Sin segundos de audio nunca va un acuse con "escuché"; si mandó solo fotos, el acuse de foto
  // (salvo en lo sensible, que lleva los del día feo).
  const escrito = r.seg === 0;
  const soloFotos = r.fotos > 0 && r.seg === 0 && r.palabras === 0;
  const acuse = () => (soloFotos && !enCurso(e).sensible ? acuseFoto(c) : acusar(c, escrito));
  const f = e.fase;

  if (f.tipo === 'sin-empezar') return;
  if (f.tipo === 'terminado') return marcar(c, 'escribio-despues-del-final', `${r.seg} s de audio, ${r.palabras} palabras, ${r.fotos} fotos`);

  // Algo preocupante (Naza 05/10): ese día solo el acuse sobrio; gana a todos los otros acuses.
  if (enDiaSobrio(c)) return acuseSobrio(c);
  const frase = r.textos.map(fraseQueSalta).find((x) => x !== null);
  if (frase) return alPreocupante(c, frase, r.fotos > 0);

  switch (f.tipo) {
    // Escribir suelta (decisión 21); si contó algo, antes el acuse.
    case 'bienvenida':
      if (!corta) acuse();
      return empezarItem(c, 0, false);
    case 'retenido':
      if (!corta) acuse();
      return soltarRetenido(c);
    case 'pregunta':
      return respuestaAPregunta(c, corta, acuse);
    case 'op':
      // La otra puerta contestada corta (un "no sé"): sin acuse ("va al libro" nunca después de un no); sigue igual.
      if (!corta) acuse();
      return fotoOTerminar(c);
    case 'foto': {
      // También una foto vencida que vuelve al final (clave K1-FOTO, en e.extra):
      // acusar() la reconoce con fotoVencidaEnCurso() y terminarItem() sigue con las extras.
      if (r.fotos > 0) {
        acuseFoto(c);
        return terminarItem(c);
      }
      // Algo corto sin foto (Naza 05/10): si dice que no ("no tengo", "nada"), vale como el botón negativo
      // de la foto: [No tengo] (su respuesta, y espera el audio) o, en K24, [Hoy no la como] (espera el
      // audio, sin decir nada). Si no dice que no ("ya te la mando", "ahí va"), sin acuse y sigue esperando la foto.
      const foto = fotoEnCurso(c);
      if (corta) {
        if (!diceQueNo(r.textos)) return;
        if (foto?.botones.includes('No tengo')) return noTengo(c, foto);
        if (foto?.botones.includes('Hoy no la como')) return hoyNoLaComo(c);
        return;
      }
      acuse();
      return terminarItem(c);
    }
    case 'foto-audio':
      acuse();
      return terminarItem(c);
    case 'cierre':
      // Un "no" contado en vez de tocado: como [No, eso fue todo], sin acuse ("va al libro" nunca después de un no).
      if (!corta) acuse();
      return terminarItem(c);
    case 'cierre-cuenta':
      acuse();
      return terminarItem(c);
    default:
      // Esperando un botón (seguir, una más, tranquila, aviso, extras) o nada: si contó algo, acuse y se queda donde está.
      if (!corta) acuse();
  }
}

function respuestaAPregunta(c: Ctx, corta: boolean, acuse: () => void): void {
  const e = c.e;
  const f = e.fase;
  if (f.tipo !== 'pregunta') return;
  const item = e.guion[e.cursor];
  if (!e.extra && item.tipo === 'principal') {
    const p = pregunta(item.clave);
    if (f.rama !== null) {
      const ri = p.ramas.findIndex((x) => x.boton === f.rama);
      if (ri < 0) throw new Error(`${p.id}: no hay rama "${f.rama}"`);
      const accion = p.ramas[ri].accion;
      if (accion.tipo === 'preguntar' && f.pasoRama < accion.pasos.length - 1) {
        emitir(c, ramaMsg(e, p, ri, f.pasoRama + 1));
        e.fase = { ...f, pasoRama: f.pasoRama + 1 };
        return;
      }
    }
    e.conto = true;
    const op = p.op;
    if (corta && op && !p.sensible && !e.opsUsadas.includes(p.id) && (op.soloRama === null || op.soloRama === f.rama)) {
      e.opsUsadas.push(p.id);
      emitir(c, opMsg(e, p));
      e.fase = { tipo: 'op', clave: p.id };
      return;
    }
    if (p.id === 'K36') e.peleaK36 = true;
  } else e.conto = true;
  acuse();
  fotoOTerminar(c);
}
