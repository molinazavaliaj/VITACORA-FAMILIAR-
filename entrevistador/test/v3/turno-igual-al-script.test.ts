import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { botonesDeClave, claveRepregunta, claveSegunda, PIDEN_DIA } from '../../src/v3/nucleo/entrevista/flujo.js';
import type { ResultadoCaza } from '../../src/v3/nucleo/entrevista/cazador.js';
import { preguntaPorId } from '../../src/v3/nucleo/entrevista/banco.js';
import type { Idioma } from '../../src/v3/nucleo/entrevista/idioma.js';
import { leerBoton } from '../../src/v3/nucleo/entrevista/respuesta.js';
import type { FichaTexto } from '../../src/v3/nucleo/entrevista/texto.js';
import { VIDAS_EJEMPLO } from '../../src/v3/nucleo/entrevista/vidas-ejemplo.js';
import { avanzar, cerrarYSeguir, recibirAudio, sumarCaza, tocarBoton } from '../../src/v3/turno.js';
import { estadoInicial, type EstadoV3 } from '../../src/v3/tipos.js';

const SCRIPT = new URL('../../../fabrica/scripts/v3-entrevista-turno.ts', import.meta.url);
const hayFabrica = existsSync(fileURLToPath(SCRIPT));

/** Respuestas genéricas inventadas, por idioma (las de vidas-ejemplo.ts son en castellano). */
const GENERICA: Record<Idioma, string> = {
  'es-AR': 'Sí, fue una historia larga que te cuento con todos los detalles que me acuerdo.',
  'es-ES': 'Sí, fue una historia larga que te cuento con todos los detalles que recuerdo.',
  ca: 'Sí, va ser una història llarga que t’explico amb tots els detalls que recordo.',
};

function respuestaPara(id: string, idioma: Idioma, tocoSi: boolean): { boton: string } | { texto: string } {
  if (tocoSi) return { texto: GENERICA[idioma] };
  const botones = botonesDeClave(id, idioma) ?? [];
  const deLaVida = idioma === 'es-AR' ? VIDAS_EJEMPLO[0].respuestas[id] : undefined;
  if (deLaVida !== undefined) {
    const { boton, resto } = leerBoton(deLaVida);
    if (boton !== undefined && !resto && botones.some((b) => b.texto === boton)) return { boton };
    return { texto: deLaVida };
  }
  const no = botones.find((b) => b.vale === 'no');
  if (preguntaPorId(id, idioma)?.clase === 'foto' && no) return { boton: no.texto };
  return { texto: GENERICA[idioma] };
}

const comoScript = (e: EstadoV3, desde: number) =>
  e.salientes.slice(desde).map((s) => s.texto + (s.botones ? `\n[botones: ${s.botones.map((b) => `(${b})`).join(' ')}]` : ''));

describe.skipIf(!hayFabrica)('turno.ts manda lo mismo que v3-entrevista-turno.ts de la fábrica', () => {
  it.each(['es-AR', 'es-ES', 'ca'] as const)('una entrevista entera en %s', async (idioma) => {
    const motor = (await import(/* @vite-ignore */ SCRIPT.href)) as any;
    const ficha: FichaTexto = idioma === 'es-AR' ? { nombre: 'Prueba', genero: 'varon' } : { nombre: 'Prueba', genero: 'varon', idioma };
    let script = motor.nuevaEntrevista(ficha);
    let nuestro = avanzar(estadoInicial(), ficha).estado;
    expect(comoScript(nuestro, 0)).toEqual(script.mensajes.slice(1)); // el script arranca con BIEN; nosotros no

    for (let paso = 0; paso < 400 && !script.estado.terminada; paso++) {
      const id = nuestro.esperando!;
      expect(id).toBe(script.estado.esperando);
      const desde = nuestro.salientes.length;
      const r = respuestaPara(id, idioma, nuestro.tocoSi === true);
      if ('boton' in r) {
        script = motor.tocarBoton(script.estado, r.boton);
        const t = tocarBoton(nuestro, ficha, r.boton)!;
        nuestro = t.cerrar ? cerrarYSeguir(t.estado, ficha, true).estado : t.estado;
      } else {
        script = motor.responder(script.estado, r.texto);
        nuestro = cerrarYSeguir(recibirAudio(nuestro, r.texto).estado, ficha, true).estado;
      }
      expect(comoScript(nuestro, desde)).toEqual(script.mensajes);
    }
    expect(script.estado.terminada).toBe(true);
    expect(nuestro.terminada).toBe(true);
    expect(nuestro.respuestas).toEqual(script.estado.respuestas);
  });
});

