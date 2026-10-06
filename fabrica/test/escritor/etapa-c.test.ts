import { describe, expect, it } from 'vitest';
import { AlmacenMemoria } from '../../src/escritor/almacen/memoria.js';
import type { Carpeta } from '../../src/escritor/carpeta.js';
import { usdDeLlamada } from '../../src/escritor/costos.js';
import { Ejecutor } from '../../src/escritor/ejecutor.js';
import { ModeloFalso } from '../../src/escritor/modelo/falso.js';
import type { Contexto } from '../../src/escritor/orquestador/contexto.js';
import { etapaC } from '../../src/escritor/orquestador/etapa-c.js';
import { carpetaNelida, carpetaParaC, DEFECTOS_NELIDA, salidasModeloNelida } from './ayuda.js';

function armarC(o: { carpeta?: Carpeta; salidas?: Record<string, string> } = {}) {
  const modelo = new ModeloFalso(o.salidas ?? salidasModeloNelida(), DEFECTOS_NELIDA);
  const almacen = new AlmacenMemoria();
  const lineas: string[] = [];
  const x: Contexto = { c: o.carpeta ?? carpetaParaC(), ej: new Ejecutor({ modelo, almacen }), almacen, log: (s) => lineas.push(s), usarLote: false };
  return { x, modelo, almacen, lineas };
}

const ESCRITURA = ['C/2h-armador-01', 'C/3b-capitulo-01', 'C/3r-resumen-cap_1', 'C/2h-armador-02', 'C/3b-capitulo-02', 'C/3r-resumen-cap_2', 'C/3d-antes-de-cerrar', 'C/3c-carta', 'C/3a-primera', 'C/3e-sus-frases'];
const PIEZAS = ['primera_pagina', 'cap_1', 'cap_2', 'antes_de_cerrar', 'carta'];

