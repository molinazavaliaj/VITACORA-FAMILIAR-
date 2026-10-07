// fabrica/test/escritor/llamadas.test.ts
// Cada llamada es el mismo texto que dejaba `node llamada.mjs <carpeta> <paso>` en llamadas/<nombre>.txt.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Carpeta } from '../../src/escritor/carpeta.js';
import * as A from '../../src/escritor/llamadas/armar.js';
import { aDisco, carpetaNelida, correrMjs } from './ayuda.js';

function preparada(idiomaFicha: string): Carpeta {
  const c = carpetaNelida();
  if (idiomaFicha) c.escribir('entradas/ficha.xml', c.leer('entradas/ficha.xml').replace('</ficha>', `${idiomaFicha}\n</ficha>`));
  c.escribir('salidas/historias/cap_1.md', 'La casa, la mercería y la noche de la calculadora.');
  c.escribir('salidas/resumenes/cap_1.md', 'Echesortu, la mercería con Raúl, la noche de la calculadora.\nFrases suyas usadas: "sumá vos".');
  c.escribir('pendientes/cap_2.json', '["R10"]');
  c.escribir('controles/registro.json', JSON.stringify(['C14 voz: 12 frases (van de 15 a 20)'], null, 1));
  c.escribir('controles/afuera-cap_2.json', JSON.stringify({ afuera: [{ id: 'R07', a_donde: 'linea' }], fuera: 1, propias: 3, demasiado: false }, null, 1));
  c.escribir('controles/repite-primera_pagina.json', JSON.stringify([{ pieza: 'primera_pagina', control: 'C7', frase: 'la mercería con raúl en la' }], null, 1));
  c.escribir('arreglos/problemas-cap_1.json', JSON.stringify([{ n: 1, origen: 'verificador', tipo: 'fecha', frase: 'Marcela nació en el 80', que: 'R04', ids: ['R04'], correccion: 'Marcela nació en el 80' }], null, 1));
  c.escribir('arreglos/respuesta-cap_1.txt', `${c.leer('salidas/capitulo_01.md').trim()}\n---\n{"cambios": [{"problema": 1, "resultado": "sin_cambio"}]}\n`);
  return c;
}

/** Corre llamada.mjs y devuelve el texto que dejó en llamadas/<nombre>.txt. */
function delMjs(dir: string, args: string[], nombre: string, env: Record<string, string> = {}): string {
  correrMjs('llamada.mjs', [dir, ...args], env);
  return readFileSync(path.join(dir, 'llamadas', `${nombre}.txt`), 'utf8');
}

