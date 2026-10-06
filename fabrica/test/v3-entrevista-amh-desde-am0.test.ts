// AMH ("¿Hoy estás en pareja?") no se manda si AM0 ya lo dijo (Naza, 06/10,
// después de la simulación en castellano de España: la narradora contestó el
// repaso de AM0 con "…me he quedado sola" y le llegó igual "¿Tienes pareja
// ahora?"). Si AM0 se contestó con texto o audio (no con botón) y dice
// claramente que hoy no hay nadie, sin nada de que hoy hay alguien, AMH cuenta
// como "no" y no se manda. Ante la duda, se manda como siempre. En es-AR, ca y
// es-ES. Vidas inventadas.

import { describe, expect, it } from 'vitest';
import { bancoDe, preguntaPorId } from '../src/v3/entrevista/banco.js';
import { amhInferidaDeAM0, anotarInferidas, cumple, interpretacionDe, mensajesDespues, siguientePregunta, type Respuestas } from '../src/v3/entrevista/flujo.js';
import type { Idioma } from '../src/v3/entrevista/idioma.js';
import { acuseDeTurno } from '../src/v3/entrevista/mensajes.js';
import { am0DiceQueHoyNoHayNadie, interpretar, leerInferida, respuestaDeBoton, respuestaInferida } from '../src/v3/entrevista/respuesta.js';
import { simularRecorrido } from '../src/v3/entrevista/seleccion.js';
import { renderizar } from '../src/v3/entrevista/texto.js';
import { VIDAS_EJEMPLO } from '../src/v3/entrevista/vidas-ejemplo.js';
import { respuestasParaCazar } from '../src/v3/entrevista/cazador.js';
import { aMaterial } from '../scripts/v3-entrevista-a-material.js';
import { nuevaEntrevista, responder, tocarBoton, type Resultado } from '../scripts/v3-entrevista-turno.js';

const CUENTA = 'Sí, te cuento: fue una historia larga que me acuerdo muy bien.';

const VIUDA: Record<Idioma, string> = {
  'es-AR': 'Una sola vez, con Ernesto. Cuarenta años juntos, hasta que falleció hace tres años. Estoy viuda.',
  ca: "Només una vegada, amb en Josep. Quaranta anys junts, fins que va morir fa tres anys. M'he quedat sola.",
  // La simulación es-ES del 06/10 (narradora inventada, Pilar).
  'es-ES':
    'En serio, solo Fernando. Lo del Julián del pueblo fue un pasodoble y tres noches sin dormir. A Fernando lo conocí en el setenta y tres en la Riviera, nos casamos en el setenta y cinco y estuvimos juntos cuarenta y cuatro años, hasta que se me murió en el diecinueve. Me he quedado sola.',
};
const SOLA_Y_DESPUES: Record<Idioma, string> = {
  'es-AR': 'Con Ernesto, cuarenta años. Cuando murió me quedé sola un tiempo y después conocí a Juan.',
  ca: "Amb en Josep, quaranta anys. Quan va morir em vaig quedar sola una temporada i després vaig conèixer en Joan.",
  'es-ES': 'Con Fernando, cuarenta años. Cuando murió me he quedado sola un tiempo y luego he conocido a Juan.',
};
const SIN_NADA: Record<Idioma, string> = {
  'es-AR': 'Una sola vez, con Ernesto, desde los veinte años. Nos casamos en el sesenta.',
  ca: 'Només una vegada, amb en Josep, des dels vint anys. Ens vam casar el seixanta.',
  'es-ES': 'Una sola vez, con Fernando, desde los veinte años. Nos casamos en el sesenta.',
};
const SI_HUBO: Record<Idioma, string> = { 'es-AR': 'Sí, hubo', ca: "Sí, n'hi ha hagut", 'es-ES': 'Sí, la hubo' };

const IDIOMAS: Idioma[] = ['es-AR', 'ca', 'es-ES'];

/** Todo lo de antes de AM0 contestado contando algo, y AM0 con `am0`. */
function hastaAM0(idioma: Idioma, am0: string): Map<string, string> {
  const banco = bancoDe(idioma);
  const orden = banco.find((p) => p.id === 'AM0')!.orden;
  const r = new Map<string, string>();
  for (const p of banco) if (p.orden < orden && p.parte === 'nucleo') r.set(p.id, CUENTA);
  r.set('AM0', am0);
  return r;
}

