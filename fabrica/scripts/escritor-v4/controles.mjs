// Controles por código de la receta nueva (docs/v3/escritor/receta.md, sección 4).
// Uso: node controles.mjs <carpeta> registro | plan | piezas | arreglo <pieza> | repaso
//   registro → C14 · plan → C12, C13, C19, C20 · piezas → C1–C8, C10, C15, C17–C24 · arreglo → C9 · repaso → C26
// Deja <carpeta>/controles/<qué>.json y escribe un resumen. Sale con código 2 si hay problemas.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync as fsList } from 'node:fs';
import { leer, existe, escribir, leerJSON, norm, palabras, respuestas, ficha, salida, piezas, sinMarcas, marcas, planConR, piezaDeR } from './lib.mjs';

// ---------- utilidades ----------
const oraciones = (t) => t.replace(/\n+/g, ' \n ').split(/(?<=[.!?])\s+|\n/).map((s) => s.trim()).filter(Boolean);
const parrafos = (t) => t.split(/\n\s*\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith('#'));
const MULETILLAS = new Set(['eh', 'este', 'o', 'sea', 'viste', 'digamos', 'como', 'que', 'bueno', 'nada', 'tipo', 'y', 'la', 'verdad']);

/** ¿Las palabras de `frase` aparecen en orden en `texto`, con saltos chicos (muletillas, falsos arranques)? */
export function esSubsecuencia(frase, texto, salto = 4) {
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
const enAlgunaRespuesta = (frase, rs) => rs.some((r) => esSubsecuencia(frase, r.texto));

// ---------- C1: lista cerrada del anexo A2 ----------
const A2_PALABRAS = ['entranable', 'inolvidable', 'imborrable', 'magico', 'magica', 'genuino', 'genuina', 'autentico', 'autentica', 'resiliencia', 'resiliente', 'tapiz', 'entramado', 'sumergirse', 'sumergi', 'adentrarse', 'adentre', 'florecer', 'florecio', 'forjar', 'forje', 'forjo', 'atesorar', 'atesoro', 'invaluable', 'sinfin', 'crisol', 'testimonio de', 'crucial', 'huella', 'legado', 'vicisitudes', 'efimero', 'efimera', 'melancolia', 'transitar', 'transite', 'transito un', 'profunda tristeza', 'profundo dolor', 'profundo amor',
  'sin duda', 'sin lugar a dudas', 'cabe destacar', 'es importante senalar', 'en definitiva', 'a lo largo de los anos', 'con el paso del tiempo'];
const A2_MOLDES = [/un antes y un despues/, /punto de inflexion/, /marco para siempre/, /marcaria para siempre/, /no era solo .{1,40} era/, /no se trataba de .{1,40} sino/, /sin saberlo/, /poco imaginaba/, /aquel dia que/, /en ese momento comprend/, /quien iba a imaginar/, /y asi (fue como|aprendi|entendi)/, /eso me enseno/, /este libro/];

export function c1(p, rs) {
  const out = [];
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
const sinCitas = (t) => t.split('\n').filter((l) => !l.trim().startsWith('>')).join('\n');

// ---------- C2: frases cortadas ----------
const c2 = (p) => oraciones(p.texto).filter((o) => /…|\.\.\./.test(o)).map((o) => ({ control: 'C2', tipo: 'cortada', frase: o, que: 'puntos suspensivos (posible corte del audio)' }));

// ---------- C3: primera página ----------
function c3(p) {
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
function c4(p, rs, fichaTxt, registroTxt) {
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
function c5(p, rs, fichaTxt) {
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
function c6(p, rs) {
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
export function c7(ps, estribillos = []) {
  const out = [];
  const visto = new Map();
  // v4: una frase que quien narra repite como estribillo (voz.frases que está en 2+ respuestas) puede volver en el libro.
  const quitar = (t) => estribillos.reduce((s, e) => s.split(norm(e)).join(' '), ` ${norm(t)} `);
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
  for (const x of out) { const ult = dedup[dedup.length - 1]; if (ult && ult.pieza === x.pieza && ult.frase.split(' ').slice(1).join(' ') === x.frase.split(' ').slice(0, 5).join(' ')) { ult.frase += ' ' + x.frase.split(' ').pop(); continue; } dedup.push({ ...x }); }
  return dedup;
}

// ---------- C8: eco de preguntas ----------
function c8(p, rs) {
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
export function c10(p, rs, trato) {
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
function c15(p) {
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
export function presentes(ps) {
  const out = [];
  for (const p of ps) parrafos(p.texto).forEach((par, i) => {
    for (const o of oraciones(par)) if (PRES.test(norm(o))) out.push({ pieza: p.pieza, parrafo: i + 1, oracion: o });
  });
  return out;
}

// C27 (no bloquea): oraciones en pasado que nombran a una persona que sigue hoy — van al verificador como <pasados>.
const PASADO = /(?<!\p{L})(era|eran|estaba|estaban|tenia|tenian|vivia|vivian|hacia|hacian|sabia|sabian|queria|querian|iba|iban|solia|solian|\p{L}{2,}aban?)(?!\p{L})/u;
const SINONIMOS = { padre: ['papa', 'viejo'], madre: ['mama', 'vieja'] };
export function pasados(ps, reg) {
  const vivas = (reg?.personas || []).filter((p) => p.estado === 'sigue_hoy');
  const formas = vivas.map((p) => {
    const rel = norm(p.relacion || '').split(' ')[0];
    const nombres = [p.nombre, ...(p.apodos || [])].filter(Boolean).map(norm).filter((n) => n.length > 2);
    const rels = rel ? [rel, ...(SINONIMOS[rel] || [])].map((r) => `mi ${r}`) : [];
    return { nombre: p.nombre, claves: [...nombres, ...rels] };
  });
  const out = [];
  for (const p of ps) parrafos(p.texto).forEach((par, i) => {
    for (const o of oraciones(par)) {
      const n = ` ${norm(o)} `;
      if (!PASADO.test(n)) continue;
      const quien = formas.filter((f) => f.claves.some((k) => n.includes(` ${k} `)));
      if (quien.length) out.push({ pieza: p.pieza, parrafo: i + 1, oracion: o, personas: quien.map((q) => q.nombre) });
    }
  });
  return out;
}

// C28 (receta v3.2, prueba corta 02/10): el escritor mete "hoy" en un capítulo del pasado ("Hoy con Ariel no tengo la mejor relación").
const HOY = /(?<!\p{L})(hoy|hoy en dia|actualmente|a dia de hoy|al dia de hoy|en la actualidad)(?!\p{L})/u;
export function c28(p) {
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
export function c29(p, reg) {
  const out = [];
  const nombres = (reg?.personas || []).flatMap((x) => [x.nombre, ...(x.apodos || [])]).filter(Boolean).map(norm).filter((n) => n.length > 2);
  for (const par of parrafos(sinCitas(p.texto))) {
    const os = oraciones(par);
    for (let i = 0; i + 3 <= os.length; i++) {
      const v = ` ${norm(os.slice(i, i + 3).join(' '))} `;
      const rep = nombres.find((n) => v.split(` ${n} `).length - 1 >= 3);
      if (rep) { out.push({ control: 'C29', tipo: 'repetido', frase: os[i + 2], que: `"${rep}" 3 veces en tres oraciones: usá "él/ella", "mi hermano" o reordená` }); break; }
    }
  }
  return out;
}

// ---------- C17: presentaciones dobles ----------
const REL = 'marido|mujer|esposa|esposo|novia|novio|hermana|hermano|hijo|hija|madre|padre|mama|papa|vieja|viejo|amiga|amigo|tia|tio|abuela|abuelo|nieta|nieto|primo|prima|sobrino|sobrina|perro|perra';
function c17(ps) {
  const out = [];
  const donde = new Map();
  for (const p of ps) {
    if (['sus_frases', 'carta', 'antes_de_cerrar'].includes(p.pieza)) continue;
    const vistosAca = new Map();
    for (const o of oraciones(p.texto)) {
      const n = norm(o);
      const nombres = [...o.matchAll(new RegExp(`\\b[Mm]i (?:${REL.replace(/a/g, '[aá]')}) (\\p{Lu}\\p{L}+)`, 'gu'))].map((m) => m[1]);
      for (const m of n.matchAll(new RegExp(`\\b(\\p{L}+), (?:mi|que es mi|que era mi) (?:${REL})\\b`, 'gu'))) nombres.push(m[1]);
      for (const nom of nombres) {
        const k = norm(nom);
        if (donde.has(k) && donde.get(k) !== p.pieza) out.push({ pieza: p.pieza, control: 'C17', tipo: 'persona_dos_veces', frase: o, que: `${nom} ya se presentó en ${donde.get(k)}` });
        else if (p.pieza === 'primera_pagina' && vistosAca.has(k)) out.push({ pieza: p.pieza, control: 'C17', tipo: 'persona_dos_veces', frase: o, que: `${nom} presentada dos veces en la primera página` });
        if (!donde.has(k)) donde.set(k, p.pieza);
        vistosAca.set(k, true);
      }
    }
  }
  return out;
}

// ---------- C12 y C13: plan ----------
const VALORACION = ['etapa', 'linda', 'lindo', 'hermosa', 'hermoso', 'gran', 'suenos', 'sueno', 'luchas', 'lucha', 'dificil', 'feliz', 'felicidad', 'importante', 'especial', 'inolvidable'];
const VACIAS = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'en', 'y', 'a', 'al', 'con', 'que', 'mi', 'mis', 'me', 'se', 'lo', 'por', 'para', 'su', 'sus', 'es', 'era']);
export function c12(plan, rs, reg) {
  const out = [];
  // v4: el título es "lo que mejor quede, sin inventar" (Naza); ya no tiene que salir de un hecho fuerte.
  const porId = Object.fromEntries(rs.map((r) => [r.id, r.texto]));
  const material = ` ${norm(rs.map((r) => r.texto).join(' '))} `;
  const nombres = new Set((reg.personas || []).flatMap((p) => [p.nombre, ...(p.apodos || [])]).map(norm));
  const titulos = [{ donde: 'libro', t: plan.titulo_libro }, ...plan.capitulos.map((c) => ({ donde: `cap_${c.n}`, t: c.titulo }))];
  if (plan.carta?.titulo && norm(plan.carta.titulo) !== 'para los mios') titulos.push({ donde: 'carta', t: { texto: plan.carta.titulo, id: plan.carta.titulo_id || '' } });
  const vistos = new Set();
  for (const { donde, t } of titulos) {
    if (!t?.texto) continue;
    const ws = palabras(t.texto);
    if (t.id && porId[t.id] && !esSubsecuencia(t.texto, porId[t.id])) out.push(`C12 ${donde}: el título "${t.texto}" no es textual de ${t.id}`);
    if (!t.id) for (const w of ws) if (!VACIAS.has(w) && !material.includes(` ${w} `)) out.push(`C12 ${donde}: "${w}" del título armado no está en el material`);
    for (const w of ws) if (VALORACION.includes(w)) out.push(`C12 ${donde}: el título "${t.texto}" lleva una valoración ("${w}")`);
    if (nombres.has(norm(t.texto))) out.push(`C12 ${donde}: el título es solo un nombre`);
    if (vistos.has(norm(t.texto))) out.push(`C12 ${donde}: título repetido`);
    vistos.add(norm(t.texto));
  }
  return out;
}
export function c13(plan, reg) {
  const out = [];
  const eps = Object.fromEntries((reg.episodios || []).map((e) => [e.id, e]));
  const usados = new Map();
  const usar = (id, donde) => { usados.set(id, [...(usados.get(id) || []), donde]); };
  for (const c of plan.capitulos) for (const p of c.piezas || []) usar(p.episodio, `cap_${c.n}`);
  const idsSf = new Set((plan.sus_frases || []).map((f) => f.id));
  const idsCarta = new Set(plan.carta?.ids || []);
  const idsAntes = new Set(plan.antes_de_cerrar?.ids || []);
  // Una R puede estar en un episodio y en un balance a la vez (variante): esa R va a Antes de cerrar sin culpa del otro episodio.
  const idsBalance = new Set((reg.episodios || []).filter((e) => e.tipo === 'balance' && !e.no_poner).flatMap((e) => e.ids));
  for (const e of reg.episodios || []) {
    if (e.no_poner) continue;
    const u = usados.get(e.id) || [];
    const enOtro = e.ids.some((i) => idsSf.has(i) || idsCarta.has(i) || idsAntes.has(i));
    if (e.tipo !== 'balance' && e.ids.some((i) => idsAntes.has(i) && !idsBalance.has(i))) out.push(`C13: el episodio ${e.id} no es balance y está en antes_de_cerrar.ids (ahí va solo el balance)`);
    if (e.tipo === 'balance' && !e.ids.every((i) => idsAntes.has(i))) out.push(`C13: el episodio ${e.id} es balance y no está entero en antes_de_cerrar.ids`);
    if (e.tipo === 'balance' && u.length) out.push(`C13: el episodio ${e.id} es balance y está en ${u.join(' y ')} (va a Antes de cerrar)`);
    if (u.length > 1) out.push(`C13: el episodio ${e.id} está en ${u.join(' y ')} (va una sola vez)`);
    if (!u.length && !enOtro) out.push(`C13: el episodio ${e.id} ("${e.que.slice(0, 60)}") no quedó en ningún lado`);
  }
  let prev = null;
  for (const c of plan.capitulos) {
    // v4: capítulo = etapa (Naza). Puede no tener escena; el peso va por importancia, no por largo.
    for (const p of c.piezas || []) { const e = eps[p.episodio]; if (!e) out.push(`C13 cap_${c.n}: el episodio ${p.episodio} no existe en el registro`); else if (p.forma === 'escena' && !e.es_escena) out.push(`C13 cap_${c.n}: ${e.id} va como escena y el registro dice que no tiene escena (es_escena: false)`); else if (e.momento_clave && p.peso === 'linea') out.push(`C13 cap_${c.n}: ${e.id} es momento clave (${e.momento_clave}) y va con peso "linea": va con peso "clave"`); }
    if (!(c.hilo_ids || []).length) out.push(`C13 cap_${c.n}: hilo sin ids`);
    // receta v3.2: plan por época. Lo de hoy (dato, gusto o reflexión que sigue) no va a un capítulo del pasado sin decir por qué.
    if (c !== plan.capitulos[plan.capitulos.length - 1]) for (const p of c.piezas || []) {
      const e = eps[p.episodio];
      if (e && ['dato', 'gusto', 'reflexion'].includes(e.tipo) && e.estado === 'sigue_hoy' && !String(p.por_que_aca || '').trim()) out.push(`C13 cap_${c.n}: ${e.id} ("${e.que.slice(0, 50)}") es de hoy (${e.tipo}, sigue_hoy) y está en un capítulo del pasado sin "por_que_aca": va al último capítulo, a Antes de cerrar, a Sus frases o a la carta`);
    }
    if (prev && prev.apertura?.tipo === c.apertura?.tipo) out.push(`C13 cap_${c.n}: abre igual que el anterior (${c.apertura?.tipo})`);
    if (prev && prev.cierre?.tipo === c.cierre?.tipo) out.push(`C13 cap_${c.n}: cierra igual que el anterior (${c.cierre?.tipo})`);
    prev = c;
  }
  const pres = new Map();
  for (const c of plan.capitulos) for (const p of c.presenta || []) pres.set(p, [...(pres.get(p) || []), c.n]);
  for (const [p, cs] of pres) if (cs.length > 1) out.push(`C13: ${p} se presenta en los capítulos ${cs.join(' y ')}`);
  const ult = plan.capitulos[plan.capitulos.length - 1];
  const idsHoy = new Set([...(reg.hoy || []).flatMap((h) => h.ids), ...(reg.episodios || []).filter((e) => e.estado === 'sigue_hoy').flatMap((e) => e.ids)]);
  if (!(ult?.hilo_de_hoy_ids || []).some((i) => idsHoy.has(i))) out.push('C13: el último capítulo no tiene un hilo de hoy respaldado (hilo_de_hoy_ids sin nada de "hoy" ni episodios sigue_hoy)');
  // receta v3: el último capítulo tiene columna y cierra en una imagen de hoy.
  const imf = ult?.imagen_final || {};
  const epImf = eps[imf.episodio];
  if (!ult?.columna?.texto) out.push('C13: el último capítulo no tiene columna (la oración que ordena sus piezas)');
  else if (!(ult.columna.ids || []).length) out.push('C13: la columna del último capítulo no tiene ids (receta v3.1: es lo que sigue abierto hoy, con sus respuestas)');
  if (!epImf) out.push('C13: el último capítulo no tiene imagen_final con un episodio del registro');
  else {
    if (!(ult.piezas || []).some((p) => p.episodio === imf.episodio)) out.push(`C13: la imagen_final ${imf.episodio} no está en las piezas del último capítulo`);
    if (epImf.estado !== 'sigue_hoy' && !epImf.ids.some((i) => idsHoy.has(i))) out.push(`C13: la imagen_final ${imf.episodio} no es de hoy (ni sigue_hoy ni del bloque "hoy")`);
    if (ult.cierre?.episodio !== imf.episodio) out.push(`C13: el último capítulo no cierra en su imagen_final (cierre ${ult.cierre?.episodio || 'vacío'}, imagen ${imf.episodio})`);
  }
  if (norm(plan.carta?.titulo || '') === 'antes de cerrar') out.push('C13: la carta no puede llamarse "Antes de cerrar" (es otra pieza)');
  const tipoDeId = new Map();
  for (const e of reg.episodios || []) for (const i of e.ids) tipoDeId.set(i, [...(tipoDeId.get(i) || []), e.tipo]);
  for (const i of idsCarta) if (!(tipoDeId.get(i) || []).includes('mensaje')) out.push(`C13 carta: ${i} no tiene ningún episodio tipo "mensaje"`);
  const presentaIds = new Set([...(reg.narrador?.como_se_presenta || []), ...(reg.narrador?.cosas_concretas_suyas || [])].flatMap((x) => x.ids));
  for (const i of [...(plan.primera_pagina?.que_dice_de_si_ids || []), ...(plan.primera_pagina?.cosa_concreta?.ids || [])]) if (!presentaIds.has(i)) out.push(`C13 primera página: ${i} no está en como_se_presenta ni en cosas_concretas_suyas`);
  for (const f of plan.sus_frases || []) if (palabras(f.contexto || '').length > 20) out.push(`C13 sus_frases ${f.id}: contexto de más de 20 palabras`);
  return out;
}

// ---------- C14: registro ----------
function c14(reg, rs, fichaTxt) {
  const out = [];
  const ids = new Set(rs.map((r) => r.id));
  const porId = Object.fromEntries(rs.map((r) => [r.id, r.texto]));
  const citados = new Set();
  const revisar = (x, donde) => { for (const i of x.ids || []) { if (i !== 'FICHA' && !ids.has(i)) out.push(`C14 ${donde}: el id ${i} no existe`); citados.add(i); } };
  for (const k of ['como_se_presenta', 'cosas_concretas_suyas', 'repite_sin_que_se_lo_pregunten', 'conclusiones_propias']) (reg.narrador?.[k] || []).forEach((x) => revisar(x, `narrador.${k}`));
  for (const p of reg.personas || []) { if (!p.estado) out.push(`C14 persona ${p.id}: sin estado`); (p.hechos || []).forEach((h) => revisar(h, `persona ${p.id}`)); revisar({ ids: p.estado_ids }, `persona ${p.id}`); }
  for (const l of reg.lugares || []) { if (!l.estado) out.push(`C14 lugar ${l.id}: sin estado`); revisar(l, `lugar ${l.id}`); }
  for (const e of reg.episodios || []) { if (!e.estado) out.push(`C14 episodio ${e.id}: sin estado`); revisar(e, `episodio ${e.id}`); (e.variantes || []).forEach((v) => revisar(v, `episodio ${e.id}`)); }
  (reg.linea_de_tiempo || []).forEach((x) => revisar(x, 'linea_de_tiempo'));
  (reg.hoy || []).forEach((x) => revisar(x, 'hoy'));
  const conLugar = new Set([...(reg.episodios || []).flatMap((e) => [...e.ids, ...(e.variantes || []).flatMap((v) => v.ids)]), ...(reg.sin_lugar || []).map((s) => s.id)]);
  for (const r of rs) if (!conLugar.has(r.id)) out.push(`C14: ${r.id} no está en ningún episodio ni en sin_lugar`);
  const fr = reg.voz?.frases || [];
  if (fr.length < 15 || fr.length > 20) out.push(`C14 voz: ${fr.length} frases (van de 15 a 20)`);
  for (const f of fr) if (!porId[f.id] || !esSubsecuencia(f.texto, porId[f.id])) out.push(`C14 voz: la frase "${f.texto.slice(0, 60)}" no es textual de ${f.id}`);
  for (const x of [...(reg.linea_de_tiempo || []), ...(reg.episodios || [])]) {
    if (x.segura !== true) continue;
    const textos = (x.ids || []).map((i) => (i === 'FICHA' ? fichaTxt : porId[i] || '')).join(' ');
    const num = /\d/.test(textos) || /\b(uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|dieciseis|diecisiete|dieciocho|diecinueve|veinte|treinta|cuarenta|cincuenta)\b/.test(norm(textos));
    if (!num) out.push(`C14: "${(x.evento || x.que || '').slice(0, 50)}" está como fecha segura y sus ids no tienen un número`);
  }
  const usadas = new Set((reg.episodios || []).flatMap((e) => e.ids));
  const cortadas = new Set((reg.frases_cortadas || []).map((f) => f.id));
  // Solo cuenta el "…" al final de la respuesta (corte del audio); a mitad de frase es una duda al hablar.
  for (const r of rs) if (usadas.has(r.id) && /(…|\.\.\.)\s*$/.test(r.texto) && !cortadas.has(r.id)) out.push(`C14: ${r.id} tiene "…" y no está en frases_cortadas`);
  const vistos = new Map();
  for (const p of reg.personas || []) { const k = `${norm(p.nombre || '')}|${norm(p.relacion || '')}`; if (p.nombre && vistos.has(k)) out.push(`C14: ${p.id} y ${vistos.get(k)} tienen el mismo nombre y relación`); vistos.set(k, p.id); }
  const conf = (fichaTxt.match(/<confirmado_por_el_narrador>([\s\S]*?)<\/confirmado_por_el_narrador>/) || [])[1] || '';
  const lineas = conf.split('\n').filter((l) => /^\s*-\s+/.test(l));
  if (lineas.length && (reg.confirmados || []).length < lineas.length) out.push(`C14: hay ${lineas.length} confirmados en la ficha y el registro tiene ${(reg.confirmados || []).length}`);
  for (const c of reg.confirmados || []) if (!(c.usado_en || []).length) out.push(`C14: el confirmado "${c.texto.slice(0, 60)}" no tiene usado_en`);
  // receta v2
  for (const e of reg.episodios || []) {
    if (!['familia', 'lector', 'nadie'].includes(e.a_quien)) out.push(`C14 episodio ${e.id}: a_quien tiene que ser familia, lector o nadie`);
    if (e.es_escena && !(e.detalles || []).length) out.push(`C14 episodio ${e.id}: es escena y no tiene detalles`);
  }
  for (const p of reg.personas || []) if (!Array.isArray(p.rasgos_hoy)) out.push(`C14 persona ${p.id}: falta rasgos_hoy (puede ser [])`);
  return out;
}

// ---------- C9: arreglo ----------
function c9(probs, nueva, vieja) {
  const out = [];
  // Solo el texto de la pieza: el JSON de cambios de abajo trae las frases viejas en "antes".
  const corte = nueva.lastIndexOf('\n---\n');
  const pieza = corte < 0 ? nueva : nueva.slice(0, corte);
  const n = ` ${norm(pieza)} `;
  const cambios = new Map((corte >= 0 ? safeJSON(nueva.slice(corte + 5))?.cambios || [] : []).map((c) => [c.problema, c]));
  for (const p of probs) {
    const ch = cambios.get(p.n);
    if (ch?.resultado === 'disputa' && HECHOS.includes(p.tipo)) { out.push({ n: p.n, estado: 'disputa', id: ch.disputa_id, cita: ch.disputa_frase, frase: p.frase }); continue; }
    const f = norm(p.frase || '');
    if (f && f.split(' ').length >= 3 && n.includes(` ${f} `)) out.push({ n: p.n, estado: 'sigue', frase: p.frase, tipo: p.tipo });
  }
  const viejos = parrafos(vieja), nuevos = new Set(parrafos(nueva.split(/\n---\n/)[0]).map(norm));
  const marcados = probs.map((p) => norm(p.frase || '')).filter(Boolean);
  const sinProblema = viejos.filter((v) => !marcados.some((m) => norm(v).includes(m)));
  const iguales = sinProblema.filter((v) => nuevos.has(norm(v))).length;
  return { abiertos: out, identicos: sinProblema.length ? Math.round((100 * iguales) / sinProblema.length) : 100 };
}
const safeJSON = (s) => { try { return JSON.parse(s.replace(/^```(json)?\s*/m, '').replace(/```\s*$/m, '')); } catch { return null; } };

// ---------- receta v2: C18–C22 ----------
const capituloDe = (plan, reg, rid) => piezaDeR(plan, reg, rid);
// C18: toda respuesta aparece en alguna marca [[R..]] o en Sus frases.
export function c18(psCrudas, rs, reg, plan) {
  const usadas = new Set(psCrudas.flatMap((p) => marcas(p.texto)));
  for (const f of plan.sus_frases || []) for (const i of f.ids || [f.id]) usadas.add(i);
  const fuera = new Set([...(reg.episodios || []).filter((e) => e.no_poner).flatMap((e) => e.ids)]);
  const out = [];
  for (const r of rs) {
    if (usadas.has(r.id) || fuera.has(r.id)) continue;
    out.push({ pieza: capituloDe(plan, reg, r.id), control: 'C18', tipo: 'falta', frase: '', que: `falta ${r.id}: "${r.texto.slice(0, 160)}…" no aparece en ninguna marca del libro` });
  }
  // v4: marcas por tramo (no por párrafo); la última línea de la pieza siempre lleva marca, así nada queda sin rastrear.
  for (const p of psCrudas) {
    if (p.pieza === 'sus_frases') continue;
    const pars = p.texto.split(/\n\s*\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith('#'));
    const ult = pars[pars.length - 1] || '';
    if (ult && !/\[\[[^\]]*\]\]\s*$/.test(ult)) out.push({ pieza: p.pieza, control: 'C18', tipo: 'sin_marca', frase: ult.slice(0, 120), que: 'la pieza termina sin marca [[R..]]: el último tramo tiene que decir qué respuestas usó' });
  }
  return out;
}
// C19: lo que le habla a la familia está en la carta.
export function c19(psCrudas, reg) {
  const carta = psCrudas.find((p) => p.pieza === 'carta');
  const enCarta = new Set(carta ? marcas(carta.texto) : []);
  const out = [];
  for (const e of reg.episodios || []) {
    if (e.a_quien !== 'familia' || e.no_poner) continue;
    for (const i of e.ids) if (!enCarta.has(i)) out.push({ pieza: 'carta', control: 'C19', tipo: 'falta', frase: '', que: `${i} le habla a la familia (${e.que.slice(0, 80)}) y no está en la carta` });
  }
  return out;
}
// C20 (plan): el último capítulo no junta más de 2 reflexiones o gustos que no sean media línea.
export function c20(plan, reg) {
  const eps = Object.fromEntries((reg.episodios || []).map((e) => [e.id, e]));
  const ult = plan.capitulos[plan.capitulos.length - 1];
  // receta v3.1: las medias líneas también cuentan (en la prueba 3 la bolsa volvió por ahí).
  const sueltas = (ult.piezas || []).filter((p) => ['reflexion', 'gusto'].includes(eps[p.episodio]?.tipo));
  const otros = [];
  const carta = new Set(plan.carta?.ids || []);
  for (const e of reg.episodios || []) if (e.a_quien === 'familia' && !e.no_poner && !e.ids.some((i) => carta.has(i))) otros.push(`C19: el episodio ${e.id} le habla a la familia y no está en carta.ids`);
  if (!plan.carta?.titulo) otros.push('C13: la carta no tiene título');
  // receta v3: a quien está dedicado el libro y no le dejó mensaje, se dice en faltantes (nunca se inventa).
  const faltan = ` ${norm((plan.faltantes || []).map((f) => `${f.que} ${f.donde || ''}`).join(' '))} `;
  for (const pid of plan.carta?.para_personas || []) {
    const per = (reg.personas || []).find((p) => p.id === pid);
    if (!per) { otros.push(`C19: carta.para_personas tiene ${pid}, que no está en el registro`); continue; }
    const suyos = [per.id, per.nombre, ...(per.apodos || [])].filter(Boolean).map(norm);
    const leHabla = (reg.episodios || []).some((e) => e.a_quien === 'familia' && !e.no_poner && (e.a_quien_nombres || []).some((n) => suyos.includes(norm(n))));
    if (!leHabla && !suyos.some((n) => n.length > 1 && faltan.includes(` ${n} `))) otros.push(`C19: el libro está dedicado a ${per.nombre} y no hay mensaje para ${per.nombre} ni faltante que lo diga`);
  }
  return [...otros, ...(sueltas.length > 2 ? [`C20: el último capítulo junta ${sueltas.length} reflexiones o gustos (${sueltas.map((p) => p.episodio).join(', ')}); máximo 2: el resto vuelve a su capítulo o es remate de su escena`] : [])];
}
// C21: cada persona con algún hecho aparece en el libro.
function c21(ps, reg, plan) {
  const libro = ` ${norm(ps.filter((p) => p.pieza !== 'sus_frases').map((p) => p.texto).join(' '))} `;
  const out = [];
  for (const p of reg.personas || []) {
    if (!(p.hechos || []).length) continue;
    const nombres = [p.nombre, ...(p.apodos || [])].filter(Boolean).map(norm).filter((n) => n.length > 1);
    if (!nombres.length || nombres.some((n) => libro.includes(` ${n} `) || libro.includes(` ${n.split(' ')[0]} `))) continue;
    const ids = p.hechos.flatMap((h) => h.ids);
    out.push({ pieza: capituloDe(plan, reg, ids[0]), control: 'C21', tipo: 'falta', frase: '', que: `${p.nombre} (${p.relacion}) no aparece en el libro; lo que se dijo: ${p.hechos.map((h) => h.hecho).join('; ').slice(0, 160)}` });
  }
  return out;
}
// C22: en cada escena, al menos 70 % de los detalles de su episodio están en el texto.
function c22(ps, reg, plan) {
  const eps = Object.fromEntries((reg.episodios || []).map((e) => [e.id, e]));
  const out = [];
  for (const c of plan.capitulos) {
    const p = ps.find((x) => x.pieza === `cap_${c.n}`);
    if (!p) continue;
    const txt = ` ${norm(p.texto)} `;
    for (const pz of (c.piezas || []).filter((x) => x.forma === 'escena')) {
      const det = eps[pz.episodio]?.detalles || [];
      if (det.length < 2) continue;
      const falta = det.filter((d) => { const ws = palabras(d).filter((w) => w.length > 3); return ws.length && ws.filter((w) => txt.includes(` ${w}`)).length < Math.ceil(ws.length / 2); });
      if (falta.length > det.length * 0.3) out.push({ pieza: p.pieza, control: 'C22', tipo: 'escena_flaca', frase: '', que: `la escena ${pz.episodio} usa ${det.length - falta.length} de ${det.length} detalles; faltan: ${falta.join(' | ')}` });
    }
  }
  return out;
}

// ---------- receta v3: C20 en el texto, C23–C26 ----------
const idsDeTipo = (reg, tipos) => new Set((reg.episodios || []).filter((e) => tipos.includes(e.tipo)).flatMap((e) => e.ids));
// C20 (texto): el último capítulo no apila reflexiones y cierra en su imagen_final.
export function c20Texto(psCrudas, reg, plan) {
  const ult = plan.capitulos[plan.capitulos.length - 1];
  const p = psCrudas.find((x) => x.pieza === `cap_${ult.n}`);
  if (!p) return [];
  const out = [];
  const pars = p.texto.split(/\n\s*\n/).map((x) => x.trim()).filter((x) => x && !x.startsWith('#'));
  const reflex = idsDeTipo(reg, ['reflexion', 'gusto', 'balance']);
  const solo = pars.filter((x) => { const m = marcas(x); return m.length && m.every((i) => reflex.has(i)); });
  if (solo.length > 2) out.push({ pieza: p.pieza, control: 'C20', tipo: 'bolsa', frase: sinMarcas(solo[2]).slice(0, 120), que: `${solo.length} párrafos del último capítulo son solo reflexiones o gustos (máximo 2)` });
  const epImf = (reg.episodios || []).find((e) => e.id === ult.imagen_final?.episodio);
  const deImagen = new Set([...(epImf?.ids || []), ult.imagen_final?.frase_id].filter(Boolean));
  const ultimo = pars[pars.length - 1] || '';
  if (deImagen.size && !marcas(ultimo).some((i) => deImagen.has(i))) out.push({ pieza: p.pieza, control: 'C20', tipo: 'bolsa', frase: sinMarcas(ultimo).slice(0, 120), que: `el último párrafo no es la imagen final del plan (${ult.imagen_final.episodio}${ult.imagen_final.que ? `: ${ult.imagen_final.que}` : ''})` });
  return out;
}

// C23: el balance de vida entra entero en "Antes de cerrar".
export function c23(psCrudas, reg) {
  const antes = psCrudas.find((p) => p.pieza === 'antes_de_cerrar');
  const en = new Set(antes ? marcas(antes.texto) : []);
  const out = [];
  for (const e of reg.episodios || []) {
    if (e.tipo !== 'balance' || e.no_poner) continue;
    for (const i of e.ids) if (!en.has(i)) out.push({ pieza: 'antes_de_cerrar', control: 'C23', tipo: 'falta', frase: '', que: `falta ${i}: ${e.que.slice(0, 100)} (balance de vida) no está en Antes de cerrar` });
  }
  return out;
}

// C24: lo que el cotejo encontró afuera está en el libro (la mitad o más de sus palabras de contenido, en su pieza).
export function c24(ps, cotejo, plan, reg, psCrudas = [], rs = null) {
  const out = [];
  for (const f of cotejoValido(cotejo, rs).validas) {
    const pieza = piezaDeR(plan, reg, f.id, psCrudas);
    const txt = ` ${norm(ps.find((p) => p.pieza === pieza)?.texto || '')} `;
    const ws = palabras(f.frase || '').filter((w) => w.length > 3);
    if (!ws.length) continue;
    const estan = ws.filter((w) => txt.includes(` ${w} `)).length;
    // v4: la frase puede entrar narrada (no textual): alcanza con un tercio de sus palabras de contenido.
    if (estan < Math.ceil(ws.length / 3)) out.push({ pieza, control: 'C24', tipo: 'falta_frase', frase: '', que: `falta frase de ${f.id}: «${f.frase}»${f.por_que ? ` (${f.por_que})` : ''}` });
  }
  return out;
}

/** Lo del cotejo que vale: id que existe y frase textual de esa respuesta (C6). Lo demás se descarta y va al informe. */
export function cotejoValido(cotejo, rs) {
  const validas = [], descartadas = [];
  for (const f of cotejo?.faltan || []) {
    const r = rs?.find((x) => x.id === f.id);
    if (rs && (!r || !esSubsecuencia(f.frase || '', r.texto))) descartadas.push({ ...f, motivo: r ? 'la frase no es textual de esa respuesta' : 'el id no existe' });
    else validas.push(f);
  }
  return { validas, descartadas };
}

// C25 (no bloquea): oraciones que apuntan a algo con "ese día", "ahí"… — van al lector como <referencias>.
const REFERENCIA = /\b(ese dia|esa noche|esa tarde|esa manana|esa vez|ese momento|esa casa|ese lugar|ese ano|ahi|alla)\b/;
export function referencias(ps) {
  const out = [];
  for (const p of ps) parrafos(p.texto).forEach((par, i) => {
    for (const o of oraciones(par)) if (REFERENCIA.test(norm(o))) out.push({ pieza: p.pieza, parrafo: i + 1, oracion: o });
  });
  return out;
}

// C26: en el repaso, el verificador no puede dar vuelta lo que la ronda anterior ya decidió.
const OPUESTO = { presente: 'pasado', pasado: 'presente', nombre: 'nombre' };
const seTocan = (a, b) => {
  const x = [...new Set(palabras(a || '').filter((w) => w.length > 3))], y = new Set(palabras(b || '').filter((w) => w.length > 3));
  return x.length > 0 && y.size > 0 && x.filter((w) => y.has(w)).length >= Math.ceil(Math.min(x.length, y.size) / 2);
};
export function c26(repaso, anteriores) {
  const res = { oscila: [], contradice: [], nuevos: [] };
  for (const pr of repaso?.problemas || []) {
    if (pr.tipo === 'contradice_decision') { res.contradice.push(pr); continue; }
    const previas = (anteriores[pr.pieza] || []).filter((d) => OPUESTO[d.tipo] === pr.tipo);
    // Oscila si marca, al revés, lo que la ronda anterior ya cambió (mismo tipo "nombre": solo si de verdad se cambió).
    const choca = previas.find((d) => d.tipo === pr.tipo ? d.resultado === 'cambiado' && d.despues && seTocan(pr.frase, d.despues) : seTocan(pr.frase, d.despues) || seTocan(pr.frase, d.frase));
    if (choca) res.oscila.push({ ...pr, control: 'C26', antes: { tipo: choca.tipo, frase: choca.frase, despues: choca.despues } });
    else res.nuevos.push(pr);
  }
  return res;
}

const HECHOS = ['presente', 'pasado', 'nombre', 'fecha', 'lugar', 'cita', 'motivo', 'sentimiento', 'inventado', 'confirmado_no_usado', 'cortada', 'delicado'];
/** Decisiones de la ronda anterior, por pieza: los problemas de hechos con lo que devolvió el arreglo. */
export function decisionesAnteriores(dir) {
  const carpeta = path.join(dir, 'arreglos');
  const out = {};
  if (!existe(carpeta)) return out;
  for (const f of fsList(carpeta).filter((x) => /^problemas-.+\.json$/.test(x))) {
    const pieza = f.replace(/^problemas-|\.json$/g, '');
    const r = path.join(carpeta, `respuesta-${pieza}.txt`);
    let cambios = [];
    if (existe(r)) { const t = leer(r); const i = t.lastIndexOf('\n---\n'); cambios = (i >= 0 ? safeJSON(t.slice(i + 5))?.cambios : null) || []; }
    out[pieza] = leerJSON(path.join(carpeta, f)).filter((p) => p.origen === 'verificador' && HECHOS.includes(p.tipo)).map((p) => {
      const c = cambios.find((x) => x.problema === p.n) || {};
      return { n: p.n, tipo: p.tipo, frase: p.frase, correccion: p.correccion || '', resultado: c.resultado || 'sin respuesta', despues: c.despues || '' };
    });
  }
  return out;
}

// ---------- main ----------
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [, , dirArg, que, arg] = process.argv;
  const dir = path.resolve(dirArg);
  const rs = respuestas(dir);
  const fichaTxt = ficha(dir);
  const reg = existe(salida(dir, 'registro.json')) ? leerJSON(salida(dir, 'registro.json')) : null;
  let problemas = [];
  if (que === 'registro') problemas = c14(reg, rs, fichaTxt);
  else if (que === 'plan') { const plan = planConR(leerJSON(salida(dir, 'plan.json')), reg); problemas = [...c12(plan, rs, reg), ...c13(plan, reg), ...c20(plan, reg)]; }
  else if (que === 'piezas') {
    const crudas = piezas(dir);
    const ps = crudas.map((p) => ({ ...p, texto: sinMarcas(p.texto) }));
    const plan = planConR(leerJSON(salida(dir, 'plan.json')), reg);
    problemas.push(...c18(crudas, rs, reg, plan), ...c19(crudas, reg), ...c21(ps, reg, plan), ...c20Texto(crudas, reg, plan), ...c23(crudas, reg));
    const arreglado = existe(path.join(dir, 'arreglos')) && fsList(path.join(dir, 'arreglos')).some((f) => f.startsWith('respuesta-'));
    if (arreglado && existe(salida(dir, 'cotejo.json'))) problemas.push(...c24(ps, leerJSON(salida(dir, 'cotejo.json')), plan, reg, crudas, rs));
    const regTxt = JSON.stringify(reg || {});
    // El último capítulo es el del plan (en la prueba corta hay un solo capítulo escrito y no es el último).
    const ultimo = `cap_${plan.capitulos[plan.capitulos.length - 1].n}`;
    for (const p of ps) {
      const deEsta = [...c1(p, rs), ...c2(p), ...c3(p), ...c4(p, rs, fichaTxt, regTxt), ...c5(p, rs, fichaTxt), ...(p.pieza === 'sus_frases' ? [] : c6(p, rs)), ...c8(p, rs), ...c10(p, rs, reg?.voz?.trato), ...(p.pieza === ultimo ? c15(p) : []), ...(p.pieza.startsWith('cap_') && p.pieza !== ultimo ? c28(p) : []), ...(p.pieza !== 'sus_frases' ? c29(p, reg) : [])];
      problemas.push(...deEsta.map((x) => ({ pieza: p.pieza, ...x })));
      if (p.pieza === 'sus_frases') for (const l of p.texto.split('\n').filter((l) => l.startsWith('>'))) if (!enAlgunaRespuesta(l.slice(1), rs)) problemas.push({ pieza: 'sus_frases', control: 'C6', tipo: 'cita', frase: l.slice(1).trim(), que: 'frase de Sus frases que no es textual' });
    }
    const estribillos = (reg?.voz?.frases || []).map((f) => f.texto || '').filter((t) => palabras(t).length >= 3 && rs.filter((r) => esSubsecuencia(t, r.texto)).length >= 2);
    problemas.push(...c7(ps, estribillos), ...c17(ps));
  } else if (que === 'arreglo') {
    const probs = leerJSON(path.join(dir, 'arreglos', `problemas-${arg}.json`));
    const nueva = leer(path.join(dir, 'arreglos', `respuesta-${arg}.txt`));
    const vieja = piezas(dir).find((p) => p.pieza === arg)?.texto || '';
    const r = c9(probs, nueva, vieja);
    escribir(path.join(dir, 'controles', `c9-${arg}.json`), JSON.stringify(r, null, 1));
    console.log(`C9 ${arg}: ${r.abiertos.filter((a) => a.estado === 'sigue').length} siguen, ${r.abiertos.filter((a) => a.estado === 'disputa').length} disputas, ${r.identicos} % de párrafos sin problema idénticos${r.identicos < 70 ? ' (AVISO de deriva)' : ''}`);
    process.exit(r.abiertos.length ? 2 : 0);
  } else if (que === 'repaso') {
    const r = c26(leerJSON(salida(dir, 'hechos-repaso.json')), decisionesAnteriores(dir));
    escribir(path.join(dir, 'controles', 'repaso.json'), JSON.stringify(r, null, 1));
    console.log(`C26 repaso: ${r.nuevos.length} nuevos, ${r.oscila.length} el verificador oscila (no van al arreglo), ${r.contradice.length} contradicen una decisión con respuesta (van a disputa)`);
    process.exit(r.nuevos.length || r.contradice.length ? 2 : 0);
  } else { console.error('qué: registro | plan | piezas | arreglo <pieza> | repaso'); process.exit(1); }
  escribir(path.join(dir, 'controles', `${que}.json`), JSON.stringify(problemas, null, 1));
  if (!problemas.length) { console.log(`${que}: ok`); process.exit(0); }
  console.log(`${que}: ${problemas.length} problemas`);
  for (const p of problemas.slice(0, 60)) console.log(typeof p === 'string' ? `- ${p}` : `- [${p.control}] ${p.pieza}: ${p.que} — ${String(p.frase).slice(0, 100)}`);
  process.exit(2);
}
