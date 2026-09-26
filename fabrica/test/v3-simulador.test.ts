import { describe, it, expect } from 'vitest';
import {
  crearAzar, largoRespuesta, respuestasSinteticas, simular, fichaAlAzar, FICHAS_E2, estadisticas, MEDIANA_PALABRAS, MEDIANA_PARCO,
} from '../src/v3/simulador.js';
import { preguntasPara } from '../src/v3/seleccion.js';
import type { Indice, RespuestaV3 } from '../src/v3/indice.js';

const ANIO = 2026;

function cuantil(valores: number[], q: number): number {
  const s = [...valores].sort((a, b) => a - b);
  return s[Math.floor(q * (s.length - 1))];
}

function invariantes(resp: RespuestaV3[], indice: Indice) {
  for (const c of indice.capitulos) expect(`${c.titulo} ${c.parte?.nombre ?? ''}`).not.toMatch(/\d{2,4}/);
  for (const x of resp) {
    const veces = indice.capitulos.filter((c) => c.respuestaIds.includes(x.id)).length + (indice.cierre.includes(x.id) ? 1 : 0);
    expect(veces, x.id).toBe(x.paso ? 0 : 1);
  }
  // Ninguno bajo el mínimo salvo Hoy y De dónde vengo; el ancla (2) solo si
  // ya se tragó todas las etapas y quedó avisado (libro Breve de un parco).
  const anclaCorta = indice.avisos.some((a) => /no hay etapa siguiente/.test(a));
  for (const c of indice.capitulos) {
    if (c.madres.length === 1 && [1, 10].includes(c.madre)) continue;
    if (c.madre === 2 && anclaCorta) continue;
    expect(c.palabrasHabladas, c.titulo).toBeGreaterThanOrEqual(1500);
  }
}

describe('azar con semilla', () => {
  it('misma semilla, misma secuencia', () => {
    const a = crearAzar(42);
    const b = crearAzar(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(crearAzar(1)()).not.toBe(crearAzar(2)());
  });
});

describe('largo de las respuestas (distribución de E1)', () => {
  it('perfil normal: mediana ~127, p25 ~88, p75 ~185', () => {
    const azar = crearAzar(7);
    const v = Array.from({ length: 20000 }, () => largoRespuesta(azar, 'normal'));
    expect(MEDIANA_PALABRAS).toBe(127);
    expect(Math.abs(cuantil(v, 0.5) - 127)).toBeLessThan(6);
    expect(Math.abs(cuantil(v, 0.25) - 88)).toBeLessThan(6);
    expect(Math.abs(cuantil(v, 0.75) - 185)).toBeLessThan(10);
  });
  it('perfil parco: mediana ~75', () => {
    const azar = crearAzar(7);
    const v = Array.from({ length: 20000 }, () => largoRespuesta(azar, 'parco'));
    expect(MEDIANA_PARCO).toBe(75);
    expect(Math.abs(cuantil(v, 0.5) - 75)).toBeLessThan(5);
  });
});

describe('respuestas sintéticas', () => {
  const viuda = FICHAS_E2.find((f) => f.clave === 'viuda')!.ficha;

  it('una respuesta por pregunta enviada, con su sujeto, ~15 % paso', () => {
    const preguntas = preguntasPara(viuda, 'C', { anioActual: ANIO });
    const resp = respuestasSinteticas(viuda, 'C', { semilla: 3, anioActual: ANIO });
    expect(resp).toHaveLength(preguntas.length);
    expect(new Set(resp.map((r) => r.id)).size).toBe(resp.length);
    expect(resp.filter((r) => r.preguntaId === 'HI2').map((r) => r.sujeto)).toEqual(['hijo:1', 'hijo:2', 'hijo:3']);
    const muchas = FICHAS_E2.flatMap((f) => respuestasSinteticas(f.ficha, 'C', { semilla: 9, anioActual: ANIO }));
    const pasos = muchas.filter((r) => r.paso).length / muchas.length;
    expect(pasos).toBeGreaterThan(0.11);
    expect(pasos).toBeLessThan(0.19);
  });

  it('algunas flotantes traen una expresión de edad', () => {
    const resp = respuestasSinteticas(viuda, 'C', { semilla: 5, anioActual: ANIO }).filter((r) => r.bloque === 12 || r.bloque === 13);
    expect(resp.some((r) => /tenía \d+|de chica|de soltera|en el secundario|de adolescente/.test(r.texto))).toBe(true);
  });

  it('determinista: misma semilla, mismo índice', () => {
    const a = simular(viuda, 'E', { semilla: 11, anioActual: ANIO });
    const b = simular(viuda, 'E', { semilla: 11, anioActual: ANIO });
    expect(a.indice).toEqual(b.indice);
  });
});

describe('simulación: invariantes del índice', () => {
  it('las seis fichas de E2 en los tres tamaños, perfil normal y parco', () => {
    expect(FICHAS_E2).toHaveLength(6);
    for (const { ficha } of FICHAS_E2) {
      for (const tamanio of ['B', 'E', 'C'] as const) {
        for (const perfil of ['normal', 'parco'] as const) {
          const s = simular(ficha, tamanio, { semilla: 1, perfil, anioActual: ANIO });
          invariantes(s.respuestas, s.indice);
        }
      }
    }
  });

  it('60 fichas al azar', () => {
    const azar = crearAzar(2026);
    for (let i = 0; i < 60; i++) {
      const ficha = fichaAlAzar(azar, ANIO);
      const tamanio = (['B', 'E', 'C'] as const)[i % 3];
      const s = simular(ficha, tamanio, { semilla: i, anioActual: ANIO });
      invariantes(s.respuestas, s.indice);
    }
  });

  it('estadísticas: promedio de capítulos, % fusionados, % partidos, libros con menos de 4', () => {
    const azar = crearAzar(1);
    const sims = Array.from({ length: 20 }, (_x, i) => simular(fichaAlAzar(azar, ANIO), 'E', { semilla: i, anioActual: ANIO }));
    const e = estadisticas(sims.map((s) => s.indice));
    expect(e.libros).toBe(20);
    expect(e.capitulosPromedio).toBeGreaterThan(3);
    expect(e.pctFusionados).toBeGreaterThanOrEqual(0);
    expect(e.pctPartidos).toBeGreaterThanOrEqual(0);
    expect(e.menosDe4).toBeGreaterThanOrEqual(0);
  });
});
