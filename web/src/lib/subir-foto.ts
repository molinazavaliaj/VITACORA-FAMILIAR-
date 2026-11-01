import { crearClienteNavegador } from "@/lib/supabase/navegador";
import type { CalidadFoto } from "@/lib/guion";

// Sube una foto sin pasar el archivo por Vercel, que corta todo pedido de más
// de 4,5 MB (ver api/fotos/route.ts): pide permiso, la sube directo a Storage
// con la URL firmada y confirma. `url` es /api/fotos con su narrador (y el
// token del paso 5 de la compra, si lo hay). Si algo falla, tira un Error con
// el mensaje para la familia (el del servidor, o `generico`).

type Datos = { capitulo?: string | null; epigrafe?: string; principal?: boolean; medida: { ancho: number; alto: number } | null };

async function llamar(url: string, cuerpo: Record<string, unknown>, generico: string) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
  const json = (await r.json().catch(() => ({}))) as Record<string, unknown> & { error?: string };
  if (!r.ok) throw new Error(json.error ?? generico);
  return json;
}

export async function subirFotoDirecta(url: string, archivo: File, datos: Datos, generico: string) {
  const permiso = await llamar(url, { paso: "pedir", tipo: archivo.type, tamano: archivo.size }, generico);
  const { error } = await crearClienteNavegador().storage.from("audios")
    .uploadToSignedUrl(String(permiso.path), String(permiso.token), archivo, { contentType: archivo.type });
  if (error) {
    console.error("subir-foto: fallo la subida directa", error);
    throw new Error(generico);
  }
  const listo = await llamar(url, {
    paso: "confirmar", id: permiso.id, tipo: archivo.type,
    capitulo: datos.capitulo ?? null, epigrafe: datos.epigrafe, principal: datos.principal === true,
    ancho: datos.medida?.ancho, alto: datos.medida?.alto,
  }, generico);
  return listo as { id: string; calidad: CalidadFoto | null; aviso: string | null };
}
