import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PLANTILLAS_KIDS, plantillaKidsLista } from '../../src/config.js';
import { BANCO } from '../../src/kids-v2/nucleo/banco.js';

// Las 13 plantillas de Meta de Kids y WA_PLANTILLAS_KIDS_LISTAS.
const MD = fileURLToPath(new URL('../../../docs/kids/v2/plantillas-meta-kids.md', import.meta.url));

describe('las plantillas de Kids', () => {
  it('son 13, todas en español', () => {
    expect(Object.keys(PLANTILLAS_KIDS)).toHaveLength(13);
    for (const p of Object.values(PLANTILLAS_KIDS)) expect(p.idiomaMeta).toBe('es');
  });

  it('cada plantilla que pide el motor existe (las del banco y las del final)', () => {
    const delBanco = BANCO.mensajes.flatMap((m) => (m.plantilla ? [m.plantilla] : []));
    expect(delBanco.length).toBeGreaterThan(5);
    for (const nombre of [...delBanco, 'kids_final', 'kids_final_plural']) expect(PLANTILLAS_KIDS[nombre]?.nombre).toBe(nombre);
  });

  it.skipIf(!existsSync(MD))('son las mismas que las de plantillas-meta-kids.md', () => {
    const delMd = [...readFileSync(MD, 'utf8').matchAll(/^## [0-9a-z]+\. `([a-z0-9_]+)`/gm)].map((m) => m[1]).sort();
    // Las 5b y 6b no tienen su propio título con nombre en todos los casos: se suman las que el md nombra en el cuerpo.
    const nombradas = new Set([...delMd, ...[...readFileSync(MD, 'utf8').matchAll(/`(kids_[a-z0-9_]+)`/g)].map((m) => m[1])]);
    expect([...nombradas].sort()).toEqual(Object.keys(PLANTILLAS_KIDS).sort());
  });

  it('WA_PLANTILLAS_KIDS_LISTAS: lista separada por comas, o * para todas', () => {
    expect(plantillaKidsLista('kids_bienvenida', {})).toBe(false);
    expect(plantillaKidsLista('kids_bienvenida', { WA_PLANTILLAS_KIDS_LISTAS: 'kids_aviso_padre, kids_bienvenida' })).toBe(true);
    expect(plantillaKidsLista('kids_bienvenida_plural', { WA_PLANTILLAS_KIDS_LISTAS: 'kids_aviso_padre, kids_bienvenida' })).toBe(false);
    expect(plantillaKidsLista('kids_termino_padre', { WA_PLANTILLAS_KIDS_LISTAS: '*' })).toBe(true);
    expect(plantillaKidsLista('otra_cosa', { WA_PLANTILLAS_KIDS_LISTAS: '*' })).toBe(false);
  });
});
