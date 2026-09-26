import { describe, it, expect, beforeEach } from 'vitest';
import {
  armarIndice, esTituloPosible, FACTOR_ESCRITO, escritas, TITULO_VIAJE_HASTA_HOY,
  type RespuestaV3, type Indice, type OpcionesIndice,
} from '../src/v3/indice.js';
import { preguntaPorId } from '../src/v3/banco.js';
import type { FichaV3 } from '../src/v3/ficha.js';
import { invariantes } from './v3-invariantes.js';

const ANIO = 2026;

const FICHA: FichaV3 = {
  nombre: 'Rosa', anioNacimiento: 1950, genero: 'mujer', paisNacimiento: 'Argentina', paisResidencia: 'Argentina',
  padres: { madre: { nombre: 'Elsa', vive: false }, padre: { nombre: 'Juan', vive: false } },
  hermanos: ['Pedro'],
  parejas: [{ nombre: 'Ricardo', actual: false, fin: 'fallecio' }],
  hijos: [{ nombre: 'Pablo', anio: 1975 }, { nombre: 'Ana', anio: 1979 }],
  nietos: ['Juli'],
  oficios: [{ nombre: 'modista' }],
  migracion: 'no-tiene',
  actividades: [{ nombre: 'costura', marca: 'oficio' }, { nombre: 'fútbol', marca: 'pasion' }],
};

let n = 0;
beforeEach(() => {
  n = 0;
});
function r(preguntaId: string, palabras: number, extra: Partial<RespuestaV3> = {}): RespuestaV3 {
  const p = preguntaPorId(preguntaId);
  return { id: `R${++n}`, preguntaId, bloque: extra.bloque ?? p?.bloque ?? 0, palabras, texto: '', ...extra };
}

/**
 * Una vida con material de sobra en cada capítulo de Estándar (y de
 * Completo, salvo Lo que costó). Escritas = habladas × 0,7.
 * R1 OR1, R2 CA1, R3 ES1, R4 AD1, R5 JU1, R6 AM1, R7 HI1, R8 TR1, R9 LU1, R10 AS1, R11 HO1, R12 LE1.
 */
function vida(): RespuestaV3[] {
  n = 0;
  return [
    r('OR1', 900), r('CA1', 1000), r('ES1', 1000), r('AD1', 1400), r('JU1', 1400), r('AM1', 1400, { sujeto: 'pareja:1' }),
    r('HI1', 1100), r('TR1', 1400), r('LU1', 700), r('AS1', 700), r('HO1', 1000), r('LE1', 300),
  ];
}
const sin = (resp: RespuestaV3[], ...ids: string[]) => resp.filter((x) => !ids.includes(x.preguntaId));
const con = (resp: RespuestaV3[], preguntaId: string, palabras: number) => resp.map((x) => (x.preguntaId === preguntaId ? { ...x, palabras } : x));

const op = (tamanio: 'B' | 'E' | 'C' = 'E'): OpcionesIndice => ({ tamanio, anioActual: ANIO });
const capituloDe = (indice: Indice, id: string) => [...indice.capitulos, ...(indice.coda ? [indice.coda] : [])].find((c) => c.respuestaIds.includes(id));
const titulos = (indice: Indice) => indice.capitulos.map((c) => `${c.titulo}${c.parte ? ` / ${c.parte.nombre}` : ''}`);

describe('escritas', () => {
  it('el cociente real medido es 0,70', () => {
    expect(FACTOR_ESCRITO).toBe(0.7);
    expect(escritas(1000)).toBe(700);
  });
});

// ---------------------------------------------------------------- Estándar

