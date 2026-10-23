// Task 3.5 del plan: la simulación de historia (scripts/historia-simular.ts) da 0 en los seis controles. Acá corre con
// pocos narradores por idioma para que quede en `npm test`; la corrida grande es `npm run historia-simular`.

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { correr, generoEquivocado, narradorDe } from '../../scripts/historia-simular.js';
import { IDIOMAS } from '../../src/historia/nucleo/entrevista/idioma.js';

beforeAll(() => {
  vi.stubEnv('WA_PLANTILLAS_HISTORIA_LISTAS', IDIOMAS.flatMap((i) => ['bienvenida', 'bienvenida_regalo', 'bienvenida_regalo_abierta'].map((c) => `${i}:${c}`)).join(','));
  vi.stubEnv('WA_PLANTILLAS_V3_LISTAS', IDIOMAS.flatMap((i) => ['pregunta', 'recordatorio'].map((c) => `${i}:${c}`)).join(','));
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterAll(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe('simulación de historia', () => {
  it('cinco narradores por idioma (temas, regalo, tema abierto, géneros) terminan sin violaciones', async () => {
    for (const idioma of IDIOMAS) {
      for (let s = 1; s <= 5; s++) {
        const c = await correr(narradorDe(s, idioma));
        expect(c.violaciones, `${idioma} semilla ${s}`).toEqual([]);
        expect(c.terminada).toBe(true);
      }
    }
  }, 60_000);

  it('el control de género ve una parte mandada en el género del otro', () => {
    const fila = {
      idioma: 'es-AR', ficha: { nombre: 'Jorge', genero: 'varon', tema: 'mudanza' },
      estado: { respuestas: [], charla: [{ de: 'bio', partes: [{ id: 'HC6', texto: 'En ese momento tan duro, ¿quién estuvo? Contame una vez concreta en que alguien te dio una mano o te dijo algo que te quedó. Si lo pasaste sola, eso también es parte de la historia, contámelo.' }] }] },
    } as unknown as Parameters<typeof generoEquivocado>[0];
    expect(generoEquivocado(fila)).toHaveLength(1);
  });
});
