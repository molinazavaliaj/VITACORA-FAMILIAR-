// La entrevista en castellano de España, de tú (Naza, 05/10): los tests que
// dependen de los textos reales de docs/v3/entrevista/banco-es-ES.md (los
// escribe Fable; los aprueba Naza). Mismo molde que v3-catala-banco: si cambia
// banco.md y falta el texto es-ES, fallan; los aprobados quedan fijados letra
// por letra en test/fijos/banco-es-ES-aprobado.json (se crea copiando
// banco-es-ES.json cuando Naza los aprueba; hasta entonces ese test falla).
// Y una entrevista entera en es-ES no deja pasar nada de vos ni rioplatense.
// Vidas inventadas.

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parsearTextosIdiomaMd } from '../src/v3/entrevista/banco-idioma-md.js';
import { BANCO, bancoDe, MENSAJES, mensajePorId, nombresBloqueDe, preguntaPorId, TEXTOS_IDIOMA } from '../src/v3/entrevista/banco.js';
import { MAX_LETRAS_BOTON } from '../src/v3/entrevista/banco-md.js';
import { botonRepregunta, mensajesDespues, respondioNo, siguientePregunta, type EstadoEntrevista, type Respuestas } from '../src/v3/entrevista/flujo.js';
import { acuseNeutro, entradaSegunAcuse } from '../src/v3/entrevista/mensajes.js';
import { respuestaDeBoton } from '../src/v3/entrevista/respuesta.js';
import { mensajeRepregunta } from '../src/v3/entrevista/cazador.js';
import { botonesAbiertos } from '../scripts/v3-entrevista-web.js';
import { nuevaEntrevista, responder, tocarBoton } from '../scripts/v3-entrevista-turno.js';
import bancoEsEsJson from '../src/v3/entrevista/banco-es-ES.json' with { type: 'json' };

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MD = readFileSync(path.join(RAIZ, 'docs', 'v3', 'entrevista', 'banco-es-ES.md'), 'utf8');
const FIJO = path.join(RAIZ, 'fabrica', 'test', 'fijos', 'banco-es-ES-aprobado.json');
const ES = TEXTOS_IDIOMA['es-ES'];

const campos = (t: string) => (t.match(/\{\{(nombre|nombre_pila|quien_regala|tema|etapa)\}\}/g) ?? []).sort();
const variantes = (t: string) => [...t.matchAll(/«sino:([A-Z0-9.]+):/g)].map((m) => m[1]).sort();
const saltos = (t: string) => (t.match(/\n|<br>/g) ?? []).length;

/** Formas de vos y palabras rioplatenses que no pueden aparecer en nada que se le escriba a alguien de España. */
const VOSEO = /(?<![\p{L}])(vos|sos|tenés|querés|sabés|podés|contás|acordás|sentís|vivís|contame|contanos|decime|decímelo|contámelo|mandame|acordate|fijate|mirá|pensá|nomás|dale|laburo|laburar|pibe|piba|plata|celular|acá)(?![\p{L}])/iu;

