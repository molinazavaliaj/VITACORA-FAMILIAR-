import type { ReactNode } from "react";

// La grilla de una historia (rediseño 2026-10, fase 2): arriba la cabecera
// (tapa, saludo, línea de tiempo); abajo, lo contado a la izquierda y las
// hojas del lateral a la derecha. En el celular va todo en una columna, en el
// orden de la maqueta PanelMovil: primero lo que se mira (lo último, sus
// fotos), después lo contado, y al final la familia y el pedido.

export function MarcoHistoria({
  cabecera,
  arriba,
  cuerpo,
  abajo,
  producto,
}: {
  cabecera: ReactNode;
  /** El lateral de arriba: lo último que contó, sus fotos, su WhatsApp. */
  arriba: ReactNode;
  /** Lo contado: el guion, los bloques V3 o lo contado en el viaje. */
  cuerpo: ReactNode;
  /** El lateral de abajo: la familia, tu pedido, las dudas. */
  abajo: ReactNode;
  /** Una historia de Viaje: la página toma la paleta de Viaje (panel.css, «con su color»). */
  producto?: "viaje";
}) {
  return (
    <div data-producto={producto} className="pnl-marco mx-auto w-full max-w-[1240px] px-4 pb-20 pt-8 sm:px-8 md:pt-12">
      {cabecera}
      <div className="mt-10 grid grid-cols-1 gap-x-14 gap-y-8 md:mt-14 lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-[auto_1fr]">
        <div className="pnl-entra flex min-w-0 flex-col gap-6 lg:col-start-2 lg:row-start-1">{arriba}</div>
        <div id="lo-contado" className="pnl-cuerpo min-w-0 scroll-mt-24 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          {cuerpo}
        </div>
        <div className="pnl-entra flex min-w-0 flex-col gap-6 lg:col-start-2 lg:row-start-2">{abajo}</div>
      </div>
    </div>
  );
}
