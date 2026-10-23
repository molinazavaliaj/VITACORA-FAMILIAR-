// Recorre la entrevista de historia de punta a punta con unas respuestas
// dadas, para los tests, la simulación y la lectura corrida. Copia de
// src/v3/entrevista/seleccion.ts sin lo de V3 (la ronda extra, la familia, la
// segunda oportunidad y el listado de todo lo que PODRÍA llegar, que en
// historia es `bancoHistoria`). Puro.

import { bancoHistoria, type BancoEntrevista } from './banco.js';
import { FIN, siguientePregunta, type EstadoEntrevista, type Respuesta } from './flujo.js';
import { renderizar, type FichaTexto } from './texto.js';

/** Qué contesta: todo con una historia, "paso" en todo, o lo que diga la función (sin respuesta propia, cuenta algo). */
export type Contesta = 'todo' | 'paso' | ((clave: string) => Respuesta | undefined);

export type OpcionesRecorrido = {
  ficha: FichaTexto;
  /** El banco del narrador; si no viene, `bancoHistoria(ficha.tema, ficha.idioma, { temaAbierto })`. */
  banco?: BancoEntrevista;
  /** Default: 'todo'. */
  contesta?: Contesta;
  temaAbierto?: boolean;
  /** Las preguntas de quien regala, en el orden de la compra. */
  propias?: readonly string[];
};

/** Un mensaje de la entrevista, renderizado. `clave` es lo que se guarda (ID del banco, FOTO-H, PR-H1…, FIN-H). */
export type PasoRecorrido = {
  tipo: 'pregunta' | 'foto' | 'propia' | 'fin';
  clave: string;
  texto: string;
  /** M1 debajo (solo preguntas). */
  conM1?: boolean;
  /** Lo que contestó (FIN-H no espera respuesta). */
  respuesta?: Respuesta;
};

const CUENTA = 'Sí, te cuento: fue una historia larga que me acuerdo muy bien.';

function responder(contesta: Contesta, clave: string): Respuesta {
  if (contesta === 'todo') return CUENTA;
  if (contesta === 'paso') return 'paso';
  return contesta(clave) ?? CUENTA;
}

/**
 * Recorre la entrevista con `siguientePregunta`, contestando con `contesta`.
 * Cada texto se renderiza con lo contestado hasta ese momento (así FIN-H
 * elige según FOTO-H). No lleva cola de repreguntas: el cazador llama al
 * modelo y acá no hay modelo.
 */
export function recorrerEntrevista(o: OpcionesRecorrido): PasoRecorrido[] {
  const banco = o.banco ?? bancoHistoria(o.ficha.tema, o.ficha.idioma, { temaAbierto: o.temaAbierto });
  const mensaje = new Map(banco.mensajes.map((m) => [m.id, m.texto]));
  const texto = (id: string) => {
    const t = mensaje.get(id);
    if (t === undefined) throw new Error(`recorrerEntrevista: el banco no tiene el mensaje ${id}`);
    return t;
  };
  const contesta = o.contesta ?? 'todo';
  const respuestas = new Map<string, Respuesta>();
  const enviados = new Set<string>();
  const estado: EstadoEntrevista = { respuestas, enviados, tema: o.ficha.tema, temaAbierto: o.temaAbierto, propias: o.propias, idioma: o.ficha.idioma };
  const pasos: PasoRecorrido[] = [];
  const contestar = (paso: Omit<PasoRecorrido, 'respuesta'>) => {
    const respuesta = responder(contesta, paso.clave);
    respuestas.set(paso.clave, respuesta);
    pasos.push({ ...paso, respuesta });
  };
  for (let vuelta = 0; vuelta < 1000; vuelta++) {
    const s = siguientePregunta(estado, banco.preguntas);
    switch (s.tipo) {
      case 'terminada':
        return pasos;
      case 'repregunta':
        throw new Error('recorrerEntrevista: no lleva cola de repreguntas');
      case 'fin':
        enviados.add(FIN);
        pasos.push({ tipo: 'fin', clave: FIN, texto: renderizar(texto(FIN), o.ficha, respuestas) });
        break;
      case 'foto':
        contestar({ tipo: 'foto', clave: s.clave, texto: renderizar(texto(s.clave), o.ficha, respuestas) });
        break;
      case 'propia':
        contestar({ tipo: 'propia', clave: s.clave, texto: renderizar(texto(s.clave), o.ficha, respuestas, { pregunta: s.pregunta }) });
        break;
      case 'pregunta':
        contestar({ tipo: 'pregunta', clave: s.pregunta.id, texto: renderizar(s.pregunta.texto, o.ficha, respuestas), conM1: s.conM1 });
        break;
    }
  }
  throw new Error('recorrerEntrevista: más de 1000 vueltas (¿algo que nunca queda hecho?)');
}

/** Las claves de lo que se le pregunta (todo lo que espera respuesta), en orden: preguntas, FOTO-H y PR-H. */
export function simularRecorrido(o: OpcionesRecorrido): string[] {
  return recorrerEntrevista(o)
    .filter((p) => p.tipo !== 'fin')
    .map((p) => p.clave);
}
