"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// El botón Compartir de una historia (docs/panel-usuario.md §8). Un botón,
// dos comportamientos: con el libro abierto invita (hasta 3); con el libro
// cerrado da el link público para los primos (próximo paso).

export type InvitadoVista = { id: string; email: string; aceptado_at: string | null };

const MAXIMO = 3;
const boton = "inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-medium transition-colors [font-family:var(--fuente-micro)] disabled:opacity-50";

export function Compartir({ narradorId, nombre, cerrado, invitados }: { narradorId: string; nombre: string; cerrado: boolean; invitados: InvitadoVista[] }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [email, setEmail] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function invitar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setError(null);
    setAviso(null);
    try {
      const r = await fetch(`/api/invitados?narrador=${encodeURIComponent(narradorId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(j.error ?? "No pudimos mandar la invitación.");
      setAviso(`Listo: le mandamos la invitación a ${email}.`);
      setEmail("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos mandar la invitación.");
    } finally {
      setOcupado(false);
    }
  }

  async function sacar(id: string, correo: string) {
    if (!confirm(`¿Sacar a ${correo} de esta historia?`)) return;
    setOcupado(true);
    setError(null);
    const r = await fetch(`/api/invitados/${id}`, { method: "DELETE" });
    if (!r.ok) {
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? "No pudimos sacar la invitación.");
    }
    setOcupado(false);
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className={`${boton} border border-[var(--linea-fuerte)] text-[var(--texto)] hover:bg-[var(--bruma)]`}
      >
        Compartir{!cerrado && invitados.length > 0 ? ` · ${invitados.length}` : ""}
      </button>

      {abierto ? (
        <div className="absolute right-0 z-20 mt-2 w-[min(92vw,26rem)] rounded-xl border border-[var(--linea)] bg-[var(--fondo)] p-5 shadow-lg">
          {cerrado ? (
            <>
              <p className="text-[15px] leading-relaxed text-[var(--texto-suave)]">
                El libro de {nombre} está cerrado. Pronto vas a tener acá un link para que
                los primos lo vean y pidan su copia impresa, sin que tengas que hacer nada más.
              </p>
            </>
          ) : (
            <>
              <p className="text-[15px] leading-relaxed text-[var(--texto-suave)]">
                Invitá hasta {MAXIMO} personas. Van a poder escuchar lo que cuenta, leer sus
                páginas, sumar preguntas y fotos. No pueden cambiar el guion ni descargar el libro.
              </p>

              {invitados.length > 0 ? (
                <ul className="mt-4 flex flex-col gap-2">
                  {invitados.map((i) => (
                    <li key={i.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate">
                        {i.email}
                        <span className="ml-2 text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.16em]">
                          {i.aceptado_at ? "entró" : "invitado"}
                        </span>
                      </span>
                      <button type="button" disabled={ocupado} onClick={() => sacar(i.id, i.email)} className="shrink-0 text-xs text-[var(--texto-menor)] underline underline-offset-4 hover:text-red-700 [font-family:var(--fuente-micro)]">
                        Sacar
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              {invitados.length < MAXIMO ? (
                <form onSubmit={invitar} className="mt-4 flex flex-col gap-3">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@de-alguien.com"
                    className="w-full rounded-lg border border-[var(--linea-fuerte)] bg-[var(--fondo)] px-4 py-2.5 text-[15px] outline-none focus:border-[var(--texto)]"
                  />
                  <button type="submit" disabled={ocupado || !email} className={`${boton} bg-[var(--acento)] text-white hover:opacity-90`}>
                    {ocupado ? "Enviando…" : "Invitar"}
                  </button>
                </form>
              ) : (
                <p className="mt-4 text-sm text-[var(--texto-menor)]">Ya invitaste a {MAXIMO} personas, el máximo por historia.</p>
              )}
            </>
          )}
          {aviso ? <p className="mt-3 text-sm text-[var(--texto-suave)]">{aviso}</p> : null}
          {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
