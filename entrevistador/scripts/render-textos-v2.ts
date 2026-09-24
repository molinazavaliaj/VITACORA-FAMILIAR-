/**
 * Renderiza los prompts del esqueleto v2 para dos fichas (Naza, 27; Élida, 76) en un doc que Naza
 * aprueba antes del piloto. No llama al modelo ni a la base.
 * Uso: cd entrevistador && npx tsx scripts/render-textos-v2.ts > ../docs/esqueleto-v2-textos-para-aprobar.md
 */
import { armarGuion, GUION } from '../src/ia/guion-v2.js';
import { partirPromptPregunta, objetivoEnTexto, type Objetivo } from '../src/ia/pregunta-v2.js';
import { armarPromptEvaluar, armarPromptPedidos } from '../src/ia/evaluar-v2.js';
import { partirPromptPerfil, perfilVacio, type Perfil } from '../src/ia/perfil.js';
import type { PromptPartido } from '../src/ia/modelos-v2.js';
import { perfilEnTexto } from '../src/ia/encargo-entrevista.js';
import { pendientesParaPerfil } from '../src/manual/estado-v2.js';
import { armarSecuencia, proxima, avanzar, conNombrado } from '../src/ia/secuencia.js';
import { armarPromptReusar } from '../src/ia/reusar-v2.js';

