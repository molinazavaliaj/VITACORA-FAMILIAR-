// web/src/lib/lote-codigos.ts
// Alta de un lote de cartas con sus códigos, sin dejar basura si algo falla.
// Solo imports relativos: la usa scripts/lote-local.mts con tsx (sin alias `@/`).

import { generarCodigo } from "./regalo";

/** Lo mínimo del cliente de Supabase que usamos; permite probarlo con un doble. */
type Resultado = { data?: { id: string } | null; error: { code?: string; message: string } | null };
export type ClienteLotes = {
  from(tabla: string): {
    insert(fila: Record<string, unknown>): PromiseLike<Resultado> & { select(cols: string): { single(): PromiseLike<Resultado> } };
    delete(): { eq(col: string, val: string): PromiseLike<{ error: { message: string } | null }> };
  };
};

/** Borra el lote; sus códigos caen con él (on delete cascade). Devuelve el aviso para el operador. */
export async function borrarLote(admin: ClienteLotes, loteId: string): Promise<string> {
  const { error } = await admin.from("lotes_impresos").delete().eq("id", loteId);
  return error
    ? `No pude limpiar el lote ${loteId} (${error.message}). Borralo a mano en lotes_impresos.`
    : "No quedó nada guardado.";
}

/**
 * Crea la fila del lote y `cantidad` códigos. Si algo falla, borra el lote
 * (y con él sus códigos) y tira un Error cuyo mensaje dice qué pasó.
 */
export async function crearLoteConCodigos(
  admin: ClienteLotes,
  p: { localId: string; idioma: string; cantidad: number },
  generar: () => string = generarCodigo,
): Promise<{ loteId: string; codigos: string[] }> {
  const { data: lote, error: errLote } = await admin
    .from("lotes_impresos")
    .insert({ local_id: p.localId, idioma: p.idioma, cantidad: p.cantidad })
    .select("id")
    .single();
  if (errLote || !lote) throw new Error(`No pude crear el lote: ${errLote?.message ?? "sin respuesta"}`);

  const codigos: string[] = [];
  try {
    for (let n = 0; n < p.cantidad; n++) {
      let codigo: string | null = null;
      for (let intento = 0; intento < 5 && !codigo; intento++) {
        const candidato = generar();
        const { error } = await admin.from("codigos_impresos").insert({ codigo: candidato, lote_id: lote.id });
        if (!error) codigo = candidato;
        else if (error.code !== "23505") throw new Error(`No pude guardar un código: ${error.message}`);
      }
      if (!codigo) throw new Error("No logré un código libre en 5 intentos.");
      codigos.push(codigo);
    }
  } catch (e) {
    const limpieza = await borrarLote(admin, lote.id);
    throw new Error(`${e instanceof Error ? e.message : String(e)} ${limpieza}`);
  }
  return { loteId: lote.id, codigos };
}
