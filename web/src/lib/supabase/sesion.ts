import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente Supabase atado a la sesión del usuario (cookies), para usar en
// Server Components, Server Actions y Route Handlers.
//
// El proxy (src/proxy.ts) es el que refresca el token en cada request del
// panel — ahí sí se pueden escribir cookies. Este helper solo necesita
// leerlas. El intento de escritura queda envuelto en try/catch porque en
// render de RSC no se pueden escribir cookies; el proxy se encarga
// del refresh.
// Un solo cliente por request (fecha del regalo que no se guardaba a la
// primera, 19/10). Dos clientes de la misma request comparten las cookies: si
// el token venció, los dos lo renuevan a la vez, el primero escribe el nuevo
// en las cookies y auth-js descarta el del segundo («AuthRefreshDiscardedError:
// session state changed mid-flight»). Ese getUser() vuelve sin usuario y la
// API contesta 401 aunque la sesión esté bien; la vez siguiente anda porque el
// navegador ya tiene el token nuevo. La clave es el almacén de cookies de la
// request (uno por request en Next), así que nada se comparte entre visitas.
const clientesPorRequest = new WeakMap<object, ReturnType<typeof crearCliente>>();

function crearCliente(cookieStore: Awaited<ReturnType<typeof cookies>>) {
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
            // en render de RSC no se pueden escribir cookies; el proxy se encarga del refresh
          }
        },
      },
    },
  );
}

export async function crearClienteSesion() {
  const cookieStore = await cookies();
  // Sin un almacén de verdad (algunos tests lo simulan con nada), sin memoria.
  if (typeof cookieStore !== "object" || cookieStore === null) return crearCliente(cookieStore);
  let cliente = clientesPorRequest.get(cookieStore);
  if (!cliente) {
    cliente = crearCliente(cookieStore);
    clientesPorRequest.set(cookieStore, cliente);
  }
  return cliente;
}

/**
 * El usuario de la sesión, leído UNA vez por request. `getUser()` siempre va
 * al servidor de auth (no valida local): el layout del panel y la página lo
 * pedían cada uno por su lado y eran dos viajes iguales en serie
 * (docs/rediseno-2026-10/RENDIMIENTO.md §3.2). Con `cache` de React, dentro de
 * un mismo render de servidor la segunda llamada reusa la primera. Fuera de un
 * render (route handlers, tests) no memoriza: se comporta como antes.
 */
export const usuarioDeLaSesion = cache(async () => {
  const supabase = await crearClienteSesion();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
