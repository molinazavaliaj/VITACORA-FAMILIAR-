import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { correrRecordatorios } from "@/lib/cupon-base";
import { rascaPrendido } from "@/lib/cupon";

// El cron diario de los recordatorios del cupón (vercel.json, 20/10). Vercel
// lo llama con `Authorization: Bearer <CRON_SECRET>`; sin CRON_SECRET cargado,
// o con otra clave, no hace nada. Con el rasca y gana apagado, tampoco.

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
  if (!rascaPrendido()) return NextResponse.json({ apagado: true }, { status: 200 });
  const r = await correrRecordatorios(crearClienteServidor());
  if (!r.ok) {
    console.error("cupon recordatorios: falló", r.falla);
    return NextResponse.json({ error: r.falla }, { status: 500 });
  }
  console.log(`cupon recordatorios: ${r.valor.enviados} enviados, ${r.valor.fallidos} fallidos, ${r.valor.borrados} borrados`);
  return NextResponse.json(r.valor, { status: 200 });
}
