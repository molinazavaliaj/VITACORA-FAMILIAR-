import type Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { recortarPerfil, type Perfil } from '../ia/perfil.js';
import { armarSecuencia, tramoDe } from '../ia/secuencia.js';
import { escribirPregunta, partirPromptPregunta, temaHechoEnLinea, type Objetivo, type YaHecha } from '../ia/pregunta-v2.js';
import type { PromptPartido } from '../ia/modelos-v2.js';
import { INTENTOS } from '../ia/control-pregunta.js';
import { calcularUsd, PRECIOS_USD_POR_MILLON, type Uso } from '../costos.js';
import { conversacionDe, yaHechasDe, evitarDe, type EstadoV2 } from './estado-v2.js';

// Ajuste C (24/09, pedido de Naza): ¿Sonnet escribe las preguntas tan bien como Opus? Una
// comparación a ciegas: los mismos momentos del piloto, el mismo prompt, la misma función
// (`escribirPregunta`) y los mismos controles; cambia solo el modelo. Tres modos: `armar` (gratis:
// lee la base y deja todo listo), `correr` (pago, ~USD 1, solo con `--si`) y `revelar` (gratis:
// cruza lo que eligió Naza con la clave). Nada de acá escribe en la base. El script
// (`scripts/comparar-modelos.ts`) solo carga el entorno y conecta la base y el cliente.

/**
 * Opus, fijo para la comparación. Antes del ajuste C era `MODELO_PREGUNTA`; desde que la pregunta
 * pasó a Sonnet, va a mano para que la comparación siga siendo Opus contra Sonnet (si tomara
 * `MODELO_PREGUNTA` ahora compararía Sonnet contra Sonnet).
 */
export const MODELO_OPUS = 'claude-opus-5';
/** El otro modelo de la comparación (desde el ajuste C, el mismo que `MODELO_PREGUNTA` de hoy). */
export const MODELO_A_COMPARAR = 'claude-sonnet-5';
export const MODELOS = { opus: MODELO_OPUS, sonnet: MODELO_A_COMPARAR } as const;
export type QuienEs = keyof typeof MODELOS;

/** El narrador del piloto v2 (Naza). */
export const NARRADOR_PILOTO = 'ea17b848-760a-416a-935c-51f186c7b0ef';
export const MOMENTOS_POR_DEFECTO = 10;
/** El año con que se arma el guion (el del piloto). */
export const ANIO = 2026;
/** Cuántos pares pregunta/respuesta reales lleva cada momento como "lo último que hablaron". */
const PARES_POR_MOMENTO = 3;

type Par = { pregunta: string; respuesta: string };
export type RespuestaDeBase = {
  id?: string; pregunta_orden: number; es_repregunta: boolean; transcripcion: string | null; texto_directo: string | null; recibido_at?: string;
};
export type DatosPiloto = { contexto: Record<string, any>; respuestas: RespuestaDeBase[] };

export type Momento = {
  n: number;
  /** El id de la fila del guion. */
  id: string;
  /** El tema corto (como se lista una ya hecha), para `para-elegir.md`. */
  tema: string;
  objetivo: Objetivo;
  conversacion: Par[];
  yaHechas: YaHecha[];
  evitar: string[];
  /** Lo que se le manda a los DOS modelos, igual. */
  prompt: PromptPartido;
  caracteres: number;
};
export type Momentos = {
  narradorId: string;
  anio: number;
  ficha: Perfil;
  momentos: Momento[];
  /** Los que no se pudieron armar, con el motivo. */
  salteados: string[];
  pares: number;
  paresSinPregunta: number;
};

/** La ficha del final del piloto (`test/fixtures/perfil-naza-piloto.json`), recortada como en el test del tamaño. */
export function fichaDelPiloto(ruta: string | URL): Perfil {
  const cruda = JSON.parse(readFileSync(ruta, 'utf8')) as Perfil;
  return recortarPerfil({ ...cruda, noTuvo: cruda.noTuvo ?? [] });
}

// ── armar ─────────────────────────────────────────────────────────────────

const bloqueDe = (o: Objetivo) => (o.tipo === 'nucleo' ? o.bloque : '');

/**
 * Las filas del guion para comparar, en el orden del guion. Primero lo que el pedido exige (un
 * hermano, la pandemia o el Mundial, hoy, futuro, reflexión), después la primera fila de cada etapa
 * vivida que todavía no esté, y el resto de a una en la etapa que menos tiene. Sin la presentación
 * (no es una pregunta del día).
 */
