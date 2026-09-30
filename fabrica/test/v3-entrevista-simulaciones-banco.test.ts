// Lo que Naza aprobó el 30/09 después de las 6 simulaciones, pasado al banco
// (docs/v3/entrevista/simulaciones/textos-finales.md y PLAN-codigo.md): los
// textos exactos, las dependencias nuevas, el orden del amor y los botones.
// Los textos se comparan letra por letra: los aprobó Naza, no se tocan.

import { describe, expect, it } from 'vitest';
import { parsearEntrevistaMd } from '../src/v3/entrevista/banco-md.js';
import { BANCO, MENSAJES, mensajePorId, preguntaPorId } from '../src/v3/entrevista/banco.js';

const texto = (id: string) => preguntaPorId(id)?.texto;
const mensaje = (id: string) => mensajePorId(id)?.texto;
const dep = (id: string) => preguntaPorId(id)!.depende.map((c) => [c, ...(c.y ?? [])].map((x) => `${x.tipo}:${x.de}`).join(' y ')).join(' o ');

describe('textos de preguntas aprobados (textos-finales.md, sección 2, con los cambios de PLAN-codigo.md)', () => {
  const APROBADOS: Record<string, string> = {
    // Cambios de PLAN-codigo.md (variantes de Fable a "aunque ya me lo hayas nombrado", aprobadas por Naza).
    CA6: '¿Tuviste hermanos? Si ya salieron en la charla no importa, quiero saber más: contame con cuál eras más cercan{{o/a}} de chic{{o/a}} y alguna aventura que hayan hecho juntos; seguro tienen varias.',
    JU8: '¿Alguna vez te fuiste a vivir a otra ciudad o a otro país? Capaz ya me contaste algo de esa mudanza; ahora contame la llegada: el primer día, dónde dormiste esa noche, quién te esperaba y qué fue lo que más te costó.',
    HI0: 'Ahora vamos a los hijos. ¿Tuviste hijos, o criaste a alguno como si lo fuera? Presentámelos de a uno, incluso si alguno ya apareció en lo que me venís contando: cómo se llama cada uno y cuándo llegó. Y si no tuviste, seguimos por otro lado.',
    HI8: 'Ahora, los nietos. ¿Llegaron nietos a tu vida? Puede que ya los hayas mencionado; contame el día que conociste al primero, como si lo estuvieras viendo. Si no hay nietos, pasamos a otra cosa.',
    // Sección 2 de textos-finales.md.
    CA16: 'Contame un día de chic{{o/a}} que esperabas con muchas ganas: qué era, quién estaba, qué pasó. Y si no te vuelve un día en particular, contame qué cosas esperabas con ganas en esa época, que con eso me arreglo.',
    AD5: '¿Te acordás de la primera vez que saliste de noche, a un baile o a una fiesta? Contame cómo te preparaste, con quién fuiste y cómo fue esa noche. Y si la primera no te vuelve, contame cómo eran esas salidas en general.',
    JU12: 'Contame del primer lugar que fue tuyo, donde ya vivías por tu cuenta: cómo era, con qué lo fuiste armando, qué se veía por la ventana. Y esa primera noche ahí, ¿cómo fue? Si la noche justa no te vuelve, contame cómo eran los primeros tiempos ahí. Y si nunca te fuiste de la casa de tus viejos, contame el día en que esa casa pasó a ser tuya, o el rincón que siempre fue tuyo.',
    AM0: 'Ahora vamos al amor. ¿Hubo alguien con quien tuviste una historia en serio? Si hubo, haceme un repaso corto: cuántas veces te enamoraste, cuáles llegaron a algo serio, más o menos en qué años. Después te pregunto más de la primera que fue en serio, y de las que vinieron después también va a haber lugar. Y si no hubo, también vale.',
    AM1: 'Vamos a la primera que fue en serio. Contame el día que se conocieron: dónde fue, quién los presentó o cómo se cruzaron, y qué fue lo primero que te llamó la atención de esa persona. Si ya me lo contaste cuando hablamos de tu adolescencia, decímelo y vamos a lo que sigue.',
    AM3: 'Y después, ¿llegaron a armar la vida juntos: casarse, irse a vivir, lo que haya sido? Si llegaron, contame ese momento: quién lo dijo primero, o si se fue dando solo, dónde estaban, qué se dijeron. Si ya me lo contaste recién, con decírmelo alcanza.',
    AM4: 'Hay días que quedan grabados para siempre: el del casamiento, o el primero viviendo juntos. Contame ese día como si lo estuvieras viendo: el lugar, la gente, la ropa, lo que más te quedó. Si ya me lo contaste recién, con decírmelo alcanza.',
    AM13: 'Contame una pelea que tuvieron, de esas que después dan risa: por qué fue, quién aflojó primero y cómo hicieron las paces. Si no hubo ninguna que hoy dé risa, con decírmelo alcanza.',
    AM19: 'Y después, cuando quedaste por tu cuenta, ¿cómo fueron esos primeros tiempos? Qué cambió en la casa y en los días, quién anduvo cerca. Si ese tiempo es el de ahora, contame igual cómo lo estás llevando. Y si no hubo un tiempo así, con decírmelo alcanza.',
    // AM16 y AM20 cambiaron otra vez en la ronda 2 (Naza, 30/09): v3-entrevista-ronda2.test.ts.
    AM14: '¿Hubo algún amor que te marcó, aunque haya durado poco o no haya llegado a nada? Si lo hubo, contame cómo se cruzaron y el momento que más te acordás de esa persona. Y si no hubo, con un no alcanza.',
    PG1: 'Contame de tus viejos cuando vos ya eras grande, con tu propia vida. Una vez que los notaste más viejos, un gesto, algo chiquito, y qué te pasó a vos. Y si te tocó cuidarlos, contame cómo era un día de esos: qué hacías por ellos, qué te decían. Si no los tuviste cerca, contame cómo fue eso.',
    HS1: '¿Cómo fue criar a tus hijos? Quién estaba cerca, cómo se repartían las cosas, o si te tocó llevarla sol{{o/a}}. Contame un día de esa época que te acuerdes bien.',
    TR5: '¿Cuál fue el día de trabajo del que estás más orgullos{{o/a}}? No hace falta que haya sido grande: algo que salió bien, que alguien reconoció, o que solo vos sabés lo que costó. Contámelo. Y si no te viene un día puntual, contame de qué parte de tu trabajo estás más orgullos{{o/a}}.',
    HG4: 'Te quiero pedir un día concreto de la pandemia. No toda esa época: un solo día. Dónde estabas, con quién, qué hiciste, cómo te sentías. Pensá en el que más te haya quedado. Y si ninguno se te separa de los demás, contame cómo eran tus días entonces.',
    GI1: '¿Hay algún día de tu vida que, si pudieras, volverías a vivir tal cual? O un momento en que sentiste que algo hizo clic. Contámelo desde el principio: dónde estabas, con quién, y qué fue lo que pasó. Si es uno que ya me contaste, decímelo y, si querés, agregale lo que te faltó.',
    GI2: 'Pensá en un día que empezó como cualquier otro y terminó cambiándote algo. Contame ese día entero: cómo arrancó la mañana, en qué momento te diste cuenta de que ya no había vuelta atrás, y cómo terminó. Si ya me lo contaste, con decírmelo alcanza. Y si el día justo no te vuelve, contame lo que te acuerdes de esa época.',
    GI9: '¿Hubo algún momento en tu vida en que te sentiste chiquit{{o/a}} frente a algo enorme? Un cielo de noche, por ejemplo. Contame ese momento: dónde estabas, con quién, qué había alrededor. Y si no te vuelve un momento puntual, contame frente a qué cosas te pasa eso.',
    HO2: '¿Qué cosas te hacen gracia hoy, qué te hace reír? Contame la última vez que te reíste con ganas: dónde estabas y qué había pasado. Y si la última no te vuelve, contame con qué te reís seguido.',
    PE1: 'Puede que ya me hayas hablado de alguna pérdida; acá hay lugar para lo que no entró. Si perdiste a alguien importante, contame de cada uno lo que quieras: qué era para vos, cómo fueron los días de después y cómo lo fuiste llevando. Y si hay un momento con alguna de esas personas que te guste recordar, contámelo también.',
    PE4: '¿Hubo alguna época dura en tu vida de grande que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste. Y si ya me la contaste, con decírmelo alcanza.',
    CI1: 'Con esto cerramos lo de tu familia de antes, la de antes de que llegaras vos. Y me pregunto si se me escapó algo: una historia de tus abuelos, de tus viejos de jóvenes, de esa casa. Si hay una dando vueltas, contámela ahora. Y si algo se te viene más tarde, a cualquier hora, mandámelo cuando quieras: va al libro igual.',
    FO1: 'Otra cosa, {{nombre}}. ¿Hay alguna foto, en el celular o en algún cajón de tu casa, que quieras que quede para siempre en este libro? Si la tenés, sacale una foto y mandámela, y después contame en un audio qué se ve y quiénes están. Tomate el tiempo que necesites para buscarla: la pregunta que sigue te la mando cuando me llegue la foto o me digas algo. Y si no la encontrás, no pasa nada: el libro va igual, y la podés mandar más adelante.',
    // FIN sin "y es bien tuyo" (duda 4, Naza) y con la frase de la foto.
    // FIN: desde la ronda 2 la frase de la foto va con la variante «sino:FO1» (sin ella si tocó [No tengo foto]).
    FIN: 'Hasta acá llegamos, {{nombre}}. Gracias por cada audio, por cada historia y por la confianza de contarlas así. Con todo lo que me contaste vamos a armar un libro que va a quedar en tu familia para siempre. Antes de escribirlo vas a poder repasar lo que contaste, por si querés cambiar o agregar algo.«sino:FO1:  ‖  Y si te quedó alguna foto por mandar, mandámela por acá cuando la encuentres: entra igual.» Fue un gusto enorme escucharte.',
  };

  it.each(Object.entries(APROBADOS))('%s, letra por letra', (id, esperado) => {
    expect(texto(id)).toBe(esperado);
  });

  it('son 28 preguntas que cambian (con FO1 y FIN) más AM20, que es nueva (AM16 y AM20 se prueban en la ronda 2)', () => {
    expect(Object.keys(APROBADOS)).toHaveLength(27);
  });

  it('HI2b se saca del banco (Naza, 30/09: estorba; HI0 ya pide presentarlos a todos)', () => {
    expect(preguntaPorId('HI2b')).toBeUndefined();
  });

  it('AM9 no cambia de texto', () => {
    expect(texto('AM9')).toBe('Si esa historia tuvo un final, una separación o una despedida, ¿querés contármelo? Solo lo que vos quieras. Y si no querés, con decir "paso" alcanza; lo demás de tu historia sigue igual.');
  });
});

