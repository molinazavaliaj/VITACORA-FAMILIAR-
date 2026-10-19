"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/navegador";
import { normalizarCodigo, esCodigoCompleto } from "@/lib/codigo-otp";
import { destinoSeguro } from "@/lib/destino";
import type { TratoComprador } from "@/lib/regalo-textos";
import { textosEntrar } from "../_textos/entrar";

// Entrada por código de 6 dígitos (OTP), en dos pasos: correo → código.
// Reemplaza al enlace mágico, que exigía abrirse en el mismo navegador donde
// se pidió — con el código, la familia lo teclea donde sea y no hay fricción.
// La vuelta (`?volver=`) la decide `destinoSeguro` (lib/destino): el mismo
// criterio que usa el proxy para mandar acá, y lo que hace que entrar a /admin
// devuelva al panel en vez de dejarte en el carrito (T3.7).

export default function FormularioEntrar({ trato = "vos" }: { trato?: TratoComprador }) {
  const t = textosEntrar(trato);
  const router = useRouter();
  const destino = destinoSeguro(useSearchParams().get("volver"));
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [paso, setPaso] = useState<"correo" | "codigo">("correo");
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reenviado, setReenviado] = useState(false);

  async function pedirCodigo(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setTrabajando(true);

    const supabase = crearClienteNavegador();
    const { error: errorEnvio } = await supabase.auth.signInWithOtp({ email });

    setTrabajando(false);

    if (errorEnvio) {
      setError(t.errorEnvio);
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
      setError(t.errorCodigo);
      return;
    }

    router.push(destino);
    router.refresh();
  }

  // Un código vencido se arregla con otro al mismo correo, sin volver a
  // escribirlo (maqueta `Casos` 5, fase 3). Para cambiar de correo, «Usar
  // otro correo» vuelve al primer paso como antes.
  async function pedirOtroCodigo() {
    setError(null);
    setReenviado(false);
    setCodigo("");
    setTrabajando(true);
    const { error: errorEnvio } = await crearClienteNavegador().auth.signInWithOtp({ email });
    setTrabajando(false);
    if (errorEnvio) {
      setError(t.errorEnvio);
      return;
    }
    setReenviado(true);
  }

  function usarOtroCorreo() {
    setError(null);
    setReenviado(false);
    setCodigo("");
    setPaso("correo");
  }

  // Rediseño 2026-10 (maquetas `Entrar` y `EntrarMovil`): la columna de la
  // derecha, en tinta y papel. La foto de Osvaldo la pone la página (page.tsx).
  return (
    <div className="ent-form">
      <p className="ent-etiqueta">{t.etiqueta}</p>
      <h1 className="ent-titulo">{t.titulo}</h1>
      <p className="ent-bajada">{t.bajada}</p>

      {paso === "correo" ? (
        <form onSubmit={pedirCodigo} className="ent-paso mt-8 flex flex-col gap-3">
          <label htmlFor="ent-correo" className="ent-rotulo">
            {t.correoEtiqueta}
          </label>
          <input
            id="ent-correo"
            type="email"
            required
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            placeholder={t.correoPista}
            autoComplete="email"
            className="ent-campo"
          />
          <button type="submit" disabled={trabajando} className="dir-boton dir-boton--lleno ent-boton">
            {trabajando ? t.enviando : t.enviar}
          </button>
          {error ? <p role="alert" className="ent-error">{error}</p> : null}
        </form>
      ) : (
        <form key="codigo" onSubmit={verificarCodigo} className="ent-paso mt-8 flex flex-col gap-3">
          <p className="ent-rotulo">
            {t.codigoEnviado} <strong className="font-medium text-[var(--dir-sobre-tinta)]">{email}</strong>. {t.escribiloAca}
          </p>
          <input
            type="text"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label={t.entrar}
            value={codigo}
            onChange={(evento) => setCodigo(evento.target.value)}
            placeholder="123456"
            className="ent-campo ent-campo--codigo"
          />
          <button type="submit" disabled={trabajando || !esCodigoCompleto(codigo)} className="dir-boton dir-boton--lleno ent-boton">
            {trabajando ? t.entrando : t.entrar}
          </button>
          {error ? <p role="alert" className="ent-error">{error}</p> : null}
          {reenviado && !error ? (
            <p role="status" className="ent-rotulo">
              {t.otroEnviado} <strong className="font-medium text-[var(--dir-sobre-tinta)]">{email}</strong>.
            </p>
          ) : null}
          <div className="mt-1 flex flex-wrap gap-x-6">
            <button type="button" onClick={pedirOtroCodigo} disabled={trabajando} className="ent-enlace">
              {t.pedirOtro}
            </button>
            <button type="button" onClick={usarOtroCorreo} className="ent-enlace">
              {t.otroCorreo}
            </button>
          </div>
        </form>
      )}

      <aside className="ent-nota">
        <p className="ent-nota-titulo">{t.notaTitulo}</p>
        <p className="ent-nota-texto">{t.notaTexto}</p>
      </aside>
    </div>
  );
}
