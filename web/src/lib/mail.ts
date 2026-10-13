// Correos que manda la web (los de la fábrica viven en fabrica/src/mail/).
// Resend por su API HTTP con fetch, sin SDK: una dependencia menos.
//
// Sin RESEND_API_KEY no se tira: se avisa por consola y se devuelve false.
// Un mail que no sale no puede tumbar un pago que ya se cobró.
//
// ⚠️ Textos a aprobar por Naza (regla de la casa). Trato por país (Naza, 09/10):
// vos para Argentina y tú para España (`familias.region`); sin región, vos.
// El de acceso y la invitación son los aprobados el 06/10 (rama web-textos-v3).
// Rediseño (fase 1): acceso y regalo con el diseño de la maqueta `Email` y los
// textos en lib/mail-textos.ts (es/ca/ar); la invitación sigue con el envoltorio
// de antes hasta la fase 3.

/** `familias.region` → ¿de tú? Solo España. */
const deTu = (region: string | null | undefined): boolean => region === "ES";

import type { TratoComprador } from "./regalo-textos";
import { langDeIdioma, type IdiomaWeb } from "./idioma-web";
import { textosMail } from "./mail-textos";

const REMITENTE = "Vitácora Familiar <hola@vitacorafamiliar.com>";

function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** `texto`: la versión de texto plano (los mails del rediseño la llevan siempre). */
async function enviar(opciones: { para: string; asunto: string; html: string; texto?: string }): Promise<boolean> {
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
      ...(opciones.texto ? { text: opciones.texto } : {}),
    }),
    // Un Resend colgado no puede colgar la ruta (webhook de pago): a los 15 s tira
    // (TimeoutError) como cualquier fallo; quienes llaman ya lo atrapan.
    signal: AbortSignal.timeout(15_000),
  });

  if (!respuesta.ok) {
    throw new Error(`Resend rechazó "${opciones.asunto}" (${respuesta.status}): ${await respuesta.text()}`);
  }
  return true;
}

/**
 * Un aviso de texto a los socios (MAIL_SOCIOS, separados por coma), como `avisarSocios`
 * de la fábrica. Sin MAIL_SOCIOS o sin RESEND_API_KEY, false. Nunca tira.
 */
export async function enviarMailSocios(asunto: string, texto: string): Promise<boolean> {
  const socios = (process.env.MAIL_SOCIOS ?? "").split(",").map((m) => m.trim()).filter(Boolean);
  if (socios.length === 0) return false;
  const html = `<pre style="font-family:Arial,Helvetica,sans-serif;font-size:14px;white-space:pre-wrap;">${escapar(texto)}</pre>`;
  let alguno = false;
  for (const para of socios) {
    try {
      if (await enviar({ para, asunto, html })) alguno = true;
    } catch (err) {
      console.error(`mail: no salió el aviso a los socios (${para}):`, err instanceof Error ? err.message : err);
    }
  }
  return alguno;
}

/** El envoltorio de antes del rediseño: solo lo usa la invitación (pasa al diseño nuevo en la fase 3). */
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

// ── El diseño del rediseño (maqueta `Email`, fase 1) ─────────────────────────
// HTML de mail de verdad: tablas, estilos en línea, 600 px, sin JS. Las fuentes
// de la maqueta (Playfair, Source Serif, Archivo) van primero en cada pila pero
// no se cargan: cada cliente cae a Georgia o a Arial, que tiene todo el mundo.
// El marco es oscuro como en la maqueta y la tarjeta clara: cada texto tiene su
// fondo declarado (también con `bgcolor`), así se lee igual si el cliente pinta
// todo de claro o de oscuro. El botón es una tabla con fondo (Outlook incluido).

const COLOR = {
  marco: "#1a1916",
  cabecera: "#0a0a0a",
  sobreCabecera: "#ededed",
  tarjeta: "#fbf8f2",
  etiqueta: "#8a7350",
  titulo: "#1a1712",
  texto: "#4a4236",
  fila: "#3a342b",
  linea: "#ece4d6",
  boton: "#2a2620",
  sobreBoton: "#f3ece0",
  pie: "#8a7d68",
} as const;

const SERIF_TITULO = "'Playfair Display', Georgia, 'Times New Roman', serif";
const SERIF = "'Source Serif 4', Georgia, 'Times New Roman', serif";
const SANS = "Archivo, 'Helvetica Neue', Helvetica, Arial, sans-serif";

/** El logo (las elipses de la marca) en PNG: el SVG no se ve en Gmail ni en Outlook. */
export const RUTA_LOGO_MAIL = "/mail/vitacora-logo.png";

