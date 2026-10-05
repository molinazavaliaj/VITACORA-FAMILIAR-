// Los 6 arreglos que pidió Naza el 05/10 (handoff-2026-10-05.md, "Para Naza").
// Chicos INVENTADOS.

import { describe, it, expect } from 'vitest';
import { fraseQueSalta, FRASES_EXCLUIDAS } from '../src/kids-v2/preocupante.js';

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
