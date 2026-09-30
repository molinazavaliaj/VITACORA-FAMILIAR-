// La página de prueba después de la prueba de Naza (30/09, punto 9 de
// docs/v3/entrevista/simulaciones/hallazgos.md): nombre con mayúscula,
// varios audios por pregunta con "Listo, siguiente pregunta", aviso de
// transcripción cortada y reintentos solos si se cae la red. Todo con un
// `transcribir` falso: nada llama a OpenAI.

import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { capitalizarNombre, crearManejador, pareceCortada, type OpcionesWeb, type Vista } from '../scripts/v3-entrevista-web.js';
import { ErrorTranscripcion, esReintentable, transcribirAudio, transcribirConOpenAI } from '../src/v3/entrevista/transcribir.js';

const raiz = mkdtempSync(join(tmpdir(), 'v3-web-naza-'));
afterAll(() => rmSync(raiz, { recursive: true, force: true }));

let n = 0;
const servidores: Server[] = [];
afterEach(async () => {
  await Promise.all(servidores.splice(0).map((s) => new Promise((ok) => s.close(ok))));
});

async function levantar(opciones: Partial<OpcionesWeb> & { datos: string }): Promise<string> {
  const s = createServer(crearManejador({ log: () => {}, transcribir: async () => ({ texto: 'no se usa', duracionSegundos: 1 }), dormir: async () => {}, ...opciones }));
  servidores.push(s);
  await new Promise<void>((ok) => s.listen(0, '127.0.0.1', ok));
  return `http://127.0.0.1:${(s.address() as AddressInfo).port}`;
}

const nuevaCarpeta = () => join(raiz, `datos-${++n}`);
type Resp = { status: number; json: Vista & { error?: string; reintentar?: string } };

async function post(base: string, ruta: string, cuerpo: unknown): Promise<Resp> {
  const r = await fetch(base + ruta, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(cuerpo) });
  return { status: r.status, json: await r.json() };
}

async function audio(base: string, cuerpo = 'audio'): Promise<Resp> {
  const r = await fetch(base + '/api/audio', { method: 'POST', headers: { 'content-type': 'audio/webm' }, body: Buffer.from(cuerpo) });
  return { status: r.status, json: await r.json() };
}

async function estado(base: string): Promise<Vista> {
  return (await (await fetch(base + '/api/estado')).json()) as Vista;
}

const leerEstado = (datos: string) => JSON.parse(readFileSync(join(datos, 'naza', 'estado.json'), 'utf8'));

async function hasta(base: string, datos: string, id: string): Promise<void> {
  for (let i = 0; i < 300; i++) {
    if (leerEstado(datos).esperando === id) return;
    await post(base, '/api/texto', { texto: 'Sí, te cuento: fue una historia larga que me acuerdo muy bien.' });
  }
  throw new Error(`no llegué a ${id}`);
}

describe('el nombre con mayúscula', () => {
  it.each([
    ['nazareno', 'Nazareno'],
    ['nazareno pérez', 'Nazareno Pérez'],
    ['  maría   del carmen ', 'María Del Carmen'],
    ['Ana', 'Ana'],
    ['ángel', 'Ángel'],
  ])('"%s" → "%s"', (entra, sale) => {
    expect(capitalizarNombre(entra)).toBe(sale);
  });

  it('la entrevista nueva lo guarda así y lo usa en la bienvenida', async () => {
    const base = await levantar({ datos: nuevaCarpeta() });
    const { json } = await post(base, '/api/nueva', { nombre: 'naza', genero: 'varon' });
    expect(json.nombre).toBe('Naza');
    expect(json.globos[0].texto).toContain('Hola, Naza,');
  });
});

describe('transcripción cortada', () => {
  it.each(['Y ahí fue cuando mi viejo me dijo...', 'Y ahí fue cuando…', 'Nos fuimos al río con mi hermano y', 'Era una casa muy gran'])('"%s" parece cortada', (t) => {
    expect(pareceCortada(t)).toBe(true);
  });

  it.each(['Nos fuimos al río.', '¡Qué época!', '¿Te acordás?', 'Eso fue todo, gracias.', '«Así me decía».', '(risas).', ''])('"%s" no', (t) => {
    expect(pareceCortada(t)).toBe(false);
  });
});