describe('banco-es-ES.md', () => {
  it('el json está al día con el md (si falla: npx tsx scripts/v3-entrevista-json.ts)', () => {
    expect(bancoEsEsJson).toEqual(parsearTextosIdiomaMd(MD));
  });

  it('los textos son los aprobados, letra por letra (cuando Naza los aprueba: copiar banco-es-ES.json a test/fijos/banco-es-ES-aprobado.json)', () => {
    expect(existsSync(FIJO), 'falta test/fijos/banco-es-ES-aprobado.json').toBe(true);
    expect(bancoEsEsJson).toEqual(JSON.parse(readFileSync(FIJO, 'utf8')));
  });

  it('cada pregunta y cada mensaje de banco.md tiene su texto es-ES, y no sobra ninguno', () => {
    expect(Object.keys(ES.preguntas).sort()).toEqual(BANCO.map((p) => p.id).sort());
    expect(Object.keys(ES.mensajes).sort()).toEqual(MENSAJES.map((m) => m.id).sort());
    expect(Object.keys(ES.nombresBloque).map(Number).sort((a, b) => a - b)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
  });

  it('los mismos botones (cantidad y orden), de hasta 20 letras', () => {
    for (const p of BANCO) {
      expect(ES.botones[p.id]?.length ?? 0, p.id).toBe(p.botones?.length ?? 0);
      for (const b of ES.botones[p.id] ?? []) expect([...b].length, `${p.id}: ${b}`).toBeLessThanOrEqual(MAX_LETRAS_BOTON);
    }
    expect(Object.keys(ES.botones).every((id) => preguntaPorId(id)?.botones)).toBe(true);
    expect([...ES.repregunta.boton].length).toBeLessThanOrEqual(MAX_LETRAS_BOTON);
  });

  it('las mismas marcas: {{nombre}} y compañía, «sino:X» y los saltos de línea', () => {
    for (const p of BANCO) {
      const t = ES.preguntas[p.id];
      expect(campos(t), p.id).toEqual(campos(p.texto));
      expect(variantes(t), p.id).toEqual(variantes(p.texto));
      expect(saltos(t), p.id).toBe(saltos(p.texto));
    }
    for (const m of MENSAJES) {
      const t = ES.mensajes[m.id];
      expect(campos(t), m.id).toEqual(campos(m.texto));
      expect(saltos(t), m.id).toBe(saltos(m.texto));
    }
  });

  it('las marcas de género bien formadas, sin llaves sueltas', () => {
    for (const t of [...Object.values(ES.preguntas), ...Object.values(ES.mensajes)]) {
      const sinMarcas = t.replace(/\{\{(nombre|nombre_pila|quien_regala|tema|etapa)\}\}/g, '').replace(/\{\{[^{}/]+\/[^{}/]+\}\}/g, '');
      expect(sinMarcas, t).not.toMatch(/[{}]/);
    }
  });

  it('de tú: ningún texto con vos ni palabras rioplatenses', () => {
    const todos: [string, string][] = [
      ...Object.entries(ES.preguntas),
      ...Object.entries(ES.mensajes),
      ...Object.entries(ES.botones).flatMap(([id, bs]) => bs.map((b): [string, string] => [id, b])),
      ['repregunta', ES.repregunta.mensaje],
      ['botón repregunta', ES.repregunta.boton],
      ...Object.entries(ES.nombresBloque),
    ];
    expect(todos.filter(([, t]) => VOSEO.test(t))).toEqual([]);
  });

  it('el mensaje de la repregunta es el mismo que dice el prompt del cazador es-ES', () => {
    const prompt = readFileSync(path.join(RAIZ, 'docs', 'v3', 'entrevista', 'cazador', 'prompt-v3-1-es-ES.md'), 'utf8');
    expect(prompt).toContain(`"${ES.repregunta.mensaje}"`);
    expect(botonRepregunta('es-ES')).toEqual({ texto: ES.repregunta.boton, vale: 'no' });
    expect(mensajeRepregunta({ cita: 'el pueblo', pregunta: '¿Qué verano recuerdas más?' }, 'es-ES')).toContain('«el pueblo». ¿Qué verano recuerdas más?');
  });

  it('la entrada sin el nombre si el acuse ya lo dice (", {{nombre}}, y …")', () => {
    for (const m of MENSAJES.filter((x) => /^EN\d+$/.test(x.id))) {
      const t = ES.mensajes[m.id];
      if (t.includes('{{nombre}}')) expect(entradaSegunAcuse(t, 'Gracias, {{nombre}}.'), m.id).not.toContain('{{nombre}}');
    }
  });

  it('el acuse neutro no repite el verbo con el que arranca la entrada ("Bien, seguimos. Seguimos con…")', () => {
    const ultima = (t: string) => t.toLowerCase().replace(/[^\p{L} ]/gu, '').trim().split(' ').at(-1);
    const primera = (t: string) => t.toLowerCase().replace(/[^\p{L} ]/gu, '').trim().split(' ')[0];
    for (const m of MENSAJES.filter((x) => /^EN\d+$/.test(x.id))) {
      const t = ES.mensajes[m.id];
      for (let n = 0; n < 3; n++) {
        const acuse = ES.mensajes[acuseNeutro(n, t)];
        expect(ultima(acuse) === primera(t), `${m.id}: «${acuse}» + «${t}»`).toBe(false);
      }
    }
  });
});

describe('el flujo con los textos es-ES', () => {
  const estado = (pares: [string, string][]): EstadoEntrevista => ({ respuestas: new Map(pares), idioma: 'es-ES' });

  it('mismo banco, mismas reglas; la primera pregunta y la bienvenida en es-ES', () => {
    expect(bancoDe('es-ES').map((p) => p.id)).toEqual(BANCO.map((p) => p.id));
    const s = siguientePregunta(estado([]));
    expect(s.tipo === 'pregunta' && s.pregunta.texto).toBe(ES.preguntas.OR1);
    expect(mensajePorId('BIEN', 'es-ES')!.texto).toBe(ES.mensajes.BIEN);
    expect(nombresBloqueDe('es-ES')[14]).toBe(ES.nombresBloque[14]);
  });

  it('los botones es-ES valen lo mismo', () => {
    const p = preguntaPorId('HI0', 'es-ES')!;
    expect(p.botones!.map((b) => b.texto)).toEqual(ES.botones.HI0);
    const no = p.botones!.find((b) => b.vale === 'no')!.texto;
    const r: Respuestas = new Map([['HI0', respuestaDeBoton(no)]]);
    expect(respondioNo(r, 'HI0', 'es-ES')).toBe(true);
  });

  it('los acuses según lo que dijo', () => {
    const p = preguntaPorId('CA2', 'es-ES')!;
    expect(mensajesDespues(p, 'Paso.', new Map(), 'es-ES')).toEqual(['M21']);
    expect(mensajesDespues(p, 'Se me ha olvidado.', new Map(), 'es-ES')).toEqual(['M28']);
  });
});

describe('una entrevista entera en es-ES (simulación por turnos)', () => {
  it('nada de vos ni rioplatense, y ninguna marca sin reemplazar', () => {
    const variadas = [
      'Nací en un pueblo de Teruel; mi padre era herrero y mi madre cosía para fuera.',
      'No me acuerdo.',
      'Paso.',
      'Se me ha olvidado, la verdad.',
      'Vale.',
      'Recuerdo la plaza del pueblo en fiestas, con la orquesta y mis primas bailando hasta las tantas.',
    ];
    let r = nuevaEntrevista({ nombre: 'Pilar', genero: 'mujer', idioma: 'es-ES' });
    const leidos = [...r.mensajes];
    for (let i = 0; i < 600 && !r.estado.terminada; i++) {
      const botones = botonesAbiertos(r.estado);
      r = botones.length > 0 && i % 3 === 0 && !r.estado.tocoSi ? tocarBoton(r.estado, botones.at(-1)!) : responder(r.estado, variadas[i % variadas.length]);
      leidos.push(...r.mensajes);
    }
    expect(r.estado.terminada).toBe(true);
    const lineas = leidos.flatMap((m) => m.split('\n'));
    expect(lineas.filter((l) => VOSEO.test(l))).toEqual([]);
    expect(lineas.filter((l) => /\{\{|\}\}|«sino:/.test(l))).toEqual([]);
  });
});
