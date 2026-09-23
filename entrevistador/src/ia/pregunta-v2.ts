import type Anthropic from '@anthropic-ai/sdk';
import type { Perfil } from './perfil.js';
import type { Tramo, Variable } from './plan-preguntas.js';
import { encargoDelBiografo, perfilEnTexto, tratoDelPerfil, controlarTexto } from './encargo-entrevista.js';

export { perfilEnTexto };

// La pregunta del día, v2 (biógrafo v2, 23/09 — EXPERIMENTO; el prompt es un BORRADOR para la
// reescritura final, que aprueba Naza). Cambia los tres ejes de Joaquín:
//
// - ENCARGO: hoy le pedimos "reescribila para que se note que lo escuchaste" sobre una pregunta
//   fija, y ante la duda "devolvé el original" —con el supuesto adentro—. Acá el encargo es
//   decidir cómo preguntarle esto a ESTA persona: el guion da el tema, no el texto.
// - ENTRADA: el perfil (quién es, su línea de tiempo, qué no sabemos) y cada respuesta CON la
//   pregunta que la originó. Sin la pregunta, Buenos Aires no existía para el modelo (C6).
// - CONTROL: lo que devuelve se revisa antes de mandarlo (trato, largo, que pregunte algo). El
//   prompt decía "tratalo de vos" y se obedecía la mitad de las veces; lo arregló mirar la
//   salida, no una regla más (C11).

const MODELO = 'claude-opus-5';

/**
 * El núcleo: los 21 temas fijos más la presentación (biógrafo v2, Task 3: antes eran 14 y
 * dejaban afuera la mitad de la vida — 35 a 75 años sin pregunta propia). `tema` es para el
 * biógrafo, no es el texto que se manda (salvo la presentación, que sí se manda casi tal cual
 * porque no hay margen para que el modelo la arruine el primer día). `tramo` es el tramo de
 * vida al que apunta (para el reparto de variables; null = puede caer en cualquiera); `bloque`
 * es dónde va en la secuencia (Task 4 arma el orden).
 */
