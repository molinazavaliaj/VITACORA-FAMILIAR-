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
  }
  if (paso.entrada) globos.push({ de: 'bio', id: paso.entrada, texto: texto(paso.entrada), bloque: p.bloque });
  globos.push({ de: 'bio', id: p.id, texto: p.texto, bloque: p.bloque, ...(paso.conM1 ? { m1: texto('M1') } : {}) });
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
const entradas = globos.filter((g) => g.de === 'bio' && g.id.startsWith('EN')).length;
const lineas: string[] = [
  '# La entrevista leída de corrido',
  '',
  `**Qué es:** la entrevista completa de una vida **inventada** (${ficha.nombre}, ${EDAD} años, varón, con hermanos, que se fue a otra ciudad, sigue con su primera pareja, tiene hijos y nietos), tal como le llegaría por WhatsApp. Generada con el código de \`fabrica/src/v3/entrevista/\` por \`fabrica/scripts/v3-entrevista-lectura.ts\` (banco del 30/09, sin ronda extra).`,
  '',
  `**Cuenta:** ${preguntas} preguntas del banco (${conM1} con la frase de "paso" debajo) + ${FAMILIA.length} de la familia · ${mensajesBio} mensajes del biógrafo en total (bienvenida, acuses, cierres, aviso y final incluidos), de los cuales ${entradas} son frases de entrada de bloque.`,
  '',
  'Versión 3 (30/09), con todo lo que aprobó Naza después de la primera lectura: frases de entrada de bloque, cierres de todos los bloques, M24 más cortos, CI14 nuevo, la frase de "paso" solo donde aplica y después de LE9 directo el final. Registro en [`correcciones-lectura.md`](correcciones-lectura.md).',
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
