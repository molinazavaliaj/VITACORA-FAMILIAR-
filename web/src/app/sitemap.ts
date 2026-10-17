import type { MetadataRoute } from "next";
import { entradasSitemap } from "@/lib/sitemap";

// /sitemap.xml. Qué entra y por qué: lib/sitemap.ts.
export default function sitemap(): MetadataRoute.Sitemap {
  return entradasSitemap();
}
