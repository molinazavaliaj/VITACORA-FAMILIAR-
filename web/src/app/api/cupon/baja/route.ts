import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { buscarCuponPorId, darDeBajaCupon } from "@/lib/cupon-base";
import { verificarToken } from "@/lib/token-firmado";

// La baja de un clic de los recordatorios del cupón (art. 21.2 LSSI: sencilla
// y gratuita, sin login ni «indícanos tu correo»). GET = el enlace del mail:
// da de baja y lleva a /cupon/baja. POST = el botón «Cancelar suscripción» de
// Gmail y Outlook (List-Unsubscribe-Post, RFC 8058): da de baja y contesta 200.
// Anda aunque el rasca y gana se haya apagado: una baja nunca se rechaza.

export const dynamic = "force-dynamic";

async function baja(request: NextRequest): Promise<{ ok: boolean; idioma: string | null }> {
  const id = request.nextUrl.searchParams.get("c") ?? "";
  const token = request.nextUrl.searchParams.get("t");
  if (!id || !verificarToken("cupon-baja", token, id)) return { ok: false, idioma: null };
  try {
    const admin = crearClienteServidor();
    const r = await darDeBajaCupon(admin, id);
    if (!r.ok) {
      console.error("cupon baja: no pude dar de baja", id, r.falla);
      return { ok: false, idioma: null };
    }
    const fila = await buscarCuponPorId(admin, id);
    return { ok: true, idioma: fila.ok ? (fila.valor?.idioma ?? null) : null };
  } catch (err) {
    console.error("cupon baja: falló", err);
    return { ok: false, idioma: null };
  }
}

export async function GET(request: NextRequest) {
  const r = await baja(request);
  const destino = new URL("/cupon/baja", process.env.URL_BASE ?? request.nextUrl.origin);
  destino.searchParams.set(r.ok ? "listo" : "mal", "1");
  if (r.idioma) destino.searchParams.set("idioma", r.idioma);
  return NextResponse.redirect(destino, { status: 303 });
}

export async function POST(request: NextRequest) {
  const r = await baja(request);
  return NextResponse.json({ ok: r.ok }, { status: r.ok ? 200 : 400 });
}