describe('Estándar: agrupaciones fijas', () => {
  it('seis capítulos con título fijo, en orden, subtítulo null', () => {
    const indice = armarIndice(vida(), FICHA, op());
    expect(indice.capitulos.map((c) => c.clave)).toEqual(['E1', 'E2', 'E3', 'E4', 'E5', 'E6']);
    expect(titulos(indice)).toEqual([
      'De dónde vengo y los primeros años', 'Hacerse grande', 'Amor y la familia que armé', 'Trabajo y oficio', 'Mi gente y mis lugares', 'Hoy',
    ]);
    expect(indice.capitulos.every((c) => c.subtitulo === null)).toBe(true);
    expect(indice.coda).toBeNull();
    expect(indice.saltos).toEqual([]);
  });

  it('bloques 1-3 en E1, 4-5 en E2, 6 y 8 en E3, 7 en E4, 9-10 en E5, 14 en E6; legado al cierre', () => {
    const indice = armarIndice(vida(), FICHA, op());
    expect(indice.capitulos.map((c) => c.respuestaIds)).toEqual([
      ['R1', 'R2', 'R3'], ['R4', 'R5'], ['R6', 'R7'], ['R8'], ['R9', 'R10'], ['R11'],
    ]);
    expect(indice.cierre).toEqual(['R12']);
    expect(indice.capitulos[0]).toMatchObject({ palabrasHabladas: 2900, palabrasEscritasObjetivo: 2030 });
  });

  it('E2 bajo 700 escritas va a E1, que pasa a "Crecer" (un salto)', () => {
    const indice = armarIndice(con(con(vida(), 'AD1', 400), 'JU1', 400), FICHA, op());
    expect(indice.capitulos[0]).toMatchObject({ clave: 'E1', claves: ['E1', 'E2'], titulo: 'Crecer' });
    expect(indice.saltos).toEqual([{ respuestaId: 'R4', de: 'E2', a: 'E1' }, { respuestaId: 'R5', de: 'E2', a: 'E1' }]);
  });

  it('E4 bajo el piso va a E2: "Hacerse grande y el trabajo"', () => {
    const indice = armarIndice(con(vida(), 'TR1', 900), FICHA, op());
    expect(capituloDe(indice, 'R8')).toMatchObject({ clave: 'E2', titulo: 'Hacerse grande y el trabajo' });
    expect(indice.capitulos.some((c) => c.clave === 'E4')).toBe(false);
  });

  it('sin cadenas: si E2 ya se fue a E1, un E4 corto queda como capítulo corto (avisado)', () => {
    const indice = armarIndice(con(con(con(vida(), 'AD1', 400), 'JU1', 400), 'TR1', 900), FICHA, op());
    expect(capituloDe(indice, 'R8')).toMatchObject({ clave: 'E4', titulo: 'Trabajo y oficio', corto: true });
    expect(indice.avisos.some((a) => /Trabajo y oficio/.test(a) && /ya no está/.test(a))).toBe(true);
  });

  it('E5 bajo el piso va a Hoy, que pasa a "Mi gente, hoy" y ya no puede volverse coda', () => {
    const indice = armarIndice(con(con(con(vida(), 'LU1', 300), 'AS1', 300), 'HO1', 200), FICHA, op());
    expect(indice.capitulos.at(-1)).toMatchObject({ clave: 'E6', claves: ['E6', 'E5'], titulo: 'Mi gente, hoy' });
    expect(indice.coda).toBeNull();
  });

  it('Hoy bajo 600 escritas se vuelve la coda: sin número, título "Hoy"', () => {
    const indice = armarIndice(con(vida(), 'HO1', 500), FICHA, op());
    expect(indice.capitulos.map((c) => c.clave)).toEqual(['E1', 'E2', 'E3', 'E4', 'E5']);
    expect(indice.coda).toMatchObject({ clave: 'E6', titulo: 'Hoy', coda: true, respuestaIds: ['R11'] });
  });

  it('Hoy sin material: ni capítulo ni coda (aviso)', () => {
    const indice = armarIndice(sin(vida(), 'HO1'), FICHA, op());
    expect(indice.coda).toBeNull();
    expect(indice.capitulos.some((c) => c.clave === 'E6')).toBe(false);
    expect(indice.avisos.some((a) => /Hoy/.test(a))).toBe(true);
  });

  it('Estándar no se parte aunque un capítulo pase las 3.000 escritas', () => {
    const indice = armarIndice(con(vida(), 'AM1', 5000), FICHA, op());
    expect(indice.capitulos.filter((c) => c.clave === 'E3')).toHaveLength(1);
    expect(indice.capitulos.some((c) => c.parte)).toBe(false);
  });
});

