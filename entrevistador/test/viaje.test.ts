import { describe, it, expect } from 'vitest';
import { anguloDelDia, diaDeHoy, diasDelViaje, etapaDeFecha, fechaDelDia, guionDelViaje, SIN_ETAPA, type Viaje } from '../src/flujo/viaje.js';

const viaje: Viaje = {
  salida: '2026-09-20', vuelta: '2026-09-29',
  etapas: [
    { nombre: 'Lisboa', desde: '2026-09-20', hasta: '2026-09-23' },
    { nombre: 'Oporto', desde: '2026-09-24', hasta: '2026-09-26' },
    { nombre: 'Galicia' }, // sin fechas todavía
  ],
};

describe('Vitácora de viaje — lo puro', () => {
  it('cuenta los días con salida y vuelta inclusive', () => {
    expect(diasDelViaje(viaje)).toBe(10);
    expect(fechaDelDia(viaje, 1)).toBe('2026-09-20');
    expect(fechaDelDia(viaje, 10)).toBe('2026-09-29');
  });

  it('asigna la etapa por fecha; sin etapa que la contenga, queda "Por definir"', () => {
    expect(etapaDeFecha(viaje, '2026-09-21')).toBe('Lisboa');
    expect(etapaDeFecha(viaje, '2026-09-25')).toBe('Oporto');
    expect(etapaDeFecha(viaje, '2026-09-28')).toBe(SIN_ETAPA);
  });

  it('una etapa abierta (con desde, sin hasta) sigue hasta que empiece otra', () => {
    const v: Viaje = { ...viaje, etapas: [{ nombre: 'Lisboa', desde: '2026-09-20' }, { nombre: 'Oporto', desde: '2026-09-25' }] };
    expect(etapaDeFecha(v, '2026-09-23')).toBe('Lisboa');
    expect(etapaDeFecha(v, '2026-09-28')).toBe('Oporto');
  });

  it('el ángulo: llegada al empezar una etapa, despedida al terminarla, rotación en el medio', () => {
    expect(anguloDelDia(viaje, 1)).toBe('llegada');
    expect(anguloDelDia(viaje, 4)).toBe('despedida'); // 23/09, último de Lisboa
    expect(anguloDelDia(viaje, 5)).toBe('llegada');   // 24/09, primero de Oporto
    expect(anguloDelDia(viaje, 10)).toBe('despedida'); // la vuelta
    expect(['mejor', 'persona', 'comida', 'plan', 'lugar', 'vos']).toContain(anguloDelDia(viaje, 2));
    expect(anguloDelDia(viaje, 2)).not.toBe(anguloDelDia(viaje, 3));
  });

  it('los ángulos que eligió el viajero van primero', () => {
    const v: Viaje = { ...viaje, etapas: [], angulos: ['comida', 'persona'] };
    expect(anguloDelDia(v, 2)).toBe('comida');
    expect(anguloDelDia(v, 3)).toBe('persona');
  });

  it('el guion: una pregunta por día, con su capítulo', () => {
    const g = guionDelViaje(viaje);
    expect(g).toHaveLength(10);
    expect(g[0]).toMatchObject({ orden: 1, capitulo: 'Lisboa' });
    expect(g[0].texto).toContain('llegado');
    expect(g[5]).toMatchObject({ orden: 6, capitulo: 'Oporto' });
    expect(g[8].capitulo).toBe(SIN_ETAPA);
  });

  it('diaDeHoy respeta la zona horaria del viaje', () => {
    expect(diaDeHoy(viaje, new Date('2026-09-21T23:30:00Z'), 'Europe/Lisbon')).toBe(3); // 00:30 del 22 en Lisboa
    expect(diaDeHoy(viaje, new Date('2026-09-21T23:30:00Z'), 'America/Argentina/Buenos_Aires')).toBe(2);
    expect(diaDeHoy(viaje, new Date('2026-10-05T12:00:00Z'), 'Europe/Lisbon')).toBeNull();
  });
});
