// El calendario de la entrevista de viaje: qué pregunta sale cada día y a qué
// hora, según flujo-vigente.md y banco.md ("Reglas del flujo"). Puro.
//
// Días: el día 0 es el de salida, el día N el de vuelta ("el día que emprendés
// la vuelta") y el N+1 el siguiente, ya en casa.
//   · Día 0: solo UC1, 10:00, hora de casa.
//   · Día 1: ID1 (en pasado), 10:00, hora del viaje, en lugar del mediodía; a la noche, la noche.
//   · Días 2 a N-1: mediodía (MD) 13:00 y noche, hora del viaje.
//   · Día N-1: la noche es FN1 (el mediodía es normal).
//   · Día N: solo VU0, 13:00, hora del viaje.
//   · Día N+1: VU1 10:00 y CA1 a la hora de la noche, hora de casa.
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
import { aInstante, aLocal, diasEntre, esFecha, esHora, respetarFranja, sumarDias, zonaValida } from './horas.js';
import { HORA_NOCHE_POR_DEFECTO, MAX_PREGUNTAS_PROPIAS, type Compra, type Fecha, type Hora, type Zona } from './tipos.js';

export const HORA_MANANA: Hora = '10:00';
export const HORA_MEDIODIA: Hora = '13:00';

export const CADENA_ANTES = ['AS1', 'AS2', 'IM1', 'VA1'] as const;
export type IdAntes = (typeof CADENA_ANTES)[number];

export const COMIENZOS = ['C1', 'C2', 'C3'] as const;
export const CIERRES = ['F1', 'F2', 'F3'] as const;

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

/** Segunda vuelta del mediodía (y siguientes): solo estas, en este orden (banco.md, decisiones del compilado). */
export const SEGUNDA_VUELTA_MD = ['MD1', 'MD5', 'MD3', 'MD4', 'MD6'] as const;

/** Choques mediodía/noche: esa MD se saltea si la puerta de esa noche es esta. */
export const CHOQUES_MD: Readonly<Record<string, string>> = { MD2: 'NO1', MD8: 'NO6' };

export type TipoProgramado =
  | 'UC1'
  | 'ID1'
  | 'MD'
  | 'noche' // noche común: ids = [comienzo, puerta, cierre]
  | 'antes-en-viaje' // una de antes de salir que faltó, con su variante "ya de viaje"
  | 'propia' // ids = ['PR-R'] o ['PR-P'], y la pregunta
  | 'FN1'
  | 'VU0'
  | 'VU1'
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

/** Tira un error claro si la compra no sirve para armar el calendario. */
export function validarCompra(compra: Compra): void {
  if (!compra.nombre.trim()) throw new Error('Compra sin nombre');
  if (!esFecha(compra.salida)) throw new Error(`Fecha de salida mal escrita: "${compra.salida}" (va YYYY-MM-DD)`);
  if (!esFecha(compra.vuelta)) throw new Error(`Fecha de vuelta mal escrita: "${compra.vuelta}" (va YYYY-MM-DD)`);
  if (diasEntre(compra.salida, compra.vuelta) < 0) throw new Error(`La vuelta (${compra.vuelta}) es antes de la salida (${compra.salida})`);
  for (const [campo, zona] of [['zonaCasa', compra.zonaCasa], ['zonaViaje', compra.zonaViaje]] as const) {
    if (!zonaValida(zona)) throw new Error(`${campo}: zona horaria desconocida "${zona}"`);
  }
  if (compra.horaNoche !== undefined && !esHora(compra.horaNoche)) throw new Error(`horaNoche mal escrita: "${compra.horaNoche}" (va HH:MM)`);
  if (compra.preguntasPropias.length > MAX_PREGUNTAS_PROPIAS) {
    throw new Error(`Hay ${compra.preguntasPropias.length} preguntas propias y van hasta ${MAX_PREGUNTAS_PROPIAS}`);
  }
  if (compra.formato !== 'impreso' && compra.formato !== 'pdf') throw new Error(`Formato desconocido "${compra.formato}"`);
  if (compra.fotosAlbum !== 20 && compra.fotosAlbum !== 40) throw new Error(`Álbum de ${compra.fotosAlbum} fotos: va 20 o 40`);
}

