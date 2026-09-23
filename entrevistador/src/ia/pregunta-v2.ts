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
 * El núcleo: lo que se le pregunta a cualquiera. `tema` es para el biógrafo, no es el texto
 * que se manda. `tramo` es el tramo de vida al que apunta (para el reparto de variables; null =
 * puede caer en cualquiera); `bloque` es dónde va en la secuencia.
 */
export const NUCLEO = [
  { id: 'casa-infancia', tramo: 'infancia', bloque: 'inicio', tema: 'Es el PRIMER mensaje y tiene que dar ganas de contestar. Primero, corto: cuántos años tiene hoy, y si prefiere que le hablen de vos o de usted (que decida la persona). Después, la casa donde pasó su infancia como una escena: si cierra los ojos y entra por la puerta, qué ve, qué huele, quién está.' },
  { id: 'mapa-casas', tramo: null, bloque: 'inicio', tema: 'El mapa de su vida por las casas: después de aquella casa, para dónde fue la vida. Las casas en que vivió, una tras otra: en qué ciudad, con quién, más o menos hasta qué edad. Que se sienta como un recorrido, no como un formulario.' },
  { id: 'mapa-capitulos', tramo: null, bloque: 'inicio', tema: 'Si su vida fuera un libro, cuáles serían sus capítulos: los grandes pedazos, y qué hizo que uno terminara y empezara otro.' },
  { id: 'padres', tramo: 'infancia', bloque: 'infancia', tema: 'Cómo eran su mamá y su papá (o quienes le criaron), cómo recuerda a cada uno.' },
  { id: 'juegos', tramo: 'infancia', bloque: 'infancia', tema: 'A qué jugaba en la infancia y con quién; alguna escena que todavía le haga sonreír (si la infancia fue dura: qué había, quién estaba).' },
  { id: 'sabado', tramo: 'juventud', bloque: 'juventud', tema: 'Un sábado a la noche de sus quince, dieciséis años: dónde, con quién, qué sonaba. En la ciudad donde vivía ENTONCES.' },
  { id: 'primer-trabajo', tramo: 'juventud', bloque: 'juventud', tema: 'Su primer trabajo y su primer sueldo: cómo lo consiguió, qué hizo con esa plata.' },
  { id: 'amor', tramo: null, bloque: 'adulto joven', tema: 'El amor: si se enamoró, de quién, cómo fue. Sin dar por hecho que hubo pareja, boda ni de qué género; si no sabés, preguntá si hubo.' },
  { id: 'oficio', tramo: null, bloque: 'adulto joven', tema: 'A qué le dedicó la vida y cómo llegó ahí; la anécdota de trabajo que contaba al llegar a casa.' },
  { id: 'un-dia-de-hoy', tramo: 'hoy', bloque: 'hoy', tema: 'Cómo es un día suyo hoy: dónde vive, con quién, qué hace, qué le alegra.' },
  { id: 'pruebas', tramo: null, bloque: 'reflexion', tema: 'Las pruebas que le puso la vida: una pérdida, un fracaso, una época que dolió. Lo que quiera contar, como quiera.' },
  { id: 'fuerza', tramo: null, bloque: 'reflexion', tema: 'De dónde sacó fuerza en esas épocas y qué aprendió que le quiera dejar dicho a los suyos.' },
  { id: 'alegrias', tramo: null, bloque: 'reflexion', tema: 'Sus alegrías más grandes y lo que más orgullo le da; los dichos que repite desde siempre.' },
  { id: 'mensaje', tramo: null, bloque: 'reflexion', tema: 'Qué les quiere decir a los que escuchen esto dentro de cincuenta años (sin dar por hecho que tiene hijos o nietos).' },
  { id: 'cinco-minutos', tramo: null, bloque: 'reflexion', tema: 'Su vida en cinco minutos, para alguien que no le conoce: lo que no puede faltar.' },
] as const;

export type Objetivo =
  | ({ tipo: 'nucleo' } & (typeof NUCLEO)[number])
  | ({ tipo: 'variable' } & Variable);

const BLOQUES = ['inicio', 'infancia', 'juventud', 'adulto joven', 'adultez media', 'segunda mitad', 'hoy', 'reflexion'] as const;

/**
 * El orden de la entrevista: primero la escena y el mapa, después la vida en orden (el núcleo
 * de cada tramo y las variables de ese tramo), y al final la reflexión.
 */
export function secuencia(variables: Variable[]): Objetivo[] {
  const nucleo: Objetivo[] = NUCLEO.map((n) => ({ tipo: 'nucleo' as const, ...n }));
  const bloqueDe = (o: Objetivo) => BLOQUES.indexOf((o.tipo === 'nucleo' ? o.bloque : o.tramo) as (typeof BLOQUES)[number]);
  const todos: Objetivo[] = [...nucleo, ...variables.map((v) => ({ tipo: 'variable' as const, ...v }))];
  // Estable: dentro de un bloque, el núcleo antes que las variables.
  return todos.map((o, i) => ({ o, i })).sort((a, b) => bloqueDe(a.o) - bloqueDe(b.o) || a.i - b.i).map((x) => x.o);
}

function objetivoEnTexto(o: Objetivo): string {
  if (o.tipo === 'nucleo') return o.tema;
  const anclas = o.anclas.length ? `\nLo que sabés de esos años:\n${o.anclas.map((a) => `- ${a}`).join('\n')}` : '';
  const cuando = o.tramo === 'hoy' ? 'su vida de hoy' : `algo de su vida entre los ${o.desde} y los ${o.hasta} años`;
  return `${cuando}. Buscá lo que todavía no contó de esa época: una casa, un trabajo, una persona, un cambio.${anclas}`;
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
te da el tema, no el texto. Enganchá con algo que contó, con sus palabras.

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
    objetivoEnTexto(objetivo),
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
): Promise<{ texto: string; ok: boolean; motivo?: string; usos: Anthropic.Usage[] }> {
  const prompt = armarPromptPregunta(perfil, objetivo, conversacion, yaHechas);
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

export type { Tramo };
