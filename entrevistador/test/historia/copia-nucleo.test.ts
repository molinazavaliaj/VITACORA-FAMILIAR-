import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// El núcleo de historia es COPIA EXACTA de la fábrica (fabrica/src/historia/),
// como el de V3: dos Dockerfiles separados. Si alguien cambia la fábrica y no
// copia (`npm run historia-copiar-nucleo`), este test lo dice. En el Docker
// del entrevistador no está `../fabrica`: ahí se saltea.
const FABRICA = fileURLToPath(new URL('../../../fabrica/src/historia/', import.meta.url));
const NUCLEO = fileURLToPath(new URL('../../src/historia/nucleo/', import.meta.url));
const hayFabrica = existsSync(`${FABRICA}entrevista`);

describe.skipIf(!hayFabrica)('el núcleo de historia es copia exacta de la fábrica', () => {
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

describe('el núcleo de historia carga en el entrevistador', () => {
  it('el banco tiene las 50 preguntas en los tres idiomas y el de cada tema arranca por la común', async () => {
    const { bancoDe, bancoHistoria } = await import('../../src/historia/nucleo/entrevista/banco.js');
    for (const idioma of ['es-AR', 'ca', 'es-ES'] as const) {
      expect(bancoDe(idioma).preguntas).toHaveLength(50);
      expect(bancoHistoria('mudanza', idioma).preguntas[0].id).toBe('HC1');
    }
  });

  it('el cazador es Opus 5.5, con una repregunta por bloque y tope de USD 3', async () => {
    const { MODELO_CAZADOR, MAX_ELEGIDAS, TOPE_GASTO_USD } = await import('../../src/historia/nucleo/entrevista/cazador.js');
    expect(MODELO_CAZADOR).toBe('claude-opus-5-5');
    expect(MAX_ELEGIDAS).toBe(1);
    expect(TOPE_GASTO_USD).toBe(3);
  });
});
