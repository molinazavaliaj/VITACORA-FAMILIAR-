import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { familiaDelUsuario, type FamiliaResumen } from "./familia";

// Quién ve qué en el panel (docs/panel-usuario.md §2).
//
// Una "historia" es un narrador. Un usuario puede verla por dos caminos:
//   - es la DUEÑA: el narrador pertenece a su familia (la compró), o
//   - es INVITADO: alguien la invitó a esa historia (tabla `invitados`, hasta 3).
// Todo lo que decide permisos en el panel pasa por acá, para que la regla
// viva en un solo lugar y no repartida por las páginas.

// duena:     compró. Ve y puede todo.
// invitado:  la dueña lo invitó con el libro abierto. Ve todo, suma preguntas y fotos.
// visitante: abrió el link del libro cerrado y lo guardó. Ve la muestra, compra su copia.
export type Rol = "duena" | "invitado" | "visitante";

export type NarradorPanel = {
  id: string;
  nombre: string;
  como_le_dicen: string;
  estado: string;
  dia_actual: number;
  alerta_silencio: boolean;
  familia_id: string;
  created_at: string;
  /** `vinculoComprador`, y lo que el biógrafo le mandó de verdad (`preguntasEnviadas`, `repreguntasEnviadas`). */
  contexto?: Record<string, unknown> | null;
};

export type Historia = { narrador: NarradorPanel; rol: Rol };

export type Panel = { familia: FamiliaResumen | null; historias: Historia[] };

const CAMPOS_NARRADOR =
  "id, nombre, como_le_dicen, estado, dia_actual, alerta_silencio, familia_id, created_at, contexto";

/** El libro es del mismo que compra ("para mí" en el checkout): el panel le habla de vos, no de él. */
export function esPropia(narrador: { contexto?: Record<string, unknown> | null }): boolean {
  return (narrador.contexto as { vinculoComprador?: unknown } | null | undefined)?.vinculoComprador === "yo mismo";
}

type Usuario = { id: string; email?: string | null };

/**
 * Las invitaciones de este usuario: las que ya tienen su auth_user_id y las
 * que le llegaron por mail y todavía no abrió. Esas últimas se vinculan acá,
 * la primera vez que entra — el mismo criterio que lib/familia.ts.
 *
 * Tolerante a que la tabla no exista todavía: la migración 20260912 la crea y
 * la confirma Naza. Mientras tanto, el panel funciona sin invitados.
 */
type Invitacion = { narrador_id: string; rol?: string | null };

/** El rol de una fila de invitados; sin la columna (migración 20260913 sin aplicar), invitado. */
function rolDe(fila: Invitacion): Exclude<Rol, "duena"> {
  return fila.rol === "visitante" ? "visitante" : "invitado";
}

type RolesInvitado = Map<string, Exclude<Rol, "duena">>;
type ResultadoPanel = { panel: Panel; error: string | null };

// Una memoria por request y por usuario, igual que familiaDelUsuario
// (lib/familia.ts): la clave es id + mail (texto), porque `cache` compara por
// identidad y el cliente admin y el user cambian de objeto en cada página. El
// layout del panel y la página comparten así una sola carga de historias.
// Fuera de un render de servidor no memoriza nada.
const memoriaPanel = cache(
  (_userId: string, _email: string | null): { invitados?: Promise<RolesInvitado>; historias?: Promise<ResultadoPanel> } => ({}),
);

function memoriaDe(user: Usuario) {
  return memoriaPanel(user.id, user.email ?? null);
}

function narradoresInvitados(admin: SupabaseClient, user: Usuario): Promise<RolesInvitado> {
  const memoria = memoriaDe(user);
  memoria.invitados ??= buscarInvitados(admin, user);
  return memoria.invitados;
}

async function buscarInvitados(admin: SupabaseClient, user: Usuario): Promise<RolesInvitado> {
  const roles = new Map<string, Exclude<Rol, "duena">>();

  const { data: propias, error: errorPropias } = await admin
    .from("invitados")
    .select("narrador_id, rol")
    .eq("auth_user_id", user.id);

  if (errorPropias) {
    console.warn("panel: no se pudieron leer los invitados (¿falta la migración?)", errorPropias.message);
    return roles;
  }
  for (const i of (propias as Invitacion[] | null) ?? []) roles.set(i.narrador_id, rolDe(i));

  if (user.email) {
    const { data: pendientes } = await admin
      .from("invitados")
      .select("id, narrador_id, rol")
      .ilike("email", user.email)
      .is("auth_user_id", null);

    for (const inv of (pendientes as (Invitacion & { id: string })[] | null) ?? []) {
      await admin
        .from("invitados")
        .update({ auth_user_id: user.id, aceptado_at: new Date().toISOString() })
        .eq("id", inv.id)
        .is("auth_user_id", null);
      roles.set(inv.narrador_id, rolDe(inv));
    }
  }

  return roles;
}

/** Todas las historias que ve el usuario: primero las suyas, después las compartidas. */
export function historiasDelUsuario(admin: SupabaseClient, user: Usuario): Promise<ResultadoPanel> {
  const memoria = memoriaDe(user);
  memoria.historias ??= cargarHistorias(admin, user);
  return memoria.historias;
}

