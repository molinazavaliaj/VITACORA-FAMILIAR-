import { describe, it, expect } from 'vitest';
import { porId } from '../src/viaje-v2/banco.js';
import { renderizar, datosDeCompra } from '../src/viaje-v2/texto.js';
import { armarCalendario } from '../src/viaje-v2/calendario.js';
import {
  arranque,
  alDecirSi,
  preguntaProgramada,
  preguntaDeLaCadena,
  reaccion,
  elegirRotando,
  despedida,
  ROTACION_INICIAL,
  MAX_TXT,
  type Rotacion,
} from '../src/viaje-v2/mensajes.js';
import type { Compra } from '../src/viaje-v2/tipos.js';

const COMPRA: Compra = {
  nombre: 'Lucía',
  salida: '2026-10-10',
  vuelta: '2026-10-17',
  zonaCasa: 'America/Argentina/Buenos_Aires',
  zonaViaje: 'Europe/Madrid',
  regalo: { quienRegala: 'Tomás' },
  preguntasPropias: ['¿Qué te hizo acordar a casa?'],
  formato: 'impreso',
  fotosAlbum: 20,
};
const PARA_MI: Compra = { ...COMPRA, regalo: undefined };
const t = (id: string, extra: { pregunta?: string } = {}) => renderizar(porId(id).texto, { ...datosDeCompra(COMPRA), ...extra });
const CAL = armarCalendario(COMPRA, ['VA1']).programados;
const prog = (tipo: string) => CAL.find((p) => p.tipo === tipo)!;

describe('viaje v2: arranque', () => {
  it('BIEN-1R si es regalo, BIEN-1 si es para sí', () => {
    expect(arranque(COMPRA)).toEqual({ ids: ['BIEN-1R'], texto: t('BIEN-1R') });
    expect(arranque(PARA_MI).ids).toEqual(['BIEN-1']);
  });

  it('con el SÍ: BIEN-2 y enseguida AS1, en dos mensajes', () => {
    const ms = alDecirSi(COMPRA);
    expect(ms.map((m) => m.ids)).toEqual([['BIEN-2'], ['AS1']]);
    expect(ms[1].texto).toBe(t('AS1'));
  });
});

describe('viaje v2: rotación', () => {
  it('rota en orden y nunca repite el mismo dos veces seguidas', () => {
    let rot: Rotacion = ROTACION_INICIAL;
    const salieron: string[] = [];
    for (let i = 0; i < 9; i++) {
      const r = elegirRotando('ACN', rot);
      salieron.push(r.id);
      rot = r.rot;
    }
    expect(salieron).toEqual(['ACN1', 'ACN2', 'ACN3', 'ACN4', 'ACN1', 'ACN2', 'ACN3', 'ACN4', 'ACN1']);
  });

  it('con permitidos (UC1: solo ACM1 y ACM2) tampoco repite', () => {
    let rot: Rotacion = { ...ROTACION_INICIAL, ACM: 'ACM1' };
    const a = elegirRotando('ACM', rot, ['ACM1', 'ACM2']);
    expect(a.id).toBe('ACM2');
    rot = a.rot;
    expect(elegirRotando('ACM', rot, ['ACM1', 'ACM2']).id).toBe('ACM1');
    rot = { ...ROTACION_INICIAL, ACM: 'ACM2' };
    expect(elegirRotando('ACM', rot, ['ACM1', 'ACM2']).id).toBe('ACM1');
  });
});

