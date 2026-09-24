import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// La puerta manual v2 de punta a punta, con la base y el modelo FALSOS (en memoria): lo que Naza
// va a correr de verdad tiene que andar la primera vez, y la única forma de probarlo sin gastar ni
// tocar la base real es correr el script entero contra esto. Ninguna llamada sale de acá.

const h = vi.hoisted(() => {
  process.env.SUPABASE_URL = 'http://base-falsa.invalid';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'falsa';
  process.env.ANTHROPIC_API_KEY = 'falsa';
  process.env.OPENAI_API_KEY = 'falsa';
  type Fila = Record<string, any>;
  const tablas: Record<string, Fila[]> = {
    familias: [{ id: 'fam-naza', email: 'nazamateos@gmail.com', nombre: 'Naza' }],
    narradores: [{ id: 'otro', familia_id: 'fam-naza', nombre: 'Ciro', como_le_dicen: 'Ciro', zona_horaria: 'America/Argentina/Buenos_Aires', contexto: {}, estado: 'activo', dia_actual: 3, created_at: '2026-09-01T00:00:00Z' }],
    respuestas: [{ id: 'r-ciro', narrador_id: 'otro', pregunta_orden: 2, es_repregunta: false, transcripcion: 'En la casa de mi abuela en Concordia había un patio enorme con un limonero y un perro que se llamaba Tango, y todas las tardes tomábamos mate con mi hermana', texto_directo: null, duracion_segundos: 30, audio_path: null, recibido_at: '2026-09-01T00:00:00Z' }],
    consumo_ia: [],
  };
  let reloj = 0;
  const ahora = () => new Date(Date.UTC(2026, 8, 24, 12, 0, reloj++)).toISOString();
  const DEFAULTS: Record<string, Fila> = {
    narradores: { estado: 'invitado', dia_actual: 0, contexto: {} },
    respuestas: { es_repregunta: false, audio_path: null, transcripcion: null, texto_directo: null, duracion_segundos: null },
  };
  function from(tabla: string) {
    const q = { filtros: [] as ((f: Fila) => boolean)[], orden: [] as string[], op: 'select', payload: null as any, modo: 'muchas' };
    const b: any = {
      select: () => b,
      insert: (p: Fila) => { q.op = 'insert'; q.payload = structuredClone(p); return b; },
      update: (p: Fila) => { q.op = 'update'; q.payload = structuredClone(p); return b; },
      eq: (c: string, v: unknown) => { q.filtros.push((f) => f[c] === v); return b; },
      neq: (c: string, v: unknown) => { q.filtros.push((f) => f[c] !== v); return b; },
      ilike: (c: string, v: string) => { q.filtros.push((f) => String(f[c]).toLowerCase() === v.toLowerCase()); return b; },
      limit: () => b,
      order: (c: string) => { q.orden.push(c); return b; },
      single: () => { q.modo = 'una'; return b; },
      maybeSingle: () => { q.modo = 'quizas'; return b; },
      then: (ok: (x: unknown) => unknown, mal: (e: unknown) => unknown) => Promise.resolve(ejecutar()).then(ok, mal),
    };
    function ejecutar() {
      const t = tablas[tabla];
      let filas: Fila[];
      if (q.op === 'insert') {
        const nueva = { id: `${tabla}-${t.length + 1}-${reloj}`, created_at: ahora(), recibido_at: ahora(), ...structuredClone(DEFAULTS[tabla] ?? {}), ...q.payload };
        t.push(nueva);
        filas = [nueva];
      } else {
        filas = t.filter((f) => q.filtros.every((fn) => fn(f)));
        if (q.op === 'update') for (const f of filas) Object.assign(f, structuredClone(q.payload));
        for (const c of [...q.orden].reverse()) filas = [...filas].sort((a, z) => (a[c] > z[c] ? 1 : a[c] < z[c] ? -1 : 0));
      }
      const data = filas.map((f) => structuredClone(f));
      if (q.modo === 'una') return data.length === 1 ? { data: data[0], error: null } : { data: null, error: { message: `se esperaba una fila, hay ${data.length}` } };
      if (q.modo === 'quizas') return { data: data[0] ?? null, error: null };
      return { data, error: null };
    }
    return b;
  }
  const db = {
    from,
    storage: {
      from: () => ({
        list: async () => ({ data: [] }),
        upload: async (path: string) => { subidos.push(path); return { error: null }; },
        download: async (path: string) => { bajados.push(path); return { data: new Blob([new Uint8Array(4096)]), error: null }; },
      }),
    },
  };
  const bajados: string[] = [];
  const subidos: string[] = [];
  // Fallas a pedido: cuántas veces seguidas se cae la evaluación o la transcripción.
  const fallar = { evaluar: 0, transcribir: 0 };
  // Salidas cortadas a pedido (stop_reason max_tokens, arreglo final I2): cuántas evaluaciones seguidas.
  const cortar = { evaluar: 0 };
  const ffmpeg: string[][] = [];

  // El modelo falso: contesta según qué prompt le llega. Las colas dicen qué devuelve el perfil y
  // la evaluación en cada llamada (vacías: "{}" y "alcanza").
  const colaPerfil: string[] = [];
  const colaEvaluar: string[] = [];
  const colaTranscripcion: string[] = [];
  const colaPedidos: string[] = [];
  const llamadas: string[] = [];
  const modelos: string[] = [];
  /** Lo que dura cada audio falso (segundos). */
  const duracion = { s: 42 };
  let n = 0;
  const prompts: string[] = [];
  function responder(prompt: string): string {
    prompts.push(prompt);
    if (prompt.includes('LO QUE TE TOCA PREGUNTAR HOY')) {
      if (prompt.includes('Es una repregunta a lo de hoy')) { llamadas.push('repregunta'); return `¿Y de eso que faltó, qué me contás? (${++n})`; }
      llamadas.push('pregunta');
      if (prompt.includes('Es el PRIMER mensaje')) return 'Hola, soy el biógrafo que va a escribir el libro de tu vida. Una pregunta por día, la contestás con un audio cuando puedas. Para empezar: cómo preferís que te hable, cuántos años tenés y cómo te dicen en casa.';
      if (prompt.includes('El censo: quiénes son los suyos hoy')) return 'Contame quiénes son los tuyos hoy.'; // sin "?": la marca
      if (prompt.includes('Pedile UNA cosa')) return `¿Tenés alguna foto o cosa de esa época para mostrarme? (${++n})`;
      return `¿Qué te acordás de aquellos años, lo número ${++n}?`;
    }
    if (prompt.includes('LO QUE YA SABÉS (tu ficha de trabajo')) { llamadas.push('perfil'); return colaPerfil.shift() ?? '{}'; }
    if (prompt.includes('No tenés que juzgar si alcanza')) { llamadas.push('pedidos'); return colaPedidos.shift() ?? '{}'; }
    if (prompt.includes('LA PREGUNTA DE HOY')) {
      llamadas.push('evaluar');
      if (fallar.evaluar > 0) { fallar.evaluar--; throw new Error('529 overloaded (falso)'); }
      return colaEvaluar.shift() ?? '{"suficiente": true, "falto": []}';
    }
    throw new Error(`prompt que el modelo falso no conoce: ${prompt.slice(0, 80)}`);
  }
  return { tablas, db, cortar, colaPerfil, colaEvaluar, colaPedidos, colaTranscripcion, llamadas, modelos, prompts, duracion, responder, fallar, bajados, subidos, ffmpeg };
});

