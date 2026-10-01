// Arma las llamadas de la receta nueva (docs/v3/escritor/receta.md, sección 2).
// Uso: node llamada.mjs <carpeta> <paso> [arg]
//   pasos: registro | plan | primera | capitulo N | carta | sus_frases | hechos | lectura | arreglo <pieza> | libro
//   Con ERROR=<archivo> en el entorno, pega ese texto al final (reintento del paso 1 o 2).
// Deja el texto de la llamada en <carpeta>/llamadas/<paso>.txt (sus_frases y libro dejan salidas, no llamadas).
import path from 'node:path';
import { leer, existe, escribir, leerJSON, promptsDe, esquemaDe, guia, ficha, respuestas, respuestasXML, nombreDePila, salida, piezas, tituloImpreso } from './lib.mjs';
import { presentes } from './controles.mjs';

const [, , dirArg, paso, arg] = process.argv;
const dir = path.resolve(dirArg);

const LINEA = 'Los ejemplos de la guía son de una narradora inventada (Nélida). Quien narra en este libro es otra persona: su nombre, su género y su trato están en la ficha.';
const tag = (t, s) => `<${t}>\n${s.trim()}\n</${t}>`;

const registro = () => leerJSON(salida(dir, 'registro.json'));
const plan = () => leerJSON(salida(dir, 'plan.json'));
const voz = () => JSON.stringify(registro().voz, null, 1);
const base = () => [LINEA, tag('guia', guia()), tag('ficha', ficha(dir)), tag('respuestas', respuestasXML(respuestas(dir)))];
const libroComo = (ps) => ps.map((p) => `=== ${p.pieza} ===\n${p.texto.trim()}`).join('\n\n');
const conError = (instr) => (process.env.ERROR ? `${instr}\n\nTu respuesta anterior no pasó estos controles. Devolvé el JSON completo corregido:\n${leer(process.env.ERROR)}` : instr);

function llamadaEscritura(pieza) {
  const docs = [...base(), tag('registro', JSON.stringify(registro(), null, 1)), tag('plan', JSON.stringify(plan(), null, 1))];
  const hechas = piezas(dir).filter((p) => p.pieza !== 'sus_frases');
  let instr;
  if (pieza === 'primera_pagina') {
    instr = promptsDe('### Paso 3a')[0];
  } else if (pieza === 'carta') {
    docs.push(tag('libro_hasta_aca', libroComo(hechas.filter((p) => p.pieza !== 'carta'))));
    instr = promptsDe('### Paso 3c')[0];
  } else {
    const n = Number(pieza.replace('cap_', ''));
    const cap = plan().capitulos.find((c) => c.n === n);
    if (!cap) throw new Error(`El plan no tiene el capítulo ${n}`);
    const antes = hechas.filter((p) => p.pieza === 'primera_pagina' || (p.pieza.startsWith('cap_') && Number(p.pieza.slice(4)) < n));
    docs.push(tag('libro_hasta_aca', libroComo(antes)));
    instr = promptsDe('### Paso 3b')[0].replaceAll('{{N}}', String(n)).replaceAll('{{TITULO}}', tituloImpreso(cap));
  }
  docs.push(tag('voz', voz()));
  return { docs, instr: instr.replaceAll('{{NOMBRE}}', nombreDePila(dir)) };
}

function guardar(nombre, docs, instr) {
  const p = path.join(dir, 'llamadas', `${nombre}.txt`);
  // Las líneas largas se parten (en un espacio) para que el lector de archivos no las corte.
  const partir = (t) => t.split('\n').map((l) => (l.length <= 400 ? l : l.replace(/(.{1,400})(\s+|$)/g, '$1\n').trimEnd())).join('\n');
  escribir(p, partir(`${docs.join('\n\n')}\n\n${instr}\n`));
  console.log(`llamada lista: ${p} (${Math.round((docs.join('').length + instr.length) / 4 / 1000)}k tokens aprox.)`);
}

switch (paso) {
  case 'registro':
    guardar('1-registro', base(), conError(promptsDe('### Paso 1')[0] + esquemaDe('### Paso 1')));
    break;
  case 'plan':
    guardar('2-plan', [...base(), tag('registro', JSON.stringify(registro(), null, 1))], conError(promptsDe('### Paso 2 ·')[0] + esquemaDe('### Paso 2 ·')));
    break;
  case 'primera': {
    const { docs, instr } = llamadaEscritura('primera_pagina');
    guardar('3a-primera', docs, instr);
    break;
  }
  case 'capitulo': {
    const { docs, instr } = llamadaEscritura(`cap_${Number(arg)}`);
    guardar(`3b-capitulo-${String(Number(arg)).padStart(2, '0')}`, docs, instr);
    break;
  }
  case 'carta': {
    const { docs, instr } = llamadaEscritura('carta');
    guardar('3c-carta', docs, instr);
    break;
  }
  case 'sus_frases': {
    const sf = plan().sus_frases || [];
    escribir(salida(dir, 'sus_frases.md'), sf.map((f) => `> ${f.texto}\n\n${f.contexto}`).join('\n\n') + '\n');
    console.log(`sus_frases.md: ${sf.length} frases`);
    break;
  }
  case 'hechos': {
    const ps = piezas(dir);
    const docs = [...base(), tag('registro', JSON.stringify(registro(), null, 1)), tag('libro', libroComo(ps)),
      tag('presentes', presentes(ps).map((x) => `${x.pieza} §${x.parrafo}: ${x.oracion}`).join('\n'))];
    guardar('4-hechos', docs, promptsDe('### Paso 4')[0] + esquemaDe('### Paso 4'));
    break;
  }
  case 'lectura':
    guardar('5-lectura', [LINEA, tag('guia', guia()), tag('libro', libroComo(piezas(dir)))], promptsDe('### Paso 5')[0] + esquemaDe('### Paso 5'));
    break;
  case 'arreglo': {
    const pieza = arg; // primera_pagina | cap_N | carta
    const { docs, instr } = llamadaEscritura(pieza);
    const probs = leerJSON(path.join(dir, 'arreglos', `problemas-${pieza}.json`));
    const evitar = existe(path.join(dir, 'arreglos', `evitar-${pieza}.txt`)) ? [tag('evitar', leer(path.join(dir, 'arreglos', `evitar-${pieza}.txt`)))] : [];
    const actual = piezas(dir).find((p) => p.pieza === pieza);
    const idx = docs.findIndex((d) => d.startsWith('<voz>'));
    docs.splice(idx, 0, tag('pieza_actual', actual ? actual.texto : ''), ...evitar, tag('problemas', JSON.stringify(probs, null, 1)));
    guardar(`6-arreglo-${pieza}`, docs, `${instr}\n\n${promptsDe('### Paso 6')[0]}`);
    break;
  }
  case 'libro': {
    const p = plan();
    const ps = piezas(dir);
    const limpio = (t) => t.replace(/\s*\[\[cita:[^\]]*\]\]/g, '');
    const partes = [`# ${p.titulo_libro?.texto || ''}`];
    for (const x of ps) {
      if (x.pieza === 'sus_frases') partes.push(`# Sus frases\n\n${x.texto.trim()}`);
      else partes.push(limpio(x.texto.trim()));
    }
    escribir(path.join(dir, 'libro.md'), partes.join('\n\n') + '\n');
    console.log(`libro.md: ${partes.join(' ').split(/\s+/).length} palabras`);
    break;
  }
  default:
    console.error('paso desconocido'); process.exit(1);
}
