// Parser de docs/kids/v2/banco.md y docs/kids/v2/mensajes.md → BancoKids.
// Lo usa scripts/kids-v2-json.ts para generar banco.json; un test compara el
// json commiteado contra este parseo (el md es la fuente: Naza aprueba ahí).
//
// Los md están escritos para leer, no para máquinas: este parser conoce su
// forma (tablas de preguntas, líneas **Entrada:** / **Cierre:**, viñetas de
// "Mensajes ya aprobados" y de "Extras", bloques ### con cita > en mensajes.md).
// Si un texto o un ID que el motor necesita no aparece, tira error con el
// nombre: nunca un mensaje vacío.

import type { AccionRama, BancoKids, Cap, Extra, Foto, MensajeFijo, Pregunta, Rama } from './tipos.js';

/** Los IDs de mensajes fijos que el motor usa. Si falta uno, el parseo falla. */
export const IDS_REQUERIDOS = [
  'ENTRADA-1', 'ENTRADA-2', 'ENTRADA-3', 'ENTRADA-4', 'ENTRADA-5',
  'CIERRE-1', 'CIERRE-2', 'CIERRE-3', 'CIERRE-4', 'CIERRE-FINAL',
  'B-SEGUIR', 'B-MAÑANA', 'B-AVISO-SERIA', 'B-UNA-MAS', 'B-FOTO-NOTENGO', 'B-FOTO-PLATA',
  'B-PASO', 'B-NO-PASA-NADA', 'B-DIAFEO-ACUSE-1', 'B-DIAFEO-ACUSE-2', 'B-TRANQUILA',
  'BIEN-CHICO', 'BIEN-CHICO-PL', 'BIEN-PADRE', 'AVISO-PADRE',
  'ACUSE-1', 'ACUSE-2', 'ACUSE-3', 'ACUSE-4', 'ACUSE-5', 'ACUSE-6', 'ACUSE-7',
  'ACUSE-FOTO-1', 'ACUSE-FOTO-2', 'ACUSE-FOTO-3',
  'PREG-NUEVA-CHICO', 'PREG-NUEVA-PADRE',
  'RECORD-A-4', 'RECORD-A-8', 'RECORD-B', 'RECORD-B-8',
  'PADRE-PREG-LINEA', 'PADRE-PREG-LINEA-PL',
  'EXTRAS-OFERTA', 'EXTRAS-SI', 'EXTRAS-OTRA', 'EXTRAS-FIN',
  'FINAL-CHICO', 'FINAL-CHICO-PL', 'TERMINO-PADRE',
] as const;

export type IdMensaje = (typeof IDS_REQUERIDOS)[number];

export const TEXTO_PASO = 'Dale, esa la salteamos.';
export const TEXTO_NO_PASA_NADA = 'Dale, no pasa nada.';

const ANOTACION = /\s*\*\([^)]*\)\*/g; // *(05/10)*, *(botones, 05/10; …)*

/** Saca las anotaciones *(…)* y normaliza espacios. */
export function limpiar(s: string): string {
  return s.replace(ANOTACION, '').replace(/\s+/g, ' ').trim();
}

const botonesDe = (s: string) => [...s.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]);

/** "Texto — [A] [B] *(nota)*" → texto y botones. */
export function textoYBotones(linea: string): { texto: string; botones: string[] } {
  const s = limpiar(linea);
  const i = s.indexOf(' — [');
  if (i < 0) return { texto: s, botones: [] };
  return { texto: s.slice(0, i).trim(), botones: botonesDe(s.slice(i)) };
}

