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

const campo = "w-full rounded-md border border-[#D4D4CE] bg-white px-4 py-3 text-[16px] text-[#14140F] outline-none transition-colors placeholder:text-[#AEAEA6] focus:border-[#14140F] [font-family:var(--fuente-cuerpo)]";
const etiqueta = "block text-[11px] uppercase text-[#5F5F55] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]";
const pista = "mt-1 text-[13px] text-[#83837A] [font-family:var(--fuente-cuerpo)] font-light";

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
            <label key={o.valor} className={`flex cursor-pointer items-center gap-3 rounded-lg border bg-white px-4 py-3 text-[16px] [font-family:var(--fuente-cuerpo)] ${elegido === o.valor ? "border-2 border-[#14140F]" : "border-[#D4D4CE]"}`}>
              <input
                type="radio" name="entrega" value={o.valor} checked={elegido === o.valor}
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
