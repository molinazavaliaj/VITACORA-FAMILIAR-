// El aviso de dudas a quien contó dentro de la ventana de 24 horas (plan 2026-11-06-dudas-narrador-sobre-212). El link va
// al final. Fuera de la ventana sale la plantilla de Meta (PLANTILLAS_REVISION en config.ts). El recordatorio usa este mismo
// texto. `escribio`: la respuesta si escribe por WhatsApp teniendo dudas pendientes.

import type { Idioma } from '../v3/nucleo/entrevista/idioma.js';

export const TEXTOS_REVISION: Readonly<Record<Idioma, { dudas: string; escribio: string }>> = {
  'es-AR': {
    dudas: 'Antes de escribir tu libro nos quedaron unas últimas preguntas sobre lo que contaste. Un nombre que no se entendió, una fecha. Las podés contestar desde este enlace.',
    escribio: 'Gracias. Para que lo que nos digas entre en el libro, contestá las preguntas desde este enlace, escribiendo o dictando con el micrófono del teclado. {link}',
  },
  'es-ES': {
    dudas: 'Antes de escribir tu libro nos han quedado unas últimas preguntas sobre lo que contaste. Un nombre que no se entendió, una fecha. Puedes contestarlas desde este enlace.',
    escribio: 'Gracias. Para que lo que nos digas entre en el libro, contesta las preguntas desde este enlace, escribiendo o dictando con el micrófono del teclado. {link}',
  },
  ca: {
    dudas: "Abans d'escriure el teu llibre ens han quedat unes últimes preguntes sobre el que vas explicar. Un nom que no es va entendre, una data. Les pots contestar des d'aquest enllaç.",
    escribio: "Gràcies. Perquè el que ens diguis entri al llibre, contesta les preguntes des d'aquest enllaç, escrivint o dictant amb el micròfon del teclat. {link}",
  },
};
