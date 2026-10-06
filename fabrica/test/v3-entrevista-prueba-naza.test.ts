// La prueba de Naza en la página web (30/09): lo que aprobó, puntos 1 a 8
// (docs/v3/entrevista/simulaciones/hallazgos.md, "Prueba de Naza en la página
// web (30/09)"; textos en simulaciones/textos-prueba-naza.md). El punto 9 (la
// página) se prueba en v3-entrevista-web.test.ts.

import { describe, expect, it } from 'vitest';
import { BANCO, mensajePorId, preguntaPorId } from '../src/v3/entrevista/banco.js';
import { alTocarBoton, cumple, mensajesDespues, siguientePregunta } from '../src/v3/entrevista/flujo.js';
import { acuseAntesDe, acuseDeTurno, anotarAcuse, preguntaSegunAcuse, vueltasEnCero } from '../src/v3/entrevista/mensajes.js';
import { interpretar, respuestaDeBoton } from '../src/v3/entrevista/respuesta.js';
import { simularRecorrido, type PasoRecorrido } from '../src/v3/entrevista/seleccion.js';
import { renderizar } from '../src/v3/entrevista/texto.js';
import { VIDAS_EJEMPLO, type VidaEjemplo } from '../src/v3/entrevista/vidas-ejemplo.js';

const p = (id: string) => preguntaPorId(id)!;
const texto = (id: string) => p(id).texto;
const que = (id: string, resp: string) => interpretar(p(id), resp);
const r = (o: Record<string, string>) => new Map(Object.entries(o));
const botones = (id: string) => (p(id).botones ?? []).map((b) => `${b.texto}=${b.vale}`);
const dep = (id: string) =>
  p(id)
    .depende.map((c) => [c, ...(c.y ?? [])].map((x) => `${x.tipo}:${x.de}`).join(' y '))
    .join(' o ');
const CUENTA = 'Sí, te cuento: fue una tarde larga que me acuerdo muy bien, con mi familia alrededor.';

describe('1. cierres: "Hasta acá lo de…"', () => {
  it('ningún texto del banco dice "Con esto cerramos"', () => {
    expect(BANCO.filter((q) => q.texto.includes('Con esto cerramos')).map((q) => q.id)).toEqual([]);
  });

  it.each([
    ['CI1', 'Hasta acá lo de tu familia de antes de que llegaras vos. Y me pregunto si se me escapó algo: una historia de tus abuelos, de tus viejos de jóvenes, de esa casa. Si hay una dando vueltas, contámela ahora. Y si algo se te viene más tarde, a cualquier hora, mandámelo cuando quieras: va al libro igual.'],
    ['CI3', 'Hasta acá lo de la escuela. ¿Te quedó alguna historia de esos años que no te pregunté? Puede ser de cualquiera de esos años, del primero al último. Si hay una, contámela ahora, con calma. Si no, tocá el botón.'],
    ['CI4', 'Hasta acá tu adolescencia. Antes de pasar a los años de grande, ¿quedó algo de esa época que no encontró su pregunta? Un recuerdo suelto, una cara, una noche. Contámelo ahora, tranquil{{o/a}}, que hay tiempo.'],
    ['CI6', 'Hasta acá lo del amor. ¿Quedó alguien o algo de eso que no te pregunté? Una persona, una carta, un baile, una charla que no entró en ningún lado. Es el momento de contarlo, sin apuro.'],
    ['CI7', 'Hasta acá lo de tu trabajo y tu oficio. ¿Quedó algo de eso que no te pregunté? Un lugar, una herramienta, un olor, una persona, un trabajo de unos días que nadie recuerda. Es el momento de contarlo, sin apuro.'],
    ['CI8', 'Hasta acá lo de la familia de grande. ¿Quedó alguien o algo que no te pregunté? Un cumpleaños, una charla en la cocina, alguien que no entró en ningún lado. Es el momento de contarlo, sin apuro.'],
    ['CI9', 'Hasta acá los lugares y las pasiones. ¿Quedó algún lugar o algo que te gustó mucho y no tuvo su pregunta? Una esquina, un hobby que duró poco, un rincón de tu casa. Contalo ahora, tranquil{{o/a}}.'],
    ['CI10', 'Hasta acá los amigos y la gente que te ayudó. ¿Quedó alguien que te acompañó y no tuvo su pregunta? Un vecino, alguien del trabajo, una persona que apareció una sola vez. Y si querés contar de otros amigos importantes, de quien sea, es el momento. Contalo tranquil{{o/a}}.'],
    ['CI13', 'Hasta acá esta parte. ¿Quedó algún momento importante de tu vida que no tuvo su pregunta? Contámelo ahora, tranquil{{o/a}}.'],
    ['CI14', 'Hasta acá lo de hoy, y ya te conozco un poco más. ¿Quedó algo de tu vida de ahora que no tuvo su pregunta? Una costumbre, alguien que ves seguido, un rato del día que es tuyo. Contámelo ahora, tranquil{{o/a}}.'],
  ])('%s', (id, t) => {
    expect(texto(id)).toBe(t);
  });
});

