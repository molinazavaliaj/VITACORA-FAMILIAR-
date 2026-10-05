// Simulación de Vitácora de Viaje V2: 300 viajes inventados (semillas 1 a
// 300) corridos de punta a punta con el código de verdad, con las invariantes
// de scripts/viaje-v2-simular.ts. La corrida completa (2400 viajes) y las
// estadísticas están en docs/viajes-v2/simulaciones/resumen.md.
//
// Las cinco invariantes que se rompían (b3, d2, d6, h1, h3) quedaron
// arregladas con lo que aprobó Naza después de las simulaciones: la noche solo
// entre 19:00 y 22:30 y mínimo 3 días en la compra, AS1 "ya de viaje" con un
// SÍ tardío, e ID1 nunca el día de salida en casa. Ya no hay `it.fails`.
import { describe, it, expect } from 'vitest';
import { correr, correrMuchos, INVARIANTES, HALLAZGOS, lecturaUnDia, lecturaDosDias, lecturaTreintaDias, lecturaCa, lecturaEsES, revisar, escenario, simular, PersonaSimulada } from '../scripts/viaje-v2-simular.js';
import { porId } from '../src/viaje-v2/banco.js';

const CORRIDAS = correrMuchos(300);

const violan = (inv: string) =>
  CORRIDAS.filter((c) => c.violaciones.some((x) => x.inv === inv)).map((c) => `semilla ${c.e.semilla}: ${c.violaciones.find((x) => x.inv === inv)!.detalle}`);

describe('viaje v2: simulación de 300 viajes', () => {
  it('se repite: la misma semilla da el mismo viaje, mensaje por mensaje', () => {
    const a = correr(123).res.enviados.map((m) => `${m.en.toISOString()} ${m.ids.join('+')}`);
    const b = correr(123).res.enviados.map((m) => `${m.en.toISOString()} ${m.ids.join('+')}`);
    expect(a).toEqual(b);
    expect(escenario(7)).toEqual(escenario(7));
  });

  it('cubre lo pedido: todas las duraciones, conductas, álbumes, noches y compras', () => {
    const vistos = (f: (c: (typeof CORRIDAS)[number]) => unknown) => new Set(CORRIDAS.map(f));
    for (const d of [3, 4, 5, 7, 10, 15, 30, 60]) expect(vistos((c) => c.e.dias).has(d), `${d} días`).toBe(true);
    expect(CORRIDAS.every((c) => c.e.dias >= 3)).toBe(true); // la compra pide al menos 3 días
    expect(vistos((c) => c.e.conducta).size).toBe(8);
    expect(vistos((c) => c.e.conductaAlbum).size).toBeGreaterThanOrEqual(4);
    expect(vistos((c) => c.e.compra.horaNoche ?? 'defecto').size).toBe(5);
    expect(vistos((c) => c.e.antelacion)).toEqual(new Set([0, 1, 3, 20]));
    expect(CORRIDAS.some((c) => c.e.cruzaCambioDeHora)).toBe(true);
  });

  for (const [inv, nombre] of Object.entries(INVARIANTES)) {
    it(nombre, () => {
      expect(violan(inv)).toEqual([]);
    });
  }

  it('las tres lecturas nuevas no rompen ninguna invariante', () => {
    for (const f of [lecturaUnDia, lecturaDosDias, lecturaTreintaDias]) {
      const { res, md } = f();
      const v = revisar(res).violaciones;
      // 1 y 2 días: la compra ya no los permite (k); quedan como prueba del código de viajes cortos.
      if (f !== lecturaTreintaDias) expect(v.map((x) => x.inv), f.name).toEqual(['k']);
      else expect(v, f.name).toEqual([]);
      expect(md).not.toContain('{{');
    }
  });

  it('lectura de 30 días: trae lo que tiene que traer', () => {
    const { md } = lecturaTreintaDias();
    for (const id of ['REC1-U', 'VA1', 'ATR-V', 'TXT', 'PR-R', 'PR-R2', 'PR-R3', 'FN1', 'VU0', 'VU1', 'CA1', 'AL1', 'AL3', 'DES']) expect(md, id).toContain(`\`${id}\``);
    expect(md.match(/`TXT`/g)!.length).toBe(2);
    expect(md).not.toContain('`DES+`'); // reenvió las 5 que sobraban: eligió ella
    expect(md).toContain('reacciona ❤️ a su mensaje');
  });

  it('las tres lecturas mandan sus fotos después de AL1: nunca "cero fotos"', () => {
    for (const f of [lecturaUnDia, lecturaDosDias, lecturaTreintaDias]) {
      const { res, md } = f();
      expect(res.avisosAlbum, f.name).toEqual([]);
      expect(md, f.name).not.toContain('cero fotos');
      const al1 = res.enviados.find((m) => m.ids[0] === 'AL1' || m.ids[0] === 'AL1-P')!;
      expect(res.album!.fotos, f.name).toBeGreaterThan(0);
      expect(al1, f.name).toBeDefined();
    }
  });

  it('lectura de 30 días: 45 fotos después de AL1, AL2, AL3 y reenvía 5 (como dice el encabezado)', () => {
    const { res, md } = lecturaTreintaDias();
    for (const id of ['AL1', 'AL2', 'AL3']) expect(md, id).toContain(`\`${id}\``);
    expect(md).toContain('reenvía 5 fotos para sacar');
    expect(res.album!.recibidas).toBe(45);
    expect(res.album!.fotos).toBe(40);
  });

  it('lectura de 2 días: la propia no entra y queda en los avisos a Naza', () => {
    const { res } = lecturaDosDias();
    expect(res.cal!.propiasQueNoEntran).toHaveLength(1);
    expect(res.cal!.avisosNaza.join(' ')).toContain('¿Qué te hizo acordar a nosotros?');
    expect(res.enviados.some((m) => m.ids.includes('PR-R'))).toBe(false);
  });
});

