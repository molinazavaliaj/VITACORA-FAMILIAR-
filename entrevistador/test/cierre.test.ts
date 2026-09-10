import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  enviarTexto: vi.fn(),
  enviarAudioPorLink: vi.fn(),
  filas: {
    narrador: { como_le_dicen: 'Don Osvaldo', telefono_whatsapp: '+5491155551234', estado: 'activo' } as any,
  },
  capturas: [] as any[],
}));

vi.mock('../src/db/cliente.js', () => {
  function crearBuilder(tabla: string) {
    const b: any = { _op: 'select', _filtros: {} as Record<string, any> };
    const eq = (col: string, val: any) => { b._filtros[col] = val; return b; };
    b.select = () => b; b.order = () => b; b.limit = () => b; b.eq = eq;
    b.insert = (p: any) => { b._op = 'insert'; mocks.capturas.push({ op: 'insert', tabla, p }); return b; };
    b.update = (p: any) => { b._op = 'update'; mocks.capturas.push({ op: 'update', tabla, p, filtros: b._filtros }); return b; };
    const resolver = () => {
      if (b._op !== 'select') return { data: null, error: null };
      if (tabla === 'narradores') return { data: mocks.filas.narrador };
      return { data: null };
    };
    b.single = () => Promise.resolve(resolver());
    b.maybeSingle = () => Promise.resolve(resolver());
    b.then = (res: any, rej: any) => Promise.resolve(resolver()).then(res, rej);
    return b;
  }
  return {
    db: {
      from: (t: string) => crearBuilder(t),
      storage: { from: () => ({
        createSignedUrl: vi.fn(async (path: string) => ({ data: { signedUrl: `https://firmada/${path}` } })),
      }) },
    },
  };
});

vi.mock('../src/whatsapp/enviar.js', () => ({
  enviarTexto: mocks.enviarTexto, enviarAudioPorLink: mocks.enviarAudioPorLink, enviarPlantilla: vi.fn(),
}));

import { cerrarBitacora } from '../src/flujo/cierre.js';

const inserts = (tabla: string) => mocks.capturas.filter((c) => c.op === 'insert' && c.tabla === tabla);
const updates = (tabla: string) => mocks.capturas.filter((c) => c.op === 'update' && c.tabla === tabla);

beforeEach(() => {
  mocks.capturas = [];
  mocks.filas.narrador = { como_le_dicen: 'Don Osvaldo', telefono_whatsapp: '+5491155551234', estado: 'activo' };
  mocks.enviarTexto.mockReset().mockResolvedValue('wamid.t');
  mocks.enviarAudioPorLink.mockReset().mockResolvedValue('wamid.a');
});

describe('cerrarBitacora', () => {
  it('se despide y deja al narrador completado', async () => {
    await cerrarBitacora('n1');
    const textos = mocks.enviarTexto.mock.calls.map((c) => c[1]);
    expect(textos).toHaveLength(1);
    expect(textos[0]).toContain('final del viaje');
    expect(updates('narradores')[0].p).toEqual({ estado: 'completado' });
    expect(inserts('envios').map((i) => i.p.tipo)).toEqual(['despedida']);
  });

  it('ya no promete sorpresas ni manda audios: los saludos salieron de la fase 1', async () => {
    await cerrarBitacora('n1');
    expect(mocks.enviarTexto.mock.calls[0][1]).not.toContain('sorpresa');
    expect(mocks.enviarAudioPorLink).not.toHaveBeenCalled();
    expect(updates('saludos')).toHaveLength(0);
  });

  it('no repite la despedida si ya estaba completado', async () => {
    mocks.filas.narrador.estado = 'completado';
    await cerrarBitacora('n1', 0);
    expect(mocks.enviarTexto).not.toHaveBeenCalled();
  });
});
