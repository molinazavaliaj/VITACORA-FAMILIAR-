import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { crearBaseFalsa } from '../v3/base-falsa.js';
import { depsViajeDePrueba } from './deps-prueba.js';
import { asegurarAltaViajeV2, compraDeContexto, quedoEnElViajeViejo, type DepsAlta, type NarradorParaAlta } from '../../src/viaje-v2/alta.js';
import { leerFila } from '../../src/viaje-v2/filas.js';
import { procesarEntranteViajeV2 } from '../../src/viaje-v2/entrante.js';
import type { Compra } from '../../src/viaje-v2/nucleo/tipos.js';
import type { EstadoBotViaje } from '../../src/viaje-v2/tipos.js';
import type { MensajeEntrante } from '../../src/whatsapp/webhook.js';

// Viajeros y viajes INVENTADOS.
const BA = 'America/Argentina/Buenos_Aires';
const V2 = {
  v: 2, salida: '2026-11-10', vuelta: '2026-11-20', zonaCasa: BA, zonaViaje: 'Europe/Rome', horaNoche: '22:00',
  regalo: { quienRegala: 'Tomás' }, preguntasPropias: ['¿Qué comiste en Nápoles?'], formato: 'impreso', fotosAlbum: 40, idioma: 'es-AR',
};
const VIEJO = {
  salida: '2026-11-10', vuelta: '2026-11-20', etapas: [{ nombre: 'Roma', desde: '2026-11-10' }],
  compania: 'pareja', proposito: 'recuerdo', angulos: ['comida', 'lugar'],
};

const narrador = (contexto: Record<string, unknown>, extra: Partial<NarradorParaAlta> = {}): NarradorParaAlta => ({
  id: 'n1', estado: 'invitado', como_le_dicen: 'Olga', zona_horaria: BA, hora_preferida: '21:00:00',
  contexto: { modo: 'viaje', trato: 'vos', ...contexto }, ...extra,
});

describe('compraDeContexto: la compra sale de contexto.viaje', () => {
  it('la forma nueva (v: 2) va tal cual, con el nombre de cómo le dicen', () => {
    const r = compraDeContexto(narrador({ viaje: V2 }), null);
    expect(r).toEqual({
      ok: true, forma: 'v2', supuestos: [],
      compra: {
        nombre: 'Olga', salida: '2026-11-10', vuelta: '2026-11-20', zonaCasa: BA, zonaViaje: 'Europe/Rome', horaNoche: '22:00',
        regalo: { quienRegala: 'Tomás' }, preguntasPropias: ['¿Qué comiste en Nápoles?'], formato: 'impreso', fotosAlbum: 40, idioma: 'es-AR',
      },
    });
  });

  it('acepta los nombres del primer borrador del contrato (preguntas, album, quienRegala)', () => {
    const { regalo: _r, preguntasPropias: _p, fotosAlbum: _f, ...resto } = V2;
    const r = compraDeContexto(narrador({ viaje: { ...resto, quienRegala: 'Tomás', preguntas: ['una'], album: 20 } }), null);
    expect(r.ok && r.compra).toMatchObject({ regalo: { quienRegala: 'Tomás' }, preguntasPropias: ['una'], fotosAlbum: 20 });
  });

  it('el formulario viejo: fechas tal cual, zonas de su casa, formato del pedido, álbum de 20, y dice qué supuso', () => {
    const r = compraDeContexto(narrador({ viaje: VIEJO }), { impreso: true });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.forma).toBe('vieja');
    expect(r.compra).toEqual({
      nombre: 'Olga', salida: '2026-11-10', vuelta: '2026-11-20', zonaCasa: BA, zonaViaje: BA, horaNoche: '21:00',
      preguntasPropias: [], formato: 'impreso', fotosAlbum: 20,
    });
    expect(r.supuestos.join(' | ')).toMatch(/zona del viaje es la de su casa/);
    expect(r.supuestos.join(' | ')).toMatch(/20 fotos/);
  });

  it('el formulario viejo sin pedido queda en pdf, y una hora fuera de la noche queda en la de siempre', () => {
    const r = compraDeContexto(narrador({ viaje: VIEJO }, { hora_preferida: '10:00:00' }), null);
    expect(r.ok && r.compra.formato).toBe('pdf');
    expect(r.ok && r.compra.horaNoche).toBeUndefined();
    expect(r.ok && r.supuestos.join(' | ')).toMatch(/no encontré su pedido.*\| .*21:30 \(eligió 10:00/);
  });

  it('sin datos suficientes no adivina: sin fechas, un viaje de 2 días, una zona rara o un idioma desconocido', () => {
    expect(compraDeContexto(narrador({}), null)).toMatchObject({ ok: false, motivo: expect.stringMatching(/contexto\.viaje/) });
    expect(compraDeContexto(narrador({ viaje: { etapas: [] } }), null)).toMatchObject({ ok: false, motivo: expect.stringMatching(/salida/) });
    expect(compraDeContexto(narrador({ viaje: { ...VIEJO, vuelta: '2026-11-11' } }), null)).toMatchObject({ ok: false, motivo: expect.stringMatching(/al menos 3 días/) });
    expect(compraDeContexto(narrador({ viaje: { ...V2, zonaViaje: 'Marte/Olympus' } }), null)).toMatchObject({ ok: false, motivo: expect.stringMatching(/zonaViaje/) });
    expect(compraDeContexto(narrador({ viaje: { ...V2, idioma: 'pt-BR' } }), null)).toMatchObject({ ok: false, motivo: expect.stringMatching(/Idioma/) });
    expect(compraDeContexto(narrador({ viaje: { ...V2, formato: undefined } }), null)).toMatchObject({ ok: false });
  });
});

