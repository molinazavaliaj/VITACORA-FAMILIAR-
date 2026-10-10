// Las dependencias de verdad de la V3: la base, WhatsApp de Meta, la
// transcripción de OpenAI en el idioma del narrador, los avisos por mail, los
// mails de hito y el cazador (si está prendido). Importa db/cliente.ts: solo
// se carga cuando hay un narrador V3 (import dinámico desde procesar.ts), así
// el flujo viejo no cambia.

import { cargarConfig } from '../config.js';
import { db } from '../db/cliente.js';
import { transcribir } from '../ia/transcribir.js';
import { mandarHito } from '../mail/hitos.js';
import { enviarBotones, enviarPlantilla, enviarTexto } from '../whatsapp/enviar.js';
import { descargarAudio } from '../whatsapp/media.js';
import { avisarSocios } from './avisos.js';
import { cazadorPrendido, clienteCazador } from './cazador.js';
import type { DepsV3 } from './deps.js';
import { IDIOMA_OPENAI, promptDeTranscripcion } from './nucleo/entrevista/transcribir.js';

/**
 * Cuánto se espera a Meta por un envío de la V3. La toma del turno dura 2
 * minutos y drenar deja de mandar al minuto: un pedido colgado no puede
 * pasarse de eso. El flujo viejo no lo usa.
 */
export const TIMEOUT_ENVIO_V3_MS = 20_000;

type NarradorParaMail = Parameters<typeof mandarHito>[0];

export function depsReales(): DepsV3 {
  const envio = { timeoutMs: TIMEOUT_ENVIO_V3_MS };
  return {
    db,
    wa: {
      texto: (telefono, texto) => enviarTexto(telefono, texto, envio),
      botones: (telefono, texto, botones) => enviarBotones(telefono, texto, botones, envio),
      plantilla: (telefono, nombre, idiomaMeta, variables) => enviarPlantilla(telefono, nombre, variables, idiomaMeta, envio),
      descargar: descargarAudio,
    },
    transcribir: (audio, o) => transcribir(audio, promptDeTranscripcion(o.nombre, o.idioma), o.narradorId, IDIOMA_OPENAI[o.idioma]),
    avisar: async (clave, asunto, detalle) => { await avisarSocios(clave, asunto, detalle); },
    hito: async (narradorId, hito) => {
      try {
        const { data } = await db.from('narradores').select('*').eq('id', narradorId).maybeSingle();
        if (data) await mandarHito(data as NarradorParaMail, hito);
      } catch (err) {
        console.error(`V3: no pude mandar el hito '${hito}' de ${narradorId}:`, err instanceof Error ? err.message : err);
      }
    },
    cazador: cazadorPrendido() ? clienteCazador(cargarConfig().anthropicKey) : null,
    ahora: () => new Date(),
  };
}
