import { describe, it, expect } from 'vitest';
import { entrevistaDeFila, leerEntrevistaV3, MARCA_FOTO, type FilaEntrevistaV3 } from '../src/escritor/material/de-base.js';
import { aMaterial } from '../src/escritor/material/de-entrevista.js';

const fila = (extra: Partial<FilaEntrevistaV3['estado']> = {}, idioma = 'es-AR'): FilaEntrevistaV3 => ({
  narrador_id: 'n1',
  idioma,
  ficha: { nombre: 'Prueba', genero: 'mujer', quienRegala: 'Laura' },
  estado: {
    respuestas: [['OR1', 'Nací en un pueblo chico y mi mamá cosía para afuera.'], ['FO1', `${MARCA_FOTO} Es el día de mi casamiento, con mis hermanas.`]],
    familia: [{ id: 'F:pf1', texto: '¿Qué te acordás de la abuela?' }],
    charla: [],
    ...extra,
  },
});

function dbFalsa(tablas: Record<string, any[]>) {
  return {
    from: (tabla: string) => {
      const filtros: ((f: any) => boolean)[] = [];
      const lista = () => (tablas[tabla] ?? []).filter((f) => filtros.every((p) => p(f)));
      const q: any = {
        select: () => q,
        eq: (c: string, v: unknown) => { filtros.push((f) => f[c] === v); return q; },
        not: (c: string) => { filtros.push((f) => f[c] != null); return q; },
        order: () => q,
        maybeSingle: async () => ({ data: lista()[0] ?? null, error: null }),
        then: (ok: any, ko: any) => Promise.resolve({ data: lista(), error: null }).then(ok, ko),
      };
      return q;
    },
  } as any;
}

