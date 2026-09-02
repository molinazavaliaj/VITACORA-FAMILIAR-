import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente Supabase atado a la sesión del usuario (cookies), para usar en
// Server Components, Server Actions y Route Handlers.
//
// El middleware (src/middleware.ts) es el que refresca el token en cada
// request — ahí sí se pueden escribir cookies. Este helper solo necesita
// leerlas. El intento de escritura queda envuelto en try/catch porque en
// render de RSC no se pueden escribir cookies; el middleware se encarga
// del refresh.
export async function crearClienteSesion() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // en render de RSC no se pueden escribir cookies; el middleware se encarga del refresh
          }
        },
      },
    },
  );
}
