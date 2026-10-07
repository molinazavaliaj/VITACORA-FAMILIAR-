import { describe, it, expect, afterEach } from 'vitest';
import { crearBaseFalsa } from './base-falsa.js';
import { depsDePrueba } from './deps-prueba.js';
import { crearFila, leerFila, TOMA_MS } from '../../src/v3/estado.js';
import { drenar, enLineaParaPlantilla, LARGO_MAXIMO_PLANTILLA, paraPlantilla, plantillaLista } from '../../src/v3/enviar.js';
import { PLANTILLAS_V3 } from '../../src/config.js';
import { encolar } from '../../src/v3/turno.js';
import { estadoInicial, type EstadoV3 } from '../../src/v3/tipos.js';
import type { Idioma } from '../../src/v3/nucleo/entrevista/idioma.js';

const AHORA = new Date('2026-10-08T13:00:00Z');
const HACE_1H = new Date(AHORA.getTime() - 3600_000).toISOString();
const HACE_25H = new Date(AHORA.getTime() - 25 * 3600_000).toISOString();

async function preparar(estado: EstadoV3, o: { idioma?: Idioma; enviando_hasta?: string } = {}) {
  const base = crearBaseFalsa({
    narradores: [{ id: 'n1', telefono_whatsapp: '+5491100000000', como_le_dicen: 'Prueba', estado: 'activo' }],
  });
  await crearFila(base.cliente, {
    narrador_id: 'n1', idioma: o.idioma ?? 'es-AR', ficha: { nombre: 'Prueba', genero: 'mujer' }, estado,
    ultimo_audio_at: null, tanda_dia: null, tanda_cuenta: 0, migrada_de: null,
  });
  if (o.enviando_hasta) base.tablas.entrevistas_v3[0].enviando_hasta = o.enviando_hasta;
  return { base, ...depsDePrueba(base, { ahora: AHORA }) };
}

const conCola = (ultimoEntranteAt: string, ...textos: { texto: string; botones?: string[]; tipo?: 'turno' | 'suelto' | 'recordatorio' }[]): EstadoV3 =>
  textos.reduce<EstadoV3>((e, t) => encolar(e, { tipo: t.tipo ?? 'turno', texto: t.texto, ...(t.botones ? { botones: t.botones } : {}) }), { ...estadoInicial(), ultimoEntranteAt });

afterEach(() => { delete process.env.WA_PLANTILLAS_V3_LISTAS; });

