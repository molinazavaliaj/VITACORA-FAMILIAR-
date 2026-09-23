import { describe, it, expect } from 'vitest';
import { quienCuenta, encargoDelLibro, generoDelMaterial, formasDeGenero } from '../src/libro/encargo.js';

// El encargo del libro, compartido por todos los prompts de la fábrica (biógrafo v2, 23/09).
// Decisión de Naza: "que no invente historias y que de verdad sean sus historias, pero redactadas
// por un escritor de la putísima madre: que hable con sus palabras como si fuese él, pero con
// mejor redacción". Y: nunca tratar de hombre a una mujer. Los siete prompts decían "él".

describe('quienCuenta', () => {
  it('con una mujer, todo en femenino y lo dice con ejemplos', () => {
    const t = quienCuenta({ nombre: 'Élida', genero: 'mujer' });
    expect(t).toContain('Élida');
    expect(t).toContain('una mujer');
    expect(t).toContain('cuando era chica');
  });

  it('con un hombre, en masculino', () => {
    expect(quienCuenta({ nombre: 'Rubén', genero: 'hombre' })).toContain('cuando era chico');
  });

  it('si no se sabe, no elige: pide mirar cómo se nombra y, si no aparece, evitar las formas con género', () => {
    const t = quienCuenta({ nombre: 'Alex', genero: null });
    expect(t).toContain('No sabemos si es mujer u hombre');
    expect(t).not.toMatch(/\bél\b/);
  });
});

describe('encargoDelLibro', () => {
  it('lleva los hechos sagrados, la voz de escritor y las citas textuales', () => {
    const t = encargoDelLibro({ nombre: 'Élida', genero: 'mujer' });
    expect(t).toContain('LOS HECHOS SON SAGRADOS');
    expect(t).toContain('escritor');
    expect(t).toContain('TEXTUALES');
    expect(t).not.toContain('pulir apenas');
  });

  it('la voz es la de cada persona, en su castellano; lo de "folleto" es para lo que agrega el escritor', () => {
    const t = encargoDelLibro({ nombre: 'Élida', genero: 'mujer' });
    expect(t).toContain('SU castellano');
    expect(t).toContain('si una frase así la dijo esta persona, es suya y va');
    // Decisión de Naza: que el material sea suyo se garantiza antes de escribir, no en el prompt.
    expect(t).not.toContain('Nada de otra persona');
  });

  it('no dice "él" en ningún lado cuando es una mujer', () => {
    expect(encargoDelLibro({ nombre: 'Élida', genero: 'mujer' })).not.toMatch(/\bél\b/);
  });
});

describe('generoDelMaterial', () => {
  it('se da cuenta por cómo se nombra en primera persona', () => {
    const r = generoDelMaterial([
      'Yo era chica, tendría seis años. Cuando me casé fui muy feliz.',
      'Me quedé embarazada a los veinte y estuve asustada todo el tiempo.',
    ]);
    expect(r.genero).toBe('mujer');
    expect(r.evidencia.length).toBeGreaterThanOrEqual(2);
  });

  it('no confunde lo que dice de otra persona ("mi vieja estaba cansada")', () => {
    const r = generoDelMaterial(['Mi vieja estaba cansada. Mi hermana era chica.', 'Yo fui hijo único y quedé solo con mi viejo. Estuve preocupado.']);
    expect(r.genero).toBe('hombre');
  });

  it('con evidencia pareja o nula, no decide', () => {
    expect(generoDelMaterial(['Me gustaba el campo.']).genero).toBeNull();
    expect(generoDelMaterial(['Yo era chica.', 'Yo era chico.']).genero).toBeNull();
  });
});

describe('generoDelMaterial con frases reales (Joaquín y Osvaldo, 23/09)', () => {
  it('reconoce cómo habla la gente de verdad', () => {
    const r = generoDelMaterial([
      'Pelliza, donde vivía cuando era chico.',
      'Yo fracasé mucho de chico, me choqué contra la pared.',
      'Después me fui a vivir solo, a arrancar.',
      'Y yo, que era el pibe que barría, di un paso adelante.',
    ]);
    expect(r.genero).toBe('hombre');
    expect(r.evidencia.length).toBe(4);
  });

  it('no toma lo que dice de otra persona', () => {
    const r = formasDeGenero('Esa fue la vida de mi madre cuando era chica. Cuando la llevé, ella re contenta.');
    expect(r).toEqual({ mujer: [], hombre: [] });
  });
});

describe('formasDeGenero', () => {
  it('encuentra las formas en primera persona de cada género en un texto del libro', () => {
    const r = formasDeGenero('Cuando yo era chico me quedé solo. Estuve asustado. Mi mamá estaba cansada.');
    expect(r.hombre.length).toBe(3);
    expect(r.mujer).toEqual([]);
  });
});
