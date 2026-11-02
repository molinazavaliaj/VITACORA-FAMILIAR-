import type { SupabaseClient } from "@supabase/supabase-js";

// 09 · Contenido — el calendario de lo que se publica (redes, sobre todo). Los archivos se
// suben a una carpeta (el bucket privado `contenido`) y después se acomodan en el
// calendario: cada fila de `contenido` con fecha va en ese día, y sin fecha queda en la
// carpeta. Sólo planifica: no publica nada en ninguna red.
//
// Acá viven las piezas puras (la grilla del mes, cómo queda el orden al mover algo, qué
// archivo entra) y la lectura. Las escrituras, en app/admin/contenido/acciones.ts.

export const BUCKET_CONTENIDO = "contenido";

export const REDES = ["instagram", "tiktok", "facebook", "youtube", "otra"] as const;
export type Red = (typeof REDES)[number];

export const ESTADOS = ["borrador", "listo", "publicado"] as const;
export type EstadoContenido = (typeof ESTADOS)[number];

/** Lo más pesado que se deja subir. Un reel de un minuto en buena calidad entra holgado. */
export const TAMANO_MAXIMO_CONTENIDO = 500 * 1024 * 1024;

export type FilaContenido = {
  id: string;
  creado_at: string;
  archivo_path: string;
  nombre: string;
  tipo: string;
  tamano: number | null;
  titulo: string | null;
  texto: string | null;
  red: Red | null;
  fecha: string | null;
  hora: string | null;
  orden: number;
  estado: EstadoContenido;
  subido_por: string | null;
};

/** Lo que llega al navegador: la fila y, si se pudo firmar, la URL para verlo (vale una hora). */
export type PiezaContenido = FilaContenido & { url: string | null };

/** null si el archivo entra; si no, por qué no, en castellano. */
export function errorDeArchivo(tipo: string, tamano: number): string | null {
  if (!/^(image|video|audio)\/[\w.+-]+$/.test(tipo) && tipo !== "application/pdf") {
    return "Ese archivo no entra: tienen que ser fotos, videos, audios o PDF.";
  }
  if (!Number.isFinite(tamano) || tamano <= 0) return "El archivo vino vacío.";
  if (tamano > TAMANO_MAXIMO_CONTENIDO) return "El archivo pesa más de 500 MB.";
  return null;
}

/** La ruta en el bucket: `carpeta/<id>.<extensión del nombre>`. El nombre original queda en la fila. */
export function rutaDeContenido(id: string, nombre: string): string {
  const ext = /\.([a-z0-9]{1,8})$/i.exec(nombre)?.[1]?.toLowerCase();
  return ext ? `carpeta/${id}.${ext}` : `carpeta/${id}`;
}

// ── El mes ───────────────────────────────────────────────────────────────────

export type Mes = { anio: number; mes: number }; // mes: 1 a 12

/** ?mes=2026-11. Sin parámetro (o uno que no se entiende), el mes de `hoy`. */
export function mesDe(param: string | string[] | undefined, hoy: Date): Mes {
  const m = typeof param === "string" ? /^(\d{4})-(\d{2})$/.exec(param) : null;
  if (m) {
    const anio = Number(m[1]);
    const mes = Number(m[2]);
    if (mes >= 1 && mes <= 12 && anio >= 2000 && anio <= 2100) return { anio, mes };
  }
  return { anio: hoy.getUTCFullYear(), mes: hoy.getUTCMonth() + 1 };
}

const dos = (n: number) => String(n).padStart(2, "0");

export const claveDeMes = ({ anio, mes }: Mes): string => `${anio}-${dos(mes)}`;

export function mesVecino({ anio, mes }: Mes, paso: 1 | -1): Mes {
  const t = new Date(Date.UTC(anio, mes - 1 + paso, 1));
  return { anio: t.getUTCFullYear(), mes: t.getUTCMonth() + 1 };
}

const isoDe = (t: Date) => `${t.getUTCFullYear()}-${dos(t.getUTCMonth() + 1)}-${dos(t.getUTCDate())}`;

/**
 * Las semanas que se ven del mes, de lunes a domingo: cada día es "2026-11-03" y los que
 * son del mes de al lado vienen igual (para que la grilla no quede con huecos), marcados.
 */
