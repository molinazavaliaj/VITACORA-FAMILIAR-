// La entrevista en catalán (Naza, 04/10): el cazador usa el prompt en
// catalán (el original no se toca), le pasa los bloques en catalán, controla
// los tiempos relativos en catalán y manda el mensaje fijo en catalán. La
// transcripción va con language 'ca'. NINGÚN test llama a la API.
// Vida inventada.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  armarEntrada, BLOQUES_CAZADOR, BLOQUES_CAZADOR_CA, cazarBloque, controlarElegida, extraerPrompt, mensajeRepregunta, PROMPT_CAZADOR, PROMPT_CAZADOR_DE, respuestasParaCazar,
  type ClienteModelo, type PedidoModelo,
} from '../src/v3/entrevista/cazador.js';
import { preguntaPorId } from '../src/v3/entrevista/banco.js';
import { promptDeTranscripcion, transcribirAudio, transcribirConOpenAI } from '../src/v3/entrevista/transcribir.js';
import type { Respuestas } from '../src/v3/entrevista/flujo.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PROMPT_CA_MD = readFileSync(path.join(RAIZ, 'docs', 'v3', 'entrevista', 'cazador', 'prompt-v3-1-ca.md'), 'utf8');

describe('el prompt del cazador en catalán', () => {
  it('el json está al día con el md (si falla: npx tsx scripts/v3-cazador-json.ts)', () => {
    expect(PROMPT_CAZADOR_DE.ca).toBe(extraerPrompt(PROMPT_CA_MD));
  });
  it('el castellano sigue con el prompt de siempre', () => {
    expect(PROMPT_CAZADOR_DE['es-AR']).toBe(PROMPT_CAZADOR);
    expect(PROMPT_CAZADOR_DE.ca).not.toBe(PROMPT_CAZADOR);
  });
  it('las etiquetas y los campos del JSON quedan sin traducir (los lee el código)', () => {
    for (const x of ['<ficha>', '<bloque>', '<respuestas_del_bloque>', '<ya_repreguntado>', '<escenas_contadas>', '<lo_que_viene>', 'pedido_dia="si"', 'paso="si"', 'elegidas', 'escenas_contadas_bloque', '{cita}', '{pregunta}']) {
      expect(PROMPT_CAZADOR_DE.ca, x).toContain(x);
    }
  });
  it('el bloque Hoy se llama "Avui", como dice el prompt', () => {
    expect(BLOQUES_CAZADOR_CA).toHaveLength(BLOQUES_CAZADOR.length);
    expect(BLOQUES_CAZADOR_CA[13].nombre).toBe('Avui');
    expect(PROMPT_CAZADOR_DE.ca).toContain('"Avui"');
  });
});

describe('los controles en catalán', () => {
  const resp = 'Cada estiu anàvem a la masia dels avis, a prop de Vic, i ajudàvem a collir les patates.';
  const cita = 'anàvem a la masia dels avis';
  it('una buena pasa', () => {
    expect(controlarElegida({ cita, pregunta: "Hi ha algun estiu d'aquells que recordis més que els altres, i què hi va passar?" }, resp, false, 'ca')).toEqual([]);
  });
  it('"ahir", "l\'altre dia" o "aquesta setmana" son tiempo relativo', () => {
    expect(controlarElegida({ cita, pregunta: 'Què em vas dir ahir de la masia?' }, resp, false, 'ca')).toContain('tiempo relativo');
    expect(controlarElegida({ cita, pregunta: "Com era la masia que em vas explicar l'altre dia?" }, resp, false, 'ca')).toContain('tiempo relativo');
    expect(controlarElegida({ cita, pregunta: 'Aquesta setmana has tornat a la masia?' }, resp, false, 'ca')).toContain('tiempo relativo');
  });
  it('"avui" solo en el bloque Avui', () => {
    const pregunta = 'Com és avui un dia teu a la masia?';
    expect(controlarElegida({ cita, pregunta }, resp, false, 'ca')).toContain('tiempo relativo');
    expect(controlarElegida({ cita, pregunta }, resp, true, 'ca')).toEqual([]);
  });
  it('la cita tiene que ser textual, con apóstrofos y todo', () => {
    expect(controlarElegida({ cita: "la masia de l'avi", pregunta: 'Com era?' }, resp, false, 'ca')).toContain('la cita no es textual');
  });
});

