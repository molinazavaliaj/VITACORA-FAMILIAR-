import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { crearBaseFalsa } from '../v3/base-falsa.js';
import { compraDePrueba, simularViaje, whatsappDeMentira, type Linea } from '../../scripts/viaje-v2-simular.js';
import { crearFila } from '../../src/viaje-v2/filas.js';
import { estadoInicial } from '../../src/viaje-v2/tipos.js';
import type { DepsViaje } from '../../src/viaje-v2/deps.js';
import type { Idioma } from '../../src/viaje-v2/nucleo/idioma.js';

// La simulación del script, contra la base en memoria: un viaje entero por idioma, de la bienvenida a la despedida.
const ENV = 'WA_PLANTILLAS_VIAJE_V2_LISTAS';
let previo: string | undefined;
beforeEach(() => { previo = process.env[ENV]; process.env[ENV] = (['es-AR', 'es-ES', 'ca'] as const).flatMap((i) => ['mensaje', 'recordatorio', 'recordatorio_ultima', 'bienvenida'].map((c) => `${i}:${c}`)).join(','); });
afterEach(() => { if (previo === undefined) delete process.env[ENV]; else process.env[ENV] = previo; });

describe.each(['es-AR', 'es-ES', 'ca'] as Idioma[])('viaje V2 en el bot: un viaje entero (%s)', (idioma) => {
  it('termina con la despedida, la viajera queda completada y toda respuesta tiene clave', async () => {
    let reloj = new Date('2026-11-01T13:00:00Z');
    const charla: Linea[] = [];
    const { wa, cuenta } = whatsappDeMentira(charla, () => reloj);
    const base = crearBaseFalsa({ narradores: [{ id: 'n1', estado: 'invitado', telefono_whatsapp: '+5400', contexto: { modo: 'viaje' } }], viajes_v2: [], respuestas: [], envios: [], fotos: [] });
    const deps: DepsViaje = {
      db: base.cliente, wa,
      transcribir: async (a) => ({ texto: a.toString('utf8') === 'VACIO' ? '' : a.toString('utf8'), duracionSegundos: 30 }),
      avisar: async () => {},
      ahora: () => reloj,
    };
    const compra = compraDePrueba(idioma, reloj);
    await crearFila(base.cliente, { narrador_id: 'n1', idioma, compra, estado: estadoInicial() });
    const r = await simularViaje(deps, base.cliente, { id: 'n1', telefono_whatsapp: '+5400' }, { idioma, charla, pasar: (ms) => { reloj = new Date(reloj.getTime() + ms); } });
    expect(r.terminado).toBe(true);
    expect(r.completado).toBe(true);
    expect(r.respuestasSinClave).toBe(0);
    expect(r.respuestasConClave).toBeGreaterThan(15);
    expect(cuenta.reacciones).toBeGreaterThan(0);
    expect(r.vencidos).toEqual([]);
    // La primera es la bienvenida por plantilla; la última, la despedida.
    expect(charla.find((x) => x.de === 'bot')!.texto).toMatch(/^\[plantilla bienvenida_viaje_v2/);
    expect(base.tablas.envios.map((e) => e.tipo).sort()).toEqual(['bienvenida', ...Array(cuenta.mensajes + cuenta.plantillas + cuenta.reacciones - 1).fill('viaje_v2')]);
  });
});
