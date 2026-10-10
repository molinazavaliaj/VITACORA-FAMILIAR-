// La máquina de estados del álbum (banco.md, "El álbum" y "Simulaciones y
// lectura de Fable"). Pura: recibe el estado y un evento, devuelve el estado
// nuevo y lo que hay que hacer.
//
//   · AL1 ya salió (con la respuesta a CA1, o AL1-P al día siguiente si CA1
//     quedó sin respuesta). Se juntan fotos; cada una tiene un id (el de
//     WhatsApp; si no viene, se numeran f1, f2…).
//   · "listo" cierra. A las 5 horas sin fotos nuevas: AL2.
//   · Después de AL2: "sí" o no contestar en 5 horas → cierra. "No" o más
//     fotos → otras 5 horas y AL2 una vez más como mucho; después de ese
//     segundo AL2, "no" o más fotos → 5 horas más y se cierra igual.
//   · Cerrar con fotos de más: antes de DES va AL3 ("reenviame las que saco").
//     Las que reenvía se sacan; si con eso quedan las que entran, DES. Si
//     contesta otra cosa, o no contesta en 5 horas (desde AL3 o desde el
//     último reenvío), quedan las primeras {{fotos_album}} y va DES con DES+.
//   · Con cero fotos no sale AL2: a las 5 horas de AL1 se avisa a Naza (un
//     evento, no un mensaje) y la despedida espera su decisión ("naza-cierra").
//   · Todo lo que sale por reloj respeta la franja 23-8 (hora de casa); si cae
//     adentro, se corre a las 10:00, no a las 8:00.
//   · Fotos después del cierre: van al panel, sin contestar.
//   · Entre AL1 y la despedida no hay otros recordatorios.

import { respetarFranja } from './horas.js';
import { despedida } from './mensajes.js';
import { porId } from './banco.js';
import { idiomaDe } from './idioma.js';
import { datosDeCompra, renderizar } from './texto.js';
import type { Compra, Mensaje } from './tipos.js';

export const HORAS_ESPERA = 5;
export const MAX_AL2 = 2;
/** A qué hora sale lo del álbum que cae en la franja 23-8. */
export const HORA_ALBUM_TRAS_FRANJA = '10:00';

export type FaseAlbum =
  | 'juntando' // después de AL1 (o de un "no" / fotos después del primer AL2)
  | 'esperando-al2' // salió AL2, espera "sí", "no", fotos o el reloj
  | 'ultima-espera' // ya salieron los dos AL2: a las 5 horas se cierra igual
  | 'esperando-naza' // cero fotos: Naza decide
  | 'eligiendo' // salió AL3: espera que reenvíe las que saca
  | 'cerrado';

export type EstadoAlbum = {
  fase: FaseAlbum;
  /** Cuántas fotos hay hoy en el álbum (ids.length). */
  fotos: number;
  /** Las fotos del álbum, en el orden en que llegaron (sin las que sacó con AL3). */
  ids: string[];
  /** Cuántas llegaron en total (para numerar las que vienen sin id). */
  recibidas: number;
  al2Mandados: number;
  /** ISO: cuándo actúa el reloj. null si no espera nada. */
  vence: string | null;
};

export type EventoAlbum =
  | { tipo: 'foto'; en: Date; cantidad?: number; ids?: string[] }
  | { tipo: 'listo'; en: Date }
  | { tipo: 'si'; en: Date }
  | { tipo: 'no'; en: Date }
  /** Cualquier otra respuesta de texto (para AL3: "otra cosa"). */
  | { tipo: 'otra'; en: Date }
  /** Reenvió fotos que ya estaban en el álbum: las que saca (respuesta a AL3). */
  | { tipo: 'reenvio'; en: Date; ids: string[] }
  | { tipo: 'reloj'; en: Date }
  | { tipo: 'naza-cierra'; en: Date };

export type SalidaAlbum =
  | { tipo: 'mensaje'; mensaje: Mensaje }
  | { tipo: 'avisar-naza'; motivo: string }
  | { tipo: 'cerrado'; guardadas: number; descartadas: number; quedan: string[] }
  /** Fotos que llegan con el álbum cerrado: se guardan en el panel, sin contestar. */
  | { tipo: 'al-panel'; cantidad: number };

type Paso = { estado: EstadoAlbum; salidas: SalidaAlbum[] };

function en5Horas(desde: Date, compra: Compra): string {
  return respetarFranja(new Date(desde.getTime() + HORAS_ESPERA * 3_600_000), compra.zonaCasa, HORA_ALBUM_TRAS_FRANJA).toISOString();
}

const mensaje = (id: string, compra: Compra, extra: Record<string, string> = {}): SalidaAlbum => ({
  tipo: 'mensaje',
  mensaje: { ids: [id], texto: renderizar(porId(id, idiomaDe(compra)).texto, { ...datosDeCompra(compra), ...extra }) },
});

/** El álbum recién abierto: salió AL1 (o AL1-P) en `al1En`. */
export function iniciarAlbum(al1En: Date, compra: Compra): EstadoAlbum {
  return { fase: 'juntando', fotos: 0, ids: [], recibidas: 0, al2Mandados: 0, vence: en5Horas(al1En, compra) };
}

