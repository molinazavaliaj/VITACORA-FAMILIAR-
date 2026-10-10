// estilo.mjs e informe.mjs, portados: misma baranda, mismos archivos, mismo informe.
import assert from 'node:assert/strict';
import { describe, expect, it, test } from 'vitest';
import { Carpeta } from '../../src/escritor/carpeta.js';
import { aplicarEstilo, aplicarEstiloPieza, barandaEstilo } from '../../src/escritor/controles/estilo.js';
import { informe } from '../../src/escritor/controles/informe.js';
import * as M from '../../scripts/escritor-v55/estilo.mjs';
import * as I from '../../scripts/escritor-v55/informe.mjs';
import { aDisco, carpetaNelida, correrMjs, mismoArchivo } from './ayuda.js';

const cambios = [
  { antes: 'Raúl puso la calculadora en la mesa de la cocina', despues: 'Raúl puso la calculadora sobre la mesa de la cocina', por_que: 'sintaxis' },
  { antes: 'Marcela nació en el 80', despues: 'Marcela nació en el 81', por_que: 'sintaxis' },
  { antes: 'con Raúl en la calle Mendoza', despues: 'en la calle Mendoza', por_que: 'sintaxis' },
  { antes: 'no está en la pieza', despues: 'x', por_que: 'sintaxis' },
];

describe('estilo (Paso 7): misma baranda que estilo.mjs', () => {
  it('barandaEstilo y aplicarEstilo', () => {
    const t = carpetaNelida().leer('salidas/capitulo_01.md');
    for (const x of cambios) expect(barandaEstilo(x, t, ['Raúl', 'Marcela'])).toBe(M.barandaEstilo(x, t, ['Raúl', 'Marcela']));
    expect(aplicarEstilo(t, cambios, ['Raúl'])).toEqual(M.aplicarEstilo(t, cambios, ['Raúl']));
  });

  it('aplicarEstiloPieza, ronda 1 y 2, y una pieza sin cambios', () => {
    const c = carpetaNelida();
    c.escribir('estilo/cambios-cap_1.json', JSON.stringify({ cambios }));
    c.escribir('estilo/cambios-cap_1-2.json', JSON.stringify({ cambios: [{ antes: 'Una noche la cuenta no daba.', despues: 'Una noche, la cuenta no daba.', por_que: 'puntuacion' }] }));
    const dir = aDisco(c);
    expect(`${aplicarEstiloPieza(c, 'cap_1', 1)}\n`).toBe(correrMjs('estilo.mjs', [dir, 'cap_1']).salida);
    expect(`${aplicarEstiloPieza(c, 'cap_1', 2)}\n`).toBe(correrMjs('estilo.mjs', [dir, 'cap_1', '2']).salida);
    // sin cambios: el original imprime la ruta absoluta en disco; acá va la de la carpeta
    const sin = correrMjs('estilo.mjs', [dir, 'carta']).salida;
    expect(sin.replace(/\(no hay .*cambios-carta\.json\)/, '(no hay estilo/cambios-carta.json)')).toBe(`${aplicarEstiloPieza(c, 'carta', 1)}\n`);
    for (const r of ['salidas/capitulo_01.md', 'estilo/antes-cap_1.md', 'estilo/aplicado-cap_1.json', 'estilo/antes-cap_1-2.md', 'estilo/aplicado-cap_1-2.json']) mismoArchivo(c, dir, r);
  });
});

describe('informe', () => {
  it('da el mismo informe.md que informe.mjs', () => {
    const c = carpetaNelida();
    c.escribir('controles/piezas-1.json', JSON.stringify([{ pieza: 'cap_1', control: 'C2', que: 'cortada', frase: 'y entonces…' }]));
    c.escribir('controles/piezas.json', JSON.stringify([{ pieza: 'cap_1', control: 'C24', que: 'falta frase de R03', frase: '' }, { pieza: 'cap_2', control: 'C31', que: 'puntos', frase: 'Corto.' }]));
    c.escribir('controles/c9-cap_1.json', JSON.stringify({ abiertos: [{ n: 1, estado: 'disputa', id: 'R03', cita: 'sumá vos', frase: 'f' }, { n: 2, estado: 'sigue', tipo: 'fecha', frase: 'Marcela nació en el 80' }], identicos: 60 }));
    c.escribir('arreglos/respuesta-cap_1.txt', 'texto\n---\n{"cambios": [{"problema": 3, "resultado": "no_aplicado"}]}');
    c.escribir('arreglos/disputa-cap_1-1.json', '{"respalda": false, "por_que": "R03 no dice eso"}');
    c.escribir('controles/repaso.json', JSON.stringify({ nuevos: [{ pieza: 'cap_1', tipo: 'pasado', frase: 'x', correccion: 'y' }], oscila: [], contradice: [] }));
    c.escribir('arreglos/problemas-sus_frases.json', JSON.stringify([{ n: 1, origen: 'código C6', tipo: 'cita', frase: 'f', que: 'no textual' }]));
    c.escribir('libro.md', '# sumá vos\n\nuna dos tres\n');
    expect(informe(c)).toBe(I.informe(aDisco(c)));
  });
});

