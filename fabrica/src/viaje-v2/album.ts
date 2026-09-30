// La máquina de estados del álbum (banco.md, "El álbum"). Pura: recibe el
// estado y un evento, devuelve el estado nuevo y lo que hay que hacer.
//
//   · AL1 ya salió (con la respuesta a CA1). Se juntan fotos.
//   · "listo" cierra. A las 5 horas sin fotos nuevas: AL2.
//   · Después de AL2: "sí" o no contestar en 5 horas → cierra. "No" o más
//     fotos → otras 5 horas y AL2 una vez más como mucho; después de ese
//     segundo AL2, "no" o más fotos → 5 horas más y se cierra igual.
//   · Se guardan las primeras N ({{fotos_album}}); si mandó de más, DES+.
//   · Con cero fotos no sale AL2: a las 5 horas de AL1 se avisa a Naza (un
//     evento, no un mensaje) y la despedida espera su decisión ("naza-cierra").
//   · Todo lo que sale por reloj respeta la franja 23-8 (hora de casa).
//   · Entre AL1 y la despedida no hay otros recordatorios.

import { respetarFranja } from './horas.js';
import { despedida } from './mensajes.js';
import { porId } from './banco.js';
import { datosDeCompra, renderizar } from './texto.js';
import type { Compra, Mensaje } from './tipos.js';

export const HORAS_ESPERA = 5;
export const MAX_AL2 = 2;

export type FaseAlbum =
  | 'juntando' // después de AL1 (o de un "no" / fotos después del primer AL2)
  | 'esperando-al2' // salió AL2, espera "sí", "no", fotos o el reloj
  | 'ultima-espera' // ya salieron los dos AL2: a las 5 horas se cierra igual
  | 'esperando-naza' // cero fotos: Naza decide
  | 'cerrado';

export type EstadoAlbum = {
  fase: FaseAlbum;
  /** Fotos que mandó al álbum (todas, aunque sean de más). */
  fotos: number;
  al2Mandados: number;
  /** ISO: cuándo actúa el reloj. null si no espera nada. */
  vence: string | null;
};

export type EventoAlbum =
  | { tipo: 'foto'; en: Date; cantidad?: number }
  | { tipo: 'listo'; en: Date }
  | { tipo: 'si'; en: Date }
  | { tipo: 'no'; en: Date }
  | { tipo: 'reloj'; en: Date }
  | { tipo: 'naza-cierra'; en: Date };

export type SalidaAlbum =
  | { tipo: 'mensaje'; mensaje: Mensaje }
  | { tipo: 'avisar-naza'; motivo: string }
  | { tipo: 'cerrado'; guardadas: number; descartadas: number };

function en5Horas(desde: Date, compra: Compra): string {
  return respetarFranja(new Date(desde.getTime() + HORAS_ESPERA * 3_600_000), compra.zonaCasa).toISOString();
}

/** El álbum recién abierto: salió AL1 en `al1En`. */
export function iniciarAlbum(al1En: Date, compra: Compra): EstadoAlbum {
  return { fase: 'juntando', fotos: 0, al2Mandados: 0, vence: en5Horas(al1En, compra) };
}

function cerrar(estado: EstadoAlbum, compra: Compra): { estado: EstadoAlbum; salidas: SalidaAlbum[] } {
  const guardadas = Math.min(estado.fotos, compra.fotosAlbum);
  return {
    estado: { ...estado, fase: 'cerrado', vence: null },
    salidas: [
      { tipo: 'mensaje', mensaje: despedida(compra, estado.fotos) },
      { tipo: 'cerrado', guardadas, descartadas: estado.fotos - guardadas },
    ],
  };
}

const AVISO_CERO = 'El álbum lleva 5 horas sin fotos: cero fotos. La despedida espera tu decisión.';

function avisarNaza(estado: EstadoAlbum): { estado: EstadoAlbum; salidas: SalidaAlbum[] } {
  return { estado: { ...estado, fase: 'esperando-naza', vence: null }, salidas: [{ tipo: 'avisar-naza', motivo: AVISO_CERO }] };
}

/** Después de un AL2, un "no" o más fotos: si queda AL2, se vuelve a juntar; si no, última espera. */
function otraVuelta(estado: EstadoAlbum, en: Date, compra: Compra): EstadoAlbum {
  return { ...estado, fase: estado.al2Mandados < MAX_AL2 ? 'juntando' : 'ultima-espera', vence: en5Horas(en, compra) };
}

export function pasoAlbum(estado: EstadoAlbum, evento: EventoAlbum, compra: Compra): { estado: EstadoAlbum; salidas: SalidaAlbum[] } {
  const nada = { estado, salidas: [] as SalidaAlbum[] };
  if (estado.fase === 'cerrado') return nada;

  switch (evento.tipo) {
    case 'foto': {
      const conFotos = { ...estado, fotos: estado.fotos + (evento.cantidad ?? 1) };
      if (estado.fase === 'esperando-al2') return { estado: otraVuelta(conFotos, evento.en, compra), salidas: [] };
      if (estado.fase === 'esperando-naza') return { estado: { ...conFotos, fase: 'juntando', vence: en5Horas(evento.en, compra) }, salidas: [] };
      return { estado: { ...conFotos, vence: en5Horas(evento.en, compra) }, salidas: [] };
    }
    case 'listo':
      if (estado.fotos === 0) return estado.fase === 'esperando-naza' ? nada : avisarNaza(estado);
      return cerrar(estado, compra);
    case 'si':
      return estado.fase === 'esperando-al2' ? cerrar(estado, compra) : nada;
    case 'no':
      return estado.fase === 'esperando-al2' ? { estado: otraVuelta(estado, evento.en, compra), salidas: [] } : nada;
    case 'naza-cierra':
      return estado.fase === 'esperando-naza' ? cerrar(estado, compra) : nada;
    case 'reloj': {
      if (estado.vence === null || evento.en.getTime() < Date.parse(estado.vence)) return nada;
      if (estado.fase === 'esperando-al2' || estado.fase === 'ultima-espera') return cerrar(estado, compra);
      if (estado.fase !== 'juntando') return nada;
      if (estado.fotos === 0) return avisarNaza(estado);
      const al2: Mensaje = { ids: ['AL2'], texto: renderizar(porId('AL2').texto, datosDeCompra(compra)) };
      // AL2 sale ahora (cuando llega el reloj, aunque llegue tarde): el plazo nuevo corre desde acá.
      const salio = evento.en;
      return {
        estado: { ...estado, fase: 'esperando-al2', al2Mandados: estado.al2Mandados + 1, vence: en5Horas(salio, compra) },
        salidas: [{ tipo: 'mensaje', mensaje: al2 }],
      };
    }
  }
}
