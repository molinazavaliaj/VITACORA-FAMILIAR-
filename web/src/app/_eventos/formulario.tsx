"use client";

import { useState, type FormEvent } from "react";
import { AREA, CAMPO, ERROR, ETIQUETA } from "../_checkout/piezas";
import { CAMPO_TRAMPA, TIPOS_EVENTO } from "@/lib/eventos";
import { TEXTOS_EVENTOS } from "../_textos/eventos";
import type { IdiomaWeb } from "@/lib/idioma-web";

// El formulario de /eventos. Manda a /api/eventos y, si sale, cambia por el
// «Gracias». Sin JS el formulario no se manda (no hay acción): queda el correo
// y el WhatsApp de al lado.

type Estado = { tipo: "listo" } | { tipo: "enviando" } | { tipo: "enviado" } | { tipo: "error"; mensaje: string };

export function FormularioEventos({ idioma, correo }: { idioma: IdiomaWeb; correo: string }) {
  // Los textos se leen acá y no llegan por props: `errores.envio` es una función.
  const t = TEXTOS_EVENTOS[idioma];
  const [estado, setEstado] = useState<Estado>({ tipo: "listo" });
  const f = t.formulario;

  async function enviar(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const datos = Object.fromEntries(new FormData(ev.currentTarget).entries());
    setEstado({ tipo: "enviando" });
    try {
      const r = await fetch("/api/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...datos, idioma }),
      });
      if (r.ok) {
        setEstado({ tipo: "enviado" });
        return;
      }
      const { error } = (await r.json().catch(() => ({}))) as { error?: string };
      const mensaje = error === "faltan" ? t.errores.faltan : error === "email" ? t.errores.email : t.errores.envio(correo);
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
        <label htmlFor="evt-nombre" className={ETIQUETA}>{f.nombre}</label>
        <input id="evt-nombre" name="nombre" required maxLength={200} autoComplete="name" className={`${CAMPO} mt-2`} />
      </div>
      <div className="evt-campo">
        <label htmlFor="evt-email" className={ETIQUETA}>{f.email}</label>
        <input id="evt-email" name="email" type="email" required maxLength={200} autoComplete="email" className={`${CAMPO} mt-2`} />
      </div>
      <div className="evt-campo">
        <label htmlFor="evt-telefono" className={ETIQUETA}>{f.telefono}</label>
        <input id="evt-telefono" name="telefono" type="tel" inputMode="tel" maxLength={200} autoComplete="tel" className={`${CAMPO} mt-2`} />
      </div>
      <div className="evt-campo">
        <label htmlFor="evt-tipo" className={ETIQUETA}>{f.tipo}</label>
        <select id="evt-tipo" name="tipo" required defaultValue="" className={`${CAMPO} mt-2`}>
          <option value="" disabled>{f.elegir}</option>
          {TIPOS_EVENTO.map((tipo) => (
            <option key={tipo} value={tipo}>{t.tipo[tipo]}</option>
          ))}
        </select>
      </div>
      <div className="evt-campo">
        <label htmlFor="evt-fecha" className={ETIQUETA}>{f.fecha}</label>
        <input id="evt-fecha" name="fecha" maxLength={200} placeholder={f.fechaPista} className={`${CAMPO} mt-2`} />
      </div>
      <div className="evt-campo">
        <label htmlFor="evt-lugar" className={ETIQUETA}>{f.lugar}</label>
        <input id="evt-lugar" name="lugar" maxLength={200} autoComplete="address-level2" className={`${CAMPO} mt-2`} />
      </div>
      <div className="evt-campo">
        <label htmlFor="evt-invitados" className={ETIQUETA}>{f.invitados}</label>
        <input id="evt-invitados" name="invitados" inputMode="numeric" maxLength={200} placeholder={f.invitadosPista} className={`${CAMPO} mt-2`} />
      </div>
      <div className="evt-campo evt-campo--ancho">
        <label htmlFor="evt-mensaje" className={ETIQUETA}>{f.mensaje}</label>
        <textarea id="evt-mensaje" name="mensaje" rows={4} maxLength={3000} placeholder={f.mensajePista} className={`${AREA} mt-2`} />
      </div>

      {/* La trampa para robots: fuera de la pantalla y de los lectores. */}
      <div aria-hidden className="evt-trampa">
        <label htmlFor="evt-sitio">Sitio</label>
        <input id="evt-sitio" name={CAMPO_TRAMPA} tabIndex={-1} autoComplete="off" />
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