async function cargarHistorias(admin: SupabaseClient, user: Usuario): Promise<ResultadoPanel> {
  const vacio: Panel = { familia: null, historias: [] };

  // Familia e invitaciones no dependen una de la otra: van juntas
  // (RENDIMIENTO.md §3.4). Antes eran cuatro rondas en serie (familia →
  // sus narradores → invitados → los narradores invitados); ahora son dos.
  const [{ familia, error: errorFamilia }, roles] = await Promise.all([
    familiaDelUsuario(admin, user),
    narradoresInvitados(admin, user),
  ]);
  if (errorFamilia) return { panel: vacio, error: errorFamilia };

  // Las dos consultas de narradores, también juntas. Un narrador de su familia
  // al que además la invitaron cuenta una sola vez, como dueña: se descarta de
  // la lista de invitados (antes se filtraba por id contra las propias; es lo mismo).
  const idsInvitados = [...roles.keys()];
  const [propias, invitadas] = await Promise.all([
    familia
      ? admin.from("narradores").select(CAMPOS_NARRADOR).eq("familia_id", familia.id).order("created_at", { ascending: false })
      : null,
    idsInvitados.length > 0
      ? admin.from("narradores").select(CAMPOS_NARRADOR).in("id", idsInvitados).order("created_at", { ascending: false })
      : null,
  ]);

  const historias: Historia[] = [];
  if (propias) {
    if (propias.error) return { panel: vacio, error: propias.error.message };
    for (const n of (propias.data as NarradorPanel[] | null) ?? []) historias.push({ narrador: n, rol: "duena" });
  }
  if (invitadas) {
    if (invitadas.error) return { panel: vacio, error: invitadas.error.message };
    for (const n of (invitadas.data as NarradorPanel[] | null) ?? []) {
      if (familia && n.familia_id === familia.id) continue;
      historias.push({ narrador: n, rol: roles.get(n.id) ?? "invitado" });
    }
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
  // Primero, el panel ya cargado (RENDIMIENTO.md §3.3): en una página del
  // tablero el layout lo pide en el mismo request y queda en la memoria de
  // historiasDelUsuario, así que la respuesta sale sin ir a la base. El panel
  // tiene la misma regla que abajo (las de su familia como dueña, las invitadas
  // con su rol): si la historia está, el rol es el mismo. Si no está o la carga
  // falló, se consulta como antes.
  //
  // Solo dentro de un render de servidor, donde hay memoria por request (dos
  // pedidos a memoriaDe devuelven el mismo objeto). En un route handler no hay
  // memoria y cargar el panel entero sería más caro que estas tres consultas.
  if (memoriaDe(user) === memoriaDe(user)) {
    const { panel, error: errorPanel } = await historiasDelUsuario(admin, user);
    if (!errorPanel) {
      const delPanel = panel.historias.find((h) => h.narrador.id === narradorId);
      if (delPanel) return { historia: delPanel, error: null };
    }
  }

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

  const roles = await narradoresInvitados(admin, user);
  const rol = roles.get(n.id);
  if (rol) return { historia: { narrador: n, rol }, error: null };

  return { historia: null, error: null };
}

/**
 * El trato (usted/vos) se fija solo antes de la primera pregunta: con la
 * invitación mandada, aceptada, o con el regalo pagado y sin abrir todavía.
 */
export function tratoEditable(n: { estado: string; dia_actual: number }): boolean {
  return n.dia_actual === 0 && ["regalo_pendiente", "invitado", "acepto"].includes(n.estado);
}

/** Lo que cada rol puede hacer. Una sola tabla, la misma que docs/panel-usuario.md §2. */
export const PUEDE = {
  editarGuion: (rol: Rol) => rol === "duena",
  agregarPreguntasYFotos: (rol: Rol) => rol !== "visitante",
  verHistoriaCompleta: (rol: Rol) => rol !== "visitante", // el visitante ve la muestra
  cambiarRitmo: (rol: Rol) => rol === "duena",
  invitar: (rol: Rol) => rol === "duena",
  cerrarLibro: (rol: Rol) => rol === "duena",
  /** Contestar las dudas del escritor V3: los invitados también, son los que saben los datos. */
  contestarDudas: (rol: Rol) => rol !== "visitante",
  /** Leer el libro terminado y escuchar su voz (antes: descargar). */
  descargar: (rol: Rol) => rol === "duena",
  verLoQuePago: (rol: Rol) => rol === "duena",
  comprarCopia: (_rol: Rol) => true,
} as const;

// ── Para las rutas de API ─────────────────────────────────────────────

type ClienteSesion = { auth: { getUser(): Promise<{ data: { user: Usuario | null }; error: unknown }> } };

/** El error de auth-js cuando descarta una renovación del token porque otra le ganó. */
export function refrescoDescartado(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { name?: unknown }).name === "AuthRefreshDiscardedError";
}

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
  let {
    data: { user },
    error: errorSesion,
  } = await sesion.auth.getUser();
  // El token vencido se renovó dos veces a la vez y auth-js descartó una
  // («AuthRefreshDiscardedError», la fecha del regalo que no se guardaba a la
  // primera, 19/10): la otra ya dejó el token nuevo en las cookies, así que
  // una segunda lectura encuentra la sesión.
  if (refrescoDescartado(errorSesion)) {
    ({ data: { user }, error: errorSesion } = await sesion.auth.getUser());
  }
  if (errorSesion || !user) return { ok: false, status: 401, error: "No hay sesión activa." };

  const generico = opciones.mensajeError ?? "No pudimos completar la acción. Intentá de nuevo.";
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
