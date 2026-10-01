// Prueba del cazador de escenas v3 (docs/v3/entrevista/cazador/prompt-v3.md) sobre una
// entrevista que ya existe, bloque por bloque como en vivo: hasta 2 repreguntas por
// bloque, con la pregunta del medio escrita por el modelo.
// GASTA PLATA (claude-opus-5). Corta si el gasto acumulado pasa el tope.
//
//   npx tsx scripts/v3-cazador-prueba-v3.ts --respuestas <respuestas.xml> --ficha <ficha.xml> \
//     --salida <carpeta> [--bloques ci | --bloques 7] [--tope 1.5]
//
// La salida va a una carpeta fuera de git: tiene la vida real del narrador.

import Anthropic from '@anthropic-ai/sdk';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MODELO = 'claude-opus-5';
const PRECIO = { entrada: 5 / 1e6, salida: 25 / 1e6 };

const FABRICA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROMPT_MD = path.join(FABRICA, '..', 'docs', 'v3', 'entrevista', 'cazador', 'prompt-v3.md');

// Los bloques del banco (flujo-vigente.md) y los momentos concretos que piden sus preguntas del núcleo.
const BLOQUES: { nombre: string; momentos: string[] }[] = [
  { nombre: 'Origen', momentos: ['la época en que naciste', 'la historia de la familia de los de antes', 'cómo se conocieron tus padres'] },
  { nombre: 'La casa de chico', momentos: ['el primer recuerdo de la casa de chico', 'una anécdota con tu mamá de chico', 'una vez con tu papá trabajando', 'una aventura con tus hermanos', 'un día de chico que esperabas con ganas', 'un momento difícil de chico'] },
  { nombre: 'Escuela', momentos: ['el primer día de escuela', 'una vez con una maestra que te marcó', 'una tarde con tu mejor amigo de chico', 'una travesura', 'qué querías ser de grande', 'la religión en tu casa'] },
  { nombre: 'Adolescencia', momentos: ['dónde pasabas los días a los trece', 'una noche con la barra de amigos', 'la primera salida de noche', 'el primer amor', 'cuándo dejaste de ser chico', 'un momento duro de la adolescencia'] },
  { nombre: 'Juventud', momentos: ['el día que te fuiste de la casa de tus padres', 'qué hiciste después del colegio', 'aprender tu oficio', 'tu paso por lo militar', 'la llegada a vivir a otra ciudad o país', 'el primer lugar propio y su primera noche', 'las mudanzas de tu vida', 'un momento duro de la juventud'] },
  { nombre: 'Amor', momentos: ['el día que conociste a tu pareja', 'la vida juntos', 'un momento de los dos'] },
  { nombre: 'Trabajo', momentos: ['el primer trabajo', 'un día común de trabajo', 'quién te dio una mano en el trabajo', 'el día de trabajo del que estás orgulloso', 'una época sin trabajo o con la plata justa', 'el negocio propio', 'el último día de trabajo'] },
  { nombre: 'Hijos y nietos', momentos: ['tus padres de grande', 'el nacimiento del primer hijo', 'cómo era cada hijo de chico', 'el día que conociste al primer nieto'] },
  { nombre: 'Lugares', momentos: ['el viaje más importante', 'tu pasión'] },
  { nombre: 'Amistades', momentos: ['cómo conociste al amigo de grande', 'tus hermanos de grandes', 'alguien que te ayudó', 'la cena con quien quisieras'] },
  { nombre: 'Momentos difíciles', momentos: ['una pérdida', 'la salud', 'una época dura de grande'] },
  { nombre: 'Historia grande', momentos: ['algo grande del país que te tocó', 'un día de la pandemia', 'lo que antes no se podía', 'la política'] },
  { nombre: 'Giros', momentos: ['el día que volverías a vivir', 'el día que te cambió algo', 'algo que no se dio', 'sentirte chiquito frente a algo enorme', 'la soledad', 'el paso del tiempo', 'lo heredado'] },
  { nombre: 'Hoy', momentos: ['un día cualquiera de ahora', 'la última vez que te reíste con ganas', 'una marca en el cuerpo con historia', 'tu plato', 'la música de ahora', 'el lugar donde vivís'] },
  { nombre: 'Legado', momentos: ['de qué estás orgulloso', 'tu consejo', 'lo que todavía querés hacer'] },
];
const PIDEN_DIA = new Set(['CA16', 'AD5', 'JU12', 'TR5', 'HG4', 'GI2', 'GI9', 'HO2']);
const TIEMPO_RELATIVO = /\b(ayer|anoche|hace un rato|recién|recien|la otra vez|esta semana)\b/i;

