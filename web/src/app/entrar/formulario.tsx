"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/navegador";
import { normalizarCodigo, esCodigoCompleto } from "@/lib/codigo-otp";

// Entrada por código de 6 dígitos (OTP), en dos pasos: correo → código.
// Reemplaza al enlace mágico, que exigía abrirse en el mismo navegador donde
// se pidió — con el código, la familia lo teclea donde sea y no hay fricción.
export default function FormularioEntrar() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [paso, setPaso] = useState<"correo" | "codigo">("correo");
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pedirCodigo(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setTrabajando(true);

    const supabase = crearClienteNavegador();
    const { error: errorEnvio } = await supabase.auth.signInWithOtp({ email });

    setTrabajando(false);

    if (errorEnvio) {
      setError("No pudimos enviar el código. Prueba de nuevo en un momento.");
      return;
    }

    setCodigo("");
    setPaso("codigo");
  }

  async function verificarCodigo(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setTrabajando(true);

    const supabase = crearClienteNavegador();
    const { error: errorVerificacion } = await supabase.auth.verifyOtp({
      email,
      token: normalizarCodigo(codigo),
      type: "email",
    });

    if (errorVerificacion) {
      setTrabajando(false);
      setError("El código no es correcto o ya venció. Revísalo o pide uno nuevo.");
      return;
    }

    router.push("/tablero");
    router.refresh();
  }

  function pedirOtroCodigo() {
    setError(null);
    setCodigo("");
    setPaso("correo");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-24 text-zinc-900">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">Entra</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Te mandamos un código de 6 números a tu correo. Sin contraseñas.
        </p>

        {paso === "correo" ? (
          <form onSubmit={pedirCodigo} className="mt-8 flex flex-col gap-3">
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
              disabled={trabajando}
              className="h-12 rounded-full bg-zinc-900 text-base font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
            >
              {trabajando ? "Enviando..." : "Enviarme el código"}
            </button>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </form>
        ) : (
          <form onSubmit={verificarCodigo} className="mt-8 flex flex-col gap-3">
            <p className="text-sm text-zinc-700">
              Te enviamos un código a <strong>{email}</strong>. Escríbelo aquí:
            </p>
            <input
              type="text"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              value={codigo}
              onChange={(evento) => setCodigo(evento.target.value)}
              placeholder="123456"
              className="h-14 rounded-lg border border-zinc-300 px-4 text-center text-2xl tracking-[0.4em] text-zinc-900 outline-none focus:border-zinc-900"
            />
            <button
              type="submit"
              disabled={trabajando || !esCodigoCompleto(codigo)}
              className="h-12 rounded-full bg-zinc-900 text-base font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
            >
              {trabajando ? "Entrando..." : "Entrar"}
            </button>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button
              type="button"
              onClick={pedirOtroCodigo}
              className="text-sm text-zinc-500 hover:text-zinc-700"
            >
              Pedir otro código
            </button>
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
