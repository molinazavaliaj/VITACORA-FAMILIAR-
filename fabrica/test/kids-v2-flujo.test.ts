import { describe, it, expect } from 'vitest';
import { BANCO, pregunta } from '../src/kids-v2/banco.js';
import { acusar, empezarItem, entregar, extrasDelFinal, mandarExtra, soltarRetenido, terminarItem, ventanaAbierta } from '../src/kids-v2/motor/flujo.js';
import { fijoA } from '../src/kids-v2/motor/mensajes.js';
import { ctx, estadoEn, ids, iso, mensaje } from './kids-v2-ayuda.js';

const idx = (e: { guion: { clave: string }[] }, k: string) => e.guion.findIndex((x) => x.clave === k);

describe('kids v2: entregar (ventana de 24 h, canal B)', () => {
  it('reactivo o con la ventana abierta: sale directo', () => {
    const c = ctx(estadoEn('K5', { tipo: 'seguir' }));
    entregar(c, [fijoA(c.e, 'B-SEGUIR')], { tipo: 'seguir' }, true);
    expect(ids(c.salidas)).toEqual(['B-SEGUIR']);
  });

  it('a la hora con la ventana cerrada: PREG-NUEVA-CHICO y lo demás retenido hasta el botón; no sale otro aviso encima', () => {
    const c = ctx(estadoEn('K5', { tipo: 'libre', siguiente: 5 }, {}, { ultimaEntrada: iso('2026-10-08', '18:00') }), '2026-10-10', '18:00');
    expect(ventanaAbierta(c.e, c.ahora)).toBe(false);
    entregar(c, [fijoA(c.e, 'B-SEGUIR')], { tipo: 'seguir' }, true);
    expect(ids(c.salidas)).toEqual(['PREG-NUEVA-CHICO']);
    expect(c.e.fase).toMatchObject({ tipo: 'retenido', luego: { tipo: 'seguir' } });
    entregar(c, [fijoA(c.e, 'B-MAÑANA')], { tipo: 'libre', siguiente: 6 }, true);
    expect(ids(c.salidas)).toEqual(['PREG-NUEVA-CHICO']); // no se acumulan
    soltarRetenido(c);
    expect(ids(c.salidas)).toEqual(['PREG-NUEVA-CHICO', 'B-MAÑANA']);
    expect(c.e.fase).toEqual({ tipo: 'libre', siguiente: 6 });
  });

  it('canal B: a la hora siempre PREG-NUEVA-PADRE, aunque la ventana esté abierta', () => {
    const c = ctx(estadoEn('K5', { tipo: 'libre', siguiente: 5 }, { canal: 'B' }), '2026-10-10', '18:00');
    entregar(c, [fijoA(c.e, 'B-SEGUIR')], { tipo: 'seguir' }, true);
    expect(ids(c.salidas)).toEqual(['PREG-NUEVA-PADRE']);
    expect(c.salidas[0]).toMatchObject({ a: 'padre', plantilla: { nombre: 'kids_pregunta_nueva_padre' } });
  });
});

describe('kids v2: empezar un item', () => {
  it('la primera del capítulo lleva su entrada; las principales dejan el día hecho', () => {
    const c = ctx(estadoEn('CIERRE-1', { tipo: 'seguir' }));
    empezarItem(c, idx(c.e, 'K10'), false);
    expect(ids(c.salidas)).toEqual(['ENTRADA-2', 'K10']);
    expect(c.e.fase).toEqual({ tipo: 'pregunta', clave: 'K10', rama: null, pasoRama: 0 });
    expect(c.e.diaHecho).toBe('2026-10-10');
  });

  it('K39: antes va el aviso de la seria, no la pregunta', () => {
    const c = ctx(estadoEn('K38', { tipo: 'seguir' }));
    empezarItem(c, idx(c.e, 'K39'), false);
    expect(ids(c.salidas)).toEqual(['B-AVISO-SERIA']);
    expect(c.e.fase).toEqual({ tipo: 'aviso-seria' });
  });

  it('la pregunta del padre, con su línea', () => {
    const c = ctx(estadoEn('CIERRE-4', { tipo: 'seguir' }, { preguntasPadre: [{ texto: 'Contame la bici.', conLinea: true }] }));
    empezarItem(c, idx(c.e, 'PADRE-1'), false);
    expect(ids(c.salidas)).toEqual(['PADRE-PREG-LINEA', 'PADRE-1']);
  });

  it('"una más" sin extras disponibles: directo al cierre', () => {
    const c = ctx(estadoEn('K40', { tipo: 'pregunta', clave: 'K40', rama: null, pasoRama: 0 }, {}, { extrasUsadas: ['X4-1', 'X4-2'] }));
    empezarItem(c, idx(c.e, 'UNA-MAS-4'), false);
    expect(ids(c.salidas)).toEqual(['CIERRE-4']);
  });

  it('el final: canal A, TERMINO-PADRE al padre y FINAL-CHICO (plural si corresponde)', () => {
    const c = ctx(estadoEn('EXTRAS', { tipo: 'extras-otra' }, { quienRegala: 'Tus papás' }));
    empezarItem(c, idx(c.e, 'FINAL'), false);
    expect(ids(c.salidas)).toEqual(['TERMINO-PADRE', 'FINAL-CHICO-PL']);
    expect(mensaje(c.salidas, 'TERMINO-PADRE').a).toBe('padre');
    expect(mensaje(c.salidas, 'FINAL-CHICO-PL').texto).toMatch(/^Bueno Bruno, hasta acá llegamos\..*te lo van a dar tus papás, que fueron quienes/);
    expect(c.e.fase).toEqual({ tipo: 'terminado' });
  });

  it('el final en canal B: TERMINO-PADRE queda para el día siguiente', () => {
    const c = ctx(estadoEn('EXTRAS', { tipo: 'extras-otra' }, { canal: 'B' }));
    empezarItem(c, idx(c.e, 'FINAL'), false);
    expect(ids(c.salidas)).toEqual(['FINAL-CHICO']);
    expect(c.e.terminoPadre).toBe('2026-10-11');
  });
});

