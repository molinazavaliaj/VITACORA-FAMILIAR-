import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// El núcleo V3 es COPIA EXACTA de la fábrica (spec 2026-10-07, "Por qué copiar
// y no compartir el código"): dos Dockerfiles separados. Si alguien cambia la
// fábrica y no copia, este test lo dice. En el Docker del entrevistador no
// está `../fabrica`: ahí se saltea.
const FABRICA = fileURLToPath(new URL('../../../fabrica/src/v3/', import.meta.url));
const NUCLEO = fileURLToPath(new URL('../../src/v3/nucleo/', import.meta.url));
const hayFabrica = existsSync(`${FABRICA}entrevista`);

describe.skipIf(!hayFabrica)('el núcleo V3 es copia exacta de la fábrica', () => {
  const originales = hayFabrica ? readdirSync(`${FABRICA}entrevista`).sort() : [];

  it('tiene exactamente los mismos archivos', () => {
    expect(readdirSync(`${NUCLEO}entrevista`).sort()).toEqual(originales);
  });

  it.each(originales)('entrevista/%s es igual byte a byte', (archivo) => {
    const copia = readFileSync(`${NUCLEO}entrevista/${archivo}`);
    const original = readFileSync(`${FABRICA}entrevista/${archivo}`);
    expect(copia.equals(original)).toBe(true);
  });

  it('ficha.ts es igual byte a byte', () => {
    expect(readFileSync(`${NUCLEO}ficha.ts`).equals(readFileSync(`${FABRICA}ficha.ts`))).toBe(true);
  });
});

describe('el núcleo V3 carga en el entrevistador', () => {
  it('el banco tiene preguntas en los tres idiomas', async () => {
    const { bancoDe } = await import('../../src/v3/nucleo/entrevista/banco.js');
    for (const idioma of ['es-AR', 'ca', 'es-ES'] as const) expect(bancoDe(idioma).length).toBeGreaterThan(100);
  });

  it('el cazador es Opus 5.5 con tope de USD 3', async () => {
    const { MODELO_CAZADOR, TOPE_GASTO_USD } = await import('../../src/v3/nucleo/entrevista/cazador.js');
    expect(MODELO_CAZADOR).toBe('claude-opus-5-5');
    expect(TOPE_GASTO_USD).toBe(3);
  });
});