describe('asegurarAltaViajeV2', () => {
  function preparar(n: NarradorParaAlta, pedidos: Record<string, unknown>[] = []) {
    const base = crearBaseFalsa({ narradores: [{ ...n, telefono_whatsapp: '+5491100000000' }], viajes_v2: [], pedidos, respuestas: [], envios: [], fotos: [] });
    const avisos: { clave: string; asunto: string; detalle: string }[] = [];
    const deps: DepsAlta = { db: base.cliente, avisarUnaVez: async (clave, asunto, detalle) => { avisos.push({ clave, asunto, detalle }); } };
    const fila = () => leerFila<Compra, EstadoBotViaje>(base.cliente, n.id);
    return { base, deps, avisos, fila };
  }

  it('forma nueva: crea la fila con la compra y el estado inicial, sin avisos', async () => {
    const r = preparar(narrador({ viaje: V2 }));
    expect(await asegurarAltaViajeV2(r.deps, narrador({ viaje: V2 }))).toBe('creada');
    const f = await r.fila();
    expect(f).toMatchObject({ narrador_id: 'n1', idioma: 'es-AR', compra: { formato: 'impreso', fotosAlbum: 40, regalo: { quienRegala: 'Tomás' } } });
    expect(f!.estado).toMatchObject({ plan: null, bienvenida: null, salida: [] });
    expect(r.avisos).toEqual([]);
  });

  it('forma vieja: el formato sale del pedido pagado y los socios reciben qué se supuso', async () => {
    const n = narrador({ viaje: VIEJO });
    const r = preparar(n, [{ id: 'p1', narrador_id: 'n1', extras: { pdf: true, tipo: 'viaje', impreso: 'color', copias: 1 } }]);
    expect(await asegurarAltaViajeV2(r.deps, n)).toBe('creada');
    expect((await r.fila())!.compra.formato).toBe('impreso');
    expect(r.avisos).toHaveLength(1);
    expect(r.avisos[0].clave).toBe('viaje-v2-alta-supuestos:n1');
    expect(r.avisos[0].detalle).toMatch(/viaje-v2-cambiar-pais -- n1/);
  });

  it('sin datos suficientes: no crea nada, no toca al narrador y avisa con el motivo', async () => {
    const n = narrador({ viaje: { etapas: [{ nombre: 'Roma' }] } });
    const r = preparar(n);
    expect(await asegurarAltaViajeV2(r.deps, n)).toBe('faltan-datos');
    expect(r.base.tablas.viajes_v2).toEqual([]);
    expect(r.base.tablas.narradores[0]).toMatchObject({ estado: 'invitado', contexto: n.contexto });
    expect(r.avisos).toHaveLength(1);
    expect(r.avisos[0].clave).toMatch(/^viaje-v2-alta-sin-datos:n1:/);
    expect(r.avisos[0].detalle).toMatch(/no le escribe nada/);
  });

  it('sin la migración de viajes_v2: faltan-datos, sin tirar; con otro error de base, tira (procesar lo ataja)', async () => {
    const n = narrador({ viaje: V2 });
    const r = preparar(n);
    r.base.ausentes.add('viajes_v2');
    expect(await asegurarAltaViajeV2(r.deps, n)).toBe('faltan-datos');
    r.base.ausentes.delete('viajes_v2');
    r.base.fallarProxima.set('viajes_v2', { code: '57014', message: 'canceling statement due to statement timeout' });
    await expect(asegurarAltaViajeV2(r.deps, n)).rejects.toThrow(/No pude crear el Viaje V2/);
  });

  it('idempotente: dos ticks a la vez crean una sola fila, y la segunda vez no se pisa nada', async () => {
    const n = narrador({ viaje: V2 });
    const r = preparar(n);
    const resultados = await Promise.all([asegurarAltaViajeV2(r.deps, n), asegurarAltaViajeV2(r.deps, n)]);
    expect(resultados.sort()).toEqual(['creada', 'ya-existia']);
    expect(r.base.tablas.viajes_v2).toHaveLength(1);
    const otra = narrador({ viaje: { ...V2, formato: 'pdf' } });
    expect(await asegurarAltaViajeV2(r.deps, otra)).toBe('ya-existia');
    expect((await r.fila())!.compra.formato).toBe('impreso');
  });

  it('solo para un viajero nuevo: ni el Familiar, ni uno que ya había empezado el viaje viejo', async () => {
    const familiar: NarradorParaAlta = { ...narrador({ viaje: V2 }), contexto: {} };
    const viejo = narrador({ viaje: VIEJO }, { estado: 'activo' });
    const r = preparar(familiar);
    expect(await asegurarAltaViajeV2(r.deps, familiar)).toBe('no-corresponde');
    expect(await asegurarAltaViajeV2(r.deps, viejo)).toBe('no-corresponde');
    const simulacion = narrador({ viaje: V2, simulacion: true });
    expect(await asegurarAltaViajeV2(r.deps, simulacion)).toBe('no-corresponde');
    expect(r.base.tablas.viajes_v2).toEqual([]);
    expect(quedoEnElViajeViejo(viejo, false)).toBe(true);
    expect(quedoEnElViajeViejo(viejo, true)).toBe(false);
    expect(quedoEnElViajeViejo({ ...viejo, estado: 'invitado' }, false)).toBe(false);
    expect(quedoEnElViajeViejo({ ...familiar, estado: 'activo' }, false)).toBe(false);
  });
});

