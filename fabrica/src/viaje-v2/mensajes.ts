// Arma cada mensaje de WhatsApp de la entrevista de viaje como texto final,
// con los textos del banco (docs/viajes-v2/banco.md). Puro: la rotación de
// acuses y atrasos, y el tope de TXT, viajan en `Rotacion` y se devuelven
// actualizados.
//
// Varias partes en un mismo mensaje van separadas por una línea en blanco.
//
// Reglas de empalme (banco.md: "Decisiones del compilado" y "Revisión de Fable"):
//   · ACA como primera línea de la siguiente de antes de salir. La rotación de
//     ACA arranca por ACA2; ACA1 (con {{nombre}}) nunca arriba de AS2 ni de VA1 (A6).
//   · ACN solo, después de la noche (común, de antes en el viaje, propia, FN1).
//   · ACM solo, después del mediodía, de una foto suelta, de ID1 y de VU1.
//     Después de UC1 y de VU0, solo ACM1 o ACM2: ese día no hay noche (A1).
//   · CA1 → AL1 solo: AL1 trae su "Gracias" adentro. "Paso" en CA1 → AL1-P (A3).
//   · ATR solo arriba de la noche común (A2): ATR1-3 rotan; ATR-V con 2 o más seguidas.
//   · "Paso": PAS-A + la siguiente sin acuse (A4); en VA1, PAS-A2 solo; en el viaje, PAS-V.
//   · Texto en vez de audio: TXT en lugar del acuse, como mucho MAX_TXT veces;
//     si escribió, nunca ACA2 ni ACN3 ("Lo escuché") (A5).
//   · Audio que llegó mal (la señal viene de afuera): COR solo; la pregunta sigue abierta.

import { porId } from './banco.js';
import type { IdAntes, Programado, TipoProgramado } from './calendario.js';
import { datosDeCompra, renderizar } from './texto.js';
import type { Compra, Mensaje } from './tipos.js';

export const MAX_TXT = 2;

export type Grupo = 'ACN' | 'ACM' | 'ACA' | 'ATR';

const GRUPOS: Record<Grupo, readonly string[]> = {
  ACN: ['ACN1', 'ACN2', 'ACN3', 'ACN4'],
  ACM: ['ACM1', 'ACM2', 'ACM3', 'ACM4'],
  ACA: ['ACA1', 'ACA2', 'ACA3', 'ACA4'],
  ATR: ['ATR1', 'ATR2', 'ATR3'],
};

/** Por dónde arranca cada rueda (A6: ACA arranca por ACA2). */
const INICIO: Record<Grupo, string> = { ACN: 'ACN1', ACM: 'ACM1', ACA: 'ACA2', ATR: 'ATR1' };

/** El último que salió de cada grupo, y cuántos TXT van. */
export type Rotacion = { ACN?: string; ACM?: string; ACA?: string; ATR?: string; txtUsados: number };

export const ROTACION_INICIAL: Rotacion = { txtUsados: 0 };

/** Después de UC1 y VU0: los que no dicen "Hasta la noche". */
const ACM_SIN_NOCHE = ['ACM1', 'ACM2'];

/**
 * El siguiente del grupo en la rueda, entre los permitidos, que no sea el
 * último que salió. Si no queda ninguno distinto, el primero permitido.
 */
export function elegirRotando(grupo: Grupo, rot: Rotacion, permitidos?: readonly string[]): { id: string; rot: Rotacion } {
  const rueda = GRUPOS[grupo];
  const ok = (id: string) => !permitidos || permitidos.includes(id);
  const ultimo = rot[grupo];
  const desde = ultimo ? rueda.indexOf(ultimo) : rueda.indexOf(INICIO[grupo]) - 1;
  let id: string | undefined;
  for (let k = 1; k <= rueda.length; k++) {
    const c = rueda[(desde + k + rueda.length) % rueda.length];
    if (ok(c) && c !== ultimo) {
      id = c;
      break;
    }
  }
  id ??= rueda.find(ok);
  if (!id) throw new Error(`No hay ${grupo} permitido entre ${permitidos?.join(', ')}`);
  return { id, rot: { ...rot, [grupo]: id } };
}

