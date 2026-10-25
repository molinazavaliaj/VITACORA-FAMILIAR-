// El libro de una historia para Bookmundo (plan 2026-10-21, Task 5.4; spec §5). Como libro/bookmundo/narrador.ts, con
// lo de historia: el libro sale de `{id}/escritor-historia/libro.md`, el idioma de `historias.idioma`, los textos de
// tapa son los de historia (textos-tapa.ts) y el interior va SIN hojas de Notas.
//
// Tapa dura pide 88 páginas. Si el libro sale con menos, no se dejan los archivos para subir (que nadie lo suba por
// error): queda solo el informe en `{id}/bookmundo/informe.txt` y un mail a los socios (una vez), que le ofrecen al
// cliente tapa blanda. La tapa blanda se arma a mano con scripts/historia-tapa-blanda.ts.
import type { SupabaseClient } from '@supabase/supabase-js';
import { AlmacenSupabase } from '../../escritor/almacen/supabase.js';
import { avisarSocios } from '../../escritor/produccion/avisos.js';
import { libroParaPlantilla } from '../../escritor/salida/plantilla.js';
import { descargarTextoOpcional } from '../../libro/comun.js';
import { leerEdicion } from '../../libro/edicion.js';
import { cargarFotos } from '../../libro/fotos.js';
import type { FrasesJson } from '../../libro/frases.js';
import { leerFrases } from '../../libro/publicar-frases.js';
import { urlVozDeNarrador } from '../../libro/token-voz.js';
import { armarLibroBookmundo, ARCHIVOS_BOOKMUNDO, type DatosLibro, type LibroBookmundo } from '../../libro/bookmundo/armar.js';
import type { DatosCubierta } from '../../libro/bookmundo/cubierta.js';
import { PAGINAS_MINIMAS_TAPA_DURA, type Encuadernacion } from '../../libro/bookmundo/formato.js';
import { RUTA_LIBRO_MD_HISTORIA, PREFIJO_HISTORIA } from './rutas.js';
import { lenguaDeHistoria, textosTapaHistoria } from './textos-tapa.js';

type Db = SupabaseClient;

export const CARPETA_BOOKMUNDO_HISTORIA = (id: string, e: Encuadernacion = 'tapa-dura'): string => `${id}/bookmundo${e === 'tapa-blanda' ? '-tapa-blanda' : ''}`;
export const AVISO_FLACO = 'aviso-flaco.txt';
/** Las páginas que pide la tapa dura (papel crema). */
export const PAGINAS_TAPA_DURA = PAGINAS_MINIMAS_TAPA_DURA.crema;

export class SinTextosTapaHistoria extends Error {
  constructor(lengua: string) { super(`faltan los textos de tapa de historia aprobados en ${lengua} (docs/historia/libro-textos-borrador.md)`); this.name = 'SinTextosTapaHistoria'; }
}

/** Lo que pide armarLibroBookmundo para el libro de una historia. Null si todavía no está escrito. */
export async function datosBookmundoHistoria(db: Db, id: string, o: { frases?: FrasesJson } = {}): Promise<{ libro: DatosLibro; cubierta: Omit<DatosCubierta, 'paginas'>; nombre: string } | null> {
  const md = await descargarTextoOpcional(db, RUTA_LIBRO_MD_HISTORIA(id));
  if (md === null) return null;
  const { data: n, error } = await db.from('narradores').select('id, nombre, como_le_dicen, contexto, foto_url, edicion').eq('id', id).maybeSingle();
  if (error || !n) throw new Error(`historia ${id}: no se pudo leer el narrador: ${error?.message ?? 'no existe'}`);
  const narrador = n as { id: string; nombre: string; como_le_dicen?: string | null; contexto: unknown; foto_url: string | null; edicion: unknown };
  const { data: h, error: errorH } = await db.from('historias').select('idioma').eq('narrador_id', id).maybeSingle();
  if (errorH) throw new Error(`historia ${id}: no se pudo leer el idioma: ${errorH.message}`);
  const lengua = lenguaDeHistoria((h as { idioma?: string } | null)?.idioma);
  const textos = textosTapaHistoria(lengua);
  if (!textos) throw new SinTextosTapaHistoria(lengua);
  const edicion = leerEdicion(narrador.edicion);
  const fotoTapa = edicion.portadaFotoId ? (await cargarFotos(db, id)).porId.get(edicion.portadaFotoId) : undefined;
  const p = libroParaPlantilla(md);
  const urlVoz = urlVozDeNarrador(id);
  return {
    nombre: narrador.como_le_dicen?.trim() || narrador.nombre,
    libro: {
      titulo: p.titulo, nombreNarrador: narrador.nombre, tapa: { titulo: edicion.titulo, subtitulo: edicion.subtitulo },
      anioNacimiento: null, indice: p.indice, libroMarkdown: p.libroMarkdown,
      idioma: lengua === 'ca' ? 'ca' : 'es', trato: lengua === 'es-AR' ? 'vos' : 'tu', tapaEyebrow: textos.eyebrow,
      // «Su voz» impresa: las frases confirmadas, cada una con el código que la hace sonar.
      ...(o.frases ? { frases: o.frases, urlCliente: urlVoz } : {}),
    },
    cubierta: {
      nombreTapa: edicion.titulo ?? narrador.nombre,
      nombreNarrador: narrador.nombre,
      lengua,
      // La foto original que eligió la familia, nunca retocada por IA.
      foto: fotoTapa?.dataUri ?? narrador.foto_url,
      fotoPosicion: fotoTapa?.foco ? `${Math.round(fotoTapa.foco.x * 100)}% ${Math.round(fotoTapa.foco.y * 100)}%` : undefined,
      urlQr: urlVoz,
      textos: textos.cubierta,
    },
  };
}

