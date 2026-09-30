// Cómo se arman los mensajes de WhatsApp de un turno (docs/v3/entrevista/
// banco.md, regla 4; Naza, 30/09, ronda 2): el acuse de la respuesta
// anterior va como primera línea del mensaje que sigue, salvo el acuse
// sobrio (M4), que va solo. La frase de entrada y la pregunta van en
// mensajes separados; M1 va al final del mensaje de la pregunta. Puro: recibe
// textos ya renderizados.

/** Las familias de acuse que devuelve `mensajesDespues`. */
export type FamiliaAcuse = 'M3' | 'M4' | 'M21' | 'M24';

/** ¿El acuse va solo, en su propio mensaje? Solo el sobrio (M4): después de algo difícil no se pega la pregunta siguiente. */
export function acuseVaAparte(familia: FamiliaAcuse): boolean {
  return familia === 'M4';
}

export type Turno = {
  /** El acuse de la respuesta anterior, ya renderizado (si hay). */
  acuse?: string;
  /** De qué familia es el acuse (decide si va pegado o solo). */
  familia?: FamiliaAcuse;
  /** La frase de entrada del bloque (EN2…), ya renderizada, si es la primera pregunta del bloque. */
  entrada?: string;
  /** La pregunta (o el aviso, o el final), ya renderizada. */
  pregunta: string;
  /** M1 renderizado, si la pregunta lo lleva. */
  m1?: string;
};

/** Los mensajes de WhatsApp de un turno, en orden. */
export function armarTurno(t: Turno): string[] {
  const pregunta = t.m1 ? `${t.pregunta}\n${t.m1}` : t.pregunta;
  const siguientes = t.entrada ? [t.entrada, pregunta] : [pregunta];
  if (!t.acuse) return siguientes;
  if (t.familia && acuseVaAparte(t.familia)) return [t.acuse, ...siguientes];
  return [`${t.acuse}\n${siguientes[0]}`, ...siguientes.slice(1)];
}
