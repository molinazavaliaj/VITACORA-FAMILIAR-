// Task 3.3 del plan: el alta de una historia desde `narradores.contexto.historia` (lo escribe la web al comprar).

import { describe, expect, it } from 'vitest';
import { crearBaseFalsa } from './base-falsa.js';
import { depsDePrueba } from './deps-prueba.js';
import { asegurarAltaHistoria } from '../../src/historia/alta.js';
import { leerFila } from '../../src/historia/estado.js';
import type { NarradorHistoria } from '../../src/historia/tipos.js';

function preparar(contexto: Record<string, unknown>, o: { estado?: string; familia?: string | null } = {}) {
  const n: NarradorHistoria = {
    id: 'n1', familia_id: 'f1', como_le_dicen: 'Marta', telefono_whatsapp: '+5491100000000', hora_preferida: '10:00:00',
    zona_horaria: 'America/Argentina/Buenos_Aires', contexto, estado: o.estado ?? 'invitado', dia_actual: 0, ultima_respuesta_at: null,
  };
  const base = crearBaseFalsa({ narradores: [{ ...n }], familias: o.familia === null ? [] : [{ id: 'f1', nombre: o.familia ?? 'Pablo' }] });
  const p = depsDePrueba(base);
  return { ...p, base, n, fila: () => leerFila(base.cliente, 'n1') };
}

describe('alta de historia', () => {
  it('crea la fila con tema y propias, para uno mismo', async () => {
    const d = preparar({ modo: 'historia', genero: 'mujer', historia: { tema: 'mudanza', preguntasPropias: ['¿Qué extrañabas?'] } });
    expect(await asegurarAltaHistoria(d.deps, d.n)).toBe('creada');
    const fila = (await d.fila())!;
    expect(fila.ficha).toEqual({ nombre: 'Marta', genero: 'mujer', tema: 'mudanza' });
    expect(fila.compra.preguntasPropias).toEqual(['¿Qué extrañabas?']);
    expect(fila.estado).toMatchObject({ fase: 'bienvenida', temaAbierto: false, propias: ['¿Qué extrañabas?'] });
    expect(fila.idioma).toBe('es-AR');
  });
  it('un regalo lleva quién regala (familias.nombre)', async () => {
    const d = preparar({ modo: 'historia', regalo: true, genero: 'varon', idioma: 'ca', historia: { tema: 'trabajo' } });
    await asegurarAltaHistoria(d.deps, d.n);
    const fila = (await d.fila())!;
    expect(fila.ficha).toMatchObject({ quienRegala: 'Pablo', tema: 'trabajo' });
    expect(fila.idioma).toBe('ca');
  });
  it('un regalo con tarjeta lleva el nombre de la tarjeta, sin el vínculo (el banco lo usa como nombre)', async () => {
    const d = preparar({ modo: 'historia', regalo: true, genero: 'mujer', vinculoComprador: 'hijo', historia: { tema: 'trabajo' } }, { familia: null });
    d.base.tablas.regalos = [{ narrador_id: 'n1', quien_regala: 'Naza' }];
    expect(await asegurarAltaHistoria(d.deps, d.n)).toBe('creada');
    expect((await d.fila())!.ficha.quienRegala).toBe('Naza');
  });
  it('dos veces no duplica', async () => {
    const d = preparar({ modo: 'historia', genero: 'varon', historia: { tema: 'otra', temaLibre: 'El año en el campo' } });
    await asegurarAltaHistoria(d.deps, d.n);
    expect(await asegurarAltaHistoria(d.deps, d.n)).toBe('ya-estaba');
    expect(d.base.tablas.historias).toHaveLength(1);
    expect((await d.fila())!.ficha.temaLibre).toBe('El año en el campo');
  });
  it('tema abierto: la fila nace con tema «otra» y estado.temaAbierto', async () => {
    const d = preparar({ modo: 'historia', regalo: true, genero: 'mujer', historia: { tema: null, temaAbierto: true } });
    expect(await asegurarAltaHistoria(d.deps, d.n)).toBe('creada');
    const fila = (await d.fila())!;
    expect(fila.ficha.tema).toBe('otra');
    expect(fila.estado.temaAbierto).toBe(true);
  });
  it('sin género no arranca y avisa', async () => {
    const d = preparar({ modo: 'historia', historia: { tema: 'negocio' } });
    expect(await asegurarAltaHistoria(d.deps, d.n)).toBe('frenada');
    expect(d.avisos).toHaveLength(1);
    expect(d.base.tablas.historias ?? []).toHaveLength(0);
  });
  it('un tema desconocido no arranca y avisa', async () => {
    const d = preparar({ modo: 'historia', genero: 'mujer', historia: { tema: 'viaje' } });
    expect(await asegurarAltaHistoria(d.deps, d.n)).toBe('frenada');
    expect(d.avisos[0].detalle).toContain('viaje');
  });
  it('un regalo sin nombre de quien regala no arranca y avisa (la bienvenida lo nombra)', async () => {
    const d = preparar({ modo: 'historia', regalo: true, genero: 'mujer', historia: { tema: 'negocio' } }, { familia: null });
    expect(await asegurarAltaHistoria(d.deps, d.n)).toBe('frenada');
    expect(d.avisos).toHaveLength(1);
  });
  it('más de 3 propias: se guardan 3 y se avisa', async () => {
    const d = preparar({ modo: 'historia', genero: 'mujer', historia: { tema: 'negocio', preguntasPropias: ['a', 'b', 'c', 'd'] } });
    await asegurarAltaHistoria(d.deps, d.n);
    expect((await d.fila())!.compra.preguntasPropias).toEqual(['a', 'b', 'c']);
    expect(d.avisos).toHaveLength(1);
  });
  it('a un narrador que ya arrancó otra cosa no se le da el alta', async () => {
    const d = preparar({ modo: 'historia', genero: 'mujer', historia: { tema: 'negocio' } }, { estado: 'activo' });
    expect(await asegurarAltaHistoria(d.deps, d.n)).toBe('frenada');
  });
});
