// El motor del turno de historia (src/historia/turno.ts), puro: del SÍ a FIN-H con el banco real.

import { describe, expect, it } from 'vitest';
import { fichaTexto, estadoInicial, CLAVE_TEMA, type EstadoHistoria, type FilaHistoria } from '../../src/historia/tipos.js';
import { arrancar, cerrarYSeguir, esDudaDeTema, marcarFoto, recibirAudio, tocarBoton, type Seguir } from '../../src/historia/turno.js';
import { respuestaDeBoton } from '../../src/historia/nucleo/entrevista/respuesta.js';
import type { FichaTexto } from '../../src/historia/nucleo/entrevista/texto.js';
import type { TemaHistoria } from '../../src/historia/nucleo/entrevista/temas.js';

const CUENTA = 'Fue una época larga, me acuerdo de la casa, de la calle y de la gente que estaba conmigo.';

function ficha(tema: TemaHistoria, extra: Partial<FilaHistoria['ficha']> = {}, idioma: FilaHistoria['idioma'] = 'es-AR'): FichaTexto {
  return fichaTexto({ idioma, ficha: { nombre: 'Marta', genero: 'mujer', tema, ...extra } });
}

/** Contesta con `responder` todo lo que se abra hasta el final. Devuelve los globos del bot en orden y los cierres. */
function recorrer(e0: EstadoHistoria, f0: FichaTexto, responder: (clave: string) => string = () => CUENTA) {
  let f = f0;
  let a = arrancar(e0, f);
  let e = a.estado;
  const cierres: Seguir[] = [];
  for (let vuelta = 0; vuelta < 100 && e.esperando; vuelta++) {
    const clave = e.esperando;
    const r = responder(clave);
    e = r.startsWith('⟦botón:') ? tocarBoton(e, f, r.slice('⟦botón:'.length, -1))!.estado : recibirAudio(e, r).estado;
    const s = cerrarYSeguir(e, f);
    cierres.push(s);
    if (s.temaElegido !== undefined) f = { ...f, temaLibre: s.temaElegido };
    e = s.estado;
  }
  const globos = e.charla.filter((g) => g.de === 'bio').map((g) => (g.de === 'bio' ? g.partes.map((p) => p.id).join('+') : ''));
  return { e, globos, cierres, f };
}

