import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { procesarEntranteKids } from '../../src/kids-v2/entrante.js';
import { ERROR_PREGUNTAS_CERRADAS, pasoKids } from '../../src/kids-v2/motor.js';
import { nuevoEstado } from '../../src/kids-v2/nucleo/motor.js';
import { tickKids } from '../../src/kids-v2/reloj.js';
import { estadoBotInicial, type FilaKids } from '../../src/kids-v2/tipos.js';
import { audio, baseConChico, boton, CHICO, depsKidsDePrueba, FICHA_A, filaKidsNueva, TEL_PADRE } from './deps-prueba.js';

// El reloj de Kids: los cambios del panel, las marcas, el final y la reconciliación. Chicos INVENTADOS.
const fila = (b: ReturnType<typeof baseConChico>) => b.tablas.kids_v2[0] as FilaKids;

beforeEach(() => { vi.stubEnv('WA_PLANTILLAS_KIDS_LISTAS', '*'); });
afterEach(() => { vi.unstubAllEnvs(); });

async function chicoEnK1() {
  const b = baseConChico();
  const t = depsKidsDePrueba(b);
  await tickKids(t.deps);
  await procesarEntranteKids(t.deps, CHICO, boton('Dale, vamos', 'wamid.salida.1'));
  return { b, t };
}

/** Un chico parado en K31 (empezó el capítulo 4: las preguntas del padre ya no entran). */
function baseEnCap4() {
  const b = baseConChico({ estado: 'activo' });
  const motor = nuevoEstado(FICHA_A);
  const i = motor.guion.findIndex((x) => x.clave === 'K31');
  const enCurso = { ...motor, cursor: i, fase: { tipo: 'pregunta' as const, clave: 'K31', rama: null, pasoRama: 0 }, inicio: '2026-10-20T15:00:00.000Z', ultimaEntrada: '2026-11-02T14:00:00.000Z', diaHecho: '2026-11-02' };
  Object.assign(b.tablas.kids_v2[0], { estado: estadoBotInicial(enCurso), empezo_at: '2026-10-20T15:00:00.000Z', despertar_at: '2026-11-02T21:00:00.000Z' });
  return b;
}

