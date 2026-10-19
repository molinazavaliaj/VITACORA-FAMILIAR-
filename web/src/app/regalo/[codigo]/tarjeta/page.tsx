import { notFound, redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { leerRegalo, numeroPublico } from "@/lib/regalo-datos";
import { qrDataUri, urlRegalo } from "@/lib/qr";
import { numeroSinCortes } from "@/lib/regalo";
import { textosAbuelo, textosComprador, textosTarjetaLibro, tratoDeRegion } from "@/lib/regalo-textos";
import { textosTarjetaProducto } from "../../../_textos/tarjeta-regalo";
import { TarjetaImprimible, TarjetaProductoImprimible } from "./tarjeta";

// La tarjeta del regalo para imprimir (plan 2026-10-07-gift-card, Task 7): una
// A6 doble abierta (210 × 148 mm) centrada en una A4 apaisada, dos hojas. La
// primera es el lado de afuera (contratapa + tapa), la segunda el de adentro
// (mensaje + cómo empezar). Se imprime doble faz con lo que trae Chrome por
// defecto (girar por el borde largo): como eso da vuelta la hoja como un
// almanaque, al imprimir la hoja de adentro va girada 180° y la tarjeta doblada
// queda derecha, con la tapa detrás del mensaje. La tarjeta está centrada, así
// que las marcas de corte coinciden de los dos lados. En pantalla no se gira.
// Familiar lleva el diseño negro «El libro de tu vida» (aprobado e impreso por
// Naza el 16/10): afuera, contratapa con el slogan y tapa; adentro, Para, el
// mensaje y De a la izquierda, y a la derecha lo que es, cómo empezar (QR y
// respaldo) y el código en su recuadro claro. El gris claro de la hoja es nada
// más para las marcas de corte y de doblez.
//
// Las letras vienen del layout raíz, que carga Playfair en 500 y 600: los textos
// en Playfair de la tarjeta van en 400 (como siempre) con font-variation-settings,
// que sobre la fuente variable da el mismo trazo que un 400 cargado aparte. Y
// los botones dicen font-weight: 500 porque antes no había Archivo 400 y salían
// en 500. Lo que se dibuja vive en tarjeta.tsx (sin base, para poder probarlo).

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

  const respaldo = numero ? textos.respaldo(numeroSinCortes(numero.legible)) : null;

  // Kids y Viaje (arreglos chicos): la tarjeta de su maqueta, elegida por lo
  // que se regaló (narradores.contexto.modo). Mismo QR, mismo código.
  if (regalo.producto === "kids" || regalo.producto === "viaje") {
    return (
      <TarjetaProductoImprimible
        regalo={regalo}
        qr={qr}
        respaldo={respaldo}
        apunta={textos.apunta}
        textos={textosTarjetaProducto(regalo.producto, regalo.idioma)}
        botonImprimir={botones.botonImprimir}
        avisoDobleFaz={botones.avisoDobleFaz}
        botonImagen={botones.botonImagen}
        langTarjeta={langTarjeta}
      />
    );
  }

  return (
    <TarjetaImprimible
      regalo={regalo}
      qr={qr}
      respaldo={respaldo}
      textos={textos}
      libro={textosTarjetaLibro(regalo.idioma)}
      botonImprimir={botones.botonImprimir}
        avisoDobleFaz={botones.avisoDobleFaz}
      botonImagen={botones.botonImagen}
      langTarjeta={langTarjeta}
    />
  );
}
