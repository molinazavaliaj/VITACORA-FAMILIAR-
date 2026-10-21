"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { AREA, CAMPO, ERROR, ETIQUETA } from "../_checkout/piezas";
import { CAMPO_TRAMPA_COLABORA, MENSAJE_MAXIMO, REDES } from "@/lib/creadores";
import { TEXTOS_COLABORA } from "../_textos/colabora";
import type { IdiomaWeb } from "@/lib/idioma-web";

// El formulario de /colabora. Manda a /api/colabora y, si sale, cambia por el
// «Gracias». Como el de /eventos: sin JS no se manda (queda el correo de al lado).

type Estado = { tipo: "listo" } | { tipo: "enviando" } | { tipo: "enviado" } | { tipo: "error"; mensaje: string };

export function FormularioColabora({ idioma, correo, condiciones }: { idioma: IdiomaWeb; correo: string; condiciones: ReactNode }) {
  // Los textos se leen acá y no llegan por props: `errores.envio` es una función.
  const t = TEXTOS_COLABORA[idioma];
  const f = t.formulario;
  const [estado, setEstado] = useState<Estado>({ tipo: "listo" });

  async function enviar(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = new FormData(ev.currentTarget);
    const datos = Object.fromEntries(form.entries());
    setEstado({ tipo: "enviando" });
    try {
      const r = await fetch("/api/colabora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...datos, condiciones: form.get("condiciones") === "on", idioma }),
      });
      if (r.ok) {
        setEstado({ tipo: "enviado" });
        return;
      }
      const { error } = (await r.json().catch(() => ({}))) as { error?: string };
      const mensaje =
        error === "faltan" || error === "email" || error === "perfil" || error === "condiciones" ? t.errores[error] : t.errores.envio(correo);
      setEstado({ tipo: "error", mensaje });
    } catch {
      setEstado({ tipo: "error", mensaje: t.errores.envio(correo) });
    }
  }

  if (estado.tipo === "enviado") {
    return (
      <div role="status" className="evt-gracias">
        <h3 className="dir-titular dir-t4">{t.gracias.titulo}</h3>
        <p className="dir-parrafo mt-4">{t.gracias.texto}</p>
      </div>
    );
  }

  const enviando = estado.tipo === "enviando";
  return (
    <form onSubmit={enviar} className="evt-form">
      <div className="evt-campo">
        <label htmlFor="col-nombre" className={ETIQUETA}>{f.nombre}</label>
        <input id="col-nombre" name="nombre" required maxLength={200} autoComplete="name" className={`${CAMPO} mt-2`} />
      </div>
      <div className="evt-campo">
        <label htmlFor="col-email" className={ETIQUETA}>{f.email}</label>
        <input id="col-email" name="email" type="email" required maxLength={254} autoComplete="email" className={`${CAMPO} mt-2`} />
      </div>
      <div className="evt-campo">
        <label htmlFor="col-red" className={ETIQUETA}>{f.red}</label>
        <select id="col-red" name="red" required defaultValue="" className={`${CAMPO} mt-2`}>
          <option value="" disabled>{f.elegir}</option>
          {REDES.map((red) => (
            <option key={red} value={red}>{f.redes[red]}</option>
          ))}
        </select>
      </div>
      <div className="evt-campo">
        <label htmlFor="col-perfil" className={ETIQUETA}>{f.perfil}</label>
        <input id="col-perfil" name="perfil" required maxLength={300} placeholder={f.perfilPista} autoCapitalize="none" spellCheck={false} className={`${CAMPO} mt-2`} />
      </div>
      <div className="evt-campo evt-campo--ancho">
        <label htmlFor="col-seguidores" className={ETIQUETA}>{f.seguidores}</label>
        <input id="col-seguidores" name="seguidores" maxLength={200} placeholder={f.seguidoresPista} className={`${CAMPO} mt-2`} />
      </div>
      <div className="evt-campo evt-campo--ancho">
        <label htmlFor="col-mensaje" className={ETIQUETA}>{f.mensaje}</label>
        <textarea id="col-mensaje" name="mensaje" rows={4} maxLength={MENSAJE_MAXIMO} placeholder={f.mensajePista} className={`${AREA} mt-2`} />
      </div>

      <label className="evt-campo--ancho flex items-start gap-3 text-[15px] leading-relaxed">
        <input type="checkbox" name="condiciones" required className="mt-1 h-5 w-5 shrink-0" />
        <span>{condiciones}</span>
      </label>

      {/* La trampa para robots: fuera de la pantalla y de los lectores. */}
      <div aria-hidden className="evt-trampa">
        <label htmlFor="col-sitio">Sitio</label>
        <input id="col-sitio" name={CAMPO_TRAMPA_COLABORA} tabIndex={-1} autoComplete="off" />
      </div>

      <div className="evt-campo--ancho flex flex-col gap-4">
        {estado.tipo === "error" ? (
          <p role="alert" className={ERROR}>{estado.mensaje}</p>
        ) : null}
        <button type="submit" disabled={enviando} className="dir-boton dir-boton--tinta w-full sm:w-auto sm:self-start">
          {enviando ? f.enviando : f.enviar}
        </button>
      </div>
    </form>
  );
}
