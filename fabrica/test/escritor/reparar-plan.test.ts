// fabrica/test/escritor/reparar-plan.test.ts
// El código arregla dos cosas del plan antes de controlarlo, sin inventar (07/10; datos inventados de Nélida).
import { describe, expect, it } from 'vitest';
import { leerJSON } from '../../src/escritor/carpeta.js';
import { c13, c20, dedicadosSinMensaje } from '../../src/escritor/controles/estructura.js';
import { repararPlan } from '../../src/escritor/controles/reparar-plan.js';
import type { Json } from '../../src/escritor/tipos.js';
import { carpetaNelida } from './ayuda.js';

const base = () => { const c = carpetaNelida(); return { plan: leerJSON(c, 'salidas/plan.json'), reg: leerJSON(c, 'salidas/registro.json') }; };
/** Una persona del registro a la que ningún episodio "familia" le habla. */
const sinMensaje = (reg: Json): Json => (reg.personas as Json[]).find((p) => !(reg.episodios as Json[]).some((e) => e.a_quien === 'familia' && (e.a_quien_nombres || []).includes(p.nombre)));

describe('repararPlan', () => {
  it('el plan de Nélida, que pasa, no se toca', () => {
    const { plan, reg } = base();
    expect(repararPlan(plan, reg)).toEqual({ plan, cambios: [] });
  });

  it('C19: la carta le habla a alguien sin mensaje y no está en faltantes → se anota; el control queda limpio', () => {
    const { plan, reg } = base();
    const per = sinMensaje(reg);
    expect(per).toBeTruthy();
    plan.carta.para_personas = [...(plan.carta.para_personas || []), per.id];
    expect(c20(plan, reg).some((x) => x.startsWith('C19: el libro está dedicado'))).toBe(true);
    const r = repararPlan(plan, reg);
    expect(r.cambios).toEqual([`faltantes: no dejó mensaje para ${per.nombre}`]);
    expect(r.plan.faltantes.at(-1)).toMatchObject({ donde: 'carta' });
    expect(r.plan.faltantes.at(-1).que).toContain(`no dejó mensaje para ${per.nombre}`);
    expect(dedicadosSinMensaje(r.plan, reg)).toEqual([]);
    expect(c20(r.plan, reg).some((x) => x.startsWith('C19: el libro está dedicado'))).toBe(false);
    expect(plan.faltantes).not.toBe(r.plan.faltantes); // no pisa el original
  });

  it('C13 y C19 ya no se contradicen: una respuesta que le habla a la familia puede ir en la carta aunque sea un balance', () => {
    const { plan, reg } = base();
    const ep = (reg.episodios as Json[]).find((e) => e.tipo === 'balance')!;
    const id = ep.ids[0];
    plan.carta.ids = [...plan.carta.ids, id];
    const sinFamilia = structuredClone(reg);
    sinFamilia.episodios.find((e: Json) => e.id === ep.id).a_quien = '';
    expect(c13(plan, sinFamilia)).toContain(`C13 carta: ${id} no tiene ningún episodio tipo "mensaje"`);
    const conFamilia = structuredClone(reg);
    conFamilia.episodios.find((e: Json) => e.id === ep.id).a_quien = 'familia';
    expect(c13(plan, conFamilia).filter((x) => x.startsWith(`C13 carta: ${id}`))).toEqual([]);
  });
});