describe('kids: los cambios del panel', () => {
  it('el reloj toma el cambio de hora como evento ficha y limpia cambios_panel', async () => {
    const { b, t } = await chicoEnK1();
    b.tablas.kids_v2[0].cambios_panel = { hora: '19:30', pedido_at: '2026-11-02T15:01:00Z' };
    await tickKids(t.deps);
    expect(fila(b).estado!.motor.ficha.hora).toBe('19:30');
    expect(fila(b).cambios_panel).toBeNull();
    expect(fila(b).cambios_error).toBeNull();
  });

  it('un cambio inválido: cambios_error con el motivo, cambios_panel en null, aviso, y el motor queda como estaba', async () => {
    const { b, t } = await chicoEnK1();
    const antes = JSON.stringify(fila(b).estado!.motor);
    b.tablas.kids_v2[0].cambios_panel = { hora: '23:00', pedido_at: '2026-11-02T15:01:00Z' };
    await tickKids(t.deps);
    expect(fila(b).cambios_error).toMatch(/hora 23:00/);
    expect(fila(b).cambios_panel).toBeNull();
    expect(JSON.stringify(fila(b).estado!.motor)).toBe(antes);
    expect(t.avisos.some((a) => a.clave === 'kids-panel-k1-2026-11-02T15:01:00Z')).toBe(true);
  });

  it('preguntas del padre cuando ya empezó el capítulo 4: se aplica el resto y cambios_error = preguntas-cerradas', async () => {
    const b = baseEnCap4();
    const t = depsKidsDePrueba(b);
    b.tablas.kids_v2[0].cambios_panel = { hora: '19:00', preguntasPadre: [{ texto: '¿Qué es lo que más te gusta de tu escuela?', conLinea: true }] };
    await tickKids(t.deps);
    expect(fila(b).estado!.motor.ficha.hora).toBe('19:00');
    expect(fila(b).estado!.motor.ficha.preguntasPadre).toEqual([]);
    expect(fila(b).cambios_error).toBe(ERROR_PREGUNTAS_CERRADAS);
    expect(fila(b).avance).toMatchObject({ capitulo: 4, preguntasPadreAbiertas: false });
    expect(t.avisos.filter((a) => a.clave.startsWith('kids-panel-'))).toEqual([]);
  });

  it('la misma lista de preguntas que ya tenía (cambió solo la hora) no es un rechazo', async () => {
    const b = baseEnCap4();
    const t = depsKidsDePrueba(b);
    b.tablas.kids_v2[0].cambios_panel = { hora: '19:00', preguntasPadre: [] };
    await tickKids(t.deps);
    expect(fila(b).cambios_error).toBeNull();
  });

  it('un mensaje del chico también toma el cambio pendiente, en la misma escritura', async () => {
    const { b, t } = await chicoEnK1();
    b.tablas.kids_v2[0].cambios_panel = { temasSacados: ['mudanza'] };
    await procesarEntranteKids(t.deps, CHICO, audio('me acuerdo de un cumpleaños en la casa de mi abuela con una torta enorme de chocolate'));
    expect(fila(b).cambios_panel).toBeNull();
    expect(fila(b).estado!.motor.ficha.temasSacados).toEqual(['mudanza']);
  });

  it('si la web fusiona otro cambio mientras se aplica, la escritura pierde, se relee y se aplica el nuevo', async () => {
    const { b, t } = await chicoEnK1();
    b.tablas.kids_v2[0].cambios_panel = { hora: '19:30' };
    const original = b.cliente.from.bind(b.cliente);
    let fusiono = false;
    (b.cliente as unknown as { from: SupabaseClient['from'] }).from = ((tabla: string) => {
      const q = original(tabla) as unknown as { update: (v: Record<string, unknown>) => unknown };
      if (tabla === 'kids_v2') {
        const update = q.update.bind(q);
        q.update = (v) => {
          if ('cambios_panel' in v && !fusiono) {
            fusiono = true;
            b.tablas.kids_v2[0].cambios_panel = { hora: '20:00', temasSacados: ['mudanza'] };
          }
          return update(v);
        };
      }
      return q;
    }) as unknown as SupabaseClient['from'];
    await tickKids(t.deps);
    expect(fusiono).toBe(true);
    expect(fila(b).estado!.motor.ficha.hora).toBe('20:00');
    expect(fila(b).estado!.motor.ficha.temasSacados).toEqual(['mudanza']);
    expect(fila(b).cambios_panel).toBeNull();
  });
});

