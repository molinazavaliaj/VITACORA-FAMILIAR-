import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { procesarEntranteKids } from '../../src/kids-v2/entrante.js';
import { elegirEnvio } from '../../src/kids-v2/enviar.js';
import { fichaParaArrancar, idiomaDeFila } from '../../src/kids-v2/idioma.js';
import { fijoEn, preguntaEn } from '../../src/kids-v2/nucleo/banco.js';
import { nuevoEstado } from '../../src/kids-v2/nucleo/motor.js';
import { tickKids } from '../../src/kids-v2/reloj.js';
import { estadoBotInicial, type FilaKids } from '../../src/kids-v2/tipos.js';
import { audio, baseConChico, boton, CHICO, depsKidsDePrueba, FICHA_A } from './deps-prueba.js';

// Kids en castellano de España en el bot: qué ficha recibe el motor al arrancar, las plantillas _es_es (es_ES), los
// botones de España y la transcripción en es-ES. Chicos INVENTADOS.
const fila = (b: ReturnType<typeof baseConChico>) => b.tablas.kids_v2[0] as FilaKids;
const deEspana = (o: { enFicha?: boolean; columna?: string } = {}) => {
  const b = baseConChico({ ficha: { ...(o.enFicha === false ? {} : { idioma: 'es-ES' as const }), quienRegala: 'tus padres', apodo: 'Lucía', genero: 'chica' } });
  b.tablas.kids_v2[0].idioma = o.columna ?? 'es-ES';
  return b;
};

beforeEach(() => { vi.stubEnv('WA_PLANTILLAS_KIDS_LISTAS', '*'); });
afterEach(() => { vi.unstubAllEnvs(); });

describe('kids: el idioma de la ficha al arrancar', () => {
  it('es-AR sin el campo: la ficha de siempre, tal cual', () => {
    const f = fila(baseConChico());
    expect(fichaParaArrancar(f)).toBe(f.ficha);
    expect(idiomaDeFila(f)).toBe('es-AR');
  });

  it('es-ES en la ficha y en la columna, o solo en la columna: la ficha del motor lleva es-ES', () => {
    expect(fichaParaArrancar(fila(deEspana())).idioma).toBe('es-ES');
    expect(fichaParaArrancar(fila(deEspana({ enFicha: false }))).idioma).toBe('es-ES');
    expect(idiomaDeFila(fila(deEspana({ enFicha: false })))).toBe('es-ES');
  });

  it('si no coinciden, o es un idioma que Kids no tiene, frena (y no arranca: aviso a los socios)', async () => {
    expect(() => fichaParaArrancar(fila(deEspana({ columna: 'es-AR' })))).toThrow(/no coinciden/);
    expect(() => fichaParaArrancar(fila(deEspana({ columna: 'ca' })))).toThrow(/no coinciden/);
    const b = deEspana({ enFicha: false, columna: 'pt' });
    expect(() => fichaParaArrancar(fila(b))).toThrow(/pt/);
    const t = depsKidsDePrueba(b);
    await tickKids(t.deps);
    expect(fila(b).estado).toBeNull();
    expect(t.enviados).toEqual([]);
    expect(t.avisos.some((a) => a.clave === 'kids-ficha-k1')).toBe(true);
  });
});