describe('escribe primero: alta y bienvenida V2 como texto', () => {
  const ENV = 'WA_PLANTILLAS_VIAJE_V2_LISTAS';
  let previo: string | undefined;
  beforeEach(() => { previo = process.env[ENV]; delete process.env[ENV]; });
  afterEach(() => { if (previo === undefined) delete process.env[ENV]; else process.env[ENV] = previo; });

  it('del formulario viejo, el "hola" de un viajero sin fila termina en la bienvenida V2 (no la vieja)', async () => {
    const n = { ...narrador({ viaje: VIEJO }), telefono_whatsapp: '+5491100000000' };
    const base = crearBaseFalsa({ narradores: [{ ...n }], viajes_v2: [], pedidos: [], respuestas: [], envios: [], fotos: [] });
    const p = depsViajeDePrueba(base, { ahora: new Date('2026-11-01T13:00:00Z') });
    expect(await asegurarAltaViajeV2({ db: base.cliente, avisarUnaVez: async () => {} }, n)).toBe('creada');
    await procesarEntranteViajeV2(p.deps, base.tablas.narradores[0] as never, { telefono: n.telefono_whatsapp, tipo: 'texto', texto: 'hola', waMessageId: 'w1' } as MensajeEntrante);
    expect(p.enviados).toHaveLength(1);
    expect(p.enviados[0].tipo).toBe('texto');
    expect(p.enviados[0].texto).toMatch(/Olga/);
    expect(p.enviados[0].texto).not.toMatch(/biógrafo de viaje\. Cada noche te voy a mandar una pregunta/); // la bienvenida vieja
    expect((await leerFila<Compra, EstadoBotViaje>(base.cliente, 'n1'))!.estado.bienvenida?.por).toBe('texto');
  });
});