describe('kids: las marcas y el final', () => {
  it('ocho días en silencio: recordatorios al padre, la marca en kids_v2, aviso y alerta_silencio', async () => {
    const { b, t } = await chicoEnK1();
    t.fijar(new Date('2026-11-06T21:30:00Z')); // 18:30 del cuarto día
    await tickKids(t.deps);
    t.fijar(new Date('2026-11-10T21:30:00Z')); // 18:30 del octavo día
    await tickKids(t.deps);
    const padre = t.enviados.filter((e) => e.a === TEL_PADRE).map((e) => e.plantilla);
    expect(padre).toEqual(['kids_aviso_padre', 'kids_recordatorio_padre', 'kids_recordatorio_padre_8']);
    expect(fila(b).marcas).toMatchObject([{ motivo: 'silencio-8-dias', at: '2026-11-10T21:30:00.000Z' }]);
    expect(t.avisos.some((a) => a.clave === 'kids-k1-silencio-8-dias-1')).toBe(true);
    expect(b.tablas.narradores[0].alerta_silencio).toBe(true);
  });

  it('termino(): pone termino_at una sola vez, avance.terminado y el narrador queda completado', () => {
    const motor = { ...nuevoEstado(FICHA_A), fase: { tipo: 'terminado' as const }, terminoPadre: null, inicio: '2026-10-01T15:00:00.000Z' };
    const f = { ...filaKidsNueva('k1', FICHA_A), estado: estadoBotInicial(nuevoEstado(FICHA_A)) } as unknown as FilaKids;
    const ahora = new Date('2026-11-02T15:00:00Z');
    // Un paso que llega a terminado (se arma a mano: el camino entero es la simulación de T5).
    const conFinal = { ...f, estado: estadoBotInicial(motor) };
    const p = pasoKids(conFinal, [{ tipo: 'respuesta', contenido: { tipo: 'texto', texto: 'hola' }, id: 'w1' }], ahora, { visto: 'w1' });
    expect(p?.cambio.termino_at).toBe(ahora.toISOString());
    expect(p?.cambio.avance).toMatchObject({ terminado: true });
    expect(p?.resultado.termino).toBe(true);
    const otra = pasoKids({ ...conFinal, termino_at: '2026-11-01T00:00:00.000Z' }, [{ tipo: 'reloj' }], ahora);
    expect(otra?.cambio.termino_at).toBeUndefined();
  });

  it('al guardar el paso que termina, el narrador pasa a completado', async () => {
    const b = baseConChico({ estado: 'activo' });
    const motor = { ...nuevoEstado(FICHA_A), fase: { tipo: 'terminado' as const }, terminoPadre: null, inicio: '2026-10-01T15:00:00.000Z', ultimaEntrada: '2026-11-02T14:00:00.000Z' };
    Object.assign(b.tablas.kids_v2[0], { estado: estadoBotInicial(motor), empezo_at: '2026-10-01T15:00:00.000Z' });
    const t = depsKidsDePrueba(b);
    await procesarEntranteKids(t.deps, CHICO, audio('gracias por todo me gustó mucho contar las cosas de mi vida'));
    expect(fila(b).termino_at).toBe(t.deps.ahora().toISOString());
    expect(b.tablas.narradores[0].estado).toBe('completado');
    // Lo que manda después del final sigue entrando al motor: cuando cierra la ráfaga, la marca (y no cambia termino_at).
    const termino = fila(b).termino_at;
    t.pasar(2 * 60_000);
    await tickKids(t.deps);
    expect(fila(b).marcas.map((m) => m.motivo)).toEqual(['escribio-despues-del-final']);
    expect(t.avisos.some((a) => a.clave === 'kids-k1-escribio-despues-del-final-1')).toBe(true);
    expect(fila(b).termino_at).toBe(termino);
  });
});

describe('kids: la reconciliación', () => {
  it('una respuesta que quedó sin pasar al motor (más de 5 minutos) la retoma el reloj; un botón queda ∅', async () => {
    const { b, t } = await chicoEnK1();
    const hace = new Date(t.deps.ahora().getTime() - 10 * 60_000).toISOString();
    b.tablas.respuestas.push(
      { id: 'r-texto', narrador_id: 'k1', pregunta_orden: 2, texto_directo: 'jugaba con mi perro en el patio', transcripcion: null, wa_message_id: 'wamid.perdido.1', clave_kids: null, recibido_at: hace },
      { id: 'r-boton', narrador_id: 'k1', pregunta_orden: 3, texto_directo: '⟦botón:Paso⟧', transcripcion: null, wa_message_id: 'wamid.perdido.2', clave_kids: null, recibido_at: hace },
      { id: 'r-nueva', narrador_id: 'k1', pregunta_orden: 4, texto_directo: 'otra', transcripcion: null, wa_message_id: 'wamid.reciente', clave_kids: null, recibido_at: t.deps.ahora().toISOString() },
    );
    await tickKids(t.deps);
    const clave = (id: string) => b.tablas.respuestas.find((r) => r.id === id)?.clave_kids ?? null;
    expect(clave('r-texto')).toBe('K1');
    expect(clave('r-boton')).toBe('∅');
    expect(clave('r-nueva')).toBeNull();
    expect(fila(b).estado!.vistos).toContain('wamid.perdido.1');
    expect(fila(b).estado!.motor.rafaga).not.toBeNull();
  });

  it('una ya vista cuya clave no se escribió la toma de `recibidos`', async () => {
    const { b, t } = await chicoEnK1();
    const a = audio('me acuerdo de la pileta del club y de mi primo tirándose de cabeza');
    await procesarEntranteKids(t.deps, CHICO, a);
    const r = b.tablas.respuestas.find((x) => x.wa_message_id === a.waMessageId)!;
    r.clave_kids = null; // se perdió la escritura de la clave
    r.recibido_at = new Date(t.deps.ahora().getTime() - 10 * 60_000).toISOString();
    await tickKids(t.deps);
    expect(r.clave_kids).toBe('K1');
  });
});
