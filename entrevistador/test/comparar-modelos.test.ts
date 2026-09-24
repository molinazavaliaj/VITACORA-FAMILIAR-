import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  elegirFilas, armarMomentos, estimarUsd, correrComparacion, revelar, main, leerPiloto, fichaDelPiloto,
  MODELO_A_COMPARAR, type DatosPiloto,
} from '../src/manual/comparar-modelos.js';
import { armarSecuencia } from '../src/ia/secuencia.js';
import { MODELO_PREGUNTA } from '../src/ia/modelos-v2.js';

// Ajuste C: la comparación a ciegas Opus contra Sonnet. Todo con base FALSA y cliente FALSO:
// ninguna llamada sale de acá.

const RUTA_FICHA = new URL('./fixtures/perfil-naza-piloto.json', import.meta.url);
const ficha = fichaDelPiloto(RUTA_FICHA);

/** Un piloto falso: 20 pares pregunta/respuesta, con la pregunta en contexto.v2.preguntasEnviadas. */
function pilotoFalso(pares = 20): DatosPiloto {
  const preguntasEnviadas: Record<string, string> = {};
  const respuestas = [];
  for (let i = 1; i <= pares; i++) {
    preguntasEnviadas[String(i)] = `¿Pregunta falsa número ${i}?`;
    respuestas.push({
      id: `r${i}`, pregunta_orden: i, es_repregunta: false, texto_directo: null,
      transcripcion: `Respuesta falsa ${i}, con algo que contar sobre el día ${i}.`,
      recibido_at: `2026-09-${String(i).padStart(2, '0')}T12:00:00Z`,
    });
  }
  return { contexto: { v2: { preguntasEnviadas, repreguntasEnviadas: {}, bloqueadas: [] } }, respuestas };
}

/** El cliente falso: devuelve una pregunta que pasa los controles, distinta por modelo (para reconocerla). */
function clienteFalso(textos: Record<string, string[]> = {}) {
  const i: Record<string, number> = {};
  const create = vi.fn(async (args: { model: string }) => {
    const lista = textos[args.model] ?? [args.model === MODELO_PREGUNTA ? '¿Cómo te acordás de eso, Naza?' : '¿Qué te quedó de ese momento, Naza?'];
    const k = i[args.model] ?? 0;
    i[args.model] = k + 1;
    return { content: [{ type: 'text', text: lista[Math.min(k, lista.length - 1)] }], stop_reason: 'end_turn', usage: { input_tokens: 1000, output_tokens: 200 } };
  });
  return { cliente: { messages: { create } } as unknown as Anthropic, create };
}

