import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { crearBaseFalsa as baseV3 } from './v3/base-falsa.js';
import { depsDePrueba as depsV3 } from './v3/deps-prueba.js';
import { crearBaseFalsa as baseHistoria } from './historia/base-falsa.js';
import { depsDePrueba as depsHistoria } from './historia/deps-prueba.js';
import { crearFila as crearFilaV3, leerFila as leerFilaV3 } from '../src/v3/estado.js';
import { drenar as drenarV3 } from '../src/v3/enviar.js';
import { estadoInicial as estadoV3 } from '../src/v3/tipos.js';
import { crearFila as crearFilaHistoria, leerFila as leerFilaHistoria } from '../src/historia/estado.js';
import { drenar as drenarHistoria } from '../src/historia/enviar.js';
import { estadoInicial as estadoHistoria } from '../src/historia/tipos.js';

// El mensaje final con el link para sacar respuestas (PR 212), cuando la entrevista termina con la ventana de 24 horas
// cerrada: sale la plantilla `revision` si está aprobada y el plazo de 48 horas sigue abierto.

const AHORA = new Date('2026-11-10T15:00:00Z');
const horasAntes = (h: number) => new Date(AHORA.getTime() - h * 3600_000).toISOString();
const TEL = '+5491100000000';

type Opciones = { ultimaRespuesta?: string | null; ultimoEntrante?: string; idioma?: 'es-AR' | 'es-ES' | 'ca'; vinculo?: string; como?: string; linkFinal?: string; fallar?: number };

const narrador = (o: Opciones, contexto: Record<string, unknown>) => ({
  id: 'n1', telefono_whatsapp: TEL, como_le_dicen: o.como ?? 'la abuela', estado: 'activo', zona_horaria: 'America/Argentina/Buenos_Aires',
  ultima_respuesta_at: o.ultimaRespuesta === undefined ? horasAntes(30) : o.ultimaRespuesta, contexto: { ...contexto, vinculoComprador: o.vinculo ?? 'hija' },
});
const alEstado = (o: Opciones) => ({ terminada: true, ultimoEntranteAt: o.ultimoEntrante ?? horasAntes(30), ...(o.linkFinal ? { linkFinal: o.linkFinal } : {}) });

async function prepararV3(o: Opciones) {
  const base = baseV3({ narradores: [narrador(o, {})], envios: [] });
  await crearFilaV3(base.cliente, {
    narrador_id: 'n1', idioma: o.idioma ?? 'es-AR', ficha: { nombre: 'Marta', genero: 'mujer' }, estado: { ...estadoV3(), ...alEstado(o) },
    ultimo_audio_at: null, tanda_dia: null, tanda_cuenta: 0, migrada_de: null,
  });
  const p = depsV3(base, { ahora: AHORA, fallarEnvios: o.fallar });
  return { base, ...p, drenar: () => drenarV3(p.deps, 'n1'), fila: () => leerFilaV3(base.cliente, 'n1') };
}

async function prepararHistoria(o: Opciones) {
  const base = baseHistoria({ narradores: [narrador(o, { modo: 'historia' })], envios: [] }, { ahora: () => AHORA });
  await crearFilaHistoria(base.cliente, {
    narrador_id: 'n1', idioma: o.idioma ?? 'es-AR', ficha: { nombre: 'Marta', genero: 'mujer', tema: 'mudanza' }, compra: { preguntasPropias: [] },
    estado: { ...estadoHistoria({ temaAbierto: false, propias: [] }), ...alEstado(o) },
    ultimo_audio_at: null, tanda_dia: null, tanda_cuenta: 0,
  });
  const p = depsHistoria(base, { ahora: AHORA, fallarEnvios: o.fallar });
  return { base, ...p, drenar: () => drenarHistoria(p.deps, 'n1'), fila: () => leerFilaHistoria(base.cliente, 'n1') };
}

// La entrevista de prueba no tiene respuestas: el aviso de «sin material» sale siempre y no es de esto.
const delLink = (a: { avisos: { clave: string; asunto: string; detalle: string }[] }) => a.avisos.filter((x) => x.clave.startsWith('link-final-'));

