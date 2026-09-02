import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refresca la sesión de Supabase en cada request a una página que la
// necesita. Esto es lo único que puede escribir cookies fuera de un Server
// Action o Route Handler — por eso las páginas y route handlers usan
// crearClienteSesion() (src/lib/supabase/sesion.ts), que solo lee cookies y
// envuelve la escritura en try/catch por si el refresh ya se hizo acá.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/tablero/:path*", "/registro", "/comprar", "/entrar"],
};
