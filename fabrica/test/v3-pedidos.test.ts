// «Quiero parar» y «esto que no vaya al libro» (Naza, 07/10): se detectan con
// frases fijas, sin modelo. La reserva vale a cualquier largo; la pausa, solo
// en un mensaje corto (≤ 15 palabras), para no confundirla con una historia
// ("quería parar el auto…"). Ejemplos inventados.

import { describe, expect, it } from 'vitest';
import { PALABRAS_PEDIDO_PAUSA, pidePausa, pideReserva } from '../src/v3/entrevista/respuesta.js';

describe('pideReserva', () => {
  it('es-AR: las frases de Naza, con o sin tildes y signos', () => {
    for (const t of [
      'Que no vaya al libro, eh.',
      'No lo pongas en el libro.',
      'Esto no va en el libro.',
      'Eso no lo pongas.',
      'No lo escribas, por favor.',
      'Que no salga en el libro.',
      'Que no quede en el libro.',
      'Sacalo del libro.',
      'Sácalo del libro.',
      'No quiero que esto esté en el libro.',
    ]) expect(pideReserva(t, 'es-AR'), t).toBe(true);
  });

  it('a cualquier largo: una historia larga que termina pidiendo que no vaya', () => {
    const larga = `${'Mi tío tenía un almacén en la esquina y vendía de todo, desde fideos hasta kerosene. '.repeat(5)}Pero esto que no vaya al libro.`;
    expect(pideReserva(larga, 'es-AR')).toBe(true);
  });

  it('es-ES: "no lo pongas", "quítalo del libro" (y las rioplatenses)', () => {
    expect(pideReserva('No lo pongas, ¿vale?', 'es-ES')).toBe(true);
    expect(pideReserva('Quítalo del libro.', 'es-ES')).toBe(true);
    expect(pideReserva('Que no vaya al libro.', 'es-ES')).toBe(true);
  });

  it('ca: catalán y castellano (quien habla catalán mezcla)', () => {
    for (const t of ['Que no surti al llibre.', 'No ho posis al llibre.', "Treu-ho del llibre.", 'Això no va al llibre.', 'Que no vaya al libro.', 'Quítalo del libro.']) {
      expect(pideReserva(t, 'ca'), t).toBe(true);
    }
  });

  it('negativos: hablar del libro o de escribir no es pedir que no vaya', () => {
    for (const t of [
      'Me encanta la idea del libro.',
      'Mi papá escribía cartas y yo las ponía en un libro.',
      'No lo podía creer cuando llegó.',
      'Ponelo así como te lo cuento.',
    ]) expect(pideReserva(t, 'es-AR'), t).toBe(false);
    expect(pideReserva('El llibre de la meva mare era vermell.', 'ca')).toBe(false);
  });
});

describe('pidePausa', () => {
  it('es-AR: las frases de Naza en un mensaje corto', () => {
    for (const t of [
      'Quiero parar.',
      'Paremos.',
      'Frenemos acá.',
      'No quiero seguir.',
      'Basta por hoy.',
      'Dejemos acá.',
      'Dejémoslo por ahora.',
      'Por ahora no.',
      'No tengo ganas de seguir.',
      'Lo dejamos para otro día.',
      'Pausa.',
      'Bueno, querida, paremos que estoy cansada.',
    ]) expect(pidePausa(t, 'es-AR'), t).toBe(true);
  });

  it('es-ES y ca', () => {
    expect(pidePausa('Paremos aquí.', 'es-ES')).toBe(true);
    expect(pidePausa('Lo dejamos aquí.', 'es-ES')).toBe(true);
    expect(pidePausa('No quiero seguir.', 'es-ES')).toBe(true);
    for (const t of ['Vull parar.', 'Parem.', 'Ho deixem aquí.', 'No vull continuar.', 'Prou per avui.', 'Paremos.']) expect(pidePausa(t, 'ca'), t).toBe(true);
  });

  it(`una historia larga (más de ${PALABRAS_PEDIDO_PAUSA} palabras) que dice "parar" no es pausa`, () => {
    expect(pidePausa('Quería parar el auto en la ruta pero mi papá no quería, decía que íbamos a llegar tarde a la casa de la abuela.', 'es-AR')).toBe(false);
    expect(pidePausa('Le dije paremos acá un rato y nos sentamos en el pasto a mirar el río hasta que se hizo de noche y volvimos.', 'es-AR')).toBe(false);
  });

  it('negativos cortos: "parar" o "seguir" dentro de otra cosa', () => {
    for (const t of ['El colectivo no paraba nunca.', 'Mi hermano quería seguir estudiando.', 'Sí, seguimos juntos.', 'No quiero seguir hablando de eso.']) {
      expect(pidePausa(t, 'es-AR'), t).toBe(false);
    }
  });

  it('un texto vacío no es nada', () => {
    expect(pidePausa('', 'es-AR')).toBe(false);
    expect(pideReserva('   ', 'es-AR')).toBe(false);
  });
});
