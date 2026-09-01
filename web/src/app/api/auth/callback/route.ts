import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  try {
    if (code) {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              );
            },
          },
        },
      );

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data.user) {
        const admin = crearClienteServidor();
        const { data: familia, error: errorFamilia } = await admin
          .from("familias")
          .select("id")
          .eq("auth_user_id", data.user.id)
          .maybeSingle();

        if (errorFamilia) {
          console.error(
            "callback auth: fallo la consulta de familias",
            errorFamilia,
          );
        }

        const destino = familia ? "/tablero" : "/registro";
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
