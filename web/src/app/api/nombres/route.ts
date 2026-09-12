import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { narradorDeLaSesion } from "@/lib/panel";

const MENSAJE_ERROR_GENERICO = "No pudimos guardar los nombres. Intenta de nuevo.";
const MAXIMO_CORRECCIONES = 200;

type Correccion = { original: string; corregido: string };

async function obtenerNarradorDeLaSesion(params: URLSearchParams): Promise<
  | { ok: true; narrador: { id: string }; admin: ReturnType<typeof crearClienteServidor> }
  | { ok: false; status: number; error: string }
> {
  const admin = crearClienteServidor();
  const acceso = await narradorDeLaSesion(await crearClienteSesion(), admin, params, {
    mensajeError: MENSAJE_ERROR_GENERICO, soloDuena: true,
  });
  if (!acceso.ok) return { ok: false, status: acceso.status, error: acceso.error };
  const narrador = acceso.narrador;

  return { ok: true, narrador, admin };
}

function validarCorrecciones(valor: unknown): { ok: true; correcciones: Correccion[] } | { ok: false; mensaje: string } {
  if (!Array.isArray(valor)) {
    return { ok: false, mensaje: "Las correcciones tienen que ser una lista." };
  }
  if (valor.length > MAXIMO_CORRECCIONES) {
    return { ok: false, mensaje: `No puede haber más de ${MAXIMO_CORRECCIONES} correcciones.` };
  }
  const correcciones: Correccion[] = [];
  for (const item of valor) {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof (item as { original?: unknown }).original !== "string" ||
      typeof (item as { corregido?: unknown }).corregido !== "string"
    ) {
      return { ok: false, mensaje: "Cada corrección necesita un nombre original y uno corregido." };
    }
    const original = (item as { original: string }).original.trim();
    const corregido = (item as { corregido: string }).corregido.trim();
    if (original === "" || corregido === "") {
      return { ok: false, mensaje: "Ninguna corrección puede quedar vacía." };
    }
    correcciones.push({ original, corregido });
  }
  return { ok: true, correcciones };
}

export async function GET(request: NextRequest) {
  const sesion = await obtenerNarradorDeLaSesion(request.nextUrl.searchParams);
  if (!sesion.ok) {
    return NextResponse.json({ error: sesion.error }, { status: sesion.status });
  }

  const { data: descarga } = await sesion.admin.storage
    .from("audios")
    .download(`${sesion.narrador.id}/paquete/nombres.json`);

  if (!descarga) {
    return NextResponse.json({ correcciones: [] }, { status: 200 });
  }

  try {
    const nombres = JSON.parse(await descarga.text());
    return NextResponse.json(nombres, { status: 200 });
  } catch (err) {
    console.error("nombres GET: nombres.json invalido", err);
    return NextResponse.json({ correcciones: [] }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  const sesion = await obtenerNarradorDeLaSesion(request.nextUrl.searchParams);
  if (!sesion.ok) {
    return NextResponse.json({ error: sesion.error }, { status: sesion.status });
  }

  let body: { correcciones?: unknown };
  try {
    body = (await request.json()) as { correcciones?: unknown };
  } catch {
    return NextResponse.json(
      { error: "El cuerpo de la solicitud no es JSON válido." },
      { status: 400 },
    );
  }

  const resultado = validarCorrecciones(body.correcciones);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.mensaje }, { status: 400 });
  }

  const contenido = JSON.stringify({ correcciones: resultado.correcciones });

  const { error: errorSubida } = await sesion.admin.storage
    .from("audios")
    .upload(`${sesion.narrador.id}/paquete/nombres.json`, contenido, {
      contentType: "application/json",
      upsert: true,
    });

  if (errorSubida) {
    console.error("nombres POST: fallo la subida de nombres.json", errorSubida);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
