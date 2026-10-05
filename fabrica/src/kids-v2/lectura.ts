// La entrevista completa de UNA chica INVENTADA, mensaje por mensaje, tal
// como la vería en WhatsApp: día, hora local y quién habla. Usa el motor de
// verdad (motor.ts) y los textos del banco: si una regla cambia, la lectura
// cambia. Puro: devuelve el md; scripts/kids-v2-lectura.ts lo escribe.
//
// Tini (Martina Sosa) y su familia NO existen. Nunca usar acá la vida de un
// narrador real.

import type { Ficha } from './compra.js';
import { correr, type Accion, type Conducta, type Corrida, type Linea } from './corrida.js';
import { aInstante, aLocal, diaDeSemana, diasEntre, sumarDias } from './horas.js';
import type { Evento, Mensaje } from './motor.js';

export const FICHA_LECTURA: Ficha = {
  nombre: 'Martina Sosa',
  apodo: 'Tini',
  genero: 'chica',
  edad: 11,
  quienRegala: 'Tus abuelos',
  canal: 'A',
  nombrePadre: 'Laura Sosa',
  linkPanel: 'vitacora.com/panel/tini',
  hora: '18:00',
  zona: 'America/Argentina/Buenos_Aires',
  temasSacados: ['papa'],
  fotosConOtrosChicos: false,
  preguntasPadre: [
    { texto: 'Contame el día que aprendiste a andar en bici sin rueditas.', conLinea: true },
    { texto: 'Contame la primera noche que dormiste en lo de una amiga.', conLinea: false },
  ],
};

/** Compra: martes 6/10/2026, 17:30 en Buenos Aires. */
export const DESDE_LECTURA = '2026-10-06T20:30:00.000Z';

const MIN = 60_000;
const audio = (seg: number, dice: string, transcripcion?: string): Omit<Accion, 'trasMs'> => ({
  evento: { tipo: 'respuesta', contenido: { tipo: 'audio', seg, ...(transcripcion ? { transcripcion } : {}) } },
  dice: `audio de ${seg} s: ${dice}`,
});
const texto = (t: string): Omit<Accion, 'trasMs'> => ({ evento: { tipo: 'respuesta', contenido: { tipo: 'texto', texto: t } }, dice: `escribe: ${t}` });
const foto = (dice: string): Omit<Accion, 'trasMs'> => ({ evento: { tipo: 'respuesta', contenido: { tipo: 'foto' } }, dice: `foto: ${dice}` });
const toca = (boton: string): Omit<Accion, 'trasMs'> => ({ evento: { tipo: 'boton', boton } as Evento, dice: `toca «${boton}»` });

