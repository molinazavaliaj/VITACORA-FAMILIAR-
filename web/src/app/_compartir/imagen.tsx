import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { TEXTOS_PORTADA } from "../_textos/portada";
import { TEXTOS_VIAJE } from "../_textos/viaje";
import { TEXTOS_KIDS } from "../_textos/kids";
import { TEXTOS_HISTORIA } from "../_textos/historia";
import type { IdiomaWeb } from "@/lib/idioma-web";

// La imagen para compartir (og:image / twitter:image), 19/10. La que sale
// cuando alguien pega el enlace en WhatsApp, Facebook o un mail.
//
// «La web es un libro»: a un lado el libro, al otro el titular de la página
// (el MISMO texto aprobado que ya está publicado, leído de _textos: si cambia
// el titular, cambia la imagen) y la marca chica. Una versión por producto:
//   · Familiar: tinta con tela, la tapa del libro de ejemplo apenas girada.
//   · Viaje: la noche y el azul (tokens --viaje-*), la foto del libro en la mesa.
//   · Kids: el papel claro y el terracota (kids.css), la foto del libro.
//   · Historia (23/10): la de Familiar (no hay fotos propias todavía), con su titular y su nombre.
//
// WhatsApp a veces la muestra cuadrada (recorta el centro, 630 × 630): todo
// lo que importa vive en la franja del medio (x 285–915; el bloque mide ~610). A los costados solo
// hay fondo y los anillos del toroide, que pueden perderse sin que falte nada.
//
// Letras: las de la web (app/fuentes), pasadas a TTF estático en
// _compartir/fuentes porque ImageResponse no lee woff2 ni fuentes variables
// (Playfair 500 y su cursiva, Archivo 500; mismos subsets, misma licencia OFL).

export const TAMANO_IMAGEN = { width: 1200, height: 630 };
export const TIPO_IMAGEN = "image/png";

export type Producto = "familiar" | "viaje" | "kids" | "historia";

type Paleta = {
  fondo: string;
  /** Capas de background-image sobre el fondo (tela, luz). */
  textura: string;
  texto: string;
  marca: string;
  acento: string;
  anillos: string;
};

const PALETAS: Record<Exclude<Producto, "historia">, Paleta> = {
  // _direccion/tokens.css: --dir-tinta, --dir-sobre-tinta, --dir-dorado, --dir-tela.
  familiar: {
    fondo: "#0b0b0a",
    textura:
      "radial-gradient(ellipse at 50% 45%, rgba(238,234,225,0.07) 0%, rgba(0,0,0,0) 60%), repeating-linear-gradient(0deg, rgba(255,255,255,0.022) 0px, rgba(255,255,255,0.022) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 3px), repeating-linear-gradient(90deg, rgba(255,255,255,0.016) 0px, rgba(255,255,255,0.016) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 3px)",
    texto: "#eeeae1",
    marca: "#a39f96",
    acento: "#8a7246",
    anillos: "rgba(238,234,225,0.10)",
  },
  // tokens.css: --viaje-fondo, --viaje-texto, --viaje-acento, la hoja azul noche.
  viaje: {
    fondo: "#0a0a0a",
    textura:
      "radial-gradient(ellipse at 50% 45%, rgba(27,39,66,0.85) 0%, rgba(16,25,44,0.35) 45%, rgba(0,0,0,0) 75%), repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 3px), repeating-linear-gradient(90deg, rgba(255,255,255,0.014) 0px, rgba(255,255,255,0.014) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 3px)",
    texto: "#ffffff",
    marca: "#c9d6f5",
    acento: "#9dbdff",
    anillos: "rgba(157,189,255,0.16)",
  },
  // _kids/kids.css: --kids-fondo, --kids-texto, --kids-acento.
  kids: {
    fondo: "#fbf8f3",
    textura: "radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0.9) 0%, rgba(244,238,228,0) 65%)",
    texto: "#14140f",
    marca: "#57534b",
    acento: "#c4502e",
    anillos: "rgba(196,80,46,0.16)",
  },
};

