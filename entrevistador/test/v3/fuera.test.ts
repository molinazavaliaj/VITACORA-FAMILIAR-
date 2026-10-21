import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({ avisarSocios: vi.fn(async (..._a: unknown[]) => true) }));
vi.mock('../../src/v3/avisos.js', () => ({ avisarSocios: mocks.avisarSocios }));
import { crearBaseFalsa } from './base-falsa.js';
import { depsDePrueba } from './deps-prueba.js';
import { crearFila } from '../../src/v3/estado.js';
import { cazarEnSegundoPlano } from '../../src/v3/cazador.js';
import { leerSacadas, respuestasSinSacadas, sinLoSacado, sinRepreguntasSacadas, type Sacadas } from '../../src/v3/fuera.js';
import { avanzar } from '../../src/v3/turno.js';
import { estadoInicial, type EstadoV3 } from '../../src/v3/tipos.js';
import type { ClienteModelo } from '../../src/v3/nucleo/entrevista/cazador.js';

// «Que esto no vaya al libro» por respuesta, desde el panel (respuestas_fuera, Naza 21/10): el cazador no
// ve lo sacado y una repregunta en cola sobre eso no sale.

const padre = 'Soy el marido, ella está en la cocina. Nos conocimos en un baile en Tandil.';
const madre = 'Nos conocimos en el club cuando yo tenía diecisiete años y mi mamá cosía para afuera.';

const filasRespuestas = () => [
  { id: 'r-padre', narrador_id: 'n1', clave_v3: 'OR1', transcripcion: padre, texto_directo: null, recibido_at: '2026-10-21T13:00:00Z' },
  { id: 'r-madre', narrador_id: 'n1', clave_v3: 'OR1', transcripcion: madre, texto_directo: null, recibido_at: '2026-10-21T13:05:00Z' },
  { id: 'r-cierre', narrador_id: 'n1', clave_v3: 'CI1', transcripcion: null, texto_directo: '⟦botón:No, está todo⟧', recibido_at: '2026-10-21T13:06:00Z' },
];

const sacadas: Sacadas = new Map([['OR1', [{ texto: padre, fuera: true }, { texto: madre, fuera: false }]]]);