/** Lo que hace Tini con cada mensaje que le llega: por ID (la primera vez) o por ID#vez; lo que no está, va por defecto. */
type Plan = { tras: number | { dias: number; hora: string }; hace: Omit<Accion, 'trasMs'> }[];
const GUION: Record<string, Plan> = {
  'BIEN-CHICO-PL': [{ tras: 20 * MIN, hace: toca('Dale, vamos') }],
  K1: [{ tras: 15 * MIN, hace: audio(75, 'la pileta de plástico en el patio de los abuelos, y un perro que se tomaba el agua') }],
  K2: [{ tras: 10 * MIN, hace: audio(6, 'una vez pinté la pared') }],
  'K2-OP': [{ tras: 8 * MIN, hace: audio(48, 'mi primo escondió las llaves del auto del tío adentro del freezer') }],
  K3: [{ tras: 12 * MIN, hace: audio(64, 'mi cumple de siete, con un mago que se olvidó el conejo') }],
  'K3-FOTO': [{ tras: 3 * MIN, hace: toca('No tengo') }],
  'B-FOTO-NOTENGO': [{ tras: 4 * MIN, hace: audio(22, 'un llavero con forma de choclo que me trajo la tía') }],
  K4: [{ tras: 9 * MIN, hace: texto('a la mancha congelada con los del edificio, la última vez fue en el cumple de Sofi') }],
  K5: [{ tras: 2 * MIN, hace: toca('Paso') }],
  K12: [{ tras: 2 * MIN, hace: toca('No tengo hermanos') }],
  'K12-R2': [{ tras: 3 * MIN, hace: audio(5, 'sí, una hermana') }],
  'K12-R2-2': [{ tras: 6 * MIN, hace: audio(70, 'Cami, la de al lado, dormimos juntas los viernes') }],
  K13: [{ tras: 2 * MIN, hace: toca('Sí') }],
  'K13-R1': [{ tras: 10 * MIN, hace: audio(80, 'el domingo con la abuela Nelly y el abuelo Tito haciendo ñoquis') }],
  K16: [{ tras: 2 * MIN, hace: toca('No tengo') }],
  'K11-FOTO': [{ tras: 2 * MIN, hace: toca('No hago') }],
  // Contesta K17 al otro día a la mañana (miércoles 14/10): el jueves a las 18 ya pasaron más de 24 h.
  K17: [{ tras: { dias: 1, hora: '11:00' }, hace: audio(55, 'la tía Ana, que canta tangos cuando cocina') }],
  'PREG-NUEVA-CHICO': [{ tras: 40 * MIN, hace: toca('Dale, mandámela') }],
  'CIERRE-2': [{ tras: 4 * MIN, hace: toca('Sí, hay algo') }, { tras: 6 * MIN, hace: audio(40, 'la seño Marta del jardín, que me sigue saludando') }],
  // K20: se calla cinco días (a los cuatro sale el recordatorio al padre).
  K20: [{ tras: { dias: 5, hora: '19:10' }, hace: toca('Sí, una vez') }],
  'K20-R1': [{ tras: 8 * MIN, hace: audio(50, 'el portero me prestó un paraguas') }],
  'K24-FOTO': [{ tras: 3 * MIN, hace: toca('Hoy no la como') }, { tras: 6 * MIN, hace: audio(30, 'milanesa con puré, el domingo pasado') }],
  K37: [{ tras: 14 * MIN, hace: audio(85, 'me echaron la culpa de romper un vidrio', 'me echaron la culpa de romper un vidrio y encima mi primo me pegó') }],
  'B-AVISO-SERIA': [{ tras: 5 * MIN, hace: toca('Mañana mejor') }],
  'B-AVISO-SERIA#2': [{ tras: 5 * MIN, hace: toca('Voy ahora') }],
  K39: [
    { tras: 20 * MIN, hace: audio(95, 'el día que se murió Pancho, mi perro') },
    { tras: 21 * MIN, hace: audio(35, 'lo enterramos en lo de los abuelos') },
  ],
  'B-TRANQUILA': [{ tras: 3 * MIN, hace: toca('Mañana sigo') }],
  'B-UNA-MAS': [{ tras: 2 * MIN, hace: toca('Dale, otra') }],
  'B-UNA-MAS#2': [{ tras: 2 * MIN, hace: toca('No, cerramos') }],
  'B-UNA-MAS#3': [{ tras: 2 * MIN, hace: toca('Dale, otra') }],
  // B-UNA-MAS#4 (cap. 4): no la contesta; al otro día, a la hora, sale el cierre.
  'EXTRAS-OFERTA': [{ tras: 10 * MIN, hace: toca('Dale, otra') }],
  'EXTRAS-OTRA': [{ tras: 5 * MIN, hace: toca('Dale, otra') }],
  'EXTRAS-OTRA#2': [{ tras: 5 * MIN, hace: toca('Lo dejamos acá') }],
};

const esPregunta = (m: Mensaje) => /^(K\d+(-R\d+(-\d+)?|-OP)?|X\d-\d+|PADRE-\d)$/.test(m.id) && !m.id.includes('FOTO');
const esFoto = (m: Mensaje) => m.id.endsWith('-FOTO') || (/^X\d-\d+$/.test(m.id) && m.botones[0] === 'No tengo');

export function chicaDeLaLectura(f: Ficha = FICHA_LECTURA): Conducta {
  const veces = new Map<string, number>();
  const seguirPorDia = new Map<string, number>();
  let n = 0;
  return (llegaron, { ahora }) => {
    const mios = llegaron.filter((m) => m.a === 'chico');
    const u = mios[mios.length - 1];
    if (!u) return [];
    const vez = (veces.get(u.id) ?? 0) + 1;
    veces.set(u.id, vez);
    const { fecha } = aLocal(ahora, f.zona);
    const plan = GUION[`${u.id}#${vez}`] ?? (vez === 1 ? GUION[u.id] : undefined);
    const ms = (t: Plan[number]['tras']) => (typeof t === 'number' ? t : aInstante(sumarDias(fecha, t.dias), t.hora, f.zona).getTime() - ahora.getTime());
    if (plan) return plan.map((p) => ({ trasMs: ms(p.tras), ...p.hace }));
    n++;
    if (esFoto(u)) return [{ trasMs: 6 * MIN, ...foto('la sacó con el celu de la mamá') }];
    if (esPregunta(u)) return [{ trasMs: (8 + (n % 7)) * MIN, ...audio(45 + ((n * 13) % 60), 'cuenta con detalle') }];
    if (u.id === 'B-SEGUIR') {
      const k = (seguirPorDia.get(fecha) ?? 0) + 1;
      seguirPorDia.set(fecha, k);
      return [{ trasMs: 2 * MIN, ...toca(k === 1 ? 'Dale, otra' : 'Mañana sigo') }];
    }
    if (/^CIERRE-/.test(u.id)) return [{ trasMs: 3 * MIN, ...toca('No, eso fue todo') }];
    return [];
  };
}

