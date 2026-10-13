import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

// La familia de un usuario logueado.
//
// Con el pago por adelantado (11/09) la familia nace en la compra, con el
// correo de la compradora y SIN usuario de auth: nadie se registra antes de
// pagar. El usuario lo crea el login por código la primera vez que entra, y
// en ese momento hay que unir los dos: la familia que tiene ese correo y
// todavía no tiene dueño pasa a ser suya.
//
// Se vincula por correo y solo si la familia no tiene dueño todavía: una
// familia ya vinculada nunca cambia de usuario por acá.

export type FamiliaResumen = { id: string; region: "ES" | "AR" };

type ResultadoFamilia = { familia: FamiliaResumen | null; error: string | null };

// Una memoria por request y por usuario (RENDIMIENTO.md §3.2). `cache` de React
// compara los argumentos por identidad: la clave son el id y el mail (texto), no
// el cliente admin ni el objeto user, que cada página crea de nuevo. Dentro del
// mismo render la primera llamada guarda su promesa y las demás la reusan; fuera
// de un render (route handlers, tests) `cache` no memoriza y cada llamada consulta.
const memoriaFamilia = cache((_userId: string, _email: string | null): { familia?: Promise<ResultadoFamilia> } => ({}));

export function familiaDelUsuario(
  admin: SupabaseClient,
  user: { id: string; email?: string | null },
): Promise<ResultadoFamilia> {
  const memoria = memoriaFamilia(user.id, user.email ?? null);
  memoria.familia ??= buscarFamilia(admin, user);
  return memoria.familia;
}

async function buscarFamilia(
  admin: SupabaseClient,
  user: { id: string; email?: string | null },
): Promise<ResultadoFamilia> {
  const { data: propia, error: errorPropia } = await admin
    .from("familias")
    .select("id, region")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (errorPropia) return { familia: null, error: errorPropia.message };
  if (propia) return { familia: propia as FamiliaResumen, error: null };

  if (!user.email) return { familia: null, error: null };

  const { data: huerfana, error: errorHuerfana } = await admin
    .from("familias")
    .select("id, region")
    .ilike("email", user.email)
    .is("auth_user_id", null)
    .maybeSingle();
  if (errorHuerfana) return { familia: null, error: errorHuerfana.message };
  if (!huerfana) return { familia: null, error: null };

  const { error: errorVinculo } = await admin
    .from("familias")
    .update({ auth_user_id: user.id })
    .eq("id", (huerfana as FamiliaResumen).id)
    .is("auth_user_id", null);
  if (errorVinculo) return { familia: null, error: errorVinculo.message };

  return { familia: huerfana as FamiliaResumen, error: null };
}
