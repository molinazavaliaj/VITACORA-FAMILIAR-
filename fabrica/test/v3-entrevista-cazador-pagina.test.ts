// El cazador en la simulación por turnos y en la página de prueba (plan:
// docs/v3/entrevista/cazador/plan-codigo.md, parte B4; Naza, 01/10). Con el
// flag (apagado por defecto), al cerrar un bloque se llama al cazador sin
// frenar la charla y lo que devuelve entra a la cola. Cliente falso: ningún
// test llama a la API. Datos inventados.

import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { cazarAlCerrar, nuevaEntrevista, responder, sumarCaza, tocarBoton, type EstadoSimulacion, type Resultado } from '../scripts/v3-entrevista-turno.js';
import { crearManejador } from '../scripts/v3-entrevista-web.js';
import type { ClienteModelo, PedidoModelo, ResultadoCaza } from '../src/v3/entrevista/cazador.js';

const CUENTA = 'Sí, te cuento: fue una historia larga que me acuerdo muy bien.';
const OR1 = 'Nací en un pueblo de la costa, en una casa con aljibe y un limonero.';

/** Un cliente falso que elige la respuesta a OR1 y anota los pedidos. */
function falso() {
  const pedidos: PedidoModelo[] = [];
  const cliente: ClienteModelo = {
    messages: {
      create: async (p) => {
        pedidos.push(p);
        const elegidas = [{ id: 'OR1', cita: 'una casa con aljibe y un limonero', pregunta: '¿Te acordás de alguna tarde debajo de ese limonero?', tema: 'la tarde del limonero' }];
        return { content: [{ type: 'text', text: JSON.stringify({ elegidas, escenas_contadas_bloque: ['la llegada al pueblo'] }) }], usage: { input_tokens: 20_000, output_tokens: 2_000 } };
      },
    },
  };
  return { cliente, pedidos };
}

/** Contesta contando (OR1 con su texto) hasta que espera `id`. */
function hasta(id: string, desde: Resultado = nuevaEntrevista({ nombre: 'Elvira', genero: 'mujer' })): Resultado {
  let r = desde;
  for (let i = 0; i < 300 && r.estado.esperando !== id; i++) r = responder(r.estado, r.estado.esperando === 'OR1' ? OR1 : CUENTA);
  expect(r.estado.esperando).toBe(id);
  return r;
}

describe('B4. la simulación por turnos (v3-entrevista-turno.ts)', () => {
  it('avisa cuándo se cerró un bloque (respuesta a un cierre), y solo ahí', () => {
    const antes = hasta('CI1');
    expect(antes.bloqueCerrado).toBeUndefined();
    expect(responder(antes.estado, 'No, está todo.').bloqueCerrado).toBe(1);
    expect(tocarBoton(antes.estado, 'No, está todo').bloqueCerrado).toBe(1);
  });

  it('cazarAlCerrar le pasa al cazador las preguntas como se mandaron, y sumarCaza mete el resultado en la cola', async () => {
    const r = responder(hasta('CI1').estado, 'No, está todo.');
    const { cliente, pedidos } = falso();
    const caza = await cazarAlCerrar(r.estado, 1, cliente);
    expect(pedidos).toHaveLength(1);
    const entrada = pedidos[0].messages[0].content;
    expect(entrada).toContain('<bloque>Origen</bloque>');
    expect(entrada).toContain(`<texto>${OR1}</texto>`);
    expect(entrada).toContain('nombre: Elvira');
    const e = sumarCaza(r.estado, caza);
    expect(e.repreguntas?.map((x) => x.clave)).toEqual(['RP~OR1']);
    expect(e.cazador).toMatchObject({ escenasContadas: ['la llegada al pueblo'] });
    expect(e.cazador!.gastoUsd).toBeCloseTo(0.15, 10);
    expect(e.cazador!.registro).toHaveLength(1);
    // Lo gastado y lo ya repreguntado pasan a la llamada siguiente.
    const otra = await cazarAlCerrar(e, 1, falso().cliente);
    expect(otra.gastoUsd).toBeCloseTo(0.3, 10);
    expect(otra.descartadas.map((d) => d.fallas)).toEqual([['ya repreguntado']]);
  });

  it('la repregunta llega como un mensaje más, con [Ya lo conté todo]; tocarlo cierra con M25', async () => {
    const r = responder(hasta('CI1').estado, 'No, está todo.');
    const e = sumarCaza(r.estado, await cazarAlCerrar(r.estado, 1, falso().cliente));
    let s: Resultado = { estado: e, mensajes: [] };
    for (let i = 0; i < 10 && s.estado.esperando !== 'RP~OR1'; i++) s = responder(s.estado, CUENTA);
    expect(s.estado.esperando).toBe('RP~OR1');
    expect(s.mensajes.at(-1)).toMatch(
      /Me quedé pensando en algo que me contaste: «una casa con aljibe y un limonero»\. ¿Te acordás de alguna tarde debajo de ese limonero\? Y si no te vuelve, o ya me lo contaste todo, decímelo nomás y seguimos con otra\.\n\[botones: \(Ya lo conté todo\)\]$/,
    );
    const t = tocarBoton(s.estado, 'Ya lo conté todo');
    expect(t.estado.respuestas.at(-1)).toEqual(['RP~OR1', '⟦botón:Ya lo conté todo⟧']);
    expect(t.mensajes[0]).toMatch(/^Bien, (seguimos|entonces)\./);
  });

  it('un resultado sin llamada (tope, legado) no cambia la cola', () => {
    const r = nuevaEntrevista({ nombre: 'Elvira', genero: 'mujer' });
    const sinLlamar: ResultadoCaza = { bloque: 15, llamo: false, motivo: 'legado', repreguntas: [], descartadas: [], escenasContadas: [], costoUsd: 0, gastoUsd: 0 };
    const e: EstadoSimulacion = sumarCaza(r.estado, sinLlamar);
    expect(e.repreguntas ?? []).toEqual([]);
    expect(e.cazador?.gastoUsd ?? 0).toBe(0);
  });
});

