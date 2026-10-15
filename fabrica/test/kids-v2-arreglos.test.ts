// Los 6 arreglos que pidió Naza el 05/10 (handoff-2026-10-05.md, "Para Naza").
// Chicos INVENTADOS.

import { describe, it, expect } from 'vitest';
import { fraseQueSalta, FRASES_EXCLUIDAS } from '../src/kids-v2/preocupante.js';
import { BANCO, pregunta } from '../src/kids-v2/banco.js';
import { BORRADOS_POR_TEMA, textoSegunTemas, type Tema } from '../src/kids-v2/compra.js';
import { preguntaMsg } from '../src/kids-v2/motor/mensajes.js';
import { nuevoEstado } from '../src/kids-v2/motor.js';
import { FICHA, ctx, estadoEn, ids, mensaje } from './kids-v2-ayuda.js';
import { empezarItem } from '../src/kids-v2/motor/flujo.js';
import { paso } from '../src/kids-v2/motor.js';
import type { PreguntaPadre } from '../src/kids-v2/compra.js';
import type { Estado, Evento, Salida } from '../src/kids-v2/motor.js';
import { iso } from './kids-v2-ayuda.js';
import { alReloj } from '../src/kids-v2/motor/reloj.js';
import { alBoton } from '../src/kids-v2/motor/botones.js';
import type { Mensaje } from '../src/kids-v2/motor/tipos.js';

/** Aplica eventos en orden ("AAAA-MM-DD HH:MM" de Buenos Aires). */
function correr(e: Estado, pasos: [string, Evento][]): { e: Estado; s: Salida[] } {
  const s: Salida[] = [];
  for (const [cuando, ev] of pasos) {
    const r = paso(e, ev, iso(cuando.slice(0, 10), cuando.slice(11)));
    e = r.estado;
    s.push(...r.salidas);
  }
  return { e, s };
}
const RELOJ: Evento = { tipo: 'reloj' };
const texto = (t: string): Evento => ({ tipo: 'respuesta', contenido: { tipo: 'texto', texto: t } });
const audio = (seg: number, transcripcion?: string): Evento => ({ tipo: 'respuesta', contenido: { tipo: 'audio', seg, ...(transcripcion ? { transcripcion } : {}) } });
const FOTO: Evento = { tipo: 'respuesta', contenido: { tipo: 'foto' } };

