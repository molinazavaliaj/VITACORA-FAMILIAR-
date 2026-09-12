// Correos que manda la web (los de la fábrica viven en fabrica/src/mail/).
// Resend por su API HTTP con fetch, sin SDK: una dependencia menos.
//
// Sin RESEND_API_KEY no se tira: se avisa por consola y se devuelve false.
// Un mail que no sale no puede tumbar un pago que ya se cobró.
//
// ⚠️ Textos a aprobar por Naza (regla de la casa). Voz de marca: castellano
// neutro de "tú".

const REMITENTE = "Vitácora Familiar <hola@vitacorafamiliar.com>";

function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function enviar(opciones: { para: string; asunto: string; html: string }): Promise<boolean> {
  const clave = process.env.RESEND_API_KEY;
  if (!clave) {
    console.warn(`mail: falta RESEND_API_KEY, no se manda "${opciones.asunto}" a ${opciones.para}.`);
    return false;
  }

  const respuesta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${clave}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: REMITENTE,
      to: [opciones.para],
      subject: opciones.asunto,
      html: opciones.html,
    }),
  });

  if (!respuesta.ok) {
    throw new Error(`Resend rechazó "${opciones.asunto}" (${respuesta.status}): ${await respuesta.text()}`);
  }
  return true;
}

function envoltorio(cuerpo: string): string {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr><td align="center" style="padding:40px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;font-family:Georgia,'Times New Roman',serif;color:#14140F;font-size:17px;line-height:1.65;">
        ${cuerpo}
        <tr><td style="border-top:1px solid #e7e5e4;padding-top:20px;font-size:14px;color:#78716c;font-style:italic;">
          En cada familia hay un libro sin escribir.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/**
 * El mail que llega apenas se confirma el pago: qué va a pasar ahora y cómo
 * entrar al tablero. No lleva link firmado: entra con su correo y el código
 * de 6 dígitos, que es el login que ya existe.
 */
export async function enviarMailAcceso(opciones: { para: string; comoLeDicen: string }): Promise<boolean> {
  const quien = escapar(opciones.comoLeDicen);
  const urlBase = process.env.URL_BASE ?? "https://www.vitacorafamiliar.com";

  return enviar({
    para: opciones.para,
    asunto: `Listo. Hoy le escribimos a tu ${opciones.comoLeDicen}.`,
    html: envoltorio(`
        <tr><td style="padding-bottom:24px;">
          <strong style="font-size:22px;font-weight:normal;">Gracias por confiar. Ya está en marcha.</strong>
        </td></tr>
        <tr><td style="padding-bottom:24px;">
          En un rato le llega un mensaje nuestro por WhatsApp a tu ${quien},
          contándole que lo anotaste y pidiéndole permiso. <strong style="font-weight:normal;">No
          empieza nada hasta que diga que sí.</strong> Si no acepta, escríbenos y te
          devolvemos el dinero.
        </td></tr>
        <tr><td style="padding-bottom:24px;">
          Cuando conteste su tercera pregunta te avisamos por acá: vas a poder leer
          sus primeras páginas y escuchar su voz.
        </td></tr>
        <tr><td style="padding-bottom:12px;">
          Para seguir el libro día a día, entra con este mismo correo:
        </td></tr>
        <tr><td style="padding-bottom:32px;">
          <a href="${escapar(urlBase)}/entrar" style="display:inline-block;background:#5D3FD3;color:#ffffff;text-decoration:none;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;">
            Entrar a mi tablero
          </a>
          <div style="margin-top:10px;font-size:14px;color:#78716c;">
            Te pedimos un código de 6 números que llega a este correo. Sin contraseñas.
          </div>
        </td></tr>
    `),
  });
}