/** "… → Respuesta. *(nota)* lo que siga" → "Respuesta." (corta en la primera anotación y en un paréntesis final). */
export function respuestaDe(linea: string): string {
  const i = linea.indexOf('→ ');
  if (i < 0) throw new Error(`Falta "→" en: ${linea}`);
  return linea
    .slice(i + 2)
    .replace(/\s*\*\(.*$/, '')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .trim();
}

function celdas(linea: string): string[] {
  return linea.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

const esSeparador = (c: string[]) => c.every((x) => /^:?-+:?$/.test(x));
const vacia = (s: string) => s === '—' || s === '' || s === '(no lleva)';

const ENCABEZADO_PREGUNTAS = 'ID|Pregunta|Botones|Otra puerta|Foto pegada|Marcas';

function parsearRamas(id: string, celda: string): { ramas: Rama[]; botonPaso: string } {
  const ramas: Rama[] = [];
  let botonPaso = 'Paso';
  if (vacia(celda)) return { ramas, botonPaso };
  for (const parte of celda.split('<br>')) {
    const m = /^\[([^\]]+)\]\s*→\s*(.+)$/.exec(parte.trim());
    if (!m) throw new Error(`${id}: botón sin "→": ${parte}`);
    const [, boton, resto] = m;
    const texto = limpiar(resto);
    let accion: AccionRama;
    if (texto === TEXTO_PASO) {
      botonPaso = boton;
      continue;
    } else if (texto === TEXTO_NO_PASA_NADA) accion = { tipo: 'no-aplica' };
    else accion = { tipo: 'preguntar', pasos: texto.split(' Y después, siempre: ').map((p) => p.trim()) };
    ramas.push({ boton, accion });
  }
  return { ramas, botonPaso };
}

function parsearFoto(id: string, celda: string): Foto | null {
  if (vacia(celda)) return null;
  const s = limpiar(celda);
  const i = s.indexOf('[');
  if (i < 0) throw new Error(`${id}: la foto no tiene botones`);
  const resto = s.slice(i);
  const flecha = resto.indexOf('→');
  return {
    de: id,
    texto: s.slice(0, i).trim(),
    botones: botonesDe(flecha >= 0 ? resto.slice(0, flecha) : resto),
    noTengo: flecha >= 0 ? resto.slice(flecha + 1).trim() : null,
  };
}

function parsearPregunta(cap: Cap, c: string[]): Pregunta {
  const m = /^(K\d+)\b/.exec(c[0]);
  if (!m) throw new Error(`ID de pregunta raro: ${c[0]}`);
  const id = m[1];
  if (c.length !== 6) throw new Error(`${id}: la fila tiene ${c.length} columnas y van 6`);
  const { ramas, botonPaso } = parsearRamas(id, c[2]);
  let op: Pregunta['op'] = null;
  if (!vacia(c[3])) {
    const solo = /^Solo en la rama "([^"]+)":\s*(.+)$/.exec(c[3]);
    if (solo) {
      const rama = ramas.find((r) => r.boton.startsWith(solo[1]));
      if (!rama) throw new Error(`${id}: la OP es de la rama "${solo[1]}" y no existe`);
      op = { texto: limpiar(solo[2]), soloRama: rama.boton };
    } else op = { texto: limpiar(c[3]), soloRama: null };
  }
  const marcas = c[5];
  return {
    id,
    cap,
    texto: limpiar(c[1]),
    ramas,
    botonPaso,
    op,
    foto: parsearFoto(id, c[4]),
    estrella: marcas.includes('★'),
    sacable: /\bsacable\b/.test(marcas),
    sensible: /\bsensible\b/.test(marcas),
    avisoAntes: /con aviso antes/.test(marcas),
  };
}

function parsearExtra(cap: Cap, n: number, linea: string): Extra {
  const nota = /\*\(([^)]*)\)\*/.exec(linea)?.[1] ?? '';
  const partes = nota.split(/\s*[;·,]\s*/).map((p) => p.trim());
  let texto = limpiar(linea.replace(/^-\s*/, ''));
  const foto = texto.startsWith('Foto: ');
  if (foto) texto = texto.slice('Foto: '.length);
  texto = texto.replace(/\s*\[[^\]]+\]/g, '').trim();
  const op = partes.map((p) => /^OP de (K\d+)/.exec(p)?.[1]).find(Boolean) ?? null;
  return {
    id: `X${cap}-${n}`,
    cap,
    texto,
    foto,
    deOp: op,
    soloSi: partes.includes('solo si tiene hermanos') ? 'hermanos' : partes.includes('solo si en K36 contó una pelea') ? 'pelea-k36' : null,
    sacable: partes.includes('sacable'),
    sensible: partes.includes('sensible'),
    liviana: partes.includes('liviana'),
  };
}

/** Bloques de "## Mensajes ya aprobados": título en negrita → sus viñetas. */
function bloquesAprobados(lineas: string[]): Map<string, string[]> {
  const bloques = new Map<string, string[]>();
  let actual: string[] | null = null;
  for (const l of lineas) {
    const t = /^\*\*(.+?)\*\*/.exec(l);
    if (t && !l.startsWith('-')) {
      actual = [];
      bloques.set(t[1], actual);
    } else if (actual && l.startsWith('- ')) actual.push(l);
  }
  return bloques;
}

