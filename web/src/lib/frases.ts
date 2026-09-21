// «Su voz» (spec docs/superpowers/specs/2026-09-20-su-voz-design.md): las
// mejores frases del narrador, en su voz real. Viven en
// `{narrador}/paquete/frases.json`, que es el contrato entre tres:
//   la fábrica  crea el archivo con las candidatas y marca las elegidas;
//   el worker   completa `audio_path`, `segundos`, `inicio`, `fin` y `estado`;
//   la web      marca `elegida` / `elegida_por` y `confirmado_at` cuando la
//               familia guarda.
// Un escritor por campo, como todo el repo. Acá está lo que la web lee y lo
// que decide (puro, sin red) — las rutas de API y las páginas solo lo llaman.

import type { SupabaseClient } from "@supabase/supabase-js";

/** Cuántas frases van impresas por capítulo (decisión de Naza, 20/09). Es un tope, no un mínimo. */
export const FRASES_POR_CAPITULO = 3;

export type EstadoFrase = "pendiente" | "cortada" | "fallida";

export type FraseCandidata = {
  id: string;
  texto: string;
  origen: "sus-frases" | "cita";
  grupo: "suyas" | "heredadas" | null;
  respuesta_id: string | null;
  pregunta_orden: number;
  por_que: string;
  elegida: boolean;
  elegida_por: "modelo" | "familia";
  estado: EstadoFrase;
  audio_path: string | null;
  segundos: number | null;
  inicio: number | null;
  fin: number | null;
};

export type CapituloConFrases = { numero: number; capitulo: string; candidatas: FraseCandidata[] };

export type FrasesJson = {
  version: 1;
  narrador_id: string;
  pedido_id: string;
  /** Cuándo la familia dio por buena la selección; la impresión espera esto (o los 15 días). */
  confirmado_at: string | null;
  capitulos: CapituloConFrases[];
};

export const RUTA_FRASES_JSON = (narradorId: string) => `${narradorId}/paquete/frases.json`;

/**
 * Lee el archivo del paquete, SIEMPRE fresco. Storage sirve copias cacheadas
 * (Naza lo midió el 21/09: dos lecturas seguidas del mismo archivo recién subido
 * dieron versiones distintas), y este archivo lo escriben tres — la fábrica, el
 * worker de la PC de audio y la web —: una lectura vieja antes de escribir haría
 * pisar los cortes del worker creyendo que siguen pendientes. Por eso cada
 * lectura pide una URL distinta (`cacheNonce`) y le dice al fetch que no guarde.
 * Un archivo ausente o roto devuelve null: la página lo dice, no se cae.
 */
export async function leerFrases(admin: SupabaseClient, narradorId: string): Promise<FrasesJson | null> {
  const { data } = await admin.storage
    .from("audios")
    .download(RUTA_FRASES_JSON(narradorId), { cacheNonce: `${Date.now()}-${Math.random().toString(36).slice(2)}` }, { cache: "no-store" });
  if (!data) return null;
  try {
    const frases = JSON.parse(await data.text()) as FrasesJson;
    return Array.isArray(frases?.capitulos) ? frases : null;
  } catch (err) {
    console.error("frases: frases.json inválido", err);
    return null;
  }
}

/**
 * Escribe el archivo entero (la web solo toca sus campos, pero el archivo se
 * sube completo). Con `cacheControl: '0'`, como la fábrica y el worker: lo que
 * se sube no puede servirse cacheado a los otros dos.
 */
export async function guardarFrases(admin: SupabaseClient, frases: FrasesJson): Promise<{ error: string | null }> {
  const { error } = await admin.storage
    .from("audios")
    .upload(RUTA_FRASES_JSON(frases.narrador_id), JSON.stringify(frases, null, 2), { contentType: "application/json", upsert: true, cacheControl: "0" });
  return { error: error?.message ?? null };
}

/** Una frase se puede escuchar cuando el worker ya la cortó y dejó el mp3. */
export function tieneAudio(f: FraseCandidata): boolean {
  return f.estado === "cortada" && typeof f.audio_path === "string" && f.audio_path.length > 0;
}

/** Las elegidas de un capítulo, en el orden del archivo (que es el orden impreso). */
export function elegidasDe(c: CapituloConFrases): FraseCandidata[] {
  return c.candidatas.filter((f) => f.elegida);
}

/** Lo que se publica (la página del código y el chip): solo elegidas con audio. */
export function frasesPublicables(frases: FrasesJson): { capitulo: CapituloConFrases; frases: FraseCandidata[] }[] {
  return frases.capitulos
    .map((capitulo) => ({ capitulo, frases: elegidasDe(capitulo).filter(tieneAudio) }))
    .filter((x) => x.frases.length > 0);
}

/** Cuántas quedan por cortar / cortadas / fallidas, para decir "se está preparando" con números. */
export function resumenDeCorte(frases: FrasesJson): { total: number; cortadas: number; pendientes: number; fallidas: number; elegidas: number } {
  const todas = frases.capitulos.flatMap((c) => c.candidatas);
  return {
    total: todas.length,
    cortadas: todas.filter((f) => f.estado === "cortada").length,
    pendientes: todas.filter((f) => f.estado === "pendiente").length,
    fallidas: todas.filter((f) => f.estado === "fallida").length,
    elegidas: todas.filter((f) => f.elegida).length,
  };
}