/** Sigue la entrevista con siguientePregunta hasta salir del bloque 6; devuelve los IDs del bloque 6 que se mandaron. */
function bloque6(idioma: Idioma, am0: string, contestar: (id: string) => string = () => CUENTA): string[] {
  const r = hastaAM0(idioma, am0);
  const mandadas = ['AM0'];
  for (let i = 0; i < 40; i++) {
    const s = siguientePregunta({ respuestas: r, idioma });
    if (s.tipo !== 'pregunta' || s.pregunta.bloque !== 6) break;
    mandadas.push(s.pregunta.id);
    r.set(s.pregunta.id, contestar(s.pregunta.id));
  }
  return mandadas;
}

describe('el detector: ¿AM0 dice claramente que hoy no hay nadie?', () => {
  it.each(IDIOMAS)('%s: viuda clara → sí', (idioma) => {
    expect(am0DiceQueHoyNoHayNadie(VIUDA[idioma], idioma)).toBe(true);
  });

  it.each(IDIOMAS)('%s: "me quedé sola un tiempo y después conocí a Juan" → no (ante la duda, AMH)', (idioma) => {
    expect(am0DiceQueHoyNoHayNadie(SOLA_Y_DESPUES[idioma], idioma)).toBe(false);
  });

  it.each(IDIOMAS)('%s: sin nada explícito → no', (idioma) => {
    expect(am0DiceQueHoyNoHayNadie(SIN_NADA[idioma], idioma)).toBe(false);
  });

  it.each(IDIOMAS)('%s: con botón, aunque el audio de después diga que está viuda → no (todo igual que antes)', (idioma) => {
    expect(am0DiceQueHoyNoHayNadie(`${respuestaDeBoton(SI_HUBO[idioma])} ${VIUDA[idioma]}`, idioma)).toBe(false);
  });

  // Regla estricta (revisión del 06/10, "ante la duda, AMH"): hace falta una frase explícita de que hoy
  // no hay nadie, y desde el primer final o "nadie" hasta el final nada que sugiera una persona nueva.
  const SE_SALTEA: [Idioma, string][] = [
    ['es-AR', 'Con Raúl nos casamos en el setenta y nos separamos en el noventa. No tengo pareja.'],
    ['es-AR', 'Fue Hugo, toda la vida, y murió hace dos años. Me quedé viuda.'],
    ['es-AR', 'Murió mi marido en el 2010. Me quedé sola.'],
    ['es-AR', 'Murió Ernesto hace tres años y estoy viuda.'],
    ['es-AR', 'Con Alberto, cincuenta años. Falleció en el veinte y desde entonces vivo sola.'],
    ['ca', "Amb en Pere ens vam separar l'any noranta. No tinc parella."],
    ['ca', 'El meu marit va morir fa cinc anys. Estic vídua.'],
    ['ca', "Va morir el meu marit i em vaig quedar sola."],
    ['es-ES', 'Con Paco, hasta que ha fallecido. Estoy viuda.'],
    ['es-ES', 'Murió mi marido hace dos años y me he quedado sola.'],
  ];
  it.each(SE_SALTEA)('%s: se saltea AMH: %s', (idioma, texto) => {
    expect(am0DiceQueHoyNoHayNadie(texto, idioma)).toBe(true);
  });

  /** Casos en castellano: valen en es-AR y es-ES, y también en ca (quien habla catalán mezcla). */
  const NO_SE_SALTEA_ES = [
    // Un final solo ya no alcanza.
    'Me divorcié de Raúl en el noventa y desde entonces nada.',
    'Nos separamos en el 80, después vino Rosa.',
    'Se murió. Ahora tengo un compañero.',
    'Se murió. Hoy mi pareja es Luis.',
    'Se murió. Hoy salgo con Luis.',
    'Se murió. Hoy comparto la vida con Luis.',
    'Murió Pedro y me fui a vivir con Ana, mi nueva pareja.',
    'Murió Ernesto hace tres años. Hace un año empecé a salir con Jorge.',
    'Murió Ernesto hace tres años, y Jorge me acompaña desde entonces.',
    'Mi marido murió en el 2010. Ahora salgo con un señor de mi barrio.',
    'Murió. Salgo con Pedro.',
    'Murió, y he empezado a salir con Pedro.',
    // Con la frase explícita, pero después alguien nuevo, un "pero" o un nombre.
    'Me quedé viuda, y ahora tengo a Mario.',
    'Me quedé sola, pero ahora tengo a Mario.',
    'Me quedé viuda en el noventa. Hoy estoy bien acompañada por Mario.',
    'Me quedé sola un tiempo y después conocí a Juan.',
    // Hoy hay alguien en algún lado.
    'Mi primer marido murió joven. Ahora estoy con Raúl.',
    'Mi primer marido murió joven y me volví a casar.',
    'Con el primero nos separamos; Luis, que es mi marido, llegó en el ochenta.',
    'Tuve un novio, cortamos. Con Héctor estamos hace cuarenta años.',
    'Mi primer marido murió joven y llevamos veinte años con Andrés.',
    'Mi novio de la juventud murió en un accidente. Después me casé con Pedro.',
    'De soltera tuve dos novios y después me casé con Alberto.',
    'Tuve un novio a los quince, terminamos enseguida, y a Alberto lo conocí a los veinte.',
    'Vivo con Juan; me quedé viuda del primero en el ochenta.',
    // Una frase de "nadie" negada no es "nadie".
    'Con Alberto toda la vida. No estoy sola para nada.',
    'Con Alberto toda la vida, nunca me quedé sola.',
  ];
  const NO_SE_SALTEA_CA = [
    'Ens vam separar i després va venir la Rosa.',
    'Va morir. Ara tinc en Pere, el meu company.',
    'Em vaig quedar vídua i ara tinc una parella.',
    'Va morir, i ara surto amb en Pere.',
    "Va morir i m'he quedat sola, però surto amb algú.",
    'El meu primer marit va morir jove. Ara estic amb en Ramon.',
    'Amb en Pere ens vam separar, i amb la Rosa portem trenta anys.',
    'El meu xicot de jove va morir. Després em vaig casar amb en Pere.',
    "Em vaig quedar sola un temps i després vaig conèixer en Joan.",
  ];
  const NO_SE_SALTEA: [Idioma, string][] = [
    ...NO_SE_SALTEA_ES.flatMap((t) => (['es-AR', 'es-ES', 'ca'] as Idioma[]).map((i) => [i, t] as [Idioma, string])),
    ...NO_SE_SALTEA_CA.map((t) => ['ca', t] as [Idioma, string]),
  ];
  it.each(NO_SE_SALTEA)('%s: AMH se manda: %s', (idioma, texto) => {
    expect(am0DiceQueHoyNoHayNadie(texto, idioma)).toBe(false);
  });
});

