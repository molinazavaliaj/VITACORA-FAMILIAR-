// Pasa una entrevista V3 (el estado.json de v3-entrevista-turno.ts o de la
// página web) al material del escritor V3, con el mismo formato que
// fabrica/prueba-v3-joaquin: respuestas.xml (R01… en el orden en que llegaron)
// y etiquetas.json (pregunta, bloque, palabras, paso). Genérico: no tiene
// datos de nadie adentro. Sin modelos ni API.
//
//   npx tsx scripts/v3-entrevista-a-material.ts <estado.json> <carpeta-salida>
//
// Reglas:
//   - La pregunta es el texto EXACTO que se le mandó (las partes de la charla
//     con ese ID). Si la charla no lo tiene, el texto de hoy del banco,
//     renderizado con la ficha y las respuestas de antes.
//   - Bloque: el del banco; las preguntas de la familia van al 15 (legado: la
//     carta). Si el ID ya no está en el banco, el último título de bloque de la
//     charla antes de esa pregunta.
//   - "paso" (no cuenta para el libro): interpretar() dice paso, vacío, olvido
//     o "ya te lo conté"; o un "no" en una pregunta que no es de historia
//     (cierre "No, está todo", foto "No tengo foto"). Un "no" en una pregunta
//     de historia ("No tuve hijos") es un dato y se queda.
//   - Botón: la marca ⟦botón:…⟧ no llega al escritor. Con "Sí" y audio, queda
//     el audio; con un botón solo, queda el texto del botón.
//   - Foto (FO1): si describió una foto, se queda (bloque 15) y el origen avisa
//     que la imagen no está en el material.
//   - La segunda oportunidad (X~2) y la repregunta del cazador (RP~X) van
//     pegadas a la respuesta X, con el mismo id, sin el texto de lo que se le
//     preguntó (Naza, 01/10, plan del cazador B3). Solo si contaron algo: un
//     olvido, un "no", un "paso" o [Ya lo conté todo] no se suman. Si suman,
//     la respuesta X ya no es "paso" (aunque X haya sido un "no me acuerdo").

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { preguntaPorId } from '../src/v3/entrevista/banco.js';
import { deRepregunta, deSegunda, preguntaDeClave } from '../src/v3/entrevista/flujo.js';
import { interpretar, leerBoton, valeBoton, PREGUNTA_COMUN, type Interpretacion, type PreguntaParaInterpretar } from '../src/v3/entrevista/respuesta.js';
import { renderizar, type FichaTexto } from '../src/v3/entrevista/texto.js';

type Parte = { id: string; texto: string };
type Globo =
  | { de: 'bio'; partes: Parte[]; botones?: string[] }
  | { de: 'persona'; pregunta: string; texto: string; boton?: string }
  | { de: 'bloque'; bloque: number; nombre: string };
type Estado = {
  ficha: FichaTexto;
  familia?: { id: string; texto: string }[];
  respuestas: [string, string][];
  charla?: Globo[];
};

export type Fila = {
  id: string;
  preguntaId: string;
  bloque: number;
  pregunta: string;
  texto: string;
  palabras: number;
  paso: boolean;
  interpretacion: Interpretacion;
  boton?: string;
  origen: string;
};

const LEGADO = 15;
const PASO: readonly Interpretacion[] = ['paso', 'vacio', 'olvido', 'ya-conto'];
const contar = (s: string) => s.split(/\s+/).filter(Boolean).length;

/** Lo que se le mandó con ese ID, y en qué bloque estaba la charla en ese momento. */
function mandado(charla: Globo[]): Map<string, { texto: string; bloque: number }> {
  const out = new Map<string, { texto: string; bloque: number }>();
  let bloque = 0;
  for (const g of charla) {
    if (g.de === 'bloque') bloque = g.bloque;
    if (g.de !== 'bio') continue;
    const porId = new Map<string, string[]>();
    for (const p of g.partes) porId.set(p.id, [...(porId.get(p.id) ?? []), p.texto]);
    for (const [id, textos] of porId) out.set(id, { texto: textos.join('\n\n'), bloque }); // si se mandó dos veces, vale la última
  }
  return out;
}