describe('2 y 3. EN2 y la bienvenida', () => {
  it('EN2: "la gente que vivía con vos"', () => {
    expect(mensajePorId('EN2')!.texto).toBe('Ahora vamos a tu infancia, {{nombre}}: la casa donde creciste y la gente que vivía con vos.');
  });

  it('BIEN, párrafo 2: no hace falta avisar; la que sigue llega a los pocos minutos sin audios', () => {
    expect(mensajePorId('BIEN')!.texto.split('\n\n')[1]).toBe(
      'Funciona así: te mando una pregunta y vos me la contás en audio, como si me lo estuvieras contando en persona. Mandame todos los audios que quieras. Cuando termines no hace falta que me avises: si pasan unos minutos sin audios nuevos, te mando la pregunta que sigue.',
    );
  });
});

describe('4. [Paso esta] pasa a [Prefiero no contarla]', () => {
  it('ningún botón dice "Paso esta"; [Prefiero no contarla] vale paso en las 8', () => {
    expect(BANCO.filter((q) => q.botones?.some((b) => b.texto === 'Paso esta')).map((q) => q.id)).toEqual([]);
    const con = BANCO.filter((q) => q.botones?.some((b) => b.texto === 'Prefiero no contarla' && b.vale === 'paso')).map((q) => q.id);
    expect(con).toEqual(['CA17', 'AD15', 'JU17', 'AM9', 'TR11', 'PE1', 'PE5', 'PE4']);
  });

  it('en ningún mensaje pasan de 3 botones ni de 20 letras', () => {
    for (const q of BANCO) {
      expect((q.botones ?? []).length, q.id).toBeLessThanOrEqual(3);
      for (const b of q.botones ?? []) expect([...b.texto].length, `${q.id} ${b.texto}`).toBeLessThanOrEqual(20);
    }
  });

  it('tocarlo es paso (M27 en una sensible); dicho en audio también', () => {
    expect(que('PE1', respuestaDeBoton('Prefiero no contarla'))).toBe('paso');
    expect(mensajesDespues(p('CA17'), respuestaDeBoton('Prefiero no contarla'))).toEqual(['M27']);
    expect(alTocarBoton(p('PE5'), 'Prefiero no contarla')).toMatchObject({ vale: 'paso', esperaAudio: false });
    expect(que('CA17', 'Prefiero no contarla.')).toBe('paso');
  });
});

describe('5. núcleo y extra: G1 y HE2 entran, FI6 sale', () => {
  const nucleoDelBloque = (b: number) => BANCO.filter((q) => q.bloque === b && q.parte === 'nucleo').map((q) => q.id);

  it('G1 al núcleo, en el bloque 14 después de CO1', () => {
    expect(p('G1')).toMatchObject({ bloque: 14, parte: 'nucleo' });
    const n14 = nucleoDelBloque(14);
    expect(n14[n14.indexOf('CO1') + 1]).toBe('G1');
  });

  it('HE2 al núcleo, en el bloque 10 después de AS1, si:CA6', () => {
    expect(p('HE2')).toMatchObject({ bloque: 10, parte: 'nucleo' });
    expect(dep('HE2')).toBe('si:CA6');
    expect(nucleoDelBloque(10)).toEqual(['AS1', 'HE2', 'AY1', 'AS9', 'AS7', 'CI10']); // AS7 pasó al núcleo (Naza, 30/09)
    expect(cumple(p('HE2'), r({ CA6: respuestaDeBoton('No tuve hermanos') }))).toBe(false);
    expect(cumple(p('HE2'), r({ CA6: CUENTA }))).toBe(true);
  });

  it('FI6 pasa a extra', () => {
    expect(p('FI6').parte).toBe('extra');
    expect(nucleoDelBloque(13)).not.toContain('FI6');
  });
});