export function elegirFilas(pendientes: Objetivo[], n: number): Objetivo[] {
  const filas = pendientes.filter((o) => o.tipo === 'nucleo' && o.id !== 'presentacion');
  const elegidas: Objetivo[] = [];
  const sumar = (o: Objetivo | undefined) => { if (o && !elegidas.includes(o) && elegidas.length < n) elegidas.push(o); };
  const primeraDe = (bloque: string) => filas.find((o) => bloqueDe(o) === bloque);
  sumar(filas.find((o) => o.id.startsWith('hermano')));
  sumar(filas.find((o) => o.id === 'historia-grande-pandemia') ?? filas.find((o) => o.id === 'historia-grande-mundial') ?? filas.find((o) => o.id.startsWith('historia-grande')));
  sumar(primeraDe('futuro'));
  sumar(primeraDe('hoy'));
  sumar(primeraDe('reflexion'));
  for (const b of ['inicio', 'infancia', 'juventud', 'adulto joven', 'adultez media', 'segunda mitad']) {
    if (!elegidas.some((o) => bloqueDe(o) === b)) sumar(primeraDe(b));
  }
  // El relleno: de a una, en la etapa que menos tiene (empate: la primera del guion), la fila del
  // medio de esa etapa, sin repetir familia (un solo hermano, una sola historia grande) mientras haya otra.
  const familia = (o: Objetivo) => (o.id.startsWith('hermano') ? 'hermano' : o.id.startsWith('historia-grande') ? 'historia-grande' : o.id);
  while (elegidas.length < n) {
    const libres = filas.filter((o) => !elegidas.includes(o));
    if (!libres.length) break;
    const nuevas = libres.filter((o) => !elegidas.some((e) => familia(e) === familia(o)));
    const candidatas = nuevas.length ? nuevas : libres;
    const cuantas = (b: string) => elegidas.filter((e) => bloqueDe(e) === b).length;
    const bloque = candidatas.map(bloqueDe).reduce((mejor, b) => (cuantas(b) < cuantas(mejor) ? b : mejor));
    const deEse = candidatas.filter((o) => bloqueDe(o) === bloque);
    sumar(deEse[Math.floor((deEse.length - 1) / 2)]);
  }
  return filas.filter((o) => elegidas.includes(o));
}

/** Un estado v2 mínimo, para usar los helpers reales de la puerta manual (`conversacionDe`, `yaHechasDe`). */
function estadoMinimo(v2: Record<string, any>, hechas: Objetivo[] = []): EstadoV2 {
  return {
    secuencia: { pendientes: [], hechas: hechas.map((o, i) => ({ id: o.id, orden: i + 1, tramo: tramoDe(o), objetivo: o })), cubiertos: [], nombrados: {}, caidas: [], objetos: [], ultimoTramo: null, libres: 0 },
    preguntasEnviadas: v2.preguntasEnviadas ?? {},
    repreguntasEnviadas: v2.repreguntasEnviadas ?? {},
    bloqueadas: v2.bloqueadas ?? [],
  } as unknown as EstadoV2;
}

/**
 * Los momentos: para cada fila elegida, las filas anteriores de la secuencia como ya hechas y 3
 * pares REALES del piloto (respuesta de la base + la pregunta que de verdad se le mandó), tomados
 * en orden y avanzando a lo largo del piloto: el primer momento lleva los primeros tres, el último
 * los últimos tres. Con la ficha del FINAL del piloto (el biógrafo ya sabía todo).
 */
