// La mini app web para que Naza pruebe la entrevista V3 como narrador
// (scripts/v3-entrevista-web.ts; docs/v3/entrevista/prueba-web.md). El
// servidor se prueba como módulo: carpeta de datos temporal y un
// `transcribir` falso. Nada llama a OpenAI (la transcripción es paga).

import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { crearManejador, type OpcionesWeb, type Vista } from '../scripts/v3-entrevista-web.js';
import { transcribirConOpenAI, transcribirAudio } from '../src/v3/entrevista/transcribir.js';

const raiz = mkdtempSync(join(tmpdir(), 'v3-web-'));
afterAll(() => rmSync(raiz, { recursive: true, force: true }));

let n = 0;
const servidores: Server[] = [];
afterEach(async () => {
  await Promise.all(servidores.splice(0).map((s) => new Promise((ok) => s.close(ok))));
});

/** Levanta el manejador en un puerto libre y devuelve la URL base. */
async function levantar(opciones: Partial<OpcionesWeb> & { datos: string }): Promise<string> {
  const s = createServer(crearManejador({ log: () => {}, transcribir: async () => ({ texto: 'no se usa', duracionSegundos: 1 }), dormir: async () => {}, ...opciones }));
  servidores.push(s);
  await new Promise<void>((ok) => s.listen(0, '127.0.0.1', ok));
  return `http://127.0.0.1:${(s.address() as AddressInfo).port}`;
}

const nuevaCarpeta = () => join(raiz, `datos-${++n}`);

async function post(base: string, ruta: string, cuerpo: unknown): Promise<{ status: number; json: Vista & { error?: string } }> {
  const r = await fetch(base + ruta, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(cuerpo) });
  return { status: r.status, json: await r.json() };
}

async function estado(base: string): Promise<Vista> {
  return (await (await fetch(base + '/api/estado')).json()) as Vista;
}

const CUENTA = 'Sí, te cuento: fue una historia larga que me acuerdo muy bien.';

/** Contesta con texto hasta que la pregunta abierta es `id`. */
async function hasta(base: string, datos: string, id: string): Promise<void> {
  for (let i = 0; i < 300; i++) {
    const e = JSON.parse(readFileSync(join(datos, 'naza', 'estado.json'), 'utf8'));
    if (e.esperando === id) return;
    await post(base, '/api/texto', { texto: CUENTA });
  }
  throw new Error(`no llegué a ${id}`);
}

describe('página', () => {
  it('GET / devuelve el HTML de la app', async () => {
    const base = await levantar({ datos: nuevaCarpeta() });
    const r = await fetch(base + '/');
    expect(r.status).toBe(200);
    expect(r.headers.get('content-type')).toMatch(/text\/html/);
    expect(await r.text()).toContain('Grabar');
  });
});