describe('el flujo: AMH se saltea y cuenta como "no"', () => {
  it.each(IDIOMAS)('%s: viuda clara en AM0 → no llega AMH, llegan AM9 y AM19 (igual que con [No estoy en pareja])', (idioma) => {
    const seq = bloque6(idioma, VIUDA[idioma]);
    expect(seq).not.toContain('AMH');
    expect(seq).toEqual(expect.arrayContaining(['AM9', 'AM19']));
    // Lo mismo que si hubiera tocado [No estoy en pareja], menos AMH.
    const conBoton = bloque6(idioma, VIUDA[idioma], (id) => (id === 'AMH' ? respuestaDeBoton(bancoDe(idioma).find((p) => p.id === 'AMH')!.botones![1].texto) : CUENTA));
    expect(seq).toEqual(conBoton.filter((id) => id !== 'AMH'));
  });

  it.each(IDIOMAS)('%s: lo que sigue a AM0 es AM1, no AMH', (idioma) => {
    const s = siguientePregunta({ respuestas: hastaAM0(idioma, VIUDA[idioma]), idioma });
    expect(s).toMatchObject({ tipo: 'pregunta', pregunta: { id: 'AM1' } });
  });

  it.each(IDIOMAS)('%s: "me quedé sola un tiempo y después conocí a Juan" → AMH se manda', (idioma) => {
    expect(siguientePregunta({ respuestas: hastaAM0(idioma, SOLA_Y_DESPUES[idioma]), idioma })).toMatchObject({ tipo: 'pregunta', pregunta: { id: 'AMH' } });
  });

  it.each(IDIOMAS)('%s: tocó [Sí, hubo] (y después contó en audio que está viuda) → AMH se manda', (idioma) => {
    const conBoton = `${respuestaDeBoton(SI_HUBO[idioma])} ${VIUDA[idioma]}`;
    expect(siguientePregunta({ respuestas: hastaAM0(idioma, conBoton), idioma })).toMatchObject({ tipo: 'pregunta', pregunta: { id: 'AMH' } });
    expect(siguientePregunta({ respuestas: hastaAM0(idioma, respuestaDeBoton(SI_HUBO[idioma])), idioma })).toMatchObject({ tipo: 'pregunta', pregunta: { id: 'AMH' } });
  });

  it.each(IDIOMAS)('%s: un repaso sin nada explícito → AMH se manda', (idioma) => {
    expect(siguientePregunta({ respuestas: hastaAM0(idioma, SIN_NADA[idioma]), idioma })).toMatchObject({ tipo: 'pregunta', pregunta: { id: 'AMH' } });
  });

  it.each(IDIOMAS)('%s: AM7 dice "repetía" (la variante «sino:AMH»)', (idioma) => {
    const r = hastaAM0(idioma, VIUDA[idioma]);
    const am7 = preguntaPorId('AM7', idioma)!;
    expect(renderizar(am7.texto, { nombre: 'Elsa', genero: 'mujer', idioma }, r)).toContain(idioma === 'ca' ? 'repetia' : 'repetía');
  });

  it('el acuse de AM0 va pegado a AM1 como siempre (sin el "Gracias" de AMH)', () => {
    const am0 = preguntaPorId('AM0')!;
    expect(mensajesDespues(am0, VIUDA['es-AR'])).toEqual(['M3']);
    expect(acuseDeTurno('M3', 0, preguntaPorId('AM1')!.texto, preguntaPorId('AM1')!)).toBe('M3.1');
  });

  it('una respuesta de verdad en AMH manda sobre lo que se infiere (entrevista vieja que ya la tenía)', () => {
    const r = hastaAM0('es-AR', VIUDA['es-AR']);
    r.set('AMH', respuestaDeBoton('Sí, estoy en pareja'));
    expect(interpretacionDe(r, 'AMH')).toBe('conto');
    expect(amhInferidaDeAM0(r)).toBe(false);
    expect(cumple(preguntaPorId('AM9')!, r)).toBe(false);
  });

  it('AM0 con un "no" corto: no hay tema, ni AMH ni nada que inferir', () => {
    const r = hastaAM0('es-AR', 'No, nunca hubo nadie, siempre estuve sola.');
    expect(amhInferidaDeAM0(r)).toBe(false);
    expect(siguientePregunta({ respuestas: r })).toMatchObject({ tipo: 'pregunta', pregunta: { id: 'AM14' } });
  });
});

