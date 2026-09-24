import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { recortarPerfil, type Perfil } from '../src/ia/perfil.js';
import { perfilEnTexto } from '../src/ia/encargo-entrevista.js';

const RUTA = new URL('./fixtures/perfil-naza-piloto.json', import.meta.url);
/** Medido en el piloto: 64.116 caracteres → 27.654 tokens. */
const CARACTERES_POR_TOKEN = 2.3;

describe('el tamaño de la ficha (la de Naza al cortar el piloto: 45.572 caracteres en texto)', () => {
  it.skipIf(!existsSync(RUTA))('recortada, entra en 2.500 tokens y no pierde a las personas de la familia', () => {
    const cruda = JSON.parse(readFileSync(RUTA, 'utf8')) as Perfil;
    const ficha = recortarPerfil({ ...cruda, noTuvo: cruda.noTuvo ?? [] });
    const texto = perfilEnTexto(ficha);
    expect(texto.length).toBeLessThanOrEqual(2500 * CARACTERES_POR_TOKEN);
    expect(ficha.personas.map((p) => p.nombre)).toEqual(expect.arrayContaining(['Ariel', 'Juan Manuel', 'Ima']));
    expect(ficha.persona.edad?.valor).toBe('27');
  });
});