/** La marca chica de arriba: el nombre del producto como figura en la web. */
const MARCA: Record<Producto, Record<IdiomaWeb, string>> = {
  familiar: { es: "Vitácora Familiar", ar: "Vitácora Familiar", ca: "Vitácora Familiar" },
  viaje: { es: "Vitácora de Viaje", ar: "Vitácora de Viaje", ca: "Vitácora de Viatge" },
  kids: { es: "Vitácora Kids", ar: "Vitácora Kids", ca: "Vitácora Kids" },
  historia: { es: TEXTOS_HISTORIA.es.marca, ar: TEXTOS_HISTORIA.ar.marca, ca: TEXTOS_HISTORIA.ca.marca },
};

/** La paleta y el libro: historia usa los de Familiar. */
const paletaDe = (producto: Producto): Paleta => PALETAS[producto === "historia" ? "familiar" : producto];

/** El titular aprobado de la página, en sus dos partes (como lo arma el hero). */
export function titularDe(producto: Producto, idioma: IdiomaWeb): [string, string] {
  if (producto === "viaje") return TEXTOS_VIAJE[idioma].titulo;
  if (producto === "kids") return TEXTOS_KIDS[idioma].titulo;
  if (producto === "historia") return [TEXTOS_HISTORIA[idioma].hero.linea1, TEXTOS_HISTORIA[idioma].hero.linea2];
  return TEXTOS_PORTADA[idioma].hero.titulo;
}

/** El texto alternativo de la imagen: el mismo titular, entero. */
export function altDe(producto: Producto, idioma: IdiomaWeb): string {
  return `${MARCA[producto][idioma]}. ${titularDe(producto, idioma).join(" ")}`;
}

const raiz = () => process.cwd();

async function fuente(nombre: string) {
  return readFile(path.join(raiz(), "src/app/_compartir/fuentes", nombre));
}

async function foto(nombre: string) {
  const datos = await readFile(path.join(raiz(), "public/rediseno", nombre));
  return `data:image/jpeg;base64,${datos.toString("base64")}`;
}

// El toroide de la marca (marca.tsx), en anillos sueltos a los costados.
const ANILLOS: ReadonlyArray<readonly [number, number, number]> = [
  [86.14, 13.86, 17.63],
  [73.23, 26.77, 34.07],
  [60.65, 39.35, 50.08],
  [48.29, 51.71, 65.82],
  [36.08, 63.92, 81.36],
  [23.99, 76.01, 96.74],
  [12.0, 88.0, 112.0],
];

function Toroide({ color, tamano, style }: { color: string; tamano: number; style: Record<string, string | number> }) {
  return (
    <svg width={tamano} height={(tamano * 228) / 356} viewBox="-78 31 356 228" style={{ position: "absolute", ...style }}>
      {ANILLOS.map(([cx, rx, ry]) => (
        <g key={cx}>
          <ellipse cx={cx} cy={145} rx={rx} ry={ry} fill="none" stroke={color} strokeWidth={0.7} />
          <ellipse cx={200 - cx} cy={145} rx={rx} ry={ry} fill="none" stroke={color} strokeWidth={0.7} />
        </g>
      ))}
    </svg>
  );
}

