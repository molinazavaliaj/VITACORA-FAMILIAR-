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
        upload: async () => ({ error: null }),
        download: async (path: string) => { bajados.push(path); return { data: new Blob([new Uint8Array(4096)]), error: null }; },
      }),
    },
  };
  const bajados: string[] = [];
  // Fallas a pedido: cuántas veces seguidas se cae la evaluación o la transcripción.
  const fallar = { evaluar: 0, transcribir: 0 };
  const ffmpeg: string[][] = [];

  // El modelo falso: contesta según qué prompt le llega. Las colas dicen qué devuelve el perfil y
  // la evaluación en cada llamada (vacías: "{}" y "alcanza").
  const colaPerfil: string[] = [];
  const colaEvaluar: string[] = [];
  const colaTranscripcion: string[] = [];
  const llamadas: string[] = [];
  let n = 0;
  function responder(prompt: string): string {
    if (prompt.includes('LO QUE TE TOCA PREGUNTAR HOY')) {
      llamadas.push('pregunta');
      if (prompt.includes('Es el PRIMER mensaje')) return 'Hola, soy el biógrafo que va a escribir el libro de tu vida. Una pregunta por día, la contestás con un audio cuando puedas. Para empezar: cómo preferís que te hable, cuántos años tenés y cómo te dicen en casa.';
      if (prompt.includes('El mapa de su vida por las casas')) return 'Contame de las casas donde viviste.'; // sin "?": la marca
      if (prompt.includes('Pedile UNA cosa')) return `¿Tenés alguna foto o cosa de esa época para mostrarme? (${++n})`;
      return `¿Qué te acordás de aquellos años, lo número ${++n}?`;
    }
    if (prompt.includes('LO QUE YA SABÉS (tu ficha de trabajo')) { llamadas.push('perfil'); return colaPerfil.shift() ?? '{}'; }
    if (prompt.includes('LA PREGUNTA DE HOY')) {
      llamadas.push('evaluar');
      if (fallar.evaluar > 0) { fallar.evaluar--; throw new Error('529 overloaded (falso)'); }
      return colaEvaluar.shift() ?? '{"suficiente": true}';
    }
    throw new Error(`prompt que el modelo falso no conoce: ${prompt.slice(0, 80)}`);
  }
  return { tablas, db, colaPerfil, colaEvaluar, colaTranscripcion, llamadas, responder, fallar, bajados, ffmpeg };
});

