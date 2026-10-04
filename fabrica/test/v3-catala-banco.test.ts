// La entrevista en catalán (Naza, 04/10): banco-ca.md trae solo los textos;
// la estructura sale de banco.md. Estos tests atan las dos cosas: si cambia
// banco.md y falta el catalán, fallan; los textos aprobados quedan fijados
// letra por letra (test/fijos/banco-ca-aprobado.json); y el flujo en catalán
// manda textos y botones en catalán con las mismas reglas.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parsearTextosIdiomaMd } from '../src/v3/entrevista/banco-idioma-md.js';
import { BANCO, bancoDe, MENSAJES, mensajePorId, mensajesDe, nombresBloqueDe, preguntaPorId, TEXTOS_IDIOMA } from '../src/v3/entrevista/banco.js';
import { MAX_LETRAS_BOTON } from '../src/v3/entrevista/banco-md.js';
import { botonRepregunta, contradiccionesConFicha, mensajesDespues, respondioNo, siguientePregunta, type EstadoEntrevista, type Respuestas } from '../src/v3/entrevista/flujo.js';
import { acuseNeutro, entradaSegunAcuse } from '../src/v3/entrevista/mensajes.js';
import { respuestaDeBoton } from '../src/v3/entrevista/respuesta.js';
import { renderizar } from '../src/v3/entrevista/texto.js';
import { idiomaDe } from '../src/v3/entrevista/idioma.js';
import bancoCaJson from '../src/v3/entrevista/banco-ca.json' with { type: 'json' };
import aprobado from './fijos/banco-ca-aprobado.json' with { type: 'json' };
import type { FichaV3 } from '../src/v3/ficha.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MD = readFileSync(path.join(RAIZ, 'docs', 'v3', 'entrevista', 'banco-ca.md'), 'utf8');
const CA = TEXTOS_IDIOMA.ca;

/** Las marcas que el código reemplaza por datos: tienen que estar las mismas, la misma cantidad de veces. */
const campos = (t: string) => (t.match(/\{\{(nombre|quien_regala|tema|etapa)\}\}/g) ?? []).sort();
const variantes = (t: string) => [...t.matchAll(/«sino:([A-Z0-9.]+):/g)].map((m) => m[1]).sort();
const saltos = (t: string) => (t.match(/\n|<br>/g) ?? []).length;

