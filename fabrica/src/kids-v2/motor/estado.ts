// El estado inicial de un chico: la ficha validada y su guion efectivo.

import { armarGuion, validarFicha, type Ficha } from '../compra.js';
import type { Estado } from './tipos.js';

export function nuevoEstado(ficha: Ficha): Estado {
  const f = validarFicha(ficha);
  return {
    ficha: f,
    guion: armarGuion(f),
    fase: { tipo: 'sin-empezar' },
    cursor: -1,
    extra: null,
    conto: false,
    opsUsadas: [],
    extrasUsadas: [],
    hermanos: null,
    peleaK36: false,
    rotacion: { acuse: null, foto: null, diaFeo: null },
    rafaga: null,
    nocturnos: [],
    inicio: null,
    ultimaEntrada: null,
    diaHecho: null,
    horaHecha: null,
    sobrioHasta: null,
    recordatorios: 0,
    reenviar: false,
    terminoPadre: null,
    extrasDesde: null,
    fotosVencidas: [],
  };
}