export type MailArmado = { asunto: string; html: string; texto: string };

const urlBaseMail = () => process.env.URL_BASE ?? "https://www.vitacorafamiliar.com";

/** `familias.region` → idioma del mail. Como siempre: España de tú, el resto (y sin región) de vos. */
export function idiomaMailDeRegion(region: string | null | undefined): IdiomaWeb {
  return deTu(region) ? "es" : "ar";
}

function boton(href: string, texto: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;">
  <tr><td bgcolor="${COLOR.boton}" style="background:${COLOR.boton};border-radius:999px;">
    <a href="${escapar(href)}" style="display:inline-block;padding:15px 26px;border-radius:999px;background:${COLOR.boton};color:${COLOR.sobreBoton};text-decoration:none;font-family:${SANS};font-size:15px;font-weight:600;line-height:1.2;">${escapar(texto)}</a>
  </td></tr>
</table>`;
}

/** «Qué pasa ahora»: cuándo · qué. En el celular se apila (la etiqueta arriba). */
function lineaDeTiempo(titulo: string, filas: { cuando: string; que: string }[]): string {
  const celdas = filas
    .map((f, i) => {
      const borde = i < filas.length - 1 ? `border-bottom:1px solid ${COLOR.linea};` : "";
      return `<tr><td style="padding:14px 0;${borde}">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td class="vt-cuando" width="130" valign="top" style="width:130px;padding-right:12px;font-family:${SANS};font-size:12px;letter-spacing:.04em;line-height:1.5;color:${COLOR.etiqueta};">${escapar(f.cuando)}</td>
        <td class="vt-que" valign="top" style="font-family:${SERIF};font-size:15px;line-height:1.5;color:${COLOR.fila};">${escapar(f.que)}</td>
      </tr></table>
    </td></tr>`;
    })
    .join("\n");
  return `<tr><td class="vt-px" style="padding:30px 36px 10px;">
    <div style="font-family:${SANS};font-size:11px;letter-spacing:.22em;color:${COLOR.etiqueta};">${escapar(titulo)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:6px;">
    ${celdas}
    </table>
  </td></tr>`;
}

/**
 * El cascarón de la maqueta: marco oscuro, cabecera negra con el logo, tarjeta
 * clara con etiqueta + título + `cuerpo`, «¿Dudas?» y el pie. `cuerpo` son filas
 * (<tr>) de la tabla de 600.
 */
function cascaron(o: { idioma: IdiomaWeb; vistaPrevia: string; titulo: string; cuerpo: string }): string {
  const t = textosMail(o.idioma).comun;
  const logo = `${urlBaseMail()}${RUTA_LOGO_MAIL}`;
  return `<!DOCTYPE html>
<html lang="${langDeIdioma(o.idioma)}" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light dark" />
<meta name="supported-color-schemes" content="light dark" />
<title>${escapar(o.titulo)}</title>
<style>
  body { margin:0 !important; padding:0 !important; width:100% !important; }
  @media (max-width:480px) {
    .vt-marco { padding:0 !important; }
    .vt-px { padding-left:20px !important; padding-right:20px !important; }
    .vt-titulo { font-size:26px !important; }
    .vt-cuando, .vt-que { display:block !important; width:auto !important; padding-right:0 !important; }
    .vt-cuando { padding-bottom:4px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${COLOR.marco};">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${COLOR.marco};">${escapar(o.vistaPrevia)}${"&#8199;&#847; ".repeat(40)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLOR.marco}" style="background:${COLOR.marco};">
  <tr><td class="vt-marco" align="center" style="padding:40px 12px 60px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;border-collapse:separate;">
      <tr><td bgcolor="${COLOR.cabecera}" class="vt-px" style="background:${COLOR.cabecera};padding:26px 36px;border-radius:6px 6px 0 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td valign="middle" style="padding-right:12px;"><img src="${escapar(logo)}" width="44" height="28" alt="" style="display:block;border:0;width:44px;height:28px;" /></td>
          <td valign="middle" style="font-family:${SANS};font-size:13px;letter-spacing:.22em;font-weight:500;color:${COLOR.sobreCabecera};">VITÁCORA</td>
        </tr></table>
      </td></tr>
      <tr><td bgcolor="${COLOR.tarjeta}" style="background:${COLOR.tarjeta};border-radius:0 0 6px 6px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td class="vt-px" style="padding:40px 36px 0;font-family:${SANS};font-size:11px;letter-spacing:.22em;color:${COLOR.etiqueta};">${escapar(t.etiqueta)}</td></tr>
          <tr><td class="vt-px vt-titulo" style="padding:14px 36px 0;font-family:${SERIF_TITULO};font-weight:500;font-size:32px;line-height:1.15;color:${COLOR.titulo};">${escapar(o.titulo)}</td></tr>
          ${o.cuerpo}
          <tr><td class="vt-px" style="padding:26px 36px 34px;font-family:${SERIF};font-size:15px;line-height:1.55;color:${COLOR.texto};">${escapar(t.dudas)}</td></tr>
          <tr><td class="vt-px" style="border-top:1px solid ${COLOR.linea};padding:20px 36px 26px;font-family:${SANS};font-size:11px;line-height:1.6;color:${COLOR.pie};">${escapar(t.pie)}<br />${escapar(t.porQue)}</td></tr>
        </table>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

/** Un párrafo de la tarjeta (ya escapado por quien llama). */
const parrafo = (html: string) =>
  `<tr><td class="vt-px" style="padding:14px 36px 0;font-family:${SERIF};font-size:16px;line-height:1.6;color:${COLOR.texto};">${html}</td></tr>`;

/** El texto plano: lo mismo, en orden, para los clientes que no muestran HTML. */
const textoPlano = (bloques: string[]) => `${bloques.join("\n\n")}\n`;

/**
 * El mail que llega apenas se confirma el pago: qué va a pasar ahora y cómo
 * entrar al tablero. No lleva link firmado: entra con su correo y el código
 * de 6 dígitos, que es el login que ya existe. `idioma` pisa a la región
 * (para el catalán, cuando la compra lo guarde).
 */
export function armarMailAcceso(opciones: { comoLeDicen: string; region?: string | null; idioma?: IdiomaWeb }): MailArmado {
  const idioma = opciones.idioma ?? idiomaMailDeRegion(opciones.region);
  const { comun, acceso } = textosMail(idioma);
  const como = opciones.comoLeDicen;
  const entrar = `${urlBaseMail()}/entrar`;

  const html = cascaron({
    idioma,
    vistaPrevia: acceso.vistaPrevia(como),
    titulo: acceso.titulo,
    cuerpo: `
          ${parrafo(`${escapar(acceso.enUnRato(como))} <strong style="font-weight:normal;">${escapar(acceso.arranca)}</strong>`)}
          ${parrafo(escapar(acceso.paraEscuchar))}
          <tr><td class="vt-px" style="padding:18px 36px 0;">${boton(entrar, comun.botonTablero)}</td></tr>
          <tr><td class="vt-px" style="padding:10px 36px 0;font-family:${SERIF};font-size:14px;line-height:1.5;color:${COLOR.pie};">${escapar(comun.codigo)}</td></tr>
          ${lineaDeTiempo(comun.quePasaAhora, [
            { cuando: comun.mientrasCuenta, que: acceso.cuandoEmpiece },
            { cuando: comun.alTerminar, que: comun.alTerminarTexto },
          ])}`,
  });

  const texto = textoPlano([
    comun.etiqueta,
    acceso.titulo,
    `${acceso.enUnRato(como)} ${acceso.arranca}`,
    acceso.paraEscuchar,
    `${comun.botonTablero}\n${entrar}\n${comun.codigo}`,
    `${comun.quePasaAhora}\n${comun.mientrasCuenta}. ${acceso.cuandoEmpiece}\n${comun.alTerminar}. ${comun.alTerminarTexto}`,
    comun.dudas,
    `${comun.pie}\n${comun.porQue}`,
  ]);

  return { asunto: acceso.asunto(como), html, texto };
}

export async function enviarMailAcceso(opciones: { para: string; comoLeDicen: string; region?: string | null; idioma?: IdiomaWeb }): Promise<boolean> {
  const mail = armarMailAcceso(opciones);
  return enviar({ para: opciones.para, asunto: mail.asunto, html: mail.html, texto: mail.texto });
}

/**
 * Gift card (08/10): llega al confirmar el pago. Lleva al link de la tarjeta.
 * Le habla con el trato de quien compra (tú → es, vos → ar); `idioma` lo pisa.
 */
export function armarMailRegalo(opciones: { comoLeDicen: string; codigo: string; trato: TratoComprador; idioma?: IdiomaWeb }): MailArmado {
  const idioma = opciones.idioma ?? (opciones.trato === "tu" ? "es" : "ar");
  const { comun, regalo } = textosMail(idioma);
  const como = opciones.comoLeDicen;
  const urlBase = urlBaseMail();
  const tarjeta = `${urlBase}/regalo/${encodeURIComponent(opciones.codigo)}/tarjeta`;
  const entrar = `${urlBase}/entrar`;
  const asunto = regalo.asunto(como);

  const html = cascaron({
    idioma,
    vistaPrevia: regalo.vistaPrevia,
    titulo: asunto,
    cuerpo: `
          ${parrafo(escapar(regalo.cuerpo(como)))}
          <tr><td class="vt-px" style="padding:22px 36px 0;">${boton(tarjeta, regalo.boton)}</td></tr>
          ${lineaDeTiempo(comun.quePasaAhora, [
            { cuando: comun.mientrasCuenta, que: regalo.mientrasCuentaTexto },
            { cuando: comun.alTerminar, que: comun.alTerminarTexto },
          ])}
          <tr><td class="vt-px" style="padding:18px 36px 0;font-family:${SANS};font-size:14px;font-weight:600;"><a href="${escapar(entrar)}" style="color:${COLOR.boton};text-decoration:underline;">${escapar(comun.botonTablero)} →</a></td></tr>`,
  });

  const texto = textoPlano([
    comun.etiqueta,
    asunto,
    regalo.cuerpo(como),
    `${regalo.boton}\n${tarjeta}`,
    `${comun.quePasaAhora}\n${comun.mientrasCuenta}. ${regalo.mientrasCuentaTexto}\n${comun.alTerminar}. ${comun.alTerminarTexto}`,
    `${comun.botonTablero}\n${entrar}\n${comun.codigo}`,
    comun.dudas,
    `${comun.pie}\n${comun.porQue}`,
  ]);

  return { asunto, html, texto };
}

export async function enviarMailRegalo(opciones: {
  para: string;
  comoLeDicen: string;
  codigo: string;
  trato: TratoComprador;
  idioma?: IdiomaWeb;
}): Promise<boolean> {
  const mail = armarMailRegalo(opciones);
  return enviar({ para: opciones.para, asunto: mail.asunto, html: mail.html, texto: mail.texto });
}

/**
 * La invitación a una historia (docs/panel-usuario.md §8). Entra con el mismo
 * login que la dueña: correo + código. Al entrar por primera vez, lib/panel.ts
 * vincula la invitación con su usuario.
 */
export async function enviarMailInvitacion(opciones: {
  para: string;
  nombreNarrador: string;
  quienInvita: string;
  region?: string | null;
  /** Terminó de contar: la invitación es para contestar las dudas del escritor (13/10). */
  paraDudas?: boolean;
}): Promise<boolean> {
  const narrador = escapar(opciones.nombreNarrador);
  const quien = escapar(opciones.quienInvita);
  const urlBase = process.env.URL_BASE ?? "https://www.vitacorafamiliar.com";
  const tu = deTu(opciones.region);

  return enviar({
    para: opciones.para,
    asunto: opciones.paraDudas
      ? `${opciones.quienInvita} te pide ayuda con la historia de ${opciones.nombreNarrador}`
      : `${opciones.quienInvita} te invita a la historia de ${opciones.nombreNarrador}`,
    html: envoltorio(`
        <tr><td style="padding-bottom:24px;">
          <strong style="font-size:22px;font-weight:normal;">${opciones.paraDudas
            ? `${narrador} terminó de contar su vida y estamos por escribir su libro.`
            : `Un biógrafo está escribiendo el libro de la vida de ${narrador}.`}</strong>
        </td></tr>
        <tr><td style="padding-bottom:24px;">
          ${opciones.paraDudas
            ? `${quien} te invitó porque quedaron algunas dudas sobre lo que contó, como un nombre o un año.
          Si ${tu ? "sabes" : "sabés"} la respuesta, ${tu ? "puedes" : "podés"} escribirla antes de que se escriba el libro.
          También vas a poder escuchar lo que contó.`
            : `${quien} te invitó a seguir su historia. Vas a poder escuchar lo que va
          contando, sumar preguntas que te gustaría que le hagan y agregar fotos de
          cada época.`}
        </td></tr>
        <tr><td style="padding-bottom:12px;">
          ${tu ? "Entra" : "Entrá"} con este mismo correo:
        </td></tr>
        <tr><td style="padding-bottom:32px;">
          <a href="${escapar(urlBase)}/entrar" style="display:inline-block;background:#5D3FD3;color:#ffffff;text-decoration:none;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;">
            ${opciones.paraDudas ? "Ver las dudas" : `Ver la historia de ${narrador}`}
          </a>
          <div style="margin-top:10px;font-size:14px;color:#78716c;">
            Te pedimos un código de 6 números que llega a este correo. Sin contraseñas.
          </div>
        </td></tr>
    `),
  });
}
