// Los 15 días del «no aceptó»: qué se borra, qué no, y a quién no se toca.
//
// Esto destruye datos de una persona y no tiene vuelta atrás. Los tests fijan
// sobre todo lo que NO tiene que pasar.

import { describe, expect, it, vi } from 'vitest';
import {
  BUCKET_FOTOS, DIAS_PARA_BORRAR_FICHA, borrarFichaYFotos, contextoAnonimo, leTocaBorrar, telefonoBorrado,
} from '../src/flujo/borrado-no-acepto.js';

const AHORA = new Date('2026-11-15T10:00:00Z');
const HACE_16_DIAS = '2026-10-30T10:00:00Z';
const HACE_2_DIAS = '2026-11-13T10:00:00Z';

const narrador = (extra: Record<string, any> = {}) => ({
  id: 'n1', estado: 'invitado', contexto: { noAcepto: { cuando: HACE_16_DIAS } }, ...extra,
});

describe('a quién le toca el borrado', () => {
  it('el plazo es el que prometen los legales', () => {
    expect(DIAS_PARA_BORRAR_FICHA).toBe(15);
  });

  it('con la marca puesta hace más de 15 días, sí', () => {
    expect(leTocaBorrar(narrador(), AHORA)).toBe(true);
  });

  it('a los 2 días de la marca, todavía no', () => {
    expect(leTocaBorrar(narrador({ contexto: { noAcepto: { cuando: HACE_2_DIAS } } }), AHORA)).toBe(false);
  });

  it('sin marca de «no aceptó», nunca', () => {
    expect(leTocaBorrar(narrador({ contexto: {} }), AHORA)).toBe(false);
    expect(leTocaBorrar(narrador({ contexto: null }), AHORA)).toBe(false);
  });

  // Lo más importante de este archivo: alguien puede contestar el día 31.
  it('SI ACEPTÓ DESPUÉS, no se le borra nada', () => {
    for (const estado of ['acepto', 'activo', 'pausado', 'completado']) {
      expect(leTocaBorrar(narrador({ estado }), AHORA), estado).toBe(false);
    }
  });

  it('no se borra dos veces', () => {
    const yaBorrado = narrador({ contexto: { noAcepto: { cuando: HACE_16_DIAS }, borradoFicha: { cuando: HACE_2_DIAS } } });
    expect(leTocaBorrar(yaBorrado, AHORA)).toBe(false);
  });

  it('una fecha rota no dispara un borrado', () => {
    expect(leTocaBorrar(narrador({ contexto: { noAcepto: { cuando: 'cualquier cosa' } } }), AHORA)).toBe(false);
  });
});

describe('qué queda del contexto', () => {
  it('la ficha se va entera', () => {
    const antes = { noAcepto: { cuando: HACE_16_DIAS }, lugarNacimiento: 'Rosario', anioNacimiento: 1943, oficio: 'tornero', arbol: { hijos: ['Ana'] } };
    const despues = contextoAnonimo(antes, AHORA);
    expect(despues.lugarNacimiento).toBeUndefined();
    expect(despues.anioNacimiento).toBeUndefined();
    expect(despues.oficio).toBeUndefined();
    expect(despues.arbol).toBeUndefined();
  });

  it('pero queda por qué se borró y cuándo: sin eso no se puede auditar', () => {
    const despues = contextoAnonimo({ noAcepto: { cuando: HACE_16_DIAS }, oficio: 'tornero' }, AHORA);
    expect(despues.noAcepto).toEqual({ cuando: HACE_16_DIAS });
    expect((despues.borradoFicha as any).cuando).toBe(AHORA.toISOString());
  });

  it('el teléfono se reemplaza por una marca, no por null: la columna es not null unique', () => {
    expect(telefonoBorrado('n1')).toBe('borrado:n1');
  });
});

