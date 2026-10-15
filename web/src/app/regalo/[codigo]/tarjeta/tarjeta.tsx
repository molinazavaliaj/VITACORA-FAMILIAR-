import type { RegaloPublico } from "@/lib/regalo-datos";
import type { textosAbuelo } from "@/lib/regalo-textos";
import { largoEnTarjeta } from "@/lib/regalo";
import { Toroide } from "../../../marca";
import { BotonImprimir, EscalaHojas } from "./imprimir";

// La tarjeta del regalo para imprimir, sin base: la página (page.tsx) lee el
// regalo y le pasa los textos ya armados. Las medidas y el porqué de cada
// cosa, en page.tsx.

const ESTILOS = `
@page { size: A4 landscape; margin: 0; }
.tarjeta-pantalla, .tarjeta-pantalla * { box-sizing: border-box; }
body:has(.tarjeta-pantalla) { background: #E7E7E3; }
.tarjeta-pantalla { min-height: 100vh; flex: 1 0 auto; background: #E7E7E3; color: #14140F; font-family: var(--fuente-cuerpo), Georgia, serif; padding: 24px 16px 48px; }
.tarjeta-acciones { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin: 0 auto 24px; }
.tarjeta-boton { font-family: var(--fuente-micro), Arial, sans-serif; font-weight: 500; font-size: 13px; letter-spacing: .14em; text-transform: uppercase; background: #FFFFFF; color: #14140F; border: 1px solid #14140F; border-radius: 999px; padding: 12px 20px; cursor: pointer; text-decoration: none; }
.tarjeta-boton:hover { background: #14140F; color: #FFFFFF; }
.tarjeta-boton:focus-visible { outline: 2px solid #14140F; outline-offset: 3px; }
.tarjeta-hojas { overflow-x: auto; }
.hoja { position: relative; width: 297mm; height: 210mm; margin: 0 auto 24px; background: #FFFFFF; box-shadow: 0 18px 34px -20px rgba(20,20,15,.4); overflow: hidden; }
.hoja-marcas { position: absolute; inset: 0; width: 297mm; height: 210mm; }
.tarjeta { position: absolute; left: 43.5mm; top: 31mm; width: 210mm; height: 148mm; display: flex; }
.cara { width: 105mm; height: 148mm; flex: none; overflow: hidden; }
.tapa { display: flex; flex-direction: column; justify-content: space-between; align-items: center; text-align: center; padding: 26mm 10.5mm 11mm; }
.tapa-marca { display: flex; flex-direction: column; align-items: center; gap: 7mm; }
.tapa-marca svg { width: 40mm; height: auto; }
.tapa-nombre { font-family: var(--fuente-titulo), Georgia, serif; font-weight: 400; font-variation-settings: "wght" 400; font-size: 7.8mm; letter-spacing: .06em; line-height: 1.18; }
.tapa-slogan { font-style: italic; font-weight: 300; font-size: 5.2mm; line-height: 1.4; text-wrap: balance; }
.contratapa { display: flex; align-items: flex-end; justify-content: center; padding-bottom: 12mm; }
.contratapa svg { width: 11mm; height: auto; }
.izq { display: flex; flex-direction: column; gap: 5mm; padding: 13mm 10.5mm 12mm; }
.saludo { font-family: var(--fuente-titulo), Georgia, serif; font-variation-settings: "wght" 400; font-size: 7.6mm; }
.mensaje { font-family: var(--fuente-titulo), Georgia, serif; font-variation-settings: "wght" 400; font-style: italic; line-height: 1.5; margin: 0; flex: 1; white-space: pre-line; overflow-wrap: anywhere; }
.firma { font-family: var(--fuente-titulo), Georgia, serif; font-variation-settings: "wght" 400; font-style: italic; font-size: 6.4mm; align-self: flex-end; }
.der { display: flex; flex-direction: column; gap: 3.4mm; padding: 9mm 10.5mm 8mm; }
.explica { margin: 0; font-size: 3.9mm; line-height: 1.42; }
.explica span { display: block; }
.explica .es-un-regalo { font-family: var(--fuente-titulo), Georgia, serif; font-variation-settings: "wght" 400; font-size: 6mm; line-height: 1.2; margin-bottom: 1.8mm; }
.instruccion { font-family: var(--fuente-micro), Arial, sans-serif; font-weight: 500; font-size: 3.2mm; letter-spacing: .14em; text-transform: uppercase; text-align: center; margin: 0; line-height: 1.4; }
.qr { display: block; width: 40mm; height: 40mm; margin: 0 auto; image-rendering: pixelated; }
.respaldo { margin: 0; font-size: 3.3mm; line-height: 1.45; text-align: center; }
.codigo { font-family: var(--fuente-micro), Arial, sans-serif; font-weight: 600; font-size: 5.2mm; letter-spacing: .24em; text-align: center; border: 0.3mm solid #14140F; padding: 1.6mm 0 1.6mm .24em; margin-top: auto; }
/* En pantalla, la hoja se achica para entrar en la ventana (EscalaHojas). */
@media screen { .hoja { zoom: var(--escala, 1); } }
@media print {
  html, body, body:has(.tarjeta-pantalla) { background: #FFFFFF !important; }
  .tarjeta-pantalla { background: #FFFFFF; padding: 0; }
  .no-imprimir { display: none !important; }
  .tarjeta-hojas { overflow: visible; }
  .hoja { margin: 0; box-shadow: none; break-after: page; }
  .hoja:last-child { break-after: auto; }
  .hoja-interior .tarjeta { transform: rotate(180deg); }
}
`;

