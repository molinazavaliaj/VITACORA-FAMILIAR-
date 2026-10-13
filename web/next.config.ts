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
const PUBLICAS_POR_PAIS = ["/", "/comprar", "/comprar/viaje", "/ejemplo", "/regalar"];

const nextConfig: NextConfig = {
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return PUBLICAS_POR_PAIS.map((camino) => ({
      source: camino,
      destination: camino === "/" ? "/ar" : `/ar${camino}`,
      permanent: false,
      missing: [
        { type: "header" as const, key: "x-vercel-ip-country", value: EUROPA },
        { type: "cookie" as const, key: "idioma" },
      ],
    }));
  },
};

export default nextConfig;