describe('kids v2, arreglo 1: K18 sin la mamá o el papá sacados', () => {
  const k18 = (temasSacados: Tema[]) => preguntaMsg(nuevoEstado({ ...FICHA, temasSacados }), pregunta('K18')).texto;

  it('la frase aprobada sigue en el banco (si cambia banco.md, este test avisa)', () => {
    for (const b of BORRADOS_POR_TEMA) {
      expect(pregunta(b.pregunta).texto).toContain(b.frase);
      for (const x of Object.values(b.borrar)) expect(b.frase).toContain(x);
    }
    expect(BORRADOS_POR_TEMA.map((b) => b.pregunta)).toEqual(['K18']);
  });

  it('con los dos temas, el texto aprobado tal cual', () => {
    expect(k18([])).toBe(pregunta('K18').texto);
    expect(k18(['escuela', 'mudanza'])).toBe(pregunta('K18').texto);
  });

  it('sin papá: "como la pareja de tu mamá, o alguien que vino a vivir con ustedes"', () => {
    expect(k18(['papa'])).toBe('¿Hay alguien que ahora es de tu familia pero antes no, como la pareja de tu mamá, o alguien que vino a vivir con ustedes? Contame el día que se conocieron.');
  });

  it('sin mamá: "como la pareja de tu papá, o alguien…"', () => {
    expect(k18(['mama'])).toBe('¿Hay alguien que ahora es de tu familia pero antes no, como la pareja de tu papá, o alguien que vino a vivir con ustedes? Contame el día que se conocieron.');
  });

  it('sin los dos: "como alguien que vino a vivir con ustedes"', () => {
    expect(k18(['mama', 'papa'])).toBe('¿Hay alguien que ahora es de tu familia pero antes no, como alguien que vino a vivir con ustedes? Contame el día que se conocieron.');
  });

  it('cada variante sale solo borrando palabras del texto aprobado (ninguna palabra nueva)', () => {
    const palabras = (t: string) => t.split(/\s+/).map((w) => w.replace(/[,.?¿]/g, ''));
    for (const temas of [['papa'], ['mama'], ['mama', 'papa']] as Tema[][]) {
      const aprobado = palabras(pregunta('K18').texto);
      let i = 0;
      for (const w of palabras(k18(temas))) {
        while (i < aprobado.length && aprobado[i] !== w) i++;
        expect(i, `"${w}" no está en el texto aprobado`).toBeLessThan(aprobado.length);
        i++;
      }
    }
  });

  it('si la frase del banco cambia, tira error (no manda un K18 con "de tu papá")', () => {
    expect(() => textoSegunTemas('K18', 'otro texto de K18', ['papa'])).toThrow(/K18/);
  });

  it('ninguna otra pregunta, otra puerta, foto o extra nombra a mamá o papá sin que su tema la saque', () => {
    const sacadasPorTema = new Set(['K10', 'K11', 'K18']);
    const textos: [string, string][] = [];
    for (const p of BANCO.preguntas) {
      if (sacadasPorTema.has(p.id)) continue;
      textos.push([p.id, p.texto]);
      if (p.op) textos.push([`${p.id}-OP`, p.op.texto]);
      if (p.foto) textos.push([`${p.id}-FOTO`, p.foto.texto]);
      for (const r of p.ramas) if (r.accion.tipo === 'preguntar') for (const t of r.accion.pasos) textos.push([`${p.id}-${r.boton}`, t]);
    }
    // Las extras de mamá y papá ya salen con su tema (temaDeExtra).
    for (const x of BANCO.extras) if (!/tu mamá|tu papá/.test(x.texto)) textos.push([x.id, x.texto]);
    for (const m of BANCO.mensajes) textos.push([m.id, m.texto]);
    expect(textos.filter(([, t]) => /mam[aá]|pap[aá]/i.test(t)).map(([id]) => id)).toEqual([]);
  });
});

describe('kids v2, arreglo 6: falsos avisos de algo preocupante', () => {
  it('la lista de exclusiones es la pedida', () => {
    expect(FRASES_EXCLUIDAS).toEqual(['me corto el pelo', 'me corto las uñas', 'me corto el flequillo', 'matar de la risa', 'me muero de risa', 'abuso de confianza']);
  });

  it.each([
    'mañana me corto el pelo cortito',
    'Me corto las uñas los domingos',
    'me corto el flequillo yo sola',
    'me quiero matar de la risa con mi primo',
    'me muero de risa cuando lo veo',
    'eso fue un abuso de confianza de mi hermano',
    'ME CORTÓ EL PELO mi tía',
    'me corto el pelo, me corto el pelo',
  ])('no salta: "%s"', (t) => {
    expect(fraseQueSalta(t)).toBeNull();
  });

  it('"me corto" solo y "me quiero matar" siguen saltando', () => {
    expect(fraseQueSalta('a veces me corto')).toBe('me corto');
    expect(fraseQueSalta('me quiero matar')).toBe('me quiero matar');
    // Una exclusión en la misma ráfaga no tapa lo otro.
    expect(fraseQueSalta('me corto el pelo y a veces me corto')).toBe('me corto');
    expect(fraseQueSalta('jaja me muero de risa pero en serio me quiero matar')).toBe('me quiero matar');
  });
});

