"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TratoComprador } from "@/lib/regalo-textos";
import { tieneAudio, type CapituloConFrases } from "@/lib/frases";
import { ReproductorRespuesta } from "../../reproductor";

// Las frases de «Su voz» cuando el libro es para otra persona (Naza, 05/11). Las eligió el biógrafo y no se cambian. Con
// el libro ya leído, quien regala hace una de dos cosas: lo manda a imprimir, o avisa de un error de datos, que frena la
// imprenta hasta que los socios lo corrijan a mano. El servidor es quien lo hace cumplir (api/frases).

const boton = "inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-medium transition-colors [font-family:var(--fuente-micro)] disabled:opacity-50";

export function FrasesElegidas({
  narradorId, nombre, capitulos, confirmadoAt, frenada, cortando, puedeConfirmar, linkPublico, trato = "vos",
}: {
  narradorId: string; nombre: string; capitulos: CapituloConFrases[]; confirmadoAt: string | null; frenada: boolean;
  cortando: boolean; puedeConfirmar: boolean; linkPublico: string | null; trato?: TratoComprador;
}) {
  const tu = trato === "tu";
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [preguntaConfirmar, setPreguntaConfirmar] = useState(false);
  const [abrirError, setAbrirError] = useState(false);
  const [detalle, setDetalle] = useState("");
  const noPudimos = tu ? "No pudimos guardarlo. Inténtalo de nuevo." : "No pudimos guardarlo. Intentá de nuevo.";

  async function enviar(cuerpo: Record<string, unknown>, listo: string) {
    setOcupado(true);
    setError(null);
    try {
      const r = await fetch(`/api/frases?narrador=${encodeURIComponent(narradorId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(j.error ?? noPudimos);
      setAviso(listo);
      setPreguntaConfirmar(false);
      setAbrirError(false);
      setDetalle("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : noPudimos);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <p className="max-w-prose text-[15px] leading-relaxed text-[var(--texto-suave)]">
        {`Estas son las frases que eligió el biógrafo, tal como las dijo ${nombre}. Van impresas en el libro, cada una con su código para escucharla.`}
      </p>

      {capitulos.map((c) => (
        <section key={c.numero} aria-labelledby={`cap-${c.numero}`}>
          <h2 id={`cap-${c.numero}`} className="border-b border-[var(--texto)] pb-3 text-xl font-medium leading-none [font-family:var(--fuente-titulo)]">{c.capitulo}</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {c.candidatas.map((f) => (
              <li key={f.id} className="rounded-xl border border-[var(--linea)] p-4 sm:p-5">
                <p className="text-[17px] leading-snug [font-family:var(--fuente-titulo)]">«{f.texto}»</p>
                {tieneAudio(f) ? (
                  <div className="mt-3">
                    <ReproductorRespuesta src={`/api/frases/audio/${f.id}?narrador=${narradorId}`} duracion={f.segundos} etiqueta={`la frase «${f.texto.slice(0, 40)}»`} />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {puedeConfirmar ? (
        <div className="flex flex-col gap-3 rounded-xl border border-[var(--linea-fuerte)] p-5">
          {frenada ? (
            <p className="text-[15px] leading-relaxed text-[var(--texto-suave)]">Recibimos tu aviso y frenamos la impresión. Te escribimos cuando esté corregido.</p>
          ) : (
            <>
              <p className="text-[15px] leading-relaxed text-[var(--texto-suave)]">
                {confirmadoAt
                  ? `Lo confirmaste el ${new Date(confirmadoAt).toLocaleDateString("es-AR")}. Ya puede entrar a imprenta.`
                  : cortando
                    ? "Estamos recortando los audios. Cuando terminemos vas a poder mandarlo a imprimir."
                    : tu ? "Cuando hayas leído el libro, confirma para mandarlo a imprimir." : "Cuando hayas leído el libro, confirmá para mandarlo a imprimir."}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {!confirmadoAt ? (
                  <button type="button" className={`${boton} bg-[var(--texto)] text-[var(--fondo)]`} disabled={ocupado || cortando} onClick={() => setPreguntaConfirmar(true)}>
                    Está bien, mandar a imprimir
                  </button>
                ) : null}
                <button type="button" className={`${boton} border border-[var(--linea-fuerte)]`} disabled={ocupado} onClick={() => setAbrirError((v) => !v)}>
                  {tu ? "Hay un error, avísanos" : "Hay un error, avisanos"}
                </button>
              </div>
            </>
          )}
          {preguntaConfirmar ? (
            <div role="group" aria-label="Confirmar" className="flex flex-col gap-3 border-t border-[var(--linea)] pt-4">
              <p className="text-[15px] leading-relaxed">Se imprime en papel y de ahí no tiene vuelta. ¿Lo mandamos?</p>
              <div className="flex flex-wrap gap-3">
                <button type="button" className={`${boton} bg-[var(--texto)] text-[var(--fondo)]`} disabled={ocupado} onClick={() => enviar({ confirmar: true }, "Listo. Mandamos el libro a imprimir.")}>Sí, mandar a imprimir</button>
                <button type="button" className={`${boton} border border-[var(--linea-fuerte)]`} disabled={ocupado} onClick={() => setPreguntaConfirmar(false)}>{tu ? "Lo reviso una vez más" : "Lo reviso una vez más"}</button>
              </div>
            </div>
          ) : null}
          {abrirError ? (
            <div className="flex flex-col gap-3 border-t border-[var(--linea)] pt-4">
              <label className="flex flex-col gap-2 text-[15px] leading-relaxed">
                {tu ? "Cuéntanos qué está mal. Es para errores de datos, como un nombre o una fecha. No sirve para sacar historias." : "Contanos qué está mal. Es para errores de datos, como un nombre o una fecha. No sirve para sacar historias."}
                <textarea value={detalle} onChange={(e) => setDetalle(e.target.value)} rows={4} maxLength={2000} className="w-full rounded-lg border border-[var(--linea-fuerte)] bg-[var(--fondo)] px-4 py-3 text-[16px] outline-none focus:border-[var(--texto)]" />
              </label>
              <button type="button" className={`${boton} self-start bg-[var(--texto)] text-[var(--fondo)]`} disabled={ocupado || detalle.trim().length < 5} onClick={() => enviar({ error: detalle }, "Recibimos tu aviso y frenamos la impresión.")}>
                {tu ? "Avisar y frenar la impresión" : "Avisar y frenar la impresión"}
              </button>
            </div>
          ) : null}
          {error ? <p className="text-sm text-[var(--alerta)]">{error}</p> : null}
          {aviso ? <p className="text-sm text-[var(--texto-suave)]">{aviso}</p> : null}
        </div>
      ) : null}

      {linkPublico ? (
        <div className="rounded-xl border border-[var(--linea)] p-5">
          <p className="text-[14px] leading-relaxed text-[var(--texto-suave)]">
            Este link abre el libro y estas frases, sin cuenta. Es lo mismo que abre el código impreso en el libro.
          </p>
          <code className="mt-3 block max-w-full truncate rounded bg-[var(--bruma)] px-3 py-2 text-[12px]">{linkPublico}</code>
        </div>
      ) : null}
    </div>
  );
}