describe('mensajes fijos aprobados (textos-finales.md, sección 3)', () => {
  const APROBADOS: Record<string, string> = {
    'M3.3': 'Lo anoté, gracias. Sigo con otra.',
    'M3.6': 'Lo tengo, gracias. Vamos con otra.',
    'M3.7': 'Quedó guardado, {{nombre}}. Sigo con la que viene.',
    'M3.8': 'Te escuché bien. Vamos por la siguiente.',
    'M27.1': 'Está bien, {{nombre}}. Lo dejamos ahí y seguimos por otro lado.',
    'M27.2': 'Claro, sin problema. Vamos con otra.',
    'M27.3': 'Entiendo, {{nombre}}. No hace falta entrar ahí. Vamos con la que viene.', // ronda 2: sin "Perfecto"
    'M28.1': 'No pasa nada, {{nombre}}. Vamos con otra.',
    'M28.2': 'Está bien, no hay problema. Te pregunto otra cosa.',
    'M28.3': 'Tranquil{{o/a}}, no importa. Seguimos con la que viene.',
    M29: 'Una cosa, {{nombre}}: no te hagas problema si algo no te acordás. Para el libro alcanza con lo que sí tenés. Y si de alguna te acordás a medias, contame ese pedacito nomás: un olor, una cara, cómo era en general. Eso también es tu historia.',
    M30: 'Contame, te escucho.',
    M31: '_Podés tocar el botón de abajo, o contestarme en audio como siempre._',
  };

  it.each(Object.entries(APROBADOS))('%s, letra por letra', (id, esperado) => {
    expect(mensaje(id)).toBe(esperado);
  });

  it('M3.1, M3.2, M3.4 y M3.5 no cambian', () => {
    expect(mensaje('M3.1')).toBe('Gracias, {{nombre}}. Ya lo guardé.');
    expect(mensaje('M3.2')).toBe('Te escuché. Vamos con la que sigue.');
    expect(mensaje('M3.4')).toBe('Gracias por contármelo. Seguimos.');
    expect(mensaje('M3.5')).toBe('Guardado, {{nombre}}. Te mando la próxima.');
  });

  it('M28.2 y M28.3 quedan en el banco como reserva, sin uso (Naza)', () => {
    for (const id of ['M28.2', 'M28.3']) expect(mensajePorId(id)!.cuando, id).toMatch(/reserva, sin uso/i);
  });

  it('los mensajes nuevos van después de M26, antes de las dudas del dashboard', () => {
    const ids = MENSAJES.map((m) => m.id);
    expect(ids.slice(ids.indexOf('M26'), ids.indexOf('DD1'))).toEqual(['M26', 'M27.1', 'M27.2', 'M27.3', 'M28.1', 'M28.2', 'M28.3', 'M28.4', 'M29', 'M30', 'M31', 'M32.1', 'M32.2']);
  });
});

