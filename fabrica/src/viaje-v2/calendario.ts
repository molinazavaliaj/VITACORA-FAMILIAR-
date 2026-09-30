// El calendario de la entrevista de viaje: qué pregunta sale cada día y a qué
// hora, según flujo-vigente.md y banco.md ("Reglas del flujo"). Puro.
//
// Días: el día 0 es el de salida, el día N el de vuelta ("el día que emprendés
// la vuelta") y el N+1 el siguiente, ya en casa.
//   · Día 0: solo UC1, 10:00, hora de casa.
//   · Día 1: ID1 (en pasado), 10:00 del viaje o de casa (la más tarde; ver
//     agregarID1), en lugar del mediodía; a la noche, la noche.
//   · Días 2 a N-1: mediodía (MD) 13:00 y noche, hora del viaje. El mediodía
//     recorre las 12 MD en orden y vuelve a empezar.
//   · Día N-1: la noche es FN1 (el mediodía es normal).
//   · Día N: solo VU0, 13:00, hora del viaje.
//   · Día N+1: VU1 10:00 y CA1 a la hora de la noche, hora de casa.
// La compra pide al menos 3 días y la noche entre 19:00 y 22:30 (validarCompra).
// Viajes cortos (banco.md, "Lectura corrida y viajes cortos", Naza 30/09;
// la compra ya no los permite, pero el código queda):
//   · 1 día (salida = vuelta): ese día UC1 10:00 y VU0 13:00; al otro, IV1
//     10:00 (en lugar de ID1 y VU1) y CA1 a la noche. Sin FN1 ni noches.
//     Todo en hora de CASA, también VU0: un viaje de un día suele ser cerca,
//     y así el día entero queda en la misma zona (decisión del código).
//   · 2 días: día 1 solo UC1; día 2 ID1 10:00 y VU0 13:00, sin noche (hora
//     del viaje); al otro, VU1 10:00 y CA1 (hora de casa).
// Las noches de los días 1 a N-2 son las "noches comunes": primero van las de
// antes de salir que faltaron (en orden, variante "ya de viaje"), después las
// preguntas propias repartidas parejas, y el resto, comienzo + puerta + cierre.
//
// Lo que depende de lo que pase en el chat (la cadena de antes de salir, REC1,
// AL1, el álbum) no está en este calendario: son funciones sueltas de abajo o
// de album.ts.
//
// armarCalendario NO filtra lo que ya pasó: devuelve el viaje entero, aunque
// la compra sea el mismo día de salida después de las 10:00 (UC1 queda en el
// pasado). Descartar o decidir qué hacer con lo vencido le toca al
// planificador que conecte esto con WhatsApp (Joaquín).

import { deMomento } from './banco.js';
import { aInstante, aLocal, diasEntre, esFecha, esHora, respetarFranja, respetarFranjas, sumarDias, zonaValida } from './horas.js';
import { HORA_NOCHE_POR_DEFECTO, MAX_PREGUNTAS_PROPIAS, type Compra, type Fecha, type Hora, type Zona } from './tipos.js';

export const HORA_MANANA: Hora = '10:00';
export const HORA_MEDIODIA: Hora = '13:00';

export const CADENA_ANTES = ['AS1', 'AS2', 'IM1', 'VA1'] as const;
export type IdAntes = (typeof CADENA_ANTES)[number];

export const COMIENZOS = ['C1', 'C2', 'C3', 'C4', 'C5'] as const;
export const CIERRES = ['F1', 'F2', 'F3', 'F4', 'F5'] as const;

/** Mínimo de días de viaje que acepta la compra (banco.md, simulaciones: las escapadas quedan para otro producto). */
export const MINIMO_DIAS = 3;
/** La hora de la noche que acepta la compra (banco.md, simulaciones). */
export const NOCHE_DESDE: Hora = '19:00';
export const NOCHE_HASTA: Hora = '22:30';

/** Los envoltorios de las preguntas propias de un regalo: rotan (banco.md, simulaciones). */
export const PROPIAS_REGALO = ['PR-R', 'PR-R2', 'PR-R3'] as const;

/**
 * Rotación fija de las puertas de la noche. El criterio (Fable, aprobado con
 * la noche): empezar por comida y lugar; alternar afuera y adentro; las
 * livianas entre dos pesadas.
 *   livianas: NO1 comida, NO9 risa
 *   afuera:   NO2 lugar, NO3 lo distinto, NO5 alguien, NO6 lo que no estaba en el plan
 *   adentro:  NO4 sentirse de viaje, NO8 el cuerpo, NO7 el rato quieto
 * Orden: NO1 NO2 | NO4 NO3 | NO9 | NO8 NO5 NO7 NO6 → y vuelve a NO1.
 * Las pesadas alternan afuera/adentro (NO2 A, NO4 D, NO3 A, NO8 D, NO5 A, NO7 D,
 * NO6 A); NO9 queda entre NO3 y NO8, y NO1 (al dar la vuelta) entre NO6 y NO2.
 * Con 4 de afuera y 3 de adentro, al dar la vuelta se juntan dos de afuera
 * (NO6 y NO2), pero con NO1 en el medio.
 */
