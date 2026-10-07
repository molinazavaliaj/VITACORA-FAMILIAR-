// Dependencias de prueba: la base falsa, un WhatsApp que anota lo que sale (y
// puede fallar N veces), una transcripción que devuelve el texto del "audio"
// (el mediaId ES el texto: así los tests y la simulación no gastan nada) y un
// reloj que se mueve a mano. "FALLA" tira; "VACIO" transcribe vacío.

import type { DepsV3 } from '../../src/v3/deps.js';
import type { ClienteModelo } from '../../src/v3/nucleo/entrevista/cazador.js';
import type { BaseFalsa } from './base-falsa.js';

export type Enviado = {
  a: string;
  tipo: 'texto' | 'botones' | 'plantilla';
  texto?: string;
  botones?: string[];
  plantilla?: string;
  idiomaMeta?: string;
  variables?: string[];
};

export function depsDePrueba(base: BaseFalsa, o: { ahora?: Date; fallarEnvios?: number; cazador?: ClienteModelo | null } = {}) {
  const enviados: Enviado[] = [];
  const avisos: { clave: string; asunto: string; detalle: string }[] = [];
  const hitos: string[] = [];
  let reloj = o.ahora ?? new Date('2026-10-08T13:00:00Z');
  let fallas = o.fallarEnvios ?? 0;
  let n = 0;
  const salir = (e: Enviado): Promise<string> => {
    if (fallas > 0) {
      fallas--;
      return Promise.reject(new Error('WhatsApp rechazó el envío: prueba'));
    }
    enviados.push(e);
    return Promise.resolve(`wamid.prueba.${++n}`);
  };
  const deps: DepsV3 = {
    db: base.cliente,
    wa: {
      texto: (a, texto) => salir({ a, tipo: 'texto', texto }),
      botones: (a, texto, botones) => salir({ a, tipo: 'botones', texto, botones }),
      plantilla: (a, plantilla, idiomaMeta, variables) => salir({ a, tipo: 'plantilla', plantilla, idiomaMeta, variables }),
      descargar: async (mediaId) => Buffer.from(mediaId, 'utf8'),
    },
    transcribir: async (audio) => {
      const t = audio.toString('utf8');
      if (t === 'FALLA') throw new Error('La transcripción falló: prueba');
      return { texto: t === 'VACIO' ? '' : t, duracionSegundos: 30 };
    },
    avisar: async (clave, asunto, detalle) => { avisos.push({ clave, asunto, detalle }); },
    hito: async (narradorId, hito) => { hitos.push(`${narradorId}:${hito}`); },
    cazador: o.cazador ?? null,
    ahora: () => reloj,
  };
  return {
    deps, enviados, avisos, hitos,
    pasar(ms: number) { reloj = new Date(reloj.getTime() + ms); },
    fijar(fecha: Date) { reloj = fecha; },
    fallar(veces: number) { fallas = veces; },
  };
}
