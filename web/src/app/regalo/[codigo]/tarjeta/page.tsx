import { notFound, redirect } from "next/navigation";
import { Playfair_Display, Archivo, Source_Serif_4 } from "next/font/google";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { leerRegalo, numeroPublico } from "@/lib/regalo-datos";
import { qrDataUri, urlRegalo } from "@/lib/qr";
import { textosAbuelo, textosComprador, tratoDeRegion } from "@/lib/regalo-textos";
import { largoEnTarjeta, numeroSinCortes } from "@/lib/regalo";
import { Toroide } from "../../../marca";
import { BotonImprimir } from "./imprimir";

// La tarjeta del regalo para imprimir (plan 2026-10-07-gift-card, Task 7): una
// A6 doble abierta (210 × 148 mm) centrada en una A4 apaisada, dos hojas. La
// primera es el lado de afuera (contratapa + tapa), la segunda el de adentro
// (mensaje + cómo empezar). Se imprime doble faz con lo que trae Chrome por
// defecto (girar por el borde largo): como eso da vuelta la hoja como un
// almanaque, al imprimir la hoja de adentro va girada 180° y la tarjeta doblada
// queda derecha, con la tapa detrás del mensaje. La tarjeta está centrada, así
// que las marcas de corte coinciden de los dos lados. En pantalla no se gira.
// Lo que se imprime es solo negro sobre blanco; el gris claro es nada más para
// las marcas de corte y de doblez.

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"], variable: "--fuente-titulo", display: "swap" });
const archivo = Archivo({ subsets: ["latin"], weight: ["500", "600"], variable: "--fuente-micro", display: "swap" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], weight: ["300", "400"], style: ["normal", "italic"], variable: "--fuente-cuerpo", display: "swap" });

const ESTILOS = `
@page { size: A4 landscape; margin: 0; }
.tarjeta-pantalla, .tarjeta-pantalla * { box-sizing: border-box; }
body:has(.tarjeta-pantalla) { background: #E7E7E3; }
.tarjeta-pantalla { min-height: 100vh; flex: 1 0 auto; background: #E7E7E3; color: #14140F; font-family: var(--fuente-cuerpo), Georgia, serif; padding: 24px 16px 48px; }
.tarjeta-acciones { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin: 0 auto 24px; }
.tarjeta-boton { font-family: var(--fuente-micro), Arial, sans-serif; font-size: 13px; letter-spacing: .14em; text-transform: uppercase; background: #FFFFFF; color: #14140F; border: 1px solid #14140F; border-radius: 999px; padding: 12px 20px; cursor: pointer; text-decoration: none; }
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
.tapa-nombre { font-family: var(--fuente-titulo), Georgia, serif; font-weight: 400; font-size: 7.8mm; letter-spacing: .06em; line-height: 1.18; }
.tapa-slogan { font-style: italic; font-weight: 300; font-size: 5.2mm; line-height: 1.4; text-wrap: balance; }
.contratapa { display: flex; align-items: flex-end; justify-content: center; padding-bottom: 12mm; }
.contratapa svg { width: 11mm; height: auto; }
.izq { display: flex; flex-direction: column; gap: 5mm; padding: 13mm 10.5mm 12mm; }
.saludo { font-family: var(--fuente-titulo), Georgia, serif; font-size: 7.6mm; }
.mensaje { font-family: var(--fuente-titulo), Georgia, serif; font-style: italic; line-height: 1.5; margin: 0; flex: 1; white-space: pre-line; overflow-wrap: anywhere; }
.firma { font-family: var(--fuente-titulo), Georgia, serif; font-style: italic; font-size: 6.4mm; align-self: flex-end; }
.der { display: flex; flex-direction: column; gap: 3.4mm; padding: 9mm 10.5mm 8mm; }
.explica { margin: 0; font-size: 3.9mm; line-height: 1.42; }
.explica span { display: block; }
.explica .es-un-regalo { font-family: var(--fuente-titulo), Georgia, serif; font-size: 6mm; line-height: 1.2; margin-bottom: 1.8mm; }
.instruccion { font-family: var(--fuente-micro), Arial, sans-serif; font-weight: 500; font-size: 3.2mm; letter-spacing: .14em; text-transform: uppercase; text-align: center; margin: 0; line-height: 1.4; }
.qr { display: block; width: 40mm; height: 40mm; margin: 0 auto; image-rendering: pixelated; }
.respaldo { margin: 0; font-size: 3.3mm; line-height: 1.45; text-align: center; }
.codigo { font-family: var(--fuente-micro), Arial, sans-serif; font-weight: 600; font-size: 5.2mm; letter-spacing: .24em; text-align: center; border: 0.3mm solid #14140F; padding: 1.6mm 0 1.6mm .24em; margin-top: auto; }
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

export default async function PaginaTarjeta({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  let crudo = codigo;
  try {
    crudo = decodeURIComponent(codigo);
  } catch {
    // Un % mal formado no es un código: leerRegalo lo descarta.
  }
  const regalo = await leerRegalo(crearClienteServidor(), crudo);
  if (!regalo) notFound();
  // Ya canjeado (Naza, 10/10): la tarjeta cumplió su función y su código no
  // sirve más. Un link viejo (el mail del pago) lleva al tablero de quien compró.
  if (regalo.usado) redirect("/tablero");
  const numero = numeroPublico();
  const qr = await qrDataUri(urlRegalo(regalo.codigo));
  // Lo impreso va en el idioma del abuelo. Los botones de pantalla los lee quien
  // compra: van con el trato de su región (familias.region; sin región, AR).
  const textos = textosAbuelo(regalo.idioma);
  const botones = textosComprador(tratoDeRegion(regalo.region ?? "AR"));
  // Los botones y los nombres de las hojas («Lado de afuera») son de pantalla y
  // están en castellano: la página va en "es" y solo la tarjeta, en su idioma.
  const langTarjeta = regalo.idioma === "ca" ? "ca" : "es";

  return (
    <div lang="es" className={`${playfair.variable} ${archivo.variable} ${sourceSerif.variable} tarjeta-pantalla`}>
      <style dangerouslySetInnerHTML={{ __html: ESTILOS }} />
      <div className="tarjeta-acciones no-imprimir">
        <BotonImprimir className="tarjeta-boton" texto={botones.botonImprimir} />
        <a className="tarjeta-boton" href={`/regalo/${regalo.codigo}/imagen`} download={`regalo-${regalo.codigo}.png`}>
          {botones.botonImagen}
        </a>
      </div>

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
              {numero && <p className="respaldo">{textos.respaldo(numeroSinCortes(numero.legible))}</p>}
              <div className="codigo">{regalo.codigo}</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