export const ORDEN_PUERTAS = ['NO1', 'NO2', 'NO4', 'NO3', 'NO9', 'NO8', 'NO5', 'NO7', 'NO6'] as const;


/** Choques mediodía/noche: esa MD se saltea si la puerta de esa noche es esta. */
export const CHOQUES_MD: Readonly<Record<string, string>> = { MD2: 'NO1', MD8: 'NO6' };

export type TipoProgramado =
  | 'UC1'
  | 'ID1'
  | 'MD'
  | 'noche' // noche común: ids = [comienzo, puerta, cierre]
  | 'antes-en-viaje' // una de antes de salir que faltó, con su variante "ya de viaje"
  | 'propia' // ids = ['PR-R'], ['PR-R2'], ['PR-R3'] (rotan) o ['PR-P'], y la pregunta
  | 'FN1'
  | 'VU0'
  | 'VU1'
  | 'IV1' // viaje de 1 día: ida y vuelta, al día siguiente
  | 'CA1';

export type Programado = {
  /** Día desde la salida (0 = salida). */
  dia: number;
  momento: 'manana' | 'mediodia' | 'noche';
  tipo: TipoProgramado;
  ids: string[];
  /** Solo en las propias: la pregunta tal cual. */
  pregunta?: string;
  zona: Zona;
  /** Fecha y hora locales en `zona`, ya corridas por la franja 23-8 si hizo falta. */
  fecha: Fecha;
  hora: Hora;
  instante: Date;
  /** Clave estable para anotar respuestas: "D3-noche". */
  clave: string;
};

export type Calendario = {
  /**
   * Textos cortos para avisarle a Naza (nunca a la persona): lo que no entró.
   * El planificador decide cómo mandarlos.
   */
  avisosNaza: string[];
  programados: Programado[];
  /** Las de antes de salir que no entraron en ninguna noche (viaje muy corto). No se pierden en silencio. */
  antesQueNoEntran: IdAntes[];
  /** Las preguntas propias que no entraron. */
  propiasQueNoEntran: string[];
};

/**
 * Tira un error claro si la compra no sirve. Con `minimoDias` (por defecto 3,
 * la regla de la compra): armarCalendario lo llama con 1, así el código de los
 * viajes de 1 y 2 días sigue andando aunque la compra ya no los deje pasar.
 */
export function validarCompra(compra: Compra, { minimoDias = MINIMO_DIAS }: { minimoDias?: number } = {}): void {
  if (!compra.nombre.trim()) throw new Error('Compra sin nombre');
  if (!esFecha(compra.salida)) throw new Error(`Fecha de salida mal escrita: "${compra.salida}" (va YYYY-MM-DD)`);
  if (!esFecha(compra.vuelta)) throw new Error(`Fecha de vuelta mal escrita: "${compra.vuelta}" (va YYYY-MM-DD)`);
  if (diasEntre(compra.salida, compra.vuelta) < 0) throw new Error(`La vuelta (${compra.vuelta}) es antes de la salida (${compra.salida})`);
  for (const [campo, zona] of [['zonaCasa', compra.zonaCasa], ['zonaViaje', compra.zonaViaje]] as const) {
    if (!zonaValida(zona)) throw new Error(`${campo}: zona horaria desconocida "${zona}"`);
  }
  const dias = diasEntre(compra.salida, compra.vuelta) + 1;
  if (dias < minimoDias) throw new Error(`El viaje tiene que durar al menos ${minimoDias} días (salida y vuelta incluidas); este dura ${dias}`);
  if (compra.horaNoche !== undefined && !esHora(compra.horaNoche)) throw new Error(`horaNoche mal escrita: "${compra.horaNoche}" (va HH:MM)`);
  if (compra.horaNoche !== undefined && (compra.horaNoche < NOCHE_DESDE || compra.horaNoche > NOCHE_HASTA)) {
    throw new Error(`horaNoche ${compra.horaNoche}: la noche va entre las ${NOCHE_DESDE} y las ${NOCHE_HASTA}`);
  }
  if (compra.preguntasPropias.length > MAX_PREGUNTAS_PROPIAS) {
    throw new Error(`Hay ${compra.preguntasPropias.length} preguntas propias y van hasta ${MAX_PREGUNTAS_PROPIAS}`);
  }
  if (compra.formato !== 'impreso' && compra.formato !== 'pdf') throw new Error(`Formato desconocido "${compra.formato}"`);
  if (compra.fotosAlbum !== 20 && compra.fotosAlbum !== 40) throw new Error(`Álbum de ${compra.fotosAlbum} fotos: va 20 o 40`);
}

