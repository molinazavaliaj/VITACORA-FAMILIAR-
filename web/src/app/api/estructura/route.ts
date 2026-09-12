import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { narradorDeLaSesion } from "@/lib/panel";

const MENSAJE_ERROR_GENERICO = "No pudimos cargar la estructura del libro. Intenta de nuevo.";

export async function GET(request: NextRequest) {
  const admin = crearClienteServidor();
  const acceso = await narradorDeLaSesion(await crearClienteSesion(), admin, request.nextUrl.searchParams, {
    mensajeError: MENSAJE_ERROR_GENERICO,
  });
  if (!acceso.ok) return NextResponse.json({ error: acceso.error }, { status: acceso.status });
  const narrador = acceso.narrador;

  const { data: descarga, error: errorDescarga } = await admin.storage
    .from("audios")
    .download(`${narrador.id}/paquete/estructura.json`);

  if (errorDescarga || !descarga) {
    return NextResponse.json(
      { error: "Todavía no armamos la estructura del libro." },
      { status: 404 },
    );
  }

  let estructura: unknown;
  try {
    estructura = JSON.parse(await descarga.text());
  } catch (err) {
    console.error("estructura GET: estructura.json invalido", err);
    return NextResponse.json({ error: MENSAJE_ERROR_GENERICO }, { status: 500 });
  }

  return NextResponse.json(estructura, { status: 200 });
}
