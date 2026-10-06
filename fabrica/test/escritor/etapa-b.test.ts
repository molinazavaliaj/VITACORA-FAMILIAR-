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

  it('con correcciones: el modelo barato las pasa al registro, C14 controla y el plan sigue', async () => {
    const reg = JSON.parse(salidasModeloNelida()['1-registro']);
    const negra = { ...reg.personas[3], nombre: 'Ofelia Sánchez', apodos: ['la Negra'] };
    const { x, modelo, almacen } = armar({ 'correccion-registro': JSON.stringify({ personas: [negra], confirmados: [CONFIRMADO] }) });
    expect(await etapaB(x, [CORRECCION])).toEqual({ ok: true, corregido: 'barato' });
    expect(modelo.llamadas.map((p) => [p.clave, p.modelo, p.esfuerzo])).toEqual([['B/correccion-registro', 'claude-sonnet-5-5', 'low']]);
    expect(leerJSON(x.c, 'salidas/registro.json').personas[3].nombre).toBe('Ofelia Sánchez');
    expect(x.c.leer('entradas/confirmado.xml')).toContain('- La Negra se llamaba Ofelia Sánchez.');
    expect(await almacen.leer('carpeta-B.json')).not.toBeNull();
  });

  it('si lo del barato no pasa C14, Opus rehace el registro y el plan', async () => {
    const reg = JSON.parse(salidasModeloNelida()['1-registro']);
    const { x, modelo } = armar({
      'correccion-registro': JSON.stringify({ confirmados: [] }),
      '1-registro': JSON.stringify({ ...reg, confirmados: [CONFIRMADO] }),
      '2-plan': salidasModeloNelida()['2-plan'],
    });
    expect(await etapaB(x, [CORRECCION])).toEqual({ ok: true, corregido: 'opus' });
    expect(modelo.llamadas.map((p) => [p.clave, p.modelo])).toEqual([['B/correccion-registro', 'claude-sonnet-5-5'], ['B/1-registro', 'claude-opus-5-5'], ['B/2-plan', 'claude-opus-5-5']]);
    expect(modelo.llamadas[1].bloques.join('\n')).toContain('<confirmado_por_el_narrador>');
  });
});
