// fabrica/src/escritor/controles/texto.ts
// Controles por código sobre el texto de las piezas (receta v5.5, sección 4), copiados letra por
// letra de fabrica/scripts/escritor-v55/controles.mjs. Mismos topes, mismas regex, mismo orden.
import { norm, palabras, marcas } from '../texto.js';
import type { Json, PiezaTexto, Problema, Respuesta } from '../tipos.js';

export const oraciones = (t: string): string[] => t.replace(/\n+/g, ' \n ').split(/(?<=[.!?])\s+|\n/).map((s) => s.trim()).filter(Boolean);
export const parrafos = (t: string): string[] => t.split(/\n\s*\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith('#'));
const MULETILLAS = new Set(['eh', 'este', 'o', 'sea', 'viste', 'digamos', 'como', 'que', 'bueno', 'nada', 'tipo', 'y', 'la', 'verdad']);
// controles.mjs:13 (MULETILLAS) no lo usa nadie: no se copia.
/** ¿Las palabras de `frase` aparecen en orden en `texto`, con saltos chicos (muletillas, falsos arranques)? */
export function esSubsecuencia(frase: string, texto: string, salto = 4): boolean {
  const f = palabras(frase), t = palabras(texto);
  if (!f.length) return true;
  for (let ini = 0; ini < t.length; ini++) {
    if (t[ini] !== f[0]) continue;
    let j = 1, k = ini + 1, gap = 0;
    while (j < f.length && k < t.length) {
      if (t[k] === f[j]) { j++; gap = 0; } else if (++gap > salto) break;
      k++;
    }
    if (j === f.length) return true;
  }
  return false;
}
export const enAlgunaRespuesta = (frase: string, rs: Respuesta[]): boolean => rs.some((r) => esSubsecuencia(frase, r.texto));

// ---------- C1: lista cerrada del anexo A2 ----------
const A2_PALABRAS = ['entranable', 'inolvidable', 'imborrable', 'magico', 'magica', 'genuino', 'genuina', 'autentico', 'autentica', 'resiliencia', 'resiliente', 'tapiz', 'entramado', 'sumergirse', 'sumergi', 'adentrarse', 'adentre', 'florecer', 'florecio', 'forjar', 'forje', 'forjo', 'atesorar', 'atesoro', 'invaluable', 'sinfin', 'crisol', 'testimonio de', 'crucial', 'huella', 'legado', 'vicisitudes', 'efimero', 'efimera', 'melancolia', 'transitar', 'transite', 'transito un', 'profunda tristeza', 'profundo dolor', 'profundo amor',
  'sin duda', 'sin lugar a dudas', 'cabe destacar', 'es importante senalar', 'en definitiva', 'a lo largo de los anos', 'con el paso del tiempo'];
const A2_MOLDES = [/un antes y un despues/, /punto de inflexion/, /marco para siempre/, /marcaria para siempre/, /no era solo .{1,40} era/, /no se trataba de .{1,40} sino/, /sin saberlo/, /poco imaginaba/, /aquel dia que/, /en ese momento comprend/, /quien iba a imaginar/, /y asi (fue como|aprendi|entendi)/, /eso me enseno/, /este libro/];