describe('entrevista', () => {
  it('sin entrevista: el estado lo dice; nueva → la bienvenida, sin IDs, y los archivos en disco', async () => {
    const datos = nuevaCarpeta();
    const base = await levantar({ datos });
    expect((await estado(base)).hay).toBe(false);
    const { status, json } = await post(base, '/api/nueva', { nombre: 'Naza', genero: 'varon' });
    expect(status).toBe(200);
    expect(json.hay).toBe(true);
    expect(json.globos[0].de).toBe('bio');
    expect(json.globos[0].texto).toContain('Naza');
    expect(JSON.stringify(json)).not.toMatch(/"(id|partes|pregunta)"/);
    expect(json.terminada).toBe(false);
    expect(existsSync(join(datos, 'naza', 'estado.json'))).toBe(true);
    expect(readFileSync(join(datos, 'naza', 'charla.md'), 'utf8')).toContain('`[BIEN]`');
  });

  it('no arranca otra si hay una en curso; con forzar, la anterior queda renombrada, no borrada', async () => {
    const datos = nuevaCarpeta();
    const base = await levantar({ datos });
    await post(base, '/api/nueva', { nombre: 'Naza', genero: 'varon' });
    await post(base, '/api/texto', { texto: CUENTA });
    const otra = await post(base, '/api/nueva', { nombre: 'Naza', genero: 'varon' });
    expect(otra.status).toBe(409);
    const forzada = await post(base, '/api/nueva', { nombre: 'Naza', genero: 'varon', forzar: true });
    expect(forzada.status).toBe(200);
    expect(forzada.json.globos.filter((g) => g.de === 'narrador')).toHaveLength(0);
    const carpetas = readdirSync(datos).filter((c) => c.startsWith('naza'));
    expect(carpetas).toHaveLength(2);
    const vieja = carpetas.find((c) => c !== 'naza')!;
    expect(JSON.parse(readFileSync(join(datos, vieja, 'estado.json'), 'utf8')).respuestas).toHaveLength(1);
  });

  it('texto → avanza a la pregunta siguiente', async () => {
    const base = await levantar({ datos: nuevaCarpeta() });
    const antes = (await post(base, '/api/nueva', { nombre: 'Naza', genero: 'varon' })).json;
    const { status, json } = await post(base, '/api/texto', { texto: 'Nací en Montevideo.' });
    expect(status).toBe(200);
    expect(json.globos.length).toBeGreaterThan(antes.globos.length + 1);
    expect(json.globos.find((g) => g.de === 'narrador')).toMatchObject({ texto: 'Nací en Montevideo.' });
  });

  it('texto vacío → error claro, el estado no cambia', async () => {
    const base = await levantar({ datos: nuevaCarpeta() });
    const antes = (await post(base, '/api/nueva', { nombre: 'Naza', genero: 'varon' })).json;
    const r = await post(base, '/api/texto', { texto: '   ' });
    expect(r.status).toBe(400);
    expect(r.json.error).toMatch(/vacía/);
    expect((await estado(base)).globos).toHaveLength(antes.globos.length);
  });

  it('botón "Sí…" → "Contame, te escucho." y sigue la misma pregunta; los botones se ven solo cuando corresponde', async () => {
    const datos = nuevaCarpeta();
    const base = await levantar({ datos });
    await post(base, '/api/nueva', { nombre: 'Naza', genero: 'varon' });
    await hasta(base, datos, 'CA6');
    expect((await estado(base)).botones).toEqual(['Sí, tuve', 'No tuve hermanos']);
    const { status, json } = await post(base, '/api/boton', { texto: 'Sí, tuve' });
    expect(status).toBe(200);
    expect(json.globos.at(-2)).toMatchObject({ de: 'narrador', boton: true, texto: 'Sí, tuve' });
    expect(json.globos.at(-1)).toEqual({ de: 'bio', texto: 'Contame, te escucho.' });
    expect(json.botones).toEqual([]);
    const e = JSON.parse(readFileSync(join(datos, 'naza', 'estado.json'), 'utf8'));
    expect(e.esperando).toBe('CA6');
    const sigue = await post(base, '/api/texto', { texto: 'Éramos cuatro.' });
    expect(JSON.parse(readFileSync(join(datos, 'naza', 'estado.json'), 'utf8')).esperando).not.toBe('CA6');
    expect(sigue.status).toBe(200);
  });

  it('botón "No…" → avanza; un botón que no existe da error', async () => {
    const datos = nuevaCarpeta();
    const base = await levantar({ datos });
    await post(base, '/api/nueva', { nombre: 'Naza', genero: 'varon' });
    await hasta(base, datos, 'CA6');
    expect((await post(base, '/api/boton', { texto: 'Cualquiera' })).status).toBe(400);
    const r = await post(base, '/api/boton', { texto: 'No tuve hermanos' });
    expect(r.status).toBe(200);
    expect(JSON.parse(readFileSync(join(datos, 'naza', 'estado.json'), 'utf8')).esperando).not.toBe('CA6');
  });

  it('el estado sobrevive a recrear el servidor (se lee de disco)', async () => {
    const datos = nuevaCarpeta();
    const base1 = await levantar({ datos });
    await post(base1, '/api/nueva', { nombre: 'Naza', genero: 'varon' });
    const antes = (await post(base1, '/api/texto', { texto: 'Nací en Montevideo.' })).json;
    const base2 = await levantar({ datos });
    expect(await estado(base2)).toEqual(antes);
  });

  it('dos clicks rápidos (y cinco textos a la vez) no rompen el estado: van de a uno', async () => {
    const datos = nuevaCarpeta();
    const base = await levantar({ datos });
    await post(base, '/api/nueva', { nombre: 'Naza', genero: 'varon' });
    const rs = await Promise.all([1, 2, 3, 4, 5].map((i) => post(base, '/api/texto', { texto: `Respuesta ${i}, larga para que cuente como algo.` })));
    expect(rs.every((r) => r.status === 200)).toBe(true);
    const e = JSON.parse(readFileSync(join(datos, 'naza', 'estado.json'), 'utf8'));
    expect(e.respuestas).toHaveLength(5);
    expect(new Set(e.respuestas.map((r: [string, string]) => r[0])).size).toBe(5);
    expect((await estado(base)).globos.filter((g) => g.de === 'narrador')).toHaveLength(5);
  });
});