/**
 * Comienzo, puerta y cierre de la noche común número i (desde 0): 5 × 9 × 5
 * (banco.md, simulaciones). Rotan por separado:
 *   · comienzo: i % 5 (avanza de a uno);
 *   · puerta:   i % 9 (ORDEN_PUERTAS);
 *   · cierre:   (2i + ⌊i/5⌋) % 5 (avanza de a dos, y uno más cada 5 noches).
 * Ninguno se repite dos noches seguidas (el cierre avanza 2 o 3, nunca 0 ni
 * 5). Comienzo+puerta recorren las 45 parejas cada 45 noches, y cada vuelta
 * de 45 el cierre queda corrido (99 ≡ 4 mod 5): las 225 combinaciones salen
 * sin repetir antes de la noche 226.
 */
export function combinacionDeNoche(i: number): [string, string, string] {
  return [COMIENZOS[i % 5], ORDEN_PUERTAS[i % ORDEN_PUERTAS.length], CIERRES[(2 * i + Math.floor(i / 5)) % 5]];
}

/** La MD número k (desde 0): la tabla entera, en orden, y vuelve a empezar (la segunda vuelta usa las 12). */
function mdEnPosicion(k: number, orden: readonly string[]): string {
  return orden[k % orden.length];
}

/** Índices (dentro de `libres`) donde van `cuantas` propias, repartidas parejas: el centro de cada tramo. */
function repartir(cuantas: number, libres: number): number[] {
  return Array.from({ length: cuantas }, (_, i) => Math.floor(((i + 0.5) * libres) / cuantas));
}

type Noche = { tipo: 'noche' | 'antes-en-viaje' | 'propia'; ids: string[]; pregunta?: string };