export function corridaDeLaLectura(): Corrida {
  return correr(FICHA_LECTURA, chicaDeLaLectura(), { desde: DESDE_LECTURA, dias: 90 });
}

/** "Tus abuelos" → "sus abuelos": el encabezado lo lee Naza, no la chica. */
const paraNaza = (quien: string) => quien.replace(/^tu(s?)(?=\s)/i, 'su$1');

const fechaCorta = (fecha: string) => `${Number(fecha.slice(8, 10))}/${Number(fecha.slice(5, 7))}`;

function lineaMd(l: Linea, f: Ficha): string[] {
  const { hora } = aLocal(l.en, f.zona);
  if (l.de === 'chico') return [`**${hora} · ${f.apodo}**  `, `_[${l.dice}]_`, ''];
  if (l.de === 'marca') return [`_(${hora} · Marca para Naza en el panel: ${l.motivo}, ${l.detalle}. A los padres no les llega nada.)_`, ''];
  const m = l.mensaje;
  const quien = m.a === 'padre' && f.canal === 'A' ? `Vitácora → ${f.nombrePadre.split(' ')[0]} (su WhatsApp)` : 'Vitácora';
  const extras = [m.botones.length ? m.botones.map((b) => `[${b}]`).join(' ') : '', m.plantilla ? `plantilla \`${m.plantilla.nombre}\`` : ''].filter(Boolean).join(' · ');
  return [`**${hora} · ${quien}** \`${m.id}\`${extras ? ` · ${extras}` : ''}  `, ...m.texto.split('\n').map((x) => `> ${x}`), ''];
}

export function lecturaCorrida(): string {
  const f = FICHA_LECTURA;
  const { lineas } = corridaDeLaLectura();
  const out = [
    '# Vitácora Kids V2 · Lectura corrida',
    '',
    'Una chica **inventada**, mensaje por mensaje, como le llegaría por WhatsApp. Generado por `fabrica/scripts/kids-v2-lectura.ts` con el motor de `fabrica/src/kids-v2/` y los textos de `banco.md` y `mensajes.md`: no editar a mano.',
    '',
    `- ${f.nombre} ("${f.apodo}"), ${f.edad} años. Se lo regalan ${paraNaza(f.quienRegala)}. Compra ${f.nombrePadre} (la mamá).`,
    `- Las preguntas van a su WhatsApp (canal A), a las ${f.hora}, hora de Buenos Aires.`,
    '- La mamá sacó el tema "Su papá": no sale K11, y su foto (el deporte) pasa a K16.',
    `- Preguntas de la mamá: «${f.preguntasPadre[0].texto}» (con la línea) · «${f.preguntasPadre[1].texto}» (sin decir que es de ella).`,
    '- Lo que contesta Tini va en cursiva y es inventado. Al lado de cada mensaje, el ID del banco de donde sale. Las notas entre paréntesis no las ve nadie: son para leer.',
    '',
  ];
  let fecha = '';
  let anterior: Date | null = null;
  for (const l of lineas) {
    const local = aLocal(l.en, f.zona);
    if (local.fecha !== fecha) {
      if (anterior) {
        const sin = diasEntre(aLocal(anterior, f.zona).fecha, local.fecha) - 1;
        if (sin > 0) out.push(`_(${sin === 1 ? 'Un día' : `${sin} días`} sin mensajes.)_`, '');
      }
      fecha = local.fecha;
      out.push(`## ${diaDeSemana(fecha)} ${fechaCorta(fecha)}`, '');
    }
    out.push(...lineaMd(l, f));
    anterior = l.en;
  }
  return out.join('\n');
}