// La vida de ejemplo no toca nunca un "Sí" solo (lo cuenta en el mismo audio):
// esta vuelta toca "Sí" donde lo hay y cuenta después, para comparar el camino de M30.
describe.skipIf(!hayFabrica)('turno.ts y el script, tocando "Sí" donde hay', () => {
  it.each(['es-AR', 'es-ES', 'ca'] as const)('una entrevista entera en %s', async (idioma) => {
    const motor = (await import(/* @vite-ignore */ SCRIPT.href)) as any;
    const ficha: FichaTexto = idioma === 'es-AR' ? { nombre: 'Prueba', genero: 'mujer' } : { nombre: 'Prueba', genero: 'mujer', idioma };
    let script = motor.nuevaEntrevista(ficha);
    let nuestro = avanzar(estadoInicial(), ficha).estado;
    let tocoSi = 0;
    for (let paso = 0; paso < 400 && !script.estado.terminada; paso++) {
      const id = nuestro.esperando!;
      expect(id).toBe(script.estado.esperando);
      const desde = nuestro.salientes.length;
      const si = nuestro.tocoSi ? undefined : (botonesDeClave(id, idioma) ?? []).find((b) => b.vale === 'si');
      if (si) {
        tocoSi++;
        script = motor.tocarBoton(script.estado, si.texto);
        const t = tocarBoton(nuestro, ficha, si.texto)!;
        nuestro = t.cerrar ? cerrarYSeguir(t.estado, ficha, true).estado : t.estado;
      } else {
        script = motor.responder(script.estado, GENERICA[idioma]);
        nuestro = cerrarYSeguir(recibirAudio(nuestro, GENERICA[idioma]).estado, ficha, true).estado;
      }
      expect(comoScript(nuestro, desde)).toEqual(script.mensajes);
    }
    expect(tocoSi).toBeGreaterThan(3);
    expect(nuestro.terminada).toBe(true);
    expect(nuestro.respuestas).toEqual(script.estado.respuestas);
  });
});

// Las ramas que la vida de ejemplo no pisa: la pregunta de la familia (M15),
// la segunda oportunidad (M33.n, "X~2") y la repregunta del cazador ("RP~X",
// con un resultado del cazador inventado: sin modelo, sin gasto).
const OLVIDO: Record<Idioma, string> = { 'es-AR': 'No me acuerdo.', 'es-ES': 'No me acuerdo.', ca: 'No me’n recordo.' };

describe.skipIf(!hayFabrica)('turno.ts y el script: familia, segunda oportunidad y repregunta', () => {
  it.each(['es-AR', 'es-ES', 'ca'] as const)('una entrevista entera en %s', async (idioma) => {
    const motor = (await import(/* @vite-ignore */ SCRIPT.href)) as any;
    const ficha: FichaTexto = idioma === 'es-AR' ? { nombre: 'Prueba', genero: 'varon' } : { nombre: 'Prueba', genero: 'varon', idioma };
    const familia = [{ id: 'FAM1', texto: '¿Cuál era la comida de los domingos?' }];
    let script = motor.nuevaEntrevista(ficha, familia);
    let nuestro = avanzar(estadoInicial(familia), ficha).estado;
    expect(comoScript(nuestro, 0)).toEqual(script.mensajes.slice(1));
    const olvidada = Object.keys(PIDEN_DIA)[0];
    let cazado = false;
    for (let paso = 0; paso < 400 && !script.estado.terminada; paso++) {
      const id = nuestro.esperando!;
      expect(id).toBe(script.estado.esperando);
      const desde = nuestro.salientes.length;
      const texto = id === olvidada ? OLVIDO[idioma] : GENERICA[idioma];
      script = motor.responder(script.estado, texto);
      const s = cerrarYSeguir(recibirAudio(nuestro, texto).estado, ficha, true);
      nuestro = s.estado;
      expect(s.bloqueCerrado).toBe(script.bloqueCerrado);
      expect(comoScript(nuestro, desde)).toEqual(script.mensajes);
      if (s.bloqueCerrado !== undefined && !cazado) {
        const origen = nuestro.respuestas.find(([k]) => preguntaPorId(k, idioma)?.bloque === s.bloqueCerrado && preguntaPorId(k, idioma)?.clase === 'historia')![0];
        const r: ResultadoCaza = {
          bloque: s.bloqueCerrado,
          llamo: true,
          repreguntas: [{ clave: claveRepregunta(origen), origen, bloque: s.bloqueCerrado, cita: 'una historia larga', pregunta: '¿Y qué pasó después?', tema: 'después' }],
          descartadas: [],
          escenasContadas: [],
          costoUsd: 0,
          gastoUsd: 0,
        };
        script = { ...script, estado: motor.sumarCaza(script.estado, r) };
        nuestro = sumarCaza(nuestro, r);
        cazado = true;
      }
    }
    expect(nuestro.terminada).toBe(true);
    expect(nuestro.respuestas).toEqual(script.estado.respuestas);
    const claves = nuestro.respuestas.map(([k]) => k);
    expect(claves).toContain('FAM1');
    expect(claves).toContain(claveSegunda(olvidada));
    expect(claves.some((k) => k.startsWith('RP~'))).toBe(true);
    expect(nuestro.cazador?.registro).toEqual(script.estado.cazador.registro);
  });
});