/** El libro de cada producto: la tapa (Familiar) o la foto del libro (Viaje, Kids). */
async function Libro({ producto }: { producto: Producto }) {
  if (producto === "familiar" || producto === "historia") {
    // La tapa del libro de ejemplo (376 × 520), apenas girada, con su sombra.
    const src = await foto("libro-osvaldo-portada.jpg");
    return (
      <div
        style={{
          display: "flex",
          width: 210,
          height: 290,
          transform: "rotate(-3deg)",
          boxShadow: "0 30px 60px rgba(0,0,0,0.75), 0 6px 14px rgba(0,0,0,0.6)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={210} height={290} alt="" />
      </div>
    );
  }
  // Viaje: el libro sobre la mesa (1344 × 768), en el óvalo que usa la web.
  // Kids: el libro sobre la colcha (1200 × 686), en una hoja de puntas redondas.
  // Las cajas recortan la foto alrededor del libro (medido en la foto original).
  const datos =
    producto === "viaje"
      ? { archivo: "viaje-libro-mesa.jpg", ancho: 1344, alto: 768, caja: [260, 300] as const, escala: 0.51, x: -239, y: -83, radio: "50%" }
      : { archivo: "kids-libro-tapa.jpg", ancho: 1200, alto: 686, caja: [260, 234] as const, escala: 0.36, x: -92, y: -6, radio: "36px" };
  const src = await foto(datos.archivo);
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: datos.caja[0],
        height: datos.caja[1],
        overflow: "hidden",
        borderRadius: datos.radio,
        transform: producto === "kids" ? "rotate(-2deg)" : "rotate(0deg)",
        boxShadow: producto === "viaje" ? "0 26px 60px rgba(0,0,0,0.7)" : "0 22px 44px rgba(20,20,15,0.22)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={Math.round(datos.ancho * datos.escala)}
        height={Math.round(datos.alto * datos.escala)}
        style={{ position: "absolute", left: datos.x, top: datos.y }}
      />
    </div>
  );
}

/**
 * La imagen 1200 × 630 de un producto en un idioma. La usan los
 * opengraph-image.tsx y twitter-image.tsx de cada sección.
 */
export async function imagenParaCompartir(producto: Producto, idioma: IdiomaWeb) {
  const p = paletaDe(producto);
  const [linea1, linea2] = titularDe(producto, idioma);
  const largo = (linea1 + linea2).length;
  const palabras = [
    ...linea1.split(" ").map((palabra) => ({ palabra, segunda: false })),
    ...linea2.split(" ").map((palabra) => ({ palabra, segunda: true })),
  ];
  // Kids tiene el titular más largo: un poco más chico para que entre en la franja.
  const cuerpo = largo > 44 ? 36 : 46;
  const [playfair, playfairCursiva, archivo] = await Promise.all([
    fuente("playfair-500.ttf"),
    fuente("playfair-cursiva-500.ttf"),
    fuente("archivo-500.ttf"),
  ]);
  const libro = await Libro({ producto });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          backgroundColor: p.fondo,
          backgroundImage: p.textura,
        }}
      >
        <Toroide color={p.anillos} tamano={420} style={{ left: -150, top: 180 }} />
        <Toroide color={p.anillos} tamano={420} style={{ right: -150, top: 180 }} />

        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", width: producto === "familiar" ? 230 : 260, justifyContent: "center" }}>{libro}</div>
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 32, width: 320 }}>
            <div
              style={{
                display: "flex",
                fontFamily: "Archivo",
                fontSize: 15,
                letterSpacing: 4.5,
                textTransform: "uppercase",
                color: p.marca,
              }}
            >
              {MARCA[producto][idioma]}
            </div>
            <div style={{ display: "flex", width: 44, height: 2, backgroundColor: p.acento, marginTop: 18, marginBottom: 22 }} />
            {/* El titular corre como un solo párrafo (palabra por palabra, así
                ImageResponse lo corta parejo); en Kids la segunda parte va en
                cursiva y terracota, como en su hero. */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                fontFamily: "Playfair",
                fontSize: cuerpo,
                lineHeight: 1.14,
                letterSpacing: -0.5,
                color: p.texto,
              }}
            >
              {palabras.map(({ palabra, segunda }, i) => (
                <span
                  key={i}
                  style={{
                    marginRight: "0.26em",
                    ...(segunda && producto === "kids" ? { fontStyle: "italic", color: p.acento } : {}),
                  }}
                >
                  {palabra}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...TAMANO_IMAGEN,
      fonts: [
        { name: "Playfair", data: playfair, weight: 500, style: "normal" },
        { name: "Playfair", data: playfairCursiva, weight: 500, style: "italic" },
        { name: "Archivo", data: archivo, weight: 500, style: "normal" },
      ],
    },
  );
}
