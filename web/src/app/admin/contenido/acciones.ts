"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { esAdminQuienLlama } from "@/lib/admin/quien-llama";
import {
  BUCKET_CONTENIDO,
  ESTADOS,
  REDES,
  errorDeArchivo,
  rutaDeContenido,
  TAMANO_MAXIMO_CONTENIDO,
  type Cambio,
} from "@/lib/admin/contenido";

// Las escrituras de la pantalla Contenido (09). Todas tocan sólo `contenido` y el bucket
// `contenido`. Como las del resto del panel, cada una chequea ADMIN_EMAILS antes que nada:
// una server action es un endpoint suelto y el layout no la protege.
//
// El archivo no pasa por acá (Vercel corta los pedidos de más de 4,5 MB, ver
// api/fotos/route.ts): `pedirSubida` da una URL firmada, el navegador sube directo a
// Storage y `confirmarSubida` mira lo que llegó antes de crear la fila.

export type Resultado = { error: string | null };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const SIN_PERMISO = "No tenés permiso para esto.";

async function mailDeQuienLlama(): Promise<string | null> {
  try {
    const { data } = await (await crearClienteSesion()).auth.getUser();
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

export async function pedirSubida(archivo: { nombre: string; tipo: string; tamano: number }): Promise<
  { error: string } | { error: null; id: string; path: string; token: string }
> {
  if (!(await esAdminQuienLlama())) return { error: SIN_PERMISO };
  const motivo = errorDeArchivo(String(archivo.tipo ?? ""), Number(archivo.tamano));
  if (motivo) return { error: motivo };
  const id = randomUUID();
  const path = rutaDeContenido(id, String(archivo.nombre ?? ""));
  const { data, error } = await crearClienteServidor().storage.from(BUCKET_CONTENIDO).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("contenido: no se pudo pedir la URL de subida", error);
    return { error: "No se pudo preparar la subida. ¿Está creada la carpeta `contenido` en Storage?" };
  }
  return { error: null, id, path, token: data.token };
}

export async function confirmarSubida(archivo: { id: string; nombre: string; tipo: string }): Promise<Resultado> {
  if (!(await esAdminQuienLlama())) return { error: SIN_PERMISO };
  const id = String(archivo.id ?? "");
  const nombre = String(archivo.nombre ?? "").trim().slice(0, 200) || "sin nombre";
  const tipo = String(archivo.tipo ?? "");
  if (!UUID.test(id)) return { error: "No llegó ningún archivo." };
  const path = rutaDeContenido(id, nombre);
  const db = crearClienteServidor();

  // Lo que manda es lo que quedó en Storage, no lo que dice el navegador.
  const { data: lista, error: errorLista } = await db.storage.from(BUCKET_CONTENIDO).list("carpeta", { search: id, limit: 1 });
  if (errorLista) {
    console.error("contenido: no se pudo mirar la subida", errorLista);
    return { error: "No se pudo confirmar la subida. Probá de nuevo." };
  }
  const objeto = (lista ?? []).find((o) => `carpeta/${o.name}` === path);
  if (!objeto) return { error: "No llegó ningún archivo." };
  const tamano = Number((objeto.metadata as { size?: number } | null)?.size ?? 0);
  const motivo = errorDeArchivo(tipo, tamano || 1);
  if (motivo || tamano > TAMANO_MAXIMO_CONTENIDO) {
    await db.storage.from(BUCKET_CONTENIDO).remove([path]);
    return { error: motivo ?? "El archivo pesa más de 500 MB." };
  }

  // Va al final de la carpeta.
  const { data: ultimo } = await db.from("contenido").select("orden").is("fecha", null).order("orden", { ascending: false }).limit(1).maybeSingle();
  const orden = ((ultimo as { orden?: number } | null)?.orden ?? -1) + 1;

  const { error } = await db.from("contenido").insert({
    id,
    archivo_path: path,
    nombre,
    tipo,
    tamano: tamano || null,
    titulo: nombre.replace(/\.[^.]+$/, "").slice(0, 120),
    orden,
    subido_por: await mailDeQuienLlama(),
  });
  if (error) {
    console.error("contenido: no se pudo guardar la fila", error);
    return { error: "El archivo subió pero no se pudo anotar. Probá de nuevo." };
  }
  revalidatePath("/admin/contenido");
  return { error: null };
}

/** Guarda los cambios de orden y de día que armó `mover` en el navegador. */
export async function guardarOrden(cambios: Cambio[]): Promise<Resultado> {
  if (!(await esAdminQuienLlama())) return { error: SIN_PERMISO };
  if (!Array.isArray(cambios) || cambios.length > 500) return { error: "No se entendió el cambio." };
  for (const c of cambios) {
    const fechaBien = c.fecha === null || (typeof c.fecha === "string" && FECHA.test(c.fecha));
    if (!UUID.test(String(c.id)) || !fechaBien || !Number.isInteger(c.orden) || c.orden < 0) {
      return { error: "No se entendió el cambio." };
    }
  }
  const db = crearClienteServidor();
  const resultados = await Promise.all(
    cambios.map((c) => db.from("contenido").update({ fecha: c.fecha, orden: c.orden }).eq("id", c.id)),
  );
  const fallo = resultados.find((r) => r.error);
  if (fallo?.error) {
    console.error("contenido: no se pudo guardar el orden", fallo.error);
    return { error: "No se pudo guardar dónde va. Recargá la página y probá de nuevo." };
  }
  revalidatePath("/admin/contenido");
  return { error: null };
}

const texto = (v: FormDataEntryValue | null): string => (typeof v === "string" ? v.trim() : "");

/** Lo que se edita de una pieza: título, texto, red, día, hora y estado. */
export async function editarContenido(datos: FormData): Promise<Resultado> {
  if (!(await esAdminQuienLlama())) return { error: SIN_PERMISO };
  const id = texto(datos.get("id"));
  if (!UUID.test(id)) return { error: "Esa pieza no existe." };

  const titulo = texto(datos.get("titulo"));
  const cuerpo = texto(datos.get("texto"));
  const red = texto(datos.get("red"));
  const fecha = texto(datos.get("fecha"));
  const hora = texto(datos.get("hora"));
  const estado = texto(datos.get("estado")) || "borrador";

  if (titulo.length > 120) return { error: "El título es demasiado largo (120 caracteres como máximo)." };
  if (cuerpo.length > 5000) return { error: "El texto es demasiado largo (5000 caracteres como máximo)." };
  if (red && !(REDES as readonly string[]).includes(red)) return { error: `La red tiene que ser una de estas: ${REDES.join(", ")}.` };
  if (fecha && !FECHA.test(fecha)) return { error: "La fecha tiene que venir como año-mes-día." };
  if (hora && !HORA.test(hora)) return { error: "La hora tiene que venir como 14:30." };
  if (!(ESTADOS as readonly string[]).includes(estado)) return { error: `El estado tiene que ser uno de estos: ${ESTADOS.join(", ")}.` };

  const db = crearClienteServidor();
  const { data: antes, error: errorAntes } = await db.from("contenido").select("fecha").eq("id", id).maybeSingle();
  if (errorAntes || !antes) return { error: "Esa pieza no existe." };

  const cambio: Record<string, unknown> = {
    titulo: titulo || null,
    texto: cuerpo || null,
    red: red || null,
    fecha: fecha || null,
    hora: hora || null,
    estado,
  };
  // Si cambió de día, va al final del día nuevo (o de la carpeta).
  if ((antes as { fecha: string | null }).fecha !== (fecha || null)) {
    let q = db.from("contenido").select("orden").order("orden", { ascending: false }).limit(1);
    q = fecha ? q.eq("fecha", fecha) : q.is("fecha", null);
    const { data: ultimo } = await q.maybeSingle();
    cambio.orden = ((ultimo as { orden?: number } | null)?.orden ?? -1) + 1;
  }

  const { error } = await db.from("contenido").update(cambio).eq("id", id);
  if (error) {
    console.error("contenido: no se pudo editar", error);
    return { error: "No se pudo guardar. Probá de nuevo en un rato." };
  }
  revalidatePath("/admin/contenido");
  return { error: null };
}

/** Saca una pieza: la fila y su archivo. */
export async function borrarContenido(id: string): Promise<Resultado> {
  if (!(await esAdminQuienLlama())) return { error: SIN_PERMISO };
  if (!UUID.test(String(id))) return { error: "Esa pieza no existe." };
  const db = crearClienteServidor();
  const { data: fila } = await db.from("contenido").select("archivo_path").eq("id", id).maybeSingle();
  if (!fila) return { error: "Esa pieza no existe." };
  const { error } = await db.from("contenido").delete().eq("id", id);
  if (error) {
    console.error("contenido: no se pudo sacar la pieza", error);
    return { error: "No se pudo sacar. Probá de nuevo en un rato." };
  }
  const { error: errorArchivo } = await db.storage.from(BUCKET_CONTENIDO).remove([(fila as { archivo_path: string }).archivo_path]);
  if (errorArchivo) console.error("contenido: la fila se fue pero el archivo quedó en Storage", errorArchivo);
  revalidatePath("/admin/contenido");
  return { error: null };
}