describe('queda registrado: AMH inferida de AM0', () => {
  it('la marca se guarda en AMH, vale "no" y no es un botón', () => {
    const marca = respuestaInferida('AM0');
    expect(leerInferida(marca)).toBe('AM0');
    expect(leerInferida(respuestaDeBoton('No estoy en pareja'))).toBeUndefined();
    expect(interpretar(preguntaPorId('AMH')!, marca)).toBe('no');
  });

  it.each(IDIOMAS)('%s: anotarInferidas la guarda una sola vez, y con la marca todo sigue igual', (idioma) => {
    const r = hastaAM0(idioma, VIUDA[idioma]);
    expect(amhInferidaDeAM0(r, idioma)).toBe(true);
    expect(anotarInferidas(r, idioma)).toEqual(['AMH']);
    expect(r.get('AMH')).toBe(respuestaInferida('AM0'));
    expect(anotarInferidas(r, idioma)).toEqual([]);
    expect(amhInferidaDeAM0(r, idioma)).toBe(true);
    expect(siguientePregunta({ respuestas: r, idioma })).toMatchObject({ tipo: 'pregunta', pregunta: { id: 'AM1' } });
  });

  it('sin nada que inferir, anotarInferidas no toca nada', () => {
    const r = hastaAM0('es-AR', SIN_NADA['es-AR']);
    expect(anotarInferidas(r)).toEqual([]);
    expect(r.has('AMH')).toBe(false);
  });

  it('para la distancia de una repregunta, AMH inferida no cuenta como respuesta (con la marca o sin ella, igual)', () => {
    const repreguntas = [{ clave: 'RP~CI5', origen: 'CI5', bloque: 5, cita: 'x', pregunta: '¿Y?', tema: 't' }];
    const sinMarca = hastaAM0('es-AR', VIUDA['es-AR']);
    sinMarca.set('AM1', CUENTA);
    const conMarca = new Map([...sinMarca].filter(([k]) => k !== 'AM1'));
    anotarInferidas(conMarca);
    conMarca.set('AM1', CUENTA);
    // Después de CI5 contestó AM0 y AM1: dos, no tres.
    expect(siguientePregunta({ respuestas: sinMarca, repreguntas }).tipo).toBe('pregunta');
    expect(siguientePregunta({ respuestas: conMarca, repreguntas }).tipo).toBe('pregunta');
  });

  it('para M29 (tercer olvido seguido), AMH inferida no corta la cuenta (con la marca o sin ella, igual)', () => {
    const am0 = 'No me acuerdo, estoy viuda.';
    expect(interpretar(preguntaPorId('AM0')!, am0)).toBe('olvido');
    const sinMarca: Respuestas = new Map([['CA2', 'No me acuerdo.'], ['AM0', am0]]);
    const conMarca: Respuestas = new Map([...sinMarca, ['AMH', respuestaInferida('AM0')]]);
    expect(amhInferidaDeAM0(sinMarca)).toBe(true);
    const am1 = preguntaPorId('AM1')!;
    expect(mensajesDespues(am1, 'No me acuerdo.', sinMarca)).toEqual(['M29']);
    expect(mensajesDespues(am1, 'No me acuerdo.', conMarca)).toEqual(['M29']);
  });

  it('el cazador no recibe la marca como respuesta', () => {
    const r = hastaAM0('es-AR', VIUDA['es-AR']);
    anotarInferidas(r);
    expect(respuestasParaCazar(r, 6, () => '').map((x) => x.id)).toEqual(['AM0']);
  });

  it.each([true, false])('el material del escritor no tiene una fila de AMH y la de AM0 lo avisa (marca guardada: %s)', (guardada) => {
    const r: Respuestas = new Map([['AM0', VIUDA['es-AR']], ...(guardada ? [['AMH', respuestaInferida('AM0')] as [string, string]] : []), ['AM1', CUENTA]]);
    const filas = aMaterial({ ficha: { nombre: 'Elsa', genero: 'mujer' }, respuestas: [...r] });
    expect(filas.map((f) => f.preguntaId)).toEqual(['AM0', 'AM1']);
    expect(filas[0].origen).toMatch(/AMH/);
    expect(filas[0].origen).toMatch(/no está en pareja/);
  });
});