const ANIO = 2026;
const dicho = (valor: string) => ({ valor, fuente: 'dicho' as const });
const persona = (nombre: string, vinculo: string, vive: 'si' | 'no' | 'no se sabe' = 'si') => ({ nombre, vinculo, vive, fuente: 'dicho' as const });
function naza(): Perfil {
  const p = perfilVacio();
  p.persona.edad = dicho('27'); p.persona.genero = dicho('hombre'); p.persona.comoHabla = dicho('vos'); p.persona.comoLeDicen = dicho('Naza'); p.persona.dondeViveHoy = dicho('Berga, Barcelona');
  p.personas.push(persona('Ariel', 'hermano mayor'), persona('Juan Manuel', 'hermano del medio'), persona('Ima', 'pareja actual'), persona('Meri', 'madre'), persona('Juan Domingo', 'padre'));
  p.etapas.push({ edades: '0 a 22', lugar: 'Martínez, provincia de Buenos Aires', conQuien: 'sus padres y sus dos hermanos', queHacia: 'el colegio, los graffitis, la música', fuente: 'dicho' }, { edades: 'desde los 23', lugar: 'Berga, Barcelona, España', conQuien: 'Fran y Ñaco', queHacia: 'música; hoy programa', fuente: 'dicho' });
  p.bisagras.push('A los 8 pasó del Saint John\'s al Fátima', 'A los 22 se fue a vivir a España');
  p.noSabemos.push('[juventud] Cómo se arreglaron con Ciano después del problema por Vicky', '[adulto joven] Qué es la libertad financiera para él');
  return p;
}
function elida(): Perfil {
  const p = perfilVacio();
  p.persona.edad = dicho('76'); p.persona.genero = dicho('mujer'); p.persona.comoHabla = dicho('vos'); p.persona.comoLeDicen = dicho('Élida'); p.persona.dondeViveHoy = dicho('Lanús');
  p.personas.push(persona('Rubén', 'marido', 'no'), persona('Marta', 'hija'), persona('Jorge', 'hijo'), persona('Sofía', 'nieta'), persona('Tomás', 'nieto'), persona('Lucas', 'nieto'), persona('Nélida', 'hermana'), persona('Rosa', 'madre', 'no'), persona('Juan', 'padre', 'no'));
  p.etapas.push({ edades: '0 a 18', lugar: 'Tucumán', conQuien: 'los abuelos', queHacia: 'la escuela y el campo', fuente: 'dicho' }, { edades: 'desde los 19', lugar: 'Lanús, Buenos Aires', conQuien: 'Rubén', queHacia: 'costurera', fuente: 'dicho' });
  p.bisagras.push('A los 19 se vino a Buenos Aires', 'A los 60 murió Rubén');
  p.tono = 'Infancia en el campo, dura pero con los abuelos cerca.';
  return p;
}
const bloque = (t: string) => `\n\`\`\`\n${t.trim()}\n\`\`\`\n`;
/** Ajuste B: el prompt como se manda (lo fijo primero, cacheado). La marca del medio no va al modelo. */
const partido = (p: PromptPartido) => `${p.fijo}\n\n[— hasta acá la parte fija, cacheada; lo que sigue cambia en cada llamada —]${p.variable}`;
const out: string[] = [];
out.push('# Esqueleto v2 — los textos que aprueba Naza (generado con `scripts/render-textos-v2.ts`)\n');
out.push('> **Pendiente de aprobación de Naza** (los prompts cambiaron: la Tarea 12 del plan los rinde acá).\n');
out.push('> Regenerar: `cd entrevistador && npx tsx scripts/render-textos-v2.ts > ../docs/esqueleto-v2-textos-para-aprobar.md` (no llama al modelo ni a la base: dos fichas sintéticas, fijas en el script).\n');
out.push('> Nada de esto se manda solo: son los prompts (lo que lee el modelo). El texto que ve la persona lo escribe el modelo con esto. Lo que cambie acá se cambia en el código con su test.\n');
out.push('## 1. Las filas del guion, como las lee el biógrafo\n');
for (const f of GUION) out.push(`**${f.id}** (${f.etapa})\n> ${f.tema}${f.pormenores.length ? `\n> Pormenores: ${f.pormenores.join('; ')}` : ''}\n`);
for (const [nombre, p] of [['Naza (27)', naza()], ['Élida (76)', elida()]] as const) {
  const { filas, caidas } = armarGuion(p, ANIO);
  out.push(`## El guion de ${nombre}: ${filas.length - 1} preguntas\n`);
  out.push(filas.map((f) => `- ${f.id} (${f.bloque})`).join('\n') + '\n');
  out.push(`Se cayeron: ${caidas.map((c) => `${c.id} (${c.motivo})`).join(', ') || 'ninguna'}\n`);
  out.push(`### La ficha de ${nombre}, en texto (${perfilEnTexto(p).length} caracteres)\n${bloque(perfilEnTexto(p))}`);
  const fila = filas.find((f) => f.id === 'padres-como-eran')!;
  const o: Objetivo = { tipo: 'nucleo', ...fila };
  out.push(`### El prompt de la pregunta (${fila.id}) para ${nombre}\n${bloque(partido(partirPromptPregunta(p, o, [{ pregunta: '¿Qué ves al entrar a esa casa?', respuesta: 'Una casa de tres pisos, mi mamá en la cocina.' }], [{ id: 'casa-infancia', tema: 'La casa de la infancia' }, { id: 'los-tuyos-hoy', tema: 'Quiénes son los suyos hoy' }])))}`);
  out.push(`### El prompt de la evaluación para ${nombre}\n${bloque(armarPromptEvaluar(p, o, '¿Cómo eran tu mamá y tu papá?', 'Mi mamá era brava. Mi papá cocinaba.', 25, [], []))}`);
  const rep: Objetivo = { tipo: 'repregunta', id: 'padres-como-eran-repregunta', tramo: 'infancia', pregunta: '¿Cómo eran tu mamá y tu papá?', falto: ['en qué se parece', 'una escena de cada uno'] };
  out.push(`### El objetivo de la repregunta para ${nombre}\n${bloque(objetivoEnTexto(rep, p))}`);
  // Ajuste E (25/09): una fila que la ficha dio por contada no se tacha; se pregunta igual, con una línea más en el objetivo.
  let sec = armarSecuencia(p, ANIO);
  for (let i = 0; proxima(sec) && proxima(sec)!.id !== 'la-escuela'; i++) sec = avanzar(sec, proxima(sec)!, i);
  sec = { ...sec, nombrados: { 'la-escuela': 'la-cuadra-y-los-juegos' } };
  out.push(`### El objetivo de una fila ya nombrada (ajuste E: la-escuela, que ya tocó en la cuadra y los juegos) para ${nombre}\n${bloque(objetivoEnTexto(conNombrado(sec, proxima(sec)!), p))}`);
  out.push(`### El prompt de la ficha para ${nombre}\n${bloque(partido(partirPromptPerfil(p, '¿Cómo eran tu mamá y tu papá?', 'Mi mamá era brava. Mi papá cocinaba.', pendientesParaPerfil(armarSecuencia(p, ANIO)))))}`);
}
out.push(`## El prompt de los pedidos (repreguntas y objetos, Haiku)\n${bloque(armarPromptPedidos('De esa época no tengo nada, che.'))}`);
// Ajuste D (24/09): solo en el piloto que reusa respuestas viejas (`empezar --reusar`). Sonnet, sin pensar.
const escuela = armarGuion(naza(), ANIO).filas.find((f) => f.id === 'la-escuela')!;
out.push(`## El prompt de la búsqueda de respuesta vieja (solo en el piloto que reusa, ajuste D; Sonnet)\n${bloque(armarPromptReusar({ tipo: 'nucleo', ...escuela }, '¿Te acordás de alguna maestra o de algún compañero de la primaria?', [
  { corto: 'R4', pregunta: '¿Cómo era la casa donde te criaste?', respuesta: 'Una casa de tres pisos en Martínez, mi vieja en la cocina, el patio con el limonero.' },
  { corto: 'R7', pregunta: '¿Qué te acordás del colegio?', respuesta: 'Hice hasta tercero en el Saint John\'s y a los 8 me pasaron al Fátima. Ahí conocí a Fran, que sigue siendo mi mejor amigo.' },
]))}`);
process.stdout.write(out.join('\n'));
