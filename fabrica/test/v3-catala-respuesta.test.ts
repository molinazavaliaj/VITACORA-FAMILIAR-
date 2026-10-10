// La entrevista en catalán (Naza, 04/10): el detector de respuestas entiende
// catalán y castellano cuando la entrevista es en catalán (quien habla catalán
// mezcla), y en castellano sigue exactamente igual. Las reglas (topes de
// palabras, "pero", signos) son las mismas; cambian las frases.
// Ejemplos inventados.

import { describe, expect, it } from 'vitest';
import { preguntaPorId } from '../src/v3/entrevista/banco.js';
import { interpretar, type PreguntaParaInterpretar } from '../src/v3/entrevista/respuesta.js';

const p = (id: string): PreguntaParaInterpretar => preguntaPorId(id)!;
const ca = (id: string, r: string) => interpretar(p(id), r, 'ca');
const es = (id: string, r: string) => interpretar(p(id), r);

describe('"passo" en catalán', () => {
  it('"Passo." y "Passo, d\'això no." son paso', () => {
    expect(ca('CA2', 'Passo.')).toBe('paso');
    expect(ca('CA2', "Passo, d'això no."))
      .toBe('paso');
  });
  it('"Passo per davant de casa…" es el verbo: contó algo', () => {
    expect(ca('CA2', 'Passo per davant de la casa on vaig néixer cada diumenge i encara la miro.')).toBe('conto');
  });
  it('las negativas completas valen aunque siga algo', () => {
    expect(ca('CA2', "No en vull parlar.")).toBe('paso');
    expect(ca('CA2', 'Prefereixo no parlar-ne.')).toBe('paso');
    expect(ca('CA2', "Això m'ho guardo.")).toBe('paso');
    expect(ca('CA2', "Deixem-ho aquí.")).toBe('paso');
  });
  it('las frases solas valen solo si van solas', () => {
    expect(ca('CA2', 'La següent.')).toBe('paso');
    expect(ca('CA2', 'Aquesta no.')).toBe('paso');
    expect(ca('CA2', 'Una altra vegada vam anar al riu amb el meu germà.')).toBe('conto');
  });
});

describe('olvido en catalán', () => {
  it('"No me\'n recordo." es olvido (el apóstrofo no corta la frase)', () => {
    expect(ca('CA2', "No me'n recordo.")).toBe('olvido');
    expect(ca('CA2', 'No me’n recordo, la veritat.')).toBe('olvido');
    expect(ca('CA2', 'No ho recordo.')).toBe('olvido');
    expect(ca('CA2', "No m'enrecordo.")).toBe('olvido');
    expect(ca('CA2', 'No ho sé.')).toBe('olvido');
    expect(ca('CA2', 'Ni idea.')).toBe('olvido');
    expect(ca('CA2', "No en tinc ni idea.")).toBe('olvido');
  });
  it('"se m\'ha esborrat" y "la memòria em falla"', () => {
    expect(ca('CA2', "Això se m'ha esborrat del tot.")).toBe('olvido');
    expect(ca('CA2', 'Ai, la memòria em falla.')).toBe('olvido');
  });
  it('olvido a medias: arranca con olvido y sigue contando', () => {
    expect(ca('CA2', "No me'n recordo gaire, però sé que hi havia un pati amb una figuera i jugàvem a pilota amb els cosins.")).toBe('olvido-a-medias');
  });
  it('"No sé per on començar…" cuenta algo', () => {
    expect(ca('CA2', 'No sé per on començar. La casa era petita i hi vivíem sis.')).not.toBe('olvido');
  });
  it('en catalán también entiende el olvido en castellano (quien habla catalán mezcla)', () => {
    expect(ca('CA2', 'No me acuerdo.')).toBe('olvido');
  });
});

describe('"no" corto en catalán', () => {
  it('"No, mai." y "Mai." son un no', () => {
    expect(ca('HI0', 'No, mai.')).toBe('no');
    expect(ca('CA6', 'No, era fill únic.')).toBe('no');
    expect(ca('HI8', 'Tampoc.')).toBe('no');
  });
  it('"però" en las primeras cinco palabras lo da vuelta', () => {
    expect(ca('HI0', 'No, però vaig criar el fill de la meva germana com si fos meu.')).toBe('conto');
  });
  it('HI0: "vam criar" o "com un fill" es un sí', () => {
    expect(ca('HI0', 'No en vam tenir, però el vam criar a ell.')).toBe('conto');
    expect(ca('HI0', 'No de sang, la nena del veí la vaig criar jo.')).toBe('conto');
  });
  it('"Mai m\'oblidaré d\'aquell dia" cuenta algo', () => {
    expect(ca('CA16', "Mai m'oblidaré d'aquell dia.")).toBe('conto');
  });
  it('"Cap als vint anys…" cuenta algo ("cap a" es "hacia")', () => {
    expect(ca('JU8', 'Cap als vint anys me\'n vaig anar a Girona.')).toBe('conto');
  });
});

describe('cierres y "ja t\'ho he explicat" en catalán', () => {
  it('"Ja està tot." y "És tot." en un cierre son no', () => {
    expect(ca('CI2', 'Ja està tot.')).toBe('no');
    expect(ca('CI2', 'Sí, és tot. Va ser una infància feliç.')).toBe('no');
  });
  it('si agrega algo no es no', () => {
    expect(ca('CI2', "Res més, però ara m'he recordat d'una cosa: el meu avi tenia un carro.")).toBe('conto');
  });
  it('"Ja t\'ho he explicat." es ya-conto', () => {
    expect(ca('CA2', "Ja t'ho he explicat abans.")).toBe('ya-conto');
    expect(ca('CA2', "Ja t'ho vaig dir.")).toBe('ya-conto');
  });
});

describe('AMH ("ara mateix tens parella?") en catalán', () => {
  it('sigue en pareja', () => {
    expect(ca('AMH', 'Sí, amb la Montse, fa quaranta anys.')).toBe('conto');
    expect(ca('AMH', 'Estic amb en Jordi.')).toBe('conto');
  });
  it('ya no está', () => {
    expect(ca('AMH', 'No, va morir fa cinc anys.')).toBe('no');
    expect(ca('AMH', 'Ens vam separar el noranta.')).toBe('no');
    expect(ca('AMH', 'Ara estic sola.')).toBe('no');
    expect(ca('AMH', 'Ja no.')).toBe('no');
  });
});

describe('se negó pero siguió (M32) en catalán', () => {
  it('"Millor no en parlem. …" seguido de algo largo', () => {
    expect(ca('CA17', "D'això millor no en parlem. Van ser anys durs a casa, el pare bevia i la mare plorava molt.")).toBe('no-ahondar');
  });
});

describe('el castellano no cambia', () => {
  it('"Passo per…" o "No me\'n recordo" en castellano no son nada especial', () => {
    expect(es('CA2', "No me'n recordo.")).not.toBe('olvido');
    expect(es('CA2', 'Passo.')).toBe('conto');
    expect(es('CA2', 'No me acuerdo.')).toBe('olvido');
    expect(es('CA2', 'Paso.')).toBe('paso');
  });
});
