import { ImageResponse } from "next/og";
import type { RegaloPublico } from "@/lib/regalo-datos";
import { qrDataUri, urlRegalo } from "@/lib/qr";
import { textosAbuelo, textosTarjetaLibro } from "@/lib/regalo-textos";
import { largoEnTarjeta, numeroSinCortes } from "@/lib/regalo";
import { textosTarjetaProducto } from "../../../_textos/tarjeta-regalo";

// La tarjeta del regalo como imagen vertical (1080 × 1920) para mandar por
// WhatsApp, en una columna. Familiar: la tarjeta negra «El libro de tu vida»
// (16/10). Kids y Viaje, negro sobre blanco como siempre: (arreglos chicos, maquetas `TarjetaKids` y `TarjetaViaje`):
// arriba la etiqueta y el titular de su tapa, y en vez de «Esto es un regalo»
// y sus tres líneas, el «¿Qué es esto?» de su producto.

const TINTA = "#14140F";
const DORADO = "#8A7246";
// La tarjeta negra: letras claras, grises para lo chico, el recuadro del código claro.
const CLARO = "#F3F2EE";
const GRIS = "#B9B5AA";
const RAYA = "#8A8679";
const PAPEL = "#F6F4EF";

// El toroide de la marca (src/app/marca.tsx), con el color puesto: Satori no hereda currentColor.
const ANILLOS: ReadonlyArray<readonly [number, number, number]> = [
  [86.14, 13.86, 17.63], [73.23, 26.77, 34.07], [60.65, 39.35, 50.08], [48.29, 51.71, 65.82],
  [36.08, 63.92, 81.36], [23.99, 76.01, 96.74], [12.0, 88.0, 112.0],
];
function ToroideImagen({ ancho, color }: { ancho: number; color: string }) {
  return (
    <svg width={ancho} height={Math.round((ancho * 228) / 356)} viewBox="-78 31 356 228" style={{ marginTop: 34 }}>
      {ANILLOS.flatMap(([cx, rx, ry]) => [
        <ellipse key={`a${cx}`} cx={cx} cy={145} rx={rx} ry={ry} fill="none" stroke={color} strokeWidth={1.6} />,
        <ellipse key={`b${cx}`} cx={200 - cx} cy={145} rx={rx} ry={ry} fill="none" stroke={color} strokeWidth={1.6} />,
      ])}
    </svg>
  );
}

type Fuente = { name: string; data: ArrayBuffer; weight: 300 | 400 | 500 | 600; style: "normal" | "italic" };

// Las fuentes de la marca, en TTF desde Google Fonts (Satori no lee woff2). Se
// bajan una vez por proceso, recién cuando hace falta la primera imagen. Si
// Google no responde en 3 s, la imagen sale igual con la fuente que trae
// next/og, y la próxima imagen lo vuelve a intentar.
const PEDIDOS: ReadonlyArray<{ familia: string; css: string; weight: Fuente["weight"]; style: Fuente["style"] }> = [
  { familia: "Playfair Display", css: "Playfair+Display:wght@500", weight: 500, style: "normal" },
  { familia: "Playfair Display", css: "Playfair+Display:ital,wght@1,400", weight: 400, style: "italic" },
  { familia: "Source Serif 4", css: "Source+Serif+4:wght@400", weight: 400, style: "normal" },
  { familia: "Archivo", css: "Archivo:wght@500", weight: 500, style: "normal" },
  { familia: "Archivo", css: "Archivo:wght@600", weight: 600, style: "normal" },
];

let fuentes: Promise<Fuente[]> | null = null;