export function armarMomentos(o: { ficha: Perfil; piloto: DatosPiloto; n: number; narradorId: string; anio: number }): Momentos {
  const v2 = o.piloto.contexto?.v2;
  if (!v2 || typeof v2 !== 'object') throw new Error(`El narrador ${o.narradorId} no tiene entrevista v2 en la base (falta contexto.v2).`);
  const estado = estadoMinimo(v2);
  const todos = conversacionDe(estado, o.piloto.respuestas, Number.MAX_SAFE_INTEGER);
  const pares = todos.filter((c) => c.pregunta.trim());
  const secuencia = armarSecuencia(o.ficha, o.anio).pendientes;
  const filas = elegirFilas(secuencia, o.n);
  const evitar = evitarDe(o.piloto.contexto);
  const momentos: Momento[] = [];
  const salteados: string[] = [];
  filas.forEach((objetivo, i) => {
    if (pares.length < PARES_POR_MOMENTO) {
      salteados.push(`${objetivo.id}: hay ${pares.length} respuestas con su pregunta en la base y cada momento necesita ${PARES_POR_MOMENTO}`);
      return;
    }
    const fin = PARES_POR_MOMENTO + (filas.length > 1 ? Math.floor((i * (pares.length - PARES_POR_MOMENTO)) / (filas.length - 1)) : pares.length - PARES_POR_MOMENTO);
    const conversacion = pares.slice(fin - PARES_POR_MOMENTO, fin);
    const anteriores = secuencia.slice(0, secuencia.indexOf(objetivo)).filter((x) => x.id !== 'presentacion');
    const yaHechas = yaHechasDe(estadoMinimo(v2, anteriores));
    const prompt = partirPromptPregunta(o.ficha, objetivo, conversacion, yaHechas, evitar);
    momentos.push({
      n: momentos.length + 1, id: objetivo.id, tema: temaHechoEnLinea({ id: objetivo.id, tema: objetivo.tipo === 'nucleo' ? objetivo.tema : objetivo.id }),
      objetivo, conversacion, yaHechas, evitar, prompt, caracteres: prompt.fijo.length + prompt.variable.length,
    });
  });
  return { narradorId: o.narradorId, anio: o.anio, ficha: o.ficha, momentos, salteados, pares: pares.length, paresSinPregunta: todos.length - pares.length };
}

// ── costo estimado ────────────────────────────────────────────────────────

/** Medido en el piloto (test del tamaño de la ficha): 2,3 caracteres por token. Para prosa es de más: estima alto. */
const CARACTERES_POR_TOKEN = 2.3;
const SALIDA_POR_INTENTO = 300;
/** Opus 5 y Sonnet 5 piensan por defecto (la pregunta no apaga el pensar) y eso se cobra como salida. */
const PENSAR_POR_INTENTO = 1000;

const usdDeIntento = (modelo: string, caracteres: number) => {
  const p = PRECIOS_USD_POR_MILLON[modelo];
  return ((caracteres / CARACTERES_POR_TOKEN) * p.input + (SALIDA_POR_INTENTO + PENSAR_POR_INTENTO) * p.output) / 1_000_000;
};

/**
 * Cuánto saldría `correr`: los dos modelos, un intento por momento (esperado) o los tres del
 * control en todos (máximo). Sin contar la caché (la parte fija se lee más barata del 2.º pedido
 * en adelante): estima alto a propósito.
 */
export function estimarUsd(momentos: Momento[]): { esperado: number; maximo: number; supuesto: string } {
  const esperado = momentos.reduce((s, m) => s + usdDeIntento(MODELOS.opus, m.caracteres) + usdDeIntento(MODELOS.sonnet, m.caracteres), 0);
  return {
    esperado, maximo: esperado * INTENTOS,
    supuesto: `${CARACTERES_POR_TOKEN} caracteres por token, ~${SALIDA_POR_INTENTO} tokens de pregunta + ~${PENSAR_POR_INTENTO} de pensar por intento, sin descontar la caché; esperado = 1 intento, máximo = ${INTENTOS} intentos en todos`,
  };
}

// ── correr ────────────────────────────────────────────────────────────────

type Tokens = { input: number; output: number; cache_write: number; cache_read: number };
export type ResultadoModelo = { modelo: string; texto: string; intentos: number; marcada: boolean; marca?: unknown; error?: string; tokens: Tokens; usd: number };
export type Clave = {
  semilla: number;
  momentos: { n: number; id: string; A: QuienEs; opus: ResultadoModelo; sonnet: ResultadoModelo }[];
  totales: Record<QuienEs, { usd: number }>;
};

