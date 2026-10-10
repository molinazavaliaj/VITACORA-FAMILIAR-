import { describe, it, expect } from 'vitest';
import { crearBaseFalsa } from './base-falsa.js';
import { depsDePrueba } from './deps-prueba.js';
import { charlaMd, respuestaSimulada, simularEntrevista } from '../../scripts/v3-simular.js';
import { BANCO, mensajePorId, MENSAJES, preguntaPorId } from '../../src/v3/nucleo/entrevista/banco.js';
import { procesarEntranteV3 } from '../../src/v3/entrante.js';
import { arrancarV3 } from '../../src/v3/pasar.js';
import { trabajarNarrador } from '../../src/v3/reloj.js';
import { MARCA_FOTO } from '../../src/v3/tipos.js';
import { leerFila } from '../../src/v3/estado.js';
import type { NarradorV3 } from '../../src/v3/tipos.js';

const narrador = (idioma: string): NarradorV3 => ({
  id: `sim-${idioma}`, familia_id: 'f-sim', como_le_dicen: 'Prueba V3', telefono_whatsapp: `+000${idioma.length}`, hora_preferida: '22:00:00',
  zona_horaria: 'America/Argentina/Buenos_Aires', contexto: { ritmo: 'seguido', genero: 'varon', ...(idioma === 'es-AR' ? {} : { idioma }) },
  estado: 'acepto', dia_actual: 0, ultima_respuesta_at: null,
});