for (const idiomaFicha of ['', 'Idioma del libro: catalán']) {
  describe(`llamadas: el mismo texto que llamada.mjs${idiomaFicha ? ' (catalán)' : ''}`, () => {
    const c = preparada(idiomaFicha);
    const dir = aDisco(c);
    const err = (r: string) => path.join(dir, r);
    const casos: [string, () => A.Llamada | null, string[], string, Record<string, string>?][] = [
      ['registro', () => A.llamadaRegistro(c), ['registro'], '1-registro'],
      ['registro con error', () => A.llamadaRegistro(c, { error: c.leer('controles/registro.json') }), ['registro'], '1-registro', { ERROR: err('controles/registro.json') }],
      ['plan', () => A.llamadaPlan(c), ['plan'], '2-plan'],
      ['armador 1', () => A.llamadaArmador(c, 1), ['armador', '1'], '2h-armador-01'],
      ['armador 2', () => A.llamadaArmador(c, 2), ['armador', '2'], '2h-armador-02'],
      ['capítulo 1', () => A.llamadaCapitulo(c, 1), ['capitulo', '1'], '3b-capitulo-01', { PURO: '1' }],
      ['capítulo 2 de nuevo', () => A.llamadaCapitulo(c, 2, { error: c.leer('controles/afuera-cap_2.json') }), ['capitulo', '2'], '3b-capitulo-02', { PURO: '1', ERROR: err('controles/afuera-cap_2.json') }],
      ['resumen cap_1', () => A.llamadaResumen(c, 'cap_1'), ['resumen', 'cap_1'], '3r-resumen-cap_1'],
      ['antes de cerrar', () => A.llamadaAntes(c), ['antes'], '3d-antes-de-cerrar', { PURO: '1' }],
      ['carta', () => A.llamadaCarta(c), ['carta'], '3c-carta', { PURO: '1' }],
      ['primera', () => A.llamadaPrimera(c), ['primera'], '3a-primera', { PURO: '1' }],
      ['primera de nuevo', () => A.llamadaPrimera(c, { error: c.leer('controles/repite-primera_pagina.json') }), ['primera'], '3a-primera', { PURO: '1', ERROR: err('controles/repite-primera_pagina.json') }],
      ['sus frases', () => A.llamadaSusFrases(c), ['sus_frases_llamada'], '3e-sus-frases'],
      ['hechos', () => A.llamadaHechos(c, { repaso: false }), ['hechos'], '4-hechos'],
      ['hechos repaso', () => A.llamadaHechos(c, { repaso: true }), ['hechos', 'repaso'], '4-hechos-repaso'],
      ['veedor', () => A.llamadaVeedor(c), ['veedor'], '5c-veedor'],
      ['arreglo cap_1', () => A.llamadaArreglo(c, 'cap_1'), ['arreglo', 'cap_1'], '6-arreglo-cap_1', { PURO: '1' }],
      ['estilo cap_1', () => A.llamadaEstilo(c, 'cap_1', 1), ['estilo', 'cap_1'], '7-estilo-cap_1'],
      ['estilo cap_1, segunda pasada', () => A.llamadaEstilo(c, 'cap_1', 2), ['estilo', 'cap_1'], '7-estilo-cap_1-2', { RONDA: '2' }],
      ['título 2', () => A.llamadaTitulo(c, 2), ['titulo', '2'], '3t-titulo-02'],
    ];
    for (const [nombre, ts, args, archivo, env] of casos) {
      it(nombre, () => {
        const l = ts();
        if (!l) throw new Error(`${nombre}: no hubo llamada`);
        expect(l.nombre).toBe(archivo);
        // 07/10: el verificador recibe el registro recortado (registroParaHechos); lo demás, igual que llamada.mjs.
        const igual = archivo.startsWith('4-hechos')
          ? { ...l, docs: l.docs.map((d) => (d.startsWith('<registro>') ? A.tag('registro', JSON.stringify(JSON.parse(c.leer('salidas/registro.json')), null, 1)) : d)) }
          : l;
        expect(A.textoDeLlamada(igual)).toBe(delMjs(dir, args, archivo, env));
        if (archivo.startsWith('4-hechos')) expect(l.docs.find((d) => d.startsWith('<registro>'))).toBe(A.tag('registro', JSON.stringify(A.registroParaHechos(c), null, 1)));
      });
    }
  });
}

describe('lo que va al modelo', () => {
  it('es el mismo texto, sin partir las líneas largas', () => {
    const l = A.llamadaRegistro(carpetaNelida());
    expect(A.textoParaElModelo(l)).toBe(`${l.docs.join('\n\n')}\n\n${l.instr}`);
  });
  it('sin antes_de_cerrar en el plan no hay llamada', () => {
    const c = carpetaNelida();
    const plan = JSON.parse(c.leer('salidas/plan.json'));
    plan.antes_de_cerrar = { ids: [] };
    c.escribir('salidas/plan.json', JSON.stringify(plan));
    expect(A.llamadaAntes(c)).toBeNull();
  });
});

describe('el registro del verificador (07/10)', () => {
  it('sin dudas, voz ni sin_lugar; los episodios con lo que usa para verificar (estado incluido), sin detalles', () => {
    const c = carpetaNelida();
    const r = A.registroParaHechos(c);
    const entero = JSON.parse(c.leer('salidas/registro.json'));
    expect(Object.keys(r)).toEqual(Object.keys(entero).filter((k) => !['dudas', 'voz', 'sin_lugar'].includes(k)));
    expect(r.personas).toEqual(entero.personas);
    for (const [i, e] of r.episodios.entries()) {
      expect(e.estado).toBe(entero.episodios[i].estado);
      expect(e.ids).toEqual(entero.episodios[i].ids);
      expect(e).not.toHaveProperty('detalles');
    }
  });
});