describe('varios audios por pregunta y "Listo, siguiente pregunta"', () => {
  it('cada audio se transcribe y se muestra; la pregunta no avanza hasta "Listo"; se juntan en orden', async () => {
    const datos = nuevaCarpeta();
    const textos = ['Nací en Salto.', 'Mi mamá era maestra y mi papá', 'trabajaba en el puerto.'];
    let i = 0;
    const base = await levantar({ datos, transcribir: async () => ({ texto: textos[i++], duracionSegundos: 10 }) });
    await post(base, '/api/nueva', { nombre: 'Naza', genero: 'varon' });
    const uno = await audio(base, 'uno');
    expect(uno.status).toBe(200);
    expect(uno.json.pendientes).toEqual([{ texto: 'Nací en Salto.', cortada: false }]);
    expect(leerEstado(datos).esperando).toBe('OR1');
    const dos = await audio(base, 'dos');
    expect(dos.json.pendientes.at(-1)).toEqual({ texto: 'Mi mamá era maestra y mi papá', cortada: true });
    await audio(base, 'tres');
    expect(leerEstado(datos).respuestas).toHaveLength(0);
    const listo = await post(base, '/api/listo', {});
    expect(listo.status).toBe(200);
    expect(listo.json.pendientes).toEqual([]);
    const e = leerEstado(datos);
    expect(e.respuestas).toEqual([['OR1', 'Nací en Salto. Mi mamá era maestra y mi papá trabajaba en el puerto.']]);
    expect(e.esperando).not.toBe('OR1');
    expect(readdirSync(join(datos, 'naza', 'audios')).sort()).toEqual(['01-OR1.webm', '02-OR1.webm', '03-OR1.webm']);
    expect(listo.json.globos.find((g) => g.de === 'narrador')).toMatchObject({ audio: true, texto: 'Nací en Salto. Mi mamá era maestra y mi papá trabajaba en el puerto.' });
    expect(readFileSync(join(datos, 'naza', 'transcripciones.jsonl'), 'utf8').trim().split('\n')).toHaveLength(3);
    expect(e.charla.findLast((g: { de: string }) => g.de === 'persona').audios).toEqual(['audios/01-OR1.webm', 'audios/02-OR1.webm', 'audios/03-OR1.webm']);
  });

  it('"Listo" sin audios da error; con audios pendientes no se ven los botones', async () => {
    const datos = nuevaCarpeta();
    const base = await levantar({ datos, transcribir: async () => ({ texto: 'Éramos cuatro.', duracionSegundos: 3 }) });
    await post(base, '/api/nueva', { nombre: 'Naza', genero: 'varon' });
    expect((await post(base, '/api/listo', {})).status).toBe(400);
    await hasta(base, datos, 'CA6');
    expect((await estado(base)).botones).toHaveLength(2);
    const r = await audio(base);
    expect(r.json.botones).toEqual([]);
    expect(r.json.pendientes).toHaveLength(1);
  });

  it('un texto con audios pendientes se suma al final y manda la respuesta', async () => {
    const datos = nuevaCarpeta();
    const base = await levantar({ datos, transcribir: async () => ({ texto: 'Nací en Salto.', duracionSegundos: 3 }) });
    await post(base, '/api/nueva', { nombre: 'Naza', genero: 'varon' });
    await audio(base);
    await post(base, '/api/texto', { texto: 'En el 98.' });
    expect(leerEstado(datos).respuestas).toEqual([['OR1', 'Nací en Salto. En el 98.']]);
  });

  it('después de tocar "Sí", los audios se suman a esa respuesta con "Listo"', async () => {
    const datos = nuevaCarpeta();
    const base = await levantar({ datos, transcribir: async () => ({ texto: 'Éramos cuatro hermanos.', duracionSegundos: 3 }) });
    await post(base, '/api/nueva', { nombre: 'Naza', genero: 'varon' });
    await hasta(base, datos, 'CA6');
    await post(base, '/api/boton', { texto: 'Sí, tuve' });
    await audio(base);
    await post(base, '/api/listo', {});
    const e = leerEstado(datos);
    expect(e.respuestas.at(-1)).toEqual(['CA6', '⟦botón:Sí, tuve⟧ Éramos cuatro hermanos.']);
    expect(e.esperando).not.toBe('CA6');
  });

  it('los pendientes sobreviven a recrear el servidor', async () => {
    const datos = nuevaCarpeta();
    const base1 = await levantar({ datos, transcribir: async () => ({ texto: 'Nací en Salto.', duracionSegundos: 3 }) });
    await post(base1, '/api/nueva', { nombre: 'Naza', genero: 'varon' });
    await audio(base1);
    const base2 = await levantar({ datos });
    expect((await estado(base2)).pendientes).toEqual([{ texto: 'Nací en Salto.', cortada: false }]);
  });

  it('la página tiene "Listo, siguiente pregunta", el aviso de cortado, el de sin conexión y sigue grabando 1 segundo', async () => {
    const base = await levantar({ datos: nuevaCarpeta() });
    const html = await (await fetch(base + '/')).text();
    expect(html).toContain('Listo, siguiente pregunta');
    expect(html).toContain('Parece que se cortó. ¿Querés mandar otro audio para completar?');
    expect(html).toContain('Sin conexión, reintentando…');
    expect(html).toMatch(/SEGUIR_GRABANDO_MS = 1000/);
  });
});

