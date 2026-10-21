import { describe, it, expect } from 'vitest';
import { leerEntrevistaV3, sinLoSacado, type FilaEntrevistaV3 } from '../src/escritor/material/de-base.js';

// «Que esto no vaya al libro» por respuesta, desde el panel (respuestas_fuera, Naza 21/10): sale esa
// fila sola; lo demás que contó en esa pregunta sigue en el libro.

const fila = (estado: Partial<FilaEntrevistaV3['estado']>): FilaEntrevistaV3 => ({
  narrador_id: 'n1', idioma: 'es-AR', ficha: { nombre: 'Prueba', genero: 'mujer' },
  estado: { respuestas: [], charla: [], ...estado },
});

function dbFalsa(tablas: Record<string, any[]>, errores: Record<string, { code: string; message: string }> = {}) {
  return {
    from: (tabla: string) => {
      const filtros: ((f: any) => boolean)[] = [];
      const lista = () => (tablas[tabla] ?? []).filter((f) => filtros.every((p) => p(f)));
      const resultado = () => (errores[tabla] ? { data: null, error: errores[tabla] } : { data: lista(), error: null });
      const q: any = {
        select: () => q,
        eq: (c: string, v: unknown) => { filtros.push((f) => f[c] === v); return q; },
        not: (c: string) => { filtros.push((f) => f[c] != null); return q; },
        order: () => q,
        maybeSingle: async () => ({ data: lista()[0] ?? null, error: null }),
        then: (ok: any, ko: any) => Promise.resolve(resultado()).then(ok, ko),
      };
      return q;
    },
  } as any;
}

const padre = 'Soy el marido, ella está en la cocina. Nos conocimos en un baile en Tandil.';
const madre = 'Nos conocimos en el club, yo tenía diecisiete años.';
const respuestas = [
  { id: 'r-padre', narrador_id: 'n1', clave_v3: 'PA3', audio_path: 'n1/a.ogg', transcripcion: padre, recibido_at: '2026-10-21T13:00:00Z' },
  { id: 'r-madre', narrador_id: 'n1', clave_v3: 'PA3', audio_path: 'n1/b.ogg', transcripcion: madre, recibido_at: '2026-10-21T13:05:00Z' },
  { id: 'r-otra', narrador_id: 'n1', clave_v3: 'PA4', audio_path: 'n1/c.ogg', transcripcion: 'Trabajé en el banco.', recibido_at: '2026-10-21T13:10:00Z' },
];
const estado = { respuestas: [['PA3', `${padre} ${madre}`], ['PA4', 'Trabajé en el banco.']] as [string, string][] };
const fueraPadre = [{ respuesta_id: 'r-padre', narrador_id: 'n1' }];

describe('sinLoSacado', () => {
  it('borra solo el texto de la fila sacada', () => {
    expect(sinLoSacado(`${padre} ${madre}`, [{ texto: padre, fuera: true }, { texto: madre, fuera: false }])).toBe(madre);
  });

  it('con espacios distintos también la encuentra', () => {
    expect(sinLoSacado('Uno  dos.\n Tres.', [{ texto: 'Uno dos.', fuera: true }, { texto: 'Tres.', fuera: false }])).toBe('Tres.');
  });

  it('si no está tal cual, rearma el texto con las filas que quedan', () => {
    expect(sinLoSacado('Un texto que ya no coincide.', [{ texto: padre, fuera: true }, { texto: madre, fuera: false }])).toBe(madre);
  });

  it('si no queda nada, null', () => {
    expect(sinLoSacado(padre, [{ texto: padre, fuera: true }])).toBeNull();
    expect(sinLoSacado('otra cosa', [{ texto: padre, fuera: true }])).toBeNull();
  });

  it('sin filas sacadas, el texto queda igual', () => {
    expect(sinLoSacado('Igual.', [{ texto: 'Igual.', fuera: false }])).toBe('Igual.');
  });
});

