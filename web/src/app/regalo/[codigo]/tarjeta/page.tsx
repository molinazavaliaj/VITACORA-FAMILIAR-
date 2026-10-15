import { notFound, redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { leerRegalo, numeroPublico } from "@/lib/regalo-datos";
import { qrDataUri, urlRegalo } from "@/lib/qr";
import { numeroSinCortes } from "@/lib/regalo";
import { textosAbuelo, textosComprador, tratoDeRegion } from "@/lib/regalo-textos";
import { TarjetaImprimible } from "./tarjeta";

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

  return (
    <TarjetaImprimible
      regalo={regalo}
      qr={qr}
      respaldo={numero ? textos.respaldo(numeroSinCortes(numero.legible)) : null}
      textos={textos}
      botonImprimir={botones.botonImprimir}
      botonImagen={botones.botonImagen}
      langTarjeta={langTarjeta}
    />
  );
}