describe('audio', () => {
  it('guarda el archivo, lo transcribe, avanza y anota la línea en transcripciones.jsonl', async () => {
    const datos = nuevaCarpeta();
    const llamadas: { bytes: number; tipo: string; nombreArchivo: string; narrador: string }[] = [];
    const base = await levantar({
      datos,
      transcribir: async (audio, info) => {
        llamadas.push({ bytes: audio.length, ...info });
        return { texto: 'Nací en Salto, en el 98.', duracionSegundos: 42 };
      },
    });
    await post(base, '/api/nueva', { nombre: 'Naza', genero: 'varon' });
    const audio = Buffer.from('audio-falso-webm');
    const r = await fetch(base + '/api/audio', { method: 'POST', headers: { 'content-type': 'audio/webm;codecs=opus' }, body: audio });
    const json = (await r.json()) as Vista & { transcripcion: string };
    expect(r.status).toBe(200);
    expect(json.transcripcion).toBe('Nací en Salto, en el 98.');
    expect(llamadas).toEqual([{ bytes: audio.length, tipo: 'audio/webm', nombreArchivo: '01-OR1.webm', narrador: 'Naza' }]);
    expect(readFileSync(join(datos, 'naza', 'audios', '01-OR1.webm'))).toEqual(audio);
    const lineas = readFileSync(join(datos, 'naza', 'transcripciones.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    expect(lineas).toHaveLength(1);
    expect(lineas[0]).toMatchObject({ archivo: 'audios/01-OR1.webm', pregunta: 'OR1', texto: 'Nací en Salto, en el 98.', duracion: 42 });
    expect(lineas[0].fecha).toMatch(/^\d{4}-\d\d-\d\dT/);
    expect(json.minutosTranscriptos).toBeCloseTo(0.7);
    // Desde la prueba de Naza (30/09) el audio queda a la vista y la respuesta se manda con "Listo, siguiente pregunta".
    expect(json.pendientes).toEqual([{ texto: 'Nací en Salto, en el 98.', cortada: false }]);
    expect(JSON.parse(readFileSync(join(datos, 'naza', 'estado.json'), 'utf8')).esperando).toBe('OR1');
    const listo = await post(base, '/api/listo', {});
    expect(listo.json.globos.find((g) => g.de === 'narrador')).toMatchObject({ audio: true, texto: 'Nací en Salto, en el 98.' });
    expect(JSON.parse(readFileSync(join(datos, 'naza', 'estado.json'), 'utf8')).esperando).not.toBe('OR1');
  });

  it('si la transcripción falla, el audio queda guardado y se puede reintentar', async () => {
    const datos = nuevaCarpeta();
    let falla = true;
    const base = await levantar({
      datos,
      transcribir: async () => {
        if (falla) throw new Error('OpenAI 500: se cayó');
        return { texto: 'Ahora sí.', duracionSegundos: 5 };
      },
    });
    await post(base, '/api/nueva', { nombre: 'Naza', genero: 'varon' });
    const r = await fetch(base + '/api/audio', { method: 'POST', headers: { 'content-type': 'audio/webm' }, body: Buffer.from('x') });
    const json = (await r.json()) as { error: string; reintentar: string };
    expect(r.status).toBe(502);
    expect(json.error).toContain('se cayó');
    expect(json.reintentar).toBe('audios/01-OR1.webm');
    expect(existsSync(join(datos, 'naza', 'audios', '01-OR1.webm'))).toBe(true);
    expect((await estado(base)).globos.filter((g) => g.de === 'narrador')).toHaveLength(0);
    falla = false;
    const otra = await post(base, '/api/reintentar', { archivo: json.reintentar });
    expect(otra.status).toBe(200);
    expect(otra.json.pendientes).toEqual([{ texto: 'Ahora sí.', cortada: false }]);
    // Un archivo que no es de esta carpeta no se acepta.
    expect((await post(base, '/api/reintentar', { archivo: '../../x.webm' })).status).toBe(400);
  });

  it('un audio nunca pisa a otro', async () => {
    const datos = nuevaCarpeta();
    let falla = true;
    const base = await levantar({ datos, transcribir: async () => { if (falla) throw new Error('no'); return { texto: 'Bien.', duracionSegundos: 3 }; } });
    await post(base, '/api/nueva', { nombre: 'Naza', genero: 'varon' });
    await fetch(base + '/api/audio', { method: 'POST', headers: { 'content-type': 'audio/webm' }, body: Buffer.from('uno') });
    falla = false;
    await fetch(base + '/api/audio', { method: 'POST', headers: { 'content-type': 'audio/webm' }, body: Buffer.from('dos') });
    const archivos = readdirSync(join(datos, 'naza', 'audios')).sort();
    expect(archivos).toEqual(['01-OR1.webm', '02-OR1.webm']);
    expect(readFileSync(join(datos, 'naza', 'audios', '01-OR1.webm'), 'utf8')).toBe('uno');
  });
});

describe('la key de OpenAI', () => {
  const KEY = 'sk-proj-FALSA1234567890abcdefXYZ';

  it('se manda como corresponde: modelo, idioma, archivo webm con su nombre, prompt con el narrador', async () => {
    let enviado: { url: string; auth: string; form: FormData } | undefined;
    const fetchFalso = (async (url: string, init: RequestInit) => {
      enviado = { url, auth: (init.headers as Record<string, string>).Authorization, form: init.body as FormData };
      return new Response(JSON.stringify({ text: 'Hola.', usage: { type: 'duration', seconds: 12.4 } }), { status: 200 });
    }) as unknown as typeof fetch;
    const t = await transcribirAudio(Buffer.from('a'), { key: KEY, tipo: 'audio/webm', nombreArchivo: '01-OR1.webm', prompt: 'Naza', fetch: fetchFalso });
    expect(t).toEqual({ texto: 'Hola.', duracionSegundos: 12 });
    expect(enviado!.url).toBe('https://api.openai.com/v1/audio/transcriptions');
    expect(enviado!.auth).toBe(`Bearer ${KEY}`);
    expect(enviado!.form.get('model')).toBe('gpt-transcribe');
    expect(enviado!.form.get('language')).toBe('es');
    expect(enviado!.form.get('prompt')).toBe('Naza');
    const file = enviado!.form.get('file') as File;
    expect(file.name).toBe('01-OR1.webm');
    expect(file.type).toBe('audio/webm');
  });

  it('nunca aparece en respuestas ni en logs, aunque OpenAI la devuelva en el error', async () => {
    const logs: string[] = [];
    const fetchFalso = (async () =>
      new Response(JSON.stringify({ error: { message: `Incorrect API key provided: ${KEY}. You can find your API key at …` } }), { status: 401 })) as unknown as typeof fetch;
    const datos = nuevaCarpeta();
    const base = await levantar({
      datos,
      log: (s) => logs.push(s),
      transcribir: transcribirConOpenAI({ key: () => KEY, fetch: fetchFalso }),
    });
    await post(base, '/api/nueva', { nombre: 'Naza', genero: 'varon' });
    const r = await fetch(base + '/api/audio', { method: 'POST', headers: { 'content-type': 'audio/webm' }, body: Buffer.from('x') });
    const texto = await r.text();
    expect(r.status).toBe(502);
    expect(texto).toContain('401');
    expect(texto).toContain('Incorrect API key');
    const todo = [texto, ...logs, JSON.stringify(await estado(base))].join('\n');
    expect(todo).not.toContain(KEY);
    expect(todo).not.toContain('FALSA1234');
    expect(logs.length).toBeGreaterThan(0);
  });
});
