import Image from "next/image";
import QRCode from "qrcode";
import { Toroide } from "../marca";
import { TEXTOS_PUBLICO } from "../_textos/publico";
import type { TextosPortada } from "../_textos/portada";
import type { TextosEjemplo } from "../_textos/ejemplo";
import type { IdiomaWeb } from "@/lib/idioma-web";

// El libro de ejemplo de Osvaldo en 3D (prototipo, 3.ª vuelta). Todo en CSS
// 3D, sin librerías: cada cara es HTML/SVG vectorial (tapa, lomo,
// contratapa, los tres cantos de las hojas y el pliego del capítulo 1), así
// que se ve nítido a cualquier tamaño. Las medidas salen de --l3-w (ancho de
// la tapa) y las letras de cada cara van en cqw/cqh: crecen con el libro.
//
// El giro lo mueve el scroll (globals.css, bloque «l3-»): entra en 3/4 con
// tapa y lomo, se da vuelta a mostrar la contratapa con el QR, vuelve de
// frente, se abre (guarda negra y portadilla) y pasa la primera hoja hasta
// el capítulo 1. Sin animation-timeline o con «menos
// movimiento», queda quieto en 3/4 y el pliego abierto va debajo, plano.
//
// Diseño copiado del libro real (vf_book_atlas): tapa con la foto en la
// puerta de piedra, lomo negro, contratapa blanca con el QR. El QR es de
// verdad y lleva a /ejemplo. La historia es inventada y se dice al lado.

const URL_QR = "https://www.vitacorafamiliar.com/ejemplo";

/** El QR como un solo path SVG, armado en el servidor (sin data URI ni JS). */
function Qr({ url, className }: { url: string; className?: string }) {
  const { modules } = QRCode.create(url, { errorCorrectionLevel: "M" });
  const n = modules.size;
  let d = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (modules.get(y, x)) d += `M${x} ${y}h1v1h-1z`;
    }
  }
  return (
    <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} className={className} shapeRendering="crispEdges" aria-hidden>
      <rect x="-1" y="-1" width={n + 2} height={n + 2} fill="#fff" />
      <path d={d} fill="#161513" />
    </svg>
  );
}

type Libro = TextosPortada["direccion"]["libro"];
type Capitulo = TextosEjemplo["libro"];

/** Las fotos y la variante del libro. Sin nada, el de Osvaldo; `viaje` es el libro de viaje del inicio de /viaje (19/10): tapa con banda de tinta, lomo azul noche. */
export type DisenoLibro = { tapa: string; interior: string; variante?: "viaje" };
const OSVALDO: DisenoLibro = { tapa: "/rediseno/libro-tapa-foto.jpg", interior: "/rediseno/osvaldo-guitarra.jpg" };

function Tapa({ b, sizes, foto }: { b: Libro; sizes: string; foto: string }) {
  return (
    <div className="l3-papel-tapa flex h-full flex-col">
      <div className="relative h-[65%] overflow-hidden">
        <Image src={foto} alt="" fill sizes={sizes} className="object-cover" />
      </div>
      <div className="flex flex-1 flex-col px-[6%] pb-[5.5%] pt-[6%]">
        <span className="l3-etiqueta">{b.etiqueta}</span>
        <span className="l3-nombre mt-[3.5%]">
          {b.nombre[0]}
          <br />
          {b.nombre[1]}
        </span>
        <div className="mt-auto flex items-end justify-between">
          <span className="l3-siempre">{b.paraSiempre}</span>
          <span className="l3-marca">
            <Toroide className="l3-marca-toroide" />
            V · F
          </span>
        </div>
      </div>
    </div>
  );
}

function Contratapa({ b, lema }: { b: Libro; lema: string }) {
  return (
    <div className="l3-papel-tapa flex h-full flex-col items-center px-[11%] pb-[6%] pt-[10%] text-center">
      <Toroide className="l3-contra-toroide" />
      <span className="l3-iniciales mt-[4%]">{b.iniciales}</span>
      <p className="l3-contra-texto mt-[15%]">{b.contra}</p>
      <span className="l3-qr mt-[9%]">
        <Qr url={URL_QR} className="h-full w-full" />
      </span>
      <span className="l3-escucha mt-[3%]">{b.escucha}</span>
      <span className="mt-auto flex flex-col items-center gap-[0.4em]">
        <span className="l3-lema">{lema}</span>
        <span className="l3-web">{b.web}</span>
      </span>
    </div>
  );
}

