"use client";

import { HORAS_ENTREGA, instanteDeEntrega, zonaDeIdioma, type CanalEntrega } from "@/lib/regalo-reglas";
import type { IdiomaRegalo, TextosComprador, TextosEntrega } from "@/lib/regalo-textos";

// El regalo llega solo el día elegido (spec 2026-10-10-regalo-dia-de-entrega):
// el bloque del paso 2 de /regalar y la línea del paso 4. Aparte del
// formulario para probarlo sin navegador. La regla fuerte la tiene el servidor
// (validarRegalo); acá se avisa antes de seguir.

/** `canal` null = «No, se la doy yo». */
export type EleccionEntrega = { canal: CanalEntrega | null; contacto: string; hora: number | null };
export const SIN_ENTREGA: EleccionEntrega = { canal: null, contacto: "", hora: null };

const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Tema oscuro del rediseño (2026-10): los mismos campos que el checkout.
const campo = "h-[52px] w-full rounded-[14px] border border-[var(--borde-oscuro-fuerte)] bg-[var(--fondo-oscuro)] px-4 text-[16px] text-[var(--texto-oscuro-fuerte)] outline-none transition-colors focus:border-[var(--acento-oscuro)] aria-invalid:border-[#f0a37a] [font-family:var(--fuente-micro)]";
const etiqueta = "block text-[13px] text-[var(--texto-oscuro-suave)] [font-family:var(--fuente-micro)]";
const pista = "mt-2 text-[13px] text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]";

/** El problema de la elección, con el campo a marcar; null si está bien o si no eligió canal. */
export function errorDeEleccion(
  e: EleccionEntrega, fecha: string, idioma: IdiomaRegalo, ahora: Date, T: TextosEntrega,
): { texto: string; campo: string } | null {
  if (!e.canal || !fecha) return null;
  if (e.hora === null) return { texto: T.faltaHora, campo: "entrega-hora" };
  const contacto = e.contacto.trim();
  if (e.canal === "mail" && !CORREO_RE.test(contacto)) return { texto: T.correoMal, campo: "entrega-contacto" };
  if (e.canal === "whatsapp" && contacto.replace(/\D/g, "").length < 8) return { texto: T.celularMal, campo: "entrega-contacto" };
  if (instanteDeEntrega(fecha, e.hora, zonaDeIdioma(idioma)).getTime() <= ahora.getTime()) {
    return { texto: T.horaPasada, campo: "entrega-hora" };
  }
  return null;
}

/** «Le llega a … el dd/mm a las h.» para el paso de pagar; null si no hay entrega. */
export function lineaLeLlega(e: EleccionEntrega, fecha: string, T: TextosEntrega): string | null {
  if (!e.canal || e.hora === null || !fecha) return null;
  const [, mes, dia] = fecha.split("-");
  return T.leLlega(e.contacto.trim(), `${dia}/${mes}`, e.hora);
}

export function CamposEntrega({
  fecha, idioma, eleccion, onCambio, whatsapp, textos, marca,
}: {
  fecha: string;
  idioma: IdiomaRegalo;
  eleccion: EleccionEntrega;
  onCambio: (e: EleccionEntrega) => void;
  /** REGALO_ENTREGA_WHATSAPP: hasta que Meta apruebe las plantillas, no se ofrece. */
  whatsapp: boolean;
  textos: TextosComprador;
  marca: (campo: string) => Record<string, unknown>;
}) {
  if (!fecha) return null;
  const T = textos.entrega;
  const opciones: { valor: "nadie" | CanalEntrega; texto: string }[] = [
    { valor: "nadie", texto: T.canales.nadie },
    ...(whatsapp ? [{ valor: "whatsapp" as const, texto: T.canales.whatsapp }] : []),
    { valor: "mail", texto: T.canales.mail },
  ];
  const elegido = eleccion.canal ?? "nadie";
  return (
    <>
      <fieldset className="mt-8">
        <legend className={etiqueta}>{T.mandarloEseDia}</legend>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {opciones.map((o) => (
            <label key={o.valor} className="m-card m-chip inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-[var(--borde-oscuro-fuerte)] px-5 text-[15px] text-[var(--texto-oscuro)] [font-family:var(--fuente-micro)] [touch-action:manipulation]">
              <input
                type="radio" name="entrega" value={o.valor} checked={elegido === o.valor} className="sr-only"
                onChange={() => onCambio(o.valor === "nadie" ? SIN_ENTREGA : { ...eleccion, canal: o.valor, contacto: o.valor === eleccion.canal ? eleccion.contacto : "" })}
              />
              {o.texto}
            </label>
          ))}
        </div>
      </fieldset>
      {eleccion.canal && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <label className={etiqueta} htmlFor="entrega-hora">{T.aQueHora}</label>
            <select
              id="entrega-hora" {...marca("entrega-hora")} className={`${campo} mt-2`}
              value={eleccion.hora ?? ""} onChange={(ev) => onCambio({ ...eleccion, hora: ev.target.value ? Number(ev.target.value) : null })}
            >
              <option value="" />
              {HORAS_ENTREGA.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
            <p className={pista}>{T.horaDe(idioma === "es-AR" ? "AR" : "ES")}</p>
          </div>
          <div>
            <label className={etiqueta} htmlFor="entrega-contacto">{eleccion.canal === "mail" ? T.suCorreo : T.suCelular}</label>
            <input
              id="entrega-contacto" {...marca("entrega-contacto")} className={`${campo} mt-2`} value={eleccion.contacto}
              onChange={(ev) => onCambio({ ...eleccion, contacto: ev.target.value })}
              {...(eleccion.canal === "mail"
                ? { type: "email", inputMode: "email" as const, autoComplete: "off" }
                : { type: "tel", inputMode: "tel" as const, autoComplete: "off" })}
            />
            {eleccion.canal === "whatsapp" && <p className={pista}>{T.suCelularPista}</p>}
          </div>
        </div>
      )}
    </>
  );
}