async function bajarFuente(p: (typeof PEDIDOS)[number]): Promise<Fuente | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${p.css}`, { signal: AbortSignal.timeout(3000) })).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
    if (!url) return null;
    const r = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!r.ok) return null;
    return { name: p.familia, data: await r.arrayBuffer(), weight: p.weight, style: p.style };
  } catch {
    return null;
  }
}

function cargarFuentes(): Promise<Fuente[]> {
  if (!fuentes) {
    fuentes = Promise.all(PEDIDOS.map(bajarFuente)).then((lista) => {
      const ok = lista.filter((f): f is Fuente => f !== null);
      if (ok.length < PEDIDOS.length) {
        console.warn("regalo: no se pudieron bajar todas las fuentes de la imagen");
        fuentes = null; // la próxima vez se reintenta
      }
      return ok;
    });
  }
  return fuentes;
}

/** Dibuja la imagen de un regalo ya leído (sin base: se puede probar sola). */
export async function imagenDelRegalo(regalo: RegaloPublico, numero: { legible: string } | null) {
  const [qr, fonts] = await Promise.all([qrDataUri(urlRegalo(regalo.codigo)), cargarFuentes()]);

  // Las frases de la tarjeta, en el idioma del abuelo.
  const textos = textosAbuelo(regalo.idioma);
  const titulo = "Playfair Display";
  const cuerpo = "Source Serif 4";
  const micro = "Archivo";
  const largo = largoEnTarjeta(regalo.mensaje);
  const producto = regalo.producto === "kids" || regalo.producto === "viaje" ? textosTarjetaProducto(regalo.producto, regalo.idioma) : null;
  // Kids y Viaje suman el titular de la tapa arriba: todo lo demás va un punto
  // más chico para que hasta 600 letras entren en los 1920 px.
  const c = producto !== null;
  const tamanoMensaje = c ? (largo > 400 ? 26 : largo > 250 ? 31 : 40) : largo > 400 ? 32 : largo > 250 ? 38 : 46;

  // Familiar: «El libro de tu vida», la tarjeta negra impresa (16/10), en una
  // columna. Arriba la tapa; después Para, el mensaje y De; abajo lo de
  // adentro, cómo empezar y el código en su recuadro claro. Hasta 600 letras
  // de mensaje entran en los 1920 px.
  if (!producto) {
    const libro = textosTarjetaLibro(regalo.idioma);
    const tamano = largo > 400 ? 30 : largo > 250 ? 35 : 46;
    const renglon = (rotulo: string, nombre: string) => (
      <div style={{ display: "flex", alignItems: "flex-end", fontFamily: titulo, fontStyle: "italic", fontWeight: 400 }}>
        <div style={{ display: "flex", fontSize: 36, color: CLARO, marginRight: 22, paddingBottom: 8 }}>{rotulo}</div>
        <div style={{ display: "flex", flex: 1, fontSize: 42, color: "#FFFFFF", borderBottom: `2px solid ${RAYA}`, paddingBottom: 6, paddingLeft: 6 }}>{nombre}</div>
      </div>
    );
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%", height: "100%", display: "flex", flexDirection: "column",
            backgroundColor: TINTA, color: CLARO, padding: "76px 92px 64px", fontFamily: cuerpo,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div style={{ display: "flex", fontFamily: micro, fontWeight: 500, fontSize: 21, letterSpacing: 8, color: GRIS }}>{libro.regaloParaSiempre}</div>
            <ToroideImagen ancho={210} color={CLARO} />
            <div
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", marginTop: 26,
                fontFamily: titulo, fontStyle: "italic", fontWeight: 400, fontSize: 96, lineHeight: 1.04, color: "#FFFFFF",
              }}
            >
              <div style={{ display: "flex" }}>{libro.titulo[0]}</div>
              <div style={{ display: "flex" }}>{libro.titulo[1]}</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginTop: 52 }}>
            {renglon(libro.para, regalo.comoLeDicen)}
            <div
              style={{
                display: "flex", margin: "26px 0", fontFamily: titulo, fontStyle: "italic", fontWeight: 400,
                fontSize: tamano, lineHeight: 1.42, whiteSpace: "pre-wrap", color: CLARO,
              }}
            >
              {regalo.mensaje}
            </div>
            {renglon(libro.de, regalo.quienRegala)}
          </div>

          <div style={{ display: "flex", flex: 1, minHeight: 36 }} />

          <div style={{ display: "flex", fontFamily: titulo, fontWeight: 500, fontSize: 42, color: "#FFFFFF" }}>{libro.regalar}</div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 12, fontSize: 27, lineHeight: 1.4 }}>
            {libro.parrafos.map((linea) => <div key={linea} style={{ display: "flex", marginBottom: 6 }}>{linea}</div>)}
          </div>

          <div style={{ display: "flex", alignItems: "center", marginTop: 26 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- Satori solo entiende <img> */}
            <img src={qr} alt="" width={256} height={256} style={{ backgroundColor: "#FFFFFF" }} />
            <div style={{ display: "flex", flexDirection: "column", flex: 1, marginLeft: 32 }}>
              <div style={{ display: "flex", fontSize: 28, lineHeight: 1.38 }}>{textos.apunta}</div>
              {numero && (
                <div style={{ display: "flex", marginTop: 12, fontSize: 23, lineHeight: 1.38, color: GRIS }}>
                  {textos.respaldo(numeroSinCortes(numero.legible))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginTop: 30, fontFamily: micro, fontWeight: 500, fontSize: 21, letterSpacing: 5, textTransform: "uppercase", color: GRIS }}>
            {libro.codigo}
          </div>
          <div
            style={{
              display: "flex", justifyContent: "center", alignItems: "center", marginTop: 14, height: 100, backgroundColor: PAPEL,
              fontFamily: micro, fontWeight: 600, fontSize: 46, letterSpacing: 11, paddingLeft: 11, color: TINTA,
            }}
          >
            {regalo.codigo}
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 26, fontFamily: micro, fontWeight: 500, fontSize: 19, letterSpacing: 7, color: GRIS }}>
            VITÁCORA FAMILIAR
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1920,
        fonts: fonts.length ? fonts : undefined,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }


  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          backgroundColor: "#FFFFFF", color: TINTA, padding: c ? "80px 96px 72px" : "110px 96px 90px", fontFamily: cuerpo,
        }}
      >
        {producto ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 32 }}>
            <div style={{ display: "flex", fontFamily: micro, fontWeight: 500, fontSize: 24, letterSpacing: 5, textTransform: "uppercase", color: DORADO }}>
              {producto.etiqueta(regalo.quienRegala)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 20, fontFamily: titulo, fontWeight: 500, fontSize: 64, lineHeight: 1.1 }}>
              {producto.titulo(regalo.comoLeDicen).map((linea) => <div key={linea} style={{ display: "flex" }}>{linea}</div>)}
            </div>
            <div style={{ display: "flex", width: 80, height: 2, backgroundColor: DORADO, marginTop: 24 }} />
          </div>
        ) : (
          <div style={{ display: "flex", fontFamily: titulo, fontWeight: 500, fontSize: 64 }}>{`${regalo.comoLeDicen},`}</div>
        )}
        <div
          style={{
            display: "flex", marginTop: c ? 0 : 32, fontFamily: titulo, fontStyle: "italic", fontWeight: 400,
            fontSize: tamanoMensaje, lineHeight: 1.45, whiteSpace: "pre-wrap",
          }}
        >
          {regalo.mensaje}
        </div>
        <div style={{ display: "flex", alignSelf: "flex-end", marginTop: c ? 16 : 28, fontFamily: titulo, fontStyle: "italic", fontSize: c ? 44 : 52 }}>
          {regalo.quienRegala}
        </div>

        <div style={{ display: "flex", height: 1, backgroundColor: TINTA, marginTop: c ? 36 : 56, marginBottom: c ? 36 : 56 }} />

        <div style={{ display: "flex", fontFamily: titulo, fontWeight: 500, fontSize: c ? 44 : 50 }}>{producto ? producto.queEsTitulo : textos.esUnRegalo}</div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 16, fontSize: c ? 30 : 34, lineHeight: 1.45 }}>
          {(producto ? producto.pasos : textos.explica).map((linea) => <div key={linea} style={{ display: "flex" }}>{linea}</div>)}
        </div>

        <div style={{ display: "flex", flex: 1 }} />

        <div
          style={{
            display: "flex", justifyContent: "center", textAlign: "center", marginTop: c ? 32 : 48, fontFamily: micro, fontWeight: 500,
            fontSize: 26, letterSpacing: 3.6, textTransform: "uppercase",
          }}
        >
          {textos.apunta}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori solo entiende <img> */}
        <img src={qr} alt="" width={c ? 340 : 420} height={c ? 340 : 420} style={{ alignSelf: "center", marginTop: 24 }} />
        {numero && (
          <div style={{ display: "flex", justifyContent: "center", textAlign: "center", marginTop: 20, fontSize: 28, lineHeight: 1.4 }}>
            {textos.respaldo(numeroSinCortes(numero.legible))}
          </div>
        )}
        <div
          style={{
            display: "flex", justifyContent: "center", marginTop: 28, border: `2px solid ${TINTA}`, padding: "14px 0 14px 10px",
            fontFamily: micro, fontWeight: 600, fontSize: 44, letterSpacing: 10,
          }}
        >
          {regalo.codigo}
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      fonts: fonts.length ? fonts : undefined,
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