export const NUCLEO = [
  { id: 'presentacion', tramo: null, bloque: 'presentacion', tema: 'Es el PRIMER mensaje: la bienvenida. Quién sos (el biógrafo que va a escribir el libro de su vida), cómo va a ser esto (una pregunta por día, se contesta con un audio cuando pueda, sin apuro), y lo que necesitás saber para escribirle bien: cómo prefiere que le hablen ({TRATOS}), {EDAD}cómo le dicen en casa (la edad se pregunta acá, solo si todavía no la sabemos). Entre 70 y 90 palabras, cálido, con ganas; que se pueda contestar con una línea o un audio corto. No es una pregunta del día: no preguntes todavía por su vida.' },
  { id: 'casa-infancia', tramo: 'infancia', bloque: 'inicio', tema: 'La casa donde pasó su infancia, como una escena: si cierra los ojos y entra por la puerta, qué ve, qué huele, quién está. Usá lo que la presentación ya sacó (el trato, cómo le dicen).' },
  { id: 'mapa-casas', tramo: null, bloque: 'inicio', tema: 'El mapa de su vida por las casas: después de aquella casa, para dónde fue la vida. Las casas en que vivió, una tras otra: en qué ciudad, con quién, hasta qué edad más o menos. Que se sienta como un recorrido, no como un formulario. Si todavía no sabés su edad, este es el lugar para que salga sola ("hasta qué edad, más o menos, en cada una").' },
  { id: 'mapa-capitulos', tramo: null, bloque: 'inicio', tema: 'Si su vida fuera un libro, cuáles serían sus capítulos: los grandes pedazos, y qué hizo que uno terminara y empezara otro.' },
  { id: 'padres', tramo: 'infancia', bloque: 'infancia', tema: 'Cómo eran su mamá y su papá (o quienes le criaron), cómo recuerda a cada uno.' },
  { id: 'con-quien-crecio', tramo: 'infancia', bloque: 'infancia', tema: 'Las personas con las que creció (hermanos, abuelos, quien haya estado en esa casa) y de dónde venía la familia: de qué pueblo, de qué país, cómo llegaron.' },
  { id: 'juegos', tramo: 'infancia', bloque: 'infancia', tema: 'A qué jugaba en la infancia y con quién; alguna escena que todavía le haga sonreír. Si la infancia fue dura: qué había, quién estaba, qué rescataba.' },
  { id: 'a-los-quince', tramo: 'juventud', bloque: 'juventud', tema: 'Qué hacía a los quince, dieciséis años cuando no estaba en la escuela ni trabajando: dónde, con quién, qué sonaba. En la ciudad donde vivía ENTONCES. Sin dar por hecho que salía.' },
  { id: 'primer-trabajo', tramo: 'juventud', bloque: 'juventud', tema: 'Su primer trabajo y su primer sueldo: cómo lo consiguió, qué hizo con esa plata.' },
  { id: 'amor', tramo: null, bloque: 'adulto joven', tema: 'El amor: si se enamoró, de quién, cómo fue. Sin dar por hecho que hubo pareja, boda ni de qué género; si no sabés, preguntá si hubo.' },
  { id: 'con-quien-hizo-su-vida', tramo: null, bloque: 'adulto joven', tema: 'Las personas con las que hizo su vida: pareja, hijos, o quienes fueron su familia. Quiénes son y cómo llegaron a su vida, no el festejo del casamiento. Si la ficha dice que no tuvo hijos o pareja, preguntá por quienes fueron su familia igual.' },
  { id: 'oficio', tramo: null, bloque: 'adulto joven', tema: 'A qué le dedicó la vida y cómo llegó ahí; la anécdota de trabajo que contaba al llegar a casa.' },
  { id: 'por-gusto', tramo: null, bloque: 'adultez media', tema: 'Lo que hacía por gusto, cuando nadie se lo pedía: el deporte, el club, la música, el baile, la huerta, lo que sea que ya nombró. Si no nombró nada, preguntá abierto qué hacía por gusto.' },
  { id: 'amigos', tramo: null, bloque: 'adultez media', tema: 'Los amigos de siempre: los de la cuadra, los del trabajo, quiénes quedaron. Una escena con ellos.' },
  { id: 'un-lugar', tramo: null, bloque: 'adultez media', tema: 'Un lugar que le cambió algo: un viaje, una mudanza, un barrio, un pueblo. Sin dar por hecho que viajó: puede ser la esquina de siempre.' },
  { id: 'un-dia-de-hoy', tramo: 'hoy', bloque: 'hoy', tema: 'Cómo es un día suyo hoy: dónde vive, con quién, qué hace, qué le alegra.' },
  { id: 'pruebas', tramo: null, bloque: 'reflexion', tema: 'Las pruebas que le puso la vida: una pérdida, un fracaso, una época que dolió. Lo que quiera contar, como quiera.' },
  { id: 'fuerza', tramo: null, bloque: 'reflexion', tema: 'De dónde sacó fuerza en esas épocas y qué aprendió que le quiera dejar dicho a los suyos.' },
  { id: 'alegrias', tramo: null, bloque: 'reflexion', tema: 'Sus alegrías más grandes y lo que más orgullo le da; los dichos que repite desde siempre.' },
  { id: 'lo-que-falta', tramo: null, bloque: 'reflexion', tema: 'Qué no le preguntaste que tiene que estar en el libro: una persona, una época, una historia que se quedó con ganas de contar. Es su turno de traer lo que vos no viste.' },
  { id: 'mensaje', tramo: null, bloque: 'reflexion', tema: 'Qué les quiere decir a los que escuchen esto dentro de cincuenta años (sin dar por hecho que tiene hijos o nietos).' },
  { id: 'cinco-minutos', tramo: null, bloque: 'reflexion', tema: 'Su vida en cinco minutos, para alguien que no le conoce: lo que no puede faltar.' },
] as const;

export type NucleoItem = (typeof NUCLEO)[number];
export type Objetivo =
  | ({ tipo: 'nucleo' } & NucleoItem)
  | ({ tipo: 'variable'; id: string } & Variable)
  | { tipo: 'objeto'; id: string; tramo: Tramo };

export const BLOQUES = ['presentacion', 'inicio', 'infancia', 'juventud', 'adulto joven', 'adultez media', 'segunda mitad', 'hoy', 'reflexion'] as const;
export type Bloque = (typeof BLOQUES)[number];

/** Si el objetivo es la presentación: no es una pregunta del día, es la bienvenida. */
export const esPresentacion = (o: Objetivo): boolean => o.tipo === 'nucleo' && o.id === 'presentacion';

/** La regla de la historia grande: se ofrece en toda variable, sin suponer de qué lado estuvo. */
const HISTORIA_GRANDE = 'Si en esos años pasó algo grande en su país o su ciudad (una dictadura, una guerra, una crisis, una inundación), preguntá cómo lo vivió esta persona, en su casa, sin dar por hecho de qué lado estuvo.';