describe('del SÍ a FIN-H', () => {
  it('mudanza: COMO, las comunes, las del tema, FOTO-H, el resto y FIN-H, con el acuse pegado arriba', () => {
    const { e, globos } = recorrer(estadoInicial({ temaAbierto: false, propias: [] }), ficha('mudanza'));
    expect(globos).toEqual([
      'COMO', 'HC1+M1', 'M3.1+HC2+M1', 'M3.2+HC3+M1', 'M3.3+HC4',
      'M3.4+HM1', 'M3.5+HM2', 'M3.6+HM3', 'M3.7+HM4', 'M3.8+HM5',
      'M3.1+FOTO-H+M31', 'M26+HC5', 'M4.1', 'HC6', 'M4.2', 'HC7', 'M3.3+HC8', 'M3.4+HC9', 'M26+HC10', 'FIN-H',
    ]);
    expect(e.terminada).toBe(true);
    expect(e.respuestas.map(([k]) => k)).toEqual(['HC1', 'HC2', 'HC3', 'HC4', 'HM1', 'HM2', 'HM3', 'HM4', 'HM5', 'FOTO-H', 'HC5', 'HC6', 'HC7', 'HC8', 'HC9', 'HC10']);
  });

  it('FOTO-H lleva el botón [No tengo fotos]; tocarlo la cierra con un "no" y FIN-H sale sin la frase de la foto', () => {
    const { e } = recorrer(estadoInicial({ temaAbierto: false, propias: [] }), ficha('negocio'), (k) => (k === 'FOTO-H' ? respuestaDeBoton('No tengo fotos') : CUENTA));
    const foto = e.charla.find((g) => g.de === 'bio' && g.partes.some((p) => p.id === 'FOTO-H'));
    expect(foto).toMatchObject({ botones: ['No tengo fotos'] });
    const fin = e.charla.filter((g) => g.de === 'bio').at(-1)!;
    expect(fin.de === 'bio' && fin.partes[0].texto).not.toContain('Si te quedó alguna foto');
  });

  it('una foto que llega con FOTO-H abierta la contesta', () => {
    let e = arrancar(estadoInicial({ temaAbierto: false, propias: [] }), ficha('negocio')).estado;
    expect(marcarFoto(e)).toBeNull();
    e = { ...e, esperando: 'FOTO-H' };
    expect(marcarFoto(e)!.estado.borrador).toBe('⟦foto⟧');
  });

  it('las de quien regala van después de HC9, tal cual, y M26 antes de HC10', () => {
    const { globos, e } = recorrer(estadoInicial({ temaAbierto: false, propias: ['¿Qué te llevaste de casa?', '¿Te acordás del barco?'] }), ficha('mudanza', { quienRegala: 'Pablo' }));
    expect(globos.slice(-5)).toEqual(['M3.4+HC9', 'M3.5+PR-H1', 'M3.6+PR-H2', 'M26+HC10', 'FIN-H']);
    const pr = e.charla.find((g) => g.de === 'bio' && g.partes.some((p) => p.id === 'PR-H1'));
    expect(pr?.de === 'bio' && pr.partes[1].texto).toContain('Esta te la manda Pablo, Marta.');
    expect(pr?.de === 'bio' && pr.partes[1].texto).toContain('«¿Qué te llevaste de casa?»');
  });

  it('el cazador corre al cerrarse cada bloque del banco del narrador, también el del tema', () => {
    const { cierres } = recorrer(estadoInicial({ temaAbierto: false, propias: [] }), ficha('conocimos'));
    expect(cierres.filter((c) => c.bloqueCerrado !== undefined).map((c) => c.bloqueCerrado)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});

describe('el tema abierto', () => {
  const abierto = () => estadoInicial({ temaAbierto: true, propias: [] });
  const f = ficha('otra', { quienRegala: 'Pablo' });

  it('después del SÍ va TEMA-ABIERTO; lo que contesta queda como su historia y sigue TEMA-OK + COMO y HC1-A', () => {
    const { globos, e, f: final } = recorrer(abierto(), f, (k) => (k === CLAVE_TEMA ? 'Cuando me fui a vivir a España con mis hijos' : CUENTA));
    expect(globos.slice(0, 3)).toEqual(['TEMA-ABIERTO', 'TEMA-OK+COMO', 'HC1-A+M1']);
    expect(e.respuestas[0]).toEqual([CLAVE_TEMA, 'Cuando me fui a vivir a España con mis hijos']);
    expect(final.temaLibre).toBe('Cuando me fui a vivir a España con mis hijos');
    const tema = e.charla.find((g) => g.de === 'bio' && g.partes[0].id === 'TEMA-ABIERTO');
    expect(tema?.de === 'bio' && tema.partes[0].texto).toContain('Pablo quiso que la historia la elijas vos.');
  });

  it('si duda, TEMA-LISTA una sola vez; si sigue sin elegir, se espera y se avisa', () => {
    const dudas = ['No sé, la verdad.', '¿Me das algunas ideas?'];
    let i = 0;
    const { globos, cierres } = recorrer(abierto(), f, (k) => (k === CLAVE_TEMA ? (dudas[i++] ?? 'no sé') : CUENTA));
    expect(globos.slice(0, 2)).toEqual(['TEMA-ABIERTO', 'TEMA-LISTA']);
    expect(globos.filter((g) => g === 'TEMA-LISTA')).toHaveLength(1);
    expect(cierres.at(-1)).toMatchObject({ sinElegir: true });
  });

  it('esDudaDeTema: dudas sí, historias no', () => {
    for (const d of ['No sé', 'ni idea', 'Paso', 'dame ideas', 'No, todavía no sé']) expect(esDudaDeTema(d, f), d).toBe(true);
    for (const h of ['El negocio de mi papá', 'Cuando conocí a Raúl en el baile', 'La vez que me fui a vivir a Mendoza, no sé si sirve']) expect(esDudaDeTema(h, f), h).toBe(false);
  });
});

describe('idiomas', () => {
  it('en catalán sale COMO y la primera pregunta en catalán, y FOTO-H con su botón', () => {
    const { e } = recorrer(estadoInicial({ temaAbierto: false, propias: [] }), ficha('trabajo', {}, 'ca'));
    const textos = e.charla.filter((g) => g.de === 'bio').map((g) => (g.de === 'bio' ? g.partes.map((p) => p.texto).join('\n') : ''));
    expect(textos[0]).toMatch(/^Funciona així/);
    expect(textos[1]).toContain('Aquest llibre és sobre la teva gran feina');
    const foto = e.charla.find((g) => g.de === 'bio' && g.partes.some((p) => p.id === 'FOTO-H'));
    expect(foto).toMatchObject({ botones: ['No tinc fotos'] });
  });
});