describe('Estándar: Amor', () => {
  it('entre 250 y 500 escritas existe corto; nunca se junta con Mi gente', () => {
    const resp = con(con(con(con(vida(), 'AM1', 300), 'HI1', 200), 'LU1', 300), 'AS1', 300);
    const indice = armarIndice(resp, FICHA, op());
    expect(capituloDe(indice, 'R6')).toMatchObject({ clave: 'E3', claves: ['E3'], corto: true });
  });

  it('bajo 250 escritas sus respuestas van a Mi gente, que ya no se funde con Hoy', () => {
    const resp = con(con(con(con(vida(), 'AM1', 200), 'HI1', 100), 'LU1', 300), 'AS1', 300);
    const indice = armarIndice(resp, FICHA, op());
    expect(capituloDe(indice, 'R6')).toMatchObject({ clave: 'E5', claves: ['E5', 'E3'], titulo: 'Mi gente y mis lugares' });
    expect(capituloDe(indice, 'R11')!.clave).toBe('E6');
    expect(indice.avisos.some((a) => /Amor.*menos de 250/.test(a))).toBe(true);
  });

  it('gates: sin hijos → "Amor"; sin pareja con hijos → "La familia que armé"', () => {
    const sinHijos = armarIndice(sin(vida(), 'HI1'), { ...FICHA, hijos: 'no-tiene', nietos: 'no-tiene' }, op());
    expect(sinHijos.capitulos.find((c) => c.clave === 'E3')!.titulo).toBe('Amor');
    const sinPareja = armarIndice([...sin(vida(), 'AM1'), r('AM15', 400)], { ...FICHA, parejas: 'no-tiene' }, op());
    expect(sinPareja.capitulos.find((c) => c.clave === 'E3')!.titulo).toBe('La familia que armé');
  });

  it('sin pareja y sin hijos: E3 no existe y PI1 y AM15 van a Mi gente (sin salto: es un gate)', () => {
    const ficha: FichaV3 = { ...FICHA, parejas: 'no-tiene', hijos: 'no-tiene', nietos: 'no-tiene', personaImportante: { nombre: 'Tere' } };
    const resp = [...sin(vida(), 'AM1', 'HI1'), r('AM15', 400), r('PI1', 400)];
    const indice = armarIndice(resp, ficha, op());
    expect(indice.capitulos.some((c) => c.clave === 'E3')).toBe(false);
    expect(capituloDe(indice, 'R13')!.clave).toBe('E5');
    expect(capituloDe(indice, 'R14')!.clave).toBe('E5');
    expect(indice.saltos).toEqual([]);
  });

  it('la viudez (AM11) queda en Amor; con Amor bajo 250 va a Mi gente, no a Hoy', () => {
    const indice = armarIndice([...sin(vida(), 'AM1', 'HI1'), r('AM11', 150, { sujeto: 'pareja:1' })], FICHA, op());
    expect(capituloDe(indice, 'R13')!.clave).toBe('E5');
  });
});

describe('Estándar: receptores del bloque 11 por pregunta', () => {
  const ubicar = (preguntaId: string, texto: string, ficha: FichaV3 = FICHA) => {
    n = 0;
    const indice = armarIndice([...vida(), r(preguntaId, 150, { texto })], ficha, op());
    return { indice, capitulo: capituloDe(indice, 'R13')! };
  };

  it('PE1 y PE2 → el capítulo de origen, al final (cierre de su presencia)', () => {
    for (const id of ['PE1', 'PE2']) {
      const { capitulo } = ubicar(id, 'Fue un invierno.');
      expect(capitulo.clave).toBe('E1');
      expect(capitulo.respuestaIds.at(-1)).toBe('R13');
    }
  });

  it('PE3 → el capítulo donde se presentó a esa persona; si no está en la ficha, Mi gente', () => {
    expect(ubicar('PE3', 'Extraño a Pedro, mi hermano.').capitulo.clave).toBe('E1');
    expect(ubicar('PE3', 'Ricardo, siempre.').capitulo.clave).toBe('E3');
    expect(ubicar('PE3', 'Un amigo del club, el Negro.').capitulo.clave).toBe('E5');
  });

  it('PE4 e ID1: por edad o léxico; sin edad, Hoy', () => {
    expect(ubicar('PE4', 'La peor época fue cuando yo tenía 8 años.').capitulo.clave).toBe('E1');
    expect(ubicar('PE4', 'Cuando me casé todo se vino abajo.').capitulo.clave).toBe('E3');
    expect(ubicar('PE4', 'Fue muy largo todo.').capitulo.clave).toBe('E6');
    expect(ubicar('ID1', 'Nunca lo dije.').capitulo.clave).toBe('E6');
  });

  it('PE5 y EC1 → Hoy; PE6 y PE8 → Mi gente; CR1 → Trabajo', () => {
    expect(ubicar('PE5', 'Un accidente.').capitulo.clave).toBe('E6');
    expect(ubicar('EC1', 'La diabetes.', { ...FICHA, enfermedadLarga: { nombre: 'diabetes' } }).capitulo.clave).toBe('E6');
    expect(ubicar('PE6', 'Le fallé a una amiga.').capitulo.clave).toBe('E5');
    expect(ubicar('PE8', 'Me traicionó un socio.').capitulo.clave).toBe('E5');
    expect(ubicar('CR1', 'Perdimos el taller en el 89.').capitulo.clave).toBe('E4');
  });

  it('HF1-HF2 → Amor y la familia, al final; HJ7 → la persona nombrada o Trabajo', () => {
    const hf = ubicar('HF1', 'Pablo era así.', { ...FICHA, hijos: [{ nombre: 'Pablo', anio: 1975, fallecio: true }] }).capitulo;
    expect(hf.clave).toBe('E3');
    expect(hf.respuestaIds.at(-1)).toBe('R13');
    expect(ubicar('HJ7', 'Con Ana empezó bien.').capitulo.clave).toBe('E3');
    expect(ubicar('HJ7', 'El negocio del kiosco.').capitulo.clave).toBe('E4');
  });

  it('cada respuesta recibida conserva la etiqueta sensible', () => {
    const { capitulo, indice } = ubicar('CR1', 'Perdimos todo.');
    expect(capitulo.sensibles).toContain('R13');
    expect(indice.flotantes.find((f) => f.respuestaId === 'R13')).toMatchObject({ tema: 9, receptor: 6, motivo: 'receptor', sensible: true });
  });

  it('la crisis de antes de los 25 va a su etapa, marcada sensible', () => {
    const { capitulo, indice } = ubicar('PE8', 'En el secundario una amiga me traicionó.');
    expect(capitulo.clave).toBe('E2');
    expect(capitulo.sensibles).toContain('R13');
    expect(indice.flotantes.find((f) => f.respuestaId === 'R13')).toMatchObject({ tema: 3, motivo: 'lexico', sensible: true });
  });
});