describe('B4. la página de prueba con el cazador', () => {
  const raiz = mkdtempSync(join(tmpdir(), 'v3-web-cazador-'));
  afterAll(() => rmSync(raiz, { recursive: true, force: true }));
  const servidores: Server[] = [];
  afterEach(async () => {
    await Promise.all(servidores.splice(0).map((s) => new Promise((ok) => s.close(ok))));
  });

  it('al contestar el cierre de un bloque llama al cazador sin frenar, y lo que devuelve entra a la cola; la consola muestra el costo', async () => {
    const datos = join(raiz, 'a');
    const logs: string[] = [];
    const { cliente, pedidos } = falso();
    const s = createServer(crearManejador({ datos, log: (l) => logs.push(l), transcribir: async () => ({ texto: 'no se usa', duracionSegundos: 1 }), cazador: cliente, nombre: 'Elvira', genero: 'mujer' }));
    servidores.push(s);
    await new Promise<void>((ok) => s.listen(0, '127.0.0.1', ok));
    const base = `http://127.0.0.1:${(s.address() as AddressInfo).port}`;
    const post = (ruta: string, cuerpo: unknown) => fetch(base + ruta, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(cuerpo) });
    const leer = () => JSON.parse(readFileSync(join(datos, 'elvira', 'estado.json'), 'utf8')) as EstadoSimulacion;

    for (let i = 0; i < 20 && leer().esperando !== 'CI1'; i++) await post('/api/texto', { texto: leer().esperando === 'OR1' ? OR1 : CUENTA });
    expect(pedidos).toHaveLength(0);
    const r = await post('/api/boton', { texto: 'No, está todo' });
    expect(r.status).toBe(200);
    for (let i = 0; i < 50 && !leer().repreguntas?.length; i++) await new Promise((ok) => setTimeout(ok, 10));
    expect(pedidos).toHaveLength(1);
    expect(leer().repreguntas?.map((x) => x.clave)).toEqual(['RP~OR1']);
    expect(logs.some((l) => /cazador, bloque 1: 1 repregunta.*USD 0\.15.*acumulado USD 0\.15/.test(l))).toBe(true);
  });

  it('sin el cazador (por defecto) no llama a nada y la página no muestra el botón de la repregunta', async () => {
    const datos = join(raiz, 'b');
    const s = createServer(crearManejador({ datos, log: () => {}, transcribir: async () => ({ texto: 'no se usa', duracionSegundos: 1 }), nombre: 'Elvira', genero: 'mujer' }));
    servidores.push(s);
    await new Promise<void>((ok) => s.listen(0, '127.0.0.1', ok));
    const base = `http://127.0.0.1:${(s.address() as AddressInfo).port}`;
    for (let i = 0; i < 8; i++) await fetch(base + '/api/texto', { method: 'POST', body: JSON.stringify({ texto: CUENTA }) });
    const e = JSON.parse(readFileSync(join(datos, 'elvira', 'estado.json'), 'utf8')) as EstadoSimulacion;
    expect(e.repreguntas).toBeUndefined();
    expect(e.cazador).toBeUndefined();
  });
});