describe('elegirFilas', () => {
  const pendientes = armarSecuencia(ficha, 2026).pendientes;
  it('10 por defecto, sin la presentación, en el orden del guion, con hermano, pandemia o Mundial, hoy, futuro y reflexión', () => {
    const filas = elegirFilas(pendientes, 10);
    const ids = filas.map((f) => f.id);
    expect(ids).toHaveLength(10);
    expect(ids).not.toContain('presentacion');
    expect(ids.some((id) => id.startsWith('hermano'))).toBe(true);
    expect(ids.some((id) => id === 'historia-grande-pandemia' || id === 'historia-grande-mundial')).toBe(true);
    const bloques = new Set(filas.map((f) => (f.tipo === 'nucleo' ? f.bloque : '')));
    for (const b of ['inicio', 'infancia', 'juventud', 'adulto joven', 'hoy', 'futuro', 'reflexion']) expect(bloques).toContain(b);
    const orden = pendientes.map((p) => p.id);
    expect(ids.map((id) => orden.indexOf(id))).toEqual([...ids.map((id) => orden.indexOf(id))].sort((a, b) => a - b));
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('el relleno no repite familia (un solo hermano, una sola historia grande) y reparte por etapa: una o dos cada una', () => {
    const filas = elegirFilas(pendientes, 10);
    const ids = filas.map((f) => f.id);
    expect(ids.filter((id) => id.startsWith('hermano'))).toHaveLength(1);
    expect(ids.filter((id) => id.startsWith('historia-grande-'))).toHaveLength(1);
    const porBloque = new Map<string, number>();
    for (const f of filas) if (f.tipo === 'nucleo') porBloque.set(f.bloque, (porBloque.get(f.bloque) ?? 0) + 1);
    expect(Math.max(...porBloque.values())).toBeLessThanOrEqual(2);
  });
  it('con menos momentos se queda con lo que el pedido exige primero', () => {
    const ids = elegirFilas(pendientes, 3).map((f) => f.id);
    expect(ids).toHaveLength(3);
    expect(ids.some((id) => id.startsWith('hermano'))).toBe(true);
    expect(ids.some((id) => id.startsWith('historia-grande-'))).toBe(true);
    expect(ids.some((id) => id.startsWith('lo-que-'))).toBe(true);
  });
});

describe('armarMomentos', () => {
  it('N momentos, cada uno con 3 pares reales distintos (avanzando), las filas anteriores como ya hechas y el prompt listo', () => {
    const m = armarMomentos({ ficha, piloto: pilotoFalso(20), n: 10, narradorId: 'nz', anio: 2026 });
    expect(m.momentos).toHaveLength(10);
    expect(m.salteados).toEqual([]);
    const conversaciones = m.momentos.map((x) => x.conversacion.map((c) => c.respuesta).join('|'));
    expect(new Set(conversaciones).size).toBe(10);
    for (const x of m.momentos) {
      expect(x.conversacion).toHaveLength(3);
      expect(x.conversacion.every((c) => c.pregunta.startsWith('¿Pregunta falsa'))).toBe(true);
      expect(x.caracteres).toBe(x.prompt.fijo.length + x.prompt.variable.length);
      expect(x.prompt.variable).toContain(x.conversacion[2].respuesta);
    }
    // Avanza a lo largo del piloto: el primero arranca al principio, el último termina al final.
    expect(m.momentos[0].conversacion[0].respuesta).toContain('Respuesta falsa 1,');
    expect(m.momentos.at(-1)!.conversacion[2].respuesta).toContain('Respuesta falsa 20,');
    // Las ya hechas: las filas anteriores de la secuencia (sin la presentación).
    const orden = armarSecuencia(ficha, 2026).pendientes.map((p) => p.id);
    const ultimo = m.momentos.at(-1)!;
    expect(ultimo.yaHechas.map((y) => y.id)).toEqual(orden.slice(1, orden.indexOf(ultimo.id)));
    expect(m.momentos[0].yaHechas.length).toBeLessThan(ultimo.yaHechas.length);
  });
  it('las bloqueadas por audio cruzado y las respuestas sin su pregunta no entran; si no hay 3 pares, saltea y lo dice', () => {
    const p = pilotoFalso(4);
    (p.contexto.v2 as Record<string, unknown>).bloqueadas = ['r2'];
    delete (p.contexto.v2 as { preguntasEnviadas: Record<string, string> }).preguntasEnviadas['3'];
    const m = armarMomentos({ ficha, piloto: p, n: 5, narradorId: 'nz', anio: 2026 });
    expect(m.momentos).toHaveLength(0);
    expect(m.salteados).toHaveLength(5);
    expect(m.salteados[0]).toMatch(/3/);
    expect(m.paresSinPregunta).toBe(1);
  });
  it('sin entrevista v2 en la base, tira un error claro', () => {
    expect(() => armarMomentos({ ficha, piloto: { contexto: {}, respuestas: [] }, n: 10, narradorId: 'nz', anio: 2026 })).toThrow(/contexto\.v2/);
  });
});

describe('estimarUsd', () => {
  it('suma los dos modelos: el esperado es un intento, el máximo tres; dice el supuesto', () => {
    const m = armarMomentos({ ficha, piloto: pilotoFalso(20), n: 10, narradorId: 'nz', anio: 2026 });
    const e = estimarUsd(m.momentos);
    expect(e.esperado).toBeGreaterThan(0);
    expect(e.maximo).toBeCloseTo(e.esperado * 3, 6);
    expect(e.supuesto).toMatch(/pensar/);
  });
});

describe('correrComparacion (cliente falso)', () => {
  it('cada momento: una llamada a cada modelo con el mismo contenido; A/B al azar con semilla; el .md no nombra modelos', async () => {
    const m = armarMomentos({ ficha, piloto: pilotoFalso(20), n: 10, narradorId: 'nz', anio: 2026 });
    const { cliente, create } = clienteFalso();
    const r = await correrComparacion(cliente, m, { semilla: 7 });
    expect(create).toHaveBeenCalledTimes(20);
    const llamadas = create.mock.calls.map((c) => c[0] as { model: string; max_tokens: number; messages: unknown });
    for (let k = 0; k < 10; k++) {
      const [a, b] = [llamadas[2 * k], llamadas[2 * k + 1]];
      expect(new Set([a.model, b.model])).toEqual(new Set([MODELO_PREGUNTA, MODELO_A_COMPARAR]));
      expect(a.messages).toEqual(b.messages);
      expect(a.max_tokens).toBe(b.max_tokens);
    }
    expect(r.md).not.toMatch(/opus|sonnet|claude|haiku|fable/i);
    expect(r.md.match(/^Elegís: *$/gm)).toHaveLength(10);
    const letras = r.clave.momentos.map((x) => x.A);
    expect(letras).toContain('opus');
    expect(letras).toContain('sonnet');
    // La misma semilla da el mismo reparto.
    const otra = await correrComparacion(clienteFalso().cliente, m, { semilla: 7 });
    expect(otra.clave.momentos.map((x) => x.A)).toEqual(letras);
    // En el .md, A es la pregunta del modelo que la clave dice.
    const primero = r.clave.momentos[0];
    const textoA = primero.A === 'opus' ? '¿Cómo te acordás de eso, Naza?' : '¿Qué te quedó de ese momento, Naza?';
    expect(r.md).toContain(`**A:** ${textoA}`);
    expect(r.clave.momentos[0].opus.intentos).toBe(1);
    expect(r.totalUsd).toBeGreaterThan(0);
    expect(r.clave.totales.opus.usd).toBeGreaterThan(r.clave.totales.sonnet.usd);
  });
  it('los reintentos del control cuentan en la clave, y la marcada queda anotada', async () => {
    const m = armarMomentos({ ficha, piloto: pilotoFalso(20), n: 1, narradorId: 'nz', anio: 2026 });
    const { cliente, create } = clienteFalso({ [MODELO_A_COMPARAR]: ['Contame.', '', ''] });
    const r = await correrComparacion(cliente, m, { semilla: 1 });
    expect(create).toHaveBeenCalledTimes(4);
    expect(r.clave.momentos[0].sonnet.intentos).toBe(3);
    expect(r.clave.momentos[0].sonnet.marcada).toBe(true);
    expect(r.clave.momentos[0].opus.marcada).toBe(false);
  });
});

describe('revelar', () => {
  it('cuenta A/B/igual contra la clave y avisa los que faltan', async () => {
    const m = armarMomentos({ ficha, piloto: pilotoFalso(20), n: 4, narradorId: 'nz', anio: 2026 });
    const r = await correrComparacion(clienteFalso().cliente, m, { semilla: 3 });
    const letraDe = (k: number, quien: 'opus' | 'sonnet') => (r.clave.momentos[k].A === quien ? 'A' : 'B');
    const elecciones = [letraDe(0, 'opus'), letraDe(1, 'sonnet'), 'igual', ''];
    let k = 0;
    const md = r.md.replace(/^Elegís: *$/gm, () => `Elegís: ${elecciones[k++]}`);
    const salida = revelar(md, r.clave);
    expect(salida).toMatch(/Opus ganó 1/);
    expect(salida).toMatch(/Sonnet ganó 1/);
    expect(salida).toMatch(/iguales 1/);
    expect(salida).toMatch(/Falta elegir: momento 4/);
    expect(salida).toMatch(/50 preguntas/);
  });
  it('acepta minúsculas y "=" como igual; lo que no entiende lo dice', () => {
    const clave = { semilla: 1, momentos: [1, 2, 3].map((n) => ({ n, id: `f${n}`, A: 'opus' as const, opus: resultado(), sonnet: resultado() })), totales: { opus: { usd: 0 }, sonnet: { usd: 0 } } };
    const md = ['## Momento 1', 'Elegís: a', '## Momento 2', 'Elegís: =', '## Momento 3', 'Elegís: quizás'].join('\n');
    const salida = revelar(md, clave);
    expect(salida).toMatch(/Opus ganó 1/);
    expect(salida).toMatch(/iguales 1/);
    expect(salida).toMatch(/momento 3.*quizás/);
  });
});

function resultado() {
  return { modelo: 'x', texto: '¿?', intentos: 1, marcada: false, tokens: { input: 0, output: 0, cache_write: 0, cache_read: 0 }, usd: 0 };
}

describe('leerPiloto (base falsa, solo lectura)', () => {
  it('lee el contexto del narrador y sus respuestas; no escribe nada', async () => {
    const escrituras: string[] = [];
    const tablas: Record<string, Record<string, unknown>[]> = {
      narradores: [{ id: 'nz', contexto: { v2: { preguntasEnviadas: { 1: '¿Hola?' } } } }, { id: 'otro', contexto: {} }],
      respuestas: [{ id: 'r1', narrador_id: 'nz', pregunta_orden: 1 }, { id: 'r9', narrador_id: 'otro', pregunta_orden: 1 }],
    };
    const db = {
      from(t: string) {
        let filas = tablas[t];
        const q: any = {
          select: () => q,
          eq: (c: string, v: unknown) => { filas = filas.filter((f) => f[c] === v); return q; },
          order: () => q,
          maybeSingle: async () => ({ data: filas[0] ?? null, error: null }),
          then: (ok: (r: unknown) => void) => ok({ data: filas, error: null }),
          insert: () => { escrituras.push(t); return q; },
          update: () => { escrituras.push(t); return q; },
          upsert: () => { escrituras.push(t); return q; },
          delete: () => { escrituras.push(t); return q; },
        };
        return q;
      },
    };
    const p = await leerPiloto(db as never, 'nz');
    expect(p.contexto).toEqual({ v2: { preguntasEnviadas: { 1: '¿Hola?' } } });
    expect(p.respuestas.map((r) => r.id)).toEqual(['r1']);
    expect(escrituras).toEqual([]);
    await expect(leerPiloto(db as never, 'no-existe')).rejects.toThrow(/no-existe/);
  });
});

describe('main (los tres modos, con base y cliente falsos)', () => {
  let carpeta: string;
  let lineas: string[];
  const log = (t = '') => { lineas.push(t); };
  beforeEach(() => { carpeta = mkdtempSync(join(tmpdir(), 'comparar-')); lineas = []; });
  afterEach(() => rmSync(carpeta, { recursive: true, force: true }));

  it('armar: no llama al modelo, escribe momentos.json con N momentos e imprime tamaños y costo', async () => {
    const crearCliente = vi.fn();
    const leerBase = vi.fn(async () => pilotoFalso(20));
    const codigo = await main(['armar', '--momentos', '6'], { carpeta, log, leerBase, ficha: () => ficha, crearCliente });
    expect(codigo).toBe(0);
    expect(crearCliente).not.toHaveBeenCalled();
    expect(leerBase).toHaveBeenCalledWith('ea17b848-760a-416a-935c-51f186c7b0ef');
    const m = JSON.parse(readFileSync(join(carpeta, 'momentos.json'), 'utf8'));
    expect(m.momentos).toHaveLength(6);
    const salida = lineas.join('\n');
    expect(salida).toMatch(/6 momentos/);
    expect(salida).toMatch(/caracteres/);
    expect(salida).toMatch(/USD/);
    expect(salida).toContain('npm run comparar-modelos -- correr');
  });
  it('armar con --narrador lee ese narrador', async () => {
    const leerBase = vi.fn(async () => pilotoFalso(20));
    await main(['armar', '--narrador', 'otro-id'], { carpeta, log, leerBase, ficha: () => ficha, crearCliente: vi.fn() });
    expect(leerBase).toHaveBeenCalledWith('otro-id');
  });
  it('correr sin --si: dice el costo y el comando exacto, y no llama al modelo', async () => {
    await main(['armar'], { carpeta, log, leerBase: async () => pilotoFalso(20), ficha: () => ficha, crearCliente: vi.fn() });
    lineas = [];
    const { cliente, create } = clienteFalso();
    const crearCliente = vi.fn(() => cliente);
    const codigo = await main(['correr'], { carpeta, log, leerBase: vi.fn(), ficha: () => ficha, crearCliente });
    expect(codigo).toBe(0);
    expect(crearCliente).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    expect(lineas.join('\n')).toContain('npm run comparar-modelos -- correr --si');
    expect(existsSync(join(carpeta, 'para-elegir.md'))).toBe(false);
  });
  it('correr sin momentos.json: pide armar primero', async () => {
    const codigo = await main(['correr', '--si'], { carpeta, log, leerBase: vi.fn(), ficha: () => ficha, crearCliente: vi.fn() });
    expect(codigo).toBe(1);
    expect(lineas.join('\n')).toContain('npm run comparar-modelos -- armar');
  });
  it('correr --si y revelar: escribe para-elegir.md y clave.json, sin leer la base; revelar avisa lo que falta', async () => {
    await main(['armar', '--momentos', '4'], { carpeta, log, leerBase: async () => pilotoFalso(20), ficha: () => ficha, crearCliente: vi.fn() });
    const { cliente, create } = clienteFalso();
    const leerBase = vi.fn();
    const codigo = await main(['correr', '--si', '--semilla', '5'], { carpeta, log, leerBase, ficha: () => ficha, crearCliente: () => cliente });
    expect(codigo).toBe(0);
    expect(leerBase).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledTimes(8);
    const md = readFileSync(join(carpeta, 'para-elegir.md'), 'utf8');
    expect(md).not.toMatch(/opus|sonnet|claude/i);
    expect(md).toMatch(/ya sabía lo que contaste en todo el piloto/);
    const clave = JSON.parse(readFileSync(join(carpeta, 'clave.json'), 'utf8'));
    expect(clave.momentos).toHaveLength(4);
    expect(lineas.join('\n')).toMatch(/costo real.*USD/i);
    lineas = [];
    writeFileSync(join(carpeta, 'para-elegir.md'), md.replace(/^Elegís: *$/m, 'Elegís: A'));
    expect(await main(['revelar'], { carpeta, log, leerBase: vi.fn(), ficha: () => ficha, crearCliente: vi.fn() })).toBe(0);
    expect(lineas.join('\n')).toMatch(/Falta elegir: momentos 2, 3, 4/);
  });
  it('un modo que no existe: dice el uso', async () => {
    expect(await main(['otra'], { carpeta, log, leerBase: vi.fn(), ficha: () => ficha, crearCliente: vi.fn() })).toBe(1);
    expect(lineas.join('\n')).toMatch(/armar.*correr.*revelar/s);
  });
});