describe('sin conexión: el servidor reintenta solo', () => {
  it('falla dos veces por la red y a la tercera anda; el audio queda guardado y la página ve "reintentando"', async () => {
    const datos = nuevaCarpeta();
    let llamadas = 0;
    const vistos: boolean[] = [];
    let base = '';
    base = await levantar({
      datos,
      dormir: async () => {
        vistos.push((await estado(base)).reintentando === true);
      },
      transcribir: async () => {
        llamadas++;
        if (llamadas <= 2) throw new ErrorTranscripcion('fetch failed', true);
        return { texto: 'Ahora sí llegó.', duracionSegundos: 4 };
      },
    });
    await post(base, '/api/nueva', { nombre: 'Naza', genero: 'varon' });
    const r = await audio(base);
    expect(r.status).toBe(200);
    expect(llamadas).toBe(3);
    expect(vistos).toEqual([true, true]);
    expect(r.json.reintentando).toBe(false);
    expect(r.json.pendientes).toEqual([{ texto: 'Ahora sí llegó.', cortada: false }]);
    expect(existsSync(join(datos, 'naza', 'audios', '01-OR1.webm'))).toBe(true);
  });

  it('espera 2, 5 y 10 segundos; después del tercer reintento, el error (y el audio para reintentar a mano)', async () => {
    const datos = nuevaCarpeta();
    const esperas: number[] = [];
    let llamadas = 0;
    const base = await levantar({
      datos,
      dormir: async (ms) => {
        esperas.push(ms);
      },
      transcribir: async () => {
        llamadas++;
        throw new ErrorTranscripcion('La transcripción falló (OpenAI 503): ocupado', true);
      },
    });
    await post(base, '/api/nueva', { nombre: 'Naza', genero: 'varon' });
    const r = await audio(base);
    expect(r.status).toBe(502);
    expect(llamadas).toBe(4);
    expect(esperas).toEqual([2000, 5000, 10000]);
    expect(r.json.reintentar).toBe('audios/01-OR1.webm');
    expect(existsSync(join(datos, 'naza', 'audios', '01-OR1.webm'))).toBe(true);
  });

  it('un error que no es de red (una key mala) no se reintenta', async () => {
    let llamadas = 0;
    const base = await levantar({
      datos: nuevaCarpeta(),
      transcribir: async () => {
        llamadas++;
        throw new Error('OpenAI 401: key');
      },
    });
    await post(base, '/api/nueva', { nombre: 'Naza', genero: 'varon' });
    expect((await audio(base)).status).toBe(502);
    expect(llamadas).toBe(1);
  });

  it('qué es reintentable: la red caída, 5xx y 429 de OpenAI; no los 4xx', async () => {
    const con = (status: number) =>
      transcribirAudio(Buffer.from('a'), {
        key: 'k',
        tipo: 'audio/webm',
        nombreArchivo: 'a.webm',
        fetch: (async () => new Response('{"error":{"message":"x"}}', { status })) as unknown as typeof fetch,
      }).catch((e: unknown) => e);
    expect(esReintentable(await con(500))).toBe(true);
    expect(esReintentable(await con(503))).toBe(true);
    expect(esReintentable(await con(429))).toBe(true);
    expect(esReintentable(await con(400))).toBe(false);
    expect(esReintentable(await con(401))).toBe(false);
    const sinRed = (async () => {
      throw new TypeError('fetch failed');
    }) as unknown as typeof fetch;
    expect(esReintentable(await transcribirAudio(Buffer.from('a'), { key: 'k', tipo: 'audio/webm', nombreArchivo: 'a.webm', fetch: sinRed }).catch((e: unknown) => e))).toBe(true);
    const envuelta = await transcribirConOpenAI({ key: () => 'k', fetch: sinRed })(Buffer.from('a'), { tipo: 'audio/webm', nombreArchivo: 'a.webm', narrador: 'Naza' }).catch((e: unknown) => e);
    expect(esReintentable(envuelta)).toBe(true);
  });
});

