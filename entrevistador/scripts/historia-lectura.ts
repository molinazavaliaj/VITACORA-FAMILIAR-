// La lectura corrida de «Vitácora de una historia» (plan 2026-10-21, Task 3.5): una historia INVENTADA, mensaje por
// mensaje, tal como le llegaría por WhatsApp, para que Naza la lea. No se arma a mano: es lo que manda el bot de
// verdad (src/historia) sobre la base en memoria, con el banco real, un WhatsApp falso y un cazador falso que hace la
// repregunta que trae la vida (ninguna llamada a un modelo). Vida INVENTADA: nunca la de un narrador real.
//
//   npm run historia-lectura                    # escribe docs/historia/lectura-corrida.md

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { nombreDelTema } from '../src/historia/nucleo/entrevista/banco.js';
import { correr, type Narrador, type Vida } from './historia-simular.js';

/** Marta, 74 años, se fue de Tucumán a Barcelona en 1976. La regala su hijo Pablo, con una pregunta suya. */
const MARTA: Narrador = {
  semilla: 1, idioma: 'es-AR', tema: 'mudanza', temaAbierto: false, dudaTema: false, regalo: true,
  propias: ['¿Qué te hizo decidir quedarte cuando los primeros años fueron tan duros?'],
  genero: 'mujer', nombre: 'Marta', hora: '10:30:00', saluda: true, silencio: 0, foto: false,
};

const VIDA: Vida = {
  respuestas: {
    HC1: 'Vivía en Tucumán con mis viejos, en una casa con un limonero en el patio. Trabajaba en una tienda de telas en la calle Mendoza y los domingos íbamos al río con mis primas.',
    HC2: 'Era muy callada, pero terca. Una vez me planté frente al dueño de la tienda porque no le quería pagar las horas extra a una compañera, y al final se las pagó.',
    HC3: 'Fue una carta de mi tía Elvira desde Barcelona. Decía que había trabajo en un taller de costura y que me podía quedar con ella. La leí en la cocina y supe que me iba.',
    HC4: 'Me levanté a las cinco, mi mamá ya tenía el mate listo. No hablamos mucho. Mi papá me llevó a la estación en la camioneta y en todo el camino no dijo nada.',
    HM1: 'Una valija marrón de mi abuela. Metí tres vestidos, una foto de mis viejos y un frasco de dulce de cayote que se me rompió en el viaje. Lo último fue el rosario de mi mamá.',
    HM2: 'En la estación de Tucumán. Mi mamá me abrazó tan fuerte que me dolió, y me dijo al oído que no me olvidara de escribir. Mi papá me dio la mano, como a un hombre.',
    HM3: 'Una pieza en el piso de mi tía en el barrio de Gràcia, con una ventana que daba a un patio de luces. Tenía una cama de hierro que hacía ruido cada vez que me daba vuelta.',
    HM4: 'La primera semana en el taller una compañera me habló en catalán y yo me quedé mirándola. Pensé que me estaba retando. Después nos reímos mucho de eso.',
    HM5: 'El olor del limonero. Un día en el mercado de la Boquería vi limones y me puse a llorar delante de la verdulera, que me regaló dos.',
    HC5: 'El primer invierno, cuando mi tía se enfermó y el taller cerró. Me quedé sin trabajo y sin plata, y una noche armé la valija para volverme.',
    HC6: 'La señora Montse, la vecina de abajo. Me vio con la valija en la escalera y me hizo pasar a tomar un café. Me consiguió trabajo en la panadería de su cuñado.',
    HC7: 'Un sábado en la panadería, cuando un cliente me pidió el pan en catalán y le contesté sin pensar. Ahí sentí que ya era de acá también.',
    HC8: 'El día que me casé con Jordi, en 1981. Vinieron mis viejos desde Tucumán y mi mamá y la señora Montse se abrazaron como si se conocieran de siempre.',
    HC9: 'Cuando Pablo nació y me di cuenta de que le cantaba las canciones de mi mamá. Ahí entendí que no había dejado nada atrás, que lo había traído todo.',
    HC10: 'Le diría que no tenga miedo, que la valija pesa menos de lo que parece. Y que no se olvide de escribirle a la mamá.',
    'PR-H1': 'Por la señora Montse y por orgullo, Pablo. No quería volver vencida. Y porque en la panadería empecé a sentir que tenía un lugar.',
    'RP~HM2': 'En el tren lloré hasta Córdoba. Después saqué la foto de mis viejos y me quedé dormida con ella en la mano.',
    'RP~HC6': 'Me hizo pasar a su cocina y me dijo «aquí nadie se rinde el primer invierno». Todavía tengo la taza en la que me dio ese café.',
  },
  repreguntas: {
    HM2: { cita: 'Mi papá me dio la mano', pregunta: '¿Y después, cuando el tren arrancó, qué hiciste?' },
    HC6: { cita: 'Me vio con la valija en la escalera', pregunta: '¿Qué te dijo la señora Montse esa noche, cuando te hizo pasar?' },
  },
};

const r = await correr(MARTA, VIDA);
if (r.violaciones.length > 0) throw new Error(`La lectura dio violaciones: ${r.violaciones.map((v) => `${v.control}: ${v.detalle}`).join('; ')}`);
const dia0 = r.charla[0].en.getTime();
const mensajesBot = r.charla.filter((l) => l.de === 'bot').length;
const lineas = [
  '# Vitácora de una historia · La entrevista leída de corrido',
  '',
  `**Qué es:** la entrevista completa de una historia **inventada**, tal como le llegaría por WhatsApp. Marta, 74 años, se fue de Tucumán a Barcelona en 1976; se la regala su hijo Pablo, con una pregunta suya. Tema \`mudanza\` (en las preguntas: «${nombreDelTema('mudanza')}»). Al empezar saluda antes de decir que sí, y no tiene fotos.`,
  '',
  `**Cómo se generó:** con el bot de verdad (\`entrevistador/src/historia/\`) y el banco aprobado, por \`entrevistador/scripts/historia-lectura.ts\`. No se escribió a mano. Lo único falso es el cazador: hace las dos repreguntas que trae la vida inventada, sin llamar a ningún modelo.`,
  '',
  `**Cuenta:** ${r.preguntas} preguntas abiertas (contando la de Pablo y las dos repreguntas) · **${mensajesBot} mensajes del bot** en total.`,
  '',
  'Cómo leerlo: cada **Bot** es un mensaje de WhatsApp. **Marta** es lo que contesta: «🎤» es un audio, y acá va lo que dice. Los botones van entre corchetes al final del mensaje. El día cuenta desde que canjea el regalo.',
  '',
];
for (const l of r.charla) {
  const dia = Math.floor((l.en.getTime() - dia0) / 86_400_000) + 1;
  if (l.de === 'bot') lineas.push(`**Bot** (día ${dia}):`, l.texto.split('\n').map((t) => `> ${t}`).join('\n'), '');
  else lineas.push(`**Marta:** ${l.texto}`, '');
}
const salida = fileURLToPath(new URL('../../docs/historia/lectura-corrida.md', import.meta.url));
writeFileSync(salida, lineas.join('\n'), 'utf8');
console.log(`${r.preguntas} preguntas · ${mensajesBot} mensajes del bot → ${salida}`);
