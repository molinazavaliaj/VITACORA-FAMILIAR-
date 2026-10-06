// Arma las llamadas de la receta nueva (docs/v3/escritor/receta.md, sección 2).
// Uso: node llamada.mjs <carpeta> <paso> [arg]
//   pasos: registro | plan | primera | capitulo N | antes | carta | sus_frases | hechos [repaso] | lectura | cotejo | arreglo <pieza> | libro
//   Con ERROR=<archivo> en el entorno, pega ese texto al final (reintento del paso 1 o 2).
// Deja el texto de la llamada en <carpeta>/llamadas/<paso>.txt (sus_frases y libro dejan salidas, no llamadas).
import path from 'node:path';
import { idsDeCapitulo, guiaDe, sinMarcas, leer, existe, escribir, leerJSON, promptsDe, esquemaDe, guia, ficha, respuestas, respuestasXML, nombreDePila, salida, piezas, tituloImpreso, marcas, idioma, titulosFijos } from './lib.mjs';
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
  // v5 (novelista con red): el capítulo recibe solo las respuestas de su etapa (más las que otros capítulos le pasaron).
  if (pieza.startsWith('cap_')) {
    const ids = idsDeCapitulo(dir, Number(pieza.slice(4)));
    docs[3] = tag('respuestas', respuestasXML(respuestas(dir).filter((r) => ids.has(r.id))));
  }
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

// ---------- v5.1, novelista puro en todo el libro (Naza 03/10) ----------
const aR = (ids) => { const eps = Object.fromEntries((registro().episodios || []).map((e) => [e.id, e.ids])); return [...new Set((ids || []).flatMap((i) => (/^E\d+$/.test(i) ? eps[i] || [] : [i])).filter((i) => /^R\d+$/.test(i)))]; };
/** Respuestas en el orden del tiempo (el del plan, que es cronológico) y con su "cuándo" del registro. */
function respuestasEnElTiempo(ids) {
  const reg = registro(), p = plan(), orden = new Map(), cuando = new Map();
  const ep = Object.fromEntries((reg.episodios || []).map((e) => [e.id, e]));
  // "cuándo": primero el del registro (el de un episodio que lo tenga); si ninguno lo tiene, la etapa del capítulo donde aparece.
  for (const e of reg.episodios || []) if (e.cuando) for (const r of e.ids) if (!cuando.has(r)) cuando.set(r, e.cuando);
  for (const c of p.capitulos) for (const pz of c.piezas || []) for (const r of ep[pz.episodio]?.ids || []) if (!orden.has(r)) { orden.set(r, orden.size); if (!cuando.has(r)) cuando.set(r, c.etapa || ''); }
  const rs = respuestas(dir).filter((r) => ids.has(r.id)).sort((a, b) => (orden.get(a.id) ?? 1e9) - (orden.get(b.id) ?? 1e9) || Number(a.id.slice(1)) - Number(b.id.slice(1)));
  return rs.map((r) => `<respuesta id="${r.id}" cuando="${(cuando.get(r.id) || '').replace(/"/g, "'")}">\n<pregunta>${r.pregunta}</pregunta>\n<texto>${r.texto}</texto>\n</respuesta>`).join('\n\n');
}
/** Fichas cortas de lo ya escrito (salidas/resumenes/<pieza>.md), en orden. */
function resumenHastaAca(antesDe) {
  const ps = piezas(dir).filter((x) => x.pieza !== 'sus_frases' && antesDe(x.pieza));
  return ps.map((x) => { const f = salida(dir, path.join('resumenes', `${x.pieza}.md`)); return existe(f) ? `=== ${x.pieza} ===\n${leer(f).trim()}` : ''; }).filter(Boolean).join('\n\n') || '(todavía nada)';
}
const idsDePieza = (pieza) => {
  const p = plan();
  if (pieza === 'primera_pagina') return new Set(aR([...(p.primera_pagina?.que_dice_de_si_ids || []), ...(p.primera_pagina?.cosa_concreta?.ids || [])]));
  if (pieza === 'carta') return new Set(aR(p.carta?.ids));
  if (pieza === 'antes_de_cerrar') return new Set(aR(p.antes_de_cerrar?.ids));
  return idsDeCapitulo(dir, Number(pieza.slice(4)));
};
/** v5.2: el golpe del capítulo (plan.golpe), lo que lo prepara y su frase, para el armador y el novelista. */
function golpeTexto(g, propias) {
  if (!g) return '(esta etapa no tiene un golpe: contá su hilo)';
  const ep = Object.fromEntries((registro().episodios || []).map((e) => [e.id, e]));
  const rs = Object.fromEntries(respuestas(dir).map((r) => [r.id, r.texto]));
  const linea = (id) => { const e = ep[id]; return e ? `${id} — ${e.que || ''} (${(e.ids || []).join(', ')}${(e.ids || []).some((i) => propias.has(i)) ? '' : '; de otra etapa: está en <para_preparar>, va como recuerdo breve'})` : id; };
  return [
    `El golpe: ${linea(g.episodio)}`,
    `Lo prepara, en este orden: ${(g.preparacion || []).length ? '' : '(nada en el plan)'}`,
    ...(g.preparacion || []).map((e) => `- ${linea(e)}`),
    g.frase_id ? `Su frase está en ${g.frase_id}: "${rs[g.frase_id] || ''}". Elegí de ahí la frase que lo dice, con sus palabras, y ponela en el golpe o en su salida.` : '',
    'Los tres van en este capítulo: la preparación antes, el golpe con su tiempo, la frase en el golpe o en su salida.',
  ].filter(Boolean).join('\n');
}