beforeEach(() => {
  mocks.avisarSocios.mockClear();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('leerSacadas', () => {
  it('trae las filas de cada clave con alguna sacada, en orden', async () => {
    const base = crearBaseFalsa({ respuestas: filasRespuestas(), respuestas_fuera: [{ respuesta_id: 'r-padre', narrador_id: 'n1' }] });
    const s = await leerSacadas(base.cliente, 'n1');
    expect([...s.keys()]).toEqual(['OR1']);
    expect(s.get('OR1')).toEqual([{ texto: padre, fuera: true }, { texto: madre, fuera: false }]);
  });

  it('sin la tabla, o sin nada sacado, ninguna', async () => {
    const base = crearBaseFalsa({ respuestas: filasRespuestas() });
    expect((await leerSacadas(base.cliente, 'n1')).size).toBe(0);
    base.ausentes.add('respuestas_fuera');
    expect((await leerSacadas(base.cliente, 'n1')).size).toBe(0);
  });
});

describe('las reglas', () => {
  it('sinLoSacado deja lo de la madre', () => {
    expect(sinLoSacado(`${padre} ${madre}`, sacadas.get('OR1')!)).toBe(madre);
  });

  it('un «Sí» corto no se come el «así» de otra respuesta', () => {
    const filas = [{ texto: 'Mi casa era así.', fuera: false }, { texto: 'Sí', fuera: true }];
    expect(sinLoSacado('Mi casa era así. Sí', filas)).toBe('Mi casa era así.');
    expect(sinLoSacado('⟦botón:Sí⟧ Mi casa era así. Sí', filas)).toBe('⟦botón:Sí⟧ Mi casa era así.');
    expect(sinLoSacado('Sí, así. Sí', [{ texto: 'Sí, así.', fuera: false }, { texto: 'Sí', fuera: true }])).toBe('Sí, así.');
  });
  it('respuestasSinSacadas saca la fila y deja las otras claves', () => {
    expect(respuestasSinSacadas([['OR1', `${padre} ${madre}`], ['OR2', 'Otra.']], sacadas)).toEqual([['OR1', madre], ['OR2', 'Otra.']]);
  });

  const rp = (cita: string, clave = 'RP~OR1') => ({ clave, origen: 'OR1', bloque: 1, cita, pregunta: '¿Y cómo fue?', tema: 't' });
  const conCola = (cola: ReturnType<typeof rp>[]): EstadoV3 => ({ ...estadoInicial(), respuestas: [['OR1', `${padre} ${madre}`]], repreguntas: cola });

  it('una repregunta sobre lo sacado se cae; una sobre lo que queda, no', () => {
    const e = sinRepreguntasSacadas(conCola([rp('un baile en Tandil'), rp('mi mamá cosía', 'RP~OR1b')]), sacadas);
    expect(e.repreguntas?.map((x) => x.cita)).toEqual(['mi mamá cosía']);
  });

  it('ante la duda (la cita no está en ninguna que quede), se cae', () => {
    expect(sinRepreguntasSacadas(conCola([rp('algo que no está')]), sacadas).repreguntas).toEqual([]);
  });

  it('una repregunta de otra pregunta no se toca', () => {
    const e = conCola([{ ...rp('un baile en Tandil'), origen: 'OR2', clave: 'RP~OR2' }]);
    expect(sinRepreguntasSacadas(e, sacadas).repreguntas).toHaveLength(1);
  });

  it('la que ya salió y está esperando respuesta, queda', () => {
    const e = { ...conCola([rp('un baile en Tandil')]), esperando: 'RP~OR1' };
    expect(sinRepreguntasSacadas(e, sacadas).repreguntas).toHaveLength(1);
  });

  it('avanzar no manda la repregunta sobre lo sacado', () => {
    const e = conCola([rp('un baile en Tandil')]);
    expect(avanzar(e, { nombre: 'Prueba', genero: 'mujer' }, sacadas).estado.repreguntas).toEqual([]);
    expect(avanzar(e, { nombre: 'Prueba', genero: 'mujer' }).estado.repreguntas).toHaveLength(1);
  });
});

describe('el cazador', () => {
  const clienteQueContesta = (): ClienteModelo => ({
    messages: { create: vi.fn(async () => ({ content: [{ type: 'text', text: '{"elegidas": [], "escenas_contadas": []}' }], usage: { input_tokens: 1000, output_tokens: 200 } })) },
  });

  async function preparar(fuera: { respuesta_id: string; narrador_id: string }[]) {
    const base = crearBaseFalsa({ respuestas: filasRespuestas(), respuestas_fuera: fuera });
    const estado: EstadoV3 = { ...estadoInicial(), respuestas: [['OR1', `${padre} ${madre}`], ['CI1', '⟦botón:No, está todo⟧']] };
    await crearFila(base.cliente, {
      narrador_id: 'n1', idioma: 'es-AR', ficha: { nombre: 'Prueba', genero: 'mujer' }, estado,
      ultimo_audio_at: null, tanda_dia: null, tanda_cuenta: 0, migrada_de: null,
    });
    const cliente = clienteQueContesta();
    return { cliente, ...depsDePrueba(base, { cazador: cliente }) };
  }

  it('no ve lo que la familia sacó, sí lo que queda de esa pregunta', async () => {
    const { deps, cliente } = await preparar([{ respuesta_id: 'r-padre', narrador_id: 'n1' }]);
    await cazarEnSegundoPlano(deps, 'n1', 1);
    const pedido = JSON.stringify((cliente.messages.create as any).mock.calls[0][0]);
    expect(pedido).not.toContain('un baile en Tandil');
    expect(pedido).toContain('mi mamá cosía');
  });

  it('sin nada sacado, ve todo (control del test de arriba)', async () => {
    const { deps, cliente } = await preparar([]);
    await cazarEnSegundoPlano(deps, 'n1', 1);
    expect(JSON.stringify((cliente.messages.create as any).mock.calls[0][0])).toContain('un baile en Tandil');
  });
});
