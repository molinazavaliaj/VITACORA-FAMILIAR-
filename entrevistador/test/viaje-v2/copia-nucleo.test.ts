import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// El núcleo de la Viaje V2 es COPIA EXACTA de la fábrica (como el de la V3): dos Dockerfiles separados. Si alguien
// cambia la fábrica y no copia (npm run viaje-v2-copiar-nucleo), este test lo dice. En el Docker del entrevistador
// no está `../fabrica`: ahí se saltea.
const FABRICA = fileURLToPath(new URL('../../../fabrica/src/viaje-v2/', import.meta.url));
const NUCLEO = fileURLToPath(new URL('../../src/viaje-v2/nucleo/', import.meta.url));
const hayFabrica = existsSync(FABRICA);

describe.skipIf(!hayFabrica)('el núcleo Viaje V2 es copia exacta de la fábrica', () => {
  const originales = hayFabrica ? readdirSync(FABRICA).sort() : [];

  it('tiene exactamente los mismos archivos', () => {
    expect(readdirSync(NUCLEO).sort()).toEqual(originales);
  });

  it.each(originales)('%s es igual byte a byte', (archivo) => {
    expect(readFileSync(`${NUCLEO}${archivo}`).equals(readFileSync(`${FABRICA}${archivo}`))).toBe(true);
  });
});

describe('el núcleo Viaje V2 carga en el entrevistador', () => {
  it('el banco tiene mensajes en los tres idiomas', async () => {
    const { bancoDe } = await import('../../src/viaje-v2/nucleo/banco.js');
    for (const idioma of ['es-AR', 'ca', 'es-ES'] as const) expect(bancoDe(idioma).length).toBeGreaterThan(20);
  });
});