function llamadaPura(pieza) {
  const p = plan(), nombre = nombreDePila(dir);
  const docs = [tag('ficha', ficha(dir)), tag('voz', voz()), tag('respuestas', respuestasEnElTiempo(idsDePieza(pieza)))];
  if (pieza === 'primera_pagina') {
    // v5.3: la primera página se escribe al final, con las fichas de todo el libro y sin las respuestas que ya marcó un capítulo.
    const enCaps = new Set(piezas(dir).filter((x) => x.pieza.startsWith('cap_')).flatMap((x) => marcas(x.texto)));
    const todas = idsDePieza(pieza), libres = new Set([...todas].filter((i) => !enCaps.has(i)));
    docs[2] = tag('respuestas', respuestasEnElTiempo(libres.size >= 3 ? libres : todas));
    docs.push(tag('resumen_hasta_aca', resumenHastaAca((x) => x !== 'primera_pagina')));
    const aviso = process.env.ERROR ? `\n\nTu versión anterior repetía tramos de otras piezas del libro. Escribila de nuevo sin contar nada de esto:\n${leer(process.env.ERROR)}` : '';
    return { docs, instr: promptsDe('### Paso 3a puro')[0].replaceAll('{{NOMBRE}}', nombre) + aviso };
  }
  if (pieza === 'carta' || pieza === 'antes_de_cerrar') {
    docs.push(tag('resumen_hasta_aca', resumenHastaAca((x) => !['carta', 'antes_de_cerrar'].includes(x))));
    return { docs, instr: promptsDe(pieza === 'carta' ? '### Paso 3c puro' : '### Paso 3d puro')[0].replaceAll('{{NOMBRE}}', nombre) };
  }
  const n = Number(pieza.slice(4)), cap = p.capitulos.find((c) => c.n === n), a = cap?.anios || {};
  const propias = idsDePieza(pieza);
  // Lo que prepara la historia de este capítulo, de OTRAS etapas (plan.preparacion e imagen): se recuerda, no se vuelve a contar.
  // v5.2: lo que prepara el golpe (plan.golpe.preparacion) también, si es de otra etapa.
  const g = cap?.golpe?.episodio ? cap.golpe : null;
  const prep = new Set(aR([...(cap?.preparacion || []), ...(g?.preparacion || []), ...(cap?.imagen?.ids || []), cap?.imagen?.episodio].filter(Boolean)).filter((i) => !propias.has(i)));
  docs.push(tag('para_preparar', prep.size ? respuestasEnElTiempo(prep) : '(nada)'));
  docs.push(tag('golpe', golpeTexto(g, propias)));
  docs.push(tag('resumen_hasta_aca', resumenHastaAca((x) => x === 'primera_pagina' || (x.startsWith('cap_') && Number(x.slice(4)) < n))));
  const etapa = `${cap?.etapa || ''}${a.desde ? ` (${a.desde}–${a.hasta || 'hoy'})` : ''}`;
  // v5.1: el mapa del armador (paso 2h), si ya está.
  const hist = salida(dir, path.join('historias', `cap_${n}.md`));
  if (existe(hist)) docs.push(tag('historias', leer(hist)));
  if (process.env.ARMADOR) {
    // Paso 2h: el armador recibe lo mismo que el escritor (sin voz ni ficha) más los episodios del registro de este capítulo.
    const eps = (registro().episodios || []).filter((e) => e.ids.some((i) => propias.has(i) || prep.has(i))).map(({ id, que, cuando, tipo, es_escena, momento_clave, detalles, ids }) => ({ id, que, cuando, tipo, es_escena, momento_clave, detalles, ids }));
    const d = docs.filter((x) => /^<(respuestas|para_preparar|golpe|resumen_hasta_aca)>/.test(x));
    d.push(tag('episodios', JSON.stringify(eps, null, 1)));
    return { docs: d, instr: promptsDe('### Paso 2h')[0].replaceAll('{{N}}', String(n)).replaceAll('{{ETAPA}}', etapa) };
  }
  return { docs, instr: promptsDe('### Paso 3b puro')[0].replaceAll('{{N}}', String(n)).replaceAll('{{ETAPA}}', etapa).replaceAll('{{NOMBRE}}', nombre) };
}