describe('kids v2, arreglo 2: la línea de la pregunta del padre dice quién la manda', () => {
  const linea = (quienRegala: string, p: PreguntaPadre) => {
    const c = ctx(estadoEn('CIERRE-4', { tipo: 'seguir' }, { quienRegala, preguntasPadre: [p] }));
    empezarItem(c, c.e.guion.findIndex((x) => x.clave === 'PADRE-1'), false);
    return c.salidas;
  };

  it('con `quien`, la línea dice quién la escribió (normalizado: "Tu mamá" → "tu mamá")', () => {
    const s = linea('Tus abuelos', { texto: 'Contame la bici.', conLinea: true, quien: 'Tu mamá' });
    expect(ids(s)).toEqual(['PADRE-PREG-LINEA', 'PADRE-1']);
    expect(mensaje(s, 'PADRE-PREG-LINEA').texto).toBe('Esta pregunta te la manda tu mamá, con sus palabras.');
  });

  it('con `quien` en plural, la línea en plural', () => {
    const s = linea('Tu mamá', { texto: 'Contame la bici.', conLinea: true, quien: 'Tus papás' });
    expect(ids(s)).toEqual(['PADRE-PREG-LINEA-PL', 'PADRE-1']);
    expect(mensaje(s, 'PADRE-PREG-LINEA-PL').texto).toBe('Esta pregunta te la mandan tus papás, con sus palabras.');
  });

  it('sin `quien` (o vacío), quién se lo regala, como antes', () => {
    const s = linea('Tus abuelos', { texto: 'Contame la bici.', conLinea: true });
    expect(mensaje(s, 'PADRE-PREG-LINEA-PL').texto).toBe('Esta pregunta te la mandan tus abuelos, con sus palabras.');
    const v = linea('Tu abuela', { texto: 'Contame la bici.', conLinea: true, quien: '  ' });
    expect(mensaje(v, 'PADRE-PREG-LINEA').texto).toBe('Esta pregunta te la manda tu abuela, con sus palabras.');
  });

  it('"sin decir que es mía": no hay línea aunque tenga `quien`', () => {
    expect(ids(linea('Tu mamá', { texto: 'Contame la bici.', conLinea: false, quien: 'tu papá' }))).toEqual(['PADRE-1']);
  });

  it('el panel lo puede poner o cambiar con el evento ficha (antes del cap. 4)', () => {
    const e0 = estadoEn('K5', { tipo: 'seguir' }, { quienRegala: 'Tus abuelos', preguntasPadre: [{ texto: 'Contame la bici.', conLinea: true }] });
    const r = paso(e0, { tipo: 'ficha', cambios: { preguntasPadre: [{ texto: 'Contame la bici.', conLinea: true, quien: 'Tu mamá' }] } }, new Date('2026-10-10T21:05:00Z').toISOString());
    expect(r.estado.ficha.preguntasPadre[0].quien).toBe('tu mamá');
    expect(r.estado.guion.find((x) => x.clave === 'PADRE-1')).toMatchObject({ quien: 'tu mamá' });
  });
});