describe('el escritor respeta respuestas_fuera', () => {
  it('saca la respuesta del padre y deja la de la madre en la misma pregunta', async () => {
    const db = dbFalsa({ entrevistas_v3: [fila(estado)], respuestas, respuestas_fuera: fueraPadre });
    const e = await leerEntrevistaV3(db, 'n1');
    expect(e?.respuestas).toEqual([['PA3', madre], ['PA4', 'Trabajé en el banco.']]);
  });

  it('la fila sacada no va a «Su voz»', async () => {
    const db = dbFalsa({ entrevistas_v3: [fila(estado)], respuestas, respuestas_fuera: fueraPadre });
    const e = await leerEntrevistaV3(db, 'n1');
    expect(e?.audios.find((a) => a.respuestaId === 'r-padre')).toMatchObject({ audioPath: null, transcripcion: null });
    expect(e?.audios.find((a) => a.respuestaId === 'r-madre')).toMatchObject({ audioPath: 'n1/b.ogg', transcripcion: madre });
  });

  it('si se sacan todas las de una pregunta, la pregunta sale', async () => {
    const db = dbFalsa({ entrevistas_v3: [fila(estado)], respuestas, respuestas_fuera: [...fueraPadre, { respuesta_id: 'r-madre', narrador_id: 'n1' }] });
    expect((await leerEntrevistaV3(db, 'n1'))?.respuestas).toEqual([['PA4', 'Trabajé en el banco.']]);
  });

  it('va por clave exacta: sacar una fila de X no toca RP~X', async () => {
    const est = { respuestas: [['PA3', padre], ['RP~PA3', 'El baile era en el club.']] as [string, string][] };
    const filas = [respuestas[0], { id: 'r-rp', narrador_id: 'n1', clave_v3: 'RP~PA3', audio_path: null, transcripcion: null, texto_directo: 'El baile era en el club.', recibido_at: '2026-10-21T14:00:00Z' }];
    const db = dbFalsa({ entrevistas_v3: [fila(est)], respuestas: filas, respuestas_fuera: fueraPadre });
    expect((await leerEntrevistaV3(db, 'n1'))?.respuestas).toEqual([['RP~PA3', 'El baile era en el club.']]);
  });

  it('también en lo que está contando y no se cerró', async () => {
    const db = dbFalsa({
      entrevistas_v3: [fila({ respuestas: [], esperando: 'PA3', borrador: `${padre} ${madre}` })],
      respuestas: respuestas.slice(0, 2),
      respuestas_fuera: fueraPadre,
    });
    expect((await leerEntrevistaV3(db, 'n1'))?.respuestas).toEqual([['PA3', madre]]);
  });

  it('una respuesta escrita (texto_directo) sale igual, y las marcas del sistema se quedan', async () => {
    const est = { respuestas: [['PA3', `⟦botón:Sí⟧ ${padre} ${madre}`]] as [string, string][] };
    const filas = [
      { id: 'r-boton', narrador_id: 'n1', clave_v3: 'PA3', audio_path: null, transcripcion: null, texto_directo: '⟦botón:Sí⟧', recibido_at: '2026-10-21T12:59:00Z' },
      { ...respuestas[0], audio_path: null, transcripcion: null, texto_directo: padre },
      respuestas[1],
    ];
    const db = dbFalsa({ entrevistas_v3: [fila(est)], respuestas: filas, respuestas_fuera: fueraPadre });
    expect((await leerEntrevistaV3(db, 'n1'))?.respuestas).toEqual([['PA3', `⟦botón:Sí⟧ ${madre}`]]);
  });

  it('sin la tabla (migración sin aplicar), no saca nada', async () => {
    for (const code of ['42P01', 'PGRST205']) {
      const db = dbFalsa({ entrevistas_v3: [fila(estado)], respuestas }, { respuestas_fuera: { code, message: 'no existe' } });
      expect((await leerEntrevistaV3(db, 'n1'))?.respuestas).toEqual(estado.respuestas);
    }
  });

  it('otro error de la base tira: no se escribe un libro con lo que la familia sacó', async () => {
    const db = dbFalsa({ entrevistas_v3: [fila(estado)], respuestas }, { respuestas_fuera: { code: '08006', message: 'se cortó' } });
    await expect(leerEntrevistaV3(db, 'n1')).rejects.toThrow(/sacadas/);
  });
});