function conFotos(estado: EstadoAlbum, ev: { cantidad?: number; ids?: string[] }): EstadoAlbum {
  const nuevas = ev.ids ?? Array.from({ length: ev.cantidad ?? 1 }, (_, k) => `f${estado.recibidas + k + 1}`);
  const ids = [...estado.ids, ...nuevas];
  return { ...estado, ids, fotos: ids.length, recibidas: estado.recibidas + nuevas.length };
}

/** DES (con DES+ si todavía sobran): se quedan las primeras N. */
function cerrar(estado: EstadoAlbum, compra: Compra): Paso {
  const quedan = estado.ids.slice(0, compra.fotosAlbum);
  return {
    estado: { ...estado, fase: 'cerrado', vence: null },
    salidas: [
      { tipo: 'mensaje', mensaje: despedida(compra, estado.fotos) },
      { tipo: 'cerrado', guardadas: quedan.length, descartadas: estado.fotos - quedan.length, quedan },
    ],
  };
}

/** Al cerrar: si sobran fotos, primero AL3 (una sola vez); si no, DES. */
function cerrarOElegir(estado: EstadoAlbum, en: Date, compra: Compra): Paso {
  if (estado.fotos <= compra.fotosAlbum) return cerrar(estado, compra);
  return {
    estado: { ...estado, fase: 'eligiendo', vence: en5Horas(en, compra) },
    salidas: [mensaje('AL3', compra, { fotos_mandadas: String(estado.fotos) })],
  };
}

const AVISO_CERO = 'El álbum lleva 5 horas sin fotos: cero fotos. La despedida espera tu decisión.';

function avisarNaza(estado: EstadoAlbum): Paso {
  return { estado: { ...estado, fase: 'esperando-naza', vence: null }, salidas: [{ tipo: 'avisar-naza', motivo: AVISO_CERO }] };
}

/** Después de un AL2, un "no" o más fotos: si queda AL2, se vuelve a juntar; si no, última espera. */
function otraVuelta(estado: EstadoAlbum, en: Date, compra: Compra): EstadoAlbum {
  return { ...estado, fase: estado.al2Mandados < MAX_AL2 ? 'juntando' : 'ultima-espera', vence: en5Horas(en, compra) };
}

export function pasoAlbum(estado: EstadoAlbum, evento: EventoAlbum, compra: Compra): Paso {
  const nada: Paso = { estado, salidas: [] };

  if (estado.fase === 'cerrado') {
    if (evento.tipo !== 'foto') return nada;
    return { estado, salidas: [{ tipo: 'al-panel', cantidad: evento.ids?.length ?? evento.cantidad ?? 1 }] };
  }

  if (estado.fase === 'eligiendo') {
    switch (evento.tipo) {
      case 'reenvio': {
        const saca = new Set(evento.ids);
        const ids = estado.ids.filter((id) => !saca.has(id));
        const e = { ...estado, ids, fotos: ids.length };
        if (e.fotos <= compra.fotosAlbum) return cerrar(e, compra);
        return { estado: { ...e, vence: en5Horas(evento.en, compra) }, salidas: [] };
      }
      case 'reloj':
        if (estado.vence === null || evento.en.getTime() < Date.parse(estado.vence)) return nada;
        return cerrar(estado, compra);
      case 'naza-cierra':
        return nada;
      case 'foto':
        return cerrar(conFotos(estado, evento), compra);
      default:
        // "Otra cosa" (listo, sí, no, un texto): quedan las primeras N.
        return cerrar(estado, compra);
    }
  }

  switch (evento.tipo) {
    case 'foto': {
      const e = conFotos(estado, evento);
      if (estado.fase === 'esperando-al2') return { estado: otraVuelta(e, evento.en, compra), salidas: [] };
      if (estado.fase === 'esperando-naza') return { estado: { ...e, fase: 'juntando', vence: en5Horas(evento.en, compra) }, salidas: [] };
      return { estado: { ...e, vence: en5Horas(evento.en, compra) }, salidas: [] };
    }
    case 'listo':
      if (estado.fotos === 0) return estado.fase === 'esperando-naza' ? nada : avisarNaza(estado);
      return cerrarOElegir(estado, evento.en, compra);
    case 'si':
      return estado.fase === 'esperando-al2' ? cerrarOElegir(estado, evento.en, compra) : nada;
    case 'no':
      return estado.fase === 'esperando-al2' ? { estado: otraVuelta(estado, evento.en, compra), salidas: [] } : nada;
    case 'otra':
    case 'reenvio':
      return nada;
    case 'naza-cierra':
      return estado.fase === 'esperando-naza' ? cerrar(estado, compra) : nada;
    case 'reloj': {
      if (estado.vence === null || evento.en.getTime() < Date.parse(estado.vence)) return nada;
      if (estado.fase === 'esperando-al2' || estado.fase === 'ultima-espera') return cerrarOElegir(estado, evento.en, compra);
      if (estado.fase !== 'juntando') return nada;
      if (estado.fotos === 0) return avisarNaza(estado);
      // AL2 sale ahora (cuando llega el reloj, aunque llegue tarde): el plazo nuevo corre desde acá.
      return {
        estado: { ...estado, fase: 'esperando-al2', al2Mandados: estado.al2Mandados + 1, vence: en5Horas(evento.en, compra) },
        salidas: [mensaje('AL2', compra)],
      };
    }
  }
}
