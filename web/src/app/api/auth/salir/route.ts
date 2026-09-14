import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";

// Cerrar sesión: borra las cookies de Supabase y vuelve a la landing. Es un
// GET a propósito (un link en el sidebar, sin JavaScript); en un Route
// Handler sí se pueden escribir cookies.
export async function GET(request: NextRequest) {
  const supabase = await crearClienteSesion();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url));
}