/** En `{id}/escritor-historia/`: el `confirmado_at` de las frases con que ya se armó «Su voz» impresa. */
export const SU_VOZ_IMPRESA = 'imprenta-su-voz.txt';

/**
 * El portón de «Su voz» de una historia (como libro/imprenta.ts de Familiar, que una historia no usa): cuando la familia
 * confirma las frases (`frases.json.confirmado_at`), el libro de Bookmundo se rehace con «Su voz» y sus códigos. Una vez
 * por confirmación. Devuelve si lo rehízo. Tira si falla el armado: quien llama decide.
 */
export async function suVozImpresaHistoria(db: Db, id: string): Promise<boolean> {
  const frases = await leerFrases(db, id);
  if (!frases?.confirmado_at) return false;
  const almacen = new AlmacenSupabase(db, PREFIJO_HISTORIA(id));
  if ((await almacen.leer(SU_VOZ_IMPRESA))?.trim() === frases.confirmado_at) return false;
  const r = await imprentaHistoria(db, id, { frases });
  await almacen.escribir(SU_VOZ_IMPRESA, frases.confirmado_at);
  console.log(`historia ${id}: «Su voz» impresa con las frases confirmadas (${r})`);
  return true;
}

/** Sube los archivos de Bookmundo a su carpeta (y borra el interior del otro color, si quedó de antes). */
export async function subirBookmundo(db: Db, carpeta: string, r: LibroBookmundo, e: Encuadernacion = 'tapa-dura'): Promise<void> {
  const subir = async (archivo: string, cuerpo: Buffer | string, tipo: string) => {
    const { error } = await db.storage.from('audios').upload(`${carpeta}/${archivo}`, cuerpo, { contentType: tipo, upsert: true });
    if (error) throw new Error(`bookmundo: no se pudo subir ${carpeta}/${archivo}: ${error.message}`);
  };
  await subir(r.archivoInterior, r.interior, 'application/pdf');
  const otro = r.archivoInterior.replace(r.color ? '-COLOR.pdf' : '-BLANCO-Y-NEGRO.pdf', r.color ? '-BLANCO-Y-NEGRO.pdf' : '-COLOR.pdf');
  await db.storage.from('audios').remove([`${carpeta}/${otro}`]).catch(() => undefined);
  await subir(ARCHIVOS_BOOKMUNDO.cubierta, r.cubierta.png, 'image/png');
  await subir(ARCHIVOS_BOOKMUNDO.guias, r.cubierta.guias, 'image/png');
  await subir(ARCHIVOS_BOOKMUNDO.informe, `${e === 'tapa-blanda' ? 'TAPA BLANDA (170 × 240), armada a mano.\n\n' : ''}${r.informe}`, 'text/plain; charset=utf-8');
}

/**
 * Arma el libro de tapa dura sin Notas. Con 88 páginas o más, deja los archivos en `{id}/bookmundo/` ('bookmundo');
 * con menos, solo el informe y el aviso a los socios ('flaco'). Tira si el libro no está escrito, si faltan los textos
 * de tapa aprobados o si falla Chromium o Storage: quien llama decide.
 */
export async function imprentaHistoria(db: Db, id: string, o: { frases?: FrasesJson } = {}): Promise<'bookmundo' | 'flaco'> {
  const d = await datosBookmundoHistoria(db, id, o);
  if (!d) throw new Error(`historia ${id}: no hay libro escrito (${RUTA_LIBRO_MD_HISTORIA(id)})`);
  const r = await armarLibroBookmundo(d.libro, d.cubierta, { sinNotas: true });
  const carpeta = CARPETA_BOOKMUNDO_HISTORIA(id);
  const n = r.informeInterior.paginas;
  if (n < PAGINAS_TAPA_DURA) {
    const texto = `El libro de ${d.nombre} salió con ${n} páginas. La tapa dura pide ${PAGINAS_TAPA_DURA}. Hay que ofrecerle tapa blanda.`;
    const { error } = await db.storage.from('audios').upload(`${carpeta}/${ARCHIVOS_BOOKMUNDO.informe}`, `NO SUBIR A BOOKMUNDO EN TAPA DURA. ${texto}\n\n${r.informe}`, { contentType: 'text/plain; charset=utf-8', upsert: true });
    if (error) throw new Error(`bookmundo: no se pudo subir ${carpeta}/${ARCHIVOS_BOOKMUNDO.informe}: ${error.message}`);
    const almacen = new AlmacenSupabase(db, PREFIJO_HISTORIA(id));
    if ((await almacen.leer(AVISO_FLACO)) === null) {
      const salio = await avisarSocios(`El libro de ${d.nombre} salió con ${n} páginas`, `${texto}\n\nLa tapa blanda (170 × 240, mínimo 44 páginas) se arma con:\n  cd fabrica && npx tsx scripts/historia-tapa-blanda.ts ${id}\nQueda en ${CARPETA_BOOKMUNDO_HISTORIA(id, 'tapa-blanda')}/. El informe de la tapa dura está en ${carpeta}/${ARCHIVOS_BOOKMUNDO.informe}.`);
      if (salio) await almacen.escribir(AVISO_FLACO, new Date().toISOString());
    }
    console.log(`historia ${id}: libro flaco (${n} págs): no va a Bookmundo en tapa dura`);
    return 'flaco';
  }
  await subirBookmundo(db, carpeta, r);
  console.log(`historia ${id}: bookmundo ${n} págs, ${r.ok ? 'listo para subir' : 'CON ERRORES (ver informe.txt)'}`);
  return 'bookmundo';
}
