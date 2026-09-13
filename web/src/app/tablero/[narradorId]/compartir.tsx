"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// El botón Compartir de una historia (docs/panel-usuario.md §8). Un botón,
// dos comportamientos: con el libro abierto invita (hasta 3); con el libro
// cerrado da el link público para los primos (próximo paso).

export type InvitadoVista = { id: string; email: string; aceptado_at: string | null };

const MAXIMO = 3;
const boton = "inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-medium transition-colors [font-family:var(--fuente-micro)] disabled:opacity-50";

export function Compartir({ narradorId, nombre, cerrado, aprobado, linkPublico, invitados }: { narradorId: string; nombre: string; cerrado: boolean; aprobado: boolean; linkPublico: string | null; invitados: InvitadoVista[] }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [email, setEmail] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    if (!linkPublico) return;
    try {
      await navigator.clipboard.writeText(linkPublico);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setError("No pudimos copiar. Seleccioná el link y copialo a mano.");
    }
  }

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
        className={`${boton} border border-[var(--linea-fuerte)] text-[var(--texto)] hover:bg-[var(--hueco)]`}
      >
        Compartir{!cerrado && invitados.length > 0 ? ` · ${invitados.length}` : ""}
      </button>

      {abierto ? (
        <div className="absolute right-0 z-20 mt-2 w-[min(92vw,26rem)] rounded-xl border border-[var(--linea)] bg-[var(--fondo)] p-5 shadow-lg">
          {aprobado && linkPublico ? (
            <>
              <p className="text-[15px] leading-relaxed text-[var(--texto-suave)]">
                El libro de {nombre} está cerrado. Mandale este link a quien quieras: ve una
                muestra (la tapa, los capítulos, cómo empieza y un minuto de su voz) y puede
                pedir su copia impresa o guardarlo en su cuenta. Vos no tenés que hacer nada más.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <input readOnly value={linkPublico} onFocus={(e) => e.currentTarget.select()} className="w-full rounded-lg border border-[var(--linea)] bg-[var(--relieve)] px-3 py-2 text-[13px] text-[var(--texto-suave)] [font-family:var(--fuente-micro)]" />
                <button type="button" onClick={copiar} className={`${boton} bg-[var(--acento)] text-[var(--sobre-acento)] hover:opacity-90`}>
                  {copiado ? "Copiado ✓" : "Copiar el link"}
                </button>
              </div>
            </>
          ) : cerrado ? (
            <p className="text-[15px] leading-relaxed text-[var(--texto-suave)]">
              {nombre} terminó de contar. Cuando cierres el libro, acá va a aparecer el link
              para compartirlo con la familia.
            </p>
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
                      <button type="button" disabled={ocupado} onClick={() => sacar(i.id, i.email)} className="shrink-0 text-xs text-[var(--texto-menor)] underline underline-offset-4 hover:text-[var(--alerta)] [font-family:var(--fuente-micro)]">
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
                  <button type="submit" disabled={ocupado || !email} className={`${boton} bg-[var(--acento)] text-[var(--sobre-acento)] hover:opacity-90`}>
                    {ocupado ? "Enviando…" : "Invitar"}
                  </button>
                </form>
              ) : (
                <p className="mt-4 text-sm text-[var(--texto-menor)]">Ya invitaste a {MAXIMO} personas, el máximo por historia.</p>
              )}
            </>
          )}
          {aviso ? <p className="mt-3 text-sm text-[var(--texto-suave)]">{aviso}</p> : null}
          {error ? <p className="mt-3 text-sm text-[var(--alerta)]">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