describe('flotantes (bloques 12 y 13)', () => {
  const ubicar = (preguntaId: string, texto: string, ficha: FichaV3 = FICHA) => {
    n = 0;
    const indice = armarIndice([...vida(), r(preguntaId, 150, { texto })], ficha, op());
    return { capitulo: capituloDe(indice, 'R13')!, flotante: indice.flotantes.find((f) => f.respuestaId === 'R13')! };
  };

  it('edad dicha o año → su etapa', () => {
    expect(ubicar('HG1', 'Cuando lo del Mundial yo tenía 8 años.').flotante).toMatchObject({ tema: 2, motivo: 'edad-numero', edad: 8 });
    expect(ubicar('HG1', 'En 1966 estaba en el colegio.').flotante).toMatchObject({ tema: 3, edad: 16 });
    expect(ubicar('HG4', 'Estaba encerrado.', { ...FICHA, anioNacimiento: 1998 }).flotante).toMatchObject({ tema: 4, edad: 22 });
  });

  it('léxico y persona de la ficha', () => {
    expect(ubicar('GI7', 'De chica me reía con mi abuela.').capitulo.clave).toBe('E1');
    expect(ubicar('GI4', 'En la colimba me animé.').capitulo.clave).toBe('E2');
    expect(ubicar('GI1', 'Cuando nació Pablo fue el día.').capitulo.clave).toBe('E3');
    expect(ubicar('GI1', 'Con Ricardo en Mar del Plata.').flotante).toMatchObject({ tema: 5, motivo: 'persona' });
  });

  it('13-altos sin edad (GI1, HJ2, HJ1) van a Hoy por defecto', () => {
    for (const id of ['GI1', 'HJ2', 'HJ1']) expect(ubicar(id, 'Fue un domingo.').capitulo.clave, id).toBe('E6');
  });

  it('13-bajos y bloque 12 sin fecha: en Estándar no hay "Lo que costó", van a Hoy; HJ5 a Mi gente', () => {
    expect(ubicar('GI5', 'Me arrepiento de no haber estudiado.').capitulo.clave).toBe('E6');
    expect(ubicar('HG1', 'La hiperinflación fue terrible.').capitulo.clave).toBe('E6');
    expect(ubicar('HJ5', 'Volví al pueblo.').capitulo.clave).toBe('E5');
  });

  it('puertas y válvulas van al capítulo del bloque que cierran', () => {
    expect(ubicar('AD13', 'Algo más.').capitulo.clave).toBe('E2');
    expect(ubicar('MAS7', 'Del taller me acuerdo de todo.').capitulo.clave).toBe('E4');
  });

  it('una pasión que es oficio (PA1 de costura) va a Trabajo; una pasión, a Mi gente', () => {
    expect(ubicar('PA1', 'La costura fue mi vida.').capitulo.clave).toBe('E4');
    expect(ubicar('PA1', 'El fútbol los domingos.').capitulo.clave).toBe('E5');
  });
});

describe('El viaje (título por ficha, no por porcentaje)', () => {
  const gallego: FichaV3 = { ...FICHA, migracion: { de: 'Galicia', a: 'Buenos Aires', anio: 1969 } }; // a los 19
  it('migró con ≤ 30 y no es migrante joven: E2 "Hacerse grande y el viaje", aunque la migración sea poca', () => {
    const indice = armarIndice([...vida(), r('JU8', 50)], gallego, op());
    expect(indice.capitulos.find((c) => c.clave === 'E2')!.titulo).toBe('Hacerse grande y el viaje');
    expect(indice.migranteJoven).toBeNull();
  });
  it('migró con más de 30: "Hacerse grande"', () => {
    const tarde: FichaV3 = { ...FICHA, migracion: { de: 'Galicia', a: 'Buenos Aires', edad: 35 } };
    expect(armarIndice([...vida(), r('JU8', 50)], tarde, op()).capitulos.find((c) => c.clave === 'E2')!.titulo).toBe('Hacerse grande');
  });
  it('Completo: C4 se titula "El viaje"; con Trabajo bajo el piso, "El viaje y el trabajo"', () => {
    expect(armarIndice([...vida(), r('JU8', 50)], gallego, op('C')).capitulos.find((c) => c.clave === 'C4')!.titulo).toBe('El viaje');
    const indice = armarIndice(con([...vida(), r('JU8', 50)], 'TR1', 900), gallego, op('C'));
    expect(indice.capitulos.find((c) => c.clave === 'C4')!.titulo).toBe('El viaje y el trabajo');
  });
});

