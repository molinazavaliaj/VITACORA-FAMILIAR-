import { NextResponse } from "next/server";
import { queVende } from "@/lib/que-vende";

// Qué vende hoy la web, por producto e idioma (lib/que-vende.ts). Lo lee el bot para comprobar que tiene las
// plantillas de Meta de todo lo que se vende. Público: es lo mismo que muestra la web.

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(queVende(), { headers: { "Cache-Control": "no-store" } });
}
