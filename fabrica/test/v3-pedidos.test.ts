// «Quiero parar» y «esto que no vaya al libro» (Naza, 07/10): se detectan con
// frases fijas, sin modelo. La reserva que nombra el libro vale a cualquier
// largo; la genérica ("no lo escribas"), solo en un mensaje corto. La pausa,
// solo en un mensaje corto (≤ 15 palabras) y con guardas para no confundirla
// con una historia ("quería parar el auto…"). Ejemplos inventados.

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
      'Que no vaya en la biografía.',
    ]) expect(pideReserva(t, 'es-AR'), t).toBe(true);
  });

  it('la que nombra el libro vale a cualquier largo: una historia larga que termina pidiendo que no vaya', () => {
    const larga = `${'Mi tío tenía un almacén en la esquina y vendía de todo, desde fideos hasta kerosene. '.repeat(5)}Pero esto que no vaya al libro.`;
    expect(pideReserva(larga, 'es-AR')).toBe(true);
  });

  it('la genérica en un mensaje largo vale solo si nombra el libro en otro lado', () => {
    const historia = 'Mi tío tenía un almacén en la esquina y vendía de todo, desde fideos hasta kerosene, y un día se peleó con todos.';
    expect(pideReserva(`${historia} Eso no lo pongas.`, 'es-AR')).toBe(false);
    expect(pideReserva(`${historia} Eso no lo pongas, que es para el libro y no quiero.`, 'es-AR')).toBe(true);
  });

  it('es-ES: "no lo pongas", "quítalo del libro" (y las rioplatenses)', () => {
    expect(pideReserva('No lo pongas, ¿vale?', 'es-ES')).toBe(true);
    expect(pideReserva('Quítalo del libro.', 'es-ES')).toBe(true);
    expect(pideReserva('Que no vaya al libro.', 'es-ES')).toBe(true);
  });

  it('ca: catalán y castellano (quien habla catalán mezcla)', () => {
    for (const t of ['Que no surti al llibre.', 'No ho posis al llibre.', 'Treu-ho del llibre.', 'Això no va al llibre.', 'No ho posis.', 'Que no vaya al libro.', 'Quítalo del libro.']) {
      expect(pideReserva(t, 'ca'), t).toBe(true);
    }
  });

  it('la genérica seguida de un lugar o dicha por otro vale si el lugar es el libro (revisión 2 del 07/10)', () => {
    for (const t of ['No lo escribas en el libro.', 'Eso no lo escribas en el libro.', 'No lo escribas en la biografía.']) expect(pideReserva(t, 'es-AR'), t).toBe(true);
    for (const t of ['No ho escriguis al llibre.', 'No ho posis en el llibre.']) expect(pideReserva(t, 'ca'), t).toBe(true);
    for (const t of ['No lo pongas aquí, que no vaya en el libro.', 'Esto no lo pongas a la vista de todos en el libro.']) expect(pideReserva(t, 'es-ES'), t).toBe(true);
  });

  it('negativos: hablar del libro o de escribir no es pedir que no vaya', () => {
    for (const t of [
      'Me encanta la idea del libro.',
      'Mi papá escribía cartas y yo las ponía en un libro.',
      'No lo podía creer cuando llegó.',
      'Ponelo así como te lo cuento.',
      'Mi vieja siempre decía no lo escribas en la pared.',
    ]) expect(pideReserva(t, 'es-AR'), t).toBe(false);
    expect(pideReserva('Mi madre me decía no lo pongas ahí que se cae.', 'es-ES')).toBe(false);
    expect(pideReserva('No ho posis aquí, em deia la mare.', 'ca')).toBe(false);
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
      'No, no quiero seguir.',
      'Basta por hoy.',
      'Dejemos acá.',
      'Dejémoslo por ahora.',
      'No tengo ganas de seguir.',
      'Lo dejamos para otro día.',
      'Pausa.',
      'Hagamos una pausa que me duele la cabeza.',
      'Necesito una pausa.',
      'Bueno, querida, paremos que estoy cansada.',
      'Mirá, la verdad es que hoy estoy muy cansada, paremos por hoy.',
    ]) expect(pidePausa(t, 'es-AR'), t).toBe(true);
  });

  it('pausas claras con algo después (revisión 2 del 07/10): un signo corta el vínculo', () => {
    for (const t of ['Quiero parar la entrevista.', 'Quiero parar a descansar.', 'No quiero seguir en este momento.', 'No quiero seguir, en serio.', 'Quiero parar de una vez.', 'Quiero parar, ando cansada.']) {
      expect(pidePausa(t, 'es-AR'), t).toBe(true);
    }
    expect(pidePausa('Vull parar, tant cansada estic.', 'ca')).toBe(true);
  });

  it('es-ES y ca', () => {
    expect(pidePausa('Paremos aquí.', 'es-ES')).toBe(true);
    expect(pidePausa('Lo dejamos aquí por hoy.', 'es-ES')).toBe(true);
    expect(pidePausa('Dejémoslo por hoy.', 'es-ES')).toBe(true);
    expect(pidePausa('No quiero seguir.', 'es-ES')).toBe(true);
    for (const t of ['Vull parar.', 'Parem.', 'Ho deixem per avui.', 'No vull continuar.', 'Prou per avui.', 'Fem una pausa.', 'Paremos.']) expect(pidePausa(t, 'ca'), t).toBe(true);
  });

  it(`una historia larga (más de ${PALABRAS_PEDIDO_PAUSA} palabras) que dice "parar" no es pausa`, () => {
    expect(pidePausa('Quería parar el auto en la ruta pero mi papá no quería, decía que íbamos a llegar tarde a la casa de la abuela.', 'es-AR')).toBe(false);
    expect(pidePausa('Le dije paremos acá un rato y nos sentamos en el pasto a mirar el río hasta que se hizo de noche y volvimos.', 'es-AR')).toBe(false);
  });

  it('negativos cortos: "parar", "seguir" o "pausa" dentro de otra cosa (revisión del 07/10)', () => {
    for (const t of [
      'El colectivo no paraba nunca.',
      'Mi hermano quería seguir estudiando.',
      'Sí, seguimos juntos.',
      'No quiero seguir hablando de eso.',
      'Por ahora no.',
      'Por ahora no, sigo trabajando.',
      'Nietos por ahora no.',
      'No, sigo. No quiero parar nunca.',
      'Hago una pausa y tomo unos mates en el patio.',
      'Le dije a mi marido: paremos acá a comer.',
      'No quiero seguir trabajando, ya estoy grande.',
      'No, todavía no, no tengo ganas de seguir buscando.',
    ]) expect(pidePausa(t, 'es-AR'), t).toBe(false);
    expect(pidePausa('Parem a dinar a mig camí.', 'ca')).toBe(false);
    expect(pidePausa('No vull seguir treballant.', 'ca')).toBe(false);
    expect(pidePausa('Lo dejamos aquí, de eso no quiero hablar.', 'es-ES')).toBe(false);
    expect(pidePausa('Lo dejamos aquí.', 'es-ES')).toBe(false);
    expect(pidePausa('Ho deixem aquí.', 'ca')).toBe(false);
  });

  it('un texto vacío no es nada', () => {
    expect(pidePausa('', 'es-AR')).toBe(false);
    expect(pideReserva('   ', 'es-AR')).toBe(false);
  });
});