describe('6. salidas "si ya me lo contaste"', () => {
  it('CA3: para quien no tuvo al papá cerca', () => {
    expect(texto('CA3')).toBe(
      '¿Y tu papá? Decime su nombre y a qué se dedicaba cuando eras chic{{o/a}}. Contame alguna vez que lo acompañaste o lo viste trabajando. Y si tu papá no estuvo, o preferís no entrar, contame lo que vos quieras de él.',
    );
  });

  // La salida cambió otra vez (Naza, 30/09: "Si ya me lo contaste, decímelo, y si querés reforzar algo, es el momento.")
  // y JU17 dice "en esos años de empezar tu vida": los textos exactos, en v3-entrevista-fable-extras.test.ts.
  it.each(['AD15', 'JU17'])('%s: salida "si ya me lo contaste"', (id) => {
    expect(texto(id)).toMatch(/Si ya me lo contaste, decímelo, y si querés reforzar algo, es el momento\.$/);
    expect(mensajesDespues(p(id), 'Ya te lo conté.')).toEqual(['M25']);
  });

  it('AM1: sin "la primera"', () => {
    expect(texto('AM1')).toBe(
      'Empecemos por su nombre. Y contame el día que se conocieron: dónde fue, quién los presentó o cómo se cruzaron, y qué fue lo primero que te llamó la atención de esa persona. Si ya me lo contaste, decímelo, y si querés reforzar algo, es el momento.',
    );
  });
});

