// Prueba del cazador de escenas v2 (docs/v3/entrevista/cazador/prompt-v2.md) sobre una
// entrevista que ya existe. Corre bloque por bloque como en vivo: cada llamada lee solo
// el bloque que cerró, más lo ya repreguntado, las escenas ya contadas y lo que viene.
// GASTA PLATA (claude-opus-5). Corta si el gasto acumulado pasa el tope.
//
//   npx tsx scripts/v3-cazador-prueba.ts --respuestas <respuestas.xml> --ficha <ficha.xml> \
//     --salida <carpeta> [--bloques ci | --bloques 7] [--tope 1.5]
//
// --bloques ci: cada bloque cierra en una pregunta CIn (entrevista V3).
// --bloques N: bloques de N respuestas (entrevistas viejas, sin cierres).
// La salida va a una carpeta fuera de git: tiene la vida real del narrador.

import Anthropic from '@anthropic-ai/sdk';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MODELO = 'claude-opus-5';
const PRECIO = { entrada: 5 / 1e6, salida: 25 / 1e6 };

const FABRICA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROMPT_MD = path.join(FABRICA, '..', 'docs', 'v3', 'entrevista', 'cazador', 'prompt-v2.md');

// Los bloques del banco y sus temas (flujo-vigente.md, tabla de bloques).
const TEMAS_BLOQUES = [
  'Origen: la época en que llegaste, la historia de los de antes, cómo se conocieron tus padres',
  'La casa de chico: primer recuerdo de la casa, mamá, papá, hermanos, un día esperado, momento difícil',
  'Escuela: primer día, maestra, mejor amigo, travesura, qué querías ser, la religión en tu casa',
  'Adolescencia: dónde pasabas los días, la barra, primera salida, primer amor, ya no eras chico, momento duro',
  'Juventud: irse de casa, después del colegio, aprender lo tuyo, lo militar, irse a vivir a otro lado, primer lugar propio, amigos, momento duro',
  'Amor: si hubo alguien en serio, cómo se conocieron, la vida juntos',
  'Trabajo: primer trabajo, el repaso de trabajos, un día común, quien te dio una mano, día de orgullo, sin trabajo o plata ajustada, negocio propio, lo que hacés bien y nadie te paga, el último día',
  'Hijos y nietos: tus viejos de grande, hijos, el primero, cómo era cada uno, la crianza, nietos',
  'Lugares: el viaje, la pasión',
  'Amistades: el amigo de grande, los hermanos ya de grandes, alguien te ayudó, la cena',
  'Momentos difíciles: pérdidas, salud, época dura de grande',
  'Historia grande: algo grande que te tocó, un día de la pandemia, lo que no se podía, la política',
  'Giros: el día que volverías a vivir, el día que cambió algo, lo que no se dio, chiquito frente a algo enorme, la soledad, el tiempo, lo heredado',
  'Hoy: un día de ahora, qué te hace reír, lo que más te gusta de tu vida, una marca en el cuerpo, tu plato, la música, el lugar donde vivís',
  'Legado: orgullo, el consejo, lo que todavía querés hacer, preguntas de la familia, la foto',
];
const PIDEN_DIA = new Set(['CA16', 'AD5', 'JU12', 'TR5', 'HG4', 'GI2', 'GI9', 'HO2']);
const APUNTAN_AFUERA = new Set(
  'este esta estos estas ese esa esos esas aquel aquella esto eso aquello ahí allá allí él ella ellos ellas entonces'.split(' '),
);

type Respuesta = { id: string; pregunta: string; origen: string; texto: string; palabras: number };
type Elegida = { id: string; ancla: string; tema: string; por_que: string; ya_contado_chequeo: string };

const arg = (n: string) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const sinMarcas = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-zñ0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

export function controlarAncla(ancla: string, respuesta: string): string[] {
  const fallas: string[] = [];
  const a = sinMarcas(ancla);
  const n = a.split(' ').filter(Boolean).length;
  if (n < 6 || n > 14) fallas.push(`${n} palabras`);
  if (!` ${sinMarcas(respuesta)} `.includes(` ${a} `)) fallas.push('no es textual');
  const afuera = a.split(' ').filter((w) => APUNTAN_AFUERA.has(w));
  if (afuera.length) fallas.push(`apunta afuera: ${afuera.join(', ')}`);
  if (/^(lo|la|le) /.test(a)) fallas.push('empieza con lo/la/le');
  return fallas;
}