export function c1(p: PiezaTexto, rs: Respuesta[]): Problema[] {
  const out: Problema[] = [];
  const t = sinCitas(p.texto);
  for (const o of oraciones(t)) {
    const n = ` ${norm(o)} `;
    for (const w of A2_PALABRAS) {
      const i = n.indexOf(` ${w} `);
      if (i < 0) continue;
      // si el tramo con la palabra es textual de quien narra, no cuenta
      const ventana = n.slice(Math.max(0, i - 25), i + w.length + 25);
      if (rs.some((r) => ` ${norm(r.texto)} `.includes(ventana.trim().split(' ').slice(1, -1).join(' ')))) continue;
      out.push({ control: 'C1', tipo: 'ia', frase: o, que: `palabra de la lista A2: "${w}"` });
    }
    for (const m of A2_MOLDES) if (m.test(n)) out.push({ control: 'C1', tipo: 'ia', frase: o, que: `molde de la lista A2: ${m.source}` });
  }
  for (const par of parrafos(t)) {
    const rayas = (par.match(/—/g) || []).length;
    if (rayas > 2 && !/^—/.test(par)) out.push({ control: 'C1', tipo: 'ia', frase: par.slice(0, 120), que: `${rayas} rayas en un párrafo que no es diálogo` });
  }
  if (/\*\*[^*]+\*\*|^\s*[-*] /m.test(t.replace(/^#.*$/m, ''))) out.push({ control: 'C1', tipo: 'ia', frase: '', que: 'negritas o viñetas dentro de la pieza' });
  if ((t.match(/^#/gm) || []).length > 1) out.push({ control: 'C1', tipo: 'ia', frase: '', que: 'subtítulos dentro de la pieza' });
  // v4: recursos con medida (Naza). Frase corta sola o cita destacada (">") están bien; se marca a partir del cuarto por pieza.
  if (p.pieza !== 'sus_frases') {
    const recursos = [];
    for (const par of parrafos(p.texto)) {
      if (par.startsWith('>')) { recursos.push({ control: 'C1', tipo: 'ia', frase: par.slice(1, 120).trim(), que: 'demasiados recursos: cuarta cita destacada (">") en la pieza; integrala o pasala a raya' }); continue; }
      const os = oraciones(par);
      if (p.pieza !== 'carta' && os.length === 1 && !/^—/.test(par) && palabras(par).length < 12) recursos.push({ control: 'C1', tipo: 'ia', frase: par, que: 'demasiados recursos: cuarto párrafo de golpe en la pieza; unilo al párrafo de al lado' });
    }
    if (recursos.length > 3) out.push(...recursos.slice(3)); // v4 revisado: hasta tres está bien
  }
  return out;
}

// Las citas en bloque (">") se excluyen de C1, C10 y C15 (ya las mira C6).
export const sinCitas = (t: string): string => t.split('\n').filter((l) => !l.trim().startsWith('>')).join('\n');

// ---------- C2: frases cortadas ----------
export const c2 = (p: PiezaTexto): Problema[] => oraciones(p.texto).filter((o) => /…|\.\.\./.test(o)).map((o) => ({ control: 'C2', tipo: 'cortada', frase: o, que: 'puntos suspensivos (posible corte del audio)' }));

export function c3(p: PiezaTexto): Problema[] {
  if (p.pieza !== 'primera_pagina') return [];
  const out = [];
  const os = oraciones(p.texto.replace(/^#.*$/m, ''));
  const n0 = norm(os[0] || '');
  if (/^(me llamo|mi nombre|naci )/.test(n0)) out.push({ control: 'C3', tipo: 'primera_pagina', frase: os[0], que: 'la primera oración arranca con nombre o nacimiento' });
  for (const o of os) {
    const n = norm(o);
    const datos = [/\b(19|20)\d\d\b/, /\bnaci\b/, /tengo (\w+ )?hijos/, /\bvivo en\b/, /\bme llamo\b/, /\btengo \d+ anos\b|\btengo \w+ anos\b/].filter((r) => r.test(n)).length;
    if (datos > 1) out.push({ control: 'C3', tipo: 'primera_pagina', frase: o, que: `${datos} datos de ficha en una oración` });
  }
  return out;
}
// ---------- C4: nombres propios que no están en el material ----------
export function c4(p: PiezaTexto, rs: Respuesta[], fichaTxt: string, registroTxt: string): Problema[] {
  const base = norm(rs.map((r) => r.texto).join(' ') + ' ' + fichaTxt + ' ' + registroTxt);
  const pegado = base.replace(/ /g, '');
  const out = [];
  const vistos = new Set();
  for (const o of oraciones(p.texto.replace(/^#.*$/gm, ''))) {
    const ws = o.split(/\s+/);
    for (let i = 1; i < ws.length; i++) {
      const w = ws[i].replace(/[^\p{L}]/gu, '');
      if (!/^\p{Lu}/u.test(w) || w.length < 2) continue;
      if (/[.!?:—«"“]$/.test(ws[i - 1])) continue; // arranque de oración o de diálogo
      const n = norm(w);
      if (vistos.has(n)) continue;
      vistos.add(n);
      if (` ${base} `.includes(` ${n} `) || pegado.includes(n)) continue;
      out.push({ control: 'C4', tipo: 'nombre', frase: o, que: `"${w}" no está en respuestas, ficha ni registro` });
    }
  }
  return out;
}
// ---------- C5: años ----------
export function c5(p: PiezaTexto, rs: Respuesta[], fichaTxt: string): Problema[] {
  const base = rs.map((r) => r.texto).join(' ') + ' ' + fichaTxt;
  const out = [];
  for (const o of oraciones(p.texto.replace(/^#.*$/gm, ''))) {
    for (const y of o.match(/\b(19|20)\d\d\b/g) || []) {
      const corto = `${y.slice(2)}`;
      if (base.includes(y) || new RegExp(`(del|el|en el|año) ${corto}\\b`).test(base)) continue;
      out.push({ control: 'C5', tipo: 'fecha', frase: o, que: `el año ${y} no está en el material` });
    }
  }
  return out;
}
// ---------- C6: citas, diálogos, comillas y Sus frases textuales ----------
export function c6(p: PiezaTexto, rs: Respuesta[]): Problema[] {
  const out = [];
  const tramos = [];
  for (const l of p.texto.split('\n')) if (l.trim().startsWith('>')) tramos.push(l.replace(/^\s*>\s*/, ''));
  for (const m of p.texto.matchAll(/[«"“]([^»"”]{8,})[»"”]/g)) tramos.push(m[1]);
  for (const l of p.texto.split('\n')) if (/^—/.test(l.trim())) tramos.push(l.trim().replace(/^—/, '').split(/—/)[0]);
  for (const t of tramos) {
    if (palabras(t).length < 3) continue;
    if (!enAlgunaRespuesta(t, rs)) out.push({ control: 'C6', tipo: 'cita', frase: t, que: 'cita o diálogo que no es textual de ninguna respuesta' });
  }
  return out;
}
// ---------- C7: 6+ palabras repetidas entre piezas ----------
export function c7(ps: PiezaTexto[], estribillos: string[] = []): Problema[] {
  const out = [];
  const visto = new Map();
  // v4: una frase que quien narra repite como estribillo (voz.frases que está en 2+ respuestas) puede volver en el libro.
  const quitar = (t: string) => estribillos.reduce((s, e) => s.split(norm(e)).join(' '), ` ${norm(t)} `);
  for (const p of ps) {
    const ws = palabras(quitar(sinCitas(p.texto).replace(/^#.*$/gm, '')));
    const propias = new Set();
    for (let i = 0; i + 6 <= ws.length; i++) {
      const g = ws.slice(i, i + 6).join(' ');
      if (propias.has(g)) continue;
      propias.add(g);
      const antes = visto.get(g);
      if (antes && antes !== p.pieza) out.push({ pieza: p.pieza, control: 'C7', tipo: 'repetido', frase: g, que: `repite seis palabras seguidas de ${antes}` });
      else if (!antes) visto.set(g, p.pieza);
    }
  }
  // un solo aviso por tramo contiguo
  const dedup = [];
  for (const x of out) { const ult = dedup[dedup.length - 1]; if (ult && ult.pieza === x.pieza && ult.frase.split(' ').slice(-5).join(' ') === x.frase.split(' ').slice(0, 5).join(' ')) { ult.frase += ' ' + x.frase.split(' ').pop(); continue; } dedup.push({ ...x }); }
  return dedup;
}
// ---------- C8: eco de preguntas ----------
export function c8(p: PiezaTexto, rs: Respuesta[]): Problema[] {
  const out = [];
  const preg = rs.map((r) => palabras(r.pregunta));
  const txt = palabras(p.texto);
  const resp = ' ' + norm(rs.map((r) => r.texto).join(' ')) + ' ';
  const vistos = new Set();
  for (const q of preg) for (let i = 0; i + 5 <= q.length; i++) {
    const g = q.slice(i, i + 5).join(' ');
    if (vistos.has(g) || resp.includes(` ${g} `)) continue;
    if ((' ' + txt.join(' ') + ' ').includes(` ${g} `)) { vistos.add(g); out.push({ control: 'C8', tipo: 'boton', frase: g, que: 'cinco palabras seguidas del texto de una pregunta' }); }
  }
  return out;
}
// ---------- C10: castellano (anexo A6) ----------
export function c10(p: PiezaTexto, rs: Respuesta[], trato: string | undefined): Problema[] {
  const out = [];
  const material = norm(rs.map((r) => r.texto).join(' '));
  for (const o of oraciones(sinCitas(p.texto).replace(/^#.*$/gm, ''))) {
    const n = norm(o);
    if (/^\p{L}+(ando|iendo)\b/u.test(n) && !/^(cuando|mando|ando|fernando|orlando|armando)\b/.test(n)) out.push({ control: 'C10', tipo: 'ia', frase: o, que: 'gerundio al inicio' });
    if (/\b(fue|fueron|era|eran) \p{L}+(ado|ada|ido|ida|ados|idas|adas|idos) por\b/u.test(n)) out.push({ control: 'C10', tipo: 'ia', frase: o, que: 'pasiva calcada (fue + participio + por)' });
    if (/(dijo|dije|decia|me dice)\s*[:,]?\s*["“]/.test(o.toLowerCase())) out.push({ control: 'C10', tipo: 'ia', frase: o, que: 'diálogo con comillas en vez de raya' });
    // Con tildes: sin ellas, "sabés" (vos) y "sabes" (tú) son la misma palabra (falsa alarma de la prueba 3).
    const ol = o.toLowerCase();
    const tu = /(?<!\p{L})(tienes|eres|puedes|quieres|sabes)(?!\p{L})/u.test(ol), vos = /(?<!\p{L})(tenés|sos|podés|querés|sabés)(?!\p{L})/u.test(ol);
    if (trato === 'vos' && tu) out.push({ control: 'C10', tipo: 'ia', frase: o, que: 'tuteo en un libro que vosea' });
    if (trato === 'tu' && vos) out.push({ control: 'C10', tipo: 'ia', frase: o, que: 'voseo en un libro que tutea' });
    for (const d of ['depresion', 'ansiedad', 'trauma', 'alcoholico', 'alcoholismo', 'adiccion', 'adicto']) {
      if (` ${n} `.includes(` ${d} `) && !` ${material} `.includes(` ${d} `)) out.push({ control: 'C10', tipo: 'inventado', frase: o, que: `diagnóstico que no dijo: "${d}"` });
    }
  }
  return out;
}
// ---------- C15: bolsa en el último capítulo ----------
export function c15(p: PiezaTexto): Problema[] {
  const out = [];
  const pars = parrafos(sinCitas(p.texto));
  let seguidos = 0;
  for (const par of pars) {
    if (/^(yo creo que|creo que|siento que|pienso que|lo que mas me gusta|lo que herede|para mi lo mas importante)/.test(norm(par))) {
      if (++seguidos > 2) out.push({ control: 'C15', tipo: 'bolsa', frase: par.slice(0, 120), que: 'más de dos párrafos seguidos de reflexión en el último capítulo' });
    } else seguidos = 0;
  }
  return out;
}

// ---------- C16: oraciones en presente (para el verificador) ----------
const PRES = /\b(hoy|ahora|todavia|sigue|siguen|sigo|actualmente|estoy|esta|estamos|vivo|vive|viven|trabajo|tengo|tiene|tenemos|soy|es|somos|son|hago|hace|voy|va|vamos)\b/;
export function presentes(ps: PiezaTexto[]): Json[] {
  const out : Json[] = [];
  for (const p of ps) parrafos(p.texto).forEach((par, i) => {
    for (const o of oraciones(par)) if (PRES.test(norm(o))) out.push({ pieza: p.pieza, parrafo: i + 1, oracion: o });
  });
  return out;
}

// C27 (no bloquea): oraciones en pasado que nombran a una persona que sigue hoy — van al verificador como <pasados>.
const PASADO = /(?<!\p{L})(era|eran|estaba|estaban|tenia|tenian|vivia|vivian|hacia|hacian|sabia|sabian|queria|querian|iba|iban|solia|solian|\p{L}{2,}aban?)(?!\p{L})/u;
const SINONIMOS: Record<string, string[]> = { padre: ['papa', 'viejo'], madre: ['mama', 'vieja'] };
export function pasados(ps: PiezaTexto[], reg: Json): Json[] {
  const vivas = (reg?.personas || []).filter((p: Json) => p.estado === 'sigue_hoy');
  const formas = vivas.map((p: Json) => {
    const rel = norm(p.relacion || '').split(' ')[0];
    const nombres = [p.nombre, ...(p.apodos || [])].filter(Boolean).map(norm).filter((n) => n.length > 2);
    const rels = rel ? [rel, ...(SINONIMOS[rel] || [])].map((r) => `mi ${r}`) : [];
    return { nombre: p.nombre, claves: [...nombres, ...rels] };
  });
  const out : Json[] = [];
  for (const p of ps) parrafos(p.texto).forEach((par, i) => {
    for (const o of oraciones(par)) {
      const n = ` ${norm(o)} `;
      if (!PASADO.test(n)) continue;
      const quien = formas.filter((f: Json) => f.claves.some((k: string) => n.includes(` ${k} `)));
      if (quien.length) out.push({ pieza: p.pieza, parrafo: i + 1, oracion: o, personas: quien.map((q: Json) => q.nombre) });
    }
  });
  return out;
}

// C28 (receta v3.2, prueba corta 02/10): el escritor mete "hoy" en un capítulo del pasado ("Hoy con Ariel no tengo la mejor relación").
const HOY = /(?<!\p{L})(hoy|hoy en dia|actualmente|a dia de hoy|al dia de hoy|en la actualidad)(?!\p{L})/u;
export function c28(p: PiezaTexto): Problema[] {
  const out = [];
  // v4 (Naza): una línea de consecuencia que cierra la historia vieja puede quedar: la última del párrafo y la única de hoy en él.
  for (const par of parrafos(sinCitas(p.texto))) {
    const os = oraciones(par).filter((o) => !/^—/.test(o));
    const conHoy = os.map((o, i) => ({ o, i })).filter(({ o }) => HOY.test(norm(o)));
    const deja = conHoy.length === 1 && conHoy[0].i === os.length - 1;
    if (!deja) for (const { o } of conHoy) out.push({ control: 'C28', tipo: 'hoy_en_pasado', frase: o, que: 'lo de hoy en un capítulo del pasado: va al último capítulo; solo puede quedar una línea de consecuencia al final de la historia que cierra' });
  }
  return out;
}
// C29 (v4): el mismo nombre del registro 3+ veces en 3 oraciones seguidas ("Juan Manuel" ×4 en la v3.2) → arreglo.
export function c29(p: PiezaTexto, reg: Json): Problema[] {
  const out = [];
  const nombres = (reg?.personas || []).flatMap((x: Json) => [x.nombre, ...(x.apodos || [])]).filter(Boolean).map(norm).filter((n: string) => n.length > 2);
  for (const par of parrafos(sinCitas(p.texto))) {
    const os = oraciones(par);
    for (let i = 0; i + 3 <= os.length; i++) {
      const v = ` ${norm(os.slice(i, i + 3).join(' '))} `;
      const rep = nombres.find((n: string) => v.split(` ${n} `).length - 1 >= 3);
      if (rep) { out.push({ control: 'C29', tipo: 'repetido', frase: os[i + 2], que: `"${rep}" 3 veces en tres oraciones: usá "él/ella", "mi hermano" o reordená` }); break; }
    }
  }
  return out;
}
// C31 (v5.1, Naza 03/10: "concierto de puntos"): oraciones que arrancan con "Y" y tiras de 3+ oraciones cortas seguidas → arreglo (conectar).
export function c31(p: PiezaTexto): Problema[] {
  const out = [];
  for (const par of parrafos(sinCitas(p.texto))) {
    if (/^—/.test(par)) continue;
    const os = oraciones(par);
    // v5.4: en catalán la "Y" es "I".
    for (const o of os) if (/^[YI]\s/.test(o)) out.push({ control: 'C31', tipo: 'puntos', frase: o, que: 'oración que arranca con "Y": conectala con la anterior (o reescribí el tramo para que fluya)' });
    // v5.2 (Naza 03/10): el otro extremo; la v5.1 escribió oraciones de 60–90 palabras e inventario.
    for (const o of os) if (palabras(o).length > 40) out.push({ control: 'C31', tipo: 'larga', frase: o, que: `oración de ${palabras(o).length} palabras: partila donde cambia la acción, en oraciones de 10 a 30 (y si es una lista en fila, contala eligiendo lo que se ve)` });
    let tira = [];
    for (const o of [...os, '']) {
      if (o && palabras(o).length < 7) { tira.push(o); continue; }
      if (tira.length >= 3) out.push({ control: 'C31', tipo: 'puntos', frase: tira.join(' '), que: 'tres o más oraciones cortas seguidas: es un concierto de puntos; contalo como un fluir, con conectores' });
      tira = [];
    }
  }
  return out.slice(0, 20);
}

// C32 (v5.2, Naza 03/10): los "no" de la entrevista no entran al libro ("de la salud, paso", "no tengo foto", "ningún maestro", "no hay mucho más que contar").
const NOES: [RegExp, string][] = [
  [/\bde (la|el|lo|eso|esto|mi|su|sus|mis|los|las)\b[a-z ]{0,30}\bpaso( no\b.*)?$/, 'lo que no quiso contar'],
  [/\bno (me )?(acuerdo|recuerdo)\b/, 'lo que no recuerda'],
  [/\bno (tengo|tenemos|hay) (ninguna |una |ni una )?fotos?\b/, 'lo que no tiene'],
  [/\b(no hay|no tengo|nada) (mucho )?mas (que|para) (contar|decir)\b/, 'el cierre de la charla'],
  [/\bno se (que )?mas (decir|contar)\b/, 'el cierre de la charla'],
  [/\b(no (quiero|quise|me gusta) hablar|prefiero no (hablar|contar))\b/, 'lo que no quiso contar'],
  [/\bningun(o|a)? (maestr|profe|docente|profesor)/, 'lo que no hubo'],
  // v5.4: los mismos "no" en catalán ("de la salut, passo", "no me'n recordo", "no tinc cap foto", "cap mestre", "no hi ha gaire més a explicar")
  [/\bde (la|el|l|aixo|aquesta|aquest|els|les|mi|mon)\b[a-z ]{0,30}\bpasso( no\b.*)?$/, 'lo que no quiso contar'],
  [/\bd aixo passo\b/, 'lo que no quiso contar'],
  [/\bno (me n |m en |ho )?recordo\b/, 'lo que no recuerda'],
  [/\bno (tinc|tenim|hi ha) (cap |una )?fotos?\b/, 'lo que no tiene'],
  [/\b(no hi ha|no tinc|res) (gaire |molt )?mes (a|per|que) (explicar|dir)\b/, 'el cierre de la charla'],
  [/\b(no (vull|volia) parlar|prefereixo no (parlar|explicar))\b/, 'lo que no quiso contar'],
  [/\bcap (mestre|mestra|professor|professora)\b/, 'lo que no hubo'],
];
export function c32(p: PiezaTexto): Problema[] {
  const out = [];
  for (const par of parrafos(sinCitas(p.texto))) for (const o of oraciones(par)) {
    const n = norm(o);
    const m = NOES.find(([re]) => re.test(n));
    if (m) out.push({ control: 'C32', tipo: 'no_entra', frase: o, que: `un "no" de la entrevista (${m[1]}): sale entero, sin dejar un resumen de lo que faltó` });
  }
  return out;
}
export function repite(ps: PiezaTexto[], pieza: string): Problema[] {
  const orden = [...ps.filter((p) => p.pieza !== pieza && p.pieza !== 'sus_frases'), ...ps.filter((p) => p.pieza === pieza)];
  return c7(orden).filter((x) => x.pieza === pieza);
}

// ---------- C17: presentaciones dobles ----------
const REL = 'marido|mujer|esposa|esposo|novia|novio|hermana|hermano|hijo|hija|madre|padre|mama|papa|vieja|viejo|amiga|amigo|tia|tio|abuela|abuelo|nieta|nieto|primo|prima|sobrino|sobrina|perro|perra';
export function c17(ps: PiezaTexto[]): Problema[] {
  const out = [];
  const donde = new Map();
  for (const p of ps) {
    if (['sus_frases', 'carta', 'antes_de_cerrar'].includes(p.pieza)) continue;
    const vistosAca = new Map();
    for (const o of oraciones(p.texto)) {
      const n = norm(o);
      const nombres = [...o.matchAll(new RegExp(`\\b[Mm]i (?:${REL.replace(/a/g, '[aá]')}) (\\p{Lu}\\p{L}+)`, 'gu'))].map((m) => m[1]);
      for (const m of n.matchAll(new RegExp(`\\b(\\p{L}+), (?:mi|que es mi|que era mi) (?:${REL})\\b`, 'gu'))) nombres.push(m[1]);
      // v5.5: después de la primera vez, solo cuenta como presentación si además dice quién es
      // (una aclaración entre comas después del nombre, o una edad): "mi hermano Iñaki" de pasada no es presentarlo de nuevo.
      const completa = (nom: string) => new RegExp(`\\b${nom}\\s*,\\s*(?!y\\b|que\\b)\\p{L}`, 'u').test(o) || /\b\d+\s+años\b|\b(años|anys) de edad\b|\btiene (hoy )?\p{L}+ años\b/u.test(o);
      for (const nom of nombres) {
        const k = norm(nom);
        if (donde.has(k) && donde.get(k) !== p.pieza && completa(nom)) out.push({ pieza: p.pieza, control: 'C17', tipo: 'persona_dos_veces', frase: o, que: `${nom} ya se presentó en ${donde.get(k)}` });
        else if (p.pieza === 'primera_pagina' && vistosAca.has(k)) out.push({ pieza: p.pieza, control: 'C17', tipo: 'persona_dos_veces', frase: o, que: `${nom} presentada dos veces en la primera página` });
        if (!donde.has(k)) donde.set(k, p.pieza);
        vistosAca.set(k, true);
      }
    }
  }
  return out;
}

// C25 (no bloquea): oraciones que apuntan a algo con "ese día", "ahí"… — van al lector como <referencias>.
const REFERENCIA = /\b(ese dia|esa noche|esa tarde|esa manana|esa vez|ese momento|esa casa|ese lugar|ese ano|ahi|alla)\b/;
export function referencias(ps: PiezaTexto[]): Json[] {
  const out : Json[] = [];
  for (const p of ps) parrafos(p.texto).forEach((par, i) => {
    for (const o of oraciones(par)) if (REFERENCIA.test(norm(o))) out.push({ pieza: p.pieza, parrafo: i + 1, oracion: o });
  });
  return out;
}