describe('7. bloque 6 nuevo', () => {
  it('el orden del bloque (núcleo y extra en su lugar)', () => {
    expect(BANCO.filter((q) => q.bloque === 6).map((q) => q.id)).toEqual([
      'AM0', 'AMH', 'AM1', 'AM2', 'AM3', 'AM4', 'AM5', 'AM6', 'AM13', 'AM8', 'AM9', 'AM7', 'AM19', 'AM21', 'AM17', 'AM14', 'AM15', 'CI6',
    ]);
    expect(BANCO.filter((q) => q.bloque === 6 && q.parte === 'nucleo').map((q) => q.id)).toEqual([
      'AM0', 'AMH', 'AM1', 'AM3', 'AM4', 'AM13', 'AM8', 'AM9', 'AM19', 'AM21', 'AM14', 'AM15', 'CI6',
    ]);
  });

  it('AM16 y AM20 salen del banco', () => {
    expect(preguntaPorId('AM16')).toBeUndefined();
    expect(preguntaPorId('AM20')).toBeUndefined();
  });

  it('dependencias', () => {
    expect(dep('AMH')).toBe('si:AM0');
    expect(dep('AM1')).toBe('si:AM0');
    expect(dep('AM9')).toBe('sino:AMH');
    expect(dep('AM19')).toBe('sino:AMH y si:AM3');
    expect(dep('AM21')).toBe('si:AM0');
    expect(dep('AM14')).toBe('sino:AM0');
    expect(dep('AM15')).toBe('sino:AM0');
  });

  it('AM0, AMH, AM9 y AM21: textos', () => {
    expect(texto('AM0')).toBe(
      'Ahora vamos al amor. ¿Hubo alguien con quien tuviste una historia en serio? Si hubo, haceme un repaso corto: cuántas veces te enamoraste, cuáles llegaron a algo serio y más o menos en qué años. Después te pregunto más de la pareja de ahora, o de la última, y de las de antes también va a haber lugar. Y si no hubo, también vale.',
    );
    // AMH cambió otra vez (Naza, 30/09: "¿Hoy estás en pareja?"): v3-entrevista-fable-extras.test.ts.
    expect(texto('AMH')).toMatch(/¿Hoy estás en pareja\? Si ya me lo contaste, con el botón alcanza\.$/); // Naza, 04/10
    expect(texto('AM9')).toBe(
      'Si querés, contame cómo fue el final de esa historia: una despedida, como haya sido. Solo lo que vos quieras, y hasta donde quieras. Si preferís no entrar ahí, con el botón alcanza; lo demás de tu historia sigue igual.',
    );
    expect(texto('AM21')).toBe(
      'Ahora las de antes. Si en el repaso me nombraste otras historias que fueron en serio, este es su lugar, pero sin tanto detalle: de cada una, contame un momento que quieras que quede en el libro, el que se te venga primero, y si querés, cómo terminó. Y si hubo alguien que te marcó aunque no haya llegado a nada, también entra acá. Si esa fue la única, con el botón alcanza.',
    );
  });

  it('AMH y AM21: núcleo, historia, no sensibles; AM9 sigue sensible', () => {
    for (const id of ['AMH', 'AM21']) expect(p(id)).toMatchObject({ bloque: 6, parte: 'nucleo', clase: 'historia', sensible: false });
    expect(p('AM9').sensible).toBe(true);
  });

  it('botones', () => {
    expect(botones('AMH')).toEqual(['Sí, estoy en pareja=si', 'No estoy en pareja=no']);
    expect(botones('AM9')).toEqual(['Prefiero no contarla=paso']);
    expect(botones('AM21')).toEqual(['Sí, hubo otras=si', 'Fue la única=no']);
  });

  it('AM7: "repetía" si ya no está (AMH no), "repite" si sigue', () => {
    const am7 = (amh: string) => renderizar(texto('AM7'), { nombre: 'Elsa', genero: 'mujer' }, r({ AMH: amh }));
    expect(am7(respuestaDeBoton('No estoy en pareja'))).toContain('una frase que repetía,');
    expect(am7(respuestaDeBoton('Sí, estoy en pareja'))).toContain('una frase que repite,');
  });

  it('AMH [Sí, estoy en pareja]: no pide audio (no va M30); después de AMH va siempre M26', () => {
    expect(alTocarBoton(p('AMH'), 'Sí, estoy en pareja')).toEqual({ vale: 'si', respuesta: respuestaDeBoton('Sí, estoy en pareja'), esperaAudio: false });
    expect(alTocarBoton(p('AM21'), 'Sí, hubo otras')).toMatchObject({ vale: 'si', mandar: 'M30', esperaAudio: true });
    expect(mensajesDespues(p('AMH'), respuestaDeBoton('Sí, estoy en pareja'))).toEqual(['M26']);
    expect(mensajesDespues(p('AMH'), respuestaDeBoton('No estoy en pareja'))).toEqual(['M26']);
    expect(mensajesDespues(p('AMH'), 'No.')).toEqual(['M26']);
  });

  it('AM21 [Fue la única]: M25; delante de AM21 el acuse común es M26 (lo hereda de AM20)', () => {
    expect(mensajesDespues(p('AM21'), respuestaDeBoton('Fue la única'))).toEqual(['M25']);
    expect(acuseAntesDe('M3.2', 'M3', p('AM21'))).toBe('M26');
  });

  it.each([
    ['No.', 'no'],
    ['No, ya no.', 'no'],
    ['Ya no.', 'no'],
    ['Ya no, nos separamos hace como veinte años y cada uno hizo su vida.', 'no'],
    ['Falleció hace tres años, en invierno.', 'no'],
    ['Nos separamos en el noventa.', 'no'],
    ['Me divorcié hace mucho.', 'no'],
    ['Enviudé en el dos mil diez.', 'no'],
    ['Sí.', 'conto'],
    ['Sí, seguimos juntos, hace cuarenta años.', 'conto'],
    ['Sí, con Raúl; a mi primer marido lo perdí, falleció joven.', 'conto'],
  ])('AMH en audio: "%s" → %s', (resp, esperado) => {
    expect(que('AMH', resp)).toBe(esperado);
  });

  it('"ya no" y las palabras de final valen "no" solo en AMH', () => {
    expect(que('CA2', 'Ya no me acuerdo de la cara de mi abuela, pero sí de su voz cuando cantaba.')).not.toBe('no');
    expect(que('AM8', 'Falleció hace años y lo que guardo es un domingo en el río con él.')).toBe('conto');
  });
});

