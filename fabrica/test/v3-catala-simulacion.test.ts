// La entrevista en catalán (Naza, 04/10) en la simulación por turnos y en la
// página de prueba (--idioma ca). Vida inventada; nada llama a OpenAI.

import { mkdtempSync, rmSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { crearManejador, type Vista } from '../scripts/v3-entrevista-web.js';
import { main, nuevaEntrevista, responder, tocarBoton } from '../scripts/v3-entrevista-turno.js';
import { TEXTOS_IDIOMA } from '../src/v3/entrevista/banco.js';

const CA = TEXTOS_IDIOMA.ca;
const raiz = mkdtempSync(join(tmpdir(), 'v3-catala-'));
afterAll(() => rmSync(raiz, { recursive: true, force: true }));

describe('la simulación por turnos en catalán', () => {
  it('arranca con la bienvenida y la primera pregunta en catalán', () => {
    const r = nuevaEntrevista({ nombre: 'Roser', genero: 'mujer', idioma: 'ca' });
    expect(r.mensajes[0]).toMatch(/^Hola, Roser, com estàs\?/);
    expect(r.mensajes[1]).toContain(CA.preguntas.OR1);
    expect(r.mensajes[1]).toContain('_Si no va amb tu, digues «passo» i en fem una altra._');
  });

  it('acusa en catalán y avanza', () => {
    let r = nuevaEntrevista({ nombre: 'Roser', genero: 'mujer', idioma: 'ca' });
    r = responder(r.estado, 'Vaig néixer a Manresa, el pare era fuster i la mare cosia.');
    expect(r.mensajes[0]).toMatch(/^Gràcies, Roser\. Ja ho tinc guardat\.\n/);
  });

  it('los botones salen en catalán y tocarlos funciona', () => {
    let r = nuevaEntrevista({ nombre: 'Jordi', genero: 'varon', idioma: 'ca' });
    for (let i = 0; i < 40 && r.estado.esperando !== 'CA6'; i++) r = responder(r.estado, 'Era una casa petita amb un pati, i hi vivíem tots junts.');
    expect(r.estado.esperando).toBe('CA6');
    expect(r.mensajes.at(-1)).toContain(`(${CA.botones.CA6[1]})`);
    const no = tocarBoton(r.estado, CA.botones.CA6[1]);
    expect(no.estado.respuestas.at(-1)).toEqual(['CA6', `⟦botón:${CA.botones.CA6[1]}⟧`]);
    expect(() => tocarBoton(r.estado, 'No tuve hermanos')).toThrow(/no tiene el botón/);
  });

  it('el CLI acepta --idioma ca, y rechaza un idioma que no existe', () => {
    const ruta = join(raiz, 'estado.json');
    expect(main(['nueva', ruta, '--nombre', 'Roser', '--genero', 'mujer', '--idioma', 'ca'])).toContain('com estàs?');
    expect(() => main(['nueva', ruta, '--nombre', 'Roser', '--genero', 'mujer', '--idioma', 'fr'])).toThrow(/desconocido/);
    expect(main(['nueva', ruta, '--nombre', 'Naza', '--genero', 'varon'])).toContain('¿cómo estás?');
  });
});

describe('la página de prueba con --idioma ca', () => {
  const servidores: Server[] = [];
  afterEach(async () => {
    await Promise.all(servidores.splice(0).map((s) => new Promise((ok) => s.close(ok))));
  });

  it('la entrevista nueva es en catalán y el audio se transcribe con idioma ca', async () => {
    const llamadas: { idioma?: string }[] = [];
    const s = createServer(
      crearManejador({
        datos: join(raiz, 'web'),
        log: () => {},
        dormir: async () => {},
        idioma: 'ca',
        transcribir: async (_audio, info) => {
          llamadas.push(info);
          return { texto: 'Vaig néixer a Reus.', duracionSegundos: 3 };
        },
      }),
    );
    servidores.push(s);
    await new Promise<void>((ok) => s.listen(0, '127.0.0.1', ok));
    const base = `http://127.0.0.1:${(s.address() as AddressInfo).port}`;
    const nueva = (await (await fetch(base + '/api/nueva', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ nombre: 'Roser', genero: 'mujer' }) })).json()) as Vista;
    expect(JSON.stringify(nueva.globos)).toContain('com estàs?');
    await fetch(base + '/api/audio', { method: 'POST', headers: { 'content-type': 'audio/webm' }, body: Buffer.from('audio-falso') });
    expect(llamadas[0].idioma).toBe('ca');
  });
});