describe('banco-ca.md', () => {
  it('el json está al día con el md (si falla: npx tsx scripts/v3-entrevista-json.ts)', () => {
    expect(bancoCaJson).toEqual(parsearTextosIdiomaMd(MD));
  });

  it('los textos son los aprobados, letra por letra (si cambian a propósito: copiar banco-ca.json a test/fijos/banco-ca-aprobado.json)', () => {
    expect(bancoCaJson).toEqual(aprobado);
  });

  it('cada pregunta y cada mensaje de banco.md tiene su texto en catalán, y no sobra ninguno', () => {
    expect(Object.keys(CA.preguntas).sort()).toEqual(BANCO.map((p) => p.id).sort());
    expect(Object.keys(CA.mensajes).sort()).toEqual(MENSAJES.map((m) => m.id).sort());
    expect(Object.keys(CA.nombresBloque).map(Number).sort((a, b) => a - b)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
  });

  it('cada pregunta con botones tiene los mismos botones (cantidad y orden), de hasta 20 letras', () => {
    for (const p of BANCO) {
      expect(CA.botones[p.id]?.length ?? 0, p.id).toBe(p.botones?.length ?? 0);
      for (const b of CA.botones[p.id] ?? []) expect([...b].length, `${p.id}: ${b}`).toBeLessThanOrEqual(MAX_LETRAS_BOTON);
    }
    expect(Object.keys(CA.botones).every((id) => preguntaPorId(id)?.botones)).toBe(true);
  });

  it('las mismas marcas que el castellano: {{nombre}} y compañía, las variantes «sino:X» y los saltos de línea', () => {
    for (const p of BANCO) {
      const t = CA.preguntas[p.id];
      expect(campos(t), p.id).toEqual(campos(p.texto));
      expect(variantes(t), p.id).toEqual(variantes(p.texto));
      expect(saltos(t), p.id).toBe(saltos(p.texto));
    }
    for (const m of MENSAJES) {
      const t = CA.mensajes[m.id];
      expect(campos(t), m.id).toEqual(campos(m.texto));
      expect(saltos(t), m.id).toBe(saltos(m.texto));
    }
  });

  it('las marcas de género están bien formadas: {{masculino/femenino}}, sin llaves sueltas', () => {
    const todos = [...Object.values(CA.preguntas), ...Object.values(CA.mensajes)];
    for (const t of todos) {
      const sinMarcas = t.replace(/\{\{(nombre|quien_regala|tema|etapa)\}\}/g, '').replace(/\{\{[^{}/]+\/[^{}/]+\}\}/g, '');
      expect(sinMarcas, t).not.toMatch(/[{}]/);
    }
  });

  it('ningún texto largo quedó en castellano (igual al de banco.md)', () => {
    for (const p of BANCO) if (p.texto.length > 20) expect(CA.preguntas[p.id], p.id).not.toBe(p.texto);
    for (const m of MENSAJES) if (m.texto.length > 20) expect(CA.mensajes[m.id], m.id).not.toBe(m.texto);
  });

  it('el mensaje de la repregunta es el mismo que dice el prompt del cazador en catalán', () => {
    const prompt = readFileSync(path.join(RAIZ, 'docs', 'v3', 'entrevista', 'cazador', 'prompt-v3-1-ca.md'), 'utf8');
    expect(prompt).toContain(`"${CA.repregunta.mensaje}"`);
    expect(botonRepregunta('ca')).toEqual({ texto: "Ja t'ho he dit tot", vale: 'no' });
    expect(botonRepregunta()).toEqual({ texto: 'Ya lo conté todo', vale: 'no' });
  });
});

describe('bancoDe("ca"): el mismo banco con los textos en catalán', () => {
  const ca = bancoDe('ca');

  it('mismo orden, mismas reglas, mismos sensibles; los botones valen lo mismo', () => {
    expect(ca.map((p) => p.id)).toEqual(BANCO.map((p) => p.id));
    ca.forEach((p, i) => {
      const es = BANCO[i];
      expect({ ...p, texto: '', botones: p.botones?.map((b) => b.vale) }).toEqual({ ...es, texto: '', botones: es.botones?.map((b) => b.vale) });
    });
  });

  it('el castellano sigue siendo el de banco.md', () => {
    expect(bancoDe()).toBe(BANCO);
    expect(mensajesDe()).toBe(MENSAJES);
    expect(mensajePorId('BIEN')!.texto).toMatch(/^Hola, \{\{nombre\}\}, ¿cómo estás\?/);
  });

  it('la bienvenida y los nombres de bloque en catalán', () => {
    expect(mensajePorId('BIEN', 'ca')!.texto).toMatch(/^Hola, \{\{nombre\}\}, com estàs\?/);
    expect(mensajePorId('BIEN', 'ca')!.texto).toContain('\n\n');
    expect(nombresBloqueDe('ca')[14]).toBe('Avui');
  });
});

describe('el flujo en catalán', () => {
  const ficha: FichaV3 & { idioma: 'ca' } = { nombre: 'Montse', anioNacimiento: 1950, genero: 'mujer', paisNacimiento: 'España', paisResidencia: 'España', idioma: 'ca' };
  const estado = (pares: [string, string][]): EstadoEntrevista => ({ respuestas: new Map(pares), idioma: 'ca' });

  it('la primera pregunta llega en catalán', () => {
    const s = siguientePregunta(estado([]));
    expect(s.tipo).toBe('pregunta');
    if (s.tipo === 'pregunta') expect(s.pregunta.texto).toBe(CA.preguntas.OR1);
  });

  it('las que abren tema llevan sus botones en catalán, y tocarlos vale lo mismo', () => {
    const p = preguntaPorId('HI0', 'ca')!;
    expect(p.botones!.map((b) => b.texto)).toEqual(CA.botones.HI0);
    const toco = (texto: string): Respuestas => new Map([['HI0', respuestaDeBoton(texto)]]);
    const no = p.botones!.find((b) => b.vale === 'no')!.texto;
    expect(respondioNo(toco(no), 'HI0', 'ca')).toBe(true);
  });

  it('un "no" en catalán a HI0 saltea las de hijos, igual que en castellano', () => {
    const r: Respuestas = new Map([['HI0', 'Mai.']]);
    expect(respondioNo(r, 'HI0', 'ca')).toBe(true);
    expect(respondioNo(r, 'HI0')).toBe(false); // en castellano "mai" no es nada
  });

  it('la segunda oportunidad después de "No me\'n recordo" es el M33 en catalán', () => {
    const s = siguientePregunta(estado([['CA16', "No me'n recordo."]]));
    expect(s).toMatchObject({ tipo: 'segunda-oportunidad', de: 'CA16', mensaje: 'M33.1' });
    expect(mensajePorId('M33.1', 'ca')!.texto).not.toBe(mensajePorId('M33.1')!.texto);
  });

  it('la repregunta lleva [Ja t\'ho he dit tot]', () => {
    const e: EstadoEntrevista = {
      ...estado([['CA2', 'La casa era al carrer Major.'], ['CA3', 'a'], ['CA4', 'b'], ['CA5', 'c']]),
      repreguntas: [{ clave: 'RP~CA2', origen: 'CA2', bloque: 2, cita: 'al carrer Major', pregunta: 'Com era?', tema: 'la casa' }],
    };
    const s = siguientePregunta(e);
    expect(s).toMatchObject({ tipo: 'repregunta', botones: [{ texto: "Ja t'ho he dit tot", vale: 'no' }] });
  });

  it('los acuses salen igual que en castellano según lo que dijo en catalán', () => {
    const p = preguntaPorId('CA2', 'ca')!;
    expect(mensajesDespues(p, 'Passo.', new Map(), 'ca')).toEqual(['M21']);
    expect(mensajesDespues(p, "No me'n recordo.", new Map(), 'ca')).toEqual(['M28']);
    expect(mensajesDespues(p, 'Era una casa petita al costat del riu.', new Map(), 'ca')).toEqual(['M3']);
  });

  it('las dudas del dashboard nombran el tema en catalán', () => {
    const dudas = contradiccionesConFicha({ ...ficha, hijos: [{ nombre: 'Pau' }] }, new Map([['HI0', 'No, mai.']]));
    expect(dudas).toEqual([expect.objectContaining({ mensaje: 'DD1', temaTexto: 'els teus fills' })]);
  });

  it('la variante «sino:X» mira la respuesta en catalán', () => {
    const fin = CA.preguntas.FIN;
    const conFoto = renderizar(fin, ficha, new Map([['FO1', 'Sí, ara te la envio.']]));
    const sinFoto = renderizar(fin, ficha, new Map([['FO1', respuestaDeBoton(CA.botones.FO1[0])]]));
    expect(conFoto).not.toBe(sinFoto);
    expect(conFoto).toContain('Montse');
  });

  it('el género sale bien: {{nen/nena}} → nena', () => {
    expect(renderizar(CA.mensajes.EN4, ficha)).toContain('nena');
    expect(renderizar(CA.mensajes.EN4, { ...ficha, genero: 'varon' })).toContain('nen,');
  });

  it('"Bé, seguim." no va delante de algo que arranca con "Seguim" o "Passem"', () => {
    expect(acuseNeutro(0, CA.mensajes.EN3)).toBe('M25.3');
    expect(acuseNeutro(0, CA.mensajes.EN5)).toBe('M25.3');
  });

  it('si el acuse ya dice el nombre, la entrada va sin el nombre ("…, {{nombre}}, i de…")', () => {
    expect(entradaSegunAcuse(CA.mensajes.EN10, 'Gràcies, {{nombre}}.')).toBe("Parlem dels amics i de la gent que t'ha donat un cop de mà a la vida.");
  });
});

describe('el idioma de la ficha', () => {
  it('vacío es es-AR; ca es ca; otra cosa es un error', () => {
    expect(idiomaDe({})).toBe('es-AR');
    expect(idiomaDe({ idioma: 'ca' })).toBe('ca');
    expect(() => idiomaDe({ idioma: 'fr' })).toThrow(/desconocido/);
  });
});