describe('7. bloque 6: cada vida', () => {
  const vida = (clave: VidaEjemplo['clave']) => VIDAS_EJEMPLO.find((v) => v.clave === clave)!;
  const pasos = (v: VidaEjemplo) => simularRecorrido(v.ficha, (id) => v.respuestas[id], {});
  const bloque6 = (ps: PasoRecorrido[]) => ps.flatMap((x) => (x.tipo === 'pregunta' && x.pregunta.bloque === 6 ? [x.pregunta.id] : []));
  const SIGUE = ['AM0', 'AMH', 'AM1', 'AM3', 'AM4', 'AM13', 'AM8', 'AM21', 'CI6'];
  const YA_NO = ['AM0', 'AMH', 'AM1', 'AM3', 'AM4', 'AM13', 'AM8', 'AM9', 'AM19', 'AM21', 'CI6'];
  const esperado: Record<VidaEjemplo['clave'], string[]> = {
    'sigue-con-la-primera': SIGUE,
    'separada-sola': YA_NO,
    'separada-de-nuevo-en-pareja': SIGUE,
    'viuda-sola': YA_NO,
    'viuda-rehizo': SIGUE,
    'muchas-parejas': SIGUE,
    'madre-soltera': ['AM0', 'AMH', 'AM1', 'AM3', 'AM8', 'AM9', 'AM21', 'CI6'],
    'nunca-pareja-con-hijos': ['AM0', 'AM14', 'AM15', 'CI6'],
    'nunca-pareja-sin-hijos': ['AM0', 'AM14', 'AM15', 'CI6'],
  };

  it.each(Object.entries(esperado))('%s', (clave, seq) => {
    expect(bloque6(pasos(vida(clave as VidaEjemplo['clave'])))).toEqual(seq);
  });

  it('la viuda de un solo amor nunca oye "terminó" sobre su historia ni el botón "Seguimos juntos"', () => {
    const ps = pasos(vida('viuda-sola')).filter((x) => x.tipo === 'pregunta' && x.pregunta.bloque === 6);
    const deSuHistoria = ps.flatMap((x) => (x.tipo === 'pregunta' && x.pregunta.id !== 'AM21' ? [x.pregunta.texto] : []));
    expect(deSuHistoria.join(' ')).not.toMatch(/termin/i);
    expect(ps.flatMap((x) => (x.tipo === 'pregunta' ? x.botones ?? [] : [])).map((b) => b.texto)).not.toContain('Seguimos juntos');
    // En AM21 "cómo terminó" es de las otras historias (y ella toca [Fue la única]).
    expect(texto('AM9')).toContain('una despedida');
  });

  it('quien sigue con su pareja no recibe ninguna pregunta de final', () => {
    for (const clave of ['sigue-con-la-primera', 'muchas-parejas', 'viuda-rehizo'] as const) {
      const ids = bloque6(pasos(vida(clave)));
      expect(ids, clave).not.toContain('AM9');
      expect(ids, clave).not.toContain('AM19');
    }
  });

  it('AMH [No estoy en pareja] y AM9 [Prefiero no contarla]: no va AM19 si no armaron la vida; AM21 va igual', () => {
    const base = { AM0: CUENTA, AMH: respuestaDeBoton('No estoy en pareja'), AM9: respuestaDeBoton('Prefiero no contarla') };
    expect(cumple(p('AM19'), r({ ...base, AM3: CUENTA }))).toBe(true);
    expect(cumple(p('AM19'), r({ ...base, AM3: respuestaDeBoton('No llegamos a eso') }))).toBe(false);
    expect(cumple(p('AM21'), r(base))).toBe(true);
  });
});