export function armarCalendario(compra: Compra, pendientesAntes: readonly IdAntes[]): Calendario {
  validarCompra(compra, { minimoDias: 1 });
  const n = diasEntre(compra.salida, compra.vuelta);
  const horaNoche = compra.horaNoche ?? HORA_NOCHE_POR_DEFECTO;
  const propia = (i: number) => (compra.regalo ? PROPIAS_REGALO[i % PROPIAS_REGALO.length] : 'PR-P');

  // Noches comunes: días 1 a N-2 (la N-1 es FN1; el día 0 y el N no tienen noche).
  /**
   * ID1 nunca el mismo día de salida en casa (banco.md, simulaciones): a las
   * 10:00 del día siguiente en la zona del viaje o en la de casa, la que sea
   * más tarde (esa es su zona), fuera de la franja 23-8 en las dos zonas.
   */
  const f1 = sumarDias(compra.salida, 1);
  const id1 = (() => {
    const enViaje = aInstante(f1, HORA_MANANA, compra.zonaViaje);
    const enCasa = aInstante(f1, HORA_MANANA, compra.zonaCasa);
    const zona = enCasa > enViaje ? compra.zonaCasa : compra.zonaViaje;
    return { zona, t: respetarFranjas(enCasa > enViaje ? enCasa : enViaje, [compra.zonaViaje, compra.zonaCasa]) };
  })();
  /**
   * Con 12 horas o más de diferencia, eso cae después de la noche del día 1
   * (i12): ahí ID1 ocupa el lugar de esa noche, a la hora de la noche del
   * viaje, y ese día no hay otra noche; lo que iba en las noches corre un día
   * (Naza, 30/09). Solo si el día 1 tiene noche (viajes de 3 días o más).
   *
   * Caso aceptado (Naza, 30/09, revisión): en un viaje de 3 días la noche del
   * día 1 es FN1; ID1 la ocupa igual y FN1 no sale (por ejemplo, Buenos Aires
   * → Tokio del 10 al 12/11; test en viaje-v2-reglas-simulaciones). Es el
   * viaje más corto que se vende y, con 12 horas de diferencia, casi no pasa.
   */
  const nocheDia1 = respetarFranja(aInstante(f1, horaNoche, compra.zonaViaje), compra.zonaViaje);
  const id1EnLaNoche = n >= 2 && id1.t.getTime() >= nocheDia1.getTime();

  const diasComunes: number[] = [];
  for (let d = id1EnLaNoche ? 2 : 1; d <= n - 2; d++) diasComunes.push(d);

  const noches = new Map<number, Noche>();
  const antesEntran = pendientesAntes.slice(0, diasComunes.length);
  antesEntran.forEach((id, i) => noches.set(diasComunes[i], { tipo: 'antes-en-viaje', ids: [id] }));
  const libres = diasComunes.slice(antesEntran.length);
  const propiasEntran = compra.preguntasPropias.slice(0, libres.length);
  repartir(propiasEntran.length, libres.length).forEach((idx, i) =>
    noches.set(libres[idx], { tipo: 'propia', ids: [propia(i)], pregunta: propiasEntran[i] }),
  );
  let comun = 0;
  for (const d of diasComunes) {
    if (noches.has(d)) continue;
    const i = comun++;
    noches.set(d, { tipo: 'noche', ids: combinacionDeNoche(i) });
  }

  const primeraMd = deMomento('mediodia').map((f) => f.id);
  let proximaMd = 0;
  const programados: Programado[] = [];
  const agregar = (dia: number, momento: Programado['momento'], tipo: TipoProgramado, ids: string[], zona: Zona, hora: Hora, pregunta?: string, fijo?: Date) => {
    const fechaDia = sumarDias(compra.salida, dia);
    const instante = fijo ?? respetarFranja(aInstante(fechaDia, hora, zona), zona);
    const local = aLocal(instante, zona);
    programados.push({ dia, momento, tipo, ids, zona, fecha: local.fecha, hora: local.hora, instante, clave: `D${dia}-${momento}`, ...(pregunta !== undefined ? { pregunta } : {}) });
  };

  function agregarID1(d: number) {
    agregar(d, 'manana', 'ID1', ['ID1'], id1.zona, HORA_MANANA, undefined, id1.t);
  }

  if (n === 0) {
    agregar(0, 'manana', 'UC1', ['UC1'], compra.zonaCasa, HORA_MANANA);
    agregar(0, 'mediodia', 'VU0', ['VU0'], compra.zonaCasa, HORA_MEDIODIA);
    agregar(1, 'manana', 'IV1', ['IV1'], compra.zonaCasa, HORA_MANANA);
    agregar(1, 'noche', 'CA1', ['CA1'], compra.zonaCasa, horaNoche);
  }

  for (let d = 0; n > 0 && d <= n + 1; d++) {
    if (d === 0) {
      agregar(d, 'manana', 'UC1', ['UC1'], compra.zonaCasa, HORA_MANANA);
      continue;
    }
    if (d === n + 1) {
      agregar(d, 'manana', 'VU1', ['VU1'], compra.zonaCasa, HORA_MANANA);
      agregar(d, 'noche', 'CA1', ['CA1'], compra.zonaCasa, horaNoche);
      continue;
    }
    if (d === n) {
      if (n === 1) agregarID1(d); // 2 días: ID1 y VU0, sin noche
      agregar(d, 'mediodia', 'VU0', ['VU0'], compra.zonaViaje, HORA_MEDIODIA);
      continue;
    }
    // Días 1 a N-1: en el viaje.
    if (d === 1 && id1EnLaNoche) {
      agregar(d, 'noche', 'ID1', ['ID1'], compra.zonaViaje, horaNoche);
      continue;
    }
    const noche = d === n - 1 ? null : noches.get(d)!;
    if (d === 1) {
      agregarID1(d);
    } else {
      const puerta = noche?.tipo === 'noche' ? noche.ids[1] : null;
      let md = mdEnPosicion(proximaMd++, primeraMd);
      while (puerta !== null && CHOQUES_MD[md] === puerta) md = mdEnPosicion(proximaMd++, primeraMd);
      agregar(d, 'mediodia', 'MD', [md], compra.zonaViaje, HORA_MEDIODIA);
    }
    if (noche === null) agregar(d, 'noche', 'FN1', ['FN1'], compra.zonaViaje, horaNoche);
    else agregar(d, 'noche', noche.tipo, noche.ids, compra.zonaViaje, horaNoche, noche.pregunta);
  }

  programados.sort((a, b) => a.instante.getTime() - b.instante.getTime());

  const antesQueNoEntran = pendientesAntes.slice(antesEntran.length);
  const propiasQueNoEntran = compra.preguntasPropias.slice(propiasEntran.length);
  const avisosNaza: string[] = [];
  if (antesQueNoEntran.length) {
    avisosNaza.push(`No entran en las noches del viaje ${antesQueNoEntran.length} de antes de salir: ${antesQueNoEntran.join(', ')}.`);
  }
  if (propiasQueNoEntran.length) {
    avisosNaza.push(`No entran ${propiasQueNoEntran.length} preguntas propias: ${propiasQueNoEntran.map((p) => `«${p}»`).join(' ')}.`);
  }
  return { avisosNaza, programados, antesQueNoEntran, propiasQueNoEntran };
}

