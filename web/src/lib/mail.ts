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
// textos en lib/mail-textos.ts (es/ca/ar); la invitación, igual desde la fase 3.

/** `familias.region` → ¿de tú? Solo España. */
const deTu = (region: string | null | undefined): boolean => region === "ES";

import type { TratoComprador } from "./regalo-textos";
import { langDeIdioma, type IdiomaWeb } from "./idioma-web";
import { TEXTOS_MAIL_KIDS, textosMail, type CanalMailKids } from "./mail-textos";

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

// ── El diseño del rediseño (maqueta `Email`, fase 1) ─────────────────────────
// HTML de mail de verdad: tablas, estilos en línea, 600 px, sin JS. Las fuentes
// de la maqueta (Playfair, Source Serif, Archivo) van primero en cada pila pero
// no se cargan: cada cliente cae a Georgia o a Arial, que tiene todo el mundo.
// El marco es oscuro como en la maqueta y la tarjeta clara: cada texto tiene su
// fondo declarado (también con `bgcolor`), así se lee igual si el cliente pinta
// todo de claro o de oscuro. El botón es una tabla con fondo (Outlook incluido).

const COLOR = {
  // Tinta y papel (web/src/app/_direccion/tokens.css), en hex sólido: los
  // clientes de correo no siempre entienden rgba ni variables. La tinta es la
  // que se VE en la web con el grano encima (#0d0d0c), el papel el crema.
  marco: "#0d0d0c",
  cabecera: "#0d0d0c",
  sobreCabecera: "#eeeae1",
  tarjeta: "#f4f0e7",
  etiqueta: "#7a6440",     // el dorado de la marca, un punto más oscuro: 5,1:1 sobre el papel
  titulo: "#151412",
  texto: "#45413a",
  fila: "#1f1d19",
  linea: "#ddd6c8",
  boton: "#0d0d0c",
  sobreBoton: "#f4f0e7",
  pie: "#6b665c",
} as const;

const SERIF_TITULO = "'Playfair Display', Georgia, 'Times New Roman', serif";
const SERIF = "'Source Serif 4', Georgia, 'Times New Roman', serif";
const SANS = "Archivo, 'Helvetica Neue', Helvetica, Arial, sans-serif";

/** El logo (las elipses de la marca) en PNG: el SVG no se ve en Gmail ni en Outlook. */
export const RUTA_LOGO_MAIL = "/mail/vitacora-logo.png";

export type MailArmado = { asunto: string; html: string; texto: string };