/** Un azar con semilla (mulberry32): en el test, la misma semilla da el mismo reparto. */
function azar(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const n0 = (v: number | null | undefined) => (typeof v === 'number' ? v : 0);

async function escribirCon(cliente: Anthropic, m: Momento, ficha: Perfil, quien: QuienEs): Promise<ResultadoModelo> {
  const modelo = MODELOS[quien];
  try {
    const r = await escribirPregunta(cliente, ficha, m.objetivo, m.conversacion, m.yaHechas, m.evitar, modelo);
    const tokens: Tokens = { input: 0, output: 0, cache_write: 0, cache_read: 0 };
    let usd = 0;
    for (const u of r.usos as Uso[]) {
      tokens.input += n0(u.input_tokens); tokens.output += n0(u.output_tokens);
      tokens.cache_write += n0(u.cache_creation_input_tokens); tokens.cache_read += n0(u.cache_read_input_tokens);
      usd += calcularUsd(modelo, u);
    }
    return { modelo, texto: r.texto, intentos: r.usos.length, marcada: !r.ok, ...(r.marca ? { marca: r.marca } : {}), tokens, usd };
  } catch (err) {
    // Un corte (max_tokens, sin texto) no frena la comparación: queda anotado y se sigue.
    return { modelo, texto: '', intentos: 0, marcada: true, error: (err as Error).message, tokens: { input: 0, output: 0, cache_write: 0, cache_read: 0 }, usd: 0 };
  }
}

const corto = (t: string, max: number) => {
  const limpio = t.replace(/\s+/g, ' ').trim();
  return limpio.length <= max ? limpio : `${limpio.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
};

/** El texto para Naza: sin decir qué modelo es cuál. */
export function paraElegirMd(datos: Momentos, clave: Clave): string {
  const lineas = [
    '# ¿Cuál pregunta te gusta más?',
    '',
    'Para cada momento hay dos preguntas, **A** y **B**, escritas para vos con lo mismo sobre la mesa: el mismo tema del guion y la misma charla.',
    'Leé las dos y en la línea `Elegís:` escribí **A**, **B** o **igual**. Cuál escribió cada una recién se sabe al final.',
    'Cuando termines, guardá el archivo y corré: `npm run comparar-modelos -- revelar`',
    '',
    '_El biógrafo ya sabía lo que contaste en todo el piloto (la ficha es la del final)._',
  ];
  for (const k of clave.momentos) {
    const m = datos.momentos.find((x) => x.n === k.n)!;
    const [a, b] = k.A === 'opus' ? [k.opus, k.sonnet] : [k.sonnet, k.opus];
    const texto = (r: ResultadoModelo) => (r.error ? `(no salió: ${r.error})` : r.texto);
    lineas.push('', '---', '', `## Momento ${k.n}: ${m.tema}`, '', 'Lo último que hablaron:');
    for (const c of m.conversacion.slice(-2)) lineas.push(`> **P:** ${corto(c.pregunta, 200)}`, '>', `> **R:** ${corto(c.respuesta, 280)}`, '');
    lineas.push(`**A:** ${texto(a)}`, '', `**B:** ${texto(b)}`, '', 'Elegís: ');
  }
  return `${lineas.join('\n')}\n`;
}

/**
 * Cada momento, con Opus y con Sonnet: el mismo prompt, la misma función, los mismos controles.
 * A y B al azar (con `semilla`). No escribe nada en la base.
 */
export async function correrComparacion(
  cliente: Anthropic, datos: Momentos, o: { semilla: number; alAvanzar?: (t: string) => void },
): Promise<{ md: string; clave: Clave; totalUsd: number }> {
  const tirar = azar(o.semilla);
  const clave: Clave = { semilla: o.semilla, momentos: [], totales: { opus: { usd: 0 }, sonnet: { usd: 0 } } };
  for (const m of datos.momentos) {
    const opus = await escribirCon(cliente, m, datos.ficha, 'opus');
    const sonnet = await escribirCon(cliente, m, datos.ficha, 'sonnet');
    const A: QuienEs = tirar() < 0.5 ? 'opus' : 'sonnet';
    clave.momentos.push({ n: m.n, id: m.id, A, opus, sonnet });
    clave.totales.opus.usd += opus.usd;
    clave.totales.sonnet.usd += sonnet.usd;
    o.alAvanzar?.(`momento ${m.n}/${datos.momentos.length} (${m.id}) · USD ${(clave.totales.opus.usd + clave.totales.sonnet.usd).toFixed(3)}`);
  }
  return { md: paraElegirMd(datos, clave), clave, totalUsd: clave.totales.opus.usd + clave.totales.sonnet.usd };
}

// ── revelar ───────────────────────────────────────────────────────────────

const PREGUNTAS_POR_LIBRO = 50;