// v5.4: con "Idioma del libro: catalán" en la ficha, los pasos que escriben el libro (3a, 3b, 3c, 3d, 6) y el corrector (7)
// llevan al final el bloque de idioma de la receta. Los pasos internos siguen en castellano.
const ESCRIBEN = /^(3a-|3b-|3c-|3d-|6-arreglo-)/, CORRIGE = /^7-estilo-/;
function conIdioma(nombre, instr) {
  if (idioma(dir) !== 'ca') return instr;
  const [escritura, corrector] = promptsDe('### Idioma · catalán');
  if (ESCRIBEN.test(nombre)) return `${instr}\n\n${escritura}`;
  if (CORRIGE.test(nombre)) return `${instr}\n\n${corrector}`;
  return instr;
}

function guardar(nombre, docs, instr) {
  instr = conIdioma(nombre, instr);
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
    const { docs, instr } = process.env.PURO ? llamadaPura('primera_pagina') : llamadaEscritura('primera_pagina');
    guardar('3a-primera', docs, instr);
    break;
  }
  case 'capitulo': {
    const n = Number(arg);
    let { docs, instr } = llamadaEscritura(`cap_${n}`);
    // Novelista puro (v5.1): ficha, voz, sus respuestas en el orden del tiempo, lo que prepara su historia y fichas de lo ya escrito.
    if (process.env.PURO) ({ docs, instr } = llamadaPura(`cap_${n}`));
    // v5, C30: si la versión anterior dejó afuera más de un tercio, se reescribe con el aviso.
    const aviso = process.env.ERROR ? `\n\nTu versión anterior de este capítulo dejó afuera más de un tercio de sus respuestas. Escribilo de nuevo: como mucho un tercio afuera; lo que no empuja el hilo entra en una línea donde corresponde.\n${leer(process.env.ERROR)}` : '';
    guardar(`3b-capitulo-${String(n).padStart(2, '0')}`, docs, instr + aviso);
    break;
  }
  case 'antes': {
    if (!(plan().antes_de_cerrar?.ids || []).length) { console.log('el plan no tiene antes_de_cerrar: no hay pieza'); break; }
    const { docs, instr } = process.env.PURO ? llamadaPura('antes_de_cerrar') : llamadaEscritura('antes_de_cerrar');
    guardar('3d-antes-de-cerrar', docs, instr);
    break;
  }
  case 'carta': {
    const { docs, instr } = process.env.PURO ? llamadaPura('carta') : llamadaEscritura('carta');
    guardar('3c-carta', docs, instr);
    break;
  }
  case 'sus_frases_llamada': {
    // v5.1: Sus frases las elige un paso propio, literales (Naza: "las frases de él, no lo que escribe el escritor").
    guardar('3e-sus-frases', [tag('voz', voz()), tag('respuestas', respuestasXML(respuestas(dir)))], promptsDe('### Paso 3e puro')[0]);
    break;
  }
  case 'sus_frases': {
    // v5.1: si hay salidas/sus_frases.json (paso 3e), solo las frases, sin texto del escritor alrededor.
    if (existe(salida(dir, 'sus_frases.json'))) {
      const fr = leerJSON(salida(dir, 'sus_frases.json')).frases || [];
      escribir(salida(dir, 'sus_frases.md'), fr.map((f) => `> ${String(f.texto).trim()}`).join('\n\n') + '\n');
      console.log(`sus_frases.md: ${fr.length} frases (literales, del paso 3e)`);
      break;
    }
    const sf = plan().sus_frases || [];
    escribir(salida(dir, 'sus_frases.md'), sf.map((f) => `> ${f.texto}\n\n${f.contexto}`).join('\n\n') + '\n');
    console.log(`sus_frases.md: ${sf.length} frases`);
    break;
  }
  case 'estilo': {
    // v5.3, Paso 7: el corrector de estilo de una pieza (devuelve estilo/cambios-<pieza>.json; lo aplica estilo.mjs).
    const x = piezas(dir).find((q) => q.pieza === arg);
    if (!x) throw new Error(`no existe la pieza ${arg}`);
    // v5.3.1: RONDA=2, segunda pasada sobre la pieza ya corregida.
    const dos = process.env.RONDA === '2';
    guardar(`7-estilo-${arg}${dos ? '-2' : ''}`, [tag('ficha', ficha(dir)), tag('voz', voz()), tag('pieza', x.texto)], promptsDe('### Paso 7')[0] + (dos ? '\n\nEsta es la SEGUNDA pasada: la pieza ya pasó por un corrector. Buscá lo que quedó; lo que ya está bien no se toca.' : ''));
    break;
  }
  case 'armador': {
    // v5.1, Paso 2h: el armador ordena las historias del capítulo N antes de escribirlo (salidas/historias/cap_N.md).
    process.env.ARMADOR = '1';
    const { docs, instr } = llamadaPura(`cap_${Number(arg)}`);
    guardar(`2h-armador-${String(Number(arg)).padStart(2, '0')}`, docs, instr);
    break;
  }
  case 'resumen': {
    // v5.1, Paso 3r: ficha corta de una pieza recién escrita, para que las siguientes no repitan (salidas/resumenes/<pieza>.md).
    const x = piezas(dir).find((q) => q.pieza === arg);
    if (!x) throw new Error(`no existe la pieza ${arg}`);
    guardar(`3r-resumen-${arg}`, [tag('pieza', sinMarcas(x.texto))], promptsDe('### Paso 3r')[0]);
    break;
  }
  case 'veedor': {
    // v5.1, Paso 5c: el veedor final lee el libro entero de corrido (sin marcas) y marca lo que hay que corregir.
    const ps = piezas(dir).filter((q) => q.pieza !== 'sus_frases').map((q) => ({ ...q, texto: sinMarcas(q.texto) }));
    guardar('5c-veedor', [tag('libro', libroComo(ps))], promptsDe('### Paso 5c')[0]);
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
    if (process.env.PURO) {
      // v5.1: el arreglo también con el oficio del novelista (pedido corto), no con la instrucción larga.
      const probs = leerJSON(path.join(dir, 'arreglos', `problemas-${pieza}.json`));
      const actual = piezas(dir).find((p) => p.pieza === pieza);
      guardar(`6-arreglo-${pieza}`, [tag('ficha', ficha(dir)), tag('voz', voz()), tag('respuestas', respuestasEnElTiempo(idsDePieza(pieza))), tag('pieza_actual', actual ? actual.texto : ''), tag('problemas', JSON.stringify(probs, null, 1))], promptsDe('### Paso 6 puro')[0]);
      break;
    }
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
      // v5.4: los títulos fijos en el idioma del libro; "Para los míos" (el título por defecto del plan) también.
      const T = titulosFijos(idioma(dir));
      if (x.pieza === 'sus_frases') partes.push(`# ${T.frases}\n\n${x.texto.trim()}`);
      else if (x.pieza === 'antes_de_cerrar') partes.push(`# ${T.antes}\n\n${limpio(x.texto.trim())}`);
      else if (x.pieza === 'carta' && p.carta?.titulo) partes.push(`# ${/^para los m[ií]os$/i.test(p.carta.titulo.trim()) ? T.carta : p.carta.titulo}\n\n${limpio(x.texto.trim())}`);
      else if (x.pieza.startsWith('cap_')) {
        // receta v3.2: el título es el del plan y lo imprime el código (en la prueba 3.1 el arreglo lo cambió por otro).
        const cap = p.capitulos.find((c) => c.n === Number(x.pieza.slice(4)));
        const cuerpo = limpio(x.texto.trim()).replace(/^(#[^\n]*\n+)+/, '');
        // v5.1 (Naza 03/10): los capítulos van numerados (I, II, III…); el título lo pone el cliente en el dashboard si quiere.
        const romano = (k) => [['M', 1000], ['CM', 900], ['D', 500], ['CD', 400], ['C', 100], ['XC', 90], ['L', 50], ['XL', 40], ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]].reduce((s, [l, v]) => { while (k >= v) { s += l; k -= v; } return s; }, '');
        partes.push(cap ? `# ${process.env.TITULOS ? tituloImpreso(cap) : romano(cap.n)}\n\n${cuerpo}` : limpio(x.texto.trim()));
      } else partes.push(limpio(x.texto.trim()));
    }
    escribir(path.join(dir, 'libro.md'), partes.join('\n\n') + '\n');
    console.log(`libro.md: ${partes.join(' ').split(/\s+/).length} palabras`);
    break;
  }
  default:
    console.error('paso desconocido'); process.exit(1);
}
