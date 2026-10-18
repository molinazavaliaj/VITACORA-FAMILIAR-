// El botón INFO de la bienvenida: la segunda capa (18/10, revisión legal del 17/10).

import { describe, expect, it } from 'vitest';
import { BOTON_INFO, pideInfo } from '../../src/v3/info.js';
import { textoFijo } from '../../src/v3/textos-fijos.js';

describe('el botón INFO de la bienvenida', () => {
  it('reconoce el botón tal como lo manda Meta', () => {
    expect(pideInfo(BOTON_INFO)).toBe(true);
  });

  it('lo reconoce escrito, en minúscula y con espacios', () => {
    for (const t of ['info', 'Info', '  INFO  ', 'ínfo']) expect(pideInfo(t)).toBe(true);
  });

  it('no se come una respuesta que apenas menciona la palabra', () => {
    for (const t of ['quiero info', 'info sobre mi abuelo', 'no', 'SÍ', '']) expect(pideInfo(t)).toBe(false);
  });

  // Argentina es el mercado de lanzamiento y es la única con segunda capa
  // escrita. España y Catalunya esperan al NIF del alta de autónomo: sin texto
  // en su idioma no sale nada, que es la regla de todos los textos fijos.
  it('hay segunda capa en es-AR', () => {
    expect(textoFijo('info', 'es-AR')?.length ?? 0).toBeGreaterThan(300);
  });

  it('España y Catalunya no mandan nada hasta que exista el NIF', () => {
    for (const idioma of ['es-ES', 'ca'] as const) expect(textoFijo('info', idioma)).toBeNull();
  });

  it('la segunda capa dice lo que la revisión legal manda poner en ella', () => {
    const t = textoFijo('info', 'es-AR') ?? '';
    expect(t).toMatch(/Estados Unidos/);          // los encargados
    expect(t).toMatch(/3 meses/);                 // el plazo de los audios
    expect(t).toMatch(/Joaquín Molina/);          // el responsable
    expect(t).toMatch(/Información Pública/);     // la autoridad de reclamo
    expect(t).toMatch(/legal\/privacidad/);       // dónde está el resto
    expect(t).toMatch(/SÍ/);                      // después de leer, sigue pudiendo aceptar
  });

  // Este test falla a propósito hasta que Joaquín pase los datos: la segunda
  // capa no se puede publicar prometiendo un responsable sin identificar.
  it('no se publica con algún dato del titular sin cargar', () => {
    const t = textoFijo('info', 'es-AR') ?? '';
    expect(t, 'falta cargar un dato del titular en es-AR').not.toMatch(/FALTA_/);
  });
});
