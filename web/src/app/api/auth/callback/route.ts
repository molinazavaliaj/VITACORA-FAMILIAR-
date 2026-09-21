import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { familiaDelUsuario } from "@/lib/familia";
import { destinoSeguro } from "@/lib/destino";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const volver = searchParams.get("volver");

  try {
    if (code) {
      const supabase = await crearClienteSesion();

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data.user) {
        const { familia, error: errorFamilia } = await familiaDelUsuario(
          crearClienteServidor(),
          data.user,
        );

        if (errorFamilia) {
          console.error("callback auth: fallo la consulta de familias", errorFamilia);
        }

        // Con `volver`, el que ya entró vuelve a donde iba —el panel de la empresa,
        // por ejemplo— aunque nunca haya comprado: el carrito no es su destino.
        // Sin `volver` manda lo de siempre: sin familia nunca compró → /comprar.
        const destino = destinoSeguro(volver, familia ? "/tablero" : "/comprar");
        return NextResponse.redirect(`${origin}${destino}`);
      }

      if (error) {
        console.error("callback auth: fallo exchangeCodeForSession", error);
      }
    }
  } catch (excepcion) {
    console.error("callback auth: excepcion no controlada", excepcion);
  }

  return NextResponse.redirect(`${origin}/entrar?error=auth`);
}
