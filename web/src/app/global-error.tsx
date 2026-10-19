"use client";

import { useEffect } from "react";
import { TEXTOS_AVISOS } from "./_textos/avisos";

// Lo peor que puede pasar: se rompió el propio layout (las fuentes, la
// cabecera, el CSS). Next reemplaza toda la página por este archivo, así que
// trae su propio <html>, su <body> y sus estilos EN LÍNEA: acá no hay
// globals.css, ni tokens, ni las letras de marca.
//
// Los textos son los mismos de app/error.tsx (TEXTOS_AVISOS.es.falla, marcados
// aprobados por Naza el 19/10), en castellano neutro. El mensaje técnico del error no se
// pinta: el que lo lea en un log es el equipo, no la familia.

const TINTA = "#070706";
const PAPEL = "#f4f0e7";
const SOBRE_PAPEL = "#151412";
const SOBRE_PAPEL_SUAVE = "#5a564e";
const DORADO = "#7a6440";

export default function GlobalError({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset?: () => void;
}) {
  useEffect(() => {
    // Solo el digest: el mensaje puede traer la ruta pedida y, con ella, el
    // token firmado de una familia.
    console.error("[error 500 global]", error.digest ?? "sin digest");
  }, [error]);

  const t = TEXTOS_AVISOS.es;
  const alReintentar = retry ?? reset;

  return (
    <html lang="es-ES">
      <body style={{ margin: 0, background: PAPEL, color: SOBRE_PAPEL }}>
        <title>Error 500 · Vitácora Familiar</title>
        <div
          style={{
            background: TINTA,
            color: "#eeeae1",
            padding: "20px 24px",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.22em",
          }}
        >
          VITÁCORA
        </div>
        <main style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(48px, 10vh, 96px) 24px 64px" }}>
          <p style={{ margin: 0, fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: 12, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: DORADO }}>
            {t.falla.etiqueta}
          </p>
          <h1 style={{ margin: "18px 0 0", fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 500, fontSize: "clamp(2.25rem, 1.5rem + 4vw, 3.5rem)", lineHeight: 1.06, letterSpacing: "-0.02em" }}>
            {t.falla.titulo}
          </h1>
          {t.falla.frase ? (
            <p style={{ margin: "18px 0 0", fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", fontSize: "clamp(1.2rem, 1rem + 0.8vw, 1.5rem)", lineHeight: 1.3, color: SOBRE_PAPEL_SUAVE }}>
              {t.falla.frase}
            </p>
          ) : null}
          {t.falla.bajada ? (
            <p style={{ margin: "20px 0 0", fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: "1.05rem", fontWeight: 300, lineHeight: 1.6, color: "#45413a", maxWidth: "52ch" }}>
              {t.falla.bajada}
            </p>
          ) : null}
          <div style={{ marginTop: 36, display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px 24px" }}>
            <button
              type="button"
              onClick={() => alReintentar?.()}
              style={{
                minHeight: 56,
                padding: "0 30px",
                border: 0,
                borderRadius: 999,
                background: "#0d0d0c",
                color: PAPEL,
                fontFamily: "ui-sans-serif, system-ui, sans-serif",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t.reintentar}
            </button>
            <a
              href="/"
              style={{
                minHeight: 44,
                display: "inline-flex",
                alignItems: "center",
                fontFamily: "ui-sans-serif, system-ui, sans-serif",
                fontSize: 15,
                color: SOBRE_PAPEL,
                textDecorationColor: "rgba(21, 20, 18, 0.2)",
                textUnderlineOffset: 5,
              }}
            >
              {t.volverAlInicio}
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