// ---------------------------------------------------------------- Breve

describe('Breve', () => {
  it('cuatro capítulos: Crecer, Salir al mundo y el trabajo, Los míos, Hoy', () => {
    const indice = armarIndice(vida(), FICHA, op('B'));
    expect(titulos(indice)).toEqual(['Crecer', 'Salir al mundo y el trabajo', 'Los míos', 'Hoy']);
    expect(indice.capitulos.find((c) => c.clave === 'B3')!.respuestaIds).toEqual(['R6', 'R7', 'R9', 'R10']);
  });

  it('B2 bajo 500 → B1 "Crecer y salir al mundo"; B3 bajo 500 → B4 "Los míos, hoy"', () => {
    const resp = sin(con(con(vida(), 'JU1', 300), 'TR1', 300), 'AM1', 'HI1', 'AS1');
    const indice = armarIndice(con(resp, 'LU1', 400), FICHA, op('B'));
    expect(titulos(indice)).toEqual(['Crecer y salir al mundo', 'Los míos, hoy']);
    expect(indice.coda).toBeNull();
  });

  it('Hoy bajo 400 → coda; el bloque 11 va por receptores', () => {
    const indice = armarIndice([...con(vida(), 'HO1', 300), r('PE4', 150, { texto: 'Fue largo.' }), r('PE1', 100)], FICHA, op('B'));
    expect(indice.coda).toMatchObject({ clave: 'B4', coda: true });
    expect(indice.coda!.respuestaIds).toEqual(['R13', 'R11']);
    expect(capituloDe(indice, 'R14')!.clave).toBe('B1');
  });
});

// ---------------------------------------------------------------- Completo

describe('Completo', () => {
  /** Vida para Completo: con Lo que costó lleno (R13 PE3, R14 CR1). */
  function vidaC(): RespuestaV3[] {
    return [...con(vida(), 'OR1', 1000), r('PE3', 700, { texto: 'Un amigo.' }), r('CR1', 700, { texto: 'El taller.' })];
  }

  it('diez capítulos con título fijo', () => {
    const indice = armarIndice(vidaC(), FICHA, op('C'));
    expect(indice.capitulos.map((c) => c.clave)).toEqual(['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10']);
    expect(titulos(indice)).toEqual([
      'De dónde vengo', 'Los primeros años', 'Adolescencia', 'Salir al mundo', 'Amor', 'Trabajo y oficio',
      'Hijos y nietos', 'Mi gente y mis lugares', 'Lo que costó', 'Hoy',
    ]);
  });

  it('receptores fijos: C1 → C2, C3 → C2 "Crecer", C4 → C3, C6 → C4, C7 → C5, C8 → C10', () => {
    expect(armarIndice(con(vidaC(), 'OR1', 500), FICHA, op('C')).capitulos[0]).toMatchObject({ clave: 'C2', titulo: 'De dónde vengo y los primeros años' });
    expect(armarIndice(con(vidaC(), 'AD1', 800), FICHA, op('C')).capitulos[1]).toMatchObject({ clave: 'C2', titulo: 'Crecer' });
    expect(armarIndice(con(con(vidaC(), 'OR1', 500), 'AD1', 800), FICHA, op('C')).capitulos[0]).toMatchObject({ clave: 'C2', claves: ['C2', 'C1', 'C3'], titulo: 'Crecer' });
    expect(capituloDe(armarIndice(con(vidaC(), 'JU1', 800), FICHA, op('C')), 'R5')).toMatchObject({ clave: 'C3', titulo: 'Adolescencia y salir al mundo' });
    expect(capituloDe(armarIndice(con(vidaC(), 'TR1', 800), FICHA, op('C')), 'R8')).toMatchObject({ clave: 'C4', titulo: 'Salir al mundo y el trabajo' });
    expect(capituloDe(armarIndice(con(vidaC(), 'HI1', 800), FICHA, op('C')), 'R7')).toMatchObject({ clave: 'C5', titulo: 'Amor y la familia que armé' });
    expect(capituloDe(armarIndice(con(con(vidaC(), 'LU1', 300), 'AS1', 300), FICHA, op('C')), 'R9')).toMatchObject({ clave: 'C10', titulo: 'Mi gente, hoy' });
  });

  it('Lo que costó existe si llega a 900 escritas; si no, se reparte por pregunta (un salto directo)', () => {
    expect(armarIndice(vidaC(), FICHA, op('C')).capitulos.find((c) => c.clave === 'C9')!.respuestaIds).toEqual(['R13', 'R14']);
    // CR1 va a Trabajo; si Trabajo ya se fue a Salir al mundo, va directo ahí.
    const resp = con(con(con(vidaC(), 'PE3', 300), 'CR1', 300), 'TR1', 800);
    const indice = armarIndice(resp, FICHA, op('C'));
    expect(indice.capitulos.some((c) => c.clave === 'C9')).toBe(false);
    expect(capituloDe(indice, 'R14')!.clave).toBe('C4');
    expect(capituloDe(indice, 'R13')!.clave).toBe('C8');
    expect(indice.saltos.filter((s) => s.respuestaId === 'R14')).toEqual([{ respuestaId: 'R14', de: 'C9', a: 'C4' }]);
  });

  it('en Completo, los 13-bajos sin edad van a Lo que costó cuando existe', () => {
    const indice = armarIndice([...vidaC(), r('GI5', 150, { texto: 'Me arrepiento.' })], FICHA, op('C'));
    expect(capituloDe(indice, 'R15')!.clave).toBe('C9');
  });

  it('Amor: piso 500, corto desde 250, bajo 250 a Mi gente; sin pareja no existe', () => {
    expect(capituloDe(armarIndice(con(vidaC(), 'AM1', 500), FICHA, op('C')), 'R6')).toMatchObject({ clave: 'C5', corto: true });
    expect(capituloDe(armarIndice(con(vidaC(), 'AM1', 300), FICHA, op('C')), 'R6')!.clave).toBe('C8');
    const sinPareja = armarIndice([...sin(vidaC(), 'AM1'), r('AM15', 800)], { ...FICHA, parejas: 'no-tiene' }, op('C'));
    expect(sinPareja.capitulos.some((c) => c.clave === 'C5')).toBe(false);
    expect(capituloDe(sinPareja, 'R15')!.clave).toBe('C8');
  });

  it('Hoy bajo 600 → coda', () => {
    expect(armarIndice(con(vidaC(), 'HO1', 500), FICHA, op('C')).coda).toMatchObject({ clave: 'C10', coda: true });
  });
});

