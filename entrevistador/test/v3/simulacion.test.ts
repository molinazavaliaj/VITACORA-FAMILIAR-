import { describe, it, expect } from 'vitest';
import { crearBaseFalsa } from './base-falsa.js';
import { depsDePrueba } from './deps-prueba.js';
import { charlaMd, respuestaSimulada, simularEntrevista } from '../../scripts/v3-simular.js';
import { mensajePorId, MENSAJES } from '../../src/v3/nucleo/entrevista/banco.js';
import { procesarEntranteV3 } from '../../src/v3/entrante.js';
import { arrancarV3 } from '../../src/v3/pasar.js';
import { trabajarNarrador } from '../../src/v3/reloj.js';
import { leerFila } from '../../src/v3/estado.js';
import type { NarradorV3 } from '../../src/v3/tipos.js';

const narrador = (idioma: string): NarradorV3 => ({
  id: `sim-${idioma}`, familia_id: 'f-sim', como_le_dicen: 'Prueba V3', telefono_whatsapp: `+000${idioma.length}`, hora_preferida: '22:00:00',
  zona_horaria: 'America/Argentina/Buenos_Aires', contexto: { ritmo: 'seguido', genero: 'varon', ...(idioma === 'es-AR' ? {} : { idioma }) },
  estado: 'acepto', dia_actual: 0, ultima_respuesta_at: null,
});

describe('la simulación de punta a punta (base y WhatsApp falsos)', () => {
  it.each(['es-AR', 'es-ES', 'ca'] as const)('una entrevista entera en %s termina y deja al narrador completado', async (idioma) => {
    const n = narrador(idioma);
    const base = crearBaseFalsa({ familias: [{ id: 'f-sim', nombre: 'Prueba' }], narradores: [{ ...n }] });
    const p = depsDePrueba(base);
    const r = await simularEntrevista(p.deps, n, { idioma, pasar: p.pasar, maxPasos: 600 });
    expect(r).toMatchObject({ idioma, terminada: true, completado: true });
    expect(r.audios).toBeGreaterThan(50);
    expect(p.enviados.length).toBeGreaterThan(50);
    expect(p.enviados.every((e) => e.tipo !== 'plantilla')).toBe(true); // contesta siempre dentro de las 24 h
    expect(p.avisos).toEqual([]);
    const fila = await leerFila(base.cliente, n.id);
    expect(fila?.estado.salientes).toEqual([]);
    expect(charlaMd(fila!)).toContain('**Narrador**');
    expect(base.tablas.respuestas.every((x) => x.clave_v3 !== null)).toBe(true);
  });

  it('en es-AR toca botones de verdad (la vida inventada tiene botones)', async () => {
    const n = narrador('es-AR');
    const base = crearBaseFalsa({ familias: [{ id: 'f-sim', nombre: 'Prueba' }], narradores: [{ ...n }] });
    const p = depsDePrueba(base);
    const r = await simularEntrevista(p.deps, n, { idioma: 'es-AR', pasar: p.pasar });
    expect(r.botones).toBeGreaterThan(0);
    expect(p.enviados.some((e) => e.tipo === 'botones')).toBe(true);
  });

  it.each(['es-AR', 'es-ES', 'ca'] as const)('en %s ningún mensaje sale vacío ni con marcas {{ sin reemplazar', async (idioma) => {
    const n = narrador(idioma);
    const base = crearBaseFalsa({ familias: [{ id: 'f-sim', nombre: 'Prueba' }], narradores: [{ ...n }] });
    const p = depsDePrueba(base);
    await simularEntrevista(p.deps, n, { idioma, pasar: p.pasar });
    for (const e of p.enviados) {
      expect((e.texto ?? '').trim()).not.toBe('');
      expect(e.texto).not.toContain('{{');
    }
  });

  it('en catalán no se filtra castellano: ningún mensaje conocido sale con el texto de es-AR', async () => {
    const n = narrador('ca');
    const base = crearBaseFalsa({ familias: [{ id: 'f-sim', nombre: 'Prueba' }], narradores: [{ ...n }] });
    const p = depsDePrueba(base);
    await simularEntrevista(p.deps, n, { idioma: 'ca', pasar: p.pasar });
    const salidos = p.enviados.map((e) => e.texto ?? '');
    const largos = MENSAJES.map((m) => m.id).filter((id) => {
      const es = mensajePorId(id, 'es-AR')?.texto ?? '';
      const ca = mensajePorId(id, 'ca')?.texto ?? '';
      return es.length > 40 && es !== ca;
    });
    expect(largos.length).toBeGreaterThan(0);
    for (const id of largos) {
      expect(salidos.some((t) => t.includes(mensajePorId(id, 'es-AR')!.texto))).toBe(false);
    }
  });

  it('M22 sale una sola vez aunque conteste varias veces por escrito', async () => {
    const n = narrador('es-AR');
    const base = crearBaseFalsa({ familias: [{ id: 'f-sim', nombre: 'Prueba' }], narradores: [{ ...n }] });
    const p = depsDePrueba(base);
    await arrancarV3(p.deps, n, 'es-AR', { nombre: 'Prueba V3', genero: 'varon' }, { ventanaAbierta: true });
    for (let i = 1; i <= 3; i++) {
      const activo = base.tablas.narradores[0] as unknown as NarradorV3;
      await procesarEntranteV3(p.deps, activo, { telefono: n.telefono_whatsapp, tipo: 'texto', texto: `Te cuento por escrito ${i}`, waMessageId: `w-${i}` });
      p.pasar(4 * 60_000);
      const fila = (await leerFila(base.cliente, n.id))!;
      await trabajarNarrador(p.deps, fila, activo);
    }
    const m22 = mensajePorId('M22', 'es-AR')!.texto;
    expect(p.enviados.filter((e) => (e.texto ?? '').includes(m22)).length).toBe(1);
  });

  it('con ritmo diario nunca abre más de 4 preguntas por día y termina', async () => {
    const n: NarradorV3 = { ...narrador('es-AR'), id: 'sim-diario', contexto: { ritmo: 'diario', genero: 'varon' } };
    const base = crearBaseFalsa({ familias: [{ id: 'f-sim', nombre: 'Prueba' }], narradores: [{ ...n }] });
    const p = depsDePrueba(base);
    let maximo = 0;
    const pasar = (ms: number) => {
      p.pasar(ms * 90); // 6 h por paso: pasan los días
      const fila = base.tablas.entrevistas_v3?.[0];
      if (fila) maximo = Math.max(maximo, Number(fila.tanda_cuenta));
    };
    const r = await simularEntrevista(p.deps, n, { idioma: 'es-AR', pasar, maxPasos: 3000 });
    expect(r).toMatchObject({ terminada: true, completado: true });
    expect(maximo).toBeLessThanOrEqual(4);
    expect(maximo).toBeGreaterThan(0);
  });

  it('respuestaSimulada: FO1 se contesta con el botón de "no tengo foto"; después de "Sí", audio', () => {
    expect(respuestaSimulada('FO1', 'ca', false)).toEqual({ boton: 'No tinc cap foto' });
    expect(respuestaSimulada('CA6', 'es-AR', true)).toHaveProperty('audio');
  });
});
