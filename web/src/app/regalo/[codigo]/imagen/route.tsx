import { crearClienteServidor } from "@/lib/supabase/servidor";
import { leerRegalo, numeroPublico } from "@/lib/regalo-datos";
import { imagenDelRegalo } from "./dibujo";

// La tarjeta del regalo como imagen para WhatsApp. Lo que se dibuja vive en
// dibujo.tsx (sin base); acá se lee el regalo.
// Si el regalo no existe o no se pagó, 404 (no revela nada).

export async function GET(request: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  let crudo = codigo;
  try {
    crudo = decodeURIComponent(codigo);
  } catch {
    // Un % mal formado no es un código: leerRegalo lo descarta.
  }
  const regalo = await leerRegalo(crearClienteServidor(), crudo);
  if (!regalo) return new Response("No encontrado", { status: 404 });
  // Ya canjeado (Naza, 10/10): igual que la tarjeta, al tablero de quien compró.
  if (regalo.usado) return Response.redirect(new URL("/tablero", request.url), 303);
  return imagenDelRegalo(regalo, numeroPublico());
}