type Respuesta = { id: string; pregunta: string; origen: string; texto: string };
type Elegida = { id: string; cita: string; pregunta: string; tema: string; por_que: string; ya_contado_chequeo: string };

const arg = (n: string) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const sinMarcas = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-zñ0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

/** Controles de código de la v3: la cita solo tiene que ser textual; la pregunta, corta, una sola y sin tiempos relativos. */
export function controlarElegida(e: Pick<Elegida, 'cita' | 'pregunta'>, respuesta: string, bloqueHoy: boolean): string[] {
  const fallas: string[] = [];
  const cita = sinMarcas(e.cita);
  if (!cita || !` ${sinMarcas(respuesta)} `.includes(` ${cita} `)) fallas.push('la cita no es textual');
  if ((e.pregunta.match(/\?/g) ?? []).length !== 1) fallas.push('la pregunta no tiene un solo "?"');
  if (e.pregunta.split(/\s+/).filter(Boolean).length > 45) fallas.push('pregunta de más de 45 palabras');
  if (TIEMPO_RELATIVO.test(e.pregunta) || (!bloqueHoy && /\bhoy\b/i.test(e.pregunta))) fallas.push('tiempo relativo');
  return fallas;
}

export function mensajeCompleto(e: Pick<Elegida, 'cita' | 'pregunta'>): string {
  return `Me quedé pensando en algo que me contaste: «${e.cita}». ${e.pregunta} Y si no te vuelve, o ya me lo contaste todo, decímelo nomás y seguimos con otra.`;
}

function leerRespuestas(xml: string): Respuesta[] {
  return xml.split('<respuesta ').slice(1).map((t) => ({
    id: t.match(/id="(R\d+)"/)![1],
    origen: t.match(/origen="([^"]*)"/)![1],
    pregunta: (t.match(/<pregunta>([\s\S]*?)<\/pregunta>/)?.[1] ?? '').trim(),
    texto: (t.match(/<texto>([\s\S]*?)<\/texto>/)?.[1] ?? '').trim(),
  }));
}

function armarBloques(resp: Respuesta[], modo: string): Respuesta[][] {
  const bloques: Respuesta[][] = [];
  if (modo === 'ci') {
    let actual: Respuesta[] = [];
    for (const r of resp) {
      actual.push(r);
      if (/^pregunta CI\d+\b/.test(r.origen)) {
        bloques.push(actual);
        actual = [];
      }
    }
    return bloques; // lo que queda después del último cierre (legado) no se caza
  }
  const n = Number(modo);
  for (let i = 0; i < resp.length; i += n) bloques.push(resp.slice(i, i + n));
  return bloques;
}

