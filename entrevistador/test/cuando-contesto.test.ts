import { describe, it, expect } from 'vitest';
import { cuandoContesto, ultimaRespuestaAt, estadoNuevo } from '../src/manual/estado-v2.js';
import { armarPromptPregunta, partirPromptPregunta, type Objetivo } from '../src/ia/pregunta-v2.js';
import { GUION } from '../src/ia/guion-v2.js';
import { perfilVacio } from '../src/ia/perfil.js';

// E18 (piloto esqueleto v2, 25/09): el biógrafo dijo "ayer se notó…" y "ayer me diste…" cuando la
// respuesta había llegado minutos antes. Se pueden pedir varias preguntas por día: el prompt de la
// pregunta dice cuándo llegó la última respuesta (en la zona de la persona), y si no se sabe, que
// no marque el tiempo.
const MADRID = 'Europe/Madrid';

describe('cuandoContesto', () => {
  const ahora = new Date('2026-09-25T18:00:00Z'); // 20:00 en Madrid
  it('hace menos de una hora: "hace unos minutos"', () => {
    expect(cuandoContesto('2026-09-25T17:40:00Z', MADRID, ahora)).toBe('hace unos minutos');
  });
  it('el mismo día (en su zona), más de una hora antes: "hoy más temprano"', () => {
    expect(cuandoContesto('2026-09-25T08:00:00Z', MADRID, ahora)).toBe('hoy más temprano');
  });
  it('el día anterior en SU zona, aunque en UTC sea el mismo día: "ayer"', () => {
    // 23:30 del 24 en Madrid = 21:30Z del 24; y 00:30 del 25 en Madrid = 22:30Z del 24 → "hoy más temprano".
    expect(cuandoContesto('2026-09-24T21:30:00Z', MADRID, ahora)).toBe('ayer');
    expect(cuandoContesto('2026-09-24T22:30:00Z', MADRID, ahora)).toBe('hoy más temprano');
  });
  it('dos o más días: "hace N días"', () => {
    expect(cuandoContesto('2026-09-22T10:00:00Z', MADRID, ahora)).toBe('hace 3 días');
  });
  it('sin hora (o una hora rota): null', () => {
    expect(cuandoContesto(undefined, MADRID, ahora)).toBeNull();
    expect(cuandoContesto('no es una fecha', MADRID, ahora)).toBeNull();
  });
});

describe('ultimaRespuestaAt', () => {
  it('la más reciente por llegada, sin las que frenó el candado de audio cruzado', () => {
    const estado = { ...estadoNuevo({}, MADRID, 2026), bloqueadas: ['b'] };
    const filas = [
      { id: 'a', recibido_at: '2026-09-25T10:00:00Z' },
      { id: 'b', recibido_at: '2026-09-25T12:00:00Z' },
      { id: 'c', recibido_at: '2026-09-25T11:00:00Z' },
    ];
    expect(ultimaRespuestaAt(estado, filas)).toBe('2026-09-25T11:00:00Z');
    expect(ultimaRespuestaAt(estado, [])).toBeUndefined();
  });
});

describe('el prompt de la pregunta dice cuándo contestó (E18)', () => {
  const f = GUION.find((x) => x.id === 'la-escuela')!;
  const o: Objetivo = { tipo: 'nucleo', id: f.id, tramo: f.tramo, bloque: f.etapa, tema: f.tema, pormenores: f.pormenores, fila: f.id };
  const conv = [{ pregunta: '¿Cómo era la cuadra?', respuesta: 'Jugábamos a la pelota.' }];
  it('con hora: la dice, y la regla de no decir "ayer" va en la tarea', () => {
    const p = armarPromptPregunta(perfilVacio(), o, conv, [], [], 'hace unos minutos');
    expect(p).toContain('CUÁNDO CONTESTÓ: hace unos minutos.');
    expect(p).toContain('No digas "ayer" ni "el otro día" si no coincide con CUÁNDO CONTESTÓ; si no se sabe, no marques el tiempo.');
  });
  it('sin hora: "no se sabe" (y la regla dice que entonces no marque el tiempo)', () => {
    const p = armarPromptPregunta(perfilVacio(), o, conv, []);
    expect(p).toContain('CUÁNDO CONTESTÓ: no se sabe.');
  });
  it('la regla va en la parte fija (cacheada); la hora en la variable', () => {
    const p = partirPromptPregunta(perfilVacio(), o, conv, [], [], 'ayer');
    expect(p.fijo).toContain('No digas "ayer"');
    expect(p.variable).toContain('CUÁNDO CONTESTÓ: ayer.');
    expect(p.fijo).not.toContain('CUÁNDO CONTESTÓ: ayer');
  });
});
