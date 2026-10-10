import { describe, it, expect } from 'vitest';
import { aplicarTanda, cuentaDeHoy, hitosDe, puedeAbrirHoy, TOPE_POR_RITMO, yaEsLaHora } from '../../src/v3/tanda.js';
import { estadoInicial } from '../../src/v3/tipos.js';
import { ritmoDe } from '../../src/flujo/ritmo.js';
import { fechaLocal } from '../../src/flujo/tiempo.js';

const ZONA = 'America/Argentina/Buenos_Aires';
const HOY = '2026-10-08';

describe('la tanda del día', () => {
  it('el tope por ritmo es el del spec: 4, 8 y sin tope', () => {
    expect(TOPE_POR_RITMO).toEqual({ diario: 4, dos_por_dia: 8, seguido: Number.POSITIVE_INFINITY });
  });

  it('la cuenta de una tanda de otro día es cero', () => {
    expect(cuentaDeHoy({ tanda_dia: HOY, tanda_cuenta: 3 }, HOY)).toBe(3);
    expect(cuentaDeHoy({ tanda_dia: '2026-10-07', tanda_cuenta: 3 }, HOY)).toBe(0);
    expect(cuentaDeHoy({ tanda_dia: null, tanda_cuenta: 0 }, HOY)).toBe(0);
  });

  it('con 4 en el día y ritmo diario no abre otra; con dos_por_dia sí; seguido nunca frena', () => {
    const fila = { tanda_dia: HOY, tanda_cuenta: 4 };
    expect(puedeAbrirHoy(fila, 'diario', HOY)).toBe(false);
    expect(puedeAbrirHoy(fila, 'dos_por_dia', HOY)).toBe(true);
    expect(puedeAbrirHoy({ tanda_dia: HOY, tanda_cuenta: 500 }, 'seguido', HOY)).toBe(true);
  });

  it('al cambiar el día el tope se renueva', () => {
    expect(puedeAbrirHoy({ tanda_dia: '2026-10-07', tanda_cuenta: 4 }, 'diario', HOY)).toBe(true);
  });

  it('aplicarTanda cuenta la pregunta que se abrió y anota desde cuándo está abierta (para M8)', () => {
    const ahora = new Date('2026-10-08T13:00:00Z');
    const nueva = aplicarTanda({ tanda_dia: '2026-10-07', tanda_cuenta: 4 }, estadoInicial(), HOY, true, ahora);
    expect(nueva).toMatchObject({ tanda_dia: HOY, tanda_cuenta: 1 });
    expect(nueva.estado.abiertaDesde).toBe(ahora.toISOString());
    const sigue = aplicarTanda({ tanda_dia: HOY, tanda_cuenta: 2 }, estadoInicial(), HOY, true, ahora);
    expect(sigue).toMatchObject({ tanda_cuenta: 3 });
    expect(sigue.estado.abiertaDesde).toBe(ahora.toISOString());
    const tope = aplicarTanda({ tanda_dia: HOY, tanda_cuenta: 4 }, estadoInicial(), HOY, false, ahora);
    expect(tope.tanda_cuenta).toBe(4);
    expect(tope.estado.abiertaDesde).toBeUndefined();
  });

  it('si no abrió nada en un día nuevo, la cuenta arranca en cero (no arrastra la de ayer)', () => {
    const nueva = aplicarTanda({ tanda_dia: '2026-10-07', tanda_cuenta: 4 }, estadoInicial(), HOY, false, new Date('2026-10-08T13:00:00Z'));
    expect(nueva).toMatchObject({ tanda_dia: HOY, tanda_cuenta: 0 });
  });

  it('la hora preferida en su zona', () => {
    expect(yaEsLaHora('10:00:00', ZONA, new Date('2026-10-08T12:59:00Z'))).toBe(false); // 09:59
    expect(yaEsLaHora('10:00:00', ZONA, new Date('2026-10-08T13:00:00Z'))).toBe(true); // 10:00
    expect(yaEsLaHora('10:00:00', ZONA, new Date('2026-10-08T20:00:00Z'))).toBe(true); // 17:00
    expect(fechaLocal(new Date('2026-10-09T01:00:00Z'), ZONA)).toBe(HOY);
  });

  it('borde del día: pasada la medianoche UTC sigue siendo el mismo día local; a las 00:00 locales no es la hora', () => {
    expect(fechaLocal(new Date('2026-10-09T02:59:00Z'), ZONA)).toBe(HOY); // 23:59 local
    expect(fechaLocal(new Date('2026-10-09T03:00:00Z'), ZONA)).toBe('2026-10-09'); // 00:00 local
    expect(yaEsLaHora('10:00:00', ZONA, new Date('2026-10-09T03:00:00Z'))).toBe(false);
    expect(yaEsLaHora('00:00:00', ZONA, new Date('2026-10-09T03:00:00Z'))).toBe(true);
    // Madrid (UTC+2 en octubre) ya está en el día siguiente
    expect(fechaLocal(new Date('2026-10-08T22:30:00Z'), 'Europe/Madrid')).toBe('2026-10-09');
  });

  it('los hitos de la familia: la primera respuesta y la mitad', () => {
    expect(hitosDe(estadoInicial())).toEqual([]);
    expect(hitosDe({ ...estadoInicial(), respuestas: [['OR1', 'Algo.']] })).toEqual(['primera']);
    expect(hitosDe({ ...estadoInicial(), respuestas: [['OR1', 'Algo.']], bloqueActual: 8 })).toEqual(['primera', 'mitad']);
  });

  it('ritmoDe sigue siendo el de siempre (movido a flujo/ritmo.ts)', () => {
    expect(ritmoDe({ ritmo: 'dos_por_dia' })).toBe('dos_por_dia');
    expect(ritmoDe({ modoRapido: true })).toBe('seguido');
    expect(ritmoDe({})).toBe('diario');
  });
});
