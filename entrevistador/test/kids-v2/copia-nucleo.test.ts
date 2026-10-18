import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// El motor de Kids V2 es COPIA EXACTA de la fábrica (como el núcleo de la V3 y el de la Viaje V2), con su
// subcarpeta `motor/`. Si alguien cambia la fábrica y no copia (npm run kids-v2-copiar-nucleo), este test lo dice.
// No se excluye nada: lo de la simulación (corrida, lectura, conductas, controles, simulacion) solo importa archivos
// de la misma carpeta. En el Docker del entrevistador no está `../fabrica`: ahí se saltea.
const FABRICA = fileURLToPath(new URL('../../../fabrica/src/kids-v2/', import.meta.url));
const NUCLEO = fileURLToPath(new URL('../../src/kids-v2/nucleo/', import.meta.url));
const hayFabrica = existsSync(FABRICA);

function archivosDe(dir: string, prefijo = ''): string[] {
  return readdirSync(dir).sort().flatMap((n) => (statSync(join(dir, n)).isDirectory() ? archivosDe(join(dir, n), `${prefijo}${n}/`) : [`${prefijo}${n}`]));
}

describe.skipIf(!hayFabrica)('el motor de Kids V2 es copia exacta de la fábrica', () => {
  const originales = hayFabrica ? archivosDe(FABRICA) : [];

  it('tiene exactamente los mismos archivos, también los de motor/', () => {
    expect(archivosDe(NUCLEO)).toEqual(originales);
    expect(originales).toContain('motor/recibido.ts');
  });

  it.each(originales)('%s es igual byte a byte', (archivo) => {
    expect(readFileSync(join(NUCLEO, archivo)).equals(readFileSync(join(FABRICA, archivo)))).toBe(true);
  });
});

describe('el motor de Kids V2 carga en el entrevistador', () => {
  it('arma un estado y arranca', async () => {
    const { nuevoEstado, paso } = await import('../../src/kids-v2/nucleo/motor.js');
    const { FICHA_A } = await import('./deps-prueba.js');
    const r = paso(nuevoEstado(FICHA_A), { tipo: 'inicio' }, '2026-11-02T15:00:00.000Z');
    expect(r.salidas.map((s) => (s.tipo === 'mensaje' ? s.id : s.tipo))).toEqual(['BIEN-CHICO', 'AVISO-PADRE']);
  });
});