describe('viaje v2: preguntas programadas', () => {
  it('la noche común: comienzo + " " + puerta + cierre', () => {
    const noche = CAL.find((p) => p.tipo === 'noche')!;
    const { mensaje } = preguntaProgramada(noche, COMPRA, 0, ROTACION_INICIAL);
    expect(mensaje.ids).toEqual(noche.ids);
    expect(mensaje.texto).toBe(`${t(noche.ids[0])} ${t(noche.ids[1])}${t(noche.ids[2])}`);
  });

  it('el ejemplo del banco: C1 + NO5 + F1', () => {
    const p = { ...CAL.find((x) => x.tipo === 'noche')!, ids: ['C1', 'NO5', 'F1'] };
    expect(preguntaProgramada(p, COMPRA, 0, ROTACION_INICIAL).mensaje.texto).toBe(
      'Contame cómo fue hoy, Lucía, como se lo contarías a alguien que te quiere y no estuvo. Arrancá por alguien que te cruzaste y no conocías, y de ahí seguí por donde quieras. Mandá las fotos que quieras que queden.',
    );
  });

  it('una de antes que faltó va con su variante "ya de viaje"', () => {
    const { mensaje } = preguntaProgramada(prog('antes-en-viaje'), COMPRA, 0, ROTACION_INICIAL);
    expect(mensaje).toEqual({ ids: ['VA1'], texto: renderizar(porId('VA1').yaDeViaje!, datosDeCompra(COMPRA)) });
  });

  it('pregunta propia: PR-R con la pregunta tal cual entre «»', () => {
    const { mensaje } = preguntaProgramada(prog('propia'), COMPRA, 0, ROTACION_INICIAL);
    expect(mensaje.texto).toBe(t('PR-R', { pregunta: '¿Qué te hizo acordar a casa?' }));
    expect(mensaje.texto).toContain('«¿Qué te hizo acordar a casa?»');
  });

  it('ATR arriba de la noche si la anterior quedó sin contestar; rotan ATR1-3', () => {
    const noche = CAL.find((p) => p.tipo === 'noche')!;
    const a = preguntaProgramada(noche, COMPRA, 1, ROTACION_INICIAL);
    expect(a.mensaje.ids[0]).toBe('ATR1');
    expect(a.mensaje.texto.startsWith(`${t('ATR1')}\n\n`)).toBe(true);
    const b = preguntaProgramada(noche, COMPRA, 1, a.rot);
    expect(b.mensaje.ids[0]).toBe('ATR2');
  });

  it('dos noches o más sin contestar: ATR-V; y no mueve la rotación de ATR1-3', () => {
    const noche = CAL.find((p) => p.tipo === 'noche')!;
    const a = preguntaProgramada(noche, COMPRA, 2, ROTACION_INICIAL);
    expect(a.mensaje.ids[0]).toBe('ATR-V');
    expect(preguntaProgramada(noche, COMPRA, 1, a.rot).mensaje.ids[0]).toBe('ATR1');
  });

  it('A2 (Fable): ATR solo arriba de la noche común; nunca de FN1, propias ni las de antes de salir', () => {
    for (const tipo of ['FN1', 'propia', 'antes-en-viaje']) {
      expect(preguntaProgramada(prog(tipo), COMPRA, 2, ROTACION_INICIAL).mensaje.ids.some((id) => id.startsWith('ATR')), tipo).toBe(false);
    }
  });

  it('nunca ATR arriba de CA1, ni de la mañana o el mediodía', () => {
    for (const tipo of ['CA1', 'UC1', 'ID1', 'MD', 'VU0', 'VU1']) {
      expect(preguntaProgramada(prog(tipo), COMPRA, 3, ROTACION_INICIAL).mensaje.ids.some((id) => id.startsWith('ATR')), tipo).toBe(false);
    }
  });
});