export function grillaDelMes({ anio, mes }: Mes): { dia: string; delMes: boolean }[][] {
  const primero = new Date(Date.UTC(anio, mes - 1, 1));
  const corrimiento = (primero.getUTCDay() + 6) % 7; // lunes = 0
  const inicio = new Date(Date.UTC(anio, mes - 1, 1 - corrimiento));
  const semanas: { dia: string; delMes: boolean }[][] = [];
  const cursor = new Date(inicio);
  do {
    const semana: { dia: string; delMes: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      semana.push({ dia: isoDe(cursor), delMes: cursor.getUTCMonth() === mes - 1 });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    semanas.push(semana);
  } while (cursor.getUTCMonth() === mes - 1);
  return semanas;
}

/** El primer y el último día que muestra la grilla (para pedir sólo eso a la base). */
export function rangoDeLaGrilla(m: Mes): { desde: string; hasta: string } {
  const g = grillaDelMes(m);
  return { desde: g[0][0].dia, hasta: g[g.length - 1][6].dia };
}

// ── Mover ────────────────────────────────────────────────────────────────────

export type Cambio = { id: string; fecha: string | null; orden: number };

/**
 * Mueve una pieza a `fecha` (null = de vuelta a la carpeta), en la posición `indice` de
 * ese día. Devuelve la lista nueva y sólo los cambios que hay que guardar: el orden se
 * renumera 0, 1, 2… en el día de origen y en el de destino, y nada más se toca.
 */
export function mover<T extends { id: string; fecha: string | null; orden: number }>(
  piezas: T[],
  id: string,
  fecha: string | null,
  indice: number,
): { piezas: T[]; cambios: Cambio[] } {
  const pieza = piezas.find((p) => p.id === id);
  if (!pieza) return { piezas, cambios: [] };
  const origen = pieza.fecha;
  const delGrupo = (f: string | null) =>
    piezas.filter((p) => p.fecha === f && p.id !== id).sort((a, b) => a.orden - b.orden);

  const destino = delGrupo(fecha);
  const lugar = Math.max(0, Math.min(Number.isFinite(indice) ? indice : destino.length, destino.length));
  destino.splice(lugar, 0, { ...pieza, fecha });

  const nuevos = new Map<string, { fecha: string | null; orden: number }>();
  destino.forEach((p, i) => nuevos.set(p.id, { fecha, orden: i }));
  if (origen !== fecha) delGrupo(origen).forEach((p, i) => nuevos.set(p.id, { fecha: origen, orden: i }));

  const cambios: Cambio[] = [];
  const resultado = piezas.map((p) => {
    const n = nuevos.get(p.id);
    if (!n || (n.fecha === p.fecha && n.orden === p.orden)) return p;
    cambios.push({ id: p.id, fecha: n.fecha, orden: n.orden });
    return { ...p, ...n };
  });
  return { piezas: resultado, cambios };
}

/** Las piezas de un día (o de la carpeta, con null), en su orden. */
export function delDia<T extends { fecha: string | null; orden: number; creado_at: string }>(piezas: T[], fecha: string | null): T[] {
  return piezas
    .filter((p) => p.fecha === fecha)
    .sort((a, b) => a.orden - b.orden || (a.creado_at < b.creado_at ? -1 : 1));
}

// ── Leer ─────────────────────────────────────────────────────────────────────

const COLUMNAS = "id, creado_at, archivo_path, nombre, tipo, tamano, titulo, texto, red, fecha, hora, orden, estado, subido_por";

export type LecturaContenido = { piezas: PiezaContenido[]; error: string | null };

/** La carpeta entera (lo que no tiene día) y lo que cae en la grilla del mes, con su URL firmada. */
export async function leerContenido(db: SupabaseClient, m: Mes): Promise<LecturaContenido> {
  const { desde, hasta } = rangoDeLaGrilla(m);
  const [enCarpeta, enMes] = await Promise.all([
    db.from("contenido").select(COLUMNAS).is("fecha", null).order("orden").limit(500),
    db.from("contenido").select(COLUMNAS).gte("fecha", desde).lte("fecha", hasta).order("fecha").order("orden").limit(1000),
  ]);
  const error = enCarpeta.error ?? enMes.error;
  if (error) {
    console.error("panel: no se pudo leer el contenido", error.message);
    return { piezas: [], error: "Todavía no se puede leer el contenido: falta aplicar la migración 20261102000000_avisos_y_contenido.sql." };
  }
  const filas = [...(enCarpeta.data ?? []), ...(enMes.data ?? [])] as FilaContenido[];
  const urls = new Map<string, string>();
  if (filas.length > 0) {
    const { data: firmadas, error: errorFirma } = await db.storage
      .from(BUCKET_CONTENIDO)
      .createSignedUrls(filas.map((f) => f.archivo_path), 3600);
    if (errorFirma) console.error("panel: no se pudieron firmar las URLs del contenido", errorFirma.message);
    for (const f of firmadas ?? []) if (f.path && f.signedUrl) urls.set(f.path, f.signedUrl);
  }
  return { piezas: filas.map((f) => ({ ...f, hora: f.hora ? f.hora.slice(0, 5) : null, url: urls.get(f.archivo_path) ?? null })), error: null };
}
