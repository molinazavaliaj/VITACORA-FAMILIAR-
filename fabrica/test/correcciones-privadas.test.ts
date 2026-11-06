import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/escritor/produccion/avisos.js', () => ({ avisarSocios: vi.fn(async () => true) }));

import { AlmacenMemoria } from '../src/escritor/almacen/memoria.js';
import { avisarSocios } from '../src/escritor/produccion/avisos.js';
import { ARCHIVO_CORRECCIONES, filtrarCorreccionesDeQuienRegalo, leerFiltro } from '../src/escritor/produccion/correcciones-privadas.js';

const PRIVADO = { acceso: { elige: true } };
const dbCon = (contexto: unknown) =>
  ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { contexto }, error: null }) }) }) }) }) as never;
const TEXTO = 'Mi hermana se llama Marta, con t. Sacá lo del accidente.';
const filtrar = (o: { contexto?: unknown; almacen?: AlmacenMemoria; pedir?: () => Promise<string>; correcciones?: { texto: string }[] } = {}) =>
  filtrarCorreccionesDeQuienRegalo(dbCon('contexto' in o ? o.contexto : PRIVADO), 'n1', o.almacen ?? new AlmacenMemoria(), {
    quien: async () => 'Antonio',
    correcciones: o.correcciones ?? [{ texto: TEXTO }],
    pedir: o.pedir ?? (async () => JSON.stringify({ datos: ['Mi hermana se llama Marta, con t.'], afuera: ['Sacá lo del accidente.'] })),
  });

beforeEach(() => vi.mocked(avisarSocios).mockClear());

describe('las correcciones de quien regala', () => {
  it('sin privacidad pasan enteras y no llama a ningún modelo', async () => {
    const pedir = vi.fn(async () => '{}');
    expect(await filtrar({ contexto: { vinculoComprador: 'yo mismo' }, pedir })).toEqual([{ texto: TEXTO }]);
    expect(await filtrar({ contexto: { modo: 'viaje' }, pedir })).toEqual([{ texto: TEXTO }]);
    expect(pedir).not.toHaveBeenCalled();
    expect(avisarSocios).not.toHaveBeenCalled();
  });

  it('sin correcciones no hace nada', async () => {
    const pedir = vi.fn(async () => '{}');
    expect(await filtrar({ correcciones: [], pedir })).toEqual([]);
    expect(pedir).not.toHaveBeenCalled();
  });

  it('en privado aplica los datos y les avisa a los socios lo que quedó afuera', async () => {
    expect(await filtrar()).toEqual([{ texto: 'Mi hermana se llama Marta, con t.' }]);
    expect(avisarSocios).toHaveBeenCalledTimes(1);
    expect(vi.mocked(avisarSocios).mock.calls[0][1]).toContain('Sacá lo del accidente.');
  });

  it('un reintento no vuelve a preguntar ni a avisar, y da lo mismo', async () => {
    const almacen = new AlmacenMemoria();
    const pedir = vi.fn(async () => JSON.stringify({ datos: ['Mi hermana se llama Marta, con t.'], afuera: ['Sacá lo del accidente.'] }));
    await filtrar({ almacen, pedir });
    expect(await filtrar({ almacen, pedir })).toEqual([{ texto: 'Mi hermana se llama Marta, con t.' }]);
    expect(pedir).toHaveBeenCalledTimes(1);
    expect(avisarSocios).toHaveBeenCalledTimes(1);
  });

  it('si el aviso no salió, lo reintenta sin volver a preguntar', async () => {
    const almacen = new AlmacenMemoria();
    const pedir = vi.fn(async () => JSON.stringify({ datos: [], afuera: [TEXTO] }));
    vi.mocked(avisarSocios).mockResolvedValueOnce(false);
    await filtrar({ almacen, pedir });
    await filtrar({ almacen, pedir });
    expect(pedir).toHaveBeenCalledTimes(1);
    expect(avisarSocios).toHaveBeenCalledTimes(2);
  });

  it('si cambió el texto, vuelve a clasificar', async () => {
    const almacen = new AlmacenMemoria();
    await filtrar({ almacen });
    const pedir = vi.fn(async () => JSON.stringify({ datos: ['Nació en 1950.'], afuera: [] }));
    expect(await filtrar({ almacen, pedir, correcciones: [{ texto: 'Nació en 1950.' }] })).toEqual([{ texto: 'Nació en 1950.' }]);
    expect(pedir).toHaveBeenCalledTimes(1);
  });

  it('lo que el modelo reescribió no entra como dato', async () => {
    const r = await filtrar({ pedir: async () => JSON.stringify({ datos: ['Su hermana se llama Marta y hay que borrar el accidente.'], afuera: [] }) });
    expect(r).toEqual([]);
    expect(vi.mocked(avisarSocios).mock.calls[0][1]).toContain(TEXTO);
  });

  it('si el modelo falla, no aplica nada, avisa y el libro sigue', async () => {
    expect(await filtrar({ pedir: async () => { throw new Error('sin red'); } })).toEqual([]);
    expect(vi.mocked(avisarSocios).mock.calls[0][1]).toContain(TEXTO);
  });

  it('si la respuesta no se entiende, tampoco aplica nada', async () => {
    expect(await filtrar({ pedir: async () => 'no sé' })).toEqual([]);
    expect(avisarSocios).toHaveBeenCalledTimes(1);
  });

  it('un archivo roto cuenta como que no hay filtro', async () => {
    const almacen = new AlmacenMemoria();
    await almacen.escribir(ARCHIVO_CORRECCIONES, 'roto');
    expect(await leerFiltro(almacen)).toBeNull();
    expect(await filtrar({ almacen })).toEqual([{ texto: 'Mi hermana se llama Marta, con t.' }]);
  });
});
