// Arma la entrevista de UNA vida inventada tal como la vería la persona en
// WhatsApp, de punta a punta, mensaje por mensaje: cada globo del biógrafo es
// un mensaje de WhatsApp armado con `armarTurno` (el acuse pegado a lo que
// sigue, salvo el sobrio M4, que va solo). Las respuestas van como
// "[responde]" (salvo las que abren un tema, que muestran la respuesta corta
// de la vida de ejemplo, para que se entienda el camino).
// Vida INVENTADA: nunca la de un narrador real.
//
//   npx tsx scripts/v3-entrevista-lectura.ts <salida.md> [<salida.json>]

import { writeFileSync } from 'node:fs';
import { mensajePorId, NOMBRES_BLOQUE, BANCO, preguntaPorId } from '../src/v3/entrevista/banco.js';
import { acuseRotado, mensajesDespues, type PreguntaFamilia } from '../src/v3/entrevista/flujo.js';
import { acuseAntesDe, acuseNeutro, armarTurno, entradaSegunAcuse, type FamiliaAcuse } from '../src/v3/entrevista/mensajes.js';
import { cuentaComoPregunta, simularRecorrido } from '../src/v3/entrevista/seleccion.js';
import { renderizar, type FichaTexto } from '../src/v3/entrevista/texto.js';
import { VIDAS_EJEMPLO } from '../src/v3/entrevista/vidas-ejemplo.js';

/** Una línea de un mensaje, con el ID de donde sale. */
type Parte = { id: string; texto: string };
/** Un globo del chat: un mensaje de WhatsApp. Los títulos de bloque son solo para la lectura: la persona no los ve. */
type Globo =
  | { de: 'bio'; partes: Parte[]; propuesta?: string }
  | { de: 'persona'; texto: string }
  | { de: 'bloque'; bloque: number; nombre: string };

const [salidaMd, salidaJson] = process.argv.slice(2);
if (!salidaMd) throw new Error('Uso: npx tsx scripts/v3-entrevista-lectura.ts <salida.md> [<salida.json>]');

const vida = VIDAS_EJEMPLO.find((v) => v.clave === 'sigue-con-la-primera')!;
const ficha: FichaTexto = vida.ficha;
const EDAD = 72;
const FAMILIA: PreguntaFamilia[] = [{ id: 'FAM1', texto: '[acá va la pregunta que escribió alguien de la familia]' }];

const texto = (id: string) => renderizar(mensajePorId(id)!.texto, ficha);
const abreTema = new Set(BANCO.flatMap((p) => p.depende.map((c) => c.de)));

// Dos cierres contestados con un "no" corto y con "paso", para que se vea el acuse neutro (M25).
const RESPUESTAS_CORTAS: Record<string, string> = { CI9: 'No, nada más.', CI12: 'Paso' };
const responder = (id: string) => RESPUESTAS_CORTAS[id] ?? vida.respuestas[id];

const pasos = simularRecorrido(ficha, responder, { familia: FAMILIA });

// La bienvenida es un solo mensaje con párrafos (M6 ya no se manda).
const globos: Globo[] = [{ de: 'bio', partes: texto('BIEN').split('\n\n').map((t) => ({ id: 'BIEN', texto: t })) }];
const vueltas = { M3: 0, M4: 0, M24: 0, M25: 0 };
let bloqueActual = 0;
/** El acuse de la respuesta anterior: se arma con lo que se manda después. */
let acuse: { id: string; familia: FamiliaAcuse } | { familia: 'M25'; n: number } | undefined;

/**
 * Manda un turno: arma los mensajes con `armarTurno` sobre los IDs (así se
 * sabe qué línea es qué) y después pone los textos.
 */
function mandar(t: { entrada?: string; pregunta: string; conM1?: boolean }, textos: Record<string, string>): void {
  // El acuse se elige sabiendo qué sigue: el neutro (M25) mira con qué
  // arranca; el común (M3) pasa a M26 antes de un cierre o de LE9.
  const siguiente = t.entrada ? texto(t.entrada) : (textos[t.pregunta] ?? texto(t.pregunta));
  const quePregunta = preguntaPorId(t.pregunta) ?? { id: t.pregunta, clase: 'historia' as const };
  const idAcuse = acuse && ('n' in acuse ? acuseNeutro(acuse.n, siguiente) : acuseAntesDe(acuse.id, acuse.familia, quePregunta));
  // Si el acuse ya dice el nombre, la entrada del mismo mensaje va sin el nombre.
  if (t.entrada) textos[t.entrada] = renderizar(entradaSegunAcuse(mensajePorId(t.entrada)!.texto, idAcuse && mensajePorId(idAcuse)?.texto), ficha);
  const porId = armarTurno({ acuse: idAcuse, familia: acuse?.familia, entrada: t.entrada, pregunta: t.pregunta, m1: t.conM1 ? 'M1' : undefined });
  for (const m of porId) globos.push({ de: 'bio', partes: m.split('\n').map((id) => ({ id, texto: textos[id] ?? texto(id) })) });
  acuse = undefined;
}

