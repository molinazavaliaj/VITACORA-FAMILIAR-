// De las filas de la base (kids_v2, narradores, respuestas con clave_kids, fotos) al material de la receta
// (docs/kids/v2/escritor/plan.md, «Lo que entra»). Puro: no lee la base ni el disco.
//
// Reglas:
// - Sale lo que no tiene contenido: clave null o «∅», los botones (⟦botón:…⟧), lo reservado y lo vacío.
// - Cada respuesta va al item del banco de su clave: K12, K12-R1, K12-OP y K12-FOTO van a K12; una extra (X2-3)
//   y el «¿quedó algo?» (CIERRE-2) son items propios; lo que contestó en la «una más» (UNA-MAS-2) va con el
//   CIERRE-2; las PADRE-n van al final de la parte 4. La parte 5, sus extras, el CIERRE-FINAL y lo que mandó en
//   la oferta de extras van al sobre.
// - Lo que mandó en un momento sin pregunta propia (bienvenida, PREG-NUEVA) va con el item de lo anterior que
//   contó; si no hay nada antes, queda en `sinLugar` y lo ve el informe.
// - Una foto (⟦foto⟧ en la fila; la imagen en `fotos` por pregunta_orden) va al álbum con el texto que mandó con
//   ella y lo que contó después con la misma clave (K12-FOTO). Si no hubo foto («No tengo»), lo que contó con
//   esa clave va a su item, como una respuesta más.
// - Las correcciones de nombres del padre se aplican en la copia, con la palabra entera y respetando mayúsculas,
//   SOLO en la respuesta donde el padre la marcó (respuesta_id): en otra, «Mate» puede ser «tomamos mate». La
//   lista entera va al modelo como dato ({{NOMBRES}}, textoNombres) para que corrija solo cuando es ese nombre.
// - Ids cortos R01… en el orden en que llegó todo; las fotos F01…
import { BANCO, bancoDe, extra, extraEn, pregunta, preguntaEn } from '../../kids-v2/banco.js';
import { textoSegunTemas, type Tema } from '../../kids-v2/compra.js';
import { esIdiomaKids, IDIOMA_POR_DEFECTO, type IdiomaKids } from '../../kids-v2/idioma.js';
import { conGenero, esPlural, normalizarQuienRegala, primerNombre, type Genero } from '../../kids-v2/texto.js';
import type { FichaKids, FilasKids, FilaRespuestaKids, FotoKids, ItemKids, MaterialKids, ParteKids, PreguntaPadreKids, RespuestaKids } from './tipos.js';

export const MARCA_BOTON = '⟦botón:';
export const MARCA_FOTO = '⟦foto⟧';
export const SIN_CLAVE = '∅';

// Los títulos de las partes y las preguntas salen del banco del idioma del chico (bancoDe: es-ES, de
// banco-es-ES.md), con el mismo ID: a un chico de España el libro le muestra lo que le preguntamos a él.
const mensaje = (id: string, idioma: IdiomaKids): string => bancoDe(idioma).mensajes.find((m) => m.id === id)?.texto ?? '';
const tituloParte = (n: number, idioma: IdiomaKids): string => bancoDe(idioma).capitulos.find((c) => c.n === n)?.titulo ?? '';

/**
 * En qué idioma le hablamos al chico: `ficha.idioma` si la web lo puso; si no, la columna `kids_v2.idioma`; si
 * ninguno es de Kids (es-AR o es-ES), el de siempre. Mismo orden que el bot (entrevistador, kids-v2/idioma.ts).
 */
export function idiomaDelChico(f: Pick<FilasKids, 'kids'>): IdiomaKids {
  const enFicha = f.kids.ficha.idioma;
  if (esIdiomaKids(enFicha)) return enFicha;
  if (esIdiomaKids(f.kids.idioma)) return f.kids.idioma;
  return IDIOMA_POR_DEFECTO;
}

