import { COLOR, SANS, SERIF, boton, cascaron, enviar, escapar, parrafo, textoPlano, urlBaseMail, type MailArmado } from "./mail";
import { ruta, type IdiomaWeb } from "./idioma-web";
import { fechaLegible } from "./mail-cupon";
import type { FilaCreador } from "./creadores";
import { TEXTOS_COLABORA } from "@/app/_textos/colabora";

// Los dos mails al creador (programa de creadores, 21/10), con el diseño de los
// demás (lib/mail.ts): «lo recibimos» al anotarse en /colabora y la bienvenida
// al aprobarlo, con su código, su link para compartir y su panel. Textos en
// app/_textos/colabora.ts (borradores a aprobar por Naza).

type CreadorParaMail = Pick<FilaCreador, "id" | "nombre" | "email" | "idioma" | "created_at">;

/** El link para compartir: el checkout de su web con el código puesto (`?cupon=`). */
export const urlCompartirCreador = (idioma: IdiomaWeb, codigo: string) => `${urlBaseMail()}${ruta(idioma, "/comprar")}?cupon=${encodeURIComponent(codigo)}`;
/** El link privado de su panel. */
export const urlPanelCreador = (token: string) => `${urlBaseMail()}/creador/${encodeURIComponent(token)}`;
const urlCondiciones = (idioma: IdiomaWeb) => `${urlBaseMail()}${ruta(idioma, "/legal/creadores")}`;
const urlPrivacidad = (idioma: IdiomaWeb) => `${urlBaseMail()}${ruta(idioma, "/legal/privacidad")}`;

const enlacePie = (href: string, texto: string) => `<a href="${escapar(href)}" style="color:${COLOR.pie};text-decoration:underline;">${escapar(texto)}</a>`;

function pie(idioma: IdiomaWeb): { html: string; texto: string } {
  const M = TEXTOS_COLABORA[idioma].mail;
  return {
    html: [enlacePie(urlCondiciones(idioma), M.condiciones), enlacePie(urlPrivacidad(idioma), M.privacidad)].join(" · "),
    texto: [`${M.condiciones}\n${urlCondiciones(idioma)}`, `${M.privacidad}\n${urlPrivacidad(idioma)}`].join("\n"),
  };
}

/** «Lo recibimos»: al anotarse. Sin código ni promesas. */
export function armarMailCreadorRecibido(c: CreadorParaMail): MailArmado {
  const M = TEXTOS_COLABORA[c.idioma].mail;
  const R = M.recibido;
  const porQue = M.porQue(fechaLegible(c.created_at, c.idioma));
  const p = pie(c.idioma);
  const html = cascaron({
    idioma: c.idioma,
    vistaPrevia: R.vistaPrevia,
    titulo: R.titulo,
    etiqueta: M.etiqueta,
    porQue,
    pieHtml: p.html,
    cuerpo: `
          ${parrafo(escapar(R.texto))}
          ${parrafo(escapar(R.siNoFuiste))}`,
  });
  return { asunto: R.asunto, html, texto: textoPlano([M.etiqueta, R.titulo, R.texto, R.siNoFuiste, `${porQue}\n${p.texto}`]) };
}

/** La bienvenida: su código grande, el descuento y la comisión que le tocan, el link y su panel. */
export function armarMailBienvenidaCreador(c: CreadorParaMail & { codigo: string; comision: number; descuento: number; token_panel: string }): MailArmado {
  const M = TEXTOS_COLABORA[c.idioma].mail;
  const B = M.bienvenida;
  const compartir = urlCompartirCreador(c.idioma, c.codigo);
  const panel = urlPanelCreador(c.token_panel);
  const descuento = c.descuento > 0 ? B.descuento(c.descuento) : B.sinDescuento;
  const porQue = M.porQue(fechaLegible(c.created_at, c.idioma));
  const p = pie(c.idioma);
  const html = cascaron({
    idioma: c.idioma,
    vistaPrevia: B.vistaPrevia,
    titulo: B.titulo,
    etiqueta: M.etiqueta,
    porQue,
    pieHtml: p.html,
    cuerpo: `
          ${parrafo(escapar(B.texto))}
          <tr><td class="vt-px" style="padding:22px 36px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${COLOR.linea};border-radius:6px;">
              <tr><td style="padding:18px 20px 4px;font-family:${SANS};font-size:11px;letter-spacing:.22em;color:${COLOR.etiqueta};">${escapar(B.tuCodigo)}</td></tr>
              <tr><td style="padding:0 20px 6px;font-family:${SANS};font-size:26px;font-weight:600;letter-spacing:.06em;color:${COLOR.titulo};">${escapar(c.codigo)}</td></tr>
              <tr><td style="padding:0 20px 18px;font-family:${SERIF};font-size:15px;line-height:1.5;color:${COLOR.texto};">${escapar(descuento)}</td></tr>
            </table>
          </td></tr>
          ${parrafo(escapar(B.comision(c.comision)))}
          ${parrafo(`${escapar(B.compartir)}<br /><a href="${escapar(compartir)}" style="color:${COLOR.titulo};word-break:break-all;">${escapar(compartir)}</a>`)}
          ${parrafo(escapar(B.panel))}
          <tr><td class="vt-px" style="padding:18px 36px 0;">${boton(panel, B.boton)}</td></tr>`,
  });
  const texto = textoPlano([
    M.etiqueta,
    B.titulo,
    B.texto,
    `${B.tuCodigo}\n${c.codigo}\n${descuento}`,
    B.comision(c.comision),
    `${B.compartir}\n${compartir}`,
    `${B.panel}\n${B.boton}\n${panel}`,
    `${porQue}\n${p.texto}`,
  ]);
  return { asunto: B.asunto, html, texto };
}

export async function enviarMailCreadorRecibido(c: CreadorParaMail): Promise<boolean> {
  return enviar({ para: c.email, ...armarMailCreadorRecibido(c) });
}

/** Solo con un creador ya aprobado (código, comisión, descuento y token). */
export async function enviarMailBienvenidaCreador(c: FilaCreador): Promise<boolean> {
  if (!c.codigo || c.comision === null || c.descuento === null || !c.token_panel) throw new Error(`creadores: ${c.id} no está aprobado del todo`);
  return enviar({ para: c.email, ...armarMailBienvenidaCreador({ ...c, codigo: c.codigo, comision: c.comision, descuento: c.descuento, token_panel: c.token_panel }) });
}
