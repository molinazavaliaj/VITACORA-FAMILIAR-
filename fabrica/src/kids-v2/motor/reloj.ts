// El tiempo: los 90 s de silencio, la espera del audio de la foto, "la hora"
// (mínimo una principal por día), los recordatorios al padre (4 y 8 días),
// el cierre solo a los 2 días y TERMINO-PADRE en canal B. Nada de noche.

import { aInstante, aLocal, diasEntre, esDeNoche, finDeLaNoche, sumarDias } from '../horas.js';
import { ACTIVO_MS, CIERRE_SOLO_DIAS, ESPERA_AUDIO_FOTO_MS, RECORDATORIO_DIAS, SILENCIO_MS } from '../reglas.js';
import { emitir, empezarItem, guardarFotoVencida, hoy, marcar, mensajeFinal, terminarItem, terminoPadre, type Ctx } from './flujo.js';
import { fijoA, variables } from './mensajes.js';
import { procesarRafaga } from './rafaga.js';
import type { Estado } from './tipos.js';

const ms = (iso: string) => new Date(iso).getTime();

/** Esperando algo que solo puede mandar el chico: a la hora no sale nada nuevo (no se acumulan). */
export function bloqueante(e: Estado): boolean {
  const f = e.fase;
  if (f.tipo === 'bienvenida' || f.tipo === 'aviso-seria' || f.tipo === 'retenido') return true;
  if (f.tipo === 'pregunta') {
    const item = e.guion[e.cursor];
    return !e.extra && (item.tipo === 'principal' || item.tipo === 'padre');
  }
  return false;
}

export function alReloj(c: Ctx): void {
  const e = c.e;
  if (esDeNoche(c.ahora, e.ficha.zona)) return;
  if (e.rafaga && c.ahora.getTime() - ms(e.rafaga.ultima) >= SILENCIO_MS) procesarRafaga(c);
  if (e.fase.tipo === 'foto-audio' && c.ahora.getTime() - ms(e.fase.desde) >= ESPERA_AUDIO_FOTO_MS) terminarItem(c);
  if (e.rafaga) return; // está contando: la hora espera
  const fecha = hoy(c);
  if (e.horaHecha === fecha || c.ahora < aInstante(fecha, e.ficha.hora, e.ficha.zona)) return;
  if (e.ultimaEntrada && c.ahora.getTime() - ms(e.ultimaEntrada) < ACTIVO_MS) return; // está en medio de algo: la hora espera
  e.horaHecha = fecha;
  alaHora(c);
}

function recordatorio(c: Ctx): void {
  const e = c.e;
  const desde = e.ultimaEntrada ?? e.inicio;
  if (!desde) return;
  const dias = diasEntre(aLocal(new Date(desde), e.ficha.zona).fecha, hoy(c));
  const B = e.ficha.canal === 'B';
  const vars = variables.padre(e.ficha);
  if (e.recordatorios === 0 && dias >= RECORDATORIO_DIAS[0]) {
    emitir(c, fijoA(e, B ? 'RECORD-B' : 'RECORD-A-4', { variables: vars, paraPadre: true }));
    e.recordatorios = 1;
    e.reenviar = B;
  } else if (e.recordatorios === 1 && dias >= RECORDATORIO_DIAS[1]) {
    emitir(c, fijoA(e, B ? 'RECORD-B-8' : 'RECORD-A-8', { variables: vars, paraPadre: true }));
    e.reenviar = B;
    marcar(c, 'silencio-8-dias', `${dias} días sin respuesta en ${e.guion[e.cursor]?.clave ?? 'la bienvenida'}`);
    e.recordatorios = 2;
  }
}

/**
 * El cierre solo a los 2 días cuando la oferta de extras quedó detrás de un
 * PREG-NUEVA que el chico nunca tocó. Al chico no le sale nada (sería una
 * segunda plantilla sin respuesta): FINAL-CHICO queda retenido en lugar de la
 * oferta y le llega cuando toque el botón o escriba. Al padre, TERMINO-PADRE
 * (canal B: al día siguiente, a la hora); a Naza, una marca. El cursor pasa al
 * final, así que no vuelve a correr ni se retoman las extras.
 */
function cerrarConFinalRetenido(c: Ctx): void {
  const e = c.e;
  const i = e.guion.findIndex((x) => x.tipo === 'final');
  if (i < 0) throw new Error('El guion no tiene final');
  e.cursor = i;
  e.extra = null;
  e.fase = { tipo: 'retenido', mensajes: [mensajeFinal(e).final], luego: { tipo: 'terminado' } };
  if (e.ficha.canal === 'A') emitir(c, terminoPadre(e));
  else e.terminoPadre = sumarDias(hoy(c), 1);
  marcar(c, 'cerro-sin-respuesta', 'cerró solo a los 2 días con un PREG-NUEVA sin tocar en las extras; el final le llega cuando conteste');
}

function alaHora(c: Ctx): void {
  const e = c.e;
  const fecha = hoy(c);
  if (e.sobrioHasta && c.ahora >= new Date(e.sobrioHasta)) e.sobrioHasta = null;
  if (e.terminoPadre && e.terminoPadre <= fecha) {
    emitir(c, fijoA(e, 'TERMINO-PADRE', { variables: variables.padre(e.ficha), paraPadre: true }));
    e.terminoPadre = null;
  }
  if (e.fase.tipo === 'terminado' || e.fase.tipo === 'sin-empezar') return;
  const item = e.guion[e.cursor];
  if (item?.tipo === 'final') return;
  if (item?.tipo === 'extras') {
    const desde = Math.max(...[e.extrasDesde, e.ultimaEntrada].filter((x): x is string => x !== null).map(ms));
    if (diasEntre(aLocal(new Date(desde), e.ficha.zona).fecha, fecha) < CIERRE_SOLO_DIAS) return;
    if (e.fase.tipo === 'retenido') return cerrarConFinalRetenido(c);
    empezarItem(c, e.cursor + 1, true);
    return;
  }
  if (bloqueante(e)) return recordatorio(c);
  if (e.sobrioHasta || e.diaHecho === fecha) return;
  guardarFotoVencida(e);
  empezarItem(c, e.fase.tipo === 'libre' ? e.fase.siguiente : e.cursor + 1, true);
}

/** Cuándo hay que volver a llamar con `reloj` (null: nada pendiente). Nunca de noche. */
export function proximoDespertar(e: Estado, ahora: Date): Date | null {
  const z = e.ficha.zona;
  const c: Date[] = [];
  if (e.nocturnos.length) c.push(ahora);
  if (e.rafaga) c.push(new Date(ms(e.rafaga.ultima) + SILENCIO_MS));
  if (e.fase.tipo === 'foto-audio') c.push(new Date(ms(e.fase.desde) + ESPERA_AUDIO_FOTO_MS));
  const sigueLaHora = !(e.fase.tipo === 'terminado' && !e.terminoPadre) && e.fase.tipo !== 'sin-empezar';
  if (sigueLaHora && !e.rafaga) {
    const fecha = aLocal(ahora, z).fecha;
    const hoyHora = aInstante(fecha, e.ficha.hora, z);
    const hora = e.horaHecha !== fecha ? hoyHora : aInstante(sumarDias(fecha, 1), e.ficha.hora, z);
    const activo = e.ultimaEntrada ? ms(e.ultimaEntrada) + ACTIVO_MS : 0;
    c.push(new Date(Math.max(hora.getTime(), activo, ahora.getTime())));
  }
  if (!c.length) return null;
  const t = new Date(Math.min(...c.map((x) => finDeLaNoche(x, z).getTime())));
  return t < ahora ? ahora : t;
}
