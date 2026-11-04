import type { MetadataRoute } from "next";
import { IDIOMAS_WEB, ruta, type IdiomaWeb } from "@/lib/idioma-web";
import { OPINIONES, hayOpiniones, type Opinion } from "@/lib/opiniones";
import { URL_BASE as BASE } from "@/lib/seo";
import { RUTAS_LANDING } from "../app/_textos/landings";

// Las entradas de /sitemap.xml (app/sitemap.ts; rediseño 2026-10). No existía: se agregó con la página de
// opiniones, que entra solo cuando tiene al menos tres opiniones reales
// (lib/opiniones.ts). Lleva lo que se vende hoy y se puede buscar, en las tres
// versiones: la portada, el libro de ejemplo, Viaje, Eventos y las landings
// (04/11, con OK de Naza). Kids e Historia entran cuando se vendan; la compra,
// /colabora y el cuaderno no entran. Estático.

const CAMINOS_FIJOS = ["/", "/ejemplo", "/eventos", "/viaje"] as const;

export function entradasSitemap(opiniones: readonly Opinion[] = OPINIONES): MetadataRoute.Sitemap {
  const caminos: string[] = [...CAMINOS_FIJOS];
  if (hayOpiniones(opiniones)) caminos.push("/opiniones");
  // Una landing puede cambiar de camino según el idioma (/ar/regalo-para-tu-papa).
  const paginas: Record<IdiomaWeb, string>[] = [
    ...caminos.map((camino) => ({ es: camino, ca: camino, ar: camino })),
    ...Object.values(RUTAS_LANDING),
  ];
  return paginas.flatMap((pagina) =>
    IDIOMAS_WEB.map((idioma) => ({
      url: `${BASE}${ruta(idioma, pagina[idioma])}`,
      alternates: {
        languages: {
          "es-ES": `${BASE}${ruta("es", pagina.es)}`,
          "ca-ES": `${BASE}${ruta("ca", pagina.ca)}`,
          "es-AR": `${BASE}${ruta("ar", pagina.ar)}`,
        },
      },
    })),
  );
}
