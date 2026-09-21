"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/servidor";

// La ÚNICA escritura del panel de la empresa (spec §2): cargar a mano un gasto que no pasa
// por ninguna API —Railway, el dominio, los mails, la imprenta—. Todo lo demás es mirar.
//
// La validación es del lado del servidor y es toda la defensa que hace falta: si algo no
// cierra, no se toca la base y se devuelve el motivo en castellano para mostrarlo arriba
// del formulario. Un gasto mal cargado ensucia la cuenta del mes, así que se rebota.

const MONEDAS = ["EUR", "USD", "ARS"];
const CATEGORIAS = ["suscripcion", "api", "imprenta", "otro"];

export type ResultadoGasto = { error: string | null };

const texto = (v: FormDataEntryValue | null): string => (typeof v === "string" ? v.trim() : "");

export async function cargarGastoManual(datos: FormData): Promise<ResultadoGasto> {
  const concepto = texto(datos.get("concepto"));
  const montoCrudo = texto(datos.get("monto"));
  const moneda = texto(datos.get("moneda")) || "EUR";
  const categoria = texto(datos.get("categoria")) || "otro";
  const quien = texto(datos.get("quien")) || null;
  const fecha = texto(datos.get("fecha")) || new Date().toISOString().slice(0, 10);

  if (concepto.length === 0) return { error: "Falta el concepto: escribí qué se pagó." };
  if (concepto.length > 120) return { error: "El concepto es demasiado largo (120 caracteres como máximo)." };

  const monto = Number(montoCrudo.replace(",", "."));
  if (!Number.isFinite(monto) || monto <= 0) {
    return { error: "El monto tiene que ser un número mayor que cero." };
  }

  if (!MONEDAS.includes(moneda)) return { error: `La moneda tiene que ser una de estas: ${MONEDAS.join(", ")}.` };
  if (!CATEGORIAS.includes(categoria)) {
    return { error: `La categoría tiene que ser una de estas: ${CATEGORIAS.join(", ")}.` };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { error: "La fecha tiene que venir como año-mes-día." };

  const { error } = await crearClienteServidor()
    .from("gastos_manuales")
    .insert({ fecha, concepto, monto, moneda, categoria, quien });

  if (error) {
    console.error("panel de la empresa: no se pudo cargar el gasto", error);
    return { error: "No se pudo guardar el gasto. Probá de nuevo en un rato." };
  }

  revalidatePath("/admin/gastos");
  return { error: null };
}
