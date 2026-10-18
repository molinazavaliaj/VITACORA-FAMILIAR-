import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { duracionOgg, procesarEntranteKids } from '../../src/kids-v2/entrante.js';
import { tickKids } from '../../src/kids-v2/reloj.js';
import type { FilaKids } from '../../src/kids-v2/tipos.js';
import { oggFalso, simularChico, simularMuchos, type ResultadoSim } from '../../scripts/kids-v2-simular.js';
import { baseConChico, boton, CHICO, depsKidsDePrueba, llega, TEL_CHICO } from './deps-prueba.js';

// La simulación del bot de punta a punta (plan-conexion-bot.md, T5): el código de verdad del entrevistador, la base en
// memoria, WhatsApp falso y los chicos inventados del simulador del motor. Una tanda chica acá; muchas semillas con
// `npm run kids-v2-simular`. Abajo, los casos dirigidos. Chicos INVENTADOS.

const ENV = 'WA_PLANTILLAS_KIDS_LISTAS';
let previo: string | undefined;
beforeEach(() => {
  previo = process.env[ENV];
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  if (previo === undefined) delete process.env[ENV];
  else process.env[ENV] = previo;
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

const sinViolaciones = (r: ResultadoSim) => expect(r.violaciones, `semilla ${r.semilla} (${r.conducta}, canal ${r.canal})`).toEqual([]);

describe('kids: la simulación del bot de punta a punta', () => {
  it('una tanda chica (canal A y B, varias conductas): termina, todo con clave y cero violaciones', async () => {
    const rs = await simularMuchos(4, {}, 1);
    expect(new Set(rs.map((r) => r.canal))).toEqual(new Set(['A', 'B']));
    for (const r of rs) {
      sinViolaciones(r);
      expect(r.termino).toBe(true);
      expect(r.base.tablas.narradores[0].estado).toBe('completado');
      expect(r.fila.termino_at).not.toBeNull();
      expect(r.base.tablas.respuestas.length).toBeGreaterThan(20);
      expect(r.base.tablas.respuestas.every((x) => x.clave_kids != null)).toBe(true);
      expect(r.salidas.some((s) => s.tipo === 'plantilla')).toBe(true);
      expect(r.salidas.some((s) => s.tipo === 'botones')).toBe(true);
    }
  }, 60_000);

  it('Meta reintenta TODOS los webhooks (a la vez o minutos después): nada se cuenta dos veces', async () => {
    const r = await simularChico({ semilla: 3, pReintento: 1, pAudioNoBaja: 0, pFallaBase: 0, panel: false });
    sinViolaciones(r);
    expect(r.reintentos).toBe(r.entradas);
  }, 30_000);

  it('muchos envíos que fallan: todo sale una vez, de día y en orden', async () => {
    const r = await simularChico({ semilla: 4, pFalloEnvio: 0.3, panel: false });
    sinViolaciones(r);
    expect(r.fallosEnvio).toBeGreaterThan(20);
  }, 30_000);

  it('ninguna transcripción anda: los audios entran igual, con su duración', async () => {
    const r = await simularChico({ semilla: 5, pTranscripcionFalla: 1, panel: false });
    sinViolaciones(r);
    const audios = r.base.tablas.respuestas.filter((x) => x.audio_path);
    expect(audios.length).toBeGreaterThan(5);
    expect(audios.every((x) => !x.transcripcion)).toBe(true);
  }, 30_000);

  it('audios que no se pueden bajar: aviso a los socios, ninguna fila, y cuando lo vuelve a mandar entra', async () => {
    const r = await simularChico({ semilla: 6, pAudioNoBaja: 0.3, panel: false });
    sinViolaciones(r);
    expect(r.charla.some((l) => l.includes('(no se pudo bajar)'))).toBe(true);
  }, 30_000);

  it('el padre cambia la hora, los temas y sus preguntas desde el panel, a cualquier hora (también tarde)', async () => {
    const rs = await simularMuchos(3, { panel: true }, 10);
    for (const r of rs) {
      sinViolaciones(r);
      expect(r.panel).toBeGreaterThan(0);
      expect(r.fila.cambios_panel).toBeNull();
    }
  }, 60_000);

  it('el chico escribe antes del arranque: queda con ∅, se avisa, no se le contesta, y después arranca normal', async () => {
    const r = await simularChico({ semilla: 7, antesDelArranque: true, panel: false });
    sinViolaciones(r);
    const antes = r.base.tablas.respuestas.find((x) => x.wa_message_id === 'wamid.kids-sim-7.antes');
    expect(antes?.clave_kids).toBe('∅');
  }, 30_000);

  it('una plantilla que se aprueba días después (de noche): espera en la cola y sale de día', async () => {
    // Semilla 9 (se-calla): los recordatorios al padre salen. Se aprueba a las 23:00 de Buenos Aires de un día.
    const r = await simularChico({ semilla: 9, conducta: 'se-calla', canal: 'A', panel: false, plantillaTarde: { nombre: 'kids_recordatorio_padre', dias: 0.5 + 8 / 24 } });
    sinViolaciones(r);
  }, 30_000);

  it.each(['toca-viejos', 'de-noche', 'toca-cualquier-cosa', 'algo-preocupante'] as const)('conducta %s, canal A y B', async (conducta) => {
    for (const canal of ['A', 'B'] as const) sinViolaciones(await simularChico({ semilla: 21, conducta, canal }));
  }, 60_000);
});

describe('kids: casos dirigidos', () => {
  const fila = (b: ReturnType<typeof baseConChico>) => b.tablas.kids_v2[0] as FilaKids;
  beforeEach(() => { vi.stubEnv(ENV, '*'); });

  async function chicoEnK1() {
    const b = baseConChico();
    const t = depsKidsDePrueba(b);
    await tickKids(t.deps);
    await procesarEntranteKids(t.deps, CHICO, boton('Dale, vamos', 'wamid.salida.1'));
    return { b, t };
  }

  it('un mensaje que no pudo salir antes de las 22 no sale de noche: queda para las 9', async () => {
    const { b, t } = await chicoEnK1();
    t.fijar(new Date('2026-11-03T00:58:00Z')); // 21:58 en Buenos Aires
    await procesarEntranteKids(t.deps, CHICO, llega({ tipo: 'audio', mediaId: 'me acuerdo del día que fuimos a la cancha con mi papá y ganamos por goleada' }));
    const n = t.enviados.length;
    t.fijar(new Date('2026-11-03T00:59:40Z')); // 21:59:40: vencen los 90 s y Meta falla
    t.fallar(5);
    await tickKids(t.deps);
    expect(t.enviados).toHaveLength(n);
    expect(fila(b).estado!.salida.length).toBeGreaterThan(0);
    t.fallar(0);
    for (const hora of ['01:00:30', '01:01:30', '04:00:00', '11:59:00']) {
      t.fijar(new Date(`2026-11-03T${hora}Z`));
      await tickKids(t.deps);
      expect(t.enviados, `a las ${hora}Z`).toHaveLength(n);
    }
    expect(fila(b).despertar_at).toBe('2026-11-03T12:00:00.000Z');
    t.fijar(new Date('2026-11-03T12:00:00Z')); // 09:00
    await tickKids(t.deps);
    expect(t.enviados.length).toBeGreaterThan(n);
    expect(t.enviados.slice(n).every((e) => e.a === TEL_CHICO)).toBe(true);
    expect(fila(b).estado!.salida).toEqual([]);
  });

  it('una plantilla que se aprueba de noche espera a las 9', async () => {
    const { b, t } = await chicoEnK1();
    vi.stubEnv(ENV, 'kids_bienvenida,kids_aviso_padre');
    t.fijar(new Date('2026-11-06T21:30:00Z')); // 18:30 del cuarto día: el recordatorio al padre, sin aprobar
    await tickKids(t.deps);
    const n = t.enviados.length;
    expect(fila(b).estado!.salida.length).toBeGreaterThan(0);
    vi.stubEnv(ENV, '*');
    t.fijar(new Date('2026-11-07T02:00:00Z')); // 23:00: se aprueba
    await tickKids(t.deps);
    expect(t.enviados).toHaveLength(n);
    t.fijar(new Date('2026-11-07T12:00:00Z')); // 09:00
    await tickKids(t.deps);
    expect(t.enviados.slice(n).map((e) => e.plantilla)).toContain('kids_recordatorio_padre');
  });

  it('el padre cambia la hora: la principal del día siguiente sale a la hora nueva', async () => {
    const { b, t } = await chicoEnK1();
    await procesarEntranteKids(t.deps, CHICO, llega({ tipo: 'audio', mediaId: 'me gusta jugar al fútbol con mis amigos del barrio todos los días después de la escuela' }));
    t.pasar(2 * 60_000);
    await tickKids(t.deps);
    // Toca [Mañana sigo] si se lo ofrecen; si no, no importa: la próxima principal sale a la hora.
    b.tablas.kids_v2[0].cambios_panel = { hora: '19:30', pedido_at: t.deps.ahora().toISOString() };
    t.pasar(60_000);
    await tickKids(t.deps);
    expect(fila(b).estado!.motor.ficha.hora).toBe('19:30');
    const n = t.enviados.length;
    t.fijar(new Date('2026-11-03T21:00:00Z')); // 18:00 del día siguiente: la hora vieja
    await tickKids(t.deps);
    expect(t.enviados).toHaveLength(n);
    t.fijar(new Date('2026-11-03T22:30:00Z')); // 19:30
    await tickKids(t.deps);
    expect(t.enviados.length).toBeGreaterThan(n);
  });

  it('un audio que no se pudo transcribir le llega al motor con la duración del archivo', async () => {
    const b = baseConChico();
    const t = depsKidsDePrueba(b);
    t.deps.wa.descargar = async () => oggFalso(120, 'nada');
    t.deps.transcribir = async () => { throw new Error('La transcripción falló: prueba'); };
    await tickKids(t.deps);
    await procesarEntranteKids(t.deps, CHICO, boton('Dale, vamos', 'wamid.salida.1'));
    await procesarEntranteKids(t.deps, CHICO, llega({ tipo: 'audio', mediaId: 'x' }));
    expect(fila(b).estado!.motor.rafaga).toMatchObject({ seg: 120 });
  });

  it('un audio sin texto que no llegó al motor (la base falló): la reconciliación le pasa su duración, no 0 s', async () => {
    for (const vacio of ['VACIO', 'FALLA']) {
      const b = baseConChico();
      const t = depsKidsDePrueba(b);
      if (vacio === 'FALLA') t.deps.wa.descargar = async () => oggFalso(70, 'FALLA');
      if (vacio === 'FALLA') t.deps.transcribir = async () => { throw new Error('La transcripción falló: prueba'); };
      await tickKids(t.deps);
      await procesarEntranteKids(t.deps, CHICO, boton('Dale, vamos', 'wamid.salida.1'));
      b.fallarProxima.set('kids_v2', { code: 'XX000', message: 'la base falló: prueba' });
      await expect(procesarEntranteKids(t.deps, CHICO, llega({ tipo: 'audio', mediaId: vacio }))).rejects.toThrow();
      expect(fila(b).estado!.motor.rafaga).toBeNull();
      t.pasar(6 * 60_000);
      await tickKids(t.deps);
      expect(b.tablas.respuestas.every((x) => x.clave_kids !== null)).toBe(true);
      expect(fila(b).estado!.motor.rafaga?.seg ?? fila(b).estado!.motor.fase, vacio).toBe(vacio === 'VACIO' ? 40 : 70);
    }
  });

  it('duracionOgg: lee la última página (48 kHz) y no se confunde con lo que no es Ogg', () => {
    expect(duracionOgg(oggFalso(95, 'algo'))).toBe(95);
    expect(duracionOgg(Buffer.concat([oggFalso(3, ''), oggFalso(61.4, '')]))).toBe(61);
    expect(duracionOgg(Buffer.from('no es un audio'))).toBeNull();
    expect(duracionOgg(Buffer.from('OggS'))).toBeNull();
  });
});
