// Las reglas que tiene que cumplir cualquier índice V3 (agrupaciones fijas).
// Las usan v3-indice.test.ts y v3-simulador.test.ts; no es un archivo de
// tests por sí mismo.

import { expect } from 'vitest';
import { AGRUPACIONES, esTituloPosible, FACTOR_ESCRITO, type Indice, type RespuestaV3 } from '../src/v3/indice.js';

export function invariantes(resp: RespuestaV3[], indice: Indice): void {
  const todos = [...indice.capitulos, ...(indice.coda ? [indice.coda] : [])];

  // Toda respuesta no-paso en exactamente un capítulo, en la coda o en el cierre (legado).
  for (const x of resp) {
    const veces = todos.filter((c) => c.respuestaIds.includes(x.id)).length + (indice.cierre.includes(x.id) ? 1 : 0);
    expect(veces, x.id).toBe(x.paso ? 0 : 1);
    if (!x.paso && x.bloque === 15) expect(indice.cierre).toContain(x.id);
  }

  // Ningún título fuera de la tabla fija (y ninguna combinación sin título escrito).
  for (const c of todos) expect(esTituloPosible(c.titulo), c.titulo).toBe(true);
  expect(indice.avisos.filter((a) => /sin tabla/.test(a))).toEqual([]);

  // Nada de cadenas: máximo un salto por respuesta.
  const saltos = new Map<string, number>();
  for (const s of indice.saltos) saltos.set(s.respuestaId, (saltos.get(s.respuestaId) ?? 0) + 1);
  for (const [id, veces] of saltos) expect(veces, id).toBe(1);

  // Amor nunca junto con Mi gente, salvo que Amor no llegue a 250 escritas.
  for (const c of indice.capitulos) {
    const amor = c.claves.some((k) => k === 'E3' || k === 'C5');
    const gente = c.claves.some((k) => k === 'E5' || k === 'C8');
    if (amor && gente) expect(indice.avisos.some((a) => /Amor.*menos de 250/.test(a))).toBe(true);
  }

  // Ningún capítulo numerado bajo su piso, salvo los que siempre existen, los
  // cortos avisados (Amor corto, receptor que ya no está) y los que recibieron.
  for (const c of indice.capitulos) {
    if (c.parte || c.corto || c.claves.length > 1) continue;
    const fila = AGRUPACIONES[indice.tamanio].find((f) => f.clave === c.clave);
    if (!fila || fila.piso === null) continue;
    expect(c.palabrasEscritasObjetivo, c.titulo).toBeGreaterThanOrEqual(fila.piso);
  }

  // Escritas = 0,7 × habladas.
  for (const c of todos) expect(c.palabrasEscritasObjetivo).toBe(Math.round(FACTOR_ESCRITO * c.palabrasHabladas));

  // La coda se titula "Hoy" y no existe en modo migrante joven.
  if (indice.coda) {
    expect(indice.coda.titulo).toBe('Hoy');
    expect(indice.migranteJoven).toBeNull();
  }

  // Particiones solo en Completo.
  if (indice.tamanio !== 'C') expect(indice.capitulos.some((c) => c.parte)).toBe(false);
}
