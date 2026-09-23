import type Anthropic from '@anthropic-ai/sdk';
import type { Perfil } from './perfil.js';
import type { Tramo, Variable } from './plan-preguntas.js';
import { contarPalabras, contarPreguntas, marcasDelTratoAjeno } from './control-texto.js';
import type { Trato } from './trato.js';

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
const MAX_PALABRAS = 50;

/**
 * El núcleo: lo que se le pregunta a cualquiera. `tema` es para el biógrafo, no es el texto
 * que se manda. `tramo` es el tramo de vida al que apunta (para el reparto de variables; null =
 * puede caer en cualquiera); `bloque` es dónde va en la secuencia.
 */
export const NUCLEO = [
  { id: 'casa-infancia', tramo: 'infancia', bloque: 'inicio', tema: 'La casa donde pasó su infancia, como una escena: si cierra los ojos y entra por la puerta, qué ve, qué huele, quién está. Es el primer mensaje: tiene que dar ganas de contestar.' },
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

function dato(d: { valor: string; fuente: string } | null, nombre: string): string {
  return d ? `${nombre}: ${d.valor} (${d.fuente === 'dicho' ? 'lo dijo' : d.fuente === 'ficha' ? 'lo cargó la familia' : 'deducido'})` : `${nombre}: no se sabe`;
}

/** El perfil en castellano, para el prompt: lo que no se sabe dice "no se sabe". */
export function perfilEnTexto(p: Perfil): string {
  const lineas = [
    dato(p.persona.edad ?? p.persona.anioNacimiento, 'Edad'),
    dato(p.persona.genero, 'Hombre o mujer'),
    dato(p.persona.comoHabla, 'Cómo habla'),
    dato(p.persona.dondeViveHoy, 'Dónde vive hoy'),
    '',
    'Su vida, por etapas:',
    ...(p.etapas.length ? p.etapas.map((e) => `- ${e.edades}${e.anios ? ` (${e.anios})` : ''}: ${e.lugar}; con ${e.conQuien || 'no se sabe'}; ${e.queHacia || 'no se sabe qué hacía'}`) : ['- todavía no se sabe']),
    '',
    'Personas:',
    ...(p.personas.length ? p.personas.map((x) => `- ${x.nombre ?? '(sin nombre)'}, ${x.vinculo} — ${x.vive === 'si' ? 'vive' : x.vive === 'no' ? 'murió' : 'no se sabe si vive'}`) : ['- todavía ninguna']),
    ...(p.bisagras.length ? ['', 'Momentos que partieron su vida:', ...p.bisagras.map((b) => `- ${b}`)] : []),
    ...(p.tono ? ['', `Cómo fue esta vida: ${p.tono}`] : []),
    ...(p.noSabemos.length ? ['', 'NO SABÉS (no lo supongas):', ...p.noSabemos.map((x) => `- ${x}`)] : []),
  ];
  return lineas.join('\n');
}

function objetivoEnTexto(o: Objetivo): string {
  if (o.tipo === 'nucleo') return o.tema;
  const anclas = o.anclas.length ? `\nLo que sabés de esos años:\n${o.anclas.map((a) => `- ${a}`).join('\n')}` : '';
  const cuando = o.tramo === 'hoy' ? 'su vida de hoy' : `algo de su vida entre los ${o.desde} y los ${o.hasta} años`;
  return `${cuando}. Buscá lo que todavía no contó de esa época: una casa, un trabajo, una persona, un cambio.${anclas}`;
}

function tratoEnTexto(p: Perfil): string {
  const v = p.persona.comoHabla?.valor?.toLowerCase() ?? '';
  if (v.includes('vos')) return 'Hablale de vos, que es como habla.';
  if (v.includes('usted')) return 'Hablale de usted, que es como habla.';
  if (v.includes('tú') || v.includes('tu')) return 'Hablale de tú, que es como habla.';
  return 'Todavía no sabés cómo habla: usá usted, cálido y sin formalidad de oficina.';
}

export const PROMPT_PREGUNTA_V2 = (perfil: string, conversacion: string, yaHechas: string, objetivo: string, trato: string) => `
Sos el biógrafo de esta persona: le escribís una pregunta por día por WhatsApp y te contesta
con audios. Tu trabajo hoy es decidir cómo preguntarle esto a ESTA persona, con lo que ya
sabés.

QUIÉN ES (tu ficha; lo que dice "no se sabe" NO lo sabés):
${perfil}

LO ÚLTIMO QUE HABLARON (cada respuesta con la pregunta que la originó):
${conversacion || '(todavía no hablaron)'}

PREGUNTAS QUE YA LE HICISTE (no repitas ninguna):
${yaHechas || '(ninguna)'}

LO QUE TE TOCA PREGUNTAR HOY:
${objetivo}

Cómo:
1. Pedile una escena, no un resumen: un día, un lugar, una persona concreta.
2. Enganchá con algo que contó, con sus palabras, en el lugar y la época en que pasó: si en
   esos años vivía en otra ciudad, es esa ciudad.
3. No supongas nada que tu ficha no diga: ni pareja, ni hijos, ni nietos, ni que alguien vive
   o murió, ni que la infancia fue linda. Si lo que te toca depende de algo que no sabés,
   preguntá primero eso, con cuidado.
4. ${trato} Si no sabés si es hombre o mujer, escribí de manera que sirva para los dos.
5. Si esa época fue dura, no la adornes: preguntá por lo que había, quién estaba, qué le dio sostén.
6. Si ya contó esto, no se lo vuelvas a pedir: buscá lo que quedó abierto.
7. Una sola pregunta (dos como mucho, si van juntas), de hasta 45 palabras: la lee en el celular.

Respondé SOLO con la pregunta, sin comillas ni saludo.`;

export function armarPromptPregunta(
  perfil: Perfil,
  objetivo: Objetivo,
  conversacion: { pregunta: string; respuesta: string }[],
  yaHechas: string[],
): string {
  return PROMPT_PREGUNTA_V2(
    perfilEnTexto(perfil),
    conversacion.map((c) => `P: ${c.pregunta}\nR: ${c.respuesta}`).join('\n\n'),
    yaHechas.map((q) => `- ${q}`).join('\n'),
    objetivoEnTexto(objetivo),
    tratoEnTexto(perfil),
  );
}

/** Lo que se revisa antes de mandar. Si no pasa, se pide de nuevo con el motivo. */
export function controlarPregunta(texto: string, trato: Trato | null): { ok: true } | { ok: false; motivo: string } {
  const t = texto.trim();
  if (contarPreguntas(t) === 0) return { ok: false, motivo: 'no tiene ninguna pregunta' };
  if (contarPalabras(t) > MAX_PALABRAS) return { ok: false, motivo: `tiene ${contarPalabras(t)} palabras (máximo ${MAX_PALABRAS})` };
  if (trato) {
    const ajenas = marcasDelTratoAjeno(t, trato);
    if (ajenas.length) return { ok: false, motivo: `le habla de otra manera que ${trato}: ${ajenas.join(', ')}` };
  }
  return { ok: true };
}

function tratoDelPerfil(p: Perfil): Trato | null {
  const v = p.persona.comoHabla?.valor?.toLowerCase() ?? '';
  return v.includes('vos') ? 'vos' : v.includes('usted') ? 'usted' : null;
}

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