describe.each([['V3', prepararV3], ['historia', prepararHistoria]] as const)('el link al terminar con la ventana cerrada, en %s', (_nombre, preparar) => {
  beforeEach(() => {
    process.env.FIRMA_TOKENS = 'secreto';
    process.env.WA_PLANTILLAS_V3_LISTAS = 'es-AR:revision,es-ES:revision,ca:revision';
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    delete process.env.FIRMA_TOKENS;
    delete process.env.WA_PLANTILLAS_V3_LISTAS;
    vi.restoreAllMocks();
  });

  it('plantilla lista y plazo abierto: sale con su nombre y el token en el botón, marca linkFinal y anota el envío', async () => {
    const a = await preparar({});
    await a.drenar();
    expect(a.enviados).toHaveLength(1);
    expect(a.enviados[0]).toMatchObject({ a: TEL, tipo: 'plantilla', plantilla: 'revision_vos', idiomaMeta: 'es', variables: ['la abuela'] });
    const token = a.enviados[0].botonUrl as string;
    expect(JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())).toMatchObject({ narradorId: 'n1', tipo: 'respuestas' });
    expect((await a.fila())?.estado.linkFinal).toBe(AHORA.toISOString());
    expect(a.base.tablas.envios).toMatchObject([{ narrador_id: 'n1', tipo: 'revision', pregunta_orden: null }]);
    expect(delLink(a)).toEqual([]);
  });

  it('el idioma de la fila elige la plantilla', async () => {
    const es = await preparar({ idioma: 'es-ES' });
    await es.drenar();
    expect(es.enviados[0]).toMatchObject({ plantilla: 'revision_es_es', idiomaMeta: 'es_ES' });
    const ca = await preparar({ idioma: 'ca' });
    await ca.drenar();
    expect(ca.enviados[0]).toMatchObject({ plantilla: 'revision_ca', idiomaMeta: 'ca' });
  });

  it('sin la plantilla marcada: no sale nada y avisa a los socios, sin teléfono', async () => {
    process.env.WA_PLANTILLAS_V3_LISTAS = 'es-ES:revision';
    const a = await preparar({});
    await a.drenar();
    expect(a.enviados).toEqual([]);
    expect(delLink(a)).toHaveLength(1);
    expect(delLink(a)[0].clave).toBe('link-final-n1');
    expect(`${delLink(a)[0].asunto}${delLink(a)[0].detalle}`).not.toContain(TEL);
    expect((await a.fila())?.estado.linkFinal).toBe(AHORA.toISOString());
  });

  it('plazo de 48 horas vencido: no manda ni avisa', async () => {
    const a = await preparar({ ultimaRespuesta: horasAntes(48) });
    await a.drenar();
    expect(a.enviados).toEqual([]);
    expect(delLink(a)).toEqual([]);
    expect(a.base.tablas.envios).toEqual([]);
    expect((await a.fila())?.estado.linkFinal).toBe(AHORA.toISOString());
  });

  it('plazo vencido y sin plantilla: tampoco avisa, ya no hay nada que hacer', async () => {
    delete process.env.WA_PLANTILLAS_V3_LISTAS;
    const a = await preparar({ ultimaRespuesta: horasAntes(60) });
    await a.drenar();
    expect(delLink(a)).toEqual([]);
  });

  it('«para mí»: nada, no es un privado', async () => {
    const a = await preparar({ vinculo: 'yo mismo' });
    await a.drenar();
    expect(a.enviados).toEqual([]);
    expect(delLink(a)).toEqual([]);
    expect((await a.fila())?.estado.linkFinal).toBeUndefined();
  });

  it('con linkFinal ya marcado no vuelve a salir', async () => {
    const a = await preparar({ linkFinal: horasAntes(1) });
    await a.drenar();
    expect(a.enviados).toEqual([]);
  });

  it('sin como_le_dicen no manda plantilla (Meta rechaza una variable vacía) y avisa', async () => {
    const a = await preparar({ como: '  ' });
    await a.drenar();
    expect(a.enviados).toEqual([]);
    expect(delLink(a)).toHaveLength(1);
    expect(delLink(a)[0].detalle).toContain('como_le_dicen');
  });

  it('si Meta la rechaza: avisa, no marca y el cierre sigue', async () => {
    const a = await preparar({ fallar: 1 });
    await a.drenar();
    expect(delLink(a)).toHaveLength(1);
    expect(delLink(a)[0].clave).toBe('link-final-n1');
    expect((await a.fila())?.estado.linkFinal).toBeUndefined();
    expect(a.base.tablas.narradores[0].estado).toBe('completado');
  });

  it('con la ventana abierta sigue saliendo el texto de siempre, sin plantilla', async () => {
    const a = await preparar({ ultimoEntrante: horasAntes(1), ultimaRespuesta: horasAntes(1) });
    await a.drenar();
    expect(a.enviados).toHaveLength(1);
    expect(a.enviados[0].tipo).toBe('texto');
    expect(a.enviados[0].texto).toContain('/mis-respuestas/');
  });
});