describe('viaje v2: simulación, lo que cambió con las reglas de las simulaciones', () => {
  it('ya no hay viajes sin cerrar: CA1 sin respuesta abre el álbum con AL1-P a la mañana siguiente', () => {
    expect(CORRIDAS.every((c) => c.res.album?.fase === 'cerrado')).toBe(true);
    expect(CORRIDAS.some((c) => c.hallazgos.some((h) => h.inv === 'i7'))).toBe(true);
  });

  it('hay AL3 con las dos salidas: eligió (DES sin DES+) y no eligió (DES+)', () => {
    const conAl3 = CORRIDAS.filter((c) => c.res.enviados.some((m) => m.ids.includes('AL3')));
    expect(conAl3.some((c) => c.res.enviados.some((m) => m.ids.includes('DES+')))).toBe(true);
    expect(conAl3.some((c) => !c.res.enviados.some((m) => m.ids.includes('DES+')))).toBe(true);
  });

  it('hay reacciones ❤️ y ningún ACM después de un mediodía', () => {
    expect(CORRIDAS.some((c) => c.res.corazones.length > 0)).toBe(true);
    const acm = CORRIDAS.flatMap((c) =>
      c.res.enviados.filter((m) => m.reaccionA && ['MD', 'VU0', 'foto-suelta'].includes(m.reaccionA.tipo) && m.ids.some((id) => id.startsWith('ACM'))),
    );
    expect(acm).toEqual([]);
  });
});