describe('drenar la cola de WhatsApp', () => {
  it('dentro de las 24 h: en orden, los botones en el que los tiene; anota en envios', async () => {
    const { deps, base, enviados } = await preparar(conCola(HACE_1H, { texto: 'Gracias, Prueba.\nEntrada' }, { texto: '¿Tuviste hermanos?', botones: ['Sí, tuve', 'No tuve hermanos'] }));
    expect(await drenar(deps, 'n1')).toBe('enviado');
    expect(enviados).toEqual([
      { a: '+5491100000000', tipo: 'texto', texto: 'Gracias, Prueba.\nEntrada' },
      { a: '+5491100000000', tipo: 'botones', texto: '¿Tuviste hermanos?', botones: ['Sí, tuve', 'No tuve hermanos'] },
    ]);
    const fila = await leerFila(base.cliente, 'n1');
    expect(fila?.estado.salientes).toEqual([]);
    expect(fila?.enviando_hasta).toBeNull();
    expect(base.tablas.envios.map((e) => e.tipo)).toEqual(['v3', 'v3']);
  });

  it('un texto de más de 1024 letras sale sin botones', async () => {
    const largo = 'x'.repeat(1100);
    const { deps, enviados } = await preparar(conCola(HACE_1H, { texto: largo, botones: ['Sí, tuve'] }));
    await drenar(deps, 'n1');
    expect(enviados[0]).toMatchObject({ tipo: 'texto', texto: largo });
  });

  it('fuera de las 24 h: una sola plantilla con todo en una línea', async () => {
    const { deps, enviados, base } = await preparar(conCola(HACE_25H, { texto: 'Gracias, Prueba.\nEntrada' }, { texto: '¿Tuviste\nhermanos?', botones: ['Sí, tuve'] }));
    expect(await drenar(deps, 'n1')).toBe('enviado');
    expect(enviados).toEqual([{ a: '+5491100000000', tipo: 'plantilla', plantilla: 'pregunta_diaria_vos', idiomaMeta: 'es', variables: ['Gracias, Prueba. Entrada ¿Tuviste hermanos?'] }]);
    expect((await leerFila(base.cliente, 'n1'))?.estado.salientes).toEqual([]);
  });

  describe('fuera de las 24 h con una pregunta abierta', () => {
    const BOTONES = ['Sí, tuve', 'No tuve hermanos'];
    const conAbierta = (pregunta: string): EstadoV3 => ({
      ...conCola(HACE_25H,
        { texto: 'Gracias, Prueba.\nEntrada' },
        { texto: `${pregunta}\n\nAyuda con los botones`, botones: BOTONES },
        { texto: 'Hola, Prueba. Pasaron unos días…', tipo: 'recordatorio' }),
      esperando: 'CA6',
      preguntaAbierta: { partes: [{ id: 'CA6', texto: pregunta }, { id: 'M31', texto: 'Ayuda con los botones' }], botones: BOTONES },
    });

    it('la plantilla lleva SOLO la pregunta (sin acuse, entrada ni ayuda), en una línea; lo demás del turno se descarta', async () => {
      const { deps, enviados, base } = await preparar(conAbierta('¿Tuviste\nhermanos?'));
      expect(await drenar(deps, 'n1')).toBe('enviado');
      expect(enviados).toEqual([{ a: '+5491100000000', tipo: 'plantilla', plantilla: 'pregunta_diaria_vos', idiomaMeta: 'es', variables: ['¿Tuviste hermanos?'] }]);
      const fila = await leerFila(base.cliente, 'n1');
      expect(fila?.estado.salientes).toEqual([]);
      expect(fila?.estado.abiertaPorPlantilla).toBe(true);
    });

    it('una pregunta larga se corta en el final de una oración, sin pasarse del largo seguro', async () => {
      const oracion = 'Contame cómo era la casa donde creciste, con sus olores y sus ruidos. ';
      const larga = oracion.repeat(20).trim();
      const { deps, enviados } = await preparar(conAbierta(larga));
      await drenar(deps, 'n1');
      const variable = enviados[0].variables![0];
      expect(variable.length).toBeLessThanOrEqual(LARGO_MAXIMO_PLANTILLA);
      expect(variable.endsWith('ruidos.')).toBe(true);
      expect(larga.startsWith(variable)).toBe(true);
    });

    it('sin un punto donde cortar, corta en una palabra', () => {
      const t = paraPlantilla(['palabra '.repeat(200)]);
      expect(t.length).toBeLessThanOrEqual(LARGO_MAXIMO_PLANTILLA);
      expect(t.endsWith('palabra…')).toBe(true);
    });
  });

  it('el M8 del idioma está entre las plantillas que carga Joaquín (es-AR: m8_vos), y no se da por lista sin aprobar', () => {
    expect(PLANTILLAS_V3['es-AR'].recordatorio.nombre).toBe('m8_vos');
    expect(plantillaLista('es-AR', 'recordatorio', {})).toBe(false);
    expect(plantillaLista('es-AR', 'recordatorio', { WA_PLANTILLAS_V3_LISTAS: 'es-AR:recordatorio' })).toBe(true);
  });

  it('fuera de las 24 h y sin la plantilla del idioma: avisa y no manda en otro idioma', async () => {
    const { deps, enviados, avisos, base } = await preparar(conCola(HACE_25H, { texto: 'Com era casa teva?' }), { idioma: 'ca' });
    expect(await drenar(deps, 'n1')).toBe('sin-plantilla');
    expect(enviados).toEqual([]);
    expect(avisos[0].clave).toBe('plantilla-ca-pregunta');
    expect((await leerFila(base.cliente, 'n1'))?.estado.salientes).toHaveLength(1);
  });

  it('con la plantilla catalana aprobada, sale en catalán', async () => {
    process.env.WA_PLANTILLAS_V3_LISTAS = 'ca:pregunta';
    const { deps, enviados } = await preparar(conCola(HACE_25H, { texto: 'Com era casa teva?' }), { idioma: 'ca' });
    await drenar(deps, 'n1');
    expect(enviados[0]).toMatchObject({ tipo: 'plantilla', plantilla: 'pregunta_diaria_ca', idiomaMeta: 'ca' });
  });

  it('M8 solo, fuera de las 24 h: la plantilla con el texto de M8 del idioma, si está aprobada', async () => {
    const m8 = conCola(HACE_25H, { texto: 'Hola, Prueba. Pasaron unos días…', tipo: 'recordatorio' });
    const sinAprobar = await preparar(m8);
    expect(await drenar(sinAprobar.deps, 'n1')).toBe('sin-plantilla');
    expect(sinAprobar.avisos[0].clave).toBe('plantilla-es-AR-recordatorio');
    process.env.WA_PLANTILLAS_V3_LISTAS = 'es-AR:recordatorio';
    const aprobada = await preparar(m8);
    await drenar(aprobada.deps, 'n1');
    expect(aprobada.enviados[0]).toMatchObject({ tipo: 'plantilla', plantilla: 'm8_vos', idiomaMeta: 'es', variables: ['Prueba'] });
  });

  it('un envío que falla queda en la cola; a los 3 seguidos, aviso a los socios (una vez)', async () => {
    const { deps, base, avisos, fallar, enviados } = await preparar(conCola(HACE_1H, { texto: 'Hola' }));
    fallar(4);
    for (let i = 0; i < 4; i++) expect(await drenar(deps, 'n1')).toBe('fallo');
    expect(avisos.filter((a) => a.clave === 'envios-n1')).toHaveLength(1);
    expect((await leerFila(base.cliente, 'n1'))?.estado).toMatchObject({ fallosEnvio: 4, avisoFallos: true });
    expect(await drenar(deps, 'n1')).toBe('enviado');
    expect(enviados).toHaveLength(1);
    expect((await leerFila(base.cliente, 'n1'))?.estado).toMatchObject({ fallosEnvio: 0, avisoFallos: false, salientes: [] });
  });

  it('con la toma de otro proceso no manda nada', async () => {
    const { deps, enviados } = await preparar(conCola(HACE_1H, { texto: 'Hola' }), { enviando_hasta: new Date(AHORA.getTime() + 60_000).toISOString() });
    expect(await drenar(deps, 'n1')).toBe('ocupado');
    expect(enviados).toEqual([]);
  });

  it('no sigue mandando pasada la mitad de la toma: lo que queda sale en el tick siguiente', async () => {
    const { deps, base, enviados, pasar } = await preparar(conCola(HACE_1H, { texto: 'uno' }, { texto: 'dos' }));
    const texto = deps.wa.texto;
    deps.wa.texto = async (a, t) => { pasar(TOMA_MS / 2); return texto(a, t); };
    expect(await drenar(deps, 'n1')).toBe('enviado');
    expect(enviados.map((e) => e.texto)).toEqual(['uno']);
    const fila = await leerFila(base.cliente, 'n1');
    expect(fila?.estado.salientes.map((s) => s.texto)).toEqual(['dos']);
    expect(fila?.enviando_hasta).toBeNull();
  });

  it('terminada pero con la cola sin vaciar: todavía no se completa', async () => {
    const { deps, base } = await preparar({ ...conCola(HACE_25H, { texto: 'FIN' }), terminada: true }, { idioma: 'ca' });
    expect(await drenar(deps, 'n1')).toBe('sin-plantilla');
    expect(base.tablas.narradores[0].estado).toBe('activo');
  });

  it('terminada y con la cola vacía: el narrador queda completado', async () => {
    const { deps, base } = await preparar({ ...conCola(HACE_1H, { texto: 'FIN' }), terminada: true });
    await drenar(deps, 'n1');
    expect(base.tablas.narradores[0].estado).toBe('completado');
  });

  it('la línea de la plantilla no tiene saltos ni espacios de más', () => {
    expect(enLineaParaPlantilla(['a\n\nb', '  c   d '])).toBe('a b c d');
  });

  it('es-AR:pregunta está siempre; lo demás, solo si se aprobó', () => {
    expect(plantillaLista('es-AR', 'pregunta', {})).toBe(true);
    expect(plantillaLista('es-AR', 'recordatorio', {})).toBe(false);
    expect(plantillaLista('es-ES', 'pregunta', { WA_PLANTILLAS_V3_LISTAS: 'ca:pregunta, es-ES:pregunta' })).toBe(true);
  });
});
