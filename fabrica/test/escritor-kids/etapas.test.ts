import { describe, expect, it } from 'vitest';
import { AlmacenMemoria } from '../../src/escritor/almacen/memoria.js';
import { cargarSnapshot } from '../../src/escritor/orquestador/contexto.js';
import { TopeDeGasto } from '../../src/escritor/ejecutor.js';
import { parteFalsa } from '../../src/escritor-kids/falso.js';
import { correrKids, etapaAKids, etapaBKids, etapaCKids, RUTA_FRENADO, RUTA_LIBERADO } from '../../src/escritor-kids/orquestador.js';
import { armarKids } from './ayuda.js';

const LECTURA_PREOCUPANTE = JSON.stringify({
  preocupante: [{ ids: ['R07'], cita: 'Pero cuando se enoja mucho me pega.', por_que: 'dice que su papá le pega cuando se enoja' }],
  dudas: [], su_voz: ['R07', 'R04', 'R02'], notas: '',
});

describe('libro de Kids: las etapas con el modelo falso', () => {
  it('corre entero: A, B en un lote (4 partes, sobre y álbum), C con veedores y el arreglo de la parte marcada', async () => {
    const { x, modelo, lote, almacen } = armarKids('chico-inventado', { lote: true });
    const r = await correrKids(x);
    expect(r).toMatchObject({ estado: 'listo', arregladas: [3], problemasFinales: 0 });
    expect(modelo.llamadas.map((p) => p.clave)).toEqual([
      'A/kids-leer',
      'B/kids-parte-1', 'B/kids-parte-2', 'B/kids-parte-3', 'B/kids-parte-4', 'B/kids-sobre', 'B/kids-album',
      'C/kids-veedor-1', 'C/kids-veedor-2', 'C/kids-veedor-3', 'C/kids-veedor-4',
      'C/kids-arreglo-3',
    ]);
    expect(lote?.grupos).toEqual(['B-escritura', 'C-veedor', 'C-arreglo']);
    // Documentos primero, instrucciones al final, la línea fija antes de todo.
    const parte2 = modelo.llamadas[2];
    expect(parte2.bloques[0]).toContain('chico inventado (Tomi)');
    expect(parte2.bloques[1]).toMatch(/^<ficha>/);
    expect(parte2.bloques[2]).toMatch(/^<parte n="2" titulo="Mi gente">/);
    expect(parte2.bloques[3]).toContain('Estás armando la parte 2, «Mi gente», del libro de Benja');
    expect(parte2).toMatchObject({ modelo: 'claude-opus-5-5', esfuerzo: 'medium' });
    const arreglo = modelo.llamadas.at(-1)!;
    expect(arreglo.bloques[3]).toMatch(/^<piezas_con_problemas>/);
    expect(arreglo.bloques[4]).toContain('"K22"');
    for (const etapa of ['A', 'B', 'C'] as const) expect(await cargarSnapshot(almacen, etapa)).not.toBeNull();
    for (const a of ['libro.md', 'sobre.md', 'informe.md', 'costos.json']) expect(await almacen.leer(a), a).not.toBeNull();
  });

  it('volver a correr no paga nada: todo sale de los checkpoints', async () => {
    const almacen = new AlmacenMemoria();
    await correrKids(armarKids('chico-inventado', { almacen }).x);
    const otra = armarKids('chico-inventado', { almacen });
    expect((await correrKids(otra.x)).estado).toBe('listo');
    expect(otra.modelo.llamadas).toHaveLength(0);
  });

  it('algo preocupante: frena en A, escribe frenado.json, avisa una vez y no escribe nada', async () => {
    const almacen = new AlmacenMemoria();
    const a = armarKids('chico-preocupante', { almacen, salidas: { 'kids-leer': LECTURA_PREOCUPANTE } });
    const r = await correrKids(a.x);
    expect(r.estado).toBe('frenado');
    expect(a.modelo.llamadas.map((p) => p.clave)).toEqual(['A/kids-leer']);
    const frenado = JSON.parse((await almacen.leer(RUTA_FRENADO)) as string);
    expect(frenado.preocupante[0].ids).toEqual(['R07']);
    expect(frenado.texto).toContain('«Pero cuando se enoja mucho me pega.»');
    expect(a.avisos).toHaveLength(1);
    expect(a.avisos[0]).toContain('Libro de Kids frenado: Benja');
    // Otra vuelta sin liberar: sigue frenado y no avisa de nuevo.
    const b = armarKids('chico-preocupante', { almacen, salidas: { 'kids-leer': LECTURA_PREOCUPANTE } });
    expect((await correrKids(b.x)).estado).toBe('frenado');
    expect(b.avisos).toHaveLength(0);
    expect(b.modelo.llamadas).toHaveLength(0);
  });

  it('con liberado.json sigue, y «Su voz» no lleva lo marcado como preocupante', async () => {
    const almacen = new AlmacenMemoria();
    await almacen.escribir(RUTA_LIBERADO, JSON.stringify({ por: 'Naza', at: '2026-10-16' }));
    const a = armarKids('chico-preocupante', { almacen, salidas: { 'kids-leer': LECTURA_PREOCUPANTE } });
    expect((await correrKids(a.x)).estado).toBe('listo');
    const informe = (await almacen.leer('informe.md')) as string;
    expect(informe).toContain('## Algo preocupante (Naza lo liberó)');
    expect(informe).toContain('R07 salió de «Su voz» (está marcada como preocupante)');
    expect(informe).toContain('Con QR: R04, R02.');
  });

  it('un JSON que no cumple su forma se pide una vez más con el error; si sigue mal, la etapa falla', async () => {
    const ok = armarKids('chico-inventado');
    await etapaAKids(ok.x);
    const bien = JSON.stringify(parteFalsa(ok.m, 1));
    const a = armarKids('chico-inventado', { salidas: { 'kids-parte-1': JSON.stringify({ piezas: [{ clave: 'K1', titulo: 'x', texto: 'y', ids: [] }], afuera: [] }), 'kids-parte-1#2': bien } });
    await etapaAKids(a.x);
    expect(await etapaBKids(a.x)).toEqual({ ok: true });
    const reintento = a.modelo.llamadas.find((p) => p.clave === 'B/kids-parte-1#2')!;
    expect(reintento.bloques.at(-1)).toContain('Tu respuesta anterior no pasó estos controles');
    expect(reintento.bloques.at(-1)).toContain('"ids" tiene que tener al menos un id');

    const mal = armarKids('chico-inventado', { salidas: { 'kids-sobre': '{"nada": 1}', 'kids-sobre#2': '{"nada": 2}' } });
    await etapaAKids(mal.x);
    const r = await etapaBKids(mal.x);
    expect(r.ok).toBe(false);
  });

  it('el veedor y los controles de código van juntos al arreglo de esa parte, y el arreglo reemplaza solo esas piezas', async () => {
    const a = armarKids('chico-inventado');
    const p1 = parteFalsa(a.m, 1, { K1: 'Una pileta azul' });
    // El código va a marcar dos puntos en K2; el veedor, algo inventado en K3.
    const k2 = p1.piezas.find((p) => p.clave === 'K2')!;
    k2.texto = `Lo mejor: ${k2.texto}`;
    const veedor = { problemas: [{ clave: 'K3', tipo: 'inventado', cita: 'la verde', arreglo: 'sacar' }] };
    const arreglo = parteFalsa(a.m, 1, { K2: 'El azúcar por sal', K3: 'La piñata' }, new Set(['K2', 'K3']));
    const b = armarKids('chico-inventado', { salidas: { 'kids-parte-1': JSON.stringify(p1), 'kids-veedor-1': JSON.stringify(veedor), 'kids-arreglo-1': JSON.stringify(arreglo) } });
    await etapaAKids(b.x);
    await etapaBKids(b.x);
    const r = await etapaCKids(b.x);
    if (!r.ok) throw new Error(r.motivo);
    expect(r.final.arregladas).toEqual([1, 3]);
    const llamada = b.modelo.llamadas.find((p) => p.clave === 'C/kids-arreglo-1')!;
    const problemas = JSON.parse(llamada.bloques[4].replace(/^<problemas>\n|\n<\/problemas>$/g, ''));
    expect(Object.keys(problemas).sort()).toEqual(['K2', 'K3']);
    expect(problemas.K2[0].tipo).toBe('dos_puntos');
    const final = JSON.parse(b.c.leer('salidas/parte-1.json'));
    expect(final.piezas.find((p: { clave: string }) => p.clave === 'K2').texto).not.toContain(':');
    expect(final.piezas.find((p: { clave: string }) => p.clave === 'K1').titulo).toBe('Una pileta azul');
    expect(final.piezas.map((p: { clave: string }) => p.clave)).toEqual(a.m.partes[0].items.map((i) => i.clave));
    expect(r.final.partes['1']).toEqual([]);
  });

  it('el tope de gasto corta antes de pagar de más', async () => {
    const a = armarKids('chico-inventado', { topeUsd: 0.000001 });
    await expect(correrKids(a.x)).rejects.toBeInstanceOf(TopeDeGasto);
  });
});