describe('dependencias y orden (textos-finales.md, reglas 19 a 25)', () => {
  it('AM4 y AM5 dependen de AM3 (regla 19)', () => {
    expect(dep('AM4')).toBe('si:AM3');
    expect(dep('AM5')).toBe('si:AM3');
  });

  it('AM13 depende de AM3 y va después de AM6 y antes de AM8 (regla 20)', () => {
    expect(dep('AM13')).toBe('si:AM3');
    const b6 = BANCO.filter((p) => p.bloque === 6).map((p) => p.id);
    expect(b6).toEqual(['AM0', 'AM1', 'AM2', 'AM3', 'AM4', 'AM5', 'AM6', 'AM13', 'AM8', 'AM9', 'AM7', 'AM19', 'AM16', 'AM20', 'AM17', 'AM14', 'AM15', 'CI6']);
  });

  it('AM20 es nueva, del núcleo, historia, no sensible, y depende de AM16 (regla 21)', () => {
    expect(preguntaPorId('AM20')).toMatchObject({ bloque: 6, parte: 'nucleo', clase: 'historia', sensible: false });
    expect(dep('AM20')).toBe('si:AM16');
  });

  it('HI8 depende de HI0 (regla 22); HI3, HS1 y HI6 de HI2 (regla 24)', () => {
    expect(dep('HI8')).toBe('si:HI0');
    for (const id of ['HI3', 'HS1', 'HI6']) expect(dep(id), id).toBe('si:HI2');
    expect(dep('HI2')).toBe('si:HI0');
  });
});

