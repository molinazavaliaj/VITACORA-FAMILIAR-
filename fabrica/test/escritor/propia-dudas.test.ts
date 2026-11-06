// A quién le hablan las dudas: siempre a quien contó, sea un regalo o «Para mí» (Naza, 06/11).
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/config.js', () => ({ cargarConfig: () => ({ resendApiKey: 'x', urlBase: 'https://x', anthropicApiKey: 'x', supabaseServiceRoleKey: 'x' }) }));
vi.mock('../../src/escritor/material/de-base.js', () => ({ leerEntrevistaV3: vi.fn(async () => ({ ficha: {}, audios: [] })) }));
vi.mock('../../src/escritor/material/a-carpeta.js', () => ({ materialACarpeta: () => ({ filas: [{ paso: false }] }) }));
vi.mock('../../src/escritor-historia/material/de-base.js', () => ({ leerEntrevistaHistoria: vi.fn(async () => ({ entrevista: {}, audios: [] })) }));
vi.mock('../../src/escritor-historia/material/carpeta.js', () => ({ carpetaDeHistoria: () => ({ leer: () => '<respuesta id="R01">' }) }));

import { carpetaHistoriaDeLaBase } from '../../src/escritor-historia/produccion/libro-historia.js';
import { carpetaDeLaBase } from '../../src/escritor/produccion/libro-v3.js';

const base = (contexto: unknown) => {
  const q: any = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: { contexto }, error: null }) };
  return { from: () => q } as any;
};

afterEach(() => vi.unstubAllEnvs());

describe.each([
  ['V3', carpetaDeLaBase],
  ['Historia', carpetaHistoriaDeLaBase],
] as const)('propia en %s', (_nombre, carpeta) => {
  it.each([
    ['un regalo', { vinculoComprador: 'hija' }],
    ['sin vínculo cargado', {}],
    ['«Para mí»', { vinculoComprador: 'yo mismo' }],
  ])('%s: le hablan a quien contó', async (_caso, contexto) => {
    expect((await carpeta(base(contexto), 'n')).propia).toBe(true);
  });

  it.each([
    ['viaje', { modo: 'viaje', vinculoComprador: 'hija' }],
    ['kids', { modo: 'kids', vinculoComprador: 'hija' }],
  ])('%s de regalo queda como antes: le hablan a la familia', async (_caso, contexto) => {
    expect((await carpeta(base(contexto), 'n')).propia).toBe(false);
  });
});
