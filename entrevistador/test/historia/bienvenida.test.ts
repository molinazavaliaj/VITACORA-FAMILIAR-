// Task 3.4 del plan: la bienvenida de historia. Para uno mismo, la plantilla desde el tick; un regalo, texto al canjear.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { crearBaseFalsa } from './base-falsa.js';
import { depsDePrueba } from './deps-prueba.js';
import { bienvenidaAlCanjear, bienvenidaPorPlantilla } from '../../src/historia/bienvenida.js';
import { leerFila } from '../../src/historia/estado.js';
import type { NarradorHistoria } from '../../src/historia/tipos.js';

function preparar(contexto: Record<string, unknown>) {
  const n: NarradorHistoria = {
    id: 'n1', familia_id: 'f1', como_le_dicen: 'Marta', telefono_whatsapp: '+5491100000000', hora_preferida: '10:00:00',
    zona_horaria: 'America/Argentina/Buenos_Aires', contexto, estado: 'invitado', dia_actual: 0, ultima_respuesta_at: null,
  };
  const base = crearBaseFalsa({ narradores: [{ ...n }], familias: [{ id: 'f1', nombre: 'Pablo' }] });
  const p = depsDePrueba(base);
  return { ...p, base, n, fila: () => leerFila(base.cliente, 'n1') };
}

const PARA_MI = { modo: 'historia', genero: 'mujer', historia: { tema: 'mudanza' } };
const REGALO = { modo: 'historia', regalo: true, genero: 'mujer', historia: { tema: 'mudanza' } };

afterEach(() => vi.unstubAllEnvs());

describe('bienvenida de historia', () => {
  it('para uno mismo: alta y la plantilla BIEN-H con su nombre y la historia, una sola vez', async () => {
    vi.stubEnv('WA_PLANTILLAS_HISTORIA_LISTAS', 'es-AR:bienvenida');
    const d = preparar(PARA_MI);
    expect(await bienvenidaPorPlantilla(d.deps, d.n)).toBe('mandada');
    expect(await bienvenidaPorPlantilla(d.deps, d.n)).toBe('ya-estaba');
    expect(d.enviados).toHaveLength(1);
    expect(d.enviados[0]).toMatchObject({ tipo: 'plantilla', plantilla: 'bienvenida_historia_vos' });
    expect(d.enviados[0].variables?.[0]).toBe('Marta');
    expect((await d.fila())!.estado.bienvenida).toMatchObject({ por: 'plantilla' });
    expect(d.base.tablas.envios).toEqual([expect.objectContaining({ tipo: 'bienvenida', wa_message_id: 'wamid.prueba.1' })]);
  });
  it('sin la plantilla aprobada no sale nada y se avisa', async () => {
    vi.stubEnv('WA_PLANTILLAS_HISTORIA_LISTAS', '');
    const d = preparar(PARA_MI);
    expect(await bienvenidaPorPlantilla(d.deps, d.n)).toBe('sin-plantilla');
    expect(d.enviados).toHaveLength(0);
    expect(d.avisos[0].detalle).toContain('es-AR:bienvenida');
    expect((await d.fila())!.estado.bienvenida).toBeUndefined();
  });
  it('si Meta la rechaza, queda anotada como fallida, se avisa y no se reintenta sola', async () => {
    vi.stubEnv('WA_PLANTILLAS_HISTORIA_LISTAS', 'es-AR:bienvenida');
    const d = preparar(PARA_MI);
    d.fallar(1);
    expect(await bienvenidaPorPlantilla(d.deps, d.n)).toBe('fallo');
    expect(d.avisos).toHaveLength(1);
    expect(d.base.tablas.envios).toEqual([expect.objectContaining({ tipo: 'bienvenida', entrega: 'fallido' })]);
    expect(await bienvenidaPorPlantilla(d.deps, d.n)).toBe('ya-estaba');
  });
  it('sin datos para el alta, no sale nada', async () => {
    vi.stubEnv('WA_PLANTILLAS_HISTORIA_LISTAS', 'es-AR:bienvenida');
    const d = preparar({ modo: 'historia', historia: { tema: 'mudanza' } });
    expect(await bienvenidaPorPlantilla(d.deps, d.n)).toBe('frenada');
    expect(d.enviados).toHaveLength(0);
  });
  it('regalo al canjear: alta y BIEN-HR como texto, con quien regala; una sola vez', async () => {
    const d = preparar(REGALO);
    expect(await bienvenidaAlCanjear(d.deps, 'n1')).toBe(true);
    expect(await bienvenidaAlCanjear(d.deps, 'n1')).toBe(true);
    expect(d.enviados).toHaveLength(1);
    expect(d.enviados[0].tipo).toBe('texto');
    expect(d.enviados[0].texto).toContain('Pablo');
    expect(d.enviados[0].texto).not.toContain('{{');
    expect((await d.fila())!.estado.bienvenida).toMatchObject({ por: 'texto' });
  });
});
