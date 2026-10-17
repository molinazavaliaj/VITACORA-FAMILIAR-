import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { pideSesion, rutaDeEntrada } from "@/lib/destino";

// El proxy de Next 16 (antes middleware.ts: Next 16 renombró la convención y
// el export, docs de next/dist/docs/01-app/01-getting-started/16-proxy.md).
//
// Refresca la sesión de Supabase en cada request a una página que la
// necesita. Esto es lo único que puede escribir cookies fuera de un Server
// Action o Route Handler — por eso las páginas y route handlers usan
// crearClienteSesion() (src/lib/supabase/sesion.ts), que solo lee cookies y
// envuelve la escritura en try/catch por si el refresh ya se hizo acá.
//
// Además, sin sesión, las rutas del panel no se renderizan: la visita va a
// /entrar y VUELVE a donde iba (`?volver=`). Sin eso, alguien que entra a
// /admin aterrizaba en el carrito: /entrar caía en su destino de siempre
// (/tablero) y el tablero de un admin que nunca compró manda a /comprar
// (hallazgo de Naza probando producción, 2026-09-21).
export async function proxy(request: NextRequest) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  if (!user && pideSesion(pathname)) {
    const redireccion = NextResponse.redirect(
      new URL(rutaDeEntrada(`${pathname}${search}`), request.url),
    );
    // El refresh que acaba de hacer getUser() viaja en el redirect: si no, el
    // token recién renovado se perdería en el salto a /entrar.
    for (const cookie of response.cookies.getAll()) redireccion.cookies.set(cookie);
    return redireccion;
  }

  return response;
}

// Solo las rutas que piden sesión (lib/destino.ts, pideSesion). /comprar y
// /entrar no la leen en el servidor: pasar por acá era un getUser() de más en
// el checkout (RENDIMIENTO.md §2.9 y §3.9). /entrar tampoco redirigía a quien
// ya entró, así que no se pierde nada.
export const config = {
  matcher: ["/tablero/:path*", "/admin/:path*"],
};
