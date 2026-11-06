import type { PreguntaDePantalla } from "@/lib/dudas";
import type { IdiomaMiHistoria } from "@/lib/mi-historia-textos";
import { Marco } from "../../mis-respuestas/[token]/vista";
import { Gracias, PantallaDudas } from "./pantalla";

// El marco de las dudas de quien contó, sin consultas: para poder mostrarlo solo en /panel-muestra.

export function VistaDudas({ idioma, token, total, preguntas, linkLibro, muestra = false }: { idioma: IdiomaMiHistoria; token: string; total: number; preguntas: PreguntaDePantalla[]; linkLibro: string | null; muestra?: boolean }) {
  return (
    <Marco>
      <PantallaDudas idioma={idioma} token={token} total={total} preguntas={preguntas} linkLibro={linkLibro} muestra={muestra} />
    </Marco>
  );
}

export function VistaGracias({ idioma, linkLibro }: { idioma: IdiomaMiHistoria; linkLibro: string | null }) {
  return (
    <Marco>
      <Gracias idioma={idioma} linkLibro={linkLibro} />
    </Marco>
  );
}
