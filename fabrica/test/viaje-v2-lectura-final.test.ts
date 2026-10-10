// "Lectura final de Fable" (banco.md, aprobado por Naza el 30/09): CA1 en
// pasado, {{quien_regala}} en PR-R y PR-R3, ATR-PR, y AL1 a la mañana siguiente.
import { describe, it, expect } from 'vitest';
import { armarCalendario, momentoAL1 } from '../src/viaje-v2/calendario.js';
import { preguntaProgramada, reaccion, mensajeAlbum, ROTACION_INICIAL } from '../src/viaje-v2/mensajes.js';
import { anotarEnvio, anotarRespuesta, nocheAnterior, nochesSinContestar, nuevoEstado } from '../src/viaje-v2/estado.js';
import { porId } from '../src/viaje-v2/banco.js';
import { renderizar, datosDeCompra } from '../src/viaje-v2/texto.js';
import { aLocal } from '../src/viaje-v2/horas.js';
import type { Compra } from '../src/viaje-v2/tipos.js';

const BA = 'America/Argentina/Buenos_Aires';
const COMPRA: Compra = {
  nombre: 'Lucía',
  salida: '2026-10-10',
  vuelta: '2026-10-17',
  zonaCasa: BA,
  zonaViaje: 'Europe/Madrid',
  regalo: { quienRegala: 'Tomás' },
  preguntasPropias: ['¿uno?', '¿dos?'],
  formato: 'impreso',
  fotosAlbum: 20,
};
const t = (id: string, extra: Record<string, string> = {}) => renderizar(porId(id).texto, { ...datosDeCompra(COMPRA), ...extra });
const cal = armarCalendario(COMPRA, []).programados;
const comun = cal.find((p) => p.tipo === 'noche')!;

describe('los textos nuevos', () => {
  it('CA1 en pasado; PR-R y PR-R3 nombran a quien regala', () => {
    expect(t('CA1')).toMatch(/^Volvé al primer rato en que entraste a casa/);
    expect(t('PR-R', { pregunta: '¿x?' })).toContain('Contale a Tomás, aunque me lo mandes a mí.');
    expect(t('PR-R3', { pregunta: '¿x?' })).toContain('Es para Tomás, así que hablale');
    expect(t('ATR-PR')).toBe('Ayer te dejé la pregunta de Tomás y no me contaste, no pasa nada. Si querés, metela hoy junto con lo de hoy.');
  });
});

describe('ATR-PR', () => {
  it('si la noche sin contestar fue una pregunta de quien regala, va ATR-PR en lugar de ATR1-3', () => {
    for (const id of ['PR-R', 'PR-R2', 'PR-R3']) {
      const r = preguntaProgramada(comun, COMPRA, 1, ROTACION_INICIAL, [id]);
      expect(r.mensaje.ids[0], id).toBe('ATR-PR');
      expect(r.mensaje.texto.startsWith(`${t('ATR-PR')}\n\n`)).toBe(true);
      expect(r.rot.ATR).toBeUndefined(); // no gasta la rueda de ATR1-3
    }
  });

  it('si fue una noche común (o una propia del viajero, PR-P), sigue ATR1-3', () => {
    expect(preguntaProgramada(comun, COMPRA, 1, ROTACION_INICIAL, ['C1', 'NO1', 'F1']).mensaje.ids[0]).toBe('ATR1');
    expect(preguntaProgramada(comun, COMPRA, 1, ROTACION_INICIAL, ['PR-P']).mensaje.ids[0]).toBe('ATR1');
    expect(preguntaProgramada(comun, COMPRA, 1, ROTACION_INICIAL).mensaje.ids[0]).toBe('ATR1');
  });

  it('con 2 o más noches seguidas, ATR-V (aunque la última fuera de quien regala), y nunca dos seguidas', () => {
    const a = preguntaProgramada(comun, COMPRA, 2, ROTACION_INICIAL, ['PR-R2']);
    expect(a.mensaje.ids[0]).toBe('ATR-V');
    expect(preguntaProgramada(comun, COMPRA, 3, a.rot, ['C1', 'NO1', 'F1']).mensaje.ids.some((id) => id.startsWith('ATR'))).toBe(false);
  });

  it('ATR-PR solo arriba de la noche común (no de FN1, propias ni las de antes)', () => {
    for (const tipo of ['FN1', 'propia']) {
      const p = cal.find((x) => x.tipo === tipo)!;
      expect(preguntaProgramada(p, COMPRA, 1, ROTACION_INICIAL, ['PR-R']).mensaje.ids.some((id) => id.startsWith('ATR')), tipo).toBe(false);
    }
  });

  it('nocheAnterior: la última noche del viaje mandada (para saber si fue de quien regala)', () => {
    let e = anotarEnvio(nuevoEstado(), { clave: 'D3-noche', tipo: 'propia', ids: ['PR-R'], en: 'x' });
    e = anotarEnvio(e, { clave: 'D4-mediodia', tipo: 'MD', ids: ['MD3'], en: 'x' });
    expect(nocheAnterior(e)!.ids).toEqual(['PR-R']);
    expect(nochesSinContestar(e)).toBe(1);
    e = anotarRespuesta(e, 'D3-noche', { tipo: 'audio', en: 'x' });
    expect(nochesSinContestar(e)).toBe(0);
  });
});