describe('Completo: particiones (solo > 3.000 escritas, con las claves de la tabla)', () => {
  const dosParejas: FichaV3 = { ...FICHA, parejas: [{ nombre: 'Carmen', actual: false, fin: 'separacion' }, { nombre: 'Norma', actual: true, fin: null }] };

  it('Amor por pareja; en Estándar no se parte', () => {
    const resp = [...sin(vida(), 'AM1'), r('AM1', 2500, { sujeto: 'pareja:1' }), r('AM2', 300, { sujeto: 'pareja:1' }), r('AM1', 2200, { sujeto: 'pareja:2' }), r('AM14', 200)];
    const amor = armarIndice(resp, dosParejas, op('C')).capitulos.filter((c) => c.clave === 'C5');
    expect(amor.map((c) => c.parte?.nombre)).toEqual(['Carmen', 'Norma']);
    expect(amor.map((c) => c.titulo)).toEqual(['Amor', 'Amor']);
    expect(armarIndice(resp, dosParejas, op()).capitulos.filter((c) => c.clave === 'E3')).toHaveLength(1);
  });

  it('bajo 3.000 escritas no se parte', () => {
    const resp = [...sin(vida(), 'AM1'), r('AM1', 2000, { sujeto: 'pareja:1' }), r('AM1', 2000, { sujeto: 'pareja:2' })];
    expect(armarIndice(resp, dosParejas, op('C')).capitulos.filter((c) => c.clave === 'C5')).toHaveLength(1);
  });

  it('Los primeros años: La casa / La escuela; Hijos: Cuando eran chicos / Cuando crecieron, y los nietos', () => {
    const resp = [...sin(vida(), 'CA1', 'ES1', 'HI1'), r('CA1', 2500), r('ES1', 2400), r('HI1', 2500), r('HI8', 2400)];
    const indice = armarIndice(resp, FICHA, op('C'));
    expect(indice.capitulos.filter((c) => c.clave === 'C2').map((c) => c.parte?.nombre)).toEqual(['La casa', 'La escuela']);
    expect(indice.capitulos.filter((c) => c.clave === 'C7').map((c) => c.parte?.nombre)).toEqual(['Cuando eran chicos', 'Cuando crecieron, y los nietos']);
  });

  it('Trabajo por oficio; con campo, El campo / Después', () => {
    const ficha: FichaV3 = { ...FICHA, oficios: [{ nombre: 'panadero' }, { nombre: 'taxista' }] };
    const resp = [...sin(vida(), 'TR1'), r('TR2', 2500, { sujeto: 'oficio:1' }), r('TR3', 2500, { texto: 'Como taxista conocí a todos.' })];
    expect(armarIndice(resp, ficha, op('C')).capitulos.filter((c) => c.clave === 'C6').map((c) => c.parte?.nombre)).toEqual(['panadero', 'taxista']);
    const resp2 = [...sin(vida(), 'TR1'), r('CP1', 2500), r('TR6', 2500)];
    expect(armarIndice(resp2, { ...FICHA, campo: true }, op('C')).capitulos.filter((c) => c.clave === 'C6').map((c) => c.parte?.nombre)).toEqual(['El campo', 'Después']);
  });

  it('Mi gente y mis lugares: "Mi pasión: fútbol" si la pasión llega a 1.200 escritas', () => {
    const resp = [...sin(vida(), 'LU1', 'AS1'), r('PA1', 1200, { texto: 'El fútbol, la cancha.' }), r('LU3', 800, { texto: 'Al fútbol iba siempre.' }), r('AS1', 1500), r('LU1', 1300)];
    const partes = armarIndice(resp, FICHA, op('C')).capitulos.filter((c) => c.clave === 'C8');
    expect(partes.map((c) => c.parte?.nombre)).toContain('Mi pasión: fútbol');
  });
});