vi.mock('../src/db/cliente.js', () => ({ db: h.db }));
vi.mock('../src/ia/transcribir.js', () => ({
  transcribirYActualizar: async (id: string) => {
    if (h.fallar.transcribir > 0) { h.fallar.transcribir--; throw new Error('transcripción caída (falsa)'); }
    const texto = h.colaTranscripcion.shift() ?? 'algo';
    Object.assign(h.tablas.respuestas.find((r) => r.id === id)!, { transcripcion: texto, duracion_segundos: 42 });
    return { texto, duracionSegundos: 42 };
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
      create: async ({ messages }: { messages: { content: string }[] }) => ({
        content: [{ type: 'text', text: h.responder(messages[0].content) }],
        usage: { input_tokens: 1000, output_tokens: 100 },
      }),
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
    const r = await correr('cargar', 'pruebav2', '--texto', 'Hola, de vos. Tengo 27 y me dicen Naza.', '--orden', '0');
    expect(r.fallo).toBe(false);
    expect(h.llamadas).toEqual(['perfil']);
    expect(v2().perfil.persona.comoLeDicen.valor).toBe('Naza');
    expect(v2().secuencia.pendientes.filter((o: any) => o.tipo === 'variable').length).toBeGreaterThanOrEqual(8);
    expect(h.tablas.respuestas.filter((x) => x.narrador_id === naza().id)).toHaveLength(1);
  });

  it('cargar la casa: evalúa y la repregunta sale entera al final; la respuesta a la repregunta no se repregunta', async () => {
    h.colaEvaluar.push('{"suficiente": false, "repregunta": "¿Y quién más vivía en esa casa?"}');
    const r = await correr('cargar', 'pruebav2', '--texto', 'Era una casa chica en Quilmes con un patio.');
    expect(r.fallo).toBe(false);
    expect(v2().repreguntasEnviadas['1']).toBe('¿Y quién más vivía en esa casa?');
    expect(r.texto.trim().endsWith('¿Y quién más vivía en esa casa?')).toBe(true);
    h.colaEvaluar.push('{"suficiente": false, "repregunta": "¿Otra más?"}');
    const rr = await correr('cargar', 'pruebav2', '--texto', 'Mis viejos y mi hermana.', '--repregunta');
    expect(rr.fallo).toBe(false);
    expect(rr.texto).toMatch(/no se repregunta/);
    expect(Object.keys(v2().repreguntasEnviadas)).toEqual(['1']);
  });

  it('una pregunta que no pasa los controles sale igual, marcada, y se ve cuántos intentos llevó', async () => {
    const r = await correr('siguiente', 'pruebav2');
    expect(r.fallo).toBe(false);
    expect(v2().secuencia.hechas.at(-1).id).toBe('mapa-casas');
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
    const ok = await correr('cargar', 'pruebav2', '--reprocesar', '--orden', String(orden));
    expect(ok.fallo).toBe(false);
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

  it('cansancio: con dos repreguntas sin contestar, la tercera no sale y queda la pausa de 3 días', async () => {
    const repreguntarUna = async () => {
      h.colaEvaluar.push('{"suficiente": false, "repregunta": "¿Y cómo fue eso?"}');
      await correr('cargar', 'pruebav2', '--texto', 'Algo corto.');
      await correr('siguiente', 'pruebav2');
    };
    await correr('cargar', 'pruebav2', '--texto', 'Respuesta a la que salió al reanudar.');
    await correr('siguiente', 'pruebav2');
    await repreguntarUna();
    await repreguntarUna();
    h.colaEvaluar.push('{"suficiente": false, "repregunta": "¿Y cómo fue eso?"}');
    const r = await correr('cargar', 'pruebav2', '--texto', 'Otra corta.');
    expect(r.texto).toMatch(/cansancio/);
    expect(v2().sinRepreguntarHasta).toBeTruthy();
  });

  it('hasta el final: los objetos como segundo mensaje, el objeto final y la despedida; queda completado', async () => {
    let ultimo = { texto: '', fallo: false };
    for (let i = 0; i < 60 && naza().estado !== 'completado'; i++) ultimo = await correr('siguiente', 'pruebav2', '--saltar');
    expect(naza().estado).toBe('completado');
    expect(ultimo.texto).toMatch(/Objeto final/);
    expect(ultimo.texto.trim().endsWith('Una vida entera, charla por charla. Fue un honor enorme escuchar tu historia, y ya la estamos convirtiendo en tu libro.')).toBe(true);
    const objetos = v2().secuencia.objetos;
    expect(objetos.length).toBeGreaterThanOrEqual(2);
    expect(objetos.filter((o: any) => o.final)).toHaveLength(1);
    for (const o of objetos) expect(v2().preguntasEnviadas[String(o.orden)]).toBeTruthy();
    // Lo que cuenta de un objeto se carga con su orden: perfil + evaluación, nunca repregunta.
    h.colaEvaluar.push('{"suficiente": false, "repregunta": "¿Y de quién era?"}');
    h.llamadas.length = 0;
    const obj = await correr('cargar', 'pruebav2', '--texto', 'Es la pelota de cuero de mi viejo.', '--orden', String(objetos[0].orden));
    expect(obj.fallo).toBe(false);
    expect(h.llamadas).toEqual(['perfil', 'evaluar']);
    expect(obj.texto).toMatch(/no se repregunta/);
    expect(v2().repreguntasEnviadas[String(objetos[0].orden)]).toBeUndefined();
    const e = await correr('estado', 'pruebav2');
    expect(e.fallo).toBe(false);
    expect(e.texto).toMatch(/gasto: USD/);
    expect(v2().gastoUsd).toBeGreaterThan(0);
  });
});
