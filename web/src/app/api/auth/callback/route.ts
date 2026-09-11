import { NextRequest, NextResponse } from "next/server";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { familiaDelUsuario } from "@/lib/familia";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

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

        // Sin familia: nunca compró. Con el pago por adelantado, la puerta es /comprar.
        const destino = familia ? "/tablero" : "/comprar";
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
