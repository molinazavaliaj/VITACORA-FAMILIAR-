// Arma la entrevista de UNA vida inventada tal como la vería la persona en
// WhatsApp, de punta a punta: bienvenida, M6, cada pregunta con M1 en
// cursiva, el acuse que toca (rotando como el código), cierres, fines de
// etapa, el aviso del bloque 11, la pregunta de la familia y el final. Las
// respuestas van como "[responde]" (salvo las que abren un tema, que muestran
// la respuesta corta de la vida de ejemplo, para que se entienda el camino).
// Vida INVENTADA: nunca la de un narrador real.
//
//   npx tsx scripts/v3-entrevista-lectura.ts <salida.md> [<salida.json>]

import { writeFileSync } from 'node:fs';
import { mensajePorId, NOMBRES_BLOQUE, BANCO } from '../src/v3/entrevista/banco.js';
import { acuseRotado, mensajesDespues, type PreguntaFamilia } from '../src/v3/entrevista/flujo.js';
import { cuentaComoPregunta, simularRecorrido } from '../src/v3/entrevista/seleccion.js';
import { renderizar, type FichaTexto } from '../src/v3/entrevista/texto.js';
import { VIDAS_EJEMPLO } from '../src/v3/entrevista/vidas-ejemplo.js';

/** Un globo del chat. `bloque` solo para ordenar la lectura: la persona no lo ve. */
type Globo =
  | { de: 'bio'; id: string; texto: string; m1?: string; bloque?: number; propuesta?: boolean; nota?: string }
  | { de: 'persona'; texto: string }
  | { de: 'bloque'; bloque: number; nombre: string };

const [salidaMd, salidaJson] = process.argv.slice(2);
if (!salidaMd) throw new Error('Uso: npx tsx scripts/v3-entrevista-lectura.ts <salida.md> [<salida.json>]');

const vida = VIDAS_EJEMPLO.find((v) => v.clave === 'sigue-con-la-primera')!;
const ficha: FichaTexto = vida.ficha;
const EDAD = 72;
const FAMILIA: PreguntaFamilia[] = [{ id: 'FAM1', texto: '[acá va la pregunta que escribió alguien de la familia]' }];

// Frases de entrada por bloque: PROPUESTA de Fable (30/09), sin aprobar
// todavía. Se muestran marcadas para que Naza las lea en su lugar; cuando
// las apruebe pasan a banco.md y salen de acá. Sin entrada: 1 (OR1 ya
// arranca así), 6 (AM0) y 11 (AV11).
const ENTRADAS_PROPUESTAS: Record<number, string> = {
  2: 'Ahora vamos a tu infancia, {{nombre}}: la casa donde creciste y los de tu casa de entonces.',
  3: 'Seguimos con la escuela: la primaria, los maestros y los juegos de esa edad.',
  4: 'Ahora vamos a tu adolescencia: esos años en que uno deja de ser chic{{o/a}} y todavía no es grande.',
  5: 'Pasamos a tu juventud, {{nombre}}: cuando empezaste a armar tu propia vida.',
  7: 'Ahora vamos al trabajo y a tu oficio, {{nombre}}: lo que hiciste con tus días y con tus manos.',
  8: 'Ahora vamos a tu familia de grande, {{nombre}}. Empezamos por tus viejos.',
  9: 'Ahora vamos a los lugares que fueron tuyos y a las cosas que te apasionaron.',
  10: 'Ahora vamos a los amigos, {{nombre}}, y a la gente que te dio una mano en la vida.',
  12: 'Ahora salimos un poco de tu casa: vamos a las cosas grandes que pasaron en el país y en el mundo mientras vos vivías tu vida.',
  13: 'Ahora vamos a los días que te cambiaron algo: los buenos, los que te agarraron de sorpresa, y un par de preguntas para pensar un rato.',
  14: 'Dejamos el pasado un rato y venimos a hoy, {{nombre}}: cómo son tus días y qué te gusta ahora.',
  15: 'Ya estamos en la última parte, {{nombre}}: lo que te queda de todo esto y lo que querés dejarle a tu familia.',
};
/** CI14 propuesto por Fable (30/09): el de hoy no pregunta nada y ahora espera respuesta. */
const CI14_PROPUESTO = 'Con esto cerramos lo de hoy, {{nombre}}, y ya te conozco un poco más. ¿Quedó algo de tu vida de ahora que no tuvo su pregunta? Una costumbre, alguien que ves seguido, un rato del día que es tuyo. Contámelo ahora, tranquil{{o/a}}.';

const texto = (id: string) => renderizar(mensajePorId(id)!.texto, ficha);
const abreTema = new Set(BANCO.flatMap((p) => p.depende.map((c) => c.de)));

const pasos = simularRecorrido(ficha, (id) => vida.respuestas[id], { familia: FAMILIA });

const globos: Globo[] = [
  { de: 'bio', id: 'BIEN', texto: texto('BIEN') },
  { de: 'bio', id: 'M6', texto: texto('M6') },
];
const vueltas = { M3: 0, M4: 0, M24: 0 };
let bloqueActual = 0;

