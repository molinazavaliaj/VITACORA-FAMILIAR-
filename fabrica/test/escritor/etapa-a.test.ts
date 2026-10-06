import { describe, expect, it } from 'vitest';
import { AlmacenMemoria } from '../../src/escritor/almacen/memoria.js';
import type { Carpeta } from '../../src/escritor/carpeta.js';
import { Ejecutor } from '../../src/escritor/ejecutor.js';
import { ModeloFalso } from '../../src/escritor/modelo/falso.js';
import { cargarSnapshot, type Contexto } from '../../src/escritor/orquestador/contexto.js';
import { etapaA } from '../../src/escritor/orquestador/etapa-a.js';
import { carpetaNelida, salidasModeloNelida } from './ayuda.js';

function armar(salidas: Record<string, string>, c: Carpeta = carpetaNelida(['entradas'])) {
  const modelo = new ModeloFalso(salidas);
  const almacen = new AlmacenMemoria();
  const lineas: string[] = [];
  const x: Contexto = { c, ej: new Ejecutor({ modelo, almacen }), almacen, log: (s) => lineas.push(s), usarLote: false };
  return { x, modelo, almacen, lineas };
}
const registroRoto = (): string => { const r = JSON.parse(salidasModeloNelida()['1-registro']); r.voz.frases = r.voz.frases.slice(0, 10); return JSON.stringify(r); };

describe('Etapa A', () => {
  it('registro, plan y dudas para la familia; deja la carpeta y los costos en el almacén', async () => {
    const { x, modelo, almacen } = armar(salidasModeloNelida());
    const r = await etapaA(x);
    expect(r).toMatchObject({ ok: true, capitulos: 2, dudas: [{ id: 'D01', tipo: 'nombre', pregunta: '¿Cómo se llamaba la Negra, la amiga del barrio de Nélida?' }] });
    expect(modelo.llamadas.map((p) => p.clave)).toEqual(['A/1-registro', 'A/2-plan', 'A/dudas']);
    expect(modelo.llamadas[0].maxTokens).toBe(128000);
    expect(JSON.parse(x.c.leer('salidas/dudas-familia.json')).dudas[0].id).toBe('D01');
    expect(await almacen.leer('dudas-familia.json')).toBe(x.c.leer('salidas/dudas-familia.json'));
    expect((await cargarSnapshot(almacen, 'A'))?.aObjeto()).toEqual(x.c.aObjeto());
    expect(JSON.parse((await almacen.leer('costos.json')) as string).filas).toHaveLength(3);
  });

  it('si el registro no pasa C14, reintenta con el error pegado al final', async () => {
    const { x, modelo } = armar({ ...salidasModeloNelida(), '1-registro': registroRoto(), '1-registro#2': salidasModeloNelida()['1-registro'] });
    expect((await etapaA(x)).ok).toBe(true);
    expect(modelo.llamadas.map((p) => p.clave)).toEqual(['A/1-registro', 'A/1-registro#2', 'A/2-plan', 'A/dudas']);
    const instr = modelo.llamadas[1].bloques[modelo.llamadas[1].bloques.length - 1];
    expect(instr).toContain('Tu respuesta anterior no pasó estos controles');
    expect(instr).toContain('C14 voz: 10 frases (van de 15 a 20)');
  });

  it('después de 2 reintentos sin pasar, corta y avisa', async () => {
    const { x, modelo, almacen } = armar({ ...salidasModeloNelida(), '1-registro': registroRoto() });
    expect(await etapaA(x)).toEqual({ ok: false, motivo: 'el registro no pasa C14 después de 2 reintentos' });
    expect(modelo.llamadas.map((p) => p.clave)).toEqual(['A/1-registro', 'A/1-registro#2', 'A/1-registro#3']);
    // Lo pagado queda en costos.json aunque la etapa corte.
    expect(JSON.parse((await almacen.leer('costos.json')) as string).filas).toHaveLength(3);
  });

  it('si el registro y el plan ya estaban y pasan, no se llaman', async () => {
    const { x, modelo } = armar(salidasModeloNelida(), carpetaNelida());
    expect((await etapaA(x)).ok).toBe(true);
    expect(modelo.llamadas.map((p) => p.clave)).toEqual(['A/dudas']);
  });
});
