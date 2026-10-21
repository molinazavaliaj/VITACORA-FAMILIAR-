"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { esAdmin, mailsDeAdmin } from "@/lib/admin/acceso";
import { COMISION_MAXIMA, DESCUENTO_MAXIMO, creadoresPrendido, leerPorcentaje, normalizarCodigoCreador } from "@/lib/creadores";
import { anularComision, aprobarCreador, cambiarCreador, cambiarEstadoCreador, marcarComisionesPagadas } from "@/lib/creadores-base";

// Las escrituras de 07 · Creadores (programa de creadores, 21/10): aprobar o
// rechazar un alta, cambiar código, comisión o descuento, pausar y reactivar,
// marcar pagado y anular una comisión.
//
// ⚠️ Cada acción vuelve a chequear que quien llama esté en ADMIN_EMAILS: una
// server action es un endpoint suelto (se puede llamar con un POST sin pasar
// por la pantalla) y el layout de /admin NO la protege. Sin sesión de admin no
// se toca la base. Con CREADORES apagado, tampoco (un mail de bienvenida con un
// código que no vale sería mentir).

export type ResultadoCreador = { error: string | null; listo?: string };

const NO_ADMIN: ResultadoCreador = { error: "No tenés permiso para esto." };
const APAGADO: ResultadoCreador = { error: "El programa está apagado (falta CREADORES=1 en Vercel)." };

const texto = (v: FormDataEntryValue | null): string => (typeof v === "string" ? v.trim() : "");
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** ¿Quien llama es un admin? Lo mismo que el layout, pero acá (falla cerrado). */
async function esAdminQuienLlama(): Promise<boolean> {
  try {
    const supabase = await crearClienteSesion();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return esAdmin(user?.email, mailsDeAdmin(process.env.ADMIN_EMAILS));
  } catch {
    return false;
  }
}

/** El portero de todas: admin, programa prendido e id con forma de id. */
async function portero(datos: FormData, campo = "id"): Promise<{ id: string } | ResultadoCreador> {
  if (!(await esAdminQuienLlama())) return NO_ADMIN;
  if (!creadoresPrendido()) return APAGADO;
  const id = texto(datos.get(campo));
  if (!UUID.test(id)) return { error: "Falta el id." };
  return { id };
}

/** Código, comisión y descuento del formulario, ya validados. */
function numeros(datos: FormData): { codigo: string; comision: number; descuento: number } | ResultadoCreador {
  const codigo = normalizarCodigoCreador(texto(datos.get("codigo")));
  if (!codigo) return { error: "El código tiene que tener de 3 a 20 letras o números, sin VITACORA10 adelante." };
  const comision = leerPorcentaje(texto(datos.get("comision")), 1, COMISION_MAXIMA);
  if (comision === null) return { error: `La comisión tiene que ser un número entero de 1 a ${COMISION_MAXIMA}.` };
  const descuento = leerPorcentaje(texto(datos.get("descuento")), 0, DESCUENTO_MAXIMO);
  if (descuento === null) return { error: `El descuento tiene que ser un número entero de 0 a ${DESCUENTO_MAXIMO}.` };
  return { codigo, comision, descuento };
}

const terminar = (r: { ok: true } | { error: string }, listo: string): ResultadoCreador => {
  if ("error" in r) return { error: r.error };
  revalidatePath("/admin/creadores");
  return { error: null, listo };
};

export async function aprobar(datos: FormData): Promise<ResultadoCreador> {
  const p = await portero(datos);
  if ("error" in p) return p;
  const n = numeros(datos);
  if ("error" in n) return n;
  const r = await aprobarCreador(crearClienteServidor(), p.id, n);
  // «Quedó aprobado, pero no salió el mail»: la fila cambió igual, hay que refrescar.
  if ("error" in r && r.error.startsWith("Quedó aprobado")) revalidatePath("/admin/creadores");
  return terminar(r, `Aprobado con el código ${n.codigo}. Le mandamos la bienvenida.`);
}

export async function rechazar(datos: FormData): Promise<ResultadoCreador> {
  const p = await portero(datos);
  if ("error" in p) return p;
  return terminar(await cambiarEstadoCreador(crearClienteServidor(), p.id, "rechazado"), "Rechazado.");
}

export async function cambiar(datos: FormData): Promise<ResultadoCreador> {
  const p = await portero(datos);
  if ("error" in p) return p;
  const n = numeros(datos);
  if ("error" in n) return n;
  const notas = texto(datos.get("notas")).slice(0, 2000) || null;
  return terminar(await cambiarCreador(crearClienteServidor(), p.id, { ...n, notas }), "Guardado. Las ventas que ya se hicieron no cambian.");
}

export async function pausar(datos: FormData): Promise<ResultadoCreador> {
  const p = await portero(datos);
  if ("error" in p) return p;
  return terminar(await cambiarEstadoCreador(crearClienteServidor(), p.id, "pausado"), "Pausado: el código ya no vale.");
}

export async function reactivar(datos: FormData): Promise<ResultadoCreador> {
  const p = await portero(datos);
  if ("error" in p) return p;
  return terminar(await cambiarEstadoCreador(crearClienteServidor(), p.id, "activo"), "Reactivado: el código vuelve a valer.");
}

export async function marcarPagado(datos: FormData): Promise<ResultadoCreador> {
  const p = await portero(datos);
  if ("error" in p) return p;
  const r = await marcarComisionesPagadas(crearClienteServidor(), p.id);
  if ("error" in r) return { error: r.error };
  revalidatePath("/admin/creadores");
  return { error: null, listo: r.cuantas === 0 ? "No había nada pendiente." : `${r.cuantas} comisiones marcadas como pagadas.` };
}

export async function anular(datos: FormData): Promise<ResultadoCreador> {
  const p = await portero(datos);
  if ("error" in p) return p;
  return terminar(await anularComision(crearClienteServidor(), p.id), "Comisión anulada.");
}
