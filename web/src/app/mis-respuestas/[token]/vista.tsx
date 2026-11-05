import type { BloqueHistoriaV3 } from "@/lib/v3";
import { textosFueraDelLibro, type IdiomaFueraDelLibro } from "@/lib/fuera-del-libro-textos";
import { ReproductorRespuesta } from "../../tablero/reproductor";
import { SacarDelLibro } from "../../tablero/[narradorId]/fuera-del-libro";
import { Toroide } from "../../marca";

// Lo que ve el narrador en su link: sin consultas, para poder probarla y mostrarla sola.

export type Idioma = "es-AR" | "es-ES" | "ca";
const IDIOMA_FUERA: Record<Idioma, IdiomaFueraDelLibro> = { "es-AR": "ar", "es-ES": "es", ca: "ca" };
export const LOCALE: Record<Idioma, string> = { "es-AR": "es-AR", "es-ES": "es-ES", ca: "ca" };

export const TEXTOS: Record<Idioma, {
  titulo: string; abierto: string; hasta: (fecha: string) => string; cerrado: string; nada: string;
  vencidoTitulo: string; vencido: string; invalidoTitulo: string; invalido: string; sinTexto: string; reservada: string;
}> = {
  "es-AR": {
    titulo: "Lo que contaste",
    abierto: "Solo lo ves vos. Si algo no querés que vaya al libro, tocá el botón que está debajo.",
    hasta: (f) => `Podés sacar lo que quieras hasta el ${f}.`,
    cerrado: "Ya no se puede sacar nada, porque tu libro se está escribiendo. Lo podés seguir escuchando mientras dure este link.",
    nada: "Todavía no hay nada acá. Cuando contestes la primera pregunta, va a aparecer.",
    vencidoTitulo: "Este link ya venció",
    vencido: "Dura 7 días. Escribime mis respuestas por WhatsApp y te mando uno nuevo.",
    invalidoTitulo: "Este link no sirve",
    invalido: "Escribime mis respuestas por WhatsApp y te mando uno nuevo.",
    sinTexto: "Estamos transcribiendo el audio.",
    reservada: "Pediste que esto no vaya al libro.",
  },
  "es-ES": {
    titulo: "Lo que has contado",
    abierto: "Solo lo ves tú. Si hay algo que no quieres que vaya al libro, toca el botón que está debajo.",
    hasta: (f) => `Puedes quitar lo que quieras hasta el ${f}.`,
    cerrado: "Ya no se puede quitar nada, porque tu libro se está escribiendo. Lo puedes seguir escuchando mientras dure este enlace.",
    nada: "Todavía no hay nada aquí. Cuando contestes la primera pregunta, aparecerá.",
    vencidoTitulo: "Este enlace ya ha caducado",
    vencido: "Dura 7 días. Escríbeme mis respuestas por WhatsApp y te envío uno nuevo.",
    invalidoTitulo: "Este enlace no sirve",
    invalido: "Escríbeme mis respuestas por WhatsApp y te envío uno nuevo.",
    sinTexto: "Estamos transcribiendo el audio.",
    reservada: "Pediste que esto no vaya al libro.",
  },
  ca: {
    titulo: "El que has explicat",
    abierto: "Només ho veus tu. Si hi ha alguna cosa que no vols que vagi al llibre, toca el botó que hi ha a sota.",
    hasta: (f) => `Pots treure el que vulguis fins al ${f}.`,
    cerrado: "Ja no es pot treure res, perquè el teu llibre s'està escrivint. Ho pots continuar escoltant mentre duri aquest enllaç.",
    nada: "Encara no hi ha res aquí. Quan contestis la primera pregunta, apareixerà.",
    vencidoTitulo: "Aquest enllaç ja ha caducat",
    vencido: "Dura 7 dies. Escriu-me les meves respostes per WhatsApp i te n'envio un de nou.",
    invalidoTitulo: "Aquest enllaç no serveix",
    invalido: "Escriu-me les meves respostes per WhatsApp i te n'envio un de nou.",
    sinTexto: "Estem transcrivint l'àudio.",
    reservada: "Vas demanar que això no vagi al llibre.",
  },
};

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-[var(--fondo)] text-[var(--texto)] [font-family:var(--fuente-cuerpo)]">
      <header className="oscuro flex items-center gap-3 bg-[var(--fondo)] px-6 py-5 text-[var(--texto)]">
        <Toroide className="h-8 w-8" />
        <span className="text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">Vitácora Familiar</span>
      </header>
      <main className="mx-auto w-full max-w-2xl px-6 py-10">{children}</main>
    </div>
  );
}

