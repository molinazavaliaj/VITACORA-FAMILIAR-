// fabrica/test/escritor/etapa-b.test.ts
import { describe, expect, it } from 'vitest';
import { AlmacenMemoria } from '../../src/escritor/almacen/memoria.js';
import { leerJSON } from '../../src/escritor/carpeta.js';
import { Ejecutor } from '../../src/escritor/ejecutor.js';
import { ModeloFalso } from '../../src/escritor/modelo/falso.js';
import type { Contexto } from '../../src/escritor/orquestador/contexto.js';
import { etapaB } from '../../src/escritor/orquestador/etapa-b.js';
import { carpetaNelida, salidasModeloNelida } from './ayuda.js';

const CORRECCION = { texto: 'La Negra se llamaba Ofelia Sánchez.', dudaId: 'D01' };
const CONFIRMADO = { texto: 'La Negra se llamaba Ofelia Sánchez.', usado_en: ['P04'] };

function armar(salidas: Record<string, string>) {
  const modelo = new ModeloFalso(salidas);
  const almacen = new AlmacenMemoria();
  const x: Contexto = { c: carpetaNelida(), ej: new Ejecutor({ modelo, almacen }), almacen, log: () => {}, usarLote: false };
  return { x, modelo, almacen };
}

describe('Etapa B', () => {
  it('sin correcciones no se llama a ningún modelo', async () => {
    const { x, modelo } = armar({});
    expect(await etapaB(x, [])).toEqual({ ok: true, corregido: 'nada' });
    expect(modelo.llamadas).toHaveLength(0);
  });

  const registroCorregido = (): string => {
    const reg = JSON.parse(salidasModeloNelida()['1-registro']);
    reg.personas[3] = { ...reg.personas[3], nombre: 'Ofelia Sánchez', apodos: ['la Negra'] };
    return JSON.stringify({ ...reg, confirmados: [CONFIRMADO] });
  };

  it('con correcciones: Opus rehace registro y plan, con lo confirmado a la vista, y no se llama a Haiku', async () => {
    const { x, modelo, almacen } = armar({ '1-registro': registroCorregido(), '2-plan': salidasModeloNelida()['2-plan'] });
    expect(await etapaB(x, [CORRECCION])).toEqual({ ok: true, corregido: 'opus' });
    expect(modelo.llamadas.map((p) => [p.clave, p.modelo])).toEqual([['B/1-registro', 'claude-opus-5-5'], ['B/2-plan', 'claude-opus-5-5']]);
    expect(modelo.llamadas[0].bloques.join('\n')).toContain('<confirmado_por_el_narrador>');
    expect(leerJSON(x.c, 'salidas/registro.json').personas[3].nombre).toBe('Ofelia Sánchez');
    expect(x.c.leer('entradas/confirmado.xml')).toContain('- La Negra se llamaba Ofelia Sánchez.');
    expect(await almacen.leer('carpeta-B.json')).not.toBeNull();
  });

  it('si el registro de Opus deja afuera una respuesta, C14 lo frena y reintenta con Opus', async () => {
    const { x, modelo } = armar({ '1-registro': salidasModeloNelida()['1-registro'], '1-registro#2': registroCorregido(), '2-plan': salidasModeloNelida()['2-plan'] });
    expect(await etapaB(x, [CORRECCION])).toEqual({ ok: true, corregido: 'opus' });
    expect(modelo.llamadas.map((p) => p.clave)).toEqual(['B/1-registro', 'B/1-registro#2', 'B/2-plan']);
  });

  it('si algo se corta en medio (error de la API), lo pagado queda en costos.json', async () => {
    const { x, almacen } = armar({ '1-registro': registroCorregido() });
    await expect(etapaB(x, [CORRECCION])).rejects.toThrow();
    expect(JSON.parse((await almacen.leer('costos.json')) as string).filas.length).toBeGreaterThanOrEqual(1);
    expect(await almacen.leer('carpeta-B.json')).toBeNull();
  });

  it('retomo: las llamadas ya pagadas salen de la memoria', async () => {
    const salidas = { '1-registro': registroCorregido(), '2-plan': salidasModeloNelida()['2-plan'] };
    const a = armar(salidas);
    await etapaB(a.x, [CORRECCION]);
    const modelo2 = new ModeloFalso(salidas);
    const x2: Contexto = { c: carpetaNelida(), ej: new Ejecutor({ modelo: modelo2, almacen: a.almacen }), almacen: a.almacen, log: () => {}, usarLote: false };
    expect(await etapaB(x2, [CORRECCION])).toEqual({ ok: true, corregido: 'opus' });
    expect(modelo2.llamadas).toHaveLength(0);
  });
});

describe('Etapa B arranca de la carpeta de la Etapa A (revisión final, punto 10)', () => {
  const OTRA = { texto: 'Raúl era de Rosario.', dudaId: 'D02' };
  const salidasDos = () => {
    const reg = JSON.parse(salidasModeloNelida()['1-registro']);
    return { '1-registro': JSON.stringify({ ...reg, confirmados: [CONFIRMADO, { texto: 'Raúl era de Rosario.', usado_en: ['P01'] }] }), '2-plan': salidasModeloNelida()['2-plan'] };
  };

  it('dos corridas desde el snapshot A dan el mismo confirmado.xml (aunque las correcciones se pisen)', async () => {
    const { x, almacen } = armar(salidasDos());
    await almacen.escribir('carpeta-A.json', JSON.stringify(carpetaNelida().aObjeto()));
    // Primera vuelta con una corrección; después la familia agrega otra (la primera se repite).
    expect((await etapaB(x, [CORRECCION])).ok).toBe(true);
    expect((await etapaB(x, [CORRECCION, OTRA])).ok).toBe(true);
    const limpio = armar(salidasDos());
    await limpio.almacen.escribir('carpeta-A.json', JSON.stringify(carpetaNelida().aObjeto()));
    expect((await etapaB(limpio.x, [CORRECCION, OTRA])).ok).toBe(true);
    expect(x.c.leer('entradas/confirmado.xml')).toBe(limpio.x.c.leer('entradas/confirmado.xml'));
    expect(x.c.leer('entradas/confirmado.xml').match(/^- La Negra/gm)).toHaveLength(1);
  });

  it('sin snapshot A (Etapa A corrida en otro lado), usa la carpeta que recibe', async () => {
    const { x } = armar({});
    x.c.escribir('entradas/extra.txt', 'queda');
    expect(await etapaB(x, [])).toEqual({ ok: true, corregido: 'nada' });
    expect(x.c.leer('entradas/extra.txt')).toBe('queda');
  });
});
