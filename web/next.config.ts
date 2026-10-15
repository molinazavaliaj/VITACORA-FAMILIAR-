import type { NextConfig } from "next";
import { PAISES_EUROPA } from "./src/lib/region";

// Rendimiento (docs/rediseno-2026-10/RENDIMIENTO.md §3.7): respuestas
// comprimidas y next/image sirviendo AVIF o WebP según lo que acepte el
// navegador. La región de las funciones está en vercel.json: dub1 (Dublín),
// al lado de la base de Supabase (eu-west-1, Irlanda; Naza 13/10, §3.5).
//
// Idioma por país (DECISIONES.md D2, RENDIMIENTO.md §3.10 opción c): las
// pantallas públicas son estáticas y tienen una ruta por versión (/, /ca, /ar).
// Quien llega a la versión de España desde fuera de Europa va a la de
// Argentina, igual que antes decidía `regionDelRequest`. Lo hace el CDN de
// Vercel con la cabecera del país, sin arrancar ninguna función. Si la persona
// eligió idioma a mano (cookie `idioma`, lib/idioma-web.ts), no se la mueve.
const EUROPA = `^(${PAISES_EUROPA.join("|")})$`;
const PUBLICAS_POR_PAIS = ["/", "/comprar", "/comprar/viaje", "/comprar/kids", "/ejemplo", "/regalar", "/viaje", "/kids"];
// Las landings de anuncio (fase 4) también, con su ruta de Argentina (la de
// regalo dice «papá»). El anuncio ya apunta a la de su país; esto es por si
// alguien comparte el enlace de España con alguien de afuera.
const LANDINGS_POR_PAIS: ReadonlyArray<readonly [string, string]> = [
  ["/regalo-para-tu-padre", "/ar/regalo-para-tu-papa"],
  ["/lo-que-nunca-le-preguntaste", "/ar/lo-que-nunca-le-preguntaste"],
  ["/su-voz", "/ar/su-voz"],
  ["/el-libro-del-viaje", "/ar/el-libro-del-viaje"],
  ["/kids/su-mundo", "/ar/kids/su-mundo"],
  ["/kids/a-los-once", "/ar/kids/a-los-once"],
];

const nextConfig: NextConfig = {
  compress: true,
  // El chequeo de tipos del build deja afuera test/: algunos tests importan de
  // ../entrevistador, que no existe cuando Vercel construye solo web/ (preview).
  // Los tests se chequean con vitest y con `npx tsc --noEmit` (tsconfig.json).
  typescript: { tsconfigPath: "tsconfig.build.json" },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    const pares: Array<readonly [string, string]> = [
      ...PUBLICAS_POR_PAIS.map((camino) => [camino, camino === "/" ? "/ar" : `/ar${camino}`] as const),
      ...LANDINGS_POR_PAIS,
    ];
    return pares.map(([source, destination]) => ({
      source,
      destination,
      permanent: false,
      missing: [
        { type: "header" as const, key: "x-vercel-ip-country", value: EUROPA },
        { type: "cookie" as const, key: "idioma" },
      ],
    }));
  },
};

export default nextConfig;
