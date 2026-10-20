import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { rascaPrendido } from "@/lib/cupon";
import { pedirCupon } from "@/lib/cupon-base";
import { esIdiomaWeb, regionDeIdioma, type IdiomaWeb } from "@/lib/idioma-web";
import { TEXTOS_CUPON } from "@/app/_textos/cupon";

// El popup del rasca y gana pide el cupón (20/10). Dos casillas sin marcar y
// separadas: la primera (recibir el cupón) es obligatoria; la segunda
// (recordatorios) es opcional y el cupón se entrega igual sin ella (art. 7.4
// RGPD). Doble opt-in: acá solo sale el mail de confirmar; el código llega
// cuando toca el botón (lib/cupon-base.ts). Contesta siempre lo mismo, haya o
// no un cupón con ese correo: nadie averigua quién lo pidió.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** La versión de los textos de las casillas que se guardan como prueba (subirla si cambian). */
const VERSION_CONSENTIMIENTO = "2026-10-19-tanda1";

type Cuerpo = { email?: unknown; recibir?: unknown; recordatorios?: unknown; idiomaWeb?: unknown };

function ipDe(request: NextRequest): string | null {
  const reenviada = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return reenviada || request.headers.get("x-real-ip") || null;
}

export async function POST(request: NextRequest) {
  let body: Cuerpo;
  try {
    body = (await request.json()) as Cuerpo;
  } catch {
    return NextResponse.json({ error: "El pedido llegó mal formado." }, { status: 400 });
  }
  const idioma: IdiomaWeb = esIdiomaWeb(body.idiomaWeb) ? body.idiomaWeb : "es";
  const T = TEXTOS_CUPON[idioma].popup;
  if (!rascaPrendido()) return NextResponse.json({ error: T.fallo }, { status: 404 });

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email) || email.length > 254) return NextResponse.json({ error: T.faltaCorreo }, { status: 400 });
  // La primera casilla es la que pide el cupón: sin ella no hay nada que mandar.
  if (body.recibir !== true) return NextResponse.json({ error: T.faltaCasilla }, { status: 400 });
  const aceptaRecordatorios = body.recordatorios === true;

  const userAgent = request.headers.get("user-agent")?.slice(0, 300) ?? undefined;
  try {
    const r = await pedirCupon(crearClienteServidor(), {
      email,
      region: regionDeIdioma(idioma),
      idioma,
      aceptaRecordatorios,
      consentimiento: {
        textos: [T.casillaCupon, ...(aceptaRecordatorios ? [T.casillaRecordatorios] : [])],
        version: VERSION_CONSENTIMIENTO,
        ...(userAgent ? { userAgent } : {}),
      },
      ip: ipDe(request),
    });
    if (!r.ok) {
      // El freno por IP contesta lo mismo que un pedido que salió: un 429 diría qué correos ya lo pidieron.
      if (r.falla === "freno") return NextResponse.json({ ok: true }, { status: 200 });
      console.error("cupon: no pude guardar el pedido", r.falla);
      return NextResponse.json({ error: T.fallo }, { status: r.falla === "tabla_ausente" ? 409 : 500 });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("cupon: falló el pedido del cupón", err);
    return NextResponse.json({ error: T.fallo }, { status: 500 });
  }
}
