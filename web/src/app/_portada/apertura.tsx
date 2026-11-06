"use client";

import { useState } from "react";
import { LogoTrazo } from "../_direccion/logo-trazo";

// La apertura de la portada (Naza, 06/11): el logo se dibuja a pantalla completa
// con el nombre abajo y da paso al inicio, sin quitarle lugar. Dura 2 s, una vez
// por visita, y se saltea tocando. Todo es CSS (acuarela.css): sin JS se va sola,
// y con «menos movimiento» no aparece. El script va antes de pintar para que
// quien ya la vio en esta visita no la vea asomar.
const UNA_VEZ = `try{var s=sessionStorage;if(s.getItem("vf-apertura"))document.documentElement.dataset.sinApertura="1";else s.setItem("vf-apertura","1")}catch(e){}`;

export function Apertura() {
  const [salteada, setSalteada] = useState(false);
  if (salteada) return null;
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: UNA_VEZ }} />
      <div aria-hidden className="acu-apertura" onClick={() => setSalteada(true)}>
        <LogoTrazo id="trazo-apertura" halo="#fbf3f1" className="acu-apertura-logo" />
        <span className="acu-apertura-nombre">Vitácora Familiar</span>
      </div>
    </>
  );
}