// ---- tests originales, copiados ----
const pieza = 'Cuando por fin conseguimos el local no había nada, y lo primero que puse fue el mostrador, porque siempre donde llego a un lugar lo primero que hago es el mostrador. [[R05]]\n\nRaúl abrió en el 78 con la plata del Renault. [[R22]]';

test('Paso 7 (v5.3): la baranda deja pasar un cambio de forma', () => {
  const c = { antes: 'porque siempre donde llego a un lugar lo primero que hago es el mostrador. [[R05]]', despues: 'porque cada vez que llego a un lugar nuevo lo primero que armo es el mostrador. [[R05]]', por_que: 'sintaxis' };
  assert.equal(barandaEstilo(c, pieza), '');
});

test('Paso 7 (v5.3): la baranda frena lo que toca hechos o marcas', () => {
  const b = (antes: string, despues: string) => barandaEstilo({ antes, despues, por_que: 'sintaxis' }, pieza);
  assert.match(b('Raúl abrió en el 78 con la plata del Renault. [[R22]]', 'Raúl abrió en el 79 con la plata del Renault. [[R22]]'), /números/);
  assert.match(b('Raúl abrió en el 78 con la plata del Renault. [[R22]]', 'Abrimos en el 78 con la plata del auto. [[R22]]'), /nombres/);
  assert.match(b('Raúl abrió en el 78 con la plata del Renault. [[R22]]', 'Raúl abrió en el 78 con la plata del Renault.'), /marcas/);
  assert.match(b('no está en la pieza', 'algo'), /no está tal cual/);
  assert.match(b('Raúl abrió en el 78 con la plata del Renault. [[R22]]', 'Raúl, 78, Renault. [[R22]]'), /largo/);
});

test('Paso 7 (v5.3): un nombre del registro que abre la oración tampoco se pierde', () => {
  assert.equal(barandaEstilo({ antes: 'Raúl abrió en el 78 con la plata del Renault. [[R22]]', despues: 'Abrí en el 78 con la plata del Renault, sola. [[R22]]' }, pieza), '');
  assert.match(barandaEstilo({ antes: 'Raúl abrió en el 78 con la plata del Renault. [[R22]]', despues: 'Abrí en el 78 con la plata del Renault, sola. [[R22]]' }, pieza, ['Raúl']), /Raul|raul/);
});

test('Paso 7 (v5.3): aplicarEstilo aplica lo que pasa y devuelve lo frenado', () => {
  const { texto, aplicados, frenados } = aplicarEstilo(pieza, [
    { antes: 'siempre donde llego a un lugar', despues: 'cada vez que llego a un lugar', por_que: 'sintaxis' },
    { antes: 'en el 78', despues: 'en el 80', por_que: 'palabra' },
  ]);
  assert.equal(aplicados.length, 1);
  assert.equal(frenados.length, 1);
  assert.ok(texto.includes('cada vez que llego a un lugar'));
  assert.ok(texto.includes('en el 78'));
});

test('Paso 7 (v5.3.1): la baranda lee números en letras ("fútbol once" → "fútbol 11", "piso tres" → "tercer piso")', () => {
  const t = 'Volví al fútbol once en un club de acá. [[R07]] Vivo en un piso tres. [[R08]]';
  assert.equal(barandaEstilo({ antes: 'Volví al fútbol once en un club de acá. [[R07]]', despues: 'Volví a jugar al fútbol 11 en un club de acá. [[R07]]' }, t), '');
  assert.equal(barandaEstilo({ antes: 'Vivo en un piso tres. [[R08]]', despues: 'Vivo en un tercer piso. [[R08]]' }, t), '');
  assert.match(barandaEstilo({ antes: 'Vivo en un piso tres. [[R08]]', despues: 'Vivo en un cuarto piso. [[R08]]' }, t), /números/);
});