export function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <Marco>
      <h1 className="text-3xl leading-tight font-medium [font-family:var(--fuente-titulo)]">{titulo}</h1>
      <p className="mt-4 text-[17px] leading-relaxed text-[var(--texto-suave)]">{texto}</p>
    </Marco>
  );
}

export function VistaRespuestas({ idioma, bloques, puede, hasta, token, narradorId }: { idioma: Idioma; bloques: BloqueHistoriaV3[]; puede: boolean; hasta: string | null; token: string; narradorId: string }) {
  const T = TEXTOS[idioma];
  const trato = idioma === "es-AR" ? "vos" : "tu";
  return (
    <Marco>
      <h1 className="text-3xl leading-tight font-medium [font-family:var(--fuente-titulo)]">{T.titulo}</h1>
      <p className="mt-4 text-[17px] leading-relaxed text-[var(--texto-suave)]">{puede ? T.abierto : T.cerrado}</p>
      {hasta ? <p className="mt-2 text-[17px] font-medium leading-relaxed">{T.hasta(hasta)}</p> : null}

      <div className="mt-10 flex flex-col gap-10">
        {bloques.length === 0 ? <p className="text-[15px] text-[var(--texto-suave)]">{T.nada}</p> : null}
        {bloques.map((b, i) => (
          <section key={`${b.nombre ?? "antes"}-${i}`} className="flex flex-col gap-4">
            {b.nombre ? <h2 className="border-b border-[var(--texto)] pb-3 text-2xl font-medium leading-none [font-family:var(--fuente-titulo)]">{b.nombre}</h2> : null}
            {b.preguntas.filter((p) => p.respuestas.length > 0 || p.reservada).map((p) => (
              <article key={p.clave} className="flex flex-col gap-3 rounded-xl border border-[var(--linea)] p-4 sm:p-5">
                <h3 className="text-[16.5px] font-medium leading-[1.4] [font-family:var(--fuente-titulo)]">{p.pregunta}</h3>
                {p.reservada ? <p className="text-sm text-[var(--texto-menor)]">{T.reservada}</p> : null}
                {p.respuestas.map((r, j) => (
                  <div key={r.id} className={`flex flex-col gap-2 ${j > 0 ? "border-t border-[var(--linea)] pt-3" : ""}`}>
                    <p className={`text-[15.5px] leading-[1.7] font-light ${r.fuera ? "text-[var(--texto-menor)] opacity-70" : "text-[var(--texto-suave)]"}`}>{r.texto || T.sinTexto}</p>
                    {r.audio ? <ReproductorRespuesta src={`/api/mis-respuestas/${token}/audio/${r.id}`} duracion={r.duracion} etiqueta={p.pregunta.slice(0, 60)} /> : null}
                    {puede ? (
                      <SacarDelLibro narradorId={narradorId} respuestaId={r.id} fuera={r.fuera === true} propia trato={trato} puedeVolverAPreguntar={false} endpoint={`/api/mis-respuestas/${token}/fuera`} idioma={IDIOMA_FUERA[idioma]} />
                    ) : r.fuera ? (
                      <span className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.18em]">{textosFueraDelLibro(IDIOMA_FUERA[idioma]).marca}</span>
                    ) : null}
                  </div>
                ))}
              </article>
            ))}
          </section>
        ))}
      </div>
    </Marco>
  );
}
