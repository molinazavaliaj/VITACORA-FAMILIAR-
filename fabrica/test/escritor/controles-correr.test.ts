// controlar() da el mismo código de salida, el mismo resumen y el mismo archivo que `node controles.mjs`.
import { describe, expect, it } from 'vitest';
import type { Carpeta } from '../../src/escritor/carpeta.js';
import { controlar, type QueControl } from '../../src/escritor/controles/correr.js';
import { aDisco, carpetaNelida, correrMjs, mismoArchivo } from './ayuda.js';

function comparar(c: Carpeta, que: QueControl, arg?: string): { dir: string; codigo: number } {
  const dir = aDisco(c);
  const mjs = correrMjs('controles.mjs', [dir, que, ...(arg ? [arg] : [])]);
  const ts = controlar(c, que, arg);
  expect(ts.codigo).toBe(mjs.codigo);
  expect(`${ts.resumen}\n`).toBe(mjs.salida);
  return { dir, codigo: ts.codigo };
}

/** Nélida con fallas sembradas en las piezas (para que los controles de texto marquen). */
function sembrada(): Carpeta {
  const c = carpetaNelida();
  c.escribir('salidas/capitulo_01.md', `${c.leer('salidas/capitulo_01.md')}\nSin duda Ramiro llegó en 1950 y todo fue un tapiz… Y después. Corto. Más corto. Cortísimo. «La cuenta no daba nunca más en la vida», me dijo. ¿Hubo una noche difícil en el negocio? [[R03]]\n`);
  c.escribir('salidas/primera_pagina.md', 'Me llamo Nélida y nací en 1948 en Rosario, tengo dos hijos. En el 78 abrimos la mercería con Raúl en la calle Mendoza. [[R01,R02]]\n');
  c.escribir('salidas/capitulo_02.md', c.leer('salidas/capitulo_02.md').replace(' [[R06]]', ''));
  return c;
}

describe('controlar: lo mismo que controles.mjs', () => {
  it('registro bien y roto', () => {
    const c = carpetaNelida();
    mismoArchivo(c, comparar(c, 'registro').dir, 'controles/registro.json');
    const reg = JSON.parse(c.leer('salidas/registro.json'));
    reg.voz.frases = reg.voz.frases.slice(0, 10);
    reg.episodios[0].a_quien = 'todos';
    reg.episodios[2].detalles = [];
    c.escribir('salidas/registro.json', JSON.stringify(reg));
    c.escribir('entradas/confirmado.xml', '- La Negra se llamaba Ofelia.');
    const r = comparar(c, 'registro');
    expect(r.codigo).toBe(2);
    mismoArchivo(c, r.dir, 'controles/registro.json');
  });

  it('plan bien y roto', () => {
    const c = carpetaNelida();
    mismoArchivo(c, comparar(c, 'plan').dir, 'controles/plan.json');
    const plan = JSON.parse(c.leer('salidas/plan.json'));
    plan.capitulos[1].apertura.tipo = 'escena';
    plan.titulo_libro = { texto: 'Una etapa linda', id: '' };
    c.escribir('salidas/plan.json', JSON.stringify(plan));
    const r = comparar(c, 'plan');
    expect(r.codigo).toBe(2);
    mismoArchivo(c, r.dir, 'controles/plan.json');
  });

  it('piezas bien, con fallas y con cotejo después del arreglo', () => {
    const limpia = carpetaNelida();
    mismoArchivo(limpia, comparar(limpia, 'piezas').dir, 'controles/piezas.json');
    const c = sembrada();
    const r = comparar(c, 'piezas');
    expect(r.codigo).toBe(2);
    mismoArchivo(c, r.dir, 'controles/piezas.json');
    c.escribir('arreglos/respuesta-cap_1.txt', 'x\n---\n{"cambios": []}');
    c.escribir('salidas/cotejo.json', JSON.stringify({ faltan: [{ id: 'R03', frase: 'Tito ladraba por el camión de la basura' }, { id: 'R99', frase: 'nada' }] }));
    mismoArchivo(c, comparar(c, 'piezas').dir, 'controles/piezas.json');
  });

  it('repite (C7 de la primera página contra el resto)', () => {
    const c = sembrada();
    const r = comparar(c, 'repite', 'primera_pagina');
    expect(r.codigo).toBe(2);
    mismoArchivo(c, r.dir, 'controles/repite-primera_pagina.json');
  });

  it('arreglo (C9) y repaso (C26)', () => {
    const c = carpetaNelida();
    c.escribir('arreglos/problemas-cap_1.json', JSON.stringify([
      { n: 1, origen: 'verificador', tipo: 'presente', frase: 'Raúl puso la calculadora en la mesa', correccion: 'puso' },
      { n: 2, origen: 'código C31', tipo: 'puntos', frase: 'Una noche la cuenta no daba.' },
      { n: 3, origen: 'verificador', tipo: 'fecha', frase: 'Marcela nació en el 80' },
    ], null, 1));
    c.escribir('arreglos/respuesta-cap_1.txt', `${c.leer('salidas/capitulo_01.md').trim().replace('Una noche la cuenta no daba.', 'Una noche, la cuenta no daba.')}\n---\n${JSON.stringify({ cambios: [{ problema: 1, resultado: 'disputa', disputa_id: 'R03', disputa_frase: 'Raúl me puso la calculadora en la mesa', antes: '', despues: '' }, { problema: 2, resultado: 'cambiado', antes: 'Una noche la cuenta no daba.', despues: 'Una noche, la cuenta no daba.' }, { problema: 3, resultado: 'cambiado', antes: 'x', despues: 'y' }] }, null, 1)}\n`);
    const a = comparar(c, 'arreglo', 'cap_1');
    mismoArchivo(c, a.dir, 'controles/c9-cap_1.json');
    c.escribir('salidas/hechos-repaso.json', JSON.stringify({ problemas: [{ pieza: 'cap_1', tipo: 'pasado', frase: 'Raúl puso la calculadora en la mesa', ids: ['R03'] }, { pieza: 'cap_1', tipo: 'contradice_decision', frase: 'x' }] }));
    mismoArchivo(c, comparar(c, 'repaso').dir, 'controles/repaso.json');
  });
});

describe('C10 y el trato del registro (revisión final, punto 3)', () => {
  const conTrato = (trato: string): Carpeta => {
    const c = carpetaNelida();
    const reg = JSON.parse(c.leer('salidas/registro.json'));
    reg.voz.trato = trato;
    c.escribir('salidas/registro.json', JSON.stringify(reg));
    c.escribir('salidas/capitulo_01.md', `${c.leer('salidas/capitulo_01.md')}\nVos ya lo sabés, nena. [[R03]]\n`);
    return c;
  };
  const voseo = (c: Carpeta) => controlar(c, 'piezas').problemas.filter((p) => p.control === 'C10' && p.que === 'voseo en un libro que tutea');

  it('"tú" con tilde (castellano de España) también prende C10 ante el voseo', () => {
    expect(voseo(conTrato('tú'))).toHaveLength(1);
    expect(voseo(conTrato('Tú'))).toHaveLength(1);
    expect(voseo(conTrato('tu'))).toHaveLength(1);
    expect(voseo(conTrato('vos'))).toHaveLength(0);
  });
});
