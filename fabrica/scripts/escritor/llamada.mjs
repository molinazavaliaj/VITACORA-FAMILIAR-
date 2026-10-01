// Arma las llamadas de la receta nueva (docs/v3/escritor/receta.md, sección 2).
// Uso: node llamada.mjs <carpeta> <paso> [arg]
//   pasos: registro | plan | primera | capitulo N | antes | carta | sus_frases | hechos [repaso] | lectura | cotejo | arreglo <pieza> | libro
//   Con ERROR=<archivo> en el entorno, pega ese texto al final (reintento del paso 1 o 2).
// Deja el texto de la llamada en <carpeta>/llamadas/<paso>.txt (sus_frases y libro dejan salidas, no llamadas).
import path from 'node:path';
import { guiaDe, sinMarcas, leer, existe, escribir, leerJSON, promptsDe, esquemaDe, guia, ficha, respuestas, respuestasXML, nombreDePila, salida, piezas, tituloImpreso } from './lib.mjs';
import { presentes, pasados, referencias, decisionesAnteriores } from './controles.mjs';

const [, , dirArg, paso, arg] = process.argv;
const dir = path.resolve(dirArg);

const LINEA = 'La guía habla de "la narradora" y sus ejemplos, igual que los de las instrucciones, son de una narradora inventada (Nélida). Quien narra en este libro es otra persona: su nombre, su género y su trato están en la ficha, y se escribe con ese género.';
const tag = (t, s) => `<${t}>\n${s.trim()}\n</${t}>`;

const registro = () => leerJSON(salida(dir, 'registro.json'));
const plan = () => leerJSON(salida(dir, 'plan.json'));
const voz = () => JSON.stringify(registro().voz, null, 1);
const base = (paso) => [LINEA, tag('guia', guiaDe(paso)), tag('ficha', ficha(dir)), tag('respuestas', respuestasXML(respuestas(dir)))];
const libroComo = (ps) => ps.map((p) => `=== ${p.pieza} ===\n${p.texto.trim()}`).join('\n\n');
const conError = (instr) => (process.env.ERROR ? `${instr}\n\nTu respuesta anterior no pasó estos controles. Devolvé el JSON completo corregido:\n${leer(process.env.ERROR)}` : instr);

