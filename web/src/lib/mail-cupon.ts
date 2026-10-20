import { COLOR, SANS, SERIF, boton, cascaron, enviar, escapar, parrafo, textoPlano, urlBaseMail, type MailArmado } from "./mail";
import { firmarToken } from "./token-firmado";
import { localeDeIdioma, ruta, type IdiomaWeb } from "./idioma-web";
import type { Region } from "./precios";
import { TEXTOS_CUPON } from "@/app/_textos/cupon";
import { CONTACTO, quienEs } from "@/app/legal/titulares";

// Los tres mails del cupón de bienvenida (rasca y gana, 20/10), con el diseño
// de los demás (lib/mail.ts): el de confirmar el correo (doble opt-in), el del
// código y los recordatorios (hasta 4, solo con la segunda casilla). Cada uno
// lleva en el pie quién escribe (con documento y domicilio, LSSI arts. 10 y
// 20), por qué le llega, las bases y la privacidad; los recordatorios, además,
// «PUBLICIDAD» arriba y en el asunto y la baja de un clic, también por
// cabecera (List-Unsubscribe y List-Unsubscribe-Post, RFC 8058).
//
// Textos: app/_textos/cupon.ts (borradores a aprobar por Naza).

const SIETE_DIAS = 7 * 24 * 60 * 60 * 1000;
const UN_ANIO = 366 * 24 * 60 * 60 * 1000;

/** Los datos de la fila que hacen falta para armar los mails. */
export type CuponParaMail = { id: string; codigo: string; region: Region; idioma: IdiomaWeb; created_at: string; vence_el: string | null; acepta_recordatorios: boolean };

/** Quién da el cupón: nombre, documento y domicilio del titular del país (lo que esté cargado). */
export const quienDaElCupon = quienEs;

/** Una fecha como se lee en cada idioma («19 de noviembre de 2026»). `fecha` es AAAA-MM-DD o ISO. */
export function fechaLegible(fecha: string, idioma: IdiomaWeb): string {
  const dia = fecha.length === 10 ? new Date(`${fecha}T12:00:00Z`) : new Date(fecha);
  return new Intl.DateTimeFormat(localeDeIdioma(idioma), { day: "numeric", month: "long", year: "numeric", timeZone: fecha.length === 10 ? "UTC" : idioma === "ar" ? "America/Argentina/Buenos_Aires" : "Europe/Madrid" }).format(dia);
}

export const urlConfirmarCupon = (id: string, ahora = Date.now()) =>
  `${urlBaseMail()}/cupon/confirmar?c=${encodeURIComponent(id)}&t=${firmarToken("cupon-confirmar", id, ahora, SIETE_DIAS)}`;
export const urlBajaCupon = (id: string, ahora = Date.now()) =>
  `${urlBaseMail()}/api/cupon/baja?c=${encodeURIComponent(id)}&t=${firmarToken("cupon-baja", id, ahora, UN_ANIO)}`;
export const urlUsarCupon = (idioma: IdiomaWeb, codigo: string) => `${urlBaseMail()}${ruta(idioma, "/comprar")}?cupon=${encodeURIComponent(codigo)}`;
const urlBases = (idioma: IdiomaWeb) => `${urlBaseMail()}${ruta(idioma, "/legal/cupon")}`;
const urlPrivacidad = (idioma: IdiomaWeb) => `${urlBaseMail()}${ruta(idioma, "/legal/privacidad")}`;

const enlacePie = (href: string, texto: string) => `<a href="${escapar(href)}" style="color:${COLOR.pie};text-decoration:underline;">${escapar(texto)}</a>`;

/** El final del pie: quién escribe, bases, privacidad y (si va) la baja. */
function pie(c: CuponParaMail, baja: string | null): { html: string; texto: string } {
  const M = TEXTOS_CUPON[c.idioma].mail;
  const remitente = M.remitente(quienDaElCupon(c.region));
  const enlaces = [enlacePie(urlBases(c.idioma), M.bases), enlacePie(urlPrivacidad(c.idioma), M.privacidad), ...(baja ? [enlacePie(baja, M.baja)] : [])];
  return {
    html: `${escapar(remitente)}<br />${enlaces.join(" · ")}`,
    texto: [remitente, `${M.bases}: ${urlBases(c.idioma)}`, `${M.privacidad}: ${urlPrivacidad(c.idioma)}`, ...(baja ? [`${M.baja}: ${baja}`] : [])].join("\n"),
  };
}

/** El código grande, en su recuadro. */
function bloqueCodigo(etiqueta: string, codigo: string, vale: string): string {
  return `<tr><td class="vt-px" style="padding:22px 36px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${COLOR.linea};border-radius:6px;">
      <tr><td style="padding:18px 20px 4px;font-family:${SANS};font-size:11px;letter-spacing:.22em;color:${COLOR.etiqueta};">${escapar(etiqueta)}</td></tr>
      <tr><td style="padding:0 20px 6px;font-family:${SANS};font-size:26px;font-weight:600;letter-spacing:.06em;color:${COLOR.titulo};">${escapar(codigo)}</td></tr>
      <tr><td style="padding:0 20px 18px;font-family:${SERIF};font-size:15px;line-height:1.5;color:${COLOR.texto};">${escapar(vale)}</td></tr>
    </table>
  </td></tr>`;
}