vi.mock('../src/db/cliente.js', () => ({ db: h.db }));
vi.mock('../src/ia/transcribir.js', () => ({
  transcribirYActualizar: async (id: string) => {
    if (h.fallar.transcribir > 0) { h.fallar.transcribir--; throw new Error('transcripción caída (falsa)'); }
    const texto = h.colaTranscripcion.shift() ?? 'algo';
    Object.assign(h.tablas.respuestas.find((r) => r.id === id)!, { transcripcion: texto, duracion_segundos: h.duracion.s });
    return { texto, duracionSegundos: h.duracion.s };
  },
}));
// ffmpeg falso: "une" los audios escribiendo el archivo de salida (el último argumento).
vi.mock('node:child_process', async () => {
  const fs = await import('node:fs');
  return {
    execFileSync: (cmd: string, args: string[]) => {
      h.ffmpeg.push([cmd, ...args]);
      fs.writeFileSync(args[args.length - 1], Buffer.alloc(8192, 3));
    },
  };
});
vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = {
      create: async ({ model, messages }: { model: string; messages: { content: string | { text: string }[] }[] }) => {
        h.modelos.push(model);
        // Ajuste B: el prompt llega partido en bloques (lo fijo cacheado + lo variable); acá se lee entero.
        const c = messages[0].content;
        const prompt = typeof c === 'string' ? c : c.map((b) => b.text).join('');
        const texto = h.responder(prompt);
        const esEvaluacion = prompt.includes('LA PREGUNTA DE HOY') && !prompt.includes('LO QUE TE TOCA PREGUNTAR HOY');
        if (esEvaluacion && h.cortar.evaluar > 0) {
          h.cortar.evaluar--;
          return { content: [{ type: 'text', text: '{"suficiente": false, "quiereParar": tr' }], stop_reason: 'max_tokens', usage: { input_tokens: 1000, output_tokens: 4000 } };
        }
        return { content: [{ type: 'text', text: texto }], stop_reason: 'end_turn', usage: { input_tokens: 1000, output_tokens: 100 } };
      },
    };
  },
}));

