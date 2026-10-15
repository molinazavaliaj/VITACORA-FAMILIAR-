import { ImageResponse } from "next/og";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { leerRegalo, numeroPublico } from "@/lib/regalo-datos";
import { qrDataUri, urlRegalo } from "@/lib/qr";
import { textosAbuelo } from "@/lib/regalo-textos";
import { largoEnTarjeta, numeroSinCortes } from "@/lib/regalo";

// La tarjeta del regalo como imagen vertical (1080 × 1920) para mandar por
// WhatsApp: el interior de la tarjeta en una columna. Negro sobre blanco.
// Si el regalo no existe o no se pagó, 404 (no revela nada).

const TINTA = "#14140F";

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

export async function GET(request: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  let crudo = codigo;
  try {
    crudo = decodeURIComponent(codigo);
  } catch {
    // Un % mal formado no es un código: leerRegalo lo descarta.
  }
  const regalo = await leerRegalo(crearClienteServidor(), crudo);
  if (!regalo) return new Response("No encontrado", { status: 404 });
  // Ya canjeado (Naza, 10/10): igual que la tarjeta, al tablero de quien compró.
  if (regalo.usado) return Response.redirect(new URL("/tablero", request.url), 303);
  const numero = numeroPublico();
  const [qr, fonts] = await Promise.all([qrDataUri(urlRegalo(regalo.codigo)), cargarFuentes()]);

  // Las frases de la tarjeta, en el idioma del abuelo.
  const textos = textosAbuelo(regalo.idioma);
  const titulo = "Playfair Display";
  const cuerpo = "Source Serif 4";
  const micro = "Archivo";
  const largo = largoEnTarjeta(regalo.mensaje);
  const tamanoMensaje = largo > 400 ? 32 : largo > 250 ? 38 : 46;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          backgroundColor: "#FFFFFF", color: TINTA, padding: "110px 96px 90px", fontFamily: cuerpo,
        }}
      >
        <div style={{ display: "flex", fontFamily: titulo, fontWeight: 500, fontSize: 64 }}>{`${regalo.comoLeDicen},`}</div>
        <div
          style={{
            display: "flex", marginTop: 32, fontFamily: titulo, fontStyle: "italic", fontWeight: 400,
            fontSize: tamanoMensaje, lineHeight: 1.45, whiteSpace: "pre-wrap",
          }}
        >
          {regalo.mensaje}
        </div>
        <div style={{ display: "flex", alignSelf: "flex-end", marginTop: 28, fontFamily: titulo, fontStyle: "italic", fontSize: 52 }}>
          {regalo.quienRegala}
        </div>

        <div style={{ display: "flex", height: 1, backgroundColor: TINTA, marginTop: 56, marginBottom: 56 }} />

        <div style={{ display: "flex", fontFamily: titulo, fontWeight: 500, fontSize: 50 }}>{textos.esUnRegalo}</div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 16, fontSize: 34, lineHeight: 1.45 }}>
          {textos.explica.map((linea) => <div key={linea} style={{ display: "flex" }}>{linea}</div>)}
        </div>

        <div style={{ display: "flex", flex: 1 }} />

        <div
          style={{
            display: "flex", justifyContent: "center", textAlign: "center", marginTop: 48, fontFamily: micro, fontWeight: 500,
            fontSize: 26, letterSpacing: 3.6, textTransform: "uppercase",
          }}
        >
          {textos.apunta}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori solo entiende <img> */}
        <img src={qr} alt="" width={420} height={420} style={{ alignSelf: "center", marginTop: 24 }} />
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
