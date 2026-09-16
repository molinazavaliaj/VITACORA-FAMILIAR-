import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { narradorDeLaSesion, PUEDE, type Rol } from "@/lib/panel";

// "Sugerime preguntas" (docs/panel-usuario.md §6.2 y §11.7). La web no piensa:
// le pide al entrevistador (que tiene toda la historia y el cerebro) 5 ideas
// para este narrador, con la clave compartida SUGERIDAS_CLAVE, y devuelve lo
// que vuelve. No se guarda nada: la familia elige cuáles agregar, y eso pasa
// por /api/guion como cualquier pregunta (tipo 'sugerida').

const GENERICO = "No pudimos armar las sugerencias. Intenta de nuevo en un momento.";
const TIEMPO_MAXIMO_MS = 60_000; // el modelo lee toda la historia: tarda

export type Sugerida = { texto: string; capitulo: string };

export async function POST(request: NextRequest): Promise<NextResponse> {
  const admin = crearClienteServidor();
  const acceso = await narradorDeLaSesion(await crearClienteSesion(), admin, request.nextUrl.searchParams, { mensajeError: GENERICO });
  if (!acceso.ok) return NextResponse.json({ error: acceso.error }, { status: acceso.status });
  if (!PUEDE.agregarPreguntasYFotos(acceso.rol as Rol)) {
    return NextResponse.json({ error: "Solo la familia puede pedir sugerencias." }, { status: 403 });
  }

  const base = process.env.ENTREVISTADOR_URL?.replace(/\/$/, "");
  const clave = process.env.SUGERIDAS_CLAVE;
  if (!base || !clave) {
    console.warn("sugeridas: faltan ENTREVISTADOR_URL o SUGERIDAS_CLAVE");
    return NextResponse.json({ error: "Las sugerencias todavía no están disponibles." }, { status: 503 });
  }

  try {
    const r = await fetch(`${base}/sugeridas`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-clave": clave },
      body: JSON.stringify({ narradorId: acceso.narrador.id }),
      signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
    });
    const json = (await r.json().catch(() => ({}))) as { sugeridas?: Sugerida[]; error?: string };
    if (!r.ok || !Array.isArray(json.sugeridas)) {
      console.error("sugeridas: el entrevistador respondió", r.status, json.error);
      return NextResponse.json({ error: GENERICO }, { status: 502 });
    }
    return NextResponse.json({ sugeridas: json.sugeridas });
  } catch (err) {
    console.error("sugeridas: fallo la llamada al entrevistador", err);
    return NextResponse.json({ error: GENERICO }, { status: 502 });
  }
}