function vineta(bloques: Map<string, string[]>, bloque: string, que: (l: string) => boolean, desc: string): string {
  const l = bloques.get(bloque)?.find(que);
  if (!l) throw new Error(`banco.md: falta ${desc} en "${bloque}"`);
  return l;
}

function mensajesAprobados(lineas: string[]): MensajeFijo[] {
  const b = bloquesAprobados(lineas);
  const fijo = (id: string, texto: string, botones: string[] = []): MensajeFijo => ({ id, texto, botones, plantilla: null });
  const conBotones = (id: string, bloque: string) => {
    const { texto, botones } = textoYBotones(vineta(b, bloque, (l) => l.includes(' — ['), `el mensaje con botones (${id})`).replace(/^- (\*\*[^*]+\*\* → )?/, ''));
    return fijo(id, texto, botones);
  };
  const respuesta = (id: string, bloque: string, que: (l: string) => boolean) => fijo(id, respuestaDe(vineta(b, bloque, que, id)));
  const diaFeo = vineta(b, 'El día feo (K39)', (l) => l.startsWith('- Acuses que rotan'), 'B-DIAFEO-ACUSE');
  const [feo1, feo2] = diaFeo.slice(diaFeo.indexOf(': ') + 2).split(' · ').map((s) => s.trim());
  return [
    conBotones('B-SEGUIR', 'Seguir ahora o mañana'),
    respuesta('B-MAÑANA', 'Seguir ahora o mañana', (l) => l.startsWith('- [Mañana sigo] →')),
    conBotones('B-AVISO-SERIA', 'Aviso antes de la seria'),
    conBotones('B-UNA-MAS', 'Una más antes de cerrar cada capítulo'),
    respuesta('B-FOTO-NOTENGO', 'Fotos', (l) => l.startsWith('- [No tengo] →')),
    respuesta('B-FOTO-PLATA', 'Fotos', (l) => l.startsWith('- Foto de la plata')),
    respuesta('B-PASO', 'Pasar una pregunta', (l) => l.includes('[Paso] →')),
    respuesta('B-NO-PASA-NADA', 'Pasar una pregunta', (l) => l.startsWith('- [No se me ocurre]')),
    fijo('B-DIAFEO-ACUSE-1', feo1),
    fijo('B-DIAFEO-ACUSE-2', feo2),
    conBotones('B-TRANQUILA', 'El día feo (K39)'),
  ];
}

export function parsearBancoMd(md: string): Omit<BancoKids, 'mensajes'> & { mensajes: MensajeFijo[] } {
  const lineas = md.split(/\r?\n/);
  const capitulos: BancoKids['capitulos'] = [];
  const preguntas: Pregunta[] = [];
  const extras: Extra[] = [];
  const mensajes: MensajeFijo[] = [];
  let seccion: 'cap' | 'extras' | 'aprobados' | null = null;
  let cap: Cap = 1;
  let enTabla = false;
  let capExtra: Cap | null = null;
  let nExtra = 0;
  const aprobados: string[] = [];

  for (const l of lineas) {
    const h2 = /^## (.+)$/.exec(l);
    if (h2) {
      const c = /^Capítulo (\d) · (.+)$/.exec(h2[1]);
      if (c) {
        seccion = 'cap';
        cap = Number(c[1]) as Cap;
        capitulos.push({ n: cap, titulo: c[2].trim() });
      } else if (h2[1] === 'Extras') seccion = 'extras';
      else if (h2[1] === 'Mensajes ya aprobados') seccion = 'aprobados';
      else seccion = null;
      enTabla = false;
      continue;
    }
    if (seccion === 'cap') {
      const entrada = /^\*\*Entrada:\*\* (.+)$/.exec(l);
      if (entrada) mensajes.push({ id: `ENTRADA-${cap}`, texto: limpiar(entrada[1]), botones: [], plantilla: null });
      const cierre = /^\*\*Cierre( \(fin de las preguntas\))?:\*\* (.+)$/.exec(l);
      if (cierre) {
        const { texto, botones } = textoYBotones(cierre[2]);
        mensajes.push({ id: cierre[1] ? 'CIERRE-FINAL' : `CIERRE-${cap}`, texto, botones, plantilla: null });
      }
      if (!l.startsWith('|')) {
        enTabla = false;
        continue;
      }
      const c = celdas(l);
      if (c.join('|') === ENCABEZADO_PREGUNTAS) {
        enTabla = true;
        continue;
      }
      if (enTabla && !esSeparador(c)) preguntas.push(parsearPregunta(cap, c));
    } else if (seccion === 'extras') {
      const t = /^\*\*Cap\. (\d)\*\*/.exec(l);
      if (t) {
        capExtra = Number(t[1]) as Cap;
        nExtra = 0;
      } else if (capExtra && l.startsWith('- ')) extras.push(parsearExtra(capExtra, ++nExtra, l));
    } else if (seccion === 'aprobados') aprobados.push(l);
  }
  mensajes.push(...mensajesAprobados(aprobados));
  return { capitulos, preguntas, extras, mensajes };
}