test('v5.4: la baranda del corrector lee números en letras en catalán', () => {
  const t = 'Visc en un pis tres de Berga. [[R08]] Vaig tornar al futbol onze. [[R07]]';
  assert.equal(barandaEstilo({ antes: 'Visc en un pis tres de Berga. [[R08]]', despues: 'Visc en un tercer pis a Berga. [[R08]]' }, t), '');
  assert.equal(barandaEstilo({ antes: 'Vaig tornar al futbol onze. [[R07]]', despues: 'Vaig tornar a jugar a futbol 11. [[R07]]' }, t), '');
  assert.match(barandaEstilo({ antes: 'Visc en un pis tres de Berga. [[R08]]', despues: 'Visc en un quart pis a Berga. [[R08]]' }, t), /números/);
});

test('Paso 7 (v5.5): la baranda deja variar una fórmula repetida si el número ya está en la pieza', () => {
  const t = 'Cuando yo tenía 14 o 15 años me echaron del colegio. [[R10]] Cuando yo tenía 14 o 15 años empecé a trabajar. [[R11]]';
  assert.equal(barandaEstilo({ antes: 'Cuando yo tenía 14 o 15 años empecé a trabajar. [[R11]]', despues: 'A esa edad empecé a trabajar. [[R11]]', por_que: 'repeticion' }, t), '');
  // si el número no está en otro lugar, se sigue frenando
  const u = 'Cuando yo tenía 14 o 15 años empecé a trabajar. [[R11]]';
  assert.match(barandaEstilo({ antes: 'Cuando yo tenía 14 o 15 años empecé a trabajar. [[R11]]', despues: 'A esa edad empecé a trabajar. [[R11]]', por_que: 'repeticion' }, u), /números/);
  // y fuera de "repeticion", también
  assert.match(barandaEstilo({ antes: 'Cuando yo tenía 14 o 15 años empecé a trabajar. [[R11]]', despues: 'A esa edad empecé a trabajar. [[R11]]', por_que: 'sintaxis' }, t), /números/);
});

function carpetaEstado(): Carpeta {
  const c = new Carpeta();
  const w = (f: string, o: unknown): void => c.escribir(f, typeof o === 'string' ? o : JSON.stringify(o));
  w('salidas/plan.json', { capitulos: [{ n: 1 }, { n: 2 }], antes_de_cerrar: { ids: ['R09'] }, faltantes: [{ que: 'la boda no tiene escena', donde: 'capítulo 2' }] });
  w('arreglos/problemas-cap_1.json', [{ n: 1, origen: 'verificador', tipo: 'presente', frase: 'Raúl tiene la mercería' }]);
  w('arreglos/problemas-sus_frases.json', [{ n: 1, origen: 'código C8', tipo: 'boton', frase: 'lo más difícil', que: 'palabras de la pregunta' }]);
  w('controles/c9-cap_1.json', { abiertos: [{ n: 1, estado: 'disputa', id: 'R02', cita: 'tiene la mercería', frase: 'Raúl tiene la mercería' }], identicos: 60 });
  w('controles/repaso.json', { nuevos: [], oscila: [{ pieza: 'cap_1', n: 1, tipo: 'presente', frase: 'Raúl tenía la mercería', ids: ['R02'], material: 'R02 tiene' }], contradice: [] });
  w('controles/piezas-1.json', [{ pieza: 'cap_1', control: 'C2', que: 'cortada', frase: 'y entonces…' }]);
  w('controles/piezas.json', [{ pieza: 'cap_1', control: 'C24', que: 'falta frase de R03: «la nena»', frase: '' }]);
  w('arreglos/disputa-cap_1-1.json', { respalda: false, por_que: 'R02 está en pasado' });
  return c;
}

test('informe: faltantes, antes/después, C24, deriva, disputas y Sus frases', () => {
  const t = informe(carpetaEstado());
  assert.match(t, /la boda no tiene escena/);
  assert.match(t, /\| cap_1 \| 1 \| 0 \|/);
  assert.match(t, /falta frase de R03/);
  assert.match(t, /60 % \(deriva\)/);
  assert.match(t, /no respalda: R02 está en pasado/);
  assert.match(t, /repaso-oscila|C26 oscila/);
  assert.match(t, /Sus frases \(no se arreglan/);
});
