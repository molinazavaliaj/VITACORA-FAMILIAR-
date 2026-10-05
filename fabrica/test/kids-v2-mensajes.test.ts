import { describe, it, expect } from 'vitest';
import { extra, pregunta } from '../src/kids-v2/banco.js';
import { nuevoEstado } from '../src/kids-v2/motor/estado.js';
import { avisoPreguntaNueva, destino, extraMsg, fijoA, fotoMsg, opMsg, padreMsgs, preguntaMsg, ramaMsg, variables } from '../src/kids-v2/motor/mensajes.js';
import { FICHA } from './kids-v2-ayuda.js';

const A = nuevoEstado(FICHA);
const B = nuevoEstado({ ...FICHA, canal: 'B', genero: 'chica', apodo: 'Tini', quienRegala: 'Tus abuelos' });

describe('kids v2: estado inicial', () => {
  it('sin empezar, con la ficha validada y el guion armado', () => {
    expect(A.fase).toEqual({ tipo: 'sin-empezar' });
    expect(A.cursor).toBe(-1);
    expect(A.fotosVencidas).toEqual([]);
    expect(A.ficha.quienRegala).toBe('tu mamá');
    expect(A.guion[0].clave).toBe('K1');
    expect(JSON.parse(JSON.stringify(A))).toEqual(A); // serializable
  });
});

describe('kids v2: armar mensajes', () => {
  it('a qué número va: en canal B, todo al padre', () => {
    expect(destino(A)).toBe('chico');
    expect(destino(A, true)).toBe('padre');
    expect(destino(B)).toBe('padre');
  });

  it('una principal: texto con género y botones propios + el de pasar', () => {
    expect(preguntaMsg(A, pregunta('K12'))).toEqual({ a: 'chico', id: 'K12', texto: 'Vamos con hermanos.', botones: ['Tengo hermanos', 'No tengo hermanos', 'Paso'], plantilla: null });
    expect(preguntaMsg(B, pregunta('K10')).texto).toContain('enferma.');
    expect(preguntaMsg(A, pregunta('K39')).botones).toEqual(['Esta la paso']);
    expect(preguntaMsg(A, pregunta('K38')).botones).toEqual(['No se me ocurre', 'Paso']);
  });

  it('rama, otra puerta, foto y extra', () => {
    expect(ramaMsg(A, pregunta('K12'), 1, 1)).toMatchObject({ id: 'K12-R2-2', botones: ['Paso'] });
    expect(ramaMsg(A, pregunta('K12'), 0, 0).id).toBe('K12-R1');
    expect(opMsg(A, pregunta('K2'))).toMatchObject({ id: 'K2-OP', texto: '¿Y una travesura que hizo otro y vos la viste? Contame esa.', botones: ['Paso'] });
    expect(fotoMsg(A, pregunta('K11').foto!)).toMatchObject({ id: 'K11-FOTO', botones: ['No hago', 'No tengo'] });
    expect(extraMsg(A, extra('X1-7')).botones).toEqual(['No tengo']);
    expect(extraMsg(A, extra('X1-6')).botones).toEqual(['Paso']);
  });

  it('plantillas con sus variables: al chico su apodo; al padre su primer nombre', () => {
    const bien = fijoA(A, 'BIEN-CHICO', { variables: variables.chico(A.ficha) });
    expect(bien.texto).toMatch(/^Hola Bruno\. Te escribo porque tu mamá te hizo un regalo/);
    expect(bien.plantilla).toEqual({ nombre: 'kids_bienvenida', variables: ['Bruno', 'tu mamá'] });
    expect(fijoA(A, 'AVISO-PADRE', { variables: variables.avisoPadre(A.ficha), paraPadre: true })).toMatchObject({ a: 'padre', plantilla: { nombre: 'kids_aviso_padre', variables: ['Laura', 'Bruno', 'vitacora.com/panel/bruno'] } });
    expect(avisoPreguntaNueva(A)).toMatchObject({ id: 'PREG-NUEVA-CHICO', a: 'chico', texto: 'Hola Bruno, hay una pregunta esperándote. Tocá el botón y te la mando.' });
    expect(avisoPreguntaNueva(B)).toMatchObject({ id: 'PREG-NUEVA-PADRE', a: 'padre', texto: 'Hola Laura, hay una pregunta nueva para Tini. Cuando estén juntos y con un rato tranquilo, tocá el botón y llega.' });
  });

  it('las preguntas del padre: con la línea (singular o plural) o solas, tal cual las escribió', () => {
    const item = { tipo: 'padre' as const, clave: 'PADRE-1', cap: 4 as const, n: 1, texto: 'Contame la vez: la de la bici', conLinea: true };
    expect(padreMsgs(A, item).map((m) => [m.id, m.texto])).toEqual([
      ['PADRE-PREG-LINEA', 'Esta pregunta te la manda tu mamá, con sus palabras.'],
      ['PADRE-1', 'Contame la vez: la de la bici'],
    ]);
    expect(padreMsgs(B, item)[0].texto).toBe('Esta pregunta te la mandan tus abuelos, con sus palabras.');
    expect(padreMsgs(A, { ...item, conLinea: false }).map((m) => m.id)).toEqual(['PADRE-1']);
    expect(padreMsgs(A, item)[1].botones).toEqual(['Esta la paso']);
  });
});
