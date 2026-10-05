// Ayudas compartidas por los tests de kids-v2 (no es un test: vitest no lo corre solo).
// Chicos INVENTADOS.

import type { Ficha } from '../src/kids-v2/compra.js';
import { aInstante } from '../src/kids-v2/horas.js';
import { nuevoEstado } from '../src/kids-v2/motor/estado.js';
import type { Ctx } from '../src/kids-v2/motor/flujo.js';
import type { Estado, Fase, Salida } from '../src/kids-v2/motor/tipos.js';

export const ZONA = 'America/Argentina/Buenos_Aires';

export const FICHA: Ficha = {
  nombre: 'Bruno Ibáñez',
  apodo: 'Bruno',
  genero: 'chico',
  edad: 11,
  quienRegala: 'Tu mamá',
  canal: 'A',
  nombrePadre: 'Laura Ibáñez',
  linkPanel: 'vitacora.com/panel/bruno',
  hora: '18:00',
  zona: ZONA,
  temasSacados: [],
  fotosConOtrosChicos: false,
  preguntasPadre: [],
};

/** Instante de una fecha y hora de Buenos Aires. */
export const en = (fecha: string, hora: string) => aInstante(fecha, hora, ZONA);
export const iso = (fecha: string, hora: string) => en(fecha, hora).toISOString();

/** Un estado parado en el item `clave` del guion, en la fase dada, con la ventana abierta (último mensaje: el 10/10 a las 12:00). */
export function estadoEn(clave: string, fase: Fase, cambios: Partial<Ficha> = {}, extra: Partial<Estado> = {}): Estado {
  const e = nuevoEstado({ ...FICHA, ...cambios });
  const i = e.guion.findIndex((x) => x.clave === clave);
  if (i < 0) throw new Error(`No está ${clave} en el guion`);
  return { ...e, cursor: i, fase, inicio: iso('2026-10-06', '17:30'), ultimaEntrada: iso('2026-10-10', '12:00'), ...extra };
}

export function ctx(e: Estado, fecha = '2026-10-10', hora = '18:05'): Ctx {
  return { e, ahora: en(fecha, hora), salidas: [], replay: false };
}

/** Los IDs de los mensajes que salieron, en orden. */
export const ids = (s: Salida[]) => s.flatMap((x) => (x.tipo === 'mensaje' ? [x.id] : [`marca:${x.motivo}`]));
export const mensaje = (s: Salida[], id: string) => {
  const m = s.find((x) => x.tipo === 'mensaje' && x.id === id);
  if (!m || m.tipo !== 'mensaje') throw new Error(`No salió ${id}: ${ids(s).join(', ')}`);
  return m;
};