export function aMaterial(e: Estado): Fila[] {
  const enviados = mandado(e.charla ?? []);
  const familia = new Map((e.familia ?? []).map((f) => [f.id, f.texto]));
  const antes = new Map<string, string>();
  const filas: Fila[] = [];
  for (const [pid, crudo] of e.respuestas) {
    const deX = deSegunda(pid) ?? deRepregunta(pid);
    if (deX !== undefined) {
      pegarA([...filas].reverse().find((f) => f.preguntaId === deX), pid, crudo);
      antes.set(pid, crudo);
      continue;
    }
    const delBanco = preguntaPorId(pid);
    const esFamilia = !delBanco && familia.has(pid);
    const pregunta = enviados.get(pid)?.texto ?? (delBanco ? renderizar(delBanco.texto, e.ficha, antes) : familia.get(pid) ?? '(pregunta sin texto guardado)');
    const bloque = esFamilia ? LEGADO : delBanco?.bloque ?? enviados.get(pid)?.bloque ?? 0;
    const paraInterpretar: PreguntaParaInterpretar = delBanco ? { id: pid, clase: delBanco.clase, sensible: delBanco.sensible, botones: delBanco.botones, texto: pregunta } : { ...PREGUNTA_COMUN, texto: pregunta };
    const interp = interpretar(paraInterpretar, crudo);
    const { boton, resto } = leerBoton(crudo);
    let texto = resto.trim();
    if (boton !== undefined) {
      const vale = valeBoton(paraInterpretar, boton);
      texto = !texto ? boton : vale === 'si' ? texto : `${boton}. ${texto}`;
    }
    const clase = delBanco?.clase ?? 'historia';
    const paso = PASO.includes(interp) || (interp === 'no' && clase !== 'historia');
    const origen = [`pregunta ${pid}`, esFamilia ? '(de la familia)' : '', clase === 'foto' && !paso ? '(describe una foto que mandó; la imagen no está en este material)' : '', boton !== undefined ? `(tocó el botón «${boton}»)` : '']
      .filter(Boolean)
      .join(' ');
    filas.push({ id: `R${String(filas.length + 1).padStart(2, '0')}`, preguntaId: pid, bloque, pregunta, texto, palabras: contar(texto), paso, interpretacion: interp, ...(boton !== undefined ? { boton } : {}), origen });
    antes.set(pid, crudo);
  }
  return filas;
}

/** Suma lo que contó en X~2 o RP~X a la fila de X (si contó algo y la fila existe). */
function pegarA(fila: Fila | undefined, clave: string, crudo: string): void {
  if (!fila) return;
  const interp = interpretar(preguntaDeClave(clave)!, crudo);
  const texto = leerBoton(crudo).resto.trim();
  if (!texto || PASO.includes(interp) || interp === 'no') return;
  fila.texto = fila.texto ? `${fila.texto}\n\n${texto}` : texto;
  fila.palabras = contar(fila.texto);
  fila.paso = false;
}

/** Igual que armar-material.mjs de Joaquín: sin &, < ni > (el XML se arma a mano). */
const esc = (s: string) => s.replace(/&/g, 'y').replace(/</g, '(').replace(/>/g, ')');

export function respuestasXml(filas: Fila[]): string {
  return filas.map((f) => `<respuesta id="${f.id}" origen="${esc(f.origen).replace(/"/g, "'")}" segundos="">\n<pregunta>${esc(f.pregunta)}</pregunta>\n<texto>${esc(f.texto)}</texto>\n</respuesta>`).join('\n\n') + '\n';
}

export function etiquetas(filas: Fila[]) {
  return filas.map((f) => ({ id: f.id, preguntaId: f.preguntaId, bloque: f.bloque, palabras: f.palabras, texto: f.texto, paso: f.paso, interpretacion: f.interpretacion, ...(f.boton !== undefined ? { boton: f.boton } : {}) }));
}

function main(args: string[]): void {
  const [rutaEstado, salida] = args;
  if (!rutaEstado || !salida) throw new Error('Uso: npx tsx scripts/v3-entrevista-a-material.ts <estado.json> <carpeta-salida>');
  const filas = aMaterial(JSON.parse(readFileSync(rutaEstado, 'utf8')) as Estado);
  mkdirSync(salida, { recursive: true });
  writeFileSync(join(salida, 'respuestas.xml'), respuestasXml(filas), 'utf8');
  writeFileSync(join(salida, 'etiquetas.json'), JSON.stringify(etiquetas(filas), null, 2), 'utf8');
  const cuenta: Record<string, number> = {};
  for (const f of filas) cuenta[f.interpretacion] = (cuenta[f.interpretacion] ?? 0) + 1;
  const utiles = filas.filter((f) => !f.paso);
  console.log(`${filas.length} respuestas; ${filas.filter((f) => f.paso).length} marcadas paso (${filas.filter((f) => f.paso).map((f) => f.id).join(',') || 'ninguna'}); ${utiles.reduce((s, f) => s + f.palabras, 0)} palabras que cuentan (${filas.reduce((s, f) => s + f.palabras, 0)} en total)`);
  console.log('interpretación:', JSON.stringify(cuenta), '| bloque 15 (carta):', filas.filter((f) => f.bloque === LEGADO && !f.paso).map((f) => f.id).join(',') || 'ninguna');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main(process.argv.slice(2));
  } catch (err) {
    console.error(`ERROR: ${(err as Error).message}`);
    process.exit(1);
  }
}
