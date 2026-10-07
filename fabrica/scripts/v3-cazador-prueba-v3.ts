// Prueba del cazador de escenas v3 (docs/v3/entrevista/cazador/prompt-v3.md) sobre una
// entrevista que ya existe, bloque por bloque como en vivo: hasta 2 repreguntas por
// bloque, con la pregunta del medio escrita por el modelo.
// GASTA PLATA (claude-opus-5). Corta si el gasto acumulado pasa el tope.
//
//   npx tsx scripts/v3-cazador-prueba-v3.ts --respuestas <respuestas.xml> --ficha <ficha.xml> \
//     --salida <carpeta> [--bloques ci | --bloques 7] [--tope 1.5] [--prompt <prompt-vX.md>] [--solo 1,12,14 --previo <cazador-v3.json>] [--nombre v3-1]
//     [--proveedor opus5 | opus55] [--esfuerzo medium | high]   (07/10: opus55 = Opus 5.5; --esfuerzo solo para opus55, medio por defecto)
//
// La salida va a una carpeta fuera de git: tiene la vida real del narrador.

import Anthropic from '@anthropic-ai/sdk';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BLOQUES_CAZADOR, controlarElegida, mensajeRepregunta, MODELO_CAZADOR, PRECIO_CAZADOR } from '../src/v3/entrevista/cazador.js';
import { PIDEN_DIA as PIDEN_DIA_FLUJO } from '../src/v3/entrevista/flujo.js';
import { usdDeLlamada } from '../src/escritor/costos.js';

// Las constantes, los bloques y los controles viven en src/v3/entrevista/cazador.ts desde el 01/10 (plan del cazador, B1): acá se importan.
const MODELO = MODELO_CAZADOR;
const PRECIO = PRECIO_CAZADOR;
const FABRICA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROMPT_POR_DEFECTO = path.join(FABRICA, '..', 'docs', 'v3', 'entrevista', 'cazador', 'prompt-v3.md');

const BLOQUES = BLOQUES_CAZADOR;
const PIDEN_DIA = new Set(Object.keys(PIDEN_DIA_FLUJO));

type Respuesta = { id: string; pregunta: string; origen: string; texto: string };
type Elegida = { id: string; cita: string; pregunta: string; tema: string; por_que: string; ya_contado_chequeo: string };

const arg = (n: string) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
export { controlarElegida };
/** El mensaje de la repregunta (mensajeRepregunta en cazador.ts). */
export const mensajeCompleto = mensajeRepregunta;

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

  const prompt = readFileSync(arg('prompt') ?? PROMPT_POR_DEFECTO, 'utf8').split('## Prompt')[1].split('```')[1].trim();
  const ficha = readFileSync(fichaXml, 'utf8');
  const bloques = armarBloques(leerRespuestas(readFileSync(respuestasXml, 'utf8')), modo);
  const cliente = new Anthropic();
  mkdirSync(salida, { recursive: true });
  const proveedor = arg('proveedor') ?? 'opus5';
  if (proveedor !== 'opus5' && proveedor !== 'opus55') throw new Error('--proveedor es opus5 u opus55');
  const modeloUsado = proveedor === 'opus55' ? 'claude-opus-5-5' : 'claude-opus-5';
  const llamar = async (sistema: string, usuario: string): Promise<{ texto: string; usage: { input_tokens: number; output_tokens: number }; costo: number }> => {
    const extra = proveedor === 'opus55' ? { thinking: { type: 'adaptive' }, output_config: { effort: arg('esfuerzo') ?? 'medium' } } : {};
    const m = await cliente.messages.create({ model: modeloUsado, max_tokens: 16000, system: sistema, messages: [{ role: 'user', content: usuario }], ...extra } as Parameters<typeof cliente.messages.create>[0]) as Anthropic.Message;
    const costo = proveedor === 'opus5' ? m.usage.input_tokens * 5e-6 + m.usage.output_tokens * 25e-6 : usdDeLlamada(modeloUsado, m.usage, { lote: false });
    return { texto: m.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join(''), usage: m.usage, costo };
  };

  const rutaPrevio = arg('previo');
  const previo = rutaPrevio
    ? (JSON.parse(readFileSync(rutaPrevio, 'utf8')) as { filas: { bloque: number; elegidas?: Elegida[]; escenas_contadas_bloque?: string[] }[] })
    : undefined;
  const yaRepreguntado: string[] = [];
  const escenasContadas: string[] = [];
  const filas: unknown[] = [];
  const mensajes: string[] = [];
  let gasto = 0;

  for (const [i, bloque] of bloques.entries()) {
    const solo = arg('solo')?.split(',').map(Number);
    if (solo && !solo.includes(i + 1)) {
      // Los bloques que no se corren aportan sus listas desde una corrida anterior (--previo), como en vivo.
      const fila = previo?.filas.find((f) => f.bloque === i + 1);
      for (const e of fila?.elegidas ?? []) yaRepreguntado.push(`${e.id}: ${e.tema}`);
      escenasContadas.push(...(fila?.escenas_contadas_bloque ?? []));
      continue;
    }
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

    const { texto, usage, costo } = await llamar(prompt, usuario);
    const msg = { usage };
    gasto += costo;
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
    writeFileSync(path.join(salida, `cazador-${arg('nombre') ?? 'v3'}.json`), JSON.stringify({ modelo: modeloUsado, gasto_usd: gasto, filas }, null, 2));
    writeFileSync(path.join(salida, `cazador-${arg('nombre') ?? 'v3'}.md`), `# Cazador v3 (${modeloUsado}) · USD ${gasto.toFixed(2)}\n\n${mensajes.join('\n')}`);
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
