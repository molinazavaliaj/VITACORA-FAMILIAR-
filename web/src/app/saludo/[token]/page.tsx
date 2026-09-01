import { crearClienteServidor } from "@/lib/supabase/servidor";
import { verificarTokenSaludo } from "@/lib/token-saludo";
import { FormularioSaludo } from "./formulario";

export default async function PaginaSaludo({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const datosToken = verificarTokenSaludo(token);
  if (!datosToken) {
    return <EstadoInvalido />;
  }

  const admin = crearClienteServidor();
  const { data: narrador, error } = await admin
    .from("narradores")
    .select("id, como_le_dicen")
    .eq("id", datosToken.narradorId)
    .maybeSingle();

  if (error) {
    console.error("saludo/[token]: fallo la busqueda de narrador", error);
    return <EstadoInvalido />;
  }

  const datosNarrador = narrador as { id: string; como_le_dicen: string } | null;

  if (!datosNarrador) {
    return <EstadoInvalido />;
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-white px-6 py-16 text-zinc-900">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Grábale un mensaje a {datosNarrador.como_le_dicen}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Un saludo tuyo, con tu voz. Se lo entregamos junto con el libro de su vida.
        </p>

        <div className="mt-8">
          <FormularioSaludo token={token} />
        </div>
      </div>
    </div>
  );
}

function EstadoInvalido() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-16 text-center text-zinc-900">
      <p className="text-sm text-zinc-600">
        Este link ya no es válido. Pídele a quien te lo compartió que te mande uno nuevo.
      </p>
    </div>
  );
}