describe('kids v2, arreglo 4: en una foto, solo un "no" corto vale como [No tengo]', () => {
  const enFoto = (clave = 'K1') => estadoEn(clave, { tipo: 'foto', clave }, {}, { diaHecho: '2026-10-10' });

  it.each(['no tengo', 'nada', 'No.', 'NINGUNA así', 'ninguno', 'tampoco tengo', 'nunca saqué'])('"%s" → B-FOTO-NOTENGO, sin acuse, espera el audio', (t) => {
    const { s, e } = correr(enFoto(), [
      ['2026-10-10 18:05', texto(t)],
      ['2026-10-10 18:07', RELOJ],
    ]);
    expect(ids(s)).toEqual(['B-FOTO-NOTENGO']);
    expect(e.fase).toMatchObject({ tipo: 'foto-audio', clave: 'K1' });
  });

  it('un audio corto que dice que no (con su transcripción): igual', () => {
    const { s } = correr(enFoto(), [
      ['2026-10-10 18:05', audio(4, 'Nó, no tengo')],
      ['2026-10-10 18:07', RELOJ],
    ]);
    expect(ids(s)).toEqual(['B-FOTO-NOTENGO']);
  });

  it.each(['ya te la mando', 'ahí va', 'nono', 'después la busco'])('"%s" → nada (sin acuse) y sigue esperando la foto; cuando llega, su acuse', (t) => {
    const a = correr(enFoto(), [
      ['2026-10-10 18:05', texto(t)],
      ['2026-10-10 18:07', RELOJ],
    ]);
    expect(ids(a.s)).toEqual([]);
    expect(a.e.fase).toEqual({ tipo: 'foto', clave: 'K1' });
    const b = correr(a.e, [
      ['2026-10-10 18:20', FOTO],
      ['2026-10-10 18:22', RELOJ],
    ]);
    expect(ids(b.s)).toEqual([expect.stringMatching(/^ACUSE-FOTO-\d$/), 'B-SEGUIR']);
  });

  it('un audio corto sin transcripción no dice que no: sigue esperando la foto', () => {
    const { s, e } = correr(enFoto(), [
      ['2026-10-10 18:05', audio(4)],
      ['2026-10-10 18:07', RELOJ],
    ]);
    expect(ids(s)).toEqual([]);
    expect(e.fase).toEqual({ tipo: 'foto', clave: 'K1' });
  });

  it('después de B-FOTO-NOTENGO manda la foto igual: se toma como la foto, con su acuse', () => {
    const { s, e } = correr(enFoto(), [
      ['2026-10-10 18:05', texto('no tengo')],
      ['2026-10-10 18:07', RELOJ],
      ['2026-10-10 18:09', FOTO],
      ['2026-10-10 18:11', RELOJ],
    ]);
    expect(ids(s)).toEqual(['B-FOTO-NOTENGO', expect.stringMatching(/^ACUSE-FOTO-\d$/), 'B-SEGUIR']);
    expect(e.fase).toEqual({ tipo: 'seguir' });
  });

  it('lo mismo después de tocar [No tengo]', () => {
    const { s } = correr(enFoto(), [
      ['2026-10-10 18:05', { tipo: 'boton', boton: 'No tengo' }],
      ['2026-10-10 18:09', FOTO],
      ['2026-10-10 18:11', RELOJ],
    ]);
    expect(ids(s)).toEqual(['B-FOTO-NOTENGO', expect.stringMatching(/^ACUSE-FOTO-\d$/), 'B-SEGUIR']);
  });

  it('la foto de una extra (X1-7) y una foto vencida al final (K1-FOTO): "no tengo" vale, "ahí va" espera', () => {
    const x = correr(estadoEn('UNA-MAS-1', { tipo: 'foto', clave: 'X1-7' }, {}, { extra: 'X1-7' }), [
      ['2026-10-10 18:05', texto('no tengo nada así')],
      ['2026-10-10 18:07', RELOJ],
    ]);
    expect(ids(x.s)).toEqual(['B-FOTO-NOTENGO']);
    const v = correr(estadoEn('EXTRAS', { tipo: 'foto', clave: 'K1-FOTO' }, {}, { extra: 'K1-FOTO' }), [
      ['2026-10-10 18:05', texto('ahí va')],
      ['2026-10-10 18:07', RELOJ],
    ]);
    expect(ids(v.s)).toEqual([]);
    expect(v.e.fase).toEqual({ tipo: 'foto', clave: 'K1-FOTO' });
  });
});

