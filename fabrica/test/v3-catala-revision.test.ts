// Lo que encontró la revisión de la rama v3-catala (04/10), con su arreglo.
// Vida inventada.

import { describe, expect, it } from 'vitest';
import { TEXTOS_IDIOMA, preguntaPorId } from '../src/v3/entrevista/banco.js';
import { controlarElegida, mensajeRepregunta } from '../src/v3/entrevista/cazador.js';
import { interpretar } from '../src/v3/entrevista/respuesta.js';
import { botonesAbiertos } from '../scripts/v3-entrevista-web.js';
import { nuevaEntrevista, responder } from '../scripts/v3-entrevista-turno.js';
import { aMaterial } from '../scripts/v3-entrevista-a-material.js';
import { renderizar } from '../src/v3/entrevista/texto.js';

const CA = TEXTOS_IDIOMA.ca;
const ca = (id: string, r: string) => interpretar(preguntaPorId(id, 'ca')!, r, 'ca');

describe('1. la página en catalán muestra los botones en catalán', () => {
  it('en CI1 sale [No, ja està tot], no el castellano', () => {
    let r = nuevaEntrevista({ nombre: 'Roser', genero: 'mujer', idioma: 'ca' });
    for (let i = 0; i < 20 && r.estado.esperando !== 'CI1'; i++) r = responder(r.estado, 'Vaig néixer a Manresa i el pare era fuster.');
    expect(r.estado.esperando).toBe('CI1');
    expect(botonesAbiertos(r.estado)).toEqual(CA.botones.CI1);
  });
});

describe('2. el material del escritor lee la entrevista en catalán con el banco y el detector en catalán', () => {
  const ficha = { nombre: 'Roser', genero: 'mujer' as const, idioma: 'ca' as const };
  it('[Prefereixo no dir-ho] es paso, no un relato', () => {
    const boton = preguntaPorId('CA17', 'ca')!.botones!.find((b) => b.vale === 'paso')!.texto;
    expect(boton).toBe('Prefereixo no dir-ho');
    const [f] = aMaterial({ ficha, respuestas: [['CA17', `⟦botón:${boton}⟧`]], charla: [], familia: [] } as never);
    expect(f.paso).toBe(true);
    expect(f.interpretacion).toBe('paso');
  });
  it('"Passo." es paso y la pregunta sale en catalán', () => {
    const [f] = aMaterial({ ficha, respuestas: [['CA2', 'Passo.']], charla: [], familia: [] } as never);
    expect(f.interpretacion).toBe('paso');
    expect(f.pregunta).toBe(renderizar(CA.preguntas.CA2, ficha));
  });
});

describe('3. "encara que", "tot i que" y "sinó" dan vuelta el "no", como "aunque"', () => {
  it('cuenta algo', () => {
    expect(ca('CA2', 'No, encara que sí que en teníem un, de pati.')).toBe('conto');
    expect(ca('CA2', 'No, tot i que la meva àvia en tenia un.')).toBe('conto');
    expect(ca('CA2', 'No, sinó que vivíem a casa dels avis.')).toBe('conto');
  });
  it('"No, encara no." sigue siendo un no ("encara" solo es "todavía")', () => {
    expect(ca('HI8', 'No, encara no.')).toBe('no');
  });
});

describe('4. el control de tiempo relativo del cazador en catalán', () => {
  const resp = 'Anàvem a la masia dels avis cada estiu.';
  const cita = 'la masia dels avis';
  it('con apóstrofo curvo y con "d\'ahir"', () => {
    expect(controlarElegida({ cita, pregunta: 'Què va passar l’altre dia a la masia?' }, resp, false, 'ca')).toContain('tiempo relativo');
    expect(controlarElegida({ cita, pregunta: "Com era el diari d'ahir a la masia?" }, resp, false, 'ca')).toContain('tiempo relativo');
  });
});

describe('de los dudosos', () => {
  it('"No em recordo." es olvido', () => {
    expect(ca('CA2', 'No em recordo.')).toBe('olvido');
  });
  it('si la cita dice "{pregunta}", no se pisa', () => {
    expect(mensajeRepregunta({ cita: 'em va dir {pregunta} i res més', pregunta: 'Qui?' }, 'ca')).toContain('«em va dir {pregunta} i res més». Qui?');
  });
});
