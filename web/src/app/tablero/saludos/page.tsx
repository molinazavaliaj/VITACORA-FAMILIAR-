import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { firmarTokenSaludo } from "@/lib/token-saludo";
import { EnlaceCompartir, ListaSaludos } from "./acciones";

const MENSAJE_ERROR_CARGA = "No pudimos cargar los saludos. Actualiza la página en un momento.";

type Narrador = {
  id: string;
  como_le_dicen: string;
};

export type Saludo = {
  id: string;
  nombre: string;
  vinculo: string;
  entregado: boolean;
  created_at: string;
};

export default async function TableroSaludos() {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar");
  }

  const admin = crearClienteServidor();

  const { data: familia, error: errorFamilia } = await admin
    .from("familias")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (errorFamilia) {
    console.error("tablero/saludos: fallo la busqueda de familia", errorFamilia);
    return <EstadoError />;
  }

  if (!familia) {
    redirect("/registro");
  }

  const { data: narradores, error: errorNarradores } = await admin
    .from("narradores")
    .select("id, como_le_dicen")
    .eq("familia_id", (familia as { id: string }).id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (errorNarradores) {
    console.error("tablero/saludos: fallo la busqueda de narradores", errorNarradores);
    return <EstadoError />;
  }

  const narrador = (narradores as Narrador[] | null)?.[0];

  if (!narrador) {
    redirect("/registro");
  }

  const { data: saludos, error: errorSaludos } = await admin
    .from("saludos")
    .select("id, nombre, vinculo, entregado, created_at")
    .eq("narrador_id", narrador.id)
    .order("created_at", { ascending: false });

  if (errorSaludos) {
    console.error("tablero/saludos: fallo la busqueda de saludos", errorSaludos);
    return <EstadoError />;
  }

  const urlBase = process.env.URL_BASE || "http://localhost:3000";
  const token = firmarTokenSaludo(narrador.id);
  const enlace = `${urlBase}/saludo/${token}`;

  return (
    <div className="flex flex-1 flex-col items-center bg-white px-6 py-16 text-zinc-900">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Saludos para {narrador.como_le_dicen}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Comparte este link con la familia y amigos para que le graben un mensaje. Se lo
          entregamos junto con el libro.
        </p>

        <div className="mt-6">
          <EnlaceCompartir enlace={enlace} comoLeDicen={narrador.como_le_dicen} />
        </div>

        <div className="mt-10">
          <h2 className="text-sm font-medium tracking-wide text-zinc-400 uppercase">
            Saludos recibidos
          </h2>
          <div className="mt-4">
            <ListaSaludos saludos={(saludos as Saludo[] | null) ?? []} />
          </div>
        </div>
      </div>
    </div>
  );
}

function EstadoError() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-16 text-center text-zinc-900">
      <p className="text-sm text-zinc-600">{MENSAJE_ERROR_CARGA}</p>
    </div>
  );
}
