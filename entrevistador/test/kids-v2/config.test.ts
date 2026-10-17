import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PLANTILLAS_KIDS, plantillaKidsLista } from '../../src/config.js';
import { BANCO, bancoDe } from '../../src/kids-v2/nucleo/banco.js';

// Las 13 plantillas de Meta de Kids (y sus 13 de España, `_es_es`, y sus 13 en catalán, `_ca`) y WA_PLANTILLAS_KIDS_LISTAS.
const MD = fileURLToPath(new URL('../../../docs/kids/v2/plantillas-meta-kids.md', import.meta.url));
const MD_ES = fileURLToPath(new URL('../../../docs/kids/v2/idiomas/plantillas-meta-kids-es-ES.md', import.meta.url));
const MD_CA = fileURLToPath(new URL('../../../docs/kids/v2/idiomas/plantillas-meta-kids-ca.md', import.meta.url));
const rioplatenses = () => Object.keys(PLANTILLAS_KIDS).filter((n) => PLANTILLAS_KIDS[n].idioma === 'es-AR');
const deEspana = () => Object.keys(PLANTILLAS_KIDS).filter((n) => PLANTILLAS_KIDS[n].idioma === 'es-ES');
const enCatalan = () => Object.keys(PLANTILLAS_KIDS).filter((n) => PLANTILLAS_KIDS[n].idioma === 'ca');

describe('las plantillas de Kids', () => {
  it('son 13 en español (es), las mismas 13 con _es_es en español de España (es_ES) y con _ca en catalán (ca): 39', () => {
    expect(Object.keys(PLANTILLAS_KIDS)).toHaveLength(39);
    expect(enCatalan()).toEqual(rioplatenses().map((n) => `${n}_ca`));
    for (const n of enCatalan()) expect(PLANTILLAS_KIDS[n].idiomaMeta).toBe('ca');
    expect(rioplatenses()).toHaveLength(13);
    for (const n of rioplatenses()) expect(PLANTILLAS_KIDS[n].idiomaMeta).toBe('es');
    expect(deEspana()).toEqual(rioplatenses().map((n) => `${n}_es_es`));
    for (const n of deEspana()) expect(PLANTILLAS_KIDS[n].idiomaMeta).toBe('es_ES');
  });

  it('cada plantilla que pide el motor en es-ES existe y es de España', () => {
    const delBanco = bancoDe('es-ES').mensajes.flatMap((m) => (m.plantilla ? [m.plantilla] : []));
    for (const nombre of [...delBanco, 'kids_final_es_es', 'kids_final_plural_es_es']) expect(PLANTILLAS_KIDS[nombre]?.idioma, nombre).toBe('es-ES');
  });

  it('cada plantilla que pide el motor en catalán existe y es catalana', () => {
    const delBanco = bancoDe('ca').mensajes.flatMap((m) => (m.plantilla ? [m.plantilla] : []));
    for (const nombre of [...delBanco, 'kids_final_ca', 'kids_final_plural_ca']) expect(PLANTILLAS_KIDS[nombre]?.idioma, nombre).toBe('ca');
  });

  it.skipIf(!existsSync(MD_CA))('las catalanas son las de plantillas-meta-kids-ca.md', () => {
    const delMd = [...readFileSync(MD_CA, 'utf8').matchAll(/`(kids_[a-z0-9_]+_ca)`/g)].map((m) => m[1]);
    expect([...new Set(delMd)].sort()).toEqual(enCatalan().sort());
  });

  it.skipIf(!existsSync(MD_ES))('las de España son las de plantillas-meta-kids-es-ES.md', () => {
    const delMd = [...readFileSync(MD_ES, 'utf8').matchAll(/`(kids_[a-z0-9_]+_es_es)`/g)].map((m) => m[1]);
    expect([...new Set(delMd)].sort()).toEqual(deEspana().sort());
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
    expect([...nombradas].sort()).toEqual(rioplatenses().sort());
  });

  it('WA_PLANTILLAS_KIDS_LISTAS: lista separada por comas, o * para todas', () => {
    expect(plantillaKidsLista('kids_bienvenida', {})).toBe(false);
    expect(plantillaKidsLista('kids_bienvenida', { WA_PLANTILLAS_KIDS_LISTAS: 'kids_aviso_padre, kids_bienvenida' })).toBe(true);
    expect(plantillaKidsLista('kids_bienvenida_plural', { WA_PLANTILLAS_KIDS_LISTAS: 'kids_aviso_padre, kids_bienvenida' })).toBe(false);
    expect(plantillaKidsLista('kids_termino_padre', { WA_PLANTILLAS_KIDS_LISTAS: '*' })).toBe(true);
    expect(plantillaKidsLista('otra_cosa', { WA_PLANTILLAS_KIDS_LISTAS: '*' })).toBe(false);
    // Las de España van con su nombre entero: aprobar la rioplatense no aprueba la de España.
    expect(plantillaKidsLista('kids_bienvenida_es_es', { WA_PLANTILLAS_KIDS_LISTAS: 'kids_bienvenida' })).toBe(false);
    expect(plantillaKidsLista('kids_bienvenida_es_es', { WA_PLANTILLAS_KIDS_LISTAS: 'kids_bienvenida,kids_bienvenida_es_es' })).toBe(true);
    expect(plantillaKidsLista('kids_final_plural_es_es', { WA_PLANTILLAS_KIDS_LISTAS: '*' })).toBe(true);
    expect(plantillaKidsLista('kids_bienvenida_ca', { WA_PLANTILLAS_KIDS_LISTAS: 'kids_bienvenida,kids_bienvenida_es_es' })).toBe(false);
    expect(plantillaKidsLista('kids_bienvenida_ca', { WA_PLANTILLAS_KIDS_LISTAS: 'kids_bienvenida_ca' })).toBe(true);
  });
});
