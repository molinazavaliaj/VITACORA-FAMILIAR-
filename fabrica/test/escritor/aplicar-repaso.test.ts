// fabrica/test/escritor/aplicar-repaso.test.ts
// Naza, 07/10 (opción B): las correcciones del repaso de hechos se aplican por código (datos inventados).
import { describe, expect, it } from 'vitest';
import { Carpeta } from '../../src/escritor/carpeta.js';
import { aplicarRepaso } from '../../src/escritor/controles/aplicar-repaso.js';

const capitulo = 'Un verano fuimos a la costa con sus padres. Ella nadaba temprano. [[R04]]\n\nDespués volvimos al barrio. [[R05]]\n';
function carpeta(nuevos: object[]): Carpeta {
  const c = new Carpeta();
  c.escribir('salidas/capitulo_01.md', capitulo);
  c.escribir('controles/repaso.json', JSON.stringify({ nuevos, oscila: [], contradice: [] }));
  return c;
}
const p = (frase: string, correccion: string, pieza = 'cap_1') => ({ pieza, tipo: 'inventado', frase, correccion, ids: ['R04'] });

describe('aplicarRepaso', () => {
  it('reemplaza la frase por la corrección cuando está tal cual; las marcas quedan', () => {
    const c = carpeta([p('Un verano fuimos a la costa con sus padres.', 'Una vez fuimos a la costa con sus padres.')]);
    const r = aplicarRepaso(c);
    expect(r.aplicados).toHaveLength(1);
    expect(c.leer('salidas/capitulo_01.md')).toBe(capitulo.replace('Un verano', 'Una vez'));
    expect(JSON.parse(c.leer('controles/repaso-aplicado.json')).aplicados).toHaveLength(1);
  });

  it('no toca: frase que no está tal cual, indicación en vez de frase, corrección que agrega demasiado, pieza que no existe', () => {
    const c = carpeta([
      p('Un invierno fuimos a la costa.', 'Una vez fuimos a la costa.'),
      p('Ella nadaba temprano.', 'Dejar el párrafo como está y cerrarlo con una línea.'),
      p('Ella nadaba temprano.', 'Ella nadaba temprano, ' + 'y además contaba una historia larguísima que nadie dijo '.repeat(3)),
      p('Ella nadaba temprano.', 'Ella nadaba.', 'cap_9'),
    ]);
    const r = aplicarRepaso(c);
    expect(r.aplicados).toEqual([]);
    expect(r.salteados.map((x) => x.motivo)).toEqual([
      'la frase no está tal cual en la pieza',
      'la corrección es una indicación, no una frase',
      'la corrección agrega demasiado',
      'sin frase o sin pieza',
    ]);
    expect(c.leer('salidas/capitulo_01.md')).toBe(capitulo);
  });

  it('una corrección con "$" se escribe tal cual (no es un patrón de reemplazo)', () => {
    const c = carpeta([p('Ella nadaba temprano.', 'Ella pagaba $& al entrar.')]);
    aplicarRepaso(c);
    expect(c.leer('salidas/capitulo_01.md')).toContain('Ella pagaba $& al entrar.');
  });

  it('sin repaso no hace nada', () => {
    const c = new Carpeta();
    expect(aplicarRepaso(c)).toEqual({ aplicados: [], salteados: [] });
  });
});