describe('el mensaje de la repregunta en catalán', () => {
  it('mitad fijo, mitad del modelo', () => {
    expect(mensajeRepregunta({ cita: 'la masia dels avis', pregunta: 'Quin estiu recordes més?' }, 'ca')).toBe(
      "He estat pensant en una cosa que em vas explicar: «la masia dels avis». Quin estiu recordes més? I si no te'n recordes, o ja m'ho has explicat tot, digues-m'ho i en fem una altra.",
    );
  });
  it('en castellano, el de siempre', () => {
    expect(mensajeRepregunta({ cita: 'x', pregunta: 'y?' })).toMatch(/^Me quedé pensando en algo que me contaste: «x»\. y\? Y si no te vuelve/);
  });
  it('un "$" en la cita no rompe el reemplazo', () => {
    expect(mensajeRepregunta({ cita: 'costava 5 $&', pregunta: 'I?' }, 'ca')).toContain('«costava 5 $&»');
  });
});

describe('cazarBloque en catalán (cliente falso)', () => {
  const respuestas: Respuestas = new Map([
    ['CA2', 'Era una casa petita al carrer Major, amb un pati i una figuera. Hi vivíem sis.'],
    ['CA3', 'La meva mare cosia per a fora i cantava mentre cosia.'],
    ['CA4', 'Passo.'],
  ]);
  const textoPregunta = (id: string) => preguntaPorId(id, 'ca')!.texto;

  it('usa el prompt en catalán, pasa el bloque en catalán y marca el "passo"', async () => {
    const pedidos: PedidoModelo[] = [];
    const cliente: ClienteModelo = {
      messages: {
        create: async (p) => {
          pedidos.push(p);
          return { content: [{ type: 'text', text: JSON.stringify({ elegidas: [{ id: 'CA2', cita: 'amb un pati i una figuera', pregunta: 'Recordes alguna tarda sota aquella figuera, qui hi era i què fèieu?', tema: 'la figuera' }], escenas_contadas_bloque: [] }) }], usage: { input_tokens: 1000, output_tokens: 100 } };
        },
      },
    };
    const r = await cazarBloque({ cliente, ficha: '<ficha>\nnombre: Montse\n</ficha>', bloque: 2, respuestas, textoPregunta, yaRepreguntado: [], escenasContadas: [], gastoUsd: 0, idioma: 'ca' });
    expect(pedidos[0].system).toBe(PROMPT_CAZADOR_DE.ca);
    expect(pedidos[0].messages[0].content).toContain('<bloque>La casa de petit</bloque>');
    expect(pedidos[0].messages[0].content).toContain('el primer dia d\'escola');
    expect(pedidos[0].messages[0].content).toMatch(/<respuesta id="CA4" paso="si">/);
    expect(r.repreguntas).toHaveLength(1);
  });

  it('sin idioma, todo como antes', () => {
    const entrada = armarEntrada({ ficha: '', bloque: 2, respuestas: respuestasParaCazar(respuestas, 2, textoPregunta), yaRepreguntado: [], escenasContadas: [] });
    expect(entrada).toContain('<bloque>La casa de chico</bloque>');
  });
});

describe('la transcripción en catalán', () => {
  const capturar = () => {
    const forms: FormData[] = [];
    const fetchFalso = (async (_url: string, init: { body: FormData }) => {
      forms.push(init.body);
      return new Response(JSON.stringify({ text: 'Hola', usage: { seconds: 3 } }), { status: 200 });
    }) as unknown as typeof fetch;
    return { forms, fetchFalso };
  };

  it('manda language "ca" y el vocabulario en catalán', async () => {
    const { forms, fetchFalso } = capturar();
    const t = transcribirConOpenAI({ key: () => 'k', fetch: fetchFalso });
    await t(Buffer.from('a'), { tipo: 'audio/webm', nombreArchivo: 'a.webm', narrador: 'Montse', idioma: 'ca' });
    expect(forms[0].get('language')).toBe('ca');
    expect(forms[0].get('prompt')).toBe(promptDeTranscripcion('Montse', 'ca'));
    expect(String(forms[0].get('prompt'))).toMatch(/^Montse explica la seva vida en català\./);
  });

  it('sin idioma, castellano como siempre', async () => {
    const { forms, fetchFalso } = capturar();
    await transcribirAudio(Buffer.from('a'), { key: 'k', tipo: 'audio/webm', nombreArchivo: 'a.webm', fetch: fetchFalso });
    expect(forms[0].get('language')).toBe('es');
    expect(promptDeTranscripcion('Naza')).toMatch(/castellano rioplatense/);
  });
});