// ---------------------------------------------------------------- modo migrante joven

describe('modo migrante joven', () => {
  const JOVEN: FichaV3 = {
    nombre: 'Naza', anioNacimiento: 1998, genero: 'varon', paisNacimiento: 'Argentina', paisResidencia: 'España',
    padres: { madre: { nombre: 'Amelia', vive: true }, padre: { nombre: 'Juan', vive: true } },
    hermanos: ['Ariel'],
    parejas: [{ nombre: 'Vicky', actual: false, fin: 'separacion' }, { nombre: 'Ima', actual: true, fin: null }],
    hijos: 'no-tiene', nietos: 'no-tiene',
    migracion: { de: 'Buenos Aires', a: 'Berga', anio: 2021 }, // a los 23; hoy 28
    oficios: [{ nombre: 'músico' }, { nombre: 'jardinero', desde: 2023 }],
    estudios: { que: 'Arquitectura', terminado: false },
  };
  /** R1 CA1, R2 AD1, R3 JU2, R4 JU5, R5 JU8, R6 JU9, R7 AM1 Vicky, R8 AM1 Ima, R9 LU1, R10 HO1, R11 GI1. */
  function vidaJoven(): RespuestaV3[] {
    n = 0;
    return [
      r('CA1', 2000), r('AD1', 800), r('JU2', 500), r('JU5', 400), r('JU8', 500), r('JU9', 600),
      r('AM1', 400, { sujeto: 'pareja:1' }), r('AM1', 300, { sujeto: 'pareja:2' }), r('LU1', 1100, { texto: 'La casa de Martínez.' }),
      r('HO1', 400), r('GI1', 200, { texto: 'Un domingo.' }),
    ];
  }

  it('se activa si migró hace ≤ 10 años; "El viaje, hasta hoy" es el último capítulo y no hay Hoy ni coda', () => {
    const indice = armarIndice(vidaJoven(), JOVEN, op());
    expect(indice.migranteJoven).toMatchObject({ edadMigracion: 23, edadActual: 28 });
    expect(indice.capitulos.at(-1)).toMatchObject({ clave: 'VIAJE', titulo: TITULO_VIAJE_HASTA_HOY });
    expect(indice.capitulos.some((c) => c.clave === 'E6')).toBe(false);
    expect(indice.coda).toBeNull();
  });

  it('absorbe la migración del bloque 5, el bloque 14, los 13-altos y la pareja actual; la pareja anterior se queda en Amor', () => {
    const indice = armarIndice(vidaJoven(), JOVEN, op());
    for (const id of ['R5', 'R6', 'R8', 'R10', 'R11']) expect(capituloDe(indice, id)!.clave, id).toBe('VIAJE');
    expect(capituloDe(indice, 'R7')!.clave).toBe('E3');
  });

  it('estudios y lo militar se quedan en "Hacerse grande" (sin "y el viaje")', () => {
    const indice = armarIndice(vidaJoven(), JOVEN, op());
    expect(capituloDe(indice, 'R3')).toMatchObject({ clave: 'E2', titulo: 'Hacerse grande' });
    expect(capituloDe(indice, 'R4')!.clave).toBe('E2');
  });

  it('trabajo, lugares y amigos van al viaje solo con señal de "después"; sin señal quedan en su capítulo', () => {
    const resp = [
      ...vidaJoven(),
      r('TR1', 300, { texto: 'Mi primer trabajo fue acá en España.' }), // R12: nombra el país de destino
      r('TR2', 300, { texto: 'A los 25 cortaba pasto.' }), // R13: edad ≥ 23
      r('TR3', 300, { texto: 'A los 18 repartía volantes.' }), // R14: edad < 23 → antes
      r('TR6', 300, { texto: 'Un jefe que gritaba.' }), // R15: sin señal
      r('OF1', 300, { sujeto: 'oficio:2' }), // R16: oficio de la ficha desde 2023
      r('AS1', 300, { texto: 'Mis amigos de Berga.' }), // R17
      r('HE1', 300, { texto: 'El piso de Berga, sin una lamparita.' }), // R18: bloque 9 con señal
    ];
    const indice = armarIndice(resp, JOVEN, op());
    const clasif = (id: string) => indice.migranteJoven!.clasificacion.find((c) => c.respuestaId === id);
    expect(clasif('R12')).toMatchObject({ momento: 'despues', senal: 'nombra "España"', capitulo: 'VIAJE' });
    expect(clasif('R13')).toMatchObject({ momento: 'despues', capitulo: 'VIAJE' });
    expect(clasif('R13')!.senal).toMatch(/edad 25/);
    expect(clasif('R14')).toMatchObject({ momento: 'antes' });
    expect(clasif('R15')).toMatchObject({ momento: 'sin-senal' });
    expect(clasif('R16')).toMatchObject({ momento: 'despues' });
    expect(clasif('R16')!.senal).toMatch(/jardinero/);
    expect(clasif('R9')).toMatchObject({ momento: 'sin-senal' });
    for (const id of ['R12', 'R13', 'R16', 'R17', 'R18']) expect(capituloDe(indice, id)!.clave, id).toBe('VIAJE');
    for (const id of ['R14', 'R15']) expect(capituloDe(indice, id)!.clave, id).not.toBe('VIAJE');
    expect(capituloDe(indice, 'R9')!.clave).toBe('E5');
    invariantes(resp, indice);
  });

  it('Mi gente bajo el piso va al viaje (no hay Hoy)', () => {
    const indice = armarIndice(con(vidaJoven(), 'LU1', 300), JOVEN, op());
    expect(capituloDe(indice, 'R9')).toMatchObject({ clave: 'VIAJE', titulo: TITULO_VIAJE_HASTA_HOY });
  });

  it('migró hace más de 10 años: no hay modo joven', () => {
    const indice = armarIndice(vidaJoven(), { ...JOVEN, migracion: { de: 'Buenos Aires', a: 'Berga', anio: 2015 } }, op());
    expect(indice.migranteJoven).toBeNull();
    expect(indice.capitulos.find((c) => c.clave === 'E2')!.titulo).toBe('Hacerse grande y el viaje');
    expect(indice.capitulos.some((c) => c.clave === 'VIAJE')).toBe(false);
  });

  it('Completo: el viaje de más de 3.000 escritas se parte en "El viaje" / "Hoy, en Berga"', () => {
    const resp = con(con(vidaJoven(), 'JU9', 2500), 'HO1', 2500);
    const partes = armarIndice(resp, JOVEN, op('C')).capitulos.filter((c) => c.clave === 'VIAJE');
    expect(partes.map((c) => c.parte?.nombre)).toEqual(['El viaje', 'Hoy, en Berga']);
    expect(partes[0].respuestaIds).toEqual(expect.arrayContaining(['R5', 'R6']));
    expect(partes[1].respuestaIds).toEqual(expect.arrayContaining(['R10', 'R8']));
  });

  it('también en Breve: el viaje es el último capítulo y no hay coda', () => {
    const indice = armarIndice(vidaJoven(), JOVEN, op('B'));
    expect(indice.capitulos.at(-1)!.clave).toBe('VIAJE');
    expect(indice.coda).toBeNull();
  });
});