function texto(id: string, compra: Compra, pregunta?: string): string {
  return renderizar(porId(id).texto, { ...datosDeCompra(compra), pregunta });
}

function textoYaDeViaje(id: string, compra: Compra): string {
  const f = porId(id);
  if (!f.yaDeViaje) throw new Error(`${id} no tiene variante "ya de viaje"`);
  return renderizar(f.yaDeViaje, datosDeCompra(compra));
}

/** Junta partes (id + texto) en un solo mensaje. */
function juntar(partes: { id: string; texto: string }[]): Mensaje {
  return { ids: partes.map((p) => p.id), texto: partes.map((p) => p.texto).join('\n\n') };
}

const parte = (id: string, compra: Compra) => ({ id, texto: texto(id, compra) });

// ── Arranque ─────────────────────────────────────────────────────────────────

/** BIEN-1R si es un regalo; BIEN-1 si es para sí. Plantilla de Meta: pide el SÍ. */
export function arranque(compra: Compra): Mensaje {
  return juntar([parte(compra.regalo ? 'BIEN-1R' : 'BIEN-1', compra)]);
}

/** Con el SÍ: BIEN-2 y enseguida AS1 (dos mensajes). */
export function alDecirSi(compra: Compra): Mensaje[] {
  return [juntar([parte('BIEN-2', compra)]), juntar([parte('AS1', compra)])];
}

/** Una de la cadena sola (para reenviarla, o para lo que haga falta). */
export function preguntaDeLaCadena(id: IdAntes, compra: Compra): Mensaje {
  return juntar([parte(id, compra)]);
}

/** REC1: el recordatorio de antes de salir. */
export function recordatorioAntes(compra: Compra): Mensaje {
  return juntar([parte('REC1', compra)]);
}

// ── Lo programado ────────────────────────────────────────────────────────────

/**
 * El mensaje de algo del calendario. `nochesSinContestar` son las noches del
 * viaje seguidas sin contestar justo antes de esta (lo cuenta estado.ts): con
 * 1, ATR1-3 rotando; con 2 o más, ATR-V. Solo arriba de la noche común (A2).
 */
export function preguntaProgramada(p: Programado, compra: Compra, nochesSinContestar: number, rot: Rotacion): { mensaje: Mensaje; rot: Rotacion } {
  const partes: { id: string; texto: string }[] = [];
  let r = rot;
  if (p.tipo === 'noche' && nochesSinContestar >= 1) {
    if (nochesSinContestar >= 2) partes.push(parte('ATR-V', compra));
    else {
      const e = elegirRotando('ATR', r);
      r = e.rot;
      partes.push(parte(e.id, compra));
    }
  }
  if (p.tipo === 'noche') {
    // Comienzo + " " + puerta + cierre (el cierre ya empieza con ", y").
    const [c, no, f] = p.ids;
    const m = juntar([...partes, { id: c, texto: `${texto(c, compra)} ${texto(no, compra)}${texto(f, compra)}` }]);
    return { mensaje: { ids: [...m.ids, no, f], texto: m.texto }, rot: r };
  }
  if (p.tipo === 'antes-en-viaje') partes.push({ id: p.ids[0], texto: textoYaDeViaje(p.ids[0], compra) });
  else if (p.tipo === 'propia') partes.push({ id: p.ids[0], texto: texto(p.ids[0], compra, p.pregunta) });
  else partes.push(parte(p.ids[0], compra));
  return { mensaje: juntar(partes), rot: r };
}

// ── Reacciones a lo que contesta ─────────────────────────────────────────────

export type QueSeContesta =
  | { tipo: 'cadena'; siguiente: IdAntes | null } // antes de salir; `siguiente` null si ya no hay (VA1) o la cadena se calló
  | { tipo: TipoProgramado | 'foto-suelta' };

export type Respuesta = { tipo: 'audio' | 'texto' | 'foto' | 'paso'; audioMal?: boolean };

export type Reaccion = {
  mensajes: Mensaje[];
  rot: Rotacion;
  /** false si el audio llegó mal (COR): la pregunta sigue abierta. */
  contestada: boolean;
  /** true después de CA1: acaba de salir AL1 (o AL1-P) y arranca el álbum. */
  abreAlbum: boolean;
};

