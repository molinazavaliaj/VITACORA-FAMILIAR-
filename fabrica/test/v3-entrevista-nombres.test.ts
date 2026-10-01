// Los pedidos de nombre (Fable, 01/10; OK de Naza el 01/10). La regla vieja
// "sin nombres" era que la pregunta no nombre a la persona, no que no se le
// pida el nombre al narrador. Propuesta: docs/v3/entrevista/simulaciones/propuesta-nombres.md.
// Los textos se comparan letra por letra.

import { describe, expect, it } from 'vitest';
import { preguntaPorId } from '../src/v3/entrevista/banco.js';

const SALIDA = 'Si ya me lo contaste, decímelo, y si querés reforzar algo, es el momento.';

const APROBADOS: Record<string, string> = {
  OR2: 'En todas las familias hay una historia de los de antes, de los abuelos o más atrás, que se contaba en las sobremesas: un viaje, una llegada, alguna hazaña. ¿Cuál sabés de tu familia? Contámela como la escuchaste, con el nombre de quien la vivió.',
  CA2: 'Viajemos un rato a cuando eras chic{{o/a}}. Presentame a tu mamá con su nombre: ¿cómo era con vos en esa época? Si te viene a la cabeza alguna anécdota con ella, contámela: dónde estaban, qué pasó.',
  CA3: '¿Y tu papá? Decime su nombre y a qué se dedicaba cuando eras chic{{o/a}}. Contame alguna vez que lo acompañaste o lo viste trabajando. Y si tu papá no estuvo, o preferís no entrar, contame lo que vos quieras de él.',
  CA6: '¿Tuviste hermanos? Si ya salieron en la charla no importa, quiero saber más: decime sus nombres, contame con cuál eras más cercan{{o/a}} de chic{{o/a}} y alguna aventura que hayan hecho juntos; seguro tienen varias.',
  ES2: '¿Tuviste una maestra o un maestro que te marcó en la primaria? ¿Cómo se llamaba? ¿Cómo era con ustedes? Contame una vez con esa persona que no te olvidás: qué pasó en el aula ese día.',
  ES5: 'De chic{{o/a}}, ¿tenías un mejor amigo o una mejor amiga, de la escuela o del barrio? Contame quién era, con nombre, y qué hacían cuando andaban juntos. Contame una tarde con esa persona que todavía te hace sonreír.',
  AD6: 'En esos años, ¿cuándo fue la primera vez que alguien te gustó en serio? Contame cómo se conocieron, cómo se llamaba, cómo era esa persona, y un momento de los dos que todavía llevás guardado.',
  AM1: `Empecemos por su nombre. Y contame el día que se conocieron: dónde fue, quién los presentó o cómo se cruzaron, y qué fue lo primero que te llamó la atención de esa persona. ${SALIDA}`,
  HI8: 'Ahora, los nietos. ¿Llegaron nietos a tu vida? Puede que ya los hayas mencionado; nombrámelos de a uno, y contame el día que conociste al primero, como si lo estuvieras viendo. Si no hay nietos, pasamos a otra cosa.',
  AS1: 'Ya de grande, ¿hubo alguien que conociste y se volvió muy importante en tu vida, un amigo o una amiga? Contame de quién hablás, con su nombre, cómo se conocieron, y una vez que muestre bien cómo es esa amistad.',
  TR3: '¿Alguien te dio una mano en tu camino? Alguien que te enseñó, te acompañó o te abrió una puerta en lo que hiciste. Contame quién fue, con su nombre, cómo era esa persona, y una vez con ella que tengas bien clara.',
};

describe('pedir los nombres', () => {
  it.each(Object.entries(APROBADOS))('%s, letra por letra', (id, esperado) => {
    expect(preguntaPorId(id)?.texto).toBe(esperado);
  });

  it('HI0 ya pedía los nombres y OR1 no los pide (los padres van en CA2 y CA3)', () => {
    expect(preguntaPorId('OR1')?.texto).not.toMatch(/nombre/);
  });
});
