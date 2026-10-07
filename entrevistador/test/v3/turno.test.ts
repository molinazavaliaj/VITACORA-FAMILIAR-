import { describe, it, expect } from 'vitest';
import { mensajePorId, preguntaPorId } from '../../src/v3/nucleo/entrevista/banco.js';
import { renderizar, type FichaTexto } from '../../src/v3/nucleo/entrevista/texto.js';
import { avanzar, cerrarRespuesta, cerrarYSeguir, encolar, marcarFoto, quitarSalientes, recibirAudio, reenviarAbierta, textoDelBanco, tocarBoton } from '../../src/v3/turno.js';
import { estadoInicial, MARCA_FOTO, type EstadoV3 } from '../../src/v3/tipos.js';

const FICHA: FichaTexto = { nombre: 'Prueba', genero: 'mujer' };
const abierta = (id: string): EstadoV3 => ({ ...estadoInicial(), esperando: id });

describe('avanzar', () => {
  it('arranca con OR1 y M1, sin la bienvenida', () => {
    const { estado, abrio } = avanzar(estadoInicial(), FICHA);
    expect(abrio).toBe(true);
    expect(estado.esperando).toBe('OR1');
    expect(estado.salientes).toEqual([{ id: 1, tipo: 'turno', texto: `${renderizar(preguntaPorId('OR1')!.texto, FICHA)}\n${mensajePorId('M1')!.texto}` }]);
    expect(estado.salientes[0].texto).not.toContain(textoDelBanco('BIEN', FICHA).slice(0, 30));
    expect(estado.preguntaAbierta?.partes.map((p) => p.id)).toEqual(['OR1', 'M1']);
    expect(estado.charla[0]).toEqual({ de: 'bloque', bloque: 1, nombre: expect.any(String) });
  });

  it('no avanza si ya hay una pregunta esperando', () => {
    expect(() => avanzar(abierta('OR1'), FICHA)).toThrow(/espera respuesta/);
  });

  it('en catalán sale la pregunta del banco catalán', () => {
    const ca: FichaTexto = { ...FICHA, idioma: 'ca' };
    const { estado } = avanzar(estadoInicial(), ca);
    expect(estado.salientes[0].texto.startsWith(renderizar(preguntaPorId('OR1', 'ca')!.texto, ca))).toBe(true);
  });
});

describe('audios, silencio y acuse', () => {
  it('los audios se suman y al cerrar sale la siguiente con el acuse pegado arriba', () => {
    let e = avanzar(estadoInicial(), FICHA).estado;
    e = recibirAudio(e, 'Nací en un pueblo chico.').estado;
    const r = recibirAudio(e, 'Mi mamá cosía para afuera.');
    expect(r).toMatchObject({ clave: 'OR1', abierta: true });
    expect(r.estado.borrador).toBe('Nací en un pueblo chico. Mi mamá cosía para afuera.');
    const s = cerrarYSeguir(r.estado, FICHA, true);
    expect(s.abrio).toBe(true);
    expect(s.estado.respuestas).toEqual([['OR1', 'Nací en un pueblo chico. Mi mamá cosía para afuera.']]);
    expect(s.estado.esperando).toBe('OR2');
    expect(s.estado.borrador).toBeUndefined();
    expect(s.estado.salientes).toHaveLength(2);
    expect(s.estado.salientes[1].texto.startsWith(`${textoDelBanco('M3.1', FICHA)}\n`)).toBe(true);
  });

  it('con el tope de la tanda cierra, guarda el acuse y no manda nada; mañana sale pegado', () => {
    let e = avanzar(estadoInicial(), FICHA).estado;
    e = recibirAudio(e, 'Nací en un pueblo chico.').estado;
    const s = cerrarYSeguir(e, FICHA, false);
    expect(s.abrio).toBe(false);
    expect(s.estado.esperando).toBeUndefined();
    expect(s.estado.acuse).toEqual({ familia: 'M3', n: 0 });
    expect(s.estado.salientes).toHaveLength(1);
    const manana = avanzar(s.estado, FICHA);
    expect(manana.estado.salientes[1].texto.startsWith(`${textoDelBanco('M3.1', FICHA)}\n`)).toBe(true);
  });

  it('un audio sin pregunta abierta (después del tope) se suma a la última respuesta', () => {
    let e = avanzar(estadoInicial(), FICHA).estado;
    e = cerrarYSeguir(recibirAudio(e, 'Nací en un pueblo chico.').estado, FICHA, false).estado;
    const r = recibirAudio(e, 'Y me olvidaba del río.');
    expect(r).toMatchObject({ clave: 'OR1', abierta: false });
    expect(r.estado.respuestas).toEqual([['OR1', 'Nací en un pueblo chico. Y me olvidaba del río.']]);
  });

  it('un audio vacío no cambia nada', () => {
    const e = avanzar(estadoInicial(), FICHA).estado;
    expect(recibirAudio(e, '   ')).toMatchObject({ clave: null, abierta: false });
  });

  it('no se puede cerrar una pregunta sin nada contado', () => {
    expect(() => cerrarRespuesta(abierta('OR1'), FICHA)).toThrow(/nada para cerrar/);
  });

  it('después de "Sí" no se cierra sin audio: la marca sola no es respuesta', () => {
    const t = tocarBoton(abierta('CA6'), FICHA, 'Sí, tuve')!;
    expect(() => cerrarRespuesta(t.estado, FICHA)).toThrow(/tocó "Sí" y todavía no contó nada/);
  });

  it('reenviarAbierta manda la pregunta sola, sin el acuse de ayer', () => {
    let e = avanzar(estadoInicial(), FICHA).estado;
    e = cerrarYSeguir(recibirAudio(e, 'Nací en un pueblo chico.').estado, FICHA, true).estado;
    const r = reenviarAbierta(e);
    expect(r.salientes).toHaveLength(3);
    expect(r.salientes[2].texto.startsWith(renderizar(preguntaPorId('OR2')!.texto, FICHA))).toBe(true);
    expect(r.salientes[2].texto).not.toContain(textoDelBanco('M3.1', FICHA));
  });
});

