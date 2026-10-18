// Dependencias de prueba de la Viaje V2: la base falsa de la V3, un WhatsApp que anota lo que sale (con la ❤️), una
// transcripción que devuelve el "audio" (el mediaId ES el texto; "FALLA" tira, "VACIO" transcribe vacío) y un
// reloj que se mueve a mano. Nada gasta.

import type { DepsViaje } from '../../src/viaje-v2/deps.js';
import type { BaseFalsa } from '../v3/base-falsa.js';

export type EnviadoViaje = {
  a: string;
  tipo: 'texto' | 'plantilla' | 'reaccion';
  texto?: string;
  plantilla?: string;
  idiomaMeta?: string;
  variables?: string[];
  aMensaje?: string;
  emoji?: string;
};

export function depsViajeDePrueba(base: BaseFalsa, o: { ahora?: Date; fallarEnvios?: number } = {}) {
  const enviados: EnviadoViaje[] = [];
  const avisos: { clave: string; asunto: string; detalle: string }[] = [];
  const mailsSi: string[] = [];
  let reloj = o.ahora ?? new Date('2026-11-01T13:00:00Z');
  let fallas = o.fallarEnvios ?? 0;
  let n = 0;
  const salir = (e: EnviadoViaje): Promise<string> => {
    if (fallas > 0) {
      fallas--;
      return Promise.reject(new Error('WhatsApp rechazó el envío: prueba'));
    }
    enviados.push(e);
    return Promise.resolve(`wamid.salida.${++n}`);
  };
  const deps: DepsViaje = {
    db: base.cliente,
    wa: {
      texto: (a, texto) => salir({ a, tipo: 'texto', texto }),
      plantilla: (a, plantilla, idiomaMeta, variables) => salir({ a, tipo: 'plantilla', plantilla, idiomaMeta, variables }),
      reaccion: (a, aMensaje, emoji) => salir({ a, tipo: 'reaccion', aMensaje, emoji }),
      descargar: async (mediaId) => {
        if (mediaId === 'NO-BAJA') throw new Error('Meta no dio el audio: prueba');
        return Buffer.from(mediaId, 'utf8');
      },
    },
    transcribir: async (audio) => {
      const t = audio.toString('utf8');
      if (t === 'FALLA') throw new Error('La transcripción falló: prueba');
      return { texto: t === 'VACIO' ? '' : t, duracionSegundos: 30 };
    },
    avisar: async (clave, asunto, detalle) => { avisos.push({ clave, asunto, detalle }); },
    mailSi: async (narradorId) => { mailsSi.push(narradorId); },
    ahora: () => reloj,
  };
  return {
    deps, enviados, avisos, mailsSi,
    pasar(ms: number) { reloj = new Date(reloj.getTime() + ms); },
    fijar(fecha: Date) { reloj = fecha; },
    fallar(veces: number) { fallas = veces; },
  };
}
