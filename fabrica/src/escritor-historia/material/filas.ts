// La entrevista de una historia pasada al material del escritor (receta, sección 2), con el formato de Familiar
// (escritor/material/de-entrevista.ts): R01… en el orden en que llegaron, con su pregunta y su origen, y las «paso»
// aparte. Lo propio de historia está en el origen: el ID de la pregunta del banco con su tramo, «la dejó escrita …»
// en las de quien regala y en las del panel, y el aviso de la foto. Puro: sin base ni modelos.
//
// Reglas (las de Familiar, sobre el banco de historia):
//   - La pregunta es el texto que se le mandó (la charla, por ID). Si no está, el del banco renderizado. Las de quien
//     regala y las del panel van con la pregunta tal cual la escribieron, no con el mensaje que la envolvía.
//   - "paso": paso, vacío, olvido o "ya te lo conté"; o un "no" en una pregunta que no es de historia (HC10, FOTO-H).
//   - La repregunta del cazador (RP~X) va pegada a X, con el mismo id, si contó algo.
//   - FOTO-H: la marca de la foto sale; si además contó algo, queda, y el origen avisa que la imagen no está.
//   - TEMA (lo que contestó en TEMA-ABIERTO) llega como una respuesta más.
import { esc } from '../../escritor/material/de-entrevista.js';
import { preguntaPorId, TEXTOS_TEMAS } from '../../historia/entrevista/banco.js';
import { deRepregunta, FOTO, PREFIJO_PANEL, preguntaDeClave, PROPIAS } from '../../historia/entrevista/flujo.js';
import { interpretar, leerBoton, PREGUNTA_COMUN, valeBoton, type Interpretacion, type PreguntaParaInterpretar } from '../../historia/entrevista/respuesta.js';
import { renderizar, type FichaTexto } from '../../historia/entrevista/texto.js';
import type { EntrevistaHistoria, FilaHistoria, MaterialHistoria, Tramo } from './tipos.js';

/** La misma marca que entrevistador/src/historia/tipos.ts. */
export const MARCA_FOTO = '⟦foto⟧';
/** La clave de lo que contestó en TEMA-ABIERTO (entrevistador/src/historia/tipos.ts, CLAVE_TEMA). */
export const CLAVE_TEMA = 'TEMA';

const PASO: readonly Interpretacion[] = ['paso', 'vacio', 'olvido', 'ya-conto'];

/** El tramo de la historia de una pregunta del banco (receta, sección 2). Las demás no tienen: va el de su tiempo. */
export function tramoDe(id: string): Tramo | undefined {
  if (/^(HC1|HC1-A|HC2)$/.test(id)) return 'antes';
  if (/^(HC3|HC4)$/.test(id)) return 'comienzo';
  if (/^H[MNEQPTO]\d+$/.test(id)) return 'tema';
  if (/^(HC5|HC5-Q|HC6)$/.test(id)) return 'dificil';
  if (id === 'HC7') return 'giro';
  if (/^HC[89](-[QPT])?$/.test(id)) return 'despues';
  if (id === 'HC10') return 'cierre';
  return undefined;
}

/** Lo que se le mandó con cada ID (la última vez, si se mandó dos). */
function mandado(e: EntrevistaHistoria): Map<string, string> {
  const out = new Map<string, string>();
  for (const g of e.charla) {
    if (g.de !== 'bio') continue;
    const porId = new Map<string, string[]>();
    for (const p of g.partes) porId.set(p.id, [...(porId.get(p.id) ?? []), p.texto]);
    for (const [id, textos] of porId) out.set(id, textos.join('\n\n'));
  }
  return out;
}

const fichaTexto = (e: EntrevistaHistoria): FichaTexto => ({
  nombre: e.ficha.nombre,
  genero: e.ficha.genero,
  ...(e.ficha.formaTrato ? { formaTrato: e.ficha.formaTrato } : {}),
  ...(e.ficha.quienRegala ? { quienRegala: e.ficha.quienRegala } : {}),
  ...(e.idioma !== 'es-AR' ? { idioma: e.idioma } : {}),
  tema: e.ficha.tema,
  ...(e.ficha.temaLibre ? { temaLibre: e.ficha.temaLibre } : {}),
});

/** La historia en sus palabras: la de la ficha (compra o TEMA-ABIERTO); si no, lo que contestó en TEMA-ABIERTO. */
export function temaLibreDe(e: EntrevistaHistoria): string | undefined {
  const deFicha = e.ficha.temaLibre?.trim();
  if (deFicha) return deFicha;
  const tema = e.respuestas.find(([k]) => k === CLAVE_TEMA)?.[1];
  const limpio = tema ? leerBoton(tema).resto.replace(/\s+/g, ' ').trim() : '';
  return limpio || undefined;
}

