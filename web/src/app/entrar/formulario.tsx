"use client";

import { useState } from "react";
import Link from "next/link";
import { crearClienteNavegador } from "@/lib/supabase/navegador";

export default function FormularioEntrar({ urlBase }: { urlBase: string }) {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarEnvio(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);

    const supabase = crearClienteNavegador();
    const { error: errorEnvio } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${urlBase}/api/auth/callback`,
      },
    });

    setEnviando(false);

    if (errorEnvio) {
      setError("No pudimos enviar el enlace. Prueba de nuevo en un momento.");
      return;
    }

    setEnviado(true);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-24 text-zinc-900">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">Entra</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Te mandamos un enlace mágico a tu correo. Sin contraseñas.
        </p>

        {enviado ? (
          <p className="mt-8 rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
            Revisa tu correo. Te enviamos un enlace para entrar.
          </p>
        ) : (
          <form onSubmit={manejarEnvio} className="mt-8 flex flex-col gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              placeholder="tu@correo.com"
              autoComplete="email"
              className="h-12 rounded-lg border border-zinc-300 px-4 text-base text-zinc-900 outline-none focus:border-zinc-900"
            />
            <button
              type="submit"
              disabled={enviando}
              className="h-12 rounded-full bg-zinc-900 text-base font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
            >
              {enviando ? "Enviando..." : "Enviarme el enlace"}
            </button>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </form>
        )}

        <Link
          href="/"
          className="mt-8 inline-block text-sm text-zinc-500 hover:text-zinc-700"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
