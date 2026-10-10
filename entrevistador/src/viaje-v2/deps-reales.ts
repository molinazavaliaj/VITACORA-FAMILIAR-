// Las dependencias de verdad de la Viaje V2: la base, WhatsApp de Meta (con la ❤️), la transcripción de OpenAI en
// el idioma del viaje y los avisos a los socios. Importa db/cliente.ts: solo se carga cuando hay un viajero V2
// (import dinámico desde procesar.ts y el scheduler).

import { db } from '../db/cliente.js';
import { mandarHito } from '../mail/hitos.js';
import { transcribir } from '../ia/transcribir.js';
import { avisarSocios } from '../v3/avisos.js';
import { TIMEOUT_ENVIO_V3_MS } from '../v3/deps-reales.js';
import { IDIOMA_OPENAI, promptDeTranscripcion } from '../v3/nucleo/entrevista/transcribir.js';
import { enviarPlantilla, enviarReaccion, enviarTexto } from '../whatsapp/enviar.js';
import { descargarAudio } from '../whatsapp/media.js';
import type { DepsViaje } from './deps.js';

export function depsViajeReales(): DepsViaje {
  const envio = { timeoutMs: TIMEOUT_ENVIO_V3_MS };
  return {
    db,
    wa: {
      texto: (telefono, texto) => enviarTexto(telefono, texto, envio),
      plantilla: (telefono, nombre, idiomaMeta, variables) => enviarPlantilla(telefono, nombre, variables, idiomaMeta, envio),
      reaccion: (telefono, waMessageId, emoji) => enviarReaccion(telefono, waMessageId, emoji, envio),
      descargar: descargarAudio,
    },
    transcribir: (audio, o) => transcribir(audio, promptDeTranscripcion(o.nombre, o.idioma), o.narradorId, IDIOMA_OPENAI[o.idioma]),
    avisar: async (clave, asunto, detalle) => { await avisarSocios(clave, asunto, detalle); },
    mailSi: async (narradorId) => {
      try {
        const { data } = await db.from('narradores').select('*').eq('id', narradorId).maybeSingle();
        if (data) await mandarHito(data as Parameters<typeof mandarHito>[0], 'acepto', { viaje: true });
      } catch (err) {
        console.error(`viaje V2: no pude mandar el «dijo que sí» de ${narradorId}:`, err instanceof Error ? err.message : err);
      }
    },
    ahora: () => new Date(),
  };
}
