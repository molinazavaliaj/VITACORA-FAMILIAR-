// Los 6 arreglos que pidió Naza el 05/10 (handoff-2026-10-05.md, "Para Naza").
// Chicos INVENTADOS.

import { describe, it, expect } from 'vitest';
import { fraseQueSalta, FRASES_EXCLUIDAS } from '../src/kids-v2/preocupante.js';
import { BANCO, pregunta } from '../src/kids-v2/banco.js';
import { BORRADOS_POR_TEMA, textoSegunTemas, type Tema } from '../src/kids-v2/compra.js';
import { preguntaMsg } from '../src/kids-v2/motor/mensajes.js';
import { nuevoEstado } from '../src/kids-v2/motor.js';
import { FICHA } from './kids-v2-ayuda.js';

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
