import type { Ficha } from '../src/kids-v2/compra.js';
import { aInstante } from '../src/kids-v2/horas.js';

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