describe('kids v2, arreglo 3: en la foto de K24, un "no" corto vale como [Hoy no la como]', () => {
  const enK24 = () => estadoEn('K24', { tipo: 'foto', clave: 'K24' }, {}, { diaHecho: '2026-10-10' });

  it('"no" escrito: sin acuse, espera el audio (como el botón)', () => {
    const { s, e } = correr(enK24(), [
      ['2026-10-10 18:05', texto('no')],
      ['2026-10-10 18:07', RELOJ],
    ]);
    expect(ids(s)).toEqual([]);
    expect(e.fase).toMatchObject({ tipo: 'foto-audio', clave: 'K24' });
  });

  it('igual que tocar [Hoy no la como]: después cuenta y va el acuse', () => {
    const escrito = correr(enK24(), [
      ['2026-10-10 18:05', audio(5, 'hoy no')],
      ['2026-10-10 18:07', RELOJ],
      ['2026-10-10 18:08', audio(40)],
      ['2026-10-10 18:10', RELOJ],
    ]);
    const tocado = correr(enK24(), [
      ['2026-10-10 18:05', { tipo: 'boton', boton: 'Hoy no la como' }],
      ['2026-10-10 18:07', RELOJ],
      ['2026-10-10 18:08', audio(40)],
      ['2026-10-10 18:10', RELOJ],
    ]);
    expect(ids(escrito.s)).toEqual(ids(tocado.s));
    expect(ids(escrito.s)).toEqual([expect.stringMatching(/^ACUSE-\d$/), 'B-SEGUIR']);
  });
});

describe('kids v2, arreglo 3b: en K24, algo corto sin "no" es el "contame" (la respuesta a la foto)', () => {
  const enK24 = () => estadoEn('K24', { tipo: 'foto', clave: 'K24' }, {}, { diaHecho: '2026-10-10' });

  it('"milanesas": acuse y el día sigue (como después de una foto)', () => {
    const { s, e } = correr(enK24(), [
      ['2026-10-10 18:05', texto('milanesas')],
      ['2026-10-10 18:07', RELOJ],
    ]);
    expect(ids(s)).toEqual([expect.stringMatching(/^ACUSE-\d$/), 'B-SEGUIR']);
    expect(e.fase.tipo).not.toBe('foto');
  });

  it('"la comí ayer en lo de mi abuela": también es la respuesta', () => {
    const { s } = correr(enK24(), [
      ['2026-10-10 18:05', texto('la comí ayer en lo de mi abuela')],
      ['2026-10-10 18:07', RELOJ],
    ]);
    expect(ids(s)).toEqual([expect.stringMatching(/^ACUSE-\d$/), 'B-SEGUIR']);
  });

  it('"no" en K24 sigue como [Hoy no la como]', () => {
    const { s, e } = correr(enK24(), [
      ['2026-10-10 18:05', texto('no')],
      ['2026-10-10 18:07', RELOJ],
    ]);
    expect(ids(s)).toEqual([]);
    expect(e.fase).toMatchObject({ tipo: 'foto-audio', clave: 'K24' });
  });

  it('en K1 (otra foto), "ya te la mando" sigue esperando en silencio', () => {
    const { s, e } = correr(estadoEn('K1', { tipo: 'foto', clave: 'K1' }, {}, { diaHecho: '2026-10-10' }), [
      ['2026-10-10 18:05', texto('ya te la mando')],
      ['2026-10-10 18:07', RELOJ],
    ]);
    expect(ids(s)).toEqual([]);
    expect(e.fase).toEqual({ tipo: 'foto', clave: 'K1' });
  });
});

