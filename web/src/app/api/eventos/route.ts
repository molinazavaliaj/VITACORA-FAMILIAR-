// El formulario de /eventos (Vitácora Eventos, 17/10). Público, sin sesión:
// valida, descarta a los robots (campo trampa) y avisa a los socios por mail
// (MAIL_SOCIOS). No guarda nada en la base: la consulta vive en el mail.

import { NextRequest, NextResponse } from "next/server";
import { enviarMailSocios } from "@/lib/mail";
import { esRobot, mailConsultaEvento, validarConsultaEvento } from "@/lib/eventos";

export async function POST(request: NextRequest) {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "faltan" }, { status: 400 });
  }

  // Al robot se le contesta como si hubiera salido, para que no reintente.
  if (esRobot(cuerpo)) return NextResponse.json({ ok: true });

  const validado = validarConsultaEvento(cuerpo);
  if (!validado.ok) return NextResponse.json({ error: validado.error }, { status: 400 });

  const { asunto, texto } = mailConsultaEvento(validado.consulta);
  const salio = await enviarMailSocios(asunto, texto);
  if (!salio) {
    console.error("eventos POST: no salió el aviso a los socios (¿MAIL_SOCIOS o RESEND_API_KEY?)");
    return NextResponse.json({ error: "envio" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