describe('kids v2: terminar un item (qué sigue)', () => {
  it('una principal del medio: B-SEGUIR', () => {
    const c = ctx(estadoEn('K5', { tipo: 'pregunta', clave: 'K5', rama: null, pasoRama: 0 }));
    terminarItem(c);
    expect(ids(c.salidas)).toEqual(['B-SEGUIR']);
  });

  it('la última del capítulo: "una más" (sin seguir); K47: directo al cierre final', () => {
    const c = ctx(estadoEn('K9', { tipo: 'pregunta', clave: 'K9', rama: null, pasoRama: 0 }));
    terminarItem(c);
    expect(ids(c.salidas)).toEqual(['B-UNA-MAS']);
    const d = ctx(estadoEn('K47', { tipo: 'pregunta', clave: 'K47', rama: null, pasoRama: 0 }));
    terminarItem(d);
    expect(ids(d.salidas)).toEqual(['CIERRE-FINAL']);
  });

  it('K39: si contó, la tranquila; si pasó, K40 directo', () => {
    const conto = ctx(estadoEn('K39', { tipo: 'pregunta', clave: 'K39', rama: null, pasoRama: 0 }, {}, { conto: true }));
    terminarItem(conto);
    expect(ids(conto.salidas)).toEqual(['B-TRANQUILA']);
    const paso = ctx(estadoEn('K39', { tipo: 'pregunta', clave: 'K39', rama: null, pasoRama: 0 }));
    terminarItem(paso);
    expect(ids(paso.salidas)).toEqual(['K40']);
  });

  it('el cierre de un capítulo: B-SEGUIR; el cierre final: la oferta de extras', () => {
    const c = ctx(estadoEn('CIERRE-2', { tipo: 'cierre' }));
    terminarItem(c);
    expect(ids(c.salidas)).toEqual(['B-SEGUIR']);
    const d = ctx(estadoEn('CIERRE-FINAL', { tipo: 'cierre' }));
    terminarItem(d);
    expect(ids(d.salidas)).toEqual(['EXTRAS-OFERTA']);
  });

  it('la extra de "una más": al cierre; una extra del final: EXTRAS-OTRA, o EXTRAS-FIN y el final si no quedan', () => {
    const c = ctx(estadoEn('UNA-MAS-1', { tipo: 'pregunta', clave: 'X1-1', rama: null, pasoRama: 0 }, {}, { extra: 'X1-1' }));
    terminarItem(c);
    expect(ids(c.salidas)).toEqual(['CIERRE-1']);
    const d = ctx(estadoEn('EXTRAS', { tipo: 'pregunta', clave: 'X1-1', rama: null, pasoRama: 0 }, {}, { extra: 'X1-1' }));
    terminarItem(d);
    expect(ids(d.salidas)).toEqual(['EXTRAS-OTRA']);
    const todas = BANCO.extras.map((x) => x.id);
    const e = ctx(estadoEn('EXTRAS', { tipo: 'pregunta', clave: 'X5-3', rama: null, pasoRama: 0 }, {}, { extra: 'X5-3', extrasUsadas: todas }));
    terminarItem(e);
    expect(ids(e.salidas)).toEqual(['EXTRAS-FIN', 'TERMINO-PADRE', 'FINAL-CHICO']);
  });
});

