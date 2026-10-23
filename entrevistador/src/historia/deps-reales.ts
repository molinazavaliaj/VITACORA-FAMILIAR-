// Las dependencias de verdad de historia (copia de src/v3/deps-reales.ts): la base, WhatsApp de Meta, la
// transcripción de OpenAI en el idioma del narrador, los avisos por mail, los mails de hito y el cazador (si está
// prendido). Importa db/cliente.ts: solo se carga cuando hay un narrador de historia (import dinámico desde
// procesar.ts y scheduler.ts), así el resto no cambia.

import { cargarConfig } from '../config.js';
import { db } from '../db/cliente.js';
import { transcribir } from '../ia/transcribir.js';
import { mandarHito } from '../mail/hitos.js';
import { enviarBotones, enviarPlantilla, enviarTexto } from '../whatsapp/enviar.js';
import { descargarAudio } from '../whatsapp/media.js';
import { avisarSocios } from '../v3/avisos.js';
import { cazadorPrendido, clienteCazador } from './cazador.js';
import type { DepsHistoria } from './deps.js';
import { IDIOMA_OPENAI, promptDeTranscripcion } from './nucleo/entrevista/transcribir.js';

/** Cuánto se espera a Meta por un envío: el mismo tope que TIMEOUT_ENVIO_V3_MS (la toma dura 2 minutos y drenar deja de mandar al minuto). */
export const TIMEOUT_ENVIO_HISTORIA_MS = 20_000;

type NarradorParaMail = Parameters<typeof mandarHito>[0];

export function depsHistoriaReales(): DepsHistoria {
  const envio = { timeoutMs: TIMEOUT_ENVIO_HISTORIA_MS };
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
        console.error(`historia: no pude mandar el hito '${hito}' de ${narradorId}:`, err instanceof Error ? err.message : err);
      }
    },
    cazador: cazadorPrendido() ? clienteCazador(cargarConfig().anthropicKey) : null,
    ahora: () => new Date(),
  };
}
