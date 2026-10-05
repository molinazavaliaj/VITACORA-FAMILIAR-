// Simulación de Kids V2: 240 chicos inventados (semillas 1 a 240) de punta a
// punta con el motor de verdad, contra los controles de controles.ts. La
// corrida grande (800) la hace scripts/kids-v2-simular.ts.
import { describe, it, expect } from 'vitest';
import { TIPOS_DE_CONDUCTA } from '../src/kids-v2/conductas.js';
import { CONTROLES, revisar } from '../src/kids-v2/controles.js';
import { correrMuchos, correrUno } from '../src/kids-v2/simulacion.js';
import { FICHA } from './kids-v2-ayuda.js';
import type { Corrida } from '../src/kids-v2/corrida.js';
import { aInstante, aLocal, sumarDias } from '../src/kids-v2/horas.js';
import { corridaDeLaLectura, FICHA_LECTURA } from '../src/kids-v2/lectura.js';

const CORRIDAS = correrMuchos(240);
const ids = (c: (typeof CORRIDAS)[number]) => c.corrida.lineas.flatMap((l) => (l.de === 'bot' ? [l.mensaje.id] : l.de === 'marca' ? [`marca:${l.motivo}`] : []));

describe('kids v2: simulación de 240 chicos', () => {
  it('se repite: la misma semilla da el mismo chico, mensaje por mensaje', () => {
    expect(ids(correrUno(17))).toEqual(ids(correrUno(17)));
  });

  it('cubre lo pedido: las 8 conductas, los dos canales, todos los temas sacados, preguntas del padre, algo preocupante, silencios', () => {
    expect(new Set(CORRIDAS.map((c) => c.conducta))).toEqual(new Set(TIPOS_DE_CONDUCTA));
    expect(new Set(CORRIDAS.map((c) => c.ficha.canal))).toEqual(new Set(['A', 'B']));
    expect(CORRIDAS.some((c) => c.ficha.temasSacados.length === 6)).toBe(true);
    expect(CORRIDAS.some((c) => c.ficha.preguntasPadre.length === 3)).toBe(true);
    const todos = CORRIDAS.flatMap(ids);
    for (const id of ['marca:cerro-sin-respuesta', 'PADRE-1', 'marca:preocupante', 'marca:silencio-8-dias', 'RECORD-A-4', 'RECORD-B', 'PREG-NUEVA-CHICO', 'PREG-NUEVA-PADRE', 'K12-R2-2', 'B-FOTO-PLATA', 'B-TRANQUILA', 'EXTRAS-OTRA', 'FINAL-CHICO-PL', 'marca:escribio-despues-del-final']) {
      expect(todos, id).toContain(id);
    }
    // El final por plantilla propia (cambio B) y una foto vencida que vuelve al final (cambio A).
    expect(CORRIDAS.some((c) => c.corrida.lineas.some((l) => l.de === 'bot' && /^kids_final/.test(l.mensaje.plantilla?.nombre ?? '')))).toBe(true);
    expect(CORRIDAS.some((c) => c.corrida.lineas.some((l, i, ls) => l.de === 'bot' && /^K\d+-FOTO$/.test(l.mensaje.id) && ls.slice(0, i).some((x) => x.de === 'bot' && x.mensaje.id === 'EXTRAS-OFERTA')))).toBe(true);
    // Botones tocados en el día sobrio (después de algo preocupante, antes de la hora del día siguiente).
    const tocoSobrio = CORRIDAS.some((c) => {
      const ls = c.corrida.lineas;
      const i = ls.findIndex((l) => l.de === 'marca' && l.motivo === 'preocupante');
      if (i < 0) return false;
      const hasta = aInstante(sumarDias(aLocal(ls[i].en, c.ficha.zona).fecha, 1), c.ficha.hora, c.ficha.zona);
      return ls.slice(i).some((l) => l.de === 'chico' && l.evento.tipo === 'boton' && l.en < hasta);
    });
    expect(tocoSobrio).toBe(true);
  });

  for (const [control, nombre] of Object.entries(CONTROLES)) {
    it(nombre, () => {
      const malas = CORRIDAS.flatMap((c) => c.violaciones.filter((v) => v.control === control).map((v) => `semilla ${c.semilla} (${c.conducta}): ${v.detalle}`));
      expect(malas).toEqual([]);
    });
  }

  it('la lectura corrida no rompe ningún control', () => {
    expect(revisar(FICHA_LECTURA, corridaDeLaLectura(), { sigueContestando: true })).toEqual([]);
  });

  it('los controles detectan lo que tienen que detectar (un mensaje de noche, un acuse "para el libro" en la cápsula)', () => {
    const base = correrUno(3);
    const lineas = base.corrida.lineas;
    const i = lineas.findIndex((l) => l.de === 'bot' && l.mensaje.id === 'K42');
    const trucha: Corrida = {
      ...base.corrida,
      lineas: [
        ...lineas.slice(0, i + 1),
        { en: aInstante('2026-12-01', '23:30', base.ficha.zona), de: 'bot', mensaje: { a: 'chico', id: 'ACUSE-3', texto: 'Eso va al libro, con tus palabras.', botones: [], plantilla: null } },
        ...lineas.slice(i + 1),
      ],
    };
    const v = revisar(base.ficha, trucha, { sigueContestando: true }).map((x) => x.control);
    expect(v).toContain('noche');
    expect(v).toContain('capsula');
    expect(revisar(FICHA, { lineas: [], estado: { ...base.corrida.estado, fase: { tipo: 'seguir' } }, pasos: 0 }, { sigueContestando: true }).map((x) => x.control)).toContain('traba');
  });

  it('los controles nuevos detectan: una foto vencida que no vuelve al final (cambio A) y dos plantillas seguidas sin respuesta', () => {
    // Una corrida donde una foto vencida volvió al final y después salió una extra del banco.
    const vuelve = (r: (typeof CORRIDAS)[number]) => {
      const ls = r.corrida.lineas;
      const oferta = ls.findIndex((l) => l.de === 'bot' && l.mensaje.id === 'EXTRAS-OFERTA');
      const i = ls.findIndex((l, k) => k > oferta && l.de === 'bot' && /^K\d+-FOTO$/.test(l.mensaje.id));
      const x = ls.findIndex((l, k) => k > i && l.de === 'bot' && /^X\d-\d+$/.test(l.mensaje.id));
      return oferta >= 0 && i > oferta && x > i ? i : -1;
    };
    const r = CORRIDAS.find((c) => c.violaciones.length === 0 && vuelve(c) >= 0);
    if (!r) throw new Error('ninguna corrida con una foto vencida que vuelve antes de una extra del banco');
    const i = vuelve(r);
    const sinVolver: Corrida = { ...r.corrida, lineas: r.corrida.lineas.filter((_, k) => k !== i) };
    expect(revisar(r.ficha, sinVolver, { sigueContestando: true }).map((x) => x.control)).toContain('fotoPegada');

    // Una foto que nunca salió ni quedó guardada como vencida se perdió, aunque el libro haya cerrado (solo o por el chico).
    const cerrada = CORRIDAS.find((c) => c.violaciones.length === 0 && c.corrida.lineas.some((l) => (l.de === 'chico' && l.evento.tipo === 'boton' && l.evento.boton === 'No, ya está') || (l.de === 'bot' && l.mensaje.plantilla?.nombre.startsWith('kids_final'))) && c.corrida.lineas.some((l) => l.de === 'bot' && l.mensaje.id === 'K1-FOTO'));
    if (!cerrada) throw new Error('ninguna corrida cerrada con K1-FOTO');
    const sinFoto: Corrida = { ...cerrada.corrida, lineas: cerrada.corrida.lineas.filter((l) => !(l.de === 'bot' && l.mensaje.id === 'K1-FOTO')) };
    expect(revisar(cerrada.ficha, sinFoto, { sigueContestando: true }).map((x) => x.detalle)).toContain('la foto de K1 (K1-FOTO) nunca salió y no volvió al final');

    const base = correrUno(3);
    const j = base.corrida.lineas.findIndex((l) => l.de === 'bot' && /^PREG-NUEVA-/.test(l.mensaje.id));
    expect(j).toBeGreaterThan(0);
    const doble: Corrida = { ...base.corrida, lineas: [...base.corrida.lineas.slice(0, j + 1), base.corrida.lineas[j], ...base.corrida.lineas.slice(j + 1)] };
    expect(revisar(base.ficha, doble, { sigueContestando: true }).map((x) => x.control)).toContain('plantillas');
  });
});