function eleccion(valor: string): 'A' | 'B' | 'igual' | null | { raro: string } {
  const v = valor.replace(/[*_`]/g, '').trim().toLowerCase();
  if (!v) return null;
  if (v === 'a') return 'A';
  if (v === 'b') return 'B';
  if (['igual', 'iguales', '=', 'empate', 'lo mismo'].includes(v)) return 'igual';
  return { raro: valor.trim() };
}

/** Cruza lo que escribió Naza en `para-elegir.md` con la clave: quién ganó, intentos, marcadas, costo. */
export function revelar(md: string, clave: Clave): string {
  const elegidas = new Map<number, string>();
  let actual: number | null = null;
  for (const l of md.split(/\r?\n/)) {
    const cab = l.match(/^##\s*Momento\s+(\d+)/);
    if (cab) { actual = Number(cab[1]); continue; }
    const el = l.match(/^Eleg[ií]s:(.*)$/);
    if (el && actual !== null) elegidas.set(actual, el[1]);
  }
  const gano = { opus: 0, sonnet: 0, igual: 0 };
  const faltan: number[] = [];
  const raros: string[] = [];
  for (const k of clave.momentos) {
    const e = eleccion(elegidas.get(k.n) ?? '');
    if (e === null) { faltan.push(k.n); continue; }
    if (typeof e === 'object') { raros.push(`momento ${k.n}: no entendí "${e.raro}" (va A, B o igual)`); continue; }
    if (e === 'igual') gano.igual++;
    else gano[e === 'A' ? k.A : k.A === 'opus' ? 'sonnet' : 'opus']++;
  }
  const decididas = gano.opus + gano.sonnet + gano.igual;
  const salida = [`Opus ganó ${gano.opus} · Sonnet ganó ${gano.sonnet} · iguales ${gano.igual} (de ${decididas} elegidas, ${clave.momentos.length} momentos)`];
  if (faltan.length) salida.push(`Falta elegir: momento${faltan.length > 1 ? 's' : ''} ${faltan.join(', ')}`);
  salida.push(...raros);
  const fila = (etiqueta: string, f: (q: QuienEs) => string) => `${etiqueta.padEnd(22)}${f('opus').padStart(10)}${f('sonnet').padStart(10)}`;
  const de = (q: QuienEs) => clave.momentos.map((k) => k[q]);
  const salieron = (q: QuienEs) => de(q).filter((r) => !r.error);
  const usdPorPregunta = (q: QuienEs) => (salieron(q).length ? de(q).reduce((s, r) => s + r.usd, 0) / salieron(q).length : 0);
  salida.push(
    '',
    fila('', (q) => (q === 'opus' ? 'Opus' : 'Sonnet')),
    fila('Intentos (promedio)', (q) => (salieron(q).length ? (salieron(q).reduce((s, r) => s + r.intentos, 0) / salieron(q).length).toFixed(2) : '-')),
    fila('Marcadas por control', (q) => String(de(q).filter((r) => r.marcada && !r.error).length)),
    fila('No salieron (corte)', (q) => String(de(q).filter((r) => r.error).length)),
    fila('USD por pregunta', (q) => usdPorPregunta(q).toFixed(4)),
    fila(`Libro (~${PREGUNTAS_POR_LIBRO} preguntas)`, (q) => (usdPorPregunta(q) * PREGUNTAS_POR_LIBRO).toFixed(2)),
  );
  return salida.join('\n');
}

// ── la base (solo lectura) ────────────────────────────────────────────────

type BaseSoloLectura = { from: (tabla: string) => any };

/** Lee el contexto del narrador y sus respuestas. Solo `select`: nada se escribe. */
export async function leerPiloto(db: BaseSoloLectura, narradorId: string): Promise<DatosPiloto> {
  const n = await db.from('narradores').select('id, contexto').eq('id', narradorId).maybeSingle();
  if (n.error) throw new Error(`No pude leer el narrador ${narradorId}: ${n.error.message}`);
  if (!n.data) throw new Error(`No encontré el narrador ${narradorId}.`);
  const r = await db.from('respuestas')
    .select('id, pregunta_orden, es_repregunta, transcripcion, texto_directo, recibido_at')
    .eq('narrador_id', narradorId).order('recibido_at');
  if (r.error) throw new Error(`No pude leer las respuestas de ${narradorId}: ${r.error.message}`);
  return { contexto: (n.data.contexto ?? {}) as Record<string, any>, respuestas: (r.data ?? []) as RespuestaDeBase[] };
}

// ── el comando ────────────────────────────────────────────────────────────

export type Dependencias = {
  carpeta: string;
  log: (t?: string) => void;
  leerBase: (narradorId: string) => Promise<DatosPiloto>;
  ficha: () => Perfil;
  crearCliente: () => Anthropic;
};

const USO = [
  'Uso (desde entrevistador/):',
  '  npm run comparar-modelos -- armar [--momentos 10] [--narrador <id>]   gratis: lee la base y deja todo listo',
  '  npm run comparar-modelos -- correr [--si] [--semilla N]              pago (~USD 1): solo con --si',
  '  npm run comparar-modelos -- revelar                                  gratis: cruza lo que elegiste con la clave',
].join('\n');

const usd = (v: number) => `USD ${v.toFixed(2)}`;

export async function main(args: string[], d: Dependencias): Promise<number> {
  const [modo] = args;
  const valor = (flag: string) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);
  const rutaMomentos = join(d.carpeta, 'momentos.json');
  const rutaMd = join(d.carpeta, 'para-elegir.md');
  const rutaClave = join(d.carpeta, 'clave.json');

  if (modo === 'armar') {
    const n = Number(valor('--momentos') ?? MOMENTOS_POR_DEFECTO);
    if (!Number.isInteger(n) || n < 1) { d.log('--momentos tiene que ser un número entero, 1 o más.'); return 1; }
    const narradorId = valor('--narrador') ?? NARRADOR_PILOTO;
    const datos = armarMomentos({ ficha: d.ficha(), piloto: await d.leerBase(narradorId), n, narradorId, anio: ANIO });
    mkdirSync(d.carpeta, { recursive: true });
    writeFileSync(rutaMomentos, JSON.stringify(datos, null, 1));
    d.log(`${datos.momentos.length} momentos armados (${datos.pares} respuestas con su pregunta en la base; ${datos.paresSinPregunta} sin pregunta, no se usan).`);
    for (const s of datos.salteados) d.log(`  salteado: ${s}`);
    for (const m of datos.momentos) d.log(`  ${String(m.n).padStart(2)}. ${m.id.padEnd(28)} ${m.caracteres} caracteres`);
    if (datos.momentos.length) {
      const tam = datos.momentos.map((m) => m.caracteres);
      const e = estimarUsd(datos.momentos);
      d.log(`Prompts: de ${Math.min(...tam)} a ${Math.max(...tam)} caracteres (el mismo para los dos modelos).`);
      d.log(`Costo estimado de correr: ${usd(e.esperado)} esperado, ${usd(e.maximo)} como máximo.`);
      d.log(`  (supuesto: ${e.supuesto})`);
    }
    d.log(`Quedó en ${rutaMomentos}. No se llamó a ningún modelo.`);
    d.log('Para correrlo: npm run comparar-modelos -- correr');
    return 0;
  }

  if (modo === 'correr') {
    if (!existsSync(rutaMomentos)) { d.log('Todavía no están los momentos. Primero: npm run comparar-modelos -- armar'); return 1; }
    const datos = JSON.parse(readFileSync(rutaMomentos, 'utf8')) as Momentos;
    const e = estimarUsd(datos.momentos);
    d.log(`${datos.momentos.length} momentos, cada uno con los dos modelos. Costo estimado: ${usd(e.esperado)} esperado, ${usd(e.maximo)} como máximo.`);
    if (!args.includes('--si')) {
      d.log('No llamé a ningún modelo. Para correrlo de verdad (se paga):');
      d.log('  npm run comparar-modelos -- correr --si');
      return 0;
    }
    const semilla = Number(valor('--semilla') ?? Date.now() % 2_147_483_647);
    const r = await correrComparacion(d.crearCliente(), datos, { semilla, alAvanzar: (t) => d.log(`  ${t}`) });
    writeFileSync(rutaMd, r.md);
    writeFileSync(rutaClave, JSON.stringify(r.clave, null, 1));
    d.log(`Listo: ${rutaMd} (para elegir) y ${rutaClave} (no lo abras hasta elegir).`);
    d.log(`Costo real: USD ${r.totalUsd.toFixed(4)}.`);
    d.log('Cuando elijas: npm run comparar-modelos -- revelar');
    return 0;
  }

  if (modo === 'revelar') {
    if (!existsSync(rutaMd) || !existsSync(rutaClave)) { d.log('Faltan para-elegir.md o clave.json: primero npm run comparar-modelos -- correr --si'); return 1; }
    d.log(revelar(readFileSync(rutaMd, 'utf8'), JSON.parse(readFileSync(rutaClave, 'utf8')) as Clave));
    return 0;
  }

  d.log(USO);
  return 1;
}