describe('el lector de la entrevista V3 desde la base', () => {
  it('devuelve el formato de de-entrevista.ts, sin la marca de la foto', () => {
    const e = entrevistaDeFila(fila());
    expect(e.ficha).toEqual({ nombre: 'Prueba', genero: 'mujer', quienRegala: 'Laura' });
    expect(e.respuestas[1]).toEqual(['FO1', 'Es el día de mi casamiento, con mis hermanas.']);
    expect(e.familia).toEqual([{ id: 'F:pf1', texto: '¿Qué te acordás de la abuela?' }]);
    const filas = aMaterial(e);
    expect(filas.map((f) => [f.preguntaId, f.paso])).toEqual([['OR1', false], ['FO1', false]]);
  });

  it('en catalán la ficha lleva el idioma', () => {
    expect(entrevistaDeFila(fila({}, 'ca')).ficha).toMatchObject({ idioma: 'ca' });
  });

  it('lo que estaba contando y no se cerró (cierre anticipado) también entra', () => {
    const abierta = entrevistaDeFila(fila({ esperando: 'OR2', borrador: 'La historia del abuelo que llegó en barco.' }));
    expect(abierta.respuestas.at(-1)).toEqual(['OR2', 'La historia del abuelo que llegó en barco.']);
    const conSi = entrevistaDeFila(fila({ respuestas: [['CA6', '⟦botón:Sí, tuve⟧']], esperando: 'CA6', tocoSi: true, borrador: 'Éramos cuatro.' }));
    expect(conSi.respuestas).toEqual([['CA6', '⟦botón:Sí, tuve⟧ Éramos cuatro.']]);
  });

  it('una foto sin nada contado queda como paso (la imagen no está en el material)', () => {
    const e = entrevistaDeFila(fila({ respuestas: [['FO1', MARCA_FOTO]] }));
    expect(aMaterial(e)[0]).toMatchObject({ preguntaId: 'FO1', paso: true });
  });

  it('lee la fila y los audios con clave V3; sin fila, null', async () => {
    const db = dbFalsa({
      entrevistas_v3: [fila()],
      respuestas: [
        { narrador_id: 'n1', clave_v3: 'OR1', audio_path: 'n1/dia_01.ogg', transcripcion: 'Nací…', recibido_at: '2026-10-08T13:00:00Z' },
        { narrador_id: 'n1', clave_v3: null, audio_path: 'n1/dia_02.ogg', transcripcion: 'vieja', recibido_at: '2026-10-01T13:00:00Z' },
      ],
    });
    const e = await leerEntrevistaV3(db, 'n1');
    expect(e?.audios).toEqual([{ clave: 'OR1', audioPath: 'n1/dia_01.ogg', transcripcion: 'Nací…', recibidoAt: '2026-10-08T13:00:00Z' }]);
    expect(await leerEntrevistaV3(db, 'n2')).toBeNull();
  });

  it('un audio reservado no entra con su ruta ni su texto', async () => {
    const db = dbFalsa({
      entrevistas_v3: [fila()],
      respuestas: [
        { narrador_id: 'n1', clave_v3: 'OR1', audio_path: 'n1/a.ogg', transcripcion: 'secreto', recibido_at: '2026-10-08T13:00:00Z', reservada: true },
        { narrador_id: 'n1', clave_v3: 'OR2', audio_path: 'n1/b.ogg', transcripcion: 'uno dos tres', reservado_tramo: 'dos', recibido_at: '2026-10-08T14:00:00Z' },
      ],
    });
    const e = await leerEntrevistaV3(db, 'n1');
    expect(e?.audios).toEqual([
      { clave: 'OR1', audioPath: null, transcripcion: null, recibidoAt: '2026-10-08T13:00:00Z' },
      { clave: 'OR2', audioPath: null, transcripcion: 'uno tres', recibidoAt: '2026-10-08T14:00:00Z' },
    ]);
  });

  describe('reservas hechas después de que el texto entró al estado', () => {
    const filaRes = () => fila({ respuestas: [['OR1', 'Nací en Rosario. Lo del tío no lo cuento. Después nos mudamos.'], ['OR2', 'Mi mamá cosía.']] });
    const con = (r: any) => dbFalsa({ entrevistas_v3: [filaRes()], respuestas: [{ narrador_id: 'n1', clave_v3: 'OR1', audio_path: null, transcripcion: 'x', recibido_at: '2026-10-08T13:00:00Z', ...r }] });

    it('reservada entera: la clave sale de respuestas y del material', async () => {
      const e = await leerEntrevistaV3(con({ reservada: true }), 'n1');
      expect(e?.respuestas).toEqual([['OR2', 'Mi mamá cosía.']]);
      expect(aMaterial(e!).map((f) => f.preguntaId)).toEqual(['OR2']);
    });

    it('tramo reservado: se saca del texto', async () => {
      const e = await leerEntrevistaV3(con({ reservado_tramo: 'Lo del tío no lo cuento.' }), 'n1');
      expect(e?.respuestas[0]).toEqual(['OR1', 'Nací en Rosario. Después nos mudamos.']);
      const f = aMaterial(e!).find((x) => x.preguntaId === 'OR1')!;
      expect(f.texto).not.toContain('tío');
    });

    it('tramo que no está textual: se reserva la clave entera', async () => {
      const e = await leerEntrevistaV3(con({ reservado_tramo: 'algo que no está' }), 'n1');
      expect(e?.respuestas).toEqual([['OR2', 'Mi mamá cosía.']]);
      expect(aMaterial(e!).map((f) => f.preguntaId)).toEqual(['OR2']);
    });

    it('también alcanza al borrador abierto', async () => {
      const db = dbFalsa({ entrevistas_v3: [fila({ respuestas: [], esperando: 'OR1', borrador: 'Secreto de familia.' })], respuestas: [{ narrador_id: 'n1', clave_v3: 'OR1', audio_path: null, transcripcion: 'x', recibido_at: '2026-10-08T13:00:00Z', reservada: true }] });
      expect((await leerEntrevistaV3(db, 'n1'))?.respuestas).toEqual([]);
    });
  });
});
