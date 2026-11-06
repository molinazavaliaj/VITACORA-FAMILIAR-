// El aviso de dudas a quien contó dentro de la ventana de 24 horas (plan 2026-11-06-dudas-narrador-sobre-212). El link va
// al final. Fuera de la ventana sale la plantilla de Meta (PLANTILLAS_REVISION en config.ts). El recordatorio usa este mismo texto.

import type { Idioma } from '../v3/nucleo/entrevista/idioma.js';

export const TEXTOS_REVISION: Readonly<Record<Idioma, { dudas: string }>> = {
  'es-AR': {
    dudas: 'Antes de escribir tu libro nos quedaron unas últimas preguntas sobre lo que contaste. Un nombre que no se entendió, una fecha. Las podés contestar desde este enlace.',
  },
  'es-ES': {
    dudas: 'Antes de escribir tu libro nos han quedado unas últimas preguntas sobre lo que contaste. Un nombre que no se entendió, una fecha. Puedes contestarlas desde este enlace.',
  },
  ca: {
    dudas: "Abans d'escriure el teu llibre ens han quedat unes últimes preguntes sobre el que vas explicar. Un nom que no es va entendre, una data. Les pots contestar des d'aquest enllaç.",
  },
};