for (const paso of pasos) {
  if (paso.tipo === 'ofrecer-extra') continue; // por ahora no se ofrece
  if (paso.tipo === 'familia') {
    globos.push({ de: 'bio', id: 'M15', texto: texto('M15') });
    globos.push({ de: 'bio', id: paso.pregunta.id, texto: paso.pregunta.texto }); // el código no le pone M1
    globos.push({ de: 'persona', texto: '[responde]' });
    const id = acuseRotado('M3', vueltas.M3++);
    globos.push({ de: 'bio', id, texto: texto(id) });
    continue;
  }
  const p = paso.pregunta;
  if (p.bloque !== bloqueActual) {
    bloqueActual = p.bloque;
    globos.push({ de: 'bloque', bloque: p.bloque, nombre: NOMBRES_BLOQUE[p.bloque] });
    const entrada = ENTRADAS_PROPUESTAS[p.bloque];
    if (entrada) globos.push({ de: 'bio', id: `EN${p.bloque}`, texto: renderizar(entrada, ficha), bloque: p.bloque, propuesta: true });
  }
  const nota = p.id === 'CI14' ? `Propuesta de Fable para reemplazarlo: «${renderizar(CI14_PROPUESTO, ficha)}»` : undefined;
  globos.push({ de: 'bio', id: p.id, texto: p.texto, bloque: p.bloque, ...(paso.conM1 ? { m1: texto('M1') } : {}), ...(nota ? { nota } : {}) });
  if (paso.respuesta === undefined) continue; // aviso y final: no esperan respuesta
  globos.push({ de: 'persona', texto: abreTema.has(p.id) && vida.respuestas[p.id] ? `[responde: «${vida.respuestas[p.id]}»]` : '[responde]' });
  for (const fam of mensajesDespues(p, paso.respuesta)) {
    const id = fam === 'M3' || fam === 'M4' || fam === 'M24' ? acuseRotado(fam, vueltas[fam]++) : fam;
    globos.push({ de: 'bio', id, texto: texto(id) });
  }
}

// ---------------------------------------------------------------- md

const preguntas = pasos.filter((p) => p.tipo === 'pregunta' && cuentaComoPregunta(p.pregunta)).length;
const conM1 = globos.filter((g) => g.de === 'bio' && g.m1).length;
const mensajesBio = globos.filter((g) => g.de === 'bio').length;
const entradas = globos.filter((g) => g.de === 'bio' && g.propuesta).length;
const lineas: string[] = [
  '# La entrevista leída de corrido',
  '',
  `**Qué es:** la entrevista completa de una vida **inventada** (${ficha.nombre}, ${EDAD} años, varón, con hermanos, que se fue a otra ciudad, sigue con su primera pareja, tiene hijos y nietos), tal como le llegaría por WhatsApp. Generada con el código de \`fabrica/src/v3/entrevista/\` por \`fabrica/scripts/v3-entrevista-lectura.ts\` (banco del 30/09, sin ronda extra).`,
  '',
  `**Cuenta:** ${preguntas} preguntas del banco (${conM1} con la frase de "paso" debajo) + ${FAMILIA.length} de la familia · ${mensajesBio} mensajes del biógrafo en total (bienvenida, acuses, cierres, aviso y final incluidos), de los cuales ${entradas} son frases de entrada **propuestas, sin aprobar** (marcadas "PROPUESTA").`,
  '',
  'Versión del 30/09 con las decisiones de Naza después de la primera lectura: los cierres de todos los bloques van siempre, la frase de "paso" solo donde aplica, y después de LE9 va directo el final. Registro en [`correcciones-lectura.md`](correcciones-lectura.md).',
  '',
  'Cómo leerlo: **Biógrafo** es lo que manda la entrevista; **Persona** es la respuesta (acá solo "[responde]"; en las preguntas que abren un tema va la respuesta corta de la vida de ejemplo, para que se entienda por qué siguen las que siguen). Los títulos de bloque y los IDs (entre corchetes) son para vos: la persona no los ve.',
  '',
];
for (const g of globos) {
  if (g.de === 'bloque') {
    lineas.push(`## Bloque ${g.bloque} · ${g.nombre}`, '');
  } else if (g.de === 'persona') {
    lineas.push(`> **Persona:** ${g.texto}`, '');
  } else {
    lineas.push(`**Biógrafo** \`[${g.id}]\`${g.propuesta ? ' (PROPUESTA, sin aprobar)' : ''}: ${g.texto}`);
    if (g.m1) lineas.push(`${g.m1}`);
    if (g.nota) lineas.push(`> _Nota: ${g.nota}_`);
    lineas.push('');
  }
}
writeFileSync(salidaMd, lineas.join('\n'), 'utf8');
if (salidaJson) writeFileSync(salidaJson, JSON.stringify({ nombre: ficha.nombre, edad: EDAD, preguntas, conM1, familia: FAMILIA.length, mensajesBio, entradas, globos }, null, 1), 'utf8');
console.log(`${preguntas} preguntas (${conM1} con M1) · ${mensajesBio} mensajes del biógrafo · ${globos.length} globos`);