const salida: string[] = [];
async function correr(...args: string[]): Promise<{ texto: string; fallo: boolean }> {
  salida.length = 0;
  process.exitCode = undefined;
  process.argv = ['node', 'manual-v2.ts', ...args];
  vi.resetModules();
  const m = await import('../scripts/manual-v2.js');
  await m.listo;
  const fallo = process.exitCode === 1;
  process.exitCode = undefined;
  return { texto: salida.join('\n'), fallo };
}
const naza = () => h.tablas.narradores.find((x) => x.como_le_dicen === 'Pruebav2')!;
const v2 = () => naza().contexto.v2;

let carpeta = '';
beforeAll(() => {
  vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => { salida.push(a.join(' ')); });
  vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => { salida.push(a.join(' ')); });
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  carpeta = mkdtempSync(join(tmpdir(), 'manual-v2-'));
  // Los respaldos de audio van a la carpeta temporal, no a audios-crudos del repo.
  process.env.MANUAL_V2_CRUDOS = join(carpeta, 'crudos');
});
afterAll(() => {
  vi.restoreAllMocks();
  delete process.env.MANUAL_V2_CRUDOS;
  rmSync(carpeta, { recursive: true, force: true });
});
const audio = (nombre: string) => { const r = join(carpeta, nombre); writeFileSync(r, Buffer.alloc(4096, 1)); return r; };
const filaDe = (id: string) => h.tablas.respuestas.find((x) => x.id === id);