export function filasDeHistoria(e: EntrevistaHistoria): FilaHistoria[] {
  const enviados = mandado(e);
  const ficha = fichaTexto(e);
  const antes = new Map<string, string>();
  const filas: FilaHistoria[] = [];
  const quienRegala = e.ficha.quienRegala?.trim();
  for (const [clave, crudoConFoto] of e.respuestas) {
    const crudo = clave === FOTO ? crudoConFoto.replace(MARCA_FOTO, '').trim() : crudoConFoto;
    const madre = deRepregunta(clave);
    if (madre !== undefined) {
      pegarA([...filas].reverse().find((f) => f.clave === madre), clave, crudo, e);
      antes.set(clave, crudoConFoto);
      continue;
    }
    const delBanco = preguntaPorId(clave, e.idioma);
    const propia = PROPIAS.indexOf(clave);
    const panel = clave.startsWith(PREFIJO_PANEL) ? e.panel.find((p) => `${PREFIJO_PANEL}${p.id}` === clave) : undefined;
    const pregunta =
      propia >= 0 ? (e.propias[propia] ?? enviados.get(clave) ?? '(pregunta sin texto guardado)')
        : panel ? panel.texto
          : enviados.get(clave) ?? (delBanco ? renderizar(delBanco.texto, ficha, new Map(antes)) : clave === CLAVE_TEMA ? enviados.get('TEMA-ABIERTO') ?? '(eligió qué historia contar)' : '(pregunta sin texto guardado)');
    const paraInterpretar: PreguntaParaInterpretar = preguntaDeClave(clave, e.idioma) ?? { ...PREGUNTA_COMUN, id: clave };
    const interp = interpretar(paraInterpretar, crudo, e.idioma);
    const { boton, resto } = leerBoton(crudo);
    let texto = resto.trim();
    if (boton !== undefined) {
      const vale = valeBoton(paraInterpretar, boton);
      texto = !texto ? boton : vale === 'si' ? texto : `${boton}. ${texto}`;
    }
    const clase = delBanco?.clase ?? (clave === FOTO ? 'foto' : 'historia');
    const paso = PASO.includes(interp) || (interp === 'no' && clase !== 'historia') || !texto;
    const tramo = tramoDe(clave);
    const idPregunta = clave === CLAVE_TEMA ? 'TEMA-ABIERTO' : panel ? 'del panel' : clave;
    const origen = [
      `pregunta ${idPregunta}`,
      tramo ? `(tramo: ${tramo})` : '',
      clave === CLAVE_TEMA ? '(con esta respuesta eligió qué historia contar)' : '',
      propia >= 0 ? `(la dejó escrita ${quienRegala || 'quien regala el libro'})` : '',
      panel ? '(la dejó escrita alguien de la familia)' : '',
      clave === FOTO && !paso ? '(describe una foto que mandó; la imagen no está en este material)' : '',
      boton !== undefined ? `(tocó el botón «${boton}»)` : '',
    ].filter(Boolean).join(' ');
    filas.push({ id: `R${String(filas.length + 1).padStart(2, '0')}`, clave, pregunta, texto, origen, ...(tramo ? { tramo } : {}), paso });
    antes.set(clave, crudoConFoto);
  }
  return filas;
}

/** Suma lo que contó en RP~X a la fila de X (si contó algo y la fila existe), como Familiar. */
function pegarA(fila: FilaHistoria | undefined, clave: string, crudo: string, e: EntrevistaHistoria): void {
  if (!fila) return;
  const interp = interpretar(preguntaDeClave(clave, e.idioma) ?? { ...PREGUNTA_COMUN, id: clave }, crudo, e.idioma);
  const texto = leerBoton(crudo).resto.trim();
  if (!texto || PASO.includes(interp) || interp === 'no') return;
  // Si X fue un "paso" (un olvido, por ejemplo), lo que contó después queda solo.
  fila.texto = fila.texto && !fila.paso ? `${fila.texto}\n\n${texto}` : texto;
  fila.paso = false;
}

export function materialDeHistoria(e: EntrevistaHistoria): MaterialHistoria {
  const temaLibre = temaLibreDe(e);
  const quienRegala = e.ficha.quienRegala?.trim();
  return {
    nombre: e.ficha.nombre,
    idioma: e.idioma,
    tema: e.ficha.tema,
    etiqueta: TEXTOS_TEMAS[e.ficha.tema][e.idioma].etiqueta,
    ...(temaLibre ? { temaLibre } : {}),
    ...(quienRegala ? { quienRegala } : {}),
    filas: filasDeHistoria(e),
  };
}

// ---------- a la Carpeta (entradas/) ----------

const GENERO = { varon: 'varón', mujer: 'mujer', otro: 'otro' } as const;
// "tu" sin tilde también en castellano de España: C10 compara el trato del registro con 'tu' (como escritor/material/ficha-xml.ts).
const TRATO = { 'es-AR': 'vos', 'es-ES': 'tu', ca: 'tu' } as const;
const IDIOMA_LIBRO = { 'es-AR': 'castellano', 'es-ES': 'castellano de España', ca: 'catalán' } as const;
/** Una línea de la ficha: sin saltos y sin < ni > (el XML se arma a mano). */
const linea = (t: string): string => esc(t.replace(/\s*\n\s*/g, ' ').trim());

/** entradas/ficha.xml: la de Familiar (una línea por dato) con Tema, La historia en sus palabras y Quién regala. */
export function fichaHistoriaXml(e: EntrevistaHistoria, m: MaterialHistoria): string {
  const f = e.ficha;
  return [
    `Nombre: ${linea(f.nombre)}`,
    `Género: ${GENERO[f.genero]}${f.genero === 'otro' && f.formaTrato ? ` (prefiere trato ${f.formaTrato})` : ''}`,
    `Trato: ${TRATO[e.idioma]}`,
    `Idioma del libro: ${IDIOMA_LIBRO[e.idioma]}`,
    `Tema: ${linea(m.etiqueta)}`,
    ...(m.temaLibre ? [`La historia, en sus palabras: ${linea(m.temaLibre)}`] : []),
    ...(m.quienRegala ? [`Quién regala: ${linea(m.quienRegala)}`] : []),
  ].join('\n') + '\n';
}

/** entradas/respuestas.xml: el formato de Familiar (id, origen, pregunta, texto), sin las «paso». */
export function respuestasHistoriaXml(filas: FilaHistoria[]): string {
  return filas.filter((f) => !f.paso).map((f) => `<respuesta id="${f.id}" origen="${esc(f.origen).replace(/"/g, "'")}" segundos="">\n<pregunta>${esc(f.pregunta)}</pregunta>\n<texto>${esc(f.texto)}</texto>\n</respuesta>`).join('\n\n') + '\n';
}