/**
 * ¿Queda una pregunta de noche (noche del viaje o CA1) más tarde, el mismo día
 * local que `t`? Para decidir si un acuse puede decir "Hasta la noche".
 */
export function quedaNocheEseDia(programados: readonly Programado[], t: Date): boolean {
  return programados.some((p) => p.momento === 'noche' && p.instante.getTime() > t.getTime() && aLocal(t, p.zona).fecha === p.fecha);
}

/**
 * ¿Llega otra pregunta programada más tarde, el mismo día local que `t`? Para
 * elegir entre PAS-V2 ("Dale, esta la salteamos.") y PAS-V ("…Mañana hay otra.").
 */
export function quedaOtraEseDia(programados: readonly Programado[], t: Date): boolean {
  return programados.some((p) => p.instante.getTime() > t.getTime() && aLocal(t, p.zona).fecha === p.fecha);
}

/**
 * Cuándo sale UC1 (banco.md, simulaciones): a su hora; si el SÍ llega después
 * (compra el día de salida), 2 horas después del SÍ si todavía es el día de
 * salida en casa, respetando la franja; si no, null (no sale).
 */
export function momentoUC1(uc1: Programado, siEn: Date, compra: Compra): Date | null {
  if (siEn.getTime() <= uc1.instante.getTime()) return uc1.instante;
  const t = respetarFranja(new Date(siEn.getTime() + 2 * 3_600_000), compra.zonaCasa);
  return aLocal(t, compra.zonaCasa).fecha === compra.salida ? t : null;
}

/**
 * AL1 (o AL1-P si CA1 fue "paso" o quedó sin respuesta) sale al día siguiente
 * de CA1 a las 10:00, hora de casa; ya no va pegada a la respuesta (banco.md,
 * lectura final; reemplaza las 13:00 de las simulaciones).
 */
export function momentoAL1(ca1: Programado, compra: Compra): Date {
  return respetarFranja(aInstante(sumarDias(ca1.fecha, 1), HORA_MANANA, compra.zonaCasa), compra.zonaCasa);
}

/**
 * Para un "paso" en CA1: ¿AL1-P sale el mismo día (hora de casa) que `t`? Pasa
 * si contesta después de medianoche. Ahí va PAS-V2, no "Mañana hay otra": el
 * planificador lo pasa como `quedaOtra` a reaccion().
 */
export function quedaAL1EseDia(ca1: Programado, t: Date, compra: Compra): boolean {
  const al1 = momentoAL1(ca1, compra);
  return al1.getTime() > t.getTime() && aLocal(al1, compra.zonaCasa).fecha === aLocal(t, compra.zonaCasa).fecha;
}

// ── Antes de salir: la cadena ────────────────────────────────────────────────

export function siguienteDeLaCadena(id: IdAntes): IdAntes | null {
  const i = CADENA_ANTES.indexOf(id);
  return CADENA_ANTES[i + 1] ?? null;
}

/**
 * Cuándo sale la siguiente de la cadena si contestó en `contesto`: enseguida,
 * salvo la franja 23-8 (espera a las 8:00, hora de casa). Si eso ya es el día
 * de salida (o después), null: ese día solo va UC1 y la que falte queda para
 * las noches del viaje.
 */
export function momentoDeLaSiguiente(contesto: Date, compra: Compra): Date | null {
  const t = respetarFranja(contesto, compra.zonaCasa);
  return aLocal(t, compra.zonaCasa).fecha < compra.salida ? t : null;
}

/**
 * REC1: a los 3 días de una pregunta de la cadena colgada, una sola vez
 * (`yaHubo`), respetando la franja; no va si faltan menos de 2 días (de
 * calendario, hora de casa) para salir.
 */
export function momentoRecordatorio(enviada: Date, compra: Compra, yaHubo: boolean): Date | null {
  if (yaHubo) return null;
  const t = respetarFranja(new Date(enviada.getTime() + 3 * 86_400_000), compra.zonaCasa);
  return diasEntre(aLocal(t, compra.zonaCasa).fecha, compra.salida) < 2 ? null : t;
}

/** Las de la cadena que no contestó ni pasó ("paso" cuenta como contestada), en orden. */
export function pendientesAntes(contestadas: ReadonlySet<string>): IdAntes[] {
  return CADENA_ANTES.filter((id) => !contestadas.has(id));
}
