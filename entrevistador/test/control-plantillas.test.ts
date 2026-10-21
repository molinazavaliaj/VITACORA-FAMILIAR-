import { describe, expect, it, vi } from 'vitest';
import { controlarPlantillas, faltantes } from '../src/flujo/control-plantillas.js';

const KIDS = ['kids_bienvenida', 'kids_bienvenida_plural', 'kids_bienvenida_padre', 'kids_aviso_padre', 'kids_recordatorio_padre', 'kids_recordatorio_padre_8', 'kids_recordatorio_lo_hago_yo', 'kids_recordatorio_lo_hago_yo_8', 'kids_pregunta_nueva', 'kids_pregunta_nueva_padre', 'kids_termino_padre', 'kids_final', 'kids_final_plural'];
const V3 = ['es-AR', 'es-ES', 'ca'].flatMap((i) => ['bienvenida', 'pregunta', 'recordatorio', 'regalo_entrega'].map((c) => `${i}:${c}`)).join(',');
const VIAJE = ['es-AR', 'es-ES', 'ca'].flatMap((i) => ['bienvenida', 'bienvenida_regalo', 'mensaje', 'recordatorio', 'recordatorio_ultima'].map((c) => `${i}:${c}`)).join(',');

// 21/10: el caso de Martí. La web vendía Kids en catalán y el bot solo tenía marcadas las de Argentina.
describe('control de plantillas contra lo que vende la web', () => {
  const env = { WA_PLANTILLAS_V3_LISTAS: V3, WA_PLANTILLAS_VIAJE_V2_LISTAS: VIAJE, WA_PLANTILLAS_KIDS_LISTAS: KIDS.join(',') } as NodeJS.ProcessEnv;
  const todo = { familiar: ['es-AR', 'es-ES', 'ca'], viaje: ['es-AR', 'es-ES', 'ca'], kids: ['es-AR', 'ca'], regaloEntrega: true } as const;

  it('Kids en catalán sin sus plantillas marcadas: lo dice', () => {
    const f = faltantes({ ...todo, familiar: [...todo.familiar], viaje: [...todo.viaje], kids: [...todo.kids] }, env);
    expect(f).toHaveLength(1);
    expect(f[0]).toContain('Kids (catalán): faltan 13');
    expect(f[0]).toContain('kids_bienvenida_ca');
  });

  it('con todo marcado, nada que avisar; lo que no se vende no se exige', () => {
    const conCa = { ...env, WA_PLANTILLAS_KIDS_LISTAS: KIDS.flatMap((k) => [k, `${k}_ca`]).join(',') } as NodeJS.ProcessEnv;
    expect(faltantes({ familiar: ['es-AR', 'es-ES', 'ca'], viaje: ['es-AR'], kids: ['es-AR', 'ca'], regaloEntrega: true }, conCa)).toEqual([]);
    expect(faltantes({ familiar: [], viaje: [], kids: ['es-AR'], regaloEntrega: false }, env)).toEqual([]);
  });

  it('Familiar, Viaje y el regalo por WhatsApp también se revisan', () => {
    const f = faltantes({ familiar: ['es-ES'], viaje: ['ca'], kids: [], regaloEntrega: true }, { WA_PLANTILLAS_V3_LISTAS: 'es-ES:bienvenida' } as NodeJS.ProcessEnv);
    expect(f.some((x) => x.includes('«es-ES:pregunta»'))).toBe(true);
    expect(f.some((x) => x.includes('«es-ES:regalo_entrega»'))).toBe(true);
    expect(f.some((x) => x.includes('Viaje (catalán)'))).toBe(true);
  });

  it('lee /api/vende de la web; si no contesta, no avisa y devuelve null', async () => {
    const bien = vi.fn(async () => new Response(JSON.stringify({ familiar: ['es-AR'], viaje: [], kids: ['ca', 'xx'], regaloEntrega: false })));
    const r = await controlarPlantillas({ fetch: bien as unknown as typeof fetch, env: { ...env, URL_BASE: 'https://web.test/' } as NodeJS.ProcessEnv });
    expect(bien).toHaveBeenCalledWith('https://web.test/api/vende', expect.anything());
    expect(r).toHaveLength(1);
    const cae = vi.fn(async () => { throw new Error('sin red'); });
    expect(await controlarPlantillas({ fetch: cae as unknown as typeof fetch, env })).toBeNull();
  });
});