for (const paso of pasos) {
  if (paso.tipo === 'ofrecer-extra') continue; // por ahora no se ofrece
  if (paso.tipo === 'familia') {
    mandar({ entrada: 'M15', pregunta: paso.pregunta.id }, { [paso.pregunta.id]: paso.pregunta.texto }); // el código no le pone M1
    globos.push({ de: 'persona', texto: '[responde]' });
    acuse = { id: acuseRotado('M3', vueltas.M3++), familia: 'M3' };
    continue;
  }
  const p = paso.pregunta;
  if (p.bloque !== bloqueActual) {
    bloqueActual = p.bloque;
    globos.push({ de: 'bloque', bloque: p.bloque, nombre: NOMBRES_BLOQUE[p.bloque] });
  }
  mandar({ entrada: paso.entrada, pregunta: p.id, conM1: paso.conM1 }, { [p.id]: p.texto });
  if (paso.respuesta === undefined) continue; // aviso y final: no esperan respuesta
  const corta = RESPUESTAS_CORTAS[p.id] ?? (abreTema.has(p.id) ? vida.respuestas[p.id] : undefined);
  globos.push({ de: 'persona', texto: corta ? `[responde: «${corta}»]` : '[responde]' });
  for (const fam of mensajesDespues(p, paso.respuesta)) {
    if (fam === 'M25') acuse = { familia: 'M25', n: vueltas.M25++ };
    else acuse = { id: fam === 'M21' ? fam : acuseRotado(fam, vueltas[fam]++), familia: fam };
  }
}

// ---------------------------------------------------------------- md

const preguntas = pasos.filter((p) => p.tipo === 'pregunta' && cuentaComoPregunta(p.pregunta)).length;
const partes = globos.flatMap((g) => (g.de === 'bio' ? g.partes : []));
const conM1 = partes.filter((x) => x.id === 'M1').length;
const mensajesBio = globos.filter((g) => g.de === 'bio').length;
const entradas = partes.filter((x) => x.id.startsWith('EN')).length;
const acusesSolos = globos.filter((g) => g.de === 'bio' && g.partes.length === 1 && /^M4\./.test(g.partes[0].id)).length;
const lineas: string[] = [
  '# La entrevista leída de corrido',
  '',
  `**Qué es:** la entrevista completa de una vida **inventada** (${ficha.nombre}, ${EDAD} años, varón, con hermanos, que se fue a otra ciudad, sigue con su primera pareja, tiene hijos y nietos; contesta "No, nada más." al cierre de lugares y "Paso" al de historia grande), tal como le llegaría por WhatsApp. Generada con el código de \`fabrica/src/v3/entrevista/\` por \`fabrica/scripts/v3-entrevista-lectura.ts\` (sin ronda extra).`,
  '',
  `**Cuenta:** ${preguntas} preguntas del banco (${conM1} con la frase de "paso" debajo) + ${FAMILIA.length} de la familia · **${mensajesBio} mensajes de WhatsApp del biógrafo** en total. Los agradecimientos van como primera línea del mensaje que sigue; solo los ${acusesSolos} sobrios van solos. ${entradas} frases de entrada de bloque.`,
  '',
  'Versión 8 (30/09, rondas 2 a 4, con la bienvenida final): CI14 sin el nombre; LE8 arranca sola, sin agradecimiento; bienvenida en un solo mensaje; agradecimiento pegado a lo que sigue (el sobrio va solo); "Gracias, {{nombre}}." antes de cada cierre y de LE9; neutro si un cierre o una pregunta difícil se contesta con un no o paso; la entrada sin el nombre si el agradecimiento ya lo dice; final LE7 → familia → FO1 → LE9 → LE8 → FIN. Registro en [`correcciones-lectura.md`](correcciones-lectura.md).',
  '',
  'Cómo leerlo: cada **Biógrafo** es un mensaje de WhatsApp (las líneas citadas debajo van juntas en ese mensaje); **Persona** es la respuesta (acá solo "[responde]"; en las preguntas que abren un tema va la respuesta corta de la vida de ejemplo). Los títulos de bloque y los IDs (entre corchetes) son para vos: la persona no los ve.',
  '',
];
for (const g of globos) {
  if (g.de === 'bloque') {
    lineas.push(`## Bloque ${g.bloque} · ${g.nombre}`, '');
  } else if (g.de === 'persona') {
    lineas.push(`**Persona:** ${g.texto}`, '');
  } else {
    const ids = [...new Set(g.partes.map((x) => x.id))].join(' + ');
    lineas.push(`**Biógrafo** \`[${ids}]\`${g.propuesta ? ` (PROPUESTA: ${g.propuesta})` : ''}:`);
    lineas.push(g.partes.map((x) => `> ${x.texto}`).join('\n>\n'), '');
  }
}
writeFileSync(salidaMd, lineas.join('\n'), 'utf8');
if (salidaJson) {
  writeFileSync(salidaJson, JSON.stringify({ nombre: ficha.nombre, edad: EDAD, preguntas, conM1, familia: FAMILIA.length, mensajesBio, entradas, acusesSolos, globos }, null, 1), 'utf8');
}
console.log(`${preguntas} preguntas (${conM1} con M1) · ${mensajesBio} mensajes del biógrafo (${acusesSolos} acuses sobrios solos) · ${globos.length} globos`);