describe('viaje v2: los controles del simulador detectan lo que tienen que detectar', () => {
  const invs = (res: Parameters<typeof revisar>[0]) => revisar(res).violaciones.map((v) => v.inv);
  const buscar = (f: (c: (typeof CORRIDAS)[number]) => boolean) => CORRIDAS.find(f)!;

  it('g9: si un viaje de 3 días o más se queda sin FN1, salta', () => {
    const c = buscar((x) => x.res.enviados.some((m) => m.ids.includes('FN1')));
    const roto = { ...c.res, enviados: c.res.enviados.filter((m) => !m.ids.includes('FN1')) };
    expect(invs(roto)).toContain('g9');
  });

  it('g9: el caso aceptado (3 días, ID1 ocupa la noche del día 1) no salta', () => {
    const r = correr(1026); // 3 días, Buenos Aires → Tokio (el ejemplo de i12 en resumen.md)
    expect(r.e.dias).toBe(3);
    expect(r.hallazgos.map((h) => h.inv)).toContain('i12');
    expect(r!.res.enviados.some((m) => m.ids.includes('FN1'))).toBe(false);
    expect(r!.violaciones.map((v) => v.inv)).not.toContain('g9');
  });

  it('d9: una ❤️ que apunta a otro mensaje, o una foto suelta sin ❤️, salta', () => {
    const c = buscar((x) => x.res.corazones.some((k) => k.a === 'foto-suelta') && x.res.corazones.some((k) => k.a === 'MD'));
    const mal = { ...c.res, corazones: c.res.corazones.map((k, i) => (i === 0 ? { ...k, aMensaje: 'otro' } : k)) };
    expect(invs(mal)).toContain('d9');
    const sinSuelta = { ...c.res, corazones: c.res.corazones.filter((k) => k.a !== 'foto-suelta') };
    expect(invs(sinSuelta)).toContain('d9');
  });

  it('d12: PAS-V2 sin otra pregunta ese día, o PAS-V con otra, salta', () => {
    const c = buscar((x) => x.res.enviados.some((m) => m.ids[0] === 'PAS-V2'));
    const i = c.res.enviados.findIndex((m) => m.ids[0] === 'PAS-V2');
    const cambiado = c.res.enviados.map((m, k) => (k === i ? { ...m, ids: ['PAS-V'] } : m));
    expect(invs({ ...c.res, enviados: cambiado })).toContain('d12');
    const d = buscar((x) => x.res.enviados.some((m) => m.ids[0] === 'PAS-V'));
    const j = d.res.enviados.findIndex((m) => m.ids[0] === 'PAS-V');
    const cambiado2 = d.res.enviados.map((m, k) => (k === j ? { ...m, ids: ['PAS-V2'] } : m));
    expect(invs({ ...d.res, enviados: cambiado2 })).toContain('d12');
  });

  it('d13: ATR-PR después de una noche que no fue de quien regala, salta; y ATR-PR aparece en las corridas', () => {
    const c = buscar((x) => x.res.enviados.some((m) => m.ids[0] === 'ATR1' || m.ids[0] === 'ATR2' || m.ids[0] === 'ATR3'));
    const i = c.res.enviados.findIndex((m) => /^ATR[123]$/.test(m.ids[0]));
    const cambiado = c.res.enviados.map((m, k) => (k === i ? { ...m, ids: ['ATR-PR', ...m.ids.slice(1)] } : m));
    expect(invs({ ...c.res, enviados: cambiado })).toContain('d13');
    expect(CORRIDAS.some((x) => x.res.enviados.some((m) => m.ids[0] === 'ATR-PR'))).toBe(true);
  });

  it('h4: AL1 el mismo día que CA1, salta', () => {
    const c = buscar((x) => x.res.enviados.some((m) => m.ids[0] === 'AL1'));
    const ca1 = c.res.enviados.find((m) => m.ids[0] === 'CA1')!;
    const cambiado = c.res.enviados.map((m) => (m.ids[0] === 'AL1' ? { ...m, en: new Date(ca1.en.getTime() + 60_000) } : m));
    expect(invs({ ...c.res, enviados: cambiado })).toContain('h4');
  });

  it('i11 dice lo que controla', () => {
    expect(HALLAZGOS.i11).toMatch(/8:00 justas/);
    expect(HALLAZGOS.i11).not.toMatch(/debería/);
  });
});

describe('viaje v2: simulación en catalán y en castellano de España', () => {
  const POR_IDIOMA = { ca: correrMuchos(150, 1, 'ca'), 'es-ES': correrMuchos(150, 1, 'es-ES') } as const;

  for (const [idioma, corridas] of Object.entries(POR_IDIOMA)) {
    it(`${idioma}: 150 viajes sin ninguna invariante rota (con las nuevas: otro idioma, marcas, detector)`, () => {
      expect(corridas.every((c) => c.res.compra.idioma === idioma)).toBe(true);
      expect(corridas.flatMap((c) => c.violaciones.map((v) => `semilla ${c.e.semilla} ${v.inv}: ${v.detalle}`))).toEqual([]);
    });

    it(`${idioma}: los mensajes salen en ${idioma} y el detector entiende lo que escriben`, () => {
      const todos = corridas.flatMap((c) => c.res.enviados);
      expect(todos.some((m) => m.texto === porId('PAS-V', idioma as 'ca').texto)).toBe(true);
      const dichos = corridas.flatMap((c) => c.res.lineas.filter((l) => l.de === 'persona').map((l) => l.texto));
      const tipicos = idioma === 'ca' ? ['texto: passo', 'texto: ja està', "texto: d'acord"] : ['texto: ya está', 'texto: vale', 'texto: me la salto'];
      for (const t of tipicos) expect(dichos, t).toContain(t);
    });
  }

  it('la misma semilla da el mismo viaje en los tres idiomas (cambian los textos, no el calendario)', () => {
    const [a, b] = [correr(77), correr(77, 'ca')];
    expect(b.res.enviados.map((m) => `${m.en.toISOString()} ${m.ids.join('+')}`)).toEqual(a.res.enviados.map((m) => `${m.en.toISOString()} ${m.ids.join('+')}`));
  });

  it('l1: un viaje en es-AR leído como catalán salta (texto de otro idioma)', () => {
    const c = correr(5);
    const res = { ...c.res, compra: { ...c.res.compra, idioma: 'ca' as const } };
    expect(revisar(res).violaciones.map((v) => v.inv)).toContain('l1');
  });

  it('l2: un <br> o una marca que se cuela, salta', () => {
    const c = correr(5);
    const res = { ...c.res, enviados: c.res.enviados.map((m, i) => (i === 0 ? { ...m, texto: `${m.texto}<br>` } : m)) };
    expect(revisar(res).violaciones.map((v) => v.inv)).toContain('l2');
  });

  it('l3: si la persona escribe "passo" en un viaje es-AR, el detector no lo entiende y salta', () => {
    const e = escenario(9 * 3 + 0); // conducta "paso"
    const persona = new PersonaSimulada(e);
    const p = Object.assign(Object.create(Object.getPrototypeOf(persona)), persona, {
      contestar: (q: Parameters<PersonaSimulada['contestar']>[0]) => persona.contestar(q).map((it) => (it.respuesta.tipo === 'paso' ? { ...it, dice: 'texto: passo' } : it)),
    });
    const res = simular(e.compra, e.compraEn, p);
    expect(e.conducta).toBe('paso');
    expect(revisar(res).violaciones.map((v) => v.inv)).toContain('l3');
  });

  it('f4: C3 con F4 en la misma noche salta', () => {
    const c = CORRIDAS.find((x) => x.res.enviados.some((m) => m.programado?.tipo === 'noche'))!;
    const res = {
      ...c.res,
      enviados: c.res.enviados.map((m) => (m.programado?.tipo === 'noche' ? { ...m, programado: { ...m.programado, ids: ['C3', m.programado.ids[1], 'F4'] } } : m)),
    };
    expect(revisar(res).violaciones.map((v) => v.inv)).toContain('f4');
  });
});

