import { objectPosition, type Foco } from "@/lib/encuadre";
import { EYEBROW_HISTORIA, TEXTOS_TAPA, tamanoNombreTapa, type IdiomaLibro, type ProductoTapa } from "@/lib/tapa";
import { Toroide } from "./marca";

// La tapa del libro, como sale impresa (Naza, 13/10): la foto arriba a sangre,
// abajo «EL LIBRO DE SU VIDA», el nombre grande y al pie «para siempre» y la
// marca, con un lomo de tinta a la izquierda. Es la misma que arma la fábrica
// (fabrica/src/libro/plantilla-html.ts, construirPortada): si cambia una, cambia
// la otra. Se dibuja a cualquier tamaño: todo se mide en el ancho de la tapa (cqw).

export function TapaLibro({
  titulo,
  fotoSrc,
  foco,
  idioma = "es",
  gris = false,
  llenar = false,
  producto = "familiar",
  className = "",
}: {
  titulo: string;
  /** La URL de la foto de tapa. Sin foto, el toroide sobre tinta (como la fábrica). */
  fotoSrc: string | null;
  foco?: Foco;
  idioma?: IdiomaLibro;
  /** El impreso en blanco y negro: la foto se ve en gris, como se imprime. */
  gris?: boolean;
  /** Ocupa todo el alto del contenedor (la página de la miniatura) en vez de su propia proporción A5. */
  llenar?: boolean;
  /** Una historia lleva su propia línea de arriba del nombre («UNA HISTORIA DE SU VIDA»). */
  producto?: ProductoTapa;
  className?: string;
}) {
  const textos = producto === "historia" ? { ...TEXTOS_TAPA[idioma], eyebrow: EYEBROW_HISTORIA[idioma] } : TEXTOS_TAPA[idioma];
  return (
    <div className={`relative ${llenar ? "h-full" : "aspect-[148/210]"} w-full overflow-hidden bg-[#faf7f1] text-[#1c1917] [container-type:inline-size] ${className}`}>
      <div className="absolute inset-y-0 left-0 bg-[#1c1917]" style={{ width: "2.5cqw" }} />
      <div className="absolute right-0 top-0 h-[63%] overflow-hidden bg-[#1c1917]" style={{ left: "2.5cqw" }}>
        {fotoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fotoSrc} alt="" className={`h-full w-full object-cover ${gris ? "grayscale" : ""}`} style={{ objectPosition: objectPosition(foco) }} />
        ) : (
          <Toroide className="absolute left-1/2 top-1/2 h-auto -translate-x-1/2 -translate-y-1/2 text-[#faf7f1] opacity-55 [width:30cqw]" />
        )}
      </div>
      <div className="absolute bottom-0 right-0 top-[63%] flex flex-col" style={{ left: "2.5cqw", padding: "5.4cqw 7.2cqw" }}>
        <p className="uppercase text-[#57534e] [font-family:var(--fuente-micro)]" style={{ fontSize: "1.7cqw", letterSpacing: "0.3em" }}>
          {textos.eyebrow}
        </p>
        {/* Una palabra nunca se corta: si no entra, la letra se achica (como en la fábrica). */}
        <p className="max-w-[66%] [font-family:var(--fuente-titulo)] [text-wrap:balance]" style={{ marginTop: "2.5cqw", fontSize: `${tamanoNombreTapa(titulo)}cqw`, lineHeight: 1.06 }}>
          {titulo}
        </p>
        <div className="mt-auto flex items-center justify-between">
          <span className="italic [font-family:var(--fuente-titulo)]" style={{ fontSize: "2.7cqw", fontWeight: 500 }}>
            {textos.siempre}
          </span>
          <span className="flex items-center text-[#57534e] [font-family:var(--fuente-micro)]" style={{ gap: "1.4cqw", fontSize: "1.6cqw", letterSpacing: "0.22em" }}>
            <Toroide className="h-auto [width:5.7cqw]" />
            V·F
          </span>
        </div>
      </div>
    </div>
  );
}