async function main() {
  const rutaEnv = path.resolve(FABRICA, '..', '..', 'VITACORA FAMILIAR', 'fabrica', '.env');
  if (existsSync(rutaEnv)) process.loadEnvFile(rutaEnv);
  const respuestasXml = arg('respuestas');
  const fichaXml = arg('ficha');
  const salida = arg('salida');
  if (!respuestasXml || !fichaXml || !salida) throw new Error('faltan --respuestas, --ficha o --salida');
  const modo = arg('bloques') ?? 'ci';
  const tope = Number(arg('tope') ?? '1.5');

  const prompt = readFileSync(PROMPT_MD, 'utf8').split('## Prompt')[1].split('```')[1].trim();
  const ficha = readFileSync(fichaXml, 'utf8');
  const bloques = armarBloques(leerRespuestas(readFileSync(respuestasXml, 'utf8')), modo);
  const cliente = new Anthropic();
  mkdirSync(salida, { recursive: true });

  const yaRepreguntado: string[] = [];
  const escenasContadas: string[] = [];
  const filas: unknown[] = [];
  const mensajes: string[] = [];
  let gasto = 0;

  for (const [i, bloque] of bloques.entries()) {
    const nombre = modo === 'ci' ? BLOQUES[i].nombre : `Tramo ${i + 1}`;
    const queViene = modo === 'ci' ? BLOQUES.slice(i + 1).flatMap((b) => b.momentos) : [];
    const respuestas = bloque
      .map((r) => {
        const q = r.origen.match(/pregunta (\w+)/)?.[1] ?? '';
        const marcas = (PIDEN_DIA.has(q) ? ' pedido_dia="si"' : '') + (/«Paso/.test(r.origen) ? ' paso="si"' : '');
        return `<respuesta id="${r.id}"${marcas}>\n<pregunta>${r.pregunta}</pregunta>\n<texto>${r.texto}</texto>\n</respuesta>`;
      })
      .join('\n');
    const usuario = [
      ficha,
      `<bloque>${nombre}</bloque>`,
      `<ya_repreguntado>\n${yaRepreguntado.join('\n')}\n</ya_repreguntado>`,
      `<escenas_contadas>\n${escenasContadas.join('\n')}\n</escenas_contadas>`,
      `<lo_que_viene>\n${queViene.join('\n')}\n</lo_que_viene>`,
      `<respuestas_del_bloque>\n${respuestas}\n</respuestas_del_bloque>`,
    ].join('\n\n');

    const msg = await cliente.messages.create({ model: MODELO, max_tokens: 16000, system: prompt, messages: [{ role: 'user', content: usuario }] });
    const costo = msg.usage.input_tokens * PRECIO.entrada + msg.usage.output_tokens * PRECIO.salida;
    gasto += costo;
    const texto = msg.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
    const json = JSON.parse(texto.slice(texto.indexOf('{'), texto.lastIndexOf('}') + 1)) as {
      elegidas?: Elegida[];
      escenas_contadas_bloque?: string[];
    };
    const elegidas = (json.elegidas ?? []).slice(0, 2);
    const revisadas = elegidas.map((e) => {
      const fallas = controlarElegida(e, bloque.find((r) => r.id === e.id)?.texto ?? '', nombre === 'Hoy');
      if (elegidas.filter((o) => o.id === e.id).length > 1) fallas.push('dos de la misma respuesta');
      return { ...e, fallas, mensaje: mensajeCompleto(e) };
    });
    for (const e of elegidas) yaRepreguntado.push(`${e.id}: ${e.tema}`);
    escenasContadas.push(...(json.escenas_contadas_bloque ?? []));
    filas.push({ bloque: i + 1, nombre, respuestas: bloque.map((r) => r.id), elegidas: revisadas, escenas_contadas_bloque: json.escenas_contadas_bloque, tokens: msg.usage, costo_usd: Number(costo.toFixed(4)) });
    mensajes.push(`## ${i + 1} · ${nombre}`, ...(revisadas.length ? revisadas.map((e) => `- **${e.id}** (${e.tema})${e.fallas.length ? ` ⚠ ${e.fallas.join('; ')}` : ''}\n  > ${e.mensaje}`) : ['- (no pregunta nada)']), '');
    console.log(`bloque ${i + 1} ${nombre}: ${revisadas.map((e) => e.id + (e.fallas.length ? '⚠' : '')).join(', ') || '—'} · USD ${costo.toFixed(3)} · acumulado ${gasto.toFixed(3)}`);
    writeFileSync(path.join(salida, 'cazador-v3.json'), JSON.stringify({ modelo: MODELO, gasto_usd: gasto, filas }, null, 2));
    writeFileSync(path.join(salida, 'cazador-v3.md'), `# Cazador v3 (${MODELO}) · USD ${gasto.toFixed(2)}\n\n${mensajes.join('\n')}`);
    if (gasto > tope) {
      console.log(`Corto: pasé el tope de USD ${tope}.`);
      break;
    }
  }
  console.log(`Total: USD ${gasto.toFixed(3)} en ${filas.length} bloques.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
