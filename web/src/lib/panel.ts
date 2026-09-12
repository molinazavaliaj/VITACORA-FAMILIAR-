import type { SupabaseClient } from "@supabase/supabase-js";
import { familiaDelUsuario, type FamiliaResumen } from "./familia";

// Quién ve qué en el panel (docs/panel-usuario.md §2).
//
// Una "historia" es un narrador. Un usuario puede verla por dos caminos:
//   - es la DUEÑA: el narrador pertenece a su familia (la compró), o
//   - es INVITADO: alguien la invitó a esa historia (tabla `invitados`, hasta 3).
// Todo lo que decide permisos en el panel pasa por acá, para que la regla
// viva en un solo lugar y no repartida por las páginas.

export type Rol = "duena" | "invitado";

export type NarradorPanel = {
  id: string;
  nombre: string;
  como_le_dicen: string;
  estado: string;
  dia_actual: number;
  alerta_silencio: boolean;
  familia_id: string;
  created_at: string;
};

export type Historia = { narrador: NarradorPanel; rol: Rol };

export type Panel = { familia: FamiliaResumen | null; historias: Historia[] };

const CAMPOS_NARRADOR =
  "id, nombre, como_le_dicen, estado, dia_actual, alerta_silencio, familia_id, created_at";

type Usuario = { id: string; email?: string | null };

/**
 * Las invitaciones de este usuario: las que ya tienen su auth_user_id y las
 * que le llegaron por mail y todavía no abrió. Esas últimas se vinculan acá,
 * la primera vez que entra — el mismo criterio que lib/familia.ts.
 *
 * Tolerante a que la tabla no exista todavía: la migración 20260912 la crea y
 * la confirma Naza. Mientras tanto, el panel funciona sin invitados.
 */
async function narradoresInvitados(admin: SupabaseClient, user: Usuario): Promise<string[]> {
  const { data: propias, error: errorPropias } = await admin
    .from("invitados")
    .select("narrador_id")
    .eq("auth_user_id", user.id);

  if (errorPropias) {
    console.warn("panel: no se pudieron leer los invitados (¿falta la migración?)", errorPropias.message);
    return [];
  }

  const ids = new Set(((propias as { narrador_id: string }[] | null) ?? []).map((i) => i.narrador_id));

  if (user.email) {
    const { data: pendientes } = await admin
      .from("invitados")
      .select("id, narrador_id")
      .ilike("email", user.email)
      .is("auth_user_id", null);

    for (const inv of (pendientes as { id: string; narrador_id: string }[] | null) ?? []) {
      await admin
        .from("invitados")
        .update({ auth_user_id: user.id, aceptado_at: new Date().toISOString() })
        .eq("id", inv.id)
        .is("auth_user_id", null);
      ids.add(inv.narrador_id);
    }
  }

  return [...ids];
}

/** Todas las historias que ve el usuario: primero las suyas, después las compartidas. */
export async function historiasDelUsuario(
  admin: SupabaseClient,
  user: Usuario,
): Promise<{ panel: Panel; error: string | null }> {
  const vacio: Panel = { familia: null, historias: [] };

  const { familia, error: errorFamilia } = await familiaDelUsuario(admin, user);
  if (errorFamilia) return { panel: vacio, error: errorFamilia };

  const historias: Historia[] = [];

  if (familia) {
    const { data, error } = await admin
      .from("narradores")
      .select(CAMPOS_NARRADOR)
      .eq("familia_id", familia.id)
      .order("created_at", { ascending: false });
    if (error) return { panel: vacio, error: error.message };
    for (const n of (data as NarradorPanel[] | null) ?? []) historias.push({ narrador: n, rol: "duena" });
  }

  const idsInvitados = (await narradoresInvitados(admin, user)).filter(
    (id) => !historias.some((h) => h.narrador.id === id),
  );
  if (idsInvitados.length > 0) {
    const { data, error } = await admin
      .from("narradores")
      .select(CAMPOS_NARRADOR)
      .in("id", idsInvitados)
      .order("created_at", { ascending: false });
    if (error) return { panel: vacio, error: error.message };
    for (const n of (data as NarradorPanel[] | null) ?? []) historias.push({ narrador: n, rol: "invitado" });
  }

  return { panel: { familia, historias }, error: null };
}