/** Lo que manda el panel al guardar: por capítulo, las elegidas EN ORDEN (el orden es el impreso). */
export type SeleccionDeLaFamilia = { numero: number; elegidas: string[] }[];

export type ResultadoSeleccion =
  | { ok: true; frases: FrasesJson; cambios: number }
  | { ok: false; mensaje: string };

/**
 * Aplica lo que eligió la familia sobre el archivo tal como está HOY en Storage
 * (se relee antes de escribir: el worker puede haber cortado audios mientras
 * tanto, y esos campos no son nuestros). Reglas:
 * - Solo se pueden elegir candidatas que existen en ese capítulo (nunca se
 *   inventa una frase: son las que dijo, verificadas por la fábrica).
 * - Como mucho `FRASES_POR_CAPITULO` por capítulo. Cero está permitido: la
 *   familia puede querer que un capítulo vaya sin frase.
 * - El orden de `elegidas` pasa a ser el orden del archivo: las elegidas
 *   primero, en ese orden, y después las alternativas como estaban.
 * - Una frase que la familia tocó (la eligió, la sacó o la movió) queda con
 *   `elegida_por: 'familia'`; las que no tocó conservan lo del modelo.
 * - Con `confirmar` se anota `confirmado_at`: la impresión toma esa selección.
 */
export function aplicarSeleccion(
  frases: FrasesJson,
  seleccion: SeleccionDeLaFamilia,
  opciones: { confirmar?: boolean; ahora?: Date } = {},
): ResultadoSeleccion {
  const porNumero = new Map(seleccion.map((s) => [s.numero, s.elegidas]));
  let cambios = 0;
  const capitulos: CapituloConFrases[] = [];

  for (const capitulo of frases.capitulos) {
    const pedidas = porNumero.get(capitulo.numero);
    if (!pedidas) {
      capitulos.push(capitulo);
      continue;
    }
    const ids = new Set(capitulo.candidatas.map((f) => f.id));
    const desconocida = pedidas.find((id) => !ids.has(id));
    if (desconocida) return { ok: false, mensaje: `La frase «${desconocida}» no es del capítulo ${capitulo.numero}.` };
    if (new Set(pedidas).size !== pedidas.length) return { ok: false, mensaje: `Hay una frase repetida en el capítulo ${capitulo.numero}.` };
    if (pedidas.length > FRASES_POR_CAPITULO) {
      return { ok: false, mensaje: `En un capítulo van como mucho ${FRASES_POR_CAPITULO} frases (capítulo ${capitulo.numero}).` };
    }

    const antes = elegidasDe(capitulo).map((f) => f.id);
    const igual = antes.length === pedidas.length && antes.every((id, i) => id === pedidas[i]);
    if (igual) {
      capitulos.push(capitulo);
      continue;
    }

    const porId = new Map(capitulo.candidatas.map((f) => [f.id, f]));
    const elegidas = pedidas.map((id) => {
      const f = porId.get(id)!;
      const toco = !f.elegida || antes.indexOf(id) !== pedidas.indexOf(id);
      if (toco) cambios++;
      return { ...f, elegida: true, elegida_por: toco ? ("familia" as const) : f.elegida_por };
    });
    const resto = capitulo.candidatas
      .filter((f) => !porNumero.get(capitulo.numero)!.includes(f.id))
      .map((f) => {
        if (!f.elegida) return f;
        cambios++;
        return { ...f, elegida: false, elegida_por: "familia" as const };
      });
    capitulos.push({ ...capitulo, candidatas: [...elegidas, ...resto] });
  }

  const ahora = opciones.ahora ?? new Date();
  return {
    ok: true,
    cambios,
    frases: {
      ...frases,
      capitulos,
      confirmado_at: opciones.confirmar ? ahora.toISOString() : frases.confirmado_at,
    },
  };
}

/** Valida lo que llega por la API antes de aplicarlo. */
export function validarSeleccion(valor: unknown): { ok: true; seleccion: SeleccionDeLaFamilia } | { ok: false; mensaje: string } {
  if (!Array.isArray(valor)) return { ok: false, mensaje: "La selección tiene que ser una lista de capítulos." };
  const seleccion: SeleccionDeLaFamilia = [];
  for (const item of valor) {
    const c = item as { numero?: unknown; elegidas?: unknown };
    if (typeof c?.numero !== "number" || !Array.isArray(c.elegidas) || !c.elegidas.every((id) => typeof id === "string")) {
      return { ok: false, mensaje: "Cada capítulo necesita su número y la lista de frases elegidas." };
    }
    seleccion.push({ numero: c.numero, elegidas: c.elegidas as string[] });
  }
  return { ok: true, seleccion };
}

/** "0:12" para el reproductor y la lista impresa. */
export function duracionCorta(segundos: number | null): string {
  if (segundos === null || !Number.isFinite(segundos) || segundos < 0) return "";
  const m = Math.floor(segundos / 60);
  const s = Math.round(segundos % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
