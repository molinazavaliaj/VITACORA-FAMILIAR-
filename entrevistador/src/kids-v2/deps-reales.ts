// Las dependencias de verdad de Kids V2: la base, WhatsApp de Meta (con los botones de respuesta rápida), la
// transcripción de OpenAI en castellano rioplatense y los avisos a los socios. Importa db/cliente.ts: solo se carga
// cuando hay un chico de Kids (import dinámico desde procesar.ts y el scheduler).

import { db } from '../db/cliente.js';
import { transcribir } from '../ia/transcribir.js';
import { avisarSocios } from '../v3/avisos.js';
import { TIMEOUT_ENVIO_V3_MS } from '../v3/deps-reales.js';
import { IDIOMA_OPENAI, promptDeTranscripcion } from '../v3/nucleo/entrevista/transcribir.js';
import { enviarBotones, enviarPlantilla, enviarTexto } from '../whatsapp/enviar.js';
import { descargarAudio } from '../whatsapp/media.js';
import type { DepsKids } from './deps.js';

export function depsKidsReales(): DepsKids {
  const envio = { timeoutMs: TIMEOUT_ENVIO_V3_MS };
  return {
    db,
    wa: {
      texto: (telefono, texto) => enviarTexto(telefono, texto, envio),
      botones: (telefono, texto, botones) => enviarBotones(telefono, texto, botones, envio),
      plantilla: (telefono, nombre, idiomaMeta, variables) => enviarPlantilla(telefono, nombre, variables, idiomaMeta, envio),
      descargar: descargarAudio,
    },
    transcribir: (audio, o) => transcribir(audio, promptDeTranscripcion(o.nombre, 'es-AR'), o.narradorId, IDIOMA_OPENAI['es-AR']),
    avisar: async (clave, asunto, detalle) => { await avisarSocios(clave, asunto, detalle); },
    ahora: () => new Date(),
  };
}