/** Donde un texto dispara TXT: las que piden contar. El mediodía y VU0 son foto o frase. */
const NARRATIVAS: ReadonlySet<string> = new Set(['cadena', 'UC1', 'ID1', 'noche', 'antes-en-viaje', 'propia', 'FN1', 'VU1', 'CA1']);
const DE_NOCHE: ReadonlySet<string> = new Set(['noche', 'antes-en-viaje', 'propia', 'FN1']);

export function reaccion(de: QueSeContesta, respuesta: Respuesta, compra: Compra, rot: Rotacion): Reaccion {
  const listo = (mensajes: Mensaje[], r: Rotacion, abreAlbum = false): Reaccion => ({ mensajes, rot: r, contestada: true, abreAlbum });

  if (respuesta.audioMal) return { mensajes: [juntar([parte('COR', compra)])], rot, contestada: false, abreAlbum: false };

  const escribio = respuesta.tipo === 'texto';
  const usaTxt = escribio && NARRATIVAS.has(de.tipo) && rot.txtUsados < MAX_TXT;
  const conTxt: Rotacion = usaTxt ? { ...rot, txtUsados: rot.txtUsados + 1 } : rot;
  const sinLoEscuche = (ids: readonly string[], fuera: string) => (escribio ? ids.filter((id) => id !== fuera) : ids);

  if (de.tipo === 'cadena') {
    const sig = de.siguiente;
    if (respuesta.tipo === 'paso') return listo([juntar(sig ? [parte('PAS-A', compra), parte(sig, compra)] : [parte('PAS-A2', compra)])], rot);
    if (usaTxt) return listo([juntar(sig ? [parte('TXT', compra), parte(sig, compra)] : [parte('TXT', compra)])], conTxt);
    if (!sig) {
      const e = elegirRotando('ACM', rot, ACM_SIN_NOCHE);
      return listo([juntar([parte(e.id, compra)])], e.rot);
    }
    let permitidos = sinLoEscuche(GRUPOS.ACA, 'ACA2');
    if (sig === 'AS2' || sig === 'VA1') permitidos = permitidos.filter((id) => id !== 'ACA1');
    const e = elegirRotando('ACA', rot, permitidos);
    return listo([juntar([parte(e.id, compra), parte(sig, compra)])], e.rot);
  }

  if (de.tipo === 'CA1') {
    if (respuesta.tipo === 'paso') return listo([juntar([parte('AL1-P', compra)])], rot, true);
    if (usaTxt) return listo([juntar([parte('TXT', compra), parte('AL1-P', compra)])], conTxt, true);
    return listo([juntar([parte('AL1', compra)])], rot, true);
  }

  if (respuesta.tipo === 'paso') return listo([juntar([parte('PAS-V', compra)])], rot);
  if (usaTxt) return listo([juntar([parte('TXT', compra)])], conTxt);

  const e = DE_NOCHE.has(de.tipo)
    ? elegirRotando('ACN', rot, sinLoEscuche(GRUPOS.ACN, 'ACN3'))
    : elegirRotando('ACM', rot, de.tipo === 'UC1' || de.tipo === 'VU0' ? ACM_SIN_NOCHE : undefined);
  return listo([juntar([parte(e.id, compra)])], e.rot);
}

// ── Despedida ────────────────────────────────────────────────────────────────

const ANTES_DE_DES_MAS = 'Fue lindo acompañarte';

/** DES; con DES+ adentro, antes de "Fue lindo acompañarte", si mandó más fotos de las que entran. */
export function despedida(compra: Compra, fotosMandadas: number): Mensaje {
  const des = texto('DES', compra);
  if (fotosMandadas <= compra.fotosAlbum) return { ids: ['DES'], texto: des };
  if (!des.includes(ANTES_DE_DES_MAS)) throw new Error(`DES ya no dice "${ANTES_DE_DES_MAS}": no sé dónde meter DES+`);
  return { ids: ['DES', 'DES+'], texto: des.replace(ANTES_DE_DES_MAS, `${texto('DES+', compra)} ${ANTES_DE_DES_MAS}`) };
}