/** Los mensajes de mensajes.md: bloques "### ID · …" con cita (>) y las tablas "| ID | Texto |". */
export function parsearMensajesMd(md: string): MensajeFijo[] {
  const lineas = md.split(/\r?\n/);
  type Crudo = { id: string; parrafos: string[]; botones: string[]; plantilla: string | null; resto: string | null };
  const crudos: Crudo[] = [];
  const tablas: MensajeFijo[] = [];
  let actual: Crudo | null = null;
  let parrafo: string[] = [];
  let enTabla = false;

  const cerrarParrafo = () => {
    if (actual && parrafo.length) actual.parrafos.push(limpiar(parrafo.join(' ')));
    parrafo = [];
  };

  for (const l of lineas) {
    if (/^#{2,3} /.test(l)) {
      cerrarParrafo();
      const m = /^### ([A-Z][A-Z0-9-]*[A-Z0-9])(?=\s|$)/.exec(l);
      actual = m ? { id: m[1], parrafos: [], botones: [], plantilla: null, resto: null } : null;
      if (actual) crudos.push(actual);
      enTabla = false;
      continue;
    }
    if (l.startsWith('|')) {
      const c = celdas(l);
      if (c.join('|') === 'ID|Texto') enTabla = true;
      else if (enTabla && !esSeparador(c)) tablas.push({ id: c[0], texto: limpiar(c[1]), botones: [], plantilla: null });
      continue;
    }
    enTabla = false;
    if (!actual) continue;
    const plantilla = /\*\*Plantilla\*\* `([a-z0-9_]+)`/.exec(l);
    if (plantilla && l.startsWith('- ')) actual.plantilla = plantilla[1];
    const cita = /^>\s?(.*)$/.exec(l);
    if (!cita) {
      cerrarParrafo();
      continue;
    }
    const t = cita[1].trim();
    const resto = /^\(el resto, igual que ([A-Z0-9-]+)\)$/.exec(t);
    if (t === '') cerrarParrafo();
    else if (resto) {
      cerrarParrafo();
      actual.resto = resto[1];
    } else if (/^(\[[^\]]+\]\s*)+$/.test(t)) actual.botones.push(...botonesDe(t));
    else parrafo.push(t);
  }
  cerrarParrafo();

  const porId = new Map(crudos.map((c) => [c.id, c]));
  const fijos = crudos
    .filter((c) => c.parrafos.length > 0)
    .map((c): MensajeFijo => {
      let parrafos = c.parrafos;
      let botones = c.botones;
      if (c.resto) {
        const base = porId.get(c.resto);
        if (!base) throw new Error(`mensajes.md: ${c.id} dice "igual que ${c.resto}" y ${c.resto} no está`);
        parrafos = [...parrafos, ...base.parrafos.slice(parrafos.length)];
        if (botones.length === 0) botones = base.botones;
      }
      return { id: c.id, texto: parrafos.join('\n\n'), botones, plantilla: c.plantilla };
    });
  return [...fijos, ...tablas];
}

/** Los dos md → el banco entero. Valida IDs requeridos y repetidos. */
export function parsearBancoKids(bancoMd: string, mensajesMd: string): BancoKids {
  const b = parsearBancoMd(bancoMd);
  const mensajes = [...b.mensajes, ...parsearMensajesMd(mensajesMd)];
  const vistos = new Set<string>();
  for (const m of mensajes) {
    if (vistos.has(m.id)) throw new Error(`${m.id}: ID repetido entre banco.md y mensajes.md`);
    if (m.texto === '') throw new Error(`${m.id}: sin texto`);
    vistos.add(m.id);
  }
  for (const id of IDS_REQUERIDOS) if (!vistos.has(id)) throw new Error(`Falta el mensaje ${id} en banco.md o mensajes.md`);
  return { ...b, mensajes };
}