describe('botones (textos-finales.md, sección 1 y regla 1; PLAN-codigo.md)', () => {
  const botones = (id: string) => (preguntaPorId(id)!.botones ?? []).map((b) => `${b.texto}=${b.vale}`);

  it('las 9 que abren tema llevan Sí y No (AM9 además Paso esta)', () => {
    expect(botones('CA6')).toEqual(['Sí, tuve=si', 'No tuve hermanos=no']);
    expect(botones('JU8')).toEqual(['Sí, me mudé=si', 'No, nunca me mudé=no']);
    expect(botones('AM0')).toEqual(['Sí, hubo=si', 'No hubo=no']);
    expect(botones('AM3')).toEqual(['Sí=si', 'No llegamos a eso=no']);
    expect(botones('AM9')).toEqual(['Sí, hubo un final=si', 'Seguimos juntos=no', 'Paso esta=paso']);
    expect(botones('AM16')).toEqual(['Sí, hubo otro=si', 'No, nadie más=no']);
    expect(botones('AM20')).toEqual(['Sí, hubo=si', 'Nadie en el medio=no']);
    expect(botones('HI0')).toEqual(['Sí, tuve=si', 'No tuve hijos=no']);
    expect(botones('HI8')).toEqual(['Sí, llegaron=si', 'No hay nietos=no']);
  });

  it('las 7 sensibles llevan [Paso esta]; desde la ronda 2, CA17, AD15, JU17, TR11 y PE4 también [No, nada así]', () => {
    for (const id of ['PE1', 'PE5']) expect(botones(id), id).toEqual(['Paso esta=paso']);
    for (const id of ['CA17', 'AD15', 'JU17', 'TR11', 'PE4']) expect(botones(id), id).toEqual(['Paso esta=paso', 'No, nada así=no']);
  });

  it('los 14 cierres llevan solo [No, está todo]; FO1 [No tengo foto]', () => {
    for (let b = 1; b <= 14; b++) expect(botones(`CI${b}`), `CI${b}`).toEqual(['No, está todo=no']);
    expect(botones('FO1')).toEqual(['No tengo foto=no']);
  });

  it('son 31 preguntas con botones y ninguna otra', () => {
    expect(BANCO.filter((p) => p.botones).length).toBe(31);
  });

  it('máximo 3 botones por pregunta y 20 letras por botón (lo que acepta WhatsApp)', () => {
    for (const p of BANCO) {
      expect((p.botones ?? []).length, p.id).toBeLessThanOrEqual(3);
      for (const b of p.botones ?? []) expect([...b.texto].length, `${p.id}: ${b.texto}`).toBeLessThanOrEqual(20);
    }
  });
});

