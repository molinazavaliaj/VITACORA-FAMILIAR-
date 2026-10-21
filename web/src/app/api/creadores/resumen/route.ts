import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { creadoresPrendido } from "@/lib/creadores";
import { mandarResumenMensual } from "@/lib/creadores-base";

// El cron mensual del programa de creadores (vercel.json, el día 1 a las 9,
// 21/10): mail a los socios con lo pendiente de pagar por creador. Vercel lo
// llama con `Authorization: Bearer <CRON_SECRET>`; sin CRON_SECRET cargado, o
// con otra clave, no hace nada. Con CREADORES apagado, tampoco. Sin pendientes,
// no manda nada.

export const dynamic = "force-dynamic";

function autorizado(request: NextRequest): boolean {
  const secreto = process.env.CRON_SECRET;
  if (!secreto) return false;
  const esperado = Buffer.from(`Bearer ${secreto}`);
  const recibido = Buffer.from(request.headers.get("authorization") ?? "");
  return recibido.length === esperado.length && timingSafeEqual(recibido, esperado);
}

export async function GET(request: NextRequest) {
  if (!autorizado(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  if (!creadoresPrendido()) return NextResponse.json({ apagado: true }, { status: 200 });
  const r = await mandarResumenMensual(crearClienteServidor());
  if (!r.ok) {
    console.error("creadores resumen: falló", r.falla);
    return NextResponse.json({ error: r.falla }, { status: 500 });
  }
  console.log(`creadores resumen: ${r.valor.creadores} creadores con pendientes, mail ${r.valor.enviado ? "enviado" : "no enviado"}`);
  return NextResponse.json(r.valor, { status: 200 });
}