// ---------------------------------------------------------------- revisión (30/09)

describe('revisión: reintentar no transcribe dos veces el mismo audio', () => {
  it('dos reintentos del mismo archivo = una sola llamada a transcribir', async () => {
    const datos = nuevaCarpeta();
    let falla = true;
    let llamadas = 0;
    const base = await levantar({
      datos,
      transcribir: async () => {
        llamadas++;
        if (falla) throw new Error('OpenAI 400: no');
        return { texto: 'Ahora sí.', duracionSegundos: 2 };
      },
    });
    await post(base, '/api/nueva', { nombre: 'Naza', genero: 'varon' });
    const r = await audio(base);
    expect(r.status).toBe(502);
    falla = false;
    llamadas = 0;
    const [a, b] = await Promise.all([post(base, '/api/reintentar', { archivo: r.json.reintentar }), post(base, '/api/reintentar', { archivo: r.json.reintentar })]);
    expect(llamadas).toBe(1);
    expect([a.status, b.status].sort()).toEqual([200, 409]);
    expect((await estado(base)).pendientes).toHaveLength(1);
  });
});

describe('revisión: timeout de 60 s a OpenAI', () => {
  it('si OpenAI no contesta, se corta y cuenta como error de red (reintentable)', async () => {
    const colgado = ((_url: string, init: RequestInit) =>
      new Promise((_ok, mal) => {
        init.signal?.addEventListener('abort', () => mal(new DOMException('This operation was aborted', 'AbortError')));
      })) as unknown as typeof fetch;
    const err = await transcribirAudio(Buffer.from('a'), { key: 'k', tipo: 'audio/webm', nombreArchivo: 'a.webm', fetch: colgado, timeoutMs: 20 }).catch((e: unknown) => e);
    expect(esReintentable(err)).toBe(true);
    expect((err as Error).message).toMatch(/60 s|tardó/);
  });

  it('por defecto espera 60 segundos', async () => {
    const { TIMEOUT_TRANSCRIPCION_MS } = await import('../src/v3/entrevista/transcribir.js');
    expect(TIMEOUT_TRANSCRIPCION_MS).toBe(60_000);
  });
});

describe('revisión: aviso de cortado y la página sin servidor', () => {
  it.each(['Sí, claro', 'No sé', 'Mi mamá y'])('"%s" (3 palabras o menos) no avisa', (t) => {
    expect(pareceCortada(t)).toBe(false);
  });

  it('si la página no puede hablar con el servidor, ofrece "Reintentar" que recarga el estado', async () => {
    const base = await levantar({ datos: nuevaCarpeta() });
    const html = await (await fetch(base + '/')).text();
    expect(html).toContain("mostrarError('No pude hablar con el servidor. ¿Sigue prendido en la terminal?', null, true)");
    expect(html).toMatch(/if \(sinServidor\)[\s\S]*b\.onclick = reintentarEnvio/);
    expect(html).toMatch(/async function reintentarEnvio[\s\S]*await cargar\(\)/);
  });
});
