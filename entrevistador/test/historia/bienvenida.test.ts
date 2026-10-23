// Task 3.4 del plan: la bienvenida de historia. Para uno mismo, la plantilla desde el tick; un regalo, texto al canjear.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { crearBaseFalsa } from './base-falsa.js';
import { depsDePrueba } from './deps-prueba.js';
import { atenderInvitado, bienvenidaAlCanjear } from '../../src/historia/bienvenida.js';
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
    expect(await atenderInvitado(d.deps, d.n)).toBe('mandada');
    expect(await atenderInvitado(d.deps, d.n)).toBe('ya-estaba');
    expect(d.enviados).toHaveLength(1);
    expect(d.enviados[0]).toMatchObject({ tipo: 'plantilla', plantilla: 'bienvenida_historia_vos' });
    expect(d.enviados[0].variables?.[0]).toBe('Marta');
    expect((await d.fila())!.estado.bienvenida).toMatchObject({ por: 'plantilla' });
    expect(d.base.tablas.envios).toEqual([expect.objectContaining({ tipo: 'bienvenida', wa_message_id: 'wamid.prueba.1' })]);
  });
  it('sin la plantilla aprobada no sale nada y se avisa', async () => {
    vi.stubEnv('WA_PLANTILLAS_HISTORIA_LISTAS', '');
    const d = preparar(PARA_MI);
    expect(await atenderInvitado(d.deps, d.n)).toBe('sin-plantilla');
    expect(d.enviados).toHaveLength(0);
    expect(d.avisos[0].detalle).toContain('es-AR:bienvenida');
    expect((await d.fila())!.estado.bienvenida).toBeUndefined();
  });
  it('si Meta la rechaza, queda anotada como fallida, se avisa y el tick siguiente la reintenta', async () => {
    vi.stubEnv('WA_PLANTILLAS_HISTORIA_LISTAS', 'es-AR:bienvenida');
    const d = preparar(PARA_MI);
    d.fallar(1);
    expect(await atenderInvitado(d.deps, d.n)).toBe('fallo');
    expect(d.avisos).toHaveLength(1);
    expect(d.base.tablas.envios).toEqual([expect.objectContaining({ tipo: 'bienvenida', entrega: 'fallido' })]);
    expect((await d.fila())!.estado.bienvenida).toBeUndefined();
    expect(await atenderInvitado(d.deps, d.n)).toBe('mandada');
    expect(d.enviados).toHaveLength(1);
  });
  it('sin datos para el alta, no sale nada', async () => {
    vi.stubEnv('WA_PLANTILLAS_HISTORIA_LISTAS', 'es-AR:bienvenida');
    const d = preparar({ modo: 'historia', historia: { tema: 'mudanza' } });
    expect(await atenderInvitado(d.deps, d.n)).toBe('frenada');
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
  it('un regalo cuyo alta quedó frenada al canjear recibe la plantilla de regalo cuando se corrigen los datos', async () => {
    vi.stubEnv('WA_PLANTILLAS_HISTORIA_LISTAS', 'es-AR:bienvenida_regalo');
    const d = preparar({ modo: 'historia', regalo: true, historia: { tema: 'mudanza' } }); // sin género
    expect(await bienvenidaAlCanjear(d.deps, 'n1')).toBe(false);
    expect(d.enviados).toHaveLength(0);
    d.base.tablas.narradores[0].contexto = REGALO;
    expect(await atenderInvitado(d.deps, { ...d.n, contexto: REGALO })).toBe('mandada');
    expect(d.enviados[0]).toMatchObject({ tipo: 'plantilla', plantilla: 'bienvenida_historia_regalo_vos' });
    expect(d.enviados[0].variables).toContain('Pablo');
  });
  it('dijo SÍ pero quedó invitado (la base falló): el tick lo deja activo', async () => {
    const d = preparar(REGALO);
    await bienvenidaAlCanjear(d.deps, 'n1');
    d.base.tablas.historias[0].estado.fase = 'entrevista';
    expect(await atenderInvitado(d.deps, d.n)).toBe('activado');
    expect(d.base.tablas.narradores[0].estado).toBe('activo');
  });
  it('lo que quedó en la cola antes del SÍ sale en el tick', async () => {
    const d = preparar(REGALO);
    d.fallar(1);
    await bienvenidaAlCanjear(d.deps, 'n1');
    expect(d.enviados).toHaveLength(0);
    expect(await atenderInvitado(d.deps, d.n)).toBe('drenada');
    expect(d.enviados).toHaveLength(1);
  });
  it('a los 30 días sin SÍ se avisa una sola vez para devolver', async () => {
    vi.stubEnv('WA_PLANTILLAS_HISTORIA_LISTAS', 'es-AR:bienvenida');
    const d = preparar(PARA_MI);
    await atenderInvitado(d.deps, d.n);
    d.pasar(29 * 86_400_000);
    expect(await atenderInvitado(d.deps, d.n)).toBe('ya-estaba');
    d.pasar(2 * 86_400_000);
    expect(await atenderInvitado(d.deps, d.n)).toBe('no-acepto');
    expect(await atenderInvitado(d.deps, d.n)).toBe('ya-estaba');
    expect(d.avisos.filter((a) => a.clave === 'no-acepto:n1')).toHaveLength(1);
  });
});