/**
 * El texto que le llega al modelo para este objetivo. La presentación reemplaza sus huecos
 * ({TRATOS}, {EDAD}) según el perfil (castellano, si ya sabemos la edad); el objeto pide UNA
 * cosa con foto de esa época sin insistir; la variable lleva el tramo, sus anclas y la
 * historia grande del país.
 */
export function objetivoEnTexto(o: Objetivo, perfil: Perfil): string {
  if (o.tipo === 'objeto') {
    return `Pedile UNA cosa que tenga en casa de esa época (${o.tramo}): un objeto, un papel, una foto vieja, lo que haya guardado. Con una foto, y que cuente de dónde salió. Si no tiene, no pasa nada: no se insiste nunca.`;
  }
  if (o.tipo === 'nucleo') {
    if (o.id !== 'presentacion') return o.tema;
    const tratos = perfil.castellano === 'españa' ? 'de tú o de usted' : 'de vos o de usted';
    const edad = perfil.persona.edad || perfil.persona.anioNacimiento ? '' : 'cuántos años tiene, ';
    return o.tema.replace('{TRATOS}', tratos).replace('{EDAD}', edad);
  }
  const anclas = o.anclas.length ? `\nLo que sabés de esos años:\n${o.anclas.map((a) => `- ${a}`).join('\n')}` : '';
  const cuando = o.tramo === 'hoy' ? 'su vida de hoy' : `algo de su vida entre los ${o.desde} y los ${o.hasta} años`;
  return `${cuando}. Buscá lo que todavía no contó de esa época: una casa, un trabajo, una persona, un cambio. ${HISTORIA_GRANDE}${anclas}`;
}

export const PROMPT_PREGUNTA_V2 = (encargo: string, conversacion: string, yaHechas: string, objetivo: string) => `
${encargo}

LO ÚLTIMO QUE HABLARON (cada respuesta con la pregunta que la originó):
${conversacion || '(todavía no hablaron)'}

PREGUNTAS QUE YA LE HICISTE (no repitas ninguna):
${yaHechas || '(ninguna)'}

LO QUE TE TOCA PREGUNTAR HOY:
${objetivo}

Tu trabajo hoy es decidir cómo preguntarle esto a ESTA persona, con lo que ya sabés: el guion
te da el tema, no el texto. Si algo que contó sirve de puente, usalo; la pregunta va a lo que
todavía no contó.

Respondé SOLO con la pregunta, sin comillas ni saludo.`;

export function armarPromptPregunta(
  perfil: Perfil,
  objetivo: Objetivo,
  conversacion: { pregunta: string; respuesta: string }[],
  yaHechas: string[],
  evitar: string[] = [],
): string {
  return PROMPT_PREGUNTA_V2(
    encargoDelBiografo(perfil, evitar),
    conversacion.map((c) => `P: ${c.pregunta}\nR: ${c.respuesta}`).join('\n\n'),
    yaHechas.map((q) => `- ${q}`).join('\n'),
    objetivoEnTexto(objetivo, perfil),
  );
}

/** Lo que se revisa antes de mandar: el mismo control que la repregunta (encargo-entrevista.ts). */
export const controlarPregunta = controlarTexto;

/**
 * Escribe la pregunta. Si el control la rechaza, la pide una vez más diciendo por qué; si
 * vuelve a fallar, devuelve la última con `ok: false` para que quien llama decida.
 */
export async function escribirPregunta(
  cliente: Anthropic,
  perfil: Perfil,
  objetivo: Objetivo,
  conversacion: { pregunta: string; respuesta: string }[],
  yaHechas: string[],
  evitar: string[] = [],
): Promise<{ texto: string; ok: boolean; motivo?: string; usos: Anthropic.Usage[] }> {
  const prompt = armarPromptPregunta(perfil, objetivo, conversacion, yaHechas, evitar);
  const trato = tratoDelPerfil(perfil);
  const usos: Anthropic.Usage[] = [];
  let texto = '';
  let motivo: string | undefined;
  for (let intento = 1; intento <= 2; intento++) {
    const contenido = intento === 1 ? prompt : `${prompt}\n\nTu primera versión no sirvió porque ${motivo}. Escribila de nuevo.`;
    const r = await cliente.messages.create({ model: MODELO, max_tokens: 300, messages: [{ role: 'user', content: contenido }] });
    usos.push(r.usage);
    const bloque = r.content.find((b) => b.type === 'text');
    texto = (bloque && bloque.type === 'text' ? bloque.text : '').trim().replace(/^["«]|["»]$/g, '');
    const control = controlarPregunta(texto, trato);
    if (control.ok) return { texto, ok: true, usos };
    motivo = control.motivo;
  }
  return { texto, ok: false, motivo, usos };
}