/** El de confirmar el correo: sin código, solo el botón. */
export function armarMailConfirmarCupon(c: CuponParaMail, ahora = Date.now()): MailArmado {
  const M = TEXTOS_CUPON[c.idioma].mail;
  const C = M.confirmar;
  const url = urlConfirmarCupon(c.id, ahora);
  const porQue = C.porQue(fechaLegible(c.created_at, c.idioma));
  const p = pie(c, null);
  const html = cascaron({
    idioma: c.idioma,
    vistaPrevia: C.vistaPrevia,
    titulo: C.titulo,
    etiqueta: M.etiqueta,
    porQue,
    pieHtml: p.html,
    cuerpo: `
          ${parrafo(escapar(C.texto))}
          <tr><td class="vt-px" style="padding:18px 36px 0;">${boton(url, C.boton)}</td></tr>
          ${parrafo(escapar(C.siNoFuiste))}`,
  });
  const texto = textoPlano([M.etiqueta, C.titulo, C.texto, `${C.boton}\n${url}`, C.siNoFuiste, `${porQue}\n${p.texto}`]);
  return { asunto: C.asunto, html, texto };
}

/** El del código: lo que pidió (art. 6.1.b RGPD), no publicidad. */
export function armarMailCupon(c: CuponParaMail & { vence_el: string }, ahora = Date.now()): MailArmado {
  const M = TEXTOS_CUPON[c.idioma].mail;
  const C = M.cupon;
  const vale = C.vale(fechaLegible(c.vence_el, c.idioma));
  const usar = urlUsarCupon(c.idioma, c.codigo);
  const baja = c.acepta_recordatorios ? urlBajaCupon(c.id, ahora) : null;
  const porQue = C.porQue(fechaLegible(c.created_at, c.idioma));
  const p = pie(c, baja);
  const html = cascaron({
    idioma: c.idioma,
    vistaPrevia: C.vistaPrevia,
    titulo: C.titulo,
    etiqueta: M.etiqueta,
    porQue,
    pieHtml: p.html,
    cuerpo: `
          ${bloqueCodigo(C.tuCodigo, c.codigo, vale)}
          ${parrafo(escapar(C.como))}
          <tr><td class="vt-px" style="padding:18px 36px 0;">${boton(usar, C.boton)}</td></tr>
          ${parrafo(escapar(C.personal))}
          ${c.acepta_recordatorios ? parrafo(escapar(C.conRecordatorios)) : ""}`,
  });
  const texto = textoPlano([
    M.etiqueta,
    C.titulo,
    `${C.tuCodigo}\n${c.codigo}\n${vale}`,
    C.como,
    `${C.boton}\n${usar}`,
    C.personal,
    ...(c.acepta_recordatorios ? [C.conRecordatorios] : []),
    `${porQue}\n${p.texto}`,
  ]);
  return { asunto: C.asunto, html, texto };
}

/** El recordatorio `n` (1 a 4): publicidad, con la baja a la vista y por cabecera. */
export function armarMailRecordatorio(c: CuponParaMail & { vence_el: string }, n: 1 | 2 | 3 | 4, ahora = Date.now()): MailArmado & { baja: string } {
  const M = TEXTOS_CUPON[c.idioma].mail;
  const R = M.recordatorio;
  const fecha = fechaLegible(c.vence_el, c.idioma);
  const usar = urlUsarCupon(c.idioma, c.codigo);
  const baja = urlBajaCupon(c.id, ahora);
  const porQue = R.porQue(fechaLegible(c.created_at, c.idioma));
  const p = pie(c, baja);
  const html = cascaron({
    idioma: c.idioma,
    vistaPrevia: R.texto(c.codigo, fecha),
    titulo: M.cupon.titulo,
    etiqueta: R.etiqueta,
    porQue,
    pieHtml: p.html,
    cuerpo: `
          ${bloqueCodigo(M.cupon.tuCodigo, c.codigo, M.cupon.vale(fecha))}
          ${parrafo(escapar(M.cupon.como))}
          <tr><td class="vt-px" style="padding:18px 36px 0;">${boton(usar, R.boton)}</td></tr>
          <tr><td class="vt-px" style="padding:14px 36px 0;font-family:${SERIF};font-size:14px;line-height:1.5;color:${COLOR.pie};">${escapar(R.cuenta(n))} ${enlacePie(baja, M.baja)}</td></tr>`,
  });
  const texto = textoPlano([
    R.etiqueta,
    M.cupon.titulo,
    `${M.cupon.tuCodigo}\n${c.codigo}\n${M.cupon.vale(fecha)}`,
    M.cupon.como,
    `${R.boton}\n${usar}`,
    `${R.cuenta(n)}\n${M.baja}: ${baja}`,
    `${porQue}\n${p.texto}`,
  ]);
  return { asunto: R.asuntos[n - 1], html, texto, baja };
}

// ── Envío ─────────────────────────────────────────────────────────────────

export async function enviarMailConfirmarCupon(para: string, c: CuponParaMail): Promise<boolean> {
  const m = armarMailConfirmarCupon(c);
  return enviar({ para, ...m });
}

export async function enviarMailCupon(para: string, c: CuponParaMail & { vence_el: string }): Promise<boolean> {
  const m = armarMailCupon(c);
  return enviar({ para, ...m });
}

/**
 * Los recordatorios pueden salir de otra dirección (MAIL_REMITENTE_RECORDATORIOS,
 * p. ej. «Vitácora Familiar <cupon@vitacorafamiliar.com>»), separados de los
 * avisos del pedido; sin la variable, la de siempre.
 */
export async function enviarMailRecordatorio(para: string, c: CuponParaMail & { vence_el: string }, n: 1 | 2 | 3 | 4): Promise<boolean> {
  const { baja, ...m } = armarMailRecordatorio(c, n);
  const remitente = process.env.MAIL_REMITENTE_RECORDATORIOS?.trim() || undefined;
  return enviar({
    para,
    ...m,
    ...(remitente ? { remitente } : {}),
    cabeceras: { "List-Unsubscribe": `<${baja}>, <mailto:${CONTACTO.soporte}?subject=Baja>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
  });
}