describe('la simulación de punta a punta (base y WhatsApp falsos)', () => {
  it.each(['es-AR', 'es-ES', 'ca'] as const)('una entrevista entera en %s termina y deja al narrador completado', async (idioma) => {
    const n = narrador(idioma);
    const base = crearBaseFalsa({ familias: [{ id: 'f-sim', nombre: 'Prueba' }], narradores: [{ ...n }] });
    const p = depsDePrueba(base);
    const r = await simularEntrevista(p.deps, n, { idioma, pasar: p.pasar, maxPasos: 600 });
    expect(r).toMatchObject({ idioma, terminada: true, completado: true });
    expect(r.audios).toBeGreaterThan(50);
    expect(p.enviados.length).toBeGreaterThan(50);
    expect(p.enviados.every((e) => e.tipo !== 'plantilla')).toBe(true); // contesta siempre dentro de las 24 h
    expect(p.avisos).toEqual([]);
    const fila = await leerFila(base.cliente, n.id);
    expect(fila?.estado.salientes).toEqual([]);
    expect(charlaMd(fila!)).toContain('**Narrador**');
    expect(base.tablas.respuestas.every((x) => x.clave_v3 !== null)).toBe(true);
  });

  it('en es-AR toca botones de verdad (la vida inventada tiene botones)', async () => {
    const n = narrador('es-AR');
    const base = crearBaseFalsa({ familias: [{ id: 'f-sim', nombre: 'Prueba' }], narradores: [{ ...n }] });
    const p = depsDePrueba(base);
    const r = await simularEntrevista(p.deps, n, { idioma: 'es-AR', pasar: p.pasar });
    expect(r.botones).toBeGreaterThan(0);
    expect(p.enviados.some((e) => e.tipo === 'botones')).toBe(true);
  });

  it.each(['es-AR', 'es-ES', 'ca'] as const)('en %s ningún mensaje sale vacío ni con marcas {{ sin reemplazar', async (idioma) => {
    const n = narrador(idioma);
    const base = crearBaseFalsa({ familias: [{ id: 'f-sim', nombre: 'Prueba' }], narradores: [{ ...n }] });
    const p = depsDePrueba(base);
    await simularEntrevista(p.deps, n, { idioma, pasar: p.pasar });
    for (const e of p.enviados) {
      expect((e.texto ?? '').trim()).not.toBe('');
      expect(e.texto).not.toContain('{{');
    }
  });

  /** El tramo más largo del texto sin marcas ({{…}} y «…»): sirve para buscarlo tal cual en lo que salió. */
  const fragmento = (t: string) => t.split(/\{\{[^}]*\}\}|«[^»]*»/).map((x) => x.trim()).sort((x, y) => y.length - x.length)[0] ?? '';
  const textosDelBanco = (idioma: 'es-AR' | 'es-ES' | 'ca') => [...MENSAJES.map((m) => mensajePorId(m.id, idioma)?.texto ?? ''), ...BANCO.map((q) => preguntaPorId(q.id, idioma)?.texto ?? '')];

  it.each(['ca', 'es-ES'] as const)('en %s no se filtra el castellano rioplatense y sí sale el texto propio', async (idioma) => {
    const n = narrador(idioma);
    const base = crearBaseFalsa({ familias: [{ id: 'f-sim', nombre: 'Prueba' }], narradores: [{ ...n }] });
    const p = depsDePrueba(base);
    await simularEntrevista(p.deps, n, { idioma, pasar: p.pasar });
    const salido = p.enviados.map((e) => e.texto ?? '').join(' | ');
    const propios = textosDelBanco(idioma).map(fragmento).filter((f) => f.length >= 25);
    const ajenos = textosDelBanco('es-AR').map(fragmento).filter((f) => f.length >= 25 && !propios.some((q) => q.includes(f) || f.includes(q)));
    expect(ajenos.length).toBeGreaterThan(20);
    expect(propios.filter((f) => salido.includes(f)).length).toBeGreaterThan(20);
    for (const f of ajenos) expect(salido, `se coló el texto es-AR: ${f}`).not.toContain(f);
  });

  it('M22 sale una sola vez aunque conteste varias veces por escrito', async () => {
    const n = narrador('es-AR');
    const base = crearBaseFalsa({ familias: [{ id: 'f-sim', nombre: 'Prueba' }], narradores: [{ ...n }] });
    const p = depsDePrueba(base);
    await arrancarV3(p.deps, n, 'es-AR', { nombre: 'Prueba V3', genero: 'varon' }, { ventanaAbierta: true });
    for (let i = 1; i <= 3; i++) {
      const activo = base.tablas.narradores[0] as unknown as NarradorV3;
      await procesarEntranteV3(p.deps, activo, { telefono: n.telefono_whatsapp, tipo: 'texto', texto: `Te cuento por escrito ${i}`, waMessageId: `w-${i}` });
      p.pasar(4 * 60_000);
      const fila = (await leerFila(base.cliente, n.id))!;
      await trabajarNarrador(p.deps, fila, activo);
    }
    const m22 = mensajePorId('M22', 'es-AR')!.texto;
    expect(p.enviados.filter((e) => (e.texto ?? '').includes(m22)).length).toBe(1);
  });

  // Naza 10/10: si contesta, le llega la siguiente siempre. El ritmo no corta a quien está contestando.
  it('con ritmo diario, si contesta todo, le siguen llegando preguntas (más de 4 en un día) y termina', async () => {
    const n: NarradorV3 = { ...narrador('es-AR'), id: 'sim-diario', contexto: { ritmo: 'diario', genero: 'varon' } };
    const base = crearBaseFalsa({ familias: [{ id: 'f-sim', nombre: 'Prueba' }], narradores: [{ ...n }] });
    const p = depsDePrueba(base);
    let maximo = 0;
    const fragmentosDePreguntas = BANCO.filter((q) => q.clase !== 'aviso' && q.clase !== 'final').map((q) => fragmento(preguntaPorId(q.id, 'es-AR')?.texto ?? '')).filter((x) => x.length >= 20);
    const dia = () => new Intl.DateTimeFormat('en-CA', { timeZone: n.zona_horaria }).format(p.deps.ahora());
    const porDia = new Map<string, number>();
    let vistos = 0;
    const contar = () => {
      for (; vistos < p.enviados.length; vistos++) {
        const e = p.enviados[vistos];
        const cuantas = fragmentosDePreguntas.filter((fr) => (e.texto ?? '').includes(fr)).length;
        if (cuantas > 0) porDia.set(dia(), (porDia.get(dia()) ?? 0) + cuantas);
      }
    };
    const pasar = (ms: number) => {
      contar();
      p.pasar(ms * 90); // 6 h por paso: pasan los días
      const fila = base.tablas.entrevistas_v3?.[0];
      if (fila) maximo = Math.max(maximo, Number(fila.tanda_cuenta));
    };
    const r = await simularEntrevista(p.deps, n, { idioma: 'es-AR', pasar, maxPasos: 3000 });
    contar();
    expect(r).toMatchObject({ terminada: true, completado: true });
    expect(Math.max(...porDia.values())).toBeGreaterThan(4);
    expect(maximo).toBeGreaterThan(4);
  });

  it('llega a FO1 y recibe una foto; los botones Sí (con M30 y después audio), No y Paso se tocan y hacen su efecto', async () => {
    const n = narrador('es-AR');
    const base = crearBaseFalsa({ familias: [{ id: 'f-sim', nombre: 'Prueba' }], narradores: [{ ...n }] });
    const p = depsDePrueba(base);
    const r = await simularEntrevista(p.deps, n, { idioma: 'es-AR', pasar: p.pasar, foto: true, forzar: true });
    expect(r).toMatchObject({ terminada: true, completado: true, fotos: 1 });
    expect(base.tablas.fotos).toHaveLength(1);
    expect(base.tablas.respuestas.some((x) => x.clave_v3 === 'FO1' && x.texto_directo === MARCA_FOTO)).toBe(true);
    expect(r.si).toBeGreaterThan(0);
    expect(r.no).toBeGreaterThan(0);
    expect(r.paso).toBeGreaterThan(0);
    // "Sí" pide el relato: lo que sigue en la charla es M30, salió por WhatsApp y después llegó el audio de esa misma pregunta.
    const charla = (await leerFila(base.cliente, n.id))!.estado.charla;
    const toquesSi = charla.flatMap((g, i) => (g.de === 'persona' && g.boton && /^Sí/.test(g.boton) ? [i] : []));
    expect(toquesSi.length).toBe(r.si);
    const conM30 = toquesSi.filter((i) => { const g = charla[i + 1]; return g.de === 'bio' && g.partes[0].id === 'M30'; });
    expect(conM30.length).toBeGreaterThan(0); // los "Sí" que no piden relato (p. ej. el de AMH) cierran sin M30
    for (const i of conM30) {
      const m30 = charla[i + 1];
      expect(p.enviados.some((e) => e.texto === (m30 as { partes: { texto: string }[] }).partes[0].texto)).toBe(true);
      const siguiente = charla.slice(i + 2).find((g) => g.de === 'persona');
      expect(siguiente && siguiente.de === 'persona' && siguiente.pregunta).toBe((charla[i] as { pregunta: string }).pregunta);
      expect(siguiente && 'boton' in siguiente && siguiente.boton).toBeFalsy();
    }
    // "Paso" y "No" cerraron la pregunta con la marca del botón y la entrevista siguió.
    const marcas = base.tablas.respuestas.map((x) => String(x.texto_directo ?? ''));
    expect(marcas.some((m) => m === '⟦botón:Prefiero no contarla⟧' || /^⟦botón:Prefiero/.test(m))).toBe(true);
    expect(marcas.some((m) => /^⟦botón:No/.test(m))).toBe(true);
    const conBoton = base.tablas.respuestas.filter((x) => String(x.texto_directo ?? '').startsWith('⟦'));
    expect(conBoton.length).toBeGreaterThan(0);
    const clavesSi = new Set(conBoton.filter((x) => /^⟦botón:Sí/.test(String(x.texto_directo))).map((x) => x.clave_v3));
    expect(clavesSi.size).toBeGreaterThan(0);
  });

  it('respuestaSimulada: FO1 se contesta con el botón de "no tengo foto"; después de "Sí", audio', () => {
    expect(respuestaSimulada('FO1', 'ca', false)).toEqual({ boton: 'No tinc cap foto' });
    expect(respuestaSimulada('CA6', 'es-AR', true)).toHaveProperty('audio');
  });
});
