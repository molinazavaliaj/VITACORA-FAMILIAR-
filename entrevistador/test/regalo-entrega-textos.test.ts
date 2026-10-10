import { describe, it, expect } from 'vitest';
import { ENTREGA_ABUELO, ENTREGA_COMPRADOR } from '../src/flujo/regalo-textos.js';
import { instanteDeEntrega, diaLocal } from '../src/flujo/regalo-hora.js';
import { PLANTILLA_REGALO_ENTREGA } from '../src/config.js';

// El regalo llega solo el día elegido (spec 2026-10-10). Textos aprobados por
// Naza el 10/10 (docs/regalo/dia-de-entrega-textos.md), letra por letra.

describe('ENTREGA_COMPRADOR', () => {
  it('de vos (tanda 1, filas 9 y 10)', () => {
    const t = ENTREGA_COMPRADOR.vos;
    expect(t.llegoAsunto('abuelo')).toBe('Hoy le llegó tu regalo a abuelo');
    expect(t.llegoCuerpo('a@b.com')).toBe('Se lo mandamos a a@b.com. Cuando empiece su entrevista lo vas a ver en tu tablero.');
    expect(t.falloAsunto('abuelo')).toBe('No pudimos mandarle el regalo a abuelo');
    expect(t.falloCuerpo('a@b.com')).toBe('Probamos mandárselo a a@b.com y no llegó. Dale la tarjeta vos, impresa o por WhatsApp.');
  });
  it('de tú (tanda 2, filas 9 y 10)', () => {
    const t = ENTREGA_COMPRADOR.tu;
    expect(t.llegoAsunto('abuela')).toBe('Hoy le ha llegado tu regalo a abuela');
    expect(t.llegoCuerpo('a@b.com')).toBe('Se lo hemos enviado a a@b.com. Cuando empiece su entrevista lo verás en tu tablero.');
    expect(t.falloAsunto('abuela')).toBe('No hemos podido enviarle el regalo a abuela');
    expect(t.falloCuerpo('a@b.com')).toBe('Intentamos enviárselo a a@b.com y no llegó. Dale tú la tarjeta, impresa o por WhatsApp.');
  });
});

describe('ENTREGA_ABUELO (tanda 3, más título y explicación de la tarjeta ya aprobados)', () => {
  it('es-AR', () => {
    const t = ENTREGA_ABUELO['es-AR'];
    expect(t.asunto('Lucía')).toBe('Lucía te hizo un regalo');
    expect(t.titulo('abuelo', 'Lucía')).toBe('abuelo, Lucía te hizo un regalo.');
    expect(t.antesDelMensaje).toBe('Te dejó este mensaje.');
    expect(t.siHayAudio).toBe('También te grabó un audio. Lo escuchás cuando abrís tu regalo.');
    expect(t.explica).toEqual([
      'Un biógrafo te va a hacer preguntas sobre tu vida por WhatsApp.',
      'Vos le contestás con audios, cuando puedas.',
      'Con lo que le cuentes se escribe el libro de tu vida.',
    ]);
    expect(t.boton).toBe('Abrir mi regalo');
    expect(t.debajoDelBoton('+54 9 11 1234 5678')).toBe('Si el botón no te anda, mandá un WhatsApp al +54 9 11 1234 5678 con este código.');
  });
  it('es-ES', () => {
    const t = ENTREGA_ABUELO['es-ES'];
    expect(t.asunto('Lucía')).toBe('Lucía te ha hecho un regalo');
    expect(t.titulo('abuela', 'Lucía')).toBe('abuela, Lucía te ha hecho un regalo.');
    expect(t.antesDelMensaje).toBe('Te ha dejado este mensaje.');
    expect(t.siHayAudio).toBe('También te ha grabado un audio. Lo escucharás cuando abras tu regalo.');
    expect(t.explica[1]).toBe('Tú le contestas con audios, cuando puedas.');
    expect(t.boton).toBe('Abrir mi regalo');
    expect(t.debajoDelBoton('+34 612 34 56 78')).toBe('Si el botón no te funciona, manda un WhatsApp al +34 612 34 56 78 con este código.');
  });
  it('ca', () => {
    const t = ENTREGA_ABUELO.ca;
    expect(t.asunto('Lucía')).toBe("Lucía t'ha fet un regal");
    expect(t.titulo('iaia', 'Lucía')).toBe("iaia, Lucía t'ha fet un regal.");
    expect(t.antesDelMensaje).toBe("T'ha deixat aquest missatge.");
    expect(t.siHayAudio).toBe("També t'ha gravat un àudio. L'escoltaràs quan obris el teu regal.");
    expect(t.explica[0]).toBe('Un biògraf et farà preguntes sobre la teva vida per WhatsApp.');
    expect(t.boton).toBe('Obrir el meu regal');
    expect(t.debajoDelBoton('+34 612 34 56 78')).toBe('Si el botó no et funciona, envia un WhatsApp al +34 612 34 56 78 amb aquest codi.');
  });
  it('ninguno usa dos puntos', () => {
    for (const t of Object.values(ENTREGA_ABUELO)) {
      for (const s of [t.asunto('x'), t.antesDelMensaje, t.siHayAudio, t.boton, t.debajoDelBoton('1'), ...t.explica]) expect(s).not.toMatch(/:/);
    }
  });
});

describe('PLANTILLA_REGALO_ENTREGA', () => {
  it('un nombre y un idioma de Meta por idioma del regalo', () => {
    expect(PLANTILLA_REGALO_ENTREGA).toEqual({
      'es-AR': { nombre: 'regalo_entrega_vos', idiomaMeta: 'es' },
      'es-ES': { nombre: 'regalo_entrega_es_es', idiomaMeta: 'es_ES' },
      ca: { nombre: 'regalo_entrega_ca', idiomaMeta: 'ca' },
    });
  });
});

describe('instanteDeEntrega y diaLocal (copia de la web)', () => {
  it('Argentina, Madrid en invierno, en verano y los dos cambios de horario', () => {
    expect(instanteDeEntrega('2026-12-24', 10, 'America/Argentina/Buenos_Aires').toISOString()).toBe('2026-12-24T13:00:00.000Z');
    expect(instanteDeEntrega('2026-12-24', 10, 'Europe/Madrid').toISOString()).toBe('2026-12-24T09:00:00.000Z');
    expect(instanteDeEntrega('2026-07-01', 10, 'Europe/Madrid').toISOString()).toBe('2026-07-01T08:00:00.000Z');
    expect(instanteDeEntrega('2026-03-29', 10, 'Europe/Madrid').toISOString()).toBe('2026-03-29T08:00:00.000Z');
    expect(instanteDeEntrega('2026-10-25', 10, 'Europe/Madrid').toISOString()).toBe('2026-10-25T09:00:00.000Z');
  });
  it('el día local: las 2 UTC del 25/12 todavía son el 24 en Buenos Aires', () => {
    expect(diaLocal(new Date('2026-12-25T02:00:00Z'), 'America/Argentina/Buenos_Aires')).toBe('2026-12-24');
    expect(diaLocal(new Date('2026-12-24T23:30:00Z'), 'Europe/Madrid')).toBe('2026-12-25');
  });
});