describe('kids v2, arreglo 5: canal B, TERMINO-PADRE aunque el padre nunca toque el botón del final', () => {
  const retenidoEnExtras = (canal: 'A' | 'B' = 'B') => {
    const oferta: Mensaje = { a: canal === 'A' ? 'chico' : 'padre', id: 'EXTRAS-OFERTA', texto: 'x', botones: ['Dale, otra'], plantilla: null };
    return estadoEn('EXTRAS', { tipo: 'retenido', mensajes: [oferta], luego: { tipo: 'extras-oferta' } }, { canal }, {
      extrasDesde: iso('2026-10-08', '18:00'),
      ultimaEntrada: iso('2026-10-06', '18:29'),
    });
  };
  const reloj = (e: Estado, fecha: string, hora: string) => {
    const c = ctx(e, fecha, hora);
    alReloj(c);
    return c;
  };

  it('cierra solo el 10 con el final retenido; si sigue retenido 2 días después (el 12), sale TERMINO-PADRE a la hora, una sola vez', () => {
    const d10 = reloj(retenidoEnExtras(), '2026-10-10', '18:00');
    expect(ids(d10.salidas)).toEqual(['marca:cerro-sin-respuesta']);
    expect(ids(reloj(d10.e, '2026-10-11', '18:00').salidas)).toEqual([]);
    const d12a = reloj(d10.e, '2026-10-12', '17:59');
    expect(ids(d12a.salidas)).toEqual([]);
    const d12 = reloj(d12a.e, '2026-10-12', '18:00');
    expect(ids(d12.salidas)).toEqual(['TERMINO-PADRE']);
    const t = mensaje(d12.salidas, 'TERMINO-PADRE');
    expect(t.a).toBe('padre');
    expect(t.plantilla).not.toBeNull();
    // El final sigue retenido: le llega cuando toque el botón.
    expect(d12.e.fase).toMatchObject({ tipo: 'retenido', luego: { tipo: 'terminado' } });
    expect(ids(reloj(d12.e, '2026-10-13', '18:00').salidas)).toEqual([]);
    // Toca [Estamos listos] el 14: le llega el final; TERMINO-PADRE no vuelve a salir.
    const toca = ctx(d12.e, '2026-10-14', '10:00');
    alBoton(toca, 'Estamos listos');
    expect(ids(toca.salidas)).toEqual(['FINAL-CHICO']);
    expect(toca.e.fase).toEqual({ tipo: 'terminado' });
    expect(ids(reloj(toca.e, '2026-10-15', '18:00').salidas)).toEqual([]);
    expect(ids(reloj(toca.e, '2026-10-20', '18:00').salidas)).toEqual([]);
  });

  it('nunca de noche: el 12 a las 22:30 no sale', () => {
    const d10 = reloj(retenidoEnExtras(), '2026-10-10', '18:00');
    const noche = reloj(d10.e, '2026-10-12', '22:30');
    expect(ids(noche.salidas)).toEqual([]);
  });

  it('si el final le llega antes (el 11), TERMINO-PADRE va al día siguiente de que llegó, como antes', () => {
    const d10 = reloj(retenidoEnExtras(), '2026-10-10', '18:00');
    const toca = ctx(d10.e, '2026-10-11', '10:00');
    alBoton(toca, 'Estamos listos');
    expect(ids(toca.salidas)).toEqual(['FINAL-CHICO']);
    expect(ids(reloj(toca.e, '2026-10-11', '18:00').salidas)).toEqual([]);
    expect(ids(reloj(toca.e, '2026-10-12', '18:00').salidas)).toEqual(['TERMINO-PADRE']);
  });

  it('el final que sale a la hora detrás de un PREG-NUEVA-PADRE (ventana abierta) y nunca se toca: igual, 2 días después', () => {
    const e = estadoEn('EXTRAS', { tipo: 'libre', siguiente: 0 }, { canal: 'B' }, { ultimaEntrada: iso('2026-10-10', '12:00') });
    const c = ctx(e, '2026-10-10', '18:00');
    empezarItem(c, e.guion.findIndex((x) => x.tipo === 'final'), true);
    expect(ids(c.salidas)).toEqual(['PREG-NUEVA-PADRE']);
    expect(c.e.fase).toMatchObject({ tipo: 'retenido', luego: { tipo: 'terminado' } });
    expect(ids(reloj(c.e, '2026-10-11', '18:00').salidas)).toEqual([]);
    expect(ids(reloj(c.e, '2026-10-12', '18:00').salidas)).toEqual(['TERMINO-PADRE']);
  });

  it('canal A no cambia: TERMINO-PADRE al cerrar, y nada más después', () => {
    const d10 = reloj(retenidoEnExtras('A'), '2026-10-10', '18:00');
    expect(ids(d10.salidas)).toEqual(['TERMINO-PADRE', 'marca:cerro-sin-respuesta']);
    expect(ids(reloj(d10.e, '2026-10-12', '18:00').salidas)).toEqual([]);
  });
});