describe('viaje v2: las dos lecturas nuevas (personas inventadas)', () => {
  it('Laia, en catalán: regalo de Jordi, 8 días Barcelona → Lisboa, impreso, álbum de 20, 2 preguntas propias', () => {
    const { res, md } = lecturaCa();
    expect(revisar(res).violaciones).toEqual([]);
    expect(res.compra).toMatchObject({ nombre: 'Laia', idioma: 'ca', formato: 'impreso', fotosAlbum: 20, regalo: { quienRegala: 'Jordi' } });
    expect(res.compra.preguntasPropias).toHaveLength(2);
    for (const id of ['BIEN-1R', 'PAS-A', 'PAS-V', 'ATR-PR', 'PR-R', 'PR-R2', 'AL3', 'DES+']) expect(md, id).toContain(`\`${id}\``);
    expect(md).toContain('_[texto: passo]_');
    expect(md).not.toContain('{{');
  });

  it('Marta, en castellano de España: para ella, 8 días Madrid → Roma, PDF, álbum de 20', () => {
    const { res, md } = lecturaEsES();
    expect(revisar(res).violaciones).toEqual([]);
    expect(res.compra).toMatchObject({ nombre: 'Marta', idioma: 'es-ES', formato: 'pdf', fotosAlbum: 20 });
    expect(res.compra.regalo).toBeUndefined();
    for (const id of ['BIEN-1', 'PAS-V', 'ATR1', 'AL3', 'DES+']) expect(md, id).toContain(`\`${id}\``);
    expect(md).toContain('un libro en PDF');
    expect(md).not.toContain('{{');
  });
});

// La corrida entera (2400 semillas, ~25 s). Se saltea con VIAJE_V2_SIN_2400=1.
describe.skipIf(process.env.VIAJE_V2_SIN_2400 === '1')('viaje v2: simulación completa, 2400 viajes', () => {
  it('ninguna invariante se rompe en las 2400 semillas', () => {
    const todas = correrMuchos(2400);
    const rotas = todas.flatMap((c) => c.violaciones.map((v) => `semilla ${c.e.semilla} ${v.inv}: ${v.detalle}`));
    expect(rotas).toEqual([]);
  }, 180_000);

  it('ninguna invariante se rompe en 800 semillas en catalán y 800 en castellano de España', () => {
    const todas = [...correrMuchos(800, 1, 'ca'), ...correrMuchos(800, 1, 'es-ES')];
    const rotas = todas.flatMap((c) => c.violaciones.map((v) => `${c.e.idioma} semilla ${c.e.semilla} ${v.inv}: ${v.detalle}`));
    expect(rotas).toEqual([]);
  }, 180_000);
});