describe('kids: un chico de España por el bot', () => {
  it('arranca con las plantillas _es_es (es_ES), [Vale, vamos] le manda K1 de España y el audio se transcribe en es-ES', async () => {
    for (const enFicha of [true, false]) {
      const b = deEspana({ enFicha });
      const t = depsKidsDePrueba(b);
      const idiomas: string[] = [];
      const transcribir = t.deps.transcribir;
      t.deps.transcribir = async (a, o) => { idiomas.push(o.idioma); return transcribir(a, o); };
      await tickKids(t.deps);
      expect(t.enviados.map((e) => [e.plantilla, e.idiomaMeta])).toEqual([['kids_bienvenida_plural_es_es', 'es_ES'], ['kids_aviso_padre_es_es', 'es_ES']]);
      expect(fila(b).estado!.motor.ficha.idioma).toBe('es-ES');
      await procesarEntranteKids(t.deps, CHICO, boton('Vale, vamos', 'wamid.salida.1'));
      const k1 = t.enviados.at(-1)!;
      expect(k1.tipo).toBe('botones');
      expect(k1.texto).toBe(preguntaEn('K1', 'es-ES').texto);
      expect(k1.botones).toEqual(['Paso']);
      expect(t.enviados.some((e) => e.texto === fijoEn('ENTRADA-1', 'es-ES').texto.replace('{{o/a}}', 'a'))).toBe(true);
      await procesarEntranteKids(t.deps, CHICO, audio('me acuerdo de la playa de pequeña con mis abuelos y un perro'));
      expect(idiomas).toEqual(['es-ES']);
    }
  });

  it('una plantilla que no es del idioma del chico no sale (no debería pasar: el motor le pone el sufijo)', () => {
    const motor = nuevoEstado({ ...FICHA_A, idioma: 'es-ES' });
    const e = estadoBotInicial({ ...motor, ultimaEntrada: '2026-11-02T14:00:00.000Z' });
    const s = { a: 'chico' as const, id: 'FINAL-CHICO', texto: 'x', botones: [], plantilla: { nombre: 'kids_final', variables: ['Bruno', 'tu mamá'] }, envio: '9' };
    expect(elegirEnvio({ canal: 'A' }, e, s, new Date('2026-11-02T15:00:00Z'))).toEqual({ tipo: 'otro-idioma', nombre: 'kids_final', idioma: 'es-ES' });
    const bien = { ...s, plantilla: { ...s.plantilla, nombre: 'kids_final_es_es' } };
    expect(elegirEnvio({ canal: 'A' }, e, bien, new Date('2026-11-02T15:00:00Z'))).toMatchObject({ tipo: 'plantilla', nombre: 'kids_final_es_es', idiomaMeta: 'es_ES' });
  });
});

// Kids en catalán en el bot (16/10, textos de banco-ca.md sin revisar todavía): plantillas _ca (Catalan), botones en
// catalán, el género por palabra entera y la transcripción en ca.
const deCatalunya = (o: { enFicha?: boolean } = {}) => {
  const b = baseConChico({ ficha: { ...(o.enFicha === false ? {} : { idioma: 'ca' as const }), quienRegala: 'els teus pares', apodo: 'Jana', genero: 'chica' } });
  b.tablas.kids_v2[0].idioma = 'ca';
  return b;
};

describe('kids: un chico de Catalunya por el bot', () => {
  it("arranca con las plantillas _ca (ca), [Vinga, som-hi] le manda K1 en catalán y el audio se transcribe en ca", async () => {
    for (const enFicha of [true, false]) {
      const b = deCatalunya({ enFicha });
      expect(fichaParaArrancar(fila(b)).idioma).toBe('ca');
      const t = depsKidsDePrueba(b);
      const idiomas: string[] = [];
      const transcribir = t.deps.transcribir;
      t.deps.transcribir = async (a, o) => { idiomas.push(o.idioma); return transcribir(a, o); };
      await tickKids(t.deps);
      expect(t.enviados.map((e) => [e.plantilla, e.idiomaMeta])).toEqual([['kids_bienvenida_plural_ca', 'ca'], ['kids_aviso_padre_ca', 'ca']]);
      expect(fila(b).estado!.motor.ficha.idioma).toBe('ca');
      await procesarEntranteKids(t.deps, CHICO, boton("Vinga, som-hi", 'wamid.salida.1'));
      const k1 = t.enviados.at(-1)!;
      expect(k1.texto).toBe(preguntaEn('K1', 'ca').texto);
      expect(k1.botones).toEqual(['Passo']);
      expect(t.enviados.some((e) => e.texto === fijoEn('ENTRADA-1', 'ca').texto.replace('{{petit/petita}}', 'petita'))).toBe(true);
      await procesarEntranteKids(t.deps, CHICO, audio("recordo la platja de petita amb els avis i un gos que es deia Rufus"));
      expect(idiomas).toEqual(['ca']);
    }
  });
});