function leerRespuestas(xml: string): Respuesta[] {
  return xml.split('<respuesta ').slice(1).map((t) => {
    const id = t.match(/id="(R\d+)"/)![1];
    const origen = t.match(/origen="([^"]*)"/)![1];
    const pregunta = (t.match(/<pregunta>([\s\S]*?)<\/pregunta>/)?.[1] ?? '').trim();
    const texto = (t.match(/<texto>([\s\S]*?)<\/texto>/)?.[1] ?? '').trim();
    return { id, origen, pregunta, texto, palabras: texto.split(/\s+/).filter(Boolean).length };
  });
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

function sacarJson(texto: string): { elegida: Elegida | null; escenas_contadas_bloque: string[] } {
  const ini = texto.indexOf('{');
  const fin = texto.lastIndexOf('}');
  return JSON.parse(texto.slice(ini, fin + 1));
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

  const md = readFileSync(PROMPT_MD, 'utf8');
  const prompt = md.split('## Prompt')[1].split('```')[1].trim();
  const ficha = readFileSync(fichaXml, 'utf8');
  const resp = leerRespuestas(readFileSync(respuestasXml, 'utf8'));
  const bloques = armarBloques(resp, modo);
  const cliente = new Anthropic();
  mkdirSync(salida, { recursive: true });

  const yaRepreguntado: string[] = [];
  const escenasContadas: string[] = [];
  const filas: unknown[] = [];
  let gasto = 0;

  for (const [i, bloque] of bloques.entries()) {
    const queViene = modo === 'ci' ? TEMAS_BLOQUES.slice(i + 1) : [];
    const respuestas = bloque
      .map((r) => {
        const q = r.origen.match(/pregunta (\w+)/)?.[1] ?? '';
        const marca = PIDEN_DIA.has(q) ? ' pedido_dia="si"' : '';
        return `<respuesta id="${r.id}"${marca}>\n<pregunta>${r.pregunta}</pregunta>\n<texto>${r.texto}</texto>\n</respuesta>`;
      })
      .join('\n');
    const usuario = [
      ficha,
      `<ya_repreguntado>\n${yaRepreguntado.join('\n')}\n</ya_repreguntado>`,
      `<escenas_contadas>\n${escenasContadas.join('\n')}\n</escenas_contadas>`,
      `<lo_que_viene>\n${queViene.join('\n')}\n</lo_que_viene>`,
      '<permitido_sensible></permitido_sensible>',
      `<respuestas_del_bloque>\n${respuestas}\n</respuestas_del_bloque>`,
    ].join('\n\n');

    const msg = await cliente.messages.create({
      model: MODELO,
      max_tokens: 16000,
      system: prompt,
      messages: [{ role: 'user', content: usuario }],
    });
    const costo = msg.usage.input_tokens * PRECIO.entrada + msg.usage.output_tokens * PRECIO.salida;
    gasto += costo;
    const texto = msg.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
    const salidaModelo = sacarJson(texto);
    const el = salidaModelo.elegida;
    const fallas = el ? controlarAncla(el.ancla, bloque.find((r) => r.id === el.id)?.texto ?? '') : [];
    if (el) yaRepreguntado.push(`${el.id}: ${el.tema}`);
    escenasContadas.push(...(salidaModelo.escenas_contadas_bloque ?? []));
    filas.push({
      bloque: i + 1,
      respuestas: bloque.map((r) => r.id),
      elegida: el,
      fallas_ancla: fallas,
      escenas_contadas_bloque: salidaModelo.escenas_contadas_bloque,
      tokens: { entrada: msg.usage.input_tokens, salida: msg.usage.output_tokens },
      costo_usd: Number(costo.toFixed(4)),
    });
    console.log(
      `bloque ${i + 1}: ${el ? el.id : '—'}${fallas.length ? ` (ancla: ${fallas.join('; ')})` : ''} · ` +
        `${msg.usage.input_tokens} entrada / ${msg.usage.output_tokens} salida · USD ${costo.toFixed(3)} · acumulado ${gasto.toFixed(3)}`,
    );
    writeFileSync(path.join(salida, 'cazador-v2.json'), JSON.stringify({ modelo: MODELO, gasto_usd: gasto, filas }, null, 2));
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