// Una base falsa mínima: anota lo que se le pide y devuelve lo que se le dice.
function baseFalsa(fotos: Array<{ id: string; storage_path: string }>, fallos: Record<string, any> = {}) {
  const hecho: any[] = [];
  const remove = vi.fn(async (paths: string[]) => { hecho.push(['storage.remove', paths]); return { error: fallos.storage ?? null }; });
  const db: any = {
    from: (tabla: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { contexto: { noAcepto: { cuando: HACE_16_DIAS }, oficio: 'tornero' } }, error: null }),
          then: undefined,
          data: null,
        }),
      }),
      delete: () => ({ eq: async () => { hecho.push(['delete', tabla]); return { error: fallos.filas ?? null }; } }),
      update: (p: any) => ({ eq: async () => { hecho.push(['update', tabla, p]); return { error: null }; } }),
    }),
    storage: { from: () => ({ remove }) },
  };
  // `select().eq()` de fotos devuelve la lista; el de narradores, el maybeSingle de arriba.
  db.from = (tabla: string) => ({
    select: () => ({
      eq: (col: string, _v: string) =>
        tabla === 'fotos'
          ? Promise.resolve({ data: fotos, error: fallos.listar ?? null })
          : { maybeSingle: async () => ({ data: { contexto: { noAcepto: { cuando: HACE_16_DIAS }, oficio: 'tornero' } }, error: null }) },
    }),
    delete: () => ({ eq: async () => { hecho.push(['delete', tabla]); return { error: fallos.filas ?? null }; } }),
    update: (p: any) => ({ eq: async () => { hecho.push(['update', tabla, p]); return { error: null }; } }),
  });
  return { db, hecho, remove };
}

describe('el borrado en sí', () => {
  const FOTOS = [
    { id: 'f1', storage_path: 'n1/fotos/f1.jpg' },
    { id: 'f2', storage_path: 'n1/fotos/f2.jpg' },
  ];

  it('borra los archivos de las fotos y después sus filas', async () => {
    const { db, hecho, remove } = baseFalsa(FOTOS);
    const cuantas = await borrarFichaYFotos(db, 'n1', AHORA);
    expect(cuantas).toBe(2);
    expect(remove).toHaveBeenCalledWith(['n1/fotos/f1.jpg', 'n1/fotos/f2.jpg']);
    expect(hecho.map((h) => h[0])).toEqual(['storage.remove', 'delete', 'update']);
  });

  it('anonimiza nombre, cómo le dicen y teléfono', async () => {
    const { db, hecho } = baseFalsa(FOTOS);
    await borrarFichaYFotos(db, 'n1', AHORA);
    const [, , puesto] = hecho.find((h) => h[0] === 'update');
    expect(puesto.nombre).toBe('Narrador borrado');
    expect(puesto.como_le_dicen).toBe('Narrador borrado');
    expect(puesto.telefono_whatsapp).toBe('borrado:n1');
    expect(puesto.contexto.oficio).toBeUndefined();
  });

  it('sin fotos no toca el storage, pero igual anonimiza', async () => {
    const { db, hecho, remove } = baseFalsa([]);
    expect(await borrarFichaYFotos(db, 'n1', AHORA)).toBe(0);
    expect(remove).not.toHaveBeenCalled();
    expect(hecho.map((h) => h[0])).toEqual(['update']);
  });

  // Si no se pueden borrar los archivos, no se anonimiza: con la ficha borrada
  // nadie sabría de quién son esas fotos que quedaron.
  it('si falla el borrado en storage, no anonimiza', async () => {
    const { db, hecho } = baseFalsa(FOTOS, { storage: { message: 'se cayó' } });
    await expect(borrarFichaYFotos(db, 'n1', AHORA)).rejects.toThrow(/no pude borrar las fotos/);
    expect(hecho.find((h) => h[0] === 'update')).toBeUndefined();
  });

  it('usa el bucket donde viven las fotos', () => {
    expect(BUCKET_FOTOS).toBe('audios');
  });
});
