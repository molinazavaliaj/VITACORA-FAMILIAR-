// Qué preguntas le pueden llegar a una persona, para el simulador y el
// recuento. Sin respuestas no se sabe qué temas se abren (la ficha no decide
// qué se manda), así que `preguntasDelNucleo` y `preguntasCompletas` dan todo
// lo que PODRÍA llegar; `simularRecorrido` da lo que llega de verdad con unas
// respuestas dadas. Puro.

import { BANCO, type PreguntaEntrevista } from './banco.js';
import { siguientePregunta, type EstadoEntrevista, type PreguntaFamilia, type Respuesta } from './flujo.js';
import { renderizar, type FichaTexto, type OpcionesTexto } from './texto.js';

export type PreguntaRenderizada = Pick<PreguntaEntrevista, 'id' | 'bloque' | 'orden' | 'parte' | 'clase' | 'sensible'> & {
  texto: string;
};

function render(p: PreguntaEntrevista, ficha: FichaTexto, respuestas?: ReadonlyMap<string, Respuesta>, opciones?: OpcionesTexto): PreguntaRenderizada {
  const { id, bloque, orden, parte, clase, sensible } = p;
  return { id, bloque, orden, parte, clase, sensible, texto: renderizar(p.texto, ficha, respuestas, opciones) };
}

/** Todo el núcleo, en orden de banco (con las alternativas: AM15 y HI10, AM13/AM16/AM19…). */
export function preguntasDelNucleo(ficha: FichaTexto, opciones?: OpcionesTexto): PreguntaRenderizada[] {
  return BANCO.filter((p) => p.parte === 'nucleo').map((p) => render(p, ficha, undefined, opciones));
}

/** Todo el banco (núcleo y extra), en orden de banco. */
export function preguntasCompletas(ficha: FichaTexto, opciones?: OpcionesTexto): PreguntaRenderizada[] {
  return BANCO.map((p) => render(p, ficha, undefined, opciones));
}

/** ¿Es una pregunta de historia a los fines del recuento? (la foto cuenta como pregunta; cierres, aviso y final no). */
export function cuentaComoPregunta(p: Pick<PreguntaEntrevista, 'clase'>): boolean {
  return p.clase === 'historia' || p.clase === 'foto';
}

export type PasoRecorrido =
  | { tipo: 'pregunta'; pregunta: PreguntaRenderizada; respuesta?: Respuesta }
  | { tipo: 'familia'; pregunta: PreguntaFamilia; respuesta: Respuesta }
  | { tipo: 'ofrecer-extra'; acepta: boolean };

export type OpcionesRecorrido = OpcionesTexto & {
  aceptaExtra?: boolean; // default: no
  ofrecerExtra?: boolean; // default: no (por ahora no se ofrece); aceptaExtra: true la ofrece
  familia?: readonly PreguntaFamilia[];
};

/**
 * Recorre la entrevista entera con `siguientePregunta`, contestando con
 * `responder` (sin respuesta propia para una pregunta → "Sí, te cuento…").
 * El texto de cada pregunta se renderiza con lo contestado hasta ese momento
 * (así AM7 elige "repite" o "repetía").
 */
export function simularRecorrido(
  ficha: FichaTexto,
  responder: (id: string) => Respuesta | undefined,
  opciones: OpcionesRecorrido = {},
): PasoRecorrido[] {
  const respuestas = new Map<string, Respuesta>();
  const enviados = new Set<string>();
  const estado: EstadoEntrevista = { respuestas, enviados, rondaExtra: opciones.ofrecerExtra || opciones.aceptaExtra ? 'sin-ofrecer' : 'rechazada', familia: opciones.familia };
  const pasos: PasoRecorrido[] = [];
  for (let vuelta = 0; vuelta < 1000; vuelta++) {
    const s = siguientePregunta(estado);
    if (s.tipo === 'terminada') return pasos;
    if (s.tipo === 'ofrecer-extra') {
      const acepta = opciones.aceptaExtra ?? false;
      estado.rondaExtra = acepta ? 'aceptada' : 'rechazada';
      pasos.push({ tipo: 'ofrecer-extra', acepta });
      continue;
    }
    if (s.tipo === 'familia') {
      const r = responder(s.pregunta.id) ?? 'Sí, te cuento.';
      respuestas.set(s.pregunta.id, r);
      pasos.push({ tipo: 'familia', pregunta: s.pregunta, respuesta: r });
      continue;
    }
    const pregunta = render(s.pregunta, ficha, respuestas, opciones);
    if (!s.esperaRespuesta) {
      enviados.add(s.pregunta.id);
      pasos.push({ tipo: 'pregunta', pregunta });
      continue;
    }
    const r = responder(s.pregunta.id) ?? 'Sí, te cuento: fue una historia larga que me acuerdo muy bien.';
    respuestas.set(s.pregunta.id, r);
    pasos.push({ tipo: 'pregunta', pregunta, respuesta: r });
  }
  throw new Error('simularRecorrido: más de 1000 vueltas (¿una pregunta que nunca queda hecha?)');
}
