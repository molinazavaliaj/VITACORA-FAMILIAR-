import { describe, it, expect } from 'vitest';
import { encargoDelBiografo, controlarTexto, tratoDelPerfil } from '../src/ia/encargo-entrevista.js';
import { perfilVacio, type Perfil } from '../src/ia/perfil.js';

// El encargo compartido del entrevistador y la evaluación v2 (biógrafo v2, 23/09). La pregunta
// del día y la repregunta tenían cada una sus reglas, escritas en momentos distintos; la
// evaluación era el prompt más parcheado (19 cambios, uno por error). Ahora las dos parten del
// mismo encargo: quién es, cómo se le habla, qué se respeta siempre.
//
// Restaurado en "fix ronda 1" de Task 8: al reescribir `test/evaluar-v2.test.ts` para el nuevo
// `evaluar-v2.ts` (Task 8) se perdió sin querer la única cobertura de `encargo-entrevista.ts`.
// Este archivo es el que ya nombraba Task 9; se lo adelanta acá para no dejar el módulo sin tests.

function perfilDe(parcial: Partial<Perfil['persona']> = {}, extra: Partial<Perfil> = {}): Perfil {
  const p = perfilVacio();
  p.persona = { ...p.persona, ...parcial };
  return { ...p, ...extra };
}

describe('encargoDelBiografo', () => {
  it('dice quién es, cómo hablarle y lo que se respeta siempre', () => {
    const t = encargoDelBiografo(perfilDe({ comoHabla: { valor: 'vos', fuente: 'dicho' }, genero: { valor: 'mujer', fuente: 'deducido' } }));
    expect(t).toContain('QUIÉN ES');
    expect(t).toContain('Hablale de vos');
    expect(t).toContain('Es una mujer');
    expect(t).toContain('Nunca le pidas lo que ya contó');
    expect(t).toContain('pidió dejar un tema');
  });

  it('si no se sabe mujer u hombre, pide escribir para los dos', () => {
    expect(encargoDelBiografo(perfilDe())).toContain('sirva para los dos');
  });

  it('lleva los temas que pidió dejar', () => {
    expect(encargoDelBiografo(perfilDe(), ['su tío y las drogas'])).toContain('su tío y las drogas');
  });

  it('una etapa a medio llenar (el oficio de la ficha) se dice con lo que hay, sin basura', () => {
    const p = perfilDe();
    p.etapas = [{ edades: '', lugar: '', conQuien: '', queHacia: 'costurera', fuente: 'ficha' }, { edades: '0 a 12', lugar: 'Tucumán', conQuien: 'los abuelos', queHacia: '', fuente: 'dicho' }];
    const t = encargoDelBiografo(p);
    expect(t).toContain('- edad sin saber: costurera');
    expect(t).toContain('- 0 a 12: Tucumán; con los abuelos');
    expect(t).not.toMatch(/- : /);
    expect(t).not.toMatch(/con no se sabe/);
  });

  it('si solo se sabe el año de nacimiento, lo dice como año y no como edad', () => {
    expect(encargoDelBiografo(perfilDe({ anioNacimiento: { valor: '1950', fuente: 'ficha' } }))).toContain('Año de nacimiento: 1950');
    expect(encargoDelBiografo(perfilDe({ edad: { valor: '76', fuente: 'dicho' } }))).toContain('Edad: 76');
  });

  it('dice su castellano y ofrece el trato que corresponde', () => {
    const esp = encargoDelBiografo(perfilDe({}, { castellano: 'españa' }));
    expect(esp).toMatch(/castellano de España/);
    expect(esp).not.toMatch(/rioplatense/);
    expect(encargoDelBiografo(perfilDe({}))).toMatch(/rioplatense/);
  });

  it('si hoy fue fuerte, pide reconocerlo antes de preguntar y no tirarle otro tema pesado', () => {
    const t = encargoDelBiografo(perfilDe({}, { hoyFueFuerte: true }));
    expect(t).toMatch(/reconoc[eé]/i);
    expect(t).toMatch(/otro tema pesado/i);
    expect(encargoDelBiografo(perfilDe({}))).not.toMatch(/otro tema pesado/i);
  });

  it('el puente reemplaza al "enganchá": la pregunta va a lo que todavía no contó', () => {
    const t = encargoDelBiografo(perfilDe({}));
    expect(t).not.toMatch(/enganch/i);
    expect(t).toMatch(/sirve de puente/i);
    expect(t).toMatch(/lo que todavía no contó/i);
  });

  it('usa cómo le dicen si se sabe', () => {
    expect(encargoDelBiografo(perfilDe({ comoLeDicen: { valor: 'Tito', fuente: 'dicho' } }))).toContain('Tito');
  });

  it('la presentación admite 90 palabras y no exige signo de pregunta', () => {
    const larga = `${'palabra '.repeat(80)}.`;
    expect(controlarTexto(larga, 'vos').ok).toBe(false);
    expect(controlarTexto(larga, 'vos', { presentacion: true })).toEqual({ ok: true });
    expect(controlarTexto(`${'palabra '.repeat(95)}.`, 'vos', { presentacion: true }).ok).toBe(false);
  });
});

describe('el control con un narrador de tú (España)', () => {
  it('el perfil con tú da un trato controlable; la puerta manual no lo conoce, pero el control sí', () => {
    expect(tratoDelPerfil(perfilDe({ comoHabla: { valor: 'tú', fuente: 'dicho' } }))).toBe('tu');
    expect(tratoDelPerfil(perfilDe({ comoHabla: { valor: 'vos', fuente: 'deducido' } }))).toBe('vos');
    expect(tratoDelPerfil(perfilDe())).toBeNull();
  });

  it('a un narrador de tú no le deja pasar el usted, y no confunde el tú con el vos', () => {
    expect(controlarTexto('Cuénteme de su casa: ¿qué veía al entrar?', 'tu').ok).toBe(false);
    expect(controlarTexto('Cuéntame de tu casa: ¿qué veías al entrar, sabes?', 'tu')).toEqual({ ok: true });
  });
});
