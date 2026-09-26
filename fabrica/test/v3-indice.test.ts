import { describe, it, expect, beforeEach } from 'vitest';
import { armarIndice, TITULOS, type RespuestaV3, type Indice } from '../src/v3/indice.js';
import { preguntaPorId } from '../src/v3/banco.js';
import type { FichaV3 } from '../src/v3/ficha.js';

const ANIO = 2026;

const FICHA: FichaV3 = {
  nombre: 'Rosa', anioNacimiento: 1950, genero: 'mujer', paisNacimiento: 'Argentina', paisResidencia: 'Argentina',
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

/** Una vida con material de sobra en cada capítulo madre (ninguno se fusiona ni se parte). */
function vidaCompleta(): RespuestaV3[] {
  return [
    r('OR1', 900), r('CA1', 1000), r('ES1', 1000), r('AD1', 1600), r('JU1', 1600), r('AM1', 1600, { sujeto: 'pareja:1' }),
    r('TR1', 1600), r('HI1', 1600), r('LU1', 800), r('AS1', 800), r('PE3', 1600), r('HO1', 1600), r('LE1', 300),
  ];
}

const op = { tamanio: 'E' as const, anioActual: ANIO };
const capituloDe = (indice: Indice, id: string) => indice.capitulos.find((c) => c.respuestaIds.includes(id));

describe('armarIndice: anclas', () => {
  it('diez capítulos madre en orden, con títulos fijos y subtítulo null', () => {
    const indice = armarIndice(vidaCompleta(), FICHA, op);
    expect(indice.capitulos.map((c) => c.madre)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(indice.capitulos.map((c) => c.titulo)).toEqual([
      'De dónde vengo', 'Los primeros años', 'Adolescencia', 'Salir al mundo', 'Amor',
      'Trabajo y oficio', 'Hijos y nietos', 'Mi gente y mis lugares', 'Lo que costó', 'Hoy',
    ]);
    expect(indice.capitulos.every((c) => c.subtitulo === null)).toBe(true);
    expect(TITULOS[4]).toBe('Salir al mundo');
  });

  it('bloques 2 y 3 van juntos a Los primeros años; 9 y 10 a Mi gente y mis lugares', () => {
    const indice = armarIndice(vidaCompleta(), FICHA, op);
    const primeros = indice.capitulos.find((c) => c.madre === 2)!;
    expect(primeros.respuestaIds).toEqual(['R2', 'R3']);
    expect(primeros.palabrasHabladas).toBe(2000);
    expect(primeros.palabrasEscritasObjetivo).toBe(1200);
    expect(indice.capitulos.find((c) => c.madre === 8)!.respuestaIds).toEqual(['R9', 'R10']);
  });

  it('legado va al cierre, no al índice; paso no va a ningún lado', () => {
    const indice = armarIndice([...vidaCompleta(), r('LE2', 200), r('HO2', 50, { paso: true })], FICHA, op);
    expect(indice.cierre).toEqual(['R13', 'R14']);
    expect(indice.capitulos.some((c) => c.respuestaIds.includes('R13'))).toBe(false);
    expect(indice.capitulos.some((c) => c.respuestaIds.includes('R15'))).toBe(false);
  });

  it('PI1, AM15 → Amor; HF1 y NC1 → Hijos y nietos', () => {
    const indice = armarIndice([...vidaCompleta(), r('PI1', 100), r('HF1', 100, { sujeto: 'hijo:2' }), r('NC1', 100)], FICHA, op);
    expect(capituloDe(indice, 'R14')!.madre).toBe(5);
    expect(capituloDe(indice, 'R15')!.madre).toBe(7);
    expect(capituloDe(indice, 'R16')!.madre).toBe(7);
  });

  it('sin hijos, el bloque 8 (HI10) va a Mi gente y mis lugares', () => {
    const indice = armarIndice([...vidaCompleta(), r('HI10', 300)], { ...FICHA, hijos: 'no-tiene' }, op);
    expect(capituloDe(indice, 'R14')!.madre).toBe(8);
  });

  it('las sensibles quedan marcadas en su capítulo', () => {
    const indice = armarIndice(vidaCompleta(), FICHA, op);
    expect(indice.capitulos.find((c) => c.madre === 9)!.sensibles).toEqual(['R11']);
  });
});

describe('armarIndice: flotantes', () => {
  const ubicar = (preguntaId: string, texto: string, ficha: FichaV3 = FICHA) => {
    n = 0;
    const indice = armarIndice([...vidaCompleta(), r(preguntaId, 150, { texto })], ficha, op);
    return { indice, capitulo: capituloDe(indice, 'R14')!, flotante: indice.flotantes.find((f) => f.respuestaId === 'R14')! };
  };

  it('edad dicha → capítulo de su etapa', () => {
    const { capitulo, flotante } = ubicar('HG1', 'Cuando lo del Mundial yo tenía 8 años.');
    expect(capitulo.madre).toBe(2);
    expect(flotante).toMatchObject({ madre: 2, motivo: 'edad-numero', edad: 8 });
  });

  it('año de cuatro cifras → edad → etapa', () => {
    expect(ubicar('HG1', 'En 1966 estaba en el colegio.').flotante).toMatchObject({ madre: 3, edad: 16 });
  });

  it('edad de otro no cuenta: GI1 cae por defecto a Hoy', () => {
    expect(ubicar('GI1', 'Fue a los 17 de mi hija.').flotante).toMatchObject({ madre: 10, motivo: 'defecto' });
  });

  it('léxico: "de chica" → 2, "en la colimba" → 4, "cuando nació Pablo" → 7', () => {
    expect(ubicar('GI7', 'De chica me reía con mi abuela.').flotante).toMatchObject({ madre: 2, motivo: 'lexico' });
    expect(ubicar('GI4', 'En la colimba me animé.').flotante).toMatchObject({ madre: 4, motivo: 'lexico' });
    expect(ubicar('GI1', 'Cuando nació Pablo fue el día.').flotante).toMatchObject({ madre: 7, motivo: 'lexico' });
  });

  it('persona de la ficha sin edad → su capítulo; edad de adulto con persona también', () => {
    expect(ubicar('GI1', 'Con Ricardo en Mar del Plata.').flotante).toMatchObject({ madre: 5, motivo: 'persona' });
    expect(ubicar('HG1', 'En 1989 con Ricardo perdimos todo.').flotante).toMatchObject({ madre: 5, motivo: 'persona', edad: 39 });
  });

  it('por defecto: 13-bajos y 12 sin fecha → Lo que costó; 13-altos → Hoy', () => {
    expect(ubicar('GI5', 'Me arrepiento de no haber estudiado.').flotante).toMatchObject({ madre: 9, motivo: 'defecto' });
    expect(ubicar('HG1', 'La hiperinflación fue terrible.').flotante).toMatchObject({ madre: 9, motivo: 'defecto' });
    expect(ubicar('GI1', 'El día más feliz fue un domingo.').flotante).toMatchObject({ madre: 10, motivo: 'defecto' });
  });

  it('la pandemia (HG4) sin fecha se ubica por el año 2020', () => {
    expect(ubicar('HG4', 'Estaba encerrado.', { ...FICHA, anioNacimiento: 1998 }).flotante).toMatchObject({ madre: 4, edad: 22 });
  });

  it('puertas y válvulas van al capítulo del bloque que cierran', () => {
    const { capitulo, flotante } = ubicar('AD13', 'Algo más: a los 30 volví al barrio.');
    expect(capitulo.madre).toBe(3);
    expect(flotante).toMatchObject({ madre: 3, motivo: 'defecto' });
    expect(ubicar('MAS7', 'Del taller me acuerdo de todo.').capitulo.madre).toBe(6);
  });
});

describe('armarIndice: crisis de chico y oficio o pasión (Naza)', () => {
  it('una crisis a los 8 años cae en Los primeros años, marcada sensible', () => {
    const indice = armarIndice([...vidaCompleta(), r('PE4', 300, { texto: 'La peor época fue cuando yo tenía 8 años y mi papá cayó preso.' })], FICHA, op);
    const cap = capituloDe(indice, 'R14')!;
    expect(cap.madre).toBe(2);
    expect(cap.sensibles).toContain('R14');
    expect(indice.flotantes.find((f) => f.respuestaId === 'R14')).toMatchObject({ madre: 2, sensible: true, motivo: 'edad-numero' });
  });

  it('una crisis de adolescente por léxico va a Adolescencia; una de adulto o sin edad, a Lo que costó', () => {
    const indice = armarIndice([
      ...vidaCompleta(),
      r('PE8', 200, { texto: 'En el secundario una amiga me traicionó.' }),
      r('CR1', 200, { texto: 'A los 45 perdí el taller.' }),
      r('PE5', 200, { texto: 'Un accidente.' }),
    ], FICHA, op);
    expect(capituloDe(indice, 'R14')!.madre).toBe(3);
    expect(capituloDe(indice, 'R15')!.madre).toBe(9);
    expect(capituloDe(indice, 'R16')!.madre).toBe(9);
  });

  it('una pasión que es oficio (PA1 de costura) va a Trabajo; una pasión, a Mi gente y mis lugares', () => {
    const indice = armarIndice([
      ...vidaCompleta(),
      r('PA1', 300, { texto: 'La costura fue mi vida, cosía para todo el barrio.' }),
      r('PA1', 300, { texto: 'El fútbol los domingos en la cancha.' }),
      r('PA2', 200, { texto: 'Hoy sigo cosiendo; la costura me calma.' }),
    ], FICHA, op);
    expect(capituloDe(indice, 'R14')!.madre).toBe(6);
    expect(capituloDe(indice, 'R15')!.madre).toBe(8);
    expect(capituloDe(indice, 'R16')!.madre).toBe(6);
    expect(indice.flotantes.find((f) => f.respuestaId === 'R14')).toMatchObject({ madre: 6, motivo: 'oficio' });
  });

  it('coincide con un oficio de la ficha aunque la actividad no esté marcada', () => {
    const indice = armarIndice([...vidaCompleta(), r('PA1', 300, { texto: 'Ser modista me apasionaba.' })], { ...FICHA, actividades: [] }, op);
    expect(capituloDe(indice, 'R14')!.madre).toBe(6);
  });
});

describe('armarIndice: fusión por mínimo', () => {
  it('Adolescencia con menos de 1.500 se fusiona con Los primeros años: "Crecer"', () => {
    const resp = vidaCompleta();
    resp[3].palabras = 1000;
    const indice = armarIndice(resp, FICHA, op);
    const crecer = indice.capitulos.find((c) => c.madres.includes(3))!;
    expect(crecer).toMatchObject({ madre: 2, madres: [2, 3], titulo: 'Crecer', palabrasHabladas: 3000 });
    expect(indice.avisos.some((a) => /Adolescencia/.test(a))).toBe(true);
  });

  it('De dónde vengo existe con 800; con menos se fusiona con título de tabla', () => {
    const resp = vidaCompleta();
    resp[0].palabras = 800;
    expect(armarIndice(resp, FICHA, op).capitulos[0].titulo).toBe('De dónde vengo');
    resp[0].palabras = 700;
    const indice = armarIndice(resp, FICHA, op);
    expect(indice.capitulos[0]).toMatchObject({ madres: [1, 2], titulo: 'De dónde vengo y los primeros años' });
  });

  it('Hoy siempre existe', () => {
    const resp = vidaCompleta();
    resp[11].palabras = 200;
    expect(armarIndice(resp, FICHA, op).capitulos.at(-1)).toMatchObject({ madre: 10, titulo: 'Hoy', palabrasHabladas: 200 });
  });

  it('fusión en cadena: Hijos (500) → Amor (800) → Mi gente: "La familia y mi gente"', () => {
    const resp = vidaCompleta();
    resp[5].palabras = 800; // AM1
    resp[7].palabras = 500; // HI1
    resp[8].palabras = 1000; // LU1
    const indice = armarIndice(resp, FICHA, op);
    const cap = indice.capitulos.find((c) => c.madres.includes(7))!;
    expect(cap).toMatchObject({ madre: 8, madres: [5, 7, 8], titulo: 'La familia y mi gente', palabrasHabladas: 3100 });
  });

  it('el ancla (Los primeros años) corta absorbe a la etapa siguiente', () => {
    const resp = vidaCompleta().filter((x) => x.preguntaId !== 'ES1');
    resp[0].palabras = 300; // OR1
    resp[1].palabras = 500; // CA1
    const indice = armarIndice(resp, FICHA, op);
    expect(indice.capitulos[0]).toMatchObject({ madre: 2, madres: [1, 2, 3], titulo: 'Crecer', palabrasHabladas: 2400 });
  });

  it('el mínimo se puede bajar para calibrar (opción minimo)', () => {
    const resp = vidaCompleta();
    resp[3].palabras = 1000;
    expect(armarIndice(resp, FICHA, { ...op, minimo: 900 }).capitulos.find((c) => c.madre === 3)!.madres).toEqual([3]);
  });

  it('un capítulo madre sin material no existe (no se fusiona: no está)', () => {
    const indice = armarIndice(vidaCompleta().filter((x) => x.preguntaId !== 'HI1'), FICHA, op);
    expect(indice.capitulos.some((c) => c.madres.includes(7))).toBe(false);
  });
});

describe('armarIndice: partición por clave fija', () => {
  it('Amor con dos parejas y más de 5.000 se parte por pareja', () => {
    const ficha: FichaV3 = { ...FICHA, parejas: [{ nombre: 'Carmen', actual: false, fin: 'separacion' }, { nombre: 'Norma', actual: true, fin: null }] };
    const resp = [...vidaCompleta().filter((x) => x.preguntaId !== 'AM1'),
      r('AM1', 3000, { sujeto: 'pareja:1' }), r('AM2', 500, { sujeto: 'pareja:1' }), r('AM1', 2500, { sujeto: 'pareja:2' }), r('AM14', 200)];
    const indice = armarIndice(resp, ficha, op);
    const amor = indice.capitulos.filter((c) => c.madre === 5);
    expect(amor.map((c) => c.parte?.nombre)).toEqual(['Carmen', 'Norma']);
    expect(amor.map((c) => c.titulo)).toEqual(['Amor', 'Amor']);
    expect(amor[1].respuestaIds).toContain('R17'); // AM14 sin sujeto va a la última parte
  });

  it('Amor con una sola pareja no se parte aunque desborde (aviso)', () => {
    const resp = [...vidaCompleta().filter((x) => x.preguntaId !== 'AM1'), r('AM1', 6000, { sujeto: 'pareja:1' })];
    const indice = armarIndice(resp, FICHA, op);
    expect(indice.capitulos.filter((c) => c.madre === 5)).toHaveLength(1);
    expect(indice.avisos.some((a) => /Amor/.test(a) && /no se parte/.test(a))).toBe(true);
  });

  it('Hijos y nietos: cuando eran chicos / cuando crecieron y los nietos', () => {
    const resp = [...vidaCompleta().filter((x) => x.preguntaId !== 'HI1'), r('HI1', 3000), r('HI8', 2500)];
    const partes = armarIndice(resp, FICHA, op).capitulos.filter((c) => c.madre === 7);
    expect(partes.map((c) => c.parte?.clave)).toEqual(['chicos', 'grandes']);
  });

  it('Los primeros años: la casa / la escuela', () => {
    const resp = [...vidaCompleta().filter((x) => !['CA1', 'ES1'].includes(x.preguntaId)), r('CA1', 3000), r('ES1', 2600)];
    const partes = armarIndice(resp, FICHA, op).capitulos.filter((c) => c.madre === 2);
    expect(partes.map((c) => c.parte?.clave)).toEqual(['casa', 'escuela']);
  });

  it('Salir al mundo por gate: estudios / el viaje', () => {
    const ficha: FichaV3 = { ...FICHA, migracion: { de: 'Rosario', a: 'Madrid', edad: 40 } };
    const resp = [...vidaCompleta().filter((x) => x.preguntaId !== 'JU1'), r('JU1', 400), r('JU2', 2800), r('JU8', 1500), r('JU9', 1500)];
    const partes = armarIndice(resp, ficha, op).capitulos.filter((c) => c.madre === 4);
    expect(partes.map((c) => c.parte?.clave)).toEqual(['estudios', 'migracion']);
    expect(partes[0].respuestaIds).toContain('R14'); // JU1 (general) va con la primera parte
  });

  it('Trabajo por oficio (sujeto o nombre en el texto); la segunda partición solo en Completo', () => {
    const ficha: FichaV3 = { ...FICHA, oficios: [{ nombre: 'panadero' }, { nombre: 'taxista' }, { nombre: 'kiosquero' }] };
    const resp = [...vidaCompleta().filter((x) => x.preguntaId !== 'TR1'),
      r('TR2', 3500, { sujeto: 'oficio:1' }), r('TR3', 3500, { texto: 'Como taxista conocí a todos.' }), r('TR6', 3500, { texto: 'De kiosquero comí siempre.' })];
    const completo = armarIndice(resp, ficha, { ...op, tamanio: 'C' }).capitulos.filter((c) => c.madre === 6);
    expect(completo.map((c) => c.parte?.nombre)).toEqual(['panadero', 'taxista', 'kiosquero']);
    const estandar = armarIndice(resp, ficha, op).capitulos.filter((c) => c.madre === 6);
    expect(estandar).toHaveLength(2);
  });

  it('Mi gente y mis lugares: "Mi pasión: fútbol" si la pasión suma 2.000', () => {
    const resp = [...vidaCompleta().filter((x) => !['LU1', 'AS1'].includes(x.preguntaId)),
      r('PA1', 1200, { texto: 'El fútbol, la cancha de Central.' }), r('LU3', 900, { texto: 'Al fútbol iba siempre.' }), r('AS1', 2000), r('LU1', 1500)];
    const partes = armarIndice(resp, FICHA, op).capitulos.filter((c) => c.madre === 8);
    expect(partes.map((c) => c.parte?.nombre)).toContain('Mi pasión: fútbol');
  });

  it('las partes nunca quedan bajo el mínimo: una parte chica se junta con su vecina', () => {
    const ficha: FichaV3 = { ...FICHA, parejas: [{ nombre: 'Carmen', actual: false, fin: 'separacion' }, { nombre: 'Norma', actual: true, fin: null }] };
    const resp = [...vidaCompleta().filter((x) => x.preguntaId !== 'AM1'), r('AM1', 5000, { sujeto: 'pareja:1' }), r('AM1', 600, { sujeto: 'pareja:2' })];
    expect(armarIndice(resp, ficha, op).capitulos.filter((c) => c.madre === 5)).toHaveLength(1);
  });
});

describe('armarIndice: El viaje', () => {
  it('Salir al mundo se titula "El viaje" si migró con ≤ 30 y la migración es ≥ 60 % del capítulo', () => {
    const ficha: FichaV3 = { ...FICHA, migracion: { de: 'Galicia', a: 'Buenos Aires', anio: 1969 } };
    const resp = [...vidaCompleta().filter((x) => x.preguntaId !== 'JU1'), r('JU1', 500), r('JU8', 600), r('JU9', 600)];
    expect(armarIndice(resp, ficha, op).capitulos.find((c) => c.madre === 4)!.titulo).toBe('El viaje');
    const tarde: FichaV3 = { ...FICHA, migracion: { de: 'Galicia', a: 'Buenos Aires', edad: 35 } };
    expect(armarIndice(resp, tarde, op).capitulos.find((c) => c.madre === 4)!.titulo).toBe('Salir al mundo');
    const poco = [...vidaCompleta().filter((x) => x.preguntaId !== 'JU1'), r('JU1', 1000), r('JU8', 600)];
    expect(armarIndice(poco, ficha, op).capitulos.find((c) => c.madre === 4)!.titulo).toBe('Salir al mundo');
  });

  it('bisagra: la migración entre dos parejas forma "El viaje" entre las dos partes de Amor', () => {
    const ficha: FichaV3 = {
      ...FICHA,
      parejas: [
        { nombre: 'Carmen', actual: false, fin: 'separacion', anioInicio: 1975, anioFin: 1990 },
        { nombre: 'Norma', actual: true, fin: null, anioInicio: 1996 },
      ],
      migracion: { de: 'Rosario', a: 'Madrid', anio: 1994 },
    };
    const resp = [...vidaCompleta().filter((x) => x.preguntaId !== 'AM1'),
      r('AM1', 2000, { sujeto: 'pareja:1' }), r('AM1', 2000, { sujeto: 'pareja:2' }), r('JU8', 900), r('JU9', 900)];
    const indice = armarIndice(resp, ficha, op);
    const titulos = indice.capitulos.map((c) => `${c.titulo}${c.parte ? ` / ${c.parte.nombre}` : ''}`);
    const i = titulos.indexOf('Amor / Carmen');
    expect(titulos.slice(i, i + 3)).toEqual(['Amor / Carmen', 'El viaje', 'Amor / Norma']);
    expect(indice.capitulos.find((c) => c.titulo === 'El viaje')!.respuestaIds).toEqual(['R16', 'R17']);
  });

  it('bisagra sin años en la ficha: aviso y nada se inserta', () => {
    const ficha: FichaV3 = {
      ...FICHA,
      parejas: [{ nombre: 'Carmen', actual: false, fin: 'separacion' }, { nombre: 'Norma', actual: true, fin: null }],
      migracion: { de: 'Rosario', a: 'Madrid', anio: 1994 },
    };
    const resp = [...vidaCompleta(), r('JU8', 900), r('JU9', 900)];
    const indice = armarIndice(resp, ficha, op);
    expect(indice.capitulos.filter((c) => c.titulo === 'El viaje' && c.madre !== 4)).toHaveLength(0);
    expect(indice.avisos.some((a) => /bisagra/i.test(a))).toBe(true);
  });
});

describe('armarIndice: invariantes', () => {
  function invariantes(resp: RespuestaV3[], indice: Indice) {
    // Ningún título con años.
    for (const c of indice.capitulos) expect(`${c.titulo} ${c.parte?.nombre ?? ''}`).not.toMatch(/\d{2,4}/);
    // Toda respuesta no-paso en exactamente un capítulo, o en el cierre si es legado.
    for (const x of resp) {
      const veces = indice.capitulos.filter((c) => c.respuestaIds.includes(x.id)).length + (indice.cierre.includes(x.id) ? 1 : 0);
      expect(veces, x.id).toBe(x.paso ? 0 : 1);
      if (!x.paso && x.bloque === 15) expect(indice.cierre).toContain(x.id);
    }
    // Ninguno bajo el mínimo salvo Hoy y De dónde vengo.
    for (const c of indice.capitulos) {
      if (c.madres.length === 1 && (c.madre === 10 || c.madre === 1)) continue;
      expect(c.palabrasHabladas, c.titulo).toBeGreaterThanOrEqual(1500);
    }
    // Objetivo = 0,6 × W.
    for (const c of indice.capitulos) expect(c.palabrasEscritasObjetivo).toBe(Math.round(0.6 * c.palabrasHabladas));
  }

  it('se cumplen con fusiones, flotantes, pasos y legado mezclados', () => {
    const resp = [
      ...vidaCompleta(),
      r('AD2', 300), r('GI1', 400, { texto: 'yo tenía 30' }), r('HG4', 200), r('HO2', 80, { paso: true }), r('LE8', 500),
      r('PE4', 300, { texto: 'de chica' }), r('MAS2', 250), r('XX9', 120, { bloque: 7 }),
    ];
    resp[3].palabras = 600;
    resp[7].palabras = 700;
    const indice = armarIndice(resp, FICHA, op);
    invariantes(resp, indice);
    expect(indice.avisos.some((a) => /XX9/.test(a))).toBe(true);
  });
});
