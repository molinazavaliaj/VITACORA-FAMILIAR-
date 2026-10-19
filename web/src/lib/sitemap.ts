import type { MetadataRoute } from "next";
import { IDIOMAS_WEB, ruta } from "@/lib/idioma-web";
import { OPINIONES, hayOpiniones, type Opinion } from "@/lib/opiniones";

// Las entradas de /sitemap.xml (app/sitemap.ts; rediseño 2026-10). No existía: se agregó con la página de
// opiniones, que entra solo cuando tiene al menos tres opiniones reales
// (lib/opiniones.ts). Lleva lo público seguro (la portada y el libro de
// ejemplo, en las tres versiones); el resto de pantallas se suma cuando se
// decida cuáles van. Estático.

const BASE = "https://www.vitacorafamiliar.com";

const CAMINOS_FIJOS = ["/", "/ejemplo", "/eventos"] as const;

export function entradasSitemap(opiniones: readonly Opinion[] = OPINIONES): MetadataRoute.Sitemap {
  const caminos: string[] = [...CAMINOS_FIJOS];
  if (hayOpiniones(opiniones)) caminos.push("/opiniones");
  return caminos.flatMap((camino) =>
    IDIOMAS_WEB.map((idioma) => ({
      url: `${BASE}${ruta(idioma, camino)}`,
      alternates: {
        languages: {
          "es-ES": `${BASE}${ruta("es", camino)}`,
          "ca-ES": `${BASE}${ruta("ca", camino)}`,
          "es-AR": `${BASE}${ruta("ar", camino)}`,
        },
      },
    })),
  );
}
