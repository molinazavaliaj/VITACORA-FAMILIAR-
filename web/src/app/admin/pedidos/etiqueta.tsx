"use client";

import { useState } from "react";
import type { Etiqueta } from "@/lib/pedidos-admin";

// La etiqueta del paquete: se imprime sola (panel.css esconde el resto de la pantalla) o se
// copia para pegarla en la web del correo. Cliente solo por el portapapeles y la impresora.

function textoParaCopiar(e: Etiqueta): string {
  return [
    `Referencia: ${e.referencia}`,
    ...e.para,
    ...(e.telefono ? [`Tel.: ${e.telefono}`] : []),
    ...(e.nota ? [`Nota: ${e.nota}`] : []),
    ...(e.peso ? [`Peso: ${e.peso}`] : []),
    ...(e.medidas ? [`Medidas: ${e.medidas}`] : []),
  ].join("\n");
}

function BotonCopiar({ texto, nombre }: { texto: string; nombre: string }) {
  const [estado, setEstado] = useState<"quieto" | "copiado" | "fallo">("quieto");
  return (
    <button
      type="button"
      className="adm-boton adm-boton--hilo"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setEstado("copiado");
        } catch {
          setEstado("fallo");
        }
      }}
    >
      {estado === "copiado" ? "copiado" : estado === "fallo" ? "no se pudo copiar" : nombre}
    </button>
  );
}

export function EtiquetaDelPaquete({ etiqueta: e, faltaRemitente }: { etiqueta: Etiqueta; faltaRemitente: string | null }) {
  return (
    <>
      <div className="adm-etiqueta">
        <p className="adm-etiqueta-ref">{e.referencia}</p>
        <div className="adm-etiqueta-bloque">
          <p className="adm-etiqueta-rotulo">Para</p>
          {e.para.length > 0 ? (
            e.para.map((l, i) => <p key={`${l}-${i}`} className={i === 0 ? "font-semibold" : undefined}>{l}</p>)
          ) : (
            <p>Falta la dirección</p>
          )}
          {e.telefono ? <p>Tel. {e.telefono}</p> : null}
          {e.nota ? <p className="mt-1 italic">{e.nota}</p> : null}
        </div>
        <div className="adm-etiqueta-bloque adm-etiqueta-de">
          <p className="adm-etiqueta-rotulo">Remite</p>
          {e.de.length > 0 ? e.de.map((l, i) => <p key={`${l}-${i}`}>{l}</p>) : <p className="adm-etiqueta-vacio">&nbsp;</p>}
        </div>
        <p className="adm-etiqueta-pie">
          {[e.contenido, e.peso, e.medidas].filter(Boolean).join(" · ")}
        </p>
      </div>
      {faltaRemitente ? <p className="adm-sin-imprimir mt-3 text-sm text-[var(--texto-menor)]">{faltaRemitente}</p> : null}
      <div className="adm-sin-imprimir mt-4 flex flex-wrap gap-2">
        <button type="button" className="adm-boton" onClick={() => window.print()}>
          imprimir la etiqueta
        </button>
        <BotonCopiar texto={textoParaCopiar(e)} nombre="copiar todo" />
        <BotonCopiar texto={e.para.join("\n")} nombre="copiar la dirección" />
      </div>
    </>
  );
}