/** La base de los links de los mails (también la del panel en la ficha de Kids, lib/kids-compra.ts). */
export const urlBaseMail = () => process.env.URL_BASE ?? "https://www.vitacorafamiliar.com";

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
function cascaron(o: {
  idioma: IdiomaWeb;
  vistaPrevia: string;
  titulo: string;
  cuerpo: string;
  /** La etiqueta de arriba y el «por qué recibes esto»: por defecto, los del pedido. */
  etiqueta?: string;
  porQue?: string;
}): string {
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
          <tr><td class="vt-px" style="padding:40px 36px 0;font-family:${SANS};font-size:11px;letter-spacing:.22em;color:${COLOR.etiqueta};">${escapar(o.etiqueta ?? t.etiqueta)}</td></tr>
          <tr><td class="vt-px vt-titulo" style="padding:14px 36px 0;font-family:${SERIF_TITULO};font-weight:500;font-size:32px;line-height:1.15;color:${COLOR.titulo};">${escapar(o.titulo)}</td></tr>
          ${o.cuerpo}
          <tr><td class="vt-px" style="padding:26px 36px 34px;font-family:${SERIF};font-size:15px;line-height:1.55;color:${COLOR.texto};">${escapar(t.dudas)}</td></tr>
          <tr><td class="vt-px" style="border-top:1px solid ${COLOR.linea};padding:20px 36px 26px;font-family:${SANS};font-size:11px;line-height:1.6;color:${COLOR.pie};">${escapar(t.pie)}<br />${escapar(o.porQue ?? t.porQue)}</td></tr>
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
export function armarMailAcceso(opciones: { comoLeDicen: string; region?: string | null; idioma?: IdiomaWeb; kids?: { canal: CanalMailKids } }): MailArmado {
  if (opciones.kids) return armarMailAccesoKids(opciones.comoLeDicen, opciones.kids.canal);
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

/**
 * Vitácora Kids (15/10): el mismo mail en vos (Kids es solo es-AR), con el
 * asunto, la primera línea y «Mientras cuenta» de Kids. Sin «Arranca cuando
 * quiera»: en el canal A le escribimos a la hora elegida y en el B la primera
 * pregunta sale cuando estén juntos.
 */
function armarMailAccesoKids(apodo: string, canal: CanalMailKids): MailArmado {
  const idioma: IdiomaWeb = "ar";
  const { comun, acceso } = textosMail(idioma);
  const K = TEXTOS_MAIL_KIDS;
  const primera = K.primeraLinea[canal](apodo);
  const entrar = `${urlBaseMail()}/entrar`;

  const html = cascaron({
    idioma,
    vistaPrevia: primera,
    titulo: acceso.titulo,
    cuerpo: `
          ${parrafo(escapar(primera))}
          ${parrafo(escapar(acceso.paraEscuchar))}
          <tr><td class="vt-px" style="padding:18px 36px 0;">${boton(entrar, comun.botonTablero)}</td></tr>
          <tr><td class="vt-px" style="padding:10px 36px 0;font-family:${SERIF};font-size:14px;line-height:1.5;color:${COLOR.pie};">${escapar(comun.codigo)}</td></tr>
          ${lineaDeTiempo(comun.quePasaAhora, [
            { cuando: comun.mientrasCuenta, que: K.enTuPanel },
            { cuando: comun.alTerminar, que: comun.alTerminarTexto },
          ])}`,
  });

  const texto = textoPlano([
    comun.etiqueta,
    acceso.titulo,
    primera,
    acceso.paraEscuchar,
    `${comun.botonTablero}
${entrar}
${comun.codigo}`,
    `${comun.quePasaAhora}
${comun.mientrasCuenta}. ${K.enTuPanel}
${comun.alTerminar}. ${comun.alTerminarTexto}`,
    comun.dudas,
    `${comun.pie}
${comun.porQue}`,
  ]);

  return { asunto: K.asunto(apodo), html, texto };
}

export async function enviarMailAcceso(opciones: { para: string; comoLeDicen: string; region?: string | null; idioma?: IdiomaWeb; kids?: { canal: CanalMailKids } }): Promise<boolean> {
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
 * vincula la invitación con su usuario. Fase 3 del rediseño: el mismo diseño
 * que el de acceso y el del regalo; los asuntos y el link no cambian.
 */
export function armarMailInvitacion(opciones: {
  nombreNarrador: string;
  quienInvita: string;
  region?: string | null;
  /** Terminó de contar: la invitación es para contestar las dudas del escritor (13/10). */
  paraDudas?: boolean;
  idioma?: IdiomaWeb;
}): MailArmado {
  const idioma = opciones.idioma ?? idiomaMailDeRegion(opciones.region);
  const { comun, invitacion: t } = textosMail(idioma);
  const narrador = opciones.nombreNarrador;
  const quien = opciones.quienInvita;
  const dudas = opciones.paraDudas === true;
  const entrar = `${urlBaseMail()}/entrar`;
  const asunto = dudas ? t.asuntoDudas(quien, narrador) : t.asunto(quien, narrador);
  // Con dudas, el título es el aprobado del 13/10; si no, el asunto, como el del regalo.
  const titulo = dudas ? t.tituloDudas(narrador) : asunto;
  const parrafos = dudas ? [t.cuerpoDudas(quien)] : [t.contando(narrador), t.cuerpo(quien)];
  const textoBoton = dudas ? t.botonDudas : t.boton(narrador);

  const html = cascaron({
    idioma,
    vistaPrevia: parrafos[0],
    titulo,
    etiqueta: t.etiqueta,
    porQue: t.porQue,
    cuerpo: `
          ${parrafos.map((p) => parrafo(escapar(p))).join("\n")}
          ${parrafo(escapar(t.entra))}
          <tr><td class="vt-px" style="padding:18px 36px 0;">${boton(entrar, textoBoton)}</td></tr>
          <tr><td class="vt-px" style="padding:10px 36px 0;font-family:${SERIF};font-size:14px;line-height:1.5;color:${COLOR.pie};">${escapar(comun.codigo)}</td></tr>`,
  });

  const texto = textoPlano([
    t.etiqueta,
    titulo,
    ...parrafos,
    `${t.entra}\n${textoBoton}\n${entrar}\n${comun.codigo}`,
    comun.dudas,
    `${comun.pie}\n${t.porQue}`,
  ]);

  return { asunto, html, texto };
}

export async function enviarMailInvitacion(opciones: {
  para: string;
  nombreNarrador: string;
  quienInvita: string;
  region?: string | null;
  /** Terminó de contar: la invitación es para contestar las dudas del escritor (13/10). */
  paraDudas?: boolean;
  idioma?: IdiomaWeb;
}): Promise<boolean> {
  const mail = armarMailInvitacion(opciones);
  return enviar({ para: opciones.para, asunto: mail.asunto, html: mail.html, texto: mail.texto });
}