function llamadaEscritura(pieza) {
  const guiaPaso = { primera_pagina: 'primera', carta: 'carta', antes_de_cerrar: 'antes' }[pieza] || 'capitulo';
  const docs = [...base(guiaPaso), tag('registro', JSON.stringify(registro(), null, 1)), tag('plan', JSON.stringify(plan(), null, 1))];
  const hechas = piezas(dir).filter((p) => p.pieza !== 'sus_frases');
  let instr;
  if (pieza === 'primera_pagina') {
    instr = promptsDe('### Paso 3a')[0];
  } else if (pieza === 'carta') {
    docs.push(tag('libro_hasta_aca', libroComo(hechas.filter((p) => p.pieza !== 'carta'))));
    instr = promptsDe('### Paso 3c')[0];
  } else if (pieza === 'antes_de_cerrar') {
    docs.push(tag('libro_hasta_aca', libroComo(hechas.filter((p) => !['carta', 'antes_de_cerrar'].includes(p.pieza)))));
    instr = promptsDe('### Paso 3d')[0];
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
    guardar('1-registro', base('registro'), conError(promptsDe('### Paso 1')[0] + esquemaDe('### Paso 1')));
    break;
  case 'plan':
    guardar('2-plan', [...base('plan'), tag('registro', JSON.stringify(registro(), null, 1))], conError(promptsDe('### Paso 2 ·')[0] + esquemaDe('### Paso 2 ·')));
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
  case 'antes': {
    if (!(plan().antes_de_cerrar?.ids || []).length) { console.log('el plan no tiene antes_de_cerrar: no hay pieza'); break; }
    const { docs, instr } = llamadaEscritura('antes_de_cerrar');
    guardar('3d-antes-de-cerrar', docs, instr);
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
    // "hechos repaso": después del arreglo, con las decisiones de la ronda anterior (receta v3, C26). Sale en salidas/hechos-repaso.json.
    const repaso = arg === 'repaso';
    const arregladas = (p) => existe(path.join(dir, 'arreglos', `respuesta-${p.pieza}.txt`));
    const ps = piezas(dir).filter((p) => !repaso || arregladas(p));
    if (repaso && !ps.length) throw new Error('No hay piezas arregladas (arreglos/respuesta-<pieza>.txt): no hay repaso que hacer');
    const docs = [...base('hechos'), tag('registro', JSON.stringify(registro(), null, 1)), tag('libro', libroComo(ps)),
      tag('presentes', presentes(ps.map((p) => ({ ...p, texto: sinMarcas(p.texto) }))).map((x) => `${x.pieza} §${x.parrafo}: ${x.oracion}`).join('\n')),
      // receta v3.1, C27: pasados que nombran a alguien que sigue hoy
      tag('pasados', pasados(ps.map((p) => ({ ...p, texto: sinMarcas(p.texto) })), registro()).map((x) => `${x.pieza} §${x.parrafo} (${x.personas.join(', ')}): ${x.oracion}`).join('\n') || '(ninguna)')];
    if (repaso) docs.push(tag('decisiones_anteriores', JSON.stringify(decisionesAnteriores(dir), null, 1)));
    const [principal, agregado] = promptsDe('### Paso 4');
    if (repaso && !agregado) throw new Error('La receta no tiene el agregado del repaso en el Paso 4');
    guardar(repaso ? '4-hechos-repaso' : '4-hechos', docs, principal + esquemaDe('### Paso 4') + (repaso ? `\n\n${agregado}` : ''));
    break;
  }
  case 'cotejo': {
    // Paso 5b: respuestas y libro CON marcas; ni registro ni plan.
    guardar('5b-cotejo', [LINEA, tag('guia', guiaDe('cotejo')), tag('respuestas', respuestasXML(respuestas(dir))), tag('libro', libroComo(piezas(dir)))], promptsDe('### Paso 5b')[0] + esquemaDe('### Paso 5b'));
    break;
  }
  case 'lectura': {
    const ps = piezas(dir).map((p) => ({ ...p, texto: sinMarcas(p.texto) }));
    const refs = referencias(ps.filter((p) => p.pieza !== 'sus_frases')).map((x) => `${x.pieza} §${x.parrafo}: ${x.oracion}`).join('\n');
    guardar('5-lectura', [LINEA, tag('guia', guia()), tag('libro', libroComo(ps)), tag('referencias', refs || '(ninguna)')], promptsDe('### Paso 5 ·')[0] + esquemaDe('### Paso 5 ·'));
    break;
  }
  case 'arreglo': {
    const pieza = arg; // primera_pagina | cap_N | antes_de_cerrar | carta
    const { docs, instr } = llamadaEscritura(pieza);
    const probs = leerJSON(path.join(dir, 'arreglos', `problemas-${pieza}.json`));
    const evitar = existe(path.join(dir, 'arreglos', `evitar-${pieza}.txt`)) ? [tag('evitar', leer(path.join(dir, 'arreglos', `evitar-${pieza}.txt`)))] : [];
    const actual = piezas(dir).find((p) => p.pieza === pieza);
    const idx = docs.findIndex((d) => d.startsWith('<voz>'));
    docs.splice(idx, 0, tag('pieza_actual', actual ? actual.texto : ''), ...evitar, tag('problemas', JSON.stringify(probs, null, 1)));
    guardar(`6-arreglo-${pieza}`, docs, `${instr}\n\n${promptsDe('### Paso 6')[0]}${esquemaDe('### Paso 6')}`);
    break;
  }
  case 'libro': {
    const p = plan();
    const ps = piezas(dir);
    const limpio = (t) => sinMarcas(t).replace(/\s*\[\[cita:[^\]]*\]\]/g, '');
    const partes = [`# ${p.titulo_libro?.texto || ''}`];
    for (const x of ps) {
      if (x.pieza === 'sus_frases') partes.push(`# Sus frases\n\n${x.texto.trim()}`);
      else if (x.pieza === 'antes_de_cerrar') partes.push(`# Antes de cerrar\n\n${limpio(x.texto.trim())}`);
      else if (x.pieza === 'carta' && p.carta?.titulo) partes.push(`# ${p.carta.titulo}\n\n${limpio(x.texto.trim())}`);
      else partes.push(limpio(x.texto.trim()));
    }
    escribir(path.join(dir, 'libro.md'), partes.join('\n\n') + '\n');
    console.log(`libro.md: ${partes.join(' ').split(/\s+/).length} palabras`);
    break;
  }
  default:
    console.error('paso desconocido'); process.exit(1);
}