describe('8. acuses', () => {
  it('M4.4 sin "Cuando quieras, seguimos"', () => {
    expect(mensajePorId('M4.4')!.texto).toBe('Gracias por animarte a contarlo. Lo guardo con cuidado.');
  });

  it('M28.5 nuevo; M28.4 y M28.5 rotan: nunca dos iguales seguidos', () => {
    expect(mensajePorId('M28.5')!.texto).toBe('Con eso me alcanza, gracias. Vamos con otra.');
    const vueltas = vueltasEnCero();
    const ids = [0, 1, 2, 3].map(() => {
      const a = anotarAcuse('M28.4', vueltas);
      return acuseDeTurno(a.familia, a.n, 'Contame…', p('CA16'));
    });
    expect(ids).toEqual(['M28.4', 'M28.5', 'M28.4', 'M28.5']);
    expect(acuseDeTurno('M28.4', 1, '…', p('CI3'))).toBe('M26');
  });

  it('olvido sin pedacito: hasta 20 palabras, sin "pero", que repite la pregunta, es olvido (M28.1)', () => {
    const resp = 'No recuerdo, la verdad, algún maestro o maestra que me haya marcado en la primaria.';
    expect(que('ES2', resp)).toBe('olvido');
    expect(mensajesDespues(p('ES2'), resp)).toEqual(['M28']);
    // Contó un pedacito de verdad: sigue siendo olvido a medias.
    expect(que('CA1', 'No me acuerdo, éramos muy chicos y mi mamá nos llevaba a todos lados con el carro del pan.')).toBe('olvido-a-medias');
  });

  it('FO1 sin el nombre si el acuse pegado ya lo dice', () => {
    const acuse = mensajePorId('M28.4')!.texto;
    expect(preguntaSegunAcuse('FO1', texto('FO1'), acuse).startsWith('Otra cosa. ¿Hay alguna foto')).toBe(true);
    expect(preguntaSegunAcuse('FO1', texto('FO1'), 'Bien, seguimos.')).toBe(texto('FO1'));
    expect(preguntaSegunAcuse('FO1', texto('FO1'), undefined)).toBe(texto('FO1'));
    // Solo FO1: en OR6 el nombre es la pregunta.
    expect(preguntaSegunAcuse('OR6', texto('OR6'), acuse)).toBe(texto('OR6'));
  });
});

describe('el recorrido entero sigue andando', () => {
  it('una vida completa llega al final', () => {
    const v = VIDAS_EJEMPLO.find((x) => x.clave === 'viuda-sola')!;
    const ps = simularRecorrido(v.ficha, (id) => v.respuestas[id], {});
    expect(ps.at(-1)).toMatchObject({ tipo: 'pregunta', pregunta: { id: 'FIN' } });
    expect(siguientePregunta({ respuestas: new Map() })).toMatchObject({ pregunta: { id: 'OR1' } });
  });
});

// Naza, 30/09: no había ninguna pregunta de tatuajes. Versión A de Fable, núcleo, bloque 14 (HO7 y HO8 ya existieron).
describe('HO11: la marca en el cuerpo (tatuajes y cicatrices)', () => {
  it('está en el núcleo del bloque 14, antes de CO1, sin dependencias ni botones, con el texto aprobado', () => {
    expect(p('HO11')).toMatchObject({ bloque: 14, parte: 'nucleo', clase: 'historia', sensible: false, depende: [] });
    expect(p('HO11').botones ?? []).toEqual([]);
    const b14 = BANCO.filter((q) => q.parte === 'nucleo' && q.bloque === 14).map((q) => q.id);
    expect(b14.indexOf('HO11')).toBeLessThan(b14.indexOf('CO1'));
    expect(p('HO11').texto).toBe(
      '¿Tenés alguna marca en el cuerpo que tenga historia? Una cicatriz, un tatuaje, una quemadura de la cocina. Contame cómo te la hiciste: dónde estabas, cuántos años tenías, quién estaba con vos y qué pasó después. Y si no tenés ninguna que valga la pena, contame de una que tenga alguien de tu familia y que siempre pregunten de dónde salió.',
    );
  });
});

// Naza, 30/09: las ⭐ de la lista de extras pasan al núcleo (menos HG7, la primera tele).
describe('las 13 que pasaron de extra al núcleo', () => {
  const ids = ['OR6', 'OR6.2', 'CA10', 'CA14', 'ES8', 'JU13', 'HI7', 'HI12', 'PA3', 'AS7', 'HO4', 'HO10', 'G3'];
  it.each(ids)('%s está en el núcleo', (id) => {
    expect(p(id).parte).toBe('nucleo');
  });
  it('HG7 sigue en la extra; HI7 y HI12 solo si tuvo hijos', () => {
    expect(p('HG7').parte).toBe('extra');
    expect(p('HI7').depende).toEqual([{ tipo: 'si', de: 'HI0' }]);
    expect(p('HI12').depende).toEqual([{ tipo: 'si', de: 'HI0' }]);
  });
});
