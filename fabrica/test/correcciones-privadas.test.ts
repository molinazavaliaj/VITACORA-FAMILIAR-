import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/escritor/produccion/avisos.js', () => ({ avisarSocios: vi.fn(async () => true) }));

import { AlmacenMemoria } from '../src/escritor/almacen/memoria.js';
import { avisarSocios } from '../src/escritor/produccion/avisos.js';
import { correccionesDeQuienRegalo } from '../src/escritor/produccion/correcciones-privadas.js';

const PRIVADO = { acceso: { elige: true } };
const TEXTO = 'Mi hermana se llama Marta, con t.';
const pasar = (o: { contexto?: unknown; almacen?: AlmacenMemoria; correcciones?: { texto: string }[] } = {}) =>
  correccionesDeQuienRegalo(o.almacen ?? new AlmacenMemoria(), 'n1', {
    contexto: 'contexto' in o ? o.contexto : PRIVADO,
    quien: async () => 'Antonio',
    correcciones: o.correcciones ?? [{ texto: TEXTO }],
  });

beforeEach(() => vi.mocked(avisarSocios).mockReset().mockResolvedValue(true));

describe('las correcciones de quien regala', () => {
  it('si no es privado entran enteras y no avisa', async () => {
    for (const contexto of [{}, null, { acceso: { elige: true, quien: 'familia' } }]) {
      expect(await pasar({ contexto })).toEqual([{ texto: TEXTO }]);
    }
    expect(avisarSocios).not.toHaveBeenCalled();
  });

  it('en privado no entra ninguna y les llega a los socios', async () => {
    expect(await pasar()).toEqual([]);
    expect(avisarSocios).toHaveBeenCalledTimes(1);
    expect(vi.mocked(avisarSocios).mock.calls[0][1]).toContain(TEXTO);
  });

  it('sin texto no avisa', async () => {
    expect(await pasar({ correcciones: [] })).toEqual([]);
    expect(await pasar({ correcciones: [{ texto: '   ' }] })).toEqual([]);
    expect(avisarSocios).not.toHaveBeenCalled();
  });

  it('un reintento no vuelve a avisar', async () => {
    const almacen = new AlmacenMemoria();
    await pasar({ almacen });
    expect(await pasar({ almacen })).toEqual([]);
    expect(avisarSocios).toHaveBeenCalledTimes(1);
  });

  it('si no salió, lo reintenta', async () => {
    const almacen = new AlmacenMemoria();
    vi.mocked(avisarSocios).mockResolvedValueOnce(false);
    await pasar({ almacen });
    await pasar({ almacen });
    expect(avisarSocios).toHaveBeenCalledTimes(2);
  });

  it('si cambió el texto, vuelve a avisar', async () => {
    const almacen = new AlmacenMemoria();
    await pasar({ almacen });
    await pasar({ almacen, correcciones: [{ texto: 'Nació en 1950.' }] });
    expect(avisarSocios).toHaveBeenCalledTimes(2);
  });

  it('si el aviso falla, el libro sigue sin las correcciones', async () => {
    vi.mocked(avisarSocios).mockRejectedValueOnce(new Error('sin red'));
    expect(await pasar()).toEqual([]);
  });
});