describe('el parser de la sección "## Botones"', () => {
  const md = (filas: string) =>
    [
      '## Bloque 1 · Origen',
      '',
      '| ID | Pregunta | Depende de | Parte | Clase | Sensible |',
      '|---|---|---|---|---|---|',
      '| OR1 | ¿Hola? |  | núcleo | historia |  |',
      '',
      '## Botones',
      '',
      '| ID | Botón | Vale como |',
      '|---|---|---|',
      filas,
      '',
      '## Reglas del flujo',
    ].join('\n');

  it('agrega los botones a su pregunta, en orden', () => {
    const b = parsearEntrevistaMd(md('| OR1 | Sí | sí |\n| OR1 | No | no |\n| OR1 | Paso esta | paso |'));
    expect(b.preguntas[0].botones).toEqual([
      { texto: 'Sí', vale: 'si' },
      { texto: 'No', vale: 'no' },
      { texto: 'Paso esta', vale: 'paso' },
    ]);
  });

  it('sin botones, la pregunta no lleva la propiedad', () => {
    const b = parsearEntrevistaMd(md(''));
    expect('botones' in b.preguntas[0]).toBe(false);
  });

  it('valida: pregunta que existe, "Vale como" conocido, hasta 3 botones y hasta 20 letras', () => {
    expect(() => parsearEntrevistaMd(md('| XX9 | Sí | sí |'))).toThrow(/XX9/);
    expect(() => parsearEntrevistaMd(md('| OR1 | Sí | tal vez |'))).toThrow(/Vale como/);
    expect(() => parsearEntrevistaMd(md('| OR1 | A | sí |\n| OR1 | B | no |\n| OR1 | C | no |\n| OR1 | D | no |'))).toThrow(/3 botones/);
    expect(() => parsearEntrevistaMd(md('| OR1 | No, nadie en el medio | no |'))).toThrow(/20 letras/);
  });
});