describe('botones', () => {
  it('"Sí" manda M30 solo y sigue esperando audio en la misma pregunta', () => {
    const t = tocarBoton(abierta('CA6'), FICHA, 'Sí, tuve')!;
    expect(t.cerrar).toBe(false);
    expect(t.estado.tocoSi).toBe(true);
    expect(t.estado.esperando).toBe('CA6');
    expect(t.estado.respuestas).toEqual([['CA6', '⟦botón:Sí, tuve⟧']]);
    expect(t.estado.salientes).toEqual([{ id: 1, tipo: 'suelto', texto: textoDelBanco('M30', FICHA) }]);
    const conAudio = recibirAudio(t.estado, 'Éramos cuatro.').estado;
    const s = cerrarYSeguir(conAudio, FICHA, true);
    expect(s.estado.respuestas[0]).toEqual(['CA6', '⟦botón:Sí, tuve⟧ Éramos cuatro.']);
  });

  it('"No" cierra en el momento con la marca del botón', () => {
    const t = tocarBoton(abierta('CA6'), FICHA, 'No tuve hermanos')!;
    expect(t.cerrar).toBe(true);
    const s = cerrarYSeguir(t.estado, FICHA, true);
    expect(s.estado.respuestas).toEqual([['CA6', '⟦botón:No tuve hermanos⟧']]);
    expect(s.abrio).toBe(true);
  });

  it('un texto que no es botón de la abierta no es un toque', () => {
    expect(tocarBoton(abierta('CA6'), FICHA, 'Quizás')).toBeNull();
    expect(tocarBoton(estadoInicial(), FICHA, 'Sí, tuve')).toBeNull();
    const yaToco = tocarBoton(abierta('CA6'), FICHA, 'Sí, tuve')!.estado;
    expect(tocarBoton(yaToco, FICHA, 'No tuve hermanos')).toBeNull();
  });

  it('el cierre de un bloque avisa qué bloque cerró (para el cazador)', () => {
    const t = tocarBoton(abierta('CI1'), FICHA, 'No, está todo')!;
    expect(cerrarYSeguir(t.estado, FICHA, true).bloqueCerrado).toBe(preguntaPorId('CI1')!.bloque);
  });
});

describe('foto y cola', () => {
  it('la foto contesta FO1 y nada más', () => {
    const r = marcarFoto(abierta('FO1'))!;
    expect(r).toMatchObject({ clave: 'FO1' });
    expect(r.estado.borrador).toBe(MARCA_FOTO);
    expect(marcarFoto(r.estado)!.estado.borrador).toBe(MARCA_FOTO);
    expect(marcarFoto(abierta('OR1'))).toBeNull();
    expect(marcarFoto(estadoInicial())).toBeNull();
    const ca: FichaTexto = { ...FICHA, idioma: 'ca' };
    expect(marcarFoto(abierta('FO1'), ca)).toMatchObject({ clave: 'FO1' });
    expect(marcarFoto(abierta('OR1'), ca)).toBeNull();
  });

  it('encolar numera y quitarSalientes saca por id', () => {
    let e = encolar(estadoInicial(), { texto: 'a', tipo: 'suelto' });
    e = encolar(e, { texto: 'b', tipo: 'suelto' });
    expect(e.salientes.map((s) => s.id)).toEqual([1, 2]);
    expect(quitarSalientes(e, [1]).salientes.map((s) => s.texto)).toEqual(['b']);
  });
});

describe('al cambiar la pregunta abierta', () => {
  it('cerrarRespuesta saca de la cola el M8 que no salió y olvida que la abierta fue por plantilla', () => {
    const conM8 = encolar({ ...abierta('OR1'), borrador: 'Nací en un pueblo.', abiertaPorPlantilla: true }, { texto: 'M8', tipo: 'recordatorio' });
    const conSuelto = encolar(conM8, { texto: 'M22', tipo: 'suelto' });
    const { estado } = cerrarRespuesta(conSuelto, FICHA);
    expect(estado.salientes.map((s) => s.texto)).toEqual(['M22']);
    expect(estado.abiertaPorPlantilla).toBeUndefined();
  });
});
