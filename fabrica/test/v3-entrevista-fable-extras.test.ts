// Lo que Fable propuso en su lectura de la prueba de Naza (30/09) y no entró
// en la primera tanda (Naza: "si son buenas objeciones, cambialas"), más dos
// decisiones de Naza de la misma tanda: AMH pasa a "¿Hoy estás en pareja?" y
// la salida "si ya me lo contaste" queda con sus palabras.
// Registro con ANTES/DESPUÉS y lo descartado: docs/v3/entrevista/simulaciones/textos-fable-extras.md.
// Los textos se comparan letra por letra.

import { describe, expect, it } from 'vitest';
import { BANCO, mensajePorId, preguntaPorId } from '../src/v3/entrevista/banco.js';
import { acuseRotado, mensajesDespues } from '../src/v3/entrevista/flujo.js';
import { acuseNegado } from '../src/v3/entrevista/mensajes.js';
import { interpretar } from '../src/v3/entrevista/respuesta.js';
import { simularRecorrido } from '../src/v3/entrevista/seleccion.js';

const p = (id: string) => preguntaPorId(id)!;
const texto = (id: string) => p(id).texto;
const que = (id: string, r: string) => interpretar(p(id), r);
const botones = (id: string) => (p(id).botones ?? []).map((b) => `${b.texto}=${b.vale}`);
const SALIDA = 'Si ya me lo contaste, decímelo, y si querés reforzar algo, es el momento.';

describe('preguntas que dicen en qué época están paradas', () => {
  it('AD6: "En esos años" (antes: "¿Y la primera vez…?", no se sabía si de muy chico o más grande)', () => {
    expect(texto('AD6')).toBe(
      'En esos años, ¿cuándo fue la primera vez que alguien te gustó en serio? Contame cómo se conocieron, cómo se llamaba, cómo era esa persona, y un momento de los dos que todavía llevás guardado.',
    );
  });

  it('JU17: "en esos años de empezar tu vida" en lugar de "juventud"', () => {
    expect(texto('JU17')).toBe(
      `¿Hubo algún momento duro en esos años de empezar tu vida que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste. ${SALIDA}`,
    );
    expect(texto('JU17')).not.toMatch(/juventud/);
  });
});

describe('textos sueltos', () => {
  it('CS1: "te salió tan bien" (antes "te lució", de acá)', () => {
    expect(texto('CS1')).toBe(
      'Fuera de lo tuyo, hay cosas que hacés bien y nadie te paga, cocinar para todos, cuidar a alguien, tener la casa andando. ¿Hay alguna que sea tuya? Contame una vez que te salió tan bien que la gente lo notó.',
    );
  });

  it('JU12: "Capaz ya me nombraste ese lugar; ahora contámelo por dentro"', () => {
    expect(texto('JU12')).toBe(
      'Contame del primer lugar que fue tuyo, donde ya vivías por tu cuenta. Capaz ya me nombraste ese lugar; ahora contámelo por dentro: cómo era, con qué lo fuiste armando, qué se veía por la ventana. Y esa primera noche ahí, ¿cómo fue? Si la noche justa no te vuelve, contame cómo eran los primeros tiempos ahí. Y si nunca te fuiste de la casa de tus viejos, contame el día en que esa casa pasó a ser tuya, o el rincón que siempre fue tuyo.',
    );
  });

  it('HO10: el texto de Fable, sin aire de "vicio"', () => {
    expect(texto('HO10')).toBe(
      '¿Hay algo que te acompaña todos los días, el café de la mañana, el mate, un cigarrillo, el vino de la cena? Contame cómo empezó y un momento con eso.',
    );
    expect(p('HO10').parte).toBe('nucleo');
  });

  it('HE2: sin "Si no tuviste hermanos" (solo le llega a quien tuvo)', () => {
    expect(texto('HE2')).toBe(
      'Ya de grandes, ¿tus hermanos también se volvieron amigos? Contame algún momento de adultos en que estuvieron bien cerca: un viaje, una charla, una mano que se dieron.',
    );
    expect(p('HE2').depende).toEqual([{ tipo: 'si', de: 'CA6' }]);
  });
});