describe('la simulación con el script de turnos (lo que haría WhatsApp)', () => {
  function hastaEsperar(r: Resultado, id: string): Resultado {
    for (let i = 0; i < 200 && r.estado.esperando !== id; i++) r = responder(r.estado, CUENTA);
    expect(r.estado.esperando).toBe(id);
    return r;
  }

  it('viuda en el audio de AM0: llega el acuse con AM1, AMH queda guardada como inferida y después llega AM9', () => {
    let r = hastaEsperar(nuevaEntrevista({ nombre: 'Elsa', genero: 'mujer' }), 'AM0');
    r = responder(r.estado, VIUDA['es-AR']);
    expect(r.estado.esperando).toBe('AM1');
    // Un solo mensaje: el acuse pegado a AM1. Ningún "Gracias, Elsa." suelto ni "¿Hoy estás en pareja?".
    expect(r.mensajes).toHaveLength(1);
    expect(r.mensajes[0]).not.toMatch(/Hoy estás en pareja/);
    expect(r.mensajes[0]).toMatch(/Empecemos por su nombre/);
    expect(r.estado.respuestas.map(([id]) => id).slice(-2)).toEqual(['AM0', 'AMH']);
    expect(r.estado.respuestas.at(-1)![1]).toBe(respuestaInferida('AM0'));
    r = hastaEsperar(r, 'AM9');
    expect(r.estado.charla.some((g) => g.de === 'bio' && g.partes.some((p) => p.id === 'AMH'))).toBe(false);
  });

  it('con el botón [Sí, hubo] todo sigue igual: después del audio llega AMH', () => {
    let r = hastaEsperar(nuevaEntrevista({ nombre: 'Elsa', genero: 'mujer' }), 'AM0');
    r = tocarBoton(r.estado, 'Sí, hubo');
    r = responder(r.estado, VIUDA['es-AR']);
    expect(r.estado.esperando).toBe('AMH');
  });
});

describe('las vidas de ejemplo', () => {
  it('Elsa (viuda que lo dijo en el repaso) no recibe AMH y sí AM9 y AM19', () => {
    const vida = VIDAS_EJEMPLO.find((v) => v.clave === 'viuda-lo-dijo-en-el-repaso')!;
    const amor = simularRecorrido(vida.ficha, (id) => vida.respuestas[id]).flatMap((p) => (p.tipo === 'pregunta' && p.pregunta.bloque === 6 ? [p.pregunta.id] : []));
    expect(amor).toEqual(['AM0', 'AM1', 'AM3', 'AM4', 'AM13', 'AM8', 'AM9', 'AM19', 'AM21', 'CI6']);
  });

  it('las demás vidas siguen recibiendo AMH si tienen pareja o la tuvieron', () => {
    for (const vida of VIDAS_EJEMPLO) {
      if (vida.clave === 'viuda-lo-dijo-en-el-repaso' || vida.clave.startsWith('nunca')) continue;
      const ids = simularRecorrido(vida.ficha, (id) => vida.respuestas[id]).flatMap((p) => (p.tipo === 'pregunta' ? [p.pregunta.id] : []));
      expect(ids, vida.clave).toContain('AMH');
    }
  });
});
