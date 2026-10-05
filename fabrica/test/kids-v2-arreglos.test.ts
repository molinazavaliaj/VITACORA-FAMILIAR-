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
