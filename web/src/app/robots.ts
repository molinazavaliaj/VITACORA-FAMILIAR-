import type { MetadataRoute } from "next";
import { reglasRobots } from "@/lib/seo";

// /robots.txt (18/10). Qué se bloquea y por qué: lib/seo.ts.
export default function robots(): MetadataRoute.Robots {
  return reglasRobots();
}
