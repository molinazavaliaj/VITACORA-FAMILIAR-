// Dependencias de prueba de Kids V2: la base falsa de la V3 (con `kids_v2`), un WhatsApp que anota lo que sale (con
// los botones), una transcripción que devuelve el "audio" (el mediaId ES el texto; "FALLA" tira, "VACIO" transcribe
// vacío) y un reloj que se mueve a mano. Nada gasta. Chicos INVENTADOS.

import type { DepsKids } from '../../src/kids-v2/deps.js';
import type { Ficha } from '../../src/kids-v2/nucleo/compra.js';
import type { MensajeEntrante } from '../../src/whatsapp/webhook.js';
import { crearBaseFalsa, type BaseFalsa } from '../v3/base-falsa.js';

export type EnviadoKids = {
  a: string;
  tipo: 'texto' | 'botones' | 'plantilla';
  wamid: string;
  texto?: string;
  botones?: string[];
  plantilla?: string;
  idiomaMeta?: string;
  variables?: string[];
};

export function depsKidsDePrueba(base: BaseFalsa, o: { ahora?: Date; fallarEnvios?: number } = {}) {
  const enviados: EnviadoKids[] = [];
  const avisos: { clave: string; asunto: string; detalle: string }[] = [];
  let reloj = o.ahora ?? new Date('2026-11-02T15:00:00Z'); // lunes, 12:00 en Buenos Aires
  let fallas = o.fallarEnvios ?? 0;
  let n = 0;
  const salir = (e: Omit<EnviadoKids, 'wamid'>): Promise<string> => {
    if (fallas > 0) {
      fallas--;
      return Promise.reject(new Error('WhatsApp rechazó el envío: prueba'));
    }
    const wamid = `wamid.salida.${++n}`;
    enviados.push({ ...e, wamid });
    return Promise.resolve(wamid);
  };
  const deps: DepsKids = {
    db: base.cliente,
    wa: {
      texto: (a, texto) => salir({ a, tipo: 'texto', texto }),
      botones: (a, texto, botones) => salir({ a, tipo: 'botones', texto, botones }),
      plantilla: (a, plantilla, idiomaMeta, variables) => salir({ a, tipo: 'plantilla', plantilla, idiomaMeta, variables }),
      descargar: async (mediaId) => {
        if (mediaId === 'NO-BAJA') throw new Error('Meta no dio el audio: prueba');
        return Buffer.from(mediaId, 'utf8');
      },
    },
    transcribir: async (audio) => {
      const t = audio.toString('utf8');
      if (t === 'FALLA') throw new Error('La transcripción falló: prueba');
      return { texto: t === 'VACIO' ? '' : t, duracionSegundos: 40 };
    },
    avisar: async (clave, asunto, detalle) => { avisos.push({ clave, asunto, detalle }); },
    ahora: () => reloj,
  };
  return {
    deps, enviados, avisos,
    pasar(ms: number) { reloj = new Date(reloj.getTime() + ms); },
    fijar(fecha: Date) { reloj = fecha; },
    fallar(veces: number) { fallas = veces; },
  };
}

export const TEL_CHICO = '+5491150000001';
export const TEL_PADRE = '+5491150000002';

export const FICHA_A: Ficha = {
  nombre: 'Bruno Ibáñez',
  apodo: 'Bruno',
  genero: 'chico',
  edad: 11,
  quienRegala: 'tu mamá',
  canal: 'A',
  nombrePadre: 'Laura Ibáñez',
  linkPanel: 'vitacora.com/panel/bruno',
  hora: '18:00',
  zona: 'America/Argentina/Buenos_Aires',
  temasSacados: [],
  fotosConOtrosChicos: false,
  preguntasPadre: [],
};

/** La fila de kids_v2 como la crea la web al comprar, con los defaults de la migración (la base falsa no los pone a las filas iniciales). */
export function filaKidsNueva(narradorId: string, ficha: Partial<Ficha> & Pick<Ficha, 'canal'>) {
  return {
    narrador_id: narradorId, idioma: 'es-AR', canal: ficha.canal, telefono_padre: TEL_PADRE, ficha, estado: null, cambios_panel: null,
    cambios_error: null, avance: {}, marcas: [], version: 0, enviando_hasta: null, despertar_at: null,
    creada_at: '2026-11-01T12:00:00.000Z', empezo_at: null, termino_at: null,
  };
}

/** Una base con un chico pagado (narrador `invitado`) y su fila de kids_v2 sin arrancar. Canal B: el número de las preguntas es el del padre. */
export function baseConChico(o: { canal?: 'A' | 'B'; ficha?: Partial<Ficha>; estado?: string; contexto?: Record<string, unknown> } = {}) {
  const canal = o.canal ?? 'A';
  const ficha: Ficha = { ...FICHA_A, canal, ...o.ficha };
  const telefono = canal === 'A' ? TEL_CHICO : TEL_PADRE;
  return crearBaseFalsa({
    narradores: [{ id: 'k1', nombre: ficha.nombre, como_le_dicen: ficha.apodo, telefono_whatsapp: telefono, estado: o.estado ?? 'invitado', contexto: { modo: 'kids', ...o.contexto } }],
    kids_v2: [filaKidsNueva('k1', ficha)],
    respuestas: [],
    envios: [],
    fotos: [],
  });
}

export const CHICO = { id: 'k1', estado: 'activo', telefono_whatsapp: TEL_CHICO };

let nMsg = 0;
/** Un mensaje del número de las preguntas. */
export function llega(m: Partial<MensajeEntrante> & Pick<MensajeEntrante, 'tipo'>): MensajeEntrante {
  return { telefono: TEL_CHICO, waMessageId: `wamid.entrada.${++nMsg}`, ...m };
}
export const audio = (texto: string) => llega({ tipo: 'audio', mediaId: texto });
export const boton = (texto: string, citaA?: string) => llega({ tipo: 'texto', texto, esBoton: true, ...(citaA ? { citaA } : {}) });