describe('Etapa C', () => {
  it('escribe el libro entero en el orden del v5.5 (sin lectura final) y lo deja en el almacén', async () => {
    const { x, modelo, almacen } = armarC();
    const r = await etapaC(x);
    const claves = modelo.llamadas.map((p) => p.clave);
    expect(claves.slice(0, 10)).toEqual(ESCRITURA);
    expect(new Set(claves.slice(10))).toEqual(new Set([
      'C/4-hechos', 'C/5c-veedor',
      ...PIEZAS.map((p) => `C/7-estilo-${p}`), ...PIEZAS.map((p) => `C/7-estilo-${p}-2`),
      'C/3t-titulo-01', 'C/3t-titulo-02',
    ]));
    expect(claves.some((k) => k.includes('lectura'))).toBe(false);
    expect(r.libro.split('\n').filter((l) => l.startsWith('# '))).toEqual(['# sumá vos', '# I · La persiana de madera', '# II · El bastidor en la falda', '# Antes de cerrar', '# Sus frases', '# Para los míos']);
    expect(r.libro).toContain('Una noche la cuenta no daba.');
    expect(r.libro).not.toContain('[[R');
    expect(r).toMatchObject({ capitulos: 2, arreglados: [], disputas: 0 });
    const esperado = modelo.llamadas.reduce((s, p) => s + usdDeLlamada(p.modelo, { input_tokens: 1000, output_tokens: 100 }, { lote: false }), 0);
    expect(r.usd).toBe(Math.round(esperado * 1e6) / 1e6);
    // Configuración económica: xhigh solo en capítulos y primera página; Haiku en lo mecánico; Opus medio en lo demás.
    const como = (p: { modelo: string; esfuerzo?: string }) => `${p.modelo}${p.esfuerzo ? ` ${p.esfuerzo}` : ''}`;
    const por = Object.fromEntries(modelo.llamadas.map((p) => [p.clave, como(p)]));
    for (const k of ['C/3b-capitulo-01', 'C/3b-capitulo-02', 'C/3a-primera']) expect(por[k], k).toBe('claude-opus-5-5 xhigh');
    for (const k of ['C/2h-armador-01', 'C/3c-carta', 'C/3d-antes-de-cerrar', 'C/5c-veedor', 'C/4-hechos']) expect(por[k], k).toBe('claude-opus-5-5 medium');
    for (const k of ['C/3r-resumen-cap_1', 'C/3e-sus-frases', 'C/7-estilo-cap_1', 'C/7-estilo-carta-2', 'C/3t-titulo-01']) expect(por[k], k).toBe('claude-haiku-4-5');
    for (const k of ['libro.md', 'informe.md', 'carpeta-C.json', 'costos.json']) expect(await almacen.leer(k), k).not.toBeNull();
    expect(x.c.existe('sin-revision/capitulo_01.md') && x.c.existe('sin-estilo/carta.md')).toBe(true);
  });

  it('un problema de hechos va al arreglo (una ronda), se aplica y se repasa', async () => {
    const salidas = {
      ...salidasModeloNelida(),
      '4-hechos': JSON.stringify({ problemas: [{ pieza: 'cap_1', tipo: 'fecha', frase: 'Marcela nació en el 80', material: 'R04', ids: ['R04'], correccion: 'Marcela nació en el 80' }] }),
      '6-arreglo-cap_1': JSON.stringify({ cambios: [{ problema: 1, resultado: 'cambiado', antes: 'Marcela nació en el 80, y la nena', despues: 'Marcela nació en el 80. La nena' }] }),
    };
    const { x, modelo } = armarC({ salidas });
    const r = await etapaC(x);
    expect(modelo.llamadas.map((p) => p.clave)).toEqual(expect.arrayContaining(['C/6-arreglo-cap_1', 'C/4-hechos-repaso']));
    expect(r.arreglados).toEqual(['cap_1']);
    expect(r.libro).toContain('Marcela nació en el 80. La nena dormía');
    expect(x.c.existe('controles/c9-cap_1.json') && x.c.existe('controles/piezas-1.json')).toBe(true);
  });

  it('capítulo con más de un tercio afuera (C30) y primera página que repite (C7): una sola reescritura cada uno', async () => {
    const n = salidasModeloNelida();
    const afuera = JSON.stringify({ afuera: [{ id: 'R10', a_donde: 'cap_2', por_que: 'es de después' }, { id: 'R04', a_donde: 'linea' }, { id: 'R01', a_donde: 'no_entra' }] });
    const capMalo = n['3b-capitulo-01'].replace('{"afuera": []}', afuera);
    const primeraMala = 'Me llamo Nélida y nací en 1948 en Rosario, tengo dos hijos. En el 78 abrimos la mercería con Raúl en la calle Mendoza. [[R01,R02]]\n';
    const { x, modelo } = armarC({ salidas: { ...n, '3b-capitulo-01': capMalo, '3b-capitulo-01#2': capMalo, '3a-primera': primeraMala, '3a-primera#2': primeraMala } });
    await etapaC(x);
    const claves = modelo.llamadas.map((p) => p.clave);
    expect(claves.filter((k) => k.startsWith('C/3b-capitulo-01'))).toEqual(['C/3b-capitulo-01', 'C/3b-capitulo-01#2']);
    expect(claves.filter((k) => k.startsWith('C/3a-primera'))).toEqual(['C/3a-primera', 'C/3a-primera#2']);
    expect(modelo.llamadas.find((p) => p.clave === 'C/3b-capitulo-01#2')?.bloques.join('\n')).toContain('más de un tercio');
  });

  it('un solo capítulo (la prueba paga): solo sus llamadas, más hechos y veedor sobre el libro', async () => {
    const { x, modelo } = armarC({ carpeta: carpetaNelida() });
    await etapaC(x, { soloCapitulo: 2 });
    expect(new Set(modelo.llamadas.map((p) => p.clave))).toEqual(new Set([
      'C/2h-armador-02', 'C/3b-capitulo-02', 'C/3r-resumen-cap_2', 'C/4-hechos', 'C/5c-veedor', 'C/7-estilo-cap_2', 'C/7-estilo-cap_2-2', 'C/3t-titulo-02',
    ]));
    expect(x.c.leer('libro.md')).toContain('# II · El bastidor en la falda');
  });
});
