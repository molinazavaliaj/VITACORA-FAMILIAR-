"use client";

import { useState, type ReactNode } from "react";
import { Hoja } from "../../_ui/hoja";

// «Pausar o cerrar el libro» y «Cancelar el pedido» (rediseño 2026-10, fase 2).
// Ninguno cambia nada en la base (DECISIONES D4, PASO-DE-MANOS C9 y C10): la
// pausa la pone el entrevistador y la devolución la hace una persona. Cada
// fila abre una hoja (MOTION 8: desde abajo en el celular, centrada en
// escritorio) que lleva a escribirle a Vitácora por WhatsApp (si está
// NEXT_PUBLIC_WHATSAPP_DUDAS) o por correo. «Cerrar con lo que hay» sí existe
// (cierre anticipado, mínimo 10 respuestas): llega como `children`.

export type Contacto = { whatsapp: string | null; correo: string };

export function FilaConHoja({
  etiqueta,
  titulo,
  texto,
  contacto,
  asunto,
  textos,
  children,
}: {
  etiqueta: string;
  titulo: string;
  texto: string;
  contacto: Contacto;
  /** El asunto del correo (sin datos de la persona: va en la URL). */
  asunto: string;
  textos: { whatsapp: string; correo: string; cerrar: string };
  /** Algo más adentro de la hoja (el cierre anticipado). */
  children?: ReactNode;
}) {
  const [abierta, setAbierta] = useState(false);
  return (
    <>
      <button type="button" className="pnl-fila" onClick={() => setAbierta(true)} aria-haspopup="dialog">
        <span>{etiqueta}</span>
        <span aria-hidden>›</span>
      </button>
      <Hoja abierta={abierta} alCerrar={() => setAbierta(false)} titulo={titulo} etiquetaCerrar={textos.cerrar}>
        <p className="pnl-parrafo">{texto}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {contacto.whatsapp ? (
            <a href={contacto.whatsapp} target="_blank" rel="noreferrer" className="pnl-boton pnl-boton--lleno">
              {textos.whatsapp}
            </a>
          ) : null}
          <a href={`mailto:${contacto.correo}?subject=${encodeURIComponent(asunto)}`} className={`pnl-boton ${contacto.whatsapp ? "pnl-boton--hilo" : "pnl-boton--lleno"}`}>
            {textos.correo}
          </a>
        </div>
        {children ? <div className="mt-8 border-t border-[var(--linea)] pt-6">{children}</div> : null}
      </Hoja>
    </>
  );
}
