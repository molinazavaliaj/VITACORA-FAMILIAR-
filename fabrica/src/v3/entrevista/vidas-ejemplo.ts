// Vidas de ejemplo para recorrer la entrevista (metodo-entrevista.md,
// "Bloque 6, arreglo para quien se separó o enviudó y rehízo su vida"; desde
// la prueba de Naza en la página, 30/09, el bloque 6 pregunta primero
// "¿Hoy estás en pareja?": AMH).
// INVENTADAS: nunca usar la vida de un narrador real. Solo traen las
// respuestas que abren temas; al resto el simulador contesta "Sí, te cuento…".

import { respuestaDeBoton } from './respuesta.js';
import type { FichaTexto } from './texto.js';

export type VidaEjemplo = {
  clave:
    | 'sigue-con-la-primera'
    | 'separada-sola'
    | 'separada-de-nuevo-en-pareja'
    | 'viuda-sola'
    | 'viuda-rehizo'
    | 'muchas-parejas'
    | 'madre-soltera'
    | 'nunca-pareja-con-hijos'
    | 'nunca-pareja-sin-hijos';
  nombre: string;
  ficha: FichaTexto;
  respuestas: Record<string, string>;
};

const CONTO = 'Sí, fue una historia larga que te cuento con todos los detalles que me acuerdo.';

/** Hermanos, se mudó, hijos y nietos: lo que tiene una vida completa. */
const FAMILIA_COMPLETA = {
  CA6: 'Sí, éramos cuatro y con el más chico hicimos de todo en el patio.',
  JU8: 'Sí, a los veinte me fui a otra ciudad a buscar trabajo con una valija.',
  HI0: 'Sí, dos hijos, un varón y una nena, que hoy ya son grandes.',
  HI8: 'Sí, el primero nació un invierno y fui corriendo al hospital a conocerlo.',
};

const SIGUE = respuestaDeBoton('Sí, estoy en pareja');
const YA_NO_ESTA = respuestaDeBoton('No estoy en pareja');
const FUE_LA_UNICA = respuestaDeBoton('Fue la única');

export const VIDAS_EJEMPLO: readonly VidaEjemplo[] = [
  {
    clave: 'sigue-con-la-primera',
    nombre: 'Rogelio, sigue con su primera pareja',
    ficha: { nombre: 'Rogelio', genero: 'varon' },
    respuestas: { ...FAMILIA_COMPLETA, AM0: 'Una sola vez, con Marta, desde los veinte años hasta hoy.', AMH: SIGUE, AM21: FUE_LA_UNICA },
  },
  {
    clave: 'separada-sola',
    nombre: 'Elvira, se separó y sigue sola',
    ficha: { nombre: 'Elvira', genero: 'mujer' },
    respuestas: {
      ...FAMILIA_COMPLETA,
      AM0: 'Me enamoré dos veces, pero en serio fue una, con el padre de mis hijos.',
      AMH: 'Ya no, nos separamos hace muchos años.',
      AM9: CONTO,
      AM19: 'Sí, desde entonces vivo sola y armé mi rutina con mis amigas del barrio.',
      AM21: 'No, en serio fue esa sola.',
    },
  },
  {
    clave: 'separada-de-nuevo-en-pareja',
    nombre: 'Norma, se separó y se juntó de nuevo',
    ficha: { nombre: 'Norma', genero: 'mujer' },
    respuestas: {
      ...FAMILIA_COMPLETA,
      AM0: 'Dos veces en serio: mi primer marido y el compañero que tengo hoy.',
      AMH: 'Sí, a Julio lo conocí en un baile de jubilados y hace diez años que estamos juntos.',
      AM21: 'Sí, mi primer marido: te cuento el verano que fuimos al mar con los chicos.',
    },
  },
  {
    clave: 'viuda-sola',
    nombre: 'Amalia, enviudó y sigue sola (un solo amor)',
    ficha: { nombre: 'Amalia', genero: 'mujer' },
    respuestas: {
      ...FAMILIA_COMPLETA,
      AM0: 'Una sola vez, con mi marido, cuarenta años juntos.',
      AMH: YA_NO_ESTA,
      AM9: 'Él se enfermó hace cinco años y lo cuidé hasta el final, te lo cuento despacio.',
      AM19: 'Sí, ahora vivo sola, con la radio y las visitas de mis nietos los domingos.',
      AM21: FUE_LA_UNICA,
    },
  },
  {
    clave: 'viuda-rehizo',
    nombre: 'Beatriz, enviudó y rehízo su vida',
    ficha: { nombre: 'Beatriz', genero: 'mujer' },
    respuestas: {
      ...FAMILIA_COMPLETA,
      AM0: 'Dos amores en serio: mi marido, que falleció, y Raúl, que llegó después.',
      AMH: 'Sí, con Raúl; lo conocí en el club y ahora compartimos todo.',
      AM21: 'Sí, mi marido, que falleció de repente; te cuento una tarde de domingo con él.',
    },
  },
  {
    clave: 'muchas-parejas',
    nombre: 'Estela, muchas parejas y hoy con Hugo',
    ficha: { nombre: 'Estela', genero: 'mujer' },
    respuestas: {
      ...FAMILIA_COMPLETA,
      AM0: 'Muchas: dos casamientos, varios noviazgos, y hoy estoy con Hugo.',
      AMH: SIGUE,
      AM21: respuestaDeBoton('Sí, hubo otras'),
    },
  },
  {
    clave: 'madre-soltera',
    nombre: 'Rosa, madre soltera; la última, un noviazgo que terminó',
    ficha: { nombre: 'Rosa', genero: 'mujer' },
    respuestas: {
      ...FAMILIA_COMPLETA,
      AM0: 'Dos noviazgos en serio; el último fue con el padre de mi hija.',
      AMH: YA_NO_ESTA,
      AM3: respuestaDeBoton('No llegamos a eso'),
      AM9: CONTO,
      AM21: 'Sí, el primero, de la juventud: te cuento un baile de carnaval.',
      HI0: 'Sí, una hija, que crié sola.',
    },
  },
  {
    clave: 'nunca-pareja-con-hijos',
    nombre: 'Celia, nunca tuvo pareja y crió a un hijo',
    ficha: { nombre: 'Celia', genero: 'mujer' },
    respuestas: { ...FAMILIA_COMPLETA, AM0: 'No, nunca hubo nadie en serio.', HI8: 'No, todavía no.' },
  },
  {
    clave: 'nunca-pareja-sin-hijos',
    nombre: 'Horacio, nunca tuvo pareja ni hijos',
    ficha: { nombre: 'Horacio', genero: 'varon' },
    respuestas: { CA6: 'No, fui hijo único.', JU8: 'No, siempre viví en el mismo pueblo.', AM0: 'No.', HI0: 'No, no tuve.', HI8: 'No.' },
  },
];
