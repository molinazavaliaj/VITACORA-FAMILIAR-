import type { NextConfig } from "next";

// Rendimiento (docs/rediseno-2026-10/RENDIMIENTO.md §3.7): respuestas
// comprimidas y next/image sirviendo AVIF o WebP según lo que acepte el
// navegador. La región de las funciones NO va acá: la decide Naza (§3.5).
const nextConfig: NextConfig = {
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