/** Dos personas («tus abuelos», «Papá y mamá») → «te la mandan». */
export const quienEsPlural = (quien: string): boolean => esPlural(quien) || /\s(y|e)\s/i.test(quien.trim());
export const lineaDelPadre = (quien: string): string => `Esta pregunta te ${quienEsPlural(quien) ? 'la mandan' : 'la manda'} ${quien}`;

type Destino = { item: string; parte: number } | null;

/** A qué item y a qué parte va lo que llegó con esa clave (null: no tiene item propio). */
export function destinoDe(clave: string): Destino {
  let m = clave.match(/^(K\d+)(?:-R\d+(?:-\d+)?|-OP|-FOTO)?$/);
  if (m) {
    try { return { item: m[1], parte: pregunta(m[1]).cap }; } catch { return null; }
  }
  if (/^X\d+-\d+$/.test(clave)) {
    try { return { item: clave, parte: extra(clave).cap }; } catch { return null; }
  }
  m = clave.match(/^(?:CIERRE|UNA-MAS)-(\d)$/);
  if (m) return { item: `CIERRE-${m[1]}`, parte: Number(m[1]) };
  if (/^PADRE-\d+$/.test(clave)) return { item: clave, parte: 4 };
  if (clave === 'CIERRE-FINAL' || clave === 'EXTRAS') return { item: 'CIERRE-FINAL', parte: 5 };
  return null;
}

/** El texto de la pregunta que le llegó con esa clave, en su idioma, con su género y los temas sacados. */
export function preguntaDe(clave: string, genero: Genero, temas: readonly Tema[], padre: PreguntaPadreKids[], idioma: IdiomaKids = IDIOMA_POR_DEFECTO): string {
  const g = (t: string) => conGenero(t, genero);
  const k = clave.match(/^(K\d+)(?:-R(\d+)(?:-(\d+))?|-(OP)|-(FOTO))?$/);
  if (k) {
    let p;
    try { p = preguntaEn(k[1], idioma); } catch { return ''; }
    if (k[2]) {
      const accion = p.ramas[Number(k[2]) - 1]?.accion;
      const paso = accion?.tipo === 'preguntar' ? accion.pasos[Number(k[3] ?? 1) - 1] : undefined;
      return g(paso ?? textoSegunTemas(p.id, p.texto, temas, idioma));
    }
    if (k[4]) return g(p.op?.texto ?? p.texto);
    if (k[5]) return g(p.foto?.texto ?? p.texto);
    return g(textoSegunTemas(p.id, p.texto, temas, idioma));
  }
  if (/^X\d+-\d+$/.test(clave)) { try { return g(extraEn(clave, idioma).texto); } catch { return ''; } }
  if (/^CIERRE-(\d|FINAL)$/.test(clave)) return g(mensaje(clave, idioma));
  if (/^UNA-MAS-\d$/.test(clave)) return g(mensaje('B-UNA-MAS', idioma));
  if (clave === 'EXTRAS') return g(mensaje('EXTRAS-OFERTA', idioma));
  const pp = padre.find((x) => x.clave === clave);
  return pp ? pp.texto : '';
}

/** El orden de los items en una parte: principales en el orden del banco, extras, el «¿quedó algo?», las del padre. */
function ordenItem(clave: string): number {
  const i = BANCO.preguntas.findIndex((p) => p.id === clave);
  if (i >= 0) return i;
  const x = BANCO.extras.findIndex((e) => e.id === clave);
  if (x >= 0) return 1000 + x;
  if (clave.startsWith('CIERRE-')) return 5000;
  const m = clave.match(/^PADRE-(\d+)$/);
  return m ? 6000 + Number(m[1]) : 9000;
}

const escaparRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Aplica las correcciones de nombres a un texto; devuelve el texto y cuántas veces cambió cada una. */
export function corregir(texto: string, correcciones: { dice: string; es: string }[]): { texto: string; veces: number[] } {
  let t = texto;
  const veces = correcciones.map((k) => {
    if (!k.dice.trim() || k.dice === k.es) return 0;
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${escaparRegExp(k.dice)}(?![\\p{L}\\p{N}])`, 'gu');
    let n = 0;
    t = t.replace(re, () => { n++; return k.es; });
    return n;
  });
  return { texto: t, veces };
}

/** El texto con contenido de una fila, o null si no lo tiene (botón, vacío). La marca de foto sale. */
export function textoDeFila(r: FilaRespuestaKids): string | null {
  const transcripcion = r.transcripcion?.trim();
  if (transcripcion) return transcripcion;
  const directo = r.texto_directo?.trim() ?? '';
  if (!directo || directo.startsWith(MARCA_BOTON)) return null;
  const sinFoto = directo.startsWith(MARCA_FOTO) ? directo.slice(MARCA_FOTO.length).trim() : directo;
  return sinFoto || null;
}

export function fichaDe(f: FilasKids): FichaKids {
  const fi = f.kids.ficha;
  const quienRegala = normalizarQuienRegala(fi.quienRegala);
  const llamado = fi.apodo?.trim() || f.narrador.como_le_dicen?.trim() || primerNombre(fi.nombre);
  return {
    narradorId: f.kids.narrador_id,
    nombre: fi.nombre.trim(),
    llamado,
    edad: fi.edad,
    genero: fi.genero === 'chica' ? 'f' : 'm',
    quienRegala,
    idioma: idiomaDelChico(f),
    preguntasPadre: (fi.preguntasPadre ?? [])
      .filter((p) => p.texto?.trim())
      .map((p, i) => {
        const quien = p.quien?.trim() ? normalizarQuienRegala(p.quien) : quienRegala;
        return { clave: `PADRE-${i + 1}`, texto: p.texto.trim(), conLinea: p.conLinea, quien, linea: p.conLinea ? lineaDelPadre(quien) : '' };
      }),
  };
}

export function materialDeFilas(f: FilasKids): MaterialKids {
  const ficha = fichaDe(f);
  const genero: Genero = ficha.genero === 'f' ? 'chica' : 'chico';
  const temas = ((f.kids.ficha.temasSacados as Tema[] | undefined) ?? []).filter((t) => typeof t === 'string');
  const idioma = idiomaDelChico(f);
  const correcciones = (f.kids.correcciones ?? []).filter((k) => k && typeof k.dice === 'string' && typeof k.es === 'string');
  const veces = correcciones.map(() => 0);

  const filas = [...f.respuestas].sort((a, b) => a.pregunta_orden - b.pregunta_orden || (a.recibido_at ?? '').localeCompare(b.recibido_at ?? ''));
  const items = new Map<string, { item: ItemKids; parte: number }>();
  const fotos: FotoKids[] = [];
  const sinLugar: MaterialKids['sinLugar'] = [];
  const usadas = new Set<string>();
  let nR = 0;
  let ultimo: Destino = null;

  const itemDe = (d: { item: string; parte: number }): ItemKids => {
    let e = items.get(d.item);
    if (!e) {
      const padre = ficha.preguntasPadre.find((p) => p.clave === d.item);
      const item: ItemKids = { clave: d.item, pregunta: preguntaDe(d.item, genero, temas, ficha.preguntasPadre, idioma), respuestas: [], ...(padre ? { padre: { quien: padre.quien, conLinea: padre.conLinea, linea: padre.linea } } : {}) };
      e = { item, parte: d.parte };
      items.set(d.item, e);
    }
    return e.item;
  };
  const nueva = (r: FilaRespuestaKids, texto: string, pregunta: string): RespuestaKids => {
    // Solo las que el padre marcó en esta respuesta: en otra, «Mate» puede ser «tomamos mate».
    const propias = correcciones.map((k) => (k.respuesta_id === r.id ? k : { dice: '', es: '' }));
    const c = corregir(texto, propias);
    c.veces.forEach((v, i) => { veces[i] += v; });
    nR++;
    return { id: `R${String(nR).padStart(2, '0')}`, clave: r.clave_kids as string, pregunta, texto: c.texto, audio: !!r.audio_path, respuestaId: r.id, audioPath: r.audio_path, orden: r.pregunta_orden };
  };

  for (const r of filas) {
    const clave = r.clave_kids;
    if (!clave || clave === SIN_CLAVE || r.reservada === true) continue;
    const esFoto = (r.texto_directo ?? '').trim().startsWith(MARCA_FOTO) && !r.transcripcion?.trim();
    const texto = textoDeFila(r);
    const destino: Destino = destinoDe(clave) ?? ultimo;
    // Una foto: va al álbum con el texto que mandó con ella (si mandó).
    if (esFoto) {
      const imagenes = f.fotos.filter((x) => x.pregunta_orden === r.pregunta_orden && !usadas.has(x.id));
      if (imagenes.length && destino) {
        const preg = preguntaDe(clave, genero, temas, ficha.preguntasPadre, idioma);
        imagenes.forEach((img, i) => {
          usadas.add(img.id);
          fotos.push({
            id: `F${String(fotos.length + 1).padStart(2, '0')}`, clave, item: destino.item, parte: destino.parte, pregunta: preg, fotoId: img.id, storagePath: img.storage_path,
            ancho: img.ancho_px ?? null, alto: img.alto_px ?? null, respuestas: i === 0 && texto ? [nueva(r, texto, preg)] : [],
          });
        });
        continue;
      }
    }
    if (!texto) continue;
    if (!destino) {
      sinLugar.push({ respuestaId: r.id, clave, texto });
      continue;
    }
    ultimo = destino;
    const preg = preguntaDe(clave, genero, temas, ficha.preguntasPadre, idioma);
    // Lo que contó de una foto que mandó va con esa foto (la última con esa clave).
    if (/-FOTO$/.test(clave)) {
      const foto = [...fotos].reverse().find((x) => x.clave === clave);
      if (foto) {
        foto.respuestas.push(nueva(r, texto, preg));
        continue;
      }
    }
    itemDe(destino).respuestas.push(nueva(r, texto, preg));
  }
  // Una foto que ninguna fila marcó: va igual al álbum, sin texto.
  for (const img of f.fotos) {
    if (usadas.has(img.id)) continue;
    fotos.push({ id: `F${String(fotos.length + 1).padStart(2, '0')}`, clave: '', item: '', parte: 0, pregunta: '', fotoId: img.id, storagePath: img.storage_path, ancho: img.ancho_px ?? null, alto: img.alto_px ?? null, respuestas: [] });
  }

  const deParte = (n: number): ItemKids[] =>
    [...items.values()].filter((e) => e.parte === n && e.item.respuestas.length).map((e) => e.item).sort((a, b) => ordenItem(a.clave) - ordenItem(b.clave));
  const partes: ParteKids[] = ([1, 2, 3, 4] as const).map((n) => ({ n, titulo: tituloParte(n, idioma), items: deParte(n) }));
  const titulo5 = tituloParte(5, idioma).replace(/\s*\(.*\)\s*$/, '');
  return {
    ficha,
    partes,
    sobre: { titulo: titulo5, items: deParte(5) },
    fotos,
    correcciones: correcciones.map((k, i) => ({ dice: k.dice, es: k.es, veces: veces[i] })),
    sinLugar,
  };
}

/** Todas las respuestas del material, en orden de id. */
export function todasLasRespuestas(m: MaterialKids): RespuestaKids[] {
  const rs = [...m.partes.flatMap((p) => p.items), ...m.sobre.items].flatMap((i) => i.respuestas);
  rs.push(...m.fotos.flatMap((f) => f.respuestas));
  return rs.sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));
}

/** El hueco {{NOMBRES}} de la receta: la lista entera de correcciones, para que el modelo corrija solo cuando es ese nombre. */
export function textoNombres(correcciones: { dice: string; es: string }[]): string {
  const ks = correcciones.filter((k, i, xs) => k.dice.trim() && k.dice !== k.es && xs.findIndex((y) => y.dice === k.dice && y.es === k.es) === i);
  if (!ks.length) return 'No hay.';
  return `Estos nombres se escriben así, ${ks.map((k) => `«${k.es}» y no «${k.dice}»`).join(', ')}. Corregilos solo cuando es ese nombre, no cuando es otra palabra que se escribe igual.`;
}