/**
 * Comienzo, puerta y cierre de la noche común número i (desde 0). Rotan por
 * separado: la puerta avanza de a una (ciclo de 9); el comienzo avanza de a
 * uno y además se corre uno cada vuelta de puertas (cada 9 noches), así la
 * noche 10 no repite comienzo+puerta de la 1; el cierre avanza de a uno, se
 * corre uno cada 3 noches y se atrasa uno cada 27. Resultado: en las primeras
 * 9 noches salen las 9 de comienzo+cierre, en 27 las 27 de comienzo+puerta, y
 * en 81 las 81 combinaciones sin repetir; nunca el mismo comienzo ni el mismo
 * cierre dos noches seguidas.
 */
export function combinacionDeNoche(i: number): [string, string, string] {
  const c = (i + Math.floor(i / 9)) % 3;
  const f = (((i + Math.floor(i / 3) - Math.floor(i / 27)) % 3) + 3) % 3;
  return [COMIENZOS[c], ORDEN_PUERTAS[i % ORDEN_PUERTAS.length], CIERRES[f]];
}

/** La MD número k (desde 0): la primera vuelta es la tabla entera; después, solo SEGUNDA_VUELTA_MD. */
function mdEnPosicion(k: number, primera: readonly string[]): string {
  return k < primera.length ? primera[k] : SEGUNDA_VUELTA_MD[(k - primera.length) % SEGUNDA_VUELTA_MD.length];
}

/** Índices (dentro de `libres`) donde van `cuantas` propias, repartidas parejas: el centro de cada tramo. */
function repartir(cuantas: number, libres: number): number[] {
  return Array.from({ length: cuantas }, (_, i) => Math.floor(((i + 0.5) * libres) / cuantas));
}

type Noche = { tipo: 'noche' | 'antes-en-viaje' | 'propia'; ids: string[]; pregunta?: string };

export function armarCalendario(compra: Compra, pendientesAntes: readonly IdAntes[]): Calendario {
  validarCompra(compra);
  const n = diasEntre(compra.salida, compra.vuelta);
  const horaNoche = compra.horaNoche ?? HORA_NOCHE_POR_DEFECTO;
  const propia = compra.regalo ? 'PR-R' : 'PR-P';

  // Noches comunes: días 1 a N-2 (la N-1 es FN1; el día 0 y el N no tienen noche).
  const diasComunes: number[] = [];
  for (let d = 1; d <= n - 2; d++) diasComunes.push(d);

  const noches = new Map<number, Noche>();
  const antesEntran = pendientesAntes.slice(0, diasComunes.length);
  antesEntran.forEach((id, i) => noches.set(diasComunes[i], { tipo: 'antes-en-viaje', ids: [id] }));
  const libres = diasComunes.slice(antesEntran.length);
  const propiasEntran = compra.preguntasPropias.slice(0, libres.length);
  repartir(propiasEntran.length, libres.length).forEach((idx, i) =>
    noches.set(libres[idx], { tipo: 'propia', ids: [propia], pregunta: propiasEntran[i] }),
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
  const agregar = (dia: number, momento: Programado['momento'], tipo: TipoProgramado, ids: string[], zona: Zona, hora: Hora, pregunta?: string) => {
    const fechaDia = sumarDias(compra.salida, dia);
    const instante = respetarFranja(aInstante(fechaDia, hora, zona), zona);
    const local = aLocal(instante, zona);
    programados.push({ dia, momento, tipo, ids, zona, fecha: local.fecha, hora: local.hora, instante, clave: `D${dia}-${momento}`, ...(pregunta !== undefined ? { pregunta } : {}) });
  };

  for (let d = 0; d <= n + 1; d++) {
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
      agregar(d, 'mediodia', 'VU0', ['VU0'], compra.zonaViaje, HORA_MEDIODIA);
      continue;
    }
    // Días 1 a N-1: en el viaje.
    const noche = d === n - 1 ? null : noches.get(d)!;
    if (d === 1) {
      agregar(d, 'manana', 'ID1', ['ID1'], compra.zonaViaje, HORA_MANANA);
    } else {
      const puerta = noche?.tipo === 'noche' ? noche.ids[1] : null;
      let md = mdEnPosicion(proximaMd++, primeraMd);
      while (puerta !== null && CHOQUES_MD[md] === puerta) md = mdEnPosicion(proximaMd++, primeraMd);
      agregar(d, 'mediodia', 'MD', [md], compra.zonaViaje, HORA_MEDIODIA);
    }
    if (noche === null) agregar(d, 'noche', 'FN1', ['FN1'], compra.zonaViaje, horaNoche);
    else agregar(d, 'noche', noche.tipo, noche.ids, compra.zonaViaje, horaNoche, noche.pregunta);
  }

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
