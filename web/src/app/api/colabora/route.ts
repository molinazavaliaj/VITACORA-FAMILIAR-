import { NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { altaAbiertaEn, creadoresPrendido, esRobotColabora, idiomaDelAlta, validarAltaCreador } from "@/lib/creadores";
import { anotarCreador } from "@/lib/creadores-base";
import { TEXTOS_COLABORA, textoCasilla } from "@/app/_textos/colabora";

// El formulario de /colabora (programa de creadores, 21/10). Público, sin
// sesión: valida, descarta a los robots (campo trampa), frena 5 altas por IP y
// por hora, y anota al creador como pendiente (lib/creadores-base.ts). Contesta
// siempre lo mismo, sea un correo nuevo o uno que ya estaba: nadie averigua
// quién se anotó. Con CREADORES apagado, 404. Desde Argentina, también 404 por
// ahora: el alta solo está abierta en España (IDIOMAS_CON_ALTA, lib/creadores.ts).

/**
 * La versión de los textos de las casillas que se guardan como prueba (subirla
 * si cambian). «-legal»: se sumó la casilla de mayor de 18 años (CR-26).
 */
const VERSION_CONSENTIMIENTO = "2026-10-21-legal";

function ipDe(request: NextRequest): string | null {
  const reenviada = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return reenviada || request.headers.get("x-real-ip") || null;
}

export async function POST(request: NextRequest) {
  if (!creadoresPrendido()) return NextResponse.json({ error: "envio" }, { status: 404 });
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "faltan" }, { status: 400 });
  }

  // Argentina cerrada por ahora (pagar comisiones allá no está resuelto).
  if (!altaAbiertaEn(idiomaDelAlta(cuerpo))) return NextResponse.json({ error: "envio" }, { status: 404 });

  // Al robot se le contesta como si hubiera salido, para que no reintente.
  if (esRobotColabora(cuerpo)) return NextResponse.json({ ok: true });

  const validado = validarAltaCreador(cuerpo);
  if (!validado.ok) return NextResponse.json({ error: validado.error }, { status: 400 });

  const userAgent = request.headers.get("user-agent")?.slice(0, 300) ?? undefined;
  try {
    const r = await anotarCreador(crearClienteServidor(), {
      alta: validado.alta,
      consentimiento: {
        // Las dos casillas, con el texto exacto que vio: las condiciones y la de mayor de 18.
        textos: [textoCasilla(TEXTOS_COLABORA[validado.alta.idioma]), TEXTOS_COLABORA[validado.alta.idioma].formulario.mayor],
        version: VERSION_CONSENTIMIENTO,
        ...(userAgent ? { userAgent } : {}),
      },
      ip: ipDe(request),
    });
    if (!r.ok) {
      // El freno contesta lo mismo que un alta que salió.
      if (r.falla === "freno") return NextResponse.json({ ok: true });
      console.error("colabora: no pude guardar el alta", r.falla);
      return NextResponse.json({ error: "envio" }, { status: r.falla === "tabla_ausente" ? 409 : 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("colabora: falló el alta", err);
    return NextResponse.json({ error: "envio" }, { status: 500 });
  }
}