describe('viaje v2: reacciones (acuses y casos)', () => {
  const audio = { tipo: 'audio' as const };

  it('antes de salir: ACA como primera línea de la siguiente; la rotación arranca por ACA2 (A6)', () => {
    const r = reaccion({ tipo: 'cadena', siguiente: 'AS2' }, audio, COMPRA, ROTACION_INICIAL);
    expect(r.mensajes).toEqual([{ ids: ['ACA2', 'AS2'], texto: `${t('ACA2')}\n\n${t('AS2')}` }]);
  });

  it('A6: ACA1 (con el nombre) nunca arriba de AS2 ni de VA1, que ya lo nombran', () => {
    const rot = { ...ROTACION_INICIAL, ACA: 'ACA4' }; // lo que sigue en la rueda sería ACA1
    expect(reaccion({ tipo: 'cadena', siguiente: 'AS2' }, audio, COMPRA, rot).mensajes[0].ids[0]).toBe('ACA2');
    expect(reaccion({ tipo: 'cadena', siguiente: 'VA1' }, audio, COMPRA, rot).mensajes[0].ids[0]).toBe('ACA2');
    expect(reaccion({ tipo: 'cadena', siguiente: 'IM1' }, audio, COMPRA, rot).mensajes[0].ids[0]).toBe('ACA1');
  });

  it('la cadena entera de corrido: ACA2 arriba de AS2, ACA3 de IM1, ACA4 de VA1', () => {
    let rot: Rotacion = ROTACION_INICIAL;
    const ids: string[] = [];
    for (const siguiente of ['AS2', 'IM1', 'VA1'] as const) {
      const r = reaccion({ tipo: 'cadena', siguiente }, audio, COMPRA, rot);
      ids.push(r.mensajes[0].ids[0]);
      rot = r.rot;
    }
    expect(ids).toEqual(['ACA2', 'ACA3', 'ACA4']);
  });

  it('la última de antes (VA1) no tiene siguiente: acuse neutro solo (ACM1 o ACM2)', () => {
    const r = reaccion({ tipo: 'cadena', siguiente: null }, audio, COMPRA, ROTACION_INICIAL);
    expect(r.mensajes).toHaveLength(1);
    expect(['ACM1', 'ACM2']).toContain(r.mensajes[0].ids[0]);
  });

  it('"paso" antes de salir: PAS-A y la siguiente enseguida, sin acuse (A4)', () => {
    const r = reaccion({ tipo: 'cadena', siguiente: 'VA1' }, { tipo: 'paso' }, COMPRA, ROTACION_INICIAL);
    expect(r.mensajes).toEqual([{ ids: ['PAS-A', 'VA1'], texto: `${t('PAS-A')}\n\n${t('VA1')}` }]);
    expect(r.mensajes[0].ids.some((id) => id.startsWith('AC'))).toBe(false);
  });

  it('"paso" en VA1 (la última de antes): PAS-A2 solo', () => {
    const r = reaccion({ tipo: 'cadena', siguiente: null }, { tipo: 'paso' }, COMPRA, ROTACION_INICIAL);
    expect(r.mensajes).toEqual([{ ids: ['PAS-A2'], texto: t('PAS-A2') }]);
  });

  it('"paso" en el viaje: PAS-V solo, sin acuse', () => {
    for (const tipo of ['noche', 'MD', 'propia'] as const) {
      expect(reaccion({ tipo }, { tipo: 'paso' }, COMPRA, ROTACION_INICIAL).mensajes).toEqual([{ ids: ['PAS-V'], texto: t('PAS-V') }]);
    }
  });

  it('noche → ACN solo; mediodía y foto suelta → ACM solo', () => {
    expect(reaccion({ tipo: 'noche' }, audio, COMPRA, ROTACION_INICIAL).mensajes[0].ids).toEqual(['ACN1']);
    expect(reaccion({ tipo: 'MD' }, { tipo: 'foto' }, COMPRA, ROTACION_INICIAL).mensajes[0].ids).toEqual(['ACM1']);
    expect(reaccion({ tipo: 'foto-suelta' }, { tipo: 'foto' }, COMPRA, { ...ROTACION_INICIAL, ACM: 'ACM1' }).mensajes[0].ids).toEqual(['ACM2']);
  });

  it('UC1 (y VU0: ese día no hay noche) → solo ACM1 o ACM2, nunca "Hasta la noche"', () => {
    for (const tipo of ['UC1', 'VU0'] as const) {
      let rot: Rotacion = { ...ROTACION_INICIAL, ACM: 'ACM2' };
      for (let i = 0; i < 4; i++) {
        const r = reaccion({ tipo }, audio, COMPRA, rot);
        expect(['ACM1', 'ACM2']).toContain(r.mensajes[0].ids[0]);
        expect(r.mensajes[0].texto).not.toContain('Hasta la noche');
        rot = r.rot;
      }
    }
  });

  it('ID1 y VU1 → ACM (cualquiera); FN1, propia y la de antes en el viaje → ACN', () => {
    const rot = { ...ROTACION_INICIAL, ACM: 'ACM2' };
    expect(reaccion({ tipo: 'ID1' }, audio, COMPRA, rot).mensajes[0].ids).toEqual(['ACM3']);
    expect(reaccion({ tipo: 'VU1' }, audio, COMPRA, rot).mensajes[0].ids).toEqual(['ACM3']);
    for (const tipo of ['FN1', 'propia', 'antes-en-viaje'] as const) {
      expect(reaccion({ tipo }, audio, COMPRA, ROTACION_INICIAL).mensajes[0].ids).toEqual(['ACN1']);
    }
  });

  it('CA1 → AL1 solo, sin ACA: AL1 trae su "Gracias" adentro', () => {
    const r = reaccion({ tipo: 'CA1' }, audio, COMPRA, ROTACION_INICIAL);
    expect(r.mensajes).toEqual([{ ids: ['AL1'], texto: t('AL1') }]);
    expect(r.mensajes[0].texto).toMatch(/^Gracias, Lucía\. Y una última cosa: el álbum\./);
    expect(r.abreAlbum).toBe(true);
  });

  it('A3: "paso" en CA1 → directo AL1-P, sin PAS-V', () => {
    const r = reaccion({ tipo: 'CA1' }, { tipo: 'paso' }, COMPRA, ROTACION_INICIAL);
    expect(r.mensajes).toEqual([{ ids: ['AL1-P'], texto: t('AL1-P') }]);
    expect(r.abreAlbum).toBe(true);
  });

  it('CA1 en texto: TXT arriba de AL1-P (sin el segundo "gracias")', () => {
    const r = reaccion({ tipo: 'CA1' }, { tipo: 'texto' }, COMPRA, ROTACION_INICIAL);
    expect(r.mensajes).toEqual([{ ids: ['TXT', 'AL1-P'], texto: `${t('TXT')}\n\n${t('AL1-P')}` }]);
  });

  it('A5: si contestó en texto (y ya no va TXT), no se usan ACA2 ni ACN3 ("Lo escuché")', () => {
    const agotado: Rotacion = { ...ROTACION_INICIAL, txtUsados: 2, ACN: 'ACN2', ACA: 'ACA1' };
    const n = reaccion({ tipo: 'noche' }, { tipo: 'texto' }, COMPRA, agotado);
    expect(n.mensajes[0].ids).toEqual(['ACN4']);
    const a = reaccion({ tipo: 'cadena', siguiente: 'IM1' }, { tipo: 'texto' }, COMPRA, agotado);
    expect(a.mensajes[0].ids[0]).toBe('ACA3');
  });

  it('texto en vez de audio: TXT en lugar del acuse, como mucho 2 veces por viaje', () => {
    let rot: Rotacion = ROTACION_INICIAL;
    const ids: string[][] = [];
    for (let i = 0; i < 3; i++) {
      const r = reaccion({ tipo: 'noche' }, { tipo: 'texto' }, COMPRA, rot);
      ids.push(r.mensajes[0].ids);
      rot = r.rot;
    }
    expect(MAX_TXT).toBe(2);
    expect(ids).toEqual([['TXT'], ['TXT'], ['ACN1']]);
  });

  it('TXT antes de salir va arriba de la siguiente, y cuenta para el tope', () => {
    const r = reaccion({ tipo: 'cadena', siguiente: 'IM1' }, { tipo: 'texto' }, COMPRA, ROTACION_INICIAL);
    expect(r.mensajes[0].ids).toEqual(['TXT', 'IM1']);
    expect(r.rot.txtUsados).toBe(1);
  });

  it('un texto al mediodía no dispara TXT (el mediodía es foto o frase)', () => {
    expect(reaccion({ tipo: 'MD' }, { tipo: 'texto' }, COMPRA, ROTACION_INICIAL).mensajes[0].ids).toEqual(['ACM1']);
  });

  it('audio que llegó mal: COR solo; la pregunta sigue abierta; no gasta rotación', () => {
    const r = reaccion({ tipo: 'noche' }, { tipo: 'audio', audioMal: true }, COMPRA, ROTACION_INICIAL);
    expect(r.mensajes).toEqual([{ ids: ['COR'], texto: t('COR') }]);
    expect(r.contestada).toBe(false);
    expect(r.rot).toEqual(ROTACION_INICIAL);
  });

  it('la pregunta de la cadena para el REC1 y el reenvío', () => {
    expect(preguntaDeLaCadena('IM1', COMPRA)).toEqual({ ids: ['IM1'], texto: t('IM1') });
  });
});

describe('viaje v2: despedida', () => {
  it('DES solo si no mandó de más', () => {
    expect(despedida(COMPRA, 20)).toEqual({ ids: ['DES'], texto: t('DES') });
    expect(despedida(COMPRA, 0).ids).toEqual(['DES']);
  });

  it('DES+ adentro de DES, antes de "Fue lindo acompañarte", si mandó de más', () => {
    const m = despedida(COMPRA, 23);
    expect(m.ids).toEqual(['DES', 'DES+']);
    expect(m.texto).toContain(`${t('DES+')} Fue lindo acompañarte.`);
    expect(m.texto.startsWith('Ya está, Lucía: el viaje quedó contado')).toBe(true);
  });
});