describe('kids v2: acuses según el caso', () => {
  it('rotan; escrito sin "escuché"; en la cápsula sin "libro"; K39 con los del día feo', () => {
    const c = ctx(estadoEn('K5', { tipo: 'pregunta', clave: 'K5', rama: null, pasoRama: 0 }, {}, { rotacion: { acuse: 'ACUSE-2', foto: null, diaFeo: null } }));
    acusar(c, false);
    acusar(c, true);
    expect(ids(c.salidas)).toEqual(['ACUSE-3', 'ACUSE-5']);
    const cap = ctx(estadoEn('K42', { tipo: 'pregunta', clave: 'K42', rama: null, pasoRama: 0 }, {}, { rotacion: { acuse: 'ACUSE-2', foto: null, diaFeo: null } }));
    acusar(cap, false);
    acusar(cap, false);
    expect(ids(cap.salidas)).toEqual(['ACUSE-4', 'ACUSE-5']);
    const feo = ctx(estadoEn('K39', { tipo: 'pregunta', clave: 'K39', rama: null, pasoRama: 0 }));
    acusar(feo, false);
    acusar(feo, false);
    expect(ids(feo.salidas)).toEqual(['B-DIAFEO-ACUSE-1', 'B-DIAFEO-ACUSE-2']);
  });
});

describe('kids v2: las fotos vencidas vuelven al final (cambio A de Naza, 05/10)', () => {
  it('foto de K1 vencida → aparece en la oferta de extras antes que X1-1', () => {
    const c = ctx(estadoEn('CIERRE-FINAL', { tipo: 'cierre' }, {}, { fotosVencidas: ['K1'] }));
    terminarItem(c);
    expect(ids(c.salidas)).toEqual(['EXTRAS-OFERTA']);
    const [primera, segunda] = extrasDelFinal(c.e);
    expect(primera.id).toBe('K1-FOTO');
    expect(segunda.id).toBe('X1-1');
    mandarExtra(c, primera);
    const foto = pregunta('K1').foto!;
    expect(mensaje(c.salidas, 'K1-FOTO')).toMatchObject({ texto: foto.texto, botones: foto.botones, plantilla: null });
    expect(c.e.fase).toEqual({ tipo: 'foto', clave: 'K1-FOTO' });
    expect(c.e.extra).toBe('K1-FOTO');
    expect(c.e.fotosVencidas).toEqual([]);
    expect(c.e.extrasUsadas).toEqual([]);
    expect(extrasDelFinal(c.e)[0].id).toBe('X1-1');
  });

  it('con una foto vencida siempre hay oferta, aunque no queden extras del banco; servida, EXTRAS-FIN y el final', () => {
    const todas = BANCO.extras.map((x) => x.id);
    const c = ctx(estadoEn('CIERRE-FINAL', { tipo: 'cierre' }, {}, { fotosVencidas: ['K1'], extrasUsadas: todas }));
    terminarItem(c);
    expect(ids(c.salidas)).toEqual(['EXTRAS-OFERTA']);
    const [x] = extrasDelFinal(c.e);
    mandarExtra(c, x);
    terminarItem(c);
    expect(ids(c.salidas)).toEqual(['EXTRAS-OFERTA', 'K1-FOTO', 'EXTRAS-FIN', 'TERMINO-PADRE', 'FINAL-CHICO']);
  });
});

describe('kids v2: el final por plantilla propia (cambio B de Naza, 05/10)', () => {
  it('final con ventana cerrada → salida con plantilla kids_final y sin PREG-NUEVA', () => {
    const e = estadoEn('EXTRAS', { tipo: 'extras-oferta' }, {}, { ultimaEntrada: iso('2026-10-08', '18:29') });
    const c = ctx(e, '2026-10-10', '18:00');
    expect(ventanaAbierta(c.e, c.ahora)).toBe(false);
    empezarItem(c, idx(c.e, 'FINAL'), true);
    expect(ids(c.salidas)).toEqual(['FINAL-CHICO', 'TERMINO-PADRE']);
    const final = mensaje(c.salidas, 'FINAL-CHICO');
    expect(final.a).toBe('chico');
    expect(final.plantilla).toEqual({ nombre: 'kids_final', variables: ['Bruno', 'tu mamá'] });
    expect(final.texto).toMatch(/^Bueno Bruno, hasta acá llegamos\..*te lo va a dar tu mamá, que fue quien/);
    expect(c.e.fase).toEqual({ tipo: 'terminado' });
  });

  it('plural: kids_final_plural', () => {
    const e = estadoEn('EXTRAS', { tipo: 'extras-oferta' }, { quienRegala: 'Tus papás' }, { ultimaEntrada: iso('2026-10-08', '18:29') });
    const c = ctx(e, '2026-10-10', '18:00');
    empezarItem(c, idx(c.e, 'FINAL'), true);
    expect(ids(c.salidas)).toEqual(['FINAL-CHICO-PL', 'TERMINO-PADRE']);
    expect(mensaje(c.salidas, 'FINAL-CHICO-PL').plantilla).toEqual({ nombre: 'kids_final_plural', variables: ['Bruno', 'tus papás'] });
  });

  it('con la ventana abierta, a la hora: sale directo, sin plantilla', () => {
    const c = ctx(estadoEn('EXTRAS', { tipo: 'extras-oferta' }), '2026-10-10', '18:00');
    empezarItem(c, idx(c.e, 'FINAL'), true);
    expect(ids(c.salidas)).toEqual(['TERMINO-PADRE', 'FINAL-CHICO']);
    expect(mensaje(c.salidas, 'FINAL-CHICO').plantilla).toBeNull();
  });
});