// ---------------------------------------------------------------- invariantes

describe('invariantes', () => {
  it('se cumplen con saltos, flotantes, receptores, pasos y legado mezclados, en los tres tamaños', () => {
    const resp = [
      ...con(con(vida(), 'AD1', 400), 'TR1', 600),
      r('AD2', 300), r('GI1', 400, { texto: 'yo tenía 30' }), r('HG4', 200), r('HO2', 80, { paso: true }), r('LE8', 500),
      r('PE4', 300, { texto: 'de chica' }), r('PE1', 200), r('CR1', 300), r('PE8', 200), r('MAS2', 250), r('XX9', 120, { bloque: 7 }),
    ];
    for (const t of ['B', 'E', 'C'] as const) {
      const indice = armarIndice(resp, FICHA, op(t));
      invariantes(resp, indice);
      expect(indice.avisos.some((a) => /XX9/.test(a))).toBe(true);
    }
  });

  it('esTituloPosible acepta los títulos de la tabla y las plantillas, y nada inventado', () => {
    expect(esTituloPosible('Mi gente, hoy')).toBe(true);
    expect(esTituloPosible(TITULO_VIAJE_HASTA_HOY)).toBe(true);
    expect(esTituloPosible('La familia y mi gente')).toBe(false);
  });
});