/**
 * ¿Este usuario puede ver esta historia, y con qué rol? Null si no.
 * Es lo que usan las páginas de una historia y los endpoints que sirven sus datos.
 */
export async function historiaAccesible(
  admin: SupabaseClient,
  user: Usuario,
  narradorId: string,
): Promise<{ historia: Historia | null; error: string | null }> {
  const { data: narrador, error: errorNarrador } = await admin
    .from("narradores")
    .select(CAMPOS_NARRADOR)
    .eq("id", narradorId)
    .maybeSingle();
  if (errorNarrador) return { historia: null, error: errorNarrador.message };
  if (!narrador) return { historia: null, error: null };

  const n = narrador as NarradorPanel;

  const { familia, error: errorFamilia } = await familiaDelUsuario(admin, user);
  if (errorFamilia) return { historia: null, error: errorFamilia };
  if (familia && n.familia_id === familia.id) return { historia: { narrador: n, rol: "duena" }, error: null };

  const invitados = await narradoresInvitados(admin, user);
  if (invitados.includes(n.id)) return { historia: { narrador: n, rol: "invitado" }, error: null };

  return { historia: null, error: null };
}

/** Lo que cada rol puede hacer. Una sola tabla, la misma que docs/panel-usuario.md §2. */
export const PUEDE = {
  editarGuion: (rol: Rol) => rol === "duena",
  agregarPreguntasYFotos: (_rol: Rol) => true,
  cambiarRitmo: (rol: Rol) => rol === "duena",
  invitar: (rol: Rol) => rol === "duena",
  cerrarLibro: (rol: Rol) => rol === "duena",
  descargar: (rol: Rol) => rol === "duena",
  verLoQuePago: (rol: Rol) => rol === "duena",
} as const;

// ── Para las rutas de API ─────────────────────────────────────────────

type ClienteSesion = { auth: { getUser(): Promise<{ data: { user: Usuario | null }; error: unknown }> } };

export type NarradorDeSesion =
  | { ok: true; narrador: NarradorPanel; rol: Rol; user: Usuario }
  | { ok: false; status: number; error: string };

/**
 * Qué narrador está pidiendo esta request, y si puede.
 *
 * Las rutas de API antes tomaban "el primer narrador de la familia" (un solo
 * libro por cuenta). Con varias historias y con invitados, el cliente dice cuál
 * con `?narrador=<id>`. Si no lo dice, se toma la primera historia que ve el
 * usuario, para no romper a los clientes viejos.
 */
export async function narradorDeLaSesion(
  sesion: ClienteSesion,
  admin: SupabaseClient,
  params: URLSearchParams | null,
  opciones: { soloDuena?: boolean; mensajeError?: string } = {},
): Promise<NarradorDeSesion> {
  const {
    data: { user },
    error: errorSesion,
  } = await sesion.auth.getUser();
  if (errorSesion || !user) return { ok: false, status: 401, error: "No hay sesión activa." };

  const generico = opciones.mensajeError ?? "No pudimos completar la acción. Intenta de nuevo.";
  const pedido = params?.get("narrador");

  let historia: Historia | null = null;
  if (pedido) {
    const r = await historiaAccesible(admin, user, pedido);
    if (r.error) {
      console.error("narradorDeLaSesion: fallo el acceso", r.error);
      return { ok: false, status: 500, error: generico };
    }
    historia = r.historia;
    if (!historia) return { ok: false, status: 403, error: "No autorizado." };
  } else {
    const r = await historiasDelUsuario(admin, user);
    if (r.error) {
      console.error("narradorDeLaSesion: fallo la carga", r.error);
      return { ok: false, status: 500, error: generico };
    }
    historia = r.panel.historias[0] ?? null;
    if (!historia) {
      // Sin familia ni invitaciones: este mail nunca compró nada → no autorizado.
      // Con familia pero sin narradores: todavía no hay historia → no encontrado.
      return r.panel.familia
        ? { ok: false, status: 404, error: "Todavía no hay una historia para esta cuenta." }
        : { ok: false, status: 403, error: "No autorizado." };
    }
  }

  if (opciones.soloDuena && historia.rol !== "duena") {
    return { ok: false, status: 403, error: "Solo quien compró el libro puede hacer esto." };
  }

  return { ok: true, narrador: historia.narrador, rol: historia.rol, user };
}
