// La simulación: chicos inventados (ficha y conducta al azar, con semilla)
// corridos de punta a punta, con sus violaciones. La usan el script y el test.

import { azar, chico, fichaAlAzar, TIPOS_DE_CONDUCTA, type TipoConducta } from './conductas.js';
import type { Ficha } from './compra.js';
import { revisar, type Violacion } from './controles.js';
import { correr, type Corrida } from './corrida.js';
import { idiomaDe, type IdiomaKids } from './idioma.js';

export const DESDE_SIMULACION = '2026-10-06T15:00:00.000Z';

export type Resultado = { semilla: number; conducta: TipoConducta; ficha: Ficha; corrida: Corrida; violaciones: Violacion[]; dias: number; mensajes: number };

/** En qué idioma corren: todos en uno, o `mitad` (las semillas pares en es-ES, las impares en es-AR). */
export type IdiomasSimulacion = IdiomaKids | 'mitad';

export const idiomaDeSemilla = (semilla: number, idiomas: IdiomasSimulacion): IdiomaKids =>
  idiomas === 'mitad' ? (semilla % 2 === 0 ? 'es-ES' : 'es-AR') : idiomas;

/** Un chico. En es-AR la ficha va sin el campo `idioma` (como las de antes del 16/10). */
export function correrUno(semilla: number, idioma: IdiomaKids = 'es-AR'): Resultado {
  const r = azar(semilla);
  const conducta = TIPOS_DE_CONDUCTA[semilla % TIPOS_DE_CONDUCTA.length];
  const ficha = fichaAlAzar(r, undefined, idioma === 'es-AR' ? undefined : idioma);
  let corrida: Corrida;
  try {
    corrida = correr(ficha, chico(conducta, r, ficha), { desde: DESDE_SIMULACION, dias: 365 });
  } catch (err) {
    const vacia: Corrida = { lineas: [], estado: undefined as never, pasos: 0, recibidos: [] };
    return { semilla, conducta, ficha, corrida: vacia, violaciones: [{ control: 'traba', detalle: (err as Error).message }], dias: 0, mensajes: 0 };
  }
  const ultima = corrida.lineas[corrida.lineas.length - 1]?.en ?? new Date(DESDE_SIMULACION);
  return {
    semilla,
    conducta,
    ficha,
    corrida,
    violaciones: revisar(ficha, corrida, { sigueContestando: true }),
    dias: Math.ceil((ultima.getTime() - new Date(DESDE_SIMULACION).getTime()) / 86_400_000),
    mensajes: corrida.lineas.filter((l) => l.de === 'bot').length,
  };
}

export function correrMuchos(n: number, idiomas: IdiomasSimulacion = 'es-AR'): Resultado[] {
  return Array.from({ length: n }, (_, i) => correrUno(i + 1, idiomaDeSemilla(i + 1, idiomas)));
}

export const idiomaDeResultado = (r: Resultado): IdiomaKids => idiomaDe(r.ficha);