function Lomo({ b }: { b: Libro }) {
  return (
    <div className="l3-lomo-cara flex h-full flex-col items-center justify-between pb-[4%] pt-[7%]">
      <span className="l3-lomo-texto">{b.lomo}</span>
      <Toroide className="l3-lomo-toroide" />
    </div>
  );
}

/** La portadilla: lo primero que se ve al abrir la tapa. */
function Portadilla({ b }: { b: Libro }) {
  return (
    <div className="l3-pagina flex h-full flex-col items-center justify-center gap-[3%] px-[12%] text-center">
      <span className="l3-etiqueta">{b.etiqueta}</span>
      <span className="l3-portadilla-nombre">
        {b.nombre[0]} {b.nombre[1]}
      </span>
      <Toroide className="l3-portadilla-toroide mt-[6%]" />
    </div>
  );
}

/** La página izquierda del pliego: el capítulo 1, con su cita y dos párrafos. */
export function PaginaCapitulo({ c }: { c: Capitulo }) {
  return (
    <div className="l3-pagina l3-pagina--izq flex h-full flex-col px-[11%] pb-[7%] pt-[13%]">
      <span className="l3-cap-numero">{c.capitulo}</span>
      <span className="l3-cap-titulo">{c.tituloCapitulo}</span>
      <span className="l3-cap-cita">{c.citaCapitulo}</span>
      <div className="l3-cap-texto mt-[6%] flex flex-col gap-[0.7em]">
        {c.parrafos.map((p) => (
          <p key={p.slice(0, 16)}>{p}</p>
        ))}
      </div>
      <span className="l3-folio mt-auto">10</span>
    </div>
  );
}

/** La página derecha: la foto de juventud con su pie. */
export function PaginaFoto({ c, sizes, foto = OSVALDO.interior }: { c: Capitulo; sizes: string; foto?: string }) {
  return (
    <div className="l3-pagina l3-pagina--der flex h-full flex-col items-center px-[11%] pb-[7%] pt-[16%]">
      <div className="relative aspect-[700/870] w-full overflow-hidden">
        <Image src={foto} alt={c.altFoto} fill sizes={sizes} className="object-cover" />
      </div>
      <span className="l3-pie-foto mt-[6%]">{c.pieFoto}</span>
      <span className="l3-folio mt-auto">11</span>
    </div>
  );
}

export function Libro3D({
  idioma,
  b,
  c,
  diseno = OSVALDO,
}: {
  idioma: IdiomaWeb;
  b: Libro;
  c: Capitulo;
  diseno?: DisenoLibro;
}) {
  const lema = TEXTOS_PUBLICO[idioma].lema;
  // El libro se arma 1,5 veces más grande (ver globals.css): la tapa mide ~570 px.
  const sizes = "(min-width: 768px) 570px, 93vw";
  return (
    <div className={`l3-escena ${diseno.variante === "viaje" ? "l3--viaje" : ""}`} aria-hidden>
      <div className="l3-sombra" />
      <div className="l3-libro">
        <div className="l3-tapa">
          <div className="l3-cara l3-frente">
            <Tapa b={b} sizes={sizes} foto={diseno.tapa} />
            <span className="l3-brillo" />
          </div>
          {/* El dorso de la tapa: la guarda, lisa, negra como el lomo. */}
          <div className="l3-cara l3-dentro">
            <div className="l3-guarda" />
          </div>
        </div>
        {/* La primera hoja: al abrir la tapa se ve la portadilla; después la
            hoja pasa y su dorso es la página del capítulo 1, a la izquierda
            de la foto. */}
        <div className="l3-hoja">
          <div className="l3-cara l3-hoja-frente">
            <Portadilla b={b} />
          </div>
          <div className="l3-cara l3-hoja-dorso">
            <PaginaCapitulo c={c} />
          </div>
        </div>
        <div className="l3-cara l3-hoja-derecha">
          <PaginaFoto c={c} sizes="(min-width: 768px) 470px, 75vw" foto={diseno.interior} />
        </div>
        <div className="l3-cara l3-contra">
          <Contratapa b={b} lema={lema} />
        </div>
        <div className="l3-cara l3-lomo">
          <Lomo b={b} />
        </div>
        <div className="l3-canto l3-canto--lado" />
        <div className="l3-canto l3-canto--arriba" />
        <div className="l3-canto l3-canto--abajo" />
      </div>
    </div>
  );
}
