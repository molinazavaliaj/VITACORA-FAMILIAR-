// La simulación: chicos inventados (ficha y conducta al azar, con semilla)
// corridos de punta a punta, con sus violaciones. La usan el script y el test.

import { azar, chico, fichaAlAzar, TIPOS_DE_CONDUCTA, type TipoConducta } from './conductas.js';
import type { Ficha } from './compra.js';
import { revisar, type Violacion } from './controles.js';
import { correr, type Corrida } from './corrida.js';

export const DESDE_SIMULACION = '2026-10-06T15:00:00.000Z';

export type Resultado = { semilla: number; conducta: TipoConducta; ficha: Ficha; corrida: Corrida; violaciones: Violacion[]; dias: number; mensajes: number };

export function correrUno(semilla: number): Resultado {
  const r = azar(semilla);
  const conducta = TIPOS_DE_CONDUCTA[semilla % TIPOS_DE_CONDUCTA.length];
  const ficha = fichaAlAzar(r);
  let corrida: Corrida;
  try {
    corrida = correr(ficha, chico(conducta, r, ficha), { desde: DESDE_SIMULACION, dias: 365 });
  } catch (err) {
    const vacia: Corrida = { lineas: [], estado: undefined as never, pasos: 0 };
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

export function correrMuchos(n: number): Resultado[] {
  return Array.from({ length: n }, (_, i) => correrUno(i + 1));
}