describe('la salida "si ya me lo contaste", con las palabras de Naza', () => {
  it.each([
    ['AD15', `¿Hubo algún momento duro en tu adolescencia que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste. ${SALIDA}`],
    ['AM1', `Empecemos por su nombre. Y contame el día que se conocieron: dónde fue, quién los presentó o cómo se cruzaron, y qué fue lo primero que te llamó la atención de esa persona. ${SALIDA}`],
    ['AM3', `Y después, ¿llegaron a armar la vida juntos: casarse, irse a vivir, lo que haya sido? Si llegaron, contame ese momento: quién lo dijo primero, o si se fue dando solo, dónde estaban, qué se dijeron. ${SALIDA}`],
    ['AM4', `Hay días que quedan grabados para siempre: el del casamiento, o el primero viviendo juntos. Contame ese día como si lo estuvieras viendo: el lugar, la gente, la ropa, lo que más te quedó. ${SALIDA}`],
    ['PA1', `Fuera del trabajo y de la familia, ¿hubo algo que te apasionara de grande? Contame cómo empezó eso, y un día entero que le hayas dedicado, de la mañana a la noche. ${SALIDA}`],
    ['TR8', `Si tuviste un negocio o algo propio, aunque fuera chico, este es su lugar. ${SALIDA} Si quedó algo afuera, cómo empezó, de dónde salió la idea, con qué plata, un día de esos, contámelo ahora.`],
    ['GI1', `¿Hay algún día de tu vida que, si pudieras, volverías a vivir tal cual? O un momento en que sentiste que algo hizo clic. Contámelo desde el principio: dónde estabas, con quién, y qué fue lo que pasó. ${SALIDA}`],
    ['GI2', `Pensá en un día que empezó como cualquier otro y terminó cambiándote algo. Contame ese día entero: cómo arrancó la mañana, en qué momento te diste cuenta de que ya no había vuelta atrás, y cómo terminó. ${SALIDA} Y si el día justo no te vuelve, contame lo que te acuerdes de esa época.`],
    ['PE4', `¿Hubo alguna época dura en tu vida de grande que creas que no puede quedar afuera de tu historia? ¿Algo que te marcó? Si querés, contame qué pasó y cómo lo viviste. ${SALIDA}`],
  ])('%s', (id, t) => {
    expect(texto(id)).toBe(t);
  });

  it('son 10 (con JU17) y ninguna otra dice "ya me lo contaste" sin la salida (JU8 no es una salida: "Capaz ya me contaste algo de esa mudanza; ahora contame la llegada")', () => {
    const conSalida = BANCO.filter((q) => q.texto.includes(SALIDA)).map((q) => q.id);
    expect(conSalida.sort()).toEqual(['AD15', 'AM1', 'AM3', 'AM4', 'GI1', 'GI2', 'JU17', 'PA1', 'PE4', 'TR8']);
    const sinSalida = BANCO.filter((q) => /ya me (lo |la )?contaste/.test(q.texto) && !q.texto.includes(SALIDA)).map((q) => q.id);
    expect(sinSalida).toEqual(['JU8']);
    expect(BANCO.filter((q) => q.texto.includes('decime "ya te lo conté"')).map((q) => q.id)).toEqual([]);
  });

  it('decírselo corto es "ya te lo conté" (M25); si agrega, cuenta', () => {
    for (const id of ['AM3', 'PA1', 'GI2']) {
      expect(que(id, 'Ya te lo conté.'), id).toBe('ya-conto');
      expect(que(id, 'Ya te lo dije.'), id).toBe('ya-conto');
    }
    expect(mensajesDespues(p('PE4'), 'Ya te lo conté.')).toEqual(['M25']);
    expect(que('GI1', 'Ya te lo conté, pero quiero reforzar una cosa: ese día estaba toda la familia en la mesa y nadie sabía lo que venía.')).toBe('conto');
  });
});

describe('AMH: "¿Hoy estás en pareja?" (Naza, 30/09)', () => {
  it('texto y botones', () => {
    expect(texto('AMH')).toBe('Vamos a la pareja de ahora, o a la última si hoy no hay nadie. ¿Hoy estás en pareja?');
    expect(botones('AMH')).toEqual(['Sí, estoy en pareja=si', 'No estoy en pareja=no']);
    for (const b of p('AMH').botones!) expect(b.texto.length).toBeLessThanOrEqual(20);
  });

  it.each([
    ['Sí, estoy en pareja', 'conto'],
    ['Sí, hace un año', 'conto'],
    ['Estoy en pareja con Raúl hace cinco años.', 'conto'],
    ['No, no estoy en pareja', 'no'],
    ['No estoy en pareja.', 'no'],
    ['No, no estoy con nadie.', 'no'],
    ['Estoy sola', 'no'],
    ['Hoy estoy solo, desde hace un tiempo.', 'no'],
    ['Quedé sola hace diez años.', 'no'],
    ['No, hace años que no', 'no'],
    ['No tengo pareja.', 'no'],
    // Lo que ya valía sigue valiendo.
    ['No, estoy con otra persona, Hugo', 'conto'],
    ['Falleció hace tres años, en invierno.', 'no'],
    ['Estoy con Rubén, aunque a veces me siento sola.', 'conto'],
  ])('en audio: "%s" → %s', (resp, esperado) => {
    expect(que('AMH', resp)).toBe(esperado);
  });

  it('en el recorrido: "Estoy sola" lleva a AM9 (el final); "Sí, estoy en pareja" no', () => {
    const ficha = { nombre: 'Elsa', genero: 'mujer' as const };
    const bloque6 = (amh: string) =>
      simularRecorrido(ficha, (id) => (id === 'AMH' ? amh : undefined), {}).flatMap((x) => (x.tipo === 'pregunta' && x.pregunta.bloque === 6 ? [x.pregunta.id] : []));
    expect(bloque6('Estoy sola')).toContain('AM9');
    expect(bloque6('Sí, estoy en pareja')).not.toContain('AM9');
  });

  it('los textos del bloque no hablan de "esa persona que sigue a tu lado"', () => {
    const b6 = BANCO.filter((q) => q.bloque === 6).map((q) => q.texto).join(' ');
    expect(b6).not.toMatch(/sigue hoy a tu lado/);
  });
});

describe('acuses', () => {
  it('M24.4: "Queda guardado" (puede venir de un cierre pesado; antes "Cada detalle que agregás suma")', () => {
    expect(mensajePorId('M24.4')!.texto).toBe('Gracias por eso, {{nombre}}. Queda guardado.');
  });

  it('M27.1: sin "seguimos por otro lado" (lo que sigue suele ser otra difícil)', () => {
    expect(mensajePorId('M27.1')!.texto).toBe('Está bien, {{nombre}}. Lo dejamos ahí.');
  });

  it('M27.1 ya no termina en "seguimos": va también delante de "Seguimos…" o "Pasamos…", y M27 rota sin excepciones', () => {
    expect(acuseNegado(0, 'Seguimos con la escuela: la primaria…')).toBe('M27.1');
    expect(acuseNegado(3, 'Pasamos a tu juventud, Rogelio…')).toBe('M27.1');
    expect([0, 1, 2].map((n) => acuseNegado(n, 'Seguimos…'))).toEqual([0, 1, 2].map((n) => acuseRotado('M27', n)));
  });
});