describe('AL1 a la mañana siguiente de CA1', () => {
  const ca1 = cal.find((p) => p.tipo === 'CA1')!;

  it('sale al día siguiente de CA1 a las 10:00, hora de casa', () => {
    expect(aLocal(momentoAL1(ca1, COMPRA), BA)).toEqual({ fecha: '2026-10-19', hora: '10:00' });
  });

  it('CA1 contestada lleva ACN, sin AL1 pegada; a la mañana, AL1', () => {
    const r = reaccion({ tipo: 'CA1' }, { tipo: 'audio' }, COMPRA, ROTACION_INICIAL);
    expect(r.mensajes.map((m) => m.ids)).toEqual([['ACN1']]);
    expect(r.albumManana).toBe('AL1');
    expect(mensajeAlbum(COMPRA, 'AL1')).toEqual({ ids: ['AL1'], texto: t('AL1') });
  });

  it('CA1 en texto: TXT (o ACN sin "Lo escuché" si ya no hay TXT), y AL1 a la mañana', () => {
    expect(reaccion({ tipo: 'CA1' }, { tipo: 'texto' }, COMPRA, ROTACION_INICIAL).mensajes.map((m) => m.ids)).toEqual([['TXT']]);
    const r = reaccion({ tipo: 'CA1' }, { tipo: 'texto' }, COMPRA, { ...ROTACION_INICIAL, txtUsados: 2, ACN: 'ACN2' });
    expect(r.mensajes[0].ids).toEqual(['ACN4']);
    expect(r.albumManana).toBe('AL1');
  });

  it('"paso" en CA1: PAS-V ("Mañana hay otra", que es cierto: AL1-P sale a la mañana) (A3 actualizada)', () => {
    const r = reaccion({ tipo: 'CA1' }, { tipo: 'paso' }, COMPRA, ROTACION_INICIAL);
    expect(r.mensajes).toEqual([{ ids: ['PAS-V'], texto: t('PAS-V') }]);
    expect(r.albumManana).toBe('AL1-P');
    expect(mensajeAlbum(COMPRA, 'AL1-P')).toEqual({ ids: ['AL1-P'], texto: t('AL1-P') });
  });

  it('"paso" en CA1 después de medianoche (AL1-P sale ese mismo día a las 10): PAS-V2, no "Mañana hay otra"', () => {
    const r = reaccion({ tipo: 'CA1', quedaOtra: true }, { tipo: 'paso' }, COMPRA, ROTACION_INICIAL);
    expect(r.mensajes.map((m) => m.ids)).toEqual([['PAS-V2']]);
    expect(r.albumManana).toBe('AL1-P');
  });

  it('las demás preguntas no abren el álbum', () => {
    expect(reaccion({ tipo: 'noche' }, { tipo: 'audio' }, COMPRA, ROTACION_INICIAL).albumManana).toBeNull();
  });
});