/** Marcas de corte en las esquinas de la tarjeta y de doblez al medio, afuera de la tarjeta. */
function Marcas() {
  const x0 = 43.5, x1 = 253.5, y0 = 31, y1 = 179, medio = 148.5, largo = 8, aire = 2;
  const gris = { stroke: "#BDBDB6", strokeWidth: 0.2 };
  const corte = [
    [x0 - aire - largo, y0, x0 - aire, y0], [x0, y0 - aire - largo, x0, y0 - aire],
    [x1 + aire, y0, x1 + aire + largo, y0], [x1, y0 - aire - largo, x1, y0 - aire],
    [x0 - aire - largo, y1, x0 - aire, y1], [x0, y1 + aire, x0, y1 + aire + largo],
    [x1 + aire, y1, x1 + aire + largo, y1], [x1, y1 + aire, x1, y1 + aire + largo],
  ];
  return (
    <svg className="hoja-marcas" viewBox="0 0 297 210" aria-hidden="true">
      {corte.map(([a, b, c, d]) => <line key={`${a}-${b}-${c}-${d}`} x1={a} y1={b} x2={c} y2={d} {...gris} />)}
      <line x1={medio} y1={y0 - aire - largo} x2={medio} y2={y0 - aire} {...gris} strokeDasharray="1 1" />
      <line x1={medio} y1={y1 + aire} x2={medio} y2={y1 + aire + largo} {...gris} strokeDasharray="1 1" />
    </svg>
  );
}

/** El tamaño del mensaje según el largo: hasta 600 letras tienen que entrar en la cara. */
function tamanoMensaje(mensaje: string): string {
  const largo = largoEnTarjeta(mensaje);
  if (largo > 400) return "3.9mm";
  if (largo > 250) return "4.6mm";
  return "5.6mm";
}

export function TarjetaImprimible({ regalo, qr, respaldo, textos, botonImprimir, botonImagen, langTarjeta }: {
  regalo: Pick<RegaloPublico, "codigo" | "comoLeDicen" | "quienRegala" | "mensaje">;
  /** El QR como data URI. */
  qr: string;
  /** La línea con el número de respaldo, o null si no hay número. */
  respaldo: string | null;
  textos: ReturnType<typeof textosAbuelo>;
  botonImprimir: string;
  botonImagen: string;
  langTarjeta: "es" | "ca";
}) {
  return (
    <div lang="es" className="tarjeta-pantalla">
      <style dangerouslySetInnerHTML={{ __html: ESTILOS }} />
      <div className="tarjeta-acciones no-imprimir">
        <BotonImprimir className="tarjeta-boton" texto={botonImprimir} />
        <a className="tarjeta-boton" href={`/regalo/${regalo.codigo}/imagen`} download={`regalo-${regalo.codigo}.png`}>
          {botonImagen}
        </a>
      </div>

      <EscalaHojas />
      <div className="tarjeta-hojas">
        <section className="hoja" aria-label="Lado de afuera">
          <Marcas />
          <div className="tarjeta" lang={langTarjeta}>
            <div className="cara contratapa">
              <Toroide />
            </div>
            <div className="cara tapa">
              <div className="tapa-marca">
                <Toroide />
                <div className="tapa-nombre">VITÁCORA<br />FAMILIAR</div>
              </div>
              <div className="tapa-slogan">{textos.tapaSlogan}</div>
            </div>
          </div>
        </section>

        <section className="hoja hoja-interior" aria-label="Lado de adentro">
          <Marcas />
          <div className="tarjeta" lang={langTarjeta}>
            <div className="cara izq">
              <div className="saludo">{regalo.comoLeDicen},</div>
              <p className="mensaje" style={{ fontSize: tamanoMensaje(regalo.mensaje) }}>{regalo.mensaje}</p>
              <div className="firma">{regalo.quienRegala}</div>
            </div>
            <div className="cara der">
              <p className="explica">
                <span className="es-un-regalo">{textos.esUnRegalo}</span>
                {textos.explica.map((linea) => <span key={linea}>{linea}</span>)}
              </p>
              <p className="instruccion">{textos.apunta}</p>
              {/* eslint-disable-next-line @next/next/no-img-element -- data URI generado en el server, sin optimizar */}
              <img className="qr" src={qr} alt="" width={512} height={512} />
              {respaldo && <p className="respaldo">{respaldo}</p>}
              <div className="codigo">{regalo.codigo}</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