describe('manual-v2 de punta a punta (base y modelo falsos)', () => {
  it('empezar crea al narrador sin ficha, escribe la presentación y la deja para pegar', async () => {
    const r = await correr('empezar', 'pruebav2');
    expect(r.fallo).toBe(false);
    // 'pausado' a propósito: el único estado que el scheduler de producción no toca.
    expect(naza()).toMatchObject({ telefono_whatsapp: '+manual-pruebav2', estado: 'pausado', dia_actual: 0, familia_id: 'fam-naza' });
    expect(naza().contexto.modoRapido).toBe(true);
    expect(v2().preguntasEnviadas['0']).toMatch(/^Hola, soy el biógrafo/);
    // El candado del anticipo de producción, desde el día 0: la fábrica no le manda el anticipo v1.
    expect(h.subidos).toContain(`${naza().id}/paquete/anticipo_enviado.txt`);
    expect(v2().secuencia.hechas.map((x: any) => x.id)).toEqual(['presentacion']);
    // El texto para pegar va entero y al final.
    expect(r.texto.trim().endsWith(v2().preguntasEnviadas['0'])).toBe(true);
    expect((await correr('empezar', 'pruebav2')).fallo).toBe(true); // no se empieza dos veces
  });

  it('la casa sale aunque la presentación no tenga respuesta; después, siguiente espera la respuesta', async () => {
    const r = await correr('siguiente', 'pruebav2');
    expect(r.fallo).toBe(false);
    expect(v2().secuencia.hechas.map((x: any) => x.id)).toEqual(['presentacion', 'casa-infancia']);
    expect(naza().dia_actual).toBe(1);
    const otra = await correr('siguiente', 'pruebav2');
    expect(otra.fallo).toBe(true);
    expect(otra.texto).toMatch(/orden 1 todavía no tiene respuesta/);
  });

  it('la respuesta a la presentación (con --orden 0) solo alimenta el perfil: sin evaluación; con la edad, planifica', async () => {
    h.colaPerfil.push(JSON.stringify({
      persona: { edad: { valor: '27', fuente: 'dicho' }, comoHabla: { valor: 'vos', fuente: 'dicho' }, comoLeDicen: { valor: 'Naza', fuente: 'dicho' }, genero: { valor: 'hombre', fuente: 'deducido', por: 'habla de sí en masculino' } },
    }));
    h.llamadas.length = 0;
    const firmaAntes = v2().firmaGuion;
    const r = await correr('cargar', 'pruebav2', '--texto', 'Hola, de vos. Tengo 27 y me dicen Naza.', '--orden', '0');
    expect(r.fallo).toBe(false);
    expect(h.llamadas).toEqual(['perfil']);
    expect(v2().perfil.persona.comoLeDicen.valor).toBe('Naza');
    // Con la edad, el guion se rearma (la firma cambia) y el adulto joven sigue adentro.
    expect(v2().firmaGuion).not.toBe('');
    expect(v2().firmaGuion).not.toBe(firmaAntes);
    expect(v2().secuencia.pendientes.some((o: any) => o.id === 'oficio')).toBe(true);
    expect(h.tablas.respuestas.filter((x) => x.narrador_id === naza().id)).toHaveLength(1);
  });

  it('cargar la casa: evalúa y la repregunta sale entera al final; la respuesta a la repregunta no se repregunta', async () => {
    h.colaEvaluar.push('{"suficiente": false, "falto": ["el olor", "quién estaba"]}');
    h.llamadas.length = 0;
    const r = await correr('cargar', 'pruebav2', '--texto', 'Era una casa chica en Quilmes con un patio.');
    expect(r.fallo).toBe(false);
    expect(h.llamadas).toContain('repregunta');
    expect(v2().repreguntasEnviadas['1']).toMatch(/^¿Y de eso que faltó, qué me contás\? \(\d+\)$/);
    expect(r.texto).toMatch(/faltó: el olor; quién estaba/);
    expect(r.texto.trim().endsWith(v2().repreguntasEnviadas['1'])).toBe(true);
    // La respuesta a la repregunta no se evalúa entera: solo los pedidos (Haiku).
    const desde = h.llamadas.length;
    const rr = await correr('cargar', 'pruebav2', '--texto', 'Mis viejos y mi hermana.', '--repregunta');
    expect(rr.fallo).toBe(false);
    expect(h.llamadas.slice(desde)).toEqual(['perfil', 'pedidos']);
    expect(rr.texto).toMatch(/no se repregunta/);
    expect(Object.keys(v2().repreguntasEnviadas)).toEqual(['1']);
  });

  it('cada paso anota su modelo: la ficha con Sonnet, la evaluación con Sonnet, la pregunta con Opus, los pedidos con Haiku', async () => {
    const consumo = h.tablas.consumo_ia;
    const de = (paso: string) => consumo.filter((c) => c.paso === paso).map((c) => c.modelo);
    expect(new Set(de('v2-perfil'))).toEqual(new Set(['claude-sonnet-5']));
    expect(new Set(de('v2-evaluar'))).toEqual(new Set(['claude-sonnet-5']));
    expect(new Set(de('v2-pregunta'))).toEqual(new Set(['claude-opus-5']));
    expect(new Set(de('v2-pedidos'))).toEqual(new Set(['claude-haiku-4-5']));
    expect(new Set(de('v2-repregunta'))).toEqual(new Set(['claude-opus-5']));
    // Y el modelo anotado es el que de verdad se llamó.
    expect(new Set(h.modelos)).toEqual(new Set(['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5']));
  });

  it('una pregunta que no pasa los controles sale igual, marcada, y se ve cuántos intentos llevó', async () => {
    const r = await correr('siguiente', 'pruebav2');
    expect(r.fallo).toBe(false);
    // Con la edad, el guion rearmado pone el censo (los-tuyos-hoy) antes del mapa de las casas.
    expect(v2().secuencia.hechas.at(-1).id).toBe('los-tuyos-hoy');
    expect(v2().marcas['2']).toMatchObject({ control: 'pregunta', intentos: 3 });
    expect(r.texto).toMatch(/MARCADA/);
  });

  it('el candado del audio cruzado frena antes de tocar el perfil', async () => {
    const archivo = audio('dia_02.ogg');
    h.colaTranscripcion.push(h.tablas.respuestas[0].transcripcion);
    const perfilAntes = structuredClone(v2().perfil);
    h.llamadas.length = 0;
    const r = await correr('cargar', 'pruebav2', archivo);
    expect(r.fallo).toBe(false);
    expect(r.texto).toMatch(/YA ESTÁ CARGADO EN OTRO NARRADOR/);
    expect(h.llamadas).toEqual([]);
    expect(v2().perfil).toEqual(perfilAntes);
    const ajena = h.tablas.respuestas.find((x) => x.narrador_id === naza().id && x.pregunta_orden === 2)!;
    expect(v2().bloqueadas).toContain(ajena.id);
    expect(r.texto).toContain(`npm run manual -- descartar pruebav2 ${ajena.id}`);
    // Mientras siga en la base, siguiente no avanza (ni con --saltar) y dice cómo sacarla.
    const s = await correr('siguiente', 'pruebav2');
    expect(s.fallo).toBe(true);
    expect(s.texto).toMatch(/candado de audio cruzado/);
    expect(s.texto).toContain(`descartar pruebav2 ${ajena.id}`);
    expect((await correr('siguiente', 'pruebav2', '--saltar')).fallo).toBe(true);
    // Se descarta a mano (acá, sacando la fila) y se carga el bueno.
    h.tablas.respuestas = h.tablas.respuestas.filter((x) => !(x.narrador_id === naza().id && x.pregunta_orden === 2));
    h.colaTranscripcion.push('Viví en Quilmes hasta los 18 y después me fui a Buenos Aires.');
    const bien = await correr('cargar', 'pruebav2', archivo);
    expect(bien.fallo).toBe(false);
    expect(bien.texto).toMatch(/Sin repregunta: la respuesta alcanza/);
  });

  it('"hoy no": sin repregunta, el texto de mañana se retoma, y siguiente repite la misma sin avanzar', async () => {
    await correr('siguiente', 'pruebav2');
    const orden = v2().secuencia.hechas.at(-1).orden;
    h.colaEvaluar.push('{"suficiente": true, "hoyNo": true}');
    const r = await correr('cargar', 'pruebav2', '--texto', 'Hoy no puedo, mañana te cuento.');
    expect(r.texto.trim().endsWith('No hay apuro, Naza. Mañana te la vuelvo a mandar y seguimos cuando puedas.')).toBe(true);
    expect(v2().retomar).toBe(orden);
    const hoyNo = h.tablas.respuestas.filter((x) => x.narrador_id === naza().id).at(-1)!;
    expect(hoyNo).toMatchObject({ reservada: true, reservado_tramo: null }); // no va al libro
    const s = await correr('siguiente', 'pruebav2');
    expect(s.texto.trim().endsWith(v2().preguntasEnviadas[String(orden)])).toBe(true);
    expect(v2().secuencia.hechas.at(-1).orden).toBe(orden);
    // La respuesta de verdad entra en la misma orden y cierra la espera.
    const ok = await correr('cargar', 'pruebav2', '--texto', 'Los capítulos serían Quilmes, la facultad y Buenos Aires.');
    expect(ok.fallo).toBe(false);
    expect(v2().retomar).toBeUndefined();
  });

  it('una carga que se corta después de guardar la fila: dice el comando exacto, siguiente frena, --reprocesar la termina', async () => {
    await correr('siguiente', 'pruebav2');
    const orden = v2().secuencia.hechas.at(-1).orden;
    h.fallar.evaluar = 1;
    const r = await correr('cargar', 'pruebav2', '--texto', 'Me acuerdo de la facultad.');
    expect(r.fallo).toBe(true);
    expect(r.texto).toContain(`npm run manual-v2 -- cargar pruebav2 --reprocesar --orden ${orden}`);
    const fila = h.tablas.respuestas.filter((x) => x.narrador_id === naza().id).at(-1)!;
    expect(v2().procesadas).not.toContain(fila.id);
    const s = await correr('siguiente', 'pruebav2');
    expect(s.fallo).toBe(true);
    expect(s.texto).toMatch(/no terminaron de procesarse/);
    expect(s.texto).toContain(`--reprocesar --orden ${orden}`);
    // Arreglo final I2: si al reprocesar la evaluación vuelve cortada por max_tokens (medio JSON con un
    // "quiereParar"), no se lee como "alcanza": tira, no pausa ni marca procesada, y queda para otro --reprocesar.
    h.cortar.evaluar = 1;
    const cortada = await correr('cargar', 'pruebav2', '--reprocesar', '--orden', String(orden));
    expect(cortada.fallo).toBe(true);
    expect(cortada.texto).toMatch(/la respuesta del modelo se cortó/);
    expect(cortada.texto).toContain(`npm run manual-v2 -- cargar pruebav2 --reprocesar --orden ${orden}`);
    expect(v2().procesadas).not.toContain(fila.id);
    expect(v2().pausa).toBeUndefined();
    const ok = await correr('cargar', 'pruebav2', '--reprocesar', '--orden', String(orden));
    expect(ok.fallo).toBe(false);
    // Una respuesta escrita no tiene duración en la base: se estima por palabras, no se evalúa como "0 segundos".
    expect(h.prompts.filter((x) => x.includes('LA PREGUNTA DE HOY')).at(-1)).toMatch(/duró 2 segundos/);
    expect(v2().procesadas).toContain(fila.id);
    expect(h.tablas.respuestas.filter((x) => x.narrador_id === naza().id && x.pregunta_orden === orden)).toHaveLength(1);
  });

  it('si se cayó la transcripción, --reprocesar baja el audio de Storage y la hace de nuevo', async () => {
    await correr('siguiente', 'pruebav2');
    const orden = v2().secuencia.hechas.at(-1).orden;
    h.fallar.transcribir = 1;
    const r = await correr('cargar', 'pruebav2', audio('corta.ogg'));
    expect(r.fallo).toBe(true);
    expect(r.texto).toContain(`--reprocesar --orden ${orden}`);
    const fila = h.tablas.respuestas.filter((x) => x.narrador_id === naza().id).at(-1)!;
    expect(fila.transcripcion).toBeNull();
    h.colaTranscripcion.push('Ahora sí: la facultad en La Plata.');
    const ok = await correr('cargar', 'pruebav2', '--reprocesar');
    expect(ok.fallo).toBe(false);
    expect(h.bajados).toContain(fila.audio_path);
    expect(filaDe(fila.id)!.transcripcion).toBe('Ahora sí: la facultad en La Plata.');
    expect(v2().procesadas).toContain(fila.id);
  });

  it('varias notas de voz para una respuesta: se pegan en una sola (ffmpeg) y se carga una fila', async () => {
    await correr('siguiente', 'pruebav2');
    const orden = v2().secuencia.hechas.at(-1).orden;
    h.ffmpeg.length = 0;
    const r = await correr('cargar', 'pruebav2', audio('parte1.ogg'), audio('parte2.ogg'));
    expect(r.fallo).toBe(false);
    expect(h.ffmpeg).toHaveLength(1);
    expect(h.ffmpeg[0][0]).toBe('ffmpeg');
    expect(r.texto).toMatch(/Unidos 2 audios/);
    expect(h.tablas.respuestas.filter((x) => x.narrador_id === naza().id && x.pregunta_orden === orden)).toHaveLength(1);
  });

  it('"no quiero seguir": pausa, cierre sin pregunta y el mail para los dueños; siguiente frena hasta --reanudar', async () => {
    await correr('siguiente', 'pruebav2');
    h.colaEvaluar.push('{"suficiente": true, "quiereParar": true}');
    const r = await correr('cargar', 'pruebav2', '--texto', 'No quiero seguir con esto.');
    // La pausa va en contexto.v2; el estado de la base sigue 'pausado' siempre.
    expect(v2().pausa).toMatchObject({ motivo: 'quiereParar' });
    expect(naza().estado).toBe('pausado');
    expect(r.texto).toMatch(/Asunto: Vitácora Familiar: Naza pidió no seguir/);
    expect(r.texto.trim().endsWith('Si algún día tenés ganas de seguir, acá voy a estar.')).toBe(true);
    expect((await correr('siguiente', 'pruebav2')).fallo).toBe(true);
    const sigue = await correr('siguiente', 'pruebav2', '--reanudar');
    expect(sigue.fallo).toBe(false);
    expect(v2().pausa).toBeUndefined();
    expect(naza().estado).toBe('pausado');
  });

  it('al cerrar una etapa, la libre sale de lo que nombró en la ÚLTIMA respuesta de esa etapa; estado muestra caídas y libres', async () => {
    // La del reanudar fue la cuadra: la próxima es la última fila de infancia (la escuela).
    expect(v2().secuencia.hechas.at(-1).id).toBe('la-cuadra-y-los-juegos');
    expect(v2().secuencia.pendientes[0].id).toBe('la-escuela');
    h.colaPerfil.length = 0;
    await correr('cargar', 'pruebav2', audio('cuadra.ogg'));
    const escuela = await correr('siguiente', 'pruebav2');
    expect(escuela.fallo).toBe(false);
    expect(v2().secuencia.hechas.at(-1).id).toBe('la-escuela');
    // Todavía no: la libre se elige cuando la última de la etapa ya se contestó.
    expect(escuela.texto).not.toMatch(/pregunta libre/i);
    expect(v2().secuencia.libres).toBe(0);
    // Lo que nombra en la respuesta a la escuela es lo que se vuelve libre.
    h.colaPerfil.push('{"agregarNoSabemos": ["[infancia] Qué pasó con los perros"]}');
    await correr('cargar', 'pruebav2', audio('inf.ogg'));
    const s = await correr('siguiente', 'pruebav2');
    expect(s.fallo).toBe(false);
    expect(s.texto).toMatch(/pregunta libre/i);
    expect(v2().secuencia.hechas.at(-1)).toMatchObject({ id: 'libre-infancia-1', objetivo: { tipo: 'variable', anclas: ['Qué pasó con los perros'] } });
    expect(v2().secuencia.libres).toBe(1);
    const e = await correr('estado', 'pruebav2');
    expect(e.texto).toMatch(/Se cayeron|caídas/i);
    expect(e.texto).toMatch(/libres agregadas: 1 de 4/);
  });

  it('una repregunta por etapa, más una si la respuesta fue corta; nunca una tercera', async () => {
    const falto = '{"suficiente": false, "falto": ["dónde paraban", "qué sonaba"]}';
    const cargarAudio = async (seg: number) => { h.duracion.s = seg; h.colaEvaluar.push(falto); const r = await correr('cargar', 'pruebav2', audio(`etapa-${seg}.ogg`)); h.duracion.s = 42; return r; };
    await correr('cargar', 'pruebav2', '--texto', 'Los perros se escaparon un verano y nunca volvieron, fue muy triste para todos en casa.');
    await correr('siguiente', 'pruebav2');
    expect(v2().secuencia.hechas.at(-1).id).toBe('a-los-quince');
    // Primera de la juventud: sale.
    const primera = await cargarAudio(42);
    expect(primera.texto).toMatch(/Repregunta \(faltó/);
    await correr('cargar', 'pruebav2', '--texto', 'Parábamos en la plaza.', '--repregunta');
    // Segunda de la etapa con una respuesta que no fue corta: no sale.
    await correr('siguiente', 'pruebav2');
    const larga = await cargarAudio(42);
    expect(larga.texto).toMatch(/ya hubo una repregunta en esta etapa/);
    // Corta (20 s) y con dos faltantes: sale la segunda.
    await correr('siguiente', 'pruebav2');
    const corta = await cargarAudio(20);
    expect(corta.texto).toMatch(/Repregunta \(faltó/);
    await correr('cargar', 'pruebav2', '--texto', 'En una fábrica de pastas.', '--repregunta');
    // Con dos en la etapa, ni una corta abre una tercera.
    await correr('siguiente', 'pruebav2');
    const tercera = await cargarAudio(20);
    expect(tercera.texto).toMatch(/ya hubo dos repreguntas en esta etapa/);
    const juventud = v2().secuencia.hechas.filter((x: any) => x.objetivo.bloque === 'juventud').map((x: any) => String(x.orden));
    expect(Object.keys(v2().repreguntasEnviadas).filter((o) => juventud.includes(o))).toHaveLength(2);
    // Se cierra la juventud (la historia grande) y queda mandada la primera del adulto joven.
    await correr('siguiente', 'pruebav2');
    await correr('cargar', 'pruebav2', audio('historia.ogg'));
    await correr('siguiente', 'pruebav2');
    expect(v2().secuencia.hechas.at(-1).id).toBe('oficio');
  });

  it('cansancio: con dos repreguntas sin contestar, la tercera no sale y queda la pausa de 3 días', async () => {
    const repreguntarUna = async () => {
      h.colaEvaluar.push('{"suficiente": false, "falto": ["cómo fue", "quién estaba"]}');
      await correr('cargar', 'pruebav2', '--texto', 'Algo corto.');
      await correr('siguiente', 'pruebav2');
    };
    await correr('cargar', 'pruebav2', '--texto', 'Respuesta a la que salió al reanudar.');
    await correr('siguiente', 'pruebav2');
    await repreguntarUna();
    await repreguntarUna();
    h.colaEvaluar.push('{"suficiente": false, "falto": ["cómo fue", "quién estaba"]}');
    const r = await correr('cargar', 'pruebav2', '--texto', 'Otra corta.');
    expect(r.texto).toMatch(/cansancio/);
    expect(v2().sinRepreguntarHasta).toBeTruthy();
  });

  it('hasta el final: los objetos como segundo mensaje, el objeto final y la despedida; queda terminada en contexto.v2 y NO completado en la base', async () => {
    let ultimo = { texto: '', fallo: false };
    for (let i = 0; i < 60 && !v2().terminada; i++) ultimo = await correr('siguiente', 'pruebav2', '--saltar');
    expect(v2().terminada).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // 'completado' haría que la fábrica de producción armara la estructura v1 y mandara el mail "terminó".
    expect(naza().estado).toBe('pausado');
    const otraVez = await correr('siguiente', 'pruebav2');
    expect(otraVez.texto).toMatch(/ya terminó/);
    expect(ultimo.texto).toMatch(/Objeto final/);
    expect(ultimo.texto.trim().endsWith('Una vida entera, charla por charla. Fue un honor enorme escuchar tu historia, y ya la estamos convirtiendo en tu libro.')).toBe(true);
    // No se fija el número exacto (el techo y las libres lo mueven): el guion entero, hasta los cinco minutos.
    expect(v2().secuencia.hechas.length - 1).toBeGreaterThanOrEqual(25);
    expect(v2().secuencia.hechas.at(-1).id).toBe('cinco-minutos');
    const objetos = v2().secuencia.objetos;
    expect(objetos.length).toBeGreaterThanOrEqual(2);
    expect(objetos.filter((o: any) => o.final)).toHaveLength(1);
    for (const o of objetos) expect(v2().preguntasEnviadas[String(o.orden)]).toBeTruthy();
    // Arreglo final I3: el final se pide con su propio encargo ("de toda su vida"), y el prompt ya
    // lista los objetos pedidos antes (el de "hoy" incluido), así no se repite.
    const promptFinal = h.prompts.filter((x) => x.includes('Pedile UNA cosa')).at(-1)!;
    const encargoFinal = promptFinal.slice(promptFinal.indexOf('LO QUE TE TOCA PREGUNTAR HOY'));
    expect(encargoFinal).toMatch(/toda su vida/);
    expect(encargoFinal).not.toMatch(/de esa época/);
    for (const o of objetos.filter((x: any) => !x.final)) expect(promptFinal).toContain(`- (objeto) ${o.tramo}`);
    const deTramo = objetos.filter((o: any) => !o.final).map((o: any) => o.tramo);
    expect(new Set(deTramo).size).toBe(deTramo.length);
    // Lo que cuenta de un objeto se carga con su orden: perfil + pedidos (Haiku), nunca repregunta.
    h.llamadas.length = 0;
    const obj = await correr('cargar', 'pruebav2', '--texto', 'Es la pelota de cuero de mi viejo.', '--orden', String(objetos[0].orden));
    expect(obj.fallo).toBe(false);
    expect(h.llamadas).toEqual(['perfil', 'pedidos']);
    expect(obj.texto).toMatch(/no se repregunta/);
    expect(v2().repreguntasEnviadas[String(objetos[0].orden)]).toBeUndefined();
    // "Hoy no" al contestar un objeto (o una repregunta): no hay nada que retomar, pero no va al libro.
    h.colaPedidos.push('{"hoyNo": true}');
    const hoyNo = await correr('cargar', 'pruebav2', '--texto', 'Hoy no puedo, mañana te la busco.', '--orden', String(objetos[1].orden));
    expect(hoyNo.fallo).toBe(false);
    const filaHoyNo = h.tablas.respuestas.filter((x) => x.narrador_id === naza().id).at(-1)!;
    expect(filaHoyNo).toMatchObject({ pregunta_orden: objetos[1].orden, reservada: true, reservado_tramo: null });
    expect(hoyNo.texto).toMatch(/reservada: no va al libro/);
    expect(v2().retomar).toBeUndefined();
    const e = await correr('estado', 'pruebav2');
    expect(e.fallo).toBe(false);
    expect(e.texto).toMatch(/gasto: USD/);
    expect(v2().gastoUsd).toBeGreaterThan(0);
  });
});
